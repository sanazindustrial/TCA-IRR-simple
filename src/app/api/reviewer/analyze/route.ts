import { NextRequest, NextResponse } from 'next/server';
import { MODULE_WEIGHT_MAP } from '@/lib/tca-scoring-framework';

type ModuleResult = { module: string; score: number; risk: string };

const MODULE_WEIGHTS: Record<string, number> = MODULE_WEIGHT_MAP;

const clampToOneToTen = (value: number): number => Math.max(1, Math.min(10, value));

const getDecision = (score: number): 'Advanced Screening / DD' | 'Prescreening' | 'Early Stage' | 'Reject' => {
  if (score >= 8.5) return 'Advanced Screening / DD';
  if (score >= 7) return 'Prescreening';
  if (score >= 5) return 'Early Stage';
  return 'Reject';
};

const parseScore = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return clampToOneToTen(value);
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return clampToOneToTen(parsed);
  }
  return null;
};

const getWeightedModuleScore = (results: ModuleResult[]): number | null => {
  const valid = results
    .map((result) => ({
      module: String(result.module || '').trim(),
      score: parseScore(result.score),
    }))
    .filter((item): item is { module: string; score: number } => item.module.length > 0 && item.score !== null);

  if (valid.length === 0) return null;

  const weighted = valid.map((item) => ({
    score: item.score,
    weight: MODULE_WEIGHTS[item.module] ?? 1,
  }));

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return null;

  const weightedSum = weighted.reduce((sum, item) => sum + (item.score * item.weight), 0);
  return clampToOneToTen(weightedSum / totalWeight);
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { module_results, report_sections, final_score, company_data, reviewer_notes } = body;

    // Support camelCase aliases from triage page, but avoid hardcoded midpoint fallback
    const companyName = String(company_data?.company_name ?? body.companyName ?? 'the company');
    const results: ModuleResult[] = module_results ?? body.moduleResults ?? [];
    const notes = reviewer_notes ?? body.reviewerNotes ?? '';

    const explicitScore = parseScore(final_score ?? body.compositeScore);
    const inferredWeightedScore = getWeightedModuleScore(results);
    const score = explicitScore ?? inferredWeightedScore;

    if (score === null) {
      return NextResponse.json(
        {
          error: 'Unable to compute reviewer score. Provide final_score/compositeScore or valid module_results with 1-10 scores.',
        },
        { status: 400 }
      );
    }

    const sectionCount = (report_sections ?? []).length;
    const redCount = results.filter((r) => String(r.risk || '').toUpperCase() === 'RED').length;
    const greenCount = results.filter((r) => String(r.risk || '').toUpperCase() === 'GREEN').length;
    const yellowCount = results.length - greenCount - redCount;

    // Reviewer completeness check
    const completenessScore = Math.min(100, Math.round(
      (results.length >= 5 ? 30 : results.length * 6) +
      (sectionCount >= 3 ? 30 : sectionCount * 10) +
      (score >= 7 ? 20 : score * 3) +
      (notes?.length > 50 ? 20 : notes?.length > 0 ? 10 : 0)
    ));

    const flags: string[] = [];
    if (redCount >= 3) flags.push('Multiple critical risk flags identified - senior review recommended');
    if (results.length < 5) flags.push('Fewer than 5 modules analyzed — consider full 17-module assessment');
    if (sectionCount < 3) flags.push('Limited report sections — expand for comprehensive report');
    if (!notes) flags.push('No reviewer notes added — document rationale for final decision');

    const reviewerAnalysis = {
      final_score: Number(score.toFixed(2)),
      decision: getDecision(score),
      completeness_score: completenessScore,
      data_quality: results.length >= 10 ? 'High' : results.length >= 5 ? 'Medium' : 'Low',
      analyst_flags: flags,
      module_coverage: `${results.length} modules analyzed (${greenCount} GREEN, ${yellowCount} YELLOW, ${redCount} RED)`,
      report_sections_coverage: `${sectionCount} sections generated`,
      reviewer_readiness: completenessScore >= 70 ? 'Ready for Sign-off' : 'Additional Data Recommended',
      confidence_assessment: score >= 8.5 ? 'High confidence in assessment' : score >= 7 ? 'Moderate confidence — additional data would strengthen assessment' : 'Lower confidence — key data gaps present',
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
