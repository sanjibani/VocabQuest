import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired - required for Server Components
    // keys: getUser is safer than getSession for auth guards
    const { data: { user } } = await supabase.auth.getUser();

    // Route Protection Plan:
    // 1. Protected Routes: /home, /quest, /review, /library
    // 2. Public Routes: /login, /api/import (maybe admin only later), / (landing if we had one, but we redirect / to /home or /login)

    const path = request.nextUrl.pathname;

    // Auth Guard
    if (!user && (
        path.startsWith('/home') ||
        path.startsWith('/quest') ||
        path.startsWith('/review') ||
        path.startsWith('/library') ||
        path === '/'
    )) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Login Redirect (If already logged in, go to home)
    if (user && path === '/login') {
        return NextResponse.redirect(new URL('/home', request.url));
    }

    // Default: If root and logged in -> home
    if (user && path === '/') {
        return NextResponse.redirect(new URL('/home', request.url));
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
