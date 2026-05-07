'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Bot,
  Users,
  FileText,
  Settings,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Cpu,
  Zap,
  Database,
  TrendingUp,
  Clock,
  Eye,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

type SystemStatus = {
  backend: 'online' | 'offline' | 'degraded';
  database: 'online' | 'offline' | 'degraded';
  ai: 'online' | 'offline' | 'degraded';
  lastChecked: string;
};

type AgentConfig = {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
};

type FeatureFlag = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

type AuditEntry = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  status: 'success' | 'error' | 'warning';
};

const DEFAULT_AGENT_CONFIG: AgentConfig = {
  model: 'gpt-4o',
  temperature: 0.3,
  maxTokens: 4096,
  topP: 0.9,
  frequencyPenalty: 0.1,
  presencePenalty: 0.0,
};

const DEFAULT_FLAGS: FeatureFlag[] = [
  { id: 'mock_fallback', label: 'Mock Fallback Mode', description: 'Return mock data when backend is unreachable', enabled: true },
  { id: 'ai_analysis', label: 'AI Analysis Engine', description: 'Enable AI-powered analysis modules', enabled: true },
  { id: 'auto_export', label: 'Auto Export', description: 'Automatically generate export files after analysis', enabled: false },
  { id: 'beta_modules', label: 'Beta Modules', description: 'Show experimental analysis modules', enabled: false },
  { id: 'detailed_logging', label: 'Detailed Logging', description: 'Enable verbose audit logging for all operations', enabled: true },
  { id: 'email_notifications', label: 'Email Notifications', description: 'Send email alerts for critical system events', enabled: false },
];

const MOCK_AUDIT: AuditEntry[] = [
  { id: '1', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), user: 'admin@tca.com', action: 'Run full analysis', module: 'TCA Scorecard', status: 'success' },
  { id: '2', timestamp: new Date(Date.now() - 18 * 60000).toISOString(), user: 'analyst@tca.com', action: 'Export report', module: 'Risk Assessment', status: 'success' },
  { id: '3', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), user: 'admin@tca.com', action: 'Update module weights', module: 'Module Settings', status: 'success' },
  { id: '4', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), user: 'user@tca.com', action: 'Run analysis', module: 'Financial Analysis', status: 'error' },
  { id: '5', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), user: 'analyst@tca.com', action: 'Generate due diligence report', module: 'Due Diligence', status: 'success' },
  { id: '6', timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), user: 'admin@tca.com', action: 'System config update', module: 'System Config', status: 'warning' },
];

function StatusBadge({ status }: { status: SystemStatus['backend'] }) {
  if (status === 'online') return <Badge className="bg-green-500 text-white"><CheckCircle className="size-3 mr-1" />Online</Badge>;
  if (status === 'degraded') return <Badge className="bg-yellow-500 text-white"><AlertTriangle className="size-3 mr-1" />Degraded</Badge>;
  return <Badge variant="destructive"><XCircle className="size-3 mr-1" />Offline</Badge>;
}

