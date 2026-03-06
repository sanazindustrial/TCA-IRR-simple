
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Timer,
  Users,
  BarChart,
  AlertTriangle,
  CheckCircle,
  Activity,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const initialHealthData = {
  cpu: 39.8,
  memory: 64.8,
  disk: 34.0,
  network: 80.8,
  responseTime: 113.49,
  responseTimeChange: 15,
  activeUsers: 156,
  activeUsersChange: 12,
  apiCalls: 12473,
  apiCallsChange: 5.2,
  uptime: 99.9,
  errorRate: 0.2,
};

const initialAlerts = [
    { id: 'alert-1', variant: 'warning' as const, title: 'High Memory Usage', description: 'Memory usage is at 67% - consider scaling.', timestamp: '10/24/2025, 6:34:42 AM' },
    { id: 'alert-2', variant: 'default' as const, title: 'Backup Completed', description: 'Daily backup completed successfully.', timestamp: '10/24/2025, 5:14:42 AM' },
];

const StatCard = ({
  title,
  value,
  progress,
  icon: Icon,
}: {
  title: string;
  value: number;
  progress: number;
  icon: React.ElementType;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value.toFixed(1)}%</div>
      <Progress value={progress} className="mt-2 h-2" />
    </CardContent>
  </Card>
);

const SmallStatCard = ({
  title,
  value,
  change,
  changeType,
  unit,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  unit: string;
  icon: React.ElementType;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground flex items-center">
        {changeType === 'increase' ? (
          <ArrowUp className="h-3 w-3 text-success mr-1" />
        ) : (
          <ArrowDown className="h-3 w-3 text-destructive mr-1" />
        )}
        {change.toFixed(change % 1 === 0 ? 0 : 2)}{unit} from yesterday
      </p>
    </CardContent>
  </Card>
);

export default function SystemHealthPage() {
    const [healthData, setHealthData] = useState(initialHealthData);
    const [alerts, setAlerts] = useState(initialAlerts);
    const [currentTime, setCurrentTime] = useState(new Date());

    const updateHealthData = () => {
        setHealthData(prev => ({
            ...prev,
            cpu: Math.random() * 80 + 10, // Keep it in a reasonable range
            memory: Math.random() * 70 + 20,
            disk: prev.disk + Math.random() * 0.01,
            network: Math.random() * 100,
            responseTime: Math.random() * 150 + 50,
            activeUsers: Math.floor(Math.random() * 50) + 120,
            apiCalls: prev.apiCalls + Math.floor(Math.random() * 100),
        }));
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const healthTimer = setInterval(updateHealthData, 3000); // Update health data every 3 seconds

        return () => {
            clearInterval(timer);
            clearInterval(healthTimer);
        };
    }, []);

    const handleRefresh = () => {
        updateHealthData();
    };

    const handleResolve = (alertId: string) => {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    };

    const getAlertIcon = (variant: 'warning' | 'default') => {
        switch(variant) {
            case 'warning': return <AlertTriangle className="h-4 w-4" />;
            case 'default': return <CheckCircle className="h-4 w-4" />;
            default: return <AlertTriangle className="h-4 w-4" />;
        }
    }


  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Activity className="text-primary" />
            System Health Monitor
          </h1>
          <p className="text-muted-foreground">
            Real-time system performance and health metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">HEALTHY</Badge>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="CPU Usage" value={healthData.cpu} progress={healthData.cpu} icon={Cpu} />
        <StatCard title="Memory" value={healthData.memory} progress={healthData.memory} icon={MemoryStick} />
        <StatCard title="Disk Usage" value={healthData.disk} progress={healthData.disk} icon={HardDrive} />
        <StatCard title="Network" value={healthData.network} progress={healthData.network} icon={Wifi} />
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <SmallStatCard
            title="Response Time"
            value={`${healthData.responseTime.toFixed(2)}ms`}
            change={healthData.responseTimeChange}
            changeType="increase"
            unit="ms"
            icon={Timer}
        />
        <SmallStatCard
            title="Active Users"
            value={healthData.activeUsers.toString()}
            change={healthData.activeUsersChange}
            changeType="increase"
            unit=""
            icon={Users}
        />
        <SmallStatCard
            title="API Calls"
            value={healthData.apiCalls.toLocaleString()}
            change={healthData.apiCallsChange}
            changeType="increase"
            unit="%"
            icon={BarChart}
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts.length > 0 ? alerts.map(alert => (
            <Alert key={alert.id} variant={alert.variant}>
                {getAlertIcon(alert.variant)}
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription className='flex justify-between items-center'>
                <div>
                    {alert.description}
                    <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleResolve(alert.id)}>Resolve</Button>
                </AlertDescription>
            </Alert>
          )) : (
            <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="mx-auto size-8 text-success"/>
                <p className="mt-2">No active alerts.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>System Status Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground">Uptime</h3>
            <p className="text-2xl font-bold text-success flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-success"></span>
                {healthData.uptime}%
            </p>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </div>
           <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground">Error Rate</h3>
            <p className="text-2xl font-bold text-success flex items-center gap-2">
                 <span className="h-3 w-3 rounded-full bg-success"></span>
                 {healthData.errorRate}%
            </p>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
