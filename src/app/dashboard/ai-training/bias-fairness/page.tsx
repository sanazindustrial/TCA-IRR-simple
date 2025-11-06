
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChartComponent } from './bar-chart';
import { Users, FileJson, Scale } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const fairnessData = [
  { group: 'Female Founders', metric: 'Equal Opportunity', score: -0.05, status: 'Fair' },
  { group: 'URM Founders', metric: 'Equal Opportunity', score: -0.08, status: 'Fair' },
  { group: 'Non-US Founders', metric: 'Demographic Parity', score: 0.15, status: 'Review' },
];

const explainabilityData = [
    { feature: 'team.founder_experience', score: 0.35 },
    { feature: 'market.tam', score: 0.25 },
    { feature: 'financials.revenue_growth', score: 0.20 },
    { feature: 'product.quality_score', score: 0.15 },
    { feature: 'competition.moat_strength', score: 0.05 },
]

export default function BiasFairnessPage() {
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><Scale /> Fairness Metrics</CardTitle>
                <CardDescription>
                Analysis of model performance across different demographic subgroups.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Subgroup</TableHead>
                            <TableHead>Metric</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fairnessData.map(item => (
                            <TableRow key={item.group}>
                                <TableCell>{item.group}</TableCell>
                                <TableCell>{item.metric}</TableCell>
                                <TableCell className={item.score < 0 ? 'text-success' : 'text-warning'}>
                                    {item.score.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'Fair' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                                        {item.status}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileJson /> Model Explainability (SHAP)</CardTitle>
                <CardDescription>
                Top features influencing the model's predictions for the current evaluation.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <BarChartComponent data={explainabilityData} />
            </CardContent>
        </Card>
    </div>
  );
}
