'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ArrowLeft,
    RefreshCw,
    Eye,
    FileJson,
    Send,
    Download,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Activity,
    FileText,
    Users,
    TrendingUp,
    Server,
    Loader2,
    Trash2,
    Copy,
    ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';

interface AuditLogEvent {
    event_type: string;
    timestamp: string;
    details: Record<string, unknown>;
}

interface AuditLog {
    tracking_id: string;
    company_name: string;
    founder_email: string;
    status: string;
    created_at: string;
    updated_at: string;
    request_payload_hash?: string;
    request_payload_size: number;
    report_path?: string;
    report_version: number;
    callback_url?: string;
    callback_status?: string;
    callback_response_code?: number;
    processing_duration_ms?: number;
    final_score?: number;
    recommendation?: string;
    events: AuditLogEvent[];
    report_exists?: boolean;
    report_file_size?: number;
}

interface AuditStats {
    total_requests: number;
    status_breakdown: {
        completed: number;
        failed: number;
        processing: number;
    };
    callback_stats: {
        sent: number;
        failed: number;
        not_configured: number;
    };
    performance: {
        avg_processing_time_ms: number;
    };
    scores: {
        avg_final_score: number;
        total_evaluated: number;
    };
}

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
        completed: { variant: 'default', icon: <CheckCircle2 className="size-3 mr-1" /> },
        failed: { variant: 'destructive', icon: <XCircle className="size-3 mr-1" /> },
        processing: { variant: 'secondary', icon: <Loader2 className="size-3 mr-1 animate-spin" /> },
        pending: { variant: 'outline', icon: <Clock className="size-3 mr-1" /> },
    };
    const config = variants[status] || { variant: 'outline' as const, icon: null };
    return (
        <Badge variant={config.variant} className="capitalize">
            {config.icon}
            {status}
        </Badge>
    );
}

function CallbackBadge({ status }: { status?: string }) {
    if (!status) return <Badge variant="outline">N/A</Badge>;
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
        sent: 'default',
        failed: 'destructive',
        not_configured: 'secondary',
    };
    return (
        <Badge variant={variants[status] || 'outline'} className="capitalize">
            {status === 'sent' ? <Send className="size-3 mr-1" /> : null}
            {status.replace('_', ' ')}
        </Badge>
    );
}

