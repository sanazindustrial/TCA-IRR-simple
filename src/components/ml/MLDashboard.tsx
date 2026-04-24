'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ModelCards } from './ModelCards';

interface MLStatus {
  status: string;
  models: {
    arima: boolean;
    xgboost: boolean;
    lstm: boolean;
    sklearn: boolean;
  };
  training_samples?: number;
  version?: string;
}

interface ScoreResult {
  ml_score?: number;
  rule_score?: number;
  blended_score?: number;
  mode?: string;
  categories?: Record<string, number>;
}

interface RiskResult {
  risk_flags?: string[];
  severity?: string;
  risk_score?: number;
  details?: Record<string, unknown>;
}

interface GrowthResult {
  tier?: number;
  tier_label?: string;
  confidence?: number;
  mode?: string;
  scenarios?: {
    bear?: { revenue_3yr: number };
    base?: { revenue_3yr: number };
    bull?: { revenue_3yr: number };
  };
}

interface MLDashboardProps {
  backendUrl: string;
  authToken?: string;
}

const DEMO_COMPANY = {
  revenue_growth: 0.35,
  gross_margin: 0.62,
  burn_rate: 85000,
  runway_months: 18,
  team_size: 12,
  market_size: 500000000,
  customer_count: 45,
  churn_rate: 0.04,
  nps_score: 72,
  patent_count: 2,
  funding_rounds: 2,
  total_funding: 2500000,
  arr: 480000,
  mrr_growth: 0.08,
  ltv_cac_ratio: 3.2,
};

export function MLDashboard({ backendUrl, authToken }: MLDashboardProps) {
  const [status, setStatus] = useState<MLStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [growthResult, setGrowthResult] = useState<GrowthResult | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) h['Authorization'] = `Bearer ${authToken}`;
    return h;
  }, [authToken]);

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/v1/ml/status`, { headers: headers() });
      if (res.ok) setStatus(await res.json());
    } catch {
      // status unavailable — non-critical
    } finally {
      setStatusLoading(false);
    }
  }, [backendUrl, headers]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const runScore = async () => {
    setActionLoading('score');
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/v1/ml/score`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ metrics: DEMO_COMPANY }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setScoreResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Score failed');
    } finally {
      setActionLoading(null);
    }
  };

  const runRisk = async () => {
    setActionLoading('risk');
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/v1/ml/risk`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ metrics: DEMO_COMPANY }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRiskResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Risk classification failed');
    } finally {
      setActionLoading(null);
    }
  };

  const runGrowth = async () => {
    setActionLoading('growth');
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/v1/ml/predict`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ metrics: DEMO_COMPANY }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setGrowthResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Growth prediction failed');
    } finally {
      setActionLoading(null);
    }
  };

  const modelCards = status
    ? [
        { name: 'ARIMA', available: status.models.arima, description: 'Time-series autoregressive model' },
        { name: 'XGBoost', available: status.models.xgboost, description: 'Gradient boosting ensemble' },
        { name: 'LSTM', available: status.models.lstm, description: 'Deep learning sequence model' },
        { name: 'scikit-learn', available: status.models.sklearn, description: 'Classical ML algorithms' },
      ]
    : [];

  const severityColor = (s?: string) => {
    if (s === 'high') return 'text-red-600 dark:text-red-400';
    if (s === 'medium') return 'text-amber-600 dark:text-amber-400';
    return 'text-green-600 dark:text-green-400';
  };

  const tierColor = (t?: number) => {
    if (t === 1) return 'text-green-600 dark:text-green-400';
    if (t === 2) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Model availability */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Model Availability</h3>
          <button
            onClick={fetchStatus}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Refresh
          </button>
        </div>
        <ModelCards models={modelCards} loading={statusLoading} />
        {status && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            Training samples: {status.training_samples ?? 0} &nbsp;·&nbsp; Version: {status.version ?? 'N/A'}
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 px-1">{error}</p>
      )}

      {/* Demo actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Score prediction */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex flex-col gap-3">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">ML Score Prediction</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Blends rule-based scoring (60% ML / 40% rules when trained).
          </p>
          <button
            onClick={runScore}
            disabled={actionLoading === 'score'}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium py-2 px-4 transition-colors"
          >
            {actionLoading === 'score' ? 'Running...' : 'Run Demo Score'}
          </button>
          {scoreResult && (
            <div className="text-xs space-y-1 mt-1">
              <p><span className="text-gray-500">Blended:</span> <strong className="text-gray-800 dark:text-gray-200">{scoreResult.blended_score?.toFixed(1)}</strong></p>
              <p><span className="text-gray-500">Mode:</span> {scoreResult.mode}</p>
              {scoreResult.categories && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Category breakdown</summary>
                  <div className="mt-1 space-y-0.5 pl-2">
                    {Object.entries(scoreResult.categories).map(([cat, val]) => (
                      <p key={cat}><span className="text-gray-400">{cat}:</span> {(val as number).toFixed(1)}</p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Risk classification */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex flex-col gap-3">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">Risk Classification</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Detects 14 risk flags across financial, market, and team dimensions.
          </p>
          <button
            onClick={runRisk}
            disabled={actionLoading === 'risk'}
            className="rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-medium py-2 px-4 transition-colors"
          >
            {actionLoading === 'risk' ? 'Running...' : 'Run Demo Risk'}
          </button>
          {riskResult && (
            <div className="text-xs space-y-1 mt-1">
              <p>
                <span className="text-gray-500">Severity:</span>{' '}
                <strong className={severityColor(riskResult.severity)}>{riskResult.severity ?? 'low'}</strong>
              </p>
              <p><span className="text-gray-500">Risk score:</span> {riskResult.risk_score?.toFixed(2)}</p>
              {riskResult.risk_flags && riskResult.risk_flags.length > 0 ? (
                <div>
                  <p className="text-gray-500 mb-0.5">Flags:</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    {riskResult.risk_flags.map((f) => (
                      <li key={f} className="text-red-600 dark:text-red-400">{f}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-green-600 dark:text-green-400">No risk flags detected</p>
              )}
            </div>
          )}
        </div>

        {/* Growth prediction */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex flex-col gap-3">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">Growth Prediction</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Classifies growth tier (1–3) with Bear/Base/Bull 3-year scenarios.
          </p>
          <button
            onClick={runGrowth}
            disabled={actionLoading === 'growth'}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium py-2 px-4 transition-colors"
          >
            {actionLoading === 'growth' ? 'Running...' : 'Run Demo Growth'}
          </button>
          {growthResult && (
            <div className="text-xs space-y-1 mt-1">
              <p>
                <span className="text-gray-500">Tier:</span>{' '}
                <strong className={tierColor(growthResult.tier)}>{growthResult.tier_label}</strong>
              </p>
              <p><span className="text-gray-500">Confidence:</span> {((growthResult.confidence ?? 0) * 100).toFixed(0)}%</p>
              <p><span className="text-gray-500">Mode:</span> {growthResult.mode}</p>
              {growthResult.scenarios && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-gray-500">3-yr Revenue Scenarios:</p>
                  {growthResult.scenarios.bear && (
                    <p>🐻 Bear: ${(growthResult.scenarios.bear.revenue_3yr / 1e6).toFixed(2)}M</p>
                  )}
                  {growthResult.scenarios.base && (
                    <p>📊 Base: ${(growthResult.scenarios.base.revenue_3yr / 1e6).toFixed(2)}M</p>
                  )}
                  {growthResult.scenarios.bull && (
                    <p>🐂 Bull: ${(growthResult.scenarios.bull.revenue_3yr / 1e6).toFixed(2)}M</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
