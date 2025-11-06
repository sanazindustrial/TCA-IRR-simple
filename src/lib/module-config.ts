// Configuration management utilities for analysis modules
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { UserRole, ReportType, Framework } from '@/components/analysis/module-configuration';

export interface ModuleConfig {
    id: string;
    title: string;
    description: string;
    category: 'core' | 'analysis' | 'compliance' | 'strategic';
    requiredRole: UserRole[];
    reportTypes: ReportType[];
    frameworks: Framework[];
    active: boolean;
    priority: number;
    component?: string;
}

export interface ReportSection {
    id: string;
    title: string;
    active: boolean;
}

// Configuration storage keys
export const CONFIG_KEYS = {
    TRIAGE_STANDARD: 'report-config-triage-standard',
    TRIAGE_ADMIN: 'report-config-triage-admin',
    DD_GENERAL: 'report-config-dd-general',
    DD_MEDTECH: 'report-config-dd-medtech',
    USER_PREFERENCES: 'user-module-preferences',
    LAST_FRAMEWORK: 'last-selected-framework',
    LAST_REPORT_TYPE: 'last-selected-report-type'
} as const;

// Default module configurations for different contexts
export const DEFAULT_CONFIGS: Record<string, string[]> = {
    'triage-standard': [
        'quick-summary',
        'tca-scorecard',
        'risk-flags'
    ],
    'triage-admin': [
        'quick-summary',
        'executive-summary',
        'tca-scorecard',
        'risk-flags',
        'macro-trend-alignment'
    ],
    'dd-general': [
        'quick-summary',
        'executive-summary',
        'tca-scorecard',
        'risk-flags',
        'macro-trend-alignment',
        'benchmark-comparison',
        'growth-classifier',
        'gap-analysis',
        'team-assessment',
        'funder-fit-analysis',
        'strategic-fit-matrix'
    ],
    'dd-medtech': [
        'quick-summary',
        'executive-summary',
        'tca-scorecard',
        'risk-flags',
        'macro-trend-alignment',
        'benchmark-comparison',
        'growth-classifier',
        'gap-analysis',
        'team-assessment',
        'funder-fit-analysis',
        'strategic-fit-matrix',
        'regulatory-compliance',
        'clinical-pathway'
    ]
};

// Configuration utilities
export class ConfigurationManager {
    /**
     * Get the configuration key based on user context
     */
    static getConfigKey(role: UserRole, reportType: ReportType, framework?: Framework): string {
        const isPrivileged = role === 'admin' || role === 'reviewer';

        if (reportType === 'triage') {
            return isPrivileged ? CONFIG_KEYS.TRIAGE_ADMIN : CONFIG_KEYS.TRIAGE_STANDARD;
        } else {
            return framework === 'medtech' ? CONFIG_KEYS.DD_MEDTECH : CONFIG_KEYS.DD_GENERAL;
        }
    }

    /**
     * Get default configuration for context
     */
    static getDefaultConfig(role: UserRole, reportType: ReportType, framework?: Framework): string[] {
        const isPrivileged = role === 'admin' || role === 'reviewer';

        if (reportType === 'triage') {
            return DEFAULT_CONFIGS[isPrivileged ? 'triage-admin' : 'triage-standard'];
        } else {
            return DEFAULT_CONFIGS[framework === 'medtech' ? 'dd-medtech' : 'dd-general'];
        }
    }

