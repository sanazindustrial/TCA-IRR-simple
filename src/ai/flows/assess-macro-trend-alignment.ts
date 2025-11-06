
'use server';

/**
 * @fileOverview Assesses a startup's alignment with macro trends using GenAI.
 *
 * - assessMacroTrendAlignment - A function that handles the assessment of a startup's alignment with macro trends.
 * - AssessMacroTrendAlignmentInput - The input type for the assessMacroTrendAlignment function.
 * - AssessMacroTrendAlignmentOutput - The return type for the assessMacroTrendAlignment function.
 */

import {ai} from '@/ai/genkit';
import {
  AssessMacroTrendAlignmentInputSchema,
  type AssessMacroTrendAlignmentInput,
  AssessMacroTrendAlignmentOutputSchema,
  type AssessMacroTrendAlignmentOutput,
} from './schemas';


export async function assessMacroTrendAlignment(
  input: AssessMacroTrendAlignmentInput,
  modelName: string
): Promise<AssessMacroTrendAlignmentOutput> {
  const assessMacroTrendAlignmentPrompt = ai.definePrompt({
    name: 'assessMacroTrendAlignmentPrompt',
    input: {schema: AssessMacroTrendAlignmentInputSchema},
    output: {schema: AssessMacroTrendAlignmentOutputSchema},
    model: modelName,
    prompt: `You are an expert in analyzing startup alignment with macro trends, including PESTEL factors (Political, Economic, Social, Technological, Environmental, Legal).
  
    Analyze the provided company description, news feed data, and trend database information to generate a PESTEL dashboard with alignment scores, an overall trend overlay score, and identify key trend signals.
  
    Company Description: {{{companyDescription}}}
    News Feed Data: {{{newsFeedData}}}
    Trend Database Data: {{{trendDatabaseData}}}
    Sector: {{{sector}}}
  
    Based on this information:
    1. Assess the startup's alignment with each PESTEL factor. Provide an alignment score from 1 (strong headwind) to 10 (strong tailwind).
    2. Generate an overall trend overlay score between -0.05 and 0.05 based on the composite macro alignment.
    3. Provide a summary of the alignment with macro trends.
    4. Provide a sector-specific outlook based on the PESTEL analysis.
    5. List the specific macro trend signals you've identified from the data.`,
  });

  const {output} = await assessMacroTrendAlignmentPrompt(input);
  return output!;
}
