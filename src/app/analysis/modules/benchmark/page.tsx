
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, GripVertical, Plus, Trash2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const initialPeerPriority = ['sector', 'stage', 'model'];

const initialUniversalMetrics = [
  'Revenue Growth Rate',
  'Customer Growth / Adoption Rate',
  'Retention / Churn / Cohort KPIs',
  'CAC / LTV Ratio',
  'Burn Multiple',
  'Runway (Months)',
  'Valuation vs Stage',
  'Time-to-Market',
];

const initialTechMetrics = [
    { metric: 'CAC Payback', target: '< 18 months' },
    { metric: 'LTV/CAC', target: '> 3.0' },
    { metric: 'NRR (Net Retention)', target: '100–120%' },
    { metric: 'MoM User Growth', target: '8–20%' },
    { metric: 'Burn Multiple', target: '< 1.5' },
];

const initialMedMetrics = [
    { metric: 'Clinical Stage Progress', target: 'On-track milestones' },
    { metric: 'FDA/EMA Timeline', target: 'Within expected range' },
    { metric: 'Cash Runway', target: '≥ 18–24 months' },
    { metric: 'Partner/OEM Pipeline', target: 'Defined, active' },
    { metric: 'Regulatory De-risking', target: 'Evidence-based milestones' },
]

const initialScoringLogic = [
    { id: 'q1', performance: 'Top Quartile (Q1)', overlay: '+5%' },
    { id: 'q2', performance: 'Above Avg (Q2)', overlay: '+2.5%' },
    { id: 'q3', performance: 'Average (Q3)', overlay: '0%' },
    { id: 'q4', performance: 'Below Avg (Q4)', overlay: '−2.5%' },
    { id: 'std', performance: '> 1 STD below peers', overlay: '−5%' },
];

const generateJsonConfig = (state: any) => {
    return {
        benchmark_comparison: {
            active: state.benchmarksEnabled,
            overlay_range: { min: -state.overlayWeight/100, max: state.overlayWeight/100 },
            peer_priority: state.peerPriority,
            universal_metrics: state.universalMetrics.map(m => m.toLowerCase().replace(/\s/g, '_')),
            sector_metrics: {
                tech: state.techMetrics.map(m => m.metric.toLowerCase().replace(/\s/g, '_')),
                med_life: state.medMetrics.map(m => m.metric.toLowerCase().replace(/\s/g, '_'))
            }
        }
    }
}


