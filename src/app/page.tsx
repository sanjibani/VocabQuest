import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-violet-300 text-sm font-medium">
            Powered by SM-2 Spaced Repetition
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          <span className="gradient-text">Word Power</span>
          <br />
          <span className="text-white">Made Easy</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-400 mb-10 leading-relaxed">
          Master vocabulary through gamified quests and scientifically-proven
          spaced repetition. Level up your word power!
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/home">
            <Button size="lg" className="min-w-[200px] animate-pulse-glow">
              <span className="mr-2">🚀</span>
              Start Learning
            </Button>
          </Link>
          <Link href="/library">
            <Button variant="outline" size="lg" className="min-w-[200px]">
              Browse Sessions
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20">
        <FeatureCard
          emoji="🎮"
          title="Gamified Quests"
          description="Learn through interactive sessions with XP rewards and leveling"
        />
        <FeatureCard
          emoji="🧠"
          title="Smart Reviews"
          description="SM-2 algorithm schedules reviews at optimal intervals"
        />
        <FeatureCard
          emoji="📈"
          title="Track Progress"
          description="Watch your vocabulary grow with detailed statistics"
        />
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
    </main>
  );
}

function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 cursor-default">
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
