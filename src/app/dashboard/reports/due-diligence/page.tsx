
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  FileText,
  UploadCloud,
  BrainCircuit,
  ArrowLeft,
  ArrowRight,
  Link as LinkIcon,
  Type,
  X,
  Globe,
  FileUp,
  CheckCircle2,
  Loader2,
  Building2,
  Scale,
  Users,
  DollarSign,
  Shield,
  AlertTriangle,
  Check,
  RefreshCw,
  Database,
  Activity,
  FileSearch,
  Briefcase,
  LineChart,
  ClipboardCheck,
  Save,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { UploadedFile } from '@/components/analysis/document-submission';
import { runAnalysis } from '@/app/analysis/actions';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Define workflow steps
const WORKFLOW_STEPS = [
  { id: 1, name: 'Company Setup', icon: Building2, description: 'Enter target company information' },
  { id: 2, name: 'Document Upload', icon: FileUp, description: 'Upload relevant documents' },
  { id: 3, name: 'External Data', icon: Database, description: 'Connect external data sources' },
  { id: 4, name: 'Analysis Areas', icon: FileSearch, description: 'Select areas to analyze' },
  { id: 5, name: 'Review & Generate', icon: BrainCircuit, description: 'Review and generate report' },
];

// Due Diligence analysis areas
const DD_AREAS = [
  { id: 'financial', name: 'Financial Analysis', icon: DollarSign, required: true, items: ['Revenue analysis', 'Cost structure', 'Cash flow', 'Debt/equity', 'Financial projections'] },
  { id: 'legal', name: 'Legal & Compliance', icon: Scale, required: true, items: ['Corporate structure', 'Contracts review', 'IP portfolio', 'Litigation history', 'Regulatory compliance'] },
  { id: 'operational', name: 'Operations', icon: Activity, required: false, items: ['Supply chain', 'Manufacturing', 'Technology stack', 'Key processes', 'Scalability'] },
  { id: 'commercial', name: 'Commercial', icon: Briefcase, required: true, items: ['Market position', 'Customer analysis', 'Competitive landscape', 'Sales pipeline', 'Revenue model'] },
  { id: 'management', name: 'Management Team', icon: Users, required: true, items: ['Leadership assessment', 'Organizational structure', 'Key personnel', 'Compensation', 'Retention risk'] },
  { id: 'technology', name: 'Technology & IP', icon: BrainCircuit, required: false, items: ['Tech stack', 'Patents', 'Trade secrets', 'R&D pipeline', 'Technical debt'] },
  { id: 'risk', name: 'Risk Assessment', icon: Shield, required: true, items: ['Market risks', 'Operational risks', 'Financial risks', 'Regulatory risks', 'ESG factors'] },
  { id: 'valuation', name: 'Valuation', icon: LineChart, required: false, items: ['Comparable analysis', 'DCF model', 'Transaction comps', 'Asset valuation', 'Synergy analysis'] },
];

// External data sources
const EXTERNAL_SOURCES = [
  { id: 'sec', name: 'SEC EDGAR', description: 'Company filings, 10-K, 10-Q reports', status: 'available', free: true },
  { id: 'clinical-trials', name: 'ClinicalTrials.gov', description: 'Clinical trial data', status: 'available', free: true },
  { id: 'fda', name: 'OpenFDA', description: 'Drug and device approvals', status: 'available', free: true },
  { id: 'github', name: 'GitHub', description: 'Open source presence', status: 'available', free: true },
  { id: 'news', name: 'News Aggregator', description: 'Recent news and press', status: 'available', free: true },
  { id: 'patents', name: 'USPTO Patents', description: 'Patent filings', status: 'reference', free: true },
];

interface ExternalDataResult {
  source: string;
  success: boolean;
  data: unknown;
  error?: string;
}

