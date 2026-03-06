
'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

export function AreaChartComponent({ data }: { data: any[] }) {
  return (
    <div className="w-full h-80">
      <ChartContainer
        config={{
          value: {
            label: 'True Positive Rate',
            color: 'hsl(var(--primary))',
          },
        }}
      >
        <AreaChart
          data={data}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
             label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -10 }}
          />
           <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft' }}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Area
            dataKey="value"
            type="natural"
            fill="var(--color-value)"
            fillOpacity={0.4}
            stroke="var(--color-value)"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
