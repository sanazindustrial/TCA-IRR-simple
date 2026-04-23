/**
 * HealthService – comprehensive service monitor and keep-alive heartbeat.
 *
 * Responsibilities:
 *  1. Keep-alive heartbeat  – pings /health every 30 s so Azure App Service
 *     never cold-starts on a real request.
 *  2. Full sweep            – checks every registered service every 90 s and
 *     immediately after the first heartbeat.
 *  3. Module monitoring     – derives the status of all 17 analysis modules
 *     from the single /api/v1/tca/system-status response (one network call).
 *  4. Pub/sub               – any React hook/component can subscribe to the
 *     aggregated ServiceReport and re-render on change.
 */

// ─── Public types ────────────────────────────────────────────────────────────

export type ServiceStatus = 'checking' | 'healthy' | 'degraded' | 'down';

export type ServiceGroupId =
    | 'core'
    | 'auth'
    | 'analysis'
    | 'modules'
    | 'reports'
    | 'workflow'
    | 'data'
    | 'admin'
    | 'communication'
    | 'extraction'
    | 'ai';

export interface ServiceDef {
    id: string;
    label: string;
    group: ServiceGroupId;
    /** Full URL path (appended to baseURL) – or a function that receives baseURL */
    path: string;
    /** Some endpoints only make sense when the user is authenticated */
    requiresAuth?: boolean;
    /** Optional/non-critical endpoints: 404 returns 'checking' rather than 'degraded' */
    optional?: boolean;
}

export interface ServiceResult {
    def: ServiceDef;
    status: ServiceStatus;
    /** HTTP status code or -1 for network error */
    code: number;
    /** Response time in ms */
    latencyMs: number;
    checkedAt: string;
}

export interface GroupResult {
    id: ServiceGroupId;
    label: string;
    status: ServiceStatus;
    services: ServiceResult[];
}

export interface ServiceReport {
    overall: ServiceStatus;
    groups: GroupResult[];
    checkedAt: string;
}

type ReportListener = (report: ServiceReport) => void;

// ─── The 17 analysis module IDs (match directory names) ─────────────────────

const MODULE_IDS = [
    'analyst', 'benchmark', 'economic', 'environmental',
    'financial', 'founderFit', 'funder', 'gap',
    'growth', 'macro', 'marketing', 'risk',
    'social', 'strategic', 'strategicFit', 'tca', 'team',
] as const;

const MODULE_LABELS: Record<typeof MODULE_IDS[number], string> = {
    analyst:      'Analyst',
    benchmark:    'Benchmark',
    economic:     'Economic',
    environmental:'Environmental',
    financial:    'Financial',
    founderFit:   'Founder Fit',
    funder:       'Funder',
    gap:          'Gap Analysis',
    growth:       'Growth',
    macro:        'Macro',
    marketing:    'Marketing',
    risk:         'Risk Flags',
    social:       'Social Impact',
    strategic:    'Strategic',
    strategicFit: 'Strategic Fit',
    tca:          'TCA Scorecard',
    team:         'Team',
};

// ─── Group metadata ──────────────────────────────────────────────────────────

const GROUP_LABELS: Record<ServiceGroupId, string> = {
    core:          'Core API',
    auth:          'Auth Service',
    analysis:      'Analysis Engine',
    modules:       'Analysis Modules (17)',
    reports:       'Report Services (Triage · DD · SSD)',
    workflow:      'Reviewer & Analyst Workflow',
    data:          'Data Services',
    admin:         'Admin Services',
    communication: 'Communication',
    extraction:    'File & Text Extraction',
    ai:            'AI Agents',
};

// ─── Service definitions ─────────────────────────────────────────────────────

