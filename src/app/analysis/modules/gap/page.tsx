
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { ArrowLeft, Edit, RotateCcw } from 'lucide-react';
import Link from 'next/link';

const initialTargets = {
    tech: {
        'Market Size (TAM/SAM/SOM)': 8.5, 'Problem–Solution Fit': 8.5, 'Product & Technology': 8.5,
        'Traction & Adoption': 8.0, 'Business Model': 8.0, 'Go-To-Market Strategy': 8.5,
        'Competitive Advantage': 8.0, 'Financial Viability': 7.5, 'Team & Execution': 8.0,
        'Regulatory/Compliance': 6.5, 'IP & Defensibility': 7.0, 'ESG / Sustainability / Governance': 6.5
    },
    med_life: {
        'Market Size (TAM/SAM/SOM)': 8.0, 'Problem–Solution Fit': 8.0, 'Product & Technology': 7.5,
        'Traction & Adoption': 6.5, 'Business Model': 7.0, 'Go-To-Market Strategy': 7.0,
        'Competitive Advantage': 7.5, 'Financial Viability': 7.5, 'Team & Execution': 8.0,
        'Regulatory/Compliance': 8.5, 'IP & Defensibility': 8.0, 'ESG / Sustainability / Governance': 7.0
    }
};

const initialWeights = {
    categoryWeight: {
        'Market Size (TAM/SAM/SOM)': 0.10, 'Problem–Solution Fit': 0.10, 'Product & Technology': 0.10,
        'Traction & Adoption': 0.10, 'Business Model': 0.10, 'Go-To-Market Strategy': 0.10,
        'Competitive Advantage': 0.10, 'Financial Viability': 0.10, 'Team & Execution': 0.10,
        'Regulatory/Compliance': 0.05, 'IP & Defensibility': 0.025, 'ESG / Sustainability / Governance': 0.025
    },
    sectorGapWeight: {
        tech: {
            'Market Size (TAM/SAM/SOM)': 1.0, 'Problem–Solution Fit': 1.0, 'Product & Technology': 1.2,
            'Traction & Adoption': 1.2, 'Business Model': 1.1, 'Go-To-Market Strategy': 1.2,
            'Competitive Advantage': 1.0, 'Financial Viability': 1.0, 'Team & Execution': 1.0,
            'Regulatory/Compliance': 0.8, 'IP & Defensibility': 0.9, 'ESG / Sustainability / Governance': 0.9
        },
        med_life: {
            'Market Size (TAM/SAM/SOM)': 1.0, 'Problem–Solution Fit': 1.0, 'Product & Technology': 1.0,
            'Traction & Adoption': 0.9, 'Business Model': 1.0, 'Go-To-Market Strategy': 0.9,
            'Competitive Advantage': 1.0, 'Financial Viability': 1.0, 'Team & Execution': 1.0,
            'Regulatory/Compliance': 1.4, 'IP & Defensibility': 1.2, 'ESG / Sustainability / Governance': 1.0
        }
    }
};

const initialSeverityThresholds = { critical: 3.0, major: 1.5, minor: 0.5 };
const initialReadinessRules = {
    high: { critical: 2, major: 5 },
    medium: { critical: 4, major: 8 }
};


const toSnakeCase = (str: string) => str.toLowerCase().replace(/[\s–/&]+/g, '_').replace(/[^a-z0-9_]/g, '');


const generateJsonConfig = (state: any) => {
    return {
        gap_analysis: {
            active: true,
            score_weight: 0.0,
            severity_thresholds: {
                critical_delta: state.severityThresholds.critical,
                major_delta: state.severityThresholds.major,
                minor_delta: state.severityThresholds.minor,
            },
            readiness_rules: {
                high: { max_critical: state.readinessRules.high.critical, max_major: state.readinessRules.high.major },
                medium: { max_critical: state.readinessRules.medium.critical, max_major: state.readinessRules.medium.major }
            },
            categories: Object.keys(state.targets.tech).map(toSnakeCase),
            targets: {
                tech: Object.fromEntries(Object.entries(state.targets.tech).map(([k, v]) => [toSnakeCase(k), v])),
                med_life: Object.fromEntries(Object.entries(state.targets.med_life).map(([k, v]) => [toSnakeCase(k), v]))
            },
            weights: {
                category_weight: Object.fromEntries(Object.entries(state.weights.categoryWeight).map(([k, v]) => [toSnakeCase(k), v])),
                sector_gap_weight: {
                    tech: Object.fromEntries(Object.entries(state.weights.sectorGapWeight.tech).map(([k, v]) => [toSnakeCase(k), v])),
                    med_life: Object.fromEntries(Object.entries(state.weights.sectorGapWeight.med_life).map(([k, v]) => [toSnakeCase(k), v]))
                }
            }
        }
    }
}


