
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const initialPestelSources = {
  political: ['OECD Policy Briefs', 'World Bank Governance Index'],
  economic: ['IMF Outlook', 'World Bank Econ Data', 'FRED'],
  social: ['Pew Research', 'McKinsey Trends'],
  technological: ['Gartner Hype Cycle', 'CB Insights', 'Arxiv'],
  environmental: ['UN SDG', 'ESG Databases'],
  legal: ['LexisNexis', 'FDA/EMA Portals'],
};

const initialSectorWeights = [
    { id: 'tech', name: 'Tech / SaaS / AI', weights: { p: 10, e_econ: 20, s: 15, t: 35, e_env: 5, l: 15 } },
    { id: 'medtech', name: 'MedTech / Life Sciences', weights: { p: 15, e_econ: 10, s: 10, t: 10, e_env: 15, l: 40 } },
];


const generateJsonConfig = (state: any) => {
    return {
        macro_trend_alignment: {
            active: true,
            overlay_limit: state.overlayWeight / 100,
            pestel_sources: state.pestelSources,
            sector_weights: state.sectorWeights.reduce((acc: any, sector: any) => {
                acc[sector.id] = sector.weights;
                return acc;
            }, {}),
            evidence_required: state.evidenceRequired,
        }
    }
}

export default function MacroTrendConfigPage() {
  const [pestelSources, setPestelSources] = useState(initialPestelSources);
  const [overlayWeight, setOverlayWeight] = useState(5);
  const [sectorWeights, setSectorWeights] = useState(initialSectorWeights);
  const [evidenceRequired, setEvidenceRequired] = useState(true);

  const currentJsonConfig = generateJsonConfig({
    overlayWeight,
    pestelSources,
    sectorWeights,
    evidenceRequired,
  });

  const handleSourceChange = (factor: string, index: number, value: string) => {
      const newSources = {...pestelSources};
      (newSources as any)[factor][index] = value;
      setPestelSources(newSources);
  }

  const handleRemoveSource = (factor: string, index: number) => {
      const newSources = {...pestelSources};
      (newSources as any)[factor].splice(index, 1);
      setPestelSources(newSources);
  }

  const handleAddSource = (factor: string) => {
      const newSources = {...pestelSources};
      (newSources as any)[factor].push('New Source');
      setPestelSources(newSources);
  }

  const handleWeightChange = (sectorId: string, factorKey: string, value: string) => {
    const newWeights = [...sectorWeights];
    const sector = newWeights.find(s => s.id === sectorId);
    if(sector) {
      (sector.weights as any)[factorKey] = parseInt(value, 10) || 0;
      setSectorWeights(newWeights);
    }
  }

  const handleAddSector = () => {
    const newSector = {
        id: `new-sector-${Date.now()}`,
        name: 'New Sector',
        weights: { p: 10, e_econ: 10, s: 10, t: 10, e_env: 10, l: 50}
    };
    setSectorWeights([...sectorWeights, newSector]);
  }

  const handleReset = () => {
    setPestelSources(initialPestelSources);
    setOverlayWeight(5);
    setSectorWeights(initialSectorWeights);
    setEvidenceRequired(true);
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
                Macro Trend Alignment Configuration
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
                Customize data sources, weights, and scoring for PESTEL analysis.
                </p>
            </div>
            <Button variant="ghost" onClick={handleReset}><RotateCcw className="mr-2"/> Reset All</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>PESTEL Data Sources</CardTitle>
              <CardDescription>Manage the default data sources for each PESTEL factor.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(pestelSources).map(([key, sources]) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize font-semibold">{key}</Label>
                  <div className="space-y-2">
                    {sources.map((source, index) => (
                       <div key={index} className="flex items-center gap-2">
                          <Input value={source} onChange={(e) => handleSourceChange(key, index, e.target.value)} className="h-8 bg-muted/30" />
                          <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => handleRemoveSource(key, index)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                       </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => handleAddSource(key)}><Plus className="size-4 mr-2" /> Add Source</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle>Sector Weight Overrides</CardTitle>
                <CardDescription>Adjust the PESTEL factor weights for different industry sectors.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sector</TableHead>
                            <TableHead className="text-center">P</TableHead>
                            <TableHead className="text-center">E</TableHead>
                            <TableHead className="text-center">S</TableHead>
                            <TableHead className="text-center">T</TableHead>
                            <TableHead className="text-center">E</TableHead>
                            <TableHead className="text-center">L</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sectorWeights.map(sector => {
                            const total = Object.values(sector.weights).reduce((a,b) => a + b, 0);
                            return (
                                <TableRow key={sector.id}>
                                    <TableCell className="font-medium">
                                       <Input value={sector.name} className="h-8 bg-background" onChange={(e) => {
                                           const newWeights = [...sectorWeights];
                                           const sec = newWeights.find(s => s.id === sector.id);
                                           if(sec) sec.name = e.target.value;
                                           setSectorWeights(newWeights);
                                       }} />
                                    </TableCell>
                                    {Object.entries(sector.weights).map(([key, value]) => (
                                        <TableCell key={key}>
                                            <Input type="number" value={value} onChange={e => handleWeightChange(sector.id, key, e.target.value)} className="h-8 w-16 text-center" />
                                        </TableCell>
                                    ))}
                                    <TableCell className={`text-center font-bold ${total !== 100 ? 'text-destructive' : ''}`}>{total}%</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
                <Button variant="outline" size="sm" className="mt-4" onClick={handleAddSector}>
                    <Plus className="mr-2 size-4" /> Add Sector Profile
                </Button>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Overlay Weight ({overlayWeight}%)</Label>
                        <Slider value={[overlayWeight]} onValueChange={(v) => setOverlayWeight(v[0])} max={10} step={0.5} />
                        <p className="text-xs text-muted-foreground">Sets the max ± impact on the final score.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="evidence-required" checked={evidenceRequired} onCheckedChange={setEvidenceRequired}/>
                        <Label htmlFor="evidence-required">Evidence Requirement</Label>
                    </div>
                     <p className="text-xs text-muted-foreground">Force AI to cite sources for each PESTEL finding.</p>

                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>JSON Configuration</CardTitle>
                    <CardDescription>Current macro trend configuration for backend use.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea readOnly value={JSON.stringify(currentJsonConfig, null, 2)} rows={15} className="font-mono text-xs bg-muted/50" />
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
