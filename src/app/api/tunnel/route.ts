import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';
const SSD_API_KEY = process.env.SSD_API_KEY;

// POST /api/tunnel — Submit a file for analysis via the tunnel
export async function POST(req: NextRequest) {
    if (!SSD_API_KEY) {
        return NextResponse.json({ error: 'SSD service not configured' }, { status: 503 });
    }
    try {
        const contentType = req.headers.get('content-type') || '';
        let companyName = '';
        let companyId = '';
        let analysisType = 'comprehensive';
        let forwardFormData: FormData | null = null;

        if (contentType.includes('multipart/form-data')) {
            const incoming = await req.formData();
            companyName = (incoming.get('company_name') as string) || '';
            companyId = (incoming.get('company_id') as string) || '';
            analysisType = (incoming.get('analysis_type') as string) || 'comprehensive';

            // Forward only the file fields to the backend
            forwardFormData = new FormData();
            for (const [key, value] of incoming.entries()) {
                forwardFormData.append(key, value);
            }
        } else {
            const body = await req.json();
            companyName = body.company_name || '';
            companyId = body.company_id || '';
            analysisType = body.analysis_type || 'comprehensive';
        }

        if (!companyName) {
            return NextResponse.json(
                { error: 'company_name is required' },
                { status: 400 }
            );
        }

        const trackingId = `tunnel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const submittedAt = new Date().toISOString();

        // Forward to backend SSD evaluate endpoint
        let backendResponse: Response;
        if (forwardFormData) {
            backendResponse = await fetch(`${BACKEND_URL}/api/v1/ssd/evaluate`, {
                method: 'POST',
                headers: {
                    'X-API-Key': SSD_API_KEY,
                    'X-Tracking-ID': trackingId,
                },
                body: forwardFormData,
                signal: AbortSignal.timeout(120000),
            });
        } else {
            backendResponse = await fetch(`${BACKEND_URL}/api/v1/ssd/evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': SSD_API_KEY,
                    'X-Tracking-ID': trackingId,
                },
                body: JSON.stringify({
                    company_name: companyName,
                    company_id: companyId || undefined,
                    analysis_type: analysisType,
                }),
                signal: AbortSignal.timeout(120000),
            });
        }

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            return NextResponse.json(
                {
                    error: 'Backend evaluation failed',
                    status: backendResponse.status,
                    detail: errorText,
                    tracking_id: trackingId,
                },
                { status: backendResponse.status }
            );
        }

        const result = await backendResponse.json();

        return NextResponse.json({
            tracking_id: trackingId,
            report_id: result.report_id || result.id || null,
            status: 'submitted',
            company_name: companyName,
            submitted_at: submittedAt,
            message: 'Analysis submitted successfully via tunnel',
            result,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const isTimeout = message.toLowerCase().includes('timeout') || message.toLowerCase().includes('abort');
        return NextResponse.json(
            {
                error: isTimeout ? 'Request timed out' : 'Tunnel submission failed',
                detail: message,
            },
            { status: isTimeout ? 504 : 500 }
        );
    }
}

// GET /api/tunnel — Check tunnel connection status
export async function GET() {
    const startTime = Date.now();

    try {
        const healthResponse = await fetch(`${BACKEND_URL}/api/v1/ssd/health`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': SSD_API_KEY,
            },
            signal: AbortSignal.timeout(10000),
        });

        const latency = Date.now() - startTime;

        if (healthResponse.ok) {
            const health = await healthResponse.json();
            return NextResponse.json({
                status: 'connected',
                latency_ms: latency,
                endpoint: `${BACKEND_URL}/api/v1`,
                backend_status: health.status || 'ok',
                checked_at: new Date().toISOString(),
            });
        }

        return NextResponse.json({
            status: 'degraded',
            latency_ms: latency,
            endpoint: `${BACKEND_URL}/api/v1`,
            http_status: healthResponse.status,
            checked_at: new Date().toISOString(),
        });
    } catch (error) {
        const latency = Date.now() - startTime;
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            status: 'disconnected',
            latency_ms: latency,
            endpoint: `${BACKEND_URL}/api/v1`,
            error: message,
            checked_at: new Date().toISOString(),
        });
    }
}
