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
import { ChevronLeft, ChevronRight, Check, Lock, FileText, Database, Settings, Play, Upload, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackingService } from '@/lib/tracking-service';
import { startFreshEvaluation, clearEvaluationState, archiveCurrentEvaluation } from '@/lib/auto-extraction-service';

export type UserRole = 'user' | 'admin' | 'analyst';
export type ReportType = 'triage' | 'dd';

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

// Workflow steps configuration
const WORKFLOW_STEPS: WorkflowStep[] = [
    {
        id: 1,
        name: 'Upload Documents',
        description: 'Upload pitch deck, financials, and other materials',
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
        isComplete: () => false,
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
    onExtractFromDocuments,
    isExtracting,
    extractionComplete,
    currentStep,
    setCurrentStep,
    evaluationId,
    workflowData
}: {
    onClearAllData: () => void;
    onExtractFromDocuments: () => void;
    isExtracting: boolean;
    extractionComplete: boolean;
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
                onStepClick={setCurrentStep}
            />

            {/* Step Content */}
            <div className="min-h-[400px]">
                {/* Step 1: Upload Documents */}
                {currentStep === 1 && (
                    <div className="space-y-4">
                        <div className="border rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Upload Documents
                            </h3>
                            <DocumentSubmission
                                uploadedFiles={uploadedFiles}
                                setUploadedFiles={setUploadedFilesAction || (() => { })}
                                importedUrls={importedUrls}
                                setImportedUrls={setImportedUrlsAction || (() => { })}
                                submittedTexts={submittedTexts}
                                setSubmittedTexts={setSubmittedTextsAction || (() => { })}
                            />
                        </div>
                        {hasDocuments && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <p className="text-blue-700 dark:text-blue-300 text-sm">
                                    ✨ Documents uploaded! Click <strong>Next</strong> to extract company information automatically.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Company Information */}
                {currentStep === 2 && (
                    <div className="space-y-4">
                        {isExtracting && (
                            <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg">
                                <div className="text-center">
                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4" />
                                    <p className="text-muted-foreground">Extracting company information from documents...</p>
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
                            <CompanyInformation
                                framework={framework}
                                onFrameworkChange={onFrameworkChangeAction}
                            />
                        </div>
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
                        <ExternalDataSources framework={framework} />
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
                        <Button variant="ghost" onClick={onClearAllData}>
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
    const [extractionComplete, setExtractionComplete] = useState(false);

    // Compute workflow data for step validation
    const workflowData: WorkflowData = {
        hasDocuments: uploadedFiles.length > 0 || importedUrls.length > 0 || submittedTexts.length > 0,
        extractionComplete,
        hasCompanyInfo: (companyInfo?.companyName?.length ?? 0) > 0 || (companyInfo?.companyDescription?.length ?? 0) > 0,
        hasExternalData: false, // Track external data separately if needed
        hasModuleConfig: true, // Modules have default config
    };

    // Start fresh evaluation - clears all previous data
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
        setCurrentStep(1);
        setFramework('general');
        autoExtractionTriggered.current = false;

        // Initialize tracking service
        trackingService.initializeNewEvaluation(framework);

        // Clear localStorage
        localStorage.removeItem(AUTOSAVE_KEY);

        toast({
            title: 'New Evaluation Started',
            description: `Fresh evaluation ${newEvaluationId} created.`,
        });
    }, [framework, toast]);

    // Auto-extract when documents are uploaded - AUTOMATIC, no button needed
    const triggerAutoExtraction = useCallback(async () => {
        if (autoExtractionTriggered.current || isExtracting) return;

        const hasContent = uploadedFiles.length > 0 || importedUrls.length > 0 || submittedTexts.length > 0;
        if (!hasContent) return;

        autoExtractionTriggered.current = true;
        await handleExtractFromDocuments();
    }, [uploadedFiles, importedUrls, submittedTexts, isExtracting]);

    // Auto-trigger extraction when documents change (only in step 1)
    useEffect(() => {
        const hasDocuments = uploadedFiles.length > 0 || importedUrls.length > 0 || submittedTexts.length > 0;
        if (isInitialized && hasDocuments && !extractionComplete && !isExtracting && currentStep === 1) {
            // Delay auto-extraction slightly to allow batch uploads
            const timer = setTimeout(() => {
                triggerAutoExtraction();
            }, 2000); // 2 second delay for batch uploads
            return () => clearTimeout(timer);
        }
    }, [uploadedFiles.length, importedUrls.length, submittedTexts.length, isInitialized, extractionComplete, isExtracting, currentStep, triggerAutoExtraction]);

    // Extract company info from uploaded documents
    const handleExtractFromDocuments = async () => {
        setIsExtracting(true);
        try {
            // Get processed files from localStorage (set by document-submission component)
            const processedFiles = JSON.parse(localStorage.getItem('processedFiles') || '[]');
            const processedUrls = JSON.parse(localStorage.getItem('processedUrls') || '[]');
            const processedTexts = JSON.parse(localStorage.getItem('processedTexts') || '[]');

            // Combine all text content for extraction
            const allContent = [
                ...processedFiles.map((f: { extracted_data?: { text_content?: string } }) => f.extracted_data?.text_content || ''),
                ...processedUrls.map((u: { extracted_data?: { text_content?: string } }) => u.extracted_data?.text_content || ''),
                ...processedTexts.map((t: { content?: string }) => t.content || ''),
                ...submittedTexts,
            ].join('\n\n');

            // Call backend extraction API
            const response = await fetch('https://tcairrapiccontainer.azurewebsites.net/api/v1/analysis/extract-company-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: allContent,
                    framework,
                }),
            });

            if (response.ok) {
                const extractedData = await response.json();

                // Auto-fill company information fields using unified state update
                updateCompanyInfo({
                    companyName: extractedData.company_name || companyInfo.companyName,
                    legalName: extractedData.legal_name || companyInfo.legalName,
                    website: extractedData.website || companyInfo.website,
                    companyDescription: extractedData.description || companyInfo.companyDescription,
                    oneLineDescription: extractedData.one_line_description || companyInfo.oneLineDescription,
                    productDescription: extractedData.product_description || companyInfo.productDescription,
                    industryVertical: extractedData.industry_vertical || companyInfo.industryVertical,
                    developmentStage: extractedData.development_stage || companyInfo.developmentStage,
                    businessModel: extractedData.business_model || companyInfo.businessModel,
                    country: extractedData.country || companyInfo.country,
                    state: extractedData.state || companyInfo.state,
                    city: extractedData.city || companyInfo.city,
                    numberOfEmployees: extractedData.number_of_employees || companyInfo.numberOfEmployees,
                });

                toast({
                    title: 'Extraction Complete!',
                    description: 'Company information has been extracted. Please review and confirm the details.',
                });
            } else {
                // Fallback: Extract basic info from content using patterns
                const extractedName = extractNameFromContent(allContent);
                const extractedDescription = extractDescriptionFromContent(allContent);

                updateCompanyInfo({
                    companyName: extractedName || companyInfo.companyName,
                    companyDescription: extractedDescription || companyInfo.companyDescription,
                });

                toast({
                    title: 'Basic Extraction Complete',
                    description: 'Some information was extracted. Please review and complete missing fields.',
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
        } finally {
            setIsExtracting(false);
        }
    };

    // Helper functions for basic extraction fallback
    const extractNameFromContent = (content: string): string => {
        // Look for common patterns
        const patterns = [
            /company[:\s]+([A-Z][A-Za-z0-9\s&]+)/i,
            /^([A-Z][A-Za-z0-9\s&]+)\s*[-–—]\s*(pitch|deck|presentation)/im,
            /about\s+([A-Z][A-Za-z0-9\s&]+)/i,
        ];
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match?.[1]) return match[1].trim().slice(0, 100);
        }
        return '';
    };

    const extractDescriptionFromContent = (content: string): string => {
        // Look for description patterns
        const patterns = [
            /(?:we are|is a|company that)\s+([^.]+\.)/i,
            /(?:our mission|mission:)\s+([^.]+\.)/i,
            /(?:what we do|overview:)\s+([^.]+\.)/i,
        ];
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match?.[1]) return match[1].trim().slice(0, 500);
        }
        // Return first substantial paragraph
        const paragraphs = content.split(/\n\n+/).filter(p => p.length > 50 && p.length < 500);
        return paragraphs[0] || '';
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

        setIsLoading(true);

        // NO MOCK DATA - Require real company data
        if (!hasData) {
            toast({
                variant: 'destructive',
                title: 'No Data Provided',
                description: 'Please upload documents or enter company information to run analysis.',
            });
            setIsLoading(false);
            return;
        }

        if (!companyInfo.companyName) {
            toast({
                variant: 'destructive',
                title: 'Company Name Required',
                description: 'Please enter a company name before running analysis.',
            });
            setIsLoading(false);
            return;
        }

        const startTime = Date.now();

        // Track analysis start
        trackingService.trackAnalysis(
            evaluationId,
            'FULL_ANALYSIS',
            'Complete 9-Module Analysis',
            { companyName: companyInfo.companyName, framework, documentCount: uploadedFiles.length }
        );

        toast({
            title: 'Running Analysis...',
            description: `Processing ${companyInfo.companyName} - ${uploadedFiles.length} files, ${importedUrls.length} URLs.`,
        });

        try {
            // Save company info to database before analysis with tracking
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
                // Continue with analysis even if save fails
            }

            // Pass real user data to runAnalysis
            const userData = {
                uploadedFiles,
                importedUrls,
                submittedTexts,
                companyName: companyInfo.companyName || 'Unknown Company',
                companyDescription: companyInfo.companyDescription || submittedTexts[0] || 'User-provided company description',
                companyData, // Include all company fields
            };

            const comprehensiveData = await runAnalysis(framework, userData);
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;

            // Store analysis result with unique tracking IDs
            localStorage.setItem('analysisResult', JSON.stringify(comprehensiveData));
            localStorage.setItem('analysisDuration', duration.toString());
            localStorage.setItem('analysisFramework', framework);
            localStorage.setItem('analysisEvaluationId', evaluationId);
            localStorage.setItem('analysisCompanyId', companyId);
            localStorage.setItem('analysisCompanyName', companyInfo.companyName);
            
            // Update tracking service
            trackingService.updateEvaluation(evaluationId, {
                status: 'completed',
                companyName: companyInfo.companyName,
            });

            toast({
                title: 'Analysis Complete!',
                description: `Analysis ${evaluationId} completed in ${duration.toFixed(1)}s`,
            });

            // Clear autosave after successful analysis
            clearAutosave();

            // Role-based navigation:
            // - Admin/Analyst: Must go to what-if to review and adjust 9 module scores
            // - Standard user: Skip what-if, go directly to result page for triage report
            if (role === 'admin' || role === 'analyst') {
                toast({
                    title: 'Redirecting to Score Review',
                    description: 'As an admin/analyst, please review and adjust scores from 9 modules before generating the report.',
                });
                router.push('/analysis/what-if');
            } else {
                router.push('/analysis/result');
            }

        } catch (error) {
            console.error('Failed to run analysis:', error);
            
            // Track failure
            trackingService.updateEvaluation(evaluationId, {
                status: 'failed',
            });
            
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: error instanceof Error ? error.message : 'An unknown error occurred.',
            });
            setIsLoading(false);
        }
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
                                Analysis Setup
                            </h1>
                        </div>
                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                            Configure the inputs for the startup evaluation.
                        </p>
                        {/* New Evaluation Button */}
                        <div className="mt-4">
                            <Button 
                                variant="outline" 
                                onClick={startNewEvaluation}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Start New Evaluation
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
                        onExtractFromDocuments={handleExtractFromDocuments}
                        isExtracting={isExtracting}
                        extractionComplete={extractionComplete}
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
