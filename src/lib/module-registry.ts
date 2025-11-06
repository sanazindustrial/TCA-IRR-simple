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
        title: 'Quick Summary',
        description: 'Executive overview with key findings and recommendations',
        category: 'core',
        requiredRole: ['user', 'admin', 'reviewer'],
        reportTypes: ['triage', 'dd'],
        frameworks: ['general', 'medtech'],
        active: true,
        priority: 1
    },
    {
        id: 'executive-summary',
        title: 'Executive Summary',
        description: 'Comprehensive executive-level analysis with detailed insights',
        category: 'core',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['triage', 'dd'],
        frameworks: ['general', 'medtech'],
        active: true,
        priority: 2
    },
    {
        id: 'tca-scorecard',
        title: 'TCA Scorecard',
        description: 'Technology Commercialization Assessment with weighted scores',
        category: 'core',
        requiredRole: ['user', 'admin', 'reviewer'],
        reportTypes: ['triage', 'dd'],
        frameworks: ['general', 'medtech'],
        active: true,
        priority: 3
    },

    // Analysis Modules - Deep analytical components
    {
        id: 'risk-flags',
        title: 'Risk Flags & Mitigation',
        description: 'Comprehensive risk assessment with mitigation strategies',
        category: 'analysis',
        requiredRole: ['user', 'admin', 'reviewer'],
        reportTypes: ['triage', 'dd'],
        frameworks: ['general', 'medtech'],
        active: true,
        priority: 4
    },
    {
        id: 'macro-trend-alignment',
        title: 'Macro Trend Alignment',
        description: 'PESTEL analysis and alignment with macro market trends',
        category: 'analysis',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['triage', 'dd'],
        frameworks: ['general', 'medtech'],
        active: true,
        priority: 5
    },
    {
        id: 'benchmark-comparison',
        title: 'Benchmark Comparison',
        description: 'Industry benchmarks and competitive positioning analysis',
        category: 'analysis',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        active: true,
        priority: 6
    },
    {
        id: 'growth-classifier',
        title: 'Growth Classifier',
        description: 'AI-powered growth potential classification and scenarios',
        category: 'analysis',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        active: true,
        priority: 7
    },
    {
        id: 'gap-analysis',
        title: 'Gap Analysis',
        description: 'Identify performance gaps and improvement roadmap',
        category: 'analysis',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        active: true,
        priority: 8
    },

    // Strategic Modules - High-level strategic insights
    {
        id: 'team-assessment',
        title: 'Team Assessment',
        description: 'Founding team analysis and organizational capabilities',
        category: 'strategic',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        active: true,
        priority: 9
    },
    {
        id: 'funder-fit-analysis',
        title: 'Funder Fit Analysis',
        description: 'Investment readiness and funder matching analysis',
        category: 'strategic',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        active: true,
        priority: 10
    },
    {
        id: 'strategic-fit-matrix',
        title: 'Strategic Fit Matrix',
        description: 'Strategic alignment and partnership fit analysis',
        category: 'strategic',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        active: true,
        priority: 11
    },

    // Compliance Modules - Regulatory and compliance-focused (MedTech specific)
    {
        id: 'regulatory-compliance',
        title: 'Regulatory Compliance Review',
        description: 'FDA and international regulatory compliance assessment',
        category: 'compliance',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['medtech'],
        active: true,
        priority: 12
    },
    {
        id: 'clinical-pathway',
        title: 'Clinical Pathway Analysis',
        description: 'Clinical trial pathway and regulatory roadmap analysis',
        category: 'compliance',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['medtech'],
        active: true,
        priority: 13
    },

    // Extended Analysis Modules (Additional detailed analysis)
    {
        id: 'competitive-landscape',
        title: 'Competitive Landscape',
        description: 'Detailed competitive analysis and positioning',
        category: 'analysis',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        active: false,
        priority: 14
    },
    {
        id: 'ip-technology-review',
        title: 'IP & Technology Review',
        description: 'Intellectual property and technology stack analysis',
        category: 'analysis',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        active: false,
        priority: 15
    },
    {
        id: 'financials-burn-rate',
        title: 'Financial Analysis & Burn Rate',
        description: 'Financial health and runway analysis',
        category: 'analysis',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        active: false,
        priority: 16
    },
    {
        id: 'gtm-strategy',
        title: 'Go-to-Market Strategy',
        description: 'GTM strategy evaluation and recommendations',
        category: 'strategic',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        active: false,
        priority: 17
    },
    {
        id: 'exit-strategy-roadmap',
        title: 'Exit Strategy & Roadmap',
        description: 'Exit potential and strategic roadmap analysis',
        category: 'strategic',
        requiredRole: ['admin', 'reviewer'],
        reportTypes: ['dd'],
        frameworks: ['general', 'medtech'],
        active: false,
        priority: 18
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
            module.requiredRole.includes(role) &&
            module.reportTypes.includes(reportType) &&
            module.frameworks.includes(framework)
        ).sort((a, b) => a.priority - b.priority);
    }

    /**
     * Get modules by category
     */
    static getModulesByCategory(
        category: ModuleConfig['category'],
        role?: UserRole,
        reportType?: ReportType,
        framework?: Framework
    ): ModuleConfig[] {
        let modules = MODULE_REGISTRY.filter(module => module.category === category);

        // Apply additional filters if provided
        if (role) {
            modules = modules.filter(module => module.requiredRole.includes(role));
        }
        if (reportType) {
            modules = modules.filter(module => module.reportTypes.includes(reportType));
        }
        if (framework) {
            modules = modules.filter(module => module.frameworks.includes(framework));
        }

        return modules.sort((a, b) => a.priority - b.priority);
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

        return module.requiredRole.includes(role) &&
            module.reportTypes.includes(reportType) &&
            module.frameworks.includes(framework);
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
            stats.modulesByCategory[module.category] = (stats.modulesByCategory[module.category] || 0) + 1;

            // Count by framework
            module.frameworks.forEach((framework: Framework) => {
                stats.modulesByFramework[framework] = (stats.modulesByFramework[framework] || 0) + 1;
            });

            // Count by report type
            module.reportTypes.forEach((reportType: ReportType) => {
                stats.modulesByReportType[reportType] = (stats.modulesByReportType[reportType] || 0) + 1;
            });
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