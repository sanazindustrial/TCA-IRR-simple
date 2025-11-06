
'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { LayoutGrid, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useState } from 'react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';

const initialFitData = {
    data: [
        { pathway: 'GTM Fit', signal: 'green', notes: 'Strong partner compatibility', trend: 0.2, direction: 'up' },
        { pathway: 'ESG Score', signal: 'green', notes: 'High sustainability alignment', trend: 0.1, direction: 'up' },
        { pathway: 'M&A Readiness', signal: 'yellow', notes: 'Needs better reporting', trend: -0.1, direction: 'down' },
        { pathway: 'VC Fit', signal: 'green', notes: 'Aligns with top-tier VC theses', trend: 0.0, direction: 'stable' },
    ],
    interpretation: "The startup shows strong alignment with GTM partners and ESG goals, which are positive signals. However, its M&A readiness is a moderate concern due to reporting gaps. The strong VC fit suggests it is well-positioned for fundraising within its target investor segment. The overall strategic fit is positive but requires operational improvements for M&A scenarios."
}

const signalVariantMap: Record<string, BadgeProps['variant']> = {
  green: 'success',
  yellow: 'warning',
  red: 'destructive',
};

const DirectionIcon = ({ direction }: { direction: string }) => {
  if (direction === 'up') return <ArrowUp className="size-3 text-success" />;
  if (direction === 'down') return <ArrowDown className="size-3 text-destructive" />;
  return <Minus className="size-3 text-muted-foreground" />;
}

const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-success';
    if (trend < 0) return 'text-destructive';
    return 'text-muted-foreground';
}

export function StrategicFitMatrix() {
  const { isEditable } = useEvaluationContext();
  const [fitData, setFitData] = useState(initialFitData);

  const handleInterpretationChange = (value: string) => {
      setFitData(prev => ({...prev, interpretation: value}));
  }

  return (
    <DashboardCard
      title="Strategic Fit Matrix"
      icon={LayoutGrid}
      description="Alignment with key strategic pathways."
    >
        <div className='space-y-6'>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Pathway</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead>Trend (Δ)</TableHead>
                    <TableHead>Notes</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {fitData.data.map((item) => (
                    <TableRow key={item.pathway}>
                    <TableCell className="font-medium">{item.pathway}</TableCell>
                    <TableCell>
                        <Badge variant={signalVariantMap[item.signal] || 'default'}>
                        {item.signal}
                        </Badge>
                    </TableCell>
                    <TableCell className={cn("flex items-center gap-1 font-semibold", getTrendColor(item.trend))}>
                        <DirectionIcon direction={item.direction} />
                        {item.trend.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                        {item.notes}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            <Separator />
            <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">AI Interpretation</h4>
                {isEditable ? (
                    <Textarea value={fitData.interpretation} onChange={(e) => handleInterpretationChange(e.target.value)} rows={4} className="text-base"/>
                ) : (
                    <p className="text-sm text-muted-foreground">{fitData.interpretation}</p>
                )}
            </div>
      </div>
    </DashboardCard>
  );
}

    