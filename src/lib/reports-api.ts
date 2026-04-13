/**
 * Reports API Client
 * Handles all report-related API calls
 */

// Base URL for API - endpoints add /api prefix (no version)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';
const API_PREFIX = '/api/v1';

export interface UserInfo {
    name: string;
    email: string;
}

export interface Report {
    id: number;
    company_name: string;
    company_id?: number;
    type: string;
    status: string;
    approval: string;
    score?: number;
    tca_score?: number;
    confidence?: number;
    recommendation?: string;
    module_scores?: Record<string, any>;
    settings_version_id?: number;
    simulation_run_id?: number;
    missing_sections?: string[];
    user: UserInfo;
    Analyst_notes?: string;
    created_at: string;
    updated_at: string;
    completed_at?: string;
}

// Alias for backwards compatibility with existing code
export type ReportData = Report & {
    company: string; // Alias for company_name
    createdAt: string; // Alias for created_at
    missingSections?: string[]; // Alias for missing_sections
    // Unique tracking IDs
    report_id?: string;      // Unique report ID: RPT-{TYPE}-{timestamp}-{random}
    reportId?: string;       // Alias for report_id
    evaluation_id?: string;  // Evaluation ID: EVAL-{timestamp}-{random}
    evaluationId?: string;   // Alias for evaluation_id
    companyId?: string;      // Company tracking ID
    version?: number;        // Report version number
};

export interface ReportVersion {
    id: number;
    report_id: number;
    version_number: number;
    overall_score?: number;
    tca_score?: number;
    confidence?: number;
    module_scores?: Record<string, any>;
    change_reason?: string;
    changed_by?: number;
    created_at: string;
}

export interface ReportStats {
    total_reports: number;
    completed: number;
    pending: number;
    due_diligence: number;
    average_score?: number;
}

export interface CreateReportRequest {
    company_name: string;
    company_id?: number;
    report_type?: string;
    overall_score?: number;
    tca_score?: number;
    confidence?: number;
    recommendation?: string;
    module_scores?: Record<string, any>;
    analysis_data?: Record<string, any>;
    settings_version_id?: number;
    simulation_run_id?: number;
    missing_sections?: string[];
}

export interface UpdateReportRequest {
    status?: string;
    approval_status?: string;
    overall_score?: number;
    tca_score?: number;
    confidence?: number;
    recommendation?: string;
    Analyst_notes?: string;
    change_reason?: string;
}

export interface ReportFilters {
    status?: string;
    approval_status?: string;
    report_type?: string;
    company_name?: string;
    search?: string;  // Alias for company_name search
    user_id?: number;
    settings_version_id?: number;
    limit?: number;
    offset?: number;
}

/**
 * Convert API Report to ReportData format for backwards compatibility
 */
function toReportData(report: Report): ReportData {
    return {
        ...report,
        company: report.company_name,
        createdAt: report.created_at,
        missingSections: report.missing_sections
    };
}

/**
 * Reports API Client
 */
