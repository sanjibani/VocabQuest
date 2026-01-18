import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "VocabQuest - Master Vocabulary Through Gamified Learning",
  description: "Learn vocabulary the fun way! Complete quests, build streaks, and evolve your character as you master new words with spaced repetition.",
  keywords: ['vocabulary', 'learning', 'education', 'gamification', 'spaced repetition', 'words'],
  authors: [{ name: 'VocabQuest' }],
  openGraph: {
    title: 'VocabQuest - Master Vocabulary Through Gamified Learning',
    description: 'Learn vocabulary the fun way with quests, streaks, and character evolution!',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen bg-grid">
        <ErrorBoundary>
          <AuthProvider>
            <div className="bg-radial min-h-screen">
              {children}
            </div>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
