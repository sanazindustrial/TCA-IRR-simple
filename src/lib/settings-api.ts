/**
 * Settings Version API Client
 * Manage module configurations, TCA categories, and simulation runs with versioning
 */

import { API_CONFIG, ApiClient } from './api';

// Types matching backend models
export interface ModuleSetting {
    id?: number;
    module_id: string;
    module_name: string;
    weight: number;
    is_enabled: boolean;
    priority: number;
    settings: Record<string, any>;
    thresholds: Record<string, any>;
}

export interface TCACategory {
    id?: number;
    category_name: string;
    category_order: number;
    weight: number;
    is_active: boolean;
    description?: string;
    factors: string[];
}

export interface SettingsVersion {
    id: number;
    version_number: number;
    version_name: string;
    description?: string;
    created_by?: number;
    created_at: string;
    is_active: boolean;
    is_archived: boolean;
    module_settings?: ModuleSetting[];
    tca_categories?: TCACategory[];
}

export interface SettingsVersionCreate {
    version_name: string;
    description?: string;
    copy_from_version?: number;
}

export interface SettingsVersionUpdate {
    version_name?: string;
    description?: string;
    is_active?: boolean;
    is_archived?: boolean;
}

export interface ModuleSettingUpdate {
    weight?: number;
    is_enabled?: boolean;
    priority?: number;
    settings?: Record<string, any>;
    thresholds?: Record<string, any>;
}

export interface TCACategoryUpdate {
    weight?: number;
    is_active?: boolean;
    description?: string;
    factors?: string[];
}

export interface SimulationRun {
    id: number;
    settings_version_id: number;
    user_id?: number;
    company_name?: string;
    analysis_id?: number;
    tca_score?: number;
    module_scores: Record<string, number>;
    simulation_data: Record<string, any>;
    run_at: string;
    completed_at?: string;
    status: string;
}

export interface SimulationRunCreate {
    settings_version_id: number;
    company_name?: string;
    analysis_id?: number;
    adjusted_scores?: Record<string, any>;
}

export interface SimulationResult {
    simulation_id: number;
    tca_score: number;
    module_scores: Record<string, number>;
    settings_version: SettingsVersion;
    timestamp: string;
    status: string;
}

export interface VersionComparison {
    version_1: { id: number; name: string };
    version_2: { id: number; name: string };
    module_differences: Array<{
        module_id: string;
        version_1: { weight: number; is_enabled: boolean };
        version_2: { weight: number; is_enabled: boolean };
    }>;
    tca_category_differences: Array<{
        category_name: string;
        version_1: { weight: number; is_active: boolean };
        version_2: { weight: number; is_active: boolean };
    }>;
    total_differences: number;
}

// Default module definitions for reference
export const MODULE_DEFINITIONS = {
    tca: { name: 'TCA Scorecard', description: 'Core technology capability assessment', weight: 20, version: '2.1' },
    risk: { name: 'Risk Flags', description: 'Risk analysis across 14 domains', weight: 15, version: '1.8' },
    macro: { name: 'Macro Trend Alignment', description: 'PESTEL analysis and trend scores', weight: 10, version: '1.2' },
    benchmark: { name: 'Benchmark Comparison', description: 'Performance vs. sector averages', weight: 10, version: '1.5' },
    growth: { name: 'Growth Classifier', description: 'Predict growth potential', weight: 10, version: '3.1' },
    gap: { name: 'Gap Analysis', description: 'Identify performance gaps', weight: 10, version: '2.0' },
    founderFit: { name: 'Founder Fit Analysis', description: 'Investor matching & readiness', weight: 10, version: '1.0' },
    team: { name: 'Team Assessment', description: 'Analyze founder and team strength', weight: 10, version: '1.4' },
    strategicFit: { name: 'Strategic Fit Matrix', description: 'Align with strategic pathways', weight: 5, version: '1.1' },
    financial: { name: 'Financial Analysis', description: 'Revenue model, burn rate, and financial health', weight: 8, version: '1.0' },
    economic: { name: 'Economic Analysis', description: 'Market size, pricing, and economic viability', weight: 8, version: '1.0' },
    social: { name: 'Social Impact Analysis', description: 'ESG factors and social impact metrics', weight: 5, version: '1.0' },
    marketing: { name: 'Marketing Analysis', description: 'GTM strategy, brand positioning, and channels', weight: 5, version: '1.0' },
    environmental: { name: 'Environmental Analysis', description: 'Environmental compliance and sustainability', weight: 5, version: '1.0' },
    funder: { name: 'Funder Fit Analysis', description: 'Investor alignment and funding readiness', weight: 8, version: '1.0' },
    strategic: { name: 'Strategic Analysis', description: 'Competitive positioning and strategic roadmap', weight: 5, version: '1.0' },
    analyst: { name: 'Analyst Review', description: 'Manual analyst input, NLP analysis, and AI deviation review', weight: 5, version: '1.0' },
};

