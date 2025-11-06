
'use client';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

export function LineChartComponent({ data }: { data: any[] }) {
  return (
    <div className="w-full h-64">
        <ChartContainer
            config={{
            drift: {
                label: 'PSI',
                color: 'hsl(var(--primary))',
            },
            }}
        >
            <LineChart
            data={data}
            margin={{
                top: 5,
                right: 20,
                left: -10,
                bottom: 5,
            }}
            >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
                type="monotone"
                dataKey="drift"
                stroke="var(--color-drift)"
                strokeWidth={2}
                dot={false}
            />
            </LineChart>
        </ChartContainer>
    </div>
  );
}
