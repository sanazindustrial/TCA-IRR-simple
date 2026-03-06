
import type { AssessMacroTrendAlignmentOutput } from '@/ai/flows/schemas';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { Progress } from '@/components/ui/progress';
import { Globe, TrendingUp } from 'lucide-react';
import { PestelChart } from './pestel-chart';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '../ui/badge';

type MacroTrendAlignmentProps = {
  data: AssessMacroTrendAlignmentOutput;
};

const getScoreColor = (score: number) => {
  if (score >= 8) return 'text-success';
  if (score >= 6.5) return 'text-warning';
  return 'text-destructive';
};

export function MacroTrendAlignment({ data }: MacroTrendAlignmentProps) {
  if (!data) {
    return null;
  }
  const scorePercentage = (data.trendOverlayScore || 0) * 100 * 20; // Scale -0.05 to 0.05 -> -100 to 100, then to 0-100
  const displayScore = data.trendOverlayScore > 0 ? `+${(data.trendOverlayScore*100).toFixed(1)}%` : `${(data.trendOverlayScore*100).toFixed(1)}%`;

  const pestelDataForTable = [
      { factor: 'Political', score: data.pestelDashboard.political, signal: 'Stable regulatory environment' },
      { factor: 'Economic', score: data.pestelDashboard.economic, signal: 'Moderate economic headwinds' },
      { factor: 'Social', score: data.pestelDashboard.social, signal: 'Growing demand for remote work tools' },
      { factor: 'Technological', score: data.pestelDashboard.technological, signal: 'High enterprise AI adoption' },
      { factor: 'Environmental', score: data.pestelDashboard.environmental, signal: 'Low direct impact' },
      { factor: 'Legal', score: data.pestelDashboard.legal, signal: 'Data privacy laws evolving' },
  ];

  return (
    <DashboardCard
      title="Macro Trend Alignment"
      icon={Globe}
      description="PESTEL analysis and trend overlay scores."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Overall Trend Alignment (Overlay Score)
              </p>
              <p className="text-3xl font-bold text-primary">{displayScore}</p>
              <Progress value={50 + scorePercentage / 2} className="mt-2 h-2" />
            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="text-base">PESTEL Score Matrix</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Factor</TableHead>
                                <TableHead>Signal</TableHead>
                                <TableHead className="text-right">Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pestelDataForTable.map((item) => (
                                <TableRow key={item.factor}>
                                    <TableCell className="font-semibold">{item.factor}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{item.signal}</TableCell>
                                    <TableCell className={`text-right font-bold ${getScoreColor(item.score)}`}>{item.score}/10</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
        </div>
        <div>
           <PestelChart data={data.pestelDashboard} />
        </div>
      </div>
      
      <Separator className='my-6'/>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 text-sm'>
        <div>
             <h4 className='font-semibold mb-2'>Alignment Summary</h4>
            <p className="text-muted-foreground">
              {data.summary}
            </p>
        </div>
        <div>
             <h4 className='font-semibold mb-2'>Sector-Specific Outlook</h4>
            <p className="text-muted-foreground">
              {data.sectorOutlook}
            </p>
        </div>
      </div>
    </DashboardCard>
  );
}
