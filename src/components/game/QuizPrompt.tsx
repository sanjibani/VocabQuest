'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { type QuestPrompt } from '@/lib/types';

interface QuizPromptProps {
    prompt: QuestPrompt;
    onAnswer: (selectedAnswer: string, isCorrect: boolean) => void;
    disabled?: boolean;
}

export default function QuizPrompt({ prompt, onAnswer, disabled }: QuizPromptProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);

    const handleSelect = (choice: string) => {
        if (disabled || showResult) return;

        setSelectedAnswer(choice);
        setShowResult(true);

        const isCorrect = choice === prompt.correctAnswer;

        // Delay callback to show feedback
        setTimeout(() => {
            onAnswer(choice, isCorrect);
            setSelectedAnswer(null);
            setShowResult(false);
        }, 1200);
    };

    const getChoiceStyle = (choice: string) => {
        if (!showResult || selectedAnswer !== choice) {
            if (showResult && choice === prompt.correctAnswer) {
                return 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
            }
            return selectedAnswer === choice
                ? 'border-violet-500 bg-violet-500/20'
                : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50';
        }

        if (choice === prompt.correctAnswer) {
            return 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
        }
        return 'border-red-500 bg-red-500/20 text-red-300';
    };

    return (
        <Card variant="glass" padding="lg" className="w-full max-w-2xl mx-auto">
            {/* Question Type Badge */}
            <div className="flex items-center gap-2 mb-4">
                <span className={`
          px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
          ${prompt.type === 'mcq_definition'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }
        `}>
                    {prompt.type === 'mcq_definition' ? 'Multiple Choice' : 'Fill in the Blank'}
                </span>
            </div>

            {/* Question */}
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-6 leading-relaxed">
                {prompt.question}
            </h2>

            {/* Choices */}
            <div className="grid gap-3">
                {prompt.choices.map((choice, index) => (
                    <button
                        key={choice}
                        onClick={() => handleSelect(choice)}
                        disabled={disabled || showResult}
                        className={`
              w-full p-4 rounded-xl border-2 text-left
              transition-all duration-200 ease-out
              ${getChoiceStyle(choice)}
              ${disabled || showResult ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${selectedAnswer === choice && showResult
                                    ? choice === prompt.correctAnswer
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-red-500 text-white'
                                    : 'bg-gray-700 text-gray-300'
                                }
              `}>
                                {String.fromCharCode(65 + index)}
                            </span>
                            <span className="text-lg font-medium">{choice}</span>

                            {showResult && choice === prompt.correctAnswer && (
                                <svg className="w-6 h-6 ml-auto text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {showResult && selectedAnswer === choice && choice !== prompt.correctAnswer && (
                                <svg className="w-6 h-6 ml-auto text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Feedback */}
            {showResult && (
                <div className={`
          mt-6 p-4 rounded-xl text-center
          ${selectedAnswer === prompt.correctAnswer
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }
        `}>
                    <p className={`text-lg font-semibold ${selectedAnswer === prompt.correctAnswer ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                        {selectedAnswer === prompt.correctAnswer ? '✓ Correct!' : '✗ Incorrect'}
                    </p>
                    {selectedAnswer !== prompt.correctAnswer && (
                        <p className="text-gray-400 mt-1">
                            The correct answer is <strong className="text-emerald-400">{prompt.correctAnswer}</strong>
                        </p>
                    )}
                </div>
            )}
        </Card>
    );
}
