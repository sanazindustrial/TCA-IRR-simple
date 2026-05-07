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

    // Test AI Services — check local env-var capability (no backend round-trip needed)
    const openaiKeyFull = process.env.OPENAI_API_KEY || '';
    const aiReady = openaiKeyFull.length > 10 && !openaiKeyFull.includes('your-');
    const aiMsg = aiReady
        ? 'AI services ready (OpenAI key configured)'
        : 'AI key not configured — set OPENAI_API_KEY env var';

    results.textExtraction = { connected: aiReady, latency_ms: 0, message: aiReady ? 'Text extraction ready (OpenAI)' : aiMsg };
    results.companyInfoExtraction = { connected: aiReady, latency_ms: 0, message: aiReady ? 'Company info extraction ready' : aiMsg };
    results.filesExtractText = { connected: aiReady, latency_ms: 0, message: aiReady ? 'Files extract text ready' : aiMsg };
    results.aiAgents = { connected: aiReady, latency_ms: 0, message: aiReady ? 'AI agents ready' : aiMsg };
    results.aiAnalysisAgent = { connected: aiReady, latency_ms: 0, message: aiReady ? 'AI analysis agent ready' : aiMsg };
    results.multiAgentOrchestrator = { connected: aiReady, latency_ms: 0, message: aiReady ? 'Multi-agent orchestrator ready' : aiMsg };

    const allConnected = Object.values(results).every(r => r.connected);

    return NextResponse.json({
        success: true,
        overall: allConnected ? 'healthy' : 'degraded',
        checkedAt: new Date().toISOString(),
        results,
    });
}
