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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  RefreshCw,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  FileDown,
  Plus,
  Eye,
  Loader2,
  BarChart3,
  Users,
  Timer,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';
const SSD_API_KEY = process.env.NEXT_PUBLIC_SSD_API_KEY || 'ssd-tca-58ceb369539c4a098b9ac49c';
const SSD_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-Key': SSD_API_KEY,
};

interface AuditLog {
  tracking_id: string;
  company_name: string;
  founder_email: string;
  status: string;
  created_at: string;
  updated_at: string;
  final_score: number | null;
  recommendation: string | null;
  events: string[];
  report_exists: boolean;
  report_file_size: number | null;
  processing_duration_ms: number | null;
}

interface AuditStats {
  total_requests: number;
  status_breakdown: {
    completed: number;
    failed: number;
    processing: number;
  };
  callback_stats: Record<string, unknown>;
  performance: {
    avg_processing_time_ms: number;
  };
  scores: {
    avg_final_score: number;
    total_evaluated: number;
  };
}

function StatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case 'completed':
      return (
        <Badge className="gap-1 bg-green-500/10 text-green-700 border-green-500/30 hover:bg-green-500/20">
          <CheckCircle2 className="size-3" />
          Completed
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="gap-1 bg-red-500/10 text-red-700 border-red-500/30 hover:bg-red-500/20">
          <XCircle className="size-3" />
          Failed
        </Badge>
      );
    case 'processing':
      return (
        <Badge className="gap-1 bg-blue-500/10 text-blue-700 border-blue-500/30 hover:bg-blue-500/20">
          <Loader2 className="size-3 animate-spin" />
          Processing
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="size-3" />
          {status}
        </Badge>
      );
  }
}

