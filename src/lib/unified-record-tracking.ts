/**
 * Unified Record Tracking System
 * 
 * Provides consistent ID generation and tracking across:
 * - New Evaluation
 * - What-If Analysis
 * - Result Page
 * - Reviewer Approval
 * - Report Generation
 * 
 * All records share the same ID structure for end-to-end tracking
 */

// ============================================================================
// UNIFIED ID GENERATION
// ============================================================================

export interface UnifiedRecordId {
  evaluationId: string;      // EVAL-{timestamp}-{random}
  companyId: string;         // CO-{name prefix}-{hash}
  userId: string;            // User who created
  sessionId: string;         // Session tracking
  reportId?: string;         // RPT-{type}-{timestamp}-{random}
  analysisId?: string;       // ANL-{timestamp}-{random}
  simulationId?: string;     // SIM-{timestamp}-{random}
  version: number;           // Report version number
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
}

export interface UnifiedRecord {
  // Core identifiers
  id: UnifiedRecordId;

  // Company information
  company: {
    name: string;
    legalName?: string;
    industry?: string;
    stage?: string;
    website?: string;
    country?: string;
    state?: string;
    city?: string;
  };

  // User information
  user: {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin' | 'analyst' | 'reviewer';
  };

  // Workflow status
  workflow: {
    stage: 'evaluation' | 'analysis' | 'simulation' | 'review' | 'report' | 'completed';
    status: 'draft' | 'in-progress' | 'pending-review' | 'approved' | 'rejected' | 'completed';
    reviewerApproval?: ReviewerApproval;
    history: WorkflowHistoryEntry[];
  };

  // Analysis data
  analysis?: {
    modules: AnalysisModuleResult[];
    overallScore: number;
    confidence: number;
    recommendation: string;
    framework: 'general' | 'medtech';
    completedAt?: string;
  };

  // Simulation data
  simulation?: {
    simulationId: string;
    parameters: Record<string, unknown>;
    results: Record<string, unknown>;
    createdAt: string;
  };

  // Report data
  report?: {
    reportId: string;
    reportType: 'triage' | 'dd' | 'ssd';
    version: number;
    generatedAt: string;
    status: 'generating' | 'completed' | 'failed';
    pdfUrl?: string;
  };
}

export interface ReviewerApproval {
  status: 'pending' | 'approved' | 'rejected' | 'needs-revision';
  reviewerId?: string;
  reviewerEmail?: string;
  reviewedAt?: string;
  checklist: ReviewChecklistItem[];
  comments?: string;
  signature?: string;
}

export interface ReviewChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: string;
}

export interface WorkflowHistoryEntry {
  action: string;
  stage: string;
  status: string;
  userId: string;
  userEmail: string;
  timestamp: string;
  details?: string;
}

export interface AnalysisModuleResult {
  moduleId: string;
  moduleName: string;
  score: number;
  weight: number;
  weightedScore: number;
  confidence: number;
  status: 'completed' | 'partial' | 'missing';
  extractedData?: Record<string, unknown>;
  findings?: string[];
}

// Default reviewer checklist
export const DEFAULT_REVIEWER_CHECKLIST: ReviewChecklistItem[] = [
  { id: 'data-accuracy', label: 'Data accuracy verified against source documents', checked: false },
  { id: 'scoring-consistency', label: 'TCA scoring consistency checked across modules', checked: false },
  { id: 'risk-flags-reviewed', label: 'All risk flags reviewed and validated', checked: false },
  { id: 'recommendations-valid', label: 'Recommendations are valid and supported by data', checked: false },
  { id: 'company-info-verified', label: 'Company information matches extracted data', checked: false },
  { id: 'financial-data-verified', label: 'Financial data verified (if applicable)', checked: false },
  { id: 'formatting-correct', label: 'Report formatting is correct', checked: false },
  { id: 'confidentiality-check', label: 'Confidentiality and compliance check', checked: false },
];

// 8-Module Analysis Mapping
export const ANALYSIS_MODULES = [
  { id: 'tca-scorecard', name: 'TCA Scorecard', weight: 0.15 },
  { id: 'risk-assessment', name: 'Risk Assessment', weight: 0.13 },
  { id: 'macro-trends', name: 'Macro Trends', weight: 0.12 },
  { id: 'team-analysis', name: 'Team Analysis', weight: 0.13 },
  { id: 'benchmark', name: 'Benchmark', weight: 0.12 },
  { id: 'growth-classifier', name: 'Growth Classifier', weight: 0.12 },
  { id: 'gap-analysis', name: 'Gap Analysis', weight: 0.11 },
  { id: 'simulation', name: 'Simulation', weight: 0.12 },
];

