'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';
import Loading from '@/app/loading';
import { ArrowLeft, Calculator, Check, Eye, Lock, Play, SkipForward, SlidersHorizontal, ToggleLeft, ToggleRight, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { runAnalysis } from '@/app/analysis/actions';
import { settingsApi, SettingsVersion, MODULE_DEFINITIONS as API_MODULE_DEFS } from '@/lib/settings-api';
import { unifiedRecordTracking, generateSimulationId } from '@/lib/unified-record-tracking';

interface ScoreRow {
  id: string;
  category: string;
  score: number;
}

interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  simulated: boolean;
  weight?: number;
}

// Default module definitions (used as fallback)
const MODULE_DEFINITIONS: Record<string, { name: string; description: string; weight: number }> = {
  tca: { name: 'TCA Scorecard', description: 'Core technology capability assessment', weight: 15 },
  risk: { name: 'Risk Assessment', description: 'Risk factors and mitigation analysis', weight: 13 },
  macro: { name: 'Macro Trend Analysis', description: 'PESTEL framework analysis', weight: 12 },
  benchmark: { name: 'Benchmark Comparison', description: 'Industry benchmark overlay', weight: 12 },
  growth: { name: 'Growth Classification', description: 'Growth trajectory analysis', weight: 12 },
  gap: { name: 'Gap Analysis', description: 'Capability gap heatmap', weight: 11 },
  founderFit: { name: 'Founder Fit Analysis', description: 'Funding readiness assessment', weight: 12 },
  team: { name: 'Team Assessment', description: 'Team effectiveness evaluation', weight: 13 },
  strategicFit: { name: 'Strategic Fit Matrix', description: 'Strategic alignment scoring', weight: 0 },
};

