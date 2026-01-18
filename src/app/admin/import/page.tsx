'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function AdminImportPage() {
    const [isImporting, setIsImporting] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        details?: {
            chapters: number;
            sessions: number;
            words: number;
            exercises: number;
        };
    } | null>(null);
    const [secret, setSecret] = useState('');

    const handleImport = async () => {
        if (!secret) {
            setResult({ success: false, message: 'Please enter the import secret' });
            return;
        }

        setIsImporting(true);
        setResult(null);

        try {
            const response = await fetch(`/api/import?secret=${encodeURIComponent(secret)}`, {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    success: true,
                    message: data.message || 'Import completed successfully!',
                    details: data.details,
                });
            } else {
                setResult({
                    success: false,
                    message: data.error || 'Import failed',
                });
            }
        } catch (error) {
            setResult({
                success: false,
                message: 'Network error: Could not reach the server',
            });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <main className="min-h-screen px-4 py-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <Link href="/home" className="text-violet-400 hover:text-violet-300 text-sm mb-2 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Admin: Content Import</h1>
                    <p className="text-gray-400">Import VocabQuest vocabulary data from book.json</p>
                </header>

                <Card variant="glass" padding="lg">
                    <div className="space-y-6">
                        {/* Instructions */}
                        <div className="bg-gray-800/50 rounded-xl p-4">
                            <h3 className="font-semibold text-white mb-2">📋 Instructions</h3>
                            <ul className="text-sm text-gray-400 space-y-1">
                                <li>• Place your book.json file at <code className="text-violet-400">content/wpmae/book.json</code></li>
                                <li>• Enter the import secret (from IMPORT_SECRET env var)</li>
                                <li>• Click Import to upsert all content to Supabase</li>
                                <li>• All sessions will be marked as published</li>
                            </ul>
                        </div>

                        {/* Secret Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Import Secret
                            </label>
                            <input
                                type="password"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                placeholder="Enter IMPORT_SECRET"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            />
                        </div>

                        {/* Import Button */}
                        <Button
                            onClick={handleImport}
                            isLoading={isImporting}
                            disabled={isImporting}
                            className="w-full"
                            size="lg"
                        >
                            {isImporting ? 'Importing...' : 'Import Content'}
                        </Button>

                        {/* Result */}
                        {result && (
                            <div className={`rounded-xl p-4 ${result.success
                                ? 'bg-emerald-500/10 border border-emerald-500/30'
                                : 'bg-red-500/10 border border-red-500/30'
                                }`}>
                                <div className={`font-semibold mb-2 ${result.success ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                    {result.success ? '✓ Success' : '✗ Error'}
                                </div>
                                <p className="text-gray-300">{result.message}</p>

                                {result.details && (
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-bold text-white">{result.details.chapters}</div>
                                            <div className="text-xs text-gray-400">Chapters</div>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-bold text-white">{result.details.sessions}</div>
                                            <div className="text-xs text-gray-400">Sessions</div>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-bold text-white">{result.details.words}</div>
                                            <div className="text-xs text-gray-400">Words</div>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-bold text-white">{result.details.exercises}</div>
                                            <div className="text-xs text-gray-400">Exercises</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Dev Note */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>💡 In development, use <code className="text-violet-400">dev-secret</code> as the import secret</p>
                </div>
            </div>
        </main>
    );
}
