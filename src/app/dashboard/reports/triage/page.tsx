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
import { ArrowLeft, Calculator, Check, Eye, Lock, Percent, SlidersHorizontal } from 'lucide-react';
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
            <SlidersHorizontal className="text-primary size-5"/>
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
                <CardTitle className="flex items-center gap-2"><Calculator/> What-If Summary</CardTitle>
                <CardDescription>Scores update in real-time as you edit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <p className="font-medium">Composite Score</p>
                    <p className="text-2xl font-bold text-primary">{average.toFixed(2)}</p>
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <p className="font-medium">Average Score</p>
                    <p className="text-xl font-bold">{average.toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <p className="font-medium">Standard Deviation</p>
                    <p className="text-xl font-bold">{stdDev.toFixed(2)}</p>
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
      if (data.tcaData?.categories) {
          initialScores['tca'] = data.tcaData.categories.map(c => ({ id: c.category, category: c.category, score: c.rawScore }));
      }
      if (data.riskData?.riskFlags) {
          initialScores['risk'] = data.riskData.riskFlags.map(r => ({ id: r.domain, category: r.domain, score: r.flag === 'green' ? 8 : r.flag === 'yellow' ? 6 : 4 }));
      }
      if (data.macroData?.pestelDashboard) {
          initialScores['macro'] = Object.entries(data.macroData.pestelDashboard).map(([k, v]) => ({ id: k, category: k, score: v }));
      }
      if (data.benchmarkData?.benchmarkOverlay) {
          initialScores['benchmark'] = data.benchmarkData.benchmarkOverlay.map(b => ({ id: b.category, category: b.category, score: b.score }));
      }
      if (data.growthData && Object.keys(data.growthData).length > 0) {
            initialScores['growth'] = [{ id: 'growth-tier', category: 'Growth Tier', score: 8 }];
      }
      if (data.gapData?.heatmap) {
            initialScores['gap'] = data.gapData.heatmap.map(g => ({ id: g.category, category: g.category, score: 10 - (g.gap / 5) }));
      }
      if (data.founderFitData?.readinessScore) {
            initialScores['founderFit'] = [{ id: 'readiness', category: 'Funding Readiness', score: data.founderFitData.readinessScore / 10 }];
      }
      if (data.teamData?.members) {
            initialScores['team'] = data.teamData.members.map(m => ({ id: m.id, category: m.name, score: 8.5 }));
      }
      if (data.strategicFitData?.data) {
            initialScores['strategicFit'] = data.strategicFitData.data.map(s => ({ id: s.pathway, category: s.pathway, score: s.signal === 'green' ? 8 : s.signal === 'yellow' ? 6 : 4 }));
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

  const handleProceed = () => {
    // Here, you would update the main analysisData object with the new scores.
    // This is a simplified example of that logic.
    if (analysisData) {
        const updatedData = { ...analysisData };
        if (updatedData.tcaData) {
            updatedData.tcaData.categories.forEach(cat => {
                const newScore = editableScores.tca.find(s => s.id === cat.category)?.score;
                if (newScore !== undefined) cat.rawScore = newScore;
            });
            const newScores = updatedData.tcaData.categories.map(c => c.rawScore * (c.weight / 100));
            const newCompositeScore = newScores.reduce((a,b) => a+b, 0);
            updatedData.tcaData.compositeScore = newCompositeScore;
        }

        localStorage.setItem('analysisResult', JSON.stringify(updatedData));
        toast({
            title: 'Scores Locked',
            description: 'Your changes have been saved. Redirecting to reports dashboard.',
        });
        router.push('/dashboard/reports');
    }
  }
  
  const allScores = Object.values(editableScores).flat().map(s => s.score);

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
                    Adjust scores from active modules to simulate outcomes before finalizing your report.
                    </p>
                </div>
                 <Button size="lg" onClick={handleProceed}><Lock className="mr-2"/> Lock Score & Proceed to Reports</Button>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {editableScores.tca && <EditableScoreTable title="TCA Scorecard" data={editableScores.tca} onScoreChange={(id, score) => handleScoreChange('tca', id, score)} />}
                {editableScores.risk && <EditableScoreTable title="Risk Flags" data={editableScores.risk} onScoreChange={(id, score) => handleScoreChange('risk', id, score)} />}
                {editableScores.macro && <EditableScoreTable title="Macro Trend Alignment" data={editableScores.macro} onScoreChange={(id, score) => handleScoreChange('macro', id, score)} />}
                {editableScores.benchmark && <EditableScoreTable title="Benchmark Comparison" data={editableScores.benchmark} onScoreChange={(id, score) => handleScoreChange('benchmark', id, score)} />}
                {editableScores.growth && <EditableScoreTable title="Growth Classifier" data={editableScores.growth} onScoreChange={(id, score) => handleScoreChange('growth', id, score)} />}
                {editableScores.gap && <EditableScoreTable title="Gap Analysis" data={editableScores.gap} onScoreChange={(id, score) => handleScoreChange('gap', id, score)} />}
                {editableScores.founderFit && <EditableScoreTable title="Funder Fit Analysis" data={editableScores.founderFit} onScoreChange={(id, score) => handleScoreChange('founderFit', id, score)} />}
                {editableScores.team && <EditableScoreTable title="Team Assessment" data={editableScores.team} onScoreChange={(id, score) => handleScoreChange('team', id, score)} />}
                {editableScores.strategicFit && <EditableScoreTable title="Strategic Fit Matrix" data={editableScores.strategicFit} onScoreChange={(id, score) => handleScoreChange('strategicFit', id, score)} />}
            </div>
            <div>
                <SummaryCard scores={allScores}/>
            </div>
        </div>
      </div>
      <AlertDialog open={showWelcome} onOpenChange={setShowWelcome}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Eye/> Welcome to What-If Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              This page allows you to experiment with the analysis results. You can manually override the AI-generated scores for any category to see how it impacts the overall evaluation. Your changes here will be reflected in the final report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowWelcome(false)}>
                <Check className="mr-2"/> Got it, let's start!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}