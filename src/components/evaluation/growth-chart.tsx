
'use client';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

type GrowthChartProps = {
  data: {
    name: string;
    growth: number;
  }[];
};

const chartConfig = {
  growth: {
    label: 'YoY Growth',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

export function GrowthChart({ data }: GrowthChartProps) {
  return (
    <ChartContainer config={chartConfig} className="w-full h-48">
      <BarChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.replace(' Case', '')}
        />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="growth" fill="var(--color-growth)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
