import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
    title: 'BLM - Blessings Locate Me',
    description: 'Join the ultimate spin-to-win game! Compete with up to 10 players, spin the wheel, and win 80% of the pool. Powered by Gamepad Ltd.',
    keywords: ['BLM', 'Blessings Locate Me', 'spin wheel', 'win', 'game', 'Gamepad'],
    authors: [{ name: 'Gamepad Ltd' }],
    openGraph: {
        title: 'BLM - Blessings Locate Me',
        description: 'Join the ultimate spin-to-win game! Compete with up to 10 players, spin the wheel, and win 80% of the pool.',
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
