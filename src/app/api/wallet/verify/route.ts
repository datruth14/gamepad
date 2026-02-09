import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Wallet } from '@/lib/models';
import { verifyTransaction, nairaToBlm } from '@/lib/paystack';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const reference = searchParams.get('reference');
        // Determine base URL for redirect
        // Strictly prioritize USER CONFIG > HARDCODED PROD URL
        // We ignore VERCEL_URL by default to avoid protected preview URLs which break external callbacks
        let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gamepad-beta.vercel.app';

        console.log('Using Verify redirect base URL:', baseUrl);

        // Ensure no trailing slash
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }

        console.log('=== Payment Verification Started ===');
        console.log('Reference:', reference);

        if (!reference) {
            console.log('ERROR: Missing reference');
            return NextResponse.redirect(new URL('/dashboard/wallet?error=missing_reference', baseUrl));
        }

        await dbConnect();

        // Check if transaction was already completed (prevent double crediting)
        const existingCompleted = await Wallet.findOne({
            'transactions': {
                $elemMatch: {
                    reference: reference,
                    status: 'completed'
                }
            }
        });

        if (existingCompleted) {
            console.log('Transaction already completed, redirecting to success');
            const tx = existingCompleted.transactions.find((t: { reference: string }) => t.reference === reference);
            return NextResponse.redirect(
                new URL(`/dashboard/wallet?success=true&amount=${tx?.amount || 0}`, baseUrl)
            );
        }

        // Find the pending transaction
        const walletWithPending = await Wallet.findOne({
            'transactions': {
                $elemMatch: {
                    reference: reference,
                    status: 'pending'
                }
            }
        });

        console.log('Found wallet with pending transaction:', walletWithPending ? 'Yes' : 'No');

        if (!walletWithPending) {
            console.log('ERROR: No wallet found with pending transaction for reference:', reference);
            // List all wallets to debug
            const allWallets = await Wallet.find({}).select('userId transactions.reference transactions.status');
            console.log('All wallets in database:', JSON.stringify(allWallets, null, 2));
            return NextResponse.redirect(new URL('/dashboard/wallet?error=wallet_not_found', baseUrl));
        }

        // Verify transaction with Paystack
        console.log('Calling Paystack verify API...');
        const paystackResponse = await verifyTransaction(reference);

        if (!paystackResponse.status) {
            console.log('ERROR: Paystack API call failed');
            return NextResponse.redirect(new URL('/dashboard/wallet?error=verification_failed', baseUrl));
        }

        console.log('Paystack payment status:', paystackResponse.data.status);

        if (paystackResponse.data.status !== 'success') {
            console.log('Payment not successful, marking as failed');
            // Update transaction status to failed
            await Wallet.updateOne(
                { 'transactions.reference': reference },
                { $set: { 'transactions.$.status': 'failed' } }
            );
            return NextResponse.redirect(new URL('/dashboard/wallet?error=payment_failed', baseUrl));
        }

        // Calculate BLM amount from Naira
        const amountInNaira = paystackResponse.data.amount / 100;
        const blmAmount = nairaToBlm(amountInNaira);
        console.log('Amount - Naira:', amountInNaira, 'BLM:', blmAmount);

        // Update wallet balance and transaction status
        const updateResult = await Wallet.updateOne(
            {
                'transactions': {
                    $elemMatch: {
                        reference: reference,
                        status: 'pending'
                    }
                }
            },
            {
                $inc: { balance: blmAmount },
                $set: { 'transactions.$.status': 'completed' },
            }
        );

        console.log('Update result:', updateResult);

        if (updateResult.modifiedCount === 0) {
            console.log('WARNING: No documents were modified');
            // Check if already completed
            const maybeCompleted = await Wallet.findOne({
                'transactions.reference': reference,
                'transactions.status': 'completed',
            });

            if (maybeCompleted) {
                console.log('Transaction was already processed');
                return NextResponse.redirect(
                    new URL(`/dashboard/wallet?success=true&amount=${blmAmount}`, baseUrl)
                );
            }

            return NextResponse.redirect(new URL('/dashboard/wallet?error=update_failed', baseUrl));
        }

        console.log('=== Payment Verification Successful ===');
        console.log('Credited', blmAmount, 'BLM');

        return NextResponse.redirect(
            new URL(`/dashboard/wallet?success=true&amount=${blmAmount}`, baseUrl)
        );
    } catch (error) {
        console.error('Verify deposit error:', error);
        // For error case, just use request origin or simple fallback since we can't do much else easily without duplicating logic
        const errorBaseUrl = request.nextUrl.origin || 'http://localhost:3000';
        return NextResponse.redirect(new URL('/dashboard/wallet?error=verification_failed', errorBaseUrl));
    }
}

// Webhook for Paystack
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const event = body.event;
        const data = body.data;

        console.log('Paystack webhook received:', event);

        if (event === 'charge.success') {
            const reference = data.reference;
            const amountInNaira = data.amount / 100;
            const blmAmount = nairaToBlm(amountInNaira);

            await dbConnect();

            // Only update if still pending (prevent double crediting)
            const result = await Wallet.updateOne(
                {
                    'transactions': {
                        $elemMatch: {
                            reference: reference,
                            status: 'pending'
                        }
                    }
                },
                {
                    $inc: { balance: blmAmount },
                    $set: { 'transactions.$.status': 'completed' },
                }
            );

            if (result.modifiedCount > 0) {
                console.log('Webhook: Credited', blmAmount, 'BLM for reference', reference);
            } else {
                console.log('Webhook: Transaction already processed or not found for', reference);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
    }
}
