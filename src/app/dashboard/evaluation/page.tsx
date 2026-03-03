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
import { EvaluationProvider, useEvaluationContext } from '@/components/evaluation/evaluation-provider';
import { useRouter } from 'next/navigation';
import { runAnalysis } from '@/app/analysis/actions';
import { sampleAnalysisData } from '@/lib/sample-data';

export type UserRole = 'user' | 'admin' | 'reviewer';
export type ReportType = 'triage' | 'dd';

// Autosave storage key
const AUTOSAVE_KEY = 'evaluation_autosave';

type AutosaveData = {
    uploadedFiles: UploadedFile[];
    importedUrls: string[];
    submittedTexts: string[];
    framework: 'general' | 'medtech';
    reportType: ReportType;
    savedAt: number;
};


function AnalysisSetup({ onClearAllData }: { onClearAllData: () => void }) {
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
    } = useEvaluationContext();

    const hasData = uploadedFiles.length > 0 || importedUrls.length > 0 || submittedTexts.length > 0;

    return (
        <div className="space-y-8 mb-12">
            <CompanyInformation
                framework={framework}
                onFrameworkChange={onFrameworkChangeAction}
            />
            <DocumentSubmission
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFilesAction || (() => { })}
                importedUrls={importedUrls}
                setImportedUrls={setImportedUrlsAction || (() => { })}
                submittedTexts={submittedTexts}
                setSubmittedTexts={setSubmittedTextsAction || (() => { })}
            />
            <ExternalDataSources framework={framework} />
            {isPrivilegedUser && <ModuleConfiguration framework={framework} />}

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
                    <Button size="lg" onClick={handleRunAnalysisAction} disabled={isLoading}>
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

                    // Show toast if data was restored
                    if (parsed.uploadedFiles?.length > 0 || parsed.importedUrls?.length > 0 || parsed.submittedTexts?.length > 0) {
                        toast({
                            title: 'Data Restored',
                            description: `Restored ${parsed.uploadedFiles?.length || 0} files, ${parsed.importedUrls?.length || 0} URLs, ${parsed.submittedTexts?.length || 0} texts from your last session.`,
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
            savedAt: Date.now(),
        };

        try {
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autosaveData));
        } catch (e) {
            console.warn('Failed to autosave:', e);
        }
    }, [uploadedFiles, importedUrls, submittedTexts, framework, reportType, isInitialized]);

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
        clearAutosave();
        toast({
            title: 'Data Cleared',
            description: 'All uploaded files, URLs, and text inputs have been removed.',
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
            // Pass real user data to runAnalysis
            const userData = {
                uploadedFiles,
                importedUrls,
                submittedTexts,
                companyName: 'User Company', // TODO: Get from company information form
                companyDescription: submittedTexts[0] || 'User-provided company description'
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
            // - Admin/Reviewer: Must go to what-if to review and adjust 9 module scores
            // - Standard user: Skip what-if, go directly to result page for triage report
            if (role === 'admin' || role === 'reviewer') {
                toast({
                    title: 'Redirecting to Score Review',
                    description: 'As an admin/reviewer, please review and adjust scores from 9 modules before generating the report.',
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

    const isPrivilegedUser = role === 'admin' || role === 'reviewer';


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
        >
            <main className="bg-background text-foreground">
                <div className="container mx-auto p-4 md:p-8">
                    <header className="text-center mb-12">
                        {(role === 'admin' || role === 'reviewer') && (
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
                                <Label htmlFor="role-switcher" className={isPrivilegedUser ? 'text-primary' : ''}>Admin / Reviewer</Label>
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
                    ) : <AnalysisSetup onClearAllData={clearAllData} />}
                </div>
            </main>
        </EvaluationProvider>
    );
}
