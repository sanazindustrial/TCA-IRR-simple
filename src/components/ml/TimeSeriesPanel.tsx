'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface ForecastPoint {
  step: number;
  arima?: number;
  xgboost?: number;
  lstm?: number;
  ensemble?: number;
  lower?: number;
  upper?: number;
}

interface TimeSeriesResult {
  arima?: number[];
  xgboost?: number[];
  lstm?: number[];
  ensemble?: number[];
  confidence_lower?: number[];
  confidence_upper?: number[];
  models_used?: string[];
  steps?: number;
}

interface TimeSeriesPanelProps {
  backendUrl: string;
  authToken?: string;
}

const DEMO_HISTORY = [120, 135, 128, 142, 156, 148, 163, 175, 168, 182];

const LINE_COLORS = {
  arima:    '#6366f1',
  xgboost:  '#f59e0b',
  lstm:     '#10b981',
  ensemble: '#ef4444',
};

export function TimeSeriesPanel({ backendUrl, authToken }: TimeSeriesPanelProps) {
  const [series, setSeries] = useState<string>(DEMO_HISTORY.join(', '));
  const [steps, setSteps] = useState(5);
  const [result, setResult] = useState<TimeSeriesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModels, setActiveModels] = useState<string[]>(['ensemble']);

  const runForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const values = series
        .split(',')
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n));

      if (values.length < 5) {
        setError('Please enter at least 5 data points.');
        setLoading(false);
        return;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${backendUrl}/api/v1/ml/time-series`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ series: values, steps }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Forecast failed');
    } finally {
      setLoading(false);
    }
  };

  const chartData = React.useMemo((): ForecastPoint[] => {
    const history = series
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    const histPoints: ForecastPoint[] = history.map((_, i) => ({ step: i - history.length }));

    if (!result) return histPoints;

    return Array.from({ length: result.steps ?? steps }, (_, i) => ({
      step: i + 1,
      arima: result.arima?.[i],
      xgboost: result.xgboost?.[i],
      lstm: result.lstm?.[i],
      ensemble: result.ensemble?.[i],
      lower: result.confidence_lower?.[i],
      upper: result.confidence_upper?.[i],
    }));
  }, [result, series, steps]);

  const toggleModel = (m: string) =>
    setActiveModels((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex flex-col gap-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Input Series</h3>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Comma-separated numeric values
            </label>
            <textarea
              value={series}
              onChange={(e) => setSeries(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm p-2 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 120, 135, 128, 142, 156..."
            />
          </div>
          <div className="flex flex-col gap-2 min-w-[120px]">
            <label className="block text-xs text-gray-500 dark:text-gray-400">Forecast Steps</label>
            <input
              type="number"
              min={1}
              max={20}
              value={steps}
              onChange={(e) => setSteps(parseInt(e.target.value) || 5)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm p-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={runForecast}
              disabled={loading}
              className="mt-auto rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 transition-colors"
            >
              {loading ? 'Running...' : 'Forecast'}
            </button>
          </div>
        </div>

        {/* Model toggles */}
        <div className="flex flex-wrap gap-2">
          {(['ensemble', 'arima', 'xgboost', 'lstm'] as const).map((m) => (
            <button
              key={m}
              onClick={() => toggleModel(m)}
              className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                activeModels.includes(m)
                  ? 'border-transparent text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 bg-transparent'
              }`}
              style={
                activeModels.includes(m)
                  ? { backgroundColor: LINE_COLORS[m] }
                  : {}
              }
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Forecast Chart</h3>
        {result ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="step" label={{ value: 'Step', position: 'insideBottom', offset: -2 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="4 4" label="Now" />
              {activeModels.includes('arima') && (
                <Line type="monotone" dataKey="arima" stroke={LINE_COLORS.arima} strokeWidth={2} dot={false} name="ARIMA" />
              )}
              {activeModels.includes('xgboost') && (
                <Line type="monotone" dataKey="xgboost" stroke={LINE_COLORS.xgboost} strokeWidth={2} dot={false} name="XGBoost" />
              )}
              {activeModels.includes('lstm') && (
                <Line type="monotone" dataKey="lstm" stroke={LINE_COLORS.lstm} strokeWidth={2} dot={false} name="LSTM" />
              )}
              {activeModels.includes('ensemble') && (
                <Line type="monotone" dataKey="ensemble" stroke={LINE_COLORS.ensemble} strokeWidth={2.5} dot={false} name="Ensemble" />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-600 text-sm">
            Enter a series and click Forecast to see results
          </div>
        )}
      </div>

      {/* Raw values */}
      {result && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Forecast Values</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 pr-4">Step</th>
                  {result.arima && <th className="pb-2 pr-4" style={{ color: LINE_COLORS.arima }}>ARIMA</th>}
                  {result.xgboost && <th className="pb-2 pr-4" style={{ color: LINE_COLORS.xgboost }}>XGBoost</th>}
                  {result.lstm && <th className="pb-2 pr-4" style={{ color: LINE_COLORS.lstm }}>LSTM</th>}
                  {result.ensemble && <th className="pb-2 pr-4" style={{ color: LINE_COLORS.ensemble }}>Ensemble</th>}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: result.steps ?? steps }, (_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-1.5 pr-4 text-gray-600 dark:text-gray-400">+{i + 1}</td>
                    {result.arima && <td className="py-1.5 pr-4">{result.arima[i]?.toFixed(2)}</td>}
                    {result.xgboost && <td className="py-1.5 pr-4">{result.xgboost[i]?.toFixed(2)}</td>}
                    {result.lstm && <td className="py-1.5 pr-4">{result.lstm[i]?.toFixed(2)}</td>}
                    {result.ensemble && <td className="py-1.5 pr-4">{result.ensemble[i]?.toFixed(2)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.models_used && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Models used: {result.models_used.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
