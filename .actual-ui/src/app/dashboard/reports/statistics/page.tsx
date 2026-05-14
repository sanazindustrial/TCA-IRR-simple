'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Download,
  RefreshCw,
  Activity,
  LineChart,
  Pie,
  Calendar,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AnalysisStats {
  totalAnalyses: number;
  completedAnalyses: number;
  failedAnalyses: number;
  averageTcaScore: number;
  averageRiskScore: number;
  totalCompaniesAnalyzed: number;
  analysesThisMonth: number;
  analysesThisWeek: number;
  moduleScores: Record<string, number>;
  topPerformingSector: string;
  topPerformingIndustry: string;
  riskDistribution: Record<string, number>;
  successRate: number;
  averageAnalysisTime: number;
}

export default function StatisticsReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      // Mock statistics data - replace with actual API call
      const mockStats: AnalysisStats = {
        totalAnalyses: 156,
        completedAnalyses: 148,
        failedAnalyses: 8,
        averageTcaScore: 72.4,
        averageRiskScore: 42.1,
        totalCompaniesAnalyzed: 142,
        analysesThisMonth: 34,
        analysesThisWeek: 8,
        moduleScores: {
          'TCA Scorecard': 75.2,
          'Risk Assessment': 68.4,
          'Market Analysis': 71.8,
          'Team Assessment': 79.3,
          'Financial Analysis': 73.1,
        },
        topPerformingSector: 'Technology',
        topPerformingIndustry: 'SaaS',
        riskDistribution: {
          'Low Risk': 52,
          'Medium Risk': 78,
          'High Risk': 18,
        },
        successRate: 94.9,
        averageAnalysisTime: 2.3,
      };
      setStats(mockStats);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['Metric', 'Value'],
        ['Total Analyses', stats?.totalAnalyses],
        ['Completed Analyses', stats?.completedAnalyses],
        ['Failed Analyses', stats?.failedAnalyses],
        ['Success Rate (%)', stats?.successRate],
        ['Average TCA Score', stats?.averageTcaScore],
        ['Average Risk Score', stats?.averageRiskScore],
        ['Total Companies Analyzed', stats?.totalCompaniesAnalyzed],
        ['Analyses This Month', stats?.analysesThisMonth],
        ['Analyses This Week', stats?.analysesThisWeek],
      ]
        .map((row) => row.join(','))
        .join('\n');

      const element = document.createElement('a');
      element.setAttribute(
        'href',
        'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent)
      );
      element.setAttribute('download', 'statistics_report.csv');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast({
        title: 'Success',
        description: 'Statistics exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export statistics',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex items-center justify-center h-64">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">No Data Available</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Unable to load statistics. Please try again.
              </p>
              <Button onClick={fetchStatistics} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard/reports')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-8 w-8" />
                  Statistics Report
                </h1>
                <p className="text-sm text-muted-foreground">
                  Analysis metrics and performance overview
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchStatistics}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="flex gap-2">
            {['week', 'month', 'quarter', 'year'].map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange(range)}
                className="capitalize"
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Total Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats.analysesThisMonth} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
              <Progress value={stats.successRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completedAnalyses} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Avg TCA Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageTcaScore.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                out of 100
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompaniesAnalyzed}</div>
              <p className="text-xs text-muted-foreground mt-1">
                unique entities
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Module Scores */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Module Performance
            </CardTitle>
            <CardDescription>
              Average scores across all analysis modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.moduleScores).map(([module, score]) => (
                <div key={module}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{module}</span>
                    <span className="text-sm font-semibold">{score.toFixed(1)}%</span>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of companies by risk category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.riskDistribution).map(([risk, count]) => {
                  const colors: Record<string, string> = {
                    'Low Risk': 'bg-green-100 text-green-800',
                    'Medium Risk': 'bg-yellow-100 text-yellow-800',
                    'High Risk': 'bg-red-100 text-red-800',
                  };
                  const percentage =
                    ((count as number) / stats.totalCompaniesAnalyzed) * 100;
                  return (
                    <div key={risk}>
                      <div className="flex justify-between mb-2">
                        <Badge className={colors[risk]}>{risk}</Badge>
                        <span className="text-sm font-semibold">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Top Categories
              </CardTitle>
              <CardDescription>
                Best performing sectors and industries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Top Sector
                  </Label>
                  <div className="mt-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-lg font-bold">{stats.topPerformingSector}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Top Industry
                  </Label>
                  <div className="mt-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
                    <p className="text-lg font-bold">{stats.topPerformingIndustry}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Summary Statistics
            </CardTitle>
            <CardDescription>
              Detailed breakdown of analysis metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Completed Analyses</TableCell>
                    <TableCell className="text-right font-semibold">
                      {stats.completedAnalyses}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Failed Analyses</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {stats.failedAnalyses}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Average Risk Score</TableCell>
                    <TableCell className="text-right font-semibold">
                      {stats.averageRiskScore.toFixed(1)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Analyses This Week</TableCell>
                    <TableCell className="text-right font-semibold">
                      {stats.analysesThisWeek}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Average Analysis Time</TableCell>
                    <TableCell className="text-right font-semibold">
                      {stats.averageAnalysisTime} hours
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/reports/triage">
              View Triage Report
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/reports">
              Back to Reports
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
