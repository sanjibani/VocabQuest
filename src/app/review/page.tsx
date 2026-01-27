'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDueWords, submitReview } from '@/app/actions/review';
import { getUserStats } from '@/app/actions/user';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import XPDisplay from '@/components/game/XPDisplay';
import PronunciationButton from '@/components/ui/PronunciationButton';
import { type ReviewWord } from '@/lib/types';
import { QUALITY_MAP, type QualityButton } from '@/lib/sm2';

export default function ReviewPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [words, setWords] = useState<ReviewWord[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [xpTotal, setXpTotal] = useState(0);
    const [xpGained, setXpGained] = useState(0);
    const [level, setLevel] = useState(1);
    const [reviewedCount, setReviewedCount] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [dueWords, stats] = await Promise.all([
                    getDueWords(20),
                    getUserStats(),
                ]);
                setWords(dueWords);
                setXpTotal(stats?.xpTotal ?? 0);
                setLevel(stats?.level ?? 1);

                if (dueWords.length === 0) {
                    setIsComplete(true);
                }
            } catch (error) {
                console.error('Error loading review data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const handleRating = async (quality: QualityButton) => {
        if (isSubmitting || currentIndex >= words.length) return;

        setIsSubmitting(true);
        const word = words[currentIndex];

        try {
            // Calculate local date (YYYY-MM-DD)
            const localDate = new Date().toLocaleDateString('en-CA');
            const result = await submitReview(word.wordId, QUALITY_MAP[quality], localDate);

            setXpTotal(result.newXpTotal);
            setXpGained(result.xpGained);
            setLevel(Math.floor(result.newXpTotal / 500) + 1);
            setReviewedCount(c => c + 1);

            // Move to next word
            setTimeout(() => {
                setShowAnswer(false);
                setXpGained(0);
                if (currentIndex < words.length - 1) {
                    setCurrentIndex(i => i + 1);
                } else {
                    setIsComplete(true);
                }
                setIsSubmitting(false);
            }, 300);
        } catch (error) {
            console.error('Error submitting review:', error);
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading reviews...</p>
                </div>
            </main>
        );
    }

    // No words due
    if (words.length === 0 && !isComplete) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4">
                <Card variant="glass" className="text-center max-w-md">
                    <span className="text-6xl mb-4 block">✨</span>
                    <h2 className="text-xl font-semibold text-white mb-2">All Caught Up!</h2>
                    <p className="text-gray-400 mb-6">
                        No words are due for review right now. Play a quest to learn new words!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/home">
                            <Button variant="secondary">Back to Home</Button>
                        </Link>
                        <Link href="/library">
                            <Button>Browse Sessions</Button>
                        </Link>
                    </div>
                </Card>
            </main>
        );
    }

    // Review Complete
    if (isComplete) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4">
                <Card variant="glass" className="text-center max-w-lg w-full">
                    <div className="py-8">
                        <span className="text-7xl mb-6 block">🎯</span>
                        <h2 className="text-3xl font-bold text-white mb-2">Review Complete!</h2>
                        <p className="text-xl text-gray-400 mb-8">
                            Great work on your reviews!
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-gray-800/50 rounded-xl p-4">
                                <div className="text-3xl font-bold text-emerald-400">{reviewedCount}</div>
                                <div className="text-sm text-gray-400">Words Reviewed</div>
                            </div>
                            <div className="bg-gray-800/50 rounded-xl p-4">
                                <div className="text-3xl font-bold text-amber-400">{xpTotal}</div>
                                <div className="text-sm text-gray-400">Total XP</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/home">
                                <Button variant="secondary">Back to Home</Button>
                            </Link>
                            <Link href="/library">
                                <Button>Learn More Words</Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </main>
        );
    }

    // Review in Progress
    const currentWord = words[currentIndex];

    return (
        <main className="h-[100dvh] flex flex-col px-4 py-4 md:py-8 overflow-hidden">
            <div className="max-w-2xl mx-auto w-full flex flex-col h-full">
                {/* Header */}
                <header className="flex-none mb-4 md:mb-8">
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                        <Link href="/home" className="text-violet-400 hover:text-violet-300 text-sm">
                            ← Exit Review
                        </Link>
                        <div className="text-sm text-gray-400">
                            Review Mode
                        </div>
                    </div>

                    {/* Progress */}
                    <ProgressBar
                        value={currentIndex + 1}
                        max={words.length}
                        showLabel
                        label={`Word ${currentIndex + 1} of ${words.length}`}
                    />
                </header>

                {/* XP Bar */}
                <div className="flex-none mb-4 md:mb-8">
                    <XPDisplay
                        xp={xpTotal}
                        level={level}
                        xpGained={xpGained}
                        showAnimation={xpGained > 0}
                    />
                </div>

                {/* Flash Card Area - Flex Grow to fill space */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <Card variant="glass" padding="none" className="flex flex-col h-full max-h-full">

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-violet-500/20 scrollbar-track-transparent">
                            {/* Word */}
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-wide text-center sticky top-0 bg-[#12141c]/50 backdrop-blur-sm py-2 z-10">
                                {currentWord.term}
                            </h2>

                            {!showAnswer ? (
                                <div className="flex flex-col items-center justify-center h-[50%]">
                                    <Button
                                        onClick={() => setShowAnswer(true)}
                                        size="lg"
                                        className="min-w-[200px]"
                                    >
                                        Show Answer
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Definition */}
                                    <div className="space-y-6">
                                        {/* Audio Pronunciation within flow */}
                                        <div className="flex justify-center">
                                            <PronunciationButton
                                                word={currentWord.term}
                                                phonetic={currentWord.pronunciation}
                                                autoPlay={true}
                                                className="scale-125"
                                            />
                                        </div>

                                        {currentWord.imageUrl && (
                                            <div className="rounded-lg overflow-hidden shadow-lg border border-white/10 mx-auto max-w-sm">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={currentWord.imageUrl}
                                                    alt={currentWord.term}
                                                    className="w-full h-40 md:h-48 object-cover"
                                                />
                                            </div>
                                        )}

                                        <div className="bg-gray-800/50 rounded-xl p-4 md:p-6">
                                            <div>
                                                <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2 font-semibold">Definition</h3>
                                                <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                                                    {currentWord.definition}
                                                </p>
                                            </div>

                                            {(currentWord as any).etymology && (
                                                <div className="mt-6 bg-violet-950/40 p-4 rounded-xl border border-violet-500/30 text-left">
                                                    <h3 className="text-violet-300 text-sm uppercase tracking-wider mb-3 font-semibold flex items-center gap-2 border-b border-violet-500/20 pb-2">
                                                        <span>🌱</span> Origins
                                                    </h3>
                                                    <p className="text-gray-200 text-base md:text-lg mb-4 leading-relaxed font-light">
                                                        {(currentWord as any).etymology}
                                                    </p>

                                                    {(currentWord as any).rootWords && (currentWord as any).rootWords.length > 0 && (
                                                        <div>
                                                            <h4 className="text-xs text-violet-400 uppercase font-semibold mb-2">Roots:</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {(currentWord as any).rootWords.map((root: string, i: number) => (
                                                                    <span key={i} className="px-3 py-1.5 bg-violet-600/20 text-violet-200 text-xs md:text-sm rounded-lg border border-violet-500/30 shadow-sm">
                                                                        {root}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {currentWord.exampleSentence && (
                                                <div className="mt-6 border-l-2 border-gray-600 pl-4 text-left">
                                                    <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-1">Example</h3>
                                                    <p className="text-gray-400 italic">
                                                        "{currentWord.exampleSentence}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Spacer for scrolling */}
                                        <div className="h-4"></div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer: Rating Buttons */}
                        {showAnswer && (
                            <div className="flex-none p-4 bg-gray-900/40 border-t border-white/5 backdrop-blur-md">
                                <p className="text-sm text-gray-400 mb-2 text-center">How well did you know this?</p>
                                <div className="grid grid-cols-4 gap-2">
                                    <RatingButton
                                        label="Again"
                                        subtitle="Forgot"
                                        color="red"
                                        compact
                                        onClick={() => handleRating('again')}
                                        disabled={isSubmitting}
                                    />
                                    <RatingButton
                                        label="Hard"
                                        subtitle="Difficult"
                                        color="orange"
                                        compact
                                        onClick={() => handleRating('hard')}
                                        disabled={isSubmitting}
                                    />
                                    <RatingButton
                                        label="Good"
                                        subtitle="Got it"
                                        color="emerald"
                                        compact
                                        onClick={() => handleRating('good')}
                                        disabled={isSubmitting}
                                    />
                                    <RatingButton
                                        label="Easy"
                                        subtitle="Too easy"
                                        color="blue"
                                        compact
                                        onClick={() => handleRating('easy')}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </main>
    );
}

function RatingButton({
    label,
    subtitle,
    color,
    onClick,
    disabled,
    compact
}: {
    label: string;
    subtitle: string;
    color: 'red' | 'orange' | 'emerald' | 'blue';
    onClick: () => void;
    disabled?: boolean;
    compact?: boolean;
}) {
    const colorStyles = {
        red: 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-300',
        orange: 'bg-orange-500/20 border-orange-500/50 hover:bg-orange-500/30 text-orange-300',
        emerald: 'bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-300',
        blue: 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30 text-blue-300',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        relative overflow-hidden rounded-xl border-2 transition-all duration-200
        ${compact ? 'p-2 py-3' : 'p-4'}
        ${colorStyles[color]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
      `}
        >
            <div className={`font-bold ${compact ? 'text-sm' : 'text-lg'}`}>{label}</div>
            <div className={`text-xs opacity-70 ${compact ? 'text-[10px]' : ''}`}>{subtitle}</div>
        </button>
    );
}
