import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tcairrapiccontainer.azurewebsites.net';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, detail: 'Invalid JSON request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    const email = String(body.email || '').trim();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const confirmPassword = String(body.confirm_password || body.confirmPassword || '');
    const firstName = String(body.first_name || body.firstName || '').trim();
    const lastName = String(body.last_name || body.lastName || '').trim();
    const fullName = String(body.full_name || body.fullName || `${firstName} ${lastName}`.trim()).trim();

    if (!email || !username || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, detail: 'Missing required fields for registration' },
        { status: 400, headers: corsHeaders }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const upstream = await fetch(`${BACKEND}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          confirm_password: confirmPassword,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
        }),
        cache: 'no-store',
        signal: controller.signal,
      });

      const raw = await upstream.text();
      let payload: any = null;
      try {
        payload = raw ? JSON.parse(raw) : null;
      } catch {
        payload = { detail: raw || 'Upstream service returned non-JSON response' };
      }

      if (!upstream.ok) {
        return NextResponse.json(
          {
            success: false,
            detail: payload?.detail || payload?.message || 'Registration failed',
          },
          { status: upstream.status, headers: corsHeaders }
        );
      }

      return NextResponse.json(payload || { success: true }, { status: 200, headers: corsHeaders });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'Registration service timeout. Please try again.'
        : 'Unable to connect to registration service.';

    return NextResponse.json(
      { success: false, detail: message },
      { status: 503, headers: corsHeaders }
    );
  }
}
