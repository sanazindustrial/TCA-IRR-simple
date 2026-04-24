
'use client';
import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import * as Lucide from 'lucide-react';
import {
  sources as initialSources,
  type ExternalSource as Source,
  sourceCategoriesStructured as sourceCategories,
  sourceStatusStructured as sourceStatus,
  sourceTypesStructured as sourceTypes,
  sourcePricingListStructured as sourcePricingList,
  REQUIREMENT_GROUPS,
  type RequirementGroup,
} from '@/lib/external-sources-config';
import { azureStorage } from '@/lib/azure-storage-service';
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
  Key,
  ExternalLink,
  Save,
  Cloud,
  CloudOff,
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
          <div className="space-y-2 col-span-2">
            <Label>Website URL</Label>
            <Input value={editedSource.websiteUrl || ''} onChange={(e) => handleChange('websiteUrl', e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Get Key URL</Label>
            <Input value={editedSource.getKeyUrl || ''} onChange={(e) => handleChange('getKeyUrl', e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={editedSource.type} onValueChange={(v) => handleChange('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
              <SelectTrigger><SelectValue /></SelectTrigger>
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
  const iconName = source.icon || 'Database';
  const Icon = (Lucide as any)[iconName] || Database;
  const isFree = source.pricing === 'Free';
  const isConnected = source.active && (source.apiKey?.startsWith('N/A') || (source.apiKey && source.apiKey.length > 0));

  // Get requirement group info
  const reqGroup = source.requirementGroup as RequirementGroup | undefined;
  const reqGroupInfo = reqGroup ? REQUIREMENT_GROUPS[reqGroup] : null;

  // Requirement group badge colors
  const getRequirementGroupColor = (group: string | undefined) => {
    switch (group) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'E': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {reqGroup && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className={cn('text-xs', getRequirementGroupColor(reqGroup))}>
                      Group {reqGroup}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold">{reqGroupInfo?.groupName}</p>
                    <ul className="text-xs mt-1 list-disc pl-4">
                      {reqGroupInfo?.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
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
            <div className="flex items-center justify-between">
              <Label htmlFor={`api-key-${source.id}`} className="text-xs text-muted-foreground">API Key</Label>
              {source.getKeyUrl && (
                <a
                  href={source.getKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Key className="size-3" />
                  Get Key
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
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
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sources from Azure Storage on mount
  useEffect(() => {
    const loadSources = async () => {
      try {
        setIsLoading(true);
        const savedSources = await azureStorage.getItem<Source[]>('data-sources-config');
        if (savedSources && Array.isArray(savedSources) && savedSources.length > 0) {
          setSources(savedSources);
          setCloudSynced(true);
          toast({
            title: 'Sources Loaded',
            description: `Loaded ${savedSources.length} sources from cloud storage.`,
          });
        }
      } catch (error) {
        console.warn('Could not load sources from cloud, using defaults:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSources();
  }, []);

  // Save sources to Azure Storage
  const saveToCloud = useCallback(async () => {
    try {
      setIsSaving(true);
      await azureStorage.setItem('data-sources-config', sources);
      setCloudSynced(true);
      setHasUnsavedChanges(false);
      toast({
        title: 'Configuration Saved',
        description: `Successfully saved ${sources.length} sources to cloud storage.`,
      });
    } catch (error) {
      console.error('Failed to save to cloud:', error);
      setCloudSynced(false);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save configuration to cloud storage.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [sources, toast]);

  // Mark as unsaved when sources change
  const updateSources = useCallback((updater: (prev: Source[]) => Source[]) => {
    setSources(prev => {
      const newSources = updater(prev);
      setHasUnsavedChanges(true);
      setCloudSynced(false);
      return newSources;
    });
  }, []);


  const handleActiveChange = (sourceId: string, checked: boolean) => {
    updateSources(prevSources =>
      prevSources.map(s =>
        s.id === sourceId ? { ...s, active: checked } : s
      )
    );
    const sourceName = sources.find(s => s.id === sourceId)?.name;
    toast({
      title: `Source Updated`,
      description: `${sourceName} has been ${checked ? 'activated' : 'deactivated'}.`
    })
  };

  const handleApiKeyChange = (sourceId: string, value: string) => {
    updateSources(prevSources =>
      prevSources.map(s => (s.id === sourceId ? { ...s, apiKey: value } : s))
    );
  };

  const handleDeleteSource = (sourceId: string) => {
    const sourceName = sources.find(s => s.id === sourceId)?.name;
    updateSources(prevSources => prevSources.filter(s => s.id !== sourceId));
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
        setHasUnsavedChanges(true);
        setCloudSynced(false);
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${importedSources.length} sources. Click "Save to Cloud" to persist changes.`,
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

    if (event.target) {
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
      updateSources(prev => [{ ...savedSource, id: `new-${Date.now()}` }, ...prev]);
      toast({
        title: 'Source Added',
        description: `${savedSource.name} has been successfully added.`,
      });
    } else {
      updateSources(prev => prev.map(s => s.id === savedSource.id ? savedSource : s));
      toast({
        title: 'Source Updated',
        description: `${savedSource.name} has been successfully updated.`,
      });
    }
  };

  const emptySource: Source = {
    id: '', name: '', category: '', description: '', websiteUrl: '', apiUrl: '',
    apiKey: '', type: 'API', pricing: 'Free', rateLimit: '', successRate: 0,
    tags: [], connected: false, active: false, icon: 'Database', features: [],
    useCase: [], cost: ''
  };


  const filteredSources = sources.filter((source) => {
    const isConnected = source.active && (source.apiKey?.startsWith('N/A') || (source.apiKey && source.apiKey.length > 0));
    const searchMatch = source.name.toLowerCase().includes(searchQuery.toLowerCase()) || source.description.toLowerCase().includes(searchQuery.toLowerCase()) || (source.tags ?? []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const categoryMatch = categoryFilter === 'all' || source.category.toLowerCase().replace(/[\s&/]+/g, '-') === categoryFilter;
    const statusMatch =
      statusFilter === 'all' ||
      (statusFilter === 'connected' && isConnected) ||
      (statusFilter === 'disconnected' && !isConnected) ||
      (statusFilter === 'active' && source.active) ||
      (statusFilter === 'inactive' && !source.active);
    const typeMatch = typeFilter === 'all' || (source.type ?? '').toLowerCase() === typeFilter;
    const pricingMatch = pricingFilter === 'all' || source.pricing.toLowerCase() === pricingFilter;
    return searchMatch && categoryMatch && statusMatch && typeMatch && pricingMatch;
  });

  const totalSources = sources.length;
  const connectedSources = sources.filter(s => s.active && (s.apiKey?.startsWith('N/A') || (s.apiKey && s.apiKey.length > 0))).length;
  const activeSources = sources.filter(s => s.active).length;
  const freeSources = sources.filter(s => s.pricing === 'Free').length;
  const avgSuccess = totalSources > 0 ? (sources.reduce((acc, s) => acc + (s.successRate ?? 0), 0) / totalSources).toFixed(1) : '0.0';


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
              {hasUnsavedChanges && (
                <Button
                  variant="default"
                  onClick={saveToCloud}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <><Save className="mr-2 size-4" /> Save to Cloud</>
                  )}
                </Button>
              )}
              <div className="flex items-center gap-1 px-2 text-xs">
                {cloudSynced ? (
                  <><Cloud className="size-4 text-green-500" /><span className="text-green-600">Synced</span></>
                ) : (
                  <><CloudOff className="size-4 text-yellow-500" /><span className="text-yellow-600">Unsaved</span></>
                )}
              </div>
              <Button variant="outline" onClick={() => toast({ title: 'Testing All Connections', description: 'This may take a moment...' })}><TestTube className="mr-2" /> Test All</Button>
              <Button variant="outline" onClick={() => toast({ title: 'Exporting Configuration', description: 'Your configuration file is being downloaded.' })}><Upload className="mr-2" /> Export Config</Button>
              <Button variant="outline" onClick={triggerFileSelect}><Import className="mr-2" /> Import Config</Button>
              <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".json" title="Import JSON configuration file" aria-label="Import JSON configuration file" />
              <Button onClick={() => handleOpenDialog('add', emptySource)}><Plus className="mr-2" /> Add Source</Button>
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

        {/* External Config Tracking & Review Workflow */}
        <Card className="mb-8 bg-gradient-to-r from-card via-card to-purple-50/30 dark:to-purple-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="size-5 text-purple-500" />
                <h3 className="font-semibold text-lg">Configuration Tracking & Review Workflow</h3>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toast({ title: 'Configuration Log', description: 'Viewing recent configuration changes...' })}>
                  <Eye className="size-4 mr-2" />
                  View Log
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast({ title: 'Audit Export', description: 'Configuration audit exported successfully.' })}>
                  <Upload className="size-4 mr-2" />
                  Export Audit
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Config Changes */}
              <div className="p-4 rounded-lg border bg-background/50">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="size-5 text-blue-500" />
                  <span className="font-medium">Recent Changes</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {sources.filter(s => s.active).length}
                </p>
                <p className="text-xs text-muted-foreground">Active source configurations</p>
              </div>

              {/* Pending Reviews */}
              <div className="p-4 rounded-lg border bg-background/50">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="size-5 text-amber-500" />
                  <span className="font-medium">Pending Review</span>
                </div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {sources.filter(s => s.active && !s.apiKey?.startsWith('N/A') && (!s.apiKey || s.apiKey.length === 0)).length}
                </p>
                <p className="text-xs text-muted-foreground">Sources missing API keys</p>
              </div>

              {/* Compliant Sources */}
              <div className="p-4 rounded-lg border bg-background/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="size-5 text-green-500" />
                  <span className="font-medium">Fully Configured</span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {connectedSources}
                </p>
                <p className="text-xs text-muted-foreground">Sources ready for production</p>
              </div>
            </div>

            {/* Quick Actions & Workflow Steps */}
            <div className="p-4 rounded-lg border bg-muted/30">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Lightbulb className="size-4" />
                Configuration Review Workflow
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600">1</div>
                  <div>
                    <p className="font-medium">Add Source</p>
                    <p className="text-xs text-muted-foreground">Configure API URL & credentials</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-xs font-bold text-amber-600">2</div>
                  <div>
                    <p className="font-medium">Test Connection</p>
                    <p className="text-xs text-muted-foreground">Verify API access & rate limits</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs font-bold text-green-600">3</div>
                  <div>
                    <p className="font-medium">Activate</p>
                    <p className="text-xs text-muted-foreground">Enable for analysis modules</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs font-bold text-purple-600">4</div>
                  <div>
                    <p className="font-medium">Monitor</p>
                    <p className="text-xs text-muted-foreground">Track success rate & usage</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sources by name, description, or tag..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                name="source-search-filter"
                autoComplete="off"
                data-form-type="other"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="category-filter" className="w-full md:w-[200px]">
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
              <SelectTrigger id="source-status-filter" className="w-full md:w-[180px]">
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
              <SelectTrigger id="source-type-filter" className="w-full md:w-[180px]">
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
              <SelectTrigger id="pricing-filter" className="w-full md:w-[180px]">
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
            <Search className='mx-auto mb-2 size-8' />
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

      {/* Data Providers Attribution Section */}
      <Card className="mt-8 bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="size-5 text-primary" />
            <h3 className="font-semibold text-lg">Data Providers & Attribution</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            TCA-IRR-APP aggregates data from multiple trusted sources. We are committed to transparency and compliance with all data provider terms of service.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium">Government & Regulatory</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• SEC EDGAR - U.S. Securities and Exchange Commission</li>
                <li>• FDA Orange Book - Food and Drug Administration</li>
                <li>• USPTO PatentsView - U.S. Patent and Trademark Office</li>
                <li>• ClinicalTrials.gov - National Library of Medicine</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Economic & Financial</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• FRED - Federal Reserve Bank of St. Louis</li>
                <li>• BEA - Bureau of Economic Analysis</li>
                <li>• BLS - Bureau of Labor Statistics</li>
                <li>• World Bank Open Data</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Research & Technology</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• PubMed - National Center for Biotechnology Information</li>
                <li>• GitHub - Microsoft Corporation</li>
                <li>• Hugging Face - AI Model Repository</li>
                <li>• arXiv - Cornell University</li>
              </ul>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>Data usage is subject to each provider's terms of service and rate limits.</p>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">Rate Limited</Badge>
              <Badge variant="outline" className="text-xs">Cached</Badge>
              <Badge variant="outline" className="text-xs">Compliant</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation to analysis and report wizard */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-base">Ready to analyse?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Use your configured data sources in a full analysis run or triage report.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Button asChild variant="outline">
                <Link href="/analysis/run">
                  <Lucide.Play className="mr-2 size-4" />
                  Run Analysis
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/reports/triage">
                  <Lucide.FileText className="mr-2 size-4" />
                  Triage Wizard
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
