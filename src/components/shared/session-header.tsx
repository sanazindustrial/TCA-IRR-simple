'use client';

import { useState, useEffect } from 'react';
import { User, Building2, Clock, Badge as BadgeIcon, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface SessionInfo {
    userId: string;
    email: string;
    name: string;
    role: 'user' | 'admin' | 'analyst';
    companyActive?: string;
    companyId?: string;
    evaluationId?: string;
    sessionStart: number;
    lastActivity: number;
}

interface SessionHeaderProps {
    className?: string;
    showEvaluationId?: boolean;
    showTimestamp?: boolean;
    compact?: boolean;
}

const roleBadgeColors: Record<string, string> = {
    admin: 'bg-red-500/20 text-red-600 dark:text-red-400',
    analyst: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    user: 'bg-green-500/20 text-green-600 dark:text-green-400',
};

export function SessionHeader({
    className,
    showEvaluationId = true,
    showTimestamp = true,
    compact = false
}: SessionHeaderProps) {
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [currentTime, setCurrentTime] = useState<string>('');

    useEffect(() => {
        // Load session info from localStorage
        const loadSession = () => {
            try {
                const userStr = localStorage.getItem('loggedInUser');
                if (!userStr) return;

                const user = JSON.parse(userStr);
                const evaluationId = localStorage.getItem('currentEvaluationId') ||
                    localStorage.getItem('analysisEvaluationId');
                const companyActive = localStorage.getItem('analysisCompanyName') ||
                    localStorage.getItem('companyName');
                const companyId = localStorage.getItem('analysisCompanyId');

                setSession({
                    userId: user.id || user.user_id || 'unknown',
                    email: user.email || 'unknown',
                    name: user.name || user.email?.split('@')[0] || 'User',
                    role: (user.role || 'user').toLowerCase() as 'user' | 'admin' | 'analyst',
                    companyActive: companyActive || undefined,
                    companyId: companyId || undefined,
                    evaluationId: evaluationId || undefined,
                    sessionStart: user.loginTime || Date.now(),
                    lastActivity: Date.now(),
                });
            } catch (error) {
                console.error('Error loading session:', error);
            }
        };

        loadSession();

        // Update time every second
        const timeInterval = setInterval(() => {
            setCurrentTime(new Date().toLocaleString());
        }, 1000);

        // Listen for storage changes
        const handleStorage = () => loadSession();
        window.addEventListener('storage', handleStorage);
        window.addEventListener('session_updated', handleStorage);

        return () => {
            clearInterval(timeInterval);
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('session_updated', handleStorage);
        };
    }, []);

    if (!session) return null;

    if (compact) {
        return (
            <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
                <User className="h-4 w-4" />
                <span>{session.name}</span>
                <Badge className={cn("text-xs", roleBadgeColors[session.role])}>
                    {session.role}
                </Badge>
                {session.companyActive && (
                    <>
                        <span className="text-muted-foreground">|</span>
                        <Building2 className="h-4 w-4" />
                        <span>{session.companyActive}</span>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className={cn(
            "flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border",
            className
        )}>
            {/* User Info */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{session.name}</span>
                            <Badge className={cn("text-xs", roleBadgeColors[session.role])}>
                                {session.role.toUpperCase()}
                            </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{session.email}</span>
                    </div>
                </div>

                {/* Company Active */}
                {session.companyActive && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border">
                        <Building2 className="h-4 w-4 text-orange-500" />
                        <div>
                            <span className="text-xs text-muted-foreground block">Active Company</span>
                            <span className="font-medium text-sm">{session.companyActive}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Tracking Info */}
            <div className="flex items-center gap-4">
                {showEvaluationId && session.evaluationId && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/20">
                        <BadgeIcon className="h-4 w-4 text-primary" />
                        <div>
                            <span className="text-xs text-muted-foreground block">Evaluation ID</span>
                            <span className="font-mono text-sm font-semibold text-primary">{session.evaluationId}</span>
                        </div>
                    </div>
                )}

                {session.companyId && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/5 rounded-lg border border-orange-500/20">
                        <Building2 className="h-4 w-4 text-orange-500" />
                        <div>
                            <span className="text-xs text-muted-foreground block">Company ID</span>
                            <span className="font-mono text-sm font-semibold text-orange-600">{session.companyId}</span>
                        </div>
                    </div>
                )}

                {showTimestamp && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{currentTime}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper to update session globally
export function updateSessionCompany(companyName: string, companyId?: string) {
    if (typeof window === 'undefined') return;

    localStorage.setItem('analysisCompanyName', companyName);
    if (companyId) {
        localStorage.setItem('analysisCompanyId', companyId);
    }
    window.dispatchEvent(new Event('session_updated'));
}

// Helper to update evaluation ID
export function updateSessionEvaluationId(evaluationId: string) {
    if (typeof window === 'undefined') return;

    localStorage.setItem('currentEvaluationId', evaluationId);
    localStorage.setItem('analysisEvaluationId', evaluationId);
    window.dispatchEvent(new Event('session_updated'));
}

// Helper to clear session tracking
export function clearSessionTracking() {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('currentEvaluationId');
    localStorage.removeItem('analysisEvaluationId');
    localStorage.removeItem('analysisCompanyName');
    localStorage.removeItem('analysisCompanyId');
    window.dispatchEvent(new Event('session_updated'));
}

// Get current session info
export function getCurrentSession(): SessionInfo | null {
    if (typeof window === 'undefined') return null;

    try {
        const userStr = localStorage.getItem('loggedInUser');
        if (!userStr) return null;

        const user = JSON.parse(userStr);
        return {
            userId: user.id || user.user_id || 'unknown',
            email: user.email || 'unknown',
            name: user.name || user.email?.split('@')[0] || 'User',
            role: (user.role || 'user').toLowerCase() as 'user' | 'admin' | 'analyst',
            companyActive: localStorage.getItem('analysisCompanyName') || undefined,
            companyId: localStorage.getItem('analysisCompanyId') || undefined,
            evaluationId: localStorage.getItem('currentEvaluationId') ||
                localStorage.getItem('analysisEvaluationId') || undefined,
            sessionStart: user.loginTime || Date.now(),
            lastActivity: Date.now(),
        };
    } catch {
        return null;
    }
}
