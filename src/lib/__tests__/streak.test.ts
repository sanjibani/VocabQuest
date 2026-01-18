import { describe, it, expect } from 'vitest';
import { getCharacterInfo, MILESTONES } from '../streak';

describe('Streak System', () => {
    describe('getCharacterInfo', () => {
        it('should return Sprout for stage 1', () => {
            const info = getCharacterInfo(1);
            expect(info.name).toBe('Sprout');
            expect(info.emoji).toBe('🌱');
        });

        it('should return Sapling for stage 2', () => {
            const info = getCharacterInfo(2);
            expect(info.name).toBe('Sapling');
            expect(info.emoji).toBe('🌿');
        });

        it('should return Sapling for stage 3', () => {
            const info = getCharacterInfo(3);
            expect(info.name).toBe('Sapling');
            expect(info.emoji).toBe('🌿');
        });

        it('should return Tree for stage 4', () => {
            const info = getCharacterInfo(4);
            expect(info.name).toBe('Tree');
            expect(info.emoji).toBe('🪴');
        });

        it('should return Blossom for stage 5', () => {
            const info = getCharacterInfo(5);
            expect(info.name).toBe('Blossom');
            expect(info.emoji).toBe('🌸');
        });

        it('should default to Blossom for higher stages', () => {
            const info = getCharacterInfo(99);
            expect(info.name).toBe('Blossom');
        });
    });

    describe('MILESTONES', () => {
        it('should have correct milestone structure', () => {
            expect(MILESTONES).toHaveLength(4);

            expect(MILESTONES[0].days).toBe(3);
            expect(MILESTONES[0].stage).toBe(2);

            expect(MILESTONES[1].days).toBe(7);
            expect(MILESTONES[1].stage).toBe(3);

            expect(MILESTONES[2].days).toBe(14);
            expect(MILESTONES[2].stage).toBe(4);

            expect(MILESTONES[3].days).toBe(30);
            expect(MILESTONES[3].stage).toBe(5);
        });

        it('should have unique badge emojis', () => {
            const badges = MILESTONES.map(m => m.badge);
            const uniqueBadges = new Set(badges);
            expect(uniqueBadges.size).toBe(badges.length);
        });
    });
});
