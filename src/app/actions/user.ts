'use server';

import { type DbUserProfile, type UserStats } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Get or create profile (Supabase)
 */
export async function getOrCreateProfile(): Promise<DbUserProfile | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Try to get profile
    const { data: profile } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

    // If profile exists, return it
    if (profile) return profile;

    // Fallback: If no profile (trigger delay or failure), create one manually
    // This ensures robustness so the user never sees a broken state
    const newProfile = {
        user_id: user.id,
        xp_total: 0,
        level: 1,
        created_at: new Date().toISOString()
    };

    const { data: inserted, error } = await supabase
        .from('user_profile')
        .insert(newProfile)
        .select()
        .single();

    if (error) {
        // If race condition (already exists), try fetch again
        if (error.code === '23505') {
            const { data: retry } = await supabase
                .from('user_profile')
                .select('*')
                .eq('user_id', user.id)
                .single();
            return retry;
        }
        logger.error('user.getOrCreateProfile', 'Failed to create user profile', error, { userId: user.id });
        return null;
    }

    return inserted;
}

/**
 * Update XP (Supabase)
 */
export async function updateXP(amount: number): Promise<DbUserProfile | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Get current XP
    // Get current profile (ensure it exists)
    const profile = await getOrCreateProfile();

    const currentXp = profile?.xp_total ?? 0;
    const newXp = currentXp + amount;
    const newLevel = Math.floor(newXp / 500) + 1;

    const { data: updated, error } = await supabase
        .from('user_profile')
        .update({ xp_total: newXp, level: newLevel })
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) {
        logger.error('user.updateXP', 'Failed to update XP', error, { userId: user.id, xpChange: amount });
        return null;
    }

    logger.info('user.updateXP', 'XP updated successfully', { userId: user.id, xpChange: amount, newTotal: newXp, newLevel });
    return updated;
}

/**
 * Get User Stats (Supabase)
 */
export async function getUserStats(): Promise<UserStats | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Parallelize queries for performance
    const [profileResult, sessionsResult, reviewResult, totalWordsResult] = await Promise.all([
        // 1. Profile
        supabase
            .from('user_profile')
            .select('*')
            .eq('user_id', user.id)
            .single(),

        // 2. Completed Sessions
        supabase
            .from('user_session_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),

        // 3. Due Reviews
        supabase
            .from('user_word_state')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .lte('due_at', new Date().toISOString()),

        // 4. Total Words Learned
        supabase
            .from('user_word_state')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
    ]);

    const profile = profileResult.data;
    const sessionsCount = sessionsResult.count;
    const reviewCount = reviewResult.count;
    const totalWordsCount = totalWordsResult.count;

    // Extract metadata from auth user
    const { full_name, avatar_url } = user.user_metadata || {};

    return {
        xpTotal: profile?.xp_total ?? 0,
        level: profile?.level ?? 1,
        dueReviewCount: reviewCount ?? 0,
        completedSessions: sessionsCount ?? 0,
        fullName: full_name,
        avatarUrl: avatar_url,
        totalWordsLearned: totalWordsCount ?? 0,
        currentStreak: profile?.streak_current ?? 0
    };
}
