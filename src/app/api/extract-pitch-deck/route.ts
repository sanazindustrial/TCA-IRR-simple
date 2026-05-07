import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS });
}

/** Extract plain text from a DOCX file (ZIP → word/document.xml → strip tags) */
async function extractDocx(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const docXml = zip.file('word/document.xml');
    if (!docXml) return '';
    const xml = await docXml.async('string');
    // Keep paragraph breaks, strip XML tags
    return xml
      .replace(/<\/w:p>/gi, '\n')
      .replace(/<\/w:tr>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch {
    return '';
  }
}

/** Extract plain text from a PPTX file (ZIP → ppt/slides/slide*.xml → strip tags) */
async function extractPptx(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files)
      .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] ?? '0', 10);
        const numB = parseInt(b.match(/\d+/)?.[0] ?? '0', 10);
        return numA - numB;
      });

    const parts: string[] = [];
    for (const sf of slideFiles) {
      const xml = await zip.files[sf].async('string');
      const text = xml
        .replace(/<\/a:p>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim();
      if (text.trim()) parts.push(text.trim());
    }
    return parts.join('\n\n');
  } catch {
    return '';
  }
}

/**
 * Basic PDF text extraction.
 * Reads text operator sequences (Tj, TJ, ', ") between BT/ET markers.
 * Good enough for text-based PDFs; does not support scanned/image PDFs.
 */
function extractPdf(buffer: Buffer): string {
  try {
    const latin = buffer.toString('latin1');
    const texts: string[] = [];

    // Extract strings from text blocks BT ... ET
    const btEtRegex = /BT([\s\S]*?)ET/g;
    let block: RegExpExecArray | null;
    while ((block = btEtRegex.exec(latin)) !== null) {
      const content = block[1];
      // Match literal strings: (text)Tj  or  [(text)]TJ  or  (text)'
      const strRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|TJ|'|")/g;
      let m: RegExpExecArray | null;
      while ((m = strRegex.exec(content)) !== null) {
        const raw = m[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\t/g, ' ')
          .replace(/\\(.)/g, '$1');
        const cleaned = raw.replace(/[^\x20-\x7E\n]/g, '').trim();
        if (cleaned.length > 1) texts.push(cleaned);
      }
    }

    // Fallback: also grab strings outside BT/ET for some PDF variants
    if (texts.length === 0) {
      const fallbackRegex = /\(([^\)\n]{3,200})\)/g;
      let m2: RegExpExecArray | null;
      while ((m2 = fallbackRegex.exec(latin)) !== null) {
        const cleaned = m2[1].replace(/[^\x20-\x7E]/g, '').trim();
        if (cleaned.length > 3 && /[a-zA-Z]{2,}/.test(cleaned)) texts.push(cleaned);
      }
    }

    return texts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 60000);
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400, headers: CORS });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const name = file.name.toLowerCase();

    let text = '';

    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      text = await extractDocx(buffer);
    } else if (name.endsWith('.pptx') || name.endsWith('.ppt')) {
      text = await extractPptx(buffer);
    } else if (name.endsWith('.pdf')) {
      text = extractPdf(buffer);
    } else if (name.endsWith('.txt') || name.endsWith('.md')) {
      text = buffer.toString('utf-8');
    } else {
      // Generic: try UTF-8, strip non-printable
      text = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const trimmed = text.trim().slice(0, 60000);

    if (!trimmed) {
      return NextResponse.json(
        { error: 'Could not extract text from file. Try a different format or paste text manually.' },
        { status: 422, headers: CORS }
      );
    }

    return NextResponse.json({ text: trimmed, length: trimmed.length }, { headers: CORS });
  } catch (err) {
    console.error('[extract-pitch-deck]', err);
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500, headers: CORS });
  }
}
