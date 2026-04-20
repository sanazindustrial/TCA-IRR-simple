'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
    CheckCircle2,
    Loader2,
    XCircle,
    Play,
    ArrowLeft,
    FileText,
    AlertTriangle,
    TrendingUp,
    BarChart3,
    Target,
    Users,
    Shield,
    Layers,
    Compass,
    Clock,
    Database,
    SlidersHorizontal,
    Download,
    Save,
    RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { runAnalysis } from '@/app/analysis/actions';
import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';
import { cn } from '@/lib/utils';
import { settingsApi, ModuleSetting } from '@/lib/settings-api';
import { generateEvaluationId, generateAnalysisId, generateReportId } from '@/lib/unified-record-tracking';

// Module definitions with versions and descriptions (8 Core Modules)
// Default all modules to active=true, but this will be overridden by settings
const ALL_MODULES = [
    {
        id: 'tca-scorecard',
        apiId: 'tca',  // Maps to settings API module_id
        name: 'TCA Scorecard',
        version: 'v2.1',
        description: 'Central evaluation across 12 fundamental categories.',
        icon: Target,
        weight: 15,
        active: true
    },
    {
        id: 'risk-assessment',
        apiId: 'risk',
        name: 'Risk Assessment',
        version: 'v1.8',
        description: 'Comprehensive risk analysis across 14 domains.',
        icon: Shield,
        weight: 13,
        active: true
    },
    {
        id: 'macro-trends',
        apiId: 'macro',
        name: 'Macro Trends',
        version: 'v1.5',
        description: 'PESTEL analysis and market trend alignment.',
        icon: TrendingUp,
        weight: 12,
        active: true
    },
    {
        id: 'team-analysis',
        apiId: 'team',
        name: 'Team Analysis',
        version: 'v1.4',
        description: 'Founder profile and team strength assessment.',
        icon: Users,
        weight: 13,
        active: true
    },
    {
        id: 'benchmark',
        apiId: 'benchmark',
        name: 'Benchmark',
        version: 'v1.5',
        description: 'Performance comparison vs. sector averages.',
        icon: BarChart3,
        weight: 12,
        active: true
    },
    {
        id: 'growth-classifier',
        apiId: 'growth',
        name: 'Growth Classifier',
        version: 'v3.1',
        description: 'Predict growth potential and trajectory.',
        icon: TrendingUp,
        weight: 12,
        active: true
    },
    {
        id: 'gap-analysis',
        apiId: 'gap',
        name: 'Gap Analysis',
        version: 'v2.0',
        description: 'Identify performance gaps and opportunities.',
        icon: Layers,
        weight: 11,
        active: true
    },
    {
        id: 'simulation',
        apiId: 'sim',
        name: 'Simulation',
        version: 'v1.2',
        description: 'What-if scenario modeling and projections.',
        icon: Compass,
        weight: 12,
        active: true
    },
];

// Type for module with active state
interface Module {
    id: string;
    apiId: string;
    name: string;
    version: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    weight: number;
    active: boolean;
}

type ModuleStatus = 'pending' | 'running' | 'success' | 'error';

interface ModuleState {
    status: ModuleStatus;
    progress: number;
    message: string;
    score?: number;
    startTime?: number;
    endTime?: number;
}

