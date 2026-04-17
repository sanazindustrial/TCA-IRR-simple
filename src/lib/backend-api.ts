// API client for backend communication with comprehensive TCA integration
export class BackendAPIClient {
    private baseURL: string;
    private apiPrefix: string;
    private authToken: string | null;

    constructor() {
        this.baseURL = (process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net').replace(/\/$/, '');
        this.apiPrefix = '/api/v1';
        this.authToken = null;

        // Try to get auth token from localStorage
        if (typeof window !== 'undefined') {
            this.authToken = localStorage.getItem('authToken');
        }
    }

    private getHeaders(tokenOverride?: string): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const activeToken = tokenOverride || this.authToken;
        if (activeToken) {
            headers['Authorization'] = `Bearer ${activeToken}`;
        }

        return headers;
    }

    private buildUrl(path: string): string {
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        if (path === '/health' || path.startsWith('/api/v1/')) return `${this.baseURL}${path}`;
        return `${this.baseURL}${this.apiPrefix}${path.startsWith('/') ? path : `/${path}`}`;
    }

    async getCurrentUser(tokenOverride?: string) {
        const response = await fetch(this.buildUrl('/auth/me'), {
            method: 'GET',
            headers: this.getHeaders(tokenOverride),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch current user: ${response.statusText}`);
        }

        return response.json();
    }

    async login(email: string, password: string) {
        const response = await fetch(this.buildUrl('/auth/login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const rawText = await response.text();
        let result: any = {};

        try {
            result = rawText ? JSON.parse(rawText) : {};
        } catch {
            result = {};
        }

        if (!response.ok) {
            throw new Error(result?.detail || result?.message || `Login failed: ${response.statusText}`);
        }

        if (result.access_token) {
            this.authToken = result.access_token;

            if (typeof window !== 'undefined') {
                localStorage.setItem('authToken', result.access_token);
                if (result.refresh_token) {
                    localStorage.setItem('refreshToken', result.refresh_token);
                }
            }

            let user = result.user || null;
            if (!user) {
                try {
                    user = await this.getCurrentUser(result.access_token);
                } catch (profileError) {
                    console.warn('Could not load user profile after login:', profileError);
                    user = {
                        id: result.user_id || email,
                        email,
                        full_name: email,
                        role: result.role || 'User',
                    };
                }
            }

            return {
                success: true,
                access_token: result.access_token,
                refresh_token: result.refresh_token ?? null,
                user,
                expires_in: result.expires_in,
                token_type: result.token_type
            };
        }

        return { success: false, error: result?.detail || 'Invalid response from server' };
    }

    async runComprehensiveAnalysis(framework: 'general' | 'medtech', additionalData?: any) {
        const companyName = additionalData?.companyName || additionalData?.name || '';
        const companyDescription = additionalData?.description || additionalData?.companyDescription || '';

        // Enhanced payload structure matching backend expectations
        const payload = {
            framework,
            sector: framework === 'medtech' ? 'life_sciences_medical' : 'technology_others',
            company_data: {
                name: companyName,
                description: companyDescription,
                stage: additionalData?.stage || '',
                sector: framework === 'medtech' ? 'life_sciences_medical' : 'technology_others',
                framework: framework
            },
            stage: additionalData?.stage || '',
            companyName,
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
                company_data: companyData || { framework },
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
                company_data: companyData || { framework },
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
        const response = await fetch(this.buildUrl('/auth/register'), {
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