export const reportsApi = {
    /**
     * Get all reports with optional filtering
     */
    async getReports(filters?: ReportFilters): Promise<ReportData[]> {
        try {
            const params = new URLSearchParams();

            if (filters) {
                if (filters.status) params.append('status', filters.status);
                if (filters.approval_status) params.append('approval_status', filters.approval_status);
                if (filters.report_type) params.append('report_type', filters.report_type);
                if (filters.company_name) params.append('company_name', filters.company_name);
                if (filters.search) params.append('company_name', filters.search);  // Map search to company_name
                if (filters.user_id) params.append('user_id', filters.user_id.toString());
                if (filters.settings_version_id) params.append('settings_version_id', filters.settings_version_id.toString());
                if (filters.limit) params.append('limit', filters.limit.toString());
                if (filters.offset) params.append('offset', filters.offset.toString());
            }

            const url = `${API_BASE_URL}${API_PREFIX}/reports${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch reports: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Handle various response formats defensively
            let reports: Report[] = [];
            if (Array.isArray(data)) {
                reports = data;
            } else if (data && Array.isArray(data.reports)) {
                reports = data.reports;
            } else if (data && data.reports) {
                // data.reports exists but isn't an array - log warning
                console.warn('Unexpected reports format:', typeof data.reports, data.reports);
                reports = [];
            }
            
            return reports.map(toReportData);
        } catch (error) {
            console.error('Error fetching reports:', error);
            throw error;
        }
    },

    /**
     * Get report statistics
     */
    async getStats(userId?: number): Promise<ReportStats> {
        try {
            const url = userId
                ? `${API_BASE_URL}${API_PREFIX}/reports/stats?user_id=${userId}`
                : `${API_BASE_URL}${API_PREFIX}/reports/stats`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch stats: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching report stats:', error);
            throw error;
        }
    },

    /**
     * Get a specific report by ID
     */
    async getReport(reportId: number): Promise<ReportData> {
        try {
            const response = await fetch(`${API_BASE_URL}${API_PREFIX}/reports/${reportId}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch report: ${response.statusText}`);
            }

            const report: Report = await response.json();
            return toReportData(report);
        } catch (error) {
            console.error(`Error fetching report ${reportId}:`, error);
            throw error;
        }
    },

    /**
     * Create a new report
     */
    async createReport(report: CreateReportRequest, userId: number = 1): Promise<ReportData> {
        try {
            const response = await fetch(`${API_BASE_URL}${API_PREFIX}/reports?user_id=${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(report),
            });

            if (!response.ok) {
                throw new Error(`Failed to create report: ${response.statusText}`);
            }

            const createdReport: Report = await response.json();
            return toReportData(createdReport);
        } catch (error) {
            console.error('Error creating report:', error);
            throw error;
        }
    },

    /**
     * Update a report
     */
    async updateReport(reportId: number, updates: UpdateReportRequest, userId: number = 1): Promise<ReportData> {
        try {
            const response = await fetch(`${API_BASE_URL}${API_PREFIX}/reports/${reportId}?user_id=${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error(`Failed to update report: ${response.statusText}`);
            }

            const updatedReport: Report = await response.json();
            return toReportData(updatedReport);
        } catch (error) {
            console.error(`Error updating report ${reportId}:`, error);
            throw error;
        }
    },

    /**
     * Get report version history
     */
    async getReportVersions(reportId: number): Promise<ReportVersion[]> {
        try {
            const response = await fetch(`${API_BASE_URL}${API_PREFIX}/reports/${reportId}/versions`);

            if (!response.ok) {
                throw new Error(`Failed to fetch versions: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching report versions for ${reportId}:`, error);
            throw error;
        }
    },

    /**
     * Delete a report
     */
    async deleteReport(reportId: number): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}${API_PREFIX}/reports/${reportId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Failed to delete report: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error deleting report ${reportId}:`, error);
            throw error;
        }
    },

    /**
     * Approve a report
     */
    async approveReport(reportId: number, userId: number = 1, notes?: string): Promise<ReportData> {
        return this.updateReport(reportId, {
            approval_status: 'Approved',
            Analyst_notes: notes,
            change_reason: 'Approved by Analyst'
        }, userId);
    },

    /**
     * Reject a report
     */
    async rejectReport(reportId: number, userId: number = 1, notes?: string): Promise<ReportData> {
        return this.updateReport(reportId, {
            approval_status: 'Rejected',
            Analyst_notes: notes,
            change_reason: 'Rejected by Analyst'
        }, userId);
    },

    /**
     * Move report to due diligence
     */
    async moveToDueDiligence(reportId: number, userId: number = 1): Promise<ReportData> {
        return this.updateReport(reportId, {
            approval_status: 'Due Diligence',
            change_reason: 'Moved to due diligence phase'
        }, userId);
    }
};

export default reportsApi;
