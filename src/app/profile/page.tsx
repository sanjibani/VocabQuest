'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserStats } from '@/app/actions/user';
import { User, LogOut, Flame, BookOpen, Trophy, Star } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface ProfileStats {
    xpTotal: number;
    level: number;
    streak: number;
    wordsLearned: number;
    rank: number;
    fullName?: string;
    joinedAt?: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [stats, setStats] = useState<ProfileStats | null>(null);
    const [userEmail, setUserEmail] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push('/login');
                    return;
                }

                setUserEmail(user.email || 'Scholar');

                // Retrieve stats
                const userStats = await getUserStats();

                // Mocks for data not yet fully aggregated in a single call
                // Ideally we'd have a specific getProfile stats action
                setStats({
                    xpTotal: userStats?.xpTotal || 0,
                    level: userStats?.level || 1,
                    streak: userStats?.currentStreak || 0,
                    wordsLearned: userStats?.totalWordsLearned || 0,
                    rank: 1, // Placeholder unless we query leaderboard
                    fullName: userStats?.fullName,
                    joinedAt: userStats?.joinedAt
                });

            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadProfile();
    }, [router]);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.refresh();
        router.push('/');
    };

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pb-24 px-4 pt-8">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Header Profile Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 border border-teal-800 p-6 shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <User size={120} />
                    </div>

                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <span className="text-3xl font-bold text-teal-100">
                                {userEmail[0].toUpperCase()}
                            </span>
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">
                                {stats?.fullName || userEmail.split('@')[0]}
                            </h1>
                            <div className="flex items-center gap-2 text-teal-200/80 text-sm font-medium">
                                <span className="bg-teal-950/50 px-2 py-0.5 rounded border border-teal-800">
                                    Level {stats?.level} Scholar
                                </span>
                                <span>•</span>
                                <span>Joined {stats?.joinedAt ? new Date(stats.joinedAt).getFullYear() : '2025'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <Card variant="default" className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
                            <Flame size={20} className="text-orange-500" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{stats?.streak}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">Day Streak</div>
                    </Card>

                    <Card variant="default" className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                            <Star size={20} className="text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{stats?.xpTotal}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">Total XP</div>
                    </Card>

                    <Card variant="default" className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                            <BookOpen size={20} className="text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{stats?.wordsLearned}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">Words Found</div>
                    </Card>

                    <Card variant="default" className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                            <Trophy size={20} className="text-purple-500" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">#{stats?.rank}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">Global Rank</div>
                    </Card>
                </div>

                {/* Settings / Actions */}
                <div className="space-y-3 pt-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider px-1">Account</h3>

                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-red-950/30 hover:border-red-900/50 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-red-900/20 group-hover:text-red-400 transition-colors">
                                <LogOut size={20} />
                            </div>
                            <span className="font-medium text-slate-200 group-hover:text-red-200">Sign Out</span>
                        </div>
                    </button>

                    <div className="text-center pt-8">
                        <p className="text-xs text-slate-600">
                            VocabQuest v1.0.0 • Session ID: {userEmail.substring(0, 4)}
                        </p>
                    </div>
                </div>

            </div>
        </main>
    );
}