const EditableScoreTable = ({
  title,
  data,
  onScoreChange,
  moduleConfig,
  onToggleEnabled,
  onToggleSimulated,
  isAdmin,
  moduleId
}: {
  title: string,
  data: ScoreRow[],
  onScoreChange: (id: string, newScore: number) => void,
  moduleConfig?: ModuleConfig,
  onToggleEnabled?: (enabled: boolean) => void,
  onToggleSimulated?: (simulated: boolean) => void,
  isAdmin?: boolean,
  moduleId?: string
}) => {
  const isDisabled = moduleConfig && !moduleConfig.enabled;
  const moduleWeight = moduleId ? MODULE_DEFINITIONS[moduleId]?.weight : undefined;
  const moduleAvg = data.length > 0 ? data.reduce((sum, r) => sum + r.score, 0) / data.length : 0;

  return (
    <Card className={cn(
      "transition-all duration-200",
      isDisabled && "opacity-50 bg-muted/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <SlidersHorizontal className="text-primary size-5" />
              {title}
            </CardTitle>
            {moduleWeight && (
              <Badge variant="outline" className="ml-2">Weight: {moduleWeight}%</Badge>
            )}
          </div>
          {isAdmin && moduleConfig && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Skip</span>
                <Switch
                  checked={!moduleConfig.enabled}
                  onCheckedChange={(checked) => onToggleEnabled?.(!checked)}
                  className="data-[state=checked]:bg-orange-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Simulate</span>
                <Switch
                  checked={moduleConfig.simulated}
                  onCheckedChange={(checked) => onToggleSimulated?.(checked)}
                  disabled={!moduleConfig.enabled}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              {!moduleConfig.enabled && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">Skipped</Badge>
              )}
              {moduleConfig.enabled && moduleConfig.simulated && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">Simulating</Badge>
              )}
            </div>
          )}
        </div>
        {moduleConfig && (
          <p className="text-sm text-muted-foreground">{moduleConfig.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="w-[120px] text-right">Score (0-10)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id} className={isDisabled ? "opacity-60" : ""}>
                <TableCell className="font-medium">{row.category}</TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    value={row.score}
                    onChange={(e) => onScoreChange(row.id, parseFloat(e.target.value))}
                    min="0"
                    max="10"
                    step="0.1"
                    className="h-8 text-right"
                    disabled={isDisabled}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Vertical Module Tab Navigation
const ModuleTabNav = ({
  modules,
  activeModule,
  onSelectModule,
  moduleConfigs,
  isAdmin,
  onToggleEnabled,
  onToggleSimulated,
  editableScores
}: {
  modules: string[],
  activeModule: string,
  onSelectModule: (id: string) => void,
  moduleConfigs: Record<string, ModuleConfig>,
  isAdmin: boolean,
  onToggleEnabled: (id: string, enabled: boolean) => void,
  onToggleSimulated: (id: string, simulated: boolean) => void,
  editableScores: Record<string, ScoreRow[]>
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">MODULES (Total Weight: 100%)</h3>
      {modules.map((moduleId, index) => {
        const config = moduleConfigs[moduleId];
        const def = MODULE_DEFINITIONS[moduleId];
        const isActive = activeModule === moduleId;
        const isEnabled = config?.enabled ?? true;
        const moduleScores = editableScores[moduleId] || [];
        const moduleAvg = moduleScores.length > 0 ? moduleScores.reduce((sum, r) => sum + r.score, 0) / moduleScores.length : 0;

        return (
          <button
            key={moduleId}
            onClick={() => onSelectModule(moduleId)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg transition-all duration-150",
              "flex items-center justify-between gap-2",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted/80",
              !isEnabled && "opacity-50"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium",
                isActive ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
              )}>
                {index + 1}
              </span>
              <div className="min-w-0">
                <span className="truncate text-sm font-medium block">{def?.name || moduleId}</span>
                <span className={cn(
                  "text-xs",
                  isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {def?.weight}% • Avg: {moduleAvg.toFixed(1)}
                </span>
              </div>
            </div>
            {!isEnabled && (
              <SkipForward className="size-4 text-orange-500 flex-shrink-0" />
            )}
            {isEnabled && config?.simulated && (
              <Play className="size-4 text-green-500 flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
};

const SummaryCard = ({ scores, moduleConfigs, enabledCount, totalCount, editableScores, simulationHistory }: {
  scores: number[],
  moduleConfigs: Record<string, ModuleConfig>,
  enabledCount: number,
  totalCount: number,
  editableScores: Record<string, ScoreRow[]>,
  simulationHistory: number[]
}) => {
  // Calculate weighted average based on module weights
  let totalWeightedScore = 0;
  let totalWeight = 0;

  Object.entries(editableScores).forEach(([moduleId, rows]) => {
    const config = moduleConfigs[moduleId];
    if (config?.enabled) {
      const moduleWeight = MODULE_DEFINITIONS[moduleId]?.weight || 10;
      const moduleAvg = rows.length > 0 ? rows.reduce((sum, r) => sum + r.score, 0) / rows.length : 0;
      totalWeightedScore += moduleAvg * moduleWeight;
      totalWeight += moduleWeight;
    }
  });

  const weightedAverage = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

  // Simple average for comparison
  const enabledScores = Object.entries(editableScores)
    .filter(([moduleId]) => moduleConfigs[moduleId]?.enabled)
    .flatMap(([_, rows]) => rows.map(r => r.score));
  const simpleAverage = enabledScores.length > 0 ? enabledScores.reduce((a, b) => a + b, 0) / enabledScores.length : 0;
  const stdDev = enabledScores.length > 0 ? Math.sqrt(enabledScores.map(x => Math.pow(x - simpleAverage, 2)).reduce((a, b) => a + b, 0) / enabledScores.length) : 0;

  const simulatedCount = Object.values(moduleConfigs).filter(m => m.enabled && m.simulated).length;
  const skippedCount = Object.values(moduleConfigs).filter(m => !m.enabled).length;

  // Calculate 30-run average from simulation history
  const runCount = simulationHistory.length;
  const avgOverRuns = runCount > 0 ? simulationHistory.reduce((a, b) => a + b, 0) / runCount : weightedAverage;

  // Calculate individual module scores
  const moduleScores: Record<string, number> = {};
  Object.entries(editableScores).forEach(([moduleId, rows]) => {
    const config = moduleConfigs[moduleId];
    if (config?.enabled && rows.length > 0) {
      moduleScores[moduleId] = rows.reduce((sum, r) => sum + r.score, 0) / rows.length;
    }
  });

  // TCA Score is the primary outcome for simulation
  const tcaScore = moduleScores['tca'] || 0;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calculator /> Simulation Summary</CardTitle>
        <CardDescription>Module scores calculated separately.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* TCA Score - Primary Outcome */}
        <div className="p-4 rounded-lg bg-primary/15 border-2 border-primary">
          <p className="text-sm font-medium text-primary mb-1">TCA Score (Primary)</p>
          <p className="text-3xl font-bold text-primary">{tcaScore.toFixed(2)}/10</p>
          <p className="text-xs text-muted-foreground mt-1">12 Categories Assessment</p>
        </div>

        {/* Individual Module Scores */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Module Scores</p>
          {Object.entries(moduleScores).filter(([id]) => id !== 'tca').map(([moduleId, score]) => (
            <div key={moduleId} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <p className="text-sm">{MODULE_DEFINITIONS[moduleId]?.name || moduleId}</p>
              <Badge variant="outline" className="font-mono">{score.toFixed(2)}</Badge>
            </div>
          ))}
        </div>

        <hr className="my-2" />

        {/* Weighted Score for comparison */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
          <p className="text-sm">Weighted Average</p>
          <p className="font-bold">{weightedAverage.toFixed(2)}/10</p>
        </div>

        {runCount > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
            <div>
              <p className="font-medium text-green-700">Avg over {runCount} Runs</p>
              <p className="text-xs text-green-600">Simulation history</p>
            </div>
            <p className="text-xl font-bold text-green-700">{avgOverRuns.toFixed(2)}</p>
          </div>
        )}

        <hr className="my-2" />
        <div className="flex items-center justify-between p-2">
          <p className="text-sm text-muted-foreground">Active Modules</p>
          <Badge variant="outline">{enabledCount} / {totalCount}</Badge>
        </div>
        <div className="flex items-center justify-between p-2">
          <p className="text-sm text-muted-foreground">Simulating</p>
          <Badge className="bg-green-100 text-green-700">{simulatedCount}</Badge>
        </div>
        <div className="flex items-center justify-between p-2">
          <p className="text-sm text-muted-foreground">Skipped</p>
          <Badge className="bg-orange-100 text-orange-700">{skippedCount}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default function SimulationPage() {
  const [analysisData, setAnalysisData] = useState<ComprehensiveAnalysisOutput | null>(null);
  const [editableScores, setEditableScores] = useState<Record<string, ScoreRow[]>>({});
  const [moduleConfigs, setModuleConfigs] = useState<Record<string, ModuleConfig>>({});
  const [activeModule, setActiveModule] = useState<string>('tca');
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [simulationHistory, setSimulationHistory] = useState<number[]>([]);

  // Settings version state
  const [settingsVersions, setSettingsVersions] = useState<SettingsVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<SettingsVersion | null>(null);
  const [moduleWeights, setModuleWeights] = useState<Record<string, number>>({});

  const router = useRouter();
  const { toast } = useToast();

  // Load settings versions
  const loadSettingsVersions = useCallback(async () => {
    try {
      const versions = await settingsApi.getVersions(false);
      setSettingsVersions(versions);

      // Try to get active version
      const activeVersion = await settingsApi.getActiveVersion();
      if (activeVersion) {
        setSelectedVersion(activeVersion);
        // Set module weights from the selected version
        const weights: Record<string, number> = {};
        activeVersion.module_settings?.forEach(ms => {
          weights[ms.module_id] = ms.weight;
        });
        setModuleWeights(weights);
      }
    } catch (error) {
      console.log('Using local module weights (API unavailable):', error);
      // Use default weights from MODULE_DEFINITIONS
      const weights: Record<string, number> = {};
      Object.entries(MODULE_DEFINITIONS).forEach(([id, def]) => {
        weights[id] = def.weight;
      });
      setModuleWeights(weights);
    }
  }, []);

  // Check if user is admin
  useEffect(() => {
    const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    setIsAdmin(userRole === 'admin' || userRole === 'Admin');
  }, []);

  // Load settings versions on mount
  useEffect(() => {
    loadSettingsVersions();
  }, [loadSettingsVersions]);

  useEffect(() => {
    const loadAnalysisData = async () => {
      try {
        setIsLoading(true);

        // Validate that stored analysis belongs to current evaluation
        const storedEvalId = localStorage.getItem('currentEvaluationId');
        const urlParams = new URLSearchParams(window.location.search);
        const urlEvalId = urlParams.get('evalId');

        // If URL has an evalId that doesn't match stored data, clear stale data
        if (urlEvalId && storedEvalId && urlEvalId !== storedEvalId) {
          console.log('Clearing stale analysis data - URL evalId:', urlEvalId, 'stored:', storedEvalId);
          localStorage.removeItem('analysisResult');
          localStorage.removeItem('analysisTrackingInfo');
          localStorage.removeItem('simulationAdjusted');
          toast({
            title: 'No Analysis Data',
            description: 'No analysis data found for this evaluation. Please run analysis first.',
            variant: 'destructive'
          });
          router.push('/dashboard/evaluation');
          return;
        }

        // First, check if we have stored analysis data
        const storedData = localStorage.getItem('analysisResult');
        let data: ComprehensiveAnalysisOutput | null = null;

        if (storedData) {
          try {
            data = JSON.parse(storedData);
            console.log('Found stored analysis data:', data);
          } catch (e) {
            console.warn('Failed to parse stored analysis data:', e);
          }
        }

        // If no valid stored data or TCA data is missing, try to fetch fresh analysis
        if (!data || !data.tcaData?.categories || data.tcaData.categories.length === 0) {
          console.log('No valid TCA data found, fetching fresh analysis...');

          try {
            // Use default company data or fetch from session storage
            const companySessionData = sessionStorage.getItem('companyData');
            const userData = companySessionData ? JSON.parse(companySessionData) : {
              companyName: 'TechCorp Solutions',
              companyDescription: 'SaaS technology startup with proven revenue model',
              sector: 'technology',
              team_size: 12,
              monthly_revenue: 85000,
              monthly_burn: 65000,
              cash_balance: 800000,
              market_size: 5000000000,
              founder_experience: true,
              technical_team: true,
              customer_validation: true,
              revenue_traction: true,
              patents: false,
              technical_innovation: true
            };

            console.log('Fetching fresh analysis with data:', userData);
            data = await runAnalysis('general', userData);

            // Store the fresh data
            localStorage.setItem('analysisResult', JSON.stringify(data));
            console.log('Fresh analysis data fetched and stored:', data);

          } catch (error) {
            console.error('Failed to fetch fresh analysis:', error);
            toast({
              title: 'Analysis Required',
              description: 'Unable to load analysis data. Please run a new analysis from the evaluation page.',
              variant: 'destructive'
            });
            router.push('/dashboard/evaluation');
            return;
          }
        }

        if (data) {
          setAnalysisData(data);

          const initialScores: Record<string, ScoreRow[]> = {};

          // Module 1: TCA Scorecard - Use REAL data from analysis
          if (data.tcaData?.categories && data.tcaData.categories.length > 0) {
            initialScores['tca'] = data.tcaData.categories.map(c => ({
              id: c.category,
              category: c.category,
              score: c.rawScore || 5.0
            }));
            console.log(`Loaded ${initialScores.tca.length} TCA categories with real scores`);
          } else {
            console.error('No TCA categories found in analysis data');
            toast({
              title: 'Invalid Analysis Data',
              description: 'TCA scorecard data is missing. Please run a new analysis from evaluation.',
              variant: 'destructive'
            });
            router.push('/dashboard/evaluation');
            return;
          }

          // Module 2: Risk Assessment - Use REAL risk data
          if (data.riskData?.riskFlags && data.riskData.riskFlags.length > 0) {
            initialScores['risk'] = data.riskData.riskFlags.map((r, index) => ({
              id: r.domain || `risk_${index}`,
              category: r.domain || `Risk ${index + 1}`,
              score: r.flag === 'green' ? 8 : r.flag === 'yellow' ? 6 : 4
            }));
            console.log(`Loaded ${initialScores.risk.length} risk factors`);
          } else {
            // Generate calculated risk assessment based on TCA scores
            const avgTcaScore = initialScores.tca.reduce((sum, cat) => sum + cat.score, 0) / initialScores.tca.length;
            const riskScore = avgTcaScore >= 8 ? 8 : avgTcaScore >= 6.5 ? 6 : 4;
            initialScores['risk'] = [
              { id: 'calculated-risk', category: 'Calculated Risk Level', score: riskScore }
            ];
          }

          // Module 3: Macro Trend Analysis - Calculate from TCA base
          if (data.macroData?.pestelDashboard) {
            initialScores['macro'] = Object.entries(data.macroData.pestelDashboard).map(([k, v]) => ({
              id: k,
              category: k.charAt(0).toUpperCase() + k.slice(1),
              score: typeof v === 'number' ? v : 7.0
            }));
          } else {
            // Calculate macro trends based on TCA composite score
            const baseScore = Math.min((data.tcaData?.compositeScore || 50) / 10, 10);
            initialScores['macro'] = [
              { id: 'political', category: 'Political', score: Math.max(0, baseScore * 0.9) },
              { id: 'economic', category: 'Economic', score: Math.max(0, baseScore * 0.85) },
              { id: 'social', category: 'Social', score: Math.max(0, baseScore * 1.1) },
              { id: 'technological', category: 'Technological', score: Math.max(0, baseScore * 1.15) },
              { id: 'environmental', category: 'Environmental', score: Math.max(0, baseScore) },
              { id: 'legal', category: 'Legal', score: Math.max(0, baseScore * 0.95) }
            ];
          }

          // Additional modules based on available analysis data
          if (data.benchmarkData && Object.keys(data.benchmarkData).length > 0) {
            const benchmarkEntries = Object.entries(data.benchmarkData);
            if (benchmarkEntries.length > 0) {
              initialScores['benchmark'] = benchmarkEntries.map(([k, v]) => ({
                id: k,
                category: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                score: typeof v === 'number' ? Math.min(Math.max(v, 0), 10) : 7.0
              }));
            }
          }

          // Note: growthData schema is empty, skip growth module

          if (data.gapData?.heatmap) {
            initialScores['gap'] = data.gapData.heatmap.map(g => ({
              id: g.category,
              category: g.category,
              score: Math.max(0, 10 - (g.gap / 5))
            }));
          }

          if (data.founderFitData?.readinessScore) {
            initialScores['founderFit'] = [
              { id: 'funding-readiness', category: 'Funding Readiness', score: data.founderFitData.readinessScore / 10 }
            ];
          }

          if (data.teamData?.members && data.teamData.members.length > 0) {
            // Calculate team score based on team size and experience levels
            const teamSize = data.teamData.members.length;
            const experienceLevels = data.teamData.members.map(member => {
              const exp = member.experience.toLowerCase();
              if (exp.includes('senior') || exp.includes('lead')) return 3;
              if (exp.includes('mid') || exp.includes('intermediate')) return 2;
              return 1;
            });
            const avgExperience = experienceLevels.reduce((sum, exp) => sum + exp, 0) / experienceLevels.length;
            const teamScore = Math.min(10, (teamSize * 0.5 + avgExperience * 2.5));

            initialScores['team'] = [
              { id: 'team-effectiveness', category: 'Team Assessment', score: teamScore }
            ];
          }

          // Initialize module configs for all modules
          const configs: Record<string, ModuleConfig> = {};
          
          // Try to load saved configs from localStorage
          let savedConfigs: Record<string, ModuleConfig> = {};
          try {
            const savedConfigStr = localStorage.getItem('moduleConfigs');
            if (savedConfigStr) {
              savedConfigs = JSON.parse(savedConfigStr);
              console.log('Loaded saved module configs:', savedConfigs);
            }
          } catch (e) {
            console.warn('Failed to parse saved module configs:', e);
          }
          
          Object.keys(initialScores).forEach((moduleId) => {
            const def = MODULE_DEFINITIONS[moduleId] || { name: moduleId, description: '' };
            // Use saved config if available, otherwise default values
            const savedConfig = savedConfigs[moduleId];
            configs[moduleId] = {
              id: moduleId,
              name: def.name,
              description: def.description,
              enabled: savedConfig?.enabled ?? true,
              simulated: savedConfig?.simulated ?? true, // Default to simulating all modules
            };
          });

          // Set the scores, configs, and show the analysis
          setEditableScores(initialScores);
          setModuleConfigs(configs);
          setActiveModule(Object.keys(initialScores)[0] || 'tca');
          setShowWelcome(false);
          console.log('Analysis data loaded successfully with', Object.keys(initialScores).length, 'modules');
        } else {
          console.error('No analysis data available');
          toast({
            title: 'No Analysis Data',
            description: 'Please run an analysis first from the evaluation page.',
            variant: 'destructive'
          });
          router.push('/dashboard/evaluation');
        }

      } catch (error) {
        console.error('Error loading analysis data:', error);
        toast({
          title: 'Data Loading Error',
          description: 'Failed to load analysis data. Please start a new analysis.',
          variant: 'destructive'
        });
        router.push('/dashboard/evaluation');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalysisData();
  }, [router, toast]);

  const handleScoreChange = (moduleId: string, rowId: string, newScore: number) => {
    setEditableScores(prev => ({
      ...prev,
      [moduleId]: prev[moduleId].map(row => row.id === rowId ? { ...row, score: newScore } : row)
    }));
  };

  // Toggle module enabled/skipped state (admin only) - persists to localStorage
  const handleToggleEnabled = (moduleId: string, enabled: boolean) => {
    setModuleConfigs(prev => {
      const updated = {
        ...prev,
        [moduleId]: { ...prev[moduleId], enabled }
      };
      // Persist module configs to localStorage
      localStorage.setItem('moduleConfigs', JSON.stringify(updated));
      return updated;
    });
  };

  // Toggle module simulated state (admin only) - persists to localStorage
  const handleToggleSimulated = (moduleId: string, simulated: boolean) => {
    setModuleConfigs(prev => {
      const updated = {
        ...prev,
        [moduleId]: { ...prev[moduleId], simulated }
      };
      // Persist module configs to localStorage
      localStorage.setItem('moduleConfigs', JSON.stringify(updated));
      return updated;
    });
  };

  // Handle module tab selection
  const handleModuleSelect = (moduleId: string) => {
    setActiveModule(moduleId);
  };

  const handleProceed = async () => {
    if (!analysisData) return;

    setIsLoading(true);

    try {
      // Update all module scores with adjusted values
      const updatedData = { ...analysisData };

      // Update TCA scores
      if (updatedData.tcaData && editableScores.tca) {
        updatedData.tcaData.categories = updatedData.tcaData.categories.map(cat => {
          const newScore = editableScores.tca.find(s => s.id === cat.category)?.score;
          return newScore !== undefined ? { ...cat, rawScore: newScore, weightedScore: newScore * (cat.weight / 100) } : cat;
        });
        // Composite score is the sum of weighted scores (rawScore * weight/100), giving 0-10 scale
        const newCompositeScore = updatedData.tcaData.categories.reduce((sum, c) => sum + (c.rawScore * (c.weight / 100)), 0);
        updatedData.tcaData.compositeScore = newCompositeScore;
      }

      // Update Risk scores
      if (updatedData.riskData && editableScores.risk) {
        updatedData.riskData.riskFlags = updatedData.riskData.riskFlags.map(flag => {
          const newScore = editableScores.risk.find(s => s.id === flag.domain)?.score;
          if (newScore !== undefined) {
            return {
              ...flag,
              flag: (newScore >= 7 ? 'green' : newScore >= 5 ? 'yellow' : 'red') as 'green' | 'yellow' | 'red'
            };
          }
          return flag;
        });
      }

      // Update Macro scores
      if (updatedData.macroData && editableScores.macro) {
        const pestelUpdates: any = {};
        editableScores.macro.forEach(item => {
          pestelUpdates[item.id] = item.score;
        });
        updatedData.macroData.pestelDashboard = { ...updatedData.macroData.pestelDashboard, ...pestelUpdates };
      }

      // Update Benchmark scores
      if (updatedData.benchmarkData && editableScores.benchmark) {
        updatedData.benchmarkData.benchmarkOverlay = updatedData.benchmarkData.benchmarkOverlay.map(item => {
          const newScore = editableScores.benchmark.find(s => s.id === item.category)?.score;
          return newScore !== undefined ? { ...item, score: newScore * 10 } : item;
        });
      }

      // Calculate individual module scores separately
      const moduleScores: Record<string, number> = {};
      Object.entries(editableScores).forEach(([moduleId, rows]) => {
        if (moduleConfigs[moduleId]?.enabled && rows.length > 0) {
          moduleScores[moduleId] = rows.reduce((sum, r) => sum + r.score, 0) / rows.length;
        }
      });

      // TCA Score is the primary outcome (calculated from 12 categories)
      const tcaScore = moduleScores['tca'] || 0;

      // Add simulation metadata for triage report generation
      const simId = generateSimulationId();
      const finalData = {
        ...updatedData,
        simulationAnalysis: {
          simulationId: simId,
          adjustedScores: editableScores,
          moduleScores: moduleScores,
          tcaScore: tcaScore,
          timestamp: new Date().toISOString(),
          modulesAnalyzed: Object.keys(editableScores).length,
          locked: true,
          settingsVersionId: selectedVersion?.id,
          settingsVersionName: selectedVersion?.version_name
        }
      };

      // Save to localStorage
      localStorage.setItem('analysisResult', JSON.stringify(finalData));
      localStorage.setItem('simulationAdjusted', 'true');
      localStorage.setItem('triageReportReady', 'true');
      localStorage.setItem('currentSimulationId', simId);

      // Update unified record with simulation results
      unifiedRecordTracking.addSimulationResults(
        {
          adjustedScores: editableScores,
          moduleScores: moduleScores,
          settingsVersionId: selectedVersion?.id
        },
        {
          tcaScore,
          modulesAnalyzed: Object.keys(editableScores).length
        }
      );

      // Save simulation run to API (if settings version is available)
      if (selectedVersion?.id) {
        try {
          // Get company name from session storage or analysis data
          const companySessionData = sessionStorage.getItem('companyData');
          let companyName = 'Unknown Company';
          if (companySessionData) {
            try {
              const parsed = JSON.parse(companySessionData);
              companyName = parsed.companyName || 'Unknown Company';
            } catch (e) {
              // ignore parse error
            }
          }

          await settingsApi.runSimulation({
            settings_version_id: selectedVersion.id,
            company_name: companyName,
            adjusted_scores: editableScores
          });
        } catch (apiError) {
          console.log('Could not save simulation to API:', apiError);
          // Continue anyway - local storage has the data
        }
      }

      toast({
        title: '✅ Simulation Complete',
        description: `TCA Score: ${tcaScore.toFixed(2)}/10. ${Object.keys(moduleScores).length} modules calculated. Generating report...`,
      });

      // Build tracking params for redirect
      const evalId = localStorage.getItem('currentEvaluationId') || '';
      const anlId = localStorage.getItem('currentAnalysisId') || '';
      // Sanitize company name - remove newlines and extra whitespace
      const rawCompanyName = localStorage.getItem('analysisCompanyName') || '';
      const companyName = rawCompanyName.replace(/[\r\n]+/g, ' ').trim();
      const trackingParams = new URLSearchParams();
      if (evalId) trackingParams.set('evalId', evalId);
      if (anlId) trackingParams.set('anlId', anlId);
      // Note: URLSearchParams.set() auto-encodes, don't double-encode!
      if (companyName) trackingParams.set('company', companyName);

      const queryString = trackingParams.toString();

      // Redirect to result page to show the triage report
      setTimeout(() => {
        router.push(`/analysis/result${queryString ? '?' + queryString : ''}`);
      }, 1500);

    } catch (error) {
      console.error('Error saving what-if analysis:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save analysis. Please try again.',
      });
      setIsLoading(false);
    }
  }

  const handleSkip = () => {
    // Skip simulation and proceed directly with original scores
    localStorage.setItem('simulationAdjusted', 'false');
    localStorage.setItem('triageReportReady', 'true');

    toast({
      title: 'Simulation Skipped',
      description: 'Proceeding with original analysis scores.',
    });

    // Build tracking params for redirect
    const evalId = localStorage.getItem('currentEvaluationId') || '';
    const anlId = localStorage.getItem('currentAnalysisId') || '';
    // Sanitize company name - remove newlines and extra whitespace
    const rawCompanyName = localStorage.getItem('analysisCompanyName') || '';
    const companyName = rawCompanyName.replace(/[\r\n]+/g, ' ').trim();
    const trackingParams = new URLSearchParams();
    if (evalId) trackingParams.set('evalId', evalId);
    if (anlId) trackingParams.set('anlId', anlId);
    // Note: URLSearchParams.set() auto-encodes, don't double-encode!
    if (companyName) trackingParams.set('company', companyName);

    const queryString = trackingParams.toString();
    router.push(`/analysis/result${queryString ? '?' + queryString : ''}`);
  }

  const allScores = Object.values(editableScores).flat().map(s => s.score);
  const moduleCount = Object.keys(editableScores).length;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8">
          <Link href="/dashboard/evaluation" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="size-4" />
            Back to Analysis Setup
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold font-headline text-primary tracking-tight">
                Simulation
              </h1>
              <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
                Adjust scores from {moduleCount} active modules. TCA score (12 categories) is the primary outcome.
              </p>
            </div>
            <div className="flex gap-3 items-center">
              {/* Settings Version Selector */}
              {settingsVersions.length > 0 && (
                <div className="flex items-center gap-2 mr-2">
                  <Settings className="size-4 text-muted-foreground" />
                  <Select
                    value={selectedVersion?.id?.toString() || ''}
                    onValueChange={async (value) => {
                      const version = await settingsApi.getVersion(parseInt(value));
                      if (version) {
                        setSelectedVersion(version);
                        const weights: Record<string, number> = {};
                        version.module_settings?.forEach(ms => {
                          weights[ms.module_id] = ms.weight;
                        });
                        setModuleWeights(weights);
                        toast({
                          title: 'Settings Version Changed',
                          description: `Now using "${version.version_name}"`,
                        });
                      }
                    }}
                  >
                    <SelectTrigger id="settings-version" className="w-[180px]">
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {settingsVersions.map(v => (
                        <SelectItem key={v.id} value={v.id.toString()}>
                          {v.version_name} {v.is_active && '(Active)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Admin Toggle */}
              <div className="flex items-center gap-2 mr-4 px-3 py-2 bg-muted rounded-lg">
                <label className="text-sm font-medium">Admin Mode</label>
                <Switch checked={isAdmin} onCheckedChange={setIsAdmin} />
              </div>
              <Button variant="outline" size="lg" onClick={handleSkip} disabled={isLoading}>
                <SkipForward className="mr-2" /> Skip Simulation
              </Button>
              <Button size="lg" onClick={handleProceed} disabled={isLoading}>
                <FileText className="mr-2" /> Generate Report
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Module Navigation */}
          <div className="col-span-3">
            <ModuleTabNav
              modules={Object.keys(editableScores)}
              moduleConfigs={moduleConfigs}
              activeModule={activeModule}
              onSelectModule={handleModuleSelect}
              isAdmin={isAdmin}
              onToggleEnabled={handleToggleEnabled}
              onToggleSimulated={handleToggleSimulated}
              editableScores={editableScores}
            />
          </div>

          {/* Center - Active Module Editor */}
          <div className="col-span-6 space-y-6">
            {activeModule && editableScores[activeModule] && moduleConfigs[activeModule]?.enabled && (
              <EditableScoreTable
                title={`${MODULE_DEFINITIONS[activeModule]?.name || activeModule}`}
                data={editableScores[activeModule]}
                onScoreChange={(id, score) => handleScoreChange(activeModule, id, score)}
                moduleConfig={moduleConfigs[activeModule]}
                isAdmin={isAdmin}
                onToggleEnabled={(enabled) => handleToggleEnabled(activeModule, enabled)}
                onToggleSimulated={(simulated) => handleToggleSimulated(activeModule, simulated)}
                moduleId={activeModule}
              />
            )}
            {activeModule && moduleConfigs[activeModule] && !moduleConfigs[activeModule].enabled && (
              <Card className="border-dashed border-2 border-muted-foreground/20">
                <CardContent className="py-12 text-center">
                  <ToggleLeft className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">Module Skipped</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {MODULE_DEFINITIONS[activeModule]?.name} is currently skipped.
                    {isAdmin && " Enable it from admin controls to include in analysis."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - Summary */}
          <div className="col-span-3">
            <SummaryCard
              scores={allScores}
              moduleConfigs={moduleConfigs}
              enabledCount={Object.values(moduleConfigs).filter(m => m.enabled).length}
              totalCount={Object.keys(moduleConfigs).length}
              editableScores={editableScores}
              simulationHistory={simulationHistory}
            />
            {/* Run Simulation Button */}
            <Button
              className="w-full mt-4"
              variant="outline"
              onClick={() => {
                // Calculate current weighted score
                let totalWeightedScore = 0;
                let totalWeight = 0;
                Object.entries(editableScores).forEach(([moduleId, rows]) => {
                  const config = moduleConfigs[moduleId];
                  if (config?.enabled) {
                    const moduleWeight = MODULE_DEFINITIONS[moduleId]?.weight || 10;
                    const moduleAvg = rows.length > 0 ? rows.reduce((sum, r) => sum + r.score, 0) / rows.length : 0;
                    totalWeightedScore += moduleAvg * moduleWeight;
                    totalWeight += moduleWeight;
                  }
                });
                const weightedAverage = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

                // Add to history (max 30 runs)
                setSimulationHistory(prev => {
                  const newHistory = [...prev, weightedAverage];
                  return newHistory.slice(-30); // Keep last 30
                });

                toast({
                  title: 'Simulation Recorded',
                  description: `Score ${weightedAverage.toFixed(2)} added to history (${Math.min(simulationHistory.length + 1, 30)}/30 runs)`,
                });
              }}
            >
              <Play className="mr-2 size-4" />
              Record Simulation ({simulationHistory.length}/30)
            </Button>
            {simulationHistory.length > 0 && (
              <Button
                className="w-full mt-2"
                variant="ghost"
                size="sm"
                onClick={() => setSimulationHistory([])}
              >
                Clear History
              </Button>
            )}
          </div>
        </div>
      </div>
      <AlertDialog open={showWelcome} onOpenChange={setShowWelcome}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Eye /> Welcome to Simulation</AlertDialogTitle>
            <AlertDialogDescription>
              This page displays all {moduleCount} analysis modules. Each module is calculated separately.
              TCA Score (12 categories) is the primary outcome for simulation.
              {isAdmin && " As an admin, you can skip modules or toggle settings."}
              When ready, click "Generate Report" to finalize your analysis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowWelcome(false)}>
              <Check className="mr-2" /> Got it, let's start!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
