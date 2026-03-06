
'use server';

import {ai} from '@/ai/genkit';
import {
  GenerateGrowthClassifierInputSchema,
  type GenerateGrowthClassifierInput,
  GenerateGrowthClassifierOutputSchema,
  type GenerateGrowthClassifierOutput,
} from './schemas';

export async function generateGrowthClassifier(
  input: GenerateGrowthClassifierInput,
  modelName: string
): Promise<GenerateGrowthClassifierOutput> {
  const prompt = ai.definePrompt({
    name: 'generateGrowthClassifierPrompt',
    input: {schema: GenerateGrowthClassifierInputSchema},
    output: {schema: GenerateGrowthClassifierOutputSchema},
    model: modelName,
    prompt: `You are an AI-powered growth analyst. Your task is to generate a growth classification for a startup.
    
    Analyze the provided data and generate a growth tier.`,
  });

  const {output} = await prompt(input);
  return output!;
}
