'use client';

import { useState, useEffect } from 'react';
import { healthService, type ServiceStatus } from '@/lib/health-service';

/**
 * Subscribe to backend health status and keep the heartbeat running
 * for as long as this hook is mounted.
 */
export function useServiceHealth() {
    const [status, setStatus] = useState<ServiceStatus>(
        healthService.getStatus()
    );

    useEffect(() => {
        healthService.start();
        return healthService.subscribe(setStatus);
        // No cleanup for the timer itself – the heartbeat should keep running
        // across the app lifetime once started.
    }, []);

    return {
        status,
        isHealthy: status === 'healthy',
        isDown: status === 'down',
    };
}
