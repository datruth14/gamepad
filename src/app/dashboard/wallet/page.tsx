'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

interface Transaction {
    type: 'deposit' | 'withdrawal' | 'game_entry' | 'game_win' | 'game_refund';
    amount: number;
    fee?: number;
    reference: string;
    description?: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: string;
}

interface WalletData {
    balance: number;
    transactions: Transaction[];
}

interface Bank {
    name: string;
    code: string;
}

function WalletContent() {
    const searchParams = useSearchParams();
    const success = searchParams.get('success');
    const depositAmount = searchParams.get('amount');
    const error = searchParams.get('error');

    const { data: session, status } = useSession();
    const router = useRouter();
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

    // Deposit form
    const [depositAmountInput, setDepositAmountInput] = useState('');
    const [depositLoading, setDepositLoading] = useState(false);

    // Withdraw form
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [bankCode, setBankCode] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [withdrawLoading, setWithdrawLoading] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [walletRes, banksRes] = await Promise.all([
                    fetch('/api/wallet'),
                    fetch('/api/wallet/banks'),
                ]);

                if (walletRes.ok) {
                    const walletData = await walletRes.json();
                    setWallet(walletData);
                }

                if (banksRes.ok) {
                    const banksData = await banksRes.json();
                    setBanks(banksData.banks || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchData();
        }
    }, [session]);

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(depositAmountInput);

        if (amount < 500) {
            alert('Minimum deposit is ₦500');
            return;
        }

        setDepositLoading(true);

        try {
            const response = await fetch('/api/wallet/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to initialize deposit');
            }

            // Redirect to Paystack
            window.location.href = data.authorizationUrl;
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to process deposit');
            setDepositLoading(false);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(withdrawAmount);

        if (amount < 1000) {
            alert('Minimum withdrawal is 1,000 BLM');
            return;
        }

        if (!bankCode || !accountNumber || !accountName) {
            alert('Please fill in all bank details');
            return;
        }

        setWithdrawLoading(true);

        try {
            const response = await fetch('/api/wallet/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    bankCode,
                    accountNumber,
                    accountName,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process withdrawal');
            }

            alert(`Withdrawal of ${data.netAmount.toLocaleString()} BLM initiated successfully!`);
            setWithdrawAmount('');
            setAccountNumber('');
            setAccountName('');

            // Refresh wallet
            const walletRes = await fetch('/api/wallet');
            if (walletRes.ok) {
                setWallet(await walletRes.json());
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to process withdrawal');
        } finally {
            setWithdrawLoading(false);
        }
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'deposit':
                return '↙️';
            case 'withdrawal':
                return '↗️';
            case 'game_entry':
                return '🎮';
            case 'game_win':
                return '🏆';
            case 'game_refund':
                return '↩️';
            default:
                return '💰';
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'deposit':
            case 'game_win':
            case 'game_refund':
                return 'text-success';
            case 'withdrawal':
            case 'game_entry':
                return 'text-danger';
            default:
                return 'text-white';
        }
    };

    const calculateWithdrawalPreview = () => {
        const amount = parseInt(withdrawAmount) || 0;
        const fee = Math.round(amount * 0.05);
        const netBlm = amount - fee;
        const netNaira = netBlm / 2;
        return { fee, netBlm, netNaira };
    };

    const blmFromDeposit = () => {
        const amount = parseInt(depositAmountInput) || 0;
        return amount * 2;
    };

    if (status === 'loading' || loading) {
        return (
            <div className="loading-container">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full loading-spinner mx-auto mb-4"></div>
                    <p className="text-primary-400">Loading wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Success/Error Messages */}
            {success && (
                <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                    ✅ Successfully deposited {parseInt(depositAmount || '0').toLocaleString()} BLM!
                </div>
            )}
            {error && (
                <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg">
                    ❌ Payment failed. Please try again.
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">My Wallet</h1>
                    <p className="text-primary-400 mt-1">Manage your BLM coins</p>
                </div>
                <Link href="/dashboard" className="btn btn-secondary">
                    ← Back
                </Link>
            </div>

            {/* Balance Card */}
            <div className="card bg-gradient-to-r from-gold/20 to-amber-600/20 border-gold/30">
                <div className="text-sm text-primary-300 mb-2">Available Balance</div>
                <div className="text-4xl md:text-5xl font-bold text-gold mb-2">
                    {wallet?.balance.toLocaleString() || '0'} <span className="text-xl">BLM</span>
                </div>
                <div className="text-primary-400">
                    ≈ ₦{((wallet?.balance || 0) / 2).toLocaleString()}
                </div>
            </div>

            {/* Deposit/Withdraw Tabs */}
            <div className="grid md:grid-cols-2 gap-8">
                <div className="card">
                    <div className="flex space-x-2 mb-6">
                        <button
                            onClick={() => setActiveTab('deposit')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${activeTab === 'deposit'
                                ? 'bg-gold text-primary-900'
                                : 'bg-primary-700 text-primary-300'
                                }`}
                        >
                            Deposit
                        </button>
                        <button
                            onClick={() => setActiveTab('withdraw')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${activeTab === 'withdraw'
                                ? 'bg-gold text-primary-900'
                                : 'bg-primary-700 text-primary-300'
                                }`}
                        >
                            Withdraw
                        </button>
                    </div>

                    {activeTab === 'deposit' ? (
                        <form onSubmit={handleDeposit} className="space-y-4">
                            <div>
                                <label className="label">Amount in Naira (₦)</label>
                                <input
                                    type="number"
                                    value={depositAmountInput}
                                    onChange={(e) => setDepositAmountInput(e.target.value)}
                                    className="input"
                                    placeholder="Enter amount (min ₦500)"
                                    min="500"
                                    required
                                />
                            </div>

                            {depositAmountInput && (
                                <div className="p-4 bg-primary-700/50 rounded-lg">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-primary-400">You will receive</span>
                                        <span className="text-gold font-bold">
                                            {blmFromDeposit().toLocaleString()} BLM
                                        </span>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={depositLoading}
                                className="btn btn-primary w-full"
                            >
                                {depositLoading ? 'Processing...' : 'Proceed to Pay'}
                            </button>

                            <p className="text-xs text-primary-400 text-center">
                                Rate: 1,000 BLM = ₦500 | Powered by Paystack
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label className="label">Amount in BLM</label>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="input"
                                    placeholder="Enter amount (min 1,000 BLM)"
                                    min="1000"
                                    max={wallet?.balance || 0}
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Bank</label>
                                <select
                                    value={bankCode}
                                    onChange={(e) => setBankCode(e.target.value)}
                                    className="input"
                                    required
                                >
                                    <option value="">Select Bank</option>
                                    {banks.map((bank) => (
                                        <option key={bank.code} value={bank.code}>
                                            {bank.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">Account Number</label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    className="input"
                                    placeholder="Enter 10-digit account number"
                                    maxLength={10}
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Account Name</label>
                                <input
                                    type="text"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    className="input"
                                    placeholder="Enter account holder name"
                                    required
                                />
                            </div>

                            {withdrawAmount && (
                                <div className="p-4 bg-primary-700/50 rounded-lg space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-primary-400">Fee (5%)</span>
                                        <span className="text-danger">
                                            -{calculateWithdrawalPreview().fee.toLocaleString()} BLM
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-primary-400">You will receive</span>
                                        <span className="text-success font-bold">
                                            ₦{calculateWithdrawalPreview().netNaira.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={withdrawLoading}
                                className="btn btn-primary w-full"
                            >
                                {withdrawLoading ? 'Processing...' : 'Withdraw'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Transaction History */}
                <div className="card">
                    <h2 className="text-lg font-bold mb-4">Transaction History</h2>

                    {!wallet?.transactions.length ? (
                        <div className="text-center py-8 text-primary-400">
                            No transactions yet
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {wallet.transactions.map((tx, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-primary-700/30 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">{getTransactionIcon(tx.type)}</span>
                                        <div>
                                            <div className="font-medium capitalize">
                                                {tx.type.replace('_', ' ')}
                                            </div>
                                            <div className="text-xs text-primary-400">
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold ${getTransactionColor(tx.type)}`}>
                                            {tx.type === 'withdrawal' || tx.type === 'game_entry' ? '-' : '+'}
                                            {tx.amount.toLocaleString()} BLM
                                        </div>
                                        <div
                                            className={`text-xs ${tx.status === 'completed'
                                                ? 'text-success'
                                                : tx.status === 'failed'
                                                    ? 'text-danger'
                                                    : 'text-gold'
                                                }`}
                                        >
                                            {tx.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function WalletPage() {
    return (
        <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
            <WalletContent />
        </Suspense>
    );
}
