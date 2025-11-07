// Module registry for all available analysis modules
import type { ModuleConfig, UserRole, ReportType, Framework } from '@/components/analysis/module-configuration';

/**
 * Central registry of all available analysis modules
 * This serves as the single source of truth for module definitions
 */
export const MODULE_REGISTRY: ModuleConfig[] = [
    // Core Modules - Essential for all reports
    {
        id: 'quick-summary',
        name: 'Quick Summary',
        description: 'Executive overview with key findings and recommendations',
        category: 'core',
        requiredRole: ['user', 'admin', 'reviewer'],
        reportTypes: ['triage', 'dd'],
        frameworks: ['general', 'medtech'],
        status: 'active'
    },
    {
        id: 'executive-summary',
        name: 'Executive Summary',
        description: 'Comprehensive executive-level analysis with detailed insights',
        category: 'core',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['triage', 'dd'],
        frameworks: ['general', 'medtech'],
        status: 'active'
    },
    {
        id: 'tca-scorecard',
        name: 'TCA Scorecard',
        description: 'Technology Commercialization Assessment with weighted scores',
        category: 'core',
        requiredRole: ['user', 'admin', 'reviewer'],
        reportTypes: ['triage', 'dd'],
        frameworks: ['general', 'medtech'],
        status: 'active'
    },

    // Analysis Modules - Deep analytical components
    {
        id: 'risk-flags',
        name: 'Risk Flags & Mitigation',
        description: 'Comprehensive risk assessment with mitigation strategies',
        category: 'analysis',
        requiredRole: ['user', 'admin', 'reviewer'],
        reportTypes: ['triage', 'dd'],
        frameworks: ['general', 'medtech'],
        status: 'active'
    },
    {
        id: 'macro-trend-alignment',
        name: 'Macro Trend Alignment',
        description: 'PESTEL analysis and alignment with macro market trends',
        category: 'analysis',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['triage', 'dd'],
        frameworks: ['general', 'medtech'],
        status: 'active'
    },
    {
        id: 'benchmark-comparison',
        name: 'Benchmark Comparison',
        description: 'Industry benchmarks and competitive positioning analysis',
        category: 'analysis',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        status: 'active'
    },
    {
        id: 'growth-classifier',
        name: 'Growth Classifier',
        description: 'AI-powered growth potential classification and scenarios',
        category: 'analysis',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        status: 'active'
    },
    {
        id: 'gap-analysis',
        name: 'Gap Analysis',
        description: 'Identify performance gaps and improvement roadmap',
        category: 'analysis',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        status: 'active'
    },

    // Strategic Modules - High-level strategic insights
    {
        id: 'team-assessment',
        name: 'Team Assessment',
        description: 'Founding team analysis and organizational capabilities',
        category: 'strategic',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        status: 'active'
    },
    {
        id: 'funder-fit-analysis',
        name: 'Funder Fit Analysis',
        description: 'Investment readiness and funder matching analysis',
        category: 'strategic',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        status: 'active'
    },
    {
        id: 'strategic-fit-matrix',
        name: 'Strategic Fit Matrix',
        description: 'Strategic alignment and partnership fit analysis',
        category: 'strategic',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        status: 'active'
    },

    // Compliance Modules - Regulatory and compliance-focused (MedTech specific)
    {
        id: 'regulatory-compliance',
        name: 'Regulatory Compliance Review',
        description: 'FDA and international regulatory compliance assessment',
        category: 'compliance',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['medtech'],
        status: 'active'
    },
    {
        id: 'clinical-pathway',
        name: 'Clinical Pathway Analysis',
        description: 'Clinical trial pathway and regulatory roadmap analysis',
        category: 'compliance',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['medtech'],
        status: 'active'
    },

    // Extended Analysis Modules (Additional detailed analysis)
    {
        id: 'competitive-landscape',
        name: 'Competitive Landscape',
        description: 'Detailed competitive analysis and positioning',
        category: 'analysis',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        status: 'inactive'
    },
    {
        id: 'ip-technology-review',
        name: 'IP & Technology Review',
        description: 'Intellectual property and technology stack analysis',
        category: 'analysis',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        status: 'inactive'
    },
    {
        id: 'financials-burn-rate',
        name: 'Financial Analysis & Burn Rate',
        description: 'Financial health and runway analysis',
        category: 'analysis',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        status: 'inactive'
    },
    {
        id: 'gtm-strategy',
        name: 'Go-to-Market Strategy',
        description: 'GTM strategy evaluation and recommendations',
        category: 'strategic',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        status: 'inactive'
    },
    {
        id: 'exit-strategy-roadmap',
        name: 'Exit Strategy & Roadmap',
        description: 'Exit potential and strategic roadmap analysis',
        category: 'strategic',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        status: 'inactive'
    }
];

/**
 * Module utility functions
 */
export class ModuleRegistry {
    /**
     * Get all modules filtered by context
     */
    static getModulesForContext(
        role: UserRole,
        reportType: ReportType,
        framework: Framework
    ): ModuleConfig[] {
        return MODULE_REGISTRY.filter(module =>
            module.requiredRole && module.requiredRole.includes(role) &&
            module.reportTypes && module.reportTypes.includes(reportType) &&
            module.frameworks && module.frameworks.includes(framework)
        );
    }

