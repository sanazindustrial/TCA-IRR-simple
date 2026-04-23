
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BrainCircuit,
  RefreshCw,
  TrendingUp,
  Target,
  ShieldCheck,
  Database,
  Activity,
  BarChart,
  Lightbulb,
  Users,
  Timer,
  Check,
  FileDiff,
  Copy,
  Clock,
  Zap,
  Shield,
  DollarSign,
  Gauge,
  UserCheck,
  FileOutput,
  GitBranch,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TrainModelDialog } from '@/components/dashboard/ai-training/train-model-dialog';
import { useToast } from '@/hooks/use-toast';
import PerformancePage from './performance/page';
import DataQualityPage from './data-quality/page';
import BiasFairnessPage from './bias-fairness/page';
import { TimeSeriesPanel } from '@/components/ml/TimeSeriesPanel';
import { MLDashboard } from '@/components/ml/MLDashboard';

const MetricCard = ({ title, value, target, unit, icon: Icon }: { title: string, value: string, target: string, unit?: string, icon: React.ElementType}) => {
    const valueWithUnit = `${value}${unit || ''}`;
    return (
        <Card className="flex-1 min-w-[200px] bg-muted/20">
            <CardHeader className="p-4 pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className='text-3xl font-bold'>{valueWithUnit}</div>
                <p className='text-xs text-muted-foreground'>Target: {target}</p>
            </CardContent>
        </Card>
    )
};


export default function AiTrainingPage() {
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [moduleStatuses, setModuleStatuses] = useState<Record<string, boolean>>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';

  const fetchModuleStatuses = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const res = await fetch(`${API_BASE}/api/v1/tca/system-status`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Backend returns e.g. { modules: { tca: true, irr: true, ssd: false, ... } }
      if (data.modules && typeof data.modules === 'object') {
        setModuleStatuses(data.modules);
      } else if (data.status) {
        // Flat status object
        setModuleStatuses(data);
      }
      setLastUpdated(new Date().toLocaleString());
    } catch {
      // Silently keep previous statuses; do not crash the page
    }
  };

  useEffect(() => {
    fetchModuleStatuses();
    const interval = setInterval(fetchModuleStatuses, 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    fetchModuleStatuses();
    toast({
      title: 'Refreshing Data',
      description: 'The AI performance metrics are being updated.',
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <BrainCircuit className="text-primary" />
            AI/ML Quality Engineer Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor AI performance, data quality, and operational health.
            {lastUpdated && <span className="ml-2 text-xs">Last updated: {lastUpdated}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh}><RefreshCw className="mr-2"/> Refresh</Button>
            <TrainModelDialog />
        </div>
      </header>
       
       <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview"><BrainCircuit className="mr-2"/> Quality Overview</TabsTrigger>
          <TabsTrigger value="performance"><BarChart className="mr-2"/> Performance Deep Dive</TabsTrigger>
          <TabsTrigger value="data-quality"><Check className="mr-2"/> Data Quality</TabsTrigger>
          <TabsTrigger value="bias-fairness"><Users className="mr-2"/> Bias &amp; Fairness</TabsTrigger>
          <TabsTrigger value="time-series"><Activity className="mr-2"/> Time-Series Engine</TabsTrigger>
          <TabsTrigger value="ml-scoring"><Target className="mr-2"/> Score Prediction</TabsTrigger>
          <TabsTrigger value="ml-risk"><ShieldCheck className="mr-2"/> Risk Detection</TabsTrigger>
          <TabsTrigger value="ml-growth"><TrendingUp className="mr-2"/> Growth Classifier</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {Object.keys(moduleStatuses).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Live Module Availability</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {Object.entries(moduleStatuses).map(([name, active]) => (
                  <Badge key={name} variant={active ? 'success' : 'destructive'} className="capitalize">
                    {name.replace(/_/g, ' ')}: {active ? 'Active' : 'Offline'}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Target/> ML Screening Quality</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <MetricCard title="Macro-F1 (primary)" value="0.84" target="≥0.82" icon={TrendingUp}/>
                        <MetricCard title="ROC-AUC (macro)" value="0.91" target="≥0.88" icon={BarChart}/>
                        <MetricCard title="PR-AUC (Advanced)" value="0.75" target="≥0.70" icon={BarChart}/>
                        <MetricCard title="Calibration (ECE)" value="0.04" target="≤0.06" icon={Gauge}/>
                        <MetricCard title="Confusion Costs" value="$1.2k" target="<$2k" icon={DollarSign}/>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserCheck/> Human-in-the-Loop Agreement</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <MetricCard title="Analyst Agreement (κ)" value="0.71" target="≥0.65" icon={Users}/>
                        <MetricCard title="Override Rate" value="18" target="≤20%" unit="%" icon={FileOutput}/>
                        <MetricCard title="Time-to-Approve" value="18" target="≤24h" unit="h" icon={Clock}/>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><GitBranch/> NLP Pipeline Health</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <MetricCard title="Extraction Coverage" value="97.2" target="≥95%" unit="%" icon={FileDiff}/>
                        <MetricCard title="Section Recall" value="0.94" target="≥0.9" icon={FileDiff}/>
                        <MetricCard title="Embed Freshness" value="100" target="100%" unit="%" icon={RefreshCw}/>
                        <MetricCard title="Duplicate Deck Rate" value="1.8" target="≤2%" unit="%" icon={Copy}/>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Database/> Data Quality & Drift</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <MetricCard title="Schema Drift" value="0" target="0%" unit="%" icon={FileDiff}/>
                        <MetricCard title="Feature Drift (PSI)" value="0.15" target="≤0.2" icon={TrendingUp}/>
                        <MetricCard title="Label Delay" value="11" target="≤14d" unit="d" icon={Clock}/>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Zap/> Latency & Throughput (SLOs)</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <MetricCard title="API P95 Latency" value="6.8" target="≤8s" unit="s" icon={Timer}/>
                        <MetricCard title="Batch P95 Latency" value="39" target="≤45s/file" unit="s" icon={Timer}/>
                        <MetricCard title="Throughput" value="135" target="≥120/h" unit="/h" icon={Activity}/>
                        <MetricCard title="Availability (30d)" value="99.8" target="≥99.5%" unit="%" icon={Check}/>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><DollarSign/> Cost & Efficiency</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <MetricCard title="Cost / Report" value="$0.38" target="<$0.45" icon={DollarSign}/>
                        <MetricCard title="Analyst Mins Saved" value="35" target="≥30%" unit="%" icon={Clock}/>
                        <MetricCard title="Retrain Cost / ΔF1" value="$480" target="<$1k" icon={DollarSign}/>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Shield/> Safety & Governance</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <MetricCard title="PII Leakage Rate" value="0" target="0%" unit="%" icon={ShieldCheck}/>
                        <MetricCard title="Explainability Coverage" value="100" target="100%" unit="%" icon={FileDiff}/>
                        <MetricCard title="Audit Log Completeness" value="100" target="100%" unit="%" icon={Check}/>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Lightbulb/> Business Outcomes</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <MetricCard title="Prescreen → Advanced Lift" value="18" target="+15-25%" unit="%" icon={TrendingUp}/>
                        <MetricCard title="Win-Rate Uplift" value="12" target="+10%" unit="%" icon={TrendingUp}/>
                        <MetricCard title="Cycle Time Reduction" value="45" target="−40%" unit="%" icon={Timer}/>
                    </CardContent>
                </Card>
        </TabsContent>

        <TabsContent value="performance">
          <PerformancePage />
        </TabsContent>
        <TabsContent value="data-quality">
           <DataQualityPage />
        </TabsContent>
         <TabsContent value="bias-fairness">
          <BiasFairnessPage />
        </TabsContent>

        {/* ── Machine Learning tabs ── */}
        <TabsContent value="time-series" className="space-y-4">
          <div className="mb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Activity className="text-primary"/> Time-Series Forecasting Engine</h2>
            <p className="text-sm text-muted-foreground">ARIMA, XGBoost, LSTM ensemble forecasting. Enter comma-separated values and click Forecast.</p>
          </div>
          <TimeSeriesPanel
            backendUrl={API_BASE}
            authToken={typeof window !== 'undefined' ? (localStorage.getItem('authToken') ?? undefined) : undefined}
          />
        </TabsContent>

        <TabsContent value="ml-scoring" className="space-y-4">
          <div className="mb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Target className="text-primary"/> ML Score Prediction</h2>
            <p className="text-sm text-muted-foreground">12-category ML scoring blended with rule-based scores. Activates auto-learning after 50 training samples.</p>
          </div>
          <MLDashboard
            backendUrl={API_BASE}
            authToken={typeof window !== 'undefined' ? (localStorage.getItem('authToken') ?? undefined) : undefined}
          />
        </TabsContent>

        <TabsContent value="ml-risk" className="space-y-4">
          <div className="mb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2"><ShieldCheck className="text-primary"/> Risk Detection</h2>
            <p className="text-sm text-muted-foreground">14-flag risk classifier detecting financial, market, and team risk signals.</p>
          </div>
          <MLDashboard
            backendUrl={API_BASE}
            authToken={typeof window !== 'undefined' ? (localStorage.getItem('authToken') ?? undefined) : undefined}
          />
        </TabsContent>

        <TabsContent value="ml-growth" className="space-y-4">
          <div className="mb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="text-primary"/> Growth Classifier</h2>
            <p className="text-sm text-muted-foreground">Growth tier prediction (High/Moderate/Low) with Bear/Base/Bull 3-year revenue scenarios.</p>
          </div>
          <MLDashboard
            backendUrl={API_BASE}
            authToken={typeof window !== 'undefined' ? (localStorage.getItem('authToken') ?? undefined) : undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}


