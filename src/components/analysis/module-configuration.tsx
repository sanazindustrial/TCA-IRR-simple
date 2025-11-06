'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
  User,
  Shield,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
export type UserRole = 'user' | 'admin' | 'reviewer';
export type ReportType = 'triage' | 'dd';
export type Framework = 'general' | 'medtech';

export interface ModuleConfig {
  id: string;
  title: string;
  description: string;
  category: 'core' | 'analysis' | 'compliance' | 'strategic';
  requiredRole: UserRole[];
  reportTypes: ReportType[];
  frameworks: Framework[];
  active: boolean;
  priority: number;
}

interface ModuleConfigurationProps {
  role?: UserRole;
  reportType?: ReportType;
  framework: Framework;
  onConfigurationChange?: (config: ModuleConfig[]) => void;
}

// Default module configurations
const defaultModules: ModuleConfig[] = [
  // Core Modules
  {
    id: 'quick-summary',
    title: 'Quick Summary',
    description: 'Executive overview and key findings',
    category: 'core',
    requiredRole: ['user', 'admin', 'reviewer'],
    reportTypes: ['triage', 'dd'],
    frameworks: ['general', 'medtech'],
    active: true,
    priority: 1
  },
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    description: 'Comprehensive executive-level analysis',
    category: 'core',
    requiredRole: ['admin', 'reviewer'],
    reportTypes: ['triage', 'dd'],
    frameworks: ['general', 'medtech'],
    active: true,
    priority: 2
  },
  {
    id: 'tca-scorecard',
    title: 'TCA Scorecard',
    description: 'Technology Commercialization Assessment scores',
    category: 'core',
    requiredRole: ['user', 'admin', 'reviewer'],
    reportTypes: ['triage', 'dd'],
    frameworks: ['general', 'medtech'],
    active: true,
    priority: 3
  },

  // Analysis Modules
  {
    id: 'risk-flags',
    title: 'Risk Flags & Mitigation',
    description: 'Risk assessment and mitigation strategies',
    category: 'analysis',
    requiredRole: ['user', 'admin', 'reviewer'],
    reportTypes: ['triage', 'dd'],
    frameworks: ['general', 'medtech'],
    active: true,
    priority: 4
  },
  {
    id: 'macro-trend-alignment',
    title: 'Macro Trend Alignment',
    description: 'PESTEL analysis and market trends',
    category: 'analysis',
    requiredRole: ['admin', 'reviewer'],
    reportTypes: ['triage', 'dd'],
    frameworks: ['general', 'medtech'],
    active: true,
    priority: 5
  },
  {
    id: 'benchmark-comparison',
    title: 'Benchmark Comparison',
    description: 'Industry benchmarks and competitive analysis',
    category: 'analysis',
    requiredRole: ['admin', 'reviewer'],
    reportTypes: ['dd'],
    frameworks: ['general', 'medtech'],
    active: true,
    priority: 6
  },
  {
    id: 'growth-classifier',
    title: 'Growth Classifier',
    description: 'AI-powered growth potential classification',
    category: 'analysis',
    requiredRole: ['admin', 'reviewer'],
    reportTypes: ['dd'],
    frameworks: ['general', 'medtech'],
    active: true,
    priority: 7
  },
  {
    id: 'gap-analysis',
    title: 'Gap Analysis',
    description: 'Identify gaps and improvement areas',
    category: 'analysis',
    requiredRole: ['admin', 'reviewer'],
    reportTypes: ['dd'],
    frameworks: ['general', 'medtech'],
    active: true,
    priority: 8
  },
  {
    id: 'team-assessment',
    title: 'Team Assessment',
    description: 'Founding team and organizational analysis',
    category: 'strategic',
    requiredRole: ['admin', 'reviewer'],
    reportTypes: ['dd'],
    frameworks: ['general', 'medtech'],
    active: true,
    priority: 9
  },
  {
    id: 'funder-fit-analysis',
    title: 'Funder Fit Analysis',
    description: 'Investment readiness and funder matching',
    category: 'strategic',
    requiredRole: ['admin', 'reviewer'],
    reportTypes: ['dd'],
    frameworks: ['general', 'medtech'],
    active: true,
    priority: 10
  },
  {
    id: 'strategic-fit-matrix',
    title: 'Strategic Fit Matrix',
    description: 'Strategic alignment and fit analysis',
    category: 'strategic',
    requiredRole: ['admin', 'reviewer'],
    reportTypes: ['dd'],
    frameworks: ['general', 'medtech'],
    active: true,
    priority: 11
  },

  // Compliance Modules (MedTech specific)
  {
    id: 'regulatory-compliance',
    title: 'Regulatory Compliance Review',
    description: 'FDA and regulatory compliance assessment',
    category: 'compliance',
    requiredRole: ['admin', 'reviewer'],
    reportTypes: ['dd'],
    frameworks: ['medtech'],
    active: true,
    priority: 12
  },
  {
    id: 'clinical-pathway',
    title: 'Clinical Pathway Analysis',
    description: 'Clinical trial and pathway assessment',
    category: 'compliance',
    requiredRole: ['admin', 'reviewer'],
    reportTypes: ['dd'],
    frameworks: ['medtech'],
    active: true,
    priority: 13
  }
];

