'use client';

import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';

export async function runAnalysisClient(
  framework: 'general' | 'medtech'
): Promise<ComprehensiveAnalysisOutput> {
  console.log('Client: Running comprehensive analysis for framework:', framework);

  try {
    const response = await fetch('/api/analysis/comprehensive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ framework }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log('Client: Successfully received analysis result');
    
    return result as ComprehensiveAnalysisOutput;
  } catch (error) {
    console.error('Client: Failed to run analysis:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        throw new Error('API rate limit exceeded. Please wait a moment and try again, or upgrade your plan for higher limits.');
      }
      throw new Error(`Analysis failed: ${error.message}`);
    } else {
      throw new Error(`Analysis failed: ${JSON.stringify(error)}`);
    }
  }
}