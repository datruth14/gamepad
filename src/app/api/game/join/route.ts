import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, Wallet, GameGroup, GameGroupTier } from '@/lib/models';
import mongoose from 'mongoose';
import { getRandomBots } from '@/lib/bots';

// Generate a unique 6-character unlock code for the USER
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
        console.log('=== Join Game (With Bots) Request Started ===');

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

        // Check balance
        if (wallet.balance < tier) {
            console.log('ERROR: Insufficient balance', wallet.balance, '<', tier);
            return NextResponse.json(
                { error: `Insufficient balance. You need ${tier.toLocaleString()} GP to join this game. You have ${wallet.balance.toLocaleString()} GP.` },
                { status: 400 }
            );
        }

        // Check if user is already in an active game
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

        // Create a new game group for this user immediately (we don't wait for others)
        const myUnlockCode = generateUnlockCode();

        // Pick a random number of bots (1 to 9, so total players 2-10)
        const botCount = Math.floor(Math.random() * 9) + 1;
        const bots = getRandomBots(botCount);

        const participants = [
            {
                userId: new mongoose.Types.ObjectId(user._id.toString()),
                fullName: user.fullName || 'Player',
                unlockCode: myUnlockCode,
                joinedAt: new Date(),
                isBot: false
            },
            ...bots.map(bot => ({
                userId: bot.userId,
                fullName: bot.fullName,
                unlockCode: bot.unlockCode,
                joinedAt: new Date(),
                isBot: true
            }))
        ];

        const totalPool = tier * participants.length;

        const gameGroup = new GameGroup({
            tier,
            participants,
            status: 'countdown', // Go straight to countdown
            totalPool,
            countdownStartedAt: new Date(),
            countdownEndsAt: new Date(Date.now() + 30 * 1000), // 30 seconds
        });

        await gameGroup.save();
        const gameId = gameGroup._id;

        // Deduct from wallet
        const walletUpdate = await Wallet.findOneAndUpdate(
            {
                _id: wallet._id,
                balance: { $gte: tier }
            },
            {
                $inc: { balance: -tier },
                $push: {
                    transactions: {
                        type: 'game_entry',
                        amount: tier,
                        reference: `GAME_${gameId}_${myUnlockCode}`,
                        description: `Joined ${tier.toLocaleString()} GP game - Unlock Code: ${myUnlockCode}`,
                        status: 'completed',
                        createdAt: new Date(),
                    },
                },
            },
            { new: true }
        );

        if (!walletUpdate) {
            // Rollback game creation if wallet deduction fails
            await GameGroup.findByIdAndDelete(gameId);
            return NextResponse.json(
                { error: 'Failed to process payment. Please try again.' },
                { status: 400 }
            );
        }

        console.log('=== Join Game (With Bots) Success ===');
        console.log('Game ID:', gameId, 'Real User:', user.fullName, 'Bots:', botCount);

        return NextResponse.json({
            message: 'Successfully joined game',
            gameId: gameId.toString(),
            unlockCode: myUnlockCode,
            participantCount: participants.length,
            status: 'countdown',
            countdownEndsAt: gameGroup.countdownEndsAt,
        });
    } catch (error) {
        console.error('=== Join Game Error ===', error);
        return NextResponse.json(
            { error: 'An error occurred while joining game' },
            { status: 500 }
        );
    }
}
