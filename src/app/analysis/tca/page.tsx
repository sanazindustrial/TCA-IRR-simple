'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Brain,
    Target,
    BarChart3,
    FileText,
    Settings,
    Play,
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Info
} from 'lucide-react';
import TCADetailedAnalysis from '@/components/evaluation/tca-detailed-analysis';

interface TCAConfiguration {
    framework: 'general' | 'medtech' | 'fintech' | 'biotech' | 'saas';
    categories: {
        [key: string]: {
            weight: number;
            enabled: boolean;
            customCriteria?: string[];
        };
    };
    benchmarks: {
        industry: string;
        stage: string;
        region: string;
    };
    customWeights: boolean;
}

interface TCAAnalysisResult {
    id: string;
    companyName: string;
    compositeScore: number;
    confidenceScore: number;
    benchmarkPercentile: number;
    framework: string;
    categories: any[];
    timestamp: string;
    status: 'completed' | 'in_progress' | 'failed';
}

const defaultConfiguration: TCAConfiguration = {
    framework: 'general',
    categories: {
        'Leadership': { weight: 20, enabled: true },
        'Product-Market Fit': { weight: 20, enabled: true },
        'Team Strength': { weight: 10, enabled: true },
        'Technology & IP': { weight: 10, enabled: true },
        'Business Model & Financials': { weight: 10, enabled: true },
        'Go-to-Market Strategy': { weight: 10, enabled: true },
        'Competition & Moat': { weight: 5, enabled: true },
        'Market Potential': { weight: 5, enabled: true },
        'Traction': { weight: 5, enabled: true },
        'Scalability': { weight: 2.5, enabled: true },
        'Risk Factors': { weight: 2.5, enabled: true }
    },
    benchmarks: {
        industry: 'technology',
        stage: 'series-a',
        region: 'north-america'
    },
    customWeights: false
};

const mockAnalysisResults: TCAAnalysisResult[] = [
    {
        id: '1',
        companyName: 'TechCorp Inc.',
        compositeScore: 7.8,
        confidenceScore: 0.89,
        benchmarkPercentile: 78,
        framework: 'general',
        categories: [],
        timestamp: '2024-12-26T10:30:00Z',
        status: 'completed'
    },
    {
        id: '2',
        companyName: 'MedDevice Solutions',
        compositeScore: 8.2,
        confidenceScore: 0.92,
        benchmarkPercentile: 85,
        framework: 'medtech',
        categories: [],
        timestamp: '2024-12-25T15:45:00Z',
        status: 'completed'
    }
];

