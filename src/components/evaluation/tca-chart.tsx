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

type TcaChartProps = {
  data: {
    category: string;
    rawScore: number;
  }[];
};

const chartConfig = {
  score: {
    label: 'Score',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function TcaChart({ data }: TcaChartProps) {
  const chartData = data.map((item) => ({
    subject: item.category,
    score: item.rawScore,
    fullMark: 10,
  }));

  return (
    <ChartContainer config={chartConfig} className="w-full h-64">
      <RadarChart data={chartData}>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
        <PolarRadiusAxis angle={30} domain={[0, 10]} />
        <Radar
          name="Score"
          dataKey="score"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ChartContainer>
  );
}
