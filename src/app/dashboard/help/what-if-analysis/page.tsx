
'use client';
import { useState, useEffect } from 'react';
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
  TableFooter,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calculator, SlidersHorizontal, Lock, Users, Eye } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/lib/users';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

type ScoreRow = {
  id: string;
  category: string;
  score: number;
  isMissing: boolean;
};

const allModuleCategories: Record<string, { title: string; categories: string[] }> = {
  tca: {
    title: 'TCA Scorecard',
    categories: ['Leadership', 'Product-Market Fit', 'Team Strength', 'Technology & IP', 'Business Model & Financials', 'Go-to-Market Strategy', 'Competition & Moat', 'Market Potential', 'Traction', 'Scalability', 'Risk Assessment', 'Exit Potential', 'Regulatory'],
  },
  risk: {
    title: 'Risk Flags',
    categories: ['Regulatory / Compliance', 'Clinical / Safety / Product Safety', 'Liability / Legal Exposure', 'Technical Execution Risk', 'Market Risk', 'Go-To-Market (GTM) Risk', 'Financial Risk', 'Team / Execution Risk', 'IP / Defensibility Risk', 'Data Privacy / Governance', 'Security / Cyber Risk', 'Operational / Supply Chain', 'Ethical / Societal Risk', 'Adoption / Customer Retention Risk'],
  },
  macro: {
    title: 'Macro Trend Alignment',
    categories: ['Political', 'Economic', 'Social', 'Technological', 'Environmental', 'Legal'],
  },
  benchmark: {
    title: 'Benchmark Comparison',
    categories: ['Revenue Growth', 'Net Retention', 'LTV/CAC Ratio'],
  },
  growth: {
    title: 'Growth Classifier',
    categories: ['Growth Tier Score'],
  },
  gap: {
    title: 'Gap Analysis',
    categories: ['Product Quality', 'Team Strength', 'Financial Viability', 'Traction', 'Go-to-Market (GTM) Strategy'],
  },
  founderFit: {
    title: 'Funder Fit Analysis',
    categories: ['Funding Readiness'],
  },
  team: {
    title: 'Team Assessment',
    categories: ['Founder-Market Fit', 'Execution Capability', 'Team Completeness'],
  },
  strategicFit: {
    title: 'Strategic Fit Matrix',
    categories: ['GTM Fit', 'ESG Score', 'M&A Readiness', 'VC Fit'],
  },
};

const initialCompanyScores: Record<string, Record<string, number>> = {
  tca: { 'Leadership': 8.5, 'Product-Market Fit': 9.0, 'Team Strength': 7.5, 'Technology & IP': 8.0 }, // Missing some
  risk: { 'Market Risk': 6.0, 'Go-To-Market (GTM) Risk': 4.0 }, // Missing most
  macro: { 'Political': 7.0, 'Economic': 6.0, 'Technological': 9.0 },
  benchmark: { 'Revenue Growth': 8.5, 'Net Retention': 7.0 },
  growth: { 'Growth Tier Score': 8.0 },
  gap: { 'Product Quality': 7.0, 'Team Strength': 5.0 },
  founderFit: { 'Funding Readiness': 7.8 },
  team: { 'Founder-Market Fit': 8.5 },
  strategicFit: { 'GTM Fit': 8.0 },
};

