import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, Wallet, GameGroup, GameGroupTier } from '@/lib/models';
import mongoose from 'mongoose';

// Generate a unique 6-character unlock code
function generateUnlockCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function POST(request: NextRequest) {
    try {
        console.log('=== Join Game Request Started ===');

        const authSession = await getServerSession(authOptions);

        if (!authSession?.user?.id) {
            console.log('ERROR: Unauthorized - no session');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { tier } = await request.json();
        console.log('User:', authSession.user.id, 'Tier:', tier);

        // Validate tier
        const validTiers: GameGroupTier[] = [1000, 2000, 4000, 10000, 20000, 40000];
        if (!validTiers.includes(tier)) {
            console.log('ERROR: Invalid tier');
            return NextResponse.json(
                { error: 'Invalid game tier' },
                { status: 400 }
            );
        }

        await dbConnect();

        const userId = authSession.user.id;

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            console.log('ERROR: User not found');
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get or create wallet
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            console.log('Creating wallet for user:', userId);
            wallet = await Wallet.create({
                userId: userId,
                balance: 0,
                transactions: [],
            });
        }

        console.log('User balance:', wallet.balance);

        // Check balance
        if (wallet.balance < tier) {
            console.log('ERROR: Insufficient balance', wallet.balance, '<', tier);
            return NextResponse.json(
                { error: `Insufficient balance. You need ${tier.toLocaleString()} BLM to join this game. You have ${wallet.balance.toLocaleString()} BLM.` },
                { status: 400 }
            );
        }

        // Check if user is already in an active game of this tier
        const existingGame = await GameGroup.findOne({
            tier,
            status: { $in: ['waiting', 'countdown', 'spinning'] },
            'participants.userId': userId,
        });

        if (existingGame) {
            console.log('ERROR: User already in game');
            return NextResponse.json(
                { error: 'You are already in an active game for this tier' },
                { status: 400 }
            );
        }

        // Generate unique unlock code
        const unlockCode = generateUnlockCode();
        console.log('Generated unlock code:', unlockCode);

        // Find an available game group or create new one
        let gameGroup = await GameGroup.findOne({
            tier,
            status: { $in: ['waiting', 'countdown'] },
            'participants.9': { $exists: false }, // Less than 10 participants (max)
        });

        if (!gameGroup) {
            console.log('Creating new game group for tier:', tier);
            gameGroup = new GameGroup({
                tier,
                participants: [],
                status: 'waiting',
                totalPool: 0,
            });
            await gameGroup.save();
        }

        const gameId = gameGroup._id;

        // Create the participant object - ensure userId is proper ObjectId
        const participantData = {
            userId: new mongoose.Types.ObjectId(user._id.toString()),
            fullName: user.fullName || 'Player',
            unlockCode,
            joinedAt: new Date(),
        };

        console.log('Participant data:', JSON.stringify(participantData));

        // Use findOneAndUpdate to atomically add participant and check count
        const updatedGame = await GameGroup.findOneAndUpdate(
            {
                _id: gameId,
                status: { $in: ['waiting', 'countdown'] },
                'participants.9': { $exists: false }, // Still less than 10 participants (max)
            },
            {
                $push: { participants: participantData },
                $inc: { totalPool: tier },
            },
            { new: true }
        );

        if (!updatedGame) {
            console.log('ERROR: Could not join game - might be full or status changed');
            return NextResponse.json(
                { error: 'Game is no longer available. Please try another game.' },
                { status: 400 }
            );
        }

        console.log('Added participant to game. Count:', updatedGame.participants.length);

        // Now that we've successfully joined, deduct from wallet
        const walletUpdate = await Wallet.findOneAndUpdate(
            {
                _id: wallet._id,
                balance: { $gte: tier } // Double-check balance
            },
            {
                $inc: { balance: -tier },
                $push: {
                    transactions: {
                        type: 'game_entry',
                        amount: tier,
                        reference: `GAME_${gameId}_${unlockCode}`,
                        description: `Joined ${tier.toLocaleString()} BLM game - Unlock Code: ${unlockCode}`,
                        status: 'completed',
                        createdAt: new Date(),
                    },
                },
            },
            { new: true }
        );

        if (!walletUpdate) {
            // Wallet update failed - need to remove from game
            console.log('ERROR: Wallet update failed, removing from game');
            await GameGroup.findByIdAndUpdate(gameId, {
                $pull: { participants: { unlockCode } },
                $inc: { totalPool: -tier },
            });
            return NextResponse.json(
                { error: 'Failed to process payment. Please try again.' },
                { status: 400 }
            );
        }

        console.log('Deducted', tier, 'from wallet. New balance:', walletUpdate.balance);

        // Check if game should start countdown (do this after successful payment)
        // Start countdown when minimum 2 players join, game closes when countdown ends or 10 players join
        if (updatedGame.participants.length >= 2 && updatedGame.status === 'waiting') {
            await GameGroup.findByIdAndUpdate(gameId, {
                status: 'countdown',
                countdownStartedAt: new Date(),
                countdownEndsAt: new Date(Date.now() + 30 * 1000), // 30 seconds
            });
        }

        // If game is full (10 players), close it immediately - BUT we need to trigger spin first/soon
        // Ideally, if 10 players joined, we could shorten countdown or spin immediately.
        // For now, let's just let the countdown finish.
        if (updatedGame.participants.length === 10) {
            // Optional: Shorten countdown to 5 seconds if it's longer than that
            // to start game faster when full
        }

        // Re-fetch game for final state
        const finalGame = await GameGroup.findById(gameId);

        console.log('=== Join Game Success ===');
        console.log('Game ID:', gameId, 'Participants:', finalGame?.participants.length);

        return NextResponse.json({
            message: 'Successfully joined game',
            gameId: gameId.toString(),
            unlockCode,
            participantCount: finalGame?.participants.length || updatedGame.participants.length,
            status: finalGame?.status || updatedGame.status,
            countdownEndsAt: finalGame?.countdownEndsAt,
        });
    } catch (error) {
        console.error('=== Join Game Error ===');
        console.error('Error:', error);
        console.error('Error name:', (error as Error).name);
        console.error('Error message:', (error as Error).message);
        if (error instanceof Error && error.stack) {
            console.error('Stack:', error.stack);
        }
        return NextResponse.json(
            { error: 'An error occurred while joining game' },
            { status: 500 }
        );
    }
}
