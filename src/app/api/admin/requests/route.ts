import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tcairrapiccontainer.azurewebsites.net';

export async function GET(request: NextRequest) {
    const token = request.headers.get('Authorization') || '';
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${BACKEND_URL}/api/v1/admin/requests${queryString ? `?${queryString}` : ''}`;

    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 });
    }
}

export async function POST(request: NextRequest) {
    const token = request.headers.get('Authorization') || '';
    const body = await request.json().catch(() => ({}));
    const url = `${BACKEND_URL}/api/v1/admin/requests`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 });
    }
}

export async function PATCH(request: NextRequest) {
    const token = request.headers.get('Authorization') || '';
    const body = await request.json().catch(() => ({}));
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${BACKEND_URL}/api/v1/admin/requests${queryString ? `?${queryString}` : ''}`;

    try {
        const res = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 });
    }
}
