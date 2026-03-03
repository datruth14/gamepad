import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
    title: 'Gamepad',
    description: 'Join gamepad games and win Compete with up to 10 players, spin the wheel, and win 80% of the pool.',
    keywords: ['Gamepad', 'spin wheel', 'win', 'game', 'multiplayer'],
    authors: [{ name: 'Gamepad Ltd' }],
    openGraph: {
        title: 'Gamepad',
        description: 'Join gamepad games and win Compete with up to 10 players, spin the wheel, and win 80% of the pool.',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-primary-900 text-white antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
