import { NextResponse } from 'next/server';
import { listBanks } from '@/lib/paystack';

export async function GET() {
    try {
        const response = await listBanks();

        if (!response.status) {
            return NextResponse.json(
                { error: 'Failed to fetch banks' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            banks: response.data.map((bank) => ({
                name: bank.name,
                code: bank.code,
            })),
        });
    } catch (error) {
        console.error('List banks error:', error);
        return NextResponse.json(
            { error: 'An error occurred while fetching banks' },
            { status: 500 }
        );
    }
}