// Default 12 TCA categories
export const DEFAULT_TCA_CATEGORIES = [
    'Leadership',
    'Product-Market Fit',
    'Team Strength',
    'Technology & IP',
    'Business Model & Financials',
    'Go-to-Market Strategy',
    'Competition & Moat',
    'Market Potential',
    'Traction',
    'Scalability',
    'Risk Assessment',
    'Exit Potential',
];

/**
 * Settings API Client
 */
export class SettingsApiClient {
    private client: ApiClient;

    constructor() {
        this.client = new ApiClient();
    }

    // ===== Settings Versions =====

    /**
     * Get all settings versions
     */
    async getVersions(includeArchived = false): Promise<SettingsVersion[]> {
        const response = await this.client.get<SettingsVersion[]>(
            `/api/v1/settings/versions?include_archived=${includeArchived}`
        );
        return response.data || [];
    }

    /**
     * Get a specific settings version with all details
     */
    async getVersion(versionId: number): Promise<SettingsVersion | null> {
        const response = await this.client.get<SettingsVersion>(
            `/api/v1/settings/versions/${versionId}`
        );
        return response.data || null;
    }

    /**
     * Get the currently active settings version
     */
    async getActiveVersion(): Promise<SettingsVersion | null> {
        const response = await this.client.get<SettingsVersion>(
            `/api/v1/settings/versions/active`
        );
        return response.data || null;
    }

    /**
     * Create a new settings version
     */
    async createVersion(data: SettingsVersionCreate): Promise<SettingsVersion | null> {
        const response = await this.client.post<SettingsVersion>(
            '/api/v1/settings/versions',
            data
        );
        return response.data || null;
    }

    /**
     * Update a settings version
     */
    async updateVersion(versionId: number, data: SettingsVersionUpdate): Promise<SettingsVersion | null> {
        const response = await this.client.put<SettingsVersion>(
            `/api/v1/settings/versions/${versionId}`,
            data
        );
        return response.data || null;
    }

    /**
     * Activate a settings version
     */
    async activateVersion(versionId: number): Promise<SettingsVersion | null> {
        return this.updateVersion(versionId, { is_active: true });
    }

    /**
     * Archive a settings version
     */
    async archiveVersion(versionId: number): Promise<SettingsVersion | null> {
        return this.updateVersion(versionId, { is_archived: true });
    }

    // ===== Module Settings =====

    /**
     * Update a module setting within a version
     */
    async updateModuleSetting(
        versionId: number,
        moduleId: string,
        data: ModuleSettingUpdate
    ): Promise<ModuleSetting | null> {
        const response = await this.client.put<ModuleSetting>(
            `/api/v1/settings/versions/${versionId}/modules/${moduleId}`,
            data
        );
        return response.data || null;
    }

    // ===== TCA Categories =====

    /**
     * Get TCA categories for a specific version
     */
    async getTCACategories(versionId: number): Promise<TCACategory[]> {
        const response = await this.client.get<TCACategory[]>(
            `/api/v1/settings/versions/${versionId}/tca-categories`
        );
        return response.data || [];
    }

    /**
     * Update a TCA category setting
     */
    async updateTCACategory(
        versionId: number,
        categoryId: number,
        data: TCACategoryUpdate
    ): Promise<TCACategory | null> {
        const response = await this.client.put<TCACategory>(
            `/api/v1/settings/versions/${versionId}/tca-categories/${categoryId}`,
            data
        );
        return response.data || null;
    }

    // ===== Simulation Runs =====

    /**
     * Get simulation runs with optional filters
     */
    async getSimulationRuns(filters: {
        userId?: number;
        settingsVersionId?: number;
        limit?: number;
    } = {}): Promise<SimulationRun[]> {
        const params = new URLSearchParams();
        if (filters.userId) params.append('user_id', String(filters.userId));
        if (filters.settingsVersionId) params.append('settings_version_id', String(filters.settingsVersionId));
        if (filters.limit) params.append('limit', String(filters.limit));

        const response = await this.client.get<SimulationRun[]>(
            `/api/v1/settings/simulations?${params.toString()}`
        );
        return response.data || [];
    }

    /**
     * Run a simulation with specific settings version
     */
    async runSimulation(data: SimulationRunCreate): Promise<SimulationResult | null> {
        const response = await this.client.post<SimulationResult>(
            '/api/v1/settings/simulations',
            data
        );
        return response.data || null;
    }

    /**
     * Get a specific simulation run
     */
    async getSimulationRun(simulationId: number): Promise<SimulationRun | null> {
        const response = await this.client.get<SimulationRun>(
            `/api/v1/settings/simulations/${simulationId}`
        );
        return response.data || null;
    }

    /**
     * Compare two settings versions
     */
    async compareVersions(versionId1: number, versionId2: number): Promise<VersionComparison | null> {
        const response = await this.client.get<VersionComparison>(
            `/api/v1/settings/simulations/compare/${versionId1}/${versionId2}`
        );
        return response.data || null;
    }
}

// Export singleton instance
export const settingsApi = new SettingsApiClient();
