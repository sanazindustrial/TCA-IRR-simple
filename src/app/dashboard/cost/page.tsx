
'use client';
import { useState } from 'react';
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

const initialCostData = {
  totalCost: 82.75,
  totalRequests: 4,
  billedUsers: 3,
  dailyAverage: 2.76,
  breakdown: [
    { category: 'Authentication', cost: 14.5, percentage: 17.5, executions: 121800 },
    { category: 'Cybersecurity', cost: 27.25, percentage: 33.0, executions: 58200 },
    { category: 'Networking', cost: 35.75, percentage: 43.2, executions: 227500 },
    { category: 'Storage', cost: 5.25, percentage: 6.3, executions: 75200 },
  ],
  trends: [
    { date: '11/14/2023', cost: 15.68 },
    { date: '11/13/2023', cost: 21.44 },
    { date: '11/12/2023', cost: 44.22 },
  ],
  aiBreakdown: {
    totalAiCost: 35.80,
    costPerAnalysis: 0.45,
    inputTokens: 12500000,
    outputTokens: 3125000,
    models: [
        { name: 'Analysis (GPT-4)', cost: 28.50, percentage: 79.6 },
        { name: 'Embedding (Ada)', cost: 4.25, percentage: 11.9 },
        { name: 'Fine-Tuning', cost: 3.05, percentage: 8.5 },
    ],
    costByUser: [
        { name: 'Admin User', cost: 15.50, percentage: 43.3 },
        { name: 'Reviewer One', cost: 12.30, percentage: 34.3 },
        { name: 'Standard User', cost: 8.00, percentage: 22.4 },
    ],
    costByReportType: [
        { name: 'Triage Reports', cost: 25.40, percentage: 71.0 },
        { name: 'Due Diligence', cost: 10.40, percentage: 29.0 },
    ]
  }
};

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
  const [costData, setCostData] = useState(initialCostData);
  const [dateRange, setDateRange] = useState({
    from: new Date(2023, 10, 1),
    to: new Date(2023, 10, 14),
  });
  const [activityFilter, setActivityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [liveUpdate, setLiveUpdate] = useState(true);
  const { toast } = useToast();
  
  const simulateDataUpdate = () => {
    setCostData(prevData => {
        // Create a simple hash from filter values to make changes more deterministic
        const filterString = `${activityFilter}-${userFilter}`;
        let hash = 0;
        for (let i = 0; i < filterString.length; i++) {
            hash = (hash << 5) - hash + filterString.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        
        const baseMultiplier = 1 + (Math.abs(hash) % 100) / 200; // Multiplier between 1 and 1.5

        const newTotalCost = initialCostData.totalCost * baseMultiplier * (Math.random() * 0.1 + 0.95);

        return {
            ...prevData,
            totalCost: newTotalCost,
            dailyAverage: newTotalCost / 14,
            totalRequests: Math.floor(prevData.totalRequests * (Math.random() * 0.5 + 0.7)),
            breakdown: prevData.breakdown.map(item => ({
                ...item,
                cost: item.cost * baseMultiplier * (Math.random() * 0.4 + 0.7),
            })).sort((a,b) => b.cost - a.cost),
            aiBreakdown: {
                ...prevData.aiBreakdown,
                totalAiCost: prevData.aiBreakdown.totalAiCost * baseMultiplier * (Math.random() * 0.3 + 0.8),
            }
        };
    });
  };

  const handleApplyFilters = () => {
    toast({
      title: 'Filters Applied',
      description: 'The cost data has been updated based on your selections.',
    });
    simulateDataUpdate();
  };
  
  const handleFilterChange = (type: 'activity' | 'user' | 'date', value: any) => {
    if (type === 'activity') setActivityFilter(value);
    if (type === 'user') setUserFilter(value);
    if (type === 'date' && value) setDateRange(value);

    if (liveUpdate) {
        // Debounce or directly call update
        setTimeout(() => {
          simulateDataUpdate();
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
      description: 'The latest cost data is being fetched.',
    });
    simulateDataUpdate();
  }

  const aiCostPercentage = (costData.aiBreakdown.totalAiCost / costData.totalCost) * 100;

  return (
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
            <Switch id="live-update" checked={liveUpdate} onCheckedChange={setLiveUpdate}/>
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
                    <CardTitle className="flex items-center gap-2"><Cpu className="text-primary"/> AI & ML Cost Breakdown</CardTitle>
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
                                <TableHead className="w-[50px]"><Checkbox/></TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                                <TableHead className="text-right">Executions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {costData.trends.map(trend => (
                                <TableRow key={trend.date}>
                                    <TableCell><Checkbox/></TableCell>
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
  );
}
    
    

    

    