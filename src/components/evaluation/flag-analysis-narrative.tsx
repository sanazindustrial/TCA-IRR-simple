'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
    AlertTriangle,
    Shield,
    Brain,
    TrendingUp,
    TrendingDown,
    Target,
    Clock,
    CheckCircle2,
    XCircle,
    Info
} from 'lucide-react';
import { useEvaluationContext } from './evaluation-provider';
import { DashboardCard } from '../shared/dashboard-card';
import { cn } from '@/lib/utils';

// Sample comprehensive flag analysis narrative data
const sampleFlagAnalysisNarrative = {
    executiveOverview: `The risk flag analysis reveals a moderate-risk profile with 3 critical areas requiring immediate attention. While the overall risk distribution shows 58% green flags indicating strong foundational elements, the presence of red flags in Go-to-Market Strategy and Execution domains necessitates focused intervention strategies.`,

    flagDistributionAnalysis: {
        green: { count: 8, percentage: 57, description: 'Strong performance areas' },
        yellow: { count: 4, percentage: 29, description: 'Areas requiring monitoring' },
        red: { count: 2, percentage: 14, description: 'Critical intervention needed' }
    },

    criticalRiskNarrative: `Two critical red flags have been identified that could significantly impact commercialization success. The Go-to-Market Strategy flag (Score: 6.5/10) indicates insufficient market penetration planning and sales infrastructure. The Execution Risk flag (Score: 6.2/10) reflects concerns about operational capability to deliver on strategic objectives within projected timelines.`,

    opportunityRiskBalance: {
        riskVelocity: 'MODERATE', // LOW, MODERATE, HIGH
        mitigationPriority: 'HIGH',
        timeToAction: '60-90 days',
        confidenceLevel: 78
    },

    triggerAnalysisDetail: {
        immediateTriggers: [
            {
                domain: 'Go-to-Market Strategy',
                trigger: 'Lack of experienced VP Sales',
                impact: 'High',
                timeline: '30 days',
                mitigation: 'Executive search for VP Sales with medtech experience'
            },
            {
                domain: 'Execution Risk',
                trigger: 'Resource allocation gaps in operations',
                impact: 'High',
                timeline: '45 days',
                mitigation: 'Operational efficiency audit and restructuring'
            }
        ],

        monitoringTriggers: [
            {
                domain: 'Regulatory/Compliance',
                trigger: 'FDA submission timeline uncertainty',
                impact: 'Medium',
                timeline: '90 days',
                mitigation: 'Regulatory consultant engagement'
            },
            {
                domain: 'Team Risk',
                trigger: 'Key personnel retention concerns',
                impact: 'Medium',
                timeline: '60 days',
                mitigation: 'Retention incentive program implementation'
            }
        ]
    },

    sectorSpecificInsights: {
        framework: 'medtech', // or 'general'
        industryBenchmarks: {
            averageRiskScore: 6.8,
            yourRiskScore: 6.4,
            positionVsBenchmark: 'BELOW_AVERAGE', // ABOVE_AVERAGE, AVERAGE, BELOW_AVERAGE
            keyDifferentiators: [
                'Regulatory pathway clarity above industry standard',
                'IP protection stronger than typical early-stage companies',
                'Market validation more comprehensive than peer group'
            ]
        },
        regulatoryInsights: [
            'FDA pre-submission strategy well-defined with clear timelines',
            'Reimbursement pathway validated with key stakeholder engagement',
            'Clinical evidence package exceeds minimum regulatory requirements'
        ]
    },

    predictiveRiskModeling: {
        riskTrajectory: 'IMPROVING', // IMPROVING, STABLE, DECLINING
        scenarioAnalysis: {
            bestCase: {
                riskScore: 7.8,
                timeline: '6 months',
                assumptions: 'Successful VP Sales hire, regulatory approval on schedule'
            },
            mostLikely: {
                riskScore: 7.2,
                timeline: '9 months',
                assumptions: 'Moderate execution improvements, minor regulatory delays'
            },
            worstCase: {
                riskScore: 5.8,
                timeline: '12+ months',
                assumptions: 'Key personnel departure, significant regulatory setbacks'
            }
        },

        keyInfluencers: [
            'Leadership team stability and execution capability',
            'Regulatory approval timeline adherence',
            'Market reception and early customer validation',
            'Capital efficiency and burn rate management'
        ]
    },

    actionableInsights: [
        {
            priority: 1,
            insight: 'Immediate VP Sales recruitment is critical for market entry success',
            evidence: 'Current GTM score of 6.5 significantly below industry benchmark of 7.2',
            action: 'Initiate executive search with medtech-focused recruiters'
        },
        {
            priority: 2,
            insight: 'Operational efficiency gaps threaten execution timeline',
            evidence: 'Resource allocation analysis shows 23% inefficiency in R&D operations',
            action: 'Engage operations consultant for 90-day efficiency improvement program'
        },
        {
            priority: 3,
            insight: 'Regulatory pathway clarity provides competitive advantage',
            evidence: 'FDA pre-submission feedback more positive than 78% of comparable companies',
            action: 'Leverage regulatory strength in investor and partner communications'
        }
    ]
};

