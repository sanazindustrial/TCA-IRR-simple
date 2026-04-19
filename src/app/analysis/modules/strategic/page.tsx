
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calculator, RotateCcw, Save, History, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { saveConfigVersion, getLatestConfig, getVersionHistory, clearConfigVersions, type ConfigVersion } from '@/lib/module-config-service';

const initialPathways = [
  'Build',
  'Buy',
  'Partner',
  'Platform',
  'Geo Expansion',
];

const initialDimensions = [
    { id: 'market_adjacency', name: 'Market Adjacency', techWeight: 25, medWeight: 20 },
    { id: 'technology_synergy', name: 'Technology Synergy', techWeight: 25, medWeight: 20 },
    { id: 'strategic_mandate_fit', name: 'Strategic Mandate Fit', techWeight: 20, medWeight: 25 },
    { id: 'esg_alignment', name: 'ESG / Impact Alignment', techWeight: 15, medWeight: 20 },
    { id: 'exit_synergy', name: 'Exit Synergy Potential', techWeight: 15, medWeight: 15 },
];

const toSnakeCase = (str: string) => str.toLowerCase().replace(/[\s/]+/g, '_');


const generateJsonConfig = (state: any) => {
    const techWeights = state.dimensions.reduce((acc: any, dim: any) => {
        acc[dim.id] = dim.techWeight / 100;
        return acc;
    }, {});
    const medWeights = state.dimensions.reduce((acc: any, dim: any) => {
        acc[dim.id] = dim.medWeight / 100;
        return acc;
    }, {});

    return {
        strategic_fit_matrix: {
            active: state.isActive,
            score_weight: 0.0,
            pathways: state.pathways.map(toSnakeCase),
            dimensions: state.dimensions.map((d: any) => d.id),
            weights: {
                tech: techWeights,
                med_life: medWeights
            },
            thresholds: { high: state.thresholds.high, medium: state.thresholds.medium }
        }
    };
};