const SERVICES: ServiceDef[] = [
    // ── Core ──
    { id: 'api-health',    label: 'Backend Health',    group: 'core', path: '/health' },
    // tca/system-status requires auth – 401 is treated as 'healthy' (service alive)
    { id: 'tca-status',    label: 'TCA System Status', group: 'core', path: '/api/v1/tca/system-status', requiresAuth: true },

    // ── Auth ──
    { id: 'auth-me',           label: 'Auth / Session',   group: 'auth', path: '/api/v1/auth/me',              requiresAuth: true },
    { id: 'auth-refresh-svc',  label: 'Token Refresh',    group: 'auth', path: '/api/v1/auth/refresh',         requiresAuth: true, optional: true },
    // POST-only; GET → 405 (service alive)
    { id: 'auth-register-svc', label: 'Registration',     group: 'auth', path: '/api/v1/auth/register',        optional: true },
    { id: 'auth-login-svc',    label: 'Login',            group: 'auth', path: '/api/v1/auth/login',           optional: true },

    // ── Analysis engine ──
    // GET /api/v1/analysis/ lists analyses (auth required)
    { id: 'analysis-list-svc', label: 'Analysis List',    group: 'analysis', path: '/api/v1/analysis/',              requiresAuth: true, optional: true },
    // POST-only endpoints – GET returns 405 (service alive) or 401 (auth required); mark optional
    { id: 'analysis-svc',      label: 'Analysis Engine',  group: 'analysis', path: '/api/v1/analysis/comprehensive', requiresAuth: true, optional: true },
    { id: 'tca-quick',         label: 'TCA Quick',        group: 'analysis', path: '/api/v1/tca/quick',              requiresAuth: true, optional: true },
    { id: 'tca-sector',        label: 'TCA Sector',       group: 'analysis', path: '/api/v1/tca/sector-analysis',    requiresAuth: true, optional: true },
    { id: 'tca-batch',         label: 'TCA Batch',        group: 'analysis', path: '/api/v1/tca/batch',              requiresAuth: true, optional: true },

    // ── 17 modules (status derived from /api/v1/tca/system-status in sweep) ──
    ...MODULE_IDS.map((mod) => ({
        id:    `module-${mod}`,
        label: MODULE_LABELS[mod],
        group: 'modules' as ServiceGroupId,
        path:  `/api/v1/modules/${mod}/status`,
        requiresAuth: true,
    })),

    // ── Data services ──
    { id: 'reports-svc',      label: 'Reports',             group: 'data', path: '/api/v1/reports',                  requiresAuth: true },
    // Use trailing slash to avoid a 307 redirect that Azure may not proxy cross-origin
    { id: 'companies-svc',    label: 'Companies',           group: 'data', path: '/api/v1/companies/',               requiresAuth: true },
    // GET /api/v1/evaluations has no handler (POST-only root) – mark optional
    { id: 'evaluations-svc',  label: 'Evaluations',         group: 'data', path: '/api/v1/evaluations',              requiresAuth: true, optional: true },
    { id: 'investments-svc',  label: 'Investments',         group: 'data', path: '/api/v1/investments/',             requiresAuth: true, optional: true },

    // ── File & text extraction ──
    // All POST-only; GET returns 405 (service alive) – mark optional
    { id: 'extraction-validate-svc',   label: 'Extraction Validate',      group: 'extraction', path: '/api/v1/extraction/validate',               requiresAuth: true, optional: true },
    { id: 'extraction-reprocess-svc',  label: 'Extraction Reprocess',     group: 'extraction', path: '/api/v1/extraction/reprocess',              requiresAuth: true, optional: true },
    { id: 'extract-text-svc',          label: 'Text Extraction',          group: 'extraction', path: '/api/v1/analysis/extract-text-from-file',   requiresAuth: true, optional: true },
    { id: 'extract-info-svc',          label: 'Company Info Extraction',  group: 'extraction', path: '/api/v1/analysis/extract-company-info',     requiresAuth: true, optional: true },
    { id: 'files-upload-svc',          label: 'File Upload',              group: 'extraction', path: '/api/v1/files/upload',                      requiresAuth: true, optional: true },
    { id: 'files-extract-text-svc',    label: 'Files Extract Text',       group: 'extraction', path: '/api/v1/files/extract-text',                requiresAuth: true, optional: true },

    // ── Admin / config ──
    // cost/summary/public is unauthenticated and available to all
    { id: 'cost-public-svc',    label: 'Cost (Public)',        group: 'admin', path: '/api/v1/cost/summary/public'                              },
    { id: 'cost-summary-svc',   label: 'Cost Summary',         group: 'admin', path: '/api/v1/cost/summary',          requiresAuth: true, optional: true },
    { id: 'cost-usage-svc',     label: 'Cost Usage',           group: 'admin', path: '/api/v1/cost/usage',            requiresAuth: true, optional: true },
    { id: 'cost-budget-svc',    label: 'Cost Budget',          group: 'admin', path: '/api/v1/cost/budget',           requiresAuth: true, optional: true },
    { id: 'settings-svc',       label: 'Settings/Config',      group: 'admin', path: '/api/v1/settings/versions',     requiresAuth: true, optional: true },
    // Trailing slash avoids 307 redirect that may not be proxied correctly on Azure
    { id: 'users-svc',          label: 'Users',                group: 'admin', path: '/api/v1/users/',                requiresAuth: true },
    { id: 'users-export-svc',   label: 'User Export',          group: 'admin', path: '/api/v1/users/export',          requiresAuth: true, optional: true },
    // GET /roles has no handler – use /configurations sub-path
    { id: 'roles-svc',          label: 'Role Configurations',  group: 'admin', path: '/api/v1/roles/configurations',  requiresAuth: true },
    { id: 'dashboard-stats-svc',label: 'Dashboard Stats',      group: 'admin', path: '/api/v1/dashboard/stats',       requiresAuth: true, optional: true },
    { id: 'dashboard-charts-svc', label: 'Dashboard Charts',    group: 'admin', path: '/api/v1/dashboard/charts',      requiresAuth: true, optional: true },
    { id: 'dashboard-health-svc', label: 'Dashboard Health',    group: 'admin', path: '/api/v1/dashboard/health',      requiresAuth: true, optional: true },
    // admin.py endpoints – all require admin role; 403 for non-admin → treated as 'healthy'
    { id: 'admin-health-svc',       label: 'Admin Health',           group: 'admin', path: '/api/v1/admin/health',               requiresAuth: true },
    { id: 'admin-status-svc',       label: 'Admin System Status',    group: 'admin', path: '/api/v1/admin/system-status',        requiresAuth: true, optional: true },
    { id: 'admin-audit-svc',        label: 'Audit Logs',             group: 'admin', path: '/api/v1/admin/audit-logs',           requiresAuth: true, optional: true },
    { id: 'admin-security-svc',     label: 'Security Events',        group: 'admin', path: '/api/v1/admin/security-events',      requiresAuth: true, optional: true },
    { id: 'admin-governance-svc',   label: 'Governance Policies',    group: 'admin', path: '/api/v1/admin/governance-policies',  requiresAuth: true, optional: true },
    { id: 'admin-logs-svc',         label: 'Admin Logs',             group: 'admin', path: '/api/v1/admin/logs',                 requiresAuth: true, optional: true },

    // ── Report services – one entry per report type ──────────────────────────
    // Triage uses extract-company-info; DD uses comprehensive; SSD has its own service
    { id: 'report-triage-svc',     label: 'Triage Report Engine',          group: 'reports', path: '/api/v1/analysis/extract-company-info',     requiresAuth: true, optional: true },
    { id: 'report-dd-svc',         label: 'Due Diligence Report Engine',   group: 'reports', path: '/api/v1/analysis/comprehensive',            requiresAuth: true, optional: true },
    { id: 'report-ssd-svc',        label: 'SSD Report Engine',             group: 'reports', path: '/api/v1/ssd/evaluate',                     requiresAuth: true, optional: true },
    // SSD audit endpoints (GET-capable)
    { id: 'ssd-audit-logs-svc',    label: 'SSD Audit Logs',                group: 'reports', path: '/api/v1/ssd/audit/logs',                   requiresAuth: true, optional: true },
    { id: 'ssd-audit-stats-svc',   label: 'SSD Audit Stats',               group: 'reports', path: '/api/v1/ssd/audit/stats',                  requiresAuth: true, optional: true },

    // ── Reviewer & Analyst workflow ──────────────────────────────────────────
    // /api/v1/requests handles analyst review & approval of user requests
    { id: 'reviewer-svc',          label: 'Reviewer Service',              group: 'workflow', path: '/api/v1/requests',                         requiresAuth: true },
    // Analyst workflow – list analyses produced by the analyst role
    { id: 'analyst-workflow-svc',  label: 'Analyst Workflow',              group: 'workflow', path: '/api/v1/analysis/',                        requiresAuth: true, optional: true },
    // Unified record tracking sync used across all report workflows
    { id: 'records-sync-svc',      label: 'Records Sync',                  group: 'workflow', path: '/api/v1/records/sync',                    requiresAuth: true, optional: true },

    // ── Communication ──
    // /api/v1/auth/email/status lives under the /auth router
    { id: 'email-svc',     label: 'Email Service',    group: 'communication', path: '/api/v1/auth/email/status', requiresAuth: true, optional: true },

    // ── AI Agent services (optional – may not be deployed) ──
    { id: 'ai-analysis-svc',       label: 'AI Analysis Agent',             group: 'ai', path: '/api/v1/analysis/ai-extract',            requiresAuth: true, optional: true },
    { id: 'ai-multi-agent-svc',    label: 'Multi-Agent Orchestrator',      group: 'ai', path: '/api/v1/analysis/ai-orchestrate',        requiresAuth: true, optional: true },
];

