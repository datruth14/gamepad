import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { GameGroup, Wallet } from '@/lib/models';

// This should only be called by the Socket.io server or a cron job
// It handles the spinning and winner selection
export async function POST(request: NextRequest) {
    try {
        const { gameId, secret } = await request.json();

        const validSecret = process.env.GAME_SPIN_SECRET || 'blm-game-spin-secret-change-in-production';
        const isAuthorizedSecret = secret === validSecret;

        // Check authentication if secret is invalid
        if (!isAuthorizedSecret) {
            // Uncommenting this would allow players to trigger it, but for now let's just use the correct secret
            // const session = await getServerSession(authOptions);
            // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            // For now, adhere to secret check but log what we received/expected for debugging
            if (secret !== validSecret) {
                console.log('Spin unauthorized. Received:', secret, 'Expected:', validSecret);
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        await dbConnect();

        const gameGroup = await GameGroup.findById(gameId);

        if (!gameGroup) {
            return NextResponse.json(
                { error: 'Game not found' },
                { status: 404 }
            );
        }

        if (gameGroup.status !== 'countdown') {
            return NextResponse.json(
                { error: 'Game is not ready for spin' },
                { status: 400 }
            );
        }

        if (gameGroup.participants.length < 2) {
            return NextResponse.json(
                { error: 'Game needs at least 2 participants' },
                { status: 400 }
            );
        }

        // Update status to spinning
        gameGroup.status = 'spinning';
        await gameGroup.save();

        // Server-side random selection
        const winnerIndex = Math.floor(Math.random() * gameGroup.participants.length);
        const winner = gameGroup.participants[winnerIndex];

        // Calculate payouts
        const totalPool = gameGroup.totalPool;
        const winnerPayout = Math.round(totalPool * 0.8); // 80% to winner
        const systemFee = totalPool - winnerPayout; // 20% to system

        // Generate random spin result (degrees) that lands on winner segment
        // Dynamically calculate segments based on actual player count
        const playerCount = gameGroup.participants.length;
        const segmentSize = 360 / playerCount;
        const baseRotation = 360 * 5; // 5 full rotations for effect
        const winnerSegmentCenter = winnerIndex * segmentSize + segmentSize / 2;
        const spinResult = baseRotation + (360 - winnerSegmentCenter); // Reverse to match wheel direction

        // Update game with winner info
        gameGroup.winnerId = winner.userId;
        gameGroup.winnerUnlockCode = winner.unlockCode;
        gameGroup.winnerPayout = winnerPayout;
        gameGroup.systemFee = systemFee;
        gameGroup.spinResult = spinResult;
        gameGroup.status = 'completed';
        await gameGroup.save();

        // Credit winner's wallet
        await Wallet.findOneAndUpdate(
            { userId: winner.userId },
            {
                $inc: { balance: winnerPayout },
                $push: {
                    transactions: {
                        type: 'game_win',
                        amount: winnerPayout,
                        reference: `WIN_${gameGroup._id}`,
                        description: `Won ${winnerPayout.toLocaleString()} BLM in ${(gameGroup.tier).toLocaleString()} BLM game!`,
                        status: 'completed',
                        createdAt: new Date(),
                    },
                },
            }
        );

        return NextResponse.json({
            success: true,
            gameId: gameGroup._id.toString(),
            winnerId: winner.userId.toString(),
            winnerUnlockCode: winner.unlockCode,
            winnerPayout,
            systemFee,
            spinResult,
            totalPool,
        });
    } catch (error) {
        console.error('Spin game error:', error);
        return NextResponse.json(
            { error: 'An error occurred during spin' },
            { status: 500 }
        );
    }
}
