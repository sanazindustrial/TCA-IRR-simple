import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { selected_sections, module_results, final_score, company_data, recommendation } = body;
    // Normalize what_if_analysis — triage sends array (data.scenarios); backend sends object
    const _rawWhatIf = body.what_if_analysis ?? body.whatIfScenarios ?? null;
    const what_if_analysis = Array.isArray(_rawWhatIf)
      ? { base_case: _rawWhatIf[0], best_case: _rawWhatIf[1], worst_case: _rawWhatIf[2], sensitivity_range: null }
      : _rawWhatIf;

    // Support camelCase aliases from triage page
    const score = Number(final_score ?? body.compositeScore ?? 5.0);
    const companyName = String(company_data?.company_name ?? body.companyName ?? 'the company');
    const sector = String(company_data?.sector ?? body.sector ?? 'Technology');
    const stage = String(company_data?.stage ?? body.stage ?? 'Early Stage');
    const results: Array<{ module: string; score: number; risk: string; explanation: string; confidence?: number }> = module_results ?? body.moduleResults ?? [];
    const sections: string[] = selected_sections ?? body.selectedSections ?? [];

    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const scoreToOutcome = (value: number): string => {
      if (value >= 8.5) return 'Advanced Screening / DD';
      if (value >= 7) return 'Prescreening';
      if (value >= 5) return 'Early Stage';
      return 'Reject';
    };

    const scoreToRiskBand = (value: number): 'GREEN' | 'YELLOW' | 'RED' => {
      if (value >= 8.5) return 'GREEN';
      if (value >= 7) return 'YELLOW';
      return 'RED';
    };

    // Build content for each selected section
    const buildSection = (sectionId: string): { title: string; content: string } => {
      const moduleMap: Record<string, { module: string; explanation: string; score: number }> = {};
      results.forEach((r) => { moduleMap[r.module] = r; });

      const s = (m: string) => moduleMap[m]?.score?.toFixed(1) ?? 'N/A';
      const e = (m: string) => moduleMap[m]?.explanation ?? '';

      const sectionDefs: Record<string, { title: string; content: string }> = {
        executive_summary: {
          title: 'Executive Summary',
          content: `**${companyName}** — TCA Investment Triage Report\n\nDate: ${now} | Stage: ${stage} | Sector: ${sector}\n\nComposite Score: **${score.toFixed(1)}/10**\n\n${recommendation?.recommendation ?? ''}\n\nThis report provides a comprehensive assessment of ${companyName} across ${results.length} analysis modules using the TCA-IRR framework.`,
        },
        company_overview: {
          title: 'Company Overview',
          content: `**Company:** ${companyName}\n**Sector:** ${sector}\n**Stage:** ${stage}\n**Location:** ${company_data?.location ?? 'Not specified'}\n**Website:** ${company_data?.website ?? 'Not specified'}\n\n**Product/Service Description:**\n${company_data?.product_description ?? 'See pitch deck for full product description.'}\n\n**Key Metrics:**\n${company_data?.key_metrics ?? 'Financial details available in data room.'}`,
        },
        tca_scorecard: {
          title: 'TCA Scorecard',
          content: `**Composite TCA Score: ${score.toFixed(1)}/10**\n\nModule Scores:\n${results.map((r) => `• **${r.module.toUpperCase()}**: ${r.score.toFixed(1)}/10 (${r.risk})`).join('\n')}\n\nOverall Risk Rating: ${scoreToRiskBand(score)}`,
        },
        financial_analysis: {
          title: 'Financial Analysis',
          content: `**Financial Module Score: ${s('financial')}/10**\n\n${e('financial') || `Financial analysis for ${companyName} reveals ${score >= 7 ? 'solid' : 'developing'} revenue foundations. Key financial indicators assessed include revenue growth trajectory, burn rate, unit economics, and path to profitability.`}\n\n**Key Financial Indicators:**\n• Revenue model viability assessed\n• Unit economics reviewed\n• Burn rate and runway analyzed\n• Capital efficiency evaluated`,
        },
        'financial-analysis': {
          title: 'Financial Analysis',
          content: `**Financial Module Score: ${s('financial')}/10**\n\n${e('financial') || 'Evaluates scalability, capital efficiency, forecast realism, and funding discipline.'}\n\n**Framework Weights:**\n• Revenue Model 30%\n• Unit Economics 30%\n• Projections 20%\n• Funding Requirements 20%`,
        },
        'economic-analysis': {
          title: 'Economic Analysis',
          content: `**Economic Module Score: ${s('economic')}/10**\n\n${e('economic') || 'Assesses macro durability and recession resilience.'}\n\n**Framework Weights:**\n• Industry Structure 30%\n• Pricing Power 25%\n• Macro Indicators 25%\n• Cycle Resilience 20%`,
        },
        'social-analysis': {
          title: 'Social Analysis',
          content: `**Social Module Score: ${s('social')}/10**\n\n${e('social') || 'Measures social trust, adoption readiness, and stakeholder acceptance.'}\n\n**Framework Weights:**\n• Social Impact 30%\n• Demographic Fit 25%\n• Cultural Adoption 25%\n• Stakeholder Trust 20%`,
        },
        'marketing-analysis': {
          title: 'Marketing Analysis',
          content: `**Marketing Module Score: ${s('marketing')}/10**\n\n${e('marketing') || 'Evaluates positioning, demand generation quality, and GTM execution.'}\n\n**Framework Weights:**\n• Positioning 25%\n• Digital Presence 20%\n• Spend Efficiency 30%\n• GTM Execution 25%`,
        },
        'environmental-analysis': {
          title: 'Environmental Analysis',
          content: `**Environmental Module Score: ${s('environmental')}/10**\n\n${e('environmental') || 'Assesses environmental sustainability, climate risk, and ESG alignment.'}\n\n**Framework Weights:**\n• Environmental Impact 30%\n• Climate Risk 25%\n• Certification 15%\n• ESG Alignment 30%`,
        },
        risk_assessment: {
          title: 'Risk Assessment',
          content: `**Risk Module Score: ${s('risk')}/10**\n\n${e('risk') || `Comprehensive risk assessment across 14 domains for ${companyName}.`}\n\nRed Flags: ${results.filter(r => r.risk === 'RED').map(r => r.module).join(', ') || 'None identified'}\n\n**Risk Categories Assessed:**\n• Market risk\n• Execution risk\n• Financial risk\n• Regulatory risk\n• Competitive risk`,
        },
        team_evaluation: {
          title: 'Team Evaluation',
          content: `**Team Module Score: ${s('team')}/10**\n\n${e('team') || `Team assessment for ${companyName} evaluating leadership, domain expertise, and execution track record.`}\n\n**Team Dimensions Assessed:**\n• Founder background and expertise\n• Team completeness\n• Execution history\n• Advisory board quality\n• Culture and values alignment`,
        },
        market_analysis: {
          title: 'Market Analysis',
          content: `**Growth Module Score: ${s('growth')}/10** | **Economic Module Score: ${s('economic')}/10**\n\n${e('growth') || `Market analysis for ${companyName} in the ${sector} sector.`}\n\n**Market Assessment:**\n• TAM/SAM/SOM analysis\n• Growth rate assessment\n• Competitive landscape mapping\n• Market timing evaluation`,
        },
        competitive_landscape: {
          title: 'Competitive Landscape',
          content: `**Strategic Module Score: ${s('strategic')}/10** | **Benchmark Score: ${s('benchmark')}/10**\n\n${e('strategic') || `Competitive analysis for ${companyName} against sector peers.`}\n\n**Competitive Position:**\n• Direct competitors identified\n• Differentiation factors assessed\n• Moat strength evaluated\n• Market share opportunity sized`,
        },
        macro_trends: {
          title: 'Macro Trends & PESTEL',
          content: `**Macro Trend Score: ${s('macro')}/10**\n\n${e('macro') || `PESTEL analysis for ${companyName} in current market environment.`}\n\n**PESTEL Analysis:**\n• Political: regulatory environment\n• Economic: macro indicators\n• Social: demographic trends\n• Technological: tech adoption\n• Environmental: ESG factors\n• Legal: compliance landscape`,
        },
        esg_impact: {
          title: 'ESG & Social Impact',
          content: `**Environmental Score: ${s('environmental')}/10** | **Social Score: ${s('social')}/10**\n\n${e('environmental') || `ESG assessment for ${companyName}.`}\n\n**ESG Framework Assessment:**\n• Environmental footprint\n• Social impact metrics\n• Governance structure\n• SDG alignment\n• Impact measurement`,
        },
        what_if_analysis: {
          title: 'What-If Scenario Analysis',
          content: `**Scenario Analysis for ${companyName}**\n\n**Base Case (${what_if_analysis?.base_case?.score ?? score.toFixed(1)}/10):** ${what_if_analysis?.base_case?.narrative ?? 'Current trajectory maintained.'}\n\n**Best Case (${what_if_analysis?.best_case?.score ?? 'N/A'}/10):** ${what_if_analysis?.best_case?.narrative ?? 'Favorable execution and market conditions.'}\n\n**Worst Case (${what_if_analysis?.worst_case?.score ?? 'N/A'}/10):** ${what_if_analysis?.worst_case?.narrative ?? 'Challenging market environment and execution risks materialize.'}`,
        },
        investment_recommendation: {
          title: 'Investment Recommendation',
          content: recommendation?.recommendation ?? `Based on the TCA-IRR analysis, the composite score of ${score.toFixed(1)}/10 supports a **${scoreToOutcome(score)}** recommendation.\n\n**Next Steps:**\n${(recommendation?.action_items ?? []).map((a: string) => `• ${a}`).join('\n')}`,
        },
        founder_fit: {
          title: 'Founder Fit Assessment',
          content: `**Founder Fit Score: ${s('founderFit')}/10**\n\n${e('founderFit') || `Founder fit analysis for the ${companyName} leadership team.`}\n\n**Assessment Dimensions:**\n• Domain expertise alignment\n• Prior startup experience\n• Market understanding\n• Coachability indicators\n• Mission-founder alignment`,
        },
        'founder-fit': {
          title: 'Founder Fit Assessment',
          content: `**Founder Fit Score: ${s('founderFit')}/10**\n\n${e('founderFit') || `Founder fit analysis for the ${companyName} leadership team.`}`,
        },
        gap_analysis: {
          title: 'Gap Analysis',
          content: `**Gap Analysis Score: ${s('gap')}/10**\n\n${e('gap') || `Gap analysis identifying improvement areas for ${companyName}.`}\n\n**Identified Gaps:**\n${results.filter(r => r.score < 6).map(r => `• ${r.module}: Score ${r.score.toFixed(1)} — ${r.explanation.split('.')[0]}`).join('\n') || '• No significant gaps identified'}`,
        },
        funder_readiness: {
          title: 'Funder Readiness Assessment',
          content: `**Funder Readiness Score: ${s('funder')}/10**\n\n${e('funder') || `Assessment of ${companyName}'s readiness for investor engagement.`}\n\n**Readiness Checklist:**\n• Investment materials\n• Data room completeness\n• Due diligence preparation\n• Board governance\n• Cap table clarity`,
        },
        'funder-readiness': {
          title: 'Funder Readiness Assessment',
          content: `**Funder Readiness Score: ${s('funder')}/10**\n\n${e('funder') || `Assessment of ${companyName}'s readiness for investor engagement.`}`,
        },
        'strategic-fit': {
          title: 'Strategic Fit Matrix',
          content: `**Strategic Fit Score: ${s('strategicFit')}/10**\n\n${e('strategicFit') || `Strategic fit assessment for ${companyName} against investor mandate and portfolio pathways.`}`,
        },
        simulation_results: {
          title: 'Simulation Results',
          content: `**Simulation Score: ${s('simulation')}/10**\n\n${e('simulation') || `Monte Carlo simulation results for ${companyName}.`}\n\n**Simulation Output:**\n• Base case: ${what_if_analysis?.base_case?.score ?? score.toFixed(1)}\n• Best case: ${what_if_analysis?.best_case?.score ?? 'N/A'}\n• Worst case: ${what_if_analysis?.worst_case?.score ?? 'N/A'}\n• Sensitivity range: ${what_if_analysis?.sensitivity_range?.spread ?? 'N/A'} points`,
        },
        appendix: {
          title: 'Appendix',
          content: `**Appendix: Full Module Scores**\n\n${results.map((r) => `**${r.module.toUpperCase()}**\nScore: ${r.score.toFixed(1)}/10 | Risk: ${r.risk} | Confidence: ${(r.confidence ?? 0.7).toFixed(2)}\n${r.explanation}\n`).join('\n')}\n\n---\nReport generated by TCA-IRR Framework v2.0 | ${now}`,
        },
      };

      return sectionDefs[sectionId] ?? {
        title: sectionId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        content: `Section content for ${sectionId} has been generated based on the analysis data.`,
      };
    };

    const report_sections = sections.map((sectionId) => ({
      id: sectionId,
      ...buildSection(sectionId),
      generated_at: new Date().toISOString(),
    }));

    return NextResponse.json({
      report_sections,
      sections: report_sections,    // camelCase alias for triage page (reads data.sections)
      sections_generated: sections.length,
      company_name: companyName,
      status: 'generated',
    });
  } catch (err) {
    console.error('[report/generate-sections]', err);
    return NextResponse.json({ error: 'Section generation failed' }, { status: 500 });
  }
}