    /**
     * Load saved configuration from localStorage
     */
    static loadConfiguration(role: UserRole, reportType: ReportType, framework?: Framework): ReportSection[] {
        const configKey = this.getConfigKey(role, reportType, framework);

        try {
            const savedConfig = localStorage.getItem(configKey);
            if (savedConfig) {
                return JSON.parse(savedConfig);
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
        }

        // Return default configuration if none saved
        const defaultModules = this.getDefaultConfig(role, reportType, framework);
        return defaultModules.map(id => ({
            id,
            title: this.getModuleTitle(id),
            active: true
        }));
    }

    /**
     * Save configuration to localStorage
     */
    static saveConfiguration(
        role: UserRole,
        reportType: ReportType,
        framework: Framework,
        sections: ReportSection[]
    ): void {
        const configKey = this.getConfigKey(role, reportType, framework);

        try {
            localStorage.setItem(configKey, JSON.stringify(sections));
        } catch (error) {
            console.error('Error saving configuration:', error);
            throw new Error('Failed to save configuration');
        }
    }

    /**
     * Reset configuration to defaults
     */
    static resetToDefaults(role: UserRole, reportType: ReportType, framework?: Framework): ReportSection[] {
        const defaultModules = this.getDefaultConfig(role, reportType, framework);
        const sections = defaultModules.map(id => ({
            id,
            title: this.getModuleTitle(id),
            active: true
        }));

        // Save the reset configuration
        if (framework) {
            this.saveConfiguration(role, reportType, framework, sections);
        }

        return sections;
    }

    /**
     * Get module title from ID
     */
    static getModuleTitle(id: string): string {
        const titles: Record<string, string> = {
            'quick-summary': 'Quick Summary',
            'executive-summary': 'Executive Summary',
            'tca-scorecard': 'TCA Scorecard',
            'risk-flags': 'Risk Flags & Mitigation',
            'macro-trend-alignment': 'Macro Trend Alignment',
            'benchmark-comparison': 'Benchmark Comparison',
            'growth-classifier': 'Growth Classifier',
            'gap-analysis': 'Gap Analysis',
            'team-assessment': 'Team Assessment',
            'funder-fit-analysis': 'Funder Fit Analysis',
            'strategic-fit-matrix': 'Strategic Fit Matrix',
            'regulatory-compliance': 'Regulatory Compliance Review',
            'clinical-pathway': 'Clinical Pathway Analysis'
        };

        return titles[id] || id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Validate configuration against available modules
     */
    static validateConfiguration(
        sections: ReportSection[],
        availableModules: ModuleConfig[]
    ): ReportSection[] {
        const availableIds = new Set(availableModules.map(m => m.id));
        return sections.filter(section => availableIds.has(section.id));
    }

    /**
     * Merge configurations (useful for updates)
     */
    static mergeConfigurations(
        existing: ReportSection[],
        defaults: ReportSection[]
    ): ReportSection[] {
        const existingMap = new Map(existing.map(s => [s.id, s]));

        return defaults.map(defaultSection => {
            const existingSection = existingMap.get(defaultSection.id);
            return existingSection || defaultSection;
        });
    }

    /**
     * Export configuration for backup
     */
    static exportAllConfigurations(): Record<string, ReportSection[]> {
        const configs: Record<string, ReportSection[]> = {};

        Object.values(CONFIG_KEYS).forEach(key => {
            if (key === CONFIG_KEYS.USER_PREFERENCES || key === CONFIG_KEYS.LAST_FRAMEWORK || key === CONFIG_KEYS.LAST_REPORT_TYPE) {
                return; // Skip non-configuration keys
            }

            try {
                const config = localStorage.getItem(key);
                if (config) {
                    configs[key] = JSON.parse(config);
                }
            } catch (error) {
                console.error(`Error exporting configuration for ${key}:`, error);
            }
        });

        return configs;
    }

    /**
     * Import configuration from backup
     */
    static importConfigurations(configs: Record<string, ReportSection[]>): void {
        Object.entries(configs).forEach(([key, config]) => {
            if (Object.values(CONFIG_KEYS).includes(key as any)) {
                try {
                    localStorage.setItem(key, JSON.stringify(config));
                } catch (error) {
                    console.error(`Error importing configuration for ${key}:`, error);
                }
            }
        });
    }

    /**
     * Get user preferences
     */
    static getUserPreferences(): { lastFramework?: Framework; lastReportType?: ReportType } {
        try {
            const lastFramework = localStorage.getItem(CONFIG_KEYS.LAST_FRAMEWORK) as Framework;
            const lastReportType = localStorage.getItem(CONFIG_KEYS.LAST_REPORT_TYPE) as ReportType;

            return {
                lastFramework: lastFramework || undefined,
                lastReportType: lastReportType || undefined
            };
        } catch (error) {
            console.error('Error loading user preferences:', error);
            return {};
        }
    }

    /**
     * Save user preferences
     */
    static saveUserPreferences(framework?: Framework, reportType?: ReportType): void {
        try {
            if (framework) {
                localStorage.setItem(CONFIG_KEYS.LAST_FRAMEWORK, framework);
            }
            if (reportType) {
                localStorage.setItem(CONFIG_KEYS.LAST_REPORT_TYPE, reportType);
            }
        } catch (error) {
            console.error('Error saving user preferences:', error);
        }
    }
}

// Hook for using configuration manager in React components
export function useModuleConfiguration(role: UserRole, reportType: ReportType, framework: Framework) {
    const [sections, setSections] = useState<ReportSection[]>(() =>
        ConfigurationManager.loadConfiguration(role, reportType, framework)
    );

    useEffect(() => {
        setSections(ConfigurationManager.loadConfiguration(role, reportType, framework));
    }, [role, reportType, framework]);

    const saveConfiguration = useCallback((newSections: ReportSection[]) => {
        ConfigurationManager.saveConfiguration(role, reportType, framework, newSections);
        setSections(newSections);
    }, [role, reportType, framework]);

    const resetToDefaults = useCallback(() => {
        const defaultSections = ConfigurationManager.resetToDefaults(role, reportType, framework);
        setSections(defaultSections);
        return defaultSections;
    }, [role, reportType, framework]);

    return {
        sections,
        setSections,
        saveConfiguration,
        resetToDefaults
    };
}

export default ConfigurationManager;