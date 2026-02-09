'use client';

import { useRef, useEffect, useState } from 'react';

interface Participant {
    unlockCode: string;
}

interface SpinningWheelProps {
    participants: Participant[];
    isSpinning: boolean;
    spinDegrees?: number;
    winnerIndex?: number;
    onSpinComplete?: () => void;
}

const COLORS = [
    '#E91E63', // Pink
    '#9C27B0', // Purple
    '#3F51B5', // Indigo
    '#00BCD4', // Cyan
    '#4CAF50', // Green
    '#FFC107', // Amber
    '#FF5722', // Deep Orange
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#FFEB3B', // Yellow
];

export default function SpinningWheel({
    participants,
    isSpinning,
    spinDegrees = 1800,
    winnerIndex,
    onSpinComplete,
}: SpinningWheelProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rotation, setRotation] = useState(0);
    const [hasSpun, setHasSpun] = useState(false);

    // Draw the wheel
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        // Dynamically calculate segments based on participants
        // Ensure at least 2 segments for visual balance even if 1 player (though game needs 2)
        const segmentCount = Math.max(2, participants.length);
        const segmentAngle = (2 * Math.PI) / segmentCount;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw segments
        for (let i = 0; i < segmentCount; i++) {
            const startAngle = i * segmentAngle - Math.PI / 2;
            const endAngle = startAngle + segmentAngle;

            // Draw segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            // Fill with color
            ctx.fillStyle = COLORS[i];
            ctx.fill();

            // Draw border
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw unlock code text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + segmentAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;

            const participant = participants[i];
            const text = participant?.unlockCode || `P${i + 1}`;
            ctx.fillText(text, radius - 30, 6);
            ctx.restore();
        }

        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw center text
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BLM', centerX, centerY);
    }, [participants]);

    // Handle spinning animation
    useEffect(() => {
        if (isSpinning && !hasSpun) {
            setHasSpun(true);
            setRotation(spinDegrees);

            // Notify when spin completes
            const timeout = setTimeout(() => {
                if (onSpinComplete) {
                    onSpinComplete();
                }
            }, 5000);

            return () => clearTimeout(timeout);
        }
    }, [isSpinning, spinDegrees, hasSpun, onSpinComplete]);

    return (
        <div className="relative">
            {/* Pointer/Arrow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-gold drop-shadow-lg" />
            </div>

            {/* Wheel Container */}
            <div
                className={`transition-transform ${isSpinning ? 'wheel-spinning' : ''}`}
                style={{
                    transform: `rotate(${isSpinning ? 0 : rotation}deg)`,
                    ['--spin-degrees' as string]: `${spinDegrees}deg`,
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={300}
                    height={300}
                    className="mx-auto"
                />
            </div>

            {/* Winner highlight */}
            {winnerIndex !== undefined && !isSpinning && hasSpun && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 rounded-full animate-pulse" />
                </div>
            )}
        </div>
    );
}
