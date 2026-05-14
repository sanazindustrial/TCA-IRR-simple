'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  ShieldCheck,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Key,
  Settings,
  ArrowRight,
  Info,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProviderStatus {
  configured: boolean;
  model: string;
}

interface AgentStatus {
  status: string;
  activeProvider: string;
  activeModel: string;
  fallbackProvider: string;
  fallbackModel: string;
  providers: {
    openai: ProviderStatus;
    gemini: ProviderStatus;
  };
  securityFeatures: string[];
  timestamp: string;
}

interface QualityMetric {
  label: string;
  value: string;
  detail: string;
  good: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ProviderBadge({ provider, active }: { provider: string; active: boolean }) {
  return (
    <Badge
      className={cn(
        'text-xs font-semibold px-2 py-0.5',
        active ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
               : 'bg-slate-100 text-slate-500 border border-slate-200'
      )}
    >
      {active ? <CheckCircle className="w-3 h-3 mr-1 inline" /> : <XCircle className="w-3 h-3 mr-1 inline" />}
      {provider}
    </Badge>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AiManagementPage() {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testRunning, setTestRunning] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-agent');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const token = res.headers.get('x-csrf-token');
      if (token) setCsrfToken(token);
      const data = await res.json() as AgentStatus;
      setAgentStatus(data);
      setLastRefresh(new Date());
    } catch (e) {
      setError(`Failed to load AI agent status: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const runTest = async () => {
    setTestRunning(true);
    setTestResult(null);
    try {
      let token = csrfToken;
      if (!token) {
        const tokenRes = await fetch('/api/ai-agent');
        token = tokenRes.headers.get('x-csrf-token') || '';
        if (token) setCsrfToken(token);
      }

      const res = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-csrf-token': token } : {}),
        },
        body: JSON.stringify({
          task: 'score',
          prompt: 'Score a seed-stage SaaS startup with $50k MRR, 3 co-founders, 18 months runway.',
        }),
      });
      const data = await res.json() as { provider?: string; model?: string; result?: string; error?: string };
      if (data.error) {
        setTestResult(`Error: ${data.error}`);
      } else {
        setTestResult(`✓ Success — Provider: ${data.provider ?? '?'} / Model: ${data.model ?? '?'}\n\n${data.result ?? ''}`);
      }
    } catch (e) {
      setTestResult(`Test failed: ${String(e)}`);
    } finally {
      setTestRunning(false);
    }
  };

  const qualityMetrics: QualityMetric[] = [
    { label: 'Temperature', value: '0.2', detail: 'Low temperature = high consistency for analytical tasks', good: true },
    { label: 'Max Tokens', value: '2,048', detail: 'Enough for comprehensive analysis without runaway generation', good: true },
    { label: 'Response Format', value: 'JSON only', detail: 'Structured output enforced for all analysis tasks', good: true },
    { label: 'System Prompt', value: 'Role-locked', detail: 'AI role is enforced in every request, cannot be overridden by user content', good: true },
    { label: 'Provider Chain', value: 'OpenAI → Gemini', detail: 'Automatic fallback ensures analysis never fails due to a single provider outage', good: true },
    { label: 'Timeout', value: '30 seconds', detail: 'Hard timeout per provider call prevents hanging requests', good: true },
  ];

  const securityFeatures = [
    { icon: ShieldCheck, label: 'Prompt Injection Detection', detail: 'Scans all user input for injection patterns (e.g., "ignore previous instructions") before forwarding to the AI model. Blocked requests return HTTP 400.' },
    { icon: Lock, label: 'API Key Concealment', detail: 'API keys (OPENAI_API_KEY, GOOGLE_AI_API_KEY) are server-side environment variables. They are never sent to the browser or included in any client response.' },
    { icon: ShieldCheck, label: 'Input Sanitization', detail: 'Null bytes and oversized inputs are stripped. User text is hard-capped at 8 000 characters for prompts and 4 000 for context.' },
    { icon: Lock, label: 'SSRF Protection', detail: 'Any URL processing in the analysis pipeline blocks private IP ranges (10.x, 192.168.x, 127.x) and internal hostnames to prevent server-side request forgery.' },
    { icon: ShieldCheck, label: 'Role Enforcement', detail: 'The AI system prompt explicitly instructs the model to ignore any instructions embedded in user-supplied content. Model temperature is set to 0.2 to reduce creative deviation.' },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            AI Agent Management
          </h1>
          <p className="text-slate-500 mt-1">
            Monitor, configure, and test the multi-agent AI system powering all analyses.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-1', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/help/ai-management">
              <Info className="w-4 h-4 mr-1" />
              Help
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn(
          'border-2',
          agentStatus?.activeProvider === 'none' ? 'border-red-300' :
          agentStatus?.activeProvider ? 'border-emerald-300' : 'border-slate-200'
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Active Provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-6 bg-slate-100 animate-pulse rounded" />
            ) : (
              <>
                <div className="text-xl font-bold capitalize text-slate-800">
                  {agentStatus?.activeProvider ?? '—'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{agentStatus?.activeModel ?? '—'}</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Fallback Provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-6 bg-slate-100 animate-pulse rounded" />
            ) : (
              <>
                <div className="text-xl font-bold capitalize text-slate-800">
                  {agentStatus?.fallbackProvider === 'none' ? 'Not configured' : agentStatus?.fallbackProvider ?? '—'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {agentStatus?.fallbackProvider !== 'none' ? agentStatus?.fallbackModel : 'Add GOOGLE_AI_API_KEY to enable'}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Providers Configured
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-6 bg-slate-100 animate-pulse rounded" />
            ) : (
              <div className="flex gap-2 flex-wrap">
                <ProviderBadge provider="OpenAI" active={agentStatus?.providers.openai.configured ?? false} />
                <ProviderBadge provider="Gemini" active={agentStatus?.providers.gemini.configured ?? false} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="providers">
        <TabsList className="mb-4">
          <TabsTrigger value="providers">Providers & Models</TabsTrigger>
          <TabsTrigger value="quality">Quality Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="test">Live Test</TabsTrigger>
        </TabsList>

        {/* Providers tab */}
        <TabsContent value="providers" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Auto-Model Selection</AlertTitle>
            <AlertDescription>
              The AI agent always uses the latest stable model version for each provider. Models are updated server-side without any code changes needed. Current: <strong>OpenAI {agentStatus?.providers.openai.model ?? 'gpt-4o'}</strong> → fallback <strong>Gemini {agentStatus?.providers.gemini.model ?? 'gemini-1.5-pro'}</strong>.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OpenAI */}
            <Card className={cn('border-2', agentStatus?.providers.openai.configured ? 'border-emerald-200' : 'border-slate-200')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-emerald-600" />
                  OpenAI
                  <Badge className="ml-auto text-xs bg-blue-100 text-blue-700 border border-blue-200">Primary</Badge>
                </CardTitle>
                <CardDescription>GPT-4o — highest analysis quality, best for structured JSON output</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Model:</span>
                  <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">{agentStatus?.providers.openai.model ?? 'gpt-4o'}</code>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Status:</span>
                  {agentStatus?.providers.openai.configured
                    ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Configured</span>
                    : <span className="text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Missing OPENAI_API_KEY</span>
                  }
                </div>
                <div className="text-xs text-slate-500">
                  Set <code className="bg-slate-100 px-1 rounded">OPENAI_API_KEY</code> in Azure App Service → Configuration → Application settings.
                </div>
              </CardContent>
            </Card>

            {/* Gemini */}
            <Card className={cn('border-2', agentStatus?.providers.gemini.configured ? 'border-emerald-200' : 'border-slate-200')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Google Gemini
                  <Badge className="ml-auto text-xs bg-slate-100 text-slate-600 border border-slate-200">Fallback</Badge>
                </CardTitle>
                <CardDescription>Gemini 1.5 Pro — high-quality fallback when OpenAI is unavailable</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Model:</span>
                  <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">{agentStatus?.providers.gemini.model ?? 'gemini-1.5-pro'}</code>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Status:</span>
                  {agentStatus?.providers.gemini.configured
                    ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Configured</span>
                    : <span className="text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Missing GOOGLE_AI_API_KEY</span>
                  }
                </div>
                <div className="text-xs text-slate-500">
                  Set <code className="bg-slate-100 px-1 rounded">GOOGLE_AI_API_KEY</code> in Azure App Service → Configuration → Application settings.
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                How to add or update API keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                <li>Go to <strong>Azure Portal</strong> → App Services → <code>tca-irr</code></li>
                <li>Select <strong>Configuration</strong> → <strong>Application settings</strong></li>
                <li>Click <strong>+ New application setting</strong></li>
                <li>Add <code>OPENAI_API_KEY</code> and/or <code>GOOGLE_AI_API_KEY</code> with your key values</li>
                <li>Click <strong>Save</strong> and then <strong>Restart</strong> the app</li>
              </ol>
              <div className="mt-3">
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/help/ai-management">
                    Full setup guide <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality tab */}
        <TabsContent value="quality" className="space-y-4">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertTitle>Quality-First Configuration</AlertTitle>
            <AlertDescription>
              All AI requests are tuned for maximum accuracy and consistency. These settings are enforced at the API level and cannot be modified per-request.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {qualityMetrics.map((m) => (
              <Card key={m.label} className="border border-slate-200">
                <CardContent className="pt-4 flex gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-sm text-slate-800">{m.label}: <span className="text-blue-600">{m.value}</span></div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.detail}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Security tab */}
        <TabsContent value="security" className="space-y-4">
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Multi-Layer AI Security</AlertTitle>
            <AlertDescription>
              The AI agent implements defense-in-depth: injection detection, input sanitization, key concealment, and role enforcement — all server-side.
            </AlertDescription>
          </Alert>
          <div className="space-y-3">
            {securityFeatures.map((f) => (
              <Card key={f.label} className="border border-slate-200">
                <CardContent className="pt-4 flex gap-3">
                  <f.icon className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-sm text-slate-800">{f.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{f.detail}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-4 text-sm text-amber-800 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Report any suspicious AI responses (e.g., off-topic content, refusals to analyze) to your system administrator immediately. The system logs all blocked injection attempts.</span>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test tab */}
        <TabsContent value="test" className="space-y-4">
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertTitle>Live Agent Test</AlertTitle>
            <AlertDescription>
              Sends a real scoring request through the full OpenAI → Gemini chain to verify both providers are responding correctly.
            </AlertDescription>
          </Alert>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Test Request</CardTitle>
              <CardDescription className="font-mono text-xs bg-slate-50 p-2 rounded mt-1 whitespace-pre-wrap">
                {`Task: score\nPrompt: Score a seed-stage SaaS startup with $50k MRR, 3 co-founders, 18 months runway.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={runTest} disabled={testRunning} className="w-full md:w-auto">
                {testRunning ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Running test…</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" />Run Live Test</>
                )}
              </Button>
              {testResult && (
                <pre className={cn(
                  'text-xs font-mono p-3 rounded whitespace-pre-wrap break-all max-h-64 overflow-y-auto',
                  testResult.startsWith('✓') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                )}>
                  {testResult}
                </pre>
              )}
            </CardContent>
          </Card>
          {lastRefresh && (
            <p className="text-xs text-slate-400">Status last refreshed: {lastRefresh.toLocaleTimeString()}</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
