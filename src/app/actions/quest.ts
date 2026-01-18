'use server';

import {
    type DbSession,
    type DbWord,
    type QuestPrompt,
    XP_AWARDS,
    type BookSession,
    type BookChapter,
    type Exercise,
    type ExerciseItem
} from '@/lib/types';
import { updateXP, getUserStats } from './user';
import { createClient } from '@/lib/supabase/server';
import { sm2Update } from '@/lib/sm2';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

/**
 * Get session by session number (DB Version)
 */
export async function getSessionByNumber(sessionNumber: number): Promise<{
    session: DbSession;
    words: DbWord[];
    prompts: QuestPrompt[];
} | null> {
    try {
        const supabase = await createClient();

        // 1. Get Session
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('*')
            .eq('session_number', sessionNumber)
            .single();

        if (sessionError || !session) {
            console.error('Error fetching session:', sessionError);
            return null;
        }

        // 2. Get Words for Session
        const { data: words, error: wordsError } = await supabase
            .from('words')
            .select('*')
            .eq('session_id', session.id);

        if (wordsError) {
            console.error('Error fetching words:', wordsError);
            return null;
        }

        // 3. Get Exercises/Prompts
        const { data: exerciseItems, error: exerciseError } = await supabase
            .from('exercise_items')
            .select('*')
            .eq('session_id', session.id)
            .order('order_index');

        if (exerciseError) {
            console.error('Error fetching exercises:', exerciseError);
            return null;
        }

        // Map exercise items back to QuestPrompt structure
        let prompts: QuestPrompt[] = exerciseItems.map(item => {
            const payload = item.payload as any; // Cast as any if type is JSONB
            // Find matching word ID for linking
            const word = words.find(w => w.term === payload.wordTerm);
            return {
                id: item.id,
                type: item.type as 'mcq_definition' | 'fill_blank',
                wordId: word?.id ?? '', // Best effort link
                wordTerm: payload.wordTerm,
                question: payload.question,
                correctAnswer: payload.correctAnswer,
                choices: payload.choices
            };
        });

        // 4. Dynamic Prompt Generation (Fallback)
        // If no curated exercises exist, generate them from the words/definitions
        if (prompts.length === 0 && words.length > 0) {
            prompts = words.map(targetWord => {
                // Select 3 distractors from other words in the session
                const otherWords = words.filter(w => w.id !== targetWord.id);
                const distractors = shuffleArray(otherWords)
                    .slice(0, 3)
                    .map(w => w.term);

                // Combine and shuffle choices
                const choices = shuffleArray([targetWord.term, ...distractors]);

                return {
                    id: `auto-${targetWord.id}`,
                    type: 'mcq_definition',
                    wordId: targetWord.id,
                    wordTerm: targetWord.term,
                    // Use definition as question
                    question: `What matches this definition: "${targetWord.definition}"?`,
                    correctAnswer: targetWord.term,
                    choices: choices
                };
            });
        }

        return {
            session: session as DbSession,
            words: words as DbWord[],
            prompts
        };

    } catch (error) {
        console.error('Error loading session from DB:', error);
        return null;
    }
}

/**
 * Submit answer (Supabase Persistence)
 */
export async function submitQuestAnswer(
    wordId: string,
    isCorrect: boolean
): Promise<{ xpGained: number; newXpTotal: number }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // XP
    const xpGained = isCorrect ? XP_AWARDS.CORRECT_ANSWER : XP_AWARDS.INCORRECT_ANSWER;
    const profile = await updateXP(xpGained);

    if (user) {
        // Init Word State if needed
        const { data: existingState } = await supabase
            .from('user_word_state')
            .select('*')
            .eq('user_id', user.id)
            .eq('word_id', wordId)
            .single();

        if (!existingState) {
            // Initial SM-2 State
            // If Correct: Interval 1 day
            // If Incorrect: Interval 0
            const initialInterval = isCorrect ? 1 : 0;
            const dueAt = new Date();
            if (isCorrect) dueAt.setDate(dueAt.getDate() + 1);

            await supabase.from('user_word_state').insert({
                user_id: user.id,
                word_id: wordId,
                repetitions: isCorrect ? 1 : 0,
                interval_days: initialInterval,
                ease_factor: 2.5,
                due_at: dueAt.toISOString(),
                lapses: isCorrect ? 0 : 1
            });
        } else {
            // Update existing state
            await supabase.from('user_word_state').update({
                last_reviewed_at: new Date().toISOString(),
                repetitions: existingState.repetitions + 1
            }).eq('user_id', user.id).eq('word_id', wordId);
        }
    }

    return {
        xpGained,
        newXpTotal: profile?.xp_total ?? 0
    };
}

