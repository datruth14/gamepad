'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send reset email');
            }

            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md text-center">
                    <div className="text-6xl mb-6">📧</div>
                    <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
                    <p className="text-primary-400 mb-8">
                        If an account with {email} exists, we've sent a password reset link.
                        Check your inbox and spam folder.
                    </p>
                    <Link href="/login" className="btn btn-primary">
                        Back to Login
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center space-x-2">
                        <span className="text-4xl">🙏</span>
                        <span className="text-3xl font-bold text-gradient">BLM</span>
                    </Link>
                    <h1 className="text-2xl font-bold mt-4">Forgot Password?</h1>
                    <p className="text-primary-400 mt-2">
                        Enter your email and we'll send you a reset link
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="card space-y-6">
                    {error && (
                        <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="label">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>

                    <p className="text-center text-primary-400 text-sm">
                        Remember your password?{' '}
                        <Link href="/login" className="text-gold hover:underline">
                            Log in
                        </Link>
                    </p>
                </form>
            </div>
        </main>
    );
}
