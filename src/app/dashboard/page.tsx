'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface WalletData {
    balance: number;
}

interface LobbyData {
    tier: number;
    participantCount: number;
    status: string;
    gameId: string | null;
}

const TIERS = [
    { tier: 1000, label: '1K', color: 'from-emerald-500 to-emerald-700' },
    { tier: 2000, label: '2K', color: 'from-blue-500 to-blue-700' },
    { tier: 4000, label: '4K', color: 'from-purple-500 to-purple-700' },
    { tier: 10000, label: '10K', color: 'from-orange-500 to-orange-700' },
    { tier: 20000, label: '20K', color: 'from-pink-500 to-pink-700' },
    { tier: 40000, label: '40K', color: 'from-gold to-amber-600' },
];

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [lobbies, setLobbies] = useState<LobbyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState<number | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [walletRes, lobbiesRes] = await Promise.all([
                    fetch('/api/wallet'),
                    fetch('/api/game/lobbies'),
                ]);

                if (walletRes.ok) {
                    const walletData = await walletRes.json();
                    setWallet(walletData);
                }

                if (lobbiesRes.ok) {
                    const lobbiesData = await lobbiesRes.json();
                    setLobbies(lobbiesData.groups || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchData();
            // Refresh lobbies every 5 seconds
            const interval = setInterval(fetchData, 5000);
            return () => clearInterval(interval);
        }
    }, [session]);

    const handleJoinGame = async (tier: number) => {
        if (wallet && wallet.balance < tier) {
            alert(`Insufficient balance. You need ${tier.toLocaleString()} BLM to join this game.`);
            return;
        }

        setJoining(tier);

        try {
            const response = await fetch('/api/game/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to join game');
            }

            router.push(`/lobby/${tier}?gameId=${data.gameId}&code=${data.unlockCode}`);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to join game');
        } finally {
            setJoining(null);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="loading-container">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full loading-spinner mx-auto mb-4"></div>
                    <p className="text-primary-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        Welcome back, <span className="text-gold">{session?.user?.name?.split(' ')[0]}</span>!
                    </h1>
                    <p className="text-primary-400 mt-1">Ready to find your blessing?</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="card py-3 px-5">
                        <div className="text-sm text-primary-400">Your Balance</div>
                        <div className="text-2xl font-bold text-gold">
                            {wallet?.balance.toLocaleString() || '0'} <span className="text-sm">BLM</span>
                        </div>
                    </div>
                    <Link href="/dashboard/wallet" className="btn btn-primary">
                        Add Funds
                    </Link>
                </div>
            </div>

            {/* Game Tiers Grid */}
            <div>
                <h2 className="text-xl font-bold mb-4">Choose Your Game</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {TIERS.map((tierData) => {
                        const lobby = lobbies.find((l) => l.tier === tierData.tier);
                        const participantCount = lobby?.participantCount || 0;
                        const canAfford = wallet && wallet.balance >= tierData.tier;

                        return (
                            <div
                                key={tierData.tier}
                                className={`card card-hover relative overflow-hidden ${!canAfford ? 'opacity-60' : ''
                                    }`}
                            >
                                {/* Background gradient */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br ${tierData.color} opacity-10`}
                                />

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-3xl font-bold">{tierData.label}</div>
                                            <div className="text-sm text-primary-400">BLM Entry</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-primary-400">Players</div>
                                            <div className="font-bold">
                                                <span className={participantCount > 0 ? 'text-success' : ''}>
                                                    {participantCount}
                                                </span>
                                                /10
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-2 bg-primary-700 rounded-full mb-4">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${tierData.color} transition-all duration-500`}
                                            style={{ width: `${(participantCount / 10) * 100}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center text-sm mb-4">
                                        <span className="text-primary-400">Win up to</span>
                                        <span className="text-success font-bold">
                                            {(tierData.tier * 10 * 0.8).toLocaleString()} BLM
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => handleJoinGame(tierData.tier)}
                                        disabled={!canAfford || joining === tierData.tier}
                                        className={`w-full py-3 rounded-lg font-semibold transition-all ${canAfford
                                            ? `bg-gradient-to-r ${tierData.color} text-white hover:opacity-90`
                                            : 'bg-primary-700 text-primary-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {joining === tierData.tier
                                            ? 'Joining...'
                                            : canAfford
                                                ? 'Join Game'
                                                : 'Insufficient Balance'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center">
                    <div className="text-3xl mb-2">🎮</div>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-primary-400">Games Played</div>
                </div>
                <div className="card text-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <div className="text-2xl font-bold text-gold">0</div>
                    <div className="text-sm text-primary-400">Total Wins</div>
                </div>
                <div className="card text-center">
                    <div className="text-3xl mb-2">💰</div>
                    <div className="text-2xl font-bold text-success">0 BLM</div>
                    <div className="text-sm text-primary-400">Total Winnings</div>
                </div>
                <div className="card text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <div className="text-2xl font-bold">0%</div>
                    <div className="text-sm text-primary-400">Win Rate</div>
                </div>
            </div>
        </div>
    );
}
