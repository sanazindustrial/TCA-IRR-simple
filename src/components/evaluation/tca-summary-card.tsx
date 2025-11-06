
'use client';
import type { GenerateTcaScorecardOutput } from '@/ai/flows/schemas';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { cn } from '@/lib/utils';
import { ClipboardList, Lock } from 'lucide-react';
import { useEvaluationContext } from './evaluation-provider';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';

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
      setData(prev => (prev ? { ...prev, summary: value } : null));
  }


  return (
    <DashboardCard
      title="TCA Summary Score Card: Triage Classification"
      icon={ClipboardList}
      description="High-level evaluation results and statistical analysis."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 text-center">
        <div className="lg:col-span-2 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Score</p>
          <p className={cn('text-6xl font-bold', getScoreColor(data.compositeScore))}>
            {data.compositeScore.toFixed(2)}
          </p>
           <p className="text-sm text-muted-foreground mt-2">Score Average (30 runs): <span className="font-bold text-foreground/80">{scoreAvg.toFixed(2)}</span></p>
        </div>
        
        {isPrivilegedUser ? (
          <>
            <div className="lg:col-span-3 p-4 bg-muted/30 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-4 content-center">
                <div className='flex flex-col justify-center'>
                    <p className="text-sm text-muted-foreground">Tier Level</p>
                    <div className="mt-2">
                        <Badge variant={scoreTier.badge} className="text-base">{scoreTier.tier}</Badge>
                    </div>
                </div>
                <div className='flex flex-col justify-center'>
                    <p className="text-sm text-muted-foreground">Std. Dev</p>
                    <p className='text-3xl font-bold'>{stdDev.toFixed(2)}</p>
                </div>
                <div className='flex flex-col justify-center'>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Lock className='size-3'/> Confidence Interval</p>
                    <p className='text-3xl font-bold'>[{confidenceInterval[0].toFixed(2)} - {confidenceInterval[1].toFixed(2)}]</p>
                </div>
            </div>
          </>
        ) : (
            <div className="lg:col-span-3 p-4 bg-muted/30 rounded-lg flex items-center justify-center">
                 <p className="text-muted-foreground">Additional statistical analysis is available for reviewers and admins.</p>
            </div>
        )}

        <div className="lg:col-span-5 border-t pt-4">
            <h4 className="font-semibold text-left mb-2">AI Interpretation Summary</h4>
            {isEditable ? (
                <Textarea value={data.summary} onChange={(e) => handleSummaryChange(e.target.value)} rows={3} className="text-base"/>
            ) : (
                <p className="text-sm text-muted-foreground text-left">{data.summary}</p>
            )}
        </div>
      </div>
    </DashboardCard>
  );
}
