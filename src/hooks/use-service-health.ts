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
    const [report, setReport] = useState<ServiceReport>(
        healthService.getReport()
    );

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
