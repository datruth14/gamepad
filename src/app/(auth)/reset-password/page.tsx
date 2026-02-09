'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center">
                <div className="text-6xl mb-6">❌</div>
                <h1 className="text-2xl font-bold mb-4">Invalid Reset Link</h1>
                <p className="text-primary-400 mb-8">
                    This password reset link is invalid or has expired.
                </p>
                <Link href="/forgot-password" className="btn btn-primary">
                    Request New Link
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center">
                <div className="text-6xl mb-6">✅</div>
                <h1 className="text-2xl font-bold mb-4">Password Reset!</h1>
                <p className="text-primary-400 mb-8">
                    Your password has been reset successfully. Redirecting to login...
                </p>
                <Link href="/login" className="btn btn-primary">
                    Go to Login
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center space-x-2">
                    <span className="text-4xl">🙏</span>
                    <span className="text-3xl font-bold text-gradient">BLM</span>
                </Link>
                <h1 className="text-2xl font-bold mt-4">Reset Password</h1>
                <p className="text-primary-400 mt-2">Enter your new password</p>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-6">
                {error && (
                    <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="password" className="label">
                        New Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="input"
                        placeholder="••••••••"
                        minLength={8}
                        required
                    />
                    <p className="text-xs text-primary-400 mt-1">Minimum 8 characters</p>
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="label">
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="input"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full"
                >
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <Suspense fallback={<div className="text-center">Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </main>
    );
}
