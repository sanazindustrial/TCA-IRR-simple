
'use client';
import { useState } from 'react';
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
import { ArrowLeft, Lock, SlidersHorizontal, Info, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const initialModels = [
  { id: 'linear', name: 'Linear Regression', purpose: 'Financial forecast' },
  { id: 'tree', name: 'Decision Tree', purpose: 'Risk branching' },
  { id: 'rf', name: 'Random Forest', purpose: 'Robust ensemble' },
  { id: 'xgb', name: 'XGBoost', purpose: 'Investor-optimized' },
  { id: 'lstm', name: 'LSTM', purpose: 'Time-series trajectory' },
  { id: 'heuristic', name: 'Rule-based Heuristic', purpose: 'Expert risk logic' }
];

const initialFactors = [
  { id: 'cc', name: 'Confidence' },
  { id: 'kk', name: 'Consistency' },
  { id: 'rr', name: 'Reliability' },
  { id: 'pp', name: 'Completeness' },
  { id: 'ee', name: 'Explainability' },
  { id: 'ss', name: 'Sensitivity' },
  { id: 'tt', name: 'Timeliness' },
  { id: 'aa', name: 'Strategic Alignment' }
];

const initialFactorScores = {
  linear:   { cc: 0.90, kk: 0.85, rr: 0.80, pp: 0.88, ee: 0.92, ss: 0.84, tt: 0.90, aa: 0.87 },
  tree:     { cc: 0.85, kk: 0.80, rr: 0.78, pp: 0.82, ee: 0.86, ss: 0.83, tt: 0.85, aa: 0.84 },
  rf:       { cc: 0.88, kk: 0.83, rr: 0.82, pp: 0.86, ee: 0.80, ss: 0.85, tt: 0.89, aa: 0.85 },
  xgb:      { cc: 0.92, kk: 0.88, rr: 0.86, pp: 0.90, ee: 0.79, ss: 0.87, tt: 0.91, aa: 0.90 },
  lstm:     { cc: 0.89, kk: 0.82, rr: 0.79, pp: 0.85, ee: 0.72, ss: 0.90, tt: 0.88, aa: 0.83 },
  heuristic:{ cc: 0.80, kk: 0.78, rr: 0.84, pp: 0.81, ee: 0.95, ss: 0.70, tt: 0.75, aa: 0.86 }
};

const calculateWeights = (factorScores: typeof initialFactorScores) => {
    const rawMeans: Record<string, number> = {};
    for (const modelId in factorScores) {
        const scores = Object.values((factorScores as any)[modelId]);
        rawMeans[modelId] = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    const totalMean = Object.values(rawMeans).reduce((a, b) => a + b, 0);
    const normalized: Record<string, number> = {};
    if (totalMean > 0) {
        for (const modelId in rawMeans) {
            normalized[modelId] = rawMeans[modelId] / totalMean;
        }
    }
    
    return { rawMeans, normalized };
}

const generateJsonConfig = (state: any) => {
    const { rawMeans, normalized } = calculateWeights(state.factorScores);
    return {
        growth_classifier: {
            active: state.isActive,
            tier_thresholds: { tier1: state.tier1Threshold, tier2: state.tier2Threshold },
            models: initialModels,
            factors: initialFactors,
            factor_scores: state.factorScores,
            dynamic_weights: {
                raw_means: Object.fromEntries(Object.entries(rawMeans).map(([k, v]) => [k, parseFloat(v.toFixed(2))])),
                normalized: Object.fromEntries(Object.entries(normalized).map(([k, v]) => [k, parseFloat(v.toFixed(4))]))
            },
            sector_prior_blend: { alpha: state.alpha, priors: { tech: {}, med_life: {} } }
        }
    };
};


export default function GrowthClassifierConfigPage() {
    const [isActive, setIsActive] = useState(true);
    const [tier1Threshold, setTier1Threshold] = useState(70);
    const [tier2Threshold, setTier2Threshold] = useState(40);
    const [factorScores, setFactorScores] = useState(initialFactorScores);
    const [alpha, setAlpha] = useState(0.7);

    const handleFactorScoreChange = (modelId: string, factorId: string, value: string) => {
        const newScores = { ...factorScores };
        (newScores as any)[modelId][factorId] = parseFloat(value) || 0;
        setFactorScores(newScores);
    };

    const handleReset = () => {
        setIsActive(true);
        setTier1Threshold(70);
        setTier2Threshold(40);
        setFactorScores(initialFactorScores);
        setAlpha(0.7);
    };

    const { rawMeans, normalized } = calculateWeights(factorScores);

    const currentJsonConfig = generateJsonConfig({
        isActive,
        tier1Threshold,
        tier2Threshold,
        factorScores,
        alpha
    });

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
                        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
                            Growth Classifier Configuration
                        </h1>
                        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
                            Tune the 6-model DSS classifier, dynamic weights, and tier logic for predicting growth potential.
                        </p>
                    </div>
                    <Button variant="ghost" onClick={handleReset}><RotateCcw className="mr-2"/> Reset All</Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>DSS Quality Factor Scores</CardTitle>
                            <CardDescription>Adjust the underlying factor scores (0.0-1.0) for each of the 6 models. These scores determine the dynamic ensemble weights.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Model</TableHead>
                                        {initialFactors.map(f => (
                                            <TableHead key={f.id} className="text-center">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>{f.id.toUpperCase()}</TooltipTrigger>
                                                        <TooltipContent>{f.name}</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-right font-bold text-primary">w*</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {initialModels.map(model => (
                                        <TableRow key={model.id}>
                                            <TableCell className="font-medium text-sm">{model.name}</TableCell>
                                            {initialFactors.map(factor => (
                                                <TableCell key={factor.id}>
                                                    <Input
                                                        type="number"
                                                        value={(factorScores as any)[model.id][factor.id]}
                                                        onChange={e => handleFactorScoreChange(model.id, factor.id, e.target.value)}
                                                        className="h-8 w-16 text-center"
                                                        step="0.01"
                                                        min="0"
                                                        max="1"
                                                    />
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-right font-bold text-primary">{(normalized as any)[model.id]?.toFixed(4)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <div className="flex items-center justify-between">
                                <Label htmlFor="active-module">Enable Module</Label>
                                <Switch id="active-module" checked={isActive} onCheckedChange={setIsActive} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tier1-threshold">Tier 1 Threshold (≥)</Label>
                                    <Input id="tier1-threshold" type="number" value={tier1Threshold} onChange={e => setTier1Threshold(parseInt(e.target.value))} />
                                    <p className="text-xs text-muted-foreground">Composite score for Tier 1.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tier2-threshold">Tier 2 Threshold (≥)</Label>
                                    <Input id="tier2-threshold" type="number" value={tier2Threshold} onChange={e => setTier2Threshold(parseInt(e.target.value))} />
                                     <p className="text-xs text-muted-foreground">Composite score for Tier 2.</p>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label>Sector Prior Blend (α)</Label>
                                <div className='flex items-center gap-2'>
                                  <Input type="number" value={alpha} onChange={e => setAlpha(parseFloat(e.target.value))} className="h-8 w-24"/>
                                  <p className="text-xs text-muted-foreground">α=1.0 is pure dynamic, α=0.0 is pure sector prior.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Growth Tier Definitions</CardTitle>
                            <CardDescription>The final classification assigned by the model.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tier</TableHead>
                                        <TableHead>Meaning</TableHead>
                                        <TableHead>Interpretation</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-bold text-success">Tier 1</TableCell>
                                        <TableCell>High Growth</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">Top 20-25% of startups; strong, investable signals.</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-bold text-warning">Tier 2</TableCell>
                                        <TableCell>Moderate Growth</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">Middle 50-60%; mixed signals, conditional potential.</TableCell>
                                    </TableRow>
                                     <TableRow>
                                        <TableCell className="font-bold text-destructive">Tier 3</TableCell>
                                        <TableCell>Low Growth</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">Bottom 20-25%; weak signals, high friction.</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Lock className="text-warning size-4" /> JSON Configuration</CardTitle>
                            <CardDescription>Current classifier configuration for backend use.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                readOnly
                                value={JSON.stringify(currentJsonConfig, null, 2)}
                                rows={20}
                                className="font-mono text-xs bg-muted/50"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card className="mt-8">
                <CardFooter className="p-4 flex justify-end">
                    <Button>Save Configuration</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
