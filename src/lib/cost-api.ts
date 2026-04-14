/**
 * Cost Management API Client
 * Handles all cost-related API calls
 */

// Base URL for API - endpoints use /api/v1 prefix
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';
const API_PREFIX = '/api/v1';

export interface CostBreakdown {
    category: string;
    cost: number;
    percentage: number;
    executions: number;
}

export interface CostTrend {
    date: string;
    cost: number;
}

export interface AIModelCost {
    name: string;
    cost: number;
    percentage: number;
}

export interface UserCost {
    name: string;
    cost: number;
    percentage: number;
}

export interface ReportTypeCost {
    name: string;
    cost: number;
    percentage: number;
}

export interface AIBreakdown {
    totalAiCost: number;
    costPerAnalysis: number;
    inputTokens: number;
    outputTokens: number;
    models: AIModelCost[];
    costByUser: UserCost[];
    costByReportType: ReportTypeCost[];
}

export interface CostSummary {
    totalCost: number;
    totalRequests: number;
    billedUsers: number;
    dailyAverage: number;
    breakdown: CostBreakdown[];
    trends: CostTrend[];
    aiBreakdown: AIBreakdown;
    dateRange: {
        start: string;
        end: string;
    };
}

export interface UsageDetails {
    period: string;
    startDate: string;
    endDate: string;
    usageByFeature: Array<{
        feature: string;
        usage_count: number;
    }>;
    limits: {
        analysesPerMonth: number;
        usersIncluded: number;
        storageGB: number;
    };
}

export interface BudgetStatus {
    monthlyBudget: number;
    currentSpend: number;
    remainingBudget: number;
    percentUsed: number;
    projectedMonthEnd: number;
    alerts: Array<{ type: string; message: string } | null>;
    recommendations: string[];
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
        // First try the direct authToken (primary storage)
        const directToken = localStorage.getItem('authToken');
        if (directToken) {
            return directToken;
        }
        // Fallback to loggedInUser.token if present
        const user = localStorage.getItem('loggedInUser');
        if (user) {
            try {
                const parsed = JSON.parse(user);
                return parsed.token || parsed.access_token || null;
            } catch {
                return null;
            }
        }
    }
    return null;
}

/**
 * Cost Management API Client
 */
export const costApi = {
    /**
     * Get cost summary for a date range
     * Falls back to public endpoint if authentication fails
     */
    async getSummary(startDate?: string, endDate?: string): Promise<CostSummary> {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const token = getAuthToken();

        // Try authenticated endpoint first
        try {
            const authUrl = `${API_BASE_URL}${API_PREFIX}/cost/summary${params.toString() ? `?${params.toString()}` : ''}`;
            const authResponse = await fetch(authUrl, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                },
            });

            if (authResponse.ok) {
                return authResponse.json();
            }
        } catch (e) {
            console.warn('Authenticated cost endpoint failed, trying public endpoint');
        }

        // Fall back to public endpoint (no authentication required)
        const publicUrl = `${API_BASE_URL}${API_PREFIX}/cost/summary/public${params.toString() ? `?${params.toString()}` : ''}`;
        const publicResponse = await fetch(publicUrl, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!publicResponse.ok) {
            throw new Error(`Failed to fetch cost summary: ${publicResponse.statusText}`);
        }

        return publicResponse.json();
    },

    /**
     * Get usage details
     */
    async getUsage(timePeriod: string = '30d'): Promise<UsageDetails> {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}${API_PREFIX}/cost/usage?time_period=${timePeriod}`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch usage details: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Get budget status
     */
    async getBudget(): Promise<BudgetStatus> {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}${API_PREFIX}/cost/budget`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch budget status: ${response.statusText}`);
        }

        return response.json();
    },
};

// Fallback data when API is unavailable
export const fallbackCostData: CostSummary = {
    totalCost: 82.75,
    totalRequests: 4,
    billedUsers: 3,
    dailyAverage: 2.76,
    breakdown: [
        { category: 'AI Analysis (GPT-4)', cost: 28.50, percentage: 80.0, executions: 63 },
        { category: 'Embeddings (Ada)', cost: 4.25, percentage: 12.0, executions: 189 },
        { category: 'External Data APIs', cost: 3.50, percentage: 5.0, executions: 315 },
        { category: 'Infrastructure', cost: 1.50, percentage: 3.0, executions: 630 },
    ],
    trends: [
        { date: '03/05/2026', cost: 15.68 },
        { date: '03/04/2026', cost: 21.44 },
        { date: '03/03/2026', cost: 44.22 },
    ],
    aiBreakdown: {
        totalAiCost: 35.80,
        costPerAnalysis: 0.45,
        inputTokens: 12500000,
        outputTokens: 3125000,
        models: [
            { name: 'Analysis (GPT-4)', cost: 28.50, percentage: 79.6 },
            { name: 'Embedding (Ada)', cost: 4.25, percentage: 11.9 },
            { name: 'Fine-Tuning', cost: 3.05, percentage: 8.5 },
        ],
        costByUser: [
            { name: 'Admin User', cost: 15.50, percentage: 43.3 },
            { name: 'Analyst One', cost: 12.30, percentage: 34.3 },
            { name: 'Standard User', cost: 8.00, percentage: 22.4 },
        ],
        costByReportType: [
            { name: 'Triage Reports', cost: 25.40, percentage: 71.0 },
            { name: 'Due Diligence', cost: 10.40, percentage: 29.0 },
        ]
    },
    dateRange: {
        start: '2026-02-04',
        end: '2026-03-06'
    }
};
