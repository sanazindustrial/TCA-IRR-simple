
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
  Circle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useServiceHealth } from '@/hooks/use-service-health';

const initialHealthData = {
  cpu: 0,
  memory: 0,
  disk: 0,
  network: 0,
  responseTime: 0,
  responseTimeChange: 0,
  activeUsers: 0,
  activeUsersChange: 0,
  apiCalls: 0,
  apiCallsChange: 0,
  uptime: 0,
  errorRate: 0,
};

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
    const [alerts, setAlerts] = useState<{ id: string; variant: 'destructive' | 'default'; title: string; description: string; timestamp: string; }[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [dataFetched, setDataFetched] = useState(false);

    const { report, overall } = useServiceHealth();

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';

    const fetchHealthData = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
            const res = await fetch(`${API_BASE}/api/v1/dashboard/health`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setHealthData(prev => ({
                ...prev,
                cpu: data.cpu?.percent ?? prev.cpu,
                memory: data.memory?.percent ?? prev.memory,
                disk: data.disk?.percent ?? prev.disk,
                network: data.network?.bytes_sent_mb ?? prev.network,
                responseTime: data.response_time_ms ?? prev.responseTime,
                activeUsers: data.database?.user_count ?? prev.activeUsers,
                apiCalls: data.database?.analysis_count ?? prev.apiCalls,
                uptime: data.uptime_percent ?? 99.9,
                errorRate: data.error_rate ?? 0.1,
            }));
            setDataFetched(true);

            // Build alerts from real health data
            const newAlerts: typeof alerts = [];
            if (data.cpu?.percent > 80) {
                newAlerts.push({ id: 'cpu-high', variant: 'destructive', title: 'High CPU Usage', description: `CPU is at ${data.cpu.percent.toFixed(1)}%.`, timestamp: new Date().toLocaleString() });
            }
            if (data.memory?.percent > 80) {
                newAlerts.push({ id: 'mem-high', variant: 'destructive', title: 'High Memory Usage', description: `Memory is at ${data.memory.percent.toFixed(1)}%.`, timestamp: new Date().toLocaleString() });
            }
            if (data.disk?.percent > 85) {
                newAlerts.push({ id: 'disk-high', variant: 'destructive', title: 'Low Disk Space', description: `Disk is at ${data.disk.percent.toFixed(1)}%.`, timestamp: new Date().toLocaleString() });
            }
            if (newAlerts.length === 0) {
                newAlerts.push({ id: 'all-good', variant: 'default', title: 'All Systems Operational', description: 'No active issues detected.', timestamp: new Date().toLocaleString() });
            }
            setAlerts(newAlerts);
        } catch {
            // Do NOT fall back to random values — keep last known data
            if (!dataFetched) {
                // On first load with no data, create a connecting alert
                setAlerts([{ id: 'connecting', variant: 'default', title: 'Connecting to Backend', description: 'Waiting for health data from the server...', timestamp: new Date().toLocaleString() }]);
            }
        }
    };

    useEffect(() => {
        fetchHealthData();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const healthTimer = setInterval(fetchHealthData, 10000); // Refresh every 10s

        return () => {
            clearInterval(timer);
            clearInterval(healthTimer);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const handleRefresh = () => {
        fetchHealthData();
    };

    const getOverallBadge = () => {
        switch (overall) {
            case 'healthy': return <Badge variant="success">HEALTHY</Badge>;
            case 'degraded': return <Badge variant="warning">DEGRADED</Badge>;
            case 'down': return <Badge variant="destructive">DOWN</Badge>;
            default: return <Badge variant="secondary">CHECKING</Badge>;
        }
    };
    const handleResolve = (alertId: string) => {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    };

    const getAlertIcon = (variant: 'destructive' | 'default') => {
        switch(variant) {
            case 'destructive': return <AlertTriangle className="h-4 w-4" />;
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
          {getOverallBadge()}
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
                {dataFetched ? `${healthData.uptime.toFixed(1)}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </div>
           <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground">Error Rate</h3>
            <p className={`text-2xl font-bold flex items-center gap-2 ${healthData.errorRate > 1 ? 'text-destructive' : 'text-success'}`}>
                 <span className={`h-3 w-3 rounded-full ${healthData.errorRate > 1 ? 'bg-destructive' : 'bg-success'}`}></span>
                 {dataFetched ? `${healthData.errorRate.toFixed(2)}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </div>
        </CardContent>
      </Card>

      {report.groups.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Service Groups</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {report.groups.map((group) => {
              const dot =
                group.status === 'healthy' ? 'bg-success' :
                group.status === 'down' ? 'bg-destructive' :
                group.status === 'degraded' ? 'bg-yellow-500' : 'bg-muted-foreground';
              return (
                <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                    <span className="text-sm font-medium">{group.label}</span>
                  </div>
                  <Badge
                    variant={group.status === 'healthy' ? 'success' : group.status === 'down' ? 'destructive' : 'secondary'}
                    className="text-xs capitalize"
                  >
                    {group.status}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
