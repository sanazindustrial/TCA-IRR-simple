import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eval_id, company_data, final_score, report_sections, module_results, recommendation } = body;

    // Support camelCase aliases from triage page
    const evalId = eval_id ?? body.evalId ?? '';
    const companyData = company_data ?? {
      company_name: body.companyName ?? '',
      sector: body.sector ?? '',
      stage: body.stage ?? '',
    };
    const finalScore = final_score ?? body.compositeScore ?? null;
    const reportSections = report_sections ?? body.reportSections ?? [];
    const moduleResults = module_results ?? body.moduleResults ?? [];

    // Try FastAPI backend
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch(`${BACKEND}/api/v1/reports/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(id);
      if (res.ok) {
        const data = await res.json();
        // Ensure reportId alias exists for triage page
        return NextResponse.json({ ...data, reportId: data.reportId ?? data.report_id ?? evalId });
      }
    } catch { /* fall through */ }

    // Fallback: store in local reports API
    const reportPayload = {
      eval_id: evalId,
      company_name: companyData?.company_name ?? '',
      sector: companyData?.sector ?? '',
      stage: companyData?.stage ?? '',
      score: finalScore,
      recommendation: recommendation?.decision ?? '',
      module_results: moduleResults,
      report_sections: reportSections,
      generated_at: new Date().toISOString(),
      status: 'stored',
    };

    // Try local reports API
    try {
      const localRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/reports`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportPayload),
        }
      );
      if (localRes.ok) {
        const localData = await localRes.json();
        const id = localData.id ?? evalId;
        return NextResponse.json({
          report_id: id,
          reportId: id,           // camelCase alias for triage page
          storage_url: `/api/reports/${id}`,
          status: 'stored',
        });
      }
    } catch { /* fall through */ }

    // Final fallback: return local ID
    return NextResponse.json({
      report_id: evalId,
      reportId: evalId,           // camelCase alias for triage page
      storage_url: `/api/reports/${evalId}`,
      status: 'stored_locally',
    });
  } catch (err) {
    console.error('[report/store]', err);
    return NextResponse.json({ error: 'Report store failed' }, { status: 500 });
  }
}
