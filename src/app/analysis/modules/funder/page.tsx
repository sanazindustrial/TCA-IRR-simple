
'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calculator, Edit, RotateCcw, Save, History, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { saveConfigVersion, getLatestConfig, getVersionHistory, clearConfigVersions, type ConfigVersion } from '@/lib/module-config-service';

interface WeightDimensions {
  stage: number;
  check: number;
  sector: number;
  geo: number;
  thesis: number;
}

interface Weights {
  tech: WeightDimensions;
  med_life: WeightDimensions;
}

const initialWeights: Weights = {
  tech: { stage: 0.30, check: 0.20, sector: 0.25, geo: 0.15, thesis: 0.10 },
  med_life: { stage: 0.25, check: 0.25, sector: 0.30, geo: 0.10, thesis: 0.10 },
};

const toSnakeCase = (str: string) => str.toLowerCase().replace(/\s/g, '_');

const generateJsonConfig = (state: any) => {
  return {
    funder_fit: {
      active: state.isActive,
      score_weight: 0.0,
      fit_thresholds: { strong: state.thresholds.strong, moderate: state.thresholds.moderate },
      weights: {
        tech: state.weights.tech,
        med_life: state.weights.med_life
      },
      output_influence: {
        affects_score: false,
        affects_routing: state.affectsRouting,
        affects_recommendation_language: state.affectsLanguage,
      }
    }
  };
};

