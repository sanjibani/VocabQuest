import { describe, it, expect } from 'vitest';
import { processReview, QUALITY_MAP, DEFAULT_SM2_STATE } from '../sm2';

describe('SM-2 Algorithm', () => {
    describe('processReview', () => {
        it('should increase interval on first correct answer', () => {
            const initial = { ...DEFAULT_SM2_STATE };
            const result = processReview(initial, QUALITY_MAP.good);

            expect(result.intervalDays).toBe(1);
            expect(result.repetitions).toBe(1);
        });

        it('should increase interval exponentially on consecutive correct answers', () => {
            let state = { ...DEFAULT_SM2_STATE };

            // First correct answer
            state = processReview(state, QUALITY_MAP.good);
            expect(state.intervalDays).toBe(1);

            // Second correct answer
            state = processReview(state, QUALITY_MAP.good);
            expect(state.intervalDays).toBe(6);
        });

        it('should reset repetitions on failed review (Again)', () => {
            let state = { ...DEFAULT_SM2_STATE, repetitions: 3, intervalDays: 10 };

            state = processReview(state, QUALITY_MAP.again);

            // SM-2 resets to interval 1 (not 0) on failure
            expect(state.intervalDays).toBe(1);
            expect(state.repetitions).toBe(0);
            expect(state.lapses).toBe(1);
        });

        it('should decrease ease factor on Hard', () => {
            const initial = { ...DEFAULT_SM2_STATE, easeFactor: 2.5 };
            const result = processReview(initial, QUALITY_MAP.hard);

            expect(result.easeFactor).toBeLessThan(2.5);
            expect(result.easeFactor).toBeGreaterThanOrEqual(1.3); // Min ease factor
        });

        it('should increase ease factor on Easy', () => {
            const initial = { ...DEFAULT_SM2_STATE, easeFactor: 2.5 };
            const result = processReview(initial, QUALITY_MAP.easy);

            expect(result.easeFactor).toBeGreaterThan(2.5);
        });

        it('should not drop ease factor below 1.3', () => {
            let state = { ...DEFAULT_SM2_STATE, easeFactor: 1.35 };

            // Multiple hard answers should not drop below 1.3
            for (let i = 0; i < 10; i++) {
                state = processReview(state, QUALITY_MAP.hard);
            }

            expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
        });

        it('should set dueAt to future date for correct answers', () => {
            const now = new Date();
            const state = { ...DEFAULT_SM2_STATE };
            const result = processReview(state, QUALITY_MAP.good);

            expect(result.dueAt).toBeInstanceOf(Date);
            expect(result.dueAt!.getTime()).toBeGreaterThan(now.getTime());
        });

        it('should set dueAt to now for failed review', () => {
            const now = new Date();
            const state = { ...DEFAULT_SM2_STATE };
            const result = processReview(state, QUALITY_MAP.again);

            expect(result.dueAt).toBeInstanceOf(Date);
            // Should be very close to now (within 1 second)
            expect(Math.abs(result.dueAt!.getTime() - now.getTime())).toBeLessThan(1000);
        });
    });
});
