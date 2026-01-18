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

    useEffect(() => {
        async function loadSessionAndStats() {
            try {
                // Parallel fetch for session and user stats
                const [sessionData, stats] = await Promise.all([
                    getSessionByNumber(sessionNumber),
                    getUserStats()
                ]);

                if (sessionData) {
                    setSession(sessionData.session);
                    setPrompts(sessionData.prompts);
                }

                if (stats) {
                    setXpTotal(stats.xpTotal);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadSessionAndStats();
    }, [sessionNumber]);

    const handleAnswer = async (selectedAnswer: string, isCorrect: boolean) => {
        const prompt = prompts[currentIndex];

        // Submit answer and get XP
        try {
            const result = await submitQuestAnswer(prompt.wordId, isCorrect);
            setXpTotal(result.newXpTotal);
            setXpGained(result.xpGained);

            if (isCorrect) {
                setCorrectCount(c => c + 1);
            }

            // Move to next prompt or complete
            setTimeout(() => {
                if (currentIndex < prompts.length - 1) {
                    setCurrentIndex(i => i + 1);
                    setXpGained(0);
                } else {
                    handleComplete();
                }
            }, 200);
        } catch (error) {
            console.error('Error submitting answer:', error);
        }
    };

    const handleComplete = async () => {
        if (!session) return;

        try {
            const result = await completeQuest(session.id);
            setBonusXP(result.bonusXP);
            setXpTotal(result.newXpTotal);

            if (!result.success && result.message) {
                setCompletionMessage(result.message);
            }

            // Record activity for streak
            await recordActivity('session');

            setIsComplete(true);
        } catch (error) {
            console.error('Error completing quest:', error);
            setIsComplete(true);
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading quest...</p>
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

        // If completion message exists, it means the user was blocked from completing the session
        // due to pending mistakes. Show a different UI.
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
                                    <div className="bg-gray-800/50 rounded-xl p-4">
                                        <div className="text-3xl font-bold text-emerald-400">{accuracy}%</div>
                                        <div className="text-sm text-gray-400">Accuracy</div>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-xl p-4">
                                        <div className="text-3xl font-bold text-amber-400">+{bonusXP}</div>
                                        <div className="text-sm text-gray-400">Bonus XP</div>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-xl p-4">
                                        <div className="text-3xl font-bold text-violet-400">{prompts.length}</div>
                                        <div className="text-sm text-gray-400">Words</div>
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
                        <Link href="/home" className="text-violet-400 hover:text-violet-300 text-sm">
                            ← Exit Quest
                        </Link>
                        <div className="text-sm text-gray-400">
                            Session {session.session_number}
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">{session.title}</h1>

                    {/* Progress */}
                    <div className="flex items-center gap-4">
                        <ProgressBar
                            value={currentIndex + 1}
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
