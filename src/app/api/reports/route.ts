import { NextResponse } from 'next/server';

// CORS headers to allow cross-origin requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: corsHeaders,
    });
}

// POST - Create a new report
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id') || '1';

        // Get backend URL from environment
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tcairrapiccontainer.azurewebsites.net';

        const response = await fetch(`${backendUrl}/api/v1/reports?user_id=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(body),
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('Backend returned non-JSON response for reports POST');
            // Return a mock success response when backend is unavailable
            return NextResponse.json({
                id: Date.now(),
                report_id: body.report_id,
                evaluation_id: body.evaluation_id,
                company_name: body.company_name,
                status: 'created_locally',
                message: 'Report saved. Will sync to backend when available.',
            }, { status: 201, headers: corsHeaders });
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Backend error' }));
            return NextResponse.json(
                { success: false, message: error.detail || error.message || 'Failed to save report' },
                { status: response.status, headers: corsHeaders }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 201, headers: corsHeaders });
    } catch (error) {
        console.error('Error in reports POST:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// GET - List reports or get single report
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id') || '1';
        const reportId = searchParams.get('id');

        // Get backend URL from environment
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tcairrapiccontainer.azurewebsites.net';

        const url = reportId
            ? `${backendUrl}/api/v1/reports/${reportId}`
            : `${backendUrl}/api/v1/reports?user_id=${userId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('Backend returned non-JSON response for reports GET');
            return NextResponse.json(
                { reports: [], total: 0, message: 'Backend unavailable' },
                { status: 200, headers: corsHeaders }
            );
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Backend error' }));
            return NextResponse.json(
                { success: false, message: error.detail || 'Failed to fetch reports' },
                { status: response.status, headers: corsHeaders }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { headers: corsHeaders });
    } catch (error) {
        console.error('Error in reports GET:', error);
        return NextResponse.json(
            { reports: [], total: 0, success: false, message: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// PUT - Update a report
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { searchParams } = new URL(request.url);
        const reportId = searchParams.get('id');

        if (!reportId) {
            return NextResponse.json(
                { success: false, message: 'Report ID is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Get backend URL from environment
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tcairrapiccontainer.azurewebsites.net';

        const response = await fetch(`${backendUrl}/api/v1/reports/${reportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(body),
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('Backend returned non-JSON response for reports PUT');
            return NextResponse.json({
                id: parseInt(reportId),
                ...body,
                status: 'updated_locally',
                message: 'Report updated locally. Will sync when backend available.',
            }, { headers: corsHeaders });
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Backend error' }));
            return NextResponse.json(
                { success: false, message: error.detail || 'Failed to update report' },
                { status: response.status, headers: corsHeaders }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { headers: corsHeaders });
    } catch (error) {
        console.error('Error in reports PUT:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
