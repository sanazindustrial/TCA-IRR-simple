// API client for backend communication with comprehensive TCA integration
export class BackendAPIClient {
    private baseURL: string;
    private authToken: string | null;
    private refreshToken: string | null;

    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';
        this.authToken = null;
        this.refreshToken = null;

        // Restore tokens from localStorage on construction
        if (typeof window !== 'undefined') {
            this.authToken = localStorage.getItem('authToken');
            this.refreshToken = localStorage.getItem('refreshToken');
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

    /** Persist tokens + expiry to localStorage and to instance fields. */
    private storeTokens(accessToken: string, refreshToken?: string, expiresIn?: number) {
        this.authToken = accessToken;
        if (typeof window !== 'undefined') {
            localStorage.setItem('authToken', accessToken);
            if (refreshToken) {
                this.refreshToken = refreshToken;
                localStorage.setItem('refreshToken', refreshToken);
            }
            if (expiresIn) {
                // Store absolute expiry timestamp (ms) so we can proactively refresh
                localStorage.setItem(
                    'authTokenExpiry',
                    String(Date.now() + expiresIn * 1000)
                );
            }
        }
    }

    /**
     * Attempt a silent token refresh using the stored refresh token.
     * Returns true if a new access token was obtained.
     */
    private async tryRefreshToken(): Promise<boolean> {
        const storedRefresh =
            this.refreshToken ||
            (typeof window !== 'undefined'
                ? localStorage.getItem('refreshToken')
                : null);

        if (!storedRefresh) return false;

        try {
            const res = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: storedRefresh }),
            });

            if (!res.ok) return false;

            const data = await res.json();
            if (data.access_token) {
                this.storeTokens(data.access_token, data.refresh_token, data.expires_in);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    /**
     * Authenticated fetch wrapper with automatic token refresh on 401.
     * Use this for all endpoints that require a Bearer token.
     */
    private async fetchWithAuth(
        url: string,
        options: RequestInit = {}
    ): Promise<Response> {
        const makeRequest = () =>
            fetch(url, {
                ...options,
                headers: {
                    ...(options.headers as Record<string, string>),
                    ...this.getHeaders(),
                } as HeadersInit,
            });

        let response = await makeRequest();

        if (response.status === 401) {
            const refreshed = await this.tryRefreshToken();
            if (refreshed) {
                // Retry once with the new token
                response = await makeRequest();
            }
        }

        return response;
    }

    async login(email: string, password: string) {
        // Try JSON body first (email + password)
        let response = await fetch(`${this.baseURL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        // FastAPI OAuth2 standard form flow uses username field + form encoding
        if (response.status === 422 || response.status === 404) {
            const formBody = new URLSearchParams();
            formBody.append('username', email);
            formBody.append('password', password);
            response = await fetch(`${this.baseURL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formBody.toString(),
            });
        }

        if (!response.ok) {
            // Parse FastAPI validation error detail if present
            let detail = response.statusText;
            try {
                const errBody = await response.json();
                if (errBody.detail) {
                    detail = typeof errBody.detail === 'string'
                        ? errBody.detail
                        : JSON.stringify(errBody.detail);
                } else if (errBody.message) {
                    detail = errBody.message;
                }
            } catch { /* ignore parse errors */ }
            throw new Error(`Login failed: ${detail}`);
        }

        const result = await response.json();

        // Some backends return token inside a nested key
        const accessToken =
            result.access_token ||
            result.token ||
            result.data?.access_token;

        if (!accessToken) {
            return { success: false, error: 'Invalid response from server' };
        }

        this.storeTokens(accessToken, result.refresh_token, result.expires_in);

        // If backend didn't return a user object, fetch it from /auth/me
        let user = result.user || result.data?.user || null;
        if (!user) {
            try {
                const meRes = await fetch(`${this.baseURL}/api/v1/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (meRes.ok) {
                    const meData = await meRes.json();
                    user = meData.user || meData;
                }
            } catch { /* fallback below */ }
        }

        // Construct a minimal user object from whatever we have
        if (!user) {
            user = { email };
        }

        return {
            success: true,
            access_token: accessToken,
            refresh_token: result.refresh_token,
            user,
            expires_in: result.expires_in,
        };
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

        const response = await this.fetchWithAuth(
            `${this.baseURL}/api/v1/analysis/comprehensive`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.statusText}`);
        }

        return response.json();
    }

    // TCA Analysis Methods
    async runQuickTCA(framework: 'general' | 'medtech', companyData?: any) {
        const response = await this.fetchWithAuth(
            `${this.baseURL}/api/v1/tca/quick`,
            {
                method: 'POST',
                body: JSON.stringify({
                    framework,
                    company_data: companyData || { name: 'Sample Company', framework },
                    ...companyData
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Quick TCA failed: ${response.statusText}`);
        }

        return response.json();
    }

    async runSectorSpecificTCA(framework: 'general' | 'medtech', companyData?: any) {
        const response = await this.fetchWithAuth(
            `${this.baseURL}/api/v1/tca/sector-analysis`,
            {
                method: 'POST',
                body: JSON.stringify({
                    framework,
                    sector: framework === 'medtech' ? 'life_sciences_medical' : 'technology_others',
                    company_data: companyData || { name: 'Sample Company', framework },
                    ...companyData
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Sector-specific TCA failed: ${response.statusText}`);
        }

        return response.json();
    }

    async runBatchTCA(companies: any[], analysisType: 'quick' | 'comprehensive' = 'quick') {
        const response = await this.fetchWithAuth(
            `${this.baseURL}/api/v1/tca/batch`,
            {
                method: 'POST',
                body: JSON.stringify({
                    companies,
                    analysis_type: analysisType
                }),
            }
        );

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
        const response = await this.fetchWithAuth(
            `${this.baseURL}/api/v1/users`,
            { method: 'GET' }
        );

        if (!response.ok) {
            throw new Error(`Failed to get users: ${response.statusText}`);
        }

        return response.json();
    }

    async createUser(userData: { email: string; password: string; name: string; role: string }) {
        const response = await fetch(`${this.baseURL}/api/v1/auth/register`, {
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
        const response = await this.fetchWithAuth(
            `${this.baseURL}/api/v1/users/${userId}`,
            {
                method: 'PUT',
                body: JSON.stringify(userData),
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to update user: ${response.statusText}`);
        }

        return response.json();
    }

    async deleteUser(userId: string) {
        const response = await this.fetchWithAuth(
            `${this.baseURL}/api/v1/users/${userId}`,
            { method: 'DELETE' }
        );

        if (!response.ok) {
            throw new Error(`Failed to delete user: ${response.statusText}`);
        }

        return response.json();
    }
}

export const backendAPI = new BackendAPIClient();