'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { hasGuestProgress } from '@/lib/guestProgress';
import { syncGuestProgress } from '@/app/actions/guest';

/**
 * Client component that syncs guest progress after login
 * Rendered on Home page but invisible - just handles the sync logic
 */
export default function GuestProgressSync() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [syncing, setSyncing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const shouldSync = searchParams.get('syncGuest') === 'true';

        if (shouldSync && hasGuestProgress() && !syncing) {
            setSyncing(true);

            // Import dynamically to get the full state
            import('@/lib/guestProgress').then(async ({ getGuestState, clearGuestProgress }) => {
                const guestState = getGuestState();

                if (!guestState || !guestState.sessions) {
                    setSyncing(false);
                    return;
                }

                try {
                    // Sync each session sequentially
                    const sessions = Object.values(guestState.sessions);

                    for (const session of sessions) {
                        const result = await syncGuestProgress({
                            sessionNumber: session.sessionNumber,
                            xpEarned: session.xpEarned,
                            wordsCompleted: session.wordsCompleted,
                            completedAt: session.completedAt,
                            correctCount: session.correctCount,
                            totalCount: session.totalCount
                        });

                        if (!result.success) {
                            console.error(`Failed to sync session ${session.sessionNumber}:`, result.message);
                            // We continue trying to sync others even if one fails
                        }
                    }

                    clearGuestProgress();
                    setShowSuccess(true);

                    // Remove query param and refresh to show updated data
                    setTimeout(() => {
                        router.replace('/home');
                        router.refresh();
                    }, 2000);

                } catch (error) {
                    console.error('Error syncing guest progress:', error);
                    setSyncing(false);
                }
            });
        }
    }, [searchParams, syncing, router]);

    // Show syncing indicator
    if (syncing && !showSuccess) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center max-w-sm mx-4">
                    <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Syncing Your Progress</h3>
                    <p className="text-gray-400">Saving your session to your new account...</p>
                </div>
            </div>
        );
    }

    // Show success message
    if (showSuccess) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-8 text-center max-w-sm mx-4">
                    <span className="text-6xl mb-4 block">🎉</span>
                    <h3 className="text-xl font-bold text-white mb-2">Progress Saved!</h3>
                    <p className="text-emerald-400">Your trial session has been added to your account.</p>
                </div>
            </div>
        );
    }

    return null;
}
