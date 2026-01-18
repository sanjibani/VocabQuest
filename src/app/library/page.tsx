import Link from 'next/link';
import { getLibrarySessions } from '@/app/actions/quest';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default async function LibraryPage() {
    const { chapters } = await getLibrarySessions();

    return (
        <main className="min-h-screen px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/home" className="text-violet-400 hover:text-violet-300 text-sm mb-2 inline-block">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-white">Session Library</h1>
                        <p className="text-gray-400">Browse all available vocabulary sessions</p>
                    </div>
                </header>

                {/* Chapters */}
                {chapters.length === 0 ? (
                    <Card variant="glass" className="text-center py-12">
                        <span className="text-6xl mb-4 block">📚</span>
                        <h2 className="text-xl font-semibold text-white mb-2">No Content Yet</h2>
                        <p className="text-gray-400 mb-6">
                            Import the VocabQuest dataset to get started.
                        </p>
                        <Link href="/admin/import">
                            <Button>Go to Import</Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {chapters.map((chapter) => (
                            <div key={chapter.id}>
                                {/* Chapter Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                        <span className="text-lg font-bold text-violet-400">
                                            {chapter.chapterNumber}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">{chapter.title}</h2>
                                        <p className="text-sm text-gray-400">
                                            {chapter.sessions.length} session{chapter.sessions.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Sessions Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-13">
                                    {chapter.sessions.map((session) => (
                                        <Link key={session.id} href={`/quest/${session.session_number}`}>
                                            <Card
                                                variant="default"
                                                className={`
                                                    transition-all duration-200 cursor-pointer group
                                                    ${(session as any).isCompleted
                                                        ? 'border-emerald-500/30 bg-emerald-900/10 hover:border-emerald-500/50'
                                                        : 'hover:border-violet-500/50'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`
                                                                text-xs font-medium px-2 py-0.5 rounded-full 
                                                                ${(session as any).isCompleted
                                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                                                                    : 'bg-gray-700 text-gray-300'
                                                                }
                                                            `}>
                                                                {(session as any).isCompleted ? 'Completed' : `Session ${session.session_number}`}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg font-medium text-white group-hover:text-violet-300 transition-colors">
                                                            {session.title}
                                                        </h3>
                                                    </div>
                                                    <div className="text-gray-500 group-hover:text-violet-400 transition-colors">
                                                        {(session as any).isCompleted ? (
                                                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                                                                <span className="text-emerald-400 text-sm">✓</span>
                                                            </div>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