// ============================================================================
// ID GENERATION FUNCTIONS
// ============================================================================

export function generateEvaluationId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EVAL-${timestamp}-${random}`;
}

export function generateCompanyId(companyName?: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const prefix = companyName
    ? companyName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CO'
    : 'CO';
  return `${prefix}-${timestamp}-${random}`;
}

export function generateReportId(reportType: 'triage' | 'dd' | 'ssd'): string {
  const prefix = reportType === 'dd' ? 'DD' : reportType === 'ssd' ? 'SSD' : 'TR';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RPT-${prefix}-${timestamp}-${random}`;
}

export function generateAnalysisId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ANL-${timestamp}-${random}`;
}

export function generateSimulationId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SIM-${timestamp}-${random}`;
}

export function generateSessionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SES-${timestamp}-${random}`;
}

// ============================================================================
// UNIFIED RECORD TRACKING CLASS
// ============================================================================

const STORAGE_KEY = 'unified_records';
const CURRENT_RECORD_KEY = 'current_unified_record';
const PENDING_SYNC_KEY = 'pending_record_sync';

class UnifiedRecordTracking {
  private static instance: UnifiedRecordTracking;

  private constructor() { }

  public static getInstance(): UnifiedRecordTracking {
    if (!UnifiedRecordTracking.instance) {
      UnifiedRecordTracking.instance = new UnifiedRecordTracking();
    }
    return UnifiedRecordTracking.instance;
  }

  // Get current user from localStorage
  private getCurrentUser(): { id: string; email: string; name: string; role: string } {
    if (typeof window === 'undefined') {
      return { id: 'system', email: 'system@tca-irr.com', name: 'System', role: 'system' };
    }
    try {
      const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
      return {
        id: user.id || user.user_id || 'anonymous',
        email: user.email || 'anonymous@tca-irr.com',
        name: user.name || user.email?.split('@')[0] || 'Anonymous',
        role: user.role?.toLowerCase() || 'user',
      };
    } catch {
      return { id: 'anonymous', email: 'anonymous@tca-irr.com', name: 'Anonymous', role: 'user' };
    }
  }

  // Create a new unified record
  public createRecord(companyName?: string, framework: 'general' | 'medtech' = 'general'): UnifiedRecord {
    const user = this.getCurrentUser();
    const now = new Date().toISOString();
    const evaluationId = generateEvaluationId();
    const companyId = generateCompanyId(companyName);
    const sessionId = generateSessionId();

    const record: UnifiedRecord = {
      id: {
        evaluationId,
        companyId,
        userId: user.id,
        sessionId,
        version: 1,
        createdAt: now,
        updatedAt: now,
      },
      company: {
        name: companyName || '',
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'user' | 'admin' | 'analyst' | 'reviewer',
      },
      workflow: {
        stage: 'evaluation',
        status: 'draft',
        history: [{
          action: 'created',
          stage: 'evaluation',
          status: 'draft',
          userId: user.id,
          userEmail: user.email,
          timestamp: now,
          details: `New evaluation created for ${companyName || 'unknown company'}`,
        }],
      },
    };

    // Save to localStorage
    this.saveCurrentRecord(record);
    this.addToLocalStorage(record);

    return record;
  }

  // Get current active record
  public getCurrentRecord(): UnifiedRecord | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(CURRENT_RECORD_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as UnifiedRecord;
    } catch {
      return null;
    }
  }

  // Save current record
  public saveCurrentRecord(record: UnifiedRecord): void {
    if (typeof window === 'undefined') return;
    record.id.updatedAt = new Date().toISOString();
    localStorage.setItem(CURRENT_RECORD_KEY, JSON.stringify(record));
    this.addToLocalStorage(record);
    this.addToPendingSync(record);
  }

  // Update company information
  public updateCompanyInfo(companyData: Partial<UnifiedRecord['company']>): UnifiedRecord | null {
    const record = this.getCurrentRecord();
    if (!record) return null;

    record.company = { ...record.company, ...companyData };

    // Update company ID if name changed
    if (companyData.name && !record.id.companyId.includes(companyData.name.substring(0, 3).toUpperCase())) {
      record.id.companyId = generateCompanyId(companyData.name);
    }

    this.addWorkflowHistory(record, 'company-updated', 'Company information updated');
    this.saveCurrentRecord(record);
    return record;
  }

  // Update workflow stage
  public updateWorkflowStage(
    stage: UnifiedRecord['workflow']['stage'],
    status: UnifiedRecord['workflow']['status'],
    details?: string
  ): UnifiedRecord | null {
    const record = this.getCurrentRecord();
    if (!record) return null;

    record.workflow.stage = stage;
    record.workflow.status = status;
    this.addWorkflowHistory(record, `stage-${stage}`, details || `Workflow moved to ${stage}`);
    this.saveCurrentRecord(record);
    return record;
  }

  // Add analysis results
  public addAnalysisResults(
    modules: AnalysisModuleResult[],
    overallScore: number,
    confidence: number,
    recommendation: string,
    framework: 'general' | 'medtech'
  ): UnifiedRecord | null {
    const record = this.getCurrentRecord();
    if (!record) return null;

    record.id.analysisId = generateAnalysisId();
    record.analysis = {
      modules,
      overallScore,
      confidence,
      recommendation,
      framework,
      completedAt: new Date().toISOString(),
    };

    this.addWorkflowHistory(record, 'analysis-completed', `Analysis completed with score ${overallScore}`);
    this.updateWorkflowStage('analysis', 'completed');
    return record;
  }

  // Add simulation results
  public addSimulationResults(parameters: Record<string, unknown>, results: Record<string, unknown>): UnifiedRecord | null {
    const record = this.getCurrentRecord();
    if (!record) return null;

    record.id.simulationId = generateSimulationId();
    record.simulation = {
      simulationId: record.id.simulationId,
      parameters,
      results,
      createdAt: new Date().toISOString(),
    };

    this.addWorkflowHistory(record, 'simulation-completed', 'What-if simulation completed');
    this.updateWorkflowStage('simulation', 'completed');
    return record;
  }

  // Initialize reviewer approval
  public initializeReviewerApproval(): UnifiedRecord | null {
    const record = this.getCurrentRecord();
    if (!record) return null;

    record.workflow.reviewerApproval = {
      status: 'pending',
      checklist: DEFAULT_REVIEWER_CHECKLIST.map(item => ({ ...item })),
    };

    this.addWorkflowHistory(record, 'review-initiated', 'Reviewer approval process initiated');
    this.updateWorkflowStage('review', 'pending-review');
    return record;
  }

  // Update reviewer approval
  public updateReviewerApproval(
    checklistUpdates?: Partial<ReviewChecklistItem>[],
    comments?: string,
    approve?: boolean
  ): UnifiedRecord | null {
    const record = this.getCurrentRecord();
    if (!record || !record.workflow.reviewerApproval) return null;

    const user = this.getCurrentUser();

    // Update checklist
    if (checklistUpdates) {
      for (const update of checklistUpdates) {
        const item = record.workflow.reviewerApproval.checklist.find(i => i.id === update.id);
        if (item && update.checked !== undefined) {
          item.checked = update.checked;
          item.checkedBy = user.email;
          item.checkedAt = new Date().toISOString();
        }
      }
    }

    // Update comments
    if (comments !== undefined) {
      record.workflow.reviewerApproval.comments = comments;
    }

    // Handle approval/rejection
    if (approve !== undefined) {
      const allChecked = record.workflow.reviewerApproval.checklist.every(item => item.checked);
      if (approve && allChecked) {
        record.workflow.reviewerApproval.status = 'approved';
        record.workflow.reviewerApproval.reviewerId = user.id;
        record.workflow.reviewerApproval.reviewerEmail = user.email;
        record.workflow.reviewerApproval.reviewedAt = new Date().toISOString();
        this.addWorkflowHistory(record, 'review-approved', 'Report approved by reviewer');
        this.updateWorkflowStage('review', 'approved');
      } else if (!approve) {
        record.workflow.reviewerApproval.status = 'rejected';
        record.workflow.reviewerApproval.reviewerId = user.id;
        record.workflow.reviewerApproval.reviewerEmail = user.email;
        record.workflow.reviewerApproval.reviewedAt = new Date().toISOString();
        this.addWorkflowHistory(record, 'review-rejected', comments || 'Report rejected by reviewer');
        this.updateWorkflowStage('review', 'rejected');
      }
    }

    this.saveCurrentRecord(record);
    return record;
  }

  // Generate report
  public generateReport(reportType: 'triage' | 'dd'): UnifiedRecord | null {
    const record = this.getCurrentRecord();
    if (!record) return null;

    const reportId = generateReportId(reportType);
    const version = (record.report?.version || 0) + 1;

    record.id.reportId = reportId;
    record.id.version = version;
    record.report = {
      reportId,
      reportType,
      version,
      generatedAt: new Date().toISOString(),
      status: 'completed',
    };

    this.addWorkflowHistory(record, 'report-generated', `Report ${reportId} v${version} generated`);
    this.updateWorkflowStage('report', 'completed');
    return record;
  }

  // Add history entry
  private addWorkflowHistory(record: UnifiedRecord, action: string, details?: string): void {
    const user = this.getCurrentUser();
    record.workflow.history.push({
      action,
      stage: record.workflow.stage,
      status: record.workflow.status,
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      details,
    });
  }

  // Get all records from localStorage
  public getAllRecords(): UnifiedRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as UnifiedRecord[];
    } catch {
      return [];
    }
  }

  // Add to local storage
  private addToLocalStorage(record: UnifiedRecord): void {
    if (typeof window === 'undefined') return;
    try {
      const records = this.getAllRecords();
      const index = records.findIndex(r => r.id.evaluationId === record.id.evaluationId);
      if (index >= 0) {
        records[index] = record;
      } else {
        records.unshift(record);
      }
      // Keep only last 100 records
      const trimmed = records.slice(0, 100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  // Add to pending sync queue
  private addToPendingSync(record: UnifiedRecord): void {
    if (typeof window === 'undefined') return;
    try {
      const pending = this.getPendingSyncRecords();
      const index = pending.findIndex(r => r.id.evaluationId === record.id.evaluationId);
      if (index >= 0) {
        pending[index] = record;
      } else {
        pending.push(record);
      }
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
    } catch (error) {
      console.error('Failed to add to pending sync:', error);
    }
  }

  // Get pending sync records
  public getPendingSyncRecords(): UnifiedRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(PENDING_SYNC_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as UnifiedRecord[];
    } catch {
      return [];
    }
  }

  // Sync records to backend
  public async syncToBackend(): Promise<{ success: boolean; synced: number; failed: number }> {
    const pending = this.getPendingSyncRecords();
    if (pending.length === 0) {
      return { success: true, synced: 0, failed: 0 };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';
    let synced = 0;
    let failed = 0;

    for (const record of pending) {
      try {
        const response = await fetch(`${apiUrl}/api/v1/records/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record),
        });

        if (response.ok) {
          synced++;
          // Remove from pending
          this.removeFromPendingSync(record.id.evaluationId);
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return { success: failed === 0, synced, failed };
  }

  // Remove from pending sync
  private removeFromPendingSync(evaluationId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const pending = this.getPendingSyncRecords();
      const filtered = pending.filter(r => r.id.evaluationId !== evaluationId);
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove from pending sync:', error);
    }
  }

  // Clear current record (for new evaluation)
  public clearCurrentRecord(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CURRENT_RECORD_KEY);
  }

  // Export record for display
  public getRecordDisplayData(record: UnifiedRecord): {
    evaluationId: string;
    companyName: string;
    companyId: string;
    reportId: string;
    reportNumber: string;
    userName: string;
    userEmail: string;
    createdAt: string;
    updatedAt: string;
    version: number;
    status: string;
    stage: string;
  } {
    return {
      evaluationId: record.id.evaluationId,
      companyName: record.company.name || 'Unknown',
      companyId: record.id.companyId,
      reportId: record.id.reportId || 'Not Generated',
      reportNumber: record.id.reportId
        ? `${record.company.name?.substring(0, 3).toUpperCase() || 'RPT'}-${record.id.version.toString().padStart(3, '0')}`
        : 'N/A',
      userName: record.user.name,
      userEmail: record.user.email,
      createdAt: record.id.createdAt,
      updatedAt: record.id.updatedAt,
      version: record.id.version,
      status: record.workflow.status,
      stage: record.workflow.stage,
    };
  }
}

// Export singleton instance
export const unifiedRecordTracking = UnifiedRecordTracking.getInstance();

// Export convenience functions
export function createNewRecord(companyName?: string, framework?: 'general' | 'medtech'): UnifiedRecord {
  return unifiedRecordTracking.createRecord(companyName, framework);
}

export function getCurrentRecord(): UnifiedRecord | null {
  return unifiedRecordTracking.getCurrentRecord();
}

export function updateCompanyInfo(companyData: Partial<UnifiedRecord['company']>): UnifiedRecord | null {
  return unifiedRecordTracking.updateCompanyInfo(companyData);
}

export function getPendingSyncCount(): number {
  return unifiedRecordTracking.getPendingSyncRecords().length;
}

export function getAllUnifiedRecords(): UnifiedRecord[] {
  return unifiedRecordTracking.getAllRecords();
}
