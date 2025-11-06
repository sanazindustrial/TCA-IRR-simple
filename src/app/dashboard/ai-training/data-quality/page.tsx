
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatabaseZap, FileWarning, TrendingUp } from 'lucide-react';
import { LineChartComponent } from './line-chart';

const completenessData = [
    { feature: 'company_description', completeness: 99.8 },
    { feature: 'financials.revenue', completeness: 85.2 },
    { feature: 'team.founder_experience', completeness: 92.5 },
    { feature: 'market.tam', completeness: 78.0 },
];

const driftData = [
    { month: 'Jan', drift: 0.05 },
    { month: 'Feb', drift: 0.06 },
    { month: 'Mar', drift: 0.08 },
    { month: 'Apr', drift: 0.11 },
    { month: 'May', drift: 0.15 },
    { month: 'Jun', drift: 0.14 },
];

const anomalyData = [
    { feature: 'financials.burn_rate', count: 12, type: 'Outlier' },
    { feature: 'company.founding_year', count: 3, type: 'Invalid Format' },
    { feature: 'market.competitors', count: 21, type: 'Missing Value' },
];

export default function DataQualityPage() {
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><DatabaseZap /> Data Completeness</CardTitle>
                <CardDescription>Percentage of non-missing values for key features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {completenessData.map(item => (
                    <div key={item.feature}>
                        <div className="flex justify-between mb-1">
                            <p className="text-sm font-mono">{item.feature}</p>
                            <p className="text-sm font-semibold">{item.completeness}%</p>
                        </div>
                        <Progress value={item.completeness} />
                    </div>
                ))}
            </CardContent>
        </Card>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'><TrendingUp /> Feature Drift Over Time (PSI)</CardTitle>
                    <CardDescription>Population Stability Index for key input features.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LineChartComponent data={driftData}/>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'><FileWarning/> Data Anomalies</CardTitle>
                    <CardDescription>Detected anomalies in the latest data ingest.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Feature</TableHead>
                                <TableHead>Anomaly Type</TableHead>
                                <TableHead className="text-right">Count</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {anomalyData.map(item => (
                                <TableRow key={item.feature}>
                                    <TableCell className="font-mono text-xs">{item.feature}</TableCell>
                                    <TableCell>{item.type}</TableCell>
                                    <TableCell className="text-right">{item.count}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
