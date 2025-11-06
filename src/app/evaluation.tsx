
'use client';

import { useState, useEffect } from 'react';
import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';
import { CompanyInformation } from '@/components/analysis/company-information';
import { ModuleConfiguration } from '@/components/analysis/module-configuration';
import { Button } from '@/components/ui/button';
import Loading from './loading';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EvaluationProvider, useEvaluationContext } from '@/components/evaluation/evaluation-provider';
import { useRouter } from 'next/navigation';

type AnalysisPageProps = {
  runAnalysisAction: (
    framework: 'general' | 'medtech'
  ) => Promise<ComprehensiveAnalysisOutput>;
};

export type UserRole = 'user' | 'admin' | 'reviewer';
export type ReportType = 'triage' | 'dd';


function AnalysisSetup({ onRunAnalysis }: { onRunAnalysis: () => void }) {
  const context = useEvaluationContext();
  const {
    framework,
    isPrivilegedUser,
    isLoading,
    uploadedFiles,
    setUploadedFilesAction,
    importedUrls,
    setImportedUrlsAction,
    onFrameworkChangeAction
  } = context;

  return (
    <div className="space-y-8 mb-12">
      <CompanyInformation
        framework={framework}
        onFrameworkChange={onFrameworkChangeAction}
      />
      {isPrivilegedUser && <ModuleConfiguration framework={framework} />}

      <div className="flex justify-end gap-4">
        <Button size="lg" onClick={onRunAnalysis} disabled={isLoading}>
          {isLoading ? 'Running...' : 'Run Analysis'}
        </Button>
      </div>
    </div>
  );
}


export default function AnalysisPage({ runAnalysisAction }: AnalysisPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [framework, setFramework] = useState<'general' | 'medtech'>('general');
  const [role, setRole] = useState<UserRole>('user');
  const [reportType, setReportType] = useState<ReportType>('triage');
  const [analysisDuration, setAnalysisDuration] = useState<number | null>(null);
  const { toast } = useToast();
  const router = useRouter();

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
    setIsLoading(true);
    setAnalysisDuration(null);
    const startTime = Date.now();
    toast({
      title: 'Running Analysis...',
      description: 'The analysis is running and may take a moment.',
    });
    try {
      const comprehensiveData = await runAnalysisAction(framework);
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      localStorage.setItem('analysisResult', JSON.stringify(comprehensiveData));
      localStorage.setItem('analysisDuration', duration.toString());
      localStorage.setItem('analysisFramework', framework);
      
      router.push('/analysis/result');

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
      uploadedFiles={[]}
      setUploadedFilesAction={() => { }}
      importedUrls={[]}
      setImportedUrlsAction={() => { }}
      submittedTexts={[]}
      setSubmittedTextsAction={() => { }}
      isLoading={isLoading}
      handleRunAnalysisAction={handleRunAnalysis}
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

          {isLoading ? <Loading /> : <AnalysisSetup onRunAnalysis={handleRunAnalysis} />}
        </div>
      </main>
    </EvaluationProvider>
  );
}
