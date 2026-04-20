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
import { ArrowLeft, RotateCcw, Save, History, RefreshCw, Leaf } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  saveConfigVersion,
  getLatestConfig,
  getVersionHistory,
  clearConfigVersions,
  type ConfigVersion,
} from '@/lib/module-config-service';

const MODULE_KEY = 'environmental';

interface EnvironmentalConfig {
  isActive: boolean;
  greenThreshold: number;
  yellowThreshold: number;
  weights: {
    impact: number;
    climate_risk: number;
    certification: number;
    esg_alignment: number;
  };
}

const DEFAULTS: EnvironmentalConfig = {
  isActive: true,
  greenThreshold: 8.0,
  yellowThreshold: 5.5,
  weights: {
    impact: 0.30,
    climate_risk: 0.25,
    certification: 0.15,
    esg_alignment: 0.30,
  },
};

const DIMENSION_LABELS: Record<keyof EnvironmentalConfig['weights'], string> = {
  impact: 'Environmental Impact',
  climate_risk: 'Climate Risk',
  certification: 'Certification',
  esg_alignment: 'ESG Alignment',
};

const DIMENSION_DESCRIPTIONS: Record<keyof EnvironmentalConfig['weights'], string> = {
  impact: 'Measurable direct environmental footprint: carbon emissions, waste, and resource efficiency.',
  climate_risk: 'Exposure to physical and transition climate risks that could affect operations or revenue.',
  certification: 'Validated sustainability credentials: ISO 14001, B Corp, GreenStar, and equivalents.',
  esg_alignment: 'Consistency with ESG reporting frameworks such as GRI, SASB, TCFD, and UN SDGs.',
};

export default function EnvironmentalAnalysisConfigPage() {
  const [isActive, setIsActive] = useState(DEFAULTS.isActive);
  const [greenThreshold, setGreenThreshold] = useState(DEFAULTS.greenThreshold);
  const [yellowThreshold, setYellowThreshold] = useState(DEFAULTS.yellowThreshold);
  const [weights, setWeights] = useState({ ...DEFAULTS.weights });
  const [versionHistory, setVersionHistory] = useState<ConfigVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const saved = getLatestConfig<EnvironmentalConfig>(MODULE_KEY);
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

  const handleWeightChange = (key: keyof EnvironmentalConfig['weights'], value: number) => {
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
    toast({ title: 'Defaults Restored', description: 'Environmental Analysis configuration reset to defaults.' });
  };

  const handleSaveConfig = () => {
    const config: EnvironmentalConfig = { isActive, greenThreshold, yellowThreshold, weights };
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
    const cfg = v.config as EnvironmentalConfig;
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
              <Leaf className="size-10" />
              Environmental Analysis Configuration
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
              Configure sub-dimension weights and thresholds for the Environmental Analysis module.
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
              {(Object.keys(weights) as Array<keyof EnvironmentalConfig['weights']>).map(key => (
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
                environmental_score = impact × w₁ + climate_risk × w₂ + certification × w₃ + esg_alignment × w₄
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-1">
                {(Object.keys(weights) as Array<keyof EnvironmentalConfig['weights']>).map(key => (
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
                <Label htmlFor="env-active">Enable Module</Label>
                <Switch id="env-active" checked={isActive} onCheckedChange={setIsActive} />
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
                <span><strong>Green</strong> — Score ≥ {greenThreshold}: Strong environmental profile.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-yellow-500 shrink-0" />
                <span><strong>Yellow</strong> — Score ≥ {yellowThreshold}: Moderate environmental risk.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500 shrink-0" />
                <span><strong>Red</strong> — Score &lt; {yellowThreshold}: Significant ESG concerns.</span>
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