const EditableScoreTable = ({ title, data, onScoreChange, isEditable }: { title: string, data: ScoreRow[], onScoreChange: (id: string, newScore: number) => void, isEditable: boolean }) => {
  const moduleAverage = data.length > 0 ? data.reduce((acc, row) => acc + row.score, 0) / data.length : 0;
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
                <TableCell className="font-medium">
                  {row.category}
                  {row.isMissing && <Badge variant="destructive" className="ml-2">Missing</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    value={row.score}
                    onChange={(e) => onScoreChange(row.id, parseFloat(e.target.value))}
                    min="0"
                    max="10"
                    step="0.1"
                    className="h-8 text-right"
                    disabled={!isEditable}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
                <TableCell className="font-semibold">Module Average</TableCell>
                <TableCell className="text-right font-bold text-lg text-primary">{moduleAverage.toFixed(2)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
};

const SummaryCard = ({ scores, framework }: { scores: number[], framework: 'general' | 'medtech' }) => {
    const sum = scores.reduce((a, b) => a + b, 0);
    const average = scores.length > 0 ? sum / scores.length : 0;
    const stdDev = scores.length > 0 ? Math.sqrt(scores.map(x => Math.pow(x - average, 2)).reduce((a, b) => a + b) / scores.length) : 0;
    
    return (
        <Card className="sticky top-4">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2"><Calculator/> What-If Summary</CardTitle>
                    <Badge variant="outline">{framework === 'general' ? 'General Framework' : 'MedTech Framework'}</Badge>
                </div>
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

export default function WhatIfAnalysisGuidePage() {
  const [editableScores, setEditableScores] = useState<Record<string, ScoreRow[]>>({});
  const [user, setUser] = useState<User | null>(null);
  const [isPrivilegedView, setIsPrivilegedView] = useState(true);
  const [framework, setFramework] = useState<'general' | 'medtech'>('general');
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    let userRole = 'user';
    if (storedUser) {
        try {
            const parsedUser: User = JSON.parse(storedUser);
            setUser(parsedUser);
            userRole = parsedUser.role.toLowerCase();
        } catch (e) {
            console.error("Failed to parse user from storage");
        }
    }
    setIsPrivilegedView(userRole === 'admin' || userRole === 'reviewer');

    // Initialize scores based on all categories
    const allScores: Record<string, ScoreRow[]> = {};
    for (const moduleId in allModuleCategories) {
        allScores[moduleId] = allModuleCategories[moduleId].categories.map(category => {
            const isMissing = !initialCompanyScores[moduleId]?.[category];
            const score = isMissing ? Math.floor(Math.random() * 5) + 1 : initialCompanyScores[moduleId][category];
            return {
                id: `${moduleId}-${category.replace(/\s/g, '-')}`,
                category: category,
                score: score,
                isMissing: isMissing
            };
        });
    }
    setEditableScores(allScores);

  }, []);

  const handleScoreChange = (moduleId: string, rowId: string, newScore: number) => {
      setEditableScores(prev => ({
          ...prev,
          [moduleId]: prev[moduleId].map(row => row.id === rowId ? { ...row, score: newScore } : row)
      }));
  };
  
  const handleProceed = () => {
    toast({
        title: 'Scores Locked (Demo)',
        description: 'In a real scenario, these scores would be saved and you would proceed to the triage report.',
    });
  }

  const allScores = Object.values(editableScores).flat().map(s => s.score);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Link href="/dashboard/help" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="size-4" />
            Back to Help & Support
        </Link>
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-4xl font-bold font-headline text-primary tracking-tight">
                Guide: What-If Analysis
                </h1>
                <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
                This is a demo page. Adjust scores from active modules to simulate outcomes before finalizing a report.
                </p>
            </div>
            <div className='space-y-2 text-right'>
                <div className="flex items-center justify-end gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="framework-switcher" className={framework === 'general' ? 'text-primary' : ''}>General</Label>
                        <Switch id="framework-switcher" checked={framework === 'medtech'} onCheckedChange={(checked) => setFramework(checked ? 'medtech' : 'general')} />
                        <Label htmlFor="framework-switcher" className={framework === 'medtech' ? 'text-primary' : ''}>MedTech</Label>
                    </div>
                     <div className="flex items-center gap-2">
                        <Label htmlFor="role-switcher" className={!isPrivilegedView ? 'text-primary' : ''}>Standard View</Label>
                        <Switch id="role-switcher" checked={isPrivilegedView} onCheckedChange={setIsPrivilegedView} />
                        <Label htmlFor="role-switcher" className={isPrivilegedView ? 'text-primary' : ''}>Admin/Reviewer View</Label>
                    </div>
                </div>
                {isPrivilegedView ? (
                    <Button size="lg" onClick={handleProceed}><Lock className="mr-2"/> Lock Score & Proceed to Triage Report</Button>
                ): (
                    <Button size="lg"><Users className="mr-2"/> Run Report</Button>
                )}
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            {Object.entries(editableScores).map(([moduleId, data]) => (
                <EditableScoreTable
                    key={moduleId}
                    title={allModuleCategories[moduleId].title}
                    data={data}
                    onScoreChange={(id, score) => handleScoreChange(moduleId, id, score)}
                    isEditable={isPrivilegedView}
                />
            ))}
        </div>
        <div>
            <SummaryCard scores={allScores} framework={framework}/>
        </div>
      </div>
    </div>
  );
}