function formatDuration(ms?: number): string {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

function formatDate(isoString?: string): string {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString();
}

function formatBytes(bytes?: number): string {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function SsdAuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [apiAvailable, setApiAvailable] = useState(true);
    const { toast } = useToast();

    const fetchLogs = async () => {
        try {
            const statusParam = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
            const response = await fetch(`${API_BASE}/api/ssd/audit/logs${statusParam}`);
            if (!response.ok) {
                if (response.status === 404) {
                    // Endpoint not deployed yet
                    console.warn('SSD audit endpoint not available (404)');
                    setApiAvailable(false);
                    setLogs([]);
                    return;
                }
                throw new Error(`HTTP ${response.status}`);
            }
            setApiAvailable(true);
            const data = await response.json();
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch audit logs',
            });
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/ssd/audit/stats`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('SSD stats endpoint not available (404)');
                    return;
                }
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchLogDetails = async (trackingId: string) => {
        try {
            const response = await fetch(`${API_BASE}/api/ssd/audit/logs/${trackingId}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            setSelectedLog(data);
            setDetailsOpen(true);
        } catch (error) {
            console.error('Failed to fetch log details:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch log details',
            });
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchLogs(), fetchStats()]);
        setRefreshing(false);
    };

    const handleDelete = async (trackingId: string) => {
        if (!confirm('Are you sure you want to delete this audit log and associated report?')) return;
        try {
            await fetch(`${API_BASE}/api/ssd/audit/logs/${trackingId}`, { method: 'DELETE' });
            toast({ title: 'Deleted', description: 'Audit log deleted successfully' });
            await fetchLogs();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete audit log' });
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied', description: `${label} copied to clipboard` });
    };

    const downloadReport = async (trackingId: string) => {
        try {
            const response = await fetch(`${API_BASE}/api/ssd/audit/logs/${trackingId}/report`);
            const data = await response.json();
            const blob = new Blob([JSON.stringify(data.report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tirr_report_${trackingId}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to download report' });
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchLogs(), fetchStats()]);
            setLoading(false);
        };
        load();
    }, [filterStatus]);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <Link href="/dashboard/reports/configure" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
                        <ArrowLeft className="size-4" />
                        Back to Report Configuration
                    </Link>
                    <h1 className="text-3xl font-bold">SSD Integration Audit Logs</h1>
                    <p className="text-muted-foreground">Monitor and review SSD → TCA TIRR integration requests, responses, and reports</p>
                </div>
                <Button onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`size-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </header>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Requests</CardDescription>
                            <CardTitle className="text-3xl flex items-center gap-2">
                                <Server className="size-6 text-blue-500" />
                                {stats.total_requests}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Success Rate</CardDescription>
                            <CardTitle className="text-3xl flex items-center gap-2">
                                <CheckCircle2 className="size-6 text-green-500" />
                                {stats.total_requests > 0
                                    ? `${((stats.status_breakdown.completed / stats.total_requests) * 100).toFixed(1)}%`
                                    : 'N/A'}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Avg Processing Time</CardDescription>
                            <CardTitle className="text-3xl flex items-center gap-2">
                                <Activity className="size-6 text-orange-500" />
                                {formatDuration(stats.performance.avg_processing_time_ms)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Avg TCA Score</CardDescription>
                            <CardTitle className="text-3xl flex items-center gap-2">
                                <TrendingUp className="size-6 text-purple-500" />
                                {stats.scores.avg_final_score.toFixed(1)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            )}

            {/* Status Breakdown */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Processing Status</CardTitle>
                        </CardHeader>
                        <CardContent className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-4 text-green-500" />
                                <span>Completed: <strong>{stats.status_breakdown.completed}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Loader2 className="size-4 text-blue-500" />
                                <span>Processing: <strong>{stats.status_breakdown.processing}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <XCircle className="size-4 text-red-500" />
                                <span>Failed: <strong>{stats.status_breakdown.failed}</strong></span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Callback Status</CardTitle>
                        </CardHeader>
                        <CardContent className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <Send className="size-4 text-green-500" />
                                <span>Sent: <strong>{stats.callback_stats.sent}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="size-4 text-yellow-500" />
                                <span>Failed: <strong>{stats.callback_stats.failed}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="size-4 text-gray-500" />
                                <span>Not Configured: <strong>{stats.callback_stats.not_configured}</strong></span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Audit Log Table */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Audit Log Entries</CardTitle>
                            <CardDescription>All SSD → TCA TIRR integration requests with full audit trail</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="border rounded px-3 py-1 text-sm"
                                aria-label="Filter audit logs by status"
                            >
                                <option value="all">All Statuses</option>
                                <option value="completed">Completed</option>
                                <option value="processing">Processing</option>
                                <option value="failed">Failed</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="size-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : !apiAvailable ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <AlertTriangle className="size-12 mx-auto mb-4 text-yellow-500 opacity-70" />
                            <p className="font-medium">SSD Integration Not Available</p>
                            <p className="text-sm mt-2">The SSD integration backend is pending deployment.</p>
                            <p className="text-sm">Please contact your administrator to deploy the latest backend code.</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="size-12 mx-auto mb-4 opacity-50" />
                            <p>No audit logs found</p>
                            <p className="text-sm">SSD integration requests will appear here</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tracking ID</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Founder</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Callback</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.tracking_id}>
                                        <TableCell className="font-mono text-xs">
                                            {log.tracking_id.slice(0, 8)}...
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 ml-1"
                                                onClick={() => copyToClipboard(log.tracking_id, 'Tracking ID')}
                                            >
                                                <Copy className="size-3" />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-medium">{log.company_name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Users className="size-3 text-muted-foreground" />
                                                {log.founder_email}
                                            </div>
                                        </TableCell>
                                        <TableCell><StatusBadge status={log.status} /></TableCell>
                                        <TableCell><CallbackBadge status={log.callback_status} /></TableCell>
                                        <TableCell>
                                            {log.final_score !== undefined ? (
                                                <Badge variant={log.final_score >= 7 ? 'default' : log.final_score >= 5 ? 'secondary' : 'destructive'}>
                                                    {log.final_score.toFixed(1)}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{formatDuration(log.processing_duration_ms)}</TableCell>
                                        <TableCell className="text-sm">{formatDate(log.created_at)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => fetchLogDetails(log.tracking_id)}>
                                                    <Eye className="size-4" />
                                                </Button>
                                                {log.status === 'completed' && (
                                                    <Button variant="ghost" size="icon" onClick={() => downloadReport(log.tracking_id)}>
                                                        <Download className="size-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(log.tracking_id)}>
                                                    <Trash2 className="size-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                        <DialogDescription>
                            Full audit trail for tracking ID: {selectedLog?.tracking_id}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
                            <TabsList>
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="events">Event Timeline ({selectedLog.events?.length || 0})</TabsTrigger>
                                <TabsTrigger value="request">Request Payload</TabsTrigger>
                                <TabsTrigger value="response">Response Payload</TabsTrigger>
                            </TabsList>
                            <TabsContent value="overview" className="space-y-4 overflow-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Company</Label>
                                        <p className="font-medium">{selectedLog.company_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Founder Email</Label>
                                        <p className="font-medium">{selectedLog.founder_email}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Status</Label>
                                        <p><StatusBadge status={selectedLog.status} /></p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Final Score</Label>
                                        <p className="font-medium">{selectedLog.final_score?.toFixed(1) || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Recommendation</Label>
                                        <p className="font-medium">{selectedLog.recommendation || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Processing Time</Label>
                                        <p className="font-medium">{formatDuration(selectedLog.processing_duration_ms)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Request Payload Size</Label>
                                        <p className="font-medium">{formatBytes(selectedLog.request_payload_size)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Payload Hash</Label>
                                        <p className="font-mono text-xs">{selectedLog.request_payload_hash || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Callback URL</Label>
                                        <p className="font-mono text-xs truncate">{selectedLog.callback_url || 'Not configured'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Callback Status</Label>
                                        <p><CallbackBadge status={selectedLog.callback_status} /></p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Report Path</Label>
                                        <p className="font-mono text-xs truncate">{selectedLog.report_path || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Report Exists</Label>
                                        <p>{selectedLog.report_exists ? <CheckCircle2 className="size-4 text-green-500" /> : <XCircle className="size-4 text-red-500" />}</p>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="events" className="overflow-auto max-h-[60vh]">
                                <ScrollArea className="h-full">
                                    <div className="space-y-3">
                                        {selectedLog.events?.map((event, i) => (
                                            <div key={i} className="flex gap-4 p-3 border rounded-lg">
                                                <div className="flex-shrink-0 w-32">
                                                    <Badge variant="outline" className="capitalize">{event.event_type}</Badge>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</p>
                                                    {Object.keys(event.details || {}).length > 0 && (
                                                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                                                            {JSON.stringify(event.details, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                            <TabsContent value="request" className="overflow-auto max-h-[60vh]">
                                <ScrollArea className="h-full">
                                    <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                                        {JSON.stringify((selectedLog as unknown as Record<string, unknown>).request_payload || {}, null, 2)}
                                    </pre>
                                </ScrollArea>
                            </TabsContent>
                            <TabsContent value="response" className="overflow-auto max-h-[60vh]">
                                <ScrollArea className="h-full">
                                    <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                                        {JSON.stringify((selectedLog as unknown as Record<string, unknown>).response_payload || {}, null, 2)}
                                    </pre>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
