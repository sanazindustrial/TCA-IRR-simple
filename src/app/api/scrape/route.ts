/**
 * URL Scraping Proxy API Route
 * Proxies URL scraping requests to the FastAPI backend.
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { url: string };
    if (!body.url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400, headers: corsHeaders });
    }

    // Validate URL to prevent SSRF
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(body.url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400, headers: corsHeaders });
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400, headers: corsHeaders });
    }

    // Block private/local IPs
    const hostname = parsedUrl.hostname.toLowerCase();
    const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254', '10.', '192.168.', '172.'];
    if (blocked.some(b => hostname === b || hostname.startsWith(b))) {
      return NextResponse.json({ error: 'Private URLs are not allowed' }, { status: 400, headers: corsHeaders });
    }

    // Try backend scraping endpoints
    const endpoints = [
      `/api/v1/scrape/url`,
      `/api/v1/extract/url`,
      `/api/v1/files/extract-url`,
    ];

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 20_000);
        const res = await fetch(`${BACKEND}${ep}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: body.url }),
          signal: controller.signal,
        });
        clearTimeout(tid);
        if (res.ok) {
          const data = await res.json();
          const text = data.text_content ?? data.content ?? data.text ?? '';
          if (text) {
            return NextResponse.json({ text_content: text, url: body.url, success: true }, { status: 200, headers: corsHeaders });
          }
        }
      } catch {
        // try next
      }
    }

    return NextResponse.json(
      { text_content: '', url: body.url, success: false, message: 'Could not scrape URL' },
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    return NextResponse.json(
      { error: 'Scrape failed', detail: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