export default function FunderFitConfigPage() {
  const [isActive, setIsActive] = useState(true);
  const [thresholds, setThresholds] = useState({ strong: 75, moderate: 50 });
  const [weights, setWeights] = useState(initialWeights);
  const [affectsRouting, setAffectsRouting] = useState(true);
  const [affectsLanguage, setAffectsLanguage] = useState(true);
  const [formula, setFormula] = useState('Score = Σ (Dimension Weight × Fit Score)');
  const [formulaExample, setFormulaExample] = useState('e.g. 0.30×85 + 0.20×70 + 0.25×90 + 0.15×75 + 0.10×80 = 81.75 → Strong Fit (≥75)');
  const [versionHistory, setVersionHistory] = useState<ConfigVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const saved = getLatestConfig<typeof initialWeights & { isActive: boolean; thresholds: { strong: number; moderate: number }; affectsRouting: boolean; affectsLanguage: boolean }>('funder');
    if (saved) {
      if (saved.isActive !== undefined) setIsActive(saved.isActive);
      if (saved.thresholds) setThresholds(saved.thresholds);
      if (saved.tech && saved.med_life) setWeights({ tech: saved.tech, med_life: saved.med_life });
      if (saved.affectsRouting !== undefined) setAffectsRouting(saved.affectsRouting);
      if (saved.affectsLanguage !== undefined) setAffectsLanguage(saved.affectsLanguage);
    }
    const history = getVersionHistory('funder');
    setVersionHistory(history);
    if (history.length > 0) setCurrentVersion(history[history.length - 1].version);
  }, []);

  const handleWeightChange = (sector: 'tech' | 'med_life', dimension: keyof WeightDimensions, value: string) => {
    const newWeights = { ...weights };
    newWeights[sector][dimension] = parseFloat(value) || 0;
    setWeights(newWeights);
  };

  const currentJsonConfig = generateJsonConfig({
    isActive,
    thresholds,
    weights,
    affectsRouting,
    affectsLanguage
  });

  const handleReset = () => {
    setIsActive(true);
    setThresholds({ strong: 75, moderate: 50 });
    setWeights(initialWeights);
    setAffectsRouting(true);
    setAffectsLanguage(true);
    clearConfigVersions('funder');
    setVersionHistory([]);
    setCurrentVersion(null);
    toast({ title: 'Defaults Restored', description: 'Funder Fit configuration reset to defaults.' });
  };

  const handleSaveConfig = () => {
    const config = { isActive, thresholds, ...weights, affectsRouting, affectsLanguage };
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('loggedInUser') : null;
    const userEmail = storedUser ? JSON.parse(storedUser).email : undefined;
    const ver = saveConfigVersion('funder', config, { label: `v${(versionHistory.length + 1)} - Manual Save`, savedBy: userEmail });
    const history = getVersionHistory('funder');
    setVersionHistory(history);
    setCurrentVersion(ver);
    toast({ title: 'Configuration Saved', description: `Version ${ver} saved successfully.` });
  };

  const handleLoadVersion = (v: ConfigVersion) => {
    const cfg = v.config as any;
    if (cfg.isActive !== undefined) setIsActive(cfg.isActive);
    if (cfg.thresholds) setThresholds(cfg.thresholds);
    if (cfg.tech && cfg.med_life) setWeights({ tech: cfg.tech, med_life: cfg.med_life });
    if (cfg.affectsRouting !== undefined) setAffectsRouting(cfg.affectsRouting);
    if (cfg.affectsLanguage !== undefined) setAffectsLanguage(cfg.affectsLanguage);
    setCurrentVersion(v.version);
    toast({ title: `Version ${v.version} Loaded`, description: v.label });
  };

  const weightDimensions = Object.keys(weights.tech) as (keyof WeightDimensions)[];

  const handleNormalize = (sector: 'tech' | 'med_life') => {
    const currentWeights = weights[sector];
    const total = Object.values(currentWeights).reduce((a, b) => a + b, 0);
    if (total === 0) return;

    const normalizedSectorWeights = { ...currentWeights };
    for (const key in currentWeights) {
      normalizedSectorWeights[key as keyof WeightDimensions] = currentWeights[key as keyof WeightDimensions] / total;
    }

    setWeights(prev => ({
      ...prev,
      [sector]: normalizedSectorWeights
    }));
  };

  const techTotal = Object.values(weights.tech).reduce((a, b) => a + b, 0);
  const medTotal = Object.values(weights.med_life).reduce((a, b) => a + b, 0);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Link
          href="/dashboard/evaluation/modules"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to Analysis Setup
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
              Funder Fit Analysis Configuration
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
              Customize investor matching criteria, weights, and output behavior.
            </p>
          </div>
          <Button variant="ghost" onClick={handleReset}><RotateCcw className="mr-2" /> Reset All</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Sector Weight Matrix</CardTitle>
              <CardDescription>Adjust the importance of each fit dimension for different sectors. Columns should sum to 1.0.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dimension</TableHead>
                    <TableHead className="text-center">Tech Weight</TableHead>
                    <TableHead className="text-center">Med/Life Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weightDimensions.map(dim => {
                    return (
                      <TableRow key={dim}>
                        <TableCell className="font-medium capitalize">{dim.replace('_', ' ')} Fit</TableCell>
                        <TableCell>
                          <Input type="number" value={weights.tech[dim]} onChange={e => handleWeightChange('tech', dim, e.target.value)} className="h-8 w-24 text-center mx-auto" step="0.01" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={weights.med_life[dim]} onChange={e => handleWeightChange('med_life', dim, e.target.value)} className="h-8 w-24 text-center mx-auto" step="0.01" />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className={`text-center ${techTotal.toFixed(2) !== '1.00' ? 'text-destructive' : 'text-success'}`}>
                      <div className="flex items-center justify-center gap-2">
                        <span>{techTotal.toFixed(2)}</span>
                        <Button size="sm" variant="ghost" onClick={() => handleNormalize('tech')} disabled={techTotal.toFixed(2) === '1.00'}>Normalize</Button>
                      </div>
                    </TableCell>
                    <TableCell className={`text-center ${medTotal.toFixed(2) !== '1.00' ? 'text-destructive' : 'text-success'}`}>
                      <div className="flex items-center justify-center gap-2">
                        <span>{medTotal.toFixed(2)}</span>
                        <Button size="sm" variant="ghost" onClick={() => handleNormalize('med_life')} disabled={medTotal.toFixed(2) === '1.00'}>Normalize</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Narrative Influence</CardTitle>
              <CardDescription>Define how the fit analysis outcome modifies the final recommendation text.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Strong Fit Language</Label>
                <Textarea defaultValue='“Investor aligned — pathway to funding likely”' />
              </div>
              <div className='space-y-2'>
                <Label>Moderate Fit Language</Label>
                <Textarea defaultValue='“Funding possible — address alignment gaps”' />
              </div>
              <div className='space-y-2'>
                <Label>Weak Fit Language</Label>
                <Textarea defaultValue='“Low alignment — reconsider investor profile”' />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="active-module">Enable Module</Label>
                <Switch id="active-module" checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <div className="space-y-2">
                <Label>Fit Thresholds</Label>
                <div className="flex items-center gap-2">
                  <Label className="text-success w-20">Strong ≥</Label>
                  <Input type="number" value={thresholds.strong} onChange={e => setThresholds({ ...thresholds, strong: parseInt(e.target.value) })} className="h-8" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-warning w-20">Moderate ≥</Label>
                  <Input type="number" value={thresholds.moderate} onChange={e => setThresholds({ ...thresholds, moderate: parseInt(e.target.value) })} className="h-8" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Output Influence</Label>
                <div className="flex items-center justify-between">
                  <Label htmlFor="affects-routing" className='font-normal'>Affects Routing</Label>
                  <Switch id="affects-routing" checked={affectsRouting} onCheckedChange={setAffectsRouting} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="affects-language" className='font-normal'>Affects Language</Label>
                  <Switch id="affects-language" checked={affectsLanguage} onCheckedChange={setAffectsLanguage} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calculator className="size-4" /> Score Calculation</CardTitle>
              <CardDescription>Formula used by the backend for investor matching.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Weighted Score Formula (0–100)</Label>
                <Input
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  className="text-xs bg-muted/50 p-2 rounded-md font-mono mt-1 h-auto"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Example (Tech sector defaults)</Label>
                <Input
                  value={formulaExample}
                  onChange={(e) => setFormulaExample(e.target.value)}
                  className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md font-mono mt-1 h-auto"
                />
              </div>
              <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
                <p className="font-medium">Thresholds (0–100 scale)</p>
                <p>Strong Fit: ≥ {thresholds.strong}</p>
                <p>Moderate Fit: ≥ {thresholds.moderate}</p>
                <p>Weak Fit: &lt; {thresholds.moderate}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>JSON Configuration</CardTitle>
              <CardDescription>Current configuration for backend use.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea readOnly value={JSON.stringify(currentJsonConfig, null, 2)} rows={16} className='font-mono text-xs bg-muted/50' />
            </CardContent>
          </Card>
        </div>
      </div>
      <Card className="mt-8">
        <CardFooter className="p-4 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset}><RotateCcw className="mr-2 size-4" /> Restore Defaults</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(h => !h)}>
              <History className="mr-2 size-4" /> History {versionHistory.length > 0 && `(${versionHistory.length})`}
            </Button>
            {currentVersion && <span className="text-xs text-muted-foreground">Active: v{currentVersion}</span>}
          </div>
          <Button onClick={handleSaveConfig}><Save className="mr-2 size-4" /> Save Configuration</Button>
        </CardFooter>
        {showHistory && versionHistory.length > 0 && (
          <div className="px-4 pb-4 border-t space-y-2 pt-4">
            <h4 className="text-sm font-semibold">Version History</h4>
            {[...versionHistory].reverse().map(v => (
              <div key={v.version} className="flex items-center justify-between text-sm p-2 bg-muted/40 rounded">
                <span>v{v.version} — {v.label} <span className="text-xs text-muted-foreground">({new Date(v.timestamp).toLocaleString()})</span></span>
                <Button size="sm" variant="ghost" onClick={() => handleLoadVersion(v)}><RefreshCw className="size-3 mr-1" /> Load</Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
