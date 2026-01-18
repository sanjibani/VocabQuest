'use server';

import {
    type ReviewWord,
    type DbUserWordState,
    XP_AWARDS,
    type BookData
} from '@/lib/types';
import { type Quality, processReview, DEFAULT_SM2_STATE } from '@/lib/sm2';
import { promises as fs } from 'fs';
import path from 'path';
import { updateXP } from './user';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// Helper to read local book data 
async function getLocalBookData(): Promise<BookData> {
    const bookPath = path.join(process.cwd(), 'content/wpmae/book.json');
    const content = await fs.readFile(bookPath, 'utf-8');
    return JSON.parse(content);
}

/**
 * Get due words (Supabase)
 */
/**
 * Get due words (Supabase)
 */
export async function getDueWords(limit: number = 20): Promise<ReviewWord[]> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const now = new Date().toISOString();

        // Fetch due states AND the related word data in one query
        const { data: dueItems, error } = await supabase
            .from('user_word_state')
            .select(`
                *,
                words:word_id (*)
            `)
            .eq('user_id', user.id)
            .lte('due_at', now)
            .limit(limit);

        if (error) {
            console.error('Error fetching due words:', error);
            return [];
        }

        if (!dueItems || dueItems.length === 0) return [];

        // Map to ReviewWord
        return dueItems.map((item: any) => {
            const w = item.words;
            return {
                wordId: w.id, // Use UUID from DB
                term: w.term,
                definition: w.definition,
                exampleSentence: w.example_sentence,
                imageUrl: w.image_url,
                etymology: w.etymology,
                rootWords: w.root_words,
                pronunciation: w.pronunciation,
                partOfSpeech: w.part_of_speech,
                wordState: {
                    user_id: item.user_id,
                    word_id: item.word_id,
                    repetitions: item.repetitions,
                    interval_days: item.interval_days,
                    ease_factor: item.ease_factor,
                    due_at: item.due_at,
                    last_reviewed_at: item.last_reviewed_at,
                    lapses: item.lapses,
                    created_at: item.created_at
                } as DbUserWordState
            };
        });

    } catch (e) {
        console.error('Error loading due words:', e);
        return [];
    }
}

/**
 * Submit review (Supabase Persistence)
 */
export async function submitReview(
    wordId: string,
    quality: Quality
): Promise<{
    newState: DbUserWordState;
    xpGained: number;
    newXpTotal: number;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Get current state
    const { data: currentState } = await supabase
        .from('user_word_state')
        .select('*')
        .eq('user_id', user.id)
        .eq('word_id', wordId)
        .single();

    if (!currentState) throw new Error('Word state not found');

    const currentSM2 = {
        repetitions: currentState.repetitions,
        intervalDays: currentState.interval_days,
        easeFactor: currentState.ease_factor,
        dueAt: currentState.due_at ? new Date(currentState.due_at) : null,
        lastReviewedAt: currentState.last_reviewed_at ? new Date(currentState.last_reviewed_at) : null,
        lapses: currentState.lapses
    };

    // 2. Calculate New State
    const newStateSM2 = processReview(currentSM2, quality);

    // 3. Update DB
    const { data: updatedState, error } = await supabase
        .from('user_word_state')
        .update({
            repetitions: newStateSM2.repetitions,
            interval_days: newStateSM2.intervalDays,
            ease_factor: newStateSM2.easeFactor,
            due_at: newStateSM2.dueAt?.toISOString(),
            last_reviewed_at: newStateSM2.lastReviewedAt?.toISOString(),
            lapses: newStateSM2.lapses
        })
        .eq('user_id', user.id)
        .eq('word_id', wordId)
        .select()
        .single();

    if (error) throw error;

    const isCorrect = quality >= 3;
    const xpGained = isCorrect ? XP_AWARDS.CORRECT_ANSWER : XP_AWARDS.INCORRECT_ANSWER;
    const profile = await updateXP(xpGained);

    logger.info('review.submitReview', 'Review submitted', { userId: user.id, wordId, quality, xpGained });

    return {
        newState: {
            user_id: user.id,
            word_id: wordId,
            repetitions: updatedState.repetitions,
            interval_days: updatedState.interval_days,
            ease_factor: updatedState.ease_factor,
            due_at: updatedState.due_at,
            last_reviewed_at: updatedState.last_reviewed_at,
            lapses: updatedState.lapses,
            created_at: ''
        } as DbUserWordState,
        xpGained,
        newXpTotal: profile?.xp_total ?? 0,
    };
}

/**
 * Get review stats (Supabase)
 */
export async function getReviewStats(): Promise<{
    dueCount: number;
    reviewedToday: number;
    totalWords: number;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { dueCount: 0, reviewedToday: 0, totalWords: 0 };

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Due Count
    const { count: dueCount } = await supabase
        .from('user_word_state')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lte('due_at', now.toISOString());

    // Reviewed Today
    const { count: reviewedToday } = await supabase
        .from('user_word_state')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('last_reviewed_at', startOfDay);

    // Total Words
    const { count: totalWords } = await supabase
        .from('user_word_state')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    return {
        dueCount: dueCount ?? 0,
        reviewedToday: reviewedToday ?? 0,
        totalWords: totalWords ?? 0,
    };
}
