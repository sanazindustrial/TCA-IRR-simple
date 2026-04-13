'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CompanyInformation } from '@/components/analysis/company-information';
import { DocumentSubmission, type UploadedFile } from '@/components/analysis/document-submission';
import { ModuleConfiguration } from '@/components/analysis/module-configuration';
import { ExternalDataSources } from '@/components/evaluation/external-data-sources';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EvaluationProvider, useEvaluationContext, type CompanyInformationData } from '@/components/evaluation/evaluation-provider';
import { useRouter } from 'next/navigation';
import { runAnalysis } from '@/app/analysis/actions';
import { ChevronLeft, ChevronRight, Check, Lock, FileText, Database, Settings, Play, Upload, RefreshCw, GitBranch, FileCheck2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackingService } from '@/lib/tracking-service';
import { startFreshEvaluation, clearEvaluationState, archiveCurrentEvaluation } from '@/lib/auto-extraction-service';
import { User, Building2, Trash2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export type UserRole = 'user' | 'admin' | 'analyst';
export type ReportType = 'triage' | 'dd';

// Session data interface
interface UserSession {
    userId: string;
    email: string;
    name: string;
    role: UserRole;
    companyActive?: string;
    sessionStart: number;
    lastActivity: number;
}

// Autosave storage key
const AUTOSAVE_KEY = 'evaluation_autosave';

// Evaluation ID generator for unique indexing - using tracking service format
const generateEvaluationId = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `EVAL-${timestamp}-${random}`;
};

// Generate unique company ID for tracking
const generateCompanyId = (companyName?: string): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = companyName
        ? companyName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'CO'
        : 'CO';
    return `${prefix}-${timestamp}-${random}`;
};

// Workflow step definition
interface WorkflowStep {
    id: number;
    name: string;
    description: string;
    icon: React.ReactNode;
    isLocked: (data: WorkflowData) => boolean;
    isComplete: (data: WorkflowData) => boolean;
}

interface WorkflowData {
    hasDocuments: boolean;
    extractionComplete: boolean;
    hasCompanyInfo: boolean;
    hasExternalData: boolean;
    analysisComplete: boolean;
    hasModuleConfig: boolean;
}

type AutosaveData = {
    evaluationId: string;
    companyId: string;
    currentStep: number;
    uploadedFiles: UploadedFile[];
    importedUrls: string[];
    submittedTexts: string[];
    framework: 'general' | 'medtech';
    reportType: ReportType;
    companyInfo: CompanyInformationData;
    savedAt: number;
    isFreshEvaluation: boolean;
};

// Default company info
const DEFAULT_COMPANY_INFO: CompanyInformationData = {
    companyName: '',
    website: '',
    industryVertical: '',
    developmentStage: '',
    businessModel: '',
    country: '',
    state: '',
    city: '',
    oneLineDescription: '',
    companyDescription: '',
    productDescription: '',
    pitchDeckPath: '',
    legalName: '',
    numberOfEmployees: null,
};

// Workflow steps configuration - Complete 7-step workflow
const WORKFLOW_STEPS: WorkflowStep[] = [
    {
        id: 1,
        name: 'Upload Pitch Deck',
        description: 'Upload your company pitch deck (PPT, PDF) to extract company details',
        icon: <Upload className="h-5 w-5" />,
        isLocked: () => false,
        isComplete: (data) => data.hasDocuments,
    },
    {
        id: 2,
        name: 'Company Information',
        description: 'Review and confirm extracted company details',
        icon: <FileText className="h-5 w-5" />,
        isLocked: () => false, // Always accessible
        isComplete: (data) => data.hasCompanyInfo,
    },
    {
        id: 3,
        name: 'External Data Sources',
        description: 'Configure external data extraction (Admin/Analyst)',
        icon: <Database className="h-5 w-5" />,
        isLocked: (data) => !data.hasCompanyInfo,
        isComplete: (data) => data.hasExternalData || !data.hasCompanyInfo, // Optional step
    },
    {
        id: 4,
        name: 'Module Configuration',
        description: 'Configure analysis modules (Admin/Analyst)',
        icon: <Settings className="h-5 w-5" />,
        isLocked: (data) => !data.hasCompanyInfo,
        isComplete: () => true, // Default config always available
    },
    {
        id: 5,
        name: 'Run Analysis',
        description: 'Execute the startup evaluation',
        icon: <Play className="h-5 w-5" />,
        isLocked: (data) => !data.hasCompanyInfo && !data.hasDocuments,
        isComplete: (data) => data.analysisComplete,
    },
    {
        id: 6,
        name: 'What-If Analysis',
        description: 'Explore scenarios and adjust parameters',
        icon: <GitBranch className="h-5 w-5" />,
        isLocked: (data) => !data.analysisComplete,
        isComplete: () => false, // Completed externally on what-if page
    },
    {
        id: 7,
        name: 'Generate Report',
        description: 'View and export final analysis report',
        icon: <FileCheck2 className="h-5 w-5" />,
        isLocked: (data) => !data.analysisComplete,
        isComplete: () => false, // Completed externally on result page
    },
];

