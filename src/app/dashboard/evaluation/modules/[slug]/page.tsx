
'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Edit, Settings, SlidersHorizontal, BrainCircuit, Plus, Trash2, MessageSquareQuote, Calculator, FileCog, Import } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { runAnalysis } from '@/app/analysis/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const allModules = [
  { id: 'tca', name: 'TCA Scorecard', description: 'Central evaluation across fundamental categories.', status: 'active', version: '2.1', link: '/dashboard/evaluation/modules/tca' },
  { id: 'risk', name: 'Risk Flags', description: 'Risk analysis across 14 domains.', status: 'active', version: '1.8', link: '/dashboard/evaluation/modules/risk' },
  { id: 'benchmark', name: 'Benchmark Comparison', description: 'Performance vs. sector averages.', status: 'active', version: '1.5', link: '/dashboard/evaluation/modules/benchmark' },
  { id: 'macro', name: 'Macro Trend Alignment', description: 'PESTEL analysis and trend scores.', status: 'active', version: '1.2', link: '/dashboard/evaluation/modules/macro' },
  { id: 'gap', name: 'Gap Analysis', description: 'Identify performance gaps.', status: 'active', version: '2.0', link: '/dashboard/evaluation/modules/gap' },
  { id: 'growth', name: 'Growth Classifier', description: 'Predict growth potential.', status: 'active', version: '3.1', link: '/dashboard/evaluation/modules/growth' },
  { id: 'funder', name: 'Funder Fit Analysis', description: 'Investor matching & readiness.', status: 'inactive', version: '1.0', link: '/dashboard/evaluation/modules/funder' },
  { id: 'team', name: 'Team Assessment', description: 'Analyze founder and team strength.', status: 'active', version: '1.4', link: '/dashboard/evaluation/modules/team' },
  { id: 'strategic', name: 'Strategic Fit Matrix', description: 'Align with strategic pathways.', status: 'active', version: '1.1', link: '/dashboard/evaluation/modules/strategic' },
];


export default function ModuleControlDeck() {
    const [modules, setModules] = useState(allModules);
    const [newModuleName, setNewModuleName] = useState('');
    const [newModuleDesc, setNewModuleDesc] = useState('');
    const [addModuleError, setAddModuleError] = useState('');
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    const handleAddModule = () => {
        if (!newModuleName.trim() || !newModuleDesc.trim()) {
            setAddModuleError('Module name and description are required.');
            return;
        }
        setAddModuleError('');
        const newModule = {
            id: `custom-${Date.now()}`,
            name: newModuleName,
            description: newModuleDesc,
            status: 'active' as 'active' | 'inactive',
            version: '1.0',
            link: `/dashboard/evaluation/modules/custom-${Date.now()}`,
        };
        const updatedModules = [newModule, ...modules];
        setModules(updatedModules);
        localStorage.setItem('module-deck-config', JSON.stringify(updatedModules));
        setNewModuleName('');
        setNewModuleDesc('');
        toast({ title: 'Module Added', description: `${newModule.name} has been added.` });
    };

    const handleRemoveModule = (id: string) => {
        const updatedModules = modules.filter(m => m.id !== id);
        setModules(updatedModules);
        localStorage.setItem('module-deck-config', JSON.stringify(updatedModules));
        toast({ title: 'Module Removed', variant: 'destructive' });
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
    
    const handleBulkAction = (action: 'activate' | 'deactivate') => {
        const newStatus = action === 'activate' ? 'active' : 'inactive';
        const updatedModules = modules.map(m => ({ ...m, status: newStatus }));
        setModules(updatedModules);
        localStorage.setItem('module-deck-config', JSON.stringify(updatedModules));
        toast({
            title: `Bulk Action: ${action === 'activate' ? 'Activated' : 'Deactivated'} All`,
            description: `All modules have been set to ${newStatus}.`,
        });
    }

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result;
                const newModule = JSON.parse(content as string);
                if (newModule.name && newModule.description) {
                    const fullNewModule = {
                        id: `custom-import-${Date.now()}`,
                        status: 'active',
                        version: '1.0',
                        link: `/dashboard/evaluation/modules/custom-import-${Date.now()}`,
                        ...newModule
                    };
                    const updatedModules = [fullNewModule, ...modules];
                    setModules(updatedModules);
                    localStorage.setItem('module-deck-config', JSON.stringify(updatedModules));
                    toast({ title: 'Module Imported', description: `Successfully imported "${newModule.name}".`});
                } else {
                    throw new Error('JSON must contain "name" and "description" fields.');
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Import Failed', description: error instanceof Error ? error.message : 'Invalid JSON format.' });
            }
        };
        reader.readAsText(file);
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
                Module Control Deck & Bulk Editor
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
                Manage modules, run analysis, and access advanced configuration tools.
                </p>
            </div>
            <div className='flex items-center gap-2'>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="lg" variant="outline">
                            <SlidersHorizontal/> Bulk Actions
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleBulkAction('activate')}>Activate All Modules</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>Deactivate All Modules</DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
                 <Button size="lg" onClick={handleRunAnalysis} disabled={isLoading}>
                    <BrainCircuit className="mr-2"/> {isLoading ? 'Analyzing...' : 'Run Full Analysis'}
                </Button>
            </div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><MessageSquareQuote /> Reviewer Tools</CardTitle>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full justify-start">
                    <Link href="/analysis/modules/reviewer"><MessageSquareQuote/> Reviewer Analysis & Manual Input</Link>
                </Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Calculator/> Simulation Tools</CardTitle>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full justify-start">
                     <Link href="/analysis/what-if"><Calculator/> What-If Analysis</Link>
                </Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><FileCog/> Report Tools</CardTitle>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full justify-start">
                     <Link href="/dashboard/reports/configure"><FileCog/> Report Section Config</Link>
                </Button>
            </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
            <CardTitle>Add New Module</CardTitle>
            <CardDescription>Add a custom module to the evaluation workflow manually or by importing a JSON file.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input placeholder="Module Name" value={newModuleName} onChange={(e) => setNewModuleName(e.target.value)} />
                <Input placeholder="Module Description" value={newModuleDesc} onChange={(e) => setNewModuleDesc(e.target.value)} />
                <div className="flex gap-2">
                    <Button onClick={handleAddModule} className="flex-1"><Plus className="mr-2" /> Add Module</Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                        <Import className="mr-2"/> Import JSON
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".json" aria-label="Import module JSON file" />
                </div>
            </div>
            {addModuleError && <p className="text-sm text-destructive mt-2">{addModuleError}</p>}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className='flex justify-between items-center'>
                <span>Analysis Modules</span>
                 <div className='flex items-center gap-4 text-sm'>
                    <span className='text-muted-foreground'>Active Modules: {activeModulesCount} / {modules.length}</span>
                 </div>
            </CardTitle>
             <CardDescription>
                Toggle modules on or off for the next analysis run. Click the edit icon to access its specific configuration page.
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
                                {mod.name}
                                <span className="ml-2 text-xs text-muted-foreground font-mono">v{mod.version}</span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">{mod.description}</TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="ghost" size="icon">
                                    <Link href={mod.link}><Edit className="size-4" /></Link>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveModule(mod.id)}>
                                    <Trash2 className="size-4 text-destructive"/>
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
