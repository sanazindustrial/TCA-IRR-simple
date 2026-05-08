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
import { DollarSign, TrendingUp, Gauge, Calendar, Forward } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useState } from 'react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';

const initialFinancialsData = {
  metrics: [
    { name: 'Runway', value: '12 months', status: 'warning' as 'success' | 'warning' | 'destructive' },
    { name: 'Revenue Growth (YoY)', value: '+120%', status: 'success' as 'success' | 'warning' | 'destructive' },
    { name: 'LTV:CAC Ratio', value: '3.5 : 1', status: 'success' as 'success' | 'warning' | 'destructive' },
    { name: 'Burn Multiple', value: '1.2', status: 'success' as 'success' | 'warning' | 'destructive' },
  ],
  breakevenRoadmap: "The company projects reaching breakeven in 18-24 months, contingent on achieving Series A funding and hitting revenue targets. The plan relies on scaling the direct sales team and expanding into two new industry verticals.",
  interpretation: "The financial health shows a classic high-growth, high-burn profile. The impressive revenue growth and healthy LTV:CAC ratio are strong positive signals. However, the 12-month runway is a significant risk and makes the upcoming funding round critical. The breakeven roadmap is achievable but aggressive."
};

const MetricCard = ({ name, value, status }: {name: string, value: string, status: 'success' | 'warning' | 'destructive'}) => {
    const iconMap = {
        'Runway': Calendar,
        'Revenue Growth (YoY)': TrendingUp,
        'LTV:CAC Ratio': Gauge,
        'Burn Multiple': DollarSign
    };
    const Icon = iconMap[name as keyof typeof iconMap] || DollarSign;

    return (
        <Card className="flex-1">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Icon className="size-4" /> {name}</p>
                    <Badge variant={status}>{status}</Badge>
                </div>
                <p className="text-3xl font-bold">{value}</p>
            </CardContent>
        </Card>
    )
}

export function FinancialsBurnRate() {
  const { isEditable } = useEvaluationContext();
  const [data, setData] = useState(initialFinancialsData);
  
  const handleTextChange = (field: 'breakevenRoadmap' | 'interpretation', value: string) => {
    setData(prev => ({...prev, [field]: value}));
  };

  return (
    <DashboardCard
      title="Financials & Burn Rate"
      icon={DollarSign}
      description="Runway, revenue growth, CAC/LTV, and breakeven roadmap."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.metrics.map(metric => (
                <MetricCard key={metric.name} {...metric} />
            ))}
        </div>
        
         <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground"><Forward />Breakeven Roadmap</h4>
            {isEditable ? (
                <Textarea value={data.breakevenRoadmap} onChange={(e) => handleTextChange('breakevenRoadmap', e.target.value)} rows={3} />
            ) : (
                <p className="text-sm text-muted-foreground">{data.breakevenRoadmap}</p>
            )}
        </div>
        
        <Separator />

        <div>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">AI Interpretation</h4>
            {isEditable ? (
                <Textarea value={data.interpretation} onChange={(e) => handleTextChange('interpretation', e.target.value)} rows={4} className="text-base"/>
            ) : (
                <p className="text-sm text-muted-foreground">{data.interpretation}</p>
            )}
        </div>
      </div>
    </DashboardCard>
  );
}
