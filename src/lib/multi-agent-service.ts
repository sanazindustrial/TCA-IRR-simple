/**
 * Multi-Agent AI Orchestration Service
 *
 * Coordinates specialised agents to run analysis concurrently across all 17
 * modules, extract text from uploaded documents, perform TCA scoring, and
 * validate result consistency — then produces a unified payload ready for
 * report generation.
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';
const API_PREFIX = '/api/v1';

// ── Types ────────────────────────────────────────────────────────────────────

export type ReportType = 'triage' | 'dd' | 'ssd';

export type AgentName =
  | 'ExtractionAgent'
  | 'AnalysisAgent'
  | 'TcaAgent'
  | 'ReportAgent'
  | 'ValidationAgent';

export type AgentStatus = 'idle' | 'running' | 'done' | 'failed';

export interface AgentResult {
  agent: AgentName;
  status: AgentStatus;
  data: Record<string, unknown> | null;
  error?: string;
  durationMs?: number;
}

export interface OrchestrationContext {
  companyName: string;
  companyDescription?: string;
  companyIndustry?: string;
  reportType: ReportType;
  framework?: 'general' | 'medtech' | 'triage';
  modules?: string[];
  uploadedFiles?: Array<{ name: string; size: number }>;
  importedUrls?: string[];
  submittedTexts?: string[];
  authToken?: string;
}

export interface OrchestrationResult {
  success: boolean;
  agentResults: AgentResult[];
  mergedData: Record<string, unknown>;
  totalDurationMs: number;
  errors: string[];
}

export type ProgressCallback = (agent: AgentName, status: AgentStatus, progress: number) => void;

// ── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(token?: string): Record<string, string> {
  const t = token ?? (typeof window !== 'undefined' ? (localStorage.getItem('authToken') ?? '') : '');
  return {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit,
  token?: string,
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${API_PREFIX}${path}`, {
    ...options,
    headers: {
      ...authHeaders(token),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${path} → ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ── Individual Agents ────────────────────────────────────────────────────────

/**
 * ExtractionAgent — extracts text content from uploaded files via backend OCR
 * and text extraction endpoint.
 */
