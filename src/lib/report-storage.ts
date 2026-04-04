// Database and storage utilities for TCA reports
import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';
import { reportsApi, type CreateReportRequest } from './reports-api';
import { trackingService, generateReportId as genRepId, generateCompanyId as genCoId } from './tracking-service';

// Backend API URL for report storage (base URL - endpoints add /api/v1)
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

        // Save to localStorage
        await this.saveToLocalStorage(report);

        // Save to backend API
        try {
            await this.saveToBackendAPI(report);
            console.log(`Report ${reportId} saved to backend (Eval: ${evaluationId}, Company: ${companyId})`);
        } catch (error) {
            console.warn('Failed to save report to backend API (will retry later):', error);
            // Store in pending sync queue for later retry
            this.addToPendingSyncQueue(report);
        }

        return reportId;
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
     */
    async syncPendingReports(): Promise<void> {
        try {
            const queueKey = 'pending_report_sync';
            const existingQueue = localStorage.getItem(queueKey);
            if (!existingQueue) return;

            const queue: StoredReport[] = JSON.parse(existingQueue);
            const stillPending: StoredReport[] = [];

            for (const report of queue) {
                try {
                    await this.saveToBackendAPI(report);
                    console.log(`Synced pending report: ${report.id}`);
                } catch (error) {
                    stillPending.push(report);
                }
            }

            localStorage.setItem(queueKey, JSON.stringify(stillPending));
        } catch (error) {
            console.error('Error syncing pending reports:', error);
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