
export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    characterStage: number;
    lastActivityDate: string | null;
    streakFreezes: number;
    todayCompleted: boolean;
}

export interface MilestoneReward {
    type: 'badge' | 'evolution';
    name: string;
    description: string;
    newStage?: number;
}

export const MILESTONES: { days: number; badge: string; stage: number }[] = [
    { days: 3, badge: 'Bronze Explorer', stage: 2 },
    { days: 7, badge: 'Silver Scholar', stage: 3 },
    { days: 14, badge: 'Gold Master', stage: 4 },
    { days: 30, badge: 'Diamond Legend', stage: 5 },
];

/**
 * Get character stage name and emoji
 */
export function getCharacterInfo(stage: number): { name: string; emoji: string } {
    const stages = [
        { name: 'Seed', emoji: '🌱' },
        { name: 'Sprout', emoji: '🌿' },
        { name: 'Sapling', emoji: '🌳' },
        { name: 'Tree', emoji: '🌲' },
        { name: 'Blossom', emoji: '🌸' },
    ];
    return stages[Math.min(stage - 1, stages.length - 1)] || stages[0];
}
