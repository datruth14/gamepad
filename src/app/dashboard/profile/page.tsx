'use client';

import { useSession, signOut } from 'next-auth/react';

export default function ProfilePage() {
    const { data: session } = useSession();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Profile</h1>
                <p className="text-primary-400 mt-1">Manage your account settings</p>
            </div>

            <div className="card">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center text-gold text-2xl font-bold">
                        {session?.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{session?.user?.name}</h2>
                        <p className="text-primary-400">{session?.user?.email}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-primary-700/50 rounded-lg">
                        <label className="text-sm text-primary-400">Full Name</label>
                        <p className="font-medium">{session?.user?.name}</p>
                    </div>

                    <div className="p-4 bg-primary-700/50 rounded-lg">
                        <label className="text-sm text-primary-400">Email</label>
                        <p className="font-medium">{session?.user?.email}</p>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 className="font-bold mb-4">Account Actions</h3>
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="btn btn-danger"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
