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

// Default 14 risk domains with comprehensive data
const defaultRiskFlags: RiskFlagsAndMitigationOutput['riskFlags'] = [
    {
        domain: 'Regulatory/Compliance',
        flag: 'yellow',
        trigger: 'Complex FDA approval pathway with uncertain timeline',
        description: 'Medical device classification requires 510(k) clearance with potential for additional studies. Regulatory pathway is well-defined but includes compliance requirements that may extend timeline.',
        impact: 'Medium',
        mitigation: 'Engage regulatory consultant, establish FDA pre-submission meeting, develop comprehensive quality system',
        aiRecommendation: 'Consider accelerated pathway options and build regulatory buffer into timeline',
        thresholds: 'Red: >24 months approval time; Yellow: 12-24 months; Green: <12 months'
    },
    {
        domain: 'Clinical/Safety/Product Safety',
        flag: 'green',
        trigger: 'Strong clinical validation and safety profile established',
        description: 'Clinical studies demonstrate efficacy and safety with minimal adverse events. Product design incorporates multiple safety mechanisms and fail-safes.',
        impact: 'Low',
        mitigation: 'Continue post-market surveillance, maintain clinical documentation',
        aiRecommendation: 'Leverage strong safety data in marketing and regulatory submissions',
        thresholds: 'Red: Safety issues identified; Yellow: Limited safety data; Green: Comprehensive safety validation'
    },
    {
        domain: 'Liability/Legal Exposure',
        flag: 'yellow',
        trigger: 'Product liability insurance gaps and IP litigation potential',
        description: 'Current insurance coverage may be insufficient for product liability claims. Patent landscape includes potential infringement concerns with established players.',
        impact: 'Medium',
        mitigation: 'Increase product liability coverage, conduct thorough freedom-to-operate analysis, establish legal reserves',
        aiRecommendation: 'Secure comprehensive insurance package and complete IP clearance analysis',
        thresholds: 'Red: Active litigation; Yellow: Potential exposure; Green: Well-protected'
    },
    {
        domain: 'Technical Execution Risk',
        flag: 'green',
        trigger: 'Strong technical team with proven development capability',
        description: 'Technical team has relevant experience and demonstrated ability to execute complex projects. Development milestones have been consistently met.',
        impact: 'Low',
        mitigation: 'Maintain technical excellence, continue milestone tracking',
        aiRecommendation: 'Document technical achievements and maintain team retention strategies',
        thresholds: 'Red: Major technical challenges; Yellow: Moderate challenges; Green: Strong execution'
    },
    {
        domain: 'Market Risk',
        flag: 'yellow',
        trigger: 'Market timing and adoption uncertainty',
        description: 'Market readiness for solution is moderate with some early adopters identified but broader adoption uncertain. Competitive landscape is evolving rapidly.',
        impact: 'Medium',
        mitigation: 'Accelerate customer validation, strengthen value proposition, monitor competitive developments',
        aiRecommendation: 'Focus on early adopter segments and build market momentum',
        thresholds: 'Red: Market rejection; Yellow: Uncertain adoption; Green: Strong market pull'
    },
    {
        domain: 'Go-To-Market Risk',
        flag: 'red',
        trigger: 'Unclear sales strategy and unproven customer acquisition',
        description: 'Sales approach lacks detailed strategy and proven channels. Customer acquisition cost is undefined and scaling approach uncertain.',
        impact: 'High',
        mitigation: 'Develop detailed GTM strategy, hire experienced sales leadership, validate customer acquisition channels',
        aiRecommendation: 'Prioritize sales strategy development and channel validation before scaling',
        thresholds: 'Red: No clear GTM strategy; Yellow: Partially developed; Green: Proven approach'
    },
    {
        domain: 'Financial Risk',
        flag: 'yellow',
        trigger: 'Funding runway concerns and revenue model validation',
        description: 'Current funding provides 12-18 months runway. Revenue model shows promise but requires validation at scale.',
        impact: 'Medium',
        mitigation: 'Secure additional funding, validate unit economics, establish revenue forecasting',
        aiRecommendation: 'Begin next funding round preparation and focus on revenue milestone achievement',
        thresholds: 'Red: <6 months runway; Yellow: 6-18 months; Green: >18 months'
    },
    {
        domain: 'Team/Execution Risk',
        flag: 'yellow',
        trigger: 'Key person dependency and skills gaps',
        description: 'Heavy reliance on founder for key decisions and technical direction. Missing commercial expertise in senior team.',
        impact: 'Medium',
        mitigation: 'Diversify leadership responsibilities, hire commercial talent, establish succession planning',
        aiRecommendation: 'Reduce key person risk through strategic hires and delegation',
        thresholds: 'Red: Critical dependencies; Yellow: Some gaps; Green: Well-rounded team'
    },
    {
        domain: 'IP/Defensibility Risk',
        flag: 'green',
        trigger: 'Strong patent portfolio with clear differentiation',
        description: 'Multiple patents filed and granted providing strong IP protection. Clear technological differentiation from competitors.',
        impact: 'Low',
        mitigation: 'Continue IP development, monitor infringement, maintain technology leadership',
        aiRecommendation: 'Leverage IP strength for strategic partnerships and market positioning',
        thresholds: 'Red: Weak IP protection; Yellow: Moderate protection; Green: Strong portfolio'
    },
    {
        domain: 'Data Privacy/Governance',
        flag: 'yellow',
        trigger: 'HIPAA compliance requirements and data governance gaps',
        description: 'Healthcare data handling requires HIPAA compliance with current systems needing governance improvements.',
        impact: 'Medium',
        mitigation: 'Implement comprehensive data governance, ensure HIPAA compliance, establish privacy policies',
        aiRecommendation: 'Prioritize data governance infrastructure and compliance certification',
        thresholds: 'Red: Compliance violations; Yellow: Gaps identified; Green: Fully compliant'
    },
    {
        domain: 'Security/Cyber Risk',
        flag: 'green',
        trigger: 'Robust cybersecurity measures implemented',
        description: 'Strong cybersecurity framework with regular security audits and penetration testing. Data encryption and access controls in place.',
        impact: 'Low',
        mitigation: 'Maintain security vigilance, continue regular audits, update security protocols',
        aiRecommendation: 'Document security excellence for customer confidence and compliance',
        thresholds: 'Red: Security breaches; Yellow: Vulnerabilities exist; Green: Comprehensive security'
    },
    {
        domain: 'Operational/Supply Chain',
        flag: 'yellow',
        trigger: 'Manufacturing scale-up and supply chain dependencies',
        description: 'Limited manufacturing partners with potential supply chain vulnerabilities. Scale-up requirements not fully validated.',
        impact: 'Medium',
        mitigation: 'Diversify supplier base, establish manufacturing partnerships, validate scale-up processes',
        aiRecommendation: 'Secure manufacturing relationships and develop supply chain resilience',
        thresholds: 'Red: Supply disruption; Yellow: Dependencies exist; Green: Resilient supply chain'
    },
    {
        domain: 'Ethical/Societal Risk',
        flag: 'green',
        trigger: 'Positive societal impact with ethical framework established',
        description: 'Solution addresses important healthcare need with clear patient benefit. Ethical framework guides decision-making.',
        impact: 'Low',
        mitigation: 'Maintain ethical standards, continue stakeholder engagement',
        aiRecommendation: 'Leverage positive impact for stakeholder support and market positioning',
        thresholds: 'Red: Ethical concerns; Yellow: Mixed impact; Green: Clear positive benefit'
    },
    {
        domain: 'Adoption/Customer Retention Risk',
        flag: 'yellow',
        trigger: 'Customer onboarding complexity and retention uncertainty',
        description: 'Customer adoption process requires significant change management. Long-term retention rates not yet established.',
        impact: 'Medium',
        mitigation: 'Simplify onboarding, establish customer success programs, track retention metrics',
        aiRecommendation: 'Focus on user experience optimization and customer success initiatives',
        thresholds: 'Red: High churn; Yellow: Uncertain retention; Green: Strong retention'
    }
];

export function RiskFlagSummaryTable({ data }: RiskFlagSummaryTableProps) {
    const { isPrivilegedUser } = useEvaluationContext();
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const riskFlags = data?.riskFlags || defaultRiskFlags;
    const riskSummary = data?.riskSummary || "Analysis identifies moderate risk profile with manageable challenges in go-to-market strategy and operational scaling. Strong technical foundation and IP protection offset execution risks. Regulatory pathway is clear but requires timeline management.";

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
                        <div className="text-2xl font-bold">14</div>
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