// ─── Constants ───────────────────────────────────────────────────────────────

const HEARTBEAT_MS  = 30_000; // 30 s  – keep-alive ping to prevent cold start
const SWEEP_MS      = 90_000; // 90 s  – full service check interval
const PING_TIMEOUT  =  8_000; // 8 s   – per-request timeout

// ─── HealthService singleton ─────────────────────────────────────────────────

class HealthService {
    private static _instance: HealthService | null = null;

    private readonly baseURL: string;
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private sweepTimer:     ReturnType<typeof setInterval> | null = null;
    private listeners: Set<ReportListener> = new Set();

    /** Last known report – serves new subscribers immediately */
    private lastReport: ServiceReport = {
        overall: 'checking',
        groups: [],
        checkedAt: new Date().toISOString(),
    };

    private constructor() {
        this.baseURL =
            process.env.NEXT_PUBLIC_API_URL ||
            'https://tcairrapiccontainer.azurewebsites.net';
    }

    static getInstance(): HealthService {
        if (!HealthService._instance) {
            HealthService._instance = new HealthService();
        }
        return HealthService._instance;
    }

    // ── Pub/sub ──────────────────────────────────────────────────────────────

    subscribe(listener: ReportListener): () => void {
        this.listeners.add(listener);
        listener(this.lastReport); // immediate snapshot
        return () => this.listeners.delete(listener);
    }

