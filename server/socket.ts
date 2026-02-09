import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

const SOCKET_PORT = parseInt(process.env.SOCKET_PORT || '3001');
const GAME_SPIN_SECRET = process.env.GAME_SPIN_SECRET || 'blm-spin-secret';

interface GameRoom {
    gameId: string;
    tier: number;
    participants: string[];
    countdownEndTime?: number;
    status: 'waiting' | 'countdown' | 'spinning' | 'completed';
}

const gameRooms = new Map<string, GameRoom>();

export function startSocketServer() {
    const httpServer = createServer();
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join a game room
        socket.on('join-game', ({ gameId, unlockCode }) => {
            socket.join(gameId);
            console.log(`${unlockCode} joined game ${gameId}`);

            // Notify others in the room
            socket.to(gameId).emit('player-joined', { unlockCode });

            // Get current game state
            const room = gameRooms.get(gameId);
            if (room) {
                socket.emit('game-state', room);
            }
        });

        // Update game state (called from API)
        socket.on('update-game-state', ({ gameId, state }) => {
            gameRooms.set(gameId, state);
            io.to(gameId).emit('game-state', state);
        });

        // Start countdown (called when 5 players join)
        socket.on('start-countdown', async ({ gameId, countdownEndsAt }) => {
            const room = gameRooms.get(gameId);
            if (room) {
                room.status = 'countdown';
                room.countdownEndTime = new Date(countdownEndsAt).getTime();
                gameRooms.set(gameId, room);
            }

            io.to(gameId).emit('countdown-started', { countdownEndsAt });

            // Schedule spin when countdown ends
            const timeUntilSpin = new Date(countdownEndsAt).getTime() - Date.now();
            if (timeUntilSpin > 0) {
                setTimeout(async () => {
                    await triggerSpin(gameId, io);
                }, timeUntilSpin);
            }
        });

        // Leave game room
        socket.on('leave-game', ({ gameId }) => {
            socket.leave(gameId);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    // Trigger spin and announce winner
    async function triggerSpin(gameId: string, io: SocketIOServer) {
        try {
            io.to(gameId).emit('spin-starting');

            // Call the spin API
            const response = await fetch(`${process.env.NEXTAUTH_URL}/api/game/spin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId, secret: GAME_SPIN_SECRET }),
            });

            const result = await response.json();

            if (result.success) {
                // Emit spin result to all clients
                io.to(gameId).emit('spin-result', {
                    spinDegrees: result.spinResult,
                    winnerUnlockCode: result.winnerUnlockCode,
                    winnerPayout: result.winnerPayout,
                    totalPool: result.totalPool,
                });

                // Clean up room after animation completes (10 seconds)
                setTimeout(() => {
                    gameRooms.delete(gameId);
                    io.to(gameId).emit('game-completed');
                }, 10000);
            }
        } catch (error) {
            console.error('Error triggering spin:', error);
            io.to(gameId).emit('spin-error', { error: 'Failed to spin wheel' });
        }
    }

    httpServer.listen(SOCKET_PORT, () => {
        console.log(`Socket.io server running on port ${SOCKET_PORT}`);
    });

    return io;
}

// For standalone server execution
if (require.main === module) {
    startSocketServer();
}
