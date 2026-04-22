
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Share2,
  AlertTriangle,
  FileUp,
  History,
  Loader2,
  Database,
  CloudOff,
  Cloud,
  HardDrive,
  CheckCircle2,
  Clock,
  GitBranch,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { UserRole } from '@/app/analysis/result/page';
import { useToast } from '@/hooks/use-toast';
import { ExportButtons } from '@/components/evaluation/export-buttons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { reportsApi, type ReportData, type ReportVersion, type ReportStats } from '@/lib/reports-api';
import { reportStorage } from '@/lib/report-storage';

// Type for localStorage stored reports
interface LocalStoredReport {
  id: string;
  reportId?: string;         // Unique report ID
  evaluationId?: string;     // Evaluation ID
  companyId?: string;        // Company ID
  userId: string;
  companyName: string;
  reportType: 'triage' | 'dd' | 'ssd';
  framework: 'general' | 'medtech';
  data: any;
  createdAt: string;
  updatedAt: string;
  version?: number;
  metadata: {
    analysisDuration?: number;
    moduleCount: number;
    compositeScore: number;
    status: 'draft' | 'completed' | 'archived';
    tags?: string[];
  };
}

// Helper to get all reports from localStorage
function getLocalStorageReports(): Report[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('tca_reports');
    console.log('localStorage tca_reports raw:', stored ? `${stored.length} chars` : 'null');
    if (!stored) return [];
    const reports: LocalStoredReport[] = JSON.parse(stored);
    console.log('Parsed localStorage reports:', reports.length, 'reports');
    const mappedReports = reports.map((r, index) => {
      // Normalize score: if < 1, it was incorrectly divided by 10 before (legacy bug)
      let score = r.metadata?.compositeScore || 0;
      if (score > 0 && score < 1) {
        score = score * 10; // Fix legacy data that was divided by 10
      }
      score = Math.round(score * 100) / 100; // Round to 2 decimals

      const mapped = {
        id: r.id || `local-${index}`,
        reportId: r.reportId || r.id,
        evaluationId: r.evaluationId,
        companyId: r.companyId,
        company: r.companyName || 'Unnamed Company',
        type: r.reportType === 'dd' ? 'Due Diligence' : r.reportType === 'ssd' ? 'SSD Report' : 'Triage',
        status: r.metadata?.status === 'completed' ? 'Completed' : 'Draft',
        approval: 'Pending',
        score: score,
        confidence: Math.round((r.metadata?.moduleCount || 0) / 9 * 100),
        recommendation: score >= 8 ? 'Recommend' : score >= 6 ? 'Hold' : 'Conditional',
        user: { name: 'Local User', email: localStorage.getItem('userEmail') || 'user@tca.com' },
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        missingSections: undefined,
        version: r.version || 1,
      };
      console.log('Mapped report:', mapped.company, mapped.id);
      return mapped;
    });
    return mappedReports;
  } catch (error) {
    console.error('Error loading localStorage reports:', error);
    return [];
  }
}

// Demo/Fallback data - ONLY shown when no real data is available (API offline AND no localStorage)
// This data is clearly marked as DEMO in the UI when shown
const fallbackReportsData: ReportData[] = [
  {
    id: 1,
    company_name: '[DEMO] TechStart Inc.',
    company: '[DEMO] TechStart Inc.',
    type: 'Triage',
    status: 'Completed',
    approval: 'Approved',
    score: 8.2,
    confidence: 88.1,
    recommendation: 'Recommend',
    user: { name: 'Demo User', email: 'demo@tca.com' },
    created_at: '04/12/2026',
    createdAt: '04/12/2026',
    updated_at: '04/12/2026'
  },
  {
    id: 2,
    company_name: '[DEMO] AI Solutions',
    company: '[DEMO] AI Solutions',
    type: 'Triage',
    status: 'Completed',
    approval: 'Due Diligence',
    score: 7.8,
    confidence: 91.5,
    recommendation: 'Recommend',
    user: { name: 'Demo User', email: 'demo@tca.com' },
    created_at: '04/11/2026',
    createdAt: '04/11/2026',
    updated_at: '04/11/2026'
  },
];

const StatCard = ({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description?: string;
}) => (
  <Card className="flex-1 bg-card/50">
    <CardContent className="p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </CardContent>
  </Card>
);

// Local Report type for display purposes
interface Report {
  id: number | string;
  reportId?: string;       // Unique report ID: RPT-{TYPE}-{timestamp}-{random}
  evaluationId?: string;   // Evaluation ID: EVAL-{timestamp}-{random}
  companyId?: string;      // Company ID: {prefix}-{timestamp}-{random}
  company: string;
  type: string;
  status: string;
  approval: string;
  score: number;
  confidence: number;
  recommendation: string;
  user: { name: string; email: string };
  createdAt: string;
  missingSections?: string[];
  version?: number;        // Report version number
}

