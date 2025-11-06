
'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { TrendingUp, Lock } from 'lucide-react';
import { GrowthChart } from './growth-chart';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import React, { useState } from 'react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

const initialGrowthData = {
  tier: 2,
  confidence: 82,
  scenarios: [
    { name: 'Worst Case', growth: 1.5 },
    { name: 'Base Case', growth: 2.5 },
    { name: 'Best Case', growth: 4.0 },
  ],
  analysis:
    'The growth model ensemble predicts a Tier 2 classification, indicating moderate growth potential. The base case scenario suggests a 2.5x YoY growth, driven by strong market positioning but constrained by team scalability. The sector-adjusted model slightly downgraded the score due to high competition in the B2B SaaS space.',
  models: [
    { name: 'XGBoost', score: 8.1, contribution: '20%' },
    { name: 'Random Forest', score: 7.9, contribution: '20%' },
    { name: 'Neural Network', score: 8.3, contribution: '20%' },
    { name: 'SVM', score: 7.8, contribution: '15%' },
    { name: 'Gradient Boosting', score: 8.2, contribution: '15%' },
    { name: 'Ensemble Voting', score: 8.0, contribution: '10%' },
  ],
  interpretation: 'The classification as Tier 2 suggests a solid foundation but with clear areas for improvement to unlock high-growth potential. Key drivers are strong product-market fit and a large addressable market. However, scaling challenges and competitive pressures are significant headwinds that need to be addressed in the operational plan.'
};

export function GrowthClassifier() {
  const { role, isEditable } = useEvaluationContext();
  const [growthData, setGrowthData] = useState(initialGrowthData);

  const handleAnalysisChange = (value: string) => {
    setGrowthData(prev => ({...prev, analysis: value}));
  }

  const handleInterpretationChange = (value: string) => {
    setGrowthData(prev => ({...prev, interpretation: value}));
  }


  const isPrivilegedUser = role === 'admin' || role === 'reviewer';

  return (
    <DashboardCard
      title="Growth Classifier"
      icon={TrendingUp}
      description="Ensemble model prediction of growth potential."
    >
      <div className="space-y-6">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-sm text-muted-foreground">Growth Tier</p>
            <p className="text-5xl font-bold text-primary">
              {growthData.tier}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Confidence</p>
            <p className="text-5xl font-bold text-accent">
              {growthData.confidence}%
            </p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground text-center">
            Scenario Simulations (YoY Growth)
          </h4>
          <GrowthChart data={growthData.scenarios} />
        </div>
         <Card>
            <CardHeader>
                <CardTitle className="text-base">Growth Tier Definitions</CardTitle>
                <CardDescription>The final classification assigned by the model.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tier</TableHead>
                            <TableHead>Meaning</TableHead>
                            <TableHead>Interpretation</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-bold text-success">Tier 1</TableCell>
                            <TableCell>High Growth</TableCell>
                            <TableCell className="text-muted-foreground text-xs">Top 20-25% of startups; strong, investable signals.</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-bold text-warning">Tier 2</TableCell>
                            <TableCell>Moderate Growth</TableCell>
                            <TableCell className="text-muted-foreground text-xs">Middle 50-60%; mixed signals, conditional potential.</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell className="font-bold text-destructive">Tier 3</TableCell>
                            <TableCell>Low Growth</TableCell>
                            <TableCell className="text-muted-foreground text-xs">Bottom 20-25%; weak signals, high friction.</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Detailed Analysis</AccordionTrigger>
            <AccordionContent className="space-y-4">
              {isEditable ? (
                <Textarea value={growthData.analysis} onChange={(e) => handleAnalysisChange(e.target.value)} rows={4} className="text-base"/>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {growthData.analysis}
                </p>
              )}
               <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">AI Interpretation</h4>
                 {isEditable ? (
                    <Textarea value={growthData.interpretation} onChange={(e) => handleInterpretationChange(e.target.value)} rows={4} className="text-base"/>
                  ) : (
                    <p className="text-sm text-muted-foreground">{growthData.interpretation}</p>
                  )}
              </div>
              {isPrivilegedUser && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h5 className="font-semibold text-sm flex items-center gap-2 mb-2">
                    <Lock className="size-4 text-warning" />
                    6-Model DSS Matrix (Admin/Reviewer Only)
                  </h5>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
                    <div className="font-semibold text-muted-foreground">Model</div>
                    <div className="font-semibold text-muted-foreground text-right">Score</div>
                    <div className="font-semibold text-muted-foreground text-right">Contribution</div>
                    {growthData.models.map((model) => (
                      <React.Fragment key={model.name}>
                        <div>{model.name}</div>
                        <div className="text-right">{model.score.toFixed(1)}</div>
                        <div className="text-right">{model.contribution}</div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </DashboardCard>
  );
}
