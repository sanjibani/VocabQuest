'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import SessionNode from './SessionNode';

interface Session {
    session_number: number;
    title: string;
    is_completed?: boolean;
    progress?: number;
}

interface JourneyTimelineProps {
    sessions: Session[];
    currentSessionNumber: number;
    totalXP: number;
}

export default function JourneyTimeline({
    sessions: initialSessions,
    currentSessionNumber: initialCurrentSession,
    totalXP
}: JourneyTimelineProps) {
    const router = useRouter();

    // Guest State Handling
    // We defer to client-side state for guests to show unlocked sessions immediately
    const [clientMaxSession, setClientMaxSession] = React.useState<number | null>(null);
    const [clientTotalXP, setClientTotalXP] = React.useState<number | null>(null);

    React.useEffect(() => {
        // Import dynamically to avoid SSR issues with localStorage
        import('@/lib/guestProgress').then(({ getGuestState }) => {
            const guestState = getGuestState();
            if (guestState) {
                setClientMaxSession(guestState.maxCompletedSession);
                setClientTotalXP(guestState.totalXP);
            }
        });
    }, []);

    const effectiveCurrentSession = clientMaxSession
        ? clientMaxSession + 1
        : initialCurrentSession;

    const effectiveTotalXP = clientTotalXP ?? totalXP;

    const handleSessionClick = (sessionNumber: number) => {
        // Prevent clicking locked sessions
        if (sessionNumber > effectiveCurrentSession) return;
        router.push(`/quest/${sessionNumber}`);
    };

    // Calculate mastery progress (total XP / estimated XP needed)
    const masteryProgress = Math.min(100, Math.floor((effectiveTotalXP / 10000) * 100));

    return (
        <div className="flex flex-col items-center py-8 px-4">
            {/* Mastery Progress Header */}
            <div
                className="w-full max-w-md mb-8 p-6 rounded-2xl"
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-card)'
                }}
            >
                <div
                    className="text-xs uppercase tracking-wide mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    MASTERY PROGRESS
                </div>
                <div
                    className="text-4xl font-bold mb-3"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {effectiveTotalXP.toLocaleString()} <span className="text-lg font-normal" style={{ color: 'var(--text-secondary)' }}>XP TOTAL</span>
                </div>

                {/* Progress Bar */}
                <div
                    className="w-full h-3 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-elevated)' }}
                >
                    <div
                        className="h-full transition-all duration-500"
                        style={{
                            width: `${masteryProgress}%`,
                            background: 'linear-gradient(90deg, var(--accent-teal) 0%, var(--accent-success) 100%)'
                        }}
                    />
                </div>
            </div>

            {/* Session Timeline */}
            <div className="flex flex-col items-center space-y-0">
                {initialSessions.map((session, index) => {
                    const isCurrent = session.session_number === effectiveCurrentSession;
                    // session is completed if explicitly marked OR if it's less than current pointer
                    const isCompleted = session.is_completed || session.session_number < effectiveCurrentSession;
                    const isLocked = session.session_number > effectiveCurrentSession;
                    const progress = session.progress || 0;

                    return (
                        <SessionNode
                            key={session.session_number}
                            sessionNumber={session.session_number}
                            title={session.title}
                            isCurrent={isCurrent}
                            isCompleted={isCompleted}
                            isLocked={isLocked}
                            progress={progress}
                            onSessionClick={() => handleSessionClick(session.session_number)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
