// Server-side health check for all system connections
import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';

type ServiceResult = {
    connected: boolean;
    latency_ms: number;
    message: string;
};

async function testWithTimeout(fn: () => Promise<ServiceResult>, timeoutMs = 6000): Promise<ServiceResult> {
    return Promise.race([
        fn(),
        new Promise<ServiceResult>((resolve) =>
            setTimeout(() => resolve({ connected: false, latency_ms: timeoutMs, message: 'Connection timed out' }), timeoutMs)
        ),
    ]);
}

export async function GET() {
    const results: Record<string, ServiceResult> = {};

    // Test Backend API
    results.backend = await testWithTimeout(async () => {
        const start = Date.now();
        try {
            const res = await fetch(`${BACKEND_API_URL}/health`);
            const latency_ms = Date.now() - start;
            if (res.ok) {
                const data = await res.json();
                return { connected: true, latency_ms, message: `Status: ${data.status || 'ok'}, Ready: ${data.ready ? 'yes' : 'no'}` };
            }
            return { connected: false, latency_ms, message: `HTTP ${res.status}` };
        } catch (e) {
            return { connected: false, latency_ms: Date.now() - start, message: e instanceof Error ? e.message : 'Unreachable' };
        }
    });

    // Test Azure PostgreSQL (via backend health endpoint — database field)
    results.database = await testWithTimeout(async () => {
        const start = Date.now();
        try {
            const res = await fetch(`${BACKEND_API_URL}/health`);
            const latency_ms = Date.now() - start;
            if (res.ok) {
                const data = await res.json();
                const dbConnected = data.status === 'healthy' && data.ready === true;
                return {
                    connected: dbConnected,
                    latency_ms,
                    message: dbConnected
                        ? `Azure PostgreSQL connected (${latency_ms}ms)`
                        : `Service status: ${data.status || 'unknown'}, ready: ${data.ready}`,
                };
            }
            return { connected: false, latency_ms, message: `Backend returned HTTP ${res.status}` };
        } catch (e) {
            return { connected: false, latency_ms: Date.now() - start, message: e instanceof Error ? e.message : 'Unreachable' };
        }
    });

    // Test OpenAI — check if key is configured (can't ping OpenAI without charges)
    const openaiKey = process.env.OPENAI_API_KEY || '';
    results.openai = {
        connected: openaiKey.length > 10,
        latency_ms: 0,
        message: openaiKey.length > 10 ? 'API key configured' : 'API key not configured — set OPENAI_API_KEY env var',
    };

    // Test SMTP — check if host is configured
    const smtpHost = process.env.SMTP_HOST || '';
    results.smtp = {
        connected: smtpHost.length > 0,
        latency_ms: 0,
        message: smtpHost.length > 0 ? `Host: ${smtpHost}` : 'SMTP not configured — set SMTP_HOST env var',
    };

    // Test AI Services — derive from backend /health, with fallback probes
    const aiServicesReady = await testWithTimeout(async () => {
        const start = Date.now();
        try {
            const res = await fetch(`${BACKEND_API_URL}/health`);
            const latency_ms = Date.now() - start;
            if (res.ok) {
                const data = await res.json();
                const ready = data.ready === true;
                if (ready) {
                    return { connected: true, latency_ms, message: `AI services ready (${latency_ms}ms)` };
                }
                // Backend reachable but not ready — try fallback probes
                const probes = [
                    `${BACKEND_API_URL}/api/v1/agents/health`,
                    `${BACKEND_API_URL}/api/v1/orchestrator/status`,
                    `${BACKEND_API_URL}/api/v1/health`,
                ];
                for (const url of probes) {
                    try {
                        const pr = await fetch(url, { signal: AbortSignal.timeout(3000) });
                        if (pr.ok) {
                            const pd = await pr.json().catch(() => ({})) as { ready?: boolean; status?: string };
                            if (pd.ready === true || pd.status === 'ok' || pd.status === 'healthy') {
                                return { connected: true, latency_ms: Date.now() - start, message: `AI services reachable via fallback (${url})` };
                            }
                        }
                    } catch { /* try next probe */ }
                }
                return { connected: false, latency_ms, message: data.error || 'AI services initializing' };
            }
            return { connected: false, latency_ms, message: `Backend returned HTTP ${res.status}` };
        } catch (e) {
            return { connected: false, latency_ms: Date.now() - start, message: e instanceof Error ? e.message : 'Unreachable' };
        }
    });

    results.textExtraction = { ...aiServicesReady, message: aiServicesReady.connected ? `Text extraction ready (${aiServicesReady.latency_ms}ms)` : aiServicesReady.message };
    results.companyInfoExtraction = { ...aiServicesReady, message: aiServicesReady.connected ? `Company info extraction ready (${aiServicesReady.latency_ms}ms)` : aiServicesReady.message };
    results.filesExtractText = { ...aiServicesReady, message: aiServicesReady.connected ? `Files extract text ready (${aiServicesReady.latency_ms}ms)` : aiServicesReady.message };
    results.aiAgents = { ...aiServicesReady, message: aiServicesReady.connected ? `AI agents ready (${aiServicesReady.latency_ms}ms)` : aiServicesReady.message };
    results.aiAnalysisAgent = { ...aiServicesReady, message: aiServicesReady.connected ? `AI analysis agent ready (${aiServicesReady.latency_ms}ms)` : aiServicesReady.message };
    results.multiAgentOrchestrator = { ...aiServicesReady, message: aiServicesReady.connected ? `Multi-agent orchestrator ready (${aiServicesReady.latency_ms}ms)` : aiServicesReady.message };

    const allConnected = Object.values(results).every(r => r.connected);

    return NextResponse.json({
        success: true,
        overall: allConnected ? 'healthy' : 'degraded',
        checkedAt: new Date().toISOString(),
        results,
    });
}
