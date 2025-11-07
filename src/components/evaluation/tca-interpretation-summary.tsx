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
    TrendingUp,
    AlertTriangle,
    Target,
    Brain,
    BarChart3,
    Shield,
    CheckCircle,
    XCircle,
    Clock,
    Star
} from 'lucide-react';
import { useEvaluationContext } from './evaluation-provider';
import { DashboardCard } from '../shared/dashboard-card';
import { cn } from '@/lib/utils';

// Sample comprehensive TCA interpretation data
const sampleTcaInterpretation = {
    executiveNarrative: `This technology commercialization analysis reveals a company with strong foundational elements positioned for strategic growth. The composite score of 7.2/10 indicates solid commercial viability with identified areas for accelerated development.`,

    triageOutcome: {
        decision: 'PROCEED_WITH_CONDITIONS' as 'PROCEED' | 'PROCEED_WITH_CONDITIONS' | 'HOLD' | 'PASS',
        confidence: 82,
        reasoning: 'Strong market opportunity and technical foundation offset by execution risk and regulatory complexity.',
        nextSteps: [
            'Address regulatory compliance gaps within 90 days',
            'Strengthen go-to-market execution team',
            'Establish strategic partnerships for market entry',
            'Complete IP portfolio assessment'
        ]
    },

    highlights: {
        strengths: [
            'Exceptional product-market fit (9.0/10) with validated customer demand',
            'Strong technical moat with defensible IP position',
            'Experienced leadership team with relevant industry expertise',
            'Solid financial runway and burn rate management'
        ],
        concerns: [
            'Go-to-market execution risk (6.5/10) requires immediate attention',
            'Regulatory pathway complexity may delay commercialization',
            'Limited operational scalability in current structure',
            'Competitive landscape intensifying with well-funded rivals'
        ]
    },

    riskOpportunityBalance: {
        riskScore: 6.2,
        opportunityScore: 8.1,
        balance: 'OPPORTUNITY_FAVORED' as 'RISK_DOMINANT' | 'BALANCED' | 'OPPORTUNITY_FAVORED',
        keyRisks: [
            'Market timing risk due to regulatory delays',
            'Execution risk in scaling operations',
            'Technology risk in next-generation platform'
        ],
        keyOpportunities: [
            'First-mover advantage in emerging market segment',
            'Strategic acquisition potential from incumbents',
            'Platform expansion into adjacent markets'
        ]
    },

    sectorAdjustments: {
        framework: 'medtech' as 'general' | 'medtech',
        adjustmentFactors: [
            { category: 'Regulatory/Compliance', originalWeight: 10, adjustedWeight: 15, rationale: 'Critical for medtech success' },
            { category: 'Product-Market Fit', originalWeight: 10, adjustedWeight: 15, rationale: 'Clinical validation essential' },
            { category: 'Technology & IP', originalWeight: 5, adjustedWeight: 10, rationale: 'Patent protection crucial' }
        ],
        sectorSpecificInsights: [
            'FDA approval pathway clearly defined with 18-24 month timeline',
            'Reimbursement strategy validated with key payers',
            'Clinical evidence package exceeds regulatory requirements'
        ]
    },

    categoryBreakdown: [
        { category: 'Leadership', score: 8.5, weight: 15, contribution: 19.1, trend: 'stable', flag: 'green' },
        { category: 'Regulatory/Compliance', score: 7.0, weight: 15, contribution: 15.7, trend: 'improving', flag: 'yellow' },
        { category: 'Product-Market Fit', score: 9.0, weight: 15, contribution: 20.2, trend: 'improving', flag: 'green' },
        { category: 'Team Strength', score: 7.5, weight: 10, contribution: 11.2, trend: 'stable', flag: 'yellow' },
        { category: 'Technology & IP', score: 8.0, weight: 10, contribution: 12.0, trend: 'improving', flag: 'green' },
        { category: 'Business Model & Financials', score: 7.0, weight: 10, contribution: 10.5, trend: 'stable', flag: 'yellow' },
        { category: 'Go-to-Market Strategy', score: 6.5, weight: 5, contribution: 4.9, trend: 'declining', flag: 'red' },
        { category: 'Competition & Moat', score: 7.8, weight: 5, contribution: 5.8, trend: 'improving', flag: 'yellow' },
        { category: 'Market Potential', score: 8.8, weight: 5, contribution: 6.6, trend: 'improving', flag: 'green' },
        { category: 'Traction', score: 7.2, weight: 5, contribution: 5.4, trend: 'stable', flag: 'yellow' },
        { category: 'Scalability', score: 6.8, weight: 2.5, contribution: 2.5, trend: 'stable', flag: 'yellow' },
        { category: 'Risk Assessment', score: 7.5, weight: 2.5, contribution: 2.8, trend: 'improving', flag: 'yellow' }
    ],

    compositeScoreAnalysis: {
        currentScore: 7.2,
        benchmarkScore: 6.5,
        industryPercentile: 78,
        scoreDistribution: {
            excellent: 25, // > 8.5
            strong: 33,   // 7.0-8.5
            adequate: 25, // 5.5-7.0
            weak: 17      // < 5.5
        }
    },

    actionPriorities: [
        {
            priority: 1,
            category: 'Go-to-Market Strategy',
            action: 'Hire VP of Sales with medtech experience',
            impact: 'High',
            timeline: '60 days',
            investment: 'Medium'
        },
        {
            priority: 2,
            category: 'Regulatory/Compliance',
            action: 'Complete FDA pre-submission meeting',
            impact: 'High',
            timeline: '90 days',
            investment: 'Low'
        },
        {
            priority: 3,
            category: 'Scalability',
            action: 'Establish manufacturing partnerships',
            impact: 'Medium',
            timeline: '120 days',
            investment: 'High'
        }
    ]
};

