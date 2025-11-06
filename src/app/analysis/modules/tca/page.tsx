
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
import { ArrowLeft, Plus, RotateCcw, Trash2, Calculator } from 'lucide-react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

type Category = {
    id: string;
    name: string;
    general: number;
    medtech: number;
    generalNA: boolean;
    medtechNA: boolean;
};

const initialCategories: Category[] = [
    { id: 'leadership', name: 'Leadership', general: 20, medtech: 15, generalNA: false, medtechNA: false },
    { id: 'pmf', name: 'Product-Market Fit / Product Quality', general: 20, medtech: 15, generalNA: false, medtechNA: false },
    { id: 'team', name: 'Team Strength', general: 10, medtech: 10, generalNA: false, medtechNA: false },
    { id: 'tech', name: 'Technology & IP', general: 10, medtech: 10, generalNA: false, medtechNA: false },
    { id: 'financials', name: 'Business Model & Financials', general: 10, medtech: 10, generalNA: false, medtechNA: false },
    { id: 'gtm', name: 'Go-to-Market Strategy', general: 10, medtech: 5, generalNA: false, medtechNA: false },
    { id: 'competition', name: 'Competition & Moat', general: 5, medtech: 5, generalNA: false, medtechNA: false },
    { id: 'market', name: 'Market Potential', general: 5, medtech: 5, generalNA: false, medtechNA: false },
    { id: 'traction', name: 'Traction', general: 5, medtech: 5, generalNA: false, medtechNA: false },
    { id: 'scalability', name: 'Scalability', general: 2.5, medtech: 0, generalNA: false, medtechNA: true },
    { id: 'risk', name: 'Risk Assessment', general: 2.5, medtech: 0, generalNA: false, medtechNA: true },
    { id: 'exit', name: 'Exit Potential', general: 0, medtech: 0, generalNA: true, medtechNA: true },
    { id: 'regulatory', name: 'Regulatory', general: 0, medtech: 15, generalNA: true, medtechNA: false },
];


const initialScoringLogic = [
    { id: 'green', color: '🟩', tier: 'Strong & Investable', range: '8.0 – 10.0', risk: 'Low/Medium' },
    { id: 'yellow', color: '🟨', tier: 'Moderate; needs traction', range: '6.5 – 7.9', risk: 'Medium' },
    { id: 'red', color: '🟥', tier: 'High risk / weak readiness', range: '< 6.5', risk: 'High' },
];

const initialFormula = '∑ (Category Weight * Category Score)';
const initialExample = '(20% * 8.0) + (20% * 7.0) + ... = 7.5';

const toSnakeCase = (str: string) => str.toLowerCase().replace(/[\s/&]+/g, '_').replace(/[^a-z0-9_]/g, '');


const generateJsonConfig = (state: any) => {
    return {
        tca_scorecard: {
            version: '3.2',
            score_scale: '1-10',
            color_logic: {
                green: state.scoringLogic.find((s:any) => s.id === 'green').range,
                yellow: state.scoringLogic.find((s:any) => s.id === 'yellow').range,
                red: state.scoringLogic.find((s:any) => s.id === 'red').range,
            },
            weights: {
                general: Object.fromEntries(state.categories.map((c: any) => [toSnakeCase(c.name), c.general])),
                medtech: Object.fromEntries(state.categories.map((c: any) => [toSnakeCase(c.name), c.medtech])),
            },
            // Definitions would be managed here too
        }
    }
}


