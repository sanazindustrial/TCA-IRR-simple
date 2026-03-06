
'use client';
import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import {
  sources as initialSources,
  type Source,
  sourceCategories,
  sourceStatus,
  sourceTypes,
  sourcePricingList,
} from '@/lib/external-sources';
import {
  ArrowLeft,
  CheckCircle2,
  Import,
  Plus,
  Search,
  TestTube,
  Upload,
  XCircle,
  Eye,
  EyeOff,
  Database,
  Users,
  Github,
  TrendingUp,
  Activity,
  Landmark,
  BookOpen,
  BrainCircuit,
  Bot,
  Lightbulb,
  DollarSign,
  BarChart,
  Edit,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const StatCard = ({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
}) => (
  <Card className="flex-1 bg-card/50 backdrop-blur-sm">
    <CardContent className="p-4 flex items-center gap-4">
       <Icon className="size-8 text-muted-foreground" />
       <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
       </div>
    </CardContent>
  </Card>
);

const SourceDialog = ({
  source,
  open,
  onOpenChange,
  onSave,
  dialogType = 'add'
}: {
  source: Source | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (source: Source) => void;
  dialogType?: 'add' | 'edit';
}) => {
  const [editedSource, setEditedSource] = useState<Source | null>(source);

  useEffect(() => {
    setEditedSource(source);
  }, [source]);

  if (!editedSource) return null;

  const handleChange = (field: keyof Source, value: any) => {
    setEditedSource(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveChanges = () => {
    if (editedSource) {
      onSave(editedSource);
      onOpenChange(false);
    }
  };

  const title = dialogType === 'edit' ? `Editing: ${source?.name}` : 'Add New Data Source';
  const description = dialogType === 'edit' ? "Modify the details for this data source." : "Fill in the details for the new data source.";


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={editedSource.name} onChange={(e) => handleChange('name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input value={editedSource.category} onChange={(e) => handleChange('category', e.target.value)} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Description</Label>
            <Textarea value={editedSource.description} onChange={(e) => handleChange('description', e.target.value)} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>API URL</Label>
            <Input value={editedSource.apiUrl} onChange={(e) => handleChange('apiUrl', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={editedSource.type} onValueChange={(v) => handleChange('type', v)}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="API">API</SelectItem>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="Database">Database</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pricing</Label>
            <Select value={editedSource.pricing} onValueChange={(v) => handleChange('pricing', v)}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="Free">Free</SelectItem>
                <SelectItem value="Freemium">Freemium</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="Enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Rate Limit</Label>
            <Input value={editedSource.rateLimit} onChange={(e) => handleChange('rateLimit', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Success Rate (%)</Label>
            <Input type="number" value={editedSource.successRate} onChange={(e) => handleChange('successRate', parseFloat(e.target.value))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const SourceCard = ({ source, showSecrets, onActiveChange, onTest, onEdit, onDelete, onApiKeyChange }: { source: Source, showSecrets: boolean, onActiveChange: (checked: boolean) => void, onTest: () => void, onEdit: () => void, onDelete: () => void, onApiKeyChange: (value: string) => void }) => {
    const Icon = (Lucide as any)[source.icon] || Database;
    const isFree = source.pricing === 'Free';
    const isConnected = source.active && (source.apiKey?.startsWith('N/A') || (source.apiKey && source.apiKey.length > 0));
  
    return (
      <Card className="flex flex-col transition-all hover:shadow-lg hover:border-primary/50">
        <CardContent className="p-4 space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Icon className="size-8 text-primary" />
                    <div>
                        <h3 className="font-semibold">{source.name}</h3>
                        <p className="text-xs text-muted-foreground">{source.category}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isFree && <Badge variant="outline" className='text-success border-success/50'>FREE</Badge>}
                    <Badge variant={isConnected ? 'success' : 'secondary'}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                </div>
            </div>

            <p className="text-sm text-muted-foreground min-h-[40px]">{source.description}</p>
            
            <Separator />

            <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">API URL:</span>
                    <a href={source.apiUrl} target='_blank' rel='noopener noreferrer' className="font-mono text-xs text-accent-foreground/80 truncate hover:underline">{source.apiUrl}</a>
                </div>

                <div className="grid grid-cols-3 gap-x-2 gap-y-2 text-center">
                    <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <Badge variant="secondary">{source.type}</Badge>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Rate Limit</p>
                        <p className="font-mono text-xs">{source.rateLimit}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Success</p>
                        <p className="font-mono text-xs">{source.successRate}%</p>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor={`api-key-${source.id}`} className="text-xs text-muted-foreground">API Key</Label>
                    <Input id={`api-key-${source.id}`} 
                        type={showSecrets ? "text" : "password"} 
                        placeholder="Enter API Key" 
                        className="font-mono text-xs h-8"
                        value={source.apiKey}
                        onChange={(e) => onApiKeyChange(e.target.value)}
                        disabled={source.apiKey?.startsWith('N/A')}
                    />
                </div>
            </div>
        </CardContent>
        <div className="border-t mt-auto p-3 flex items-center justify-between bg-muted/30">
             <div className="flex items-center gap-2">
                <Switch id={`active-${source.id}`} checked={source.active} onCheckedChange={onActiveChange} />
                <Label htmlFor={`active-${source.id}`} className="text-sm font-medium">Active</Label>
             </div>
             <div className="flex items-center gap-1">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={onTest}><TestTube className="size-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Test Connection</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" onClick={onEdit}><Edit className="size-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Edit Source</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive/80 hover:text-destructive" onClick={onDelete}><Trash2 className="size-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Delete Source</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
             </div>
        </div>
      </Card>
    );
  };

export default function DataSourcesPage() {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pricingFilter, setPricingFilter] = useState('all');
  const [showSecrets, setShowSecrets] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSource, setDialogSource] = useState<Source | null>(null);
  const [dialogType, setDialogType] = useState<'add' | 'edit'>('add');

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleActiveChange = (sourceId: string, checked: boolean) => {
    setSources(prevSources => 
        prevSources.map(s => 
            s.id === sourceId ? {...s, active: checked} : s
        )
    );
    const sourceName = sources.find(s => s.id === sourceId)?.name;
    toast({
        title: `Source Updated`,
        description: `${sourceName} has been ${checked ? 'activated' : 'deactivated'}.`
    })
  };
  
  const handleApiKeyChange = (sourceId: string, value: string) => {
    setSources(prevSources =>
      prevSources.map(s => (s.id === sourceId ? { ...s, apiKey: value } : s))
    );
  };
  
  const handleDeleteSource = (sourceId: string) => {
    const sourceName = sources.find(s => s.id === sourceId)?.name;
    setSources(prevSources => prevSources.filter(s => s.id !== sourceId));
    toast({
        variant: 'destructive',
        title: `Source Deleted`,
        description: `${sourceName} has been removed from your configuration.`
    })
  }

  const handleTestConnection = (source: Source) => {
    const isConfigured = source.apiKey?.startsWith('N/A') || (source.apiKey && source.apiKey.length > 0);
    if (isConfigured) {
        toast({
            title: `Testing ${source.name}`,
            description: 'Connection successful!',
        });
    } else {
        toast({
            variant: 'destructive',
            title: `Testing ${source.name}`,
            description: 'Connection failed: API Key is missing.',
        });
    }
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result;
            if (typeof content !== 'string') {
                throw new Error("File content is not a string.");
            }
            const importedSources = JSON.parse(content);

            // Basic validation - check if it's an array
            if (!Array.isArray(importedSources)) {
                throw new Error("Invalid format: Configuration must be an array of sources.");
            }

            setSources(importedSources);
            toast({
                title: 'Import Successful',
                description: `Successfully imported ${importedSources.length} sources.`,
            });
        } catch (error) {
            console.error("Failed to import configuration:", error);
            toast({
                variant: 'destructive',
                title: 'Import Failed',
                description: error instanceof Error ? error.message : "Could not parse the selected file.",
            });
        }
    };
    reader.readAsText(file);
    
    if(event.target) {
        event.target.value = '';
    }
  }

  const triggerFileSelect = () => fileInputRef.current?.click();
  
  const handleOpenDialog = (type: 'add' | 'edit', source: Source | null = null) => {
    setDialogType(type);
    setDialogSource(source);
    setDialogOpen(true);
  };

  const handleSaveSource = (savedSource: Source) => {
    if (dialogType === 'add') {
      setSources(prev => [{ ...savedSource, id: `new-${Date.now()}` }, ...prev]);
      toast({
        title: 'Source Added',
        description: `${savedSource.name} has been successfully added.`,
      });
    } else {
      setSources(prev => prev.map(s => s.id === savedSource.id ? savedSource : s));
      toast({
        title: 'Source Updated',
        description: `${savedSource.name} has been successfully updated.`,
      });
    }
  };

  const emptySource: Source = {
    id: '', name: '', category: '', description: '', url: '', apiUrl: '',
    apiKey: '', type: 'API', pricing: 'Free', rateLimit: '', successRate: 0,
    avgResponse: 0, tags: [], connected: false, active: false, icon: 'Database'
  };


  const filteredSources = sources.filter((source) => {
    const isConnected = source.active && (source.apiKey?.startsWith('N/A') || (source.apiKey && source.apiKey.length > 0));
    const searchMatch = source.name.toLowerCase().includes(searchQuery.toLowerCase()) || source.description.toLowerCase().includes(searchQuery.toLowerCase()) || source.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const categoryMatch = categoryFilter === 'all' || source.category.toLowerCase().replace(/[\s&/]+/g, '-') === categoryFilter;
    const statusMatch = 
        statusFilter === 'all' ||
        (statusFilter === 'connected' && isConnected) ||
        (statusFilter === 'disconnected' && !isConnected) ||
        (statusFilter === 'active' && source.active) ||
        (statusFilter === 'inactive' && !source.active);
    const typeMatch = typeFilter === 'all' || source.type.toLowerCase() === typeFilter;
    const pricingMatch = pricingFilter === 'all' || source.pricing.toLowerCase() === pricingFilter;
    return searchMatch && categoryMatch && statusMatch && typeMatch && pricingMatch;
  });

  const totalSources = sources.length;
  const connectedSources = sources.filter(s => s.active && (s.apiKey?.startsWith('N/A') || (s.apiKey && s.apiKey.length > 0))).length;
  const activeSources = sources.filter(s => s.active).length;
  const freeSources = sources.filter(s => s.pricing === 'Free').length;
  const avgSuccess = totalSources > 0 ? (sources.reduce((acc, s) => acc + s.successRate, 0) / totalSources).toFixed(1) : '0.0';


  return (
    <main className="bg-background text-foreground">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-12">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>
          <div className='flex justify-between items-start'>
            <div className="max-w-xl">
              <h1 className="text-5xl md:text-6xl font-bold font-headline text-primary tracking-tighter leading-tight">
                External Source Manager
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Configure and manage external data sources for 9-module analysis.
              </p>
            </div>
            <div className='flex gap-2 flex-shrink-0 mt-2'>
                <Button variant="outline" onClick={() => toast({ title: 'Testing All Connections', description: 'This may take a moment...' })}><TestTube className="mr-2"/> Test All</Button>
                <Button variant="outline" onClick={() => toast({ title: 'Exporting Configuration', description: 'Your configuration file is being downloaded.' })}><Upload className="mr-2"/> Export Config</Button>
                <Button variant="outline" onClick={triggerFileSelect}><Import className="mr-2"/> Import Config</Button>
                <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".json" />
                <Button onClick={() => handleOpenDialog('add', emptySource)}><Plus className="mr-2"/> Add Source</Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard title="Total Sources" value={totalSources} icon={Database} />
          <StatCard title="Connected" value={connectedSources} icon={CheckCircle2} />
          <StatCard title="Active" value={activeSources} icon={Activity} />
          <StatCard title="Free Sources" value={freeSources} icon={DollarSign} />
          <StatCard title="Avg Success" value={`${avgSuccess}%`} icon={TrendingUp} />
          <StatCard title="Total Calls" value={"6,745"} icon={BarChart} />
        </div>

        <Card className="p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sources by name, description, or tag..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {sourceCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {sourceStatus.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                {sourceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
             <Select value={pricingFilter} onValueChange={setPricingFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Pricing" />
              </SelectTrigger>
              <SelectContent>
                {sourcePricingList.map((pricing) => (
                  <SelectItem key={pricing.id} value={pricing.id}>
                    {pricing.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={() => setShowSecrets(!showSecrets)} className="flex items-center gap-2">
              {showSecrets ? <EyeOff /> : <Eye />}
              {showSecrets ? 'Hide Secrets' : 'Show Secrets'}
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSources.map((source) => (
            <SourceCard 
                key={source.id} 
                source={source} 
                showSecrets={showSecrets} 
                onActiveChange={(checked) => handleActiveChange(source.id, checked)}
                onApiKeyChange={(value) => handleApiKeyChange(source.id, value)}
                onTest={() => handleTestConnection(source)}
                onEdit={() => handleOpenDialog('edit', source)}
                onDelete={() => handleDeleteSource(source.id)}
            />
          ))}
        </div>
        {filteredSources.length === 0 && (
            <div className='text-center col-span-full py-16 text-muted-foreground'>
                <Search className='mx-auto mb-2 size-8'/>
                <h3 className="font-semibold">No sources found.</h3>
                <p>Try adjusting your search or filter criteria.</p>
            </div>
        )}
      </div>
      <SourceDialog
        source={dialogSource}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveSource}
        dialogType={dialogType}
      />
    </main>
  );
}
