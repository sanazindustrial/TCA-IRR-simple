'use client';

import { useServiceHealth } from '@/hooks/use-service-health';
import { type ServiceStatus } from '@/lib/health-service';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

const CONFIG: Record<
    ServiceStatus,
    { label: string; dotClass: string; iconClass: string; spin?: boolean }
> = {
    checking: {
        label: 'Connecting…',
        dotClass: 'bg-muted-foreground',
        iconClass: 'text-muted-foreground',
        spin: true,
    },
    healthy: {
        label: 'Services Online',
        dotClass: 'bg-green-500',
        iconClass: 'text-green-500',
    },
    degraded: {
        label: 'Services Degraded',
        dotClass: 'bg-yellow-500',
        iconClass: 'text-yellow-500',
    },
    down: {
        label: 'Services Offline',
        dotClass: 'bg-red-500',
        iconClass: 'text-red-500',
    },
};

export function ServiceHealthIndicator() {
    const { status } = useServiceHealth();
    const { label, dotClass, iconClass, spin } = CONFIG[status];

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
            {spin ? (
                <Loader2
                    className={`size-3 animate-spin shrink-0 ${iconClass}`}
                    aria-hidden="true"
                />
            ) : (
                <span
                    className={`inline-block size-2 rounded-full shrink-0 ${dotClass} ${
                        status === 'healthy' ? 'animate-pulse' : ''
                    }`}
                    aria-hidden="true"
                />
            )}
            <span className={iconClass}>{label}</span>
        </div>
    );
}