    getReport(): ServiceReport {
        return this.lastReport;
    }

    /** Convenience: returns top-level status */
    getStatus(): ServiceStatus {
        return this.lastReport.overall;
    }

    private emit(report: ServiceReport) {
        this.lastReport = report;
        this.listeners.forEach((l) => l(report));
    }

    // ── Token helper ─────────────────────────────────────────────────────────

    private getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('authToken');
    }

    // ── Single service ping ───────────────────────────────────────────────────

    private async pingService(def: ServiceDef): Promise<ServiceResult> {
        const token = this.getToken();
        if (def.requiresAuth && !token) {
            // User not logged in – report as checking rather than down
            return {
                def,
                status: 'checking',
                code: 0,
                latencyMs: 0,
                checkedAt: new Date().toISOString(),
            };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);
        const t0 = Date.now();

        try {
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${this.baseURL}${def.path}`, {
                method: 'GET',
                headers,
                signal: controller.signal,
                cache: 'no-store',
            });

            clearTimeout(timeoutId);
            const latencyMs = Date.now() - t0;

            // 200-399 → healthy; 401/403 → service alive (needs auth); 500+ → down
            // 404/405 on optional endpoints → 'checking' (not deployed/available yet)
            // 405 on any endpoint → 'healthy' (service is up, just wrong HTTP method for ping)
            // 404 on required endpoints → 'degraded'
            let status: ServiceStatus;
            if (res.status >= 200 && res.status < 400) {
                status = 'healthy';
            } else if (res.status === 401 || res.status === 403) {
                // Service is alive, just needs fresh auth
                status = 'healthy';
            } else if (res.status === 405) {
                // Method Not Allowed – service is alive, endpoint is POST-only
                status = 'healthy';
            } else if (res.status >= 500) {
                status = 'down';
            } else if ((res.status === 404 || res.status === 422) && def.optional) {
                // Optional endpoint not yet deployed – treat as not-available, not degraded
                status = 'checking';
            } else if (res.status === 404 && !def.optional) {
                status = 'degraded';
            } else {
                // Other 4xx on optional endpoints → checking; required → degraded
                status = def.optional ? 'checking' : 'degraded';
            }

            return { def, status, code: res.status, latencyMs, checkedAt: new Date().toISOString() };
        } catch {
            clearTimeout(timeoutId);
            return {
                def,
                status: 'down',
                code: -1,
                latencyMs: Date.now() - t0,
                checkedAt: new Date().toISOString(),
            };
        }
    }

    // ── Keep-alive heartbeat (fast path) ─────────────────────────────────────

    async ping(): Promise<void> {
        const result = await this.pingService(SERVICES[0]); // /health
        // Update overall status without a full sweep
        const updated: ServiceReport = {
            ...this.lastReport,
            overall: result.status,
            checkedAt: result.checkedAt,
        };
        this.emit(updated);
    }

    // ── Full sweep of all services ────────────────────────────────────────────

    async sweep(): Promise<void> {
        // First check TCA system-status – it contains module-level data
        const tcaSystemStatus = await this.fetchTCASystemStatus();

        // Run all pings concurrently (with a soft cap via chunking to avoid flooding)
        const results = await this.runAll(tcaSystemStatus);

        const groupMap = new Map<ServiceGroupId, ServiceResult[]>();
        for (const r of results) {
            const arr = groupMap.get(r.def.group) ?? [];
            arr.push(r);
            groupMap.set(r.def.group, arr);
        }

        const groups: GroupResult[] = (Object.keys(GROUP_LABELS) as ServiceGroupId[]).map((gid) => {
            const services = groupMap.get(gid) ?? [];
            return {
                id: gid,
                label: GROUP_LABELS[gid],
                status: this.aggregate(services.map((s) => s.status)),
                services,
            };
        });

        const overall = this.aggregate(groups.map((g) => g.status));
        this.emit({ overall, groups, checkedAt: new Date().toISOString() });
    }

    /** Fetch TCA system status and return module-level flags (best-effort) */
    private async fetchTCASystemStatus(): Promise<Record<string, boolean>> {
        try {
            const token = this.getToken();
            // Skip the request when unauthenticated to avoid a 401 console error
            if (!token) return {};
            const controller = new AbortController();
            setTimeout(() => controller.abort(), PING_TIMEOUT);
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${this.baseURL}/api/v1/tca/system-status`, {
                headers,
                signal: controller.signal,
                cache: 'no-store',
            });
            if (!res.ok) return {};
            const data = await res.json();
            // Expect { modules: { financial: { status: 'active' }, ... } }
            const moduleFlags: Record<string, boolean> = {};
            if (data?.modules) {
                for (const [key, val] of Object.entries(data.modules)) {
                    const v = val as any;
                    moduleFlags[key] = v?.status === 'active' || v?.enabled === true || v?.healthy === true;
                }
            }
            return moduleFlags;
        } catch {
            return {};
        }
    }

    /** Run all service pings, using TCA system-status data for modules */
    private async runAll(tcaFlags: Record<string, boolean>): Promise<ServiceResult[]> {
        const now = new Date().toISOString();
        const promises = SERVICES.map(async (def) => {
            // Modules: if we got data from system-status, use that directly
            if (def.group === 'modules') {
                const moduleId = def.id.replace('module-', '');
                const flag = tcaFlags[moduleId];
                if (flag !== undefined) {
                    return {
                        def,
                        // A module being inactive/disabled means unavailable ('checking'),
                        // not broken ('degraded'). Only healthy when explicitly active.
                        status: (flag ? 'healthy' : 'checking') as ServiceStatus,
                        code: 200,
                        latencyMs: 0,
                        checkedAt: now,
                    };
                }
                // No data from system-status – return 'checking' rather than pinging
                // individual module endpoints that likely return 404
                return {
                    def,
                    status: 'checking' as ServiceStatus,
                    code: 0,
                    latencyMs: 0,
                    checkedAt: now,
                };
            }
            return this.pingService(def);
        });

        return Promise.all(promises);
    }

    // ── Status aggregation ────────────────────────────────────────────────────

    private aggregate(statuses: ServiceStatus[]): ServiceStatus {
        if (statuses.length === 0) return 'checking';
        // Filter out 'checking' (unavailable/optional) – only judge based on definite results
        const real = statuses.filter((s) => s !== 'checking');
        if (real.length === 0) return 'checking';
        if (real.some((s) => s === 'down')) return 'down';
        if (real.some((s) => s === 'degraded')) return 'degraded';
        return 'healthy';
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    start(): void {
        if (this.heartbeatTimer !== null) return;

        // Initial sweep
        this.sweep();

        // Keep-alive: fast ping every 30 s
        this.heartbeatTimer = setInterval(() => this.ping(), HEARTBEAT_MS);

        // Full sweep: every 90 s
        this.sweepTimer = setInterval(() => this.sweep(), SWEEP_MS);
    }

    stop(): void {
        if (this.heartbeatTimer !== null) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.sweepTimer !== null) {
            clearInterval(this.sweepTimer);
            this.sweepTimer = null;
        }
    }
}

export const healthService = HealthService.getInstance();
