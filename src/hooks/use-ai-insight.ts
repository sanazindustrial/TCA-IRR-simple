/**
 * useAiInsight — universal AI agent hook for all TCA-IRR pages.
 * Calls /api/ai-agent (OpenAI gpt-4o → Gemini fallback) with structured
 * context. Returns insight state that any page can render.
 */
'use client';

import { useState, useCallback, useRef } from 'react';

export interface AiInsightResult {
  summary: string;
  recommendation: string;
  keyRisks: string[];
  nextSteps: string[];
  confidence: number;
  provider: string;
  model: string;
  error?: string;
}

export type AiInsightStatus = 'idle' | 'loading' | 'ready' | 'error' | 'unavailable';

export interface UseAiInsightReturn {
  insight: AiInsightResult | null;
  status: AiInsightStatus;
  fetch: (task: string, prompt: string, context?: Record<string, unknown>) => void;
  reset: () => void;
}

const TIMEOUT_MS = 35_000;

export function useAiInsight(): UseAiInsightReturn {
  const [insight, setInsight] = useState<AiInsightResult | null>(null);
  const [status, setStatus] = useState<AiInsightStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);

  const fetchInsight = useCallback(
    (task: string, prompt: string, context?: Record<string, unknown>) => {
      // Cancel previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('loading');
      setInsight(null);

      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, prompt, context: context ? JSON.stringify(context) : undefined }),
        signal: controller.signal,
      })
        .then(async (res) => {
          clearTimeout(timer);
          if (!res.ok) {
            // 503 = AI keys not configured — treat as unavailable (silent)
            if (res.status === 503 || res.status === 401) {
              setStatus('unavailable');
              return;
            }
            throw new Error(`AI agent returned ${res.status}`);
          }
          const data = await res.json();
          const r = (data?.result ?? {}) as Record<string, unknown>;

          const toStringArray = (v: unknown): string[] => {
            if (Array.isArray(v)) return v.map(String);
            if (typeof v === 'string' && v) return [v];
            return [];
          };

          setInsight({
            summary: (r.summary as string) || (r.analysis as string) || '',
            recommendation: (r.recommendation as string) || '',
            keyRisks: toStringArray(r.keyRisks ?? r.risks ?? r.concerns),
            nextSteps: toStringArray(r.nextSteps ?? r.actions ?? r.suggestions),
            confidence: typeof r.confidence === 'number' ? r.confidence : 0,
            provider: (data?.provider as string) || 'AI',
            model: (data?.model as string) || '',
          });
          setStatus('ready');
        })
        .catch((err) => {
          clearTimeout(timer);
          if (err?.name === 'AbortError') {
            setStatus('idle');
            return;
          }
          console.warn('[useAiInsight] fetch error:', err);
          setInsight({
            summary: '',
            recommendation: '',
            keyRisks: [],
            nextSteps: [],
            confidence: 0,
            provider: '',
            model: '',
            error: err?.message || 'AI agent unreachable',
          });
          setStatus('error');
        });
    },
    []
  );

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setInsight(null);
    setStatus('idle');
  }, []);

  return { insight, status, fetch: fetchInsight, reset };
}
