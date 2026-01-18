'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function LoginPage() {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleSocialLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                },
            });

            if (error) throw error;

            // Manual redirect if Supabase returns a URL (robustness fix)
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (mode === 'signup') {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) throw error;

                // Check if session verified immediately (if email confirm disabled)
                if (data.session) {
                    router.push('/home');
                    router.refresh();
                } else {
                    setMessage('Account created! Please check your email to confirm.');
                    setMode('signin');
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/home');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <Card variant="glass" className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {mode === 'signin' ? 'Welcome Back' : 'Join VocabQuest'}
                    </h1>
                    <p className="text-gray-400">
                        {mode === 'signin'
                            ? 'Sign in to continue your progress'
                            : 'Start your vocabulary journey today'}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-black/20 rounded-xl mb-6">
                    <button
                        onClick={() => { setMode('signin'); setError(null); setMessage(null); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'signin'
                            ? 'bg-violet-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                            }`}
                        type="button"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { setMode('signup'); setError(null); setMessage(null); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'signup'
                            ? 'bg-violet-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                            }`}
                        type="button"
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
                            {message}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
                    </Button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-black/40 px-2 text-gray-400 backdrop-blur-xl rounded">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSocialLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black font-medium py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Sign in with Google
                    </button>
                </form>
            </Card>
        </main>
    );
}
