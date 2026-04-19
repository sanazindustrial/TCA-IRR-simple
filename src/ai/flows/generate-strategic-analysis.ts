'use server';

import { ai } from '@/ai/genkit';
import {
  StrategicAnalysisInputSchema,
  type StrategicAnalysisInput,
  StrategicAnalysisOutputSchema,
  type StrategicAnalysisOutput,
} from './schemas';

export async function generateStrategicAnalysis(
  input: StrategicAnalysisInput,
  modelName: string
): Promise<StrategicAnalysisOutput> {
  const prompt = ai.definePrompt({
    name: 'generateStrategicAnalysisPrompt',
    input: { schema: StrategicAnalysisInputSchema },
    output: { schema: StrategicAnalysisOutputSchema },
    model: modelName,
    prompt: `You are a strategy consultant and competitive intelligence analyst specializing in startup evaluations.
Analyze the provided company strategy, competitive positioning, and roadmap data to produce a structured Strategic Analysis report.

Input data:
{{{companyData}}}

Framework: {{{framework}}}

Evaluate across four key sub-dimensions:
1. **Competitive Positioning** (0–10): Strength of market position, differentiation, and brand defensibility
2. **Moat Strength** (0–10): Durability of competitive advantages — network effects, switching costs, IP, scale
3. **Roadmap Clarity** (0–10): Quality of product and business roadmap — milestone clarity, sequencing, resource alignment
4. **Partnership Potential** (0–10): Strategic partnership opportunities, ecosystem leverage, channel partnership quality

Signal thresholds:
- green  → score ≥ 7.5  (strong strategic position)
- yellow → score 5.0–7.4 (strategic gaps to address)
- red    → score < 5.0   (significant strategic weaknesses)

Return a composite score (0–10), signal colour, all four sub-scores, a 3–5 sentence strategic summary, up to five strategic risks, and up to five prioritised recommendations.`,
  });

  const { output } = await prompt(input);
  return output!;
}
