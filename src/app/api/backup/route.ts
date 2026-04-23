import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';

function getAuthHeader(request: NextRequest): string | null {
    return request.headers.get('authorization');
}

/** GET /api/backup — list backup jobs / recent snapshot list */
export async function GET(request: NextRequest) {
    const auth = getAuthHeader(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Try the backend backup status endpoint first
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`${BACKEND_URL}/api/v1/admin/backup/status`, {
            headers: {
                Authorization: auth,
                'X-Requested-With': 'XMLHttpRequest',
            },
            signal: controller.signal,
            cache: 'no-store',
        });

        if (res.ok) {
            const data = await res.json();
            return NextResponse.json({ source: 'backend', ...data });
        }

        // Try the database health endpoint as a fallback to confirm DB is live
        const dbRes = await fetch(`${BACKEND_URL}/api/v1/admin/database/status`, {
            headers: { Authorization: auth, 'X-Requested-With': 'XMLHttpRequest' },
            signal: AbortSignal.timeout(5000),
            cache: 'no-store',
        }).catch(() => null);

        const dbHealthy = dbRes?.ok ?? false;

        // Backend backup endpoint not available – return structured empty state
        return NextResponse.json({
            source: 'fallback',
            dbHealthy,
            jobs: [],
            message: 'Backup management endpoint not yet available on this deployment.',
        });
    } catch {
        return NextResponse.json({
            source: 'fallback',
            dbHealthy: false,
            jobs: [],
            message: 'Could not reach backend.',
        });
    }
}

/** POST /api/backup — trigger / create a backup job */
export async function POST(request: NextRequest) {
    const auth = getAuthHeader(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const cookieHeader = request.headers.get('cookie') ?? '';
        const csrfMatch = cookieHeader.match(/(?:fastapi-csrf-token|csrf[-_]token|csrftoken)=([^;]+)/i);
        const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1]) : '';

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Authorization: auth,
            'X-Requested-With': 'XMLHttpRequest',
        };
        if (cookieHeader) headers['Cookie'] = cookieHeader;
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken;
            headers['X-CSRF-Token'] = csrfToken;
        }

        const res = await fetch(`${BACKEND_URL}/api/v1/admin/backup/trigger`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15000),
        });

        if (res.ok) {
            const data = await res.json();
            return NextResponse.json(data);
        }

        return NextResponse.json(
            { error: `Backend returned ${res.status}` },
            { status: res.status }
        );
    } catch {
        return NextResponse.json(
            { error: 'Failed to trigger backup.' },
            { status: 502 }
        );
    }
}
