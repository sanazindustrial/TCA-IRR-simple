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

export function TcaAiTable({ data }: TcaAiTableProps) {
    const { isPrivilegedUser } = useEvaluationContext();
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Normalize categories: ALWAYS recalculate weighted scores to ensure correctness
    const rawCategories = data?.categories ?? [];
    if (!rawCategories.length) {
        return (
            <DashboardCard
                title="TCA AI Table – 12 Categories"
                icon={Brain}
                description="Comprehensive category-by-category analysis with AI interpretation and PESTEL factors"
            >
                <div className="rounded-lg border border-amber-300 bg-amber-50/40 p-4 text-sm text-amber-800">
                    TCA category data is not available. Go back, provide required inputs, and regenerate.
                </div>
            </DashboardCard>
        );
    }
    const categories = rawCategories.map(cat => {
        // ALWAYS calculate correct weighted score: rawScore × (weight / 100)
        const correctWeightedScore = cat.rawScore * (cat.weight / 100);
        return {
            ...cat,
            weightedScore: parseFloat(correctWeightedScore.toFixed(2))
        };
    });
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
