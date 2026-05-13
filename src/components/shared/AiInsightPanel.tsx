'use client';

/**
 * AiInsightPanel — universal AI insight UI component.
 * Drop this into any page that uses useAiInsight().
 * Handles all states: loading, ready, error, unavailable.
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import type { AiInsightResult, AiInsightStatus } from '@/hooks/use-ai-insight';

interface AiInsightPanelProps {
  status: AiInsightStatus;
  insight: AiInsightResult | null;
  title?: string;
  onRetry?: () => void;
  /** Collapse large panels by default */
  collapsible?: boolean;
  /** Extra CSS classes for the card wrapper */
  className?: string;
  /** Show in compact inline mode (no title, no lists) */
  compact?: boolean;
}

export function AiInsightPanel({
  status,
  insight,
  title = 'AI Investment Insight',
  onRetry,
  collapsible = true,
  className = '',
  compact = false,
}: AiInsightPanelProps) {
  const [expanded, setExpanded] = useState(true);

  // Nothing to show if unavailable or idle
  if (status === 'unavailable' || status === 'idle') return null;

  const providerLabel = insight?.provider
    ? `${insight.provider}${insight.model ? ` · ${insight.model}` : ''}`
    : 'AI';

  const confidencePct = insight?.confidence
    ? `${Math.round(insight.confidence * 100)}% confidence`
    : null;

  return (
    <Card
      className={`border-violet-500/40 bg-gradient-to-br from-violet-500/5 via-indigo-500/5 to-background ${className}`}
    >
      <CardContent className="py-4 px-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500 flex-shrink-0" />
            {!compact && (
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                {title}
              </span>
            )}
            {status === 'ready' && insight && (
              <Badge
                variant="outline"
                className="text-[10px] border-violet-400/40 text-violet-500 px-2 py-0"
              >
                {providerLabel}
              </Badge>
            )}
            {confidencePct && status === 'ready' && (
              <span className="text-[10px] text-muted-foreground">{confidencePct}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {status === 'error' && onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            {collapsible && status === 'ready' && insight && !compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded((e) => !e)}
                className="h-6 text-[11px] text-muted-foreground"
              >
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
            AI agent is analyzing data…
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            {insight?.error || 'AI agent unavailable. Results are unaffected.'}
          </div>
        )}

        {/* Ready */}
        {status === 'ready' && insight && (expanded || compact) && (
          <div className="space-y-3">
            {/* Summary */}
            {insight.summary && (
              <p className="text-sm text-foreground leading-relaxed">{insight.summary}</p>
            )}

            {/* Recommendation */}
            {insight.recommendation && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {insight.recommendation}
                </p>
              </div>
            )}

            {!compact && (
              <>
                {/* Key Risks */}
                {insight.keyRisks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                        Key Risks
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {insight.keyRisks.slice(0, 4).map((risk, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-amber-400 mt-0.5">•</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Steps */}
                {insight.nextSteps.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        Suggested Next Steps
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {insight.nextSteps.slice(0, 4).map((step, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-blue-400 font-bold mt-0.5">{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Ready but collapsed */}
        {status === 'ready' && insight && !expanded && !compact && (
          <p className="text-xs text-muted-foreground italic">
            {insight.summary.slice(0, 120)}
            {insight.summary.length > 120 ? '…' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * AiErrorExplainer — inline AI-powered error message renderer.
 * Shows a friendly AI explanation for a caught error.
 * Usage: <AiErrorExplainer context="triage" error={error} onRetry={handleRetry} />
 */
interface AiErrorExplainerProps {
  context: 'triage' | 'due-diligence' | 'ssd' | 'what-if' | 'general';
  error: string | Error | null;
  onRetry?: () => void;
}

const CONTEXT_LABELS: Record<string, string> = {
  triage: 'Triage Report',
  'due-diligence': 'Due Diligence',
  ssd: 'SSD Audit',
  'what-if': 'What-If Simulation',
  general: 'Analysis',
};

const AI_ERROR_HINTS: Record<string, string[]> = {
  triage: [
    'Ensure all required data sources (pitch deck, financials, market data) are uploaded.',
    'Check that TCA categories have valid scores before generating.',
    'Try refreshing analysis data from the Evaluation page.',
  ],
  'due-diligence': [
    'Due Diligence requires an existing triage analysis — run triage first.',
    'Upload financial statements, legal docs, and cap table for best results.',
    'Ensure your account has admin or analyst permissions.',
  ],
  ssd: [
    'SSD requires a connected backend tunnel. Check System Health.',
    'Verify founder email and callback URL are correctly formatted.',
    'Poll intervals may fail if the backend restarts — click Refresh to retry.',
  ],
  'what-if': [
    'What-If requires a completed analysis in localStorage — run analysis first.',
    'Slider changes outside 0–10 range will be clamped automatically.',
    'If the result page shows sample data, return and re-run the simulation.',
  ],
  general: [
    'Refresh the page and try again.',
    'Check your network connection.',
    'Contact support if the problem persists.',
  ],
};

export function AiErrorExplainer({ context, error, onRetry }: AiErrorExplainerProps) {
  if (!error) return null;

  const errorMsg = typeof error === 'string' ? error : error.message || 'Unknown error';
  const hints = AI_ERROR_HINTS[context] ?? AI_ERROR_HINTS.general;
  const label = CONTEXT_LABELS[context] ?? 'Analysis';

  return (
    <Card className="border-red-400/40 bg-red-500/5">
      <CardContent className="py-4 px-5">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-full bg-red-500/10 flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                {label} Error
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{errorMsg}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground mb-1">AI-Guided Troubleshooting:</p>
              <ul className="space-y-0.5">
                {hints.map((hint, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Sparkles className="h-3 w-3 text-violet-400 mt-0.5 flex-shrink-0" />
                    {hint}
                  </li>
                ))}
              </ul>
            </div>
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="border-red-400/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-7 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
