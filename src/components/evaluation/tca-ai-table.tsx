'use client';
import React, { Fragment, useState } from 'react';
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
import { Brain, ChevronDown, ChevronUp, Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { GenerateTcaScorecardOutput } from '@/ai/flows/schemas';

type TcaAiTableProps = {
    data: GenerateTcaScorecardOutput | null;
};

const flagVariants = {
    green: 'success',
    yellow: 'warning',
    red: 'destructive',
} as const;

const getFlagBadgeVariant = (flag: string) => {
    return flagVariants[flag as keyof typeof flagVariants] || 'secondary';
};

const getScoreColor = (score: number) => {
    if (score >= 8.0) return 'text-success';
    if (score >= 6.5) return 'text-warning';
    return 'text-destructive';
};

// Default 12 TCA categories with comprehensive data
const defaultCategories: GenerateTcaScorecardOutput['categories'] = [
    {
        category: 'Leadership',
        rawScore: 8.5,
        weight: 15,
        weightedScore: 1.28,
        flag: 'green',
        pestel: 'Political: Regulatory approval processes; Social: Public trust in leadership',
        description: 'Evaluates founder/CEO experience, vision clarity, and decision-making capability',
        strengths: 'Strong technical background, clear communication, proven track record',
        concerns: 'Limited industry experience, single founder risk',
        interpretation: 'Strong leadership foundation with room for advisory board expansion',
        aiRecommendation: 'Consider adding industry veterans to advisory board'
    },
    {
        category: 'Regulatory/Compliance',
        rawScore: 7.0,
        weight: 15,
        weightedScore: 1.05,
        flag: 'yellow',
        pestel: 'Political: FDA regulations; Legal: Compliance requirements; Economic: Approval costs',
        description: 'Assesses regulatory pathway clarity, compliance readiness, and approval timeline',
        strengths: 'Clear regulatory pathway identified, initial FDA engagement',
        concerns: 'Complex approval process, potential delays, high compliance costs',
        interpretation: 'Moderate regulatory risk with manageable pathway',
        aiRecommendation: 'Engage regulatory consultant and establish compliance timeline'
    },
    {
        category: 'Product-Market Fit',
        rawScore: 9.0,
        weight: 15,
        weightedScore: 1.35,
        flag: 'green',
        pestel: 'Social: Patient needs; Economic: Market demand; Technological: Innovation fit',
        description: 'Measures product-market alignment, customer validation, and market demand evidence',
        strengths: 'Strong customer validation, clear unmet need, positive pilot results',
        concerns: 'Limited market testing, potential competition',
        interpretation: 'Excellent product-market alignment with strong validation',
        aiRecommendation: 'Expand pilot programs and gather additional customer testimonials'
    },
    {
        category: 'Team Strength',
        rawScore: 7.5,
        weight: 10,
        weightedScore: 0.75,
        flag: 'yellow',
        pestel: 'Social: Team dynamics; Economic: Talent costs; Technological: Technical expertise',
        description: 'Evaluates team composition, expertise coverage, and execution capability',
        strengths: 'Strong technical team, complementary skills, good retention',
        concerns: 'Missing commercial expertise, limited sales experience',
        interpretation: 'Solid foundation requiring commercial talent addition',
        aiRecommendation: 'Recruit experienced commercial team members'
    },
    {
        category: 'Technology & IP',
        rawScore: 8.0,
        weight: 10,
        weightedScore: 0.80,
        flag: 'green',
        pestel: 'Technological: Innovation level; Legal: IP protection; Economic: R&D investment',
        description: 'Assesses technology differentiation, IP portfolio strength, and defensibility',
        strengths: 'Strong patent portfolio, innovative technology, clear differentiation',
        concerns: 'Competitive IP landscape, potential infringement risks',
        interpretation: 'Well-protected innovative technology with competitive advantages',
        aiRecommendation: 'Continue IP development and monitor competitive landscape'
    },
    {
        category: 'Business Model & Financials',
        rawScore: 7.0,
        weight: 10,
        weightedScore: 0.70,
        flag: 'yellow',
        pestel: 'Economic: Revenue model; Legal: Contract structures; Political: Reimbursement',
        description: 'Reviews revenue model viability, unit economics, and financial sustainability',
        strengths: 'Clear revenue model, positive unit economics potential',
        concerns: 'Unproven scalability, reimbursement uncertainty',
        interpretation: 'Promising model requiring validation and refinement',
        aiRecommendation: 'Validate unit economics through pilot implementations'
    },
    {
        category: 'Go-to-Market Strategy',
        rawScore: 6.5,
        weight: 5,
        weightedScore: 0.33,
        flag: 'red',
        pestel: 'Social: Customer adoption; Economic: Market access costs; Political: Channel regulations',
        description: 'Evaluates market entry strategy, sales approach, and customer acquisition plan',
        strengths: 'Identified key customer segments, partnership opportunities',
        concerns: 'Unclear sales strategy, limited channel validation, high CAC',
        interpretation: 'GTM strategy needs significant development and validation',
        aiRecommendation: 'Develop detailed sales playbook and validate customer acquisition channels'
    },
    {
        category: 'Competition & Moat',
        rawScore: 7.8,
        weight: 5,
        weightedScore: 0.39,
        flag: 'yellow',
        pestel: 'Economic: Market competition; Technological: Competitive advantages; Legal: Barriers',
        description: 'Analyzes competitive landscape, differentiation, and sustainable advantages',
        strengths: 'Clear differentiation, technological advantages, patent protection',
        concerns: 'Emerging competitors, potential market consolidation',
        interpretation: 'Strong competitive position with moderate threat monitoring needed',
        aiRecommendation: 'Monitor competitive developments and strengthen market positioning'
    },
    {
        category: 'Market Potential',
        rawScore: 8.8,
        weight: 5,
        weightedScore: 0.44,
        flag: 'green',
        pestel: 'Economic: Market size; Social: Demographics; Technological: Adoption trends',
        description: 'Assesses total addressable market, growth trends, and market dynamics',
        strengths: 'Large TAM, growing market, favorable demographics',
        concerns: 'Market fragmentation, adoption barriers',
        interpretation: 'Excellent market opportunity with strong growth potential',
        aiRecommendation: 'Focus on addressable segments and develop market entry priorities'
    },
    {
        category: 'Traction',
        rawScore: 7.2,
        weight: 5,
        weightedScore: 0.36,
        flag: 'yellow',
        pestel: 'Economic: Revenue growth; Social: Customer adoption; Technological: Usage metrics',
        description: 'Measures customer adoption, revenue growth, and validation milestones',
        strengths: 'Early customer adoption, positive feedback, pilot agreements',
        concerns: 'Limited revenue, slow customer onboarding, pilot conversion',
        interpretation: 'Promising early traction requiring acceleration',
        aiRecommendation: 'Accelerate pilot conversions and expand customer base'
    },
    {
        category: 'Scalability',
        rawScore: 6.8,
        weight: 2.5,
        weightedScore: 0.17,
        flag: 'yellow',
        pestel: 'Technological: Infrastructure; Economic: Cost structure; Social: Team scaling',
        description: 'Evaluates business scalability, operational leverage, and growth sustainability',
        strengths: 'Technology scalability, automation potential',
        concerns: 'Manual processes, limited operational systems',
        interpretation: 'Moderate scalability with operational improvements needed',
        aiRecommendation: 'Implement scalable processes and operational systems'
    },
    {
        category: 'Risk Assessment',
        rawScore: 7.5,
        weight: 2.5,
        weightedScore: 0.19,
        flag: 'yellow',
        pestel: 'All factors: Comprehensive risk evaluation across PESTEL dimensions',
        description: 'Overall risk evaluation including operational, financial, and strategic risks',
        strengths: 'Identified risk mitigation strategies, proactive risk management',
        concerns: 'Regulatory risks, market timing, execution risks',
        interpretation: 'Manageable risk profile with identified mitigation strategies',
        aiRecommendation: 'Implement risk monitoring dashboard and contingency plans'
    }
];

export function TcaAiTable({ data }: TcaAiTableProps) {
    const { isPrivilegedUser } = useEvaluationContext();
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const categories = data?.categories || defaultCategories;
    const totalWeightedScore = categories.reduce((sum, cat) => sum + cat.weightedScore, 0);

    const toggleRow = (category: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedRows(newExpanded);
    };

    return (
        <DashboardCard
            title="TCA AI Table – 12 Categories"
            icon={Brain}
            description="Comprehensive category-by-category analysis with AI interpretation and PESTEL factors"
        >
            <div className="space-y-4">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Category</TableHead>
                                <TableHead className="text-center w-[100px]">Raw Score</TableHead>
                                <TableHead className="text-center w-[100px]">Weight</TableHead>
                                <TableHead className="text-center w-[120px]">Weighted Score</TableHead>
                                <TableHead className="text-center w-[80px]">Flag</TableHead>
                                <TableHead className="w-[150px]">PESTEL</TableHead>
                                <TableHead className="w-[200px]">Description</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((category) => (
                                <React.Fragment key={category.category}>
                                    <TableRow className="hover:bg-muted/50">
                                        <TableCell className="font-medium">
                                            {category.category}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={cn('font-bold', getScoreColor(category.rawScore))}>
                                                {category.rawScore.toFixed(1)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground">
                                            {category.weight}%
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-bold text-primary">
                                                {category.weightedScore.toFixed(2)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={getFlagBadgeVariant(category.flag)} className="capitalize">
                                                {category.flag}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger className="text-left">
                                                        {category.pestel.length > 50
                                                            ? `${category.pestel.substring(0, 47)}...`
                                                            : category.pestel
                                                        }
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-md">
                                                        <p>{category.pestel}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {category.description.length > 80
                                                ? `${category.description.substring(0, 77)}...`
                                                : category.description
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <Collapsible open={expandedRows.has(category.category)}>
                                                <CollapsibleTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleRow(category.category)}
                                                    >
                                                        {expandedRows.has(category.category) ? (
                                                            <ChevronUp className="size-4" />
                                                        ) : (
                                                            <ChevronDown className="size-4" />
                                                        )}
                                                    </Button>
                                                </CollapsibleTrigger>
                                            </Collapsible>
                                        </TableCell>
                                    </TableRow>

                                    {expandedRows.has(category.category) && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="bg-muted/30 p-6">
                                                <Collapsible open={expandedRows.has(category.category)}>
                                                    <CollapsibleContent>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <h5 className="font-semibold text-success mb-2 flex items-center gap-2">
                                                                        <div className="w-2 h-2 bg-success rounded-full"></div>
                                                                        Strengths
                                                                    </h5>
                                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                                        {category.strengths}
                                                                    </p>
                                                                </div>

                                                                <div>
                                                                    <h5 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                                                                        <div className="w-2 h-2 bg-destructive rounded-full"></div>
                                                                        Concerns
                                                                    </h5>
                                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                                        {category.concerns}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <div>
                                                                    <h5 className="font-semibold text-primary mb-2 flex items-center gap-2">
                                                                        <Brain className="size-4" />
                                                                        AI Interpretation
                                                                    </h5>
                                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                                        {category.interpretation}
                                                                    </p>
                                                                </div>

                                                                {isPrivilegedUser && category.aiRecommendation && (
                                                                    <div>
                                                                        <h5 className="font-semibold text-warning mb-2 flex items-center gap-2">
                                                                            <Info className="size-4" />
                                                                            AI Recommendation
                                                                        </h5>
                                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                                            {category.aiRecommendation}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}

                            <TableRow className="bg-muted/50 font-bold border-t-2">
                                <TableCell>Total Composite Score</TableCell>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">
                                    Sector-adjusted
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className={cn('text-lg font-bold', getScoreColor(totalWeightedScore))}>
                                        {totalWeightedScore.toFixed(2)}/10
                                    </span>
                                </TableCell>
                                <TableCell colSpan={4}></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Brain className="size-5 text-primary" />
                        AI Interpretation Summary
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {data?.summary || "GPT-generated narrative analyzing the triage outcome, highlighting key strengths and opportunities while balancing risk assessment. The analysis shows strong market potential and technology foundation, with moderate execution and regulatory risks that require focused attention and strategic planning."}
                    </p>
                </div>
            </div>
        </DashboardCard>
    );
}
