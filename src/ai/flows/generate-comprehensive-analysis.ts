
'use server';

import { ai } from '@/ai/genkit';
import {
  ComprehensiveAnalysisInputSchema,
  type ComprehensiveAnalysisInput,
  ComprehensiveAnalysisOutputSchema,
  type ComprehensiveAnalysisOutput,
} from './schemas';

import { assessMacroTrendAlignment } from './assess-macro-trend-alignment';
import { generateRiskFlagsAndMitigation } from './generate-risk-flags-and-mitigation';
import { generateTcaScorecard } from './generate-tca-scorecard';
import { generateBenchmarkComparison } from './generate-benchmark-comparison';

// NEW: additional modules
import { generateGrowthClassifier } from './generate-growth-classifier';
import { generateGapAnalysis } from './generate-gap-analysis';
import { generateFounderFitAnalysis } from './generate-founder-fit-analysis';
import { generateTeamAssessment } from './generate-team-assessment';
import { generateStrategicFitMatrix } from './generate-strategic-fit-matrix';

// ------------------------------
// Model Registry & Discovery
// ------------------------------

type ModelCandidate = {
  name: string;
  provider: 'googleai' | 'openai' | 'anthropic' | 'azureopenai' | 'ollama' | 'other';
  purpose?: 'general' | 'fast' | 'creative' | 'reasoning';
};

function envHas(key: string) {
  return Boolean(process.env[key] && String(process.env[key]).trim().length > 0);
}

function discoverModelCandidates(): ModelCandidate[] {
  const candidates: ModelCandidate[] = [];

  // Google / Gemini
  if (envHas('GOOGLE_GENAI_API_KEY') || envHas('GOOGLE_API_KEY')) {
    candidates.push(
      { name: 'googleai/gemini-1.5-pro', provider: 'googleai', purpose: 'general' },
      { name: 'googleai/gemini-1.5-flash', provider: 'googleai', purpose: 'fast' }
    );
  }

  // OpenAI
  if (envHas('OPENAI_API_KEY')) {
    candidates.push(
      { name: 'openai/gpt-4.1', provider: 'openai', purpose: 'general' },
      { name: 'openai/gpt-4o', provider: 'openai', purpose: 'creative' },
      { name: 'openai/gpt-4o-mini', provider: 'openai', purpose: 'fast' }
    );
  }

  // Anthropic
  if (envHas('ANTHROPIC_API_KEY')) {
    candidates.push(
      { name: 'anthropic/claude-3-5-sonnet', provider: 'anthropic', purpose: 'general' },
      { name: 'anthropic/claude-3-5-haiku', provider: 'anthropic', purpose: 'fast' }
    );
  }

  // Azure OpenAI
  if (envHas('AZURE_OPENAI_API_KEY') && envHas('AZURE_OPENAI_ENDPOINT')) {
    candidates.push({ name: 'azureopenai/gpt-4o', provider: 'azureopenai', purpose: 'general' });
  }

  // Local (Ollama)
  if (envHas('OLLAMA_HOST')) {
    candidates.push(
      { name: 'ollama/llama3.1:70b', provider: 'ollama', purpose: 'general' },
      { name: 'ollama/llama3.1:8b', provider: 'ollama', purpose: 'fast' }
    );
  }

  // Optional preference nudges: comma-separated substrings
  const prefCsv = process.env.MODEL_PREFERENCE?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  if (prefCsv.length) {
    candidates.sort((a, b) => {
      const ia = prefCsv.findIndex(p => a.name.includes(p));
      const ib = prefCsv.findIndex(p => b.name.includes(p));
      return (ia === -1 ? 1e9 : ia) - (ib === -1 ? 1e9 : ib);
    });
  }

  if (candidates.length === 0) {
    candidates.push({ name: 'googleai/gemini-1.5-flash', provider: 'googleai', purpose: 'fast' });
  }

  return candidates;
}

// ------------------------------
// Resilience Utilities
// ------------------------------

type RetryOptions = {
  retries: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  jitter?: boolean;
  timeoutMs?: number;
  onRetry?: (err: unknown, attempt: number) => void;
};

async function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

function expBackoff(attempt: number, base: number, max?: number, jitter = true) {
  const raw = base * 2 ** (attempt - 1);
  const withJitter = jitter ? raw * (0.7 + Math.random() * 0.6) : raw;
  return Math.min(max ?? withJitter, max ? Math.min(withJitter, max) : withJitter);
}

async function withTimeout<T>(p: Promise<T>, ms?: number, label = 'operation'): Promise<T> {
  if (!ms || ms <= 0) return p;
  let t: NodeJS.Timeout;
  try {
    return await Promise.race<T>([
      p,
      new Promise<T>((_, rej) => {
        t = setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms);
      }) as unknown as Promise<T>
    ]);
  } finally {
    if (t!) clearTimeout(t);
  }
}

async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  const { retries, baseDelayMs, maxDelayMs, jitter = true, timeoutMs, onRetry } = opts;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await withTimeout(fn(), timeoutMs, `attempt ${attempt}`);
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        onRetry?.(err, attempt);
        const delay = expBackoff(attempt, baseDelayMs, maxDelayMs, jitter);
        await sleep(delay);
      }
    }
  }
  throw lastErr;
}

async function withModelFallback<T>(
  models: ModelCandidate[],
  task: (modelName: string) => Promise<T>,
  retry: RetryOptions
): Promise<{ result: T; modelUsed: string; attempts: number; failures: Array<{ model: string; error: string }> }> {
  const failures: Array<{ model: string; error: string }> = [];
  for (const m of models) {
    try {
      const result = await withRetry(() => task(m.name), {
        ...retry,
        onRetry: (err, attempt) => {
          console.warn(`⚠️ Retry ${attempt} on ${m.name}:`, (err as Error)?.message ?? err);
          retry.onRetry?.(err, attempt);
        }
      });
      return { result, modelUsed: m.name, attempts: failures.length + 1, failures };
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      failures.push({ model: m.name, error: msg });
      console.error(`❌ Model failed: ${m.name} — ${msg}`);
    }
  }
  throw new Error(
    `All candidate models failed. Details: ${failures.map(f => `${f.model}: ${f.error}`).join(' | ')}`
  );
}

// ------------------------------
// Diagnostics
// ------------------------------

type TaskKey =
  | 'tca'
  | 'risk'
  | 'macro'
  | 'benchmark'
  | 'growth'
  | 'gap'
  | 'founderFit'
  | 'team'
  | 'strategicFit';

type TaskDiag = {
  task: TaskKey;
  modelUsed?: string;
  attempts?: number;
  ms: number;
  ok: boolean;
  error?: string;
  failures?: Array<{ model: string; error: string }>;
};

type ComprehensiveDiagnostics = {
  startedAt: string;
  finishedAt: string;
  tasks: TaskDiag[];
  modelPool: string[];
};

const DEFAULT_RETRY: RetryOptions = {
  retries: 3,
  baseDelayMs: 400,
  maxDelayMs: 5000,
  jitter: true,
  timeoutMs: 60_000,
};

async function executeTask<T>(
  label: TaskKey,
  models: ModelCandidate[],
  fn: (modelName: string) => Promise<T>
): Promise<{ data?: T; diag: TaskDiag }> {
  const started = Date.now();
  try {
    const { result, modelUsed, attempts, failures } = await withModelFallback(models, fn, DEFAULT_RETRY);
    const ms = Date.now() - started;
    return { data: result, diag: { task: label, modelUsed, attempts, ms, ok: true, failures } };
  } catch (err) {
    const ms = Date.now() - started;
    return { data: undefined, diag: { task: label, ms, ok: false, error: (err as Error)?.message ?? String(err) } };
  }
}

// ------------------------------
// Public API (9 modules + diagnostics)
// ------------------------------

export async function generateComprehensiveAnalysis(
  input: ComprehensiveAnalysisInput
): Promise<
  ComprehensiveAnalysisOutput & {
    // Make diagnostics additive (non-breaking to existing consumers).
    __diagnostics?: ComprehensiveDiagnostics;
  }
> {
  const modelCandidates = discoverModelCandidates();
  console.log('🔎 Model pool:', modelCandidates.map(m => m.name));

  const diag: ComprehensiveDiagnostics = {
    startedAt: new Date().toISOString(),
    finishedAt: '',
    tasks: [],
    modelPool: modelCandidates.map(m => m.name),
  };

  // 9 modules in parallel; each with fallback + retry + timeout
  const [
    tcaRes,
    riskRes,
    macroRes,
    benchRes,
    growthRes,
    gapRes,
    founderRes,
    teamRes,
    stratRes,
  ] = await Promise.all([
    executeTask('tca', modelCandidates, (m) => generateTcaScorecard(input.tcaInput, m)),
    executeTask('risk', modelCandidates, (m) => generateRiskFlagsAndMitigation(input.riskInput, m)),
    executeTask('macro', modelCandidates, (m) => assessMacroTrendAlignment(input.macroInput, m)),
    executeTask('benchmark', modelCandidates, (m) => generateBenchmarkComparison(input.benchmarkInput, m)),
    executeTask('growth', modelCandidates, (m) => generateGrowthClassifier(input.growthInput!, m)),
    executeTask('gap', modelCandidates, (m) => generateGapAnalysis(input.gapInput!, m)),
    executeTask('founderFit', modelCandidates, (m) => generateFounderFitAnalysis(input.founderFitInput!, m)),
    executeTask('team', modelCandidates, (m) => generateTeamAssessment(input.teamInput!, m)),
    executeTask('strategicFit', modelCandidates, (m) => generateStrategicFitMatrix(input.strategicFitInput!, m)),
  ]);

  diag.tasks.push(
    tcaRes.diag,
    riskRes.diag,
    macroRes.diag,
    benchRes.diag,
    growthRes.diag,
    gapRes.diag,
    founderRes.diag,
    teamRes.diag,
    stratRes.diag
  );
  diag.finishedAt = new Date().toISOString();

  // Return partials if any task failed (no hard crash).
  const payload: ComprehensiveAnalysisOutput & { __diagnostics?: ComprehensiveDiagnostics } = {
    tcaData: tcaRes.data ?? null,
    riskData: riskRes.data ?? null,
    macroData: macroRes.data ?? null,
    benchmarkData: benchRes.data ?? null,
    growthData: growthRes.data ?? null,
    gapData: gapRes.data ?? null,
    founderFitData: founderRes.data ?? null,
    teamData: teamRes.data ?? null,
    strategicFitData: stratRes.data ?? null,
    __diagnostics: diag,
  };

  return payload;
}

// ------------------------------
// Genkit Flow Definition
// ------------------------------

const generateComprehensiveAnalysisFlow = ai.defineFlow(
  {
    name: 'generateComprehensiveAnalysisFlow',
    inputSchema: ComprehensiveAnalysisInputSchema,
    outputSchema: ComprehensiveAnalysisOutputSchema, // ensure this schema includes all 9 outputs
  },
  generateComprehensiveAnalysis
);

export { generateComprehensiveAnalysisFlow };
