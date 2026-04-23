
'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Wifi, WifiOff, RefreshCw, Upload, Send, Clock,
    CheckCircle, XCircle, AlertCircle, BarChart2, FileText,
    ChevronDown, ChevronUp, Eye, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TunnelStatus {
    status: 'connected' | 'degraded' | 'disconnected' | 'checking';
    latency_ms?: number;
    endpoint?: string;
    backend_status?: string;
    checked_at?: string;
    error?: string;
}

interface TunnelRequest {
    id: string;
    tracking_id: string;
    company_name: string;
    analysis_type: string;
    submitted_at: string;
    status: 'pending' | 'processing' | 'complete' | 'failed';
    report_id?: number | null;
    result?: Record<string, unknown>;
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function ConnectionBadge({ status }: { status: TunnelStatus['status'] }) {
    const map: Record<TunnelStatus['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
        connected: { label: 'Connected', variant: 'default', icon: <Wifi className="h-3.5 w-3.5" /> },
        degraded: { label: 'Degraded', variant: 'outline', icon: <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> },
        disconnected: { label: 'Disconnected', variant: 'destructive', icon: <WifiOff className="h-3.5 w-3.5" /> },
        checking: { label: 'Checking…', variant: 'secondary', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
    };
    const { label, variant, icon } = map[status];
    return (
        <Badge variant={variant} className="flex items-center gap-1.5 px-2 py-1">
            {icon}
            {label}
        </Badge>
    );
}

function RequestStatusIcon({ status }: { status: TunnelRequest['status'] }) {
    switch (status) {
        case 'complete': return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
        case 'processing': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
        default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
}

// ─── Result Detail Card ───────────────────────────────────────────────────────

function ResultCard({ request }: { request: TunnelRequest }) {
    const [expanded, setExpanded] = useState(false);
    const result = request.result as Record<string, unknown> | undefined;

    const score = result?.overall_score ?? result?.tca_score ?? result?.score ?? null;
    const recommendation = result?.recommendation as string | undefined;
    const modules = result?.module_scores as Record<string, number> | undefined;

    return (
        <Card className="border border-border">
            <CardContent className="pt-4 pb-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-sm">{request.company_name}</p>
                        <p className="text-xs text-muted-foreground">{request.analysis_type} · {new Date(request.submitted_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {score !== null && (
                            <Badge variant="secondary">{Math.round(Number(score))}%</Badge>
                        )}
                        <Badge variant={request.status === 'complete' ? 'default' : 'outline'} className="capitalize">
                            {request.status}
                        </Badge>
                    </div>
                </div>

                {score !== null && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Overall Score</span>
                            <span>{Math.round(Number(score))}%</span>
                        </div>
                        <Progress value={Number(score)} className="h-2" />
                    </div>
                )}

                {recommendation && (
                    <p className="text-xs text-muted-foreground italic">{recommendation}</p>
                )}

                {modules && (
                    <div>
                        <Button variant="ghost" size="sm" className="h-6 px-1 text-xs gap-1" onClick={() => setExpanded(v => !v)}>
                            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            Module Scores
                        </Button>
                        {expanded && (
                            <div className="mt-2 space-y-1">
                                {Object.entries(modules).map(([mod, val]) => (
                                    <div key={mod} className="grid grid-cols-[1fr_auto] items-center gap-2 text-xs">
                                        <span className="capitalize text-muted-foreground truncate">{mod.replace(/_/g, ' ')}</span>
                                        <span className="font-medium tabular-nums">{Math.round(Number(val))}%</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RemoteTunnelPage() {
    const { toast } = useToast();
    const fileRef = useRef<HTMLInputElement>(null);

    const [tunnelStatus, setTunnelStatus] = useState<TunnelStatus>({ status: 'checking' });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [companyName, setCompanyName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [analysisType, setAnalysisType] = useState('comprehensive');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [requests, setRequests] = useState<TunnelRequest[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const raw = sessionStorage.getItem('tunnelRequests');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    const [activeTab, setActiveTab] = useState<'history' | 'results'>('history');

    useEffect(() => {
        sessionStorage.setItem('tunnelRequests', JSON.stringify(requests));
    }, [requests]);

    const checkConnection = async () => {
        setIsRefreshing(true);
        setTunnelStatus(prev => ({ ...prev, status: 'checking' }));
        try {
            const res = await fetch('/api/tunnel');
            const data: TunnelStatus = await res.json();
            setTunnelStatus(data);
        } catch {
            setTunnelStatus({ status: 'disconnected', error: 'Could not reach tunnel endpoint' });
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        checkConnection();
        const interval = setInterval(checkConnection, 60_000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName.trim()) {
            toast({ variant: 'destructive', title: 'Company name required', description: 'Please enter a company name before submitting.' });
            return;
        }

        setIsSubmitting(true);
        try {
            let body: FormData | string;
            const headers: Record<string, string> = {};

            if (selectedFile) {
                const form = new FormData();
                form.append('company_name', companyName.trim());
                if (companyId.trim()) form.append('company_id', companyId.trim());
                form.append('analysis_type', analysisType);
                form.append('file', selectedFile, selectedFile.name);
                body = form;
            } else {
                body = JSON.stringify({ company_name: companyName.trim(), company_id: companyId.trim() || undefined, analysis_type: analysisType });
                headers['Content-Type'] = 'application/json';
            }

            const res = await fetch('/api/tunnel', { method: 'POST', headers, body });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.detail || `HTTP ${res.status}`);
            }

            const newRequest: TunnelRequest = {
                id: data.tracking_id,
                tracking_id: data.tracking_id,
                company_name: companyName.trim(),
                analysis_type: analysisType,
                submitted_at: data.submitted_at || new Date().toISOString(),
                status: 'complete',
                report_id: data.report_id,
                result: data.result,
            };

            setRequests(prev => [newRequest, ...prev]);
            toast({ title: 'Submitted', description: `Analysis for ${companyName} submitted successfully.` });
            setCompanyName('');
            setCompanyId('');
            setSelectedFile(null);
            if (fileRef.current) fileRef.current.value = '';
            setActiveTab('results');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Submission failed';
            const failedReq: TunnelRequest = {
                id: `err-${Date.now()}`,
                tracking_id: `err-${Date.now()}`,
                company_name: companyName.trim(),
                analysis_type: analysisType,
                submitted_at: new Date().toISOString(),
                status: 'failed',
            };
            setRequests(prev => [failedReq, ...prev]);
            toast({ variant: 'destructive', title: 'Submission Failed', description: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const completedRequests = requests.filter(r => r.status === 'complete' && r.result);

    return (
        <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Wifi className="h-6 w-6" />
                    Remote Tunnel
                </h1>
                <p className="text-muted-foreground text-sm">
                    Submit documents and trigger analysis through the secure backend tunnel.
                </p>
            </div>

            {/* Section 1: Connection Status */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Tunnel Connection Status</CardTitle>
                        <Button variant="ghost" size="sm" onClick={checkConnection} disabled={isRefreshing} className="gap-1.5">
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <ConnectionBadge status={tunnelStatus.status} />
                        {tunnelStatus.latency_ms !== undefined && (
                            <span className="text-sm text-muted-foreground">{tunnelStatus.latency_ms} ms</span>
                        )}
                        {tunnelStatus.endpoint && (
                            <span className="text-xs font-mono text-muted-foreground truncate">{tunnelStatus.endpoint}</span>
                        )}
                    </div>
                    {tunnelStatus.error && (
                        <p className="text-xs text-destructive">{tunnelStatus.error}</p>
                    )}
                    <Separator />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground text-xs">Backend Status</p>
                            <p className="font-medium capitalize">{tunnelStatus.backend_status ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Last Checked</p>
                            <p className="font-medium">
                                {tunnelStatus.checked_at ? new Date(tunnelStatus.checked_at).toLocaleTimeString() : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Total Requests</p>
                            <p className="font-medium">{requests.length}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Completed</p>
                            <p className="font-medium">{completedRequests.length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section 2: Submit via Tunnel */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Submit via Tunnel
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Send company information or attach a document to trigger a remote analysis.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="company-name">Company Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="company-name"
                                    placeholder="Acme Corporation"
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="company-id">Company ID <span className="text-muted-foreground text-xs">(optional)</span></Label>
                                <Input
                                    id="company-id"
                                    placeholder="e.g. 42"
                                    value={companyId}
                                    onChange={e => setCompanyId(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="analysis-type">Analysis Type</Label>
                                <select
                                    id="analysis-type"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                                    value={analysisType}
                                    onChange={e => setAnalysisType(e.target.value)}
                                    disabled={isSubmitting}
                                >
                                    <option value="comprehensive">Comprehensive</option>
                                    <option value="tca">TCA Only</option>
                                    <option value="irr">IRR Only</option>
                                    <option value="quick">Quick Scan</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="file-upload">Attach Document <span className="text-muted-foreground text-xs">(optional)</span></Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="file-upload"
                                        type="file"
                                        ref={fileRef}
                                        accept=".pdf,.xlsx,.xls,.csv,.docx,.doc"
                                        className="cursor-pointer"
                                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                        disabled={isSubmitting}
                                    />
                                    {selectedFile && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setSelectedFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                                        >
                                            ✕
                                        </Button>
                                    )}
                                </div>
                                {selectedFile && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Upload className="h-3 w-3" />
                                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting || !companyName.trim()} className="gap-2">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                {isSubmitting ? 'Submitting…' : 'Submit via Tunnel'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Sections 3 & 4: History / Results tabs */}
            <div className="space-y-4">
                <div className="flex gap-2 border-b">
                    <button
                        className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <Clock className="h-4 w-4" />
                        Request History
                        {requests.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs py-0">{requests.length}</Badge>
                        )}
                    </button>
                    <button
                        className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'results' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setActiveTab('results')}
                    >
                        <BarChart2 className="h-4 w-4" />
                        Analysis Results
                        {completedRequests.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs py-0">{completedRequests.length}</Badge>
                        )}
                    </button>
                </div>

                {activeTab === 'history' && (
                    <Card>
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Tunnel Request History
                            </CardTitle>
                            {requests.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-muted-foreground"
                                    onClick={() => {
                                        setRequests([]);
                                        sessionStorage.removeItem('tunnelRequests');
                                    }}
                                >
                                    Clear All
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {requests.length === 0 ? (
                                <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
                                    <FileText className="h-8 w-8 opacity-30" />
                                    <p className="text-sm">No requests submitted yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {requests.map(req => (
                                        <div key={req.id} className="py-3 flex items-start gap-3">
                                            <RequestStatusIcon status={req.status} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{req.company_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {req.analysis_type} · {new Date(req.submitted_at).toLocaleString()}
                                                </p>
                                                <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">{req.tracking_id}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge
                                                    variant={req.status === 'complete' ? 'default' : req.status === 'failed' ? 'destructive' : 'secondary'}
                                                    className="capitalize text-xs"
                                                >
                                                    {req.status}
                                                </Badge>
                                                {req.result && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-xs gap-1"
                                                        onClick={() => setActiveTab('results')}
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                        View
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'results' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium flex items-center gap-2">
                                <BarChart2 className="h-4 w-4" />
                                Analysis Results
                            </p>
                            <p className="text-xs text-muted-foreground">{completedRequests.length} result{completedRequests.length !== 1 ? 's' : ''}</p>
                        </div>
                        {completedRequests.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
                                    <BarChart2 className="h-8 w-8 opacity-30" />
                                    <p className="text-sm">No analysis results yet. Submit a request to see results here.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {completedRequests.map(req => (
                                    <ResultCard key={req.id} request={req} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

    navigator.clipboard.writeText(embedCode);
    toast({ title: "Embed Code Copied", description: "The iframe embed code has been copied." });
  }

  const handleCopyUrl = () => {
    const url = `${baseUrl}${page.path}`;
    navigator.clipboard.writeText(url);
    toast({ title: "URL Copied", description: `${url} copied to clipboard.` });
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex justify-between items-start'>
          <div>
            <CardTitle className='text-xl'>{page.name}</CardTitle>
            <CardDescription>{page.path}</CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant="outline">{page.status}</Badge>
            <Badge variant={page.enabled ? "success" : "secondary"}>{page.enabled ? 'Enabled' : 'Disabled'}</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground pt-2">{page.description}</p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="font-semibold">Dimensions</p>
          <p className="text-muted-foreground">{page.dims}</p>
        </div>
        <div>
          <p className="font-semibold">Theme</p>
          <p className="text-muted-foreground capitalize">{page.theme}</p>
        </div>
        <div>
          <p className="font-semibold">Auth Required</p>
          <p className="text-muted-foreground">{page.auth ? 'Yes' : 'No'}</p>
        </div>
        <div>
          <p className="font-semibold">Rate Limit</p>
          <p className="text-muted-foreground">{page.rate}</p>
        </div>
        <div className='col-span-full'>
          <p className="font-semibold">Roles</p>
          <div className='flex flex-wrap gap-1 mt-1'>
            {page.roles.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className='flex gap-2'>
          <Button variant="ghost" size="icon" onClick={() => onToggle(page.id, !page.enabled)}>
            <Power className={`size-4 ${page.enabled ? 'text-destructive' : 'text-success'}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleEmbedCode}><Code className="size-4" /></Button>
          <Button variant="ghost" size="icon" onClick={handleCopyUrl}><Copy className="size-4" /></Button>
        </div>
        <div className='flex gap-2'>
          <Button variant="outline" size="sm" onClick={() => onEdit(page)}><Edit className="mr-2" /> Edit</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(page.id)}><Trash2 /></Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const PageDialog = ({ open, onOpenChange, onSave, page }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (page: PageConfig) => void, page: PageConfig | null }) => {
  const [editedPage, setEditedPage] = React.useState<PageConfig | null>(page);

  React.useEffect(() => {
    setEditedPage(page);
  }, [page]);

  if (!editedPage) return null;

  const handleChange = (field: keyof PageConfig, value: any) => {
    setEditedPage(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleRoleChange = (role: string) => {
    if (!editedPage) return;
    const roles = editedPage.roles.includes(role)
      ? editedPage.roles.filter(r => r !== role)
      : [...editedPage.roles, role];
    handleChange('roles', roles);
  }

  const handleSave = () => {
    if (editedPage) {
      onSave(editedPage);
    }
  };

  const isNew = !page?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Add New Page Configuration' : `Editing: ${page?.name}`}</DialogTitle>
          <DialogDescription>
            {isNew ? 'Define the properties for the new remote page.' : 'Modify the configuration for this page.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          <div className="space-y-2 col-span-2 sm:col-span-1">
            <Label>Name</Label>
            <Input value={editedPage.name} onChange={(e) => handleChange('name', e.target.value)} />
          </div>
          <div className="space-y-2 col-span-2 sm:col-span-1">
            <Label>Path</Label>
            <Input value={editedPage.path} onChange={(e) => handleChange('path', e.target.value)} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Description</Label>
            <Textarea value={editedPage.description} onChange={(e) => handleChange('description', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status (Type)</Label>
            <Select value={editedPage.status} onValueChange={(v) => handleChange('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="iFrame">iFrame</SelectItem>
                <SelectItem value="Widget">Widget</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Dimensions (e.g., 1000w x 800h)</Label>
            <Input value={editedPage.dims} onChange={(e) => handleChange('dims', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={editedPage.theme} onValueChange={(v) => handleChange('theme', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Rate Limit</Label>
            <Input value={editedPage.rate} onChange={(e) => handleChange('rate', e.target.value)} />
          </div>
          <div className="space-y-2 flex items-center pt-6">
            <Switch id="auth-required" checked={editedPage.auth} onCheckedChange={(c) => handleChange('auth', c)} />
            <Label htmlFor="auth-required" className="ml-2">Auth Required</Label>
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Accessible Roles</Label>
            <div className="flex flex-wrap gap-2">
              {['admin', 'Analyst', 'user'].map(role => (
                <div key={role} className="flex items-center gap-2">
                  <Switch id={`role-${role}`} checked={editedPage.roles.includes(role)} onCheckedChange={() => handleRoleChange(role)} />
                  <Label htmlFor={`role-${role}`}>{role}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function RemoteIntegrationPage() {
  const [baseUrl, setBaseUrl] = useState('https://localhost:3000');
  const [pages, setPages] = useState(initialPages);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageConfig | null>(null);
  const { toast } = useToast();

  const handleSaveBaseUrl = () => {
    toast({
      title: "Base URL Saved",
      description: "The application base URL has been updated.",
    });
  };

  const handleTogglePage = (id: string, enabled: boolean) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, enabled } : p));
    const pageName = pages.find(p => p.id === id)?.name;
    toast({
      title: `Page ${enabled ? 'Enabled' : 'Disabled'}`,
      description: `${pageName} has been ${enabled ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleDeletePage = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
    toast({
      variant: 'destructive',
      title: 'Page Deleted',
      description: 'The page configuration has been removed.'
    });
  };

  const handleOpenDialog = (page: PageConfig | null) => {
    setEditingPage(page);
    setDialogOpen(true);
  };

  const handleSavePage = (pageToSave: PageConfig) => {
    if (pageToSave.id) { // Editing existing page
      setPages(pages.map(p => p.id === pageToSave.id ? pageToSave : p));
      toast({ title: "Page Updated", description: `${pageToSave.name} configuration has been saved.` });
    } else { // Adding new page
      const newPage = { ...pageToSave, id: `new-${Date.now()}` };
      setPages([newPage, ...pages]);
      toast({ title: "Page Added", description: `${newPage.name} has been created.` });
    }
    setDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className='flex justify-between items-center'>
        <div>
          <h1 className="text-2xl font-bold">Remote Integration Configuration</h1>
          <p className="text-muted-foreground">Configure pages for remote access and embedding</p>
        </div>
        <Button onClick={() => handleOpenDialog({
          id: '', name: 'New Page', path: '/new-path', description: '', status: 'iFrame',
          enabled: false, dims: '1000w x 800h', theme: 'auto', auth: true, rate: '100/hour', roles: ['admin']
        })}><Plus /> Add Page</Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Base URL Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-end gap-4'>
            <div className='flex-1 space-y-2'>
              <Label htmlFor="base-url">Application Base URL</Label>
              <Input id="base-url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            </div>
            <Button onClick={handleSaveBaseUrl}><Save /> Save</Button>
          </div>
        </CardContent>
      </Card>

      <div className='space-y-6'>
        {pages.map(page => (
          <PageCard
            key={page.id}
            page={page}
            onToggle={handleTogglePage}
            onEdit={handleOpenDialog}
            onDelete={handleDeletePage}
            baseUrl={baseUrl}
          />
        ))}
      </div>

      <PageDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSavePage}
        page={editingPage}
      />

    </div>
  );
}


