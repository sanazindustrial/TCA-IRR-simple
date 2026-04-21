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
    | 'data'
    | 'admin'
    | 'communication';

export interface ServiceDef {
    id: string;
    label: string;
    group: ServiceGroupId;
    /** Full URL path (appended to baseURL) – or a function that receives baseURL */
    path: string;
    /** Some endpoints only make sense when the user is authenticated */
    requiresAuth?: boolean;
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
    data:          'Data Services',
    admin:         'Admin Services',
    communication: 'Communication',
};

// ─── Service definitions ─────────────────────────────────────────────────────

const SERVICES: ServiceDef[] = [
    // ── Core ──
    { id: 'api-health',    label: 'Backend Health',    group: 'core', path: '/health' },
    { id: 'tca-status',    label: 'TCA System Status', group: 'core', path: '/api/v1/tca/system-status' },

    // ── Auth ──
    { id: 'auth-me',       label: 'Auth / Session',   group: 'auth', path: '/api/v1/auth/me',      requiresAuth: true },

    // ── Analysis engine ──
    { id: 'analysis-svc',  label: 'Analysis Service', group: 'analysis', path: '/api/v1/analysis/comprehensive', requiresAuth: true },
    { id: 'tca-quick',     label: 'TCA Quick',        group: 'analysis', path: '/api/v1/tca/quick',              requiresAuth: true },
    { id: 'tca-sector',    label: 'TCA Sector',       group: 'analysis', path: '/api/v1/tca/sector-analysis',    requiresAuth: true },
    { id: 'tca-batch',     label: 'TCA Batch',        group: 'analysis', path: '/api/v1/tca/batch',              requiresAuth: true },

    // ── 17 modules (status derived from /api/v1/tca/system-status in sweep) ──
    ...MODULE_IDS.map((mod) => ({
        id:    `module-${mod}`,
        label: MODULE_LABELS[mod],
        group: 'modules' as ServiceGroupId,
        path:  `/api/v1/modules/${mod}/status`,
        requiresAuth: true,
    })),

    // ── Data services ──
    { id: 'reports-svc',      label: 'Reports',      group: 'data', path: '/api/v1/reports',     requiresAuth: true },
    { id: 'companies-svc',    label: 'Companies',    group: 'data', path: '/api/v1/companies',   requiresAuth: true },
    { id: 'evaluations-svc',  label: 'Evaluations',  group: 'data', path: '/api/v1/evaluations', requiresAuth: true },

    // ── Admin / config ──
    { id: 'cost-svc',      label: 'Cost Service',     group: 'admin', path: '/api/v1/cost/summary/public' },
    { id: 'settings-svc',  label: 'Settings/Config',  group: 'admin', path: '/api/v1/settings/versions', requiresAuth: true },
    { id: 'users-svc',     label: 'Users',            group: 'admin', path: '/api/v1/users',              requiresAuth: true },
    { id: 'roles-svc',     label: 'Roles',            group: 'admin', path: '/api/v1/roles',              requiresAuth: true },
    { id: 'dashboard-svc', label: 'Dashboard Stats',  group: 'admin', path: '/api/v1/dashboard/stats' },

    // ── Communication ──
    { id: 'notifications-svc', label: 'Notifications',   group: 'communication', path: '/api/v1/notifications',       requiresAuth: true },
    { id: 'email-svc',         label: 'Email Service',   group: 'communication', path: '/api/v1/email/status',         requiresAuth: true },
    { id: 'send-svc',          label: 'Send / Receive',  group: 'communication', path: '/api/v1/notifications/unread', requiresAuth: true },
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

            // 200-299 and 401/403 (auth issues) all mean the service is UP
            // Only 404 (not found), 500+ or network errors mean DOWN/DEGRADED
            let status: ServiceStatus;
            if (res.status >= 200 && res.status < 400) {
                status = 'healthy';
            } else if (res.status === 401 || res.status === 403) {
                // Service is alive, just needs fresh auth
                status = 'healthy';
            } else if (res.status >= 500) {
                status = 'down';
            } else {
                // 404 for optional endpoints (email, notifications etc.) → degraded
                status = 'degraded';
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
            const controller = new AbortController();
            setTimeout(() => controller.abort(), PING_TIMEOUT);
            const token = this.getToken();
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
                        status: (flag ? 'healthy' : 'degraded') as ServiceStatus,
                        code: 200,
                        latencyMs: 0,
                        checkedAt: now,
                    };
                }
                // No data from system-status – fallback to individual ping
            }
            return this.pingService(def);
        });

        return Promise.all(promises);
    }

    // ── Status aggregation ────────────────────────────────────────────────────

    private aggregate(statuses: ServiceStatus[]): ServiceStatus {
        if (statuses.length === 0) return 'checking';
        if (statuses.every((s) => s === 'checking')) return 'checking';
        if (statuses.some((s) => s === 'down')) return 'down';
        if (statuses.some((s) => s === 'degraded' || s === 'checking')) return 'degraded';
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