// Preset configurations
const presetConfigurations = {
  'triage-standard': ['quick-summary', 'tca-scorecard', 'risk-flags'],
  'triage-admin': ['quick-summary', 'executive-summary', 'tca-scorecard', 'risk-flags', 'macro-trend-alignment'],
  'dd-general': ['quick-summary', 'executive-summary', 'tca-scorecard', 'risk-flags', 'macro-trend-alignment', 'benchmark-comparison', 'growth-classifier', 'gap-analysis', 'team-assessment', 'funder-fit-analysis', 'strategic-fit-matrix'],
  'dd-medtech': ['quick-summary', 'executive-summary', 'tca-scorecard', 'risk-flags', 'macro-trend-alignment', 'benchmark-comparison', 'growth-classifier', 'gap-analysis', 'team-assessment', 'funder-fit-analysis', 'strategic-fit-matrix', 'regulatory-compliance', 'clinical-pathway']
};

export default function ModuleConfiguration({
  role = 'user',
  reportType = 'triage',
  framework,
  onConfigurationChange
}: ModuleConfigurationProps) {
  const { toast } = useToast();
  const [modules, setModules] = React.useState<ModuleConfig[]>(defaultModules);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('current');

  // Filter modules based on current context
  const getFilteredModules = () => {
    return modules.filter((module: ModuleConfig) =>
      module.requiredRole.includes(role) &&
      module.reportTypes.includes(reportType) &&
      module.frameworks.includes(framework)
    );
  };

  // Group modules by category
  const groupedModules = () => {
    const filtered = getFilteredModules();
    const grouped = filtered.reduce((acc: Record<string, ModuleConfig[]>, module: ModuleConfig) => {
      if (!acc[module.category]) {
        acc[module.category] = [];
      }
      acc[module.category].push(module);
      return acc;
    }, {} as Record<string, ModuleConfig[]>);

    // Sort modules within each category by priority
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a: ModuleConfig, b: ModuleConfig) => a.priority - b.priority);
    });

    return grouped;
  };

  // Load saved configuration
  React.useEffect(() => {
    const loadConfiguration = () => {
      const configKey = getConfigKey();
      const savedConfig = localStorage.getItem(configKey);

      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          const updatedModules = modules.map((module: ModuleConfig) => {
            const savedModule = parsedConfig.find((saved: any) => saved.id === module.id);
            return savedModule ? { ...module, active: savedModule.active } : module;
          });
          setModules(updatedModules);
        } catch (error) {
          console.error('Error loading configuration:', error);
          loadPreset();
        }
      } else {
        loadPreset();
      }
    };

    loadConfiguration();
  }, [role, reportType, framework]);

  // Get configuration key based on context
  const getConfigKey = () => {
    const isPrivileged = role === 'admin' || role === 'reviewer';

    if (reportType === 'triage') {
      return isPrivileged ? 'report-config-triage-admin' : 'report-config-triage-standard';
    } else {
      return `report-config-dd-${framework}`;
    }
  };

  // Load preset configuration
  const loadPreset = () => {
    const isPrivileged = role === 'admin' || role === 'reviewer';
    let presetKey = '';

    if (reportType === 'triage') {
      presetKey = isPrivileged ? 'triage-admin' : 'triage-standard';
    } else {
      presetKey = `dd-${framework}`;
    }

    const presetModules = presetConfigurations[presetKey as keyof typeof presetConfigurations] || [];

    const updatedModules = modules.map((module: ModuleConfig) => ({
      ...module,
      active: presetModules.includes(module.id)
    }));

    setModules(updatedModules);
    setHasChanges(true);
  };

  // Toggle module activation
  const toggleModule = (moduleId: string) => {
    const updatedModules = modules.map((module: ModuleConfig) =>
      module.id === moduleId ? { ...module, active: !module.active } : module
    );
    setModules(updatedModules);
    setHasChanges(true);
  };

  // Save configuration
  const saveConfiguration = () => {
    const configKey = getConfigKey();
    const filteredModules = getFilteredModules();
    const configToSave = filteredModules.map((module: ModuleConfig) => ({
      id: module.id,
      title: module.title,
      active: module.active
    }));

    localStorage.setItem(configKey, JSON.stringify(configToSave));
    setHasChanges(false);

    toast({
      title: 'Configuration Saved',
      description: `Report configuration updated for ${reportType} reports.`,
    });

    // Notify parent component
    if (onConfigurationChange) {
      onConfigurationChange(filteredModules.filter((m: ModuleConfig) => m.active));
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    loadPreset();
    toast({
      title: 'Configuration Reset',
      description: 'Configuration restored to recommended defaults.',
    });
  };

  // Get category icon and label
  const getCategoryInfo = (category: string) => {
    const categoryMap = {
      core: { icon: CheckCircle, label: 'Core Modules', color: 'text-green-600' },
      analysis: { icon: AlertTriangle, label: 'Analysis Modules', color: 'text-blue-600' },
      strategic: { icon: Settings, label: 'Strategic Modules', color: 'text-purple-600' },
      compliance: { icon: Shield, label: 'Compliance Modules', color: 'text-red-600' }
    };
    return categoryMap[category as keyof typeof categoryMap] || { icon: Info, label: category, color: 'text-gray-600' };
  };

  // Get active module count
  const getActiveCount = () => {
    return getFilteredModules().filter((module: ModuleConfig) => module.active).length;
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'reviewer': return <Eye className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Analysis Module Configuration
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {getRoleIcon()}
              <span>Role: {role}</span>
            </div>
            <div>Report Type: {reportType}</div>
            <div>Framework: {framework}</div>
            <Badge variant="outline">
              {getActiveCount()} modules active
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Current Configuration</TabsTrigger>
              <TabsTrigger value="preset">Load Preset</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Configure which analysis modules to include in your reports.
                  Changes are saved per report type and user role.
                </AlertDescription>
              </Alert>

              {(Object.entries(groupedModules()) as [string, ModuleConfig[]][]).map(([category, categoryModules]) => {
                const categoryInfo = getCategoryInfo(category);
                const CategoryIcon = categoryInfo.icon;

                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className={`h-5 w-5 ${categoryInfo.color}`} />
                      <h3 className="text-lg font-semibold">{categoryInfo.label}</h3>
                      <Badge variant="secondary">
                        {categoryModules.filter((m: ModuleConfig) => m.active).length}/{categoryModules.length}
                      </Badge>
                    </div>

                    <div className="grid gap-3">
                      {categoryModules.map((module: ModuleConfig) => (
                        <div key={module.id}
                          className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{module.title}</h4>
                              {module.active && (
                                <Badge variant="default" className="text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {module.description}
                            </p>
                          </div>
                          <Switch
                            checked={module.active}
                            onCheckedChange={() => toggleModule(module.id)}
                          />
                        </div>
                      ))}
                    </div>

                    {category !== 'compliance' && <Separator />}
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="preset" className="space-y-6">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Load recommended configurations based on your role and report type.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Recommended Configuration</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Based on your current role ({role}) and report type ({reportType})
                    </p>
                    <Button onClick={loadPreset} className="w-full">
                      Load Recommended Configuration
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>

            <Button
              onClick={saveConfiguration}
              disabled={!hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}