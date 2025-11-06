
'use client';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

export function BarChartComponent({ data }: { data: any[] }) {
  return (
    <div className="w-full h-64">
        <ChartContainer
            config={{
                score: {
                    label: 'SHAP Value',
                    color: 'hsl(var(--primary))',
                },
            }}
        >
            <BarChart layout="vertical" data={data} margin={{ left: 30, right: 30 }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="feature" type="category" tick={{ fontSize: 10 }} width={150} interval={0} />
                <XAxis type="number" />
                <ChartTooltip content={<ChartTooltipContent />} cursor={false}/>
                <Bar dataKey="score" fill="var(--color-score)" radius={4} />
            </BarChart>
        </ChartContainer>
    </div>
  );
}
