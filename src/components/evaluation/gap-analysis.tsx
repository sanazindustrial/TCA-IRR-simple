
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
import { Search, CheckCircle2, Zap, GitBranch, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useState } from 'react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';

const initialGapData = {
  heatmap: [
    { category: 'Product Quality', gap: -15, priority: 'High', trend: -2, direction: 'down' },
    { category: 'Team Strength', gap: -25, priority: 'High', trend: -5, direction: 'down' },
    { category: 'Financial Viability', gap: 5, priority: 'Low', trend: 3, direction: 'up' },
    { category: 'Traction', gap: -5, priority: 'Medium', trend: 1, direction: 'up' },
    { category: 'Go-to-Market (GTM) Strategy', gap: -18, priority: 'High', trend: 0, direction: 'stable' },
  ],
  roadmap: [
    {
      area: 'Team Strength',
      action: 'Hire a senior backend engineer.',
      type: 'Priority Area',
      icon: Zap,
    },
    {
      area: 'Product Quality',
      action: 'Implement user feedback collection system.',
      type: 'Quick Win',
      icon: CheckCircle2,
    },
    {
      area: 'GTM Strategy',
      action: 'Develop a content marketing plan.',
      type: 'Improvement Roadmap',
      icon: GitBranch,
    },
  ],
  interpretation: 'The gap analysis reveals critical deficiencies in Team Strength and GTM Strategy, which are high-priority areas for improvement. While Financial Viability is slightly ahead of peers, the negative gaps in product and traction need to be addressed. The action plan focuses on shoring up the team and refining the GTM approach.'
};

const getGapColor = (gap: number) => {
  if (gap < -15) return 'bg-destructive/20';
  if (gap < 0) return 'bg-warning/20';
  return 'bg-success/20';
};

const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-success';
    if (trend < 0) return 'text-destructive';
    return 'text-muted-foreground';
}

const TrendIcon = ({ direction }: { direction: string }) => {
  if (direction === 'up') return <ArrowUp className="size-3 text-success" />;
  if (direction === 'down') return <ArrowDown className="size-3 text-destructive" />;
  return <Minus className="size-3 text-muted-foreground" />;
}

export function GapAnalysis() {
  const { isEditable } = useEvaluationContext();
  const [gapData, setGapData] = useState(initialGapData);
  
  const handleInterpretationChange = (value: string) => {
      setGapData(prev => ({...prev, interpretation: value}));
  }

  return (
    <DashboardCard
      title="Gap Analysis"
      icon={Search}
      description="Performance gaps vs. peers and recommended action plan."
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-3">
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
            Gap Heatmap (vs. Peer Group & History)
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Gap vs. Peers</TableHead>
                <TableHead className="text-right">Trend (Δ vs. last)</TableHead>
                <TableHead>Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gapData.heatmap.map((item) => (
                <TableRow key={item.category}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-bold',
                      getGapColor(item.gap)
                    )}
                  >
                    {item.gap}%
                  </TableCell>
                   <TableCell className={cn("text-right font-semibold flex items-center justify-end gap-1", getTrendColor(item.trend))}>
                        <TrendIcon direction={item.direction} />
                        {item.trend.toFixed(1)}%
                  </TableCell>
                  <TableCell>{item.priority}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="md:col-span-2">
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
            Recommended Action Plan
          </h4>
          <div className="space-y-4">
            {gapData.roadmap.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <item.icon className="size-5 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="font-semibold">{item.area}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Separator className='my-6' />
       <div>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">AI Interpretation</h4>
             {isEditable ? (
                <Textarea value={gapData.interpretation} onChange={(e) => handleInterpretationChange(e.target.value)} rows={4} className="text-base"/>
            ) : (
                <p className="text-sm text-muted-foreground">{gapData.interpretation}</p>
            )}
        </div>
    </DashboardCard>
  );
}