export default function StrategicFitConfigPage() {
  const [isActive, setIsActive] = useState(true);
  const [autoMap, setAutoMap] = useState(false);
  const [pathways, setPathways] = useState(initialPathways.join(', '));
  const [dimensions, setDimensions] = useState(initialDimensions);
  const [thresholds, setThresholds] = useState({ high: 8.0, medium: 6.5 });
  const [formula, setFormula] = useState('Score = Σ (Dimension Weight% / 100 × Dimension Score)');
  const [formulaExample, setFormulaExample] = useState('e.g. (25%×8.5 + 25%×7.0 + 20%×9.0 + 15%×7.5 + 15%×8.0) / 100 → 8.05 → High Alignment (≥8.0)');
  const [versionHistory, setVersionHistory] = useState<ConfigVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const saved = getLatestConfig<any>('strategic');
    if (saved) {
      if (saved.isActive !== undefined) setIsActive(saved.isActive);
      if (saved.pathways) setPathways(saved.pathways);
      if (saved.dimensions) setDimensions(saved.dimensions);
      if (saved.thresholds) setThresholds(saved.thresholds);
    }
    const history = getVersionHistory('strategic');
    setVersionHistory(history);
    if (history.length > 0) setCurrentVersion(history[history.length - 1].version);
  }, []);

  const handleWeightChange = (id: string, value: string, type: 'tech' | 'med') => {
      const numValue = parseInt(value, 10) || 0;
      setDimensions(dims => dims.map(d => {
          if (d.id === id) {
              return type === 'tech' ? { ...d, techWeight: numValue } : { ...d, medWeight: numValue };
          }
          return d;
      }));
  };
  
  const techTotal = dimensions.reduce((acc, dim) => acc + dim.techWeight, 0);
  const medTotal = dimensions.reduce((acc, dim) => acc + dim.medWeight, 0);
  
  const currentJsonConfig = generateJsonConfig({
      isActive,
      pathways: pathways.split(',').map(p => p.trim()),
      dimensions,
      thresholds
  });

  const handleReset = () => {
    setIsActive(true);
    setAutoMap(false);
    setPathways(initialPathways.join(', '));
    setDimensions(initialDimensions);
    setThresholds({ high: 8.0, medium: 6.5 });
    clearConfigVersions('strategic');
    setVersionHistory([]);
    setCurrentVersion(null);
    toast({ title: 'Defaults Restored', description: 'Strategic Fit configuration reset to defaults.' });
  };

  const handleSaveConfig = () => {
    const config = { isActive, pathways, dimensions, thresholds };
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('loggedInUser') : null;
    const userEmail = storedUser ? JSON.parse(storedUser).email : undefined;
    const ver = saveConfigVersion('strategic', config, { label: `v${(versionHistory.length + 1)} - Manual Save`, savedBy: userEmail });
    const history = getVersionHistory('strategic');
    setVersionHistory(history);
    setCurrentVersion(ver);
    toast({ title: 'Configuration Saved', description: `Version ${ver} saved successfully.` });
  };

  const handleLoadVersion = (v: ConfigVersion) => {
    const cfg = v.config as any;
    if (cfg.isActive !== undefined) setIsActive(cfg.isActive);
    if (cfg.pathways) setPathways(cfg.pathways);
    if (cfg.dimensions) setDimensions(cfg.dimensions);
    if (cfg.thresholds) setThresholds(cfg.thresholds);
    setCurrentVersion(v.version);
    toast({ title: `Version ${v.version} Loaded`, description: v.label });
  };
  
  const handleNormalize = (type: 'tech' | 'med') => {
    const weightKey = type === 'tech' ? 'techWeight' : 'medWeight';
    const total = dimensions.reduce((acc, dim) => acc + (dim as any)[weightKey], 0);
    if (total === 0) return;
    
    setDimensions(dims => dims.map(d => ({
      ...d,
      [weightKey]: Math.round((d as any)[weightKey] / total * 100)
    })));
  };

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
                Strategic Fit Matrix Configuration
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
                Customize pathways, dimensions, weights, and scoring for strategic alignment.
                </p>
            </div>
            <Button variant="ghost" onClick={handleReset}><RotateCcw className="mr-2"/> Reset All</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Alignment Dimensions & Weights</CardTitle>
              <CardDescription>Adjust the importance of each dimension by sector. Columns should sum to 100%.</CardDescription>
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
                        {dimensions.map(dim => (
                            <TableRow key={dim.id}>
                                <TableCell className="font-medium text-sm">{dim.name}</TableCell>
                                <TableCell>
                                    <Input type="number" value={dim.techWeight} onChange={e => handleWeightChange(dim.id, e.target.value, 'tech')} className="h-8 w-24 text-center mx-auto" />
                                </TableCell>
                                <TableCell>
                                    <Input type="number" value={dim.medWeight} onChange={e => handleWeightChange(dim.id, e.target.value, 'med')} className="h-8 w-24 text-center mx-auto" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableRow className="bg-muted/50 font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className={`text-center ${techTotal !== 100 ? 'text-destructive' : 'text-success'}`}>
                             <div className="flex items-center justify-center gap-2">
                                <span>{techTotal}%</span>
                                <Button size="sm" variant="ghost" onClick={() => handleNormalize('tech')} disabled={techTotal === 100}>Normalize</Button>
                            </div>
                        </TableCell>
                        <TableCell className={`text-center ${medTotal !== 100 ? 'text-destructive' : 'text-success'}`}>
                            <div className="flex items-center justify-center gap-2">
                                <span>{medTotal}%</span>
                                <Button size="sm" variant="ghost" onClick={() => handleNormalize('med')} disabled={medTotal === 100}>Normalize</Button>
                            </div>
                        </TableCell>
                    </TableRow>
                </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Strategic Pathways</CardTitle>
            </CardHeader>
            <CardContent>
                <Label htmlFor="custom-pathways">Custom Strategic Pathways</Label>
                <Textarea id="custom-pathways" value={pathways} onChange={e => setPathways(e.target.value)} placeholder="Enter comma-separated pathways" />
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
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-map">Auto-map portfolio data</Label>
                <Switch id="auto-map" checked={autoMap} onCheckedChange={setAutoMap} />
              </div>
               <div className="space-y-2">
                <Label>Fit Thresholds</Label>
                <div className="flex items-center gap-2">
                  <Label className="text-success w-20">High ≥</Label>
                  <Input type="number" value={thresholds.high} onChange={e => setThresholds({...thresholds, high: parseFloat(e.target.value)})} className="h-8"/>
                </div>
                 <div className="flex items-center gap-2">
                  <Label className="text-warning w-20">Medium ≥</Label>
                  <Input type="number" value={thresholds.medium} onChange={e => setThresholds({...thresholds, medium: parseFloat(e.target.value)})} className="h-8"/>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calculator className="size-4" /> Score Calculation</CardTitle>
              <CardDescription>Formula used by the backend for strategic alignment scoring.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Weighted Score Formula (0–10 scale)</Label>
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
                <p className="font-medium">Thresholds (0–10 scale)</p>
                <p>High Alignment: ≥ {thresholds.high}</p>
                <p>Medium Alignment: ≥ {thresholds.medium}</p>
                <p>Low Alignment: &lt; {thresholds.medium}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle>JSON Configuration</CardTitle>
                <CardDescription>Current configuration for backend use.</CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea readOnly value={JSON.stringify(currentJsonConfig, null, 2)} rows={20} className='font-mono text-xs bg-muted/50' />
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
