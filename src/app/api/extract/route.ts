/**
 * Server-side File Extraction API Route
 *
 * Proxies file extraction requests to the FastAPI backend with multiple
 * fallback strategies and full multi-format support.
 *
 * Supported formats:
 *   Documents : PDF, DOCX, DOC, PPTX, PPT, XLSX, XLS, CSV, TXT, RTF, ODT, ODP, ODS, HTML
 *   Images    : JPG, JPEG, PNG, GIF, WEBP, BMP, TIFF  (AI vision / OCR)
 *   Data      : JSON (parsed directly)
 *   Google    : docs.google.com, slides, sheets, drive.google.com URLs
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
async function tryEndpoint(url: string, init: RequestInit, authHeader?: string): Promise<string | null> {
  if (authHeader) {
    init = {
      ...init,
      headers: { Authorization: authHeader, ...(init.headers as Record<string, string> ?? {}) },
    };
  }
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
    const incomingAuth = req.headers.get('authorization') ?? '';
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

      // Strategy 1a: base64 JSON to /api/v1/analysis/extract-text-from-file (real endpoint)
      {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        text = await tryEndpoint(`${BACKEND}/api/v1/analysis/extract-text-from-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: base64, filename, mime_type: mimeType }),
        }, incomingAuth);
      }

      // Strategy 1b: multipart to /api/v1/files/upload (requires auth)
      if (!text && incomingAuth) {
        const fd = new FormData();
        fd.append('file', file, filename);
        text = await tryEndpoint(`${BACKEND}/api/v1/files/upload`, { method: 'POST', body: fd }, incomingAuth);
      }

      // Strategy 1f: client-side text extraction for plain/data files
      if (!text) {
        const lower = filename.toLowerCase();
        // Plain text formats — read directly
        if (lower.endsWith('.txt') || lower.endsWith('.csv') || lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.rtf')) {
          const buf = await file.arrayBuffer();
          text = Buffer.from(buf).toString('utf-8');
        }
        // JSON — parse and return human-readable text
        if (!text && lower.endsWith('.json')) {
          try {
            const buf = await file.arrayBuffer();
            const raw = Buffer.from(buf).toString('utf-8');
            const parsed = JSON.parse(raw);
            text = `JSON Data from ${filename}:\n\n${JSON.stringify(parsed, null, 2)}`;
          } catch {
            const buf = await file.arrayBuffer();
            text = Buffer.from(buf).toString('utf-8');
          }
        }
      }

      // Strategy 1g: image files — try backend AI vision / OCR endpoints
      if (!text) {
        const lower = filename.toLowerCase();
        const isImage = /\.(jpe?g|png|gif|webp|bmp|tiff?|heic|heif)$/i.test(lower);
        if (isImage) {
          // Try AI vision endpoints
          const arrayBuffer = await file.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const mimeType = file.type || 'image/jpeg';

          const visionEndpoints = [
            { url: `${BACKEND}/api/v1/analysis/extract-text-from-file`, body: { content: base64, filename, mime_type: mimeType } },
            { url: `${BACKEND}/api/v1/ai/vision`, body: { image_base64: base64, mime_type: mimeType, filename } },
            { url: `${BACKEND}/api/v1/ocr`, body: { image: base64, mime_type: mimeType } },
          ];
          for (const ep of visionEndpoints) {
            if (text) break;
            text = await tryEndpoint(ep.url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(ep.body),
            }, incomingAuth);
          }
          // If no OCR result, provide a descriptor so downstream AI at least knows an image was provided
          if (!text) {
            text = `[Image file: ${filename}. Please describe or analyze this image for the investor report.]`;
          }
        }
      }

      // Strategy 1h: Server-side Office extraction (PPTX, DOCX, XLSX) — pure Node.js, no backend needed
      if (!text) {
        const lower = filename.toLowerCase();
        try {
          if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) {
            // PPTX is a ZIP — extract text from ppt/slides/slide*.xml
            const AdmZip = (await import('adm-zip')).default;
            const buf = Buffer.from(await file.arrayBuffer());
            const zip = new AdmZip(buf);
            const slideEntries = zip.getEntries()
              .filter(e => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))
              .sort((a, b) => a.entryName.localeCompare(b.entryName));
            const parts: string[] = [];
            for (const entry of slideEntries) {
              const xml = entry.getData().toString('utf-8');
              const matches = xml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) ?? [];
              const txt = matches.map(m => m.replace(/<[^>]+>/g, '')).filter(Boolean).join(' ');
              if (txt.trim()) parts.push(txt.trim());
            }
            text = parts.join('\n\n') || null;
          } else if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
            // DOCX is a ZIP — extract text from word/document.xml
            const AdmZip = (await import('adm-zip')).default;
            const buf = Buffer.from(await file.arrayBuffer());
            const zip = new AdmZip(buf);
            const docEntry = zip.getEntry('word/document.xml');
            if (docEntry) {
              const xml = docEntry.getData().toString('utf-8');
              const matches = xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? [];
              const joined = matches.map(m => m.replace(/<[^>]+>/g, '')).filter(Boolean).join(' ');
              text = joined || null;
            }
          } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
            // XLSX — use the xlsx package
            const XLSX = await import('xlsx');
            const buf = Buffer.from(await file.arrayBuffer());
            const wb = XLSX.read(buf, { type: 'buffer' });
            const parts: string[] = [];
            for (const name of wb.SheetNames) {
              const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name]);
              if (csv.trim()) parts.push(`Sheet: ${name}\n${csv}`);
            }
            text = parts.join('\n\n') || null;
          }
        } catch {
          // ignore — fall through to empty result
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
        const fileUrl = body.file_url;

        // Detect Google Drive/Docs/Slides/Sheets URLs — convert to export URL then scrape
        const isGoogleUrl = /docs\.google\.com|drive\.google\.com/i.test(fileUrl);
        let fetchUrl = fileUrl;
        if (isGoogleUrl) {
          // Convert to plain-text or HTML export where possible
          const docMatch = fileUrl.match(/docs\.google\.com\/document\/d\/([\w-]+)/);
          const slideMatch = fileUrl.match(/docs\.google\.com\/presentation\/d\/([\w-]+)/);
          const sheetMatch = fileUrl.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/);
          const driveMatch = fileUrl.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
          if (docMatch) fetchUrl = `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`;
          else if (slideMatch) fetchUrl = `https://docs.google.com/presentation/d/${slideMatch[1]}/export?format=txt`;
          else if (sheetMatch) fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=csv`;
          else if (driveMatch) fetchUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
        }

        // Try backend extraction with the (possibly converted) URL
        text = await tryEndpoint(`${BACKEND}/api/v1/analysis/extract-text-from-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_url: fetchUrl }),
        }, incomingAuth);
        // Scrape fallback
        if (!text) {
          text = await tryEndpoint(`${BACKEND}/api/v1/scrape/url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: fetchUrl }),
          }, incomingAuth);
        }
        // For Google export URLs, also try fetching the text directly
        if (!text && isGoogleUrl) {
          try {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 20_000);
            const res = await fetch(fetchUrl, { signal: controller.signal });
            clearTimeout(tid);
            if (res.ok) text = await res.text();
          } catch { /* ignore */ }
        }
      } else if (body.file_content ?? body.content) {
        const b64 = body.file_content ?? body.content ?? '';
        // Strategy 2a: real extraction endpoint
        text = await tryEndpoint(`${BACKEND}/api/v1/analysis/extract-text-from-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: b64, filename }),
        }, incomingAuth);
        // Strategy 2b: try to decode as UTF-8 text directly for plain formats
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
