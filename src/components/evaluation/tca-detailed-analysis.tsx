'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Legend
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Brain } from 'lucide-react';

interface TCACategory {
    category: string;
    score: number;
    weight: number;
    weightedScore: number;
    benchmark: number;
    status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
    insights: string[];
    recommendations: string[];
}

interface TCADetailedAnalysisProps {
    data?: {
        compositeScore: number;
        categories: TCACategory[];
        framework: 'general' | 'medtech';
        confidenceScore: number;
        benchmarkPercentile: number;
    };
}

const mockTCAData = {
    compositeScore: 7.8,
    framework: 'general' as const,
    confidenceScore: 0.89,
    benchmarkPercentile: 78,
    categories: [
        {
            category: 'Leadership',
            score: 8.5,
            weight: 20,
            weightedScore: 1.7,
            benchmark: 7.2,
            status: 'excellent' as const,
            insights: [
                'Strong founder-CEO with 15+ years industry experience',
                'Clear vision and strategic thinking demonstrated',
                'Effective team building and talent retention'
            ],
            recommendations: [
                'Consider adding independent board members',
                'Develop succession planning for key leadership roles'
            ]
        },
        {
            category: 'Product-Market Fit',
            score: 7.5,
            weight: 20,
            weightedScore: 1.5,
            benchmark: 6.8,
            status: 'good' as const,
            insights: [
                'Strong product adoption metrics with 85% user retention',
                'Clear value proposition validated by customer feedback',
                'Product roadmap aligned with market needs'
            ],
            recommendations: [
                'Expand customer discovery interviews',
                'Implement more granular product analytics',
                'Consider additional use case validation'
            ]
        },
        {
            category: 'Team Strength',
            score: 8.2,
            weight: 10,
            weightedScore: 0.82,
            benchmark: 7.5,
            status: 'excellent' as const,
            insights: [
                'Well-balanced team with complementary skills',
                'Key technical and business expertise covered',
                'Strong advisory board with industry connections'
            ],
            recommendations: [
                'Add senior sales leadership as company scales',
                'Consider expanding international expertise'
            ]
        },
        {
            category: 'Technology & IP',
            score: 7.8,
            weight: 10,
            weightedScore: 0.78,
            benchmark: 6.9,
            status: 'good' as const,
            insights: [
                'Proprietary technology with defensible moat',
                'Strong IP portfolio with 8 pending patents',
                'Scalable technical architecture'
            ],
            recommendations: [
                'Accelerate international patent filings',
                'Strengthen cybersecurity measures',
                'Develop technology partnership strategy'
            ]
        },
        {
            category: 'Business Model & Financials',
            score: 6.8,
            weight: 10,
            weightedScore: 0.68,
            benchmark: 7.1,
            status: 'needs_improvement' as const,
            insights: [
                'Recurring revenue model with predictable cash flows',
                'Unit economics improving but not yet optimal',
                'Clear path to profitability identified'
            ],
            recommendations: [
                'Improve customer acquisition cost efficiency',
                'Optimize pricing strategy for key segments',
                'Diversify revenue streams to reduce risk'
            ]
        },
        {
            category: 'Go-to-Market Strategy',
            score: 7.2,
            weight: 10,
            weightedScore: 0.72,
            benchmark: 6.5,
            status: 'good' as const,
            insights: [
                'Multi-channel distribution strategy in place',
                'Strong digital marketing performance',
                'Established partnerships with key players'
            ],
            recommendations: [
                'Scale sales team for enterprise segment',
                'Develop partner channel program',
                'Implement account-based marketing'
            ]
        },
        {
            category: 'Competition & Moat',
            score: 8.0,
            weight: 5,
            weightedScore: 0.40,
            benchmark: 6.8,
            status: 'excellent' as const,
            insights: [
                'Strong competitive positioning with unique value prop',
                'Network effects creating switching costs',
                'First-mover advantage in niche market'
            ],
            recommendations: [
                'Monitor emerging competitive threats',
                'Strengthen brand recognition and thought leadership'
            ]
        },
        {
            category: 'Market Potential',
            score: 8.8,
            weight: 5,
            weightedScore: 0.44,
            benchmark: 7.8,
            status: 'excellent' as const,
            insights: [
                'Large and growing addressable market ($12B TAM)',
                'Market tailwinds supporting category growth',
                'Clear expansion opportunities identified'
            ],
            recommendations: [
                'Develop international expansion strategy',
                'Explore adjacent market opportunities'
            ]
        },
        {
            category: 'Traction',
            score: 7.6,
            weight: 5,
            weightedScore: 0.38,
            benchmark: 6.9,
            status: 'good' as const,
            insights: [
                'Strong revenue growth (180% YoY)',
                'Expanding customer base with low churn',
                'Positive momentum in key metrics'
            ],
            recommendations: [
                'Focus on customer success metrics',
                'Implement predictive analytics for growth'
            ]
        },
        {
            category: 'Scalability',
            score: 7.4,
            weight: 2.5,
            weightedScore: 0.19,
            benchmark: 7.0,
            status: 'good' as const,
            insights: [
                'Technology platform built for scale',
                'Operational processes documented and repeatable',
                'Management team experienced in scaling companies'
            ],
            recommendations: [
                'Implement advanced automation systems',
                'Prepare for international compliance requirements'
            ]
        }
    ]
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
        case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'needs_improvement': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'critical': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'excellent': return <CheckCircle className="w-4 h-4" />;
        case 'good': return <TrendingUp className="w-4 h-4" />;
        case 'needs_improvement': return <AlertTriangle className="w-4 h-4" />;
        case 'critical': return <TrendingDown className="w-4 h-4" />;
        default: return null;
    }
};

