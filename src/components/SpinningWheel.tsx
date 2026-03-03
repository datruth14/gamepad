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
    const spinStartedRef = useRef(false);

    // Draw the wheel
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        const segmentCount = Math.max(2, participants.length);
        const segmentAngle = (2 * Math.PI) / segmentCount;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < segmentCount; i++) {
            const startAngle = i * segmentAngle - Math.PI / 2;
            const endAngle = startAngle + segmentAngle;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            ctx.fillStyle = COLORS[i % COLORS.length];
            ctx.fill();

            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 3;
            ctx.stroke();

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

        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GP', centerX, centerY);
    }, [participants]);

    // Handle spinning animation state
    useEffect(() => {
        if (isSpinning) {
            // Only trigger the start of the spin once
            if (!spinStartedRef.current) {
                spinStartedRef.current = true;
                setHasSpun(true);
                setRotation(spinDegrees);

                // Notify when spin completes - only once
                const timeout = setTimeout(() => {
                    if (onSpinComplete) {
                        onSpinComplete();
                    }
                }, 5000);

                return () => clearTimeout(timeout);
            } else if (rotation !== spinDegrees) {
                // If we get an updated spinResult while already spinning, update the target
                setRotation(spinDegrees);
            }
        } else {
            // Reset the start trigger when we're finally not spinning
            spinStartedRef.current = false;

            // Handle case where we load into a finished game
            if (!hasSpun && spinDegrees !== 0) {
                setRotation(spinDegrees);
                setHasSpun(true);
            }
        }
    }, [isSpinning, spinDegrees, hasSpun, onSpinComplete, rotation]);

    return (
        <div className="relative">
            {/* Pointer/Arrow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-gold drop-shadow-lg" />
            </div>

            {/* Wheel Container */}
            <div
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
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
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-black/50 rounded-full animate-pulse" />
                </div>
            )}
        </div>
    );
}
