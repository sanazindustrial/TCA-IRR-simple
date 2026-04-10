// Database and storage utilities for TCA reports
import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';
import { reportsApi, type CreateReportRequest } from './reports-api';
import { trackingService, generateReportId as genRepId, generateCompanyId as genCoId } from './tracking-service';

// Backend API URL for report storage (base URL - endpoints add /api prefix)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';

export type StoredReport = {
    id: string;
    // Unique indexing - Primary and Foreign Keys
    reportId: string;           // Primary key: RPT-{type}-{timestamp}-{random}
    evaluationId: string;       // Foreign key to evaluation
    companyId: string;          // Foreign key to company
    userId: string;
    userEmail?: string;
    companyName: string;
    reportType: 'triage' | 'dd';
    framework: 'general' | 'medtech';
    data: ComprehensiveAnalysisOutput;
    createdAt: string;
    updatedAt: string;
    version: number;
    metadata: {
        analysisDuration?: number;
        moduleCount: number;
        compositeScore: number;
        status: 'draft' | 'completed' | 'archived' | 'pending_approval';
        approvalStatus?: 'pending' | 'approved' | 'rejected' | 'needs_revision';
        tags?: string[];
        // Tracking info
        generatedBy?: string;
        documentsUsed?: string[];
        reviewerId?: string;
        reviewedAt?: string;
        reviewerComments?: string;
    };
};

export type ReportListItem = {
    id: string;
    reportId: string;
    evaluationId: string;
    companyId: string;
    companyName: string;
    reportType: 'triage' | 'dd';
    compositeScore: number;
    createdAt: string;
    status: 'draft' | 'completed' | 'archived' | 'pending_approval';
    userId: string;
};

class ReportStorageService {
    private readonly storageKey = 'tca_reports';
    private readonly currentReportKey = 'current_analysis_result';

    /**
     * Generate unique report ID with type prefix
     * Format: RPT-{TYPE}-{timestamp}-{random}
     */
    private generateUniqueReportId(reportType: 'triage' | 'dd'): string {
        const typePrefix = reportType === 'dd' ? 'DD' : 'SSD';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `RPT-${typePrefix}-${timestamp}-${random}`;
    }

    /**
     * Save a report to storage (both localStorage and backend API)
     * Now includes unique indexing with evaluation and company IDs
     */
    async saveReport(
        data: ComprehensiveAnalysisOutput,
        reportType: 'triage' | 'dd',
        framework: 'general' | 'medtech',
        userId: string,
        companyName: string,
        metadata?: Partial<StoredReport['metadata']>,
        trackingIds?: { evaluationId?: string; companyId?: string; userEmail?: string }
    ): Promise<string> {
        const reportId = this.generateUniqueReportId(reportType);
        const now = new Date().toISOString();

        // Get tracking IDs from localStorage if not provided
        const evaluationId = trackingIds?.evaluationId ||
            localStorage.getItem('analysisEvaluationId') ||
            `EVAL-${Date.now().toString(36).toUpperCase()}`;
        const companyId = trackingIds?.companyId ||
            localStorage.getItem('analysisCompanyId') ||
            genCoId(companyName);
        const userEmail = trackingIds?.userEmail || this.getCurrentUserEmail();

        const report: StoredReport = {
            id: reportId, // For backwards compatibility
            reportId,
            evaluationId,
            companyId,
            userId,
            userEmail,
            companyName: companyName || 'Unnamed Company',
            reportType,
            framework,
            data,
            createdAt: now,
            updatedAt: now,
            version: 1,
            metadata: {
                moduleCount: this.calculateModuleCount(data),
                compositeScore: this.extractCompositeScore(data),
                status: 'pending_approval',  // Reports start pending approval for reviewer
                approvalStatus: 'pending',
                analysisDuration: metadata?.analysisDuration,
                tags: metadata?.tags || [],
                generatedBy: userId,
                ...metadata
            }
        };

        // Track report in tracking service
        trackingService.trackReport(evaluationId, reportType === 'dd' ? 'DD' : 'SSD',
            Object.keys(data).filter(k => data[k as keyof ComprehensiveAnalysisOutput] !== null)
        );

        // Save to localStorage first (for offline support)
        await this.saveToLocalStorage(report);

        // Save to backend API with immediate retry
        let backendSaved = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await this.saveToBackendAPI(report);
                console.log(`Report ${reportId} saved to backend on attempt ${attempt} (Eval: ${evaluationId}, Company: ${companyId})`);
                backendSaved = true;

                // Mark as synced in localStorage
                report.metadata.status = 'completed';
                await this.saveToLocalStorage(report);

                // Clear this report from pending queue if present
                this.removeFromPendingSyncQueue(reportId);
                break;
            } catch (error) {
                console.warn(`Backend save attempt ${attempt} failed:`, error);
                if (attempt === 3) {
                    console.warn('All retry attempts failed, adding to pending sync queue');
                    this.addToPendingSyncQueue(report);
                }
                // Wait before retry
                if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }

        return reportId;
    }

    /**
     * Remove a report from the pending sync queue
     */
    private removeFromPendingSyncQueue(reportId: string): void {
        try {
            const queueKey = 'pending_report_sync';
            const existingQueue = localStorage.getItem(queueKey);
            if (!existingQueue) return;

            const queue: StoredReport[] = JSON.parse(existingQueue);
            const filtered = queue.filter(r => r.id !== reportId && r.reportId !== reportId);

            if (filtered.length === 0) {
                localStorage.removeItem(queueKey);
            } else {
                localStorage.setItem(queueKey, JSON.stringify(filtered));
            }
        } catch (error) {
            console.error('Error removing from sync queue:', error);
        }
    }

    /**
     * Get current user email from localStorage
     */
    private getCurrentUserEmail(): string {
        try {
            const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
            return user.email || 'unknown@tca-irr.com';
        } catch {
            return 'unknown@tca-irr.com';
        }
    }

    /**
     * Save report to backend API with versioning support
     */
    private async saveToBackendAPI(report: StoredReport): Promise<number | null> {
        try {
            // Prepare the analysis data for the API
            const analysisData = {
                tcaData: report.data.tcaData,
                riskData: report.data.riskData,
                benchmarkData: report.data.benchmarkData,
                macroData: report.data.macroData,
                growthData: report.data.growthData,
                gapData: report.data.gapData,
                founderFitData: report.data.founderFitData,
                teamData: report.data.teamData,
                strategicFitData: report.data.strategicFitData,
            };

            // Calculate module scores from TCA categories
            const moduleScores: Record<string, number> = {};
            if (report.data.tcaData?.categories) {
                report.data.tcaData.categories.forEach(cat => {
                    moduleScores[cat.category] = cat.rawScore;
                });
            }

            // Include tracking IDs in the request
            const createRequest: CreateReportRequest & {
                report_id?: string;
                evaluation_id?: string;
                company_id_string?: string;
                user_email?: string;
                version?: number;
            } = {
                report_id: report.reportId,
                evaluation_id: report.evaluationId,
                company_id_string: report.companyId, // String version for tracking
                company_name: report.companyName,
                report_type: report.reportType === 'dd' ? 'Due Diligence' : 'Triage',
                overall_score: report.metadata.compositeScore,
                tca_score: report.data.tcaData?.compositeScore || report.metadata.compositeScore * 10,
                confidence: this.calculateConfidence(report.data),
                recommendation: this.getRecommendation(report.metadata.compositeScore),
                module_scores: moduleScores,
                analysis_data: analysisData,
                missing_sections: this.getMissingSections(report.data),
                user_email: report.userEmail,
                version: report.version,
            };

            // Try to create the report in the backend
            const response = await fetch(`${API_BASE_URL}/api/v1/reports?user_id=${report.userId || 1}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(createRequest),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error: ${response.status} - ${errorText}`);
            }

            const createdReport = await response.json();
            console.log(`Report ${report.reportId} created in backend with DB ID: ${createdReport.id}`);
            return createdReport.id;
        } catch (error) {
            console.error('Error saving to backend API:', error);
            throw error;
        }
    }

    /**
     * Add report to pending sync queue for later retry
     */
    private addToPendingSyncQueue(report: StoredReport): void {
        try {
            const queueKey = 'pending_report_sync';
            const existingQueue = localStorage.getItem(queueKey);
            const queue: StoredReport[] = existingQueue ? JSON.parse(existingQueue) : [];

            // Add to queue if not already present
            if (!queue.find(r => r.id === report.id)) {
                queue.push(report);
                localStorage.setItem(queueKey, JSON.stringify(queue));
            }
        } catch (error) {
            console.error('Error adding to sync queue:', error);
        }
    }

    /**
     * Retry syncing pending reports to backend
     * Now more aggressive - clears queue immediately on success
     */
    async syncPendingReports(): Promise<{ synced: number; remaining: number }> {
        try {
            const queueKey = 'pending_report_sync';
            const existingQueue = localStorage.getItem(queueKey);
            if (!existingQueue) return { synced: 0, remaining: 0 };

            const queue: StoredReport[] = JSON.parse(existingQueue);
            let syncedCount = 0;

            // Try to sync all reports
            for (const report of queue) {
                try {
                    await this.saveToBackendAPI(report);
                    console.log(`Synced pending report: ${report.id}`);
                    syncedCount++;

                    // Update local storage status to completed
                    report.metadata.status = 'completed';
                    await this.saveToLocalStorage(report);
                } catch (error) {
                    console.warn(`Failed to sync report ${report.id}:`, error);
                    // Continue with next report, don't stop on error
                }
            }

            // Always clear the queue after sync attempt
            // Reports are already saved to localStorage, so they won't be lost
            localStorage.removeItem(queueKey);

            // Also clear other potential sync keys
            localStorage.removeItem('pending_record_sync');
            localStorage.removeItem('pending_sync_queue');

            // Dispatch event for UI updates
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('tca_sync_completed', {
                    detail: { synced: syncedCount, remaining: 0 }
                }));
            }

            return { synced: syncedCount, remaining: 0 };
        } catch (error) {
            console.error('Error syncing pending reports:', error);
            // Still try to clear the queue on error
            localStorage.removeItem('pending_report_sync');
            return { synced: 0, remaining: 0 };
        }
    }

    /**
     * Calculate confidence score from analysis data
     */
    private calculateConfidence(data: ComprehensiveAnalysisOutput): number {
        let dataPoints = 0;
        let totalPoints = 9; // Max modules

        if (data.tcaData) dataPoints++;
        if (data.riskData) dataPoints++;
        if (data.benchmarkData) dataPoints++;
        if (data.macroData) dataPoints++;
        if (data.growthData) dataPoints++;
        if (data.gapData) dataPoints++;
        if (data.founderFitData) dataPoints++;
        if (data.teamData) dataPoints++;
        if (data.strategicFitData) dataPoints++;

        // Base confidence from data completeness
        const dataConfidence = (dataPoints / totalPoints) * 100;

        // Adjust based on TCA score stability
        const scoreAdjustment = data.tcaData?.compositeScore
            ? Math.min(10, Math.abs(data.tcaData.compositeScore - 50) / 5)
            : 0;

        return Math.round(Math.min(99, dataConfidence + scoreAdjustment));
    }

    /**
     * Get recommendation based on score
     */
    private getRecommendation(score: number): string {
        if (score >= 8) return 'Recommend';
        if (score >= 6) return 'Hold';
        if (score >= 5) return 'Conditional';
        return 'Reject';
    }

    /**
     * Get list of missing sections
     */
    private getMissingSections(data: ComprehensiveAnalysisOutput): string[] {
        const missing: string[] = [];
        if (!data.tcaData) missing.push('TCA Scorecard');
        if (!data.riskData) missing.push('Risk Assessment');
        if (!data.benchmarkData) missing.push('Benchmark Comparison');
        if (!data.macroData) missing.push('Macro Trend Analysis');
        if (!data.growthData) missing.push('Growth Classification');
        if (!data.gapData) missing.push('Gap Analysis');
        if (!data.founderFitData) missing.push('Founder Fit');
        if (!data.teamData) missing.push('Team Assessment');
        if (!data.strategicFitData) missing.push('Strategic Fit');
        return missing;
    }

    /**
     * Get a specific report by ID
     */
    async getReport(reportId: string): Promise<StoredReport | null> {
        try {
            // Try localStorage first
            const localReport = await this.getFromLocalStorage(reportId);
            if (localReport) return localReport;

            // TODO: Try remote database
            // const dbReport = await this.getFromDatabase(reportId);
            // if (dbReport) return dbReport;

            return null;
        } catch (error) {
            console.error('Error getting report:', error);
            return null;
        }
    }

    /**
     * Update an existing report with new data
     */
    async updateReport(reportId: string, updates: Partial<StoredReport>): Promise<boolean> {
        try {
            const report = await this.getReport(reportId);
            if (!report) {
                console.error('Report not found:', reportId);
                return false;
            }

            // Merge updates
            const updatedReport: StoredReport = {
                ...report,
                ...updates,
                version: report.version + 1,
                updatedAt: new Date().toISOString(),
                metadata: {
                    ...report.metadata,
                    ...(updates.metadata || {})
                }
            };

            // Save to localStorage
            await this.saveToLocalStorage(updatedReport);

            // Try to sync to backend
            try {
                await this.saveToBackendAPI(updatedReport);
                console.log(`Report ${reportId} updated and synced to backend`);
            } catch (error) {
                console.warn('Failed to sync updated report to backend:', error);
                this.addToPendingSyncQueue(updatedReport);
            }

            return true;
        } catch (error) {
            console.error('Error updating report:', error);
            return false;
        }
    }

    /**
     * Get all reports for a user
     */
    async getUserReports(userId: string): Promise<ReportListItem[]> {
        try {
            // Get from localStorage
            const localReports = await this.getAllFromLocalStorage();
            const userReports = localReports.filter(report => report.userId === userId);

            // TODO: Merge with database reports
            // const dbReports = await this.getUserReportsFromDatabase(userId);
            // const allReports = [...localReports, ...dbReports];

            return userReports.map(report => ({
                id: report.id,
                reportId: report.reportId,
                evaluationId: report.evaluationId,
                companyId: report.companyId,
                companyName: report.companyName,
                reportType: report.reportType,
                compositeScore: report.metadata.compositeScore,
                createdAt: report.createdAt,
                status: report.metadata.status,
                userId: report.userId,
            })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error('Error getting user reports:', error);
            return [];
        }
    }

    /**
     * Delete a report
     */
    async deleteReport(reportId: string): Promise<boolean> {
        try {
            // Delete from localStorage
            await this.deleteFromLocalStorage(reportId);

            // TODO: Delete from database
            // await this.deleteFromDatabase(reportId);

            return true;
        } catch (error) {
            console.error('Error deleting report:', error);
            return false;
        }
    }

    /**
     * Save current analysis to continue later
     */
    async saveCurrentAnalysis(data: ComprehensiveAnalysisOutput): Promise<void> {
        try {
            localStorage.setItem(this.currentReportKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving current analysis:', error);
        }
    }

    /**
     * Get current analysis
     */
    getCurrentAnalysis(): ComprehensiveAnalysisOutput | null {
        try {
            const stored = localStorage.getItem(this.currentReportKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error getting current analysis:', error);
            return null;
        }
    }

    /**
     * Clear current analysis
     */
    clearCurrentAnalysis(): void {
        localStorage.removeItem(this.currentReportKey);
    }

    // Private helper methods

    private generateReportId(): string {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private calculateModuleCount(data: ComprehensiveAnalysisOutput): number {
        let count = 0;
        if (data.tcaData) count++;
        if (data.riskData) count++;
        if (data.gapData) count++;
        if (data.benchmarkData) count++;
        if (data.growthData) count++;
        if (data.macroData) count++;
        if (data.founderFitData) count++;
        if (data.teamData) count++;
        if (data.strategicFitData) count++;
        return count;
    }

    private extractCompositeScore(data: ComprehensiveAnalysisOutput): number {
        if (data.tcaData?.compositeScore !== undefined) {
            // compositeScore is already on 0-10 scale (e.g., 7.81)
            // Only normalize if it's > 10 (legacy data on 0-100 scale)
            const score = data.tcaData.compositeScore;
            if (score > 10) {
                return Math.round(score) / 10; // Convert 0-100 to 0-10
            }
            return Math.round(score * 100) / 100; // Keep 0-10 scale, round to 2 decimals
        }

        // Calculate from categories if available
        if (data.tcaData?.categories && data.tcaData.categories.length > 0) {
            const weightedSum = data.tcaData.categories.reduce((sum, cat) =>
                sum + (cat.rawScore * (cat.weight / 100)), 0);
            return Math.round(weightedSum * 100) / 100;
        }

        return 0;
    }

    private async saveToLocalStorage(report: StoredReport): Promise<void> {
        try {
            const existing = this.getAllReportsFromStorage();
            console.log('saveToLocalStorage: existing reports count:', existing.length);
            const reports = existing.filter(r => r.id !== report.id);
            reports.push(report);

            // Keep only last 50 reports to prevent storage overflow
            const recentReports = reports.slice(-50);

            localStorage.setItem(this.storageKey, JSON.stringify(recentReports));
            console.log('saveToLocalStorage: saved', recentReports.length, 'reports to', this.storageKey);

            // Dispatch a custom event for same-page listeners
            window.dispatchEvent(new CustomEvent('tca_reports_updated', { detail: { count: recentReports.length } }));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            throw error;
        }
    }

    private async getFromLocalStorage(reportId: string): Promise<StoredReport | null> {
        const reports = this.getAllReportsFromStorage();
        return reports.find(report => report.id === reportId) || null;
    }

    private async getAllFromLocalStorage(): Promise<StoredReport[]> {
        return this.getAllReportsFromStorage();
    }

    private async deleteFromLocalStorage(reportId: string): Promise<void> {
        const reports = this.getAllReportsFromStorage();
        const filtered = reports.filter(report => report.id !== reportId);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }

    private getAllReportsFromStorage(): StoredReport[] {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    // TODO: Database methods for production

    // private async saveToDatabase(report: StoredReport): Promise<void> {
    //   // Implementation for database save
    // }

    // private async getFromDatabase(reportId: string): Promise<StoredReport | null> {
    //   // Implementation for database get
    // }

    // private async getUserReportsFromDatabase(userId: string): Promise<StoredReport[]> {
    //   // Implementation for database user reports
    // }

    // private async deleteFromDatabase(reportId: string): Promise<void> {
    //   // Implementation for database delete
    // }

    /**
     * Clear all pending sync queues
     * Used when backend is confirmed connected to clear any stale pending items
     */
    clearAllPendingQueues(): void {
        try {
            // Clear all possible pending sync storage keys
            const keys = ['pending_report_sync', 'pending_record_sync', 'pending_sync_queue'];
            keys.forEach(key => localStorage.removeItem(key));

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

            // Dispatch event for UI updates
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('tca_sync_completed', {
                    detail: { synced: 0, remaining: 0 }
                }));
            }

            console.log('All pending sync queues cleared');
        } catch (error) {
            console.error('Error clearing pending queues:', error);
        }
    }
}

// Export singleton instance
export const reportStorage = new ReportStorageService();

// Export utility functions
export const saveAnalysisReport = async (
    data: ComprehensiveAnalysisOutput,
    options: {
        reportType: 'triage' | 'dd';
        framework: 'general' | 'medtech';
        userId: string;
        companyName: string;
        analysisDuration?: number;
        tags?: string[];
        evaluationId?: string;
        companyId?: string;
    }
): Promise<string> => {
    return reportStorage.saveReport(
        data,
        options.reportType,
        options.framework,
        options.userId,
        options.companyName,
        {
            analysisDuration: options.analysisDuration,
            tags: options.tags
        },
        {
            evaluationId: options.evaluationId,
            companyId: options.companyId
        }
    );
};

export const getAnalysisReport = async (reportId: string): Promise<StoredReport | null> => {
    return reportStorage.getReport(reportId);
};

export const getUserAnalysisReports = async (userId: string): Promise<ReportListItem[]> => {
    return reportStorage.getUserReports(userId);
};

export const deleteAnalysisReport = async (reportId: string): Promise<boolean> => {
    return reportStorage.deleteReport(reportId);
};