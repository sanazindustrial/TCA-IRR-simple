'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import reportsApi from '@/lib/reports-api';
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
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
  ArrowRight,
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
  Building2,
  Settings,
  Download,
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

interface ReportSection {
  id: string;
  title: string;
  description: string;
  active: boolean;
}

const DEFAULT_SSD_SECTIONS: ReportSection[] = [
  { id: 'ss-page-1', title: 'Market Opportunity', description: 'Market size, trends, and opportunity assessment', active: true },
  { id: 'ss-page-2', title: 'Product & Technology', description: 'Product maturity, tech stack, and IP', active: true },
  { id: 'ss-page-3', title: 'Team & Founders', description: 'Founder backgrounds and team composition', active: true },
  { id: 'ss-page-4', title: 'Business Model', description: 'Revenue model, pricing, and unit economics', active: true },
  { id: 'ss-page-5', title: 'Traction & Metrics', description: 'Growth metrics, revenue, and KPIs', active: true },
  { id: 'ss-page-6', title: 'Competitive Analysis', description: 'Competitive landscape and differentiation', active: true },
  { id: 'ss-page-7', title: 'Go-to-Market Strategy', description: 'Customer acquisition and distribution', active: true },
  { id: 'ss-page-8', title: 'Financial Overview', description: 'Funding history, burn rate, and projections', active: true },
  { id: 'ss-page-9', title: 'Risk Assessment', description: 'Key risks and mitigation strategies', active: true },
  { id: 'ss-page-10', title: 'Investment Recommendation', description: 'Final score and investment thesis', active: true },
];

