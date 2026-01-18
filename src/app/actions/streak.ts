'use server';

import { createClient } from '@/lib/supabase/server';
import { type StreakData, type MilestoneReward, MILESTONES } from '@/lib/streak';
import { logger } from '@/lib/logger';

// Re-export types so we don't break existing imports if any


/**
 * Get current streak data for the user
 */
export async function getStreakData(): Promise<StreakData | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from('user_profile')
        .select('streak_current, streak_longest, last_activity_date, character_stage, streak_freezes')
        .eq('user_id', user.id)
        .single();

    if (!profile) return null;

    // Check if today is already completed
    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = profile.last_activity_date === today;

    return {
        currentStreak: profile.streak_current ?? 0,
        longestStreak: profile.streak_longest ?? 0,
        characterStage: profile.character_stage ?? 1,
        lastActivityDate: profile.last_activity_date,
        streakFreezes: profile.streak_freezes ?? 0,
        todayCompleted
    };
}

/**
 * Record daily activity and update streak
 * Returns milestone reward if user just hit one
 */
export async function recordActivity(
    type: 'session' | 'review'
): Promise<{ streak: StreakData; milestone?: MilestoneReward } | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const today = new Date().toISOString().split('T')[0];

    // 1. Update daily activity log
    const { data: existingActivity } = await supabase
        .from('user_daily_activity')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_date', today)
        .single();

    if (existingActivity) {
        // Update existing
        const update = type === 'session'
            ? { sessions_completed: existingActivity.sessions_completed + 1 }
            : { reviews_completed: existingActivity.reviews_completed + 1 };

        await supabase
            .from('user_daily_activity')
            .update(update)
            .eq('user_id', user.id)
            .eq('activity_date', today);
    } else {
        // Insert new
        await supabase
            .from('user_daily_activity')
            .insert({
                user_id: user.id,
                activity_date: today,
                sessions_completed: type === 'session' ? 1 : 0,
                reviews_completed: type === 'review' ? 1 : 0,
                xp_earned: 0
            });
    }

    // 2. Update streak
    const { data: profile } = await supabase
        .from('user_profile')
        .select('streak_current, streak_longest, last_activity_date, character_stage, streak_freezes')
        .eq('user_id', user.id)
        .single();

    if (!profile) return null;

    const lastDate = profile.last_activity_date;
    let newStreak = profile.streak_current ?? 0;
    let newLongest = profile.streak_longest ?? 0;
    let newStage = profile.character_stage ?? 1;
    let milestone: MilestoneReward | undefined;

    // Calculate streak
    if (lastDate === today) {
        // Already counted today, no change
    } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDate === yesterdayStr) {
            // Consecutive day!
            newStreak += 1;
        } else {
            // Streak broken or first day
            newStreak = 1;
        }

        // Update longest
        if (newStreak > newLongest) {
            newLongest = newStreak;
        }

        // Check milestones
        for (const m of MILESTONES) {
            if (newStreak === m.days && newStage < m.stage) {
                newStage = m.stage;
                milestone = {
                    type: 'evolution',
                    name: m.badge,
                    description: `You've reached a ${m.days}-day streak!`,
                    newStage: m.stage
                };
                break;
            }
        }

        // Update profile
        const { error: updateError } = await supabase
            .from('user_profile')
            .update({
                streak_current: newStreak,
                streak_longest: newLongest,
                last_activity_date: today,
                character_stage: newStage
            })
            .eq('user_id', user.id);
    }

    return {
        streak: {
            currentStreak: newStreak,
            longestStreak: newLongest,
            characterStage: newStage,
            lastActivityDate: today,
            streakFreezes: profile.streak_freezes ?? 0,
            todayCompleted: true
        },
        milestone
    };
}
