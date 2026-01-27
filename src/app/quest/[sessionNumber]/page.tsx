'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSessionByNumber, submitQuestAnswer, completeQuest } from '@/app/actions/quest';
import { recordActivity } from '@/app/actions/streak';
import { getUserStats } from '@/app/actions/user';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import QuizPrompt from '@/components/game/QuizPrompt';
import XPDisplay from '@/components/game/XPDisplay';
import GuestCompletionHook from '@/components/game/GuestCompletionHook';
import { saveGuestProgress, getGuestState, type GuestWordState } from '@/lib/guestProgress';
import { type QuestPrompt, type DbSession } from '@/lib/types';

interface QuestPageProps {
    params: Promise<{ sessionNumber: string }>;
}

export default function QuestPage({ params }: QuestPageProps) {
    const resolvedParams = use(params);
    const router = useRouter();
    const sessionNumber = parseInt(resolvedParams.sessionNumber, 10);

    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<DbSession | null>(null);
    const [prompts, setPrompts] = useState<QuestPrompt[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [xpTotal, setXpTotal] = useState(0);
    const [xpGained, setXpGained] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [bonusXP, setBonusXP] = useState(0);

    const [completionMessage, setCompletionMessage] = useState<string | null>(null);

    // Guest mode state
    const [isGuest, setIsGuest] = useState(false);
    const [guestWordStates, setGuestWordStates] = useState<GuestWordState[]>([]);

    // Track pending server syncs to ensure data saves before completion
    const [pendingSyncs, setPendingSyncs] = useState<Promise<any>[]>([]);

    useEffect(() => {
        async function loadSessionAndStats() {
            try {
                // Fetch session data first
                const sessionData = await getSessionByNumber(sessionNumber);

                if (sessionData) {
                    setSession(sessionData.session);
                    setPrompts(sessionData.prompts);
                }

                // Try to get user stats - if null, user is guest
                const stats = await getUserStats();

                if (stats) {
                    setXpTotal(stats.xpTotal);
                    setIsGuest(false);
                } else {
                    // Guest mode - allowed for all sessions now
                    setIsGuest(true);
                    setXpTotal(0);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadSessionAndStats();
    }, [sessionNumber, router]);

    const handleAnswer = async (selectedAnswer: string, isCorrect: boolean) => {
        const prompt = prompts[currentIndex];

        // Optimistic UI Update (Immediate feedback)
        const optimisticXpAward = isCorrect ? 10 : 2;
        const newOptimisticTotal = xpTotal + optimisticXpAward;

        setXpTotal(newOptimisticTotal);
        setXpGained(optimisticXpAward);
        if (isCorrect) setCorrectCount(c => c + 1);

        if (isGuest) {
            // Guest mode: Track locally instead of server sync
            setGuestWordStates(prev => [...prev, {
                wordId: prompt.wordId,
                term: prompt.wordTerm,
                isCorrect
            }]);
        } else {
            // Authenticated: Sync to server
            const serverRequest = submitQuestAnswer(prompt.wordId, isCorrect)
                .catch((err) => {
                    console.error('Background sync failed:', err);
                });
            setPendingSyncs(prev => [...prev, serverRequest]);
        }

        // Transition UI after delay
        setTimeout(() => {
            if (currentIndex < prompts.length - 1) {
                setCurrentIndex(i => i + 1);
                setXpGained(0);
            } else {
                handleComplete();
            }
        }, 800);
    };

    const handleComplete = async () => {
        if (!session) return;

        const estimatedBonusXP = 50;
        setBonusXP(estimatedBonusXP);
        setXpTotal(prev => prev + estimatedBonusXP);
        setIsComplete(true);

        if (isGuest) {
            // Guest mode: Save to localStorage (New Schema)
            const sessionXpEarned = guestWordStates.reduce((sum, w) => sum + (w.isCorrect ? 10 : 2), 0) + estimatedBonusXP;

            saveGuestProgress({
                sessionNumber,
                xpEarned: sessionXpEarned,
                wordsCompleted: guestWordStates,
                completedAt: new Date().toISOString(),
                correctCount,
                totalCount: prompts.length
            });

            // Set for UI display in hook
            setXpGained(sessionXpEarned);
        } else {
            // Authenticated: Wait for syncs and complete on server
            await Promise.all(pendingSyncs);

            const now = new Date();
            const localDate = now.toLocaleDateString('en-CA');

            Promise.all([
                completeQuest(session.id),
                recordActivity('session', localDate)
            ]).then(([questResult]) => {
                if (questResult) {
                    if (!questResult.success && questResult.message) {
                        setCompletionMessage(questResult.message);
                    }
                }
            }).catch((error) => {
                console.error('Background sync failed:', error);
            });
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)' }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--accent-teal)', borderTopColor: 'transparent' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading quest...</p>
                </div>
            </main>
        );
    }

    if (!session || prompts.length === 0) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4">
                <Card variant="glass" className="text-center max-w-md">
                    <span className="text-6xl mb-4 block">🔍</span>
                    <h2 className="text-xl font-semibold text-white mb-2">Session Not Found</h2>
                    <p className="text-gray-400 mb-6">
                        This session doesn't exist or hasn't been published yet.
                    </p>
                    <Link href="/library">
                        <Button>Browse Sessions</Button>
                    </Link>
                </Card>
            </main>
        );
    }

    // Quest Complete Screen
    if (isComplete) {
        const accuracy = Math.round((correctCount / prompts.length) * 100);

        // Guest completion: Show Hook or Signup Prompt
        if (isGuest) {
            const guestState = getGuestState();

            return (
                <GuestCompletionHook
                    sessionNumber={sessionNumber}
                    xpEarned={xpGained} // Use the total session earnings
                    totalXP={guestState?.totalXP || xpTotal}
                    wordsLearned={prompts.length}
                    onContinue={() => {
                        // Navigate to next session
                        router.push(`/quest/${sessionNumber + 1}`);
                    }}
                />
            );
        }

        // If completion message exists, show blocked UI
        const isBlocked = !!completionMessage;

        return (
            <main className="min-h-screen flex items-center justify-center px-4">
                <Card variant="glass" className="text-center max-w-lg w-full">
                    <div className="py-8">
                        {isBlocked ? (
                            <>
                                <span className="text-7xl mb-6 block">🚧</span>
                                <h2 className="text-3xl font-bold text-white mb-2">Session Finished</h2>
                                <p className="text-xl text-amber-400 mb-8 font-semibold">But review required!</p>

                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
                                    <p className="text-amber-200 text-lg mb-2">
                                        {completionMessage}
                                    </p>
                                    <p className="text-sm text-amber-400/70">
                                        You must review your mistakes before this session can be marked as complete.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link href="/home">
                                        <Button variant="secondary">Back to Dashboard</Button>
                                    </Link>
                                    <Link href="/review">
                                        <Button>Go to Review Now</Button>
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="text-7xl mb-6 block animate-bounce">🎉</span>
                                <h2 className="text-3xl font-bold text-white mb-2">Quest Complete!</h2>
                                <p className="text-xl text-gray-400 mb-8">{session.title}</p>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)' }}>
                                        <div className="text-3xl font-bold" style={{ color: 'var(--accent-success)' }}>{accuracy}%</div>
                                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Accuracy</div>
                                    </div>
                                    <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)' }}>
                                        <div className="text-3xl font-bold" style={{ color: 'var(--accent-gold)' }}>+{bonusXP}</div>
                                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Bonus XP</div>
                                    </div>
                                    <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)' }}>
                                        <div className="text-3xl font-bold" style={{ color: 'var(--accent-teal)' }}>{prompts.length}</div>
                                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Words</div>
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-8">
                                    <p className="text-emerald-300">
                                        ✓ {prompts.length} words added to your review queue
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link href="/home">
                                        <Button variant="secondary">Back to Home</Button>
                                    </Link>
                                    <Link href="/review">
                                        <Button>Start Review</Button>
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </Card>
            </main>
        );
    }

    // Quest in Progress
    const currentPrompt = prompts[currentIndex];

    return (
        <main className="min-h-screen px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <Link href={isGuest ? "/login" : "/home"} className="text-sm" style={{ color: 'var(--accent-teal)' }}>
                            ← {isGuest ? "Exit" : "Exit Quest"}
                        </Link>
                        <div className="text-sm text-gray-400">
                            {isGuest && <span className="text-amber-400 mr-2">🎁 Free Trial</span>}
                            Session {session.session_number}
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">{session.title}</h1>

                    {/* Progress */}
                    <div className="flex items-center gap-4">
                        <ProgressBar
                            value={currentIndex}
                            max={prompts.length}
                            showLabel
                            label={`Question ${currentIndex + 1} of ${prompts.length}`}
                        />
                    </div>
                </header>

                {/* XP Bar */}
                <div className="mb-8">
                    <XPDisplay
                        xp={xpTotal}
                        level={Math.floor(xpTotal / 500) + 1}
                        xpGained={xpGained}
                        showAnimation={xpGained > 0}
                    />
                </div>

                {/* Quiz Prompt */}
                <QuizPrompt
                    prompt={currentPrompt}
                    onAnswer={handleAnswer}
                />
            </div>
        </main>
    );
}
