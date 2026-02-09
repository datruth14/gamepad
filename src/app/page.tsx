import Link from 'next/link';

export default function Home() {
    return (
        <main className="min-h-screen">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-primary-900/80 backdrop-blur-md border-b border-primary-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="text-2xl">🙏</span>
                            <span className="text-xl font-bold text-gradient">BLM</span>
                        </Link>
                        <div className="flex items-center space-x-4">
                            <Link href="/login" className="btn btn-ghost">
                                Login
                            </Link>
                            <Link href="/register" className="btn btn-primary">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-radial from-gold/10 via-transparent to-transparent opacity-50" />

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center px-4 py-2 bg-gold/10 border border-gold/30 rounded-full mb-8">
                        <span className="text-gold text-sm font-medium">🔥 Join 1000+ Winners Today</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6">
                        <span className="text-white">Blessings</span>{' '}
                        <span className="text-gradient">Locate Me</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-primary-300 mb-8 max-w-3xl mx-auto">
                        Join the ultimate spin-to-win game! Up to 10 players enter, 1 walks away with{' '}
                        <span className="text-gold font-bold">80% of the pool</span>.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                        <Link href="/register" className="btn btn-primary text-lg px-8 py-4 gold-glow">
                            Start Playing Now
                        </Link>
                        <Link href="#how-it-works" className="btn btn-secondary text-lg px-8 py-4">
                            Learn How It Works
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        {[
                            { label: 'Winners', value: '1,234+' },
                            { label: 'Total Payouts', value: '₦5M+' },
                            { label: 'Active Players', value: '500+' },
                            { label: 'Win Rate', value: '20%' },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-gold mb-2">{stat.value}</div>
                                <div className="text-primary-400 text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 px-4 bg-primary-800/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">How It Works</h2>
                        <p className="text-primary-300 text-lg max-w-2xl mx-auto">
                            Simple, transparent, and exciting. Here's how you can win big!
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            {
                                icon: '💰',
                                title: '1. Fund Your Wallet',
                                description: 'Add BLM coins using Paystack. 1,000 BLM = ₦500.',
                            },
                            {
                                icon: '🎮',
                                title: '2. Choose Your Tier',
                                description: 'Pick from 6 tiers: 1K, 2K, 4K, 10K, 20K, or 40K BLM.',
                            },
                            {
                                icon: '⏳',
                                title: '3. Wait for Players',
                                description: 'Game starts with minimum 2 players. More can join until countdown ends!',
                            },
                            {
                                icon: '🏆',
                                title: '4. Win Big!',
                                description: 'The wheel spins, and the winner takes 80% of the pool!',
                            },
                        ].map((step, index) => (
                            <div key={index} className="card card-hover text-center">
                                <div className="text-5xl mb-4">{step.icon}</div>
                                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                <p className="text-primary-400">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Game Tiers */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Choose Your Tier</h2>
                        <p className="text-primary-300 text-lg max-w-2xl mx-auto">
                            The higher the stake, the bigger the reward!
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { tier: 1000, pool: 10000, win: 8000 },
                            { tier: 2000, pool: 20000, win: 16000 },
                            { tier: 4000, pool: 40000, win: 32000 },
                            { tier: 10000, pool: 100000, win: 80000 },
                            { tier: 20000, pool: 200000, win: 160000 },
                            { tier: 40000, pool: 400000, win: 320000 },
                        ].map((item, index) => (
                            <div
                                key={item.tier}
                                className={`card card-hover ${index >= 3 ? 'border-gold/30 bg-gold/5' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-sm text-primary-400">Entry Fee</div>
                                        <div className="text-2xl font-bold">
                                            {item.tier.toLocaleString()} <span className="text-gold">BLM</span>
                                        </div>
                                    </div>
                                    {index >= 3 && (
                                        <span className="bg-gold text-primary-900 text-xs font-bold px-2 py-1 rounded">
                                            HOT
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-primary-400">Total Pool</span>
                                        <span className="font-medium">{item.pool.toLocaleString()} BLM</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-primary-400">Winner Gets</span>
                                        <span className="font-medium text-success">{item.win.toLocaleString()} BLM</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-primary-400">In Naira</span>
                                        <span className="font-medium text-gold">₦{(item.win / 2).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Rules */}
            <section className="py-20 px-4 bg-primary-800/30">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold mb-4">Game Rules</h2>
                        <p className="text-primary-300 text-lg">
                            Fair play guaranteed for all participants
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            'Games start with minimum 2 players, up to 10 can join.',
                            'Once joined, your entry fee is non-refundable unless the game is cancelled.',
                            "Winners are selected through a secure, server-side random algorithm - it's completely fair.",
                            'The winner receives 80% of the total pool. 20% is retained by the platform.',
                            'Winnings are credited instantly to your wallet.',
                            'You must be 18 years or older to participate.',
                            'Minimum deposit: ₦500 (1,000 BLM). Minimum withdrawal: 1,000 BLM.',
                            'Withdrawal fee: 5% of the amount.',
                        ].map((rule, index) => (
                            <div key={index} className="flex items-start gap-4 p-4 bg-primary-800/50 rounded-lg">
                                <span className="flex-shrink-0 w-6 h-6 bg-gold text-primary-900 rounded-full flex items-center justify-center text-sm font-bold">
                                    {index + 1}
                                </span>
                                <p className="text-primary-200">{rule}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to Find Your Blessing?</h2>
                    <p className="text-xl text-primary-300 mb-8">
                        Join thousands of winners. Your next big win is just a spin away!
                    </p>
                    <Link href="/register" className="btn btn-primary text-lg px-10 py-4 gold-glow">
                        Create Your Account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-primary-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">🙏</span>
                        <span className="text-xl font-bold text-gradient">BLM</span>
                    </div>
                    <div className="text-primary-400 text-sm">
                        © {new Date().getFullYear()} Blessings Locate Me. Powered by{' '}
                        <span className="text-gold font-medium">Gamepad Ltd</span>
                    </div>
                    <div className="flex items-center space-x-6">
                        <Link href="/terms" className="text-primary-400 hover:text-white text-sm">
                            Terms
                        </Link>
                        <Link href="/privacy" className="text-primary-400 hover:text-white text-sm">
                            Privacy
                        </Link>
                        <Link href="/support" className="text-primary-400 hover:text-white text-sm">
                            Support
                        </Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
