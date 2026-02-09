import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import GameGroup from '@/lib/models/GameGroup';
import Wallet from '@/lib/models/Wallet';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { gameId } = await request.json();

        if (!gameId) {
            return NextResponse.json({ error: 'Game ID required' }, { status: 400 });
        }

        await connectToDatabase();

        const userId = session.user.id;
        console.log('=== Leave Game Request ===');
        console.log('User:', userId, 'Game:', gameId);

        // Find the game
        const gameGroup = await GameGroup.findById(gameId);

        if (!gameGroup) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        // Check if user is in the game
        const participantIndex = gameGroup.participants.findIndex(
            (p: { userId: mongoose.Types.ObjectId }) => p.userId.toString() === userId
        );

        if (participantIndex === -1) {
            return NextResponse.json({ error: 'You are not in this game' }, { status: 400 });
        }

        // Allow leaving during waiting OR countdown
        if (gameGroup.status !== 'waiting' && gameGroup.status !== 'countdown') {
            return NextResponse.json(
                { error: 'Cannot leave game once execution has started' },
                { status: 400 }
            );
        }

        const participant = gameGroup.participants[participantIndex];
        const tier = gameGroup.tier;

        // Remove participant from game
        gameGroup.participants.splice(participantIndex, 1);
        gameGroup.totalPool -= tier;

        // If in countdown and participants drop below 2, stop countdown
        if (gameGroup.status === 'countdown' && gameGroup.participants.length < 2) {
            gameGroup.status = 'waiting';
            gameGroup.countdownStartedAt = undefined;
            gameGroup.countdownEndsAt = undefined;
            console.log('Game dropped below 2 players, stopping countdown');
        }

        await gameGroup.save();

        console.log('Removed participant from game');

        // Refund the entry fee
        const refundResult = await Wallet.findOneAndUpdate(
            { userId: new mongoose.Types.ObjectId(userId) },
            {
                $inc: { balance: tier },
                $push: {
                    transactions: {
                        type: 'refund',
                        amount: tier,
                        reference: `REFUND_${gameId}_${participant.unlockCode}`,
                        description: `Refund for leaving ${tier.toLocaleString()} BLM game`,
                        status: 'completed',
                        createdAt: new Date(),
                    },
                },
            },
            { new: true }
        );

        if (refundResult) {
            console.log('Refunded', tier, 'to wallet. New balance:', refundResult.balance);
        }

        return NextResponse.json({
            success: true,
            message: `Left game successfully. ${tier.toLocaleString()} BLM refunded.`,
            refundedAmount: tier,
        });
    } catch (error) {
        console.error('Error leaving game:', error);
        return NextResponse.json(
            { error: 'Failed to leave game' },
            { status: 500 }
        );
    }
}
