'use client';

import { TrendingDown, TrendingUp, Minus, Bot, Gauge } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DashboardCard } from '../shared/dashboard-card';
import { FileDiff } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

const chartData = [
  { category: 'Team', ai: 8.2, reviewer: 7.0 },
  { category: 'Product', ai: 9.1, reviewer: 9.5 },
  { category: 'Market', ai: 7.5, reviewer: 8.0 },
  { category: 'GTM', ai: 6.0, reviewer: 7.5 },
  { category: 'Financials', ai: 6.8, reviewer: 6.0 },
];

const chartConfig = {
  ai: { label: 'AI Score', color: 'hsl(var(--primary))' },
  reviewer: { label: 'Reviewer Score', color: 'hsl(var(--accent))' },
};

const MetricItem = ({ title, value, change, changeType }: { title: string, value: string, change: string, changeType: 'increase' | 'decrease' }) => (
    <div className="p-3 bg-muted/50 rounded-lg text-center">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className={`text-xs flex items-center justify-center ${changeType === 'increase' ? 'text-success' : 'text-destructive'}`}>
            {changeType === 'increase' ? <TrendingUp className="size-3 mr-1"/> : <TrendingDown className="size-3 mr-1"/>}
            {change} from last training
        </p>
    </div>
);


export function ReviewerAIDeviation() {
  const { toast } = useToast();

  const handleSubmitForTraining = () => {
    toast({
      title: 'Submitted for Training',
      description: 'The analysis data has been added to the model training queue.',
    });
  };

  const handleFlagForReview = () => {
    toast({
      title: 'Flagged for Manual Review',
      description: 'A notification has been sent to the admin team for further review.',
    });
  };
  
  return (
    <DashboardCard
      title="AI vs. Human Gap Analysis"
      icon={FileDiff}
      description="Compare AI scores against human reviewer inputs."
    >
      <div className="space-y-6">
        <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-muted-foreground"><Gauge/> Calibration & Quality Gap Analysis</h4>
            <div className="grid grid-cols-3 gap-4">
                <MetricItem title="Mean Absolute Error (MAE)" value="0.85" change="15%" changeType="decrease"/>
                <MetricItem title="Cohen's Kappa (κ)" value="0.72" change="8%" changeType="increase"/>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Bias Drift (Sector)</p>
                    <p className="text-2xl font-bold">0.03</p>
                    <p className="text-xs text-muted-foreground">New bias detected</p>
                </div>
            </div>
        </div>

        <Separator />
        
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="ai" fill="var(--color-ai)" radius={4} />
            <Bar dataKey="reviewer" fill="var(--color-reviewer)" radius={4} />
          </BarChart>
        </ChartContainer>
        <Separator />
        <div>
          <h4 className="font-semibold text-sm mb-2">Deviation Rationale</h4>
          <p className="text-muted-foreground text-sm">
            Placeholder for reviewer's notes on why their scores differ from
            the AI's. Example: "AI may have over-indexed on the CEO's past
            experience while I believe the current market conditions present a
            greater challenge, hence my lower 'Market' score."
          </p>
        </div>
        <Separator />
        <div className="border-l-4 border-muted p-3 bg-muted/50 rounded-r-lg">
          <h4 className="font-semibold flex items-center gap-2">
            <Bot />
            AI Recommendation for Model Training
          </h4>
          <p className="text-muted-foreground text-sm mt-2">
            Based on the deviation, recommend increasing weight on 'GTM'
            strategy analysis and slightly reducing weight on 'Team' experience
            for seed-stage companies. The reviewer's higher scores in 'Market'
            and 'GTM' suggest the model may be too conservative on companies
            entering competitive but large markets.
          </p>
        </div>
        <div className="flex gap-4 pt-4">
          <Button onClick={handleSubmitForTraining}>Submit for Training</Button>
          <Button variant="outline" onClick={handleFlagForReview}>Flag for Manual Review</Button>
        </div>
      </div>
    </DashboardCard>
  );
}