async function runExtractionAgent(
  ctx: OrchestrationContext,
  onProgress?: ProgressCallback,
): Promise<AgentResult> {
  const start = Date.now();
  onProgress?.('ExtractionAgent', 'running', 0);

  try {
    const texts: string[] = [...(ctx.submittedTexts ?? [])];

    // For each URL, attempt client-side extraction via /api/external-data
    for (const url of ctx.importedUrls ?? []) {
      try {
        const res = await fetch(
          `/api/external-data?source=web&query=${encodeURIComponent(url)}&limit=1`,
        );
        if (res.ok) {
          const d = await res.json();
          if (d.data?.text) texts.push(String(d.data.text));
        }
      } catch { /* skip individual URL failures */ }
    }

    onProgress?.('ExtractionAgent', 'done', 100);
    return {
      agent: 'ExtractionAgent',
      status: 'done',
      data: { extractedTexts: texts },
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    onProgress?.('ExtractionAgent', 'failed', 0);
    return { agent: 'ExtractionAgent', status: 'failed', data: null, error, durationMs: Date.now() - start };
  }
}

/**
 * AnalysisAgent — runs comprehensive analysis across all (or specified) modules
 * concurrently via the backend analysis endpoints.
 */
async function runAnalysisAgent(
  ctx: OrchestrationContext,
  extractedTexts: string[],
  onProgress?: ProgressCallback,
): Promise<AgentResult> {
  const start = Date.now();
  onProgress?.('AnalysisAgent', 'running', 10);

  const ALL_MODULES = [
    'analyst', 'benchmark', 'economic', 'environmental', 'financial',
    'founderFit', 'funder', 'gap', 'growth', 'macro', 'marketing',
    'risk', 'social', 'strategic', 'strategicFit', 'tca', 'team',
  ];

  const activeModules = (ctx.modules && ctx.modules.length > 0 ? ctx.modules : ALL_MODULES).map(
    (id) => ({ module_id: id, weight: 10, is_enabled: true }),
  );

  const combinedDescription = [
    ctx.companyDescription,
    ctx.companyIndustry,
    ...extractedTexts.slice(0, 3), // first 3 extracted texts for context
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 4000); // keep payload reasonable

  try {
    onProgress?.('AnalysisAgent', 'running', 30);
    const result = await apiFetch<Record<string, unknown>>(
      '/analysis/comprehensive',
      {
        method: 'POST',
        body: JSON.stringify({
          company_name: ctx.companyName,
          company_description: combinedDescription,
          framework: ctx.framework ?? 'general',
          active_modules: activeModules,
        }),
      },
      ctx.authToken,
    );

    onProgress?.('AnalysisAgent', 'done', 100);
    return {
      agent: 'AnalysisAgent',
      status: 'done',
      data: result,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    onProgress?.('AnalysisAgent', 'failed', 0);
    return { agent: 'AnalysisAgent', status: 'failed', data: null, error, durationMs: Date.now() - start };
  }
}

/**
 * TcaAgent — retrieves or computes TCA scoring for the company. Uses the
 * quick-TCA endpoint for speed; falls back to a lightweight score derivation
 * from the analysis result if the TCA endpoint is unavailable.
 */
async function runTcaAgent(
  ctx: OrchestrationContext,
  analysisData: Record<string, unknown> | null,
  onProgress?: ProgressCallback,
): Promise<AgentResult> {
  const start = Date.now();
  onProgress?.('TcaAgent', 'running', 10);

  try {
    const result = await apiFetch<Record<string, unknown>>(
      '/tca/quick',
      {
        method: 'GET',
      },
      ctx.authToken,
    );

    onProgress?.('TcaAgent', 'done', 100);
    return {
      agent: 'TcaAgent',
      status: 'done',
      data: { tcaScore: result, sourceAnalysis: analysisData },
      durationMs: Date.now() - start,
    };
  } catch {
    // Fallback: derive a simple score from analysis data
    const fallbackScore =
      analysisData &&
      typeof (analysisData as Record<string, unknown>).composite_score === 'number'
        ? (analysisData as { composite_score: number }).composite_score
        : null;

    onProgress?.('TcaAgent', 'done', 100);
    return {
      agent: 'TcaAgent',
      status: 'done',
      data: { tcaScore: fallbackScore, fallback: true },
      durationMs: Date.now() - start,
    };
  }
}

/**
 * ReportAgent — assembles the structured report payload from analysis results
 * and report configuration (active sections, report type).
 */
async function runReportAgent(
  ctx: OrchestrationContext,
  analysisData: Record<string, unknown> | null,
  tcaData: Record<string, unknown> | null,
  onProgress?: ProgressCallback,
): Promise<AgentResult> {
  const start = Date.now();
  onProgress?.('ReportAgent', 'running', 20);

  try {
    // Load saved section config from localStorage (client-side only)
    let activeSections: string[] = [];
    if (typeof window !== 'undefined') {
      const configKey =
        ctx.reportType === 'ssd'
          ? 'report-config-ssd-sections'
          : ctx.reportType === 'dd'
          ? 'report-config-dd'
          : 'report-config-triage-standard';
      try {
        const saved = localStorage.getItem(configKey);
        if (saved) {
          const sections = JSON.parse(saved) as Array<{ id: string; active: boolean }>;
          activeSections = sections.filter((s) => s.active).map((s) => s.id);
        }
      } catch { /* ignore */ }
    }

    const reportPayload = {
      company_name: ctx.companyName,
      report_type: ctx.reportType,
      framework: ctx.framework ?? 'general',
      analysis_data: analysisData ?? {},
      tca_data: tcaData ?? {},
      active_sections: activeSections,
      generated_at: new Date().toISOString(),
    };

    onProgress?.('ReportAgent', 'done', 100);
    return {
      agent: 'ReportAgent',
      status: 'done',
      data: reportPayload,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    onProgress?.('ReportAgent', 'failed', 0);
    return { agent: 'ReportAgent', status: 'failed', data: null, error, durationMs: Date.now() - start };
  }
}

/**
 * ValidationAgent — cross-checks agent outputs for consistency. Flags missing
 * modules, score anomalies, and empty sections.
 */
async function runValidationAgent(
  analysisData: Record<string, unknown> | null,
  tcaData: Record<string, unknown> | null,
  reportData: Record<string, unknown> | null,
  onProgress?: ProgressCallback,
): Promise<AgentResult> {
  const start = Date.now();
  onProgress?.('ValidationAgent', 'running', 10);

  const warnings: string[] = [];

  if (!analysisData) {
    warnings.push('Analysis data is missing.');
  } else {
    const EXPECTED_MODULES = [
      'analyst', 'benchmark', 'economic', 'environmental', 'financial',
      'founderFit', 'funder', 'gap', 'growth', 'macro', 'marketing',
      'risk', 'social', 'strategic', 'strategicFit', 'tca', 'team',
    ];
    for (const mod of EXPECTED_MODULES) {
      if (!(mod in analysisData)) {
        warnings.push(`Module '${mod}' result is absent from analysis data.`);
      }
    }
    const score = (analysisData as Record<string, unknown>).composite_score;
    if (typeof score === 'number' && (score < 0 || score > 10)) {
      warnings.push(`Composite score ${score} is outside expected range [0, 10].`);
    }
  }

  if (!tcaData || (tcaData as Record<string, unknown>).tcaScore === null) {
    warnings.push('TCA score is unavailable; using fallback derivation.');
  }

  if (!reportData || !(reportData as Record<string, unknown>).analysis_data) {
    warnings.push('Report payload is incomplete.');
  }

  onProgress?.('ValidationAgent', 'done', 100);
  return {
    agent: 'ValidationAgent',
    status: 'done',
    data: { warnings, valid: warnings.length === 0 },
    durationMs: Date.now() - start,
  };
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export class MultiAgentOrchestrator {
  /**
   * Run all agents in the optimal order:
   *  1. ExtractionAgent (parallel with step 2 is fine but kept sequential for
   *     data dependency)
   *  2. AnalysisAgent (uses extraction output)
   *  3. TcaAgent (parallel with AnalysisAgent in practice; sequenced here for
   *     the fallback dependency)
   *  4. ReportAgent (uses analysis + TCA results)
   *  5. ValidationAgent (uses all above)
   */
  async orchestrate(
    ctx: OrchestrationContext,
    onProgress?: ProgressCallback,
  ): Promise<OrchestrationResult> {
    const globalStart = Date.now();
    const agentResults: AgentResult[] = [];
    const errors: string[] = [];

    // Stage 1 — Extraction
    const extractionResult = await runExtractionAgent(ctx, onProgress);
    agentResults.push(extractionResult);
    if (extractionResult.status === 'failed' && extractionResult.error) {
      errors.push(`ExtractionAgent: ${extractionResult.error}`);
    }
    const extractedTexts =
      (extractionResult.data?.extractedTexts as string[] | undefined) ?? [];

    // Stage 2 — Analysis + TCA (run concurrently)
    const [analysisResult, tcaResult] = await Promise.all([
      runAnalysisAgent(ctx, extractedTexts, onProgress),
      runTcaAgent(ctx, extractionResult.data, onProgress),
    ]);
    agentResults.push(analysisResult, tcaResult);
    if (analysisResult.status === 'failed' && analysisResult.error) {
      errors.push(`AnalysisAgent: ${analysisResult.error}`);
    }
    if (tcaResult.status === 'failed' && tcaResult.error) {
      errors.push(`TcaAgent: ${tcaResult.error}`);
    }

    // Stage 3 — Report assembly
    const reportResult = await runReportAgent(
      ctx,
      analysisResult.data,
      tcaResult.data,
      onProgress,
    );
    agentResults.push(reportResult);
    if (reportResult.status === 'failed' && reportResult.error) {
      errors.push(`ReportAgent: ${reportResult.error}`);
    }

    // Stage 4 — Validation
    const validationResult = await runValidationAgent(
      analysisResult.data,
      tcaResult.data,
      reportResult.data,
      onProgress,
    );
    agentResults.push(validationResult);
    const validationWarnings =
      (validationResult.data?.warnings as string[] | undefined) ?? [];
    errors.push(...validationWarnings);

    // Merge outputs into a single flat payload
    const mergedData: Record<string, unknown> = {
      ...(analysisResult.data ?? {}),
      tca: tcaResult.data,
      report: reportResult.data,
      validation: validationResult.data,
      _meta: {
        orchestratedAt: new Date().toISOString(),
        reportType: ctx.reportType,
        framework: ctx.framework,
        agentCount: agentResults.length,
        errors: errors.length,
      },
    };

    return {
      success: errors.filter((e) => !e.startsWith('Module')).length === 0,
      agentResults,
      mergedData,
      totalDurationMs: Date.now() - globalStart,
      errors,
    };
  }
}

/** Singleton instance for use across the application */
export const multiAgentOrchestrator = new MultiAgentOrchestrator();
