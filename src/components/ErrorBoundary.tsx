'use client';

import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Error Boundary to catch and display React errors gracefully
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
                    <div className="max-w-md w-full bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center">
                        <span className="text-6xl mb-4 block">⚠️</span>
                        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
                        <p className="text-gray-400 mb-6">
                            We're sorry for the inconvenience. Please refresh the page to continue.
                        </p>
                        <button
                            onClick={() => window.location.href = '/home'}
                            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
