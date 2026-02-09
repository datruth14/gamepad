'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        dateOfBirth: '',
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

        if (formData.fullName.trim().split(/\s+/).length < 2) {
            setError('Please enter your full name (first and last name)');
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    dateOfBirth: formData.dateOfBirth,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            router.push('/login?registered=true');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
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
                    <h1 className="text-2xl font-bold mt-4">Create Account</h1>
                    <p className="text-primary-400 mt-2">Start winning today!</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="card space-y-5">
                    {error && (
                        <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="fullName" className="label">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="input"
                            placeholder="John Doe"
                            required
                        />
                    </div>

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
                        <label htmlFor="dateOfBirth" className="label">
                            Date of Birth
                        </label>
                        <input
                            type="date"
                            id="dateOfBirth"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                        <p className="text-xs text-primary-400 mt-1">You must be 18+ to play</p>
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
                            minLength={8}
                            required
                        />
                        <p className="text-xs text-primary-400 mt-1">Minimum 8 characters</p>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="label">
                            Confirm Password
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

                    <div className="flex items-start space-x-2">
                        <input
                            type="checkbox"
                            id="terms"
                            className="w-4 h-4 mt-1 rounded border-primary-600 bg-primary-800 text-gold focus:ring-gold"
                            required
                        />
                        <label htmlFor="terms" className="text-sm text-primary-300">
                            I agree to the{' '}
                            <Link href="/terms" className="text-gold hover:underline">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="text-gold hover:underline">
                                Privacy Policy
                            </Link>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>

                    <p className="text-center text-primary-400 text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="text-gold hover:underline">
                            Log in
                        </Link>
                    </p>
                </form>
            </div>
        </main>
    );
}
