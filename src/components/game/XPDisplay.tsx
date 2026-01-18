'use client';

import { useState, useEffect } from 'react';
import { xpProgress } from '@/lib/types';
import styles from './XPDisplay.module.css';

interface XPDisplayProps {
    xp: number;
    level: number;
    xpGained?: number;
    showAnimation?: boolean;
}

const RANKS = [
    { level: 1, title: "Novice" },
    { level: 3, title: "Apprentice" },
    { level: 5, title: "Scholar" },
    { level: 10, title: "Scribe" },
    { level: 15, title: "Polyglot" },
    { level: 20, title: "Lexicon Legend" },
    { level: 30, title: "Word Master" },
    { level: 50, title: "Grand Sage" }
];

function getRankTitle(level: number) {
    // Find the highest rank less than or equal to current level
    const rank = [...RANKS].reverse().find(r => level >= r.level);
    return rank ? rank.title : "Novice";
}

export default function XPDisplay({
    xp,
    level,
    xpGained,
    showAnimation = false
}: XPDisplayProps) {
    const [displayXP, setDisplayXP] = useState(xp);
    const [showGain, setShowGain] = useState(false);
    const progress = xpProgress(displayXP);
    const title = getRankTitle(level);

    useEffect(() => {
        if (xp !== displayXP) {
            // Animate XP increase
            const diff = xp - displayXP;
            const steps = 20;
            const stepSize = diff / steps;
            let current = displayXP;

            const interval = setInterval(() => {
                current += stepSize;
                if ((stepSize > 0 && current >= xp) || (stepSize < 0 && current <= xp)) {
                    setDisplayXP(xp);
                    clearInterval(interval);
                } else {
                    setDisplayXP(Math.round(current));
                }
            }, 30);

            return () => clearInterval(interval);
        }
    }, [xp, displayXP]);

    useEffect(() => {
        if (xpGained && showAnimation) {
            setShowGain(true);
            const timer = setTimeout(() => setShowGain(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [xpGained, showAnimation]);

    const nextRank = RANKS.find(r => r.level > level);
    const levelsToNextRank = nextRank ? nextRank.level - level : 0;

    return (
        <div className="relative">
            {/* XP Gained Animation */}
            {showGain && xpGained && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 animate-bounce z-10">
                    <span className="text-amber-400 font-bold text-2xl drop-shadow-lg">
                        +{xpGained} XP
                    </span>
                </div>
            )}

            <div className="flex items-center gap-5">
                {/* Level Badge */}
                <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex flex-col items-center justify-center shadow-lg shadow-violet-500/30 border border-violet-400/30">
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Level</span>
                        <span className="text-white font-bold text-3xl leading-none mb-1">{level}</span>
                    </div>
                    {/* Rank Indicator */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-500 rounded-full px-2 py-0.5 whitespace-nowrap border-2 border-[#1a1b26]">
                        <span className="text-black text-[10px] font-extrabold uppercase tracking-wide">
                            {title}
                        </span>
                    </div>
                </div>

                {/* Progress Info */}
                <div className="flex-1 min-w-[200px]">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <div className="text-sm text-gray-400 mb-0.5">Current Rank</div>
                            <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                                {title}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-medium text-amber-400">
                                {progress.current} <span className="text-gray-500">/</span> {progress.required} XP
                            </span>
                        </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="h-4 bg-gray-900/50 rounded-full p-1 border border-gray-700/50">
                        <div
                            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full transition-all duration-700 relative overflow-hidden"
                            style={{ width: `${progress.percentage}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                        </div>
                    </div>

                    {/* Footnote */}
                    <div className="flex justify-between mt-2">
                        <span className="text-xs text-gray-500">
                            Total: {displayXP.toLocaleString()} XP
                        </span>
                        {nextRank && (
                            <span className="text-xs text-violet-400">
                                Next Rank: {nextRank.title} (Lv {nextRank.level})
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
