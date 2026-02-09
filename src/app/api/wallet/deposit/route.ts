import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, Wallet } from '@/lib/models';
import { initializeDeposit, nairaToBlm, generateReference } from '@/lib/paystack';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { amount } = await request.json();

        if (!amount || amount < 500) {
            return NextResponse.json(
                { error: 'Minimum deposit is ₦500' },
                { status: 400 }
            );
        }

        await dbConnect();

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const reference = generateReference('DEP');
        const amountInKobo = amount * 100;
        const blmAmount = nairaToBlm(amount);

        console.log('Creating deposit transaction:', {
            userId: session.user.id,
            reference,
            blmAmount,
            amountInNaira: amount,
        });

        // First, ensure wallet exists (upsert)
        let wallet = await Wallet.findOne({ userId: session.user.id });

        if (!wallet) {
            console.log('Creating new wallet for user:', session.user.id);
            wallet = await Wallet.create({
                userId: session.user.id,
                balance: 0,
                transactions: [],
            });
        }

        // Add pending transaction to the wallet
        wallet.transactions.push({
            type: 'deposit',
            amount: blmAmount,
            reference,
            description: `Deposit of ₦${amount.toLocaleString()} (${blmAmount.toLocaleString()} BLM)`,
            status: 'pending',
            createdAt: new Date(),
        });

        await wallet.save();
        console.log('Pending transaction created with reference:', reference);

        // Initialize Paystack transaction
        const origin = request.nextUrl.origin;
        const paystackResponse = await initializeDeposit(
            user.email,
            amountInKobo,
            reference,
            { userId: session.user.id, blmAmount },
            origin
        );

        console.log('Paystack initialize response:', paystackResponse.status ? 'Success' : 'Failed');

        if (!paystackResponse.status) {
            console.error('Paystack initialization failed:', paystackResponse);
            return NextResponse.json(
                { error: 'Failed to initialize payment' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'Payment initialized',
            authorizationUrl: paystackResponse.data.authorization_url,
            reference: paystackResponse.data.reference,
            blmAmount,
        });
    } catch (error) {
        console.error('Deposit error:', error);
        return NextResponse.json(
            { error: 'An error occurred while processing deposit' },
            { status: 500 }
        );
    }
}
