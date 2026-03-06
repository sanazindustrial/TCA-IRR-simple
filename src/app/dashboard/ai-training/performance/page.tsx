
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChartComponent } from './area-chart';
import { ConfusionMatrix } from './confusion-matrix';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, CheckCircle, AlertTriangle } from 'lucide-react';

const kpiData = [
  { name: 'Accuracy', value: '94.5%', change: '+1.2%', status: 'success' },
  { name: 'Precision (Macro)', value: '0.89', change: '+0.03', status: 'success' },
  { name: 'Recall (Macro)', value: '0.87', change: '-0.01', status: 'destructive' },
  { name: 'F1-Score (Macro)', value: '0.88', change: '+0.01', status: 'success' },
];

const rocData = [
    { name: '0.0', value: 0 },
    { name: '0.1', value: 0.3 },
    { name: '0.2', value: 0.55 },
    { name: '0.3', value: 0.7 },
    { name: '0.4', value: 0.8 },
    { name: '0.5', value: 0.85 },
    { name: '0.6', value: 0.9 },
    { name: '0.7', value: 0.94 },
    { name: '0.8', value: 0.97 },
    { name: '0.9', value: 0.99 },
    { name: '1.0', value: 1.0 },
];

const KpiCard = ({ title, value, change, status }: { title: string, value: string, change: string, status: 'success' | 'destructive' }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-3xl font-bold">{value}</p>
            <div className="flex items-center text-sm">
                {status === 'success' ? <TrendingUp className="text-success mr-1 size-4" /> : <TrendingUp className="text-destructive mr-1 size-4 rotate-180" />}
                <span className={status === 'success' ? 'text-success' : 'text-destructive'}>{change}</span>
                <span className="text-muted-foreground ml-1">vs last run</span>
            </div>
        </CardContent>
    </Card>
);

export default function PerformancePage() {
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiData.map(kpi => <KpiCard key={kpi.name} {...kpi} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>ROC/AUC Curve</CardTitle>
                    <CardDescription>
                       Area Under Curve: 0.91
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AreaChartComponent data={rocData} />
                </CardContent>
            </Card>
             <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Confusion Matrix</CardTitle>
                    <CardDescription>
                        Predicted vs. Actual Labels
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ConfusionMatrix />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