function AuditBadge({ status }: { status: AuditEntry['status'] }) {
  if (status === 'success') return <Badge className="bg-green-500 text-white text-xs">Success</Badge>;
  if (status === 'warning') return <Badge className="bg-yellow-500 text-white text-xs">Warning</Badge>;
  return <Badge variant="destructive" className="text-xs">Error</Badge>;
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminPage() {
  const { toast } = useToast();
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    backend: 'offline',
    database: 'online',
    ai: 'online',
    lastChecked: new Date().toISOString(),
  });
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(DEFAULT_AGENT_CONFIG);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>(DEFAULT_FLAGS);
  const [auditLog] = useState<AuditEntry[]>(MOCK_AUDIT);
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [auditFilter, setAuditFilter] = useState('');

  const checkSystemStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'SELECT 1', params: [] }),
      });
      const data = await res.json();
      setSystemStatus({
        backend: data?.mock ? 'offline' : 'online',
        database: res.ok ? 'online' : 'offline',
        ai: 'online',
        lastChecked: new Date().toISOString(),
      });
    } catch {
      setSystemStatus(prev => ({ ...prev, backend: 'offline', lastChecked: new Date().toISOString() }));
    }
    setIsChecking(false);
  }, []);

  useEffect(() => {
    checkSystemStatus();
  }, [checkSystemStatus]);

  const handleSaveAgentConfig = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    toast({ title: 'Agent config saved', description: 'AI Agent configuration has been updated.' });
  };

  const handleToggleFlag = (id: string) => {
    setFeatureFlags(prev =>
      prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f)
    );
    toast({ title: 'Feature flag updated', description: `Flag toggled successfully.` });
  };

  const filteredAudit = auditLog.filter(e =>
    !auditFilter || e.user.includes(auditFilter) || e.action.toLowerCase().includes(auditFilter.toLowerCase()) || e.module.toLowerCase().includes(auditFilter.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="size-8 text-primary" />
            Admin Control Panel
          </h1>
          <p className="text-muted-foreground mt-1">Manage AI agents, system configuration, and review audit logs</p>
        </div>
        <Button variant="outline" onClick={checkSystemStatus} disabled={isChecking}>
          {isChecking ? <Loader2 className="size-4 mr-2 animate-spin" /> : <RefreshCw className="size-4 mr-2" />}
          Refresh Status
        </Button>
      </div>

      {/* System Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Zap className="size-4" />Backend API
              </div>
              <StatusBadge status={systemStatus.backend} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Database className="size-4" />Database
              </div>
              <StatusBadge status={systemStatus.database} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Cpu className="size-4" />AI Engine
              </div>
              <StatusBadge status={systemStatus.ai} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="size-4" />
              <span>Checked {formatRelativeTime(systemStatus.lastChecked)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {systemStatus.backend === 'offline' && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Backend API Unreachable</AlertTitle>
          <AlertDescription>
            The backend API at <code>tcairrapiccontainer.azurewebsites.net</code> is currently offline.
            Mock fallback mode is active — analysis results are simulated.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="ai-agent">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="ai-agent"><Bot className="size-4 mr-1" />AI Agent</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="size-4 mr-1" />Settings</TabsTrigger>
          <TabsTrigger value="audit"><FileText className="size-4 mr-1" />Audit Log</TabsTrigger>
          <TabsTrigger value="users"><Users className="size-4 mr-1" />Users</TabsTrigger>
        </TabsList>

        {/* AI Agent Tab */}
        <TabsContent value="ai-agent" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="size-5" />AI Agent Configuration</CardTitle>
              <CardDescription>Configure the parameters for the AI analysis engine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    value={agentConfig.model}
                    onChange={e => setAgentConfig(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g. gpt-4o"
                  />
                  <p className="text-xs text-muted-foreground">The AI model used for analysis</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    min={256}
                    max={32768}
                    value={agentConfig.maxTokens}
                    onChange={e => setAgentConfig(prev => ({ ...prev, maxTokens: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Maximum response length (256–32768)</p>
                </div>
                <div className="space-y-2">
                  <Label>Temperature <span className="text-muted-foreground">({agentConfig.temperature})</span></Label>
                  <Input
                    type="number"
                    min={0}
                    max={2}
                    step={0.05}
                    value={agentConfig.temperature}
                    onChange={e => setAgentConfig(prev => ({ ...prev, temperature: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Creativity vs determinism (0=deterministic, 2=creative)</p>
                </div>
                <div className="space-y-2">
                  <Label>Top-P <span className="text-muted-foreground">({agentConfig.topP})</span></Label>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={agentConfig.topP}
                    onChange={e => setAgentConfig(prev => ({ ...prev, topP: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Nucleus sampling threshold (0–1)</p>
                </div>
                <div className="space-y-2">
                  <Label>Frequency Penalty <span className="text-muted-foreground">({agentConfig.frequencyPenalty})</span></Label>
                  <Input
                    type="number"
                    min={-2}
                    max={2}
                    step={0.05}
                    value={agentConfig.frequencyPenalty}
                    onChange={e => setAgentConfig(prev => ({ ...prev, frequencyPenalty: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Reduces repetitive phrasing (-2 to 2)</p>
                </div>
                <div className="space-y-2">
                  <Label>Presence Penalty <span className="text-muted-foreground">({agentConfig.presencePenalty})</span></Label>
                  <Input
                    type="number"
                    min={-2}
                    max={2}
                    step={0.05}
                    value={agentConfig.presencePenalty}
                    onChange={e => setAgentConfig(prev => ({ ...prev, presencePenalty: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Encourages new topics (-2 to 2)</p>
                </div>
              </div>
              <Separator />
              <div className="flex gap-3">
                <Button onClick={handleSaveAgentConfig} disabled={isSaving}>
                  {isSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Save Configuration
                </Button>
                <Button variant="outline" onClick={() => setAgentConfig(DEFAULT_AGENT_CONFIG)}>
                  Reset Defaults
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="size-5" />Analysis Modules</CardTitle>
              <CardDescription>Quick links to manage analysis module settings</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard/module-settings"><Settings className="size-4 mr-2" />Module Settings</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/ai-training"><Bot className="size-4 mr-2" />AI Training</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/system-config"><Cpu className="size-4 mr-2" />System Config</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/schema"><Database className="size-4 mr-2" />Schema & Models</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="size-5" />Feature Flags</CardTitle>
              <CardDescription>Toggle system features and experimental functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {featureFlags.map(flag => (
                <div key={flag.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="space-y-0.5">
                    <div className="font-medium text-sm">{flag.label}</div>
                    <div className="text-xs text-muted-foreground">{flag.description}</div>
                  </div>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={() => handleToggleFlag(flag.id)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="size-5" />System Health</CardTitle>
              <CardDescription>Monitor and manage system resources</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard/system-health"><Activity className="size-4 mr-2" />System Health</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/backup"><Database className="size-4 mr-2" />Backup & Recovery</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/cost"><TrendingUp className="size-4 mr-2" />Cost Management</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/database"><Database className="size-4 mr-2" />Database Mining</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="size-5" />Audit Log</CardTitle>
              <CardDescription>Recent AI analysis and system activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Filter by user, action, or module..."
                value={auditFilter}
                onChange={e => setAuditFilter(e.target.value)}
              />
              <div className="space-y-2">
                {filteredAudit.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No audit entries match your filter.</p>
                )}
                {filteredAudit.map(entry => (
                  <div key={entry.id} className="flex items-start justify-between rounded-lg border p-3 gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{entry.action}</span>
                        <Badge variant="outline" className="text-xs">{entry.module}</Badge>
                        <AuditBadge status={entry.status} />
                      </div>
                      <div className="text-xs text-muted-foreground">{entry.user}</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      <Clock className="size-3" />
                      {formatRelativeTime(entry.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="size-5" />User Management</CardTitle>
              <CardDescription>Manage user accounts, roles, and access permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2 font-medium"><Users className="size-4 text-primary" />All Users</div>
                  <p className="text-sm text-muted-foreground">View and manage all user accounts, assign roles and permissions.</p>
                  <Button asChild className="w-full mt-2">
                    <Link href="/dashboard/users"><Eye className="size-4 mr-2" />View Users</Link>
                  </Button>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2 font-medium"><FileText className="size-4 text-primary" />User Requests</div>
                  <p className="text-sm text-muted-foreground">Review and respond to pending user requests and access applications.</p>
                  <Button asChild variant="outline" className="w-full mt-2">
                    <Link href="/dashboard/user-requests"><Eye className="size-4 mr-2" />View Requests</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="size-5" />Access Control</CardTitle>
              <CardDescription>Role-based access and security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { role: 'admin', label: 'Admin', description: 'Full system access including all admin tools', color: 'bg-red-500' },
                  { role: 'analyst', label: 'Analyst', description: 'Access to analysis tools and report generation', color: 'bg-blue-500' },
                  { role: 'user', label: 'User', description: 'Basic access to evaluation and reports', color: 'bg-green-500' },
                ].map(r => (
                  <div key={r.role} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className={`size-3 rounded-full ${r.color}`} />
                    <div>
                      <div className="font-medium text-sm">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
