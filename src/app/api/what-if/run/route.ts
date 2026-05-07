import { NextRequest, NextResponse } from 'next/server';
import { scoreToRisk } from '@/lib/ai-adapter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { final_score, module_results, company_data } = body;

    // Support camelCase aliases from triage page
    const base = Number(final_score ?? body.compositeScore ?? 5.0);
    const companyName = String(company_data?.company_name ?? body.companyName ?? 'Company');

    // Build three scenarios: base, best (+15%), worst (-20%)
    const bestScore = Math.min(10, base * 1.15);
    const worstScore = Math.max(0, base * 0.80);

    const buildScenario = (score: number, label: string) => ({
      label,
      score: Math.round(score * 10) / 10,
      risk: scoreToRisk(score),
      recommendation: score >= 7.5 ? 'Proceed' : score >= 6 ? 'Conditional' : score >= 4.5 ? 'Monitor' : 'Pass',
      narrative: label === 'Base Case'
        ? `Under base-case assumptions, ${companyName} achieves a score of ${score.toFixed(1)}/10. Core metrics hold at current projections and market conditions remain stable.`
        : label === 'Best Case'
        ? `Under best-case assumptions (favorable market, team execution, strong traction), ${companyName} could reach ${score.toFixed(1)}/10. Key upside drivers: market expansion + operational efficiency gains.`
        : `Under worst-case assumptions (market headwinds, execution challenges), ${companyName} falls to ${score.toFixed(1)}/10. Key downside risks: competitive pressure, burn rate, and delayed product-market fit.`,
      key_assumptions: label === 'Base Case'
        ? ['Market grows at CAGR assumptions', 'Team retention stable', 'Revenue at plan']
        : label === 'Best Case'
        ? ['Market expands 30% faster', 'Key hires completed', 'Revenue 40% above plan', 'Strategic partnership closed']
        : ['Market contraction scenario', 'Key departure risk', 'Revenue 30% below plan', 'Competitive disruption'],
    });

    const baseScenario = buildScenario(base, 'Base Case');
    const bestScenario = buildScenario(bestScore, 'Best Case');
    const worstScenario = buildScenario(worstScore, 'Worst Case');

    return NextResponse.json({
      base_case: baseScenario,
      best_case: bestScenario,
      worst_case: worstScenario,
      // Array alias for triage page (reads data.scenarios)
      scenarios: [baseScenario, bestScenario, worstScenario],
      sensitivity_range: {
        min: Math.round(worstScore * 10) / 10,
        max: Math.round(bestScore * 10) / 10,
        spread: Math.round((bestScore - worstScore) * 10) / 10,
      },
      status: 'completed',
    });
  } catch (err) {
    console.error('[what-if/run]', err);
    return NextResponse.json({ error: 'What-if run failed' }, { status: 500 });
  }
}
