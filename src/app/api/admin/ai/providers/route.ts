import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tcairrapiccontainer.azurewebsites.net';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const targets = ['/api/v1/admin/ai/providers', '/api/v1/ai/providers'];
  const errors: string[] = [];

  for (const path of targets) {
    try {
      const res = await fetch(`${BACKEND}${path}`, {
        method: 'GET',
        headers: {
          ...(auth ? { Authorization: auth } : {}),
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        errors.push(`${path}:${res.status}`);
        continue;
      }

      const payload = await res.json().catch(() => null);
      if (!payload) {
        errors.push(`${path}:invalid_json`);
        continue;
      }

      return NextResponse.json(payload, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-store',
        },
      });
    } catch (err) {
      errors.push(`${path}:${err instanceof Error ? err.message : 'request_failed'}`);
    }
  }

  return NextResponse.json(
    {
      status: 'degraded',
      mode: 'fallback',
      active_provider: 'Fallback (provider endpoint unavailable)',
      providers: [],
      chain: [],
      warning: 'Provider endpoints unavailable',
      upstreamErrors: errors,
    },
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store',
      },
    }
  );
}