// Workflow Progress Indicator Component
function WorkflowProgress({ currentStep, steps, workflowData, onStepClick }: {
    currentStep: number;
    steps: WorkflowStep[];
    workflowData: WorkflowData;
    onStepClick: (step: number) => void;
}) {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isActive = currentStep === step.id;
                    const isLocked = step.isLocked(workflowData);
                    const isComplete = step.isComplete(workflowData);
                    const isPast = currentStep > step.id;

                    return (
                        <div key={step.id} className="flex items-center flex-1">
                            <button
                                onClick={() => !isLocked && onStepClick(step.id)}
                                disabled={isLocked}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-3 rounded-lg transition-all w-full",
                                    isActive && "bg-primary/10 border-2 border-primary",
                                    !isActive && !isLocked && "hover:bg-muted cursor-pointer",
                                    isLocked && "opacity-50 cursor-not-allowed",
                                    isComplete && !isActive && "bg-green-50 dark:bg-green-950"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                                    isActive && "bg-primary text-primary-foreground border-primary",
                                    isComplete && !isActive && "bg-green-500 text-white border-green-500",
                                    isLocked && "bg-muted border-muted-foreground/30",
                                    !isActive && !isComplete && !isLocked && "border-muted-foreground/50"
                                )}>
                                    {isLocked ? <Lock className="h-4 w-4" /> : isComplete && !isActive ? <Check className="h-4 w-4" /> : step.icon}
                                </div>
                                <span className={cn(
                                    "text-xs font-medium text-center",
                                    isActive && "text-primary",
                                    isLocked && "text-muted-foreground"
                                )}>
                                    {step.name}
                                </span>
                            </button>
                            {index < steps.length - 1 && (
                                <div className={cn(
                                    "h-0.5 w-full mx-2",
                                    isPast || isComplete ? "bg-green-500" : "bg-muted"
                                )} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


function AnalysisSetup({
    onClearAllData,
    onShowClearConfirm,
    onExtractFromDocuments,
    isExtracting,
    extractionComplete,
    extractionProgress,
    extractionTimeLeft,
    extractionStep,
    currentStep,
    setCurrentStep,
    evaluationId,
    workflowData
}: {
    onClearAllData: () => void;
    onShowClearConfirm: () => void;
    onExtractFromDocuments: () => void;
    isExtracting: boolean;
    extractionComplete: boolean;
    extractionProgress: number;
    extractionTimeLeft: number;
    extractionStep: string;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    evaluationId: string;
    workflowData: WorkflowData;
}) {
    const {
        framework,
        onFrameworkChangeAction,
        isPrivilegedUser,
        isLoading,
        handleRunAnalysisAction,
        uploadedFiles = [],
        setUploadedFilesAction,
        importedUrls = [],
        setImportedUrlsAction,
        submittedTexts = [],
        setSubmittedTextsAction,
        companyInfo,
    } = useEvaluationContext();

    const hasDocuments = uploadedFiles.length > 0 || importedUrls.length > 0 || submittedTexts.length > 0;
    const hasCompanyData = (companyInfo?.companyName?.length ?? 0) > 0 || (companyInfo?.companyDescription?.length ?? 0) > 0;
    const hasData = hasDocuments || hasCompanyData;
    const canRunAnalysis = extractionComplete || !hasDocuments;

    // Filter steps for non-privileged users
    const visibleSteps = isPrivilegedUser
        ? WORKFLOW_STEPS
        : WORKFLOW_STEPS.filter(s => s.id <= 2 || s.id === 5);

    const canGoNext = () => {
        const currentStepConfig = WORKFLOW_STEPS.find(s => s.id === currentStep);
        if (!currentStepConfig) return false;

        // Check if current step is complete or optional
        if (currentStep === 1) return true; // Can always proceed from step 1
        if (currentStep === 2) return hasCompanyData || extractionComplete;
        if (currentStep === 3) return true; // External data is optional
        if (currentStep === 4) return true; // Module config has defaults
        return false;
    };

    const handleNext = () => {
        if (currentStep === 1 && hasDocuments && !extractionComplete) {
            // Auto-extract when moving from step 1 to step 2
            onExtractFromDocuments();
        }

        const nextSteps = visibleSteps.filter(s => s.id > currentStep);
        if (nextSteps.length > 0) {
            setCurrentStep(nextSteps[0].id);
        }
    };

    const handleBack = () => {
        const prevSteps = visibleSteps.filter(s => s.id < currentStep);
        if (prevSteps.length > 0) {
            setCurrentStep(prevSteps[prevSteps.length - 1].id);
        }
    };

    // Handle step click with navigation for external steps
    const handleStepClick = (stepId: number) => {
        const step = WORKFLOW_STEPS.find(s => s.id === stepId);
        if (!step || step.isLocked(workflowData)) return;
        
        // Navigate to external pages for steps 6 and 7
        if (stepId === 6) {
            window.location.href = '/analysis/what-if';
            return;
        }
        if (stepId === 7) {
            window.location.href = '/analysis/result';
            return;
        }
        
        // For other steps, just update the current step
        setCurrentStep(stepId);
    };

    return (
        <div className="space-y-6 mb-12">
            {/* Evaluation ID Badge */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-primary/10 rounded-full">
                        <span className="text-sm font-mono font-semibold text-primary">{evaluationId}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Unique Evaluation ID</span>
                </div>
                {hasData && (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Auto-saving
                    </span>
                )}
            </div>

            {/* Workflow Progress */}
            <WorkflowProgress
                currentStep={currentStep}
                steps={visibleSteps}
                workflowData={workflowData}
                onStepClick={handleStepClick}
            />

            {/* Step Content */}
            <div className="min-h-[400px]">
                {/* Step 1: Upload Pitch Deck */}
                {currentStep === 1 && (
                    <div className="space-y-4">
                        <div className="border rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Upload Pitch Deck
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Upload your company pitch deck (PowerPoint or PDF) to automatically extract company information.
                                You can upload additional documents after the initial analysis.
                            </p>
                            <DocumentSubmission
                                uploadedFiles={uploadedFiles}
                                setUploadedFiles={setUploadedFilesAction || (() => { })}
                                importedUrls={importedUrls}
                                setImportedUrls={setImportedUrlsAction || (() => { })}
                                submittedTexts={submittedTexts}
                                setSubmittedTexts={setSubmittedTextsAction || (() => { })}
                                showUrlInput={false}
                                showTextInput={false}
                                title="Upload Pitch Deck"
                                description="Upload only 1 pitch deck file (PDF, DOCX, or PPTX)"
                                pitchDeckOnly={true}
                            />
                        </div>
                        {hasDocuments && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <p className="text-blue-700 dark:text-blue-300 text-sm">
                                    ✨ Pitch deck uploaded! Click <strong>Next</strong> to extract company information automatically.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Company Information */}
                {currentStep === 2 && (
                    <div className="space-y-4">
                        {isExtracting && (
                            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <div className="text-center">
                                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4" />
                                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                        Extracting Company Information
                                    </h4>
                                    <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                                        {extractionStep || 'Processing documents...'}
                                    </p>

                                    {/* Progress Bar */}
                                    <div className="w-full max-w-md mx-auto mb-3">
                                        <div className="h-3 bg-blue-100 dark:bg-blue-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-200 ease-out"
                                                style={{ width: `${Math.min(extractionProgress, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Time Remaining */}
                                    <div className="flex items-center justify-center gap-2 text-sm">
                                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                                            {extractionTimeLeft > 0 ? (
                                                <>⏱️ ~{extractionTimeLeft}s remaining</>
                                            ) : (
                                                <>✨ Almost ready...</>
                                            )}
                                        </span>
                                        <span className="text-blue-500/70 dark:text-blue-400/70">
                                            ({Math.round(extractionProgress)}%)
                                        </span>
                                    </div>

                                    <p className="text-xs text-blue-500/80 dark:text-blue-400/80 mt-3">
                                        AI is analyzing your documents to extract company details
                                    </p>
                                </div>
                            </div>
                        )}
                        {!isExtracting && extractionComplete && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
                                    <Check className="h-4 w-4" />
                                    Company information extracted! Please review and edit if needed.
                                </p>
                            </div>
                        )}
                        <div className="border rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Company Information
                            </h3>
                            <CompanyInformation framework={framework}
                                onFrameworkChange={onFrameworkChangeAction}
                            />
                        </div>

                        {/* Additional Documents Section */}
                        {extractionComplete && (
                            <div className="border rounded-lg p-6 bg-muted/30">
                                <h4 className="text-md font-semibold mb-2 flex items-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    Upload Additional Documents (Optional)
                                </h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Add financial statements, market research, or other supporting documents. You can upload files, import from URLs, or paste text directly.
                                </p>
                                <DocumentSubmission
                                    uploadedFiles={uploadedFiles}
                                    setUploadedFiles={setUploadedFilesAction || (() => { })}
                                    importedUrls={importedUrls}
                                    setImportedUrls={setImportedUrlsAction || (() => { })}
                                    submittedTexts={submittedTexts}
                                    setSubmittedTexts={setSubmittedTextsAction || (() => { })}
                                    showUrlInput={true}
                                    showTextInput={true}
                                    title="Additional Documents"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: External Data Sources (Admin/Analyst only) */}
                {currentStep === 3 && isPrivilegedUser && (
                    <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            External Data Sources
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Configure external data sources to enrich the analysis with market data, competitor info, and more.
                        </p>
                        <ExternalDataSources
                            framework={framework}
                            companyName={companyInfo?.companyName || ''}
                        />
                    </div>
                )}

                {/* Step 4: Module Configuration (Admin/Analyst only) */}
                {currentStep === 4 && isPrivilegedUser && (
                    <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Module Configuration
                        </h3>
                        <ModuleConfiguration framework={framework} />
                    </div>
                )}

                {/* Step 5: Run Analysis */}
                {currentStep === 5 && (
                    <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Play className="h-5 w-5" />
                            Run Analysis
                        </h3>
                        <div className="space-y-4">
                            <div className="bg-muted/50 rounded-lg p-4">
                                <h4 className="font-medium mb-2">Analysis Summary</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• Evaluation ID: <span className="font-mono text-primary">{evaluationId}</span></li>
                                    <li>• Documents: {uploadedFiles.length} files, {importedUrls.length} URLs, {submittedTexts.length} text inputs</li>
                                    <li>• Company: {companyInfo?.companyName || 'Not specified'}</li>
                                    <li>• Framework: {framework === 'medtech' ? 'MedTech' : 'General'}</li>
                                </ul>
                            </div>
                            <Button
                                size="lg"
                                className="w-full"
                                onClick={handleRunAnalysisAction}
                                disabled={isLoading || (hasDocuments && !canRunAnalysis)}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
                                        Running Analysis...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Run Analysis
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === visibleSteps[0]?.id}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                    {hasData && (
                        <Button variant="ghost" onClick={onShowClearConfirm} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Clear All Data
                        </Button>
                    )}
                </div>
                <div className="flex gap-2">
                    {currentStep < 5 && (
                        <Button onClick={handleNext} disabled={!canGoNext()}>
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function EvaluationPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [framework, setFramework] = useState<'general' | 'medtech'>('general');
    const [role, setRole] = useState<UserRole>('user');
    const [reportType, setReportType] = useState<ReportType>('triage');
    const [isInitialized, setIsInitialized] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Workflow step state
    const [currentStep, setCurrentStep] = useState(1);
    const [evaluationId, setEvaluationId] = useState(() => generateEvaluationId());
    const [companyId, setCompanyId] = useState(() => generateCompanyId());
    const [isFreshEvaluation, setIsFreshEvaluation] = useState(true);

    // Ref to track if auto-extraction has been triggered
    const autoExtractionTriggered = useRef(false);

    // State for document submission
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [importedUrls, setImportedUrls] = useState<string[]>([]);
    const [submittedTexts, setSubmittedTexts] = useState<string[]>([]);

    // State for company information (unified object for all fields)
    const [companyInfo, setCompanyInfo] = useState<CompanyInformationData>(DEFAULT_COMPANY_INFO);

    // Helper to update company info fields
    const updateCompanyInfo = useCallback((updates: Partial<CompanyInformationData>) => {
        setCompanyInfo(prev => ({ ...prev, ...updates }));
    }, []);

    // State for AI extraction
    const [isExtracting, setIsExtracting] = useState(false);
    const [isAiProcessing, setIsAiProcessing] = useState(false); // Track AI API call phase
    const [extractionComplete, setExtractionComplete] = useState(false);
    const [extractionProgress, setExtractionProgress] = useState(0);
    const [extractionTimeLeft, setExtractionTimeLeft] = useState(0);
    const [extractionStep, setExtractionStep] = useState('');
    const extractionStartTime = useRef<number>(0);
    const ESTIMATED_EXTRACTION_TIME = 8; // 8 seconds estimated for AI extraction

    // Countdown timer effect for AI extraction phase only
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAiProcessing && extractionStartTime.current > 0) {
            interval = setInterval(() => {
                const elapsed = (Date.now() - extractionStartTime.current) / 1000;
                const remaining = Math.max(0, ESTIMATED_EXTRACTION_TIME - elapsed);
                // Progress from 40% to 95% during AI phase
                const aiProgress = Math.min(55, (elapsed / ESTIMATED_EXTRACTION_TIME) * 55);
                setExtractionTimeLeft(Math.ceil(remaining));
                setExtractionProgress(40 + aiProgress);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isAiProcessing]);

    // Compute workflow data for step validation
    const workflowData: WorkflowData = {
        hasDocuments: uploadedFiles.length > 0 || importedUrls.length > 0 || submittedTexts.length > 0,
        extractionComplete,
        hasCompanyInfo: (companyInfo?.companyName?.length ?? 0) > 0 || (companyInfo?.companyDescription?.length ?? 0) > 0,
        hasExternalData: false, // Track external data separately if needed
        analysisComplete: false, // Tracked by analysis state
        hasModuleConfig: true, // Modules have default config
    };

    // User session state
    const [userSession, setUserSession] = useState<UserSession | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Load user session on mount
    useEffect(() => {
        const loadUserSession = () => {
            const storedUser = localStorage.getItem('loggedInUser');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    setUserSession({
                        userId: user.id || user.userId || 'unknown',
                        email: user.email || 'Not logged in',
                        name: user.name || user.email?.split('@')[0] || 'User',
                        role: (user.role?.toLowerCase() || 'user') as UserRole,
                        companyActive: companyInfo.companyName || undefined,
                        sessionStart: Date.now(),
                        lastActivity: Date.now(),
                    });
                    setRole(user.role?.toLowerCase() || 'user');
                } catch (e) {
                    console.warn('Failed to parse user session:', e);
                    setRole('user');
                }
            } else {
                setRole('user');
            }
        };
        loadUserSession();
    }, []);

    // Update session activity and company
    useEffect(() => {
        if (userSession && companyInfo.companyName) {
            setUserSession(prev => prev ? {
                ...prev,
                companyActive: companyInfo.companyName,
                lastActivity: Date.now(),
            } : null);
        }
    }, [companyInfo.companyName]);

    // Start fresh evaluation - clears all previous data COMPLETELY
    const startNewEvaluation = useCallback(() => {
        // Archive current evaluation if it has data
        archiveCurrentEvaluation();

        // Clear all previous evaluation state
        clearEvaluationState();
        trackingService.clearAllPreviousData();

        // Generate new IDs
        const newEvaluationId = generateEvaluationId();
        const newCompanyId = generateCompanyId();

        setEvaluationId(newEvaluationId);
        setCompanyId(newCompanyId);
        setIsFreshEvaluation(true);

        // Reset all state
        setUploadedFiles([]);
        setImportedUrls([]);
        setSubmittedTexts([]);
        setCompanyInfo(DEFAULT_COMPANY_INFO);
        setExtractionComplete(false);
        setIsExtracting(false);
        setExtractionProgress(0);
        setExtractionTimeLeft(0);
        setExtractionStep('');
        extractionStartTime.current = 0;
        setCurrentStep(1);
        setFramework('general');
        setReportType('triage');
        autoExtractionTriggered.current = false;

        // Initialize tracking service
        trackingService.initializeNewEvaluation('general');

        // CLEAR ALL localStorage keys related to evaluation/analysis
        const keysToRemove = [
            AUTOSAVE_KEY,
            'processedFiles',
            'processedUrls',
            'processedTexts',
            'analysisResult',
            'analysisDuration',
            'analysisFramework',
            'analysisEvaluationId',
            'analysisCompanyId',
            'analysisCompanyName',
            'currentEvaluationId',
            'currentCompanyId',
            'evaluationArchive',
            'tca_analysis_state',
        ];
        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn(`Failed to remove ${key}:`, e);
            }
        });

        // Hide clear confirmation
        setShowClearConfirm(false);

        toast({
            title: 'New Company Analysis Started',
            description: `Fresh analysis ${newEvaluationId} created.`,
        });
    }, [framework, toast]);

    // Auto-extract when documents are uploaded - AUTOMATIC, no button needed
    const triggerAutoExtraction = useCallback(async () => {
        if (autoExtractionTriggered.current || isExtracting) return;

        const hasContent = uploadedFiles.length > 0 || importedUrls.length > 0 || submittedTexts.length > 0;
        if (!hasContent) return;

        autoExtractionTriggered.current = true;

        // Show toast that extraction is starting
        toast({
            title: 'Starting Extraction',
            description: 'Analyzing uploaded documents for company information...',
        });

        await handleExtractFromDocuments();

        // Auto-navigate to step 2 after successful extraction to show filled form
        setCurrentStep(2);
    }, [uploadedFiles, importedUrls, submittedTexts, isExtracting, toast]);

    // Auto-trigger extraction when documents change (only in step 1)
    useEffect(() => {
        const hasDocuments = uploadedFiles.length > 0 || importedUrls.length > 0 || submittedTexts.length > 0;
        if (isInitialized && hasDocuments && !extractionComplete && !isExtracting && currentStep === 1) {
            // Delay auto-extraction slightly to allow batch uploads
            const timer = setTimeout(() => {
                triggerAutoExtraction();
            }, 1500); // 1.5 second delay for batch uploads (reduced from 2s)
            return () => clearTimeout(timer);
        }
    }, [uploadedFiles.length, importedUrls.length, submittedTexts.length, isInitialized, extractionComplete, isExtracting, currentStep, triggerAutoExtraction]);

    // Extract company info from uploaded documents
    const handleExtractFromDocuments = async () => {
        setIsExtracting(true);
        setExtractionProgress(0);
        setExtractionStep('Reading document content...');
        // Don't set extractionStartTime here - set it when AI processing starts

        try {
            // Wait for document processing to complete - poll until content is ready
            let maxWait = 15; // Max 15 seconds
            let processedFiles: Array<{ extracted_data?: { text_content?: string } }> = [];
            let processedUrls: Array<{ extracted_data?: { text_content?: string } }> = [];
            let processedTexts: Array<{ content?: string }> = [];
            let allContent = '';

            while (maxWait > 0) {
                setExtractionStep(`Waiting for document processing... (${maxWait}s)`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                maxWait--;

                // Get processed files from localStorage (set by document-submission component)
                processedFiles = JSON.parse(localStorage.getItem('processedFiles') || '[]');
                processedUrls = JSON.parse(localStorage.getItem('processedUrls') || '[]');
                processedTexts = JSON.parse(localStorage.getItem('processedTexts') || '[]');

                // Combine all text content for extraction
                allContent = [
                    ...processedFiles.map((f) => f.extracted_data?.text_content || ''),
                    ...processedUrls.map((u) => u.extracted_data?.text_content || ''),
                    ...processedTexts.map((t) => t.content || ''),
                    ...submittedTexts,
                ].filter(c => c.length > 0 && !c.includes('[File extraction pending') && !c.includes('[File extraction failed')).join('\n\n');

                // Update progress based on wait time
                setExtractionProgress(Math.min(30, ((15 - maxWait) / 15) * 30));

                // If we have real content, break
                if (allContent.trim().length >= 50) break;
            }

            // If still no content, show message and exit
            if (allContent.trim().length < 50) {
                toast({
                    title: 'Processing Documents',
                    description: 'Could not extract text content. Please try uploading a different file format (PDF recommended).',
                    variant: 'destructive',
                });
                setIsExtracting(false);
                setIsAiProcessing(false);
                setExtractionProgress(0);
                setExtractionTimeLeft(0);
                extractionStartTime.current = 0;
                autoExtractionTriggered.current = false; // Allow retry
                return;
            }

            setExtractionStep('Analyzing with AI...');
            setExtractionProgress(40);
            
            // Start the AI countdown timer
            extractionStartTime.current = Date.now();
            setIsAiProcessing(true);

            // Call backend extraction API
            const response = await fetch('https://tcairrapiccontainer.azurewebsites.net/api/v1/analysis/extract-company-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: allContent,
                    framework,
                }),
            });

            setExtractionStep('Processing extracted data...');

            if (response.ok) {
                const extractedData = await response.json();
                console.log('Extraction API response:', extractedData);

                // Build update object only with extracted values
                const updates: Partial<CompanyInformationData> = {};

                if (extractedData.company_name) updates.companyName = extractedData.company_name;
                if (extractedData.legal_name) updates.legalName = extractedData.legal_name;
                if (extractedData.website) updates.website = extractedData.website;
                if (extractedData.description) updates.companyDescription = extractedData.description;
                if (extractedData.one_line_description) updates.oneLineDescription = extractedData.one_line_description;
                if (extractedData.product_description) updates.productDescription = extractedData.product_description;
                if (extractedData.industry_vertical) updates.industryVertical = extractedData.industry_vertical;
                if (extractedData.development_stage) updates.developmentStage = extractedData.development_stage;
                if (extractedData.business_model) updates.businessModel = extractedData.business_model;
                if (extractedData.country) updates.country = extractedData.country;
                if (extractedData.state) updates.state = extractedData.state;
                if (extractedData.city) updates.city = extractedData.city;
                if (extractedData.number_of_employees) updates.numberOfEmployees = extractedData.number_of_employees;

                // Update company info with extracted data
                if (Object.keys(updates).length > 0) {
                    setCompanyInfo(prev => ({ ...prev, ...updates }));
                    console.log('Updated company info with:', updates);
                }

                // Generate company ID based on extracted name
                if (extractedData.company_name) {
                    const newCompanyId = generateCompanyId(extractedData.company_name);
                    setCompanyId(newCompanyId);
                }

                const fieldsExtracted = Object.keys(updates).length;
                toast({
                    title: 'Extraction Complete!',
                    description: `Extracted ${fieldsExtracted} field(s). Please review and confirm the details.`,
                });
            } else {
                console.log('Extraction API failed, using fallback extraction');
                // Robust fallback: Extract as much info as possible from content using patterns
                const extractedName = extractNameFromContent(allContent);
                const extractedDescription = extractDescriptionFromContent(allContent);
                const extractedWebsite = extractWebsiteFromContent(allContent);
                const extractedIndustry = extractIndustryFromContent(allContent);
                const extractedStage = extractStageFromContent(allContent);

                // Update all fields that we could extract
                const updates: Partial<CompanyInformationData> = {};
                if (extractedName) updates.companyName = extractedName;
                if (extractedDescription) updates.companyDescription = extractedDescription;
                if (extractedWebsite) updates.website = extractedWebsite;
                if (extractedIndustry) updates.industryVertical = extractedIndustry;
                if (extractedStage) updates.developmentStage = extractedStage;

                if (Object.keys(updates).length > 0) {
                    setCompanyInfo(prev => ({ ...prev, ...updates }));
                    console.log('Fallback extraction found:', updates);

                    // Generate company ID if we found a name
                    if (updates.companyName) {
                        const newCompanyId = generateCompanyId(updates.companyName);
                        setCompanyId(newCompanyId);
                    }
                }

                const fieldsExtracted = Object.keys(updates).length;
                toast({
                    title: fieldsExtracted > 0 ? 'Extraction Complete' : 'Manual Entry Required',
                    description: fieldsExtracted > 0
                        ? `Extracted ${fieldsExtracted} field(s). Please review and complete any missing information.`
                        : 'Could not identify company information automatically. Please enter details manually.',
                });
            }

            setExtractionComplete(true);
        } catch (error) {
            console.error('Extraction failed:', error);
            toast({
                variant: 'destructive',
                title: 'Extraction Failed',
                description: 'Could not extract company info. Please fill in the details manually.',
            });
            setExtractionComplete(true); // Still mark complete so user can proceed
        } finally {
            setIsExtracting(false);
            setIsAiProcessing(false);
            setExtractionProgress(100);
            setExtractionStep('Complete!');
            setExtractionTimeLeft(0);
            extractionStartTime.current = 0;
        }
    };

    // Helper functions for robust extraction fallback
    const extractNameFromContent = (content: string): string => {
        // Look for common patterns - expanded to handle more cases
        const patterns = [
            // Direct company mentions
            /(?:company\s*(?:name)?[:\s]+)([A-Z][A-Za-z0-9\s&.,]+?)(?:\s*[-–—|,]|$)/im,
            // Pitch deck title patterns
            /^([A-Z][A-Za-z0-9\s&]+?)\s*[-–—|]\s*(?:pitch|deck|presentation|investor)/im,
            // About section
            /(?:about|introducing|introducing)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s*[-–—.,]|$)/im,
            // Header/Title patterns
            /^#\s*([A-Z][A-Za-z0-9\s&]+)$/m,
            // Logo/Company header
            /(?:welcome to|meet|discover)\s+([A-Z][A-Za-z0-9\s&]+)/i,
            // Legal patterns
            /(?:inc\.|llc|corp\.|ltd\.?)\s*$/im,
            // First line if capitalized
            /^([A-Z][A-Z0-9\s]{2,30})$/m,
        ];
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match?.[1] || match?.[0]) {
                const name = (match[1] || match[0]).trim().replace(/\s+/g, ' ').slice(0, 100);
                if (name.length > 2 && !name.toLowerCase().includes('pitch') && !name.toLowerCase().includes('deck')) {
                    return name;
                }
            }
        }
        return '';
    };

    const extractDescriptionFromContent = (content: string): string => {
        // Look for description patterns - expanded
        const patterns = [
            /(?:we\s+are|is\s+a|company\s+that)\s+([^.!?]+[.!?])/i,
            /(?:our\s+mission|mission[:\s]+)([^.!?]+[.!?])/i,
            /(?:what\s+we\s+do|overview[:\s]+)([^.!?]+[.!?])/i,
            /(?:executive\s+summary[:\s]+)([^.!?]+[.!?])/i,
            /(?:company\s+description[:\s]+)([^.!?]+[.!?])/i,
            /(?:about\s+(?:us|the\s+company)[:\s]+)([^.!?]+[.!?])/i,
        ];
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match?.[1]) return match[1].trim().slice(0, 500);
        }
        // Return first substantial paragraph
        const paragraphs = content.split(/\n\n+/).filter(p => p.length > 50 && p.length < 500);
        return paragraphs[0] || '';
    };

    // Enhanced extraction for additional fields
    const extractWebsiteFromContent = (content: string): string => {
        const match = content.match(/https?:\/\/(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i);
        return match ? `https://www.${match[1]}` : '';
    };

    const extractIndustryFromContent = (content: string): string => {
        const industries: { [key: string]: string[] } = {
            'Software/SaaS': ['saas', 'software', 'cloud', 'api', 'platform'],
            'FinTech': ['fintech', 'financial', 'banking', 'payment', 'lending'],
            'HealthTech/MedTech': ['health', 'medical', 'healthcare', 'clinical', 'patient'],
            'AI/ML': ['artificial intelligence', 'machine learning', 'ai', 'ml', 'deep learning'],
            'E-commerce': ['ecommerce', 'e-commerce', 'retail', 'marketplace', 'shopping'],
            'EdTech': ['education', 'learning', 'edtech', 'e-learning', 'training'],
            'CleanTech/GreenTech': ['clean', 'green', 'sustainable', 'renewable', 'environmental'],
            'Cybersecurity': ['security', 'cyber', 'encryption', 'privacy', 'protection'],
        };
        const lower = content.toLowerCase();
        for (const [industry, keywords] of Object.entries(industries)) {
            if (keywords.some(k => lower.includes(k))) return industry;
        }
        return '';
    };

    const extractStageFromContent = (content: string): string => {
        const lower = content.toLowerCase();
        if (lower.includes('series c') || lower.includes('series d')) return 'Series C+';
        if (lower.includes('series b')) return 'Series B';
        if (lower.includes('series a')) return 'Series A';
        if (lower.includes('seed round') || lower.includes('seed funding')) return 'Seed';
        if (lower.includes('pre-seed') || lower.includes('preseed')) return 'Pre-seed';
        if (lower.includes('growth') || lower.includes('scaling')) return 'Growth';
        return '';
    };

    // Restore autosaved data on mount
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(AUTOSAVE_KEY);
            if (savedData) {
                const parsed: AutosaveData = JSON.parse(savedData);
                // Only restore if data is less than 24 hours old
                const isRecent = Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000;
                if (isRecent && parsed.isFreshEvaluation !== false) {
                    // Restore evaluation IDs
                    if (parsed.evaluationId) setEvaluationId(parsed.evaluationId);
                    if (parsed.companyId) setCompanyId(parsed.companyId);
                    if (parsed.isFreshEvaluation !== undefined) setIsFreshEvaluation(parsed.isFreshEvaluation);

                    if (parsed.uploadedFiles?.length > 0) setUploadedFiles(parsed.uploadedFiles);
                    if (parsed.importedUrls?.length > 0) setImportedUrls(parsed.importedUrls);
                    if (parsed.submittedTexts?.length > 0) setSubmittedTexts(parsed.submittedTexts);
                    if (parsed.framework) setFramework(parsed.framework);
                    if (parsed.reportType) setReportType(parsed.reportType);
                    // Restore company info as unified object
                    if (parsed.companyInfo) {
                        setCompanyInfo(parsed.companyInfo);
                    }

                    // Show toast if data was restored
                    const hasData = parsed.uploadedFiles?.length > 0 || parsed.importedUrls?.length > 0 || parsed.submittedTexts?.length > 0 || parsed.companyInfo?.companyName;
                    if (hasData) {
                        toast({
                            title: 'Evaluation Restored',
                            description: `Restored evaluation ${parsed.evaluationId || 'data'} from your last session.`,
                        });
                    }
                } else if (!isRecent) {
                    // Data is old, start fresh
                    localStorage.removeItem(AUTOSAVE_KEY);
                }
            }
        } catch (e) {
            console.warn('Failed to restore autosaved data:', e);
        }
        setIsInitialized(true);
    }, [toast]);

    // Autosave data whenever it changes
    useEffect(() => {
        if (!isInitialized) return; // Don't save during initial restore

        const autosaveData: AutosaveData = {
            evaluationId,
            companyId,
            currentStep,
            uploadedFiles,
            importedUrls,
            submittedTexts,
            framework,
            reportType,
            companyInfo,
            savedAt: Date.now(),
            isFreshEvaluation,
        };

        try {
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autosaveData));
        } catch (e) {
            console.warn('Failed to autosave:', e);
        }
    }, [evaluationId, companyId, currentStep, uploadedFiles, importedUrls, submittedTexts, framework, reportType, companyInfo, isInitialized, isFreshEvaluation]);

    // Clear autosave after successful analysis
    const clearAutosave = useCallback(() => {
        localStorage.removeItem(AUTOSAVE_KEY);
    }, []);

    // Clear all data - uses fresh evaluation start
    const clearAllData = useCallback(() => {
        startNewEvaluation();
    }, [startNewEvaluation]);


    useEffect(() => {
        const storedUser = localStorage.getItem('loggedInUser');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setRole(user.role?.toLowerCase() || 'user');
            } catch (e) {
                setRole('user');
            }
        } else {
            setRole('user');
        }
    }, []);

    const handleRunAnalysis = async () => {
        const hasData = uploadedFiles.length > 0 || importedUrls.length > 0 || submittedTexts.length > 0 || companyInfo.companyName;

        // NO MOCK DATA - Require real company data
        if (!hasData) {
            toast({
                variant: 'destructive',
                title: 'No Data Provided',
                description: 'Please upload documents or enter company information to run analysis.',
            });
            return;
        }

        if (!companyInfo.companyName) {
            toast({
                variant: 'destructive',
                title: 'Company Name Required',
                description: 'Please enter a company name before running analysis.',
            });
            return;
        }

        setIsLoading(true);

        // Track analysis start
        trackingService.trackAnalysis(
            evaluationId,
            'FULL_ANALYSIS',
            'Complete 9-Module Analysis',
            { companyName: companyInfo.companyName, framework, documentCount: uploadedFiles.length }
        );

        // Prepare company data for analysis
        const companyData = {
            company_id: companyId,
            evaluation_id: evaluationId,
            company_name: companyInfo.companyName,
            legal_name: companyInfo.legalName,
            website: companyInfo.website,
            description: companyInfo.companyDescription,
            one_line_description: companyInfo.oneLineDescription,
            product_description: companyInfo.productDescription,
            industry_vertical: companyInfo.industryVertical,
            development_stage: companyInfo.developmentStage,
            business_model: companyInfo.businessModel,
            country: companyInfo.country,
            state: companyInfo.state,
            city: companyInfo.city,
            number_of_employees: companyInfo.numberOfEmployees,
            framework,
        };

        // Save to company history in database
        try {
            await fetch('https://tcairrapiccontainer.azurewebsites.net/api/v1/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(companyData),
            });
            console.log('Company data saved to database');
        } catch (saveError) {
            console.warn('Failed to save company data to database:', saveError);
        }

        // IMPORTANT: Clear ALL old analysis data before starting new evaluation
        // This prevents stale data from previous runs appearing in results
        const keysToBeforeNewAnalysis = [
            'analysisResult',
            'analysisTrackingInfo',
            'currentEvaluationId',
            'currentAnalysisId',
            'reportApprovalStatus',
            'analysisCompanyName',
            'analysisFramework',
            'analysisEvaluationId',
            'analysisCompanyId',
            'uploadedFiles',
            'importedUrls',
            'submittedTexts',
            'companyData'
        ];
        keysToBeforeNewAnalysis.forEach(key => localStorage.removeItem(key));
        console.log('🧹 Cleared old analysis data before new evaluation');

        // Store all data in localStorage for the analysis/run page to use
        // Sanitize company name - remove newlines, carriage returns, and extra whitespace
        const sanitizedCompanyName = companyInfo.companyName.replace(/[\r\n]+/g, ' ').trim();
        localStorage.setItem('analysisCompanyName', sanitizedCompanyName);
        localStorage.setItem('analysisFramework', framework);
        localStorage.setItem('analysisEvaluationId', evaluationId);
        localStorage.setItem('analysisCompanyId', companyId);
        localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
        localStorage.setItem('importedUrls', JSON.stringify(importedUrls));
        localStorage.setItem('submittedTexts', JSON.stringify(submittedTexts));
        localStorage.setItem('companyData', JSON.stringify({
            uploadedFiles,
            importedUrls,
            submittedTexts,
            companyName: sanitizedCompanyName,
            companyDescription: companyInfo.companyDescription || submittedTexts[0] || '',
            ...companyData,
        }));

        // Clear autosave before navigating
        clearAutosave();

        toast({
            title: 'Starting Analysis',
            description: `Redirecting to run all 9 modules for ${sanitizedCompanyName}...`,
        });

        // Redirect to the analysis runner page which shows 9-module progress
        router.push('/analysis/run');
    };

    const isPrivilegedUser = role === 'admin' || role === 'analyst';


    return (
        <EvaluationProvider
            role={role}
            reportType={reportType}
            framework={framework}
            onFrameworkChangeAction={setFramework}
            setReportTypeAction={setReportType}
            isLoading={isLoading}
            handleRunAnalysisAction={handleRunAnalysis}
            uploadedFiles={uploadedFiles}
            setUploadedFilesAction={setUploadedFiles}
            importedUrls={importedUrls}
            setImportedUrlsAction={setImportedUrls}
            submittedTexts={submittedTexts}
            setSubmittedTextsAction={setSubmittedTexts}
            companyName={companyInfo.companyName}
            setCompanyNameAction={(name: string | ((prev: string) => string)) => {
                const newName = typeof name === 'function' ? name(companyInfo.companyName) : name;
                setCompanyInfo(prev => ({ ...prev, companyName: newName }));
            }}
            companyDescription={companyInfo.companyDescription}
            setCompanyDescriptionAction={(desc: string | ((prev: string) => string)) => {
                const newDesc = typeof desc === 'function' ? desc(companyInfo.companyDescription) : desc;
                setCompanyInfo(prev => ({ ...prev, companyDescription: newDesc }));
            }}
            companyInfo={companyInfo}
            setCompanyInfoAction={setCompanyInfo}
        >
            <main className="bg-background text-foreground">
                <div className="container mx-auto p-4 md:p-8">
                    {/* User Session & Company Info Bar */}
                    <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        <span className="text-muted-foreground">User: </span>
                                        <span className="font-medium">{userSession?.email || 'Not logged in'}</span>
                                    </span>
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary capitalize">
                                        {userSession?.role || role}
                                    </span>
                                </div>
                                {companyInfo.companyName && (
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            <span className="text-muted-foreground">Active Company: </span>
                                            <span className="font-medium text-primary">{companyInfo.companyName}</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Session ID: {evaluationId}
                            </div>
                        </div>
                    </div>

                    {/* Clear Data Confirmation Alert */}
                    {showClearConfirm && (
                        <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="flex items-center justify-between">
                                <span className="text-yellow-700 dark:text-yellow-300">
                                    Are you sure you want to clear ALL data? This action cannot be undone.
                                </span>
                                <div className="flex gap-2 ml-4">
                                    <Button size="sm" variant="outline" onClick={() => setShowClearConfirm(false)}>
                                        Cancel
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={startNewEvaluation}>
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Clear All & Start Fresh
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <header className="text-center mb-12">
                        {(role === 'admin' || role === 'analyst') && (
                            <div className="flex justify-center items-center gap-4 mb-4">
                                <Label htmlFor="role-switcher" className={!isPrivilegedUser ? 'text-primary' : ''}>Standard User</Label>
                                <Switch
                                    id="role-switcher"
                                    checked={isPrivilegedUser}
                                    onCheckedChange={(checked) => {
                                        const newRole = checked ? 'admin' : 'user';
                                        setRole(newRole);
                                        if (newRole === 'user') {
                                            setReportType('triage');
                                        }
                                    }}
                                />
                                <Label htmlFor="role-switcher" className={isPrivilegedUser ? 'text-primary' : ''}>Admin / Analyst</Label>
                            </div>
                        )}
                        <div className='relative'>
                            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
                                Company Analysis Setup
                            </h1>
                        </div>
                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                            Configure the inputs for the company analysis.
                        </p>
                        {/* New Company Analysis Button */}
                        <div className="mt-4">
                            <Button
                                variant="outline"
                                onClick={startNewEvaluation}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Start New Company Analysis
                            </Button>
                        </div>
                    </header>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                                <p className="mt-4 text-muted-foreground">Running analysis for {companyInfo.companyName || 'company'}...</p>
                            </div>
                        </div>
                    ) : <AnalysisSetup
                        onClearAllData={clearAllData}
                        onShowClearConfirm={() => setShowClearConfirm(true)}
                        onExtractFromDocuments={handleExtractFromDocuments}
                        isExtracting={isExtracting}
                        extractionComplete={extractionComplete}
                        extractionProgress={extractionProgress}
                        extractionTimeLeft={extractionTimeLeft}
                        extractionStep={extractionStep}
                        currentStep={currentStep}
                        setCurrentStep={setCurrentStep}
                        evaluationId={evaluationId}
                        workflowData={workflowData}
                    />}
                </div>
            </main>
        </EvaluationProvider>
    );
}