export default function TCAAnalysisPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [configuration, setConfiguration] = useState<TCAConfiguration>(defaultConfiguration);
    const [analysisResults, setAnalysisResults] = useState<TCAAnalysisResult[]>(mockAnalysisResults);
    const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [companyInput, setCompanyInput] = useState('');

    // Load saved configuration on mount
    useEffect(() => {
        const savedConfig = localStorage.getItem('tca-configuration');
        if (savedConfig) {
            try {
                setConfiguration(JSON.parse(savedConfig));
            } catch (error) {
                console.warn('Failed to load saved configuration:', error);
            }
        }
    }, []);

    const saveConfiguration = () => {
        localStorage.setItem('tca-configuration', JSON.stringify(configuration));
    };

    const updateCategoryWeight = (category: string, weight: number) => {
        setConfiguration(prev => ({
            ...prev,
            categories: {
                ...prev.categories,
                [category]: {
                    ...prev.categories[category],
                    weight: weight
                }
            }
        }));
    };

    const toggleCategory = (category: string) => {
        setConfiguration(prev => ({
            ...prev,
            categories: {
                ...prev.categories,
                [category]: {
                    ...prev.categories[category],
                    enabled: !prev.categories[category].enabled
                }
            }
        }));
    };

    const runAnalysis = async () => {
        if (!companyInput.trim()) return;

        setIsRunning(true);

        // Simulate analysis process
        setTimeout(() => {
            const newResult: TCAAnalysisResult = {
                id: Date.now().toString(),
                companyName: companyInput,
                compositeScore: Math.random() * 3 + 7, // 7-10 range
                confidenceScore: Math.random() * 0.3 + 0.7, // 0.7-1.0 range
                benchmarkPercentile: Math.floor(Math.random() * 40 + 60), // 60-100 range
                framework: configuration.framework,
                categories: [],
                timestamp: new Date().toISOString(),
                status: 'completed'
            };

            setAnalysisResults(prev => [newResult, ...prev]);
            setSelectedAnalysis(newResult.id);
            setIsRunning(false);
            setActiveTab('results');
        }, 3000);
    };

    const totalWeight = Object.values(configuration.categories)
        .filter(cat => cat.enabled)
        .reduce((sum, cat) => sum + cat.weight, 0);

    const isConfigurationValid = Math.abs(totalWeight - 100) < 0.1;

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Brain className="w-8 h-8 text-primary" />
                        TCA Analysis Center
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Total Cost of Acquisition Analysis for Investment Decision Making
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={saveConfiguration}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Config
                    </Button>
                    <Button
                        onClick={runAnalysis}
                        disabled={!companyInput.trim() || isRunning || !isConfigurationValid}
                    >
                        {isRunning ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4 mr-2" />
                        )}
                        {isRunning ? 'Running Analysis...' : 'Run Analysis'}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="configuration" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Configuration
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        New Analysis
                    </TabsTrigger>
                    <TabsTrigger value="results" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Results
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Total Analyses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analysisResults.length}</div>
                                <p className="text-xs text-muted-foreground">
                                    +2 this week
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Average Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {analysisResults.length > 0
                                        ? (analysisResults.reduce((sum, r) => sum + r.compositeScore, 0) / analysisResults.length).toFixed(1)
                                        : '0.0'
                                    }
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Across all companies
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Framework Usage</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold capitalize">{configuration.framework}</div>
                                <p className="text-xs text-muted-foreground">
                                    Current active framework
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Analyses */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Analyses</CardTitle>
                            <CardDescription>
                                Latest TCA analysis results
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analysisResults.slice(0, 5).map((result) => (
                                    <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <div>
                                                <div className="font-medium">{result.companyName}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {new Date(result.timestamp).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline">{result.framework}</Badge>
                                            <div className="text-right">
                                                <div className="font-bold">{result.compositeScore.toFixed(1)}</div>
                                                <div className="text-xs text-muted-foreground">{result.benchmarkPercentile}th percentile</div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedAnalysis(result.id);
                                                    setActiveTab('results');
                                                }}
                                            >
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Configuration Tab */}
                <TabsContent value="configuration" className="space-y-6">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Configure your TCA analysis parameters. Total category weights must equal 100%.
                        </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Framework Settings</CardTitle>
                                <CardDescription>
                                    Choose the analysis framework and benchmarks
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="framework">Analysis Framework</Label>
                                    <select
                                        id="framework"
                                        title="Select analysis framework"
                                        className="w-full p-2 border rounded-md"
                                        value={configuration.framework}
                                        onChange={(e) => setConfiguration(prev => ({
                                            ...prev,
                                            framework: e.target.value as any
                                        }))}
                                    >
                                        <option value="general">General Technology</option>
                                        <option value="medtech">MedTech</option>
                                        <option value="fintech">FinTech</option>
                                        <option value="biotech">BioTech</option>
                                        <option value="saas">SaaS</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="industry">Industry</Label>
                                        <select
                                            id="industry"
                                            title="Select industry benchmark"
                                            className="w-full p-2 border rounded-md"
                                            value={configuration.benchmarks.industry}
                                            onChange={(e) => setConfiguration(prev => ({
                                                ...prev,
                                                benchmarks: { ...prev.benchmarks, industry: e.target.value }
                                            }))}
                                        >
                                            <option value="technology">Technology</option>
                                            <option value="healthcare">Healthcare</option>
                                            <option value="financial">Financial Services</option>
                                            <option value="consumer">Consumer</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="stage">Stage</Label>
                                        <select
                                            id="stage"
                                            title="Select company stage"
                                            className="w-full p-2 border rounded-md"
                                            value={configuration.benchmarks.stage}
                                            onChange={(e) => setConfiguration(prev => ({
                                                ...prev,
                                                benchmarks: { ...prev.benchmarks, stage: e.target.value }
                                            }))}
                                        >
                                            <option value="pre-seed">Pre-Seed</option>
                                            <option value="seed">Seed</option>
                                            <option value="series-a">Series A</option>
                                            <option value="series-b">Series B+</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="region">Region</Label>
                                        <select
                                            id="region"
                                            title="Select geographic region"
                                            className="w-full p-2 border rounded-md"
                                            value={configuration.benchmarks.region}
                                            onChange={(e) => setConfiguration(prev => ({
                                                ...prev,
                                                benchmarks: { ...prev.benchmarks, region: e.target.value }
                                            }))}
                                        >
                                            <option value="north-america">North America</option>
                                            <option value="europe">Europe</option>
                                            <option value="asia-pacific">Asia Pacific</option>
                                            <option value="global">Global</option>
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Category Weights</CardTitle>
                                <CardDescription>
                                    Adjust the weight of each analysis category (total must equal 100%)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {Object.entries(configuration.categories).map(([category, config]) => (
                                        <div key={category} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`category-${category.replace(/\s/g, '-').toLowerCase()}`}
                                                    title={`Toggle ${category} category`}
                                                    checked={config.enabled}
                                                    onChange={() => toggleCategory(category)}
                                                    className="rounded"
                                                />
                                                <label 
                                                    htmlFor={`category-${category.replace(/\s/g, '-').toLowerCase()}`}
                                                    className="text-sm cursor-pointer"
                                                >
                                                    {category}
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                    value={config.weight}
                                                    onChange={(e) => updateCategoryWeight(category, parseFloat(e.target.value) || 0)}
                                                    className="w-16 text-sm"
                                                    disabled={!config.enabled}
                                                />
                                                <span className="text-sm text-muted-foreground w-4">%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* New Analysis Tab */}
                <TabsContent value="analysis" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Run New TCA Analysis</CardTitle>
                            <CardDescription>
                                Enter company information to start a comprehensive TCA evaluation
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="company">Company Name</Label>
                                <Input
                                    id="company"
                                    placeholder="Enter company name..."
                                    value={companyInput}
                                    onChange={(e) => setCompanyInput(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Company Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Brief description of the company, its products, and market..."
                                    rows={3}
                                />
                            </div>

                            {!isConfigurationValid && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Configuration invalid: Category weights total {totalWeight.toFixed(1)}% instead of 100%.
                                        Please adjust weights in the Configuration tab.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex items-center gap-4 pt-4">
                                <Button
                                    onClick={runAnalysis}
                                    disabled={!companyInput.trim() || isRunning || !isConfigurationValid}
                                    className="flex-1"
                                >
                                    {isRunning ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Running Analysis...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            Start TCA Analysis
                                        </>
                                    )}
                                </Button>
                            </div>

                            {isRunning && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Analysis Progress</span>
                                        <span>Processing...</span>
                                    </div>
                                    <Progress value={33} className="w-full" />
                                    <p className="text-xs text-muted-foreground">
                                        Analyzing company data across {Object.values(configuration.categories).filter(c => c.enabled).length} categories...
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Results Tab */}
                <TabsContent value="results" className="space-y-6">
                    {selectedAnalysis ? (
                        <TCADetailedAnalysis />
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Analysis Results</CardTitle>
                                <CardDescription>
                                    Select an analysis to view detailed results
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {analysisResults.map((result) => (
                                        <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                            onClick={() => setSelectedAnalysis(result.id)}>
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                                <div>
                                                    <div className="font-medium">{result.companyName}</div>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <span>{new Date(result.timestamp).toLocaleDateString()}</span>
                                                        <Badge variant="outline">{result.framework}</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold">{result.compositeScore.toFixed(1)}</div>
                                                <div className="text-sm text-muted-foreground">{result.benchmarkPercentile}th percentile</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}