'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Settings,
    Plus,
    Copy,
    Archive,
    Check,
    GitCompare,
    Play,
    History,
    Layers,
    SlidersHorizontal
} from 'lucide-react';
import {
    settingsApi,
    SettingsVersion,
    ModuleSetting,
    TCACategory,
    SimulationRun,
    MODULE_DEFINITIONS,
    DEFAULT_TCA_CATEGORIES,
} from '@/lib/settings-api';

export default function ModuleSettingsPage() {
    const [versions, setVersions] = useState<SettingsVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<SettingsVersion | null>(null);
    const [simulationRuns, setSimulationRuns] = useState<SimulationRun[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newVersionName, setNewVersionName] = useState('');
    const [newVersionDescription, setNewVersionDescription] = useState('');
    const [copyFromVersion, setCopyFromVersion] = useState<number | null>(null);
    const [editingModule, setEditingModule] = useState<string | null>(null);
    const [editingCategory, setEditingCategory] = useState<number | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    const { toast } = useToast();

    // Safe date formatter to prevent hydration issues
    const formatDate = useCallback((dateInput: string | Date | undefined, includeTime = false) => {
        if (!isMounted) return '...';
        if (!dateInput) return 'N/A';
        try {
            const date = new Date(dateInput);
            if (isNaN(date.getTime())) return 'N/A';
            return includeTime ? date.toLocaleString() : date.toLocaleDateString();
        } catch {
            return 'N/A';
        }
    }, [isMounted]);

    // Set mounted state
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Load versions on mount
    const loadVersions = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await settingsApi.getVersions(true);
            setVersions(data);

            // Select active version by default
            const activeVersion = data.find(v => v.is_active);
            if (activeVersion) {
                const fullVersion = await settingsApi.getVersion(activeVersion.id);
                setSelectedVersion(fullVersion);
            } else if (data.length > 0) {
                const fullVersion = await settingsApi.getVersion(data[0].id);
                setSelectedVersion(fullVersion);
            }
        } catch (error) {
            console.error('Failed to load settings versions:', error);
            toast({
                title: 'Error',
                description: 'Failed to load settings versions. Using local defaults.',
                variant: 'destructive',
            });
            // Use local defaults as fallback
            const defaultVersion: SettingsVersion = {
                id: 0,
                version_number: 1,
                version_name: 'Default (Local)',
                is_active: true,
                is_archived: false,
                created_at: new Date().toISOString(),
                module_settings: Object.entries(MODULE_DEFINITIONS).map(([id, def], index) => ({
                    module_id: id,
                    module_name: def.name,
                    weight: def.weight,
                    is_enabled: true,
                    priority: index + 1,
                    settings: {},
                    thresholds: {},
                })),
                tca_categories: DEFAULT_TCA_CATEGORIES.map((name, index) => ({
                    id: index + 1,
                    category_name: name,
                    category_order: index + 1,
                    weight: 8.33,
                    is_active: true,
                    factors: [],
                })),
            };
            setSelectedVersion(defaultVersion);
            setVersions([defaultVersion]);
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const loadSimulationHistory = useCallback(async () => {
        try {
            const runs = await settingsApi.getSimulationRuns({ limit: 50 });
            setSimulationRuns(runs);
        } catch (error) {
            console.error('Failed to load simulation history:', error);
        }
    }, []);

    useEffect(() => {
        loadVersions();
        loadSimulationHistory();
    }, [loadVersions, loadSimulationHistory]);

    const handleSelectVersion = async (versionId: number) => {
        try {
            const fullVersion = await settingsApi.getVersion(versionId);
            setSelectedVersion(fullVersion);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load version details',
                variant: 'destructive',
            });
        }
    };

    const handleCreateVersion = async () => {
        if (!newVersionName.trim()) {
            toast({
                title: 'Error',
                description: 'Version name is required',
                variant: 'destructive',
            });
            return;
        }

        try {
            const newVersion = await settingsApi.createVersion({
                version_name: newVersionName,
                description: newVersionDescription,
                copy_from_version: copyFromVersion || undefined,
            });

            if (newVersion) {
                setVersions(prev => [newVersion, ...prev]);
                setSelectedVersion(newVersion);
                setShowCreateDialog(false);
                setNewVersionName('');
                setNewVersionDescription('');
                setCopyFromVersion(null);

                toast({
                    title: 'Success',
                    description: `Version "${newVersion.version_name}" created`,
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create new version',
                variant: 'destructive',
            });
        }
    };

    const handleActivateVersion = async (versionId: number) => {
        try {
            await settingsApi.activateVersion(versionId);
            setVersions(prev => prev.map(v => ({ ...v, is_active: v.id === versionId })));

            toast({
                title: 'Success',
                description: 'Version activated',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to activate version',
                variant: 'destructive',
            });
        }
    };

    const handleArchiveVersion = async (versionId: number) => {
        try {
            await settingsApi.archiveVersion(versionId);
            setVersions(prev => prev.map(v =>
                v.id === versionId ? { ...v, is_archived: true } : v
            ));

            toast({
                title: 'Success',
                description: 'Version archived',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to archive version',
                variant: 'destructive',
            });
        }
    };

    const handleModuleWeightChange = async (moduleId: string, weight: number) => {
        if (!selectedVersion) return;

        // Update locally first for responsive UI
        setSelectedVersion(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                module_settings: prev.module_settings?.map(m =>
                    m.module_id === moduleId ? { ...m, weight } : m
                ),
            };
        });

        // Persist to API if not local-only
        if (selectedVersion.id !== 0) {
            try {
                await settingsApi.updateModuleSetting(selectedVersion.id, moduleId, { weight });
            } catch (error) {
                console.error('Failed to save module weight:', error);
            }
        }
    };

    const handleModuleToggle = async (moduleId: string, enabled: boolean) => {
        if (!selectedVersion) return;

        setSelectedVersion(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                module_settings: prev.module_settings?.map(m =>
                    m.module_id === moduleId ? { ...m, is_enabled: enabled } : m
                ),
            };
        });

        if (selectedVersion.id !== 0) {
            try {
                await settingsApi.updateModuleSetting(selectedVersion.id, moduleId, { is_enabled: enabled });
            } catch (error) {
                console.error('Failed to save module toggle:', error);
            }
        }
    };

    const handleCategoryWeightChange = async (categoryId: number, weight: number) => {
        if (!selectedVersion) return;

        setSelectedVersion(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                tca_categories: prev.tca_categories?.map(c =>
                    c.id === categoryId ? { ...c, weight } : c
                ),
            };
        });

        if (selectedVersion.id !== 0) {
            try {
                await settingsApi.updateTCACategory(selectedVersion.id, categoryId, { weight });
            } catch (error) {
                console.error('Failed to save category weight:', error);
            }
        }
    };

    const handleCategoryToggle = async (categoryId: number, active: boolean) => {
        if (!selectedVersion) return;

        setSelectedVersion(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                tca_categories: prev.tca_categories?.map(c =>
                    c.id === categoryId ? { ...c, is_active: active } : c
                ),
            };
        });

        if (selectedVersion.id !== 0) {
            try {
                await settingsApi.updateTCACategory(selectedVersion.id, categoryId, { is_active: active });
            } catch (error) {
                console.error('Failed to save category toggle:', error);
            }
        }
    };

    // Calculate totals
    const totalModuleWeight = selectedVersion?.module_settings
        ?.filter(m => m.is_enabled)
        .reduce((sum, m) => sum + m.weight, 0) || 0;

    const totalCategoryWeight = selectedVersion?.tca_categories
        ?.filter(c => c.is_active)
        .reduce((sum, c) => sum + c.weight, 0) || 0;

    if (isLoading) {
        return (
            <div className="container mx-auto p-8 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Settings className="h-8 w-8" />
                        Module Settings
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Configure module weights and TCA categories for simulation analysis. Changes are versioned and tracked.
                    </p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Version
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Settings Version</DialogTitle>
                            <DialogDescription>
                                Create a new version of module settings. You can copy from an existing version or start fresh.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="version-name">Version Name *</Label>
                                <Input
                                    id="version-name"
                                    value={newVersionName}
                                    onChange={(e) => setNewVersionName(e.target.value)}
                                    placeholder="e.g., Q1 2025 Settings"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="version-description">Description</Label>
                                <Input
                                    id="version-description"
                                    value={newVersionDescription}
                                    onChange={(e) => setNewVersionDescription(e.target.value)}
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Copy From</Label>
                                <Select
                                    value={copyFromVersion?.toString() || 'none'}
                                    onValueChange={(v) => setCopyFromVersion(v === 'none' ? null : parseInt(v))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Start with defaults" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Start with defaults</SelectItem>
                                        {versions.map(v => (
                                            <SelectItem key={v.id} value={v.id.toString()}>
                                                {v.version_name} (v{v.version_number})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateVersion}>
                                Create Version
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left Sidebar - Version List */}
                <div className="col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Layers className="h-5 w-5" />
                                Versions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {versions.filter(v => !v.is_archived).map(version => (
                                <div
                                    key={version.id}
                                    onClick={() => handleSelectVersion(version.id)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedVersion?.id === version.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{version.version_name}</span>
                                        {version.is_active && (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                Active
                                            </Badge>
                                        )}
                                    </div>
                                    <p className={`text-xs mt-1 ${selectedVersion?.id === version.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                        }`}>
                                        v{version.version_number} • {formatDate(version.created_at)}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Version Actions */}
                    {selectedVersion && (
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle className="text-sm">Version Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {!selectedVersion.is_active && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => handleActivateVersion(selectedVersion.id)}
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        Set as Active
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        setCopyFromVersion(selectedVersion.id);
                                        setNewVersionName(`${selectedVersion.version_name} (Copy)`);
                                        setShowCreateDialog(true);
                                    }}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start text-orange-600"
                                    onClick={() => handleArchiveVersion(selectedVersion.id)}
                                >
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archive
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Main Content */}
                <div className="col-span-9">
                    {selectedVersion && (
                        <Tabs defaultValue="modules">
                            <TabsList className="mb-4">
                                <TabsTrigger value="modules" className="flex items-center gap-2">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Modules (9)
                                </TabsTrigger>
                                <TabsTrigger value="tca" className="flex items-center gap-2">
                                    <Layers className="h-4 w-4" />
                                    TCA Categories (12)
                                </TabsTrigger>
                                <TabsTrigger value="history" className="flex items-center gap-2">
                                    <History className="h-4 w-4" />
                                    Simulation History
                                </TabsTrigger>
                            </TabsList>

                            {/* Modules Tab */}
                            <TabsContent value="modules">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Module Configuration</CardTitle>
                                        <CardDescription>
                                            Configure weights and enable/disable modules. Total weight of enabled modules:{' '}
                                            <span className={totalModuleWeight === 100 ? 'text-green-600' : 'text-orange-600'}>
                                                {totalModuleWeight.toFixed(1)}%
                                            </span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]">Enabled</TableHead>
                                                    <TableHead>Module</TableHead>
                                                    <TableHead className="w-[200px]">Weight (%)</TableHead>
                                                    <TableHead className="w-[80px] text-right">Value</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedVersion.module_settings?.map((module) => (
                                                    <TableRow key={module.module_id} className={!module.is_enabled ? 'opacity-50' : ''}>
                                                        <TableCell>
                                                            <Switch
                                                                checked={module.is_enabled}
                                                                onCheckedChange={(checked) => handleModuleToggle(module.module_id, checked)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{module.module_name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {MODULE_DEFINITIONS[module.module_id as keyof typeof MODULE_DEFINITIONS]?.description || ''}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Slider
                                                                value={[module.weight]}
                                                                onValueChange={([value]) => handleModuleWeightChange(module.module_id, value)}
                                                                max={50}
                                                                min={0}
                                                                step={1}
                                                                disabled={!module.is_enabled}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {module.weight.toFixed(1)}%
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* TCA Categories Tab */}
                            <TabsContent value="tca">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>TCA Categories (12 Total)</CardTitle>
                                        <CardDescription>
                                            Configure weights for each TCA category. Total weight of active categories:{' '}
                                            <span className={Math.abs(totalCategoryWeight - 100) < 1 ? 'text-green-600' : 'text-orange-600'}>
                                                {totalCategoryWeight.toFixed(1)}%
                                            </span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]">Active</TableHead>
                                                    <TableHead>Category</TableHead>
                                                    <TableHead className="w-[200px]">Weight (%)</TableHead>
                                                    <TableHead className="w-[80px] text-right">Value</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedVersion.tca_categories?.map((category) => (
                                                    <TableRow key={category.id} className={!category.is_active ? 'opacity-50' : ''}>
                                                        <TableCell>
                                                            <Switch
                                                                checked={category.is_active}
                                                                onCheckedChange={(checked) => handleCategoryToggle(category.id!, checked)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{category.category_name}</p>
                                                                {category.description && (
                                                                    <p className="text-xs text-muted-foreground">{category.description}</p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Slider
                                                                value={[category.weight]}
                                                                onValueChange={([value]) => handleCategoryWeightChange(category.id!, value)}
                                                                max={20}
                                                                min={0}
                                                                step={0.5}
                                                                disabled={!category.is_active}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {category.weight.toFixed(1)}%
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* History Tab */}
                            <TabsContent value="history">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Play className="h-5 w-5" />
                                            Simulation History
                                        </CardTitle>
                                        <CardDescription>
                                            Review past simulation runs and their results
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {simulationRuns.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                <p>No simulation runs recorded yet</p>
                                                <p className="text-sm">Run simulations from the Simulation page to see history here</p>
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Run ID</TableHead>
                                                        <TableHead>Company</TableHead>
                                                        <TableHead>TCA Score</TableHead>
                                                        <TableHead>Settings Version</TableHead>
                                                        <TableHead>Run At</TableHead>
                                                        <TableHead>Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {simulationRuns.map((run) => (
                                                        <TableRow key={run.id}>
                                                            <TableCell className="font-mono">#{run.id}</TableCell>
                                                            <TableCell>{run.company_name || '-'}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="font-mono">
                                                                    {run.tca_score?.toFixed(2) || '-'}/10
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>v{run.settings_version_id}</TableCell>
                                                            <TableCell>
                                                                {formatDate(run.run_at, true)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant={run.status === 'completed' ? 'default' : 'secondary'}
                                                                    className={run.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                                                                >
                                                                    {run.status}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </div>
        </div>
    );
}
