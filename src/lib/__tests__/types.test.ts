import { describe, it, expect } from 'vitest';
import { calculateLevel, xpForNextLevel, xpProgress } from '../types';

describe('XP and Leveling System', () => {
    describe('calculateLevel', () => {
        it('should return level 1 for 0 XP', () => {
            expect(calculateLevel(0)).toBe(1);
        });

        it('should return level 1 for XP less than 500', () => {
            expect(calculateLevel(100)).toBe(1);
            expect(calculateLevel(499)).toBe(1);
        });

        it('should return level 2 for 500 XP', () => {
            expect(calculateLevel(500)).toBe(2);
        });

        it('should return level 3 for 1000 XP', () => {
            expect(calculateLevel(1000)).toBe(3);
        });

        it('should calculate correct level for large XP values', () => {
            expect(calculateLevel(5000)).toBe(11);
            expect(calculateLevel(10000)).toBe(21);
        });
    });

    describe('xpForNextLevel', () => {
        it('should return 500 XP for level 1', () => {
            expect(xpForNextLevel(1)).toBe(500);
        });

        it('should return 1000 XP for level 2', () => {
            expect(xpForNextLevel(2)).toBe(1000);
        });

        it('should scale linearly with level', () => {
            expect(xpForNextLevel(5)).toBe(2500);
            expect(xpForNextLevel(10)).toBe(5000);
        });
    });

    describe('xpProgress', () => {
        it('should show 0% progress at level boundary', () => {
            const result = xpProgress(500); // Start of level 2
            expect(result.current).toBe(0);
            expect(result.required).toBe(500);
            expect(result.percentage).toBe(0);
        });

        it('should show 50% progress at midpoint', () => {
            const result = xpProgress(250); // Halfway through level 1
            expect(result.current).toBe(250);
            expect(result.required).toBe(500);
            expect(result.percentage).toBe(50);
        });

        it('should show 100% progress at level completion', () => {
            const result = xpProgress(499); // Almost level 2
            expect(result.current).toBe(499);
            expect(result.required).toBe(500);
            expect(result.percentage).toBeCloseTo(99.8, 1);
        });

        it('should calculate progress correctly for higher levels', () => {
            const result = xpProgress(1250); // Level 3, 250 XP into it
            expect(result.current).toBe(250);
            expect(result.required).toBe(500);
            expect(result.percentage).toBe(50);
        });
    });
});
