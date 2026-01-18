export default function ReviewLoading() {
    return (
        <main className="min-h-screen px-4 py-8">
            <div className="max-w-2xl mx-auto">
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

                {/* Flash Card Skeleton */}
                <div className="bg-gray-800/50 rounded-2xl p-8 h-96 animate-pulse flex items-center justify-center">
                    <div className="text-center">
                        <div className="h-12 w-64 bg-gray-700/50 rounded mb-8 mx-auto" />
                        <div className="h-12 w-48 bg-violet-600/20 rounded-xl mx-auto" />
                    </div>
                </div>
            </div>
        </main>
    );
}
