// API client for backend communication with comprehensive TCA integration
export class BackendAPIClient {
    private baseURL: string;
    private authToken: string | null;

    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';
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

        // Backend returns { access_token, refresh_token, user, ... } directly
        if (result.access_token) {
            this.authToken = result.access_token;
            if (typeof window !== 'undefined') {
                localStorage.setItem('authToken', result.access_token);
                if (result.refresh_token) {
                    localStorage.setItem('refreshToken', result.refresh_token);
                }
            }
            // Normalize response for frontend consumption
            return {
                success: true,
                access_token: result.access_token,
                refresh_token: result.refresh_token,
                user: result.user,
                expires_in: result.expires_in
            };
        }

        return { success: false, error: 'Invalid response from server' };
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

        const response = await fetch(`${this.baseURL}/api/v1/analysis/comprehensive`, {
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
        const response = await fetch(`${this.baseURL}/api/v1/tca/quick`, {
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
        const response = await fetch(`${this.baseURL}/api/v1/tca/sector-analysis`, {
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
        const response = await fetch(`${this.baseURL}/api/v1/tca/batch`, {
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
        const response = await fetch(`${this.baseURL}/api/v1/dashboard/stats`, {
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
        const response = await fetch(`${this.baseURL}/api/v1/tca/system-status`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`TCA system status failed: ${response.statusText}`);
        }

        return response.json();
    }

    // User Management Methods
    async getUsers() {
        const response = await fetch(`${this.baseURL}/api/v1/users`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to get users: ${response.statusText}`);
        }

        return response.json();
    }

    async createUser(userData: { email: string; password: string; name: string; role: string }) {
        const response = await fetch(`${this.baseURL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Registration failed' }));
            throw new Error(error.detail || `User creation failed: ${response.statusText}`);
        }

        return response.json();
    }

    async updateUser(userId: string, userData: Partial<{ name: string; role: string; status: string }>) {
        const response = await fetch(`${this.baseURL}/api/v1/users/${userId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            throw new Error(`Failed to update user: ${response.statusText}`);
        }

        return response.json();
    }

    async deleteUser(userId: string) {
        const response = await fetch(`${this.baseURL}/api/v1/users/${userId}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to delete user: ${response.statusText}`);
        }

        return response.json();
    }
}

export const backendAPI = new BackendAPIClient();