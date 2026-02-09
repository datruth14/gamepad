const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface PaystackInitResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data: {
        status: string;
        reference: string;
        amount: number;
        currency: string;
        customer: {
            email: string;
        };
        metadata?: Record<string, unknown>;
    };
}

interface PaystackTransferRecipientResponse {
    status: boolean;
    message: string;
    data: {
        recipient_code: string;
    };
}

interface PaystackTransferResponse {
    status: boolean;
    message: string;
    data: {
        reference: string;
        status: string;
    };
}

// BLM to Naira conversion
// 1000 BLM = 500 Naira
// 1 BLM = 0.5 Naira
// 1 Naira = 2 BLM
export const BLM_TO_NAIRA_RATE = 0.5;
export const NAIRA_TO_BLM_RATE = 2;
export const WITHDRAWAL_FEE_PERCENT = 5;

export function blmToNaira(blmAmount: number): number {
    return blmAmount * BLM_TO_NAIRA_RATE;
}

export function nairaToBlm(nairaAmount: number): number {
    return nairaAmount * NAIRA_TO_BLM_RATE;
}

export function calculateWithdrawalFee(blmAmount: number): { fee: number; netAmount: number } {
    const fee = Math.round(blmAmount * (WITHDRAWAL_FEE_PERCENT / 100));
    const netAmount = blmAmount - fee;
    return { fee, netAmount };
}

export async function initializeDeposit(
    email: string,
    amountInKobo: number,
    reference: string,
    metadata?: Record<string, unknown>,
    baseUrl?: string
): Promise<PaystackInitResponse> {
    // Determine callback URL - prioritize environment variables
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || baseUrl || 'http://localhost:3000';

    // Ensure no trailing slash
    const cleanAppUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;

    const callbackUrl = `${cleanAppUrl}/api/wallet/verify`;

    console.log('Initializing Paystack deposit with callback:', callbackUrl);

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            amount: amountInKobo,
            reference,
            callback_url: callbackUrl,
            metadata,
        }),
    });

    return response.json();
}

export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    try {
        console.log('Paystack verifyTransaction called for:', reference);
        console.log('Using secret key:', PAYSTACK_SECRET_KEY ? 'Key is set' : 'KEY IS MISSING!');

        const url = `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`;
        console.log('Fetching:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });

        console.log('Paystack response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Paystack API error:', response.status, errorText);
            return {
                status: false,
                message: `API Error: ${response.status}`,
                data: {
                    status: 'failed',
                    reference: reference,
                    amount: 0,
                    currency: 'NGN',
                    customer: { email: '' },
                },
            };
        }

        const data = await response.json();
        console.log('Paystack verify response data:', JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        console.error('Paystack verifyTransaction error:', error);
        return {
            status: false,
            message: error instanceof Error ? error.message : 'Unknown error',
            data: {
                status: 'failed',
                reference: reference,
                amount: 0,
                currency: 'NGN',
                customer: { email: '' },
            },
        };
    }
}

export async function createTransferRecipient(
    name: string,
    accountNumber: string,
    bankCode: string
): Promise<PaystackTransferRecipientResponse> {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: 'nuban',
            name,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: 'NGN',
        }),
    });

    return response.json();
}

export async function initiateTransfer(
    amountInKobo: number,
    recipientCode: string,
    reference: string,
    reason?: string
): Promise<PaystackTransferResponse> {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            source: 'balance',
            amount: amountInKobo,
            recipient: recipientCode,
            reference,
            reason: reason || 'BLM Withdrawal',
        }),
    });

    return response.json();
}

export async function listBanks(): Promise<{ status: boolean; data: Array<{ name: string; code: string }> }> {
    const response = await fetch(`${PAYSTACK_BASE_URL}/bank`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
    });

    return response.json();
}

export function generateReference(prefix: string = 'BLM'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
}
