
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

const initialDimensions = [
    { id: 'founder_market_fit', name: 'Founder-Market Fit' },
    { id: 'founder_technical_fit', name: 'Founder-Technical Fit' },
    { id: 'execution_capability', name: 'Execution Capability' },
    { id: 'leadership_communication', name: 'Leadership & Communication' },
    { id: 'resilience_adaptability', name: 'Resilience & Adaptability' },
    { id: 'coachability', name: 'Coachability' },
    { id: 'team_completeness', name: 'Team Completeness' },
    { id: 'diversity_governance', name: 'Diversity & Governance' },
];

const initialWeights = {
    tech: { founder_market_fit: 15, founder_technical_fit: 20, execution_capability: 25, leadership_communication: 10, resilience_adaptability: 10, coachability: 5, team_completeness: 10, diversity_governance: 5 },
    med_life: { founder_market_fit: 10, founder_technical_fit: 25, execution_capability: 20, leadership_communication: 10, resilience_adaptability: 10, coachability: 5, team_completeness: 15, diversity_governance: 5 },
};

const initialTraitWeights = {
    grit: 25,
    adaptability: 25,
    coachability: 20,
    clarity: 15,
    decisiveness: 15,
};

const toSnakeCase = (str: string) => str.toLowerCase().replace(/\s/g, '_');

const generateJsonConfig = (state: any) => {
    return {
        team_assessment: {
            active: state.isActive,
            score_weight: 0.0,
            dimensions: state.dimensions.map((d: any) => d.id),
            weights: {
                tech: Object.fromEntries(Object.entries(state.weights.tech).map(([k, v]) => [k, (v as number) / 100])),
                med_life: Object.fromEntries(Object.entries(state.weights.med_life).map(([k, v]) => [k, (v as number) / 100])),
            },
            traits: Object.fromEntries(Object.entries(state.traitWeights).map(([k,v]) => [k, (v as number)/100])),
            thresholds: state.thresholds,
        }
    };
};

export default function TeamAssessmentConfigPage() {
  const [isActive, setIsActive] = useState(true);
  const [autoDetect, setAutoDetect] = useState(false);
  const [thresholds, setThresholds] = useState({ strong: 8.0, moderate: 6.5 });
  const [weights, setWeights] = useState(initialWeights);
  const [traitWeights, setTraitWeights] = useState(initialTraitWeights);

  const handleWeightChange = (sector: 'tech' | 'med_life', dimensionId: string, value: string) => {
    const newWeights = { ...weights };
    (newWeights[sector] as any)[dimensionId] = parseInt(value, 10) || 0;
    setWeights(newWeights);
  };
  
  const techTotal = Object.values(weights.tech).reduce((a, b) => a + b, 0);
  const medTotal = Object.values(weights.med_life).reduce((a, b) => a + b, 0);

  const currentJsonConfig = generateJsonConfig({
      isActive,
      dimensions: initialDimensions,
      weights,
      traitWeights,
      thresholds
  });

  const handleReset = () => {
    setIsActive(true);
    setAutoDetect(false);
    setThresholds({ strong: 8.0, moderate: 6.5 });
    setWeights(initialWeights);
    setTraitWeights(initialTraitWeights);
  };
  
  const handleNormalize = (sector: 'tech' | 'med_life') => {
    const currentWeights = weights[sector];
    const total = Object.values(currentWeights).reduce((a,b) => a + b, 0);
    if(total === 0) return;

    const normalizedSectorWeights: { [key: string]: number } = {};
    for (const key in currentWeights) {
      normalizedSectorWeights[key] = Math.round(((currentWeights as any)[key] / total) * 100);
    }

    setWeights(prev => ({ ...prev, [sector]: normalizedSectorWeights }));
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
                Team Assessment Configuration
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
                Customize dimensions, weights, traits, and scoring for team evaluation.
                </p>
            </div>
            <Button variant="ghost" onClick={handleReset}><RotateCcw className="mr-2"/> Reset All</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Dimension Weight Matrix</CardTitle>
                    <CardDescription>Adjust the importance of each dimension by sector. Columns must sum to 100%.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Dimension</TableHead>
                                <TableHead className="text-center">Tech / SaaS / AI</TableHead>
                                <TableHead className="text-center">MedTech / Life Sci</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialDimensions.map(dim => (
                                <TableRow key={dim.id}>
                                    <TableCell className="font-medium text-sm">{dim.name}</TableCell>
                                    <TableCell>
                                        <Input type="number" value={(weights.tech as any)[dim.id]} onChange={e => handleWeightChange('tech', dim.id, e.target.value)} className="h-8 w-24 text-center mx-auto" />
                                    </TableCell>
                                     <TableCell>
                                        <Input type="number" value={(weights.med_life as any)[dim.id]} onChange={e => handleWeightChange('med_life', dim.id, e.target.value)} className="h-8 w-24 text-center mx-auto" />
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
                                <Button size="sm" variant="ghost" onClick={() => handleNormalize('med_life')} disabled={medTotal === 100}>Normalize</Button>
                               </div>
                            </TableCell>
                        </TableRow>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Internal Trait Sub-Weights</CardTitle>
                    <CardDescription>Adjust weights for behavioral traits used in analysis.</CardDescription>
                </CardHeader>
                <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'>
                    {Object.entries(traitWeights).map(([trait, weight]) => (
                        <div key={trait} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="capitalize">{trait}</Label>
                                <span className="font-bold text-primary">{weight}%</span>
                            </div>
                            <Slider value={[weight]} onValueChange={(v) => setTraitWeights({...traitWeights, [trait]: v[0]})} max={50} step={1} />
                        </div>
                    ))}
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
                <Label htmlFor="auto-detect">Auto-Detect Traits (NLP)</Label>
                <Switch id="auto-detect" checked={autoDetect} onCheckedChange={setAutoDetect} />
              </div>
              <p className="text-xs text-muted-foreground -mt-2">If enabled, uses NLP to parse resumes and call transcripts for behavioral traits.</p>
               <div className="space-y-2">
                <Label>Team Quality Thresholds</Label>
                <div className="flex items-center gap-2">
                  <Label className="text-success w-20">Strong ≥</Label>
                  <Input type="number" value={thresholds.strong} onChange={e => setThresholds({...thresholds, strong: parseFloat(e.target.value)})} className="h-8"/>
                </div>
                 <div className="flex items-center gap-2">
                  <Label className="text-warning w-20">Moderate ≥</Label>
                  <Input type="number" value={thresholds.moderate} onChange={e => setThresholds({...thresholds, moderate: parseFloat(e.target.value)})} className="h-8"/>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle>JSON Configuration</CardTitle>
                <CardDescription>Current team assessment configuration for backend use.</CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea readOnly value={JSON.stringify(currentJsonConfig, null, 2)} rows={20} className='font-mono text-xs bg-muted/50' />
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