/**
 * Complete Quest (Supabase Persistence)
 */
export async function completeQuest(sessionId: string): Promise<{
    bonusXP: number;
    newXpTotal: number;
    success: boolean;
    message?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const bonusXP = XP_AWARDS.SESSION_COMPLETION;

    if (!user) return { bonusXP: 0, newXpTotal: 0, success: false };

    // 1. Check if there are any pending reviews for this session
    // Get all words for this session
    const { data: sessionWords } = await supabase
        .from('words')
        .select('id')
        .eq('session_id', sessionId);

    if (sessionWords && sessionWords.length > 0) {
        const wordIds = sessionWords.map(w => w.id);

        // Count how many are due or have repetitions=0 (never got it right)
        // Actually, if they just answered it incorrectly, repetitions might be 0 or lapses > 0.
        // But due_at <= now is the best indicator of "needs work".
        const now = new Date().toISOString();

        const { count } = await supabase
            .from('user_word_state')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .in('word_id', wordIds)
            .lte('due_at', now);

        if (count && count > 0) {
            // Cannot complete!
            const profile = await getUserStats();
            return {
                bonusXP: 0,
                newXpTotal: profile?.xpTotal ?? 0,
                success: false,
                message: `You have ${count} words to review before completing this session.`
            };
        }
    }

    // 2. Mark session as complete (Idempotent insert)
    const { error } = await supabase
        .from('user_session_progress')
        .insert({
            user_id: user.id,
            session_id: sessionId,
            completed_at: new Date().toISOString()
        })
        .select()
        .single();

    // Ignore duplicate key error (already completed)
    if (error && error.code !== '23505') {
        console.error('Error marking session complete:', error);
    }

    // 3. Award XP
    const profile = await updateXP(bonusXP);

    logger.info('quest.completeQuest', 'Session completed successfully', { userId: user.id, sessionId, bonusXP });
    revalidatePath('/home');

    return {
        bonusXP,
        newXpTotal: profile?.xp_total ?? 0,
        success: true
    };
}

/**
 * Get next session (Supabase)
 */
export async function getNextSession(): Promise<DbSession | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let completedSessionIds: string[] = [];

        if (user) {
            const { data } = await supabase
                .from('user_session_progress')
                .select('session_id')
                .eq('user_id', user.id);

            if (data) completedSessionIds = data.map(s => s.session_id);
        }

        // Get all sessions ordered by session number
        const { data: allSessions } = await supabase
            .from('sessions')
            .select('*')
            .order('session_number', { ascending: true });

        if (!allSessions) return null;

        // Find first incomplete
        const nextSession = allSessions.find(s => !completedSessionIds.includes(s.id));

        return nextSession || null;

    } catch (e) {
        console.error('Error getting next session', e);
        return null;
    }
}

/**
 * Get Library Sessions (DB Version)
 */
export async function getLibrarySessions(): Promise<{
    chapters: Array<{
        id: string;
        title: string;
        chapterNumber: number;
        sessions: (DbSession & { isCompleted: boolean })[];
    }>;
}> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Get Completed IDs
        let completedSessionIds: string[] = [];
        if (user) {
            const { data } = await supabase
                .from('user_session_progress')
                .select('session_id')
                .eq('user_id', user.id);
            if (data) completedSessionIds = data.map(s => s.session_id);
        }

        // Get Chapters
        const { data: chapters, error: chapterError } = await supabase
            .from('chapters')
            .select('*')
            .order('chapter_number');

        if (chapterError) throw chapterError;

        // Get Sessions
        const { data: sessions, error: sessionError } = await supabase
            .from('sessions')
            .select('*')
            .order('session_number');

        if (sessionError) throw sessionError;

        // Group Sessions by Chapter
        const resultChapters = chapters.map(ch => {
            const chapterSessions = sessions.filter(s => s.chapter_id === ch.id);
            return {
                id: ch.id,
                title: ch.title,
                chapterNumber: ch.chapter_number,
                sessions: chapterSessions.map(s => ({
                    ...s,
                    isCompleted: completedSessionIds.includes(s.id)
                }))
            };
        });

        return { chapters: resultChapters };
    } catch (error) {
        console.error('Error loading library from DB:', error);
        return { chapters: [] };
    }
}

// Helper to shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}
