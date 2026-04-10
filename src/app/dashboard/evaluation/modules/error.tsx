'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, RefreshCw, Settings } from 'lucide-react';
import Link from 'next/link';

export default function ModulesError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error for debugging
        console.error('Modules page error:', error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="mx-auto max-w-md text-center">
                <div className="flex justify-center mb-4">
                    <AlertTriangle className="h-16 w-16 text-orange-500" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Module Configuration Error
                </h2>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Something went wrong while loading the module configuration. The analysis service might be temporarily unavailable.
                </p>

                {process.env.NODE_ENV === 'development' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-left">
                        <p className="text-sm font-mono text-red-800 dark:text-red-300 break-words">
                            {error.message}
                        </p>
                        {error.digest && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                Digest: {error.digest}
                            </p>
                        )}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={reset} className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </Button>

                    <Button variant="outline" asChild>
                        <Link href="/dashboard/evaluation" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Evaluation
                        </Link>
                    </Button>

                    <Button variant="outline" asChild>
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
                    If this problem persists, please contact support.
                </p>
            </div>
        </div>
    );
}
