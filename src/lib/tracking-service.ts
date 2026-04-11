/**
 * Tracking Service
 * Provides unique indexing, tracking, and audit logging for evaluations, analyses, and reports
 * 
 * KEY FEATURES:
 * - Unique ID generation with primary/foreign key relationships
 * - Company-User-Document-Analysis-Report tracking
 * - Audit logging for all operations
 * - Fresh state management for independent evaluations
 */

// ============================================================================
// ID GENERATION
// ============================================================================

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function generateEvaluationId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EVAL-${timestamp}-${random}`;
}

export function generateCompanyId(companyName?: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const prefix = companyName
    ? companyName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '')
    : 'CO';
  return `${prefix}-${timestamp}-${random}`;
}

export function generateDocumentId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DOC-${timestamp}-${random}`;
}

export function generateAnalysisId(moduleType: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const modulePrefix = moduleType.substring(0, 3).toUpperCase();
  return `${modulePrefix}-${timestamp}-${random}`;
}

export function generateReportId(reportType: 'SSD' | 'DD' | 'FULL'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RPT-${reportType}-${timestamp}-${random}`;
}

// ============================================================================
// TRACKING RECORDS
// ============================================================================

export interface TrackingRecord {
  id: string;
  type: 'evaluation' | 'company' | 'document' | 'analysis' | 'report';
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
  status: string;
  metadata: Record<string, unknown>;
}

export interface EvaluationTrackingRecord extends TrackingRecord {
  type: 'evaluation';
  evaluationId: string;
  companyId: string;
  userId: string;
  documentIds: string[];
  analysisIds: string[];
  reportIds: string[];
  status: 'draft' | 'in-progress' | 'completed' | 'archived' | 'failed';
  companyName: string;
  framework: 'general' | 'medtech';
}

export interface CompanyTrackingRecord extends TrackingRecord {
  type: 'company';
  companyId: string;
  companyName: string;
  industry: string;
  stage: string;
  evaluationIds: string[];
}

export interface DocumentTrackingRecord extends TrackingRecord {
  type: 'document';
  documentId: string;
  evaluationId: string;
  companyId: string;
  userId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  storageUrl?: string;
  extractionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extractedContent?: string;
}

export interface AnalysisTrackingRecord extends TrackingRecord {
  type: 'analysis';
  analysisId: string;
  evaluationId: string;
  companyId: string;
  userId: string;
  moduleType: string;
  moduleName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  score?: number;
  confidence?: number;
  inputData: Record<string, unknown>;
  results: Record<string, unknown> | null;
  startedAt?: string;
  completedAt?: string;
}

export interface ReportTrackingRecord extends TrackingRecord {
  type: 'report';
  reportId: string;
  evaluationId: string;
  companyId: string;
  userId: string;
  reportType: 'SSD' | 'DD' | 'FULL';
  status: 'generating' | 'completed' | 'failed';
  modules: string[];
  generatedAt?: string;
  downloadUrl?: string;
  viewUrl?: string;
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail?: string;
  action: string;
  entityType: 'evaluation' | 'company' | 'document' | 'analysis' | 'report';
  entityId: string;
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// TRACKING SERVICE CLASS
// ============================================================================

class TrackingService {
  private static instance: TrackingService;
  private apiBaseUrl: string;

  private constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';
  }

  public static getInstance(): TrackingService {
    if (!TrackingService.instance) {
      TrackingService.instance = new TrackingService();
    }
    return TrackingService.instance;
  }

  private getCurrentUser(): { id: string; email: string } {
    if (typeof window === 'undefined') {
      return { id: 'system', email: 'system@tca-irr.com' };
    }
    try {
      const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
      return {
        id: user.id || user.user_id || 'anonymous',
        email: user.email || 'anonymous@tca-irr.com'
      };
    } catch {
      return { id: 'anonymous', email: 'anonymous@tca-irr.com' };
    }
  }

  // ============================================================================
  // FRESH STATE MANAGEMENT
  // ============================================================================

  /**
   * Clear ALL previous evaluation data for a completely fresh start
   * CRITICAL: Call this when user clicks "New Evaluation"
   */
  public clearAllPreviousData(): void {
    if (typeof window === 'undefined') return;

    const keysToRemove = [
      // Core evaluation data
      'currentEvaluation',
      'current_extraction_data',
      'current_extraction_schema',
      'evaluation_state',
      'evaluation_autosave',

      // Processed documents
      'processedFiles',
      'processedUrls',
      'processedTexts',
      'processed_documents_for_extraction',

      // Company data from previous
      'companyData',
      'companyInfo',
      'extractedCompanyData',

      // Analysis results from previous
      'analysisResult',
      'analysisFramework',
      'analysisDuration',
      'analysisCompanyName',
      'moduleScores',
      'adjustedScores',
      'whatIfAnalysis',

      // Report data
      'currentReportData',
      'reportGenerationState',
      'ssdReport',
      'ddReport',

      // Module-specific caches
      'tcaScorecard',
      'riskAssessment',
      'benchmarkAnalysis',
      'macroTrends',
      'growthAnalysis',
      'gapAnalysis',
      'funderFit',
      'teamAssessment',
      'strategicFit',

      // Extraction cache
      'extractionCache',
      'pitchDeckData',

      // Workflow state
      'workflowStep',
      'workflowData',
    ];

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove ${key}:`, e);
      }
    });

    // Clear session storage entirely
    sessionStorage.clear();

    console.log('[TrackingService] Cleared all previous evaluation data');
  }

  /**
   * Initialize a new evaluation with fresh state and unique IDs
   */
  public initializeNewEvaluation(framework: 'general' | 'medtech' = 'general'): EvaluationTrackingRecord {
    // First, clear all previous data
    this.clearAllPreviousData();

    const user = this.getCurrentUser();
    const evaluationId = generateEvaluationId();
    const companyId = generateCompanyId();
    const now = new Date().toISOString();

    const evaluation: EvaluationTrackingRecord = {
      id: generateUUID(),
      type: 'evaluation',
      evaluationId,
      companyId,
      userId: user.id,
      documentIds: [],
      analysisIds: [],
      reportIds: [],
      status: 'draft',
      companyName: '',
      framework,
      createdAt: now,
      createdBy: user.id,
      updatedAt: now,
      updatedBy: user.id,
      version: 1,
      metadata: {
        source: 'web-app',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
      }
    };

    // Store in localStorage
    this.saveCurrentEvaluation(evaluation);

    // Log audit entry
    this.logAudit({
      action: 'EVALUATION_CREATED',
      entityType: 'evaluation',
      entityId: evaluationId,
      metadata: { framework }
    });

    console.log(`[TrackingService] Initialized new evaluation: ${evaluationId}`);
    return evaluation;
  }

  // ============================================================================
  // EVALUATION MANAGEMENT
  // ============================================================================

  public saveCurrentEvaluation(evaluation: EvaluationTrackingRecord): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem('currentEvaluation', JSON.stringify(evaluation));

    // Also save to history
    const history = this.getEvaluationHistory();
    const existingIndex = history.findIndex(e => e.evaluationId === evaluation.evaluationId);
    if (existingIndex >= 0) {
      history[existingIndex] = evaluation;
    } else {
      history.unshift(evaluation); // Add to beginning
    }
    // Keep max 50 evaluations in history
    localStorage.setItem('evaluationHistory', JSON.stringify(history.slice(0, 50)));
  }

  public getCurrentEvaluation(): EvaluationTrackingRecord | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('currentEvaluation');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  public getEvaluationHistory(): EvaluationTrackingRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('evaluationHistory');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public getEvaluationById(evaluationId: string): EvaluationTrackingRecord | null {
    const history = this.getEvaluationHistory();
    return history.find(e => e.evaluationId === evaluationId) || null;
  }

  public updateEvaluation(
    evaluationId: string,
    updates: Partial<EvaluationTrackingRecord>
  ): EvaluationTrackingRecord | null {
    const evaluation = this.getEvaluationById(evaluationId) || this.getCurrentEvaluation();
    if (!evaluation || evaluation.evaluationId !== evaluationId) return null;

    const user = this.getCurrentUser();
    const updated: EvaluationTrackingRecord = {
      ...evaluation,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
      version: evaluation.version + 1
    };

    this.saveCurrentEvaluation(updated);

    // Log audit
    this.logAudit({
      action: 'EVALUATION_UPDATED',
      entityType: 'evaluation',
      entityId: evaluationId,
      changes: Object.keys(updates).map(key => ({
        field: key,
        oldValue: (evaluation as unknown as Record<string, unknown>)[key],
        newValue: (updates as unknown as Record<string, unknown>)[key]
      }))
    });

    return updated;
  }

  // ============================================================================
  // DOCUMENT TRACKING
  // ============================================================================

  public trackDocument(
    evaluationId: string,
    file: { filename: string; fileType: string; fileSize: number; url?: string }
  ): DocumentTrackingRecord {
    const user = this.getCurrentUser();
    const evaluation = this.getCurrentEvaluation();
    const documentId = generateDocumentId();
    const now = new Date().toISOString();

    const document: DocumentTrackingRecord = {
      id: generateUUID(),
      type: 'document',
      documentId,
      evaluationId,
      companyId: evaluation?.companyId || '',
      userId: user.id,
      filename: file.filename,
      fileType: file.fileType,
      fileSize: file.fileSize,
      storageUrl: file.url,
      extractionStatus: 'pending',
      createdAt: now,
      createdBy: user.id,
      updatedAt: now,
      updatedBy: user.id,
      version: 1,
      status: 'pending',
      metadata: {}
    };

    // Add to evaluation's document list
    if (evaluation) {
      this.updateEvaluation(evaluationId, {
        documentIds: [...(evaluation.documentIds || []), documentId]
      });
    }

    // Store document
    this.saveDocument(document);

    // Log audit
    this.logAudit({
      action: 'DOCUMENT_UPLOADED',
      entityType: 'document',
      entityId: documentId,
      metadata: { filename: file.filename, evaluationId }
    });

    return document;
  }

  private saveDocument(document: DocumentTrackingRecord): void {
    if (typeof window === 'undefined') return;
    const documents = this.getDocuments();
    documents.push(document);
    localStorage.setItem('trackedDocuments', JSON.stringify(documents));
  }

  public getDocuments(): DocumentTrackingRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('trackedDocuments');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // ============================================================================
  // ANALYSIS TRACKING
  // ============================================================================

  public trackAnalysis(
    evaluationId: string,
    moduleType: string,
    moduleName: string,
    inputData: Record<string, unknown>
  ): AnalysisTrackingRecord {
    const user = this.getCurrentUser();
    const evaluation = this.getCurrentEvaluation();
    const analysisId = generateAnalysisId(moduleType);
    const now = new Date().toISOString();

    const analysis: AnalysisTrackingRecord = {
      id: generateUUID(),
      type: 'analysis',
      analysisId,
      evaluationId,
      companyId: evaluation?.companyId || '',
      userId: user.id,
      moduleType,
      moduleName,
      status: 'pending',
      inputData,
      results: null,
      createdAt: now,
      createdBy: user.id,
      updatedAt: now,
      updatedBy: user.id,
      version: 1,
      metadata: {}
    };

    // Add to evaluation's analysis list
    if (evaluation) {
      this.updateEvaluation(evaluationId, {
        analysisIds: [...(evaluation.analysisIds || []), analysisId]
      });
    }

    // Store analysis
    this.saveAnalysis(analysis);

    // Log audit
    this.logAudit({
      action: 'ANALYSIS_STARTED',
      entityType: 'analysis',
      entityId: analysisId,
      metadata: { moduleType, moduleName, evaluationId }
    });

    return analysis;
  }

  public updateAnalysis(
    analysisId: string,
    updates: Partial<AnalysisTrackingRecord>
  ): void {
    const analyses = this.getAnalyses();
    const index = analyses.findIndex(a => a.analysisId === analysisId);
    if (index >= 0) {
      analyses[index] = {
        ...analyses[index],
        ...updates,
        updatedAt: new Date().toISOString(),
        version: analyses[index].version + 1
      };
      localStorage.setItem('trackedAnalyses', JSON.stringify(analyses));

      // Log audit
      this.logAudit({
        action: 'ANALYSIS_UPDATED',
        entityType: 'analysis',
        entityId: analysisId,
        metadata: { status: updates.status }
      });
    }
  }

  private saveAnalysis(analysis: AnalysisTrackingRecord): void {
    if (typeof window === 'undefined') return;
    const analyses = this.getAnalyses();
    analyses.push(analysis);
    localStorage.setItem('trackedAnalyses', JSON.stringify(analyses));
  }

  public getAnalyses(): AnalysisTrackingRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('trackedAnalyses');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public getAnalysesByEvaluation(evaluationId: string): AnalysisTrackingRecord[] {
    return this.getAnalyses().filter(a => a.evaluationId === evaluationId);
  }

  // ============================================================================
  // REPORT TRACKING
  // ============================================================================

  public trackReport(
    evaluationId: string,
    reportType: 'SSD' | 'DD' | 'FULL',
    modules: string[]
  ): ReportTrackingRecord {
    const user = this.getCurrentUser();
    const evaluation = this.getCurrentEvaluation();
    const reportId = generateReportId(reportType);
    const now = new Date().toISOString();

    const report: ReportTrackingRecord = {
      id: generateUUID(),
      type: 'report',
      reportId,
      evaluationId,
      companyId: evaluation?.companyId || '',
      userId: user.id,
      reportType,
      status: 'generating',
      modules,
      generatedAt: now,
      createdAt: now,
      createdBy: user.id,
      updatedAt: now,
      updatedBy: user.id,
      version: 1,
      metadata: {}
    };

    // Add to evaluation's report list
    if (evaluation) {
      this.updateEvaluation(evaluationId, {
        reportIds: [...(evaluation.reportIds || []), reportId]
      });
    }

    // Store report
    this.saveReport(report);

    // Log audit
    this.logAudit({
      action: 'REPORT_GENERATION_STARTED',
      entityType: 'report',
      entityId: reportId,
      metadata: { reportType, modules, evaluationId }
    });

    return report;
  }

  public updateReport(
    reportId: string,
    updates: Partial<ReportTrackingRecord>
  ): void {
    const reports = this.getReports();
    const index = reports.findIndex(r => r.reportId === reportId);
    if (index >= 0) {
      reports[index] = {
        ...reports[index],
        ...updates,
        updatedAt: new Date().toISOString(),
        version: reports[index].version + 1
      };
      localStorage.setItem('trackedReports', JSON.stringify(reports));

      // Log audit
      this.logAudit({
        action: updates.status === 'completed' ? 'REPORT_GENERATED' : 'REPORT_UPDATED',
        entityType: 'report',
        entityId: reportId,
        metadata: { status: updates.status }
      });
    }
  }

  private saveReport(report: ReportTrackingRecord): void {
    if (typeof window === 'undefined') return;
    const reports = this.getReports();
    reports.push(report);
    localStorage.setItem('trackedReports', JSON.stringify(reports));
  }

  public getReports(): ReportTrackingRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('trackedReports');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public getReportsByEvaluation(evaluationId: string): ReportTrackingRecord[] {
    return this.getReports().filter(r => r.evaluationId === evaluationId);
  }

  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================

  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'userId' | 'userEmail'>): void {
    if (typeof window === 'undefined') return;

    const user = this.getCurrentUser();
    const auditEntry: AuditLogEntry = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      ...entry
    };

    // Store locally
    const logs = this.getAuditLogs();
    logs.unshift(auditEntry);
    // Keep max 1000 entries
    localStorage.setItem('auditLogs', JSON.stringify(logs.slice(0, 1000)));

    // Also log to console for debugging
    console.log(`[Audit] ${entry.action} - ${entry.entityType}:${entry.entityId}`);
  }

  public getAuditLogs(): AuditLogEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('auditLogs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public getAuditLogsForEntity(entityType: string, entityId: string): AuditLogEntry[] {
    return this.getAuditLogs().filter(
      log => log.entityType === entityType && log.entityId === entityId
    );
  }

  // ============================================================================
  // SYNC TO BACKEND
  // ============================================================================

  public async syncToBackend(): Promise<{ success: boolean; error?: string }> {
    try {
      const evaluation = this.getCurrentEvaluation();
      if (!evaluation) {
        return { success: false, error: 'No current evaluation to sync' };
      }

      const response = await fetch(`${this.apiBaseUrl}/evaluations/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluation,
          documents: this.getDocuments().filter(d => d.evaluationId === evaluation.evaluationId),
          analyses: this.getAnalysesByEvaluation(evaluation.evaluationId),
          reports: this.getReportsByEvaluation(evaluation.evaluationId),
          auditLogs: this.getAuditLogsForEntity('evaluation', evaluation.evaluationId)
        })
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('[TrackingService] Sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      };
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const trackingService = TrackingService.getInstance();
export default trackingService;
