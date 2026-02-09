import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { GameGroup } from '@/lib/models';

export async function GET(
    request: NextRequest,
    { params }: { params: { gameId: string } }
) {
    try {
        const { gameId } = params;

        await dbConnect();

        const gameGroup = await GameGroup.findById(gameId);

        if (!gameGroup) {
            return NextResponse.json(
                { error: 'Game not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            gameId: gameGroup._id.toString(),
            tier: gameGroup.tier,
            status: gameGroup.status,
            participantCount: gameGroup.participants.length,
            participants: gameGroup.participants.map((p) => ({
                unlockCode: p.unlockCode,
                joinedAt: p.joinedAt,
            })),
            totalPool: gameGroup.totalPool,
            countdownStartedAt: gameGroup.countdownStartedAt,
            countdownEndsAt: gameGroup.countdownEndsAt,
            winnerId: gameGroup.winnerId?.toString(),
            winnerUnlockCode: gameGroup.winnerUnlockCode,
            winnerPayout: gameGroup.winnerPayout,
            spinResult: gameGroup.spinResult,
        });
    } catch (error) {
        console.error('Get game error:', error);
        return NextResponse.json(
            { error: 'An error occurred while fetching game' },
            { status: 500 }
        );
    }
}
