import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { module_results, report_sections, final_score, company_data, reviewer_notes } = body;

    // Support camelCase aliases from triage page
    const score = Number(final_score ?? body.compositeScore ?? 5.0);
    const companyName = String(company_data?.company_name ?? body.companyName ?? 'the company');
    const results: Array<{ module: string; score: number; risk: string }> = module_results ?? body.moduleResults ?? [];
    const notes = reviewer_notes ?? body.reviewerNotes ?? '';

    const sectionCount = (report_sections ?? []).length;
    const redCount = results.filter((r) => r.risk === 'RED').length;
    const greenCount = results.filter((r) => r.risk === 'GREEN').length;

    // Reviewer completeness check
    const completenessScore = Math.min(100, Math.round(
      (results.length >= 5 ? 30 : results.length * 6) +
      (sectionCount >= 3 ? 30 : sectionCount * 10) +
      (score >= 5 ? 20 : score * 4) +
      (notes?.length > 50 ? 20 : notes?.length > 0 ? 10 : 0)
    ));

    const flags: string[] = [];
    if (redCount >= 3) flags.push('Multiple critical risk flags identified — senior review recommended');
    if (results.length < 5) flags.push('Fewer than 5 modules analyzed — consider full 17-module assessment');
    if (sectionCount < 3) flags.push('Limited report sections — expand for comprehensive report');
    if (!notes) flags.push('No reviewer notes added — document rationale for final decision');

    const reviewerAnalysis = {
      completeness_score: completenessScore,
      data_quality: results.length >= 10 ? 'High' : results.length >= 5 ? 'Medium' : 'Low',
      analyst_flags: flags,
      module_coverage: `${results.length} modules analyzed (${greenCount} GREEN, ${results.length - greenCount - redCount} YELLOW, ${redCount} RED)`,
      report_sections_coverage: `${sectionCount} sections generated`,
      reviewer_readiness: completenessScore >= 70 ? 'Ready for Sign-off' : 'Additional Data Recommended',
      confidence_assessment: score >= 7 ? 'High confidence in assessment' : score >= 5 ? 'Moderate confidence — additional data would strengthen assessment' : 'Lower confidence — key data gaps present',
      summary: `Reviewer analysis for ${companyName} indicates ${completenessScore >= 70 ? 'sufficient' : 'partial'} coverage. ${flags.length ? `Key flags: ${flags[0]}.` : 'No critical flags identified.'}`,
    };

    return NextResponse.json({
      reviewer_analysis: reviewerAnalysis,
      // Flat string alias for triage page (reads data.analysis as string)
      analysis: reviewerAnalysis.summary,
      status: 'analyzed',
    });
  } catch (err) {
    console.error('[reviewer/analyze]', err);
    return NextResponse.json({ error: 'Reviewer analysis failed' }, { status: 500 });
  }
}