export default function SSDReportPage() {
  const { toast } = useToast();

  const [stats, setStats] = useState<AuditStats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);

  const [viewingReport, setViewingReport] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<Record<string, unknown> | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    company_name: '',
    founder_email: '',
    callback_url: '',
  });

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/ssd/audit/stats`, { headers: SSD_HEADERS });
      if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    setLogsError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/ssd/audit/logs`, { headers: SSD_HEADERS });
      if (!res.ok) throw new Error(`Logs fetch failed: ${res.status}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : data.logs ?? []);
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchLogs();
  }, [fetchStats, fetchLogs]);

  const handleViewReport = async (trackingId: string) => {
    setViewingReport(trackingId);
    setIsLoadingReport(true);
    setReportContent(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/ssd/audit/logs/${trackingId}/report`, {
        headers: SSD_HEADERS,
      });
      if (!res.ok) throw new Error(`Report fetch failed: ${res.status}`);
      const data = await res.json();
      setReportContent(data);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Report Error',
        description: err instanceof Error ? err.message : 'Could not load report',
      });
      setViewingReport(null);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleSubmit = async () => {
    if (!submitForm.company_name.trim() || !submitForm.founder_email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Required fields missing',
        description: 'Company name and founder email are required.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        company_name: submitForm.company_name,
        founder_email: submitForm.founder_email,
      };
      if (submitForm.callback_url.trim()) {
        body.callback_url = submitForm.callback_url;
      }
      const res = await fetch(`${API_BASE}/api/v1/ssd/evaluate`, {
        method: 'POST',
        headers: SSD_HEADERS,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { detail?: string }).detail || `Submit failed: ${res.status}`
        );
      }
      const data = await res.json();
      toast({
        title: 'Submission successful',
        description: `Tracking ID: ${(data as { tracking_id?: string }).tracking_id ?? 'N/A'}`,
      });
      setSubmitOpen(false);
      setSubmitForm({ company_name: '', founder_email: '', callback_url: '' });
      fetchLogs();
      fetchStats();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const completionRate =
    stats && stats.total_requests > 0
      ? Math.round((stats.status_breakdown.completed / stats.total_requests) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/reports">
                <ArrowLeft className="mr-1 size-4" />
                Reports
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="size-6 text-primary" />
            SSD (Startup Steroid) Reports
          </h1>
          <p className="text-muted-foreground text-sm">
            AI-powered accelerator evaluation audit logs and reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStats();
              fetchLogs();
            }}
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="size-4" />
                Submit New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit SSD Evaluation</DialogTitle>
                <DialogDescription>
                  Submit a new startup for SSD accelerator evaluation. Results are processed
                  asynchronously.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="ssd-company">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="ssd-company"
                    placeholder="e.g., QuantumLeap AI"
                    value={submitForm.company_name}
                    onChange={(e) =>
                      setSubmitForm((f) => ({ ...f, company_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ssd-email">
                    Founder Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="ssd-email"
                    type="email"
                    placeholder="founder@company.com"
                    value={submitForm.founder_email}
                    onChange={(e) =>
                      setSubmitForm((f) => ({ ...f, founder_email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ssd-callback">Callback URL (optional)</Label>
                  <Input
                    id="ssd-callback"
                    placeholder="https://your-webhook.com/callback"
                    value={submitForm.callback_url}
                    onChange={(e) =>
                      setSubmitForm((f) => ({ ...f, callback_url: e.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSubmitOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Submit Evaluation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Activity className="size-4" />
              Total Requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : statsError ? (
              <span className="text-destructive text-sm">Error</span>
            ) : (
              <p className="text-3xl font-bold">{stats?.total_requests ?? 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle2 className="size-4 text-green-500" />
              Completion Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="space-y-1">
                <p className="text-3xl font-bold">{completionRate}%</p>
                <Progress value={completionRate} className="h-1.5" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <BarChart3 className="size-4 text-primary" />
              Avg Score
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div>
                <p className="text-3xl font-bold">
                  {stats?.scores.avg_final_score != null
                    ? stats.scores.avg_final_score.toFixed(1)
                    : '—'}
                </p>
                <p className="text-xs text-muted-foreground">
                  from {stats?.scores.total_evaluated ?? 0} evaluated
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Timer className="size-4" />
              Avg Processing Time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div>
                <p className="text-3xl font-bold">
                  {stats?.performance.avg_processing_time_ms != null
                    ? `${(stats.performance.avg_processing_time_ms / 1000).toFixed(1)}s`
                    : '—'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      {!isLoadingStats && stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-green-50/40 border-green-200/60 p-3 text-center">
            <p className="text-2xl font-bold text-green-700">
              {stats.status_breakdown.completed}
            </p>
            <p className="text-xs text-green-600 mt-0.5">Completed</p>
          </div>
          <div className="rounded-lg border bg-blue-50/40 border-blue-200/60 p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {stats.status_breakdown.processing}
            </p>
            <p className="text-xs text-blue-600 mt-0.5">Processing</p>
          </div>
          <div className="rounded-lg border bg-red-50/40 border-red-200/60 p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.status_breakdown.failed}</p>
            <p className="text-xs text-red-600 mt-0.5">Failed</p>
          </div>
        </div>
      )}

      <Separator />

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Submission Audit Log
          </CardTitle>
          <CardDescription>
            All SSD evaluation submissions and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : logsError ? (
            <div className="py-8 text-center">
              <XCircle className="size-10 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{logsError}</p>
              <Button variant="outline" size="sm" onClick={fetchLogs} className="mt-3">
                Retry
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <Activity className="size-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No submissions found.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Submit a new evaluation to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Recommendation</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.tracking_id}>
                      <TableCell className="font-medium">{log.company_name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {log.founder_email}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={log.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {log.final_score != null ? (
                          <span className="font-semibold">{log.final_score.toFixed(1)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.recommendation ? (
                          <Badge variant="outline" className="text-xs">
                            {log.recommendation}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(log.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.report_exists ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReport(log.tracking_id)}
                            className="gap-1"
                          >
                            <Eye className="size-3" />
                            View Report
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">No report</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Viewer Dialog */}
      <Dialog
        open={viewingReport !== null}
        onOpenChange={(open) => {
          if (!open) {
            setViewingReport(null);
            setReportContent(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="size-5" />
              SSD Report
            </DialogTitle>
            <DialogDescription>Tracking ID: {viewingReport}</DialogDescription>
          </DialogHeader>
          {isLoadingReport ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading report...</span>
            </div>
          ) : reportContent ? (
            <div className="space-y-4">
              {/* Score display */}
              {(reportContent as { final_score?: number }).final_score != null && (
                <div className="rounded-lg border bg-primary/5 p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Final Score
                  </p>
                  <p className="text-4xl font-bold text-primary">
                    {((reportContent as { final_score: number }).final_score).toFixed(1)}
                  </p>
                  {(reportContent as { recommendation?: string }).recommendation && (
                    <Badge className="mt-2">
                      {(reportContent as { recommendation: string }).recommendation}
                    </Badge>
                  )}
                </div>
              )}
              {/* Raw JSON for other fields */}
              <div className="space-y-1">
                <p className="text-sm font-semibold">Full Report Data</p>
                <pre className="rounded-lg bg-muted p-4 text-xs overflow-auto max-h-60">
                  {JSON.stringify(reportContent, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setViewingReport(null);
                setReportContent(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
