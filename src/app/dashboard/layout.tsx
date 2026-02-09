'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
        { name: 'Wallet', href: '/dashboard/wallet', icon: '💰' },
        { name: 'Game History', href: '/dashboard/history', icon: '📜' },
        { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
    ];

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-64 bg-primary-800/50 border-r border-primary-700 hidden md:flex flex-col">
                {/* Logo */}
                <div className="p-4 border-b border-primary-700">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <span className="text-2xl">🙏</span>
                        <span className="text-xl font-bold text-gradient">BLM</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${pathname === item.href
                                ? 'bg-gold/10 text-gold border border-gold/30'
                                : 'text-primary-300 hover:bg-primary-700 hover:text-white'
                                }`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </nav>

                {/* User */}
                <div className="p-4 border-t border-primary-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center text-gold font-bold">
                                {session?.user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <div className="text-sm font-medium truncate max-w-[120px]">
                                    {session?.user?.name}
                                </div>
                                <div className="text-xs text-primary-400 truncate max-w-[120px]">
                                    {session?.user?.email}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="text-primary-400 hover:text-danger transition-colors"
                            title="Logout"
                        >
                            🚪
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-primary-900/95 backdrop-blur-sm border-b border-primary-700">
                <div className="flex items-center justify-between p-4">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <span className="text-2xl">🙏</span>
                        <span className="text-xl font-bold text-gradient">BLM</span>
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="text-primary-400 hover:text-danger"
                    >
                        Logout
                    </button>
                </div>
                {/* Mobile Navigation */}
                <div className="flex overflow-x-auto pb-2 px-4 space-x-2">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm ${pathname === item.href
                                ? 'bg-gold/10 text-gold border border-gold/30'
                                : 'bg-primary-800 text-primary-300'
                                }`}
                        >
                            {item.icon} {item.name}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 md:p-8 pt-32 md:pt-8 p-4">
                {children}
            </main>
        </div>
    );
}