    /**
     * Get modules by category
     */
    static getModulesByCategory(
        category: string,
        role?: UserRole,
        reportType?: ReportType,
        framework?: Framework
    ): ModuleConfig[] {
        let modules = MODULE_REGISTRY.filter(module => module.category === category);

        // Apply additional filters if provided
        if (role && modules.length > 0) {
            modules = modules.filter(module => module.requiredRole && module.requiredRole.includes(role));
        }
        if (reportType && modules.length > 0) {
            modules = modules.filter(module => module.reportTypes && module.reportTypes.includes(reportType));
        }
        if (framework && modules.length > 0) {
            modules = modules.filter(module => module.frameworks && module.frameworks.includes(framework));
        }

        return modules;
    }

    /**
     * Get module by ID
     */
    static getModuleById(id: string): ModuleConfig | undefined {
        return MODULE_REGISTRY.find(module => module.id === id);
    }

    /**
     * Check if module is available for context
     */
    static isModuleAvailable(
        moduleId: string,
        role: UserRole,
        reportType: ReportType,
        framework: Framework
    ): boolean {
        const module = this.getModuleById(moduleId);
        if (!module) return false;

        return (!module.requiredRole || module.requiredRole.includes(role)) &&
            (!module.reportTypes || module.reportTypes.includes(reportType)) &&
            (!module.frameworks || module.frameworks.includes(framework));
    }

    /**
     * Get core modules (always required)
     */
    static getCoreModules(
        role: UserRole,
        reportType: ReportType,
        framework: Framework
    ): ModuleConfig[] {
        return this.getModulesByCategory('core', role, reportType, framework);
    }

    /**
     * Get recommended modules for a context
     */
    static getRecommendedModules(
        role: UserRole,
        reportType: ReportType,
        framework: Framework
    ): string[] {
        const isPrivileged = role === 'admin' || role === 'reviewer';

        if (reportType === 'triage') {
            return isPrivileged
                ? ['quick-summary', 'executive-summary', 'tca-scorecard', 'risk-flags', 'macro-trend-alignment']
                : ['quick-summary', 'tca-scorecard', 'risk-flags'];
        } else { // dd
            const base = [
                'quick-summary', 'executive-summary', 'tca-scorecard', 'risk-flags',
                'macro-trend-alignment', 'benchmark-comparison', 'growth-classifier',
                'gap-analysis', 'team-assessment', 'funder-fit-analysis', 'strategic-fit-matrix'
            ];

            if (framework === 'medtech') {
                base.push('regulatory-compliance', 'clinical-pathway');
            }

            return base;
        }
    }

    /**
     * Validate module configuration
     */
    static validateModuleIds(moduleIds: string[]): { valid: string[]; invalid: string[] } {
        const valid: string[] = [];
        const invalid: string[] = [];

        moduleIds.forEach(id => {
            if (this.getModuleById(id)) {
                valid.push(id);
            } else {
                invalid.push(id);
            }
        });

        return { valid, invalid };
    }

    /**
     * Get module statistics
     */
    static getModuleStats(): {
        totalModules: number;
        modulesByCategory: Record<string, number>;
        modulesByFramework: Record<string, number>;
        modulesByReportType: Record<string, number>;
    } {
        const stats = {
            totalModules: MODULE_REGISTRY.length,
            modulesByCategory: {} as Record<string, number>,
            modulesByFramework: {} as Record<string, number>,
            modulesByReportType: {} as Record<string, number>
        };

        MODULE_REGISTRY.forEach(module => {
            // Count by category
            if (module.category) {
                stats.modulesByCategory[module.category] = (stats.modulesByCategory[module.category] || 0) + 1;
            }

            // Count by framework
            if (module.frameworks) {
                module.frameworks.forEach((framework: Framework) => {
                    stats.modulesByFramework[framework] = (stats.modulesByFramework[framework] || 0) + 1;
                });
            }

            // Count by report type
            if (module.reportTypes) {
                module.reportTypes.forEach((reportType: ReportType) => {
                    stats.modulesByReportType[reportType] = (stats.modulesByReportType[reportType] || 0) + 1;
                });
            }
        });

        return stats;
    }
}

/**
 * Component mapping for dynamic imports
 * This would be used for dynamic component loading
 */
export const MODULE_COMPONENTS: Record<string, () => Promise<any>> = {
    'quick-summary': () => import('@/components/evaluation/quick-summary'),
    'executive-summary': () => import('@/components/evaluation/executive-summary'),
    'tca-scorecard': () => import('@/components/evaluation/tca-scorecard'),
    'risk-flags': () => import('@/components/evaluation/risk-flags'),
    'macro-trend-alignment': () => import('@/components/evaluation/macro-trend-alignment'),
    'benchmark-comparison': () => import('@/components/evaluation/benchmark-comparison'),
    'growth-classifier': () => import('@/components/evaluation/growth-classifier'),
    'gap-analysis': () => import('@/components/evaluation/gap-analysis'),
    'team-assessment': () => import('@/components/evaluation/team-assessment'),
    'funder-fit-analysis': () => import('@/components/evaluation/funder-fit-analysis'),
    'strategic-fit-matrix': () => import('@/components/evaluation/strategic-fit-matrix'),
    'regulatory-compliance': () => import('@/components/evaluation/regulatory-compliance-review'),
    'competitive-landscape': () => import('@/components/evaluation/competitive-landscape'),
    'ip-technology-review': () => import('@/components/evaluation/ip-technology-review'),
    'financials-burn-rate': () => import('@/components/evaluation/financials-burn-rate'),
    'gtm-strategy': () => import('@/components/evaluation/gtm-strategy'),
    'exit-strategy-roadmap': () => import('@/components/evaluation/exit-strategy-roadmap')
};

export default ModuleRegistry;