export default function GapAnalysisConfigPage() {
    const [targets, setTargets] = useState(initialTargets);
    const [weights, setWeights] = useState(initialWeights);
    const [severityThresholds, setSeverityThresholds] = useState(initialSeverityThresholds);
    const [readinessRules, setReadinessRules] = useState(initialReadinessRules);
    const [showMinorGaps, setShowMinorGaps] = useState(true);
    const [requireMitigation, setRequireMitigation] = useState(true);

    const handleTargetChange = (sector: 'tech' | 'med_life', category: string, value: string) => {
        const newTargets = { ...targets };
        (newTargets[sector] as any)[category] = parseFloat(value) || 0;
        setTargets(newTargets);
    };

    const handleWeightChange = (type: 'categoryWeight' | 'sectorGapWeight', category: string, value: string, sector?: 'tech' | 'med_life') => {
        const newWeights = { ...weights };
        if (type === 'categoryWeight') {
            (newWeights.categoryWeight as any)[category] = parseFloat(value) || 0;
        } else if (sector) {
            (newWeights.sectorGapWeight[sector] as any)[category] = parseFloat(value) || 0;
        }
        setWeights(newWeights);
    };
    
    const currentJsonConfig = generateJsonConfig({
        targets,
        weights,
        severityThresholds,
        readinessRules,
    });

    const handleReset = () => {
        setTargets(initialTargets);
        setWeights(initialWeights);
        setSeverityThresholds(initialSeverityThresholds);
        setReadinessRules(initialReadinessRules);
        setShowMinorGaps(true);
        setRequireMitigation(true);
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
                            Gap Analysis Configuration
                        </h1>
                        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
                            Adjust targets, weights, and rules for identifying performance gaps against investor-ready profiles.
                        </p>
                    </div>
                    <Button variant="ghost" onClick={handleReset}><RotateCcw className="mr-2"/> Reset All</Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Category Targets (Ideal Raw Score 0-10)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>TCA Category</TableHead>
                                        <TableHead className="text-center">Tech/Other Target</TableHead>
                                        <TableHead className="text-center">Med/Life Target</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.keys(targets.tech).map(category => (
                                        <TableRow key={category}>
                                            <TableCell className="font-medium text-sm">{category}</TableCell>
                                            <TableCell>
                                                <Input type="number" value={(targets.tech as any)[category]} onChange={e => handleTargetChange('tech', category, e.target.value)} className="h-8 w-24 text-center mx-auto" />
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" value={(targets.med_life as any)[category]} onChange={e => handleTargetChange('med_life', category, e.target.value)} className="h-8 w-24 text-center mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Internal Weights for Gap Ranking</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>TCA Category</TableHead>
                                        <TableHead className="text-center">Category Weight</TableHead>
                                        <TableHead className="text-center">Tech Sector Gap Weight</TableHead>
                                        <TableHead className="text-center">Med/Life Sector Gap Weight</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.keys(weights.categoryWeight).map(category => (
                                        <TableRow key={category}>
                                            <TableCell className="font-medium text-sm">{category}</TableCell>
                                            <TableCell>
                                                <Input type="number" value={(weights.categoryWeight as any)[category]} onChange={e => handleWeightChange('categoryWeight', category, e.target.value)} className="h-8 w-24 text-center mx-auto" step="0.01"/>
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" value={(weights.sectorGapWeight.tech as any)[category]} onChange={e => handleWeightChange('sectorGapWeight', category, e.target.value, 'tech')} className="h-8 w-24 text-center mx-auto" step="0.1" />
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" value={(weights.sectorGapWeight.med_life as any)[category]} onChange={e => handleWeightChange('sectorGapWeight', category, e.target.value, 'med_life')} className="h-8 w-24 text-center mx-auto" step="0.1" />
                                            </TableCell>
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
                            <CardTitle>General Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Severity Thresholds (Delta)</Label>
                                <div className="flex items-center gap-2">
                                    <Label className="text-destructive w-16">Critical ≥</Label>
                                    <Input type="number" value={severityThresholds.critical} onChange={e => setSeverityThresholds({...severityThresholds, critical: parseFloat(e.target.value)})} className="h-8" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label className="text-warning w-16">Major ≥</Label>
                                    <Input type="number" value={severityThresholds.major} onChange={e => setSeverityThresholds({...severityThresholds, major: parseFloat(e.target.value)})} className="h-8" />
                                </div>
                                <div className="flex items-center gap-2">
                                     <Label className="text-success w-16">Minor ≥</Label>
                                     <Input type="number" value={severityThresholds.minor} onChange={e => setSeverityThresholds({...severityThresholds, minor: parseFloat(e.target.value)})} className="h-8" />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label>Overall Readiness Rules</Label>
                                <div className="flex items-center gap-2">
                                    <Label className="w-24">High</Label>
                                    <Input type="number" value={readinessRules.high.critical} onChange={e => setReadinessRules({...readinessRules, high: {...readinessRules.high, critical: parseInt(e.target.value)} })} className="h-8" aria-label="High readiness critical gaps"/>
                                    <Label className="text-xs text-muted-foreground">Critical</Label>
                                    <Input type="number" value={readinessRules.high.major} onChange={e => setReadinessRules({...readinessRules, high: {...readinessRules.high, major: parseInt(e.target.value)} })} className="h-8" aria-label="High readiness major gaps" />
                                     <Label className="text-xs text-muted-foreground">Major</Label>
                                </div>
                                 <div className="flex items-center gap-2">
                                    <Label className="w-24">Medium</Label>
                                    <Input type="number" value={readinessRules.medium.critical} onChange={e => setReadinessRules({...readinessRules, medium: {...readinessRules.medium, critical: parseInt(e.target.value)} })} className="h-8" aria-label="Medium readiness critical gaps"/>
                                    <Label className="text-xs text-muted-foreground">Critical</Label>
                                    <Input type="number" value={readinessRules.medium.major} onChange={e => setReadinessRules({...readinessRules, medium: {...readinessRules.medium, major: parseInt(e.target.value)} })} className="h-8" aria-label="Medium readiness major gaps" />
                                     <Label className="text-xs text-muted-foreground">Major</Label>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="show-minor-gaps" checked={showMinorGaps} onCheckedChange={setShowMinorGaps} />
                                <Label htmlFor="show-minor-gaps">Show Minor Gaps (Δ &lt; 1.5)</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Switch id="require-mitigation" checked={requireMitigation} onCheckedChange={setRequireMitigation} />
                                <Label htmlFor="require-mitigation">Require Mitigation for Critical Gaps</Label>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>JSON Configuration</CardTitle>
                            <CardDescription>
                                Current gap analysis configuration for backend use.
                            </CardDescription>
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
