/**
 * Role Configuration API Client
 * Manage role permissions and limits dynamically
 */

import { api } from './api';

// Types matching backend models
export interface RolePermission {
    id?: number;
    name: string;
    description?: string;
    enabled: boolean;
}

export interface RoleLimits {
    triageReports: number | 'Unlimited';
    ddReports: number | 'Unlimited';
}

export interface RoleConfig {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    permissions: RolePermission[];
    limits: RoleLimits;
}

export interface RoleConfigUpdate {
    label?: string;
    icon?: string;
    color?: string;
    bgColor?: string;
    permissions?: RolePermission[];
    limits?: RoleLimits;
}

export interface RoleConfigurationsResponse {
    roles: {
        admin: RoleConfig;
        analyst: RoleConfig;
        user: RoleConfig;
    };
    updatedAt?: string;
    fromDefaults?: boolean;
}

// Default fallback configuration (mirrors backend)
export const DEFAULT_ROLE_CONFIGS: RoleConfigurationsResponse['roles'] = {
    admin: {
        label: 'Administrator',
        icon: 'Shield',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        permissions: [
            { name: 'Full System Access', description: 'Complete access to all features', enabled: true },
            { name: 'User Management', description: 'Can create, edit, and delete users', enabled: true },
            { name: 'Module Configuration', description: 'Can modify analysis modules', enabled: true },
            { name: 'Export Data', description: 'Can export reports and data', enabled: true },
            { name: 'View Reports', description: 'Can view all reports', enabled: true },
            { name: 'Run Analysis', description: 'Can execute triage and DD analysis', enabled: true },
        ],
        limits: { triageReports: 'Unlimited', ddReports: 'Unlimited' }
    },
    analyst: {
        label: 'Analyst',
        icon: 'LineChart',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        permissions: [
            { name: 'Run DD Analysis', description: 'Can execute deep dive analysis', enabled: true },
            { name: 'Run Triage Analysis', description: 'Can execute triage analysis', enabled: true },
            { name: 'View Reports', description: 'Can view assigned reports', enabled: true },
            { name: 'Export Data', description: 'Can export own reports', enabled: true },
            { name: 'User Management', description: 'Can manage users', enabled: false },
            { name: 'Module Configuration', description: 'Can modify analysis modules', enabled: false },
        ],
        limits: { triageReports: 50, ddReports: 10 }
    },
    user: {
        label: 'Standard User',
        icon: 'User',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        permissions: [
            { name: 'Run Triage Analysis', description: 'Can execute triage analysis', enabled: true },
            { name: 'View Reports', description: 'Can view own reports only', enabled: true },
            { name: 'Run DD Analysis', description: 'Can execute deep dive analysis', enabled: false },
            { name: 'Export Data', description: 'Can export data', enabled: false },
            { name: 'User Management', description: 'Can manage users', enabled: false },
            { name: 'Module Configuration', description: 'Can modify analysis modules', enabled: false },
        ],
        limits: { triageReports: 10, ddReports: 0 }
    }
};

/**
 * Role Configuration API
 */
export const RolesApi = {
    /**
     * Get all role configurations
     */
    async getConfigurations(): Promise<RoleConfigurationsResponse> {
        try {
            const response = await api.get<RoleConfigurationsResponse>(
                '/api/v1/roles/configurations'
            );
            return (response.data || response) as RoleConfigurationsResponse;
        } catch (error) {
            console.warn('Failed to fetch role configurations, using defaults:', error);
            return {
                roles: DEFAULT_ROLE_CONFIGS,
                fromDefaults: true
            };
        }
    },

    /**
     * Update a specific role's configuration
     */
    async updateConfiguration(
        roleKey: 'admin' | 'analyst' | 'user',
        update: RoleConfigUpdate
    ): Promise<{ success: boolean; message: string }> {
        const response = await api.put(
            `/api/v1/roles/configurations/${roleKey}`,
            update
        );
        return (response.data || response) as { success: boolean; message: string };
    },

    /**
     * Reset all role configurations to defaults
     */
    async resetConfigurations(): Promise<{ success: boolean; message: string }> {
        const response = await api.post(
            '/api/v1/roles/configurations/reset',
            {}
        );
        return (response.data || response) as { success: boolean; message: string };
    },

    /**
     * Initialize role tables (run migration)
     */
    async initializeConfigurations(): Promise<{ success: boolean; message: string }> {
        const response = await api.post(
            '/api/v1/roles/configurations/initialize',
            {}
        );
        return (response.data || response) as { success: boolean; message: string };
    }
};

export default RolesApi;
