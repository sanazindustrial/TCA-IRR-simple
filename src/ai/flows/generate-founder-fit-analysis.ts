
'use server';

import {ai} from '@/ai/genkit';
import {
  GenerateFounderFitAnalysisInputSchema,
  type GenerateFounderFitAnalysisInput,
  GenerateFounderFitAnalysisOutputSchema,
  type GenerateFounderFitAnalysisOutput,
} from './schemas';

export async function generateFounderFitAnalysis(
  input: GenerateFounderFitAnalysisInput,
  modelName: string
): Promise<GenerateFounderFitAnalysisOutput> {
  const prompt = ai.definePrompt({
    name: 'generateFounderFitAnalysisPrompt',
    input: {schema: GenerateFounderFitAnalysisInputSchema},
    output: {schema: GenerateFounderFitAnalysisOutputSchema},
    model: modelName,
    prompt: `You are an AI-powered startup analyst. Your task is to generate a founder fit analysis for a startup.
    
    Analyze the provided data and generate a founder fit score.`,
  });

  const {output} = await prompt(input);
  return output!;
}
