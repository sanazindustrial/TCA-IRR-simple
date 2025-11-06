// API client for backend communication with comprehensive TCA integration
export class BackendAPIClient {
    private baseURL: string;
    private authToken: string | null;

    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
        this.authToken = null;

        // Try to get auth token from localStorage
        if (typeof window !== 'undefined') {
            this.authToken = localStorage.getItem('authToken');
        }
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        return headers;
    }

    async login(email: string, password: string) {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error(`Login failed: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.success && result.access_token) {
            this.authToken = result.access_token;
            if (typeof window !== 'undefined') {
                localStorage.setItem('authToken', result.access_token);
            }
        }

        return result;
    }

    async runComprehensiveAnalysis(framework: 'general' | 'medtech', additionalData?: any) {
        // Enhanced payload structure matching backend expectations
        const payload = {
            framework,
            sector: framework === 'medtech' ? 'life_sciences_medical' : 'technology_others',
            company_data: {
                name: additionalData?.companyName || 'Sample Company',
                description: additionalData?.description || 'AI-powered startup analysis',
                stage: additionalData?.stage || 'seed',
                sector: framework === 'medtech' ? 'life_sciences_medical' : 'technology_others',
                framework: framework
            },
            stage: additionalData?.stage || 'seed',
            companyName: additionalData?.companyName || 'Sample Company',
            ...additionalData
        };

        const response = await fetch(`${this.baseURL}/analysis/comprehensive`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.statusText}`);
        }

        return response.json();
    }

    // TCA Analysis Methods
    async runQuickTCA(framework: 'general' | 'medtech', companyData?: any) {
        const response = await fetch(`${this.baseURL}/tca/quick`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                framework,
                company_data: companyData || { name: 'Sample Company', framework },
                ...companyData
            }),
        });

        if (!response.ok) {
            throw new Error(`Quick TCA failed: ${response.statusText}`);
        }

        return response.json();
    }

    async runSectorSpecificTCA(framework: 'general' | 'medtech', companyData?: any) {
        const response = await fetch(`${this.baseURL}/tca/sector-analysis`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                framework,
                sector: framework === 'medtech' ? 'life_sciences_medical' : 'technology_others',
                company_data: companyData || { name: 'Sample Company', framework },
                ...companyData
            }),
        });

        if (!response.ok) {
            throw new Error(`Sector-specific TCA failed: ${response.statusText}`);
        }

        return response.json();
    }

    async runBatchTCA(companies: any[], analysisType: 'quick' | 'comprehensive' = 'quick') {
        const response = await fetch(`${this.baseURL}/tca/batch`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                companies,
                analysis_type: analysisType
            }),
        });

        if (!response.ok) {
            throw new Error(`Batch TCA failed: ${response.statusText}`);
        }

        return response.json();
    }

    async getDashboardStats() {
        const response = await fetch(`${this.baseURL}/dashboard/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get dashboard stats: ${response.statusText}`);
        }

        return response.json();
    }

    async getHealthCheck() {
        const response = await fetch(`${this.baseURL}/health`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Health check failed: ${response.statusText}`);
        }

        return response.json();
    }

    async getTCASystemStatus() {
        const response = await fetch(`${this.baseURL}/tca/system-status`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`TCA system status failed: ${response.statusText}`);
        }

        return response.json();
    }
}

export const backendAPI = new BackendAPIClient();