const getOverallRating = (score: number) => {
    if (score >= 8.5) return { label: 'Excellent', color: 'text-green-600', description: 'Strong investment candidate' };
    if (score >= 7.5) return { label: 'Good', color: 'text-blue-600', description: 'Solid opportunity with manageable risks' };
    if (score >= 6.5) return { label: 'Fair', color: 'text-yellow-600', description: 'Moderate opportunity, requires improvements' };
    return { label: 'Needs Improvement', color: 'text-red-600', description: 'Significant concerns identified' };
};

export default function TCADetailedAnalysis({ data = mockTCAData }: TCADetailedAnalysisProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'insights'>('overview');

    const overallRating = getOverallRating(data.compositeScore);

    // Prepare data for charts
    const chartData = data.categories.map(cat => ({
        category: cat.category.replace(' & ', '\n& '),
        score: cat.score,
        benchmark: cat.benchmark,
        weight: cat.weight
    }));

    const radarData = data.categories.map(cat => ({
        category: cat.category.length > 15 ? cat.category.substring(0, 12) + '...' : cat.category,
        score: cat.score,
        benchmark: cat.benchmark
    }));

    const categoryStats = {
        excellent: data.categories.filter(c => c.status === 'excellent').length,
        good: data.categories.filter(c => c.status === 'good').length,
        needsImprovement: data.categories.filter(c => c.status === 'needs_improvement').length,
        critical: data.categories.filter(c => c.status === 'critical').length
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <Card className="border-2">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Brain className="w-6 h-6 text-primary" />
                                TCA Detailed Analysis
                            </CardTitle>
                            <CardDescription className="text-base">
                                Comprehensive evaluation across {data.categories.length} core categories using {data.framework} framework
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <div className={`text-3xl font-bold ${overallRating.color}`}>
                                {data.compositeScore.toFixed(1)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Composite Score
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">Overall Rating</span>
                            </div>
                            <Badge className={`${getStatusColor('excellent')} px-3 py-1`}>
                                {overallRating.label}
                            </Badge>
                            <p className="text-xs text-muted-foreground">{overallRating.description}</p>
                        </div>

                        <div className="space-y-2">
                            <span className="text-sm font-medium">Confidence Level</span>
                            <div className="flex items-center gap-2">
                                <Progress value={data.confidenceScore * 100} className="flex-1" />
                                <span className="text-sm font-mono">{(data.confidenceScore * 100).toFixed(0)}%</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-sm font-medium">Benchmark Percentile</span>
                            <div className="flex items-center gap-2">
                                <Progress value={data.benchmarkPercentile} className="flex-1" />
                                <span className="text-sm font-mono">{data.benchmarkPercentile}th</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-sm font-medium">Category Performance</span>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                                <span className="text-green-600">✓ {categoryStats.excellent + categoryStats.good} Strong</span>
                                <span className="text-yellow-600">⚠ {categoryStats.needsImprovement} Needs Work</span>
                                <span className="text-red-600">✗ {categoryStats.critical} Critical</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Navigation Tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
                {[
                    { key: 'overview', label: 'Overview & Charts' },
                    { key: 'categories', label: 'Category Details' },
                    { key: 'insights', label: 'Insights & Recommendations' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Sections */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Category Performance vs Benchmark</CardTitle>
                            <CardDescription>
                                Score comparison across all evaluation categories
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="category"
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                        fontSize={11}
                                    />
                                    <YAxis domain={[0, 10]} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="score" fill="#3b82f6" name="Your Score" />
                                    <Bar dataKey="benchmark" fill="#e5e7eb" name="Industry Benchmark" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Radar</CardTitle>
                            <CardDescription>
                                Multi-dimensional view of company strengths and areas for improvement
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <RadarChart data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis
                                        dataKey="category"
                                        tick={{ fontSize: 10 }}
                                    />
                                    <PolarRadiusAxis
                                        angle={0}
                                        domain={[0, 10]}
                                        tick={{ fontSize: 10 }}
                                    />
                                    <Radar
                                        name="Your Score"
                                        dataKey="score"
                                        stroke="#3b82f6"
                                        fill="#3b82f6"
                                        fillOpacity={0.3}
                                    />
                                    <Radar
                                        name="Benchmark"
                                        dataKey="benchmark"
                                        stroke="#e5e7eb"
                                        fill="#e5e7eb"
                                        fillOpacity={0.1}
                                    />
                                    <Legend />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'categories' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Category Breakdown</CardTitle>
                        <CardDescription>
                            Detailed scores, weights, and performance status for each evaluation category
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-center">Score</TableHead>
                                    <TableHead className="text-center">Weight</TableHead>
                                    <TableHead className="text-center">Weighted Score</TableHead>
                                    <TableHead className="text-center">vs Benchmark</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.categories.map((category, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            {category.category}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-mono">{category.score.toFixed(1)}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-sm text-muted-foreground">{category.weight}%</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-mono">{category.weightedScore.toFixed(2)}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`text-sm ${category.score > category.benchmark ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {category.score > category.benchmark ? '↗' : '↘'}
                                                {Math.abs(category.score - category.benchmark).toFixed(1)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={`${getStatusColor(category.status)} flex items-center gap-1 w-fit mx-auto`}>
                                                {getStatusIcon(category.status)}
                                                {category.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'insights' && (
                <div className="space-y-6">
                    {data.categories.map((category, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        {getStatusIcon(category.status)}
                                        {category.category}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-lg">{category.score.toFixed(1)}</span>
                                        <Badge className={getStatusColor(category.status)}>
                                            {category.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Key Insights</h4>
                                    <ul className="space-y-1">
                                        {category.insights.map((insight, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                {insight}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Recommendations</h4>
                                    <ul className="space-y-1">
                                        {category.recommendations.map((rec, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}