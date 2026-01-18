import Link from 'next/link';
import { getUserStats } from '@/app/actions/user';
import { getNextSession } from '@/app/actions/quest';
import { getStreakData } from '@/app/actions/streak';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import XPDisplay from '@/components/game/XPDisplay';
import StreakBadge from '@/components/game/StreakBadge';
import CharacterEvolution from '@/components/game/CharacterEvolution';

export default async function HomePage() {
    // Parallelize page load data fetching
    const [stats, nextSession, streakData] = await Promise.all([
        getUserStats(),
        getNextSession(),
        getStreakData()
    ]);

    // Get first name for display
    const displayName = stats?.fullName ? stats.fullName.split(' ')[0] : 'Scholar';

    return (
        <main className="min-h-screen px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">
                            Welcome, {displayName}
                        </h1>
                        <p className="text-gray-400">Continue your vocabulary journey</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <StreakBadge initialData={streakData} />
                        <Link href="/">
                            <span className="text-2xl font-bold gradient-text">VocabQuest</span>
                        </Link>
                    </div>
                </header>

                {/* XP Display with Character */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card variant="glass" className="md:col-span-2">
                        <XPDisplay
                            xp={stats?.xpTotal ?? 0}
                            level={stats?.level ?? 1}
                        />
                    </Card>
                    <Card variant="glass" className="flex items-center justify-center">
                        <CharacterEvolution stage={streakData?.characterStage ?? 1} size="medium" />
                    </Card>
                </div>

                {/* Main Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Review Card */}
                    <Card variant="glass" className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                    <span className="text-2xl">📚</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Daily Review</h2>
                                    <p className="text-sm text-gray-400">
                                        {stats?.dueReviewCount ?? 0} words due today
                                    </p>
                                </div>
                            </div>

                            {(stats?.dueReviewCount ?? 0) > 0 ? (
                                <Link href="/review">
                                    <Button className="w-full">
                                        Start Review ({stats?.dueReviewCount})
                                    </Button>
                                </Link>
                            ) : (
                                <div className="text-center py-2">
                                    <div className="text-3xl font-bold text-white mb-1">
                                        {stats?.totalWordsLearned ?? 0}
                                    </div>
                                    <div className="text-center text-xs text-violet-300 font-medium uppercase tracking-wider mb-3">
                                        Words Mastered
                                    </div>
                                    <div className="flex justify-center gap-1">
                                        <span className="text-xl">🪴</span>
                                        <span className="text-sm text-gray-400 self-center">
                                            Knowledge is growing!
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Quest Card */}
                    <Card variant="glass" className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                    <span className="text-2xl">⚔️</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Main Campaign</h2>
                                    <p className="text-sm text-gray-400">
                                        {nextSession ? `Next: ${nextSession.title}` : 'All sessions complete!'}
                                    </p>
                                </div>
                            </div>

                            {nextSession ? (
                                <Link href={`/quest/${nextSession.session_number}`}>
                                    <Button variant="cta" className="w-full">
                                        Play Session Quest
                                    </Button>
                                </Link>
                            ) : (
                                <div className="text-center py-4 text-gray-500">
                                    <span className="text-3xl mb-2 block">🏆</span>
                                    All sessions completed!
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        label="Total XP"
                        value={(stats?.xpTotal ?? 0).toLocaleString()}
                        icon="⭐"
                    />
                    <StatCard
                        label="Level"
                        value={stats?.level ?? 1}
                        icon="🏅"
                    />
                    <StatCard
                        label="Sessions"
                        value={stats?.completedSessions ?? 0}
                        icon="📖"
                        href="/library"
                    />
                    <StatCard
                        label="Due Today"
                        value={stats?.dueReviewCount ?? 0}
                        icon="📋"
                        href="/review"
                    />
                </div>

                {/* Navigation */}
                <div className="flex flex-wrap gap-4 justify-center">
                    <Link href="/library">
                        <Button variant="ghost">
                            📚 Browse All Sessions
                        </Button>
                    </Link>
                    <Link href="/admin/import">
                        <Button variant="ghost">
                            ⚙️ Admin
                        </Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}

interface StatCardProps {
    label: string;
    value: string | number;
    icon: string;
    href?: string;
}

function StatCard({ label, value, icon, href }: StatCardProps) {
    const cardContent = (
        <Card variant="default" padding="sm" className="text-center h-full hover:bg-gray-800/90 transition-colors">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
        </Card>
    );

    if (href) {
        return <Link href={href} className="block h-full">{cardContent}</Link>;
    }

    return cardContent;
}
