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
import type { GenerateTcaScorecardOutput } from '@/ai/flows/schemas';

const sampleData: GenerateTcaScorecardOutput['categories'] = [
    { category: 'Leadership', rawScore: 8.5, weight: 15, weightedScore: 1.28, flag: 'green', pestel: '', description: '', strengths: '', concerns: '', interpretation: '' },
    { category: 'Regulatory', rawScore: 7.0, weight: 15, weightedScore: 1.05, flag: 'yellow', pestel: '', description: '', strengths: '', concerns: '', interpretation: '' },
    { category: 'Product-Market Fit', rawScore: 9.0, weight: 15, weightedScore: 1.35, flag: 'green', pestel: '', description: '', strengths: '', concerns: '', interpretation: '' },
    { category: 'Team Strength', rawScore: 7.5, weight: 10, weightedScore: 0.75, flag: 'yellow', pestel: '', description: '', strengths: '', concerns: '', interpretation: '' },
    { category: 'Tech/IP', rawScore: 8.0, weight: 10, weightedScore: 0.80, flag: 'green', pestel: '', description: '', strengths: '', concerns: '', interpretation: '' },
    { category: 'Financials', rawScore: 7.0, weight: 10, weightedScore: 0.70, flag: 'yellow', pestel: '', description: '', strengths: '', concerns: '', interpretation: '' },
    { category: 'GTM', rawScore: 6.5, weight: 5, weightedScore: 0.33, flag: 'red', pestel: '', description: '', strengths: '', concerns: '', interpretation: '' },
    { category: 'Competition & Moat', rawScore: 7.8, weight: 5, weightedScore: 0.39, flag: 'yellow', pestel: '', description: '', strengths: '', concerns: '', interpretation: '' },
    { category: 'Market Potential', rawScore: 8.8, weight: 5, weightedScore: 0.44, flag: 'green', pestel: '', description: '', strengths: '', concerns: '', interpretation: '' },
    { category: 'Traction/Testimonials', rawScore: 7.2, weight: 5, weightedScore: 0.36, flag: 'yellow', pestel: '', description: '', strengths: '', concerns: '', interpretation: '' },
];


export function WeightedScoreBreakdown() {
    const { framework } = useEvaluationContext();
    const totalScore = sampleData.reduce((acc, item) => acc + item.weightedScore, 0);

    return (
        <DashboardCard
            title="Weighted Score Breakdown"
            icon={Calculator}
            description={`Detailed calculation for the ${framework === 'medtech' ? 'MedTech' : 'General Tech'} framework.`}
        >
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Raw Score</TableHead>
                        <TableHead className="text-center">Sector Weight</TableHead>
                        <TableHead className="text-center">Weighted Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sampleData.map((item) => (
                        <TableRow key={item.category}>
                            <TableCell className="font-medium">{item.category}</TableCell>
                            <TableCell className="text-center">{item.rawScore.toFixed(1)}</TableCell>
                            <TableCell className="text-center text-muted-foreground">{item.weight}%</TableCell>
                            <TableCell className="text-center font-bold text-primary">{item.weightedScore.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={3} className="text-right">Composite Score</TableCell>
                        <TableCell className="text-center text-lg">{totalScore.toFixed(2)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </DashboardCard>
    )
}
