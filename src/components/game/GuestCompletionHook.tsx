'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface GuestCompletionHookProps {
    sessionNumber: number;
    xpEarned: number;
    totalXP: number;
    wordsLearned: number;
    onContinue: () => void;
}

export default function GuestCompletionHook({
    sessionNumber,
    xpEarned,
    totalXP,
    wordsLearned,
    onContinue
}: GuestCompletionHookProps) {
    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <Card variant="glass" className="text-center max-w-lg w-full">
                <div className="py-8">
                    {/* Celebration Animation */}
                    <div className="relative mb-6">
                        <span className="text-7xl block animate-bounce">🎉</span>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-r from-violet-500/20 to-amber-500/20 rounded-full blur-3xl -z-10" />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">
                        Session {sessionNumber} Complete!
                    </h2>

                    <p className="text-lg text-gray-300 mb-8 max-w-sm mx-auto">
                        You've mastered <span className="text-emerald-400 font-bold">{wordsLearned} new words</span> and earned <span className="text-amber-400 font-bold">+{xpEarned} XP</span>.
                    </p>

                    {/* Stats Preview */}
                    <div className="grid grid-cols-2 gap-4 mb-8 max-w-xs mx-auto">
                        <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)' }}>
                            <div className="text-xl font-bold" style={{ color: 'var(--accent-gold)' }}>
                                {totalXP} XP
                            </div>
                            <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                                Total Score
                            </div>
                        </div>
                        <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)' }}>
                            <div className="text-xl font-bold" style={{ color: 'var(--accent-teal)' }}>
                                Session {sessionNumber + 1}
                            </div>
                            <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                                Unlocked
                            </div>
                        </div>
                    </div>

                    {/* The Hook */}
                    <div className="bg-violet-600/20 border border-violet-500/30 rounded-xl p-5 mb-8">
                        <div className="flex items-start gap-4 text-left">
                            <span className="text-2xl">🔥</span>
                            <div>
                                <h3 className="font-bold text-violet-200 mb-1">Save your streak?</h3>
                                <p className="text-sm text-violet-200/80 leading-relaxed">
                                    You're on fire! Create a free account to save your progress, track your stats, and compete on the leaderboard.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col gap-3">
                        <Link href={`/login?next=/quest/${sessionNumber + 1}&syncGuest=true`} className="block w-full">
                            <Button className="w-full text-lg py-3 animate-pulse-glow">
                                🚀 Create Free Account
                            </Button>
                        </Link>

                        <Button
                            variant="ghost"
                            className="w-full text-gray-400 hover:text-white"
                            onClick={onContinue}
                        >
                            Continue as Guest &rarr;
                        </Button>
                    </div>

                    <p className="text-xs text-gray-600 mt-4">
                        Progress is saved locally on this device until you sign up.
                    </p>
                </div>
            </Card>
        </main>
    );
}