export default function TcaConfigPage() {
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [scoringLogic, setScoringLogic] = useState(initialScoringLogic);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [formula, setFormula] = useState(initialFormula);
    const [example, setExample] = useState(initialExample);

    const handleWeightChange = (id: string, value: string, type: 'general' | 'medtech') => {
        const numValue = parseFloat(value) || 0;
        setCategories(cats => cats.map(c => c.id === id ? {...c, [type]: numValue} : c));
    };

    const handleNameChange = (id: string, newName: string) => {
        setCategories(cats => cats.map(c => c.id === id ? {...c, name: newName} : c));
    }

    const handleAddCategory = () => {
        if (newCategoryName.trim()) {
            setCategories(cats => [...cats, {
                id: toSnakeCase(newCategoryName.trim()),
                name: newCategoryName.trim(),
                general: 0,
                medtech: 0,
                generalNA: true,
                medtechNA: true
            }]);
            setNewCategoryName('');
        }
    }

    const handleRemoveCategory = (id: string) => {
        setCategories(cats => cats.filter(c => c.id !== id));
    }
    
    const handleNormalize = (type: 'general' | 'medtech') => {
        const naKey = `${type}NA` as 'generalNA' | 'medtechNA';
        const activeCategories = categories.filter(cat => !cat[naKey]);
        const total = activeCategories.reduce((sum, cat) => sum + cat[type], 0);
        if (total === 0) return;

        let remainingWeight = 100;
        const normalizedCategories = categories.map(c => {
             if(c[naKey]) {
                return {...c, [type]: 0};
            }
            const normalizedWeight = Math.round((c[type] / total) * 100);
            remainingWeight -= normalizedWeight;
            return { ...c, [type]: normalizedWeight };
        });

        // Distribute rounding error
        if (remainingWeight !== 0 && activeCategories.length > 0) {
            const firstActiveCatIndex = normalizedCategories.findIndex(c => !c[naKey]);
            if(firstActiveCatIndex !== -1) {
              (normalizedCategories[firstActiveCatIndex] as any)[type] += remainingWeight;
            }
        }
        
        setCategories(normalizedCategories);
    }
    
    const toggleNA = (id: string, type: 'general' | 'medtech') => {
        const naKey = `${type}NA` as 'generalNA' | 'medtechNA';
        
        const updatedCategories = categories.map(c => {
            if (c.id === id) {
                const isNA = !c[naKey];
                return { ...c, [naKey]: isNA, [type]: isNA ? 0 : c[type] };
            }
            return c;
        });

        // After updating the state, re-normalize
        const activeCategories = updatedCategories.filter(cat => !cat[naKey]);
        const totalWeight = activeCategories.reduce((sum, cat) => sum + cat[type], 0);

        if (totalWeight > 0) {
            let remainingWeight = 100;
            const renormalized = updatedCategories.map(c => {
                if (c[naKey]) {
                    return { ...c, [type]: 0 };
                }
                const normalizedWeight = parseFloat(((c[type] / totalWeight) * 100).toFixed(1));
                remainingWeight -= normalizedWeight;
                return { ...c, [type]: normalizedWeight };
            });

            const firstActiveIndex = renormalized.findIndex(c => !c[naKey]);
            if (firstActiveIndex !== -1) {
                (renormalized[firstActiveIndex] as any)[type] = parseFloat(((renormalized[firstActiveIndex] as any)[type] + remainingWeight).toFixed(1));
            }
            setCategories(renormalized);
        } else {
            setCategories(updatedCategories);
        }
    };

    const handleReset = () => {
        setCategories(initialCategories);
        setScoringLogic(initialScoringLogic);
        setFormula(initialFormula);
        setExample(initialExample);
    }
    
    const generalTotal = categories.reduce((acc, cat) => acc + cat.general, 0);
    const medtechTotal = categories.reduce((acc, cat) => acc + cat.medtech, 0);

    const currentJsonConfig = generateJsonConfig({ categories, scoringLogic });

    return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Link
          href="/dashboard/evaluation/modules"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to Module Control Deck
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
          TCA Scorecard Configuration
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
          Customize categories, weights, and scoring logic for the core evaluation module.
        </p>
      </header>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Category Weight Matrix</CardTitle>
                        <CardDescription>Adjust weights for General and MedTech frameworks. Columns should sum to 100%.</CardDescription>
                    </div>
                    <Button variant="ghost" onClick={handleReset}><RotateCcw className="mr-2"/> Reset</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-center w-[180px]">General (%)</TableHead>
                                <TableHead className="text-center w-[180px]">MedTech (%)</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map(cat => (
                                <TableRow key={cat.id}>
                                    <TableCell className="font-medium text-sm">
                                        <Input value={cat.name} onChange={e => handleNameChange(cat.id, e.target.value)} className="h-8 bg-background" />
                                    </TableCell>
                                    <TableCell>
                                        <div className='flex items-center gap-2'>
                                            <Input type="number" value={cat.general} onChange={e => handleWeightChange(cat.id, e.target.value, 'general')} className="h-8 w-20 text-center" disabled={cat.generalNA} />
                                            <Checkbox id={`na-general-${cat.id}`} checked={cat.generalNA} onCheckedChange={() => toggleNA(cat.id, 'general')} />
                                            <Label htmlFor={`na-general-${cat.id}`} className='text-xs'>N/A</Label>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className='flex items-center gap-2'>
                                            <Input type="number" value={cat.medtech} onChange={e => handleWeightChange(cat.id, e.target.value, 'medtech')} className="h-8 w-20 text-center" disabled={cat.medtechNA}/>
                                            <Checkbox id={`na-medtech-${cat.id}`} checked={cat.medtechNA} onCheckedChange={() => toggleNA(cat.id, 'medtech')} />
                                            <Label htmlFor={`na-medtech-${cat.id}`} className='text-xs'>N/A</Label>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleRemoveCategory(cat.id)}>
                                            <Trash2 className="size-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                         <TableRow className="bg-muted/50 font-bold">
                            <TableCell>Total</TableCell>
                            <TableCell className={`text-center ${generalTotal.toFixed(1) !== '100.0' ? 'text-destructive' : 'text-success'}`}>
                                <div className="flex items-center justify-center gap-2">
                                    <span>{generalTotal.toFixed(1)}%</span>
                                    <Button size="sm" variant="ghost" onClick={() => handleNormalize('general')} disabled={generalTotal.toFixed(1) === '100.0'}>Normalize</Button>
                                </div>
                            </TableCell>
                            <TableCell className={`text-center ${medtechTotal.toFixed(1) !== '100.0' ? 'text-destructive' : 'text-success'}`}>
                                <div className="flex items-center justify-center gap-2">
                                    <span>{medtechTotal.toFixed(1)}%</span>
                                    <Button size="sm" variant="ghost" onClick={() => handleNormalize('medtech')} disabled={medtechTotal.toFixed(1) === '100.0'}>Normalize</Button>
                                </div>
                            </TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </Table>
                    <div className="mt-4 flex justify-between">
                         <div className="flex items-center gap-2">
                            <Input placeholder="New category name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="h-9"/>
                            <Button variant="outline" onClick={handleAddCategory}><Plus className="mr-2"/> Add</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
         <div className="space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>Scoring Logic</CardTitle>
                    <CardDescription>Define the thresholds for score interpretation.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Color</TableHead><TableHead>Tier</TableHead><TableHead>Range</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {scoringLogic.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.color}</TableCell>
                                    <TableCell>{item.tier}</TableCell>
                                    <TableCell><Input value={item.range} onChange={e => {
                                        const newLogic = [...scoringLogic];
                                        const logicItem = newLogic.find(l => l.id === item.id);
                                        if(logicItem) logicItem.range = e.target.value;
                                        setScoringLogic(newLogic);
                                    }} className="h-8"/></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calculator /> Score Calculation</CardTitle>
                    <CardDescription>Formula for testing and transparency.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-xs text-muted-foreground">Weighted Score Formula</Label>
                        <Input
                            value={formula}
                            onChange={(e) => setFormula(e.target.value)}
                            className="text-xs bg-muted/50 p-2 rounded-md font-mono mt-1 h-auto"
                        />
                    </div>
                     <div>
                        <Label className="text-xs text-muted-foreground">Example (Sample Scores)</Label>
                        <Input
                            value={example}
                            onChange={(e) => setExample(e.target.value)}
                            className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md font-mono mt-1 h-auto"
                        />
                    </div>
                </CardContent>
             </Card>
             <Card>
                <CardHeader>
                    <CardTitle>JSON Configuration</CardTitle>
                    <CardDescription>Current TCA configuration for backend use.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea readOnly value={JSON.stringify(currentJsonConfig, null, 2)} rows={12} className='font-mono text-xs bg-muted/50' />
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
    )
}
