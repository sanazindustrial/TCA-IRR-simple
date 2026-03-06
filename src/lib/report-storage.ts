// Database and storage utilities for TCA reports
import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';

export type StoredReport = {
    id: string;
    userId: string;
    companyName: string;
    reportType: 'triage' | 'dd';
    framework: 'general' | 'medtech';
    data: ComprehensiveAnalysisOutput;
    createdAt: string;
    updatedAt: string;
    metadata: {
        analysisDuration?: number;
        moduleCount: number;
        compositeScore: number;
        status: 'draft' | 'completed' | 'archived';
        tags?: string[];
    };
};

export type ReportListItem = {
    id: string;
    companyName: string;
    reportType: 'triage' | 'dd';
    compositeScore: number;
    createdAt: string;
    status: 'draft' | 'completed' | 'archived';
};

class ReportStorageService {
    private readonly storageKey = 'tca_reports';
    private readonly currentReportKey = 'current_analysis_result';

    /**
     * Save a report to storage (both localStorage and potentially database)
     */
    async saveReport(
        data: ComprehensiveAnalysisOutput,
        reportType: 'triage' | 'dd',
        framework: 'general' | 'medtech',
        userId: string,
        companyName: string,
        metadata?: Partial<StoredReport['metadata']>
    ): Promise<string> {
        const reportId = this.generateReportId();
        const now = new Date().toISOString();

        const report: StoredReport = {
            id: reportId,
            userId,
            companyName: companyName || 'Unnamed Company',
            reportType,
            framework,
            data,
            createdAt: now,
            updatedAt: now,
            metadata: {
                moduleCount: this.calculateModuleCount(data),
                compositeScore: this.extractCompositeScore(data),
                status: 'completed',
                analysisDuration: metadata?.analysisDuration,
                tags: metadata?.tags || [],
                ...metadata
            }
        };

        // Save to localStorage
        await this.saveToLocalStorage(report);

        // TODO: Save to remote database
        // await this.saveToDatabase(report);

        return reportId;
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
                companyName: report.companyName,
                reportType: report.reportType,
                compositeScore: report.metadata.compositeScore,
                createdAt: report.createdAt,
                status: report.metadata.status
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
        if (data.tcaData?.compositeScore) {
            return data.tcaData.compositeScore / 10; // Convert to 0-10 scale
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
            const reports = existing.filter(r => r.id !== report.id);
            reports.push(report);

            // Keep only last 50 reports to prevent storage overflow
            const recentReports = reports.slice(-50);

            localStorage.setItem(this.storageKey, JSON.stringify(recentReports));
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