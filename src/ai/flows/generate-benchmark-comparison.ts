
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a benchmark comparison for a startup.
 *
 * The flow compares a startup's performance against sector averages, top performers, and competitors
 * using percentile ranks and spider charts.
 *
 * @module src/ai/flows/generate-benchmark-comparison
 *
 * @interface GenerateBenchmarkComparisonInput - Defines the input schema for the flow.
 * @interface GenerateBenchmarkComparisonOutput - Defines the output schema for the flow;
 * @function generateBenchmarkComparison - The main function that triggers the benchmark comparison flow.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateBenchmarkComparisonInputSchema,
  type GenerateBenchmarkComparisonInput,
  GenerateBenchmarkComparisonOutputSchema,
  type GenerateBenchmarkComparisonOutput,
} from './schemas';

export async function generateBenchmarkComparison(
  input: GenerateBenchmarkComparisonInput,
  modelName: string
): Promise<GenerateBenchmarkComparisonOutput> {
  const generateBenchmarkComparisonPrompt = ai.definePrompt({
    name: 'generateBenchmarkComparisonPrompt',
    input: {schema: GenerateBenchmarkComparisonInputSchema},
    output: {schema: GenerateBenchmarkComparisonOutputSchema},
    model: modelName,
    prompt: `You are a startup benchmark analyst. Analyze the startup's metrics and determine if it is over-performing, average, or under-performing compared to its peers. Your analysis will determine a +/-5% overlay on the final evaluation score.

Analyze the startup's metrics based on the provided data:
- Sector: {{{sector}}}
- Stage: {{{stage}}}
- Business Model: {{{businessModel}}}
- Startup Metrics: {{{json metrics}}}

Based on this information, generate the following outputs:
1.  **benchmarkOverlay**: Compare the startup to sector averages across at least 5 key metrics.
2.  **competitorAnalysis**: Create a spider-chart compatible analysis comparing the startup to two fictional but realistic competitors ('Competitor A', 'Competitor B') across 5 key metrics.
3.  **performanceSummary**: Write a concise summary of the startup's performance against its peers.
4.  **overlayScore**: Calculate a final overlay score between -0.05 and 0.05, where a positive score indicates over-performance and a negative score indicates under-performance.`,
  });

  const {output} = await generateBenchmarkComparisonPrompt(input);
  return output!;
}
