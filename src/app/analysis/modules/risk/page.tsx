
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
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, AlertTriangle, RotateCcw, Plus, Trash2, GripVertical } from 'lucide-react';
import Link from 'next/link';

const initialRiskDomains = [
    { id: '1', name: 'Regulatory / Compliance', techWeight: 5, medWeight: 15 },
    { id: '2', name: 'Clinical / Safety / Product Safety', techWeight: 5, medWeight: 15 },
    { id: '3', name: 'Liability / Legal Exposure', techWeight: 5, medWeight: 10 },
    { id: '4', name: 'Technical Execution Risk', techWeight: 12, medWeight: 8 },
    { id: '5', name: 'Market Risk', techWeight: 10, medWeight: 8 },
    { id: '6', name: 'Go-To-Market (GTM) Risk', techWeight: 10, medWeight: 5 },
    { id: '7', name: 'Financial Risk', techWeight: 10, medWeight: 10 },
    { id: '8', name: 'Team / Execution Risk', techWeight: 8, medWeight: 8 },
    { id: '9', name: 'IP / Defensibility Risk', techWeight: 8, medWeight: 10 },
    { id: '10', name: 'Data Privacy / Governance', techWeight: 7, medWeight: 5 },
    { id: '11', name: 'Security / Cyber Risk', techWeight: 7, medWeight: 5 },
    { id: '12', name: 'Operational / Supply Chain', techWeight: 5, medWeight: 6 },
    { id: '13', name: 'Ethical / Societal Risk', techWeight: 4, medWeight: 3 },
    { id: '14', name: 'Adoption / Customer Retention Risk', techWeight: 4, medWeight: 2 },
];

const initialPenalties = [
    { id: 'green', flag: '🟢 Green', techPenalty: 0, medPenalty: 0 },
    { id: 'yellow', flag: '🟡 Yellow', techPenalty: -0.5, medPenalty: -1.0 },
    { id: 'red', flag: '🔴 Red', techPenalty: -3.0, medPenalty: -6.0 },
];

