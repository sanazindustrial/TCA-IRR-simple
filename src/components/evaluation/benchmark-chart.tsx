'use client';

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  PolarGrid,
  PolarAngleAxis,
  Radar,
  RadarChart,
} from 'recharts';

type BenchmarkChartProps = {
  data: {
    metric: string;
    startup: number;
    competitorA: number;
    competitorB: number;
  }[];
};

const chartConfig = {
  startup: {
    label: 'This Startup',
    color: 'hsl(var(--primary))',
  },
  competitorA: {
    label: 'Competitor A',
    color: 'hsl(var(--accent))',
  },
  competitorB: {
    label: 'Competitor B',
    color: 'hsl(var(--muted-foreground))',
  },
} satisfies ChartConfig;

export function BenchmarkChart({ data }: BenchmarkChartProps) {
  return (
    <ChartContainer config={chartConfig} className="w-full h-60">
      <RadarChart data={data}>
        <ChartTooltip content={<ChartTooltipContent />} />
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
        <Radar
          dataKey="startup"
          fill="var(--color-startup)"
          fillOpacity={0.6}
          stroke="var(--color-startup)"
        />
        <Radar
          dataKey="competitorA"
          fill="var(--color-competitorA)"
          fillOpacity={0.6}
          stroke="var(--color-competitorA)"
        />
        <Radar
          dataKey="competitorB"
          fill="var(--color-competitorB)"
          fillOpacity={0.6}
          stroke="var(--color-competitorB)"
        />
        <ChartLegend content={<ChartLegendContent />} />
      </RadarChart>
    </ChartContainer>
  );
}
