'use client';

import { getCharacterInfo } from '@/lib/streak';
import styles from './CharacterEvolution.module.css';

interface CharacterEvolutionProps {
    stage: number;
    showName?: boolean;
    size?: 'small' | 'medium' | 'large';
}

export default function CharacterEvolution({
    stage,
    showName = true,
    size = 'medium'
}: CharacterEvolutionProps) {
    const { name, emoji } = getCharacterInfo(stage);

    // Progress to next stage (max 5)
    const nextStage = Math.min(stage + 1, 5);
    const stageProgress = stage >= 5 ? 100 : (stage / 5) * 100;

    return (
        <div className={`${styles.container} ${styles[size]}`}>
            <div className={styles.characterWrap}>
                <div className={styles.glow} />
                <span className={styles.character}>{emoji}</span>
            </div>

            {showName && (
                <div className={styles.info}>
                    <span className={styles.name}>{name}</span>
                    <span className={styles.stage}>Stage {stage}/5</span>
                </div>
            )}

            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${stageProgress}%` }}
                />
            </div>
        </div>
    );
}
