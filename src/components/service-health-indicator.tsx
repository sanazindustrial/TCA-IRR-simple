'use client';

import { useState } from 'react';
import { useServiceHealth } from '@/hooks/use-service-health';
import {
    type ServiceStatus,
    type GroupResult,
    type ServiceResult,
} from '@/lib/health-service';
import {
    Loader2, ChevronDown, ChevronUp,
    Cpu, ShieldCheck, FlaskConical, LayoutGrid,
    Database, Settings2, MessageSquare,
} from 'lucide-react';

// ─── Visual config per status ─────────────────────────────────────────────────

interface StatusStyle {
    dot: string;
    label: string;
    text: string;
}

const STATUS_STYLE: Record<ServiceStatus, StatusStyle> = {
    checking:  { dot: 'bg-muted-foreground',  label: 'Checking…',  text: 'text-muted-foreground' },
    healthy:   { dot: 'bg-green-500',          label: 'Online',     text: 'text-green-600'        },
    degraded:  { dot: 'bg-yellow-500',         label: 'Degraded',   text: 'text-yellow-600'       },
    down:      { dot: 'bg-red-500',            label: 'Offline',    text: 'text-red-600'          },
};

const GROUP_ICONS: Record<string, React.ElementType> = {
    core:          Cpu,
    auth:          ShieldCheck,
    analysis:      FlaskConical,
    modules:       LayoutGrid,
    data:          Database,
    admin:         Settings2,
    communication: MessageSquare,
};

// ─── Small status dot ─────────────────────────────────────────────────────────

function StatusDot({ status, pulse }: { status: ServiceStatus; pulse?: boolean }) {
    const { dot } = STATUS_STYLE[status];
    if (status === 'checking') {
        return <Loader2 className="size-2.5 animate-spin shrink-0 text-muted-foreground" aria-hidden />;
    }
    return (
        <span
            className={`inline-block size-2 rounded-full shrink-0 ${dot} ${pulse && status === 'healthy' ? 'animate-pulse' : ''}`}
            aria-hidden
        />
    );
}

// ─── Individual service row ───────────────────────────────────────────────────

function ServiceRow({ result }: { result: ServiceResult }) {
    const { label, text } = STATUS_STYLE[result.status];
    return (
        <div className="flex items-center justify-between gap-2 py-0.5 text-xs">
            <span className="text-muted-foreground truncate flex-1 min-w-0">{result.def.label}</span>
            <span className={`flex items-center gap-1 shrink-0 font-medium ${text}`}>
                <StatusDot status={result.status} />
                {label}
            </span>
        </div>
    );
}

// ─── Group row (with expand/collapse for services) ────────────────────────────

function GroupRow({ group }: { group: GroupResult }) {
    const [open, setOpen] = useState(false);
    const { label, text } = STATUS_STYLE[group.status];
    const Icon = GROUP_ICONS[group.id] ?? Cpu;

    return (
        <div>
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-2 py-1 text-xs hover:bg-muted/50 rounded px-1 transition-colors"
            >
                <StatusDot status={group.status} />
                <Icon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                <span className="flex-1 text-left font-medium truncate">{group.label}</span>
                <span className={`shrink-0 ${text}`}>{label}</span>
                {open ? (
                    <ChevronUp className="size-3 text-muted-foreground shrink-0" />
                ) : (
                    <ChevronDown className="size-3 text-muted-foreground shrink-0" />
                )}
            </button>

            {open && group.services.length > 0 && (
                <div className="ml-6 border-l border-border pl-2 pb-1">
                    {group.services.map((svc) => (
                        <ServiceRow key={svc.def.id} result={svc} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Overall summary dot + label (collapsed summary) ─────────────────────────

const OVERALL_LABEL: Record<ServiceStatus, string> = {
    checking: 'Connecting…',
    healthy:  'All Services Online',
    degraded: 'Services Degraded',
    down:     'Services Offline',
};

// ─── Main exported component ──────────────────────────────────────────────────

export function ServiceHealthIndicator() {
    const { report, overall } = useServiceHealth();
    const [panelOpen, setPanelOpen] = useState(false);
    const { text } = STATUS_STYLE[overall];

    return (
        <div className="w-full px-2">
            {/* Compact summary row – always visible */}
            <button
                onClick={() => setPanelOpen((v) => !v)}
                className="w-full flex items-center gap-2 px-1 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 rounded transition-colors"
                aria-label={panelOpen ? 'Collapse service health panel' : 'Expand service health panel'}
            >
                <StatusDot status={overall} pulse />
                <span className={`flex-1 text-left ${text}`}>{OVERALL_LABEL[overall]}</span>
                {panelOpen ? (
                    <ChevronUp className="size-3 shrink-0" />
                ) : (
                    <ChevronDown className="size-3 shrink-0" />
                )}
            </button>

            {/* Expandable service group panel */}
            {panelOpen && (
                <div className="mt-1 mb-1 border border-border rounded-md bg-background p-2 max-h-80 overflow-y-auto shadow-sm">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1 px-1">
                        Service Status
                    </p>
                    {report.groups.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-1 py-1">Scanning services…</p>
                    ) : (
                        report.groups.map((group) => (
                            <GroupRow key={group.id} group={group} />
                        ))
                    )}
                    {report.checkedAt && (
                        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                            Last checked: {new Date(report.checkedAt).toLocaleTimeString()}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

