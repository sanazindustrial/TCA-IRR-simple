
'use client';
import React, { useState } from 'react';
import type { GenerateTcaScorecardOutput } from '@/ai/flows/schemas';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { cn } from '@/lib/utils';
import { ClipboardList, Lock } from 'lucide-react';
import { useEvaluationContext } from './evaluation-provider';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';

type TcaSummaryCardProps = {
  initialData: GenerateTcaScorecardOutput;
};

const getScoreColor = (score: number) => {
  if (score >= 8.0) return 'text-success';
  if (score >= 6.5) return 'text-warning';
  return 'text-destructive';
};

const getTier = (score: number) => {
  if (score >= 8.0) return { tier: 'Strong & Investable', badge: 'success' as const };
  if (score >= 6.5) return { tier: 'Moderate; needs traction', badge: 'warning' as const };
  return { tier: 'High risk / weak readiness', badge: 'destructive' as const };
}


export function TcaSummaryCard({ initialData }: TcaSummaryCardProps) {
  const { isPrivilegedUser, isEditable } = useEvaluationContext();
  const [data, setData] = useState(initialData);

  if (!data) return null;

  const scoreTier = getTier(data.compositeScore);
  const scoreAvg = data.compositeScore * 0.98; // Mocked
  const stdDev = 0.25; // Mocked
  const confidenceInterval = [scoreAvg - stdDev, scoreAvg + stdDev];

  const handleSummaryChange = (value: string) => {
    setData((prev) => ({ ...prev, summary: value }));
  }


  return (
    <DashboardCard
      title="TCA Summary Score Card: Triage Classification"
      icon={ClipboardList}
      description="High-level evaluation results and statistical analysis."
    >
      <div className="space-y-6">
        {/* Main Score Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Display */}
          <div className="score-display">
            <p className="text-sm text-muted-foreground mb-2">Total Score</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className={cn('score-large', getScoreColor(data.compositeScore))}>
                {data.compositeScore.toFixed(2)}
              </span>
              <span className="text-2xl text-muted-foreground">/10</span>
            </div>
            <p className="score-subtitle">
              Average (30 runs): <span className="font-semibold text-foreground/80">{scoreAvg.toFixed(2)}/10</span>
            </p>
          </div>

          {/* Statistical Analysis */}
          {isPrivilegedUser ? (
            <div className="lg:col-span-2 p-6 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 h-full">
                <div className='text-center'>
                  <p className="text-sm text-muted-foreground mb-3">Tier Level</p>
                  <Badge variant={scoreTier.badge} className="text-sm px-3 py-1">
                    {scoreTier.tier}
                  </Badge>
                </div>
                <div className='text-center'>
                  <p className="text-sm text-muted-foreground mb-3">Standard Deviation</p>
                  <p className='text-2xl font-bold text-foreground'>{stdDev.toFixed(2)}</p>
                </div>
                <div className='text-center'>
                  <p className="text-sm text-muted-foreground mb-3 flex items-center justify-center gap-1">
                    <Lock className='size-3' />
                    Confidence Interval
                  </p>
                  <p className='text-lg font-bold text-foreground'>
                    [{confidenceInterval[0].toFixed(2)} - {confidenceInterval[1].toFixed(2)}]
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 p-6 bg-muted/30 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Additional statistical analysis is available for reviewers and admins.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div className="border-t pt-6">
          <h4 className="font-semibold text-base mb-3">AI Interpretation Summary</h4>
          {isEditable ? (
            <Textarea
              value={data.summary}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleSummaryChange(e.target.value)}
              rows={3}
              className="text-sm leading-relaxed resize-none"
              placeholder="Enter AI interpretation summary..."
            />
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.summary}
            </p>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
