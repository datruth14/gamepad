import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Wallet } from '@/lib/models';
import {
    calculateWithdrawalFee,
    blmToNaira,
    createTransferRecipient,
    initiateTransfer,
    generateReference,
} from '@/lib/paystack';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { amount, bankCode, accountNumber, accountName } = await request.json();

        if (!amount || amount < 1000) {
            return NextResponse.json(
                { error: 'Minimum withdrawal is 1,000 BLM' },
                { status: 400 }
            );
        }

        if (!bankCode || !accountNumber || !accountName) {
            return NextResponse.json(
                { error: 'Bank details are required' },
                { status: 400 }
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

        if (wallet.balance < amount) {
            return NextResponse.json(
                { error: 'Insufficient balance' },
                { status: 400 }
            );
        }

        // Calculate fee and net amount
        const { fee, netAmount } = calculateWithdrawalFee(amount);
        const nairaAmount = blmToNaira(netAmount);
        const nairaAmountInKobo = Math.round(nairaAmount * 100);

        // Create transfer recipient
        const recipientResponse = await createTransferRecipient(
            accountName,
            accountNumber,
            bankCode
        );

        if (!recipientResponse.status) {
            return NextResponse.json(
                { error: 'Failed to verify bank account' },
                { status: 400 }
            );
        }

        const reference = generateReference('WTH');

        // Initiate transfer
        const transferResponse = await initiateTransfer(
            nairaAmountInKobo,
            recipientResponse.data.recipient_code,
            reference
        );

        if (!transferResponse.status) {
            return NextResponse.json(
                { error: 'Failed to initiate withdrawal' },
                { status: 500 }
            );
        }

        // Deduct from wallet and add transaction
        await Wallet.findByIdAndUpdate(wallet._id, {
            $inc: { balance: -amount },
            $push: {
                transactions: {
                    type: 'withdrawal',
                    amount,
                    fee,
                    netAmount,
                    reference,
                    description: `Withdrawal of ${netAmount.toLocaleString()} BLM (₦${nairaAmount.toLocaleString()}) - Fee: ${fee.toLocaleString()} BLM`,
                    status: 'pending',
                    createdAt: new Date(),
                },
            },
        });

        return NextResponse.json({
            message: 'Withdrawal initiated successfully',
            reference,
            amount,
            fee,
            netAmount,
            nairaAmount,
        });
    } catch (error) {
        console.error('Withdrawal error:', error);
        return NextResponse.json(
            { error: 'An error occurred while processing withdrawal' },
            { status: 500 }
        );
    }
}
