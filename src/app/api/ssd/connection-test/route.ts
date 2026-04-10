'use server';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';
const SSD_API_KEY = process.env.SSD_API_KEY || 'ssd-tca-58ceb369539c4a098b9ac49c';

interface ConnectionTestResult {
    endpoint: string;
    status: 'connected' | 'failed' | 'timeout' | 'auth_failed';
    latency_ms: number;
    message: string;
    details?: Record<string, unknown>;
}

interface WorkflowStep {
    step: number;
    name: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    endpoint?: string;
    timestamp?: string;
    response?: unknown;
}

export async function GET() {
    const results: ConnectionTestResult[] = [];
    const workflow: WorkflowStep[] = [];
    const startTime = Date.now();

    // Step 1: Test TCA-IRR Backend API Health using /api/v1/ssd/health (more reliable)
    workflow.push({
        step: 1,
        name: 'Backend API Health',
        status: 'running',
        endpoint: `${BACKEND_API_URL}/api/v1/ssd/health`,
        timestamp: new Date().toISOString()
    });

    try {
        const healthStart = Date.now();
        // Use SSD health endpoint which is more reliable
        const healthResponse = await fetch(`${BACKEND_API_URL}/api/v1/ssd/health`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': SSD_API_KEY
            },
            signal: AbortSignal.timeout(10000)
        });
        const healthLatency = Date.now() - healthStart;

        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            results.push({
                endpoint: 'Backend API Health',
                status: 'connected',
                latency_ms: healthLatency,
                message: `Status: ${healthData.status}, Database: ${JSON.stringify(healthData.reports_directory_exists ? 'connected' : 'checking')}`,
                details: healthData
            });
            workflow[0].status = 'success';
            workflow[0].response = healthData;
        } else {
            results.push({
                endpoint: 'Backend API Health',
                status: 'failed',
                latency_ms: healthLatency,
                message: `Backend returned HTTP ${healthResponse.status}`
            });
            workflow[0].status = 'failed';
        }
    } catch (error) {
        results.push({
            endpoint: 'Backend API Health',
            status: error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'failed',
            latency_ms: Date.now() - startTime,
            message: error instanceof Error ? error.message : 'Connection failed'
        });
        workflow[0].status = 'failed';
    }

    // Step 2: Test SSD Audit Logs Endpoint
    workflow.push({
        step: 2,
        name: 'SSD Audit Logs Endpoint',
        status: 'running',
        endpoint: `${BACKEND_API_URL}/api/v1/ssd/audit/logs`,
        timestamp: new Date().toISOString()
    });

    try {
        const auditStart = Date.now();
        const auditResponse = await fetch(`${BACKEND_API_URL}/api/v1/ssd/audit/logs`, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'X-API-Key': SSD_API_KEY },
            signal: AbortSignal.timeout(10000)
        });
        const auditLatency = Date.now() - auditStart;

        if (auditResponse.ok) {
            const auditData = await auditResponse.json();
            results.push({
                endpoint: 'SSD Audit Logs',
                status: 'connected',
                latency_ms: auditLatency,
                message: `Found ${auditData.logs?.length || 0} audit logs`,
                details: { count: auditData.logs?.length || 0 }
            });
            workflow[1].status = 'success';
            workflow[1].response = { logs_count: auditData.logs?.length || 0 };
        } else if (auditResponse.status === 404) {
            results.push({
                endpoint: 'SSD Audit Logs',
                status: 'failed',
                latency_ms: auditLatency,
                message: 'SSD audit endpoint not deployed on backend'
            });
            workflow[1].status = 'failed';
        } else if (auditResponse.status === 401 || auditResponse.status === 403) {
            results.push({
                endpoint: 'SSD Audit Logs',
                status: 'auth_failed',
                latency_ms: auditLatency,
                message: 'Authentication required for SSD audit endpoint'
            });
            workflow[1].status = 'failed';
        } else {
            results.push({
                endpoint: 'SSD Audit Logs',
                status: 'failed',
                latency_ms: auditLatency,
                message: `HTTP ${auditResponse.status}`
            });
            workflow[1].status = 'failed';
        }
    } catch (error) {
        results.push({
            endpoint: 'SSD Audit Logs',
            status: 'timeout',
            latency_ms: Date.now() - startTime,
            message: error instanceof Error ? error.message : 'Connection failed'
        });
        workflow[1].status = 'failed';
    }

    // Step 3: Test SSD Stats Endpoint
    workflow.push({
        step: 3,
        name: 'SSD Statistics Endpoint',
        status: 'running',
        endpoint: `${BACKEND_API_URL}/api/v1/ssd/audit/stats`,
        timestamp: new Date().toISOString()
    });

    try {
        const statsStart = Date.now();
        const statsResponse = await fetch(`${BACKEND_API_URL}/api/v1/ssd/audit/stats`, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'X-API-Key': SSD_API_KEY },
            signal: AbortSignal.timeout(10000)
        });
        const statsLatency = Date.now() - statsStart;

        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            results.push({
                endpoint: 'SSD Statistics',
                status: 'connected',
                latency_ms: statsLatency,
                message: 'Statistics endpoint responding',
                details: statsData
            });
            workflow[2].status = 'success';
            workflow[2].response = statsData;
        } else if (statsResponse.status === 404) {
            results.push({
                endpoint: 'SSD Statistics',
                status: 'failed',
                latency_ms: statsLatency,
                message: 'SSD stats endpoint not deployed on backend'
            });
            workflow[2].status = 'failed';
        } else {
            results.push({
                endpoint: 'SSD Statistics',
                status: 'failed',
                latency_ms: statsLatency,
                message: `HTTP ${statsResponse.status}`
            });
            workflow[2].status = 'failed';
        }
    } catch (error) {
        results.push({
            endpoint: 'SSD Statistics',
            status: 'timeout',
            latency_ms: Date.now() - startTime,
            message: error instanceof Error ? error.message : 'Connection failed'
        });
        workflow[2].status = 'failed';
    }

    // Step 4: Test Startup Steroid incoming webhook endpoint (uses callback-test endpoint)
    workflow.push({
        step: 4,
        name: 'SSD Webhook Receiver',
        status: 'running',
        endpoint: `${BACKEND_API_URL}/api/v1/ssd/callback-test`,
        timestamp: new Date().toISOString()
    });

    try {
        const webhookStart = Date.now();
        // Just GET request to check if webhook/callback endpoint exists
        const webhookResponse = await fetch(`${BACKEND_API_URL}/api/v1/ssd/callback-test`, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'X-API-Key': SSD_API_KEY },
            signal: AbortSignal.timeout(10000)
        });
        const webhookLatency = Date.now() - webhookStart;

        // Check if endpoint exists and responds
        if (webhookResponse.ok || webhookResponse.status === 405 || webhookResponse.status === 200) {
            results.push({
                endpoint: 'SSD Webhook Receiver',
                status: 'connected',
                latency_ms: webhookLatency,
                message: 'Webhook endpoint is available'
            });
            workflow[3].status = 'success';
        } else if (webhookResponse.status === 404) {
            results.push({
                endpoint: 'SSD Webhook Receiver',
                status: 'failed',
                latency_ms: webhookLatency,
                message: 'Webhook endpoint not deployed'
            });
            workflow[3].status = 'failed';
        } else {
            results.push({
                endpoint: 'SSD Webhook Receiver',
                status: 'connected',
                latency_ms: webhookLatency,
                message: `Endpoint exists (HTTP ${webhookResponse.status})`
            });
            workflow[3].status = 'success';
        }
    } catch (error) {
        results.push({
            endpoint: 'SSD Webhook Receiver',
            status: 'timeout',
            latency_ms: Date.now() - startTime,
            message: error instanceof Error ? error.message : 'Connection failed'
        });
        workflow[3].status = 'failed';
    }

    const totalTime = Date.now() - startTime;
    const allConnected = results.every(r => r.status === 'connected');
    const anyAuthFailed = results.some(r => r.status === 'auth_failed');

    return NextResponse.json({
        success: allConnected,
        overall_status: allConnected ? 'healthy' : anyAuthFailed ? 'auth_required' : 'degraded',
        total_latency_ms: totalTime,
        tested_at: new Date().toISOString(),
        backend_url: BACKEND_API_URL,
        results,
        workflow
    });
}

export async function POST(request: NextRequest) {
    // Test sending a simulated request through the pipeline
    try {
        const body = await request.json();
        const { test_company_name, test_founder_email, callback_url } = body;

        const testPayload = {
            company_name: test_company_name || 'Test Company (Connection Test)',
            founder_email: test_founder_email || 'test@example.com',
            callback_url: callback_url || null,
            test_mode: true,
            source: 'connection_test'
        };

        const response = await fetch(`${BACKEND_API_URL}/api/v1/ssd/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Test-Mode': 'true'
            },
            body: JSON.stringify(testPayload),
            signal: AbortSignal.timeout(30000)
        });

        const responseData = await response.json().catch(() => ({}));

        return NextResponse.json({
            success: response.ok,
            status_code: response.status,
            tracking_id: responseData.tracking_id || null,
            message: response.ok
                ? 'Test request sent successfully through pipeline'
                : `Webhook returned HTTP ${response.status}`,
            response: responseData
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            status_code: 0,
            message: error instanceof Error ? error.message : 'Failed to send test request',
        }, { status: 500 });
    }
}
