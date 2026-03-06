'use client';
import { useState, useEffect } from 'react';
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
import { ArrowLeft, Calculator, Check, Eye, Lock, Play, SkipForward, SlidersHorizontal, ToggleLeft, ToggleRight, FileText } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { runAnalysis } from '@/app/analysis/actions';

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
}

// Module definitions with metadata
const MODULE_DEFINITIONS: Record<string, { name: string; description: string }> = {
  tca: { name: 'TCA Scorecard', description: 'Core technology capability assessment' },
  risk: { name: 'Risk Assessment', description: 'Risk factors and mitigation analysis' },
  macro: { name: 'Macro Trend Analysis', description: 'PESTEL framework analysis' },
  benchmark: { name: 'Benchmark Comparison', description: 'Industry benchmark overlay' },
  growth: { name: 'Growth Classification', description: 'Growth trajectory analysis' },
  gap: { name: 'Gap Analysis', description: 'Capability gap heatmap' },
  founderFit: { name: 'Founder Fit Analysis', description: 'Funding readiness assessment' },
  team: { name: 'Team Assessment', description: 'Team effectiveness evaluation' },
  strategicFit: { name: 'Strategic Fit Matrix', description: 'Strategic alignment scoring' },
};

const EditableScoreTable = ({
  title,
  data,
  onScoreChange,
  moduleConfig,
  onToggleEnabled,
  onToggleSimulated,
  isAdmin
}: {
  title: string,
  data: ScoreRow[],
  onScoreChange: (id: string, newScore: number) => void,
  moduleConfig?: ModuleConfig,
  onToggleEnabled?: (enabled: boolean) => void,
  onToggleSimulated?: (simulated: boolean) => void,
  isAdmin?: boolean
}) => {
  const isDisabled = moduleConfig && !moduleConfig.enabled;

  return (
    <Card className={cn(
      "transition-all duration-200",
      isDisabled && "opacity-50 bg-muted/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <SlidersHorizontal className="text-primary size-5" />
            {title}
          </CardTitle>
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
  onToggleSimulated
}: {
  modules: string[],
  activeModule: string,
  onSelectModule: (id: string) => void,
  moduleConfigs: Record<string, ModuleConfig>,
  isAdmin: boolean,
  onToggleEnabled: (id: string, enabled: boolean) => void,
  onToggleSimulated: (id: string, simulated: boolean) => void
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">MODULES</h3>
      {modules.map((moduleId, index) => {
        const config = moduleConfigs[moduleId];
        const def = MODULE_DEFINITIONS[moduleId];
        const isActive = activeModule === moduleId;
        const isEnabled = config?.enabled ?? true;

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
              <span className="truncate text-sm font-medium">{def?.name || moduleId}</span>
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

const SummaryCard = ({ scores, moduleConfigs, enabledCount, totalCount }: {
  scores: number[],
  moduleConfigs: Record<string, ModuleConfig>,
  enabledCount: number,
  totalCount: number
}) => {
  const sum = scores.reduce((a, b) => a + b, 0);
  const average = scores.length > 0 ? sum / scores.length : 0;
  const stdDev = scores.length > 0 ? Math.sqrt(scores.map(x => Math.pow(x - average, 2)).reduce((a, b) => a + b) / scores.length) : 0;
  const simulatedCount = Object.values(moduleConfigs).filter(m => m.enabled && m.simulated).length;
  const skippedCount = Object.values(moduleConfigs).filter(m => !m.enabled).length;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calculator /> What-If Summary</CardTitle>
        <CardDescription>Scores update in real-time as you edit.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
          <p className="font-medium">Composite Score</p>
          <p className="text-2xl font-bold text-primary">{average.toFixed(2)}/10</p>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <p className="font-medium">Average Score</p>
          <p className="text-xl font-bold">{average.toFixed(2)}</p>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <p className="font-medium">Standard Deviation</p>
          <p className="text-xl font-bold">{stdDev.toFixed(2)}</p>
        </div>
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

export default function WhatIfAnalysisPage() {
  const [analysisData, setAnalysisData] = useState<ComprehensiveAnalysisOutput | null>(null);
  const [editableScores, setEditableScores] = useState<Record<string, ScoreRow[]>>({});
  const [moduleConfigs, setModuleConfigs] = useState<Record<string, ModuleConfig>>({});
  const [activeModule, setActiveModule] = useState<string>('tca');
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  // Check if user is admin
  useEffect(() => {
    const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    setIsAdmin(userRole === 'admin' || userRole === 'Admin');
  }, []);

  useEffect(() => {
    const loadAnalysisData = async () => {
      try {
        setIsLoading(true);

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
              description: 'Unable to load analysis data. Please run a new analysis first.',
              variant: 'destructive'
            });
            router.push('/analysis');
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
              description: 'TCA scorecard data is missing. Please run a new analysis.',
              variant: 'destructive'
            });
            router.push('/analysis');
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
          Object.keys(initialScores).forEach((moduleId) => {
            const def = MODULE_DEFINITIONS[moduleId] || { name: moduleId, description: '' };
            configs[moduleId] = {
              id: moduleId,
              name: def.name,
              description: def.description,
              enabled: true,
              simulated: true, // Default to simulating all modules
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
            description: 'Please run an analysis first to use What-If scenarios.',
            variant: 'destructive'
          });
          router.push('/analysis');
        }

      } catch (error) {
        console.error('Error loading analysis data:', error);
        toast({
          title: 'Data Loading Error',
          description: 'Failed to load analysis data. Please try running a new analysis.',
          variant: 'destructive'
        });
        router.push('/analysis');
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

  // Toggle module enabled/skipped state (admin only)
  const handleToggleEnabled = (moduleId: string, enabled: boolean) => {
    setModuleConfigs(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], enabled }
    }));
  };

  // Toggle module simulated state (admin only)
  const handleToggleSimulated = (moduleId: string, simulated: boolean) => {
    setModuleConfigs(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], simulated }
    }));
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
        const newCompositeScore = updatedData.tcaData.categories.reduce((sum, c) => sum + (c.rawScore * (c.weight / 100)), 0) * 10;
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

      // Calculate overall composite score from all modules
      const allModuleScores = Object.values(editableScores).flat().map(s => s.score);
      const overallScore = allModuleScores.length > 0 ? allModuleScores.reduce((a, b) => a + b, 0) / allModuleScores.length : 0;

      // Add what-if metadata for triage report generation
      const finalData = {
        ...updatedData,
        whatIfAnalysis: {
          adjustedScores: editableScores,
          overallCompositeScore: overallScore,
          timestamp: new Date().toISOString(),
          modulesAnalyzed: Object.keys(editableScores).length,
          locked: true
        }
      };

      // Save to localStorage
      localStorage.setItem('analysisResult', JSON.stringify(finalData));
      localStorage.setItem('whatIfAdjusted', 'true');
      localStorage.setItem('triageReportReady', 'true');

      toast({
        title: '✅ Scores Locked Successfully',
        description: `All ${Object.keys(editableScores).length} modules adjusted. Composite: ${overallScore.toFixed(2)}/10. Generating triage report...`,
      });

      // Redirect to result page to show the triage report
      setTimeout(() => {
        router.push('/analysis/result');
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
    // Skip what-if analysis and proceed directly with original scores
    localStorage.setItem('whatIfAdjusted', 'false');
    localStorage.setItem('triageReportReady', 'true');

    toast({
      title: 'What-If Skipped',
      description: 'Proceeding with original analysis scores.',
    });

    router.push('/analysis/result');
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
                What-If Analysis
              </h1>
              <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
                Adjust scores from {moduleCount} active modules to simulate outcomes before generating your triage report.
              </p>
            </div>
            <div className="flex gap-3 items-center">
              {/* Admin Toggle */}
              <div className="flex items-center gap-2 mr-4 px-3 py-2 bg-muted rounded-lg">
                <label className="text-sm font-medium">Admin Mode</label>
                <Switch checked={isAdmin} onCheckedChange={setIsAdmin} />
              </div>
              <Button variant="outline" size="lg" onClick={handleSkip} disabled={isLoading}>
                <SkipForward className="mr-2" /> Skip What-If
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
            />
          </div>
        </div>
      </div>
      <AlertDialog open={showWelcome} onOpenChange={setShowWelcome}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Eye /> Welcome to What-If Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              This page displays all {moduleCount} analysis modules that were run. You can manually adjust any scores to simulate different scenarios.
              {isAdmin && " As an admin, you can skip modules or toggle simulation mode."}
              When ready, click "Generate Report" to finalize your analysis and view the comprehensive triage report.
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
