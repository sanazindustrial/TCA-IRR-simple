import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
        ? 'https://tca-irr.azurewebsites.net'
        : 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
        }

        const body = await request.json();
        const { query } = body as { query: string };

        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'Query is required' }, { status: 400, headers: CORS_HEADERS });
        }

        // Allow only SELECT statements for safety
        const trimmed = query.trim().toUpperCase();
        if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH')) {
            return NextResponse.json(
                { error: 'Only SELECT queries are allowed' },
                { status: 403, headers: CORS_HEADERS }
            );
        }

        // Proxy to backend
        const backendResponse = await fetch(`${BACKEND_URL}/api/v1/admin/database/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({ query }),
            signal: AbortSignal.timeout(30000),
        });

        if (backendResponse.ok) {
            const data = await backendResponse.json();
            return NextResponse.json(data, { status: 200, headers: CORS_HEADERS });
        }

        // Backend returned an error — forward the status/message
        const errorText = await backendResponse.text().catch(() => 'Query failed');
        return NextResponse.json(
            { error: `Backend error: ${backendResponse.statusText || errorText}` },
            { status: backendResponse.status, headers: CORS_HEADERS }
        );
    } catch {
        return NextResponse.json(
            { error: 'Query execution failed. Backend may be unavailable.' },
            { status: 502, headers: CORS_HEADERS }
        );
    }
}
