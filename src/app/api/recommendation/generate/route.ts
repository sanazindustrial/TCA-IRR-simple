import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { final_score, module_results, what_if_analysis, company_data, ssr_results } = body;

    // Support camelCase aliases from triage page
    const score = Number(final_score ?? body.compositeScore ?? 5.0);
    const companyName = String(company_data?.company_name ?? body.companyName ?? 'the company');
    const stage = String(company_data?.stage ?? body.stage ?? 'early');
    const sector = String(company_data?.sector ?? body.sector ?? 'technology');

    const results: Array<{ module: string; score: number; risk: string; recommendation: string }> = module_results ?? body.moduleResults ?? [];
    const whatIf = what_if_analysis ?? body.whatIfScenarios ?? null;
    const redModules = results.filter((r) => r.risk === 'RED').map((r) => r.module);
    const greenModules = results.filter((r) => r.risk === 'GREEN').map((r) => r.module);
    const ssrRules = ssr_results?.applied_rules ?? [];

    const tier = score >= 7.5 ? 'Tier 1' : score >= 6 ? 'Tier 2' : score >= 4.5 ? 'Tier 3' : 'Tier 4';
    const decision = score >= 7.5 ? 'Proceed to Due Diligence'
      : score >= 6 ? 'Conditional — Address Key Gaps'
      : score >= 4.5 ? 'Monitor — Additional Data Required'
      : 'Pass — Significant Concerns Identified';

    const recommendation = `
**Investment Recommendation: ${decision}**

${companyName} has been assessed through the TCA-IRR framework, scoring ${score.toFixed(1)}/10 (${tier}).

**Summary:** The company operates in the ${sector} sector at the ${stage} stage. The composite score reflects ${greenModules.length} strong module(s) (${greenModules.join(', ') || 'none'}) and ${redModules.length} area(s) requiring attention (${redModules.join(', ') || 'none'}).

**Key Strengths:**
${greenModules.length ? greenModules.map(m => `• Strong performance in ${m} module`).join('\n') : '• Balanced performance across modules'}

**Key Risks:**
${redModules.length ? redModules.map(m => `• ${m} module requires immediate attention`).join('\n') : '• No critical risk flags identified'}

**SSR Adjustments Applied:** ${ssrRules.length ? ssrRules.map((r: { name: string }) => r.name).join('; ') : 'None'}

**What-If Range:** ${whatIf?.worst_case?.score ?? (Array.isArray(whatIf) ? whatIf[2]?.score : null) ?? 'N/A'} (worst) — ${whatIf?.best_case?.score ?? (Array.isArray(whatIf) ? whatIf[1]?.score : null) ?? 'N/A'} (best)

**Next Steps:**
${score >= 7.5
  ? '1. Initiate formal due diligence process\n2. Request full data room access\n3. Schedule founder deep-dive sessions\n4. Engage legal and financial advisors'
  : score >= 6
  ? '1. Request additional documentation on flagged areas\n2. Schedule follow-up meeting with founders\n3. Address identified gaps within 30 days\n4. Re-evaluate upon gap closure'
  : '1. Document key concerns for portfolio team\n2. Monitor company progress over next quarter\n3. Request updated metrics and milestones\n4. Consider re-evaluation in 6 months'}
`.trim();

    const keyRisks = redModules.length
      ? redModules.map((m) => `Critical: ${m} module scored below threshold`)
      : ['No critical risks identified — continue standard monitoring'];

    const actionItems = score >= 7.5
      ? ['Schedule due diligence kick-off', 'Request data room', 'Engage advisors']
      : score >= 6
      ? ['Request gap closure plan', 'Follow-up in 30 days', 'Re-score after updates']
      : ['Document concerns', 'Monitor pipeline', 'Re-evaluate in 6 months'];

    return NextResponse.json({
      recommendation,
      decision,
      tier,
      key_risks: keyRisks,
      action_items: actionItems,
      status: 'generated',
    });
  } catch (err) {
    console.error('[recommendation/generate]', err);
    return NextResponse.json({ error: 'Recommendation generation failed' }, { status: 500 });
  }
}
