'use client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useEvaluationContext } from './evaluation-provider';
import { DashboardCard } from '../shared/dashboard-card';
import { Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GenerateTcaScorecardOutput } from '@/ai/flows/schemas';

const getScoreColor = (score: number) => {
    if (score >= 8.0) return 'text-success';
    if (score >= 6.5) return 'text-warning';
    return 'text-destructive';
};

// Updated sample data with 12 categories and scores out of 10
const sampleData: GenerateTcaScorecardOutput['categories'] = [
    { category: 'Leadership', rawScore: 8.5, weight: 15, weightedScore: 1.28, flag: 'green', pestel: '', description: '', strengths: '', concerns: '', interpretation: '', aiRecommendation: '' },
    { category: 'Regulatory/Compliance', rawScore: 7.0, weight: 15, weightedScore: 1.05, flag: 'yellow', pestel: '', description: '', strengths: '', concerns: '', interpretation: '', aiRecommendation: '' },
    { category: 'Product-Market Fit', rawScore: 9.0, weight: 15, weightedScore: 1.35, flag: 'green', pestel: '', description: '', strengths: '', concerns: '', interpretation: '', aiRecommendation: '' },
    { category: 'Team Strength', rawScore: 7.5, weight: 10, weightedScore: 0.75, flag: 'yellow', pestel: '', description: '', strengths: '', concerns: '', interpretation: '', aiRecommendation: '' },
    { category: 'Technology & IP', rawScore: 8.0, weight: 10, weightedScore: 0.80, flag: 'green', pestel: '', description: '', strengths: '', concerns: '', interpretation: '', aiRecommendation: '' },
    { category: 'Business Model & Financials', rawScore: 7.0, weight: 10, weightedScore: 0.70, flag: 'yellow', pestel: '', description: '', strengths: '', concerns: '', interpretation: '', aiRecommendation: '' },
    { category: 'Go-to-Market Strategy', rawScore: 6.5, weight: 5, weightedScore: 0.33, flag: 'red', pestel: '', description: '', strengths: '', concerns: '', interpretation: '', aiRecommendation: '' },
    { category: 'Competition & Moat', rawScore: 7.8, weight: 5, weightedScore: 0.39, flag: 'yellow', pestel: '', description: '', strengths: '', concerns: '', interpretation: '', aiRecommendation: '' },
    { category: 'Market Potential', rawScore: 8.8, weight: 5, weightedScore: 0.44, flag: 'green', pestel: '', description: '', strengths: '', concerns: '', interpretation: '', aiRecommendation: '' },
    { category: 'Traction', rawScore: 7.2, weight: 5, weightedScore: 0.36, flag: 'yellow', pestel: '', description: '', strengths: '', concerns: '', interpretation: '', aiRecommendation: '' },
    { category: 'Scalability', rawScore: 6.8, weight: 2.5, weightedScore: 0.17, flag: 'yellow', pestel: '', description: '', strengths: '', concerns: '', interpretation: '', aiRecommendation: '' },
    { category: 'Risk Assessment', rawScore: 7.5, weight: 2.5, weightedScore: 0.19, flag: 'yellow', pestel: '', description: '', strengths: '', concerns: '', interpretation: '', aiRecommendation: '' },
];

type WeightedScoreBreakdownProps = {
    data?: GenerateTcaScorecardOutput | null;
};

export function WeightedScoreBreakdown({ data }: WeightedScoreBreakdownProps) {
    const { framework } = useEvaluationContext();
    const categories = data?.categories || sampleData;
    const totalScore = categories.reduce((acc, item) => acc + item.weightedScore, 0);
    const totalWeight = categories.reduce((acc, item) => acc + item.weight, 0);

    return (
        <DashboardCard
            title="Weighted Score Breakdown & Detailed Analysis"
            icon={Calculator}
            description={`Sector-adjusted calculation for the ${framework === 'medtech' ? 'MedTech' : 'General Tech'} framework showing scores out of 10.`}
        >
            <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-sm text-muted-foreground">Framework</div>
                            <div className="font-bold text-primary">
                                {framework === 'medtech' ? 'MedTech/Life Sciences' : 'General Technology'}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Categories Evaluated</div>
                            <div className="font-bold text-foreground">{categories.length}/12</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Total Weight Coverage</div>
                            <div className={cn('font-bold', totalWeight === 100 ? 'text-success' : 'text-warning')}>
                                {totalWeight.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-center">Raw Score (/10)</TableHead>
                            <TableHead className="text-center">Sector Weight</TableHead>
                            <TableHead className="text-center">Weighted Score</TableHead>
                            <TableHead className="text-center">Contribution</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((item) => (
                            <TableRow key={item.category}>
                                <TableCell className="font-medium">{item.category}</TableCell>
                                <TableCell className="text-center">
                                    <span className={cn('font-bold', getScoreColor(item.rawScore))}>
                                        {item.rawScore.toFixed(1)}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">{item.weight}%</TableCell>
                                <TableCell className="text-center font-bold text-primary">
                                    {item.weightedScore.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-center text-sm text-muted-foreground">
                                    {((item.weightedScore / totalScore) * 100).toFixed(1)}%
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold border-t-2">
                            <TableCell>Sector-Adjusted Total Score</TableCell>
                            <TableCell className="text-center text-muted-foreground">
                                Weighted Avg
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                                {totalWeight.toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-center text-lg">
                                <span className={cn('font-bold', getScoreColor(totalScore))}>
                                    {totalScore.toFixed(2)}/10
                                </span>
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                                100%
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <div className="mt-4 p-4 border-l-4 border-primary bg-primary/5 rounded-r-lg">
                    <h4 className="font-semibold text-primary mb-2">Calculation Method</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Each category is scored 1-10, then multiplied by its sector-specific weight percentage.
                        The weighted scores are summed to create the composite score out of 10.
                        Framework weights are optimized for {framework === 'medtech' ? 'medical technology and life sciences' : 'general technology'} evaluation criteria.
                    </p>
                </div>
            </div>
        </DashboardCard>
    );
}
