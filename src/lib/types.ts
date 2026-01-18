/**
 * Type definitions for VocabQuest application
 */

// ============================================
// Content Types (from book.json)
// ============================================

export interface BookWord {
    term: string;
    definition: string;
    exampleSentence?: string;
    imageUrl?: string;
    tags?: string[];
}

export interface ExerciseItem {
    wordTerm: string;
    question: string;
    correctAnswer: string;
    choices: string[];
}

export interface Exercise {
    type: 'mcq_definition' | 'fill_blank' | 'matching';
    items: ExerciseItem[];
}

export interface BookSession {
    sessionNumber: number;
    title: string;
    words: BookWord[];
    exercises: Exercise[];
}

export interface BookChapter {
    chapterNumber: number;
    title: string;
    sessions: BookSession[];
}

export interface BookData {
    bookId: string;
    title: string;
    chapters: BookChapter[];
}

// ============================================
// Database Types
// ============================================

export interface DbBook {
    id: string;
    title: string;
    created_at: string;
}

export interface DbChapter {
    id: string;
    book_id: string;
    chapter_number: number;
    title: string;
    created_at: string;
}

export interface DbSession {
    id: string;
    book_id: string;
    chapter_id: string;
    session_number: number;
    title: string;
    is_published: boolean;
    created_at: string;
}

export interface DbWord {
    id: string;
    book_id: string;
    session_id: string;
    term: string;
    definition: string;
    example_sentence: string | null;
    image_url?: string | null;
    tags: string[] | null;
    etymology?: string;
    root_words?: string[];
    part_of_speech?: string;
    pronunciation?: string;
    order_index: number;
    created_at: string;
}

export interface DbExerciseItem {
    id: string;
    book_id: string;
    session_id: string;
    type: string;
    payload: {
        wordTerm: string;
        question: string;
        correctAnswer: string;
        choices: string[];
    };
    order_index: number;
    created_at: string;
}

export interface DbUserProfile {
    user_id: string;
    xp_total: number;
    level: number;
    created_at: string;
}

export interface DbUserSessionProgress {
    user_id: string;
    session_id: string;
    completed_at: string | null;
    created_at: string;
}

export interface DbUserWordState {
    user_id: string;
    word_id: string;
    repetitions: number;
    interval_days: number;
    ease_factor: number;
    due_at: string | null;
    last_reviewed_at: string | null;
    lapses: number;
    created_at: string;
}

// ============================================
// UI Types
// ============================================

export interface QuestPrompt {
    id: string;
    type: 'mcq_definition' | 'fill_blank';
    wordId: string;
    wordTerm: string;
    question: string;
    correctAnswer: string;
    choices: string[];
}

export interface ReviewWord {
    wordId: string;
    term: string;
    definition: string;
    exampleSentence: string | null;
    imageUrl?: string;
    etymology?: string;
    rootWords?: string[];
    wordState: DbUserWordState;
}

export interface SessionWithChapter extends DbSession {
    chapter: DbChapter;
}

export interface UserStats {
    xpTotal: number;
    level: number;
    dueReviewCount: number;
    completedSessions: number;
    fullName?: string;
    avatarUrl?: string;
    totalWordsLearned?: number;
}

// ============================================
// Leveling
// ============================================

export function calculateLevel(xp: number): number {
    return Math.floor(xp / 500) + 1;
}

export function xpForNextLevel(currentLevel: number): number {
    return currentLevel * 500;
}

export function xpProgress(xp: number): { current: number; required: number; percentage: number } {
    const level = calculateLevel(xp);
    const xpInCurrentLevel = xp - (level - 1) * 500;
    const required = 500;
    return {
        current: xpInCurrentLevel,
        required,
        percentage: (xpInCurrentLevel / required) * 100,
    };
}

// ============================================
// XP Awards
// ============================================

export const XP_AWARDS = {
    CORRECT_ANSWER: 10,
    INCORRECT_ANSWER: 2,
    SESSION_COMPLETION: 50,
} as const;
