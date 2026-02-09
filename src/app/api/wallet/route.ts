import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Wallet } from '@/lib/models';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const wallet = await Wallet.findOne({ userId: session.user.id });

        if (!wallet) {
            return NextResponse.json(
                { error: 'Wallet not found' },
                { status: 404 }
            );
        }

        // Get last 20 transactions, sorted by date
        const transactions = wallet.transactions
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 20);

        return NextResponse.json({
            balance: wallet.balance,
            transactions,
        });
    } catch (error) {
        console.error('Get wallet error:', error);
        return NextResponse.json(
            { error: 'An error occurred while fetching wallet' },
            { status: 500 }
        );
    }
}
