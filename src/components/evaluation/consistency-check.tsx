
'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { Badge } from '../ui/badge';
import { useEvaluationContext } from './evaluation-provider';
import { CheckCircle, BarChart, FileDiff } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type ConsistencyCheckProps = {
  moduleScores?: Record<string, number | null>;
  pitchSummary?: string;
  dataCompleteness?: number;
};

const toStatus = (score: number): 'High' | 'Medium' | 'Low' => {
  if (score >= 85) return 'High';
  if (score >= 65) return 'Medium';
  return 'Low';
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


export function ConsistencyCheck({ moduleScores = {}, pitchSummary = '', dataCompleteness = 0 }: ConsistencyCheckProps) {
  const { isPrivilegedUser } = useEvaluationContext();

  const numericScores = Object.values(moduleScores).filter((s): s is number => typeof s === 'number');
  const moduleCount = numericScores.length;
  const avg = moduleCount > 0 ? numericScores.reduce((a, b) => a + b, 0) / moduleCount : 0;
  const stdDev = moduleCount > 0
    ? Math.sqrt(numericScores.map((x) => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / moduleCount)
    : 0;
  const outlierCount = numericScores.filter((s) => Math.abs(s - avg) > 2).length;

  const distributionScore = moduleCount <= 1
    ? 40
    : Math.max(0, Math.min(100, Math.round(100 - (stdDev * 15))));
  const outlierScore = moduleCount <= 1
    ? 40
    : Math.max(0, Math.min(100, Math.round(100 - ((outlierCount / Math.max(1, moduleCount)) * 100))));
  const interModuleScore = Math.max(0, Math.min(100, Math.round((distributionScore * 0.6) + (outlierScore * 0.4))));

  const pitchLength = pitchSummary.trim().length;
  const textCoherenceScore = Math.max(0, Math.min(100, Math.round(Math.min(1, pitchLength / 1200) * 100)));
  const scoreCommentMatchScore = Math.max(0, Math.min(100, Math.round((textCoherenceScore * 0.5) + (dataCompleteness * 0.5))));
  const pitchVsScoreStabilityScore = Math.max(0, Math.min(100, Math.round((interModuleScore * 0.7) + (textCoherenceScore * 0.3))));

  const consistencyData = {
    scoring: {
      distribution: { score: distributionScore, status: toStatus(distributionScore) },
      outliers: { score: outlierScore, status: toStatus(outlierScore) },
      interModule: { score: interModuleScore, status: toStatus(interModuleScore) },
    },
    narrative: {
      textCoherence: { score: textCoherenceScore, status: toStatus(textCoherenceScore) },
      scoreCommentMatch: { score: scoreCommentMatchScore, status: toStatus(scoreCommentMatchScore) },
      pitchVsScoreStability: { score: pitchVsScoreStabilityScore, status: toStatus(pitchVsScoreStabilityScore) },
    },
    data: {
      completeness: { score: Math.round(dataCompleteness), status: toStatus(dataCompleteness) },
      freshness: { score: 100, status: 'High' as const },
    },
  };

  if (!isPrivilegedUser) {
    return null;
  }

  return (
    <DashboardCard
      title="Consistency Check, Quality & Statistics"
      icon={CheckCircle}
      description="Automated checks for analysis quality and data consistency (Admin/Analyst Only)."
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