const getDecisionBadge = (decision: string) => {
    switch (decision) {
        case 'PROCEED':
            return <Badge className="bg-green-100 text-green-800 border-green-300">Proceed</Badge>;
        case 'PROCEED_WITH_CONDITIONS':
            return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Proceed with Conditions</Badge>;
        case 'HOLD':
            return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Hold</Badge>;
        case 'PASS':
            return <Badge className="bg-red-100 text-red-800 border-red-300">Pass</Badge>;
        default:
            return <Badge variant="secondary">Under Review</Badge>;
    }
};
const getTrendIcon = (trend: string) => {
    switch (trend) {
        case 'improving':
            return <TrendingUp className="h-4 w-4 text-green-600" />;
        case 'declining':
            return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
        case 'stable':
        default:
            return <Target className="h-4 w-4 text-blue-600" />;
    }
};

const getFlagColor = (flag: string) => {
    switch (flag) {
        case 'green':
            return 'bg-green-500';
        case 'yellow':
            return 'bg-yellow-500';
        case 'red':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
};

interface TcaInterpretationSummaryProps {
    data?: typeof sampleTcaInterpretation;
}

export function TcaInterpretationSummary({ data = sampleTcaInterpretation }: TcaInterpretationSummaryProps) {
    const { framework, reportType } = useEvaluationContext();

    // Use sample data if none provided or if data is incomplete
    const tcaData = (data && data.triageOutcome) ? data : sampleTcaInterpretation;

    return (
        <DashboardCard
            title="TCA AI Interpretation Summary"
            icon={Brain}
            description="GPT narrative analysis of triage outcomes, highlights, and strategic recommendations"
        >
            <div className="space-y-8">
                {/* Executive Narrative */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Brain className="h-5 w-5 text-blue-600" />
                        Executive AI Narrative
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                        {tcaData.executiveNarrative}
                    </p>
                </div>

                {/* Triage Outcome */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Triage Decision</CardTitle>
                                {getDecisionBadge(tcaData.triageOutcome.decision)}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Confidence</span>
                                <span className="font-bold">{tcaData.triageOutcome.confidence}%</span>
                            </div>
                            <Progress value={tcaData.triageOutcome.confidence} className="h-2" />
                            <p className="text-sm text-muted-foreground mt-3">
                                {tcaData.triageOutcome.reasoning}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Composite Score Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary mb-1">
                                    {tcaData.compositeScoreAnalysis.currentScore}/10
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {tcaData.compositeScoreAnalysis.industryPercentile}th percentile
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Benchmark: {tcaData.compositeScoreAnalysis.benchmarkScore}</span>
                                <span className="font-medium text-primary">
                                    +{(tcaData.compositeScoreAnalysis.currentScore - tcaData.compositeScoreAnalysis.benchmarkScore).toFixed(1)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Risk-Opportunity Balance */}
                <div className="p-6 border rounded-lg">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Risk-Opportunity Balance
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600 mb-1">
                                {tcaData.riskOpportunityBalance.riskScore}/10
                            </div>
                            <div className="text-sm text-muted-foreground">Risk Score</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 mb-1">
                                {tcaData.riskOpportunityBalance.opportunityScore}/10
                            </div>
                            <div className="text-sm text-muted-foreground">Opportunity Score</div>
                        </div>

                        <div className="text-center">
                            <Badge
                                className={cn(
                                    tcaData.riskOpportunityBalance.balance === 'OPPORTUNITY_FAVORED' ? 'bg-green-100 text-green-800' :
                                        tcaData.riskOpportunityBalance.balance === 'BALANCED' ? 'bg-blue-100 text-blue-800' :
                                            'bg-red-100 text-red-800'
                                )}
                            >
                                {tcaData.riskOpportunityBalance.balance.replace('_', ' ')}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Highlights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                                <CheckCircle className="h-5 w-5" />
                                Key Strengths
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {tcaData.highlights.strengths.map((strength, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <Star className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">{strength}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                                <AlertTriangle className="h-5 w-5" />
                                Areas of Concern
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {tcaData.highlights.concerns.map((concern, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <XCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">{concern}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Detailed Score Breakdown</h3>
                    <div className="space-y-3">
                        {tcaData.categoryBreakdown.map((category, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                                <div className={`w-3 h-3 rounded-full ${getFlagColor(category.flag)}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium truncate">{category.category}</span>
                                        <div className="flex items-center gap-2">
                                            {getTrendIcon(category.trend)}
                                            <span className="font-bold">{category.score}/10</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>Weight: {category.weight}%</span>
                                        <span>Contribution: {category.contribution.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Priorities */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Immediate Action Priorities
                    </h3>
                    <div className="space-y-3">
                        {tcaData.actionPriorities.map((action, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Priority {action.priority}</Badge>
                                        <span className="font-medium">{action.category}</span>
                                    </div>
                                    <Badge className={cn(
                                        action.impact === 'High' ? 'bg-red-100 text-red-800' :
                                            action.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                    )}>
                                        {action.impact} Impact
                                    </Badge>
                                </div>
                                <p className="text-sm mb-2">{action.action}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Timeline: {action.timeline}</span>
                                    <span>Investment: {action.investment}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Next Steps */}
                {reportType === 'triage' && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <h4 className="font-semibold text-primary mb-3">Next Steps for Due Diligence</h4>
                        <ul className="space-y-2">
                            {tcaData.triageOutcome.nextSteps.map((step, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </DashboardCard>
    );
}
