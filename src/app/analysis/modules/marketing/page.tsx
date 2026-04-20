'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, RotateCcw, Save, History, RefreshCw, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  saveConfigVersion,
  getLatestConfig,
  getVersionHistory,
  clearConfigVersions,
  type ConfigVersion,
} from '@/lib/module-config-service';

const MODULE_KEY = 'marketing';

interface MarketingConfig {
  isActive: boolean;
  greenThreshold: number;
  yellowThreshold: number;
  weights: {
    positioning: number;
    digital_presence: number;
    spend_efficiency: number;
    gtm_execution: number;
  };
}

const DEFAULTS: MarketingConfig = {
  isActive: true,
  greenThreshold: 8.0,
  yellowThreshold: 5.5,
  weights: {
    positioning: 0.25,
    digital_presence: 0.20,
    spend_efficiency: 0.30,
    gtm_execution: 0.25,
  },
};

const DIMENSION_LABELS: Record<keyof MarketingConfig['weights'], string> = {
  positioning: 'Positioning',
  digital_presence: 'Digital Presence',
  spend_efficiency: 'Spend Efficiency',
  gtm_execution: 'GTM Execution',
};

const DIMENSION_DESCRIPTIONS: Record<keyof MarketingConfig['weights'], string> = {
  positioning: 'Clarity and differentiation of value proposition versus competitors.',
  digital_presence: 'Quality of online presence, SEO, social channels, and brand authority.',
  spend_efficiency: 'Return on marketing investment; CAC trends and channel attribution.',
  gtm_execution: 'Effectiveness of go-to-market strategy: sales velocity, pipeline health, retention.',
};

export default function MarketingAnalysisConfigPage() {
  const [isActive, setIsActive] = useState(DEFAULTS.isActive);
  const [greenThreshold, setGreenThreshold] = useState(DEFAULTS.greenThreshold);
  const [yellowThreshold, setYellowThreshold] = useState(DEFAULTS.yellowThreshold);
  const [weights, setWeights] = useState({ ...DEFAULTS.weights });
  const [versionHistory, setVersionHistory] = useState<ConfigVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const saved = getLatestConfig<MarketingConfig>(MODULE_KEY);
    if (saved) {
      if (saved.isActive !== undefined) setIsActive(saved.isActive);
      if (saved.greenThreshold !== undefined) setGreenThreshold(saved.greenThreshold);
      if (saved.yellowThreshold !== undefined) setYellowThreshold(saved.yellowThreshold);
      if (saved.weights) setWeights({ ...DEFAULTS.weights, ...saved.weights });
    }
    const history = getVersionHistory(MODULE_KEY);
    setVersionHistory(history);
    if (history.length > 0) setCurrentVersion(history[0].version);
  }, []);

  const weightTotal = Object.values(weights).reduce((s, v) => s + v, 0);

  const handleWeightChange = (key: keyof MarketingConfig['weights'], value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setIsActive(DEFAULTS.isActive);
    setGreenThreshold(DEFAULTS.greenThreshold);
    setYellowThreshold(DEFAULTS.yellowThreshold);
    setWeights({ ...DEFAULTS.weights });
    clearConfigVersions(MODULE_KEY);
    setVersionHistory([]);
    setCurrentVersion(null);
    toast({ title: 'Defaults Restored', description: 'Marketing Analysis configuration reset to defaults.' });
  };

  const handleSaveConfig = () => {
    const config: MarketingConfig = { isActive, greenThreshold, yellowThreshold, weights };
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('loggedInUser') : null;
    const userEmail = storedUser ? JSON.parse(storedUser).email : undefined;
    const ver = saveConfigVersion(MODULE_KEY, config, {
      label: `v${versionHistory.length + 1} - Manual Save`,
      savedBy: userEmail,
    });
    const history = getVersionHistory(MODULE_KEY);
    setVersionHistory(history);
    setCurrentVersion(ver);
    toast({ title: 'Configuration Saved', description: `Version ${ver} saved successfully.` });
  };

  const handleLoadVersion = (v: ConfigVersion) => {
    const cfg = v.config as MarketingConfig;
    if (cfg.isActive !== undefined) setIsActive(cfg.isActive);
    if (cfg.greenThreshold !== undefined) setGreenThreshold(cfg.greenThreshold);
    if (cfg.yellowThreshold !== undefined) setYellowThreshold(cfg.yellowThreshold);
    if (cfg.weights) setWeights({ ...DEFAULTS.weights, ...cfg.weights });
    setCurrentVersion(v.version);
    toast({ title: `Version ${v.version} Loaded`, description: v.label });
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Link
          href="/dashboard/evaluation"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to Analysis Setup
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight flex items-center gap-3">
              <Megaphone className="size-10" />
              Marketing Analysis Configuration
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
              Configure sub-dimension weights and thresholds for the Marketing Analysis module.
            </p>
          </div>
          <Button variant="ghost" onClick={handleReset}>
            <RotateCcw className="mr-2 size-4" /> Reset All
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sub-Dimension Weights</CardTitle>
              <CardDescription>
                Weights must sum to 1.0. Current total:{' '}
                <span className={Math.abs(weightTotal - 1) > 0.01 ? 'text-destructive font-bold' : 'text-success font-bold'}>
                  {weightTotal.toFixed(2)}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(Object.keys(weights) as Array<keyof MarketingConfig['weights']>).map(key => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-medium">{DIMENSION_LABELS[key]}</Label>
                    <span className="text-sm font-mono text-primary">{(weights[key] * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{DIMENSION_DESCRIPTIONS[key]}</p>
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={[weights[key]]}
                    onValueChange={([v]) => handleWeightChange(key, v)}
                    className="w-full"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scoring Formula</CardTitle>
              <CardDescription>
                marketing_score = positioning × w₁ + digital_presence × w₂ + spend_efficiency × w₃ + gtm_execution × w₄
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-1">
                {(Object.keys(weights) as Array<keyof MarketingConfig['weights']>).map(key => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="text-primary">× {weights[key].toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                  <span>Total weight</span>
                  <span className={Math.abs(weightTotal - 1) > 0.01 ? 'text-destructive' : 'text-success'}>
                    {weightTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <Label htmlFor="mkt-active">Enable Module</Label>
                <Switch id="mkt-active" checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <div className="space-y-2">
                <Label>Green Signal Threshold (≥)</Label>
                <div className="flex items-center gap-2">
                  <Slider min={0} max={10} step={0.5} value={[greenThreshold]} onValueChange={([v]) => setGreenThreshold(v)} className="flex-1" />
                  <span className="text-sm font-mono w-8 text-right">{greenThreshold}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Yellow Signal Threshold (≥)</Label>
                <div className="flex items-center gap-2">
                  <Slider min={0} max={10} step={0.5} value={[yellowThreshold]} onValueChange={([v]) => setYellowThreshold(v)} className="flex-1" />
                  <span className="text-sm font-mono w-8 text-right">{yellowThreshold}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Signal Definitions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500 shrink-0" />
                <span><strong>Green</strong> — Score ≥ {greenThreshold}: Effective marketing execution.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-yellow-500 shrink-0" />
                <span><strong>Yellow</strong> — Score ≥ {yellowThreshold}: Room for marketing improvement.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500 shrink-0" />
                <span><strong>Red</strong> — Score &lt; {yellowThreshold}: Marketing gaps need addressing.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 border-t pt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={handleSaveConfig} className="gap-2">
              <Save className="size-4" /> Save Configuration
            </Button>
            <Button variant="outline" onClick={() => setShowHistory(h => !h)} className="gap-2">
              <History className="size-4" /> {showHistory ? 'Hide' : 'Show'} History
            </Button>
          </div>
          {currentVersion !== null && (
            <span className="text-sm text-muted-foreground">Active: v{currentVersion}</span>
          )}
        </div>
        {showHistory && versionHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Version History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {versionHistory.map(v => (
                <div key={v.version} className="flex items-center justify-between p-2 rounded border hover:bg-muted/50">
                  <div>
                    <span className="font-mono text-sm text-primary">v{v.version}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{v.label}</span>
                    {v.savedBy && <span className="ml-2 text-xs text-muted-foreground">by {v.savedBy}</span>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleLoadVersion(v)} className="gap-1">
                    <RefreshCw className="size-3" /> Load
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {showHistory && versionHistory.length === 0 && (
          <p className="text-sm text-muted-foreground">No saved versions yet.</p>
        )}
      </div>
    </div>
  );
}