const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
        case 'low':
            return 'text-green-700 bg-green-50 border-green-200';
        case 'medium':
            return 'text-yellow-700 bg-yellow-50 border-yellow-200';
        case 'high':
            return 'text-red-700 bg-red-50 border-red-200';
        case 'critical':
            return 'text-red-900 bg-red-100 border-red-300';
        default:
            return 'text-gray-700 bg-gray-50 border-gray-200';
    }
};

const getTrajectoryIcon = (trajectory: string) => {
    switch (trajectory) {
        case 'IMPROVING':
            return <TrendingUp className="h-4 w-4 text-green-600" />;
        case 'DECLINING':
            return <TrendingDown className="h-4 w-4 text-red-600" />;
        case 'STABLE':
        default:
            return <Target className="h-4 w-4 text-blue-600" />;
    }
};

interface FlagAnalysisNarrativeProps {
    data?: typeof sampleFlagAnalysisNarrative;
}

export function FlagAnalysisNarrative({ data = sampleFlagAnalysisNarrative }: FlagAnalysisNarrativeProps) {
    const { framework, reportType } = useEvaluationContext();

    return (
        <DashboardCard
            title="Flag Analysis Narrative"
            icon={Brain}
            description="GPT-generated narrative analysis of risk flags, triggers, and strategic risk management insights"
        >
            <div className="space-y-8">

                {/* Executive Overview */}
                <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border-l-4 border-slate-500">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Brain className="h-5 w-5 text-slate-600" />
                        Risk Assessment Executive Overview
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                        {data.executiveOverview}
                    </p>
                </div>

                {/* Flag Distribution Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-green-700">
                                        {data.flagDistributionAnalysis.green.count}
                                    </div>
                                    <div className="text-sm text-green-600">
                                        {data.flagDistributionAnalysis.green.percentage}%
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm font-medium text-green-700">Green Flags</div>
                            <div className="text-xs text-green-600 mt-1">
                                {data.flagDistributionAnalysis.green.description}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-yellow-700">
                                        {data.flagDistributionAnalysis.yellow.count}
                                    </div>
                                    <div className="text-sm text-yellow-600">
                                        {data.flagDistributionAnalysis.yellow.percentage}%
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm font-medium text-yellow-700">Yellow Flags</div>
                            <div className="text-xs text-yellow-600 mt-1">
                                {data.flagDistributionAnalysis.yellow.description}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <XCircle className="h-8 w-8 text-red-600" />
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-red-700">
                                        {data.flagDistributionAnalysis.red.count}
                                    </div>
                                    <div className="text-sm text-red-600">
                                        {data.flagDistributionAnalysis.red.percentage}%
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm font-medium text-red-700">Red Flags</div>
                            <div className="text-xs text-red-600 mt-1">
                                {data.flagDistributionAnalysis.red.description}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Critical Risk Narrative */}
                <div className="p-6 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-red-700">
                        <Shield className="h-5 w-5" />
                        Critical Risk Analysis
                    </h3>
                    <p className="text-red-800 leading-relaxed mb-4">
                        {data.criticalRiskNarrative}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="text-center">
                            <div className="text-sm text-red-600">Risk Velocity</div>
                            <Badge className={cn('mt-1', getRiskLevelColor(data.opportunityRiskBalance.riskVelocity))}>
                                {data.opportunityRiskBalance.riskVelocity}
                            </Badge>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-red-600">Action Priority</div>
                            <Badge className={cn('mt-1', getRiskLevelColor(data.opportunityRiskBalance.mitigationPriority))}>
                                {data.opportunityRiskBalance.mitigationPriority}
                            </Badge>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-red-600">Time to Action</div>
                            <div className="font-semibold text-red-700 mt-1">
                                {data.opportunityRiskBalance.timeToAction}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-red-600">Confidence</div>
                            <div className="font-semibold text-red-700 mt-1">
                                {data.opportunityRiskBalance.confidenceLevel}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trigger Analysis */}
                <div className="space-y-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Risk Trigger Analysis
                    </h3>

                    {/* Immediate Triggers */}
                    <div>
                        <h4 className="font-medium text-red-700 mb-3">Immediate Action Required</h4>
                        <div className="space-y-3">
                            {data.triggerAnalysisDetail.immediateTriggers.map((trigger, index) => (
                                <div key={index} className="p-4 border border-red-200 rounded-lg bg-red-50">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="font-medium text-red-800">{trigger.domain}</div>
                                        <Badge className={getRiskLevelColor(trigger.impact)}>
                                            {trigger.impact} Impact
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-red-700 mb-2">
                                        <strong>Trigger:</strong> {trigger.trigger}
                                    </div>
                                    <div className="text-sm text-red-700 mb-2">
                                        <strong>Mitigation:</strong> {trigger.mitigation}
                                    </div>
                                    <div className="text-xs text-red-600">
                                        Timeline: {trigger.timeline}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Monitoring Triggers */}
                    <div>
                        <h4 className="font-medium text-yellow-700 mb-3">Monitoring Required</h4>
                        <div className="space-y-3">
                            {data.triggerAnalysisDetail.monitoringTriggers.map((trigger, index) => (
                                <div key={index} className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="font-medium text-yellow-800">{trigger.domain}</div>
                                        <Badge className={getRiskLevelColor(trigger.impact)}>
                                            {trigger.impact} Impact
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-yellow-700 mb-2">
                                        <strong>Trigger:</strong> {trigger.trigger}
                                    </div>
                                    <div className="text-sm text-yellow-700 mb-2">
                                        <strong>Mitigation:</strong> {trigger.mitigation}
                                    </div>
                                    <div className="text-xs text-yellow-600">
                                        Timeline: {trigger.timeline}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Predictive Risk Modeling */}
                <div className="p-6 border rounded-lg">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        {getTrajectoryIcon(data.predictiveRiskModeling.riskTrajectory)}
                        Predictive Risk Modeling
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-sm text-green-600 mb-1">Best Case</div>
                            <div className="text-2xl font-bold text-green-700 mb-1">
                                {data.predictiveRiskModeling.scenarioAnalysis.bestCase.riskScore}/10
                            </div>
                            <div className="text-xs text-green-600">
                                {data.predictiveRiskModeling.scenarioAnalysis.bestCase.timeline}
                            </div>
                        </div>

                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm text-blue-600 mb-1">Most Likely</div>
                            <div className="text-2xl font-bold text-blue-700 mb-1">
                                {data.predictiveRiskModeling.scenarioAnalysis.mostLikely.riskScore}/10
                            </div>
                            <div className="text-xs text-blue-600">
                                {data.predictiveRiskModeling.scenarioAnalysis.mostLikely.timeline}
                            </div>
                        </div>

                        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-sm text-red-600 mb-1">Worst Case</div>
                            <div className="text-2xl font-bold text-red-700 mb-1">
                                {data.predictiveRiskModeling.scenarioAnalysis.worstCase.riskScore}/10
                            </div>
                            <div className="text-xs text-red-600">
                                {data.predictiveRiskModeling.scenarioAnalysis.worstCase.timeline}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-medium">Key Risk Influencers</h4>
                        <ul className="space-y-2">
                            {data.predictiveRiskModeling.keyInfluencers.map((influencer, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{influencer}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Actionable Insights */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Priority Actionable Insights</h3>
                    <div className="space-y-4">
                        {data.actionableInsights.map((insight, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                                <div className="flex items-start gap-3">
                                    <Badge className="bg-blue-100 text-blue-800">
                                        Priority {insight.priority}
                                    </Badge>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-blue-900 mb-2">{insight.insight}</h4>
                                        <div className="text-sm text-blue-700 mb-2">
                                            <strong>Evidence:</strong> {insight.evidence}
                                        </div>
                                        <div className="text-sm text-blue-700">
                                            <strong>Recommended Action:</strong> {insight.action}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Framework-Specific Insights */}
                {framework === 'medtech' && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-semibold text-purple-800 mb-3">MedTech Sector-Specific Risk Insights</h4>
                        <ul className="space-y-2">
                            {data.sectorSpecificInsights.regulatoryInsights.map((insight, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-purple-700">{insight}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </DashboardCard>
    );
}