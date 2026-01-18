'use client';

import { useEffect, useState } from 'react';
import { getStreakData } from '@/app/actions/streak';
import { type StreakData } from '@/lib/streak';
import styles from './StreakBadge.module.css';

interface StreakBadgeProps {
    initialData?: StreakData | null;
}

export default function StreakBadge({ initialData }: StreakBadgeProps) {
    const [streak, setStreak] = useState<StreakData | null>(initialData || null);

    useEffect(() => {
        if (!initialData) {
            getStreakData().then(setStreak);
        }
    }, [initialData]);

    if (!streak) return null;

    const isActive = streak.currentStreak > 0;
    const isToday = streak.todayCompleted;

    return (
        <div className={`${styles.badge} ${isActive ? styles.active : styles.inactive}`}>
            <div className={styles.flame}>
                {isActive ? '🔥' : '❄️'}
            </div>
            <div className={styles.info}>
                <span className={styles.count}>{streak.currentStreak}</span>
                <span className={styles.label}>
                    {streak.currentStreak === 1 ? 'day' : 'days'}
                </span>
            </div>
            {!isToday && isActive && (
                <div className={styles.warning} title="Complete activity today to keep your streak!">
                    ⚠️
                </div>
            )}
        </div>
    );
}
