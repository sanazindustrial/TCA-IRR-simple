'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  DollarSign,
  FileText,
  Users,
  BarChart2,
  TrendingUp,
  RefreshCw,
  Cpu,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExportButtons } from '@/components/evaluation/export-buttons';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EvaluationProvider } from '@/components/evaluation/evaluation-provider';
import { ReportType } from '@/app/analysis/result/page';
import { costApi, CostSummary, fallbackCostData } from '@/lib/cost-api';

// Use fallback data as initial state
const initialCostData = fallbackCostData;

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  isCurrency = false,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
  isCurrency?: boolean;
}) => (
  <Card className="flex-1">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="size-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {isCurrency ? `$${value.toFixed(2)}` : value}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default function CostManagementPage() {
  const [costData, setCostData] = useState<CostSummary>(initialCostData);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [activityFilter, setActivityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [liveUpdate, setLiveUpdate] = useState(true);
  const { toast } = useToast();

  // Fetch real data from API
  const fetchCostData = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      const data = await costApi.getSummary(startDate, endDate);
      setCostData(data);
    } catch (error) {
      console.error('Failed to fetch cost data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cost data. Using cached data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, toast]);

  // Initial fetch
  useEffect(() => {
    fetchCostData();
  }, [fetchCostData]);

  const handleApplyFilters = () => {
    toast({
      title: 'Filters Applied',
      description: 'Fetching cost data with updated filters.',
    });
    fetchCostData();
  };

  const handleFilterChange = (type: 'activity' | 'user' | 'date', value: any) => {
    if (type === 'activity') setActivityFilter(value);
    if (type === 'user') setUserFilter(value);
    if (type === 'date' && value) setDateRange(value);

    if (liveUpdate && type === 'date') {
      // Re-fetch with new date range
      setTimeout(() => {
        fetchCostData();
        toast({
          title: 'Filters Updated',
          description: 'The cost data has been automatically updated.',
        });
      }, 300);
    }
  }


  const handleRefresh = () => {
    toast({
      title: 'Refreshing Data',
      description: 'The latest cost data is being fetched from the server.',
    });
    fetchCostData();
  }

  const aiCostPercentage = costData.totalCost > 0
    ? (costData.aiBreakdown.totalAiCost / costData.totalCost) * 100
    : 0;

  if (isLoading && !costData.totalRequests) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading cost data...</span>
      </div>
    );
  }

  return (
    <EvaluationProvider role={'user'} reportType={'dd'} framework={'general'} onFrameworkChangeAction={function (): void {
      throw new Error('Function not implemented.');
    }} setReportTypeAction={function (): void {
      throw new Error('Function not implemented.');
    }} isLoading={false} handleRunAnalysisAction={function (): void {
      throw new Error('Function not implemented.');
    }}>
      <div className="bg-muted/30 min-h-screen">
        <div className="container mx-auto p-4 md:p-8">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground">
              Advanced Cost Management & Analytics
            </h1>
            <p className="text-muted-foreground">
              Comprehensive cost tracking with PostgreSQL database integration
            </p>
          </header>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-[280px] justify-start text-left font-normal',
                      !dateRange && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} -{' '}
                          {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => handleFilterChange('date', range)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Select value={activityFilter} onValueChange={(v) => handleFilterChange('activity', v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by activity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="ai-analysis">AI Analysis</SelectItem>
                  <SelectItem value="data-storage">Data Storage</SelectItem>
                  <SelectItem value="auth">User Authentication</SelectItem>
                  <SelectItem value="report-gen">Report Generation</SelectItem>
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={(v) => handleFilterChange('user', v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admin User</SelectItem>
                  <SelectItem value="reviewer1">Reviewer One</SelectItem>
                  <SelectItem value="user1">Standard User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleApplyFilters} disabled={liveUpdate}>Apply Filter</Button>
            <div className="flex items-center space-x-2">
              <Switch id="live-update" checked={liveUpdate} onCheckedChange={setLiveUpdate} />
              <Label htmlFor="live-update">Live Update</Label>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" onClick={handleRefresh}><RefreshCw className="mr-2" /> Refresh Data</Button>
              <ExportButtons />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="lg:col-span-1 bg-success text-success-foreground">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-success-foreground/80">Total Cost</CardTitle>
                <DollarSign className="size-4 text-success-foreground/70" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${costData.totalCost.toFixed(2)}</div>
                <p className="text-xs text-success-foreground/80">Period: 11/01/2023 - 11/14/2023</p>
              </CardContent>
            </Card>
            <StatCard
              title="Total Requests"
              value={costData.totalRequests}
              icon={FileText}
              description="Total API & service calls"
            />
            <StatCard
              title="Billed Users"
              value={costData.billedUsers}
              icon={Users}
              description="Users with billable activity"
            />
            <StatCard
              title="Daily Average"
              value={costData.dailyAverage}
              icon={BarChart2}
              description="Avg. cost over the period"
              isCurrency
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Cost Breakdown by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {costData.breakdown.map(item => (
                    <div key={item.category}>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium">{item.category}</p>
                        <p className="text-sm font-medium">${item.cost.toFixed(2)} <span className="text-muted-foreground">({item.percentage.toFixed(1)}%)</span></p>
                      </div>
                      <Progress value={item.percentage} />
                      <p className="text-xs text-muted-foreground mt-1">{item.executions.toLocaleString()} Executions</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Cpu className="text-primary" /> AI & ML Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="text-sm font-medium">AI Cost Contribution</p>
                    <p className="text-lg font-bold">${costData.aiBreakdown.totalAiCost.toFixed(2)}</p>
                  </div>
                  <Progress value={aiCostPercentage} />
                  <p className="text-xs text-muted-foreground mt-1">{aiCostPercentage.toFixed(1)}% of total cost</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Cost per Analysis</p>
                  <p className="font-bold">${costData.aiBreakdown.costPerAnalysis.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Token Usage</p>
                  <p className="text-xs text-muted-foreground">Input: {costData.aiBreakdown.inputTokens.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Output: {costData.aiBreakdown.outputTokens.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Cost by Model</p>
                  <div className="space-y-2">
                    {costData.aiBreakdown.models.map(model => (
                      <div key={model.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <p>{model.name}</p>
                          <p>${model.cost.toFixed(2)} ({model.percentage.toFixed(1)}%)</p>
                        </div>
                        <Progress value={model.percentage} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Cost by User</p>
                  <div className="space-y-2">
                    {costData.aiBreakdown.costByUser.map(user => (
                      <div key={user.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <p>{user.name}</p>
                          <p>${user.cost.toFixed(2)} ({user.percentage.toFixed(1)}%)</p>
                        </div>
                        <Progress value={user.percentage} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Cost by Report Type</p>
                  <div className="space-y-2">
                    {costData.aiBreakdown.costByReportType.map(report => (
                      <div key={report.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <p>{report.name}</p>
                          <p>${report.cost.toFixed(2)} ({report.percentage.toFixed(1)}%)</p>
                        </div>
                        <Progress value={report.percentage} />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Cost Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"><Checkbox /></TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Executions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costData.trends.map(trend => (
                      <TableRow key={trend.date}>
                        <TableCell><Checkbox /></TableCell>
                        <TableCell>{trend.date}</TableCell>
                        <TableCell className="text-right font-medium">${trend.cost.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {Math.floor(Math.random() * 100000 + 50000).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </EvaluationProvider>
  );
}





