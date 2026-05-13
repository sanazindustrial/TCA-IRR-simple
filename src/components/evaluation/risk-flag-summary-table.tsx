'use client';
import React, { useState, Fragment } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '../shared/dashboard-card';
import { useEvaluationContext } from './evaluation-provider';
import { cn } from '@/lib/utils';
import { AlertTriangle, ChevronDown, ChevronUp, Shield, Brain } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { RiskFlagsAndMitigationOutput } from '@/ai/flows/schemas';

type RiskFlagSummaryTableProps = {
    data: RiskFlagsAndMitigationOutput | null;
};

const flagVariants = {
    red: 'destructive',
    yellow: 'warning',
    green: 'success',
} as const;

const getFlagBadgeVariant = (flag: string) => {
    return flagVariants[flag as keyof typeof flagVariants] || 'secondary';
};

const getFlagIcon = (flag: string) => {
    switch (flag) {
        case 'red': return '🔴';
        case 'yellow': return '🟡';
        case 'green': return '🟢';
        default: return '⚪';
    }
};

export function RiskFlagSummaryTable({ data }: RiskFlagSummaryTableProps) {
    const { isPrivilegedUser } = useEvaluationContext();
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const riskFlags = data?.riskFlags ?? [];
    const riskSummary = data?.riskSummary ?? '';

    if (!riskFlags.length) {
        return (
            <DashboardCard
                title="Risk Flag Summary Table (14 Domains)"
                icon={AlertTriangle}
                description="Comprehensive risk analysis across all critical business domains"
            >
                <div className="rounded-lg border border-amber-300 bg-amber-50/40 p-4 text-sm text-amber-800">
                    Risk data is not available for this analysis run. Go back, add required data/documents, and regenerate.
                </div>
            </DashboardCard>
        );
    }

    const toggleRow = (domain: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(domain)) {
            newExpanded.delete(domain);
        } else {
            newExpanded.add(domain);
        }
        setExpandedRows(newExpanded);
    };

    // Calculate risk distribution
    const riskDistribution = riskFlags.reduce((acc, risk) => {
        acc[risk.flag] = (acc[risk.flag] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Get top risks (red and yellow flags)
    const topRisks = riskFlags
        .filter(risk => risk.flag === 'red' || risk.flag === 'yellow')
        .sort((a, b) => {
            if (a.flag === 'red' && b.flag !== 'red') return -1;
            if (b.flag === 'red' && a.flag !== 'red') return 1;
            return 0;
        })
        .slice(0, 5);

    return (
        <DashboardCard
            title="Risk Flag Summary Table (14 Domains)"
            icon={AlertTriangle}
            description="Comprehensive risk analysis across all critical business domains"
        >
            <div className="space-y-6">
                {/* Risk Distribution Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="text-center">
                        <div className="text-2xl font-bold">{riskFlags.length}</div>
                        <div className="text-sm text-muted-foreground">Total Domains</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-destructive">{riskDistribution.red || 0}</div>
                        <div className="text-sm text-muted-foreground">Critical Risks</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-warning">{riskDistribution.yellow || 0}</div>
                        <div className="text-sm text-muted-foreground">Moderate Risks</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-success">{riskDistribution.green || 0}</div>
                        <div className="text-sm text-muted-foreground">Low Risks</div>
                    </div>
                </div>

                {/* Top Risks Summary */}
                {topRisks.length > 0 && (
                    <div className="p-4 border border-warning/20 bg-warning/5 rounded-lg">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-warning">
                            <AlertTriangle className="size-5" />
                            Top Risk Areas Requiring Attention
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {topRisks.map((risk) => (
                                <div key={risk.domain} className="flex items-center gap-2 text-sm">
                                    <span className="text-lg">{getFlagIcon(risk.flag)}</span>
                                    <span className="font-medium">{risk.domain}:</span>
                                    <span className="text-muted-foreground">{risk.trigger}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Risk Flags Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Risk Domain</TableHead>
                                <TableHead className="text-center w-[100px]">Color Flag</TableHead>
                                <TableHead className="w-[250px]">Description</TableHead>
                                <TableHead className="w-[200px]">Mitigation</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {riskFlags.map((risk) => (
                                <Fragment key={risk.domain}>
                                    <TableRow className="hover:bg-muted/50">
                                        <TableCell className="font-medium">
                                            {risk.domain}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-lg">{getFlagIcon(risk.flag)}</span>
                                                <Badge variant={getFlagBadgeVariant(risk.flag)} className="capitalize">
                                                    {risk.flag}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {risk.description.length > 100
                                                ? `${risk.description.substring(0, 97)}...`
                                                : risk.description
                                            }
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {risk.mitigation.length > 80
                                                ? `${risk.mitigation.substring(0, 77)}...`
                                                : risk.mitigation
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <Collapsible open={expandedRows.has(risk.domain)}>
                                                <CollapsibleTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleRow(risk.domain)}
                                                    >
                                                        {expandedRows.has(risk.domain) ? (
                                                            <ChevronUp className="size-4" />
                                                        ) : (
                                                            <ChevronDown className="size-4" />
                                                        )}
                                                    </Button>
                                                </CollapsibleTrigger>
                                            </Collapsible>
                                        </TableCell>
                                    </TableRow>

                                    {expandedRows.has(risk.domain) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="bg-muted/30 p-6">
                                                <Collapsible open={expandedRows.has(risk.domain)}>
                                                    <CollapsibleContent>
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <h5 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                                                                            <AlertTriangle className="size-4" />
                                                                            Risk Trigger
                                                                        </h5>
                                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                                            {risk.trigger}
                                                                        </p>
                                                                    </div>

                                                                    <div>
                                                                        <h5 className="font-semibold text-warning mb-2 flex items-center gap-2">
                                                                            <div className="w-2 h-2 bg-warning rounded-full"></div>
                                                                            Impact Assessment
                                                                        </h5>
                                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                                            <span className="font-medium">Severity: {risk.impact}</span> - {risk.description}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <h5 className="font-semibold text-success mb-2 flex items-center gap-2">
                                                                            <Shield className="size-4" />
                                                                            Mitigation Strategy
                                                                        </h5>
                                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                                            {risk.mitigation}
                                                                        </p>
                                                                    </div>

                                                                    {isPrivilegedUser && risk.aiRecommendation && (
                                                                        <div>
                                                                            <h5 className="font-semibold text-primary mb-2 flex items-center gap-2">
                                                                                <Brain className="size-4" />
                                                                                AI Recommendation
                                                                            </h5>
                                                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                                                {risk.aiRecommendation}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {risk.thresholds && (
                                                                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                                                    <h6 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                                                        Risk Thresholds
                                                                    </h6>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {risk.thresholds}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Flag Analysis Narrative */}
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Brain className="size-5 text-primary" />
                        Flag Analysis Narrative
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {riskSummary}
                    </p>
                </div>
            </div>
        </DashboardCard>
    );
}
