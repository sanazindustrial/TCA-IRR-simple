'use server';

import { ai } from '@/ai/genkit';
import {
  FunderAnalysisInputSchema,
  type FunderAnalysisInput,
  FunderAnalysisOutputSchema,
  type FunderAnalysisOutput,
} from './schemas';

export async function generateFunderAnalysis(
  input: FunderAnalysisInput,
  modelName: string
): Promise<FunderAnalysisOutput> {
  const prompt = ai.definePrompt({
    name: 'generateFunderAnalysisPrompt',
    input: { schema: FunderAnalysisInputSchema },
    output: { schema: FunderAnalysisOutputSchema },
    model: modelName,
    prompt: `You are an investment readiness specialist and venture fundraising advisor.
Analyze the provided company profile, traction metrics, and funding history to produce a structured Funder Fit Analysis report.

Input data:
{{{companyData}}}

Framework: {{{framework}}}

Evaluate across four key sub-dimensions:
1. **Investor Alignment** (0–10): Match between company stage, sector, and target investor theses
2. **Stage Readiness** (0–10): Funding stage preparedness — metrics benchmarks, milestone achievement for the round
3. **Deck Quality** (0–10): Clarity, completeness, and persuasiveness of fundraising narrative and supporting materials
4. **Network Strength** (0–10): Founder network quality, advisor credibility, existing investor quality

Also produce a **readinessScore** (0–100) representing overall funding readiness.

Produce a list of up to 5 top-matched investors with name, investment thesis description, match score (0–10), and preferred stage.

Signal thresholds:
- green  → score ≥ 7.5  (strong funding candidacy)
- yellow → score 5.0–7.4 (fundable with improvements)
- red    → score < 5.0   (not yet ready to fundraise)

Return a composite score (0–10), signal colour, readiness score (0–100), all four sub-scores, investor list, a 3–5 sentence summary, up to five risks, and up to five recommendations.`,
  });

  const { output } = await prompt(input);
  return output!;
}
