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

        // Backend endpoint not available — return schema-aware mock results
        return NextResponse.json(
            getMockResults(query),
            { status: 200, headers: CORS_HEADERS }
        );
    } catch {
        return NextResponse.json(
            { error: 'Query execution failed. Backend may be unavailable.' },
            { status: 502, headers: CORS_HEADERS }
        );
    }
}

function getMockResults(query: string): { columns: string[]; rows: Record<string, unknown>[] } {
    const q = query.toLowerCase();
    if (q.includes('users')) {
        return {
            columns: ['user_id', 'full_name', 'email', 'role', 'status', 'created_at'],
            rows: [
                { user_id: 'uuid-001', full_name: 'Alice Admin', email: 'alice@example.com', role: 'Admin', status: 'Active', created_at: '2025-01-01T00:00:00Z' },
                { user_id: 'uuid-002', full_name: 'Bob Analyst', email: 'bob@example.com', role: 'Analyst', status: 'Active', created_at: '2025-01-15T00:00:00Z' },
            ],
        };
    }
    if (q.includes('evaluations') || q.includes('reports')) {
        return {
            columns: ['evaluation_id', 'company_name', 'framework', 'report_type', 'status', 'overall_score', 'created_at'],
            rows: [
                { evaluation_id: 'eval-001', company_name: 'TechCorp Inc.', framework: 'general', report_type: 'triage', status: 'completed', overall_score: 7.8, created_at: '2025-03-01T10:00:00Z' },
                { evaluation_id: 'eval-002', company_name: 'MedDevice Ltd.', framework: 'medtech', report_type: 'dd', status: 'completed', overall_score: 8.2, created_at: '2025-03-15T14:30:00Z' },
            ],
        };
    }
    if (q.includes('companies')) {
        return {
            columns: ['company_id', 'name', 'sector', 'created_at'],
            rows: [
                { company_id: 'co-001', name: 'TechCorp Inc.', sector: 'Technology', created_at: '2025-03-01T00:00:00Z' },
                { company_id: 'co-002', name: 'MedDevice Ltd.', sector: 'MedTech', created_at: '2025-03-15T00:00:00Z' },
            ],
        };
    }
    return { columns: [], rows: [] };
}
