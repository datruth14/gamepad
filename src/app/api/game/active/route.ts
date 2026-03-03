import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { GameGroup } from '@/lib/models';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        // Check if user is already in an active game
        // Any game where the user is a participant and status is not 'completed' or 'cancelled'
        const activeGame = await GameGroup.findOne({
            'participants.userId': session.user.id,
            status: { $in: ['waiting', 'countdown', 'spinning'] }
        });

        if (!activeGame) {
            return NextResponse.json({ active: false });
        }

        // Find the user's unlock code in this game
        const myParticipant = activeGame.participants.find(
            (p: any) => p.userId.toString() === session.user.id
        );

        return NextResponse.json({
            active: true,
            gameId: activeGame._id.toString(),
            tier: activeGame.tier,
            status: activeGame.status,
            unlockCode: myParticipant?.unlockCode || '',
        });
    } catch (error) {
        console.error('Active game check error:', error);
        return NextResponse.json(
            { error: 'An error occurred while checking for active games' },
            { status: 500 }
        );
    }
}
