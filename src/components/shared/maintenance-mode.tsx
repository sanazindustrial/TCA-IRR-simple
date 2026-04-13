'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Wrench, Clock, RefreshCw, Construction } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface MaintenanceInfo {
    enabled: boolean;
    title: string;
    message: string;
    estimatedEndTime?: string;
    progress?: number;
    features?: string[];
}

interface MaintenanceModeProps {
    className?: string;
    fullScreen?: boolean;
}

// Check maintenance status from localStorage or API
function getMaintenanceStatus(): MaintenanceInfo | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem('maintenance_mode');
        if (stored) {
            const info: MaintenanceInfo = JSON.parse(stored);
            if (info.enabled) return info;
        }
        return null;
    } catch {
        return null;
    }
}

// Enable maintenance mode programmatically
export function enableMaintenanceMode(info: Partial<MaintenanceInfo>): void {
    if (typeof window === 'undefined') return;
    const maintenance: MaintenanceInfo = {
        enabled: true,
        title: info.title || 'System Under Maintenance',
        message: info.message || 'We are currently performing system updates. Please check back soon.',
        estimatedEndTime: info.estimatedEndTime,
        progress: info.progress,
        features: info.features,
    };
    localStorage.setItem('maintenance_mode', JSON.stringify(maintenance));
    window.dispatchEvent(new CustomEvent('maintenance_mode_changed', { detail: maintenance }));
}

// Disable maintenance mode
export function disableMaintenanceMode(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('maintenance_mode');
    window.dispatchEvent(new CustomEvent('maintenance_mode_changed', { detail: null }));
}

export function MaintenanceMode({ className, fullScreen = false }: MaintenanceModeProps) {
    const [maintenance, setMaintenance] = useState<MaintenanceInfo | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('');

    useEffect(() => {
        // Initial check
        setMaintenance(getMaintenanceStatus());

        // Listen for changes
        const handleChange = (e: CustomEvent) => {
            setMaintenance(e.detail);
        };
        window.addEventListener('maintenance_mode_changed', handleChange as EventListener);

        // Calculate time remaining
        const interval = setInterval(() => {
            const status = getMaintenanceStatus();
            if (status?.estimatedEndTime) {
                const end = new Date(status.estimatedEndTime).getTime();
                const now = Date.now();
                const diff = end - now;
                if (diff > 0) {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    setTimeRemaining(`${hours}h ${minutes}m remaining`);
                } else {
                    setTimeRemaining('Completing soon...');
                }
            }
        }, 60000);

        return () => {
            window.removeEventListener('maintenance_mode_changed', handleChange as EventListener);
            clearInterval(interval);
        };
    }, []);

    if (!maintenance) return null;

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
                <div className="max-w-lg w-full">
                    <Card className={cn("border-yellow-500/50 bg-yellow-500/5", className)}>
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
                                <Construction className="h-10 w-10 text-yellow-500 animate-pulse" />
                            </div>
                            <CardTitle className="text-2xl text-yellow-600 dark:text-yellow-400">
                                {maintenance.title}
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                {maintenance.message}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {maintenance.progress !== undefined && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="font-medium">{maintenance.progress}%</span>
                                    </div>
                                    <Progress value={maintenance.progress} className="h-2" />
                                </div>
                            )}

                            {maintenance.estimatedEndTime && (
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Estimated completion: {new Date(maintenance.estimatedEndTime).toLocaleString()}</span>
                                </div>
                            )}

                            {timeRemaining && (
                                <div className="text-center text-sm font-medium text-yellow-600">
                                    {timeRemaining}
                                </div>
                            )}

                            {maintenance.features && maintenance.features.length > 0 && (
                                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                                    <p className="text-sm font-medium mb-2">Updates in progress:</p>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        {maintenance.features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <Wrench className="h-3 w-3" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <Button
                                variant="outline"
                                className="w-full mt-4"
                                onClick={() => window.location.reload()}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Check Again
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Inline banner version
    return (
        <div className={cn(
            "p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3",
            className
        )}>
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    {maintenance.title}
                </p>
                <p className="text-xs text-muted-foreground">
                    {maintenance.message}
                </p>
            </div>
            {maintenance.progress !== undefined && (
                <div className="w-24">
                    <Progress value={maintenance.progress} className="h-1" />
                </div>
            )}
        </div>
    );
}

// Full page maintenance component for route-level blocking
export function MaintenancePage() {
    return <MaintenanceMode fullScreen />;
}

export default MaintenanceMode;
