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
import { ArrowLeft, Calculator, Check, Eye, Lock, SlidersHorizontal } from 'lucide-react';
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

type ScoreRow = {
  id: string;
  category: string;
  score: number;
};

const EditableScoreTable = ({ title, data, onScoreChange }: { title: string, data: ScoreRow[], onScoreChange: (id: string, newScore: number) => void }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <SlidersHorizontal className="text-primary size-5" />
          {title}
        </CardTitle>
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
              <TableRow key={row.id}>
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

const SummaryCard = ({ scores }: { scores: number[] }) => {
  const sum = scores.reduce((a, b) => a + b, 0);
  const average = scores.length > 0 ? sum / scores.length : 0;
  const stdDev = scores.length > 0 ? Math.sqrt(scores.map(x => Math.pow(x - average, 2)).reduce((a, b) => a + b) / scores.length) : 0;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calculator /> What-If Summary</CardTitle>
        <CardDescription>Scores update in real-time as you edit.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
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
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <p className="font-medium">Total Modules</p>
          <p className="text-xl font-bold">{Math.ceil(scores.length / 3)}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default function WhatIfAnalysisPage() {
  const [analysisData, setAnalysisData] = useState<ComprehensiveAnalysisOutput | null>(null);
  const [editableScores, setEditableScores] = useState<Record<string, ScoreRow[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const storedData = localStorage.getItem('analysisResult');
    if (storedData) {
      const data: ComprehensiveAnalysisOutput = JSON.parse(storedData);
      setAnalysisData(data);

      const initialScores: Record<string, ScoreRow[]> = {};

      // Module 1: TCA Scorecard (12 Categories)
      if (data.tcaData?.categories) {
        initialScores['tca'] = data.tcaData.categories.map(c => ({ id: c.category, category: c.category, score: c.rawScore }));
      } else {
        // Default 12 TCA categories if no data
        initialScores['tca'] = [
          { id: 'leadership', category: 'Leadership', score: 8.5 },
          { id: 'regulatory', category: 'Regulatory/Compliance', score: 7.0 },
          { id: 'product-market-fit', category: 'Product-Market Fit', score: 9.0 },
          { id: 'team-strength', category: 'Team Strength', score: 7.5 },
          { id: 'technology-ip', category: 'Technology & IP', score: 8.0 },
          { id: 'business-model', category: 'Business Model & Financials', score: 7.0 },
          { id: 'go-to-market', category: 'Go-to-Market Strategy', score: 6.5 },
          { id: 'competition-moat', category: 'Competition & Moat', score: 7.8 },
          { id: 'market-potential', category: 'Market Potential', score: 8.8 },
          { id: 'traction', category: 'Traction', score: 7.2 },
          { id: 'scalability', category: 'Scalability', score: 6.8 },
          { id: 'risk-assessment', category: 'Risk Assessment', score: 7.5 }
        ];
      }

      // Module 2: Risk Assessment (14 Domains)
      if (data.riskData?.riskFlags) {
        initialScores['risk'] = data.riskData.riskFlags.map(r => ({
          id: r.domain,
          category: r.domain,
          score: r.flag === 'green' ? 8 : r.flag === 'yellow' ? 6 : 4
        }));
      } else {
        // Default 14 risk domains if no data
        initialScores['risk'] = [
          { id: 'technology', category: 'Technology Risk', score: 7.5 },
          { id: 'market', category: 'Market Risk', score: 6.8 },
          { id: 'competition', category: 'Competition Risk', score: 7.2 },
          { id: 'financial', category: 'Financial Risk', score: 6.5 },
          { id: 'regulatory', category: 'Regulatory Risk', score: 7.8 },
          { id: 'team', category: 'Team Risk', score: 8.0 },
          { id: 'execution', category: 'Execution Risk', score: 6.2 },
          { id: 'legal', category: 'Legal Risk', score: 7.5 },
          { id: 'strategic', category: 'Strategic Risk', score: 7.0 },
          { id: 'customer', category: 'Customer Risk', score: 6.9 },
          { id: 'operational', category: 'Operational Risk', score: 7.3 },
          { id: 'esg', category: 'ESG Risk', score: 8.2 },
          { id: 'ip', category: 'IP Risk', score: 7.7 },
          { id: 'exit', category: 'Exit Risk', score: 6.6 }
        ];
      }

      // Module 3: Macro Trend Analysis (PESTEL - 6 factors)
      if (data.macroData?.pestelDashboard) {
        initialScores['macro'] = Object.entries(data.macroData.pestelDashboard).map(([k, v]) => ({
          id: k,
          category: k.charAt(0).toUpperCase() + k.slice(1),
          score: v
        }));
      } else {
        // Default PESTEL factors if no data
        initialScores['macro'] = [
          { id: 'political', category: 'Political', score: 7.2 },
          { id: 'economic', category: 'Economic', score: 6.8 },
          { id: 'social', category: 'Social', score: 8.1 },
          { id: 'technological', category: 'Technological', score: 8.5 },
          { id: 'environmental', category: 'Environmental', score: 7.0 },
          { id: 'legal', category: 'Legal', score: 7.3 }
        ];
      }

      // Module 4: Benchmark Comparison
      if (data.benchmarkData?.benchmarkOverlay) {
        initialScores['benchmark'] = data.benchmarkData.benchmarkOverlay.map(b => ({
          id: b.category,
          category: b.category,
          score: b.score / 10
        }));
      } else {
        // Default benchmark categories if no data
        initialScores['benchmark'] = [
          { id: 'revenue-growth', category: 'Revenue Growth', score: 7.8 },
          { id: 'market-share', category: 'Market Share', score: 6.5 },
          { id: 'customer-acquisition', category: 'Customer Acquisition', score: 7.2 },
          { id: 'operational-efficiency', category: 'Operational Efficiency', score: 6.9 }
        ];
      }

      // Module 5: Growth Classification
      if (data.growthData && Object.keys(data.growthData).length > 0) {
        initialScores['growth'] = [{ id: 'growth-tier', category: 'Growth Tier', score: 8 }];
      } else {
        // Default growth metrics if no data
        initialScores['growth'] = [
          { id: 'growth-tier', category: 'Growth Tier', score: 7.5 },
          { id: 'scalability', category: 'Scalability Potential', score: 8.2 },
          { id: 'market-expansion', category: 'Market Expansion', score: 7.0 }
        ];
      }

      // Module 6: Gap Analysis
      if (data.gapData?.heatmap) {
        initialScores['gap'] = data.gapData.heatmap.map(g => ({
          id: g.category,
          category: g.category,
          score: Math.max(0, 10 - (g.gap / 5))
        }));
      } else {
        // Default gap analysis categories if no data
        initialScores['gap'] = [
          { id: 'technology-gap', category: 'Technology Gap', score: 7.8 },
          { id: 'market-gap', category: 'Market Gap', score: 6.5 },
          { id: 'capability-gap', category: 'Capability Gap', score: 7.2 },
          { id: 'resource-gap', category: 'Resource Gap', score: 6.8 }
        ];
      }

      // Module 7: Founder Fit Analysis
      if (data.founderFitData?.readinessScore) {
        initialScores['founderFit'] = [{
          id: 'readiness',
          category: 'Funding Readiness',
          score: data.founderFitData.readinessScore / 10
        }];
      } else {
        // Default founder fit metrics if no data
        initialScores['founderFit'] = [
          { id: 'readiness', category: 'Funding Readiness', score: 7.5 },
          { id: 'market-timing', category: 'Market Timing', score: 8.0 },
          { id: 'execution-capability', category: 'Execution Capability', score: 7.2 }
        ];
      }

      // Module 8: Team Assessment
      if (data.teamData?.members) {
        initialScores['team'] = data.teamData.members.map((m, idx) => ({
          id: m.id,
          category: m.name || `Team Member ${idx + 1}`,
          score: 8.5
        }));
      } else {
        // Default team assessment categories if no data
        initialScores['team'] = [
          { id: 'leadership', category: 'Leadership Quality', score: 8.2 },
          { id: 'technical-expertise', category: 'Technical Expertise', score: 7.8 },
          { id: 'industry-experience', category: 'Industry Experience', score: 7.5 },
          { id: 'team-cohesion', category: 'Team Cohesion', score: 8.0 }
        ];
      }

      // Module 9: Strategic Fit Matrix
      if (data.strategicFitData && Object.keys(data.strategicFitData).length > 0) {
        initialScores['strategicFit'] = [
          { id: 'strategic-1', category: 'Strategic Alignment', score: 7.5 },
          { id: 'strategic-2', category: 'Market Positioning', score: 8.0 }
        ];
      } else {
        // Default strategic fit metrics if no data
        initialScores['strategicFit'] = [
          { id: 'strategic-alignment', category: 'Strategic Alignment', score: 7.5 },
          { id: 'market-positioning', category: 'Market Positioning', score: 8.0 },
          { id: 'competitive-advantage', category: 'Competitive Advantage', score: 7.3 },
          { id: 'value-proposition', category: 'Value Proposition', score: 8.1 }
        ];
      }

      setEditableScores(initialScores);
      setShowWelcome(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'No analysis data found',
        description: 'Please run an analysis first.',
      });
      router.push('/dashboard/evaluation');
    }
    setIsLoading(false);
  }, [router, toast]);

  const handleScoreChange = (moduleId: string, rowId: string, newScore: number) => {
    setEditableScores(prev => ({
      ...prev,
      [moduleId]: prev[moduleId].map(row => row.id === rowId ? { ...row, score: newScore } : row)
    }));
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
            <Button size="lg" onClick={handleProceed} disabled={isLoading}>
              <Lock className="mr-2" /> Lock Scores & Generate Triage Report
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {editableScores.tca && <EditableScoreTable title="Module 1: TCA Scorecard" data={editableScores.tca} onScoreChange={(id, score) => handleScoreChange('tca', id, score)} />}
            {editableScores.risk && <EditableScoreTable title="Module 2: Risk Assessment" data={editableScores.risk} onScoreChange={(id, score) => handleScoreChange('risk', id, score)} />}
            {editableScores.macro && <EditableScoreTable title="Module 3: Macro Trend Analysis" data={editableScores.macro} onScoreChange={(id, score) => handleScoreChange('macro', id, score)} />}
            {editableScores.benchmark && <EditableScoreTable title="Module 4: Benchmark Comparison" data={editableScores.benchmark} onScoreChange={(id, score) => handleScoreChange('benchmark', id, score)} />}
            {editableScores.growth && <EditableScoreTable title="Module 5: Growth Classification" data={editableScores.growth} onScoreChange={(id, score) => handleScoreChange('growth', id, score)} />}
            {editableScores.gap && <EditableScoreTable title="Module 6: Gap Analysis" data={editableScores.gap} onScoreChange={(id, score) => handleScoreChange('gap', id, score)} />}
            {editableScores.founderFit && <EditableScoreTable title="Module 7: Founder Fit Analysis" data={editableScores.founderFit} onScoreChange={(id, score) => handleScoreChange('founderFit', id, score)} />}
            {editableScores.team && <EditableScoreTable title="Module 8: Team Assessment" data={editableScores.team} onScoreChange={(id, score) => handleScoreChange('team', id, score)} />}
            {editableScores.strategicFit && <EditableScoreTable title="Module 9: Strategic Fit Matrix" data={editableScores.strategicFit} onScoreChange={(id, score) => handleScoreChange('strategicFit', id, score)} />}
          </div>
          <div>
            <SummaryCard scores={allScores} />
          </div>
        </div>
      </div>
      <AlertDialog open={showWelcome} onOpenChange={setShowWelcome}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Eye /> Welcome to What-If Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              This page displays all {moduleCount} analysis modules that were run. You can manually adjust any scores to simulate different scenarios.
              When ready, click "Lock Scores & Generate Triage Report" to finalize your analysis and view the comprehensive triage report.
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
