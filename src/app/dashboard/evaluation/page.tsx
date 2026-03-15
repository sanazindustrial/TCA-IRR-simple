'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { sampleAnalysisData } from '@/lib/sample-data';

export type UserRole = 'user' | 'admin' | 'analyst';
export type ReportType = 'triage' | 'dd';

// Autosave storage key
const AUTOSAVE_KEY = 'evaluation_autosave';

type AutosaveData = {
    uploadedFiles: UploadedFile[];
    importedUrls: string[];
    submittedTexts: string[];
    framework: 'general' | 'medtech';
    reportType: ReportType;
    companyInfo: CompanyInformationData;
    savedAt: number;
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


function AnalysisSetup({ onClearAllData, onExtractFromDocuments, isExtracting, extractionComplete }: {
    onClearAllData: () => void;
    onExtractFromDocuments: () => void;
    isExtracting: boolean;
    extractionComplete: boolean;
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

    return (
        <div className="space-y-8 mb-12">
            {/* Step 1: Upload Documents First */}
            <div className="relative">
                <div className="absolute -left-4 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    1
                </div>
                <DocumentSubmission
                    uploadedFiles={uploadedFiles}
                    setUploadedFiles={setUploadedFilesAction || (() => { })}
                    importedUrls={importedUrls}
                    setImportedUrls={setImportedUrlsAction || (() => { })}
                    submittedTexts={submittedTexts}
                    setSubmittedTexts={setSubmittedTextsAction || (() => { })}
                />
            </div>

            {/* Extract Data Button */}
            {hasDocuments && !extractionComplete && (
                <div className="flex justify-center">
                    <Button
                        size="lg"
                        onClick={onExtractFromDocuments}
                        disabled={isExtracting}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        {isExtracting ? (
                            <>
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
                                Extracting Company Info...
                            </>
                        ) : (
                            '🤖 Extract Company Info from Documents'
                        )}
                    </Button>
                </div>
            )}

            {/* Step 2: Company Information (Auto-filled after extraction) */}
            <div className="relative">
                <div className="absolute -left-4 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    2
                </div>
                {extractionComplete && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
                            <span className="text-lg">✅</span>
                            <span>Company information extracted from documents. Please review and confirm the details below.</span>
                        </p>
                    </div>
                )}
                <CompanyInformation
                    framework={framework}
                    onFrameworkChange={onFrameworkChangeAction}
                />
            </div>

            {/* Step 3: External Data Sources (Admin/Analyst only) */}
            {isPrivilegedUser && (
                <div className="relative">
                    <div className="absolute -left-4 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                        3
                    </div>
                    <ExternalDataSources framework={framework} />
                </div>
            )}

            {/* Step 4: Module Configuration (Admin/Analyst only) */}
            {isPrivilegedUser && (
                <div className="relative">
                    <div className="absolute -left-4 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                        4
                    </div>
                    <ModuleConfiguration framework={framework} />
                </div>
            )}

            <div className="flex justify-between items-center gap-4">
                <div className="text-sm text-muted-foreground">
                    {hasData && (
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Auto-saving enabled
                        </span>
                    )}
                </div>
                <div className="flex gap-4">
                    {hasData && (
                        <Button variant="outline" size="lg" onClick={onClearAllData}>
                            Clear All Data
                        </Button>
                    )}
                    <Button
                        size="lg"
                        onClick={handleRunAnalysisAction}
                        disabled={isLoading || (hasDocuments && !canRunAnalysis)}
                    >
                        {isLoading ? 'Running...' : 'Run Analysis'}
                    </Button>
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
                if (isRecent) {
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
                            title: 'Data Restored',
                            description: `Restored your evaluation data from your last session.`,
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to restore autosaved data:', e);
        }
        setIsInitialized(true);
    }, []);

    // Autosave data whenever it changes
    useEffect(() => {
        if (!isInitialized) return; // Don't save during initial restore

        const autosaveData: AutosaveData = {
            uploadedFiles,
            importedUrls,
            submittedTexts,
            framework,
            reportType,
            companyInfo,
            savedAt: Date.now(),
        };

        try {
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autosaveData));
        } catch (e) {
            console.warn('Failed to autosave:', e);
        }
    }, [uploadedFiles, importedUrls, submittedTexts, framework, reportType, companyInfo, isInitialized]);

    // Clear autosave after successful analysis
    const clearAutosave = useCallback(() => {
        localStorage.removeItem(AUTOSAVE_KEY);
    }, []);

    // Clear all data (state + autosave)
    const clearAllData = useCallback(() => {
        setUploadedFiles([]);
        setImportedUrls([]);
        setSubmittedTexts([]);
        setFramework('general');
        setReportType('triage');
        // Reset company info to default
        setCompanyInfo(DEFAULT_COMPANY_INFO);
        // Reset extraction state
        setExtractionComplete(false);
        setIsExtracting(false);
        clearAutosave();
        toast({
            title: 'Data Cleared',
            description: 'All evaluation data has been removed.',
        });
    }, [clearAutosave, toast]);


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
        const isDemoMode = uploadedFiles.length === 0 && importedUrls.length === 0 && submittedTexts.length === 0;

        setIsLoading(true);

        if (isDemoMode) {
            toast({
                title: 'No Data Uploaded: Entering Simulation Mode',
                description: 'You will be redirected to the What-If Analysis with sample data.',
            });
            localStorage.setItem('analysisResult', JSON.stringify(sampleAnalysisData));
            localStorage.setItem('analysisFramework', framework);
            localStorage.removeItem('analysisDuration');
            clearAutosave();
            router.push('/analysis/what-if');
            return;
        }

        const startTime = Date.now();
        toast({
            title: 'Running Real Data Analysis...',
            description: `Processing ${uploadedFiles.length} files, ${importedUrls.length} URLs, and ${submittedTexts.length} text inputs.`,
        });
        try {
            // Save company info to database before analysis
            const companyData = {
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

            localStorage.setItem('analysisResult', JSON.stringify(comprehensiveData));
            localStorage.setItem('analysisDuration', duration.toString());
            localStorage.setItem('analysisFramework', framework);

            toast({
                title: 'Analysis Complete!',
                description: `Processed real data from your inputs in ${duration.toFixed(1)}s`,
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
                    </header>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                                <p className="mt-4 text-muted-foreground">Loading...</p>
                            </div>
                        </div>
                    ) : <AnalysisSetup
                        onClearAllData={clearAllData}
                        onExtractFromDocuments={handleExtractFromDocuments}
                        isExtracting={isExtracting}
                        extractionComplete={extractionComplete}
                    />}
                </div>
            </main>
        </EvaluationProvider>
    );
}