const SSD_WIZARD_STEPS = [
  { id: 1, name: 'Company Setup', icon: Building2 },
  { id: 2, name: 'Report Sections', icon: Settings },
  { id: 3, name: 'Storage Options', icon: Download },
  { id: 4, name: 'Submit & Track', icon: Zap },
];

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

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [ssdSections, setSsdSections] = useState<ReportSection[]>([]);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [saveToDatabase, setSaveToDatabase] = useState(false);
  const [downloadAfterSubmit, setDownloadAfterSubmit] = useState(false);
  const [savedDbReportId, setSavedDbReportId] = useState<number | null>(null);
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'polling' | 'done' | 'failed'>('idle');
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Evaluation metadata
  const [evaluationId] = useState<string>(
    () => `EVL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  );
  const [createdByName, setCreatedByName] = useState<string>('Unknown');
  const [sessionStartedAt] = useState<string>(() => new Date().toISOString());

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current !== null) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback((tid: string) => {
    stopPolling();
    setPollingStatus('polling');
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/ssd/audit/logs`, { headers: SSD_HEADERS });
        if (!res.ok) return;
        const data = await res.json();
        const allLogs: AuditLog[] = Array.isArray(data) ? data : (data as { logs?: AuditLog[] }).logs ?? [];
        const entry = allLogs.find((l) => l.tracking_id === tid);
        if (entry?.status === 'completed') {
          stopPolling();
          setPollingStatus('done');
          // Auto-download the report
          try {
            const reportRes = await fetch(`${API_BASE}/api/v1/ssd/audit/logs/${tid}/report`, {
              headers: SSD_HEADERS,
            });
            if (reportRes.ok) {
              const reportData = await reportRes.json();
              const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ssd-report-${tid}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          } catch {
            // download failed silently
          }
        } else if (entry?.status === 'failed') {
          stopPolling();
          setPollingStatus('failed');
        }
      } catch {
        // ignore transient poll errors
      }
    }, 10_000);
  }, [stopPolling]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

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

  // Load user metadata on mount
  useEffect(() => {
    try {
      const lu = localStorage.getItem('loggedInUser');
      if (lu) {
        const u = JSON.parse(lu);
        setCreatedByName(u.name || u.email || 'Unknown');
      }
    } catch { /* ignore */ }
  }, []);

  // Load SSD section config when dialog opens
  useEffect(() => {
    if (submitOpen) {
      const saved = localStorage.getItem('report-config-ssd-sections');
      setSsdSections(saved ? JSON.parse(saved) : DEFAULT_SSD_SECTIONS);
    }
  }, [submitOpen]);

  const toggleSsdSection = (id: string) => {
    setSsdSections((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  };

  const toggleAllSsdSections = (active: boolean) => {
    setSsdSections((prev) => prev.map((s) => ({ ...s, active })));
  };

  const wizardCanProceed = () => {
    switch (wizardStep) {
      case 1: return submitForm.company_name.trim().length > 0 && submitForm.founder_email.trim().length > 0;
      case 2: return ssdSections.filter((s) => s.active).length > 0;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const wizardNext = () => {
    if (wizardCanProceed() && wizardStep < 4) setWizardStep((s) => s + 1);
  };

  const wizardPrev = () => {
    if (wizardStep > 1) setWizardStep((s) => s - 1);
  };

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
      const activeSectionIds = ssdSections.filter((s) => s.active).map((s) => s.id);
      if (activeSectionIds.length > 0 && activeSectionIds.length < ssdSections.length) {
        body.pages = activeSectionIds.join(',');
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
      const tid = (data as { tracking_id?: string }).tracking_id ?? '';
      setTrackingId(tid);
      toast({
        title: 'Submission successful',
        description: `Tracking ID: ${tid || 'N/A'}`,
      });
      fetchLogs();
      fetchStats();

      // Save to database immediately if requested
      if (saveToDatabase && tid) {
        try {
          const userRaw = typeof window !== 'undefined' ? localStorage.getItem('loggedInUser') : null;
          const userId = userRaw ? ((JSON.parse(userRaw) as { id?: number }).id ?? 1) : 1;
          const saved = await reportsApi.createReport(
            {
              company_name: submitForm.company_name,
              report_type: 'ssd',
              analysis_data: {
                tracking_id: tid,
                founder_email: submitForm.founder_email,
                pages: ssdSections.filter((s) => s.active).map((s) => s.id),
              },
            },
            userId,
          );
          setSavedDbReportId(saved.id);
          toast({ title: 'Saved to database', description: `Report #${saved.id} created.` });
        } catch {
          toast({
            variant: 'destructive',
            title: 'Database save failed',
            description: 'Submission was successful but could not save to database.',
          });
        }
      }

      // Start polling for completion and auto-download if requested
      if (downloadAfterSubmit && tid) {
        startPolling(tid);
      }
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
          <Dialog
            open={submitOpen}
            onOpenChange={(open) => {
              setSubmitOpen(open);
              if (!open) {
                stopPolling();
                setWizardStep(1);
                setTrackingId(null);
                setSavedDbReportId(null);
                setPollingStatus('idle');
                setSubmitForm({ company_name: '', founder_email: '', callback_url: '' });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="size-4" />
                Submit New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit SSD Evaluation</DialogTitle>
                <DialogDescription>
                  Step {wizardStep} of {SSD_WIZARD_STEPS.length} —{' '}
                  {SSD_WIZARD_STEPS[wizardStep - 1].name}
                </DialogDescription>
              </DialogHeader>

              {/* Step indicator */}
              <div className="flex items-center justify-between my-1">
                {SSD_WIZARD_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = wizardStep === step.id;
                  const isDone = (wizardStep > step.id) || (!!trackingId && step.id === 4);
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={cn(
                            'size-8 rounded-full flex items-center justify-center transition-colors',
                            isActive && 'bg-primary text-primary-foreground',
                            isDone && !isActive && 'bg-green-500 text-white',
                            !isActive && !isDone && 'bg-muted text-muted-foreground'
                          )}
                        >
                          {isDone && !isActive ? (
                            <CheckCircle2 className="size-4" />
                          ) : (
                            <Icon className="size-4" />
                          )}
                        </div>
                        <span className="text-xs whitespace-nowrap hidden sm:block">
                          {step.name}
                        </span>
                      </div>
                      {idx < SSD_WIZARD_STEPS.length - 1 && (
                        <div
                          className={cn(
                            'h-0.5 w-10 mx-1 mb-4',
                            wizardStep > step.id ? 'bg-green-500' : 'bg-border'
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Step content */}
              <div className="min-h-[240px]">
                {wizardStep === 1 && (
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
                )}

                {wizardStep === 2 && (
                  <div className="space-y-3 py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {ssdSections.filter((s) => s.active).length} / {ssdSections.length} pages
                        active
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAllSsdSections(true)}
                        >
                          Enable All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAllSsdSections(false)}
                        >
                          Disable All
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {ssdSections.map((section) => (
                        <div
                          key={section.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex-1 mr-3 space-y-0.5">
                            <p className="text-sm font-medium">{section.title}</p>
                            <p className="text-xs text-muted-foreground">{section.description}</p>
                          </div>
                          <Switch
                            checked={section.active}
                            onCheckedChange={() => toggleSsdSection(section.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                      Choose how to store and export the evaluation results after submission.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Save to Database</p>
                          <p className="text-xs text-muted-foreground">
                            Persist report results via the reports API
                          </p>
                        </div>
                        <Switch
                          checked={saveToDatabase}
                          onCheckedChange={setSaveToDatabase}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Download JSON on Completion</p>
                          <p className="text-xs text-muted-foreground">
                            Automatically download the report when processing completes
                          </p>
                        </div>
                        <Switch
                          checked={downloadAfterSubmit}
                          onCheckedChange={setDownloadAfterSubmit}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 4 && (
                  <div className="space-y-4 py-2">
                    {!trackingId ? (
                      <>
                        <div className="rounded-lg bg-muted/40 border p-4 space-y-2 text-sm">
                          <p>
                            <span className="font-medium">Company:</span>{' '}
                            {submitForm.company_name}
                          </p>
                          <p>
                            <span className="font-medium">Email:</span> {submitForm.founder_email}
                          </p>
                          {submitForm.callback_url && (
                            <p>
                              <span className="font-medium">Callback:</span>{' '}
                              {submitForm.callback_url}
                            </p>
                          )}
                          <p>
                            <span className="font-medium">Pages:</span>{' '}
                            {ssdSections.filter((s) => s.active).length} of {ssdSections.length}{' '}
                            active
                          </p>
                          <p>
                            <span className="font-medium">Save to DB:</span>{' '}
                            {saveToDatabase ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Click Submit to start the evaluation. Results are processed
                          asynchronously — you will receive a tracking ID immediately.
                        </p>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-green-300 bg-green-50/40 p-4 flex items-center gap-3">
                          <CheckCircle2 className="size-5 text-green-600 shrink-0" />
                          <div>
                            <p className="font-semibold text-green-800 text-sm">
                              Evaluation Submitted
                            </p>
                            <p className="text-xs text-green-700 font-mono mt-0.5">
                              Tracking ID: {trackingId}
                            </p>
                          </div>
                        </div>
                        {savedDbReportId && (
                          <div className="rounded-lg border border-blue-300 bg-blue-50/40 p-3 flex items-center gap-2 text-sm">
                            <CheckCircle2 className="size-4 text-blue-600 shrink-0" />
                            <span className="text-blue-800">Saved to database as Report #{savedDbReportId}</span>
                          </div>
                        )}
                        {pollingStatus === 'polling' && (
                          <div className="rounded-lg border bg-muted/40 p-3 flex items-center gap-2 text-sm">
                            <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                            <span className="text-muted-foreground">Waiting for evaluation to complete — will auto-download when ready&hellip;</span>
                          </div>
                        )}
                        {pollingStatus === 'done' && (
                          <div className="rounded-lg border border-green-300 bg-green-50/40 p-3 flex items-center gap-2 text-sm">
                            <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                            <span className="text-green-800">Report completed and downloaded successfully.</span>
                          </div>
                        )}
                        {pollingStatus === 'failed' && (
                          <div className="rounded-lg border border-red-300 bg-red-50/40 p-3 text-sm text-red-700">
                            Evaluation failed — no report available for download.
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          The evaluation is processing asynchronously. Check the audit log below
                          for status updates.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={wizardStep === 1 ? () => setSubmitOpen(false) : wizardPrev}
                  disabled={submitting}
                >
                  {wizardStep === 1 ? 'Cancel' : (
                    <>
                      <ArrowLeft className="mr-1 size-4" />
                      Back
                    </>
                  )}
                </Button>
                {wizardStep < 4 && (
                  <Button onClick={wizardNext} disabled={!wizardCanProceed()}>
                    Next
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                )}
                {wizardStep === 4 && !trackingId && (
                  <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    {submitting ? 'Submitting...' : (
                      <>
                        <Zap className="size-4" />
                        Submit Evaluation
                      </>
                    )}
                  </Button>
                )}
                {wizardStep === 4 && trackingId && (
                  <Button onClick={() => setSubmitOpen(false)}>Done</Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Evaluation metadata banner */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span><span className="font-semibold text-foreground">Evaluation ID:</span> <span className="font-mono text-primary">{evaluationId}</span></span>
        <span><span className="font-semibold text-foreground">Created by:</span> {createdByName}</span>
        <span><span className="font-semibold text-foreground">Session started:</span> {new Date(sessionStartedAt).toLocaleString()}</span>
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
