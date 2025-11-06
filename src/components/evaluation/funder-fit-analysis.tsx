
'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useState } from 'react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';

const initialFunderData = {
  readinessScore: 78,
  investorList: [
    {
      name: 'Sequoia Capital',
      thesis: 'SaaS, AI, Fintech',
      match: 92,
      stage: 'Seed, Series A',
    },
    {
      name: 'Andreessen Horowitz',
      thesis: 'AI, Future of Work',
      match: 88,
      stage: 'Seed, Series A, B',
    },
    {
      name: 'Y Combinator',
      thesis: 'Sector Agnostic',
      match: 85,
      stage: 'Pre-Seed, Seed',
    },
  ],
  interpretation: "The startup has a strong funding readiness score of 78%, indicating a good fit with the current investor landscape. The investor shortlist is topped by Tier 1 VCs like Sequoia and a16z, whose theses align well with the company's focus on AI and SaaS. Further relationship building is recommended."
};

export function FunderFitAnalysis() {
  const { isEditable } = useEvaluationContext();
  const [funderData, setFunderData] = useState(initialFunderData);

  const handleInterpretationChange = (value: string) => {
    setFunderData(prev => ({...prev, interpretation: value}));
  }

  return (
    <DashboardCard
      title="Funder Fit Analysis"
      icon={DollarSign}
      description="Investor matching and funding readiness."
    >
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Funding Readiness
            </h4>
            <span className="text-2xl font-bold text-primary">
              {funderData.readinessScore}%
            </span>
          </div>
          <Progress value={funderData.readinessScore} className="h-2" />
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
            Investor Shortlist
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investor</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Match</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funderData.investorList.map((investor) => (
                <TableRow key={investor.name}>
                  <TableCell className="font-medium">{investor.name}</TableCell>
                  <TableCell>{investor.stage}</TableCell>
                  <TableCell className="text-right font-bold text-accent">
                    {investor.match}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Separator />
        <div>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">AI Interpretation</h4>
             {isEditable ? (
                <Textarea value={funderData.interpretation} onChange={(e) => handleInterpretationChange(e.target.value)} rows={4} className="text-base"/>
            ) : (
                <p className="text-sm text-muted-foreground">{funderData.interpretation}</p>
            )}
        </div>
      </div>
    </DashboardCard>
  );
}
