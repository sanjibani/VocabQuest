export default function HomeLoading() {
    return (
        <main className="min-h-screen px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Skeleton */}
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <div className="h-8 w-48 bg-gray-700/50 rounded animate-pulse mb-2" />
                        <div className="h-4 w-64 bg-gray-700/30 rounded animate-pulse" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gray-700/50 rounded-full animate-pulse" />
                        <div className="h-6 w-32 bg-gray-700/50 rounded animate-pulse" />
                    </div>
                </header>

                {/* XP Card Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="md:col-span-2 bg-gray-800/50 rounded-2xl p-5 h-32 animate-pulse" />
                    <div className="bg-gray-800/50 rounded-2xl p-5 h-32 animate-pulse" />
                </div>

                {/* Action Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-800/50 rounded-2xl p-5 h-48 animate-pulse" />
                    <div className="bg-gray-800/50 rounded-2xl p-5 h-48 animate-pulse" />
                </div>

                {/* Stats Row Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-gray-800/50 rounded-2xl p-4 h-24 animate-pulse" />
                    ))}
                </div>
            </div>
        </main>
    );
}
