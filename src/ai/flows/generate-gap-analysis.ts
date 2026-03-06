
'use server';

import {ai} from '@/ai/genkit';
import {
  GenerateGapAnalysisInputSchema,
  type GenerateGapAnalysisInput,
  GenerateGapAnalysisOutputSchema,
  type GenerateGapAnalysisOutput,
} from './schemas';

export async function generateGapAnalysis(
  input: GenerateGapAnalysisInput,
  modelName: string
): Promise<GenerateGapAnalysisOutput> {
  const prompt = ai.definePrompt({
    name: 'generateGapAnalysisPrompt',
    input: {schema: GenerateGapAnalysisInputSchema},
    output: {schema: GenerateGapAnalysisOutputSchema},
    model: modelName,
    prompt: `You are an AI-powered startup analyst. Your task is to generate a gap analysis for a startup.
    
    Analyze the provided data and identify performance gaps.`,
  });

  const {output} = await prompt(input);
  return output!;
}
