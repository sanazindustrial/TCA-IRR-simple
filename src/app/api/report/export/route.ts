import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eval_id, company_data, report_sections, module_results, final_score } = body;

    // Support camelCase aliases from triage page
    const reportId = eval_id ?? body.reportId ?? body.evalId ?? 'report';
    const requestedFormats: string[] = body.formats ?? ['pdf', 'docx', 'xlsx', 'json'];

    const companySlug = String(company_data?.company_name ?? body.companyName ?? reportId ?? 'report')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${companySlug}-tca-report-${timestamp}`;

    // Build export manifest (links would be real presigned URLs in production)
    const exports = {
      pdf: {
        format: 'PDF',
        label: 'Full Report (PDF)',
        file_name: `${fileName}.pdf`,
        download_url: `/api/report/download?id=${reportId}&format=pdf`,
        size_estimate: '2–4 MB',
      },
      docx: {
        format: 'DOCX',
        label: 'Editable Report (Word)',
        file_name: `${fileName}.docx`,
        download_url: `/api/report/download?id=${reportId}&format=docx`,
        size_estimate: '1–2 MB',
      },
      xlsx: {
        format: 'XLSX',
        label: 'Score Data (Excel)',
        file_name: `${fileName}.xlsx`,
        download_url: `/api/report/download?id=${reportId}&format=xlsx`,
        size_estimate: '200–500 KB',
      },
      json: {
        format: 'JSON',
        label: 'Raw Data (JSON)',
        file_name: `${fileName}.json`,
        download_url: `/api/report/download?id=${reportId}&format=json`,
        size_estimate: '100–300 KB',
      },
    };

    // Build inline JSON export (no server roundtrip needed)
    const inlineData = {
      eval_id: reportId,
      company: company_data?.company_name,
      score: final_score,
      module_results: (module_results ?? []).map((r: { module: string; score: number; risk: string }) => ({
        module: r.module,
        score: r.score,
        risk: r.risk,
      })),
      sections: (report_sections ?? []).map((s: { id: string; title: string }) => ({
        id: s.id,
        title: s.title,
      })),
      exported_at: new Date().toISOString(),
    };

    // Build urls alias for triage page (reads data.urls.pdf, data.urls.docx, data.urls.json)
    const urls: Record<string, string> = {};
    requestedFormats.forEach((fmt) => {
      const key = fmt as keyof typeof exports;
      if (exports[key]) urls[fmt] = exports[key].download_url;
    });

    return NextResponse.json({
      exports,
      urls,                         // flat alias for triage page
      inline_json: inlineData,
      file_name_base: fileName,
      status: 'ready',
    });
  } catch (err) {
    console.error('[report/export]', err);
    return NextResponse.json({ error: 'Export preparation failed' }, { status: 500 });
  }
}
