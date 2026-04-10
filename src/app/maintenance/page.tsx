'use client';

import { useState, useEffect } from 'react';
import { Construction, Clock, RefreshCw, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

/**
 * Maintenance Mode Page
 * Displayed when the application is under maintenance or construction
 */
export default function MaintenancePage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(30);
    const [isRetrying, setIsRetrying] = useState(false);

    // Auto-retry countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    return 30; // Reset countdown
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Check if maintenance is over
    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            // Try to access the API to check if maintenance is over
            const response = await fetch('/api/health', { method: 'HEAD' });
            if (response.ok) {
                router.push('/dashboard');
            } else {
                setCountdown(30);
            }
        } catch {
            setCountdown(30);
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <Card className="border-2 border-dashed border-yellow-500/50 bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-8 md:p-12 text-center">
                        {/* Animated Construction Icon */}
                        <div className="relative mb-8">
                            <div className="w-24 h-24 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center animate-pulse">
                                <Construction className="w-12 h-12 text-yellow-500" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center animate-bounce">
                                <Clock className="w-4 h-4 text-blue-500" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                            Under Maintenance
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl text-muted-foreground mb-6">
                            We're performing scheduled maintenance to improve your experience
                        </p>

                        {/* Status Card */}
                        <div className="bg-muted/50 rounded-lg p-6 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="p-3 bg-background/50 rounded-lg">
                                    <p className="text-muted-foreground">Status</p>
                                    <p className="font-semibold text-yellow-500 flex items-center justify-center gap-1">
                                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                                        In Progress
                                    </p>
                                </div>
                                <div className="p-3 bg-background/50 rounded-lg">
                                    <p className="text-muted-foreground">Expected Duration</p>
                                    <p className="font-semibold">~30 minutes</p>
                                </div>
                                <div className="p-3 bg-background/50 rounded-lg">
                                    <p className="text-muted-foreground">Auto-retry in</p>
                                    <p className="font-semibold text-primary">{countdown}s</p>
                                </div>
                            </div>
                        </div>

                        {/* What's Happening */}
                        <div className="text-left mb-8">
                            <h2 className="text-lg font-semibold mb-3">What we're working on:</h2>
                            <ul className="space-y-2 text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4 text-primary" />
                                    Database optimization and performance improvements
                                </li>
                                <li className="flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4 text-primary" />
                                    Security updates and bug fixes
                                </li>
                                <li className="flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4 text-primary" />
                                    New features deployment
                                </li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={handleRetry}
                                disabled={isRetrying}
                                className="gap-2"
                            >
                                {isRetrying ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Checking...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4" />
                                        Try Again
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" asChild>
                                <a href="mailto:support@tca-irr.com" className="gap-2">
                                    <Mail className="w-4 h-4" />
                                    Contact Support
                                </a>
                            </Button>
                        </div>

                        {/* Footer */}
                        <p className="mt-8 text-xs text-muted-foreground">
                            We apologize for any inconvenience. Your data is safe and will be available once maintenance is complete.
                        </p>
                    </CardContent>
                </Card>

                {/* Additional Info */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                    TCA-IRR Startup Evaluation Platform v1.0
                </p>
            </div>
        </main>
    );
}