const approvalStatusColors: { [key: string]: string } = {
  'Approved': 'bg-sky-500/20 text-sky-500',
  'Pending': 'bg-yellow-500/20 text-yellow-500',
  'Due Diligence': 'bg-blue-500/20 text-blue-500',
  'SSD Report': 'bg-purple-500/20 text-purple-500',
  'Rejected': 'bg-red-500/20 text-red-500',
  'Invested': 'bg-green-500/20 text-green-500',
};


const ReportCard = ({ report, isPrivileged, onViewVersions }: { report: Report; isPrivileged: boolean; onViewVersions?: () => void }) => {
  return (
    <Card className="overflow-hidden">
      <div className="p-6 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 items-center gap-4">
        <div className="md:col-span-6 lg:col-span-6 flex flex-wrap items-center gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold truncate">{report.company}</h3>
              {/* Unique Report ID Badge */}
              {report.reportId && (
                <Badge variant="secondary" className="font-mono text-xs">{report.reportId}</Badge>
              )}
              <Badge variant="outline">{report.type.toUpperCase()}</Badge>
              <Badge variant={report.status === 'Completed' ? 'success' : 'warning'}>{report.status}</Badge>
              <Badge className={approvalStatusColors[report.approval] || 'bg-gray-500/20'}>{report.approval}</Badge>
              {report.version && report.version > 1 && (
                <Badge variant="outline" className="text-xs">v{report.version}</Badge>
              )}
              {isPrivileged && report.missingSections && report.missingSections.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="size-3" /> Missing Data
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This report was generated with missing sections: {report.missingSections.join(', ')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Overall Score</p>
              <p className="font-bold text-primary">{report.score}/10</p>
            </div>
            <div>
              <p className="text-muted-foreground">Confidence</p>
              <p className="font-bold">{report.confidence}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Recommendation</p>
              <p className={`font-bold ${report.recommendation === 'Recommend' || report.recommendation === 'Invest' ? 'text-success' : 'text-warning'}`}>{report.recommendation.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">User</p>
              <p className="font-semibold truncate">{report.user.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-bold">{report.createdAt}</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-6 lg:col-span-2 flex flex-col gap-2 self-start">
          {isPrivileged && report.type === 'Triage' && report.approval === 'Due Diligence' && (
            <Button asChild className="bg-blue-600 hover:bg-blue-700 justify-start">
              <Link href="/dashboard/reports/due-diligence"><FileUp className="mr-2" /> Start Due Diligence</Link>
            </Button>
          )}
          <Button asChild variant="default" className='justify-start'>
            <Link href="/analysis/result"><Eye className="mr-2" /> View Report</Link>
          </Button>
          {isPrivileged && typeof report.id === 'number' && onViewVersions && (
            <Button variant="outline" className='justify-start' onClick={onViewVersions}>
              <History className="mr-2 size-4" /> Version History
            </Button>
          )}
          <div className='w-full'>
            <ExportButtons />
          </div>
        </div>
      </div>
    </Card>
  )
};

export default function ReportsPage() {
  const [role, setRole] = useState<UserRole>('user');
  const [isPrivilegedUser, setPrivilegedUser] = useState(false);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  // Safe date formatter that returns consistent output
  const formatDate = useCallback((dateInput: string | Date | undefined, includeTime = false) => {
    if (!isMounted) return '...';
    if (!dateInput) return 'N/A';
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return 'N/A';
      return includeTime ? date.toLocaleString() : date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  }, [isMounted]);

  // Storage status state
  const [localStorageCount, setLocalStorageCount] = useState(0);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [pendingSyncReports, setPendingSyncReports] = useState<Report[]>([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [showVersionsDialog, setShowVersionsDialog] = useState(false);
  const [selectedReportVersions, setSelectedReportVersions] = useState<ReportVersion[]>([]);
  const [selectedReportName, setSelectedReportName] = useState('');
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Upload report dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadCompanyName, setUploadCompanyName] = useState('');
  const [uploadReportType, setUploadReportType] = useState('triage');
  const [uploadScore, setUploadScore] = useState('');
  const [uploadRecommendation, setUploadRecommendation] = useState('Conditional');
  const [isUploading, setIsUploading] = useState(false);

  // Function to get pending sync reports from localStorage
  const getPendingSyncReports = useCallback((): Report[] => {
    if (typeof window === 'undefined') return [];
    try {
      // Check multiple possible storage keys for pending sync
      const keys = ['pending_report_sync', 'pending_record_sync', 'pending_sync_queue'];
      const allPending: Report[] = [];

      for (const key of keys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const records = JSON.parse(stored);
            if (Array.isArray(records)) {
              for (const record of records) {
                // Map to Report format for display
                const report: Report = {
                  id: record.id?.evaluationId || record.evaluationId || `pending-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                  company: record.company?.name || record.companyName || record.company_name || 'Unknown',
                  type: record.report?.reportType === 'dd' ? 'Due Diligence' : record.report?.reportType === 'ssd' ? 'SSD Report' : 'Triage',
                  status: 'Pending Sync',
                  approval: 'Pending',
                  score: record.analysis?.overallScore || record.score || 0,
                  confidence: record.analysis?.confidence || record.confidence || 0,
                  recommendation: record.analysis?.recommendation || 'Hold',
                  user: {
                    name: record.user?.name || record.userName || 'Local User',
                    email: record.user?.email || record.userEmail || localStorage.getItem('userEmail') || 'user@tca.com'
                  },
                  createdAt: record.id?.createdAt || record.createdAt || new Date().toISOString(),
                };
                // Avoid duplicates
                if (!allPending.find(p => p.id === report.id)) {
                  allPending.push(report);
                }
              }
            }
          } catch (e) {
            console.warn(`Error parsing ${key}:`, e);
          }
        }
      }

      // Also check unified_records for records not yet synced
      const unifiedRecords = localStorage.getItem('unified_records');
      if (unifiedRecords) {
        try {
          const records = JSON.parse(unifiedRecords);
          if (Array.isArray(records)) {
            for (const record of records) {
              // Check if this record has a status indicating it needs sync
              if (record.workflow?.status === 'completed' && !record.synced) {
                const report: Report = {
                  id: record.id?.evaluationId || `unified-${Date.now()}`,
                  company: record.company?.name || 'Unknown',
                  type: record.report?.reportType === 'dd' ? 'Due Diligence' : record.report?.reportType === 'ssd' ? 'SSD Report' : 'Triage',
                  status: 'Pending Sync',
                  approval: record.workflow?.reviewerApproval?.status || 'Pending',
                  score: record.analysis?.overallScore || 0,
                  confidence: record.analysis?.confidence || 0,
                  recommendation: record.analysis?.recommendation || 'Hold',
                  user: {
                    name: record.user?.name || 'Local User',
                    email: record.user?.email || 'user@tca.com'
                  },
                  createdAt: record.id?.createdAt || new Date().toISOString(),
                };
                if (!allPending.find(p => p.id === report.id)) {
                  allPending.push(report);
                }
              }
            }
          }
        } catch (e) {
          console.warn('Error parsing unified_records:', e);
        }
      }

      return allPending;
    } catch (error) {
      console.error('Error getting pending sync reports:', error);
      return [];
    }
  }, []);

  // Function to clear pending sync queue
  const clearPendingSyncQueue = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      // Clear all possible storage keys for pending sync
      const keys = ['pending_report_sync', 'pending_record_sync', 'pending_sync_queue'];
      for (const key of keys) {
        localStorage.removeItem(key);
      }

      // Also clear synced flag from unified_records
      const unifiedRecords = localStorage.getItem('unified_records');
      if (unifiedRecords) {
        try {
          const records = JSON.parse(unifiedRecords);
          if (Array.isArray(records)) {
            const updatedRecords = records.map(record => ({
              ...record,
              synced: true // Mark as synced to prevent re-queuing
            }));
            localStorage.setItem('unified_records', JSON.stringify(updatedRecords));
          }
        } catch (e) {
          console.warn('Error updating unified_records:', e);
        }
      }

      // Update state
      setPendingSyncCount(0);
      setPendingSyncReports([]);

      toast({
        title: 'Queue Cleared',
        description: 'Pending sync queue has been cleared. Reports will remain in local storage.',
      });
    } catch (error) {
      console.error('Error clearing pending sync queue:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clear pending sync queue.',
      });
    }
  }, [toast]);

  // Function to fetch and display version history for a report
  const viewReportVersions = useCallback(async (reportId: number, companyName: string) => {
    setSelectedReportName(companyName);
    setShowVersionsDialog(true);
    setLoadingVersions(true);

    try {
      const versions = await reportsApi.getReportVersions(reportId);
      setSelectedReportVersions(versions);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load version history. The report may not have any saved versions yet.',
      });
      setSelectedReportVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  }, [toast]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    console.log('loadReports() called');
    try {
      // Get localStorage reports first
      const localReports = getLocalStorageReports();
      console.log('Local reports loaded:', localReports.length);

      // Update local storage count
      setLocalStorageCount(localReports.length);

      // Check pending sync queue - now loading full records
      const pendingRecords = getPendingSyncReports();
      setPendingSyncReports(pendingRecords);
      setPendingSyncCount(pendingRecords.length);

      // Try to get API reports
      let apiReports: Report[] = [];
      let apiConnected = false;
      try {
        const response = await reportsApi.getReports({
          search: searchQuery || undefined,
          status: statusFilter || undefined,
          report_type: typeFilter || undefined,
        });
        console.log('API reports loaded:', Array.isArray(response) ? response.length : 'not an array');
        apiConnected = true;

        // Ensure response is an array before mapping
        const reportsArray = Array.isArray(response) ? response : [];

        // Map API response to local Report type with unique IDs
        apiReports = reportsArray.map((r: ReportData) => ({
          id: r.id,
          reportId: r.report_id || r.reportId,
          evaluationId: r.evaluation_id || r.evaluationId,
          companyId: r.company_id != null ? String(r.company_id) : (r.companyId || undefined),
          company: r.company_name || r.company || '',
          type: r.type || 'Triage',
          status: r.status || 'Completed',
          approval: r.approval || 'Pending',
          score: r.score ?? 0,
          confidence: r.confidence ?? 0,
          recommendation: r.recommendation || 'Hold',
          user: r.user || { name: 'Unknown', email: '' },
          createdAt: r.created_at || r.createdAt || '',
          missingSections: r.missing_sections || r.missingSections,
          version: r.version || 1,
        }));
      } catch (apiError) {
        console.warn('API unavailable, using localStorage only:', apiError);
        apiConnected = false;
      }

      // Update backend connection status
      setBackendConnected(apiConnected);

      // Auto-sync and clear pending reports when backend is connected
      if (apiConnected) {
        // Clear all pending sync queues since backend is connected
        // Reports are now saved directly to Azure, no need for local pending queue
        try {
          // Clear all pending sync storage keys
          const pendingKeys = ['pending_report_sync', 'pending_record_sync', 'pending_sync_queue'];
          pendingKeys.forEach(key => localStorage.removeItem(key));

          // Mark unified_records as synced  
          const unifiedRecords = localStorage.getItem('unified_records');
          if (unifiedRecords) {
            try {
              const records = JSON.parse(unifiedRecords);
              if (Array.isArray(records)) {
                const updatedRecords = records.map(record => ({ ...record, synced: true }));
                localStorage.setItem('unified_records', JSON.stringify(updatedRecords));
              }
            } catch (e) {
              console.warn('Error updating unified_records:', e);
            }
          }

          // Also sync any remaining pending reports to backend
          if (pendingRecords.length > 0) {
            console.log(`Syncing ${pendingRecords.length} pending reports to Azure...`);
            await reportStorage.syncPendingReports();
          }

          // Clear pending state
          setPendingSyncReports([]);
          setPendingSyncCount(0);
          console.log('All reports synced to Azure, pending queue cleared');
        } catch (syncError) {
          console.warn('Auto-sync completed with errors:', syncError);
          // Still clear the pending count since we've tried
          setPendingSyncReports([]);
          setPendingSyncCount(0);
        }
      }

      // When backend is connected, prioritize API reports (Azure storage)
      // Only use localStorage as fallback when API is unavailable
      const seenCompanies = new Set<string>();
      const mergedReports: Report[] = [];

      if (apiConnected && apiReports.length > 0) {
        // Backend connected - use API reports only (Azure storage is source of truth)
        console.log('Using Azure storage as source of truth');
        for (const report of apiReports) {
          const key = report.company.toLowerCase();
          if (!seenCompanies.has(key)) {
            seenCompanies.add(key);
            mergedReports.push(report);
          }
        }
        // Clear localStorage count since we're using Azure
        setLocalStorageCount(0);
      } else {
        // Fallback: merge localStorage and API reports
        console.log('Using localStorage as fallback');
        // Add local reports first (most recent saves)
        for (const report of localReports) {
          const key = report.company.toLowerCase();
          if (!seenCompanies.has(key)) {
            seenCompanies.add(key);
            mergedReports.push(report);
          }
        }

        // Add API reports that aren't duplicates
        for (const report of apiReports) {
          const key = report.company.toLowerCase();
          if (!seenCompanies.has(key)) {
            seenCompanies.add(key);
            mergedReports.push(report);
          }
        }
      }

      // If no reports from either source, use fallback
      if (mergedReports.length === 0) {
        const mappedFallback: Report[] = fallbackReportsData.map((r, idx) => ({
          id: r.id,
          reportId: `RPT-TR-DEMO${idx + 1}`, // Demo report IDs
          company: r.company_name || r.company || '',
          type: r.type,
          status: r.status,
          approval: r.approval,
          score: r.score ?? 0,
          confidence: r.confidence ?? 0,
          recommendation: r.recommendation || 'Hold',
          user: r.user,
          createdAt: r.created_at || r.createdAt || '',
          missingSections: undefined,
          version: 1,
        }));
        setAllReports(mappedFallback);
      } else {
        // Apply search filter to merged reports
        let filteredReports = mergedReports;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredReports = mergedReports.filter(r =>
            r.company.toLowerCase().includes(query)
          );
        }
        if (statusFilter) {
          filteredReports = filteredReports.filter(r =>
            r.status.toLowerCase() === statusFilter.toLowerCase()
          );
        }
        if (typeFilter) {
          filteredReports = filteredReports.filter(r =>
            r.type.toLowerCase().includes(typeFilter.toLowerCase())
          );
        }
        setAllReports(filteredReports);
      }
    } catch (error) {
      console.error('Failed to load reports, using fallback data:', error);
      // Fallback to local data
      const mappedFallback: Report[] = fallbackReportsData.map((r, idx) => ({
        id: r.id,
        reportId: `RPT-TR-DEMO${idx + 1}`, // Demo report IDs
        company: r.company_name || r.company || '',
        type: r.type,
        status: r.status,
        approval: r.approval,
        score: r.score ?? 0,
        confidence: r.confidence ?? 0,
        recommendation: r.recommendation || 'Hold',
        user: r.user,
        createdAt: r.created_at || r.createdAt || '',
        missingSections: undefined,
        version: 1,
      }));
      setAllReports(mappedFallback);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter]);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const userRole = user.role?.toLowerCase() || 'user';
        setRole(userRole);
        setPrivilegedUser(userRole === 'admin' || userRole === 'analyst');
      } catch (e) {
        setRole('user');
        setPrivilegedUser(false);
      }
    } else {
      setRole('user');
      setPrivilegedUser(false);
    }

    // Load reports from API
    loadReports();

    // Listen for storage changes (when reports are saved from other tabs/pages)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tca_reports') {
        console.log('Storage changed, reloading reports...');
        loadReports();
      }
    };

    // Listen for page visibility changes (when navigating back to this page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, reloading reports...');
        loadReports();
      }
    };

    // Listen for focus (when user returns to this tab)
    const handleFocus = () => {
      console.log('Window focused, reloading reports...');
      loadReports();
    };

    // Listen for custom event from same-page saves
    const handleCustomUpdate = () => {
      console.log('Custom reports update event received, reloading...');
      loadReports();
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('tca_reports_updated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('tca_reports_updated', handleCustomUpdate);
    };
  }, [loadReports]);

  const handleRefresh = async () => {
    toast({
      title: "Refreshing Reports",
      description: "The list of reports is being updated.",
    });
    await loadReports();
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.json')) {
      toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload a JSON file.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setUploadCompanyName(data.company_name || data.company || data.companyName || '');
        setUploadReportType(data.report_type || data.reportType || 'triage');
        const score = data.overall_score ?? data.tca_score ?? data.score ?? data.compositeScore ?? '';
        setUploadScore(String(score));
        setUploadRecommendation(data.recommendation || 'Conditional');
        toast({ title: 'File Parsed', description: 'Report data extracted. Review and confirm before uploading.' });
      } catch {
        toast({ variant: 'destructive', title: 'Parse Error', description: 'Could not read the JSON file. Check the file format.' });
      }
    };
    reader.readAsText(file);
  }, [toast]);

  const handleUploadReport = useCallback(async () => {
    if (!uploadCompanyName.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Company name is required.' });
      return;
    }
    const score = parseFloat(uploadScore);
    if (isNaN(score) || score < 0 || score > 10) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Score must be a number between 0 and 10.' });
      return;
    }
    setIsUploading(true);
    try {
      const lu = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('loggedInUser') || '{}') : {};
      const userId = Number(lu.backendId || lu.id || 1);
      await reportsApi.createReport({
        company_name: uploadCompanyName.trim(),
        report_type: uploadReportType,
        overall_score: score,
        tca_score: score,
        recommendation: uploadRecommendation,
      }, userId);
      toast({ title: 'Report Uploaded', description: `Report for "${uploadCompanyName}" has been saved.` });
      setShowUploadDialog(false);
      setUploadCompanyName('');
      setUploadScore('');
      setUploadReportType('triage');
      setUploadRecommendation('Conditional');
      await loadReports();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to upload report.';
      toast({ variant: 'destructive', title: 'Upload Failed', description: msg });
    } finally {
      setIsUploading(false);
    }
  }, [uploadCompanyName, uploadReportType, uploadScore, uploadRecommendation, toast, loadReports]);

  // Get current user email from localStorage
  const currentUserEmail = typeof window !== 'undefined'
    ? (() => {
      try {
        const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        return user.email || localStorage.getItem('userEmail') || 'user@tca.com';
      } catch {
        return localStorage.getItem('userEmail') || 'user@tca.com';
      }
    })()
    : 'user@tca.com';

  const reportsForUser = allReports.filter(r => isPrivilegedUser || r.user.email === currentUserEmail);
  const myReports = allReports.filter(r => r.user.email === currentUserEmail);
  const pendingReports = allReports.filter(r => r.approval === 'Pending');


  return (
    <main className="bg-muted/20 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
              <FileText />
              {isPrivilegedUser ? 'Evaluation Reports & Approval Center' : 'My Evaluation Reports'}
            </h1>
            <div className="flex items-center gap-4">
              {(role === 'admin' || role === 'analyst') && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="role-switcher" className={!isPrivilegedUser ? 'text-primary' : ''}>User</Label>
                  <Switch
                    id="role-switcher"
                    checked={isPrivilegedUser}
                    onCheckedChange={(checked) => {
                      setRole(checked ? 'admin' : 'user');
                      setPrivilegedUser(checked);
                    }}
                  />
                  <Label htmlFor="role-switcher" className={isPrivilegedUser ? 'text-primary' : ''}>Admin / Analyst</Label>
                </div>
              )}
              {isPrivilegedUser && <Button variant="outline" onClick={handleRefresh}><RefreshCw className="mr-2 size-4" /> Refresh</Button>}
              <Button variant="outline" onClick={() => setShowUploadDialog(true)}><FileUp className="mr-2 size-4" /> Upload Report</Button>
            </div>
          </div>
        </header>

        {isPrivilegedUser && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatCard title="Total Reports" value={allReports.length} />
            <StatCard title="Completed" value={allReports.filter(r => r.status === 'Completed').length} />
            <StatCard title="Due Diligence" value={allReports.filter(r => r.approval === 'Due Diligence').length} />
            <StatCard title="Pending Approval" value={pendingReports.length} />
            <StatCard title="Average Score" value={7.3} />
          </div>
        )}

        {/* Report Storage & Versioning Status */}
        {isPrivilegedUser && (
          <Card className="mb-8 bg-gradient-to-r from-card to-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="size-5" />
                Report Storage & Sync Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Storage Display - Show Azure when connected, Local when offline */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  {backendConnected ? (
                    <>
                      <Cloud className="size-8 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Azure Storage</p>
                        <p className="text-xl font-bold">{allReports.length} reports</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <HardDrive className="size-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Local Storage</p>
                        <p className="text-xl font-bold">{localStorageCount} reports</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Backend Connection */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  {backendConnected ? (
                    <Cloud className="size-8 text-green-500" />
                  ) : (
                    <CloudOff className="size-8 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Backend API</p>
                    <p className={`text-xl font-bold ${backendConnected ? 'text-green-500' : 'text-red-500'}`}>
                      {backendConnected ? 'Connected' : 'Offline'}
                    </p>
                  </div>
                </div>

                {/* Pending Sync */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  {pendingSyncCount > 0 ? (
                    <Clock className="size-8 text-yellow-500" />
                  ) : (
                    <CheckCircle2 className="size-8 text-green-500" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Sync</p>
                    <p className={`text-xl font-bold ${pendingSyncCount > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {pendingSyncCount > 0 ? `${pendingSyncCount} pending` : 'All synced'}
                    </p>
                  </div>
                </div>

                {/* Version History */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <GitBranch className="size-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Versioning</p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xl font-bold text-purple-500"
                      onClick={() => {
                        toast({
                          title: "Version History",
                          description: "Select a report below to view its version history.",
                        });
                      }}
                    >
                      View History
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sync warning */}
              {pendingSyncCount > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2">
                  <AlertTriangle className="size-5 text-yellow-500" />
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">
                    {pendingSyncCount} report(s) waiting to sync. They will be uploaded when backend connection is restored.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue={isPrivilegedUser ? "all" : "my-reports"}>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
            <TabsList>
              {isPrivilegedUser ? (
                <>
                  <TabsTrigger value="all">All Reports ({reportsForUser.length})</TabsTrigger>
                  <TabsTrigger value="due-diligence">Due Diligence ({allReports.filter(r => r.type === 'Due Diligence').length})</TabsTrigger>
                  <TabsTrigger value="ssd">SSD ({allReports.filter(r => r.type === 'SSD Report').length})</TabsTrigger>
                  <TabsTrigger value="pending">Pending Approval ({pendingReports.length})</TabsTrigger>
                  {pendingSyncCount > 0 && (
                    <TabsTrigger value="pending-sync" className="text-yellow-600">
                      Pending Sync ({pendingSyncCount})
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="my-reports">My Reports ({myReports.length})</TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger value="my-reports">My Reports ({reportsForUser.length})</TabsTrigger>
                  {pendingSyncCount > 0 && (
                    <TabsTrigger value="pending-sync" className="text-yellow-600">
                      Pending Sync ({pendingSyncCount})
                    </TabsTrigger>
                  )}
                </>
              )}
            </TabsList>
            <div className="flex-1 w-full md:w-auto flex flex-col md:flex-row gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search reports by company name..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {isPrivilegedUser && (
                <>
                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val === 'all' ? '' : val)}>
                    <SelectTrigger id="status-filter" className="md:w-[180px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val === 'all' ? '' : val)}>
                    <SelectTrigger id="type-filter" className="md:w-[180px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="triage">Triage</SelectItem>
                      <SelectItem value="dd">Due Diligence</SelectItem>
                      <SelectItem value="ssd">SSD Report</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading reports...</span>
            </div>
          ) : (
            <>
              <TabsContent value="all" className="space-y-4">
                {reportsForUser.length > 0 ? reportsForUser.map(report => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    isPrivileged={isPrivilegedUser}
                    onViewVersions={typeof report.id === 'number' ? () => viewReportVersions(report.id as number, report.company) : undefined}
                  />
                )) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">No reports found. Start by creating a new analysis.</p>
                    <div className="flex gap-2 justify-center">
                      <Button asChild><Link href="/dashboard/evaluation">New Triage Report</Link></Button>
                      {isPrivilegedUser && <Button asChild variant="outline"><Link href="/dashboard/reports/due-diligence">New Due Diligence</Link></Button>}
                    </div>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="due-diligence" className="space-y-4">
                {allReports.filter(r => r.type === 'Due Diligence').length > 0
                  ? allReports.filter(r => r.type === 'Due Diligence').map(report => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      isPrivileged={isPrivilegedUser}
                      onViewVersions={typeof report.id === 'number' ? () => viewReportVersions(report.id as number, report.company) : undefined}
                    />
                  ))
                  : (
                    <Card className="p-8 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <FileText className="size-12 text-muted-foreground" />
                        <div>
                          <h3 className="text-lg font-semibold">No Due Diligence Reports</h3>
                          <p className="text-muted-foreground mb-4">Start a comprehensive Due Diligence analysis for detailed investment evaluation.</p>
                        </div>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700">
                          <Link href="/dashboard/reports/due-diligence">
                            <FileUp className="mr-2 size-4" /> Start Due Diligence Analysis
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  )}
              </TabsContent>
              <TabsContent value="ssd" className="space-y-4">
                {allReports.filter(r => r.type === 'SSD Report').length > 0
                  ? allReports.filter(r => r.type === 'SSD Report').map(report => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      isPrivileged={isPrivilegedUser}
                      onViewVersions={typeof report.id === 'number' ? () => viewReportVersions(report.id as number, report.company) : undefined}
                    />
                  ))
                  : (
                    <Card className="p-8 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <FileText className="size-12 text-muted-foreground" />
                        <div>
                          <h3 className="text-lg font-semibold">No SSD Reports</h3>
                          <p className="text-muted-foreground mb-4">Start an SSD analysis for specialized startup screening and diagnostics.</p>
                        </div>
                        <Button asChild className="bg-purple-600 hover:bg-purple-700">
                          <Link href="/dashboard/reports/ssd">
                            <FileUp className="mr-2 size-4" /> Start SSD Analysis
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  )}
              </TabsContent>
              <TabsContent value="pending" className="space-y-4">
                {pendingReports.length > 0 ? pendingReports.map(report => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    isPrivileged={isPrivilegedUser}
                    onViewVersions={typeof report.id === 'number' ? () => viewReportVersions(report.id as number, report.company) : undefined}
                  />
                )) : <p className="text-center text-muted-foreground py-10">No reports are pending approval.</p>}
              </TabsContent>
              <TabsContent value="pending-sync" className="space-y-4">
                {pendingSyncReports.length > 0 ? (
                  <>
                    <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 mb-4">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <CloudOff className="size-6 text-yellow-600" />
                          <div>
                            <p className="font-medium text-yellow-700 dark:text-yellow-300">
                              {pendingSyncReports.length} report(s) waiting to sync
                            </p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                              These reports are stored locally and will be uploaded when the backend connection is restored.
                            </p>
                          </div>
                          <div className="ml-auto flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                toast({ title: 'Syncing...', description: 'Uploading pending reports to backend...' });
                                try {
                                  await reportStorage.syncPendingReports();
                                  toast({ title: 'Sync Complete', description: 'Pending reports have been uploaded.' });
                                } catch (error) {
                                  console.error('Sync failed:', error);
                                  toast({ variant: 'destructive', title: 'Sync Failed', description: 'Could not upload reports. Will retry later.' });
                                }
                                await loadReports();
                              }}
                            >
                              <RefreshCw className="size-4 mr-1" /> Retry Sync
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to clear the pending sync queue? Reports will remain in local storage but won\'t be synced to backend.')) {
                                  clearPendingSyncQueue();
                                }
                              }}
                            >
                              <Trash2 className="size-4 mr-1" /> Clear Queue
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {pendingSyncReports.map(report => (
                      <Card key={report.id} className="overflow-hidden border-l-4 border-l-yellow-500">
                        <div className="p-6 grid grid-cols-1 md:grid-cols-6 items-center gap-4">
                          <div className="md:col-span-4 flex flex-wrap items-center gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold truncate">{report.company}</h3>
                                <Badge variant="outline">{report.type.toUpperCase()}</Badge>
                                <Badge className="bg-yellow-500/20 text-yellow-600">Pending Sync</Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">ID</p>
                                <p className="font-mono text-xs">{String(report.id).substring(0, 15)}...</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Score</p>
                                <p className="font-bold text-primary">{report.score}/10</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">User</p>
                                <p className="font-semibold truncate">{report.user.name}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Created</p>
                                <p className="font-bold">{formatDate(report.createdAt)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="md:col-span-2 flex flex-col gap-2">
                            <Button asChild variant="default" className='justify-start'>
                              <Link href="/analysis/result"><Eye className="mr-2" /> View Report</Link>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </>
                ) : (
                  <Card className="p-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <CheckCircle2 className="size-12 text-green-500" />
                      <div>
                        <h3 className="text-lg font-semibold">All Reports Synced</h3>
                        <p className="text-muted-foreground">No pending reports waiting to sync.</p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="my-reports" className="space-y-4">
                {myReports.length > 0 ? myReports.map(report => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    isPrivileged={isPrivilegedUser}
                    onViewVersions={typeof report.id === 'number' ? () => viewReportVersions(report.id as number, report.company) : undefined}
                  />
                )) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">You have not created any reports yet.</p>
                    <Button asChild><Link href="/dashboard/evaluation">Create Your First Report</Link></Button>
                  </Card>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* Version History Dialog */}
      <Dialog open={showVersionsDialog} onOpenChange={setShowVersionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="size-5" />
              Version History: {selectedReportName}
            </DialogTitle>
            <DialogDescription>
              View all saved versions of this report with score changes and modification reasons.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {loadingVersions ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading versions...</span>
              </div>
            ) : selectedReportVersions.length > 0 ? (
              <div className="space-y-4">
                {selectedReportVersions.map((version, index) => (
                  <Card key={version.id} className={index === 0 ? 'border-primary' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? 'default' : 'outline'}>
                            v{version.version_number}
                          </Badge>
                          {index === 0 && <Badge variant="success">Current</Badge>}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(version.created_at, true)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Score</p>
                          <p className="font-bold text-primary">{version.overall_score?.toFixed(2) || 'N/A'}/10</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">TCA Score</p>
                          <p className="font-bold">{version.tca_score?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Confidence</p>
                          <p className="font-bold">{version.confidence || 'N/A'}%</p>
                        </div>
                      </div>
                      {version.change_reason && (
                        <div className="mt-3 p-2 rounded bg-muted/50">
                          <p className="text-xs text-muted-foreground">Change Reason:</p>
                          <p className="text-sm">{version.change_reason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <History className="size-12 mx-auto mb-4 opacity-50" />
                <p>No version history available for this report.</p>
                <p className="text-sm mt-2">Versions are created when reports are updated in the backend.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Report Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="size-5" />
              Upload Report
            </DialogTitle>
            <DialogDescription>
              Import a previously exported JSON report, or fill in the details manually to save a report to the backend.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Import from JSON file (optional)</Label>
              <Input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <p className="text-xs text-muted-foreground">Select a previously exported report JSON to auto-fill the fields below.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-company">Company Name *</Label>
              <Input
                id="upload-company"
                placeholder="Enter company name"
                value={uploadCompanyName}
                onChange={(e) => setUploadCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-type">Report Type</Label>
              <Select value={uploadReportType} onValueChange={setUploadReportType}>
                <SelectTrigger id="upload-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="triage">Triage</SelectItem>
                  <SelectItem value="due-diligence">Due Diligence</SelectItem>
                  <SelectItem value="ssd">SSD Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-score">Overall Score (0–10)</Label>
              <Input
                id="upload-score"
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="e.g. 7.5"
                value={uploadScore}
                onChange={(e) => setUploadScore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-rec">Recommendation</Label>
              <Select value={uploadRecommendation} onValueChange={setUploadRecommendation}>
                <SelectTrigger id="upload-rec">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Proceed">Proceed</SelectItem>
                  <SelectItem value="Conditional">Conditional</SelectItem>
                  <SelectItem value="Pass">Pass</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleUploadReport} disabled={isUploading || !uploadCompanyName.trim()}>
              {isUploading
                ? <><Loader2 className="mr-2 size-4 animate-spin" />Uploading...</>
                : <><FileUp className="mr-2 size-4" />Upload Report</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
