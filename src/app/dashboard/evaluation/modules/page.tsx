
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Edit, Settings, SlidersHorizontal, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { runAnalysis } from '@/app/analysis/actions';

const allModules = [
  { id: 'tca', name: 'TCA Scorecard', description: 'Central evaluation across fundamental categories.', status: 'active', version: '2.1', link: '/analysis/modules/tca' },
  { id: 'risk', name: 'Risk Flags', description: 'Risk analysis across 14 domains.', status: 'active', version: '1.8', link: '/analysis/modules/risk' },
  { id: 'benchmark', name: 'Benchmark Comparison', description: 'Performance vs. sector averages.', status: 'active', version: '1.5', link: '/analysis/modules/benchmark' },
  { id: 'macro', name: 'Macro Trend Alignment', description: 'PESTEL analysis and trend scores.', status: 'active', version: '1.2', link: '/analysis/modules/macro' },
  { id: 'gap', name: 'Gap Analysis', description: 'Identify performance gaps.', status: 'active', version: '2.0', link: '/analysis/modules/gap' },
  { id: 'growth', name: 'Growth Classifier', description: 'Predict growth potential.', status: 'active', version: '3.1', link: '/analysis/modules/growth' },
  { id: 'funder', name: 'Funder Fit Analysis', description: 'Investor matching & readiness.', status: 'inactive', version: '1.0', link: '/analysis/modules/funder' },
  { id: 'team', name: 'Team Assessment', description: 'Analyze founder and team strength.', status: 'active', version: '1.4', link: '/analysis/modules/team' },
  { id: 'strategic', name: 'Strategic Fit Matrix', description: 'Align with strategic pathways.', status: 'active', version: '1.1', link: '/analysis/modules/strategic' },
];


export default function ModuleControlDeck() {
    const [modules, setModules] = useState(allModules);
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        try {
            const savedModules = localStorage.getItem('module-deck-config');
            if (savedModules) {
                setModules(JSON.parse(savedModules));
            } else {
                setModules(allModules);
            }
        } catch (error) {
            console.error("Failed to parse modules from localStorage", error);
            setModules(allModules);
        }
    }, []);

    const handleToggle = (id: string) => {
        const updatedModules = modules.map(m => 
            m.id === id 
                ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } 
                : m
        );
        setModules(updatedModules);
        localStorage.setItem('module-deck-config', JSON.stringify(updatedModules));
        toast({
            title: 'Configuration Updated',
            description: `Module "${updatedModules.find(m => m.id === id)?.name}" has been ${updatedModules.find(m => m.id === id)?.status === 'active' ? 'activated' : 'deactivated'}.`,
        });
    };

    const handleRunAnalysis = async () => {
        setIsLoading(true);
        toast({
          title: 'Running Full Analysis...',
          description: 'All active modules are being processed. This may take a moment.',
        });
        try {
          const comprehensiveData = await runAnalysis('general');
          localStorage.setItem('analysisResult', JSON.stringify(comprehensiveData));
          localStorage.setItem('analysisFramework', 'general');
          router.push('/analysis/what-if');
        } catch (error) {
           console.error('Failed to run analysis:', error);
           toast({
            variant: 'destructive',
            title: 'Analysis Failed',
            description: error instanceof Error ? error.message : 'An unknown error occurred.',
          });
        } finally {
            setIsLoading(false);
        }
    };

  const activeModulesCount = modules.filter(m => m.status === 'active').length;

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
        <div className='flex items-center justify-between'>
            <div>
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
                Module Control Deck
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
                Review, configure, and run all analysis modules from a single dashboard.
                </p>
            </div>
            <div className='flex items-center gap-2'>
                 <Button size="lg" variant="outline" onClick={() => toast({ title: 'Bulk Edit', description: 'This would open a modal for bulk editing modules.'})}>
                    <SlidersHorizontal/> Bulk Edit
                 </Button>
                 <Button size="lg" onClick={handleRunAnalysis} disabled={isLoading}>
                    <BrainCircuit className="mr-2"/> {isLoading ? 'Analyzing...' : 'Run Full Analysis'}
                </Button>
            </div>
        </div>
      </header>
      <Card>
        <CardHeader>
            <CardTitle className='flex justify-between items-center'>
                <span>Analysis Modules</span>
                 <div className='flex items-center gap-4 text-sm'>
                    <span className='text-muted-foreground'>Active Modules: {activeModulesCount} / {modules.length}</span>
                 </div>
            </CardTitle>
             <CardDescription>
                Toggle modules on or off for the next analysis run. Click a module name to access its specific configuration page.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className='w-[80px]'>Status</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {modules.map(mod => (
                        <TableRow key={mod.id} className={mod.status === 'inactive' ? 'opacity-40' : ''}>
                            <TableCell>
                                <Switch checked={mod.status === 'active'} onCheckedChange={() => handleToggle(mod.id)} />
                            </TableCell>
                            <TableCell className="font-semibold">
                                <Link href={mod.link} className="hover:underline text-primary">{mod.name}</Link>
                                <span className="ml-2 text-xs text-muted-foreground font-mono">v{mod.version}</span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">{mod.description}</TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="ghost" size="icon">
                                    <Link href={mod.link}><Edit className="size-4" /></Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
