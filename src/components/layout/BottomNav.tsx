'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Play, Layers, User } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/home' && pathname === '/home') return true;
        if (path !== '/home' && pathname.startsWith(path)) return true;
        return false;
    };

    const navItems = [
        { label: 'Home', icon: Home, href: '/home' },
        { label: 'Rank', icon: Trophy, href: '/leaderboard' },
        { label: 'Play', icon: Play, href: '/play', isFab: true },
        { label: 'Cards', icon: Layers, href: '/review' }, // Using Layers for Cards/Deck
        { label: 'Profile', icon: User, href: '/profile' },
    ];

    // Don't show on auth pages or landing page if needed
    // For now, we show it everywhere except strictly excluded paths?
    // Let's assume we want it on app pages.
    // If pathname is '/' landing, maybe we hide it?
    if (pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/review') || pathname.startsWith('/quest')) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
            <nav
                className="mx-auto max-w-lg rounded-2xl flex items-center justify-between px-2 py-2 shadow-2xl backdrop-blur-xl"
                style={{
                    background: 'rgba(15, 40, 48, 0.85)', // dark teal with opacity
                    border: '1px solid rgba(26, 155, 168, 0.2)', // teal border
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.3)'
                }}
            >
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    if (item.isFab) {
                        return (
                            <Link key={item.href} href={item.href}>
                                <div
                                    className="relative -top-8 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
                                    style={{
                                        background: 'linear-gradient(135deg, #1a9ba8 0%, #15868f 100%)', // teal gradient
                                        boxShadow: '0 8px 16px rgba(26, 155, 168, 0.4)',
                                        border: '4px solid #0f2830' // match bg to clear space
                                    }}
                                >
                                    <Icon size={28} color="white" fill="white" />
                                </div>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200 ${active ? 'bg-white/5' : 'hover:bg-white/5'
                                }`}
                        >
                            <Icon
                                size={24}
                                color={active ? '#1a9ba8' : '#94a3b8'}
                                strokeWidth={active ? 2.5 : 2}
                            />
                            <span
                                className="text-[10px] font-medium mt-1"
                                style={{ color: active ? '#1a9ba8' : '#94a3b8' }}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
