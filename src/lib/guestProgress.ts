'use client';

/**
 * Guest Progress Utility
 * Manages localStorage for guest trial sessions before signup
 */

const GUEST_PROGRESS_KEY = 'vocabquest_guest_progress';

export interface GuestWordState {
    wordId: string;
    term: string;
    isCorrect: boolean;
}

export interface GuestSessionProgress {
    sessionNumber: number;
    xpEarned: number;
    wordsCompleted: GuestWordState[];
    completedAt: string;
    correctCount: number;
    totalCount: number;
}

// New holistic state for multi-session guest play
export interface GuestState {
    sessions: Record<number, GuestSessionProgress>;
    totalXP: number;
    maxCompletedSession: number;
    totalWordsLearned: number;
}

/**
 * Save guest progress to localStorage
 * Merges new session progress with existing state
 */
export function saveGuestProgress(sessionProgress: GuestSessionProgress): void {
    if (typeof window === 'undefined') return;

    try {
        const currentState = getGuestState() || {
            sessions: {},
            totalXP: 0,
            maxCompletedSession: 0,
            totalWordsLearned: 0
        };

        // Update or add the session
        currentState.sessions[sessionProgress.sessionNumber] = sessionProgress;

        // Recalculate totals
        const sessions = Object.values(currentState.sessions);
        currentState.totalXP = sessions.reduce((sum, s) => sum + s.xpEarned, 0);
        currentState.totalWordsLearned = sessions.reduce((sum, s) => sum + s.wordsCompleted.length, 0);
        currentState.maxCompletedSession = Math.max(
            currentState.maxCompletedSession,
            sessionProgress.sessionNumber
        );

        localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(currentState));
    } catch (e) {
        console.error('Failed to save guest progress:', e);
    }
}

/**
 * Get full guest state
 */
export function getGuestState(): GuestState | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem(GUEST_PROGRESS_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored);

        // Migration check: If it's the old format (doesn't have 'sessions' key)
        if (!parsed.sessions && parsed.sessionNumber) {
            const oldProgress = parsed as GuestSessionProgress;
            return {
                sessions: { [oldProgress.sessionNumber]: oldProgress },
                totalXP: oldProgress.xpEarned,
                maxCompletedSession: oldProgress.sessionNumber,
                totalWordsLearned: oldProgress.wordsCompleted.length
            };
        }

        return parsed as GuestState;
    } catch (e) {
        console.error('Failed to load guest progress:', e);
        return null;
    }
}

/**
 * Get specific session progress
 */
export function getGuestSessionProgress(sessionNumber: number): GuestSessionProgress | null {
    const state = getGuestState();
    return state?.sessions[sessionNumber] || null;
}

/**
 * Clear guest progress from localStorage (call after sync)
 */
export function clearGuestProgress(): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(GUEST_PROGRESS_KEY);
    } catch (e) {
        console.error('Failed to clear guest progress:', e);
    }
}

/**
 * Check if there is pending guest progress to sync
 */
export function hasGuestProgress(): boolean {
    return getGuestState() !== null;
}
