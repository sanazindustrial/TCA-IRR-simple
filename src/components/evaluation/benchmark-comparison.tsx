
'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Activity, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { BenchmarkChart } from './benchmark-chart';
import { Separator } from '../ui/separator';
import { useState } from 'react';
import { Textarea } from '../ui/textarea';
import { useEvaluationContext } from './evaluation-provider';
import type { GenerateBenchmarkComparisonOutput } from '@/ai/flows/schemas';

export type { GenerateBenchmarkComparisonOutput };

const getDeviationColor = (deviation: number) => {
  if (deviation > 0) return 'text-success';
  if (deviation < 0) return 'text-destructive';
  return 'text-muted-foreground';
};

const DeviationIcon = ({ deviation }: { deviation: number }) => {
  if (deviation > 0) return <ArrowUp className="size-3 text-success" />;
  if (deviation < 0) return <ArrowDown className="size-3 text-destructive" />;
  return <Minus className="size-3 text-muted-foreground" />;
}

type BenchmarkComparisonProps = {
  initialData: GenerateBenchmarkComparisonOutput;
};

export function BenchmarkComparison({ initialData }: BenchmarkComparisonProps) {
  const { isEditable } = useEvaluationContext();
  const [benchmarkData, setBenchmarkData] = useState(initialData);

  if (!benchmarkData) {
    return null;
  }

  const handleInterpretationChange = (value: string) => {
    setBenchmarkData(prev => ({ ...prev, performanceSummary: value }));
  }

  return (
    <DashboardCard
      title="Benchmark Comparison"
      icon={Activity}
      description="Performance vs. sector averages and competitors."
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
            Benchmark Overlay
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Sector Avg</TableHead>
                <TableHead>Deviation</TableHead>
                <TableHead>Percentile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {benchmarkData.benchmarkOverlay.map((item) => (
                <TableRow key={item.category}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell className="font-bold text-primary">{item.score}</TableCell>
                  <TableCell>{item.avg.toFixed(1)}</TableCell>
                  <TableCell className={cn('font-bold flex items-center gap-1', getDeviationColor(item.deviation))}>
                    <DeviationIcon deviation={item.deviation} />
                    {item.deviation.toFixed(1)}
                  </TableCell>
                  <TableCell>{item.percentile}th</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
            Competitor Analysis
          </h4>
          <BenchmarkChart data={benchmarkData.competitorAnalysis} />
        </div>
        <Separator />
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">AI Interpretation</h4>
          {isEditable ? (
            <Textarea value={benchmarkData.performanceSummary} onChange={(e) => handleInterpretationChange(e.target.value)} rows={4} className="text-base" />
          ) : (
            <p className="text-sm text-muted-foreground">{benchmarkData.performanceSummary}</p>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