export default function AnalysisRunPage() {
    const router = useRouter();
    const { toast } = useToast();

    // State for modules loaded from settings
    const [modules, setModules] = useState<Module[]>(ALL_MODULES);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Filter to get only active modules
    const activeModules = useMemo(() => modules.filter(m => m.active), [modules]);

    const [isStarted, setIsStarted] = useState(false);
    const analysisInitiatedRef = useRef(false); // Ref to prevent multiple analysis runs
    const [userRole, setUserRole] = useState<'user' | 'admin' | 'analyst'>('user');
    const [userName, setUserName] = useState<string>('');
    const [userId, setUserId] = useState<string>('');
    const [evaluationId, setEvaluationId] = useState<string>('');
    const [analysisId, setAnalysisId] = useState<string>('');
    const [moduleStates, setModuleStates] = useState<Record<string, ModuleState>>({});

    const [overallProgress, setOverallProgress] = useState(0);
    const [extractionPhase, setExtractionPhase] = useState<'idle' | 'extracting' | 'analyzing' | 'complete'>('idle');
    const [companyInfo, setCompanyInfo] = useState<{ name: string; files: number; urls: number; framework: string }>({
        name: '',
        files: 0,
        urls: 0,
        framework: 'general'
    });
    const [analysisResult, setAnalysisResult] = useState<ComprehensiveAnalysisOutput | null>(null);
    const [startTime, setStartTime] = useState<number>(0);
    const [totalTime, setTotalTime] = useState<string>('0.0s');
    const [storedTrackingParams, setStoredTrackingParams] = useState<string>('');

    // Load active module settings from API
    useEffect(() => {
        const loadModuleSettings = async () => {
            try {
                const activeVersion = await settingsApi.getActiveVersion();
                if (activeVersion?.module_settings) {
                    // Update modules with active status from settings
                    const updatedModules = ALL_MODULES.map(module => {
                        const setting = activeVersion.module_settings?.find(
                            ms => ms.module_id === module.apiId
                        );
                        return {
                            ...module,
                            active: setting ? setting.is_enabled : module.active,
                            weight: setting ? setting.weight : module.weight
                        };
                    });
                    setModules(updatedModules);
                }
            } catch (error) {
                console.warn('Could not load module settings, using defaults:', error);
            } finally {
                setSettingsLoaded(true);
            }
        };
        loadModuleSettings();
    }, []);

    // Initialize module states when active modules are determined
    useEffect(() => {
        if (settingsLoaded) {
            const initial: Record<string, ModuleState> = {};
            activeModules.forEach(m => {
                initial[m.id] = { status: 'pending', progress: 0, message: 'Waiting to start...' };
            });
            setModuleStates(initial);
        }
    }, [activeModules, settingsLoaded]);

    // Load company info and user role from localStorage
    useEffect(() => {
        // Sanitize company name - remove newlines and extra whitespace
        const rawCompanyName = localStorage.getItem('analysisCompanyName') || 'Unknown Company';
        const companyName = rawCompanyName.replace(/[\r\n]+/g, ' ').trim();
        const framework = localStorage.getItem('analysisFramework') || 'general';

        // Load user role and info - IMPORTANT: Check both 'user' and 'loggedInUser' keys
        try {
            const storedUser = localStorage.getItem('loggedInUser') || localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const role = user.role?.toLowerCase() || 'user';
                console.log('Loaded user role for analysis:', role, user);
                setUserRole(role);
                setUserName(user.name || user.username || 'Unknown User');
                setUserId(user.id || user.user_id || '');
            }
        } catch (e) {
            console.error('Failed to parse user data:', e);
            setUserRole('user');
        }

        // Generate or load evaluation ID for this analysis session
        let evalId = localStorage.getItem('currentEvaluationId');
        if (!evalId) {
            evalId = generateEvaluationId();
            localStorage.setItem('currentEvaluationId', evalId);
        }
        setEvaluationId(evalId);

        // Generate analysis ID for this run
        const anlId = generateAnalysisId();
        setAnalysisId(anlId);
        localStorage.setItem('currentAnalysisId', anlId);

        // Try to get file counts from evaluation data
        try {
            const uploadedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
            const importedUrls = JSON.parse(localStorage.getItem('importedUrls') || '[]');
            setCompanyInfo({
                name: companyName,
                files: Array.isArray(uploadedFiles) ? uploadedFiles.length : 0,
                urls: Array.isArray(importedUrls) ? importedUrls.length : 0,
                framework
            });
        } catch (e) {
            setCompanyInfo({ name: companyName, files: 0, urls: 0, framework });
        }
    }, []);

    // Simulate module progress (animation only — no fake score returned)
    const simulateModuleProgress = useCallback((moduleId: string, duration: number): Promise<number | undefined> => {
        return new Promise((resolve) => {
            const startMs = Date.now();
            const interval = setInterval(() => {
                const elapsed = Date.now() - startMs;
                const progress = Math.min((elapsed / duration) * 100, 99);

                setModuleStates(prev => ({
                    ...prev,
                    [moduleId]: {
                        ...prev[moduleId],
                        progress,
                        message: progress < 30 ? 'Extracting data...' :
                            progress < 60 ? 'Processing analysis...' :
                                progress < 90 ? 'Finalizing scores...' : 'Almost done...'
                    }
                }));

                if (elapsed >= duration) {
                    clearInterval(interval);
                    resolve(undefined); // No fake score — real scores come from the API result
                }
            }, 100);
        });
    }, []);

    // Run the full analysis
    const runFullAnalysis = useCallback(async () => {
        setIsStarted(true);
        setStartTime(Date.now());
        setExtractionPhase('extracting');

        try {
            // Phase 1: Data Extraction
            toast({
                title: 'Starting Analysis',
                description: `Processing data for ${companyInfo.name}...`,
            });

            // Simulate extraction phase
            await new Promise(resolve => setTimeout(resolve, 1000));
            setExtractionPhase('analyzing');

            // Phase 2: Run only ACTIVE modules in parallel with progress simulation
            const framework = (companyInfo.framework === 'medtech' ? 'medtech' : 'general') as 'general' | 'medtech';

            // Start only active modules simultaneously
            activeModules.forEach(m => {
                setModuleStates(prev => ({
                    ...prev,
                    [m.id]: { status: 'running', progress: 0, message: 'Starting...', startTime: Date.now() }
                }));
            });

            // Run progress simulations in parallel with actual API call (only active modules)
            const progressPromises = activeModules.map((m, index) => {
                const duration = 2000 + Math.random() * 3000 + index * 300; // Stagger slightly
                return simulateModuleProgress(m.id, duration);
            });

            // Get user data from localStorage
            let userData = {};
            try {
                const companyDataStr = localStorage.getItem('companyData');
                if (companyDataStr) {
                    userData = JSON.parse(companyDataStr);
                }
            } catch (e) {
                console.warn('Could not parse company data');
            }

            // Run actual analysis API call
            const analysisPromise = runAnalysis(framework, userData);

            // Wait for both progress simulations and actual API call
            const [progressResults, apiResult] = await Promise.all([
                Promise.all(progressPromises),
                analysisPromise
            ]);

            // Update module states with success
            const moduleScores: Record<string, number> = {};

            // Extract actual scores from API result - use correct property names or calculate from available data
            if (apiResult.tcaData?.categories) {
                const avgTca = apiResult.tcaData.categories.reduce((s, c) => s + (c.rawScore || 0), 0) / apiResult.tcaData.categories.length;
                moduleScores['tca'] = avgTca;
            }
            if (apiResult.riskData) {
                // Calculate risk score from flags - more red flags = lower score
                const flags = apiResult.riskData.riskFlags || [];
                const redCount = flags.filter(f => f.flag === 'red').length;
                const yellowCount = flags.filter(f => f.flag === 'yellow').length;
                moduleScores['risk'] = Math.max(3, 10 - (redCount * 2) - (yellowCount * 0.5));
            }
            if (apiResult.benchmarkData) {
                // Calculate average from real benchmark values
                const benchmarkValues = Object.values(apiResult.benchmarkData).filter((v): v is number => typeof v === 'number');
                if (benchmarkValues.length > 0) {
                    moduleScores['benchmark'] = benchmarkValues.reduce((sum, v) => sum + v, 0) / benchmarkValues.length;
                }
            }
            if (apiResult.macroData) {
                // Use trend overlay score if available
                if (typeof apiResult.macroData.trendOverlayScore === 'number') {
                    moduleScores['macro'] = apiResult.macroData.trendOverlayScore;
                }
            }
            if (apiResult.gapData) {
                // Calculate gap score from heatmap entries
                const heatmap = apiResult.gapData.heatmap || [];
                if (heatmap.length > 0) {
                    // Lower gaps are better - average gap, invert to score (10 - avgGap)
                    const avgGap = heatmap.reduce((s, h) => s + (h.gap || 0), 0) / heatmap.length;
                    moduleScores['gap'] = Math.max(3, Math.min(10, 10 - avgGap));
                }
            }
            if (apiResult.growthData) {
                // Use tier and confidence to calculate growth score
                const tier = apiResult.growthData.tier || 3;
                const confidence = apiResult.growthData.confidence || 0.7;
                moduleScores['growth'] = Math.min(10, (tier * 2) + (confidence * 4));
            }
            if (apiResult.founderFitData) {
                // Use readiness score for founder fit (only real data)
                if (typeof apiResult.founderFitData.readinessScore === 'number') {
                    moduleScores['founderFit'] = apiResult.founderFitData.readinessScore;
                }
            }
            if (apiResult.teamData) {
                // Use team score if available (only real data)
                if (typeof (apiResult.teamData as any).teamScore === 'number') {
                    moduleScores['team'] = (apiResult.teamData as any).teamScore;
                }
            }
            if (apiResult.strategicFitData) {
                // Extract score from strategicFitData if available
                const sfd = apiResult.strategicFitData as any;
                if (typeof sfd.score === 'number') {
                    moduleScores['strategicFit'] = sfd.score;
                } else if (typeof sfd.alignmentScore === 'number') {
                    moduleScores['strategicFit'] = sfd.alignmentScore;
                }
                // No fallback — only show real scores
            }

            // Update all active modules to success with scores
            activeModules.forEach((m, idx) => {
                const score = moduleScores[m.apiId] || moduleScores[m.id] || progressResults[idx];
                setModuleStates(prev => ({
                    ...prev,
                    [m.id]: {
                        status: 'success',
                        progress: 100,
                        message: 'Complete',
                        score,
                        endTime: Date.now()
                    }
                }));
            });

            setOverallProgress(100);
            setExtractionPhase('complete');
            setAnalysisResult(apiResult);

            // Store results with tracking info
            const trackingInfo = {
                evaluationId,
                analysisId,
                userId,
                userName,
                companyName: companyInfo.name,
                framework: companyInfo.framework,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('analysisResult', JSON.stringify(apiResult));
            localStorage.setItem('analysisTrackingInfo', JSON.stringify(trackingInfo));

            // Store individual tracking IDs for workflow navigation
            localStorage.setItem('currentEvaluationId', evaluationId);
            localStorage.setItem('currentAnalysisId', analysisId);
            localStorage.setItem('analysisCompanyName', companyInfo.name);
            localStorage.setItem('analysisFramework', companyInfo.framework);

            const elapsed = (Date.now() - startTime) / 1000;
            setTotalTime(`${elapsed.toFixed(1)}s`);
            localStorage.setItem('analysisDuration', elapsed.toFixed(2));

            toast({
                title: 'Analysis Complete!',
                description: `All ${activeModules.length} active modules analyzed successfully in ${elapsed.toFixed(1)}s`,
            });

            // Auto-navigate based on role after short delay
            // Admin/Analyst: Go to what-if to review and adjust module scores
            // Standard user: Go directly to result page for triage report
            // Include tracking parameters in the redirect URL
            // Note: URLSearchParams auto-encodes values, so don't double-encode!
            // Also sanitize company name to remove newlines
            const sanitizedCompanyName = companyInfo.name.replace(/[\r\n]+/g, ' ').trim();
            const trackingParams = new URLSearchParams({
                evalId: evaluationId,
                anlId: analysisId,
                company: sanitizedCompanyName,
                user: userName
            }).toString();

            // Re-check role from localStorage to ensure we have the latest value
            // (in case the useEffect hasn't updated the state yet)
            let currentRole = userRole;
            try {
                const storedUser = localStorage.getItem('loggedInUser') || localStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    currentRole = user.role?.toLowerCase() || 'user';
                }
            } catch (e) {
                console.warn('Could not re-check user role');
            }

            // Store tracking params for manual navigation (no auto-redirect)
            // User must click to proceed to What-If or Results
            setStoredTrackingParams(trackingParams);
            console.log('Analysis complete. User can navigate to:', currentRole === 'admin' || currentRole === 'analyst' ? 'What-If or Results' : 'Results');

        } catch (error) {
            console.error('Analysis failed:', error);

            // Mark failed modules (only active ones)
            activeModules.forEach(m => {
                setModuleStates(prev => ({
                    ...prev,
                    [m.id]: prev[m.id]?.status === 'running' ? {
                        status: 'error',
                        progress: prev[m.id]?.progress || 0,
                        message: 'Analysis failed',
                        endTime: Date.now()
                    } : prev[m.id]
                }));
            });

            setExtractionPhase('idle');

            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        }
        // Note: Removed startTime from dependencies since it's set inside the callback
    }, [companyInfo, simulateModuleProgress, toast, router, activeModules, userRole, evaluationId, analysisId, userId, userName]);

    // Auto-start analysis on mount if we have data
    // Using a ref to prevent multiple runs (more reliable than state-based check)
    useEffect(() => {
        const hasData = localStorage.getItem('analysisCompanyName');
        if (hasData && !analysisInitiatedRef.current && settingsLoaded && activeModules.length > 0) {
            analysisInitiatedRef.current = true; // Set immediately to prevent re-runs
            runFullAnalysis();
        }
    }, [settingsLoaded, activeModules.length]); // Intentionally exclude runFullAnalysis to prevent re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps

    // Calculate overall progress based on active modules
    useEffect(() => {
        if (activeModules.length === 0) return;
        const totalProgress = activeModules.reduce((sum, m) => sum + (moduleStates[m.id]?.progress || 0), 0);
        setOverallProgress(totalProgress / activeModules.length);
    }, [moduleStates, activeModules]);

    const completedModules = activeModules.filter(m => moduleStates[m.id]?.status === 'success').length;
    const runningModules = activeModules.filter(m => moduleStates[m.id]?.status === 'running').length;
    const inactiveModulesCount = modules.length - activeModules.length;

    // If no company data is available, show redirect message
    const hasCompanyData = companyInfo.name && companyInfo.name !== '' && companyInfo.name !== 'Unknown Company';

    // If not started and no data, show prompt to go to evaluation
    if (!isStarted && !hasCompanyData && settingsLoaded) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
                <div className="container mx-auto p-6 max-w-4xl">
                    <Card className="border-orange-200 bg-orange-50/30">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 p-4 bg-orange-100 rounded-full w-fit">
                                <AlertTriangle className="size-12 text-orange-500" />
                            </div>
                            <CardTitle className="text-2xl">No Analysis Data Found</CardTitle>
                            <CardDescription className="text-base">
                                Please start from the Evaluation page to set up your company analysis.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-muted-foreground">
                                To run an analysis, you need to first:
                            </p>
                            <ol className="text-left inline-block space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                                    Enter company information in the Evaluation page
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                                    Upload documents or provide company data
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                                    Click "Run Analysis" to start the process
                                </li>
                            </ol>
                            <div className="pt-4">
                                <Button asChild size="lg">
                                    <Link href="/dashboard/evaluation">
                                        <FileText className="size-4 mr-2" />
                                        Go to Evaluation
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <div className="container mx-auto p-6 max-w-6xl">
                {/* Header */}
                <header className="mb-8">
                    <Link
                        href="/dashboard/evaluation"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Evaluation
                    </Link>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                                <Database className="size-8 text-primary" />
                                Running Analysis
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Extracting data and analyzing across {activeModules.length} active modules
                                {inactiveModulesCount > 0 && (
                                    <span className="text-xs ml-2">({inactiveModulesCount} disabled)</span>
                                )}
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Company</p>
                            <p className="text-xl font-semibold">{companyInfo.name || 'Loading...'}</p>
                            <p className="text-xs text-muted-foreground">
                                {companyInfo.files} files • {companyInfo.urls} URLs • {companyInfo.framework} framework
                            </p>
                        </div>
                    </div>
                </header>

                {/* Progress Overview */}
                <Card className="mb-8 border-primary/20">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {extractionPhase === 'complete' ? (
                                        <CheckCircle2 className="size-5 text-green-500" />
                                    ) : (
                                        <Loader2 className="size-5 animate-spin text-primary" />
                                    )}
                                    {extractionPhase === 'idle' && 'Ready to Start'}
                                    {extractionPhase === 'extracting' && 'Extracting Data...'}
                                    {extractionPhase === 'analyzing' && 'Running Analysis...'}
                                    {extractionPhase === 'complete' && 'Analysis Complete!'}
                                </CardTitle>
                                <CardDescription>
                                    {completedModules} of {activeModules.length} modules complete
                                    {runningModules > 0 && ` • ${runningModules} running`}
                                </CardDescription>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Time Elapsed</p>
                                    <p className="text-xl font-mono font-bold">
                                        {isStarted ? (extractionPhase === 'complete' ? totalTime : `${((Date.now() - startTime) / 1000).toFixed(1)}s`) : '0.0s'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Progress</p>
                                    <p className="text-xl font-bold text-primary">{overallProgress.toFixed(0)}%</p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Progress value={overallProgress} className="h-3" />
                    </CardContent>
                </Card>

                {/* Module Grid - Only show active modules */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeModules.map((module) => {
                        const state = moduleStates[module.id] || { status: 'pending', progress: 0, message: 'Waiting...', startTime: Date.now() };
                        const Icon = module.icon;

                        return (
                            <Card
                                key={module.id}
                                className={cn(
                                    "transition-all duration-300",
                                    state.status === 'running' && "border-primary shadow-lg shadow-primary/10",
                                    state.status === 'success' && "border-green-500/50 bg-green-50/30 dark:bg-green-950/10",
                                    state.status === 'error' && "border-red-500/50 bg-red-50/30 dark:bg-red-950/10"
                                )}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-lg",
                                                state.status === 'pending' && "bg-muted",
                                                state.status === 'running' && "bg-primary/10",
                                                state.status === 'success' && "bg-green-500/10",
                                                state.status === 'error' && "bg-red-500/10"
                                            )}>
                                                <Icon className={cn(
                                                    "size-5",
                                                    state.status === 'pending' && "text-muted-foreground",
                                                    state.status === 'running' && "text-primary animate-pulse",
                                                    state.status === 'success' && "text-green-500",
                                                    state.status === 'error' && "text-red-500"
                                                )} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-sm">{module.name}</h3>
                                                <Badge variant="outline" className="text-xs">{module.version}</Badge>
                                            </div>
                                        </div>

                                        {state.status === 'running' && (
                                            <Loader2 className="size-4 animate-spin text-primary" />
                                        )}
                                        {state.status === 'success' && (
                                            <CheckCircle2 className="size-5 text-green-500" />
                                        )}
                                        {state.status === 'error' && (
                                            <XCircle className="size-5 text-red-500" />
                                        )}
                                    </div>

                                    <p className="text-xs text-muted-foreground mb-3">
                                        {module.description}
                                    </p>

                                    <div className="space-y-2">
                                        <Progress
                                            value={state.progress}
                                            className={cn(
                                                "h-2",
                                                state.status === 'success' && "[&>div]:bg-green-500",
                                                state.status === 'error' && "[&>div]:bg-red-500"
                                            )}
                                        />

                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">{state.message}</span>
                                            {state.score !== undefined && (
                                                <Badge className="bg-green-500">{state.score.toFixed(1)}/10</Badge>
                                            )}
                                            {state.status === 'running' && (
                                                <span className="font-mono">{state.progress.toFixed(0)}%</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Workflow Actions */}
                <div className="mt-8 flex flex-col items-center gap-4">
                    {extractionPhase === 'complete' && (
                        <>
                            {/* Workflow Steps Indicator */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Badge variant="secondary">Step 1: Analysis</Badge>
                                <span>→</span>
                                <Badge variant="outline">Step 2: What-If Review</Badge>
                                <span>→</span>
                                <Badge variant="outline">Step 3: Report & Export</Badge>
                            </div>

                            <div className="flex flex-wrap gap-4 justify-center">
                                {(userRole === 'admin' || userRole === 'analyst') && (
                                    <>
                                        <Button
                                            size="lg"
                                            onClick={() => router.push(`/analysis/what-if?${storedTrackingParams}`)}
                                            className="gap-2"
                                        >
                                            <SlidersHorizontal className="size-4" />
                                            Continue to What-If Analysis
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="secondary"
                                            onClick={() => router.push(`/analysis/result?${storedTrackingParams}`)}
                                            className="gap-2"
                                        >
                                            <FileText className="size-4" />
                                            View Triage Report
                                        </Button>
                                    </>
                                )}
                                {userRole === 'user' && (
                                    <Button
                                        size="lg"
                                        onClick={() => router.push(`/analysis/result?${storedTrackingParams}`)}
                                        className="gap-2"
                                    >
                                        <FileText className="size-4" />
                                        View Analysis Results
                                    </Button>
                                )}
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => {
                                        // Clear analysis data and start fresh
                                        const keysToRemove = [
                                            'analysisResult', 'analysisTrackingInfo', 'currentEvaluationId',
                                            'currentAnalysisId', 'reportApprovalStatus', 'analysisCompanyName',
                                            'analysisFramework', 'analysisCompanyId', 'companyData'
                                        ];
                                        keysToRemove.forEach(key => localStorage.removeItem(key));
                                        router.push('/dashboard/evaluation');
                                    }}
                                    className="gap-2"
                                >
                                    <ArrowLeft className="size-4" />
                                    New Analysis
                                </Button>
                            </div>
                        </>
                    )}

                    {extractionPhase === 'idle' && (
                        <Button
                            size="lg"
                            onClick={runFullAnalysis}
                            className="gap-2"
                        >
                            <Play className="size-4" />
                            Start Analysis
                        </Button>
                    )}

                    {(extractionPhase === 'extracting' || extractionPhase === 'analyzing') && (
                        <Button variant="outline" size="lg" disabled className="gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            Analysis in Progress...
                        </Button>
                    )}
                </div>

                {/* Manual navigation notice */}
                {extractionPhase === 'complete' && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                        Analysis complete! Select your next step above to continue the workflow.
                    </p>
                )}
            </div>
        </main>
    );
}
