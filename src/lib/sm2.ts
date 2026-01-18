/**
 * SM-2 Spaced Repetition Algorithm
 * 
 * Implementation based on the original SuperMemo SM-2 algorithm.
 * Reference: https://super-memory.com/english/ol/sm2.htm
 */

export interface SM2State {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
}

export interface SM2StateWithDates extends SM2State {
  dueAt: Date | null;
  lastReviewedAt: Date | null;
  lapses: number;
}

/**
 * Quality ratings for SM-2
 * 0 - Complete blackout
 * 1 - Incorrect, but upon seeing correct answer, remembered
 * 2 - Incorrect, but correct answer seemed easy to recall
 * 3 - Correct with serious difficulty
 * 4 - Correct after hesitation
 * 5 - Perfect response
 */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * UI button to quality mapping
 */
export const QUALITY_MAP = {
  again: 2 as Quality,
  hard: 3 as Quality,
  good: 4 as Quality,
  easy: 5 as Quality,
} as const;

export type QualityButton = keyof typeof QUALITY_MAP;

/**
 * Default state for a new/unseen word
 */
export const DEFAULT_SM2_STATE: SM2State = {
  repetitions: 0,
  intervalDays: 0,
  easeFactor: 2.5,
};

/**
 * Calculate the new ease factor based on quality
 * EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
 * Minimum EF = 1.3
 */
function calculateEaseFactor(currentEF: number, quality: Quality): number {
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const newEF = currentEF + delta;
  return Math.max(1.3, newEF);
}

/**
 * Calculate the next interval based on repetitions and ease factor
 */
function calculateInterval(repetitions: number, easeFactor: number): number {
  if (repetitions === 1) {
    return 1; // 1 day
  } else if (repetitions === 2) {
    return 6; // 6 days
  } else {
    // For repetitions > 2, multiply previous interval by ease factor
    // Since we don't store previous interval, we calculate it recursively
    // interval(n) = interval(n-1) * EF
    let interval = 6;
    for (let i = 3; i <= repetitions; i++) {
      interval = Math.round(interval * easeFactor);
    }
    return interval;
  }
}

/**
 * Core SM-2 update function
 * 
 * @param state - Current SM-2 state
 * @param quality - Quality of response (0-5)
 * @returns New SM-2 state
 */
export function sm2Update(state: SM2State, quality: Quality): SM2State {
  // If quality < 3 (incorrect/failed), reset repetitions
  if (quality < 3) {
    return {
      repetitions: 0,
      intervalDays: 1, // Review again tomorrow
      easeFactor: calculateEaseFactor(state.easeFactor, quality),
    };
  }

  // Quality >= 3 (correct), increment repetitions
  const newRepetitions = state.repetitions + 1;
  const newEaseFactor = calculateEaseFactor(state.easeFactor, quality);
  const newInterval = calculateInterval(newRepetitions, newEaseFactor);

  return {
    repetitions: newRepetitions,
    intervalDays: newInterval,
    easeFactor: newEaseFactor,
  };
}

/**
 * Calculate the due date based on interval
 */
export function calculateDueDate(intervalDays: number, fromDate: Date = new Date()): Date {
  const dueDate = new Date(fromDate);
  dueDate.setDate(dueDate.getDate() + intervalDays);
  dueDate.setHours(0, 0, 0, 0); // Normalize to start of day
  return dueDate;
}

/**
 * Check if a word is due for review
 */
export function isDue(dueAt: Date | null, now: Date = new Date()): boolean {
  if (dueAt === null) return true; // Never reviewed
  return dueAt <= now;
}

/**
 * Get quality from button name
 */
export function qualityFromButton(button: QualityButton): Quality {
  return QUALITY_MAP[button];
}

/**
 * Process a review and return updated state with dates
 */
export function processReview(
  state: SM2StateWithDates,
  quality: Quality
): SM2StateWithDates {
  const newState = sm2Update(state, quality);
  const now = new Date();
  const isLapse = quality < 3;

  return {
    ...newState,
    dueAt: calculateDueDate(newState.intervalDays, now),
    lastReviewedAt: now,
    lapses: isLapse ? state.lapses + 1 : state.lapses,
  };
}
