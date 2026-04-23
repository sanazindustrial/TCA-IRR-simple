'use client';

import { useState, useEffect } from 'react';
import {
    healthService,
    type ServiceStatus,
    type ServiceReport,
} from '@/lib/health-service';

/**
 * Subscribe to the full service health report and keep the heartbeat running
 * for as long as this hook is mounted.
 */
export function useServiceHealth() {
    // Use a stable initial state (no dynamic timestamp) to avoid React
    // hydration mismatch error #418 between SSR and client renders.
    const [report, setReport] = useState<ServiceReport>(() => ({
        overall: 'checking' as ServiceStatus,
        groups: [],
        checkedAt: '',
    }));

    useEffect(() => {
        healthService.start();
        return healthService.subscribe(setReport);
    }, []);

    return {
        report,
        overall: report.overall,
        isHealthy: report.overall === 'healthy',
        isDown:    report.overall === 'down',
    };
}