export default function DueDiligenceWorkflowPage() {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Company selection mode
  const [selectionMode, setSelectionMode] = useState<'new' | 'existing'>('existing');
  const [existingCompanies, setExistingCompanies] = useState<Array<{
    id: string;
    name: string;
    industry: string;
    triageScore: number;
    analysisDate: string;
    evaluationId: string;
  }>>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedExistingCompany, setSelectedExistingCompany] = useState<string | null>(null);

  // Company info
  const [companyName, setCompanyName] = useState('');
  const [companyTicker, setCompanyTicker] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [dealType, setDealType] = useState('acquisition');
  const [sourceEvaluationId, setSourceEvaluationId] = useState<string | null>(null);

  // Documents
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [importedUrls, setImportedUrls] = useState<string[]>([]);
  const [submittedTexts, setSubmittedTexts] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');

  // External data
  const [selectedSources, setSelectedSources] = useState<string[]>(['sec', 'news']);
  const [externalData, setExternalData] = useState<ExternalDataResult[]>([]);
  const [fetchingData, setFetchingData] = useState(false);

  // Analysis areas
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    DD_AREAS.filter(a => a.required).map(a => a.id)
  );

  // Generation
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Calculate progress
  const progress = Math.round((completedSteps.length / WORKFLOW_STEPS.length) * 100);

  // File handling
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map((file) => ({
        name: file.name,
        size: file.size,
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      toast({ title: 'Files uploaded', description: `${newFiles.length} file(s) added successfully.` });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImportUrls = () => {
    if (urlInput.trim()) {
      const urls = urlInput.split('\n').filter((url) => url.trim() !== '');
      setImportedUrls((prev) => [...prev, ...urls]);
      setUrlInput('');
      toast({ title: 'URLs imported', description: `${urls.length} URL(s) added.` });
    }
  };

  const removeUrl = (index: number) => {
    setImportedUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitText = () => {
    if (textInput.trim()) {
      setSubmittedTexts((prev) => [...prev, textInput]);
      setTextInput('');
      toast({ title: 'Text added', description: 'Content saved for analysis.' });
    }
  };

  const removeText = (index: number) => {
    setSubmittedTexts((prev) => prev.filter((_, i) => i !== index));
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Step validation and navigation
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return companyName.trim().length > 0;
      case 2:
        return true; // Documents optional
      case 3:
        return selectedSources.length > 0;
      case 4:
        return selectedAreas.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  }, [currentStep, companyName, selectedSources, selectedAreas]);

  const nextStep = () => {
    if (canProceed() && currentStep < WORKFLOW_STEPS.length) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step <= Math.max(...completedSteps, currentStep)) {
      setCurrentStep(step);
    }
  };

  // Fetch external data
  const fetchExternalData = async () => {
    if (!companyName && !companyTicker) {
      toast({ variant: 'destructive', title: 'Enter company info', description: 'Please enter company name or ticker first.' });
      return;
    }

    setFetchingData(true);
    const query = companyTicker || companyName;
    const results: ExternalDataResult[] = [];

    for (const sourceId of selectedSources) {
      try {
        const response = await fetch(`/api/external-data?source=${sourceId}&query=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();
        results.push({
          source: sourceId,
          success: data.success !== false,
          data: data.data,
          error: data.error
        });
      } catch {
        results.push({
          source: sourceId,
          success: false,
          data: null,
          error: 'Failed to fetch data'
        });
      }
    }

    setExternalData(results);
    setFetchingData(false);

    const successCount = results.filter(r => r.success).length;
    toast({
      title: 'External data fetched',
      description: `Successfully retrieved data from ${successCount}/${selectedSources.length} sources.`
    });
  };

  // Generate report
  const handleGenerateReport = async () => {
    setIsLoading(true);
    toast({
      title: 'Generating Due Diligence Report...',
      description: 'This comprehensive analysis may take a moment.',
    });

    try {
      // Store DD context
      const ddContext = {
        companyName,
        companyTicker,
        companyIndustry,
        companyDescription,
        dealType,
        selectedAreas,
        externalData,
        uploadedFiles,
        importedUrls,
        submittedTexts,
        reportType: 'due-diligence'
      };
      localStorage.setItem('ddContext', JSON.stringify(ddContext));

      const comprehensiveData = await runAnalysis('medtech');
      localStorage.setItem('analysisResult', JSON.stringify(comprehensiveData));
      localStorage.setItem('analysisFramework', 'medtech');
      router.push('/analysis/result');
    } catch (error) {
      console.error('Failed to run DD analysis:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save draft
  const saveDraft = () => {
    const draft = {
      currentStep,
      completedSteps,
      companyName,
      companyTicker,
      companyIndustry,
      companyDescription,
      dealType,
      selectedAreas,
      selectedSources,
      uploadedFiles,
      importedUrls,
      submittedTexts,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('ddWorkflowDraft', JSON.stringify(draft));
    toast({ title: 'Draft saved', description: 'Your progress has been saved.' });
  };

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('ddWorkflowDraft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.companyName) {
          setCompanyName(parsed.companyName);
          setCompanyTicker(parsed.companyTicker || '');
          setCompanyIndustry(parsed.companyIndustry || '');
          setCompanyDescription(parsed.companyDescription || '');
          setDealType(parsed.dealType || 'acquisition');
          setSelectedAreas(parsed.selectedAreas || []);
          setSelectedSources(parsed.selectedSources || ['sec', 'news']);
          setCompletedSteps(parsed.completedSteps || []);
          setCurrentStep(parsed.currentStep || 1);
        }
      } catch {
        console.error('Failed to load draft');
      }
    }
  }, []);

  // Load existing companies with triage reports
  const loadExistingCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      // First check localStorage for recent reports
      const tcaReports = localStorage.getItem('tca_reports');
      const unifiedRecords = localStorage.getItem('unified_records');

      const companies: Array<{
        id: string;
        name: string;
        industry: string;
        triageScore: number;
        analysisDate: string;
        evaluationId: string;
      }> = [];

      // Parse localStorage reports
      if (tcaReports) {
        try {
          const reports = JSON.parse(tcaReports);
          if (Array.isArray(reports)) {
            reports.forEach(report => {
              if (report.reportType === 'triage' && report.companyName) {
                companies.push({
                  id: report.reportId || report.id,
                  name: report.companyName,
                  industry: report.framework === 'medtech' ? 'MedTech/Biotech' : 'Technology',
                  triageScore: report.metadata?.compositeScore || 0,
                  analysisDate: report.createdAt || new Date().toISOString(),
                  evaluationId: report.evaluationId || report.id,
                });
              }
            });
          }
        } catch (e) {
          console.warn('Error parsing tca_reports:', e);
        }
      }

      // Parse unified records
      if (unifiedRecords) {
        try {
          const records = JSON.parse(unifiedRecords);
          if (Array.isArray(records)) {
            records.forEach(record => {
              if (record.analysis?.overallScore && record.company?.name) {
                // Check if company already in list
                if (!companies.find(c => c.name === record.company.name)) {
                  companies.push({
                    id: record.id?.evaluationId || String(Date.now()),
                    name: record.company.name,
                    industry: record.company.industry || 'Technology',
                    triageScore: record.analysis.overallScore,
                    analysisDate: record.id?.createdAt || new Date().toISOString(),
                    evaluationId: record.id?.evaluationId || String(Date.now()),
                  });
                }
              }
            });
          }
        } catch (e) {
          console.warn('Error parsing unified_records:', e);
        }
      }

      // Sort by date descending
      companies.sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime());

      setExistingCompanies(companies);
    } catch (error) {
      console.error('Error loading existing companies:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load existing companies.',
      });
    } finally {
      setLoadingCompanies(false);
    }
  }, [toast]);

  // Load existing companies on mount
  useEffect(() => {
    loadExistingCompanies();
  }, [loadExistingCompanies]);

  // Handle selecting an existing company
  const handleSelectExistingCompany = useCallback((companyId: string) => {
    const company = existingCompanies.find(c => c.id === companyId);
    if (company) {
      setSelectedExistingCompany(companyId);
      setCompanyName(company.name);
      setCompanyIndustry(company.industry);
      setSourceEvaluationId(company.evaluationId);

      // Load company data from localStorage
      const tcaReports = localStorage.getItem('tca_reports');
      if (tcaReports) {
        try {
          const reports = JSON.parse(tcaReports);
          const report = reports.find((r: { companyName: string }) => r.companyName === company.name);
          if (report?.data) {
            // Store for later use
            localStorage.setItem('ddSourceAnalysis', JSON.stringify(report.data));
          }
        } catch (e) {
          console.warn('Error loading company data:', e);
        }
      }

      toast({
        title: 'Company Selected',
        description: `${company.name} selected. Previous triage data will be used as foundation.`,
      });
    }
  }, [existingCompanies, toast]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5" />
                Company Information
              </CardTitle>
              <CardDescription>Select an existing company or enter details about a new target company for due diligence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Selection Mode */}
              <div className="space-y-4">
                <Label>Company Source</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={selectionMode === 'existing' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectionMode('existing')}
                  >
                    <Database className="mr-2 size-4" />
                    Select from Database
                  </Button>
                  <Button
                    variant={selectionMode === 'new' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectionMode('new')}
                  >
                    <Building2 className="mr-2 size-4" />
                    New Company
                  </Button>
                </div>
              </div>

              {/* Existing Company Selection */}
              {selectionMode === 'existing' && (
                <div className="space-y-4">
                  <Label>Select Company with Triage Report</Label>
                  {loadingCompanies ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-6 animate-spin mr-2" />
                      <span>Loading companies...</span>
                    </div>
                  ) : existingCompanies.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg bg-muted/50">
                      <Database className="size-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No companies with completed triage reports found.</p>
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={() => setSelectionMode('new')}
                      >
                        Enter new company instead
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3 max-h-[300px] overflow-y-auto">
                      {existingCompanies.map((company) => (
                        <div
                          key={company.id}
                          className={cn(
                            "flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors",
                            selectedExistingCompany === company.id
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50"
                          )}
                          onClick={() => handleSelectExistingCompany(company.id)}
                        >
                          <div className="flex items-center gap-3">
                            {selectedExistingCompany === company.id && (
                              <CheckCircle2 className="size-5 text-primary" />
                            )}
                            <div>
                              <p className="font-semibold">{company.name}</p>
                              <p className="text-sm text-muted-foreground">{company.industry}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={company.triageScore >= 7 ? 'default' : company.triageScore >= 5 ? 'secondary' : 'destructive'}>
                              Score: {company.triageScore.toFixed(1)}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(company.analysisDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedExistingCompany && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="size-5 text-green-600" />
                      <span className="text-green-800">
                        Previous analysis data will be imported. You can add additional documents below.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* New Company Form or Additional Info */}
              {(selectionMode === 'new' || selectedExistingCompany) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        placeholder="e.g., QuantumLeap AI"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={selectionMode === 'existing' && !!selectedExistingCompany}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ticker">Stock Ticker (if public)</Label>
                      <Input
                        id="ticker"
                        name="ticker"
                        placeholder="e.g., AAPL"
                        value={companyTicker}
                        onChange={(e) => setCompanyTicker(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                </>
              )}

              {selectionMode === 'new' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Select value={companyIndustry} onValueChange={setCompanyIndustry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="healthcare">Healthcare / MedTech</SelectItem>
                          <SelectItem value="technology">Technology / SaaS</SelectItem>
                          <SelectItem value="fintech">FinTech</SelectItem>
                          <SelectItem value="biotech">Biotechnology</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="retail">Retail / E-commerce</SelectItem>
                          <SelectItem value="energy">Energy / CleanTech</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dealType">Deal Type</Label>
                      <Select value={dealType} onValueChange={setDealType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select deal type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="acquisition">Acquisition</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                          <SelectItem value="merger">Merger</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="ipo">IPO Preparation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the company, its products/services, and market position..."
                      rows={4}
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="size-5" />
                Document Submission
              </CardTitle>
              <CardDescription>Upload relevant documents for analysis. These are optional but improve analysis quality.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="file">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="file"><UploadCloud className="mr-2 size-4" /> Files</TabsTrigger>
                  <TabsTrigger value="url"><LinkIcon className="mr-2 size-4" /> URLs</TabsTrigger>
                  <TabsTrigger value="text"><Type className="mr-2 size-4" /> Text</TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4">
                  <div
                    className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-3 text-lg font-semibold">Drop files here or click to browse</h3>
                    <p className="mt-1 text-sm text-muted-foreground">PDF, DOCX, XLSX, TXT (Max 50MB each)</p>
                    <Input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple accept=".pdf,.docx,.xlsx,.txt,.csv" />
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground">Uploaded Files ({uploadedFiles.length})</h4>
                      <div className="grid gap-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between rounded-md border bg-muted/30 p-2">
                            <div className="flex items-center gap-2">
                              <FileText className="size-4 text-primary" />
                              <span className="font-medium text-sm">{file.name}</span>
                              <Badge variant="secondary" className="text-xs">{formatBytes(file.size)}</Badge>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="size-7">
                              <X className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">Enter URLs to data rooms, document repositories, or public filings.</p>
                    <Textarea
                      placeholder="https://example.com/data-room/&#10;https://sec.gov/filing/..."
                      rows={4}
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                    <Button onClick={handleImportUrls} disabled={!urlInput.trim()}>
                      <LinkIcon className="mr-2 size-4" /> Import URLs
                    </Button>
                  </div>

                  {importedUrls.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground">Imported URLs ({importedUrls.length})</h4>
                      <div className="grid gap-2">
                        {importedUrls.map((url, index) => (
                          <div key={index} className="flex items-center justify-between rounded-md border bg-muted/30 p-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Globe className="size-4 flex-shrink-0 text-primary" />
                              <span className="truncate text-sm">{url}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeUrl(index)} className="size-7">
                              <X className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">Paste any relevant text, notes, or extracted content.</p>
                    <Textarea
                      placeholder="Paste executive summary, key findings, or other relevant information..."
                      rows={6}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                    />
                    <Button onClick={handleSubmitText} disabled={!textInput.trim()}>
                      <Type className="mr-2 size-4" /> Add Text
                    </Button>
                  </div>

                  {submittedTexts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground">Submitted Texts ({submittedTexts.length})</h4>
                      <div className="grid gap-2">
                        {submittedTexts.map((text, index) => (
                          <div key={index} className="flex items-start justify-between rounded-md border bg-muted/30 p-2">
                            <p className="text-sm line-clamp-2 flex-1 mr-2">{text}</p>
                            <Button variant="ghost" size="icon" onClick={() => removeText(index)} className="size-7 flex-shrink-0">
                              <X className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-5" />
                External Data Sources
              </CardTitle>
              <CardDescription>Connect to free external data sources for comprehensive analysis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {EXTERNAL_SOURCES.map((source) => (
                  <div
                    key={source.id}
                    className={cn(
                      "flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      selectedSources.includes(source.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => {
                      setSelectedSources(prev =>
                        prev.includes(source.id)
                          ? prev.filter(s => s !== source.id)
                          : [...prev, source.id]
                      );
                    }}
                  >
                    <Checkbox
                      checked={selectedSources.includes(source.id)}
                      onCheckedChange={(checked) => {
                        setSelectedSources(prev =>
                          checked
                            ? [...prev, source.id]
                            : prev.filter(s => s !== source.id)
                        );
                      }}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium cursor-pointer">{source.name}</Label>
                        {source.free && <Badge variant="outline" className="text-xs text-green-600 border-green-300">FREE</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{source.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Fetch external data for: <span className="text-primary">{companyName || companyTicker || 'No company set'}</span></p>
                  <p className="text-sm text-muted-foreground">{selectedSources.length} source(s) selected</p>
                </div>
                <Button onClick={fetchExternalData} disabled={fetchingData || !companyName}>
                  {fetchingData ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Fetching...</>
                  ) : (
                    <><RefreshCw className="mr-2 size-4" /> Fetch Data</>
                  )}
                </Button>
              </div>

              {externalData.length > 0 && (
                <Accordion type="multiple" className="w-full">
                  {externalData.map((result) => (
                    <AccordionItem key={result.source} value={result.source}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle2 className="size-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="size-4 text-amber-500" />
                          )}
                          <span className="font-medium">{EXTERNAL_SOURCES.find(s => s.id === result.source)?.name || result.source}</span>
                          {result.success && result.data ? (
                            <Badge variant="secondary" className="ml-2">
                              {String(Array.isArray(result.data) ? result.data.length : Object.keys(result.data as object).length)} items
                            </Badge>
                          ) : null}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {result.success ? (
                          <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-sm text-destructive">{result.error || 'Failed to fetch data'}</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="size-5" />
                Analysis Areas
              </CardTitle>
              <CardDescription>Select the areas to include in the due diligence analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DD_AREAS.map((area) => {
                  const Icon = area.icon;
                  const isSelected = selectedAreas.includes(area.id);

                  return (
                    <div
                      key={area.id}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all",
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                        area.required && "ring-1 ring-primary/20"
                      )}
                      onClick={() => {
                        if (!area.required || !isSelected) {
                          setSelectedAreas(prev =>
                            isSelected
                              ? prev.filter(a => a !== area.id)
                              : [...prev, area.id]
                          );
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-md",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}>
                            <Icon className="size-5" />
                          </div>
                          <div>
                            <Label className="font-semibold cursor-pointer">{area.name}</Label>
                            {area.required && <Badge variant="outline" className="ml-2 text-xs">Required</Badge>}
                          </div>
                        </div>
                        <Checkbox checked={isSelected} disabled={area.required && isSelected} />
                      </div>
                      <ul className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        {area.items.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <Check className="size-3 text-primary" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="size-5" />
                  Review Summary
                </CardTitle>
                <CardDescription>Review your due diligence setup before generating the report.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground">TARGET COMPANY</h4>
                      <p className="text-lg font-semibold">{companyName}</p>
                      <p className="text-sm text-muted-foreground">
                        {companyTicker && `Ticker: ${companyTicker} • `}
                        {companyIndustry && `${companyIndustry} • `}
                        {dealType}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground">DOCUMENTS</h4>
                      <div className="flex gap-4 text-sm mt-2">
                        <span>{uploadedFiles.length} file(s)</span>
                        <span>{importedUrls.length} URL(s)</span>
                        <span>{submittedTexts.length} text(s)</span>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground">EXTERNAL DATA</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedSources.map(id => (
                          <Badge key={id} variant="secondary">
                            {EXTERNAL_SOURCES.find(s => s.id === id)?.name}
                            {externalData.find(d => d.source === id)?.success && (
                              <CheckCircle2 className="size-3 ml-1 text-green-500" />
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">ANALYSIS AREAS</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedAreas.map(id => {
                        const area = DD_AREAS.find(a => a.id === id);
                        if (!area) return null;
                        const Icon = area.icon;
                        return (
                          <div key={id} className="flex items-center gap-2 text-sm">
                            <Icon className="size-4 text-primary" />
                            <span>{area.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={saveDraft}>
                  <Save className="mr-2 size-4" /> Save Draft
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowPreview(true)}>
                    <Eye className="mr-2 size-4" /> Preview
                  </Button>
                  <Button size="lg" onClick={handleGenerateReport} disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="mr-2 size-4 animate-spin" /> Generating...</>
                    ) : (
                      <><BrainCircuit className="mr-2 size-4" /> Generate Report</>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <header className="mb-8">
        <Link
          href="/dashboard/reports"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="size-4" /> Back to Reports
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary tracking-tight">
              Due Diligence Workflow
            </h1>
            <p className="mt-2 text-muted-foreground">
              Complete the steps below to generate a comprehensive due diligence report.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Progress:</span>
            <div className="w-32">
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center min-w-max gap-0">
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = completedSteps.includes(step.id);
            const isAccessible = step.id <= Math.max(...completedSteps, currentStep);

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => isAccessible && goToStep(step.id)}
                  disabled={!isAccessible}
                  className={cn(
                    "flex flex-col items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    isActive && "bg-primary/10",
                    isAccessible && !isActive && "hover:bg-muted cursor-pointer",
                    !isAccessible && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "size-10 rounded-full flex items-center justify-center transition-all",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && !isActive && "bg-green-500 text-white",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted && !isActive ? (
                      <Check className="size-5" />
                    ) : (
                      <Icon className="size-5" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isActive && "text-primary",
                    !isActive && "text-muted-foreground"
                  )}>
                    {step.name}
                  </span>
                </button>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div className={cn(
                    "h-0.5 w-8 mx-1",
                    completedSteps.includes(step.id) ? "bg-green-500" : "bg-border"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 size-4" /> Previous
        </Button>

        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {WORKFLOW_STEPS.length}
        </div>

        {currentStep < WORKFLOW_STEPS.length ? (
          <Button onClick={nextStep} disabled={!canProceed()}>
            Next <ArrowRight className="ml-2 size-4" />
          </Button>
        ) : (
          <div /> // Empty div for flex spacing
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Report Preview</DialogTitle>
            <DialogDescription>
              This preview shows the structure of the due diligence report that will be generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Due Diligence Report: {companyName}</h3>
              <p className="text-sm text-muted-foreground mb-4">{companyDescription || 'No description provided.'}</p>

              <h4 className="font-medium mb-2">Report Sections:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Executive Summary</li>
                {selectedAreas.map(id => (
                  <li key={id}>{DD_AREAS.find(a => a.id === id)?.name}</li>
                ))}
                <li>Key Findings & Recommendations</li>
                <li>Risk Matrix</li>
                <li>Appendices</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>Close</Button>
            <Button onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
