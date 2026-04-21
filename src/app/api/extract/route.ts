/**
 * Server-side File Extraction API Route
 *
 * Proxies file extraction requests to the FastAPI backend with multiple
 * fallback strategies and proper multi-format support.
 *
 * Supported formats: PDF, DOCX, PPTX, XLSX, CSV, TXT, HTML
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

/** Try an extraction endpoint, return text or null */
async function tryEndpoint(url: string, init: RequestInit): Promise<string | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 25_000);
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.text_content ?? data.content ?? data.text ?? '') || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? '';
    let text: string | null = null;
    let filename = 'document';

    if (contentType.includes('multipart/form-data')) {
      // ── Strategy 1: Forward FormData directly to backend ──────────────────
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file in form data' }, { status: 400, headers: corsHeaders });
      }
      filename = file.name;
      const mimeType = file.type;

      // Strategy 1a: multipart/form-data to /api/v1/files/extract-text
      {
        const fd = new FormData();
        fd.append('file', file, filename);
        text = await tryEndpoint(`${BACKEND}/api/v1/files/extract-text`, { method: 'POST', body: fd });
      }

      // Strategy 1b: multipart to /api/v1/extract/file
      if (!text) {
        const fd = new FormData();
        fd.append('file', file, filename);
        text = await tryEndpoint(`${BACKEND}/api/v1/extract/file`, { method: 'POST', body: fd });
      }

      // Strategy 1c: multipart to /api/v1/upload/extract
      if (!text) {
        const fd = new FormData();
        fd.append('file', file, filename);
        text = await tryEndpoint(`${BACKEND}/api/v1/upload/extract`, { method: 'POST', body: fd });
      }

      // Strategy 1d: base64 JSON to /api/v1/files/extract-text
      if (!text) {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        text = await tryEndpoint(`${BACKEND}/api/v1/files/extract-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_content: base64, filename, mime_type: mimeType }),
        });
      }

      // Strategy 1e: JSON to /api/v1/extract/base64
      if (!text) {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        text = await tryEndpoint(`${BACKEND}/api/v1/extract/base64`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: base64, filename, format: filename.split('.').pop()?.toLowerCase() }),
        });
      }

      // Strategy 1f: client-side text extraction for plain text files
      if (!text) {
        const lower = filename.toLowerCase();
        if (lower.endsWith('.txt') || lower.endsWith('.csv') || lower.endsWith('.html') || lower.endsWith('.htm')) {
          const buf = await file.arrayBuffer();
          text = Buffer.from(buf).toString('utf-8');
        }
      }

    } else if (contentType.includes('application/json')) {
      // ── Strategy 2: JSON body (base64 or text) ────────────────────────────
      const body = await req.json() as {
        file_content?: string;
        content?: string;
        filename?: string;
        file_url?: string;
        text?: string;
      };

      filename = body.filename ?? 'document';

      if (body.text) {
        text = body.text;
      } else if (body.file_url) {
        // Fetch from URL and extract
        text = await tryEndpoint(`${BACKEND}/api/v1/files/extract-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_url: body.file_url }),
        });
        if (!text) {
          text = await tryEndpoint(`${BACKEND}/api/v1/scrape/url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: body.file_url }),
          });
        }
      } else if (body.file_content ?? body.content) {
        const b64 = body.file_content ?? body.content ?? '';
        // Strategy 2a
        text = await tryEndpoint(`${BACKEND}/api/v1/files/extract-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_content: b64, filename }),
        });
        // Strategy 2b
        if (!text) {
          text = await tryEndpoint(`${BACKEND}/api/v1/extract/base64`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: b64, filename, format: filename.split('.').pop()?.toLowerCase() }),
          });
        }
        // Strategy 2c: try to decode as UTF-8 text directly for plain formats
        if (!text) {
          const lower = filename.toLowerCase();
          if (lower.endsWith('.txt') || lower.endsWith('.csv')) {
            try {
              text = Buffer.from(b64, 'base64').toString('utf-8');
            } catch {
              // ignore
            }
          }
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported content-type. Use multipart/form-data or application/json.' },
        { status: 415, headers: corsHeaders }
      );
    }

    if (text && text.trim().length > 0) {
      return NextResponse.json(
        { text_content: text, filename, success: true },
        { status: 200, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { text_content: '', filename, success: false, message: 'Extraction returned no text' },
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error('[/api/extract] Error:', err);
    return NextResponse.json(
      { error: 'Extraction failed', detail: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
