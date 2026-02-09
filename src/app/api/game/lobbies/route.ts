import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { GameGroup, GameGroupTier } from '@/lib/models';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tierParam = searchParams.get('tier');

        await dbConnect();

        const tiers: GameGroupTier[] = [1000, 2000, 4000, 10000, 20000, 40000];

        if (tierParam) {
            const tier = parseInt(tierParam) as GameGroupTier;
            if (!tiers.includes(tier)) {
                return NextResponse.json(
                    { error: 'Invalid tier' },
                    { status: 400 }
                );
            }

            // Get active game for specific tier
            const activeGame = await GameGroup.findOne({
                tier,
                status: { $in: ['waiting', 'countdown'] },
            });

            if (!activeGame) {
                return NextResponse.json({
                    tier,
                    activeGame: null,
                    participantCount: 0,
                });
            }

            return NextResponse.json({
                tier,
                activeGame: {
                    gameId: activeGame._id.toString(),
                    participantCount: activeGame.participants.length,
                    status: activeGame.status,
                    countdownEndsAt: activeGame.countdownEndsAt,
                    participants: activeGame.participants.map((p) => ({
                        unlockCode: p.unlockCode,
                    })),
                },
            });
        }

        // Get overview of all tiers
        const groups = await Promise.all(
            tiers.map(async (tier) => {
                const activeGame = await GameGroup.findOne({
                    tier,
                    status: { $in: ['waiting', 'countdown'] },
                });

                return {
                    tier,
                    participantCount: activeGame?.participants.length || 0,
                    status: activeGame?.status || 'waiting',
                    gameId: activeGame?._id.toString() || null,
                };
            })
        );

        return NextResponse.json({ groups });
    } catch (error) {
        console.error('Get lobbies error:', error);
        return NextResponse.json(
            { error: 'An error occurred while fetching lobbies' },
            { status: 500 }
        );
    }
}
