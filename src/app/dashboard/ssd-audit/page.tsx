'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
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
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    ArrowRight,
    ArrowDown,
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
    Wifi,
    WifiOff,
    Zap,
    Shield,
    Database,
    Play,
    Settings,
    Link as LinkIcon,
    Globe,
    Lock,
    UploadCloud,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

// Connection Test Types
interface ConnectionTestResult {
    endpoint: string;
    status: 'connected' | 'failed' | 'timeout' | 'auth_failed';
    latency_ms: number;
    message: string;
    details?: Record<string, unknown>;
}

interface WorkflowStep {
    step: number;
    name: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    endpoint?: string;
    timestamp?: string;
    response?: unknown;
}

interface ConnectionTestResponse {
    success: boolean;
    overall_status: 'healthy' | 'auth_required' | 'degraded';
    total_latency_ms: number;
    tested_at: string;
    backend_url: string;
    results: ConnectionTestResult[];
    workflow: WorkflowStep[];
}

// SSD API calls go through server-side proxy routes — no client-side API key needed

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
    if (typeof window === 'undefined') return isoString.split('T')[0]; // Safe server-side fallback
    try {
        return new Date(isoString).toLocaleString();
    } catch {
        return isoString.split('T')[0];
    }
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

    // Connection Testing State
    const [connectionTest, setConnectionTest] = useState<ConnectionTestResponse | null>(null);
    const [testingConnection, setTestingConnection] = useState(false);
    const [sendTestOpen, setSendTestOpen] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);
    const [testCompany, setTestCompany] = useState('Test Company');
    const [testEmail, setTestEmail] = useState('test@example.com');
    const [testCallbackUrl, setTestCallbackUrl] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    // Test request file extraction
    const testFileInputRef = useRef<HTMLInputElement>(null);
    const [isExtractingTest, setIsExtractingTest] = useState(false);
    const [testFieldsExtracted, setTestFieldsExtracted] = useState(0);

    const extractFromTestFile = useCallback(async (file: File) => {
        setIsExtractingTest(true);
        setTestFieldsExtracted(0);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/extract', { method: 'POST', body: fd });
            if (!res.ok) return;
            const d = await res.json();
            const textContent: string = d.text_content || '';
            if (textContent.trim().length > 20) {
                const token = typeof window !== 'undefined' ? (localStorage.getItem('authToken') ?? '') : '';
                const aiRes = await fetch('/api/ai-autofill', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: textContent, token }),
                });
                if (aiRes.ok) {
                    const aiJson = await aiRes.json();
                    const aiData = (aiJson.data as Record<string, unknown>) ?? {};
                    const pick = (v: unknown) => typeof v === 'string' && v.trim() ? v.trim() : '';
                    let count = 0;
                    const companyName = pick(aiData.company_name);
                    if (companyName) { setTestCompany(companyName); count++; }
                    // Try to extract email from raw text
                    const emailMatch = textContent.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
                    if (emailMatch) { setTestEmail(emailMatch[0]); count++; }
                    setTestFieldsExtracted(count);
                    if (count > 0) {
                        toast({ title: 'Auto-filled from document', description: `${count} field${count > 1 ? 's' : ''} extracted — verify before sending.` });
                    } else {
                        toast({ variant: 'destructive', title: 'No data extracted', description: 'Could not find company name or email in the document.' });
                    }
                }
            } else {
                toast({ variant: 'destructive', title: 'Document too short', description: 'Not enough content to extract from this file.' });
            }
        } catch {
            toast({ variant: 'destructive', title: 'Extraction failed', description: 'Could not process the file.' });
        } finally {
            setIsExtractingTest(false);
        }
    }, [toast]);

    // Run connection test
    const runConnectionTest = useCallback(async () => {
        setTestingConnection(true);
        try {
            const response = await fetch('/api/ssd/connection-test');
            if (response.ok) {
                const data = await response.json();
                setConnectionTest(data);
                if (data.success) {
                    toast({ title: 'Connection Test Passed', description: 'All endpoints are responding correctly.' });
                } else {
                    toast({ variant: 'destructive', title: 'Connection Issues Detected', description: 'Some endpoints failed. Check details below.' });
                }
            } else {
                toast({ variant: 'destructive', title: 'Test Failed', description: 'Could not run connection test.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to run connection test.' });
        } finally {
            setTestingConnection(false);
        }
    }, [toast]);

    // Send test request through pipeline
    const sendTestRequest = async () => {
        setSendingTest(true);
        try {
            const response = await fetch('/api/ssd/connection-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    test_company_name: testCompany,
                    test_founder_email: testEmail,
                    callback_url: testCallbackUrl || null
                })
            });
            const data = await response.json();
            if (data.success) {
                toast({ title: 'Test Request Sent', description: `Tracking ID: ${data.tracking_id || 'N/A'}` });
                setSendTestOpen(false);
                // Refresh logs after a delay
                setTimeout(() => fetchLogs(), 2000);
            } else {
                toast({ variant: 'destructive', title: 'Test Failed', description: data.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send test request.' });
        } finally {
            setSendingTest(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const statusParam = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
            const response = await fetch(`/api/ssd/audit-logs${statusParam}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('Startup Steroid audit endpoint not available (404)');
                    setApiAvailable(false);
                    setLogs([]);
                    return;
                }
                throw new Error(`HTTP ${response.status}`);
            }
            setApiAvailable(true);
            const data = await response.json();
            // API may return array directly or wrapped in { logs: [] }
            setLogs(Array.isArray(data) ? data : (data.logs ?? []));
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
            const response = await fetch('/api/ssd/stats');
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('Startup Steroid stats endpoint not available (404)');
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
            const response = await fetch(`/api/ssd/audit-logs/${trackingId}`);
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
            await fetch(`/api/ssd/audit-logs/${trackingId}`, { method: 'DELETE' });
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
            const response = await fetch(`/api/ssd/report/${trackingId}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            // API returns the report as the root object (not nested under .report)
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ssd-report-${trackingId}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to download report' });
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchLogs(), fetchStats(), runConnectionTest()]);
            setLoading(false);
        };
        load();
    }, [filterStatus, runConnectionTest]);

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <header className="flex justify-between items-center mb-4">
                <div>
                    <Link href="/dashboard/reports/configure" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
                        <ArrowLeft className="size-4" />
                        Back to Report Configuration
                    </Link>
                    <h1 className="text-3xl font-bold">Startup Steroid Integration Audit</h1>
                    <p className="text-muted-foreground">Monitor connections, test endpoints, and review integration requests</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={runConnectionTest} disabled={testingConnection}>
                        {testingConnection ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Zap className="size-4 mr-2" />}
                        Test Connection
                    </Button>
                    <Button onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`size-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </header>

            {/* Connection Status & Workflow Visualization */}
            <Card className="border-2 border-dashed">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${connectionTest?.success ? 'bg-green-100 dark:bg-green-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
                                {connectionTest?.success ? (
                                    <Wifi className="size-6 text-green-600 dark:text-green-400" />
                                ) : (
                                    <WifiOff className="size-6 text-amber-600 dark:text-amber-400" />
                                )}
                            </div>
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    Integration Pipeline Status
                                    <Badge variant={connectionTest?.success ? 'default' : connectionTest?.overall_status === 'auth_required' ? 'destructive' : 'secondary'}>
                                        {connectionTest?.overall_status || 'Unknown'}
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    {connectionTest ? `Last tested: ${new Date(connectionTest.tested_at).toLocaleString()} • Latency: ${connectionTest.total_latency_ms}ms` : 'Run connection test to verify pipeline'}
                                </CardDescription>
                            </div>
                        </div>
                        <Dialog open={sendTestOpen} onOpenChange={(open) => { setSendTestOpen(open); if (!open) { setTestFieldsExtracted(0); if (testFileInputRef.current) testFileInputRef.current.value = ''; } }}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Play className="size-4 mr-2" />
                                    Send Test Request
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Send Test Request Through Pipeline</DialogTitle>
                                    <DialogDescription>
                                        This will send a test request through the Startup Steroid → TCA TIRR pipeline.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    {/* File extraction strip */}
                                    <div className="rounded-lg border border-dashed p-3 bg-muted/40">
                                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                            <UploadCloud className="size-3" />
                                            Upload a pitch deck, PDF or document to auto-fill fields
                                        </p>
                                        <input
                                            ref={testFileInputRef}
                                            type="file"
                                            className="hidden"
                                            title="Upload document for extraction"
                                            accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.csv,.txt,.json,.rtf,.html,.htm,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff"
                                            onChange={(e) => { const f = e.target.files?.[0]; if (f) extractFromTestFile(f); }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            disabled={isExtractingTest}
                                            onClick={() => testFileInputRef.current?.click()}
                                        >
                                            {isExtractingTest ? (
                                                <><Loader2 className="size-3 mr-2 animate-spin" />Extracting…</>
                                            ) : testFieldsExtracted > 0 ? (
                                                <><CheckCircle2 className="size-3 mr-2 text-green-600" />{testFieldsExtracted} field{testFieldsExtracted > 1 ? 's' : ''} extracted — choose another file</>
                                            ) : (
                                                <><UploadCloud className="size-3 mr-2" />Choose file to extract…</>
                                            )}
                                        </Button>
                                    </div>
                                    <div>
                                        <Label htmlFor="test-company">Test Company Name</Label>
                                        <Input id="test-company" value={testCompany} onChange={(e) => setTestCompany(e.target.value)} placeholder="Test Company" />
                                    </div>
                                    <div>
                                        <Label htmlFor="test-email">Founder Email</Label>
                                        <Input id="test-email" type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test@example.com" />
                                    </div>
                                    <div>
                                        <Label htmlFor="test-callback">Callback URL (Optional)</Label>
                                        <Input id="test-callback" value={testCallbackUrl} onChange={(e) => setTestCallbackUrl(e.target.value)} placeholder="https://your-callback-url.com/webhook" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setSendTestOpen(false)}>Cancel</Button>
                                    <Button onClick={sendTestRequest} disabled={sendingTest}>
                                        {sendingTest ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
                                        Send Test
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Visual Workflow Diagram */}
                    <div className="py-4">
                        <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                            <Activity className="size-4" />
                            Integration Workflow
                        </h4>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 overflow-x-auto pb-4">
                            {/* Step 1: Startup Steroid */}
                            <div className="flex flex-col items-center min-w-[140px]">
                                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center border-2 border-purple-300">
                                    <Globe className="size-8 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="mt-2 text-sm font-medium">Startup Steroid</span>
                                <span className="text-xs text-muted-foreground">External Platform</span>
                            </div>

                            <ArrowRight className="hidden md:block size-6 text-muted-foreground flex-shrink-0" />
                            <ArrowDown className="block md:hidden size-6 text-muted-foreground" />

                            {/* Step 2: Webhook Receiver */}
                            <div className="flex flex-col items-center min-w-[140px]">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${connectionTest?.workflow?.[3]?.status === 'success'
                                    ? 'bg-green-100 dark:bg-green-900 border-green-300'
                                    : connectionTest?.workflow?.[3]?.status === 'failed'
                                        ? 'bg-red-100 dark:bg-red-900 border-red-300'
                                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300'
                                    }`}>
                                    <Zap className={`size-8 ${connectionTest?.workflow?.[3]?.status === 'success'
                                        ? 'text-green-600 dark:text-green-400'
                                        : connectionTest?.workflow?.[3]?.status === 'failed'
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-gray-600 dark:text-gray-400'
                                        }`} />
                                </div>
                                <span className="mt-2 text-sm font-medium">Webhook Receiver</span>
                                <Badge variant={connectionTest?.workflow?.[3]?.status === 'success' ? 'default' : 'secondary'} className="mt-1 text-xs">
                                    {connectionTest?.workflow?.[3]?.status || 'Unknown'}
                                </Badge>
                            </div>

                            <ArrowRight className="hidden md:block size-6 text-muted-foreground flex-shrink-0" />
                            <ArrowDown className="block md:hidden size-6 text-muted-foreground" />

                            {/* Step 3: TCA-IRR Backend */}
                            <div className="flex flex-col items-center min-w-[140px]">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${connectionTest?.workflow?.[0]?.status === 'success'
                                    ? 'bg-green-100 dark:bg-green-900 border-green-300'
                                    : connectionTest?.workflow?.[0]?.status === 'failed'
                                        ? 'bg-red-100 dark:bg-red-900 border-red-300'
                                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300'
                                    }`}>
                                    <Server className={`size-8 ${connectionTest?.workflow?.[0]?.status === 'success'
                                        ? 'text-green-600 dark:text-green-400'
                                        : connectionTest?.workflow?.[0]?.status === 'failed'
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-gray-600 dark:text-gray-400'
                                        }`} />
                                </div>
                                <span className="mt-2 text-sm font-medium">TCA-IRR Backend</span>
                                <Badge variant={connectionTest?.workflow?.[0]?.status === 'success' ? 'default' : 'secondary'} className="mt-1 text-xs">
                                    {connectionTest?.results?.[0]?.latency_ms ? `${connectionTest.results[0].latency_ms}ms` : 'N/A'}
                                </Badge>
                            </div>

                            <ArrowRight className="hidden md:block size-6 text-muted-foreground flex-shrink-0" />
                            <ArrowDown className="block md:hidden size-6 text-muted-foreground" />

                            {/* Step 4: TIRR Analysis */}
                            <div className="flex flex-col items-center min-w-[140px]">
                                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border-2 border-blue-300">
                                    <Activity className="size-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="mt-2 text-sm font-medium">TIRR Analysis</span>
                                <span className="text-xs text-muted-foreground">Process & Score</span>
                            </div>

                            <ArrowRight className="hidden md:block size-6 text-muted-foreground flex-shrink-0" />
                            <ArrowDown className="block md:hidden size-6 text-muted-foreground" />

                            {/* Step 5: Callback */}
                            <div className="flex flex-col items-center min-w-[140px]">
                                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center border-2 border-orange-300">
                                    <Send className="size-8 text-orange-600 dark:text-orange-400" />
                                </div>
                                <span className="mt-2 text-sm font-medium">Callback</span>
                                <span className="text-xs text-muted-foreground">Report Delivery</span>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Endpoint Status Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {connectionTest?.results?.map((result, idx) => (
                            <div key={idx} className={`p-4 rounded-lg border ${result.status === 'connected'
                                ? 'bg-green-50 dark:bg-green-950 border-green-200'
                                : result.status === 'auth_failed'
                                    ? 'bg-amber-50 dark:bg-amber-950 border-amber-200'
                                    : 'bg-red-50 dark:bg-red-950 border-red-200'
                                }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {result.status === 'connected' ? (
                                        <CheckCircle2 className="size-5 text-green-600" />
                                    ) : result.status === 'auth_failed' ? (
                                        <Lock className="size-5 text-amber-600" />
                                    ) : (
                                        <XCircle className="size-5 text-red-600" />
                                    )}
                                    <span className="font-medium text-sm">{result.endpoint}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{result.message}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs">
                                    <Clock className="size-3" />
                                    <span>{result.latency_ms}ms</span>
                                </div>
                            </div>
                        )) || (
                                <div className="col-span-full text-center py-4 text-muted-foreground">
                                    <Loader2 className="size-6 mx-auto mb-2 animate-spin" />
                                    <p>Testing connections...</p>
                                </div>
                            )}
                    </div>
                </CardContent>
            </Card>

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
                                {(stats.scores?.avg_final_score ?? 0).toFixed(1)}
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

            {/* Report Storage Visualization */}
            <Card className="mb-8 bg-gradient-to-r from-card via-card to-blue-50/30 dark:to-blue-950/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="size-5 text-blue-500" />
                        Report Storage & Versioning
                    </CardTitle>
                    <CardDescription>
                        Monitor report storage status, version history, and data persistence across the integration
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Storage Location */}
                        <div className="p-4 rounded-lg border bg-background/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Server className="size-5 text-blue-500" />
                                <span className="font-medium">Backend Storage</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {stats?.total_requests || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Reports stored in database</p>
                        </div>

                        {/* Versioning Status */}
                        <div className="p-4 rounded-lg border bg-background/50">
                            <div className="flex items-center gap-2 mb-2">
                                <FileJson className="size-5 text-purple-500" />
                                <span className="font-medium">Version Tracking</span>
                            </div>
                            <Badge variant="default" className="bg-purple-500 mt-1">Active</Badge>
                            <p className="text-xs text-muted-foreground mt-2">Each report update creates a version</p>
                        </div>

                        {/* File Storage */}
                        <div className="p-4 rounded-lg border bg-background/50">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="size-5 text-green-500" />
                                <span className="font-medium">Report Files</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {logs.filter(l => l.report_exists).length}
                            </p>
                            <p className="text-xs text-muted-foreground">JSON reports saved locally</p>
                        </div>

                        {/* Total Data Size */}
                        <div className="p-4 rounded-lg border bg-background/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="size-5 text-orange-500" />
                                <span className="font-medium">Data Processed</span>
                            </div>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {formatBytes(logs.reduce((sum, l) => sum + (l.request_payload_size || 0), 0))}
                            </p>
                            <p className="text-xs text-muted-foreground">Total payload size</p>
                        </div>
                    </div>

                    {/* Storage Details */}
                    <div className="mt-6 p-4 rounded-lg border bg-muted/30">
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Shield className="size-4" />
                            Storage & Retention Policy
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Storage Type</p>
                                <p className="font-medium">PostgreSQL + JSON Files</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Retention Period</p>
                                <p className="font-medium">Indefinite (Manual deletion)</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Backup Status</p>
                                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                                    <CheckCircle2 className="size-3 mr-1" /> Enabled
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Log Table */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Audit Log Entries</CardTitle>
                            <CardDescription>All Startup Steroid → TCA TIRR integration requests with full audit trail</CardDescription>
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
                            <p className="font-medium">Startup Steroid Integration Not Available</p>
                            <p className="text-sm mt-2">The Startup Steroid integration backend is pending deployment.</p>
                            <p className="text-sm">Please contact your administrator to deploy the latest backend code.</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="size-12 mx-auto mb-4 opacity-50" />
                            <p>No audit logs found</p>
                            <p className="text-sm">Startup Steroid integration requests will appear here</p>
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

