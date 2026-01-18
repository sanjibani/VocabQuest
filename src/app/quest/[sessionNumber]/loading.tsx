export default function QuestLoading() {
    return (
        <main className="min-h-screen px-4 py-8">
            <div className="max-w-3xl mx-auto">
                {/* Header Skeleton */}
                <header className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-4 w-24 bg-gray-700/50 rounded animate-pulse" />
                        <div className="h-4 w-32 bg-gray-700/50 rounded animate-pulse" />
                    </div>
                    <div className="h-2 w-full bg-gray-700/50 rounded-full animate-pulse" />
                </header>

                {/* XP Bar Skeleton */}
                <div className="mb-8 bg-gray-800/50 rounded-2xl p-5 h-24 animate-pulse" />

                {/* Question Card Skeleton */}
                <div className="bg-gray-800/50 rounded-2xl p-8 mb-8 animate-pulse">
                    <div className="h-8 w-3/4 bg-gray-700/50 rounded mb-8 mx-auto" />
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 bg-gray-700/30 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
