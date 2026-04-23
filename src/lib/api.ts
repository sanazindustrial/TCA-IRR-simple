/**
 * API Configuration and Helper Functions
 * TCA IRR Platform Frontend
 */

// API Configuration
export const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net',
    API_PREFIX: '/api/v1',
    ENDPOINTS: {
        AUTH: {
            REGISTER: '/api/v1/auth/register',
            LOGIN: '/api/v1/auth/login',
            ME: '/api/v1/auth/me',
            PROFILE: '/api/v1/auth/profile'
        },
        COMPANIES: {
            BASE: '/api/v1/companies',
            BY_ID: (id: string) => `/api/v1/companies/${id}`
        },
        EVALUATIONS: {
            BASE: '/api/v1/evaluations',
            BY_ID: (id: string) => `/api/v1/evaluations/${id}`,
            TCA_BATCH: '/api/v1/evaluations/tca/batch'
        }
    }
};

// Helper function to construct full API URLs
export const getApiUrl = (path: string): string => {
    return `${API_CONFIG.BASE_URL}${path}`;
};

// API Response Types
export interface ApiResponse<T = any> {
    success?: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// HTTP Client with error handling
export class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string = API_CONFIG.BASE_URL) {
        this.baseUrl = baseUrl;

        // Try to get token from localStorage if available
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('authToken');
        }
    }

    setToken(token: string | null) {
        this.token = token;
        if (typeof window !== 'undefined') {
            if (token) {
                localStorage.setItem('authToken', token);
            } else {
                localStorage.removeItem('authToken');
            }
        }
    }

    private getHeaders(): HeadersInit {
        // Always read a fresh token from localStorage at call time so that the
        // singleton instance picks up the token after the user has logged in.
        if (typeof window !== 'undefined') {
            const freshToken = localStorage.getItem('authToken');
            if (freshToken) this.token = freshToken;
        }

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Attempt to refresh the auth token. Returns true if successful.
    private async tryRefreshToken(): Promise<boolean> {
        if (typeof window === 'undefined') return false;
        const currentToken = localStorage.getItem('authToken');
        if (!currentToken) return false;
        try {
            const res = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
            });
            if (!res.ok) return false;
            const data = await res.json();
            const newToken: string | undefined = data.access_token ?? data.token ?? data.authToken;
            if (newToken) {
                this.setToken(newToken);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    async get<T = any>(path: string): Promise<ApiResponse<T>> {
        try {
            const url = `${this.baseUrl}${path}`;
            console.log('API GET Request:', url);

            let response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
                mode: 'cors',
                credentials: 'omit',
            });

            console.log('API GET Response Status:', response.status, response.statusText);

            if (response.status === 401) {
                const refreshed = await this.tryRefreshToken();
                if (refreshed) {
                    response = await fetch(url, {
                        method: 'GET',
                        headers: this.getHeaders(),
                        mode: 'cors',
                        credentials: 'omit',
                    });
                }
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API GET Error Response:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            console.log('API GET Success:', data);
            return { success: true, data };
        } catch (error) {
            console.error('API GET Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async post<T = any>(path: string, body: any = {}): Promise<ApiResponse<T>> {
        try {
            let response = await fetch(`${this.baseUrl}${path}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(body),
            });

            if (response.status === 401) {
                const refreshed = await this.tryRefreshToken();
                if (refreshed) {
                    response = await fetch(`${this.baseUrl}${path}`, {
                        method: 'POST',
                        headers: this.getHeaders(),
                        body: JSON.stringify(body),
                    });
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('API POST Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async put<T = any>(path: string, body: any = {}): Promise<ApiResponse<T>> {
        try {
            let response = await fetch(`${this.baseUrl}${path}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(body),
            });

            if (response.status === 401) {
                const refreshed = await this.tryRefreshToken();
                if (refreshed) {
                    response = await fetch(`${this.baseUrl}${path}`, {
                        method: 'PUT',
                        headers: this.getHeaders(),
                        body: JSON.stringify(body),
                    });
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('API PUT Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async delete<T = any>(path: string): Promise<ApiResponse<T>> {
        try {
            let response = await fetch(`${this.baseUrl}${path}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });

            if (response.status === 401) {
                const refreshed = await this.tryRefreshToken();
                if (refreshed) {
                    response = await fetch(`${this.baseUrl}${path}`, {
                        method: 'DELETE',
                        headers: this.getHeaders(),
                    });
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Some DELETE responses might be empty
            const text = await response.text();
            const data = text ? JSON.parse(text) : {};

            return { success: true, data };
        } catch (error) {
            console.error('API DELETE Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

// Default API client instance
export const api = new ApiClient();

// Specific API functions
export const authApi = {
    register: (userData: { username: string; email: string; password: string; full_name?: string }) =>
        api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData),

    login: (credentials: { username: string; password: string }) =>
        api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials),

    getMe: () => api.get(API_CONFIG.ENDPOINTS.AUTH.ME),

    updateProfile: (profileData: any) =>
        api.put(API_CONFIG.ENDPOINTS.AUTH.PROFILE, profileData)
};

export const companyApi = {
    list: () => api.get(API_CONFIG.ENDPOINTS.COMPANIES.BASE),

    create: (companyData: any) =>
        api.post(API_CONFIG.ENDPOINTS.COMPANIES.BASE, companyData),

    get: (id: string) =>
        api.get(API_CONFIG.ENDPOINTS.COMPANIES.BY_ID(id)),

    update: (id: string, companyData: any) =>
        api.put(API_CONFIG.ENDPOINTS.COMPANIES.BY_ID(id), companyData),

    delete: (id: string) =>
        api.delete(API_CONFIG.ENDPOINTS.COMPANIES.BY_ID(id))
};

export const evaluationApi = {
    list: () => api.get(API_CONFIG.ENDPOINTS.EVALUATIONS.BASE),

    create: (evaluationData: any) =>
        api.post(API_CONFIG.ENDPOINTS.EVALUATIONS.BASE, evaluationData),

    get: (id: string) =>
        api.get(API_CONFIG.ENDPOINTS.EVALUATIONS.BY_ID(id)),

    update: (id: string, evaluationData: any) =>
        api.put(API_CONFIG.ENDPOINTS.EVALUATIONS.BY_ID(id), evaluationData),

    batchTca: (batchData: any) =>
        api.post(API_CONFIG.ENDPOINTS.EVALUATIONS.TCA_BATCH, batchData)
};

// Health check function
export const checkApiHealth = async (): Promise<boolean> => {
    try {
        const response = await api.get('/api');
        return response.success === true;
    } catch {
        return false;
    }
};