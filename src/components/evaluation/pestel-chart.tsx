'use client';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from 'recharts';

type PestelChartProps = {
  data: {
    political: number;
    economic: number;
    social: number;
    technological: number;
    environmental: number;
    legal: number;
  };
};

const chartConfig = {
  alignment: {
    label: 'Alignment',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

export function PestelChart({ data }: PestelChartProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    factor: key.charAt(0).toUpperCase() + key.slice(1),
    alignment: value,
    fullMark: 1,
  }));

  return (
    <ChartContainer config={chartConfig} className="w-full h-64">
      <RadarChart data={chartData}>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <PolarGrid />
        <PolarAngleAxis dataKey="factor" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
        <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
        <Radar
          name="Alignment"
          dataKey="alignment"
          stroke="hsl(var(--accent))"
          fill="hsl(var(--accent))"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ChartContainer>
  );
}
