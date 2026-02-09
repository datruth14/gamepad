'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push('/dashboard');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center space-x-2">
                        <span className="text-4xl">🙏</span>
                        <span className="text-3xl font-bold text-gradient">BLM</span>
                    </Link>
                    <h1 className="text-2xl font-bold mt-4">Welcome Back</h1>
                    <p className="text-primary-400 mt-2">Log in to your account</p>
                </div>

                {/* Form */}
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
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="label">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-primary-600 bg-primary-800 text-gold focus:ring-gold"
                            />
                            <span className="text-sm text-primary-300">Remember me</span>
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-sm text-gold hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>

                    <p className="text-center text-primary-400 text-sm">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-gold hover:underline">
                            Sign up
                        </Link>
                    </p>
                </form>
            </div>
        </main>
    );
}