export default function RiskFlagsConfigPage() {
  const [domains, setDomains] = useState(initialRiskDomains);
  const [penalties, setPenalties] = useState(initialPenalties);
  const [newDomainName, setNewDomainName] = useState('');

  const totalTechWeight = domains.reduce((sum, d) => sum + d.techWeight, 0);
  const totalMedWeight = domains.reduce((sum, d) => sum + d.medWeight, 0);

  const handleWeightChange = (id: string, newWeight: number, type: 'tech' | 'med') => {
    setDomains((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          return type === 'tech' ? { ...d, techWeight: newWeight } : { ...d, medWeight: newWeight };
        }
        return d;
      })
    );
  };
  
  const handleNameChange = (id: string, newName: string) => {
    setDomains(prev => prev.map(d => d.id === id ? {...d, name: newName} : d));
  };

  const handlePenaltyChange = (id: string, value: string, type: 'tech' | 'med') => {
    const numValue = parseFloat(value) || 0;
     setPenalties((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return type === 'tech' ? { ...p, techPenalty: numValue } : { ...p, medPenalty: numValue };
        }
        return p;
      })
    );
  }

  const handleAddDomain = () => {
    if (newDomainName.trim()) {
      const newDomain = {
        id: String(Date.now()),
        name: newDomainName.trim(),
        techWeight: 0,
        medWeight: 0,
      };
      setDomains(prev => [...prev, newDomain]);
      setNewDomainName('');
    }
  };

  const handleRemoveDomain = (id: string) => {
    setDomains(prev => prev.filter(d => d.id !== id));
  };

  const handleNormalize = (type: 'tech' | 'med') => {
    const currentTotal = domains.reduce((sum, d) => sum + (type === 'tech' ? d.techWeight : d.medWeight), 0);
    if (currentTotal === 0) return;

    setDomains(prev => prev.map(d => ({
        ...d,
        [type === 'tech' ? 'techWeight' : 'medWeight']: Math.round(( (type === 'tech' ? d.techWeight : d.medWeight) / currentTotal) * 100)
    })));
  };

  const resetDomains = () => {
    setDomains(initialRiskDomains);
  };

  const resetPenalties = () => {
    setPenalties(initialPenalties);
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
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
          Risk Flags Configuration
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
          Define risk domains, framework-specific weights, and penalties for the risk analysis module.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>Manage Risk Domains & Weights</CardTitle>
                    <CardDescription>
                        Adjust the weights for each risk domain based on the evaluation framework.
                    </CardDescription>
                  </div>
                   <Button variant="ghost" onClick={resetDomains}><RotateCcw className="mr-2"/> Reset Domains</Button>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Risk Domain</TableHead>
                        <TableHead className="w-[200px]">Tech & Other (%)</TableHead>
                        <TableHead className="w-[200px]">MedTech / Life Sci (%)</TableHead>
                        <TableHead className="w-[50px] text-right"></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {domains.map((domain) => (
                        <TableRow key={domain.id}>
                        <TableCell className="cursor-grab text-muted-foreground"><GripVertical/></TableCell>
                        <TableCell>
                          <Input value={domain.name} onChange={(e) => handleNameChange(domain.id, e.target.value)} className="h-8"/>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                            <Slider
                                value={[domain.techWeight]}
                                onValueChange={(val) => handleWeightChange(domain.id, val[0], 'tech')}
                                max={100}
                                step={1}
                            />
                            <Input
                                type="number"
                                value={domain.techWeight}
                                onChange={(e) => handleWeightChange(domain.id, parseInt(e.target.value), 'tech')}
                                className="h-8 w-20 text-center"
                            />
                            </div>
                        </TableCell>
                         <TableCell>
                            <div className="flex items-center gap-2">
                            <Slider
                                value={[domain.medWeight]}
                                onValueChange={(val) => handleWeightChange(domain.id, val[0], 'med')}
                                max={100}
                                step={1}
                            />
                            <Input
                                type="number"
                                value={domain.medWeight}
                                onChange={(e) => handleWeightChange(domain.id, parseInt(e.target.value), 'med')}
                                className="h-8 w-20 text-center"
                            />
                            </div>
                        </TableCell>
                         <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveDomain(domain.id)}>
                              <Trash2 className="size-4 text-destructive" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                 <div className="mt-6 flex items-center gap-2">
                    <Input
                    placeholder="New domain name"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    className="h-9"
                    />
                    <Button variant="outline" onClick={handleAddDomain}>
                    <Plus className="mr-2" /> Add Domain
                    </Button>
                </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center border-t pt-6">
                    <div className='flex gap-6'>
                        <div className="flex items-center gap-2">
                           <p className={totalTechWeight !== 100 ? 'text-destructive font-bold' : ''}>
                                Tech Total: {totalTechWeight}%
                            </p>
                            <Button variant="outline" size="sm" onClick={() => handleNormalize('tech')} disabled={totalTechWeight === 100}>Normalize</Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className={totalMedWeight !== 100 ? 'text-destructive font-bold' : ''}>
                                MedTech Total: {totalMedWeight}%
                            </p>
                            <Button variant="outline" size="sm" onClick={() => handleNormalize('med')} disabled={totalMedWeight === 100}>Normalize</Button>
                        </div>
                    </div>
                    <Button>Save Configuration</Button>
                </CardFooter>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>Default Penalty Logic</CardTitle>
                        <CardDescription>Severity-based penalties applied to the final score.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={resetPenalties}>
                        <RotateCcw className="size-4" />
                        <span className="sr-only">Reset Penalties</span>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Flag</TableHead>
                                <TableHead>Tech Penalty</TableHead>
                                <TableHead>Med Penalty</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {penalties.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-semibold">{p.flag}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={p.techPenalty}
                                            onChange={(e) => handlePenaltyChange(p.id, e.target.value, 'tech')}
                                            className="h-8 w-24 text-center"
                                            step="0.1"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={p.medPenalty}
                                            onChange={(e) => handlePenaltyChange(p.id, e.target.value, 'med')}
                                            className="h-8 w-24 text-center"
                                            step="0.1"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm flex items-start gap-2">
                        <AlertTriangle className="size-5 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                             <h4 className="font-semibold">Special Rule</h4>
                             <p className="text-muted-foreground">1 <span className="font-bold text-destructive">Red Flag</span> in MedTech requires automatic "Hold / Admin Review".</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
