'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import SpinningWheel from '@/components/SpinningWheel';

interface Participant {
    unlockCode: string;
    joinedAt?: string;
}

interface GameState {
    gameId: string;
    tier: number;
    status: 'waiting' | 'countdown' | 'spinning' | 'completed';
    participantCount: number;
    participants: Participant[];
    totalPool: number;
    countdownEndsAt?: string;
    winnerUnlockCode?: string;
    winnerPayout?: number;
    spinResult?: number;
}

function LobbyContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session, status } = useSession();

    const tier = parseInt(params.tier as string);
    const gameId = searchParams.get('gameId');
    const myUnlockCode = searchParams.get('code');

    const [socket, setSocket] = useState<Socket | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [showWinner, setShowWinner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [leaving, setLeaving] = useState(false);
    const [spinTriggered, setSpinTriggered] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Fetch initial game state
    useEffect(() => {
        const fetchGameState = async () => {
            if (!gameId) return;

            try {
                const response = await fetch(`/api/game/${gameId}`);
                if (response.ok) {
                    const data = await response.json();
                    setGameState(data);
                }
            } catch (error) {
                console.error('Error fetching game state:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGameState();
    }, [gameId]);

    // Connect to Socket.io
    useEffect(() => {
        if (!gameId) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
        const newSocket = io(socketUrl);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            newSocket.emit('join-game', { gameId, unlockCode: myUnlockCode });
        });

        newSocket.on('game-state', (state: GameState) => {
            setGameState(state);
        });

        newSocket.on('player-joined', ({ unlockCode }: { unlockCode: string }) => {
            setGameState((prev) => {
                if (!prev) return prev;
                if (prev.participants.some((p) => p.unlockCode === unlockCode)) return prev;
                return {
                    ...prev,
                    participantCount: prev.participantCount + 1,
                    participants: [...prev.participants, { unlockCode }],
                };
            });
        });

        newSocket.on('countdown-started', ({ countdownEndsAt }: { countdownEndsAt: string }) => {
            setGameState((prev) =>
                prev ? { ...prev, status: 'countdown', countdownEndsAt } : prev
            );
        });

        newSocket.on('spin-starting', () => {
            setIsSpinning(true);
            setGameState((prev) => (prev ? { ...prev, status: 'spinning' } : prev));
        });

        newSocket.on(
            'spin-result',
            ({
                spinDegrees,
                winnerUnlockCode,
                winnerPayout,
                totalPool,
            }: {
                spinDegrees: number;
                winnerUnlockCode: string;
                winnerPayout: number;
                totalPool: number;
            }) => {
                setGameState((prev) =>
                    prev
                        ? {
                            ...prev,
                            status: 'completed',
                            spinResult: spinDegrees,
                            winnerUnlockCode,
                            winnerPayout,
                            totalPool,
                        }
                        : prev
                );

                // Show winner after spin animation
                setTimeout(() => {
                    setIsSpinning(false);
                    setShowWinner(true);
                }, 5000);
            }
        );

        newSocket.on('game-completed', () => {
            // Redirect after showing winner
            setTimeout(() => {
                router.push('/dashboard');
            }, 5000);
        });

        setSocket(newSocket);

        return () => {
            newSocket.emit('leave-game', { gameId });
            newSocket.disconnect();
        };
    }, [gameId, myUnlockCode, router]);

    // Countdown timer and spin trigger
    useEffect(() => {
        if (!gameState?.countdownEndsAt) return;

        const updateCountdown = () => {
            const endTime = new Date(gameState.countdownEndsAt!).getTime();
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
            setCountdown(remaining);

            if (remaining === 0 && !spinTriggered && gameState.status !== 'completed') {
                setGameState((prev) => (prev ? { ...prev, status: 'spinning' } : prev));
                setSpinTriggered(true);
                setIsSpinning(true);

                // Trigger spin via API if socket didn't do it
                triggerSpinFallback();
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [gameState?.countdownEndsAt, spinTriggered, gameState?.status]);

    // Fallback spin trigger (when socket is not available)
    const triggerSpinFallback = useCallback(async () => {
        if (!gameId) return;

        console.log('Triggering spin fallback...');

        try {
            // Poll for completed game state or trigger spin
            const checkGame = async () => {
                const response = await fetch(`/api/game/${gameId}`);
                if (response.ok) {
                    const data = await response.json();
                    setGameState(data);

                    if (data.status === 'completed' && data.winnerUnlockCode) {
                        setIsSpinning(false);
                        setShowWinner(true);
                        return true;
                    }
                }
                return false;
            };

            // Try triggering spin
            const spinResponse = await fetch('/api/game/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId, secret: 'blm-game-spin-secret-change-in-production' }),
            });

            if (spinResponse.ok) {
                const spinResult = await spinResponse.json();
                console.log('Spin result:', spinResult);

                if (spinResult.success) {
                    setGameState((prev) =>
                        prev
                            ? {
                                ...prev,
                                status: 'completed',
                                spinResult: spinResult.spinResult,
                                winnerUnlockCode: spinResult.winnerUnlockCode,
                                winnerPayout: spinResult.winnerPayout,
                                totalPool: spinResult.totalPool,
                            }
                            : prev
                    );

                    // Show winner after animation
                    setTimeout(() => {
                        setIsSpinning(false);
                        setShowWinner(true);
                    }, 5000);
                }
            } else {
                // If spin fails, poll for updates
                const pollInterval = setInterval(async () => {
                    const completed = await checkGame();
                    if (completed) {
                        clearInterval(pollInterval);
                    }
                }, 2000);

                // Stop polling after 30 seconds
                setTimeout(() => clearInterval(pollInterval), 30000);
            }
        } catch (error) {
            console.error('Spin trigger error:', error);
        }
    }, [gameId]);

    // Leave game handler
    const handleLeaveGame = async () => {
        if (!gameId || leaving) return;

        setLeaving(true);
        try {
            const response = await fetch('/api/game/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'Left game successfully!');
                router.push('/dashboard');
            } else {
                alert(data.error || 'Failed to leave game');
            }
        } catch (error) {
            console.error('Error leaving game:', error);
            alert('Failed to leave game. Please try again.');
        } finally {
            setLeaving(false);
        }
    };

    // Poll for game updates (fallback if socket fails)
    useEffect(() => {
        if (!gameId || socket?.connected) return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/game/${gameId}`);
                if (response.ok) {
                    const data = await response.json();
                    setGameState(data);
                }
            } catch (error) {
                console.error('Error polling game state:', error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [gameId, socket?.connected]);

    const isWinner = gameState?.winnerUnlockCode === myUnlockCode;

    if (loading || status === 'loading') {
        return (
            <div className="loading-container">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full loading-spinner mx-auto mb-4"></div>
                    <p className="text-primary-400">Loading game...</p>
                </div>
            </div>
        );
    }

    if (!gameState) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
                    <Link href="/dashboard" className="btn btn-primary">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">
                            {tier.toLocaleString()} BLM Game
                        </h1>
                        <p className="text-primary-400">
                            Your code:{' '}
                            <span className="text-gold font-bold">{myUnlockCode}</span>
                        </p>
                    </div>
                    {(gameState.status === 'waiting' || gameState.status === 'countdown') && (
                        <button
                            onClick={handleLeaveGame}
                            disabled={leaving}
                            className="btn btn-secondary text-sm"
                        >
                            {leaving ? 'Leaving...' : 'Leave Game'}
                        </button>
                    )}
                </div>

                {/* Main Game Area */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Wheel Section */}
                    <div className="card flex flex-col items-center justify-center py-8">
                        {gameState.status === 'waiting' && (
                            <div className="text-center mb-6">
                                <div className="text-6xl mb-4 animate-pulse">⏳</div>
                                <h2 className="text-xl font-bold">Waiting for Players</h2>
                                <p className="text-primary-400">
                                    {gameState.participantCount}/10 players joined (min 2 to start)
                                </p>
                            </div>
                        )}

                        {gameState.status === 'countdown' && countdown !== null && (
                            <div className="text-center mb-6">
                                <div
                                    className={`text-7xl font-bold ${countdown <= 5 ? 'text-danger countdown-active' : 'text-gold'
                                        }`}
                                >
                                    {countdown}
                                </div>
                                <p className="text-primary-400 mt-2">seconds until spin!</p>
                            </div>
                        )}

                        {(gameState.status === 'spinning' ||
                            gameState.status === 'completed') && (
                                <SpinningWheel
                                    participants={gameState.participants}
                                    isSpinning={isSpinning}
                                    spinDegrees={gameState.spinResult || 1800}
                                    onSpinComplete={() => setIsSpinning(false)}
                                />
                            )}

                        {/* Winner Announcement */}
                        {showWinner && gameState.winnerUnlockCode && (
                            <div
                                className={`mt-6 p-6 rounded-xl text-center ${isWinner
                                    ? 'bg-gold/20 border-2 border-gold gold-glow'
                                    : 'bg-primary-700'
                                    }`}
                            >
                                {isWinner ? (
                                    <>
                                        <div className="text-5xl mb-4 winner-celebration">🏆</div>
                                        <h2 className="text-2xl font-bold text-gold mb-2">
                                            YOU WON!
                                        </h2>
                                        <p className="text-3xl font-bold text-success">
                                            +{gameState.winnerPayout?.toLocaleString()} BLM
                                        </p>
                                        <p className="text-primary-400 mt-2">
                                            Congratulations! Winnings added to your wallet.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-4xl mb-4">😔</div>
                                        <h2 className="text-xl font-bold mb-2">Better Luck Next Time!</h2>
                                        <p className="text-primary-400">
                                            Winner: <span className="text-gold">{gameState.winnerUnlockCode}</span>
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Participants Section */}
                    <div className="space-y-4">
                        {/* Game Info */}
                        <div className="card">
                            <h3 className="font-bold mb-4">Game Info</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-primary-400">Entry Fee</span>
                                    <span className="font-bold">{tier.toLocaleString()} BLM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-primary-400">Total Pool</span>
                                    <span className="font-bold text-gold">
                                        {(tier * gameState.participantCount).toLocaleString()} BLM
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-primary-400">Winner Gets (80%)</span>
                                    <span className="font-bold text-success">
                                        {Math.round(tier * gameState.participantCount * 0.8).toLocaleString()} BLM
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Participants List */}
                        <div className="card">
                            <h3 className="font-bold mb-4">
                                Players ({gameState.participantCount}/10)
                            </h3>
                            <div className="space-y-2">
                                {Array.from({ length: 10 }).map((_, index) => {
                                    const participant = gameState.participants[index];
                                    const isMe = participant?.unlockCode === myUnlockCode;
                                    const isWinnerSlot =
                                        showWinner &&
                                        participant?.unlockCode === gameState.winnerUnlockCode;

                                    return (
                                        <div
                                            key={index}
                                            className={`p-3 rounded-lg flex items-center justify-between ${isWinnerSlot
                                                ? 'bg-gold/20 border border-gold'
                                                : participant
                                                    ? 'bg-primary-700'
                                                    : 'bg-primary-800/50 border border-dashed border-primary-600'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isWinnerSlot
                                                        ? 'bg-gold text-primary-900'
                                                        : participant
                                                            ? 'bg-primary-600'
                                                            : 'bg-primary-700'
                                                        }`}
                                                >
                                                    {isWinnerSlot ? '👑' : index + 1}
                                                </div>
                                                <span
                                                    className={
                                                        participant
                                                            ? isMe
                                                                ? 'text-gold font-bold'
                                                                : ''
                                                            : 'text-primary-500'
                                                    }
                                                >
                                                    {participant?.unlockCode || 'Waiting...'}
                                                    {isMe && ' (You)'}
                                                </span>
                                            </div>
                                            {isWinnerSlot && (
                                                <span className="text-success font-bold text-sm">WINNER!</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="card text-center">
                            <div
                                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${gameState.status === 'waiting'
                                    ? 'bg-primary-700 text-primary-300'
                                    : gameState.status === 'countdown'
                                        ? 'bg-gold/20 text-gold'
                                        : gameState.status === 'spinning'
                                            ? 'bg-danger/20 text-danger animate-pulse'
                                            : 'bg-success/20 text-success'
                                    }`}
                            >
                                {gameState.status === 'waiting' && '⏳ Waiting for players...'}
                                {gameState.status === 'countdown' && '⚡ Get ready!'}
                                {gameState.status === 'spinning' && '🎰 Spinning...'}
                                {gameState.status === 'completed' && '✅ Game completed'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Return Button (after game) */}
                {showWinner && (
                    <div className="text-center mt-8">
                        <Link href="/dashboard" className="btn btn-primary">
                            Back to Dashboard
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LobbyPage() {
    return (
        <Suspense
            fallback={
                <div className="loading-container">
                    <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full loading-spinner"></div>
                </div>
            }
        >
            <LobbyContent />
        </Suspense>
    );
}
