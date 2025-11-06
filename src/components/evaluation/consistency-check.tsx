
'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { Badge } from '../ui/badge';
import { useEvaluationContext } from './evaluation-provider';
import { CheckCircle, SlidersHorizontal, BarChart, FileDiff, TrendingUp } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const consistencyData = {
  scoring: {
    distribution: { score: 88, status: 'High' },
    outliers: { score: 95, status: 'High' },
    interModule: { score: 75, status: 'Medium' },
  },
  narrative: {
    textCoherence: { score: 92, status: 'High' },
    scoreCommentMatch: { score: 85, status: 'High' },
    pitchVsScoreStability: { score: 78, status: 'Medium' },
  },
  data: {
    completeness: { score: 95, status: 'High' },
    freshness: { score: 99, status: 'High' },
  },
};

const getStatusVariant = (status: string) => {
    if (status === 'High') return 'success';
    if (status === 'Medium') return 'warning';
    return 'destructive';
}

const MetricRow = ({ label, score, status }: { label: string, score: number, status: string }) => (
    <div className="grid grid-cols-[1fr_120px_40px_80px] items-center gap-4 p-3 rounded-lg bg-background/50">
        <p className="font-medium text-sm">{label}</p>
        <Progress value={score} />
        <span className="font-mono text-sm text-right text-muted-foreground">{score}</span>
        <Badge variant={getStatusVariant(status) as any} className="w-[70px] justify-center">{status}</Badge>
    </div>
);


export function ConsistencyCheck() {
  const { isPrivilegedUser } = useEvaluationContext();

  if (!isPrivilegedUser) {
    return null;
  }

  return (
    <DashboardCard
      title="Consistency Check, Quality & Statistics"
      icon={CheckCircle}
      description="Automated checks for analysis quality and data consistency (Admin/Reviewer Only)."
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <BarChart className="text-primary"/>
                        Scoring Quality
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <MetricRow label="Score Distribution" score={consistencyData.scoring.distribution.score} status={consistencyData.scoring.distribution.status} />
                    <MetricRow label="Outlier Detection" score={consistencyData.scoring.outliers.score} status={consistencyData.scoring.outliers.status} />
                    <MetricRow label="Inter-Module Consistency" score={consistencyData.scoring.interModule.score} status={consistencyData.scoring.interModule.status} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileDiff className="text-primary"/>
                        Narrative & Data Integrity
                    </CardTitle>
                </CardHeader>
                 <CardContent className="space-y-3">
                    <MetricRow label="Text Coherence" score={consistencyData.narrative.textCoherence.score} status={consistencyData.narrative.textCoherence.status} />
                    <MetricRow label="Score-Comment Match" score={consistencyData.narrative.scoreCommentMatch.score} status={consistencyData.narrative.scoreCommentMatch.status} />
                    <MetricRow label="Pitch vs. Score Stability" score={consistencyData.narrative.pitchVsScoreStability.score} status={consistencyData.narrative.pitchVsScoreStability.status} />
                </CardContent>
            </Card>
        </div>
    </DashboardCard>
  );
}