export default function BenchmarkConfigPage() {
    const [peerPriority, setPeerPriority] = useState(initialPeerPriority);
    const [universalMetrics, setUniversalMetrics] = useState(initialUniversalMetrics);
    const [techMetrics, setTechMetrics] = useState(initialTechMetrics);
    const [medMetrics, setMedMetrics] = useState(initialMedMetrics);
    const [scoringLogic, setScoringLogic] = useState(initialScoringLogic);

    const [benchmarksEnabled, setBenchmarksEnabled] = useState(true);
    const [baselineSource, setBaselineSource] = useState('internal-db');
    const [overlayWeight, setOverlayWeight] = useState(5);
    
    const currentJsonConfig = generateJsonConfig({
        benchmarksEnabled,
        overlayWeight,
        peerPriority,
        universalMetrics,
        techMetrics,
        medMetrics,
    });

    const handleReset = () => {
        setPeerPriority(initialPeerPriority);
        setUniversalMetrics(initialUniversalMetrics);
        setTechMetrics(initialTechMetrics);
        setMedMetrics(initialMedMetrics);
        setScoringLogic(initialScoringLogic);
        setBenchmarksEnabled(true);
        setBaselineSource('internal-db');
        setOverlayWeight(5);
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
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
                Benchmark Comparison Configuration
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
                Define peer groups, metrics, and scoring rules for the benchmark module.
                </p>
            </div>
            <Button variant="ghost" onClick={handleReset}><RotateCcw className="mr-2"/> Reset All</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center space-x-2">
                        <Switch id="enable-benchmarks" checked={benchmarksEnabled} onCheckedChange={setBenchmarksEnabled} />
                        <Label htmlFor="enable-benchmarks">Enable Benchmarks</Label>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="baseline-source">Baseline Source</Label>
                        <Select value={baselineSource} onValueChange={setBaselineSource}>
                        <SelectTrigger id="baseline-source">
                            <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="internal-db">Internal DB</SelectItem>
                            <SelectItem value="external-api">External API</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="overlay-weight">Overlay Weight (%)</Label>
                        <Input
                        id="overlay-weight"
                        type="number"
                        value={overlayWeight}
                        onChange={(e) => setOverlayWeight(parseFloat(e.target.value))}
                        min="0"
                        max="10"
                        step="0.5"
                        />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Peer Group Configuration</CardTitle>
                    <CardDescription>
                        Set the matching priority for peer groups. Drag to reorder.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {peerPriority.map((item, index) => (
                            <div key={item} className="flex items-center gap-2 p-3 rounded-md border bg-muted/30">
                                <GripVertical className="size-5 text-muted-foreground cursor-grab" />
                                <span className="font-mono text-sm font-semibold">{index + 1}.</span>
                                <Input value={item} onChange={(e) => {
                                    const newPriority = [...peerPriority];
                                    newPriority[index] = e.target.value;
                                    setPeerPriority(newPriority);
                                }} className="h-8 capitalize bg-background" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Benchmark Metrics</CardTitle>
                    <CardDescription>
                       Review and edit the universal and sector-specific metrics used for comparison.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold mb-2">Universal Default Metrics</h3>
                    <div className="flex flex-wrap gap-2">
                        {universalMetrics.map((m, i) => (
                            <div key={i} className="flex items-center gap-1">
                                <Input value={m} onChange={(e) => {
                                    const newMetrics = [...universalMetrics];
                                    newMetrics[i] = e.target.value;
                                    setUniversalMetrics(newMetrics);
                                }} className="h-8 bg-background"/>
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => setUniversalMetrics(universalMetrics.filter((_, idx) => idx !== i))}>
                                    <Trash2 className="size-4 text-destructive"/>
                                </Button>
                            </div>
                        ))}
                    </div>
                     <Button variant="outline" size="sm" className="mt-2" onClick={() => setUniversalMetrics([...universalMetrics, 'New Metric'])}><Plus className="mr-2 size-4"/> Add Universal</Button>

                    <Separator className="my-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">Tech / SaaS / AI / Consumer</h3>
                            <Table>
                                <TableHeader><TableRow><TableHead>Metric</TableHead><TableHead>Target</TableHead><TableHead></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {techMetrics.map((m, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">
                                                <Input value={m.metric} onChange={e => {
                                                    const newMetrics = [...techMetrics];
                                                    newMetrics[i].metric = e.target.value;
                                                    setTechMetrics(newMetrics);
                                                }} className="h-8 bg-background"/>
                                            </TableCell>
                                            <TableCell>
                                                <Input value={m.target}  onChange={e => {
                                                    const newMetrics = [...techMetrics];
                                                    newMetrics[i].target = e.target.value;
                                                    setTechMetrics(newMetrics);
                                                }} className="h-8 bg-background"/>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="size-8" onClick={() => setTechMetrics(techMetrics.filter((_, idx) => idx !== i))}>
                                                    <Trash2 className="size-4 text-destructive"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                             <Button variant="outline" size="sm" className="mt-2" onClick={() => setTechMetrics([...techMetrics, {metric: 'New Metric', target: 'New Target'}])}><Plus className="mr-2 size-4"/> Add Tech</Button>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2">MedTech / Life Sciences</h3>
                            <Table>
                                <TableHeader><TableRow><TableHead>Metric</TableHead><TableHead>Target</TableHead><TableHead></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {medMetrics.map((m, i) => (
                                        <TableRow key={i}>
                                             <TableCell className="font-medium">
                                                <Input value={m.metric} onChange={e => {
                                                    const newMetrics = [...medMetrics];
                                                    newMetrics[i].metric = e.target.value;
                                                    setMedMetrics(newMetrics);
                                                }} className="h-8 bg-background"/>
                                            </TableCell>
                                            <TableCell>
                                                <Input value={m.target}  onChange={e => {
                                                    const newMetrics = [...medMetrics];
                                                    newMetrics[i].target = e.target.value;
                                                    setMedMetrics(newMetrics);
                                                }} className="h-8 bg-background"/>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="size-8" onClick={() => setMedMetrics(medMetrics.filter((_, idx) => idx !== i))}>
                                                    <Trash2 className="size-4 text-destructive"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Button variant="outline" size="sm" className="mt-2" onClick={() => setMedMetrics([...medMetrics, {metric: 'New Metric', target: 'New Target'}])}><Plus className="mr-2 size-4"/> Add MedTech</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Scoring Logic (±{overlayWeight}% Impact)</CardTitle>
                    <CardDescription>The final overlay added to the TCA score based on peer performance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Performance vs Peers</TableHead><TableHead className="text-right">Overlay</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {scoringLogic.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.performance}</TableCell>
                                    <TableCell className="text-right font-bold text-accent">
                                        <Input value={item.overlay} onChange={e => {
                                            const newLogic = [...scoringLogic];
                                            const logicItem = newLogic.find(l => l.id === item.id);
                                            if (logicItem) {
                                                logicItem.overlay = e.target.value;
                                                setScoringLogic(newLogic);
                                            }
                                        }} className="h-8 bg-background text-right w-24 ml-auto"/>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>JSON Configuration</CardTitle>
                    <CardDescription>
                        Current benchmark configuration for backend use.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        readOnly
                        value={JSON.stringify(currentJsonConfig, null, 2)}
                        rows={15}
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
