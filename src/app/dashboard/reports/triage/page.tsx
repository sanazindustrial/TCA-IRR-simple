'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FileText,
  BrainCircuit,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Building2,
  Shield,
  TrendingUp,
  Target,
  BarChart3,
  Users,
  Zap,
  ClipboardList,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { runAnalysis } from '@/app/analysis/actions';

const TRIAGE_STEPS = [
  { id: 1, name: 'Company Info', icon: Building2, description: 'Basic company details' },
  { id: 2, name: 'Data Input', icon: ClipboardList, description: 'Pitch summary & key metrics' },
  { id: 3, name: 'Modules', icon: Layers, description: 'Select analysis modules' },
  { id: 4, name: 'Generate', icon: BrainCircuit, description: 'Review & run triage' },
];

const TRIAGE_MODULES = [
  { id: 'tca', name: 'TCA Scorecard', description: 'Core 12-category investment scoring', icon: Target, required: true, weight: 30 },
  { id: 'risk', name: 'Risk Flags', description: '14-domain risk flag assessment', icon: Shield, required: true, weight: 25 },
  { id: 'growth', name: 'Growth Classifier', description: 'Revenue trajectory and growth tier', icon: TrendingUp, required: false, weight: 20 },
  { id: 'macro', name: 'Macro Trend Alignment', description: 'PESTEL market context analysis', icon: BarChart3, required: false, weight: 15 },
  { id: 'benchmark', name: 'Benchmark Comparison', description: 'Industry peer benchmarking', icon: Layers, required: false, weight: 5 },
  { id: 'team', name: 'Team Assessment', description: 'Founder & team quality signals', icon: Users, required: false, weight: 5 },
];

const SECTORS = [
  'Technology / SaaS',
  'Healthcare / MedTech',
  'Biotechnology',
  'FinTech',
  'CleanTech / Energy',
  'E-commerce / Retail',
  'Manufacturing',
  'AI / Deep Tech',
  'Other',
];

const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth'];

type Framework = 'general' | 'medtech';

export default function TriageReportWizardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [companyName, setCompanyName] = useState('');
  const [sector, setSector] = useState('');
  const [stage, setStage] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');

  const [pitchSummary, setPitchSummary] = useState('');
  const [keyMetrics, setKeyMetrics] = useState('');
  const [teamInfo, setTeamInfo] = useState('');
  const [productDescription, setProductDescription] = useState('');

  const [framework, setFramework] = useState<Framework>('general');
  const [selectedModules, setSelectedModules] = useState<string[]>(['tca', 'risk', 'growth', 'macro']);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');

  const canAdvanceFrom = (step: number): boolean => {
    if (step === 1) return companyName.trim().length > 0 && sector.length > 0 && stage.length > 0;
    if (step === 2) return pitchSummary.trim().length > 0;
    if (step === 3) return selectedModules.length > 0;
    return true;
  };

  const goToNext = () => {
    if (!canAdvanceFrom(currentStep)) {
      toast({
        variant: 'destructive',
        title: 'Required fields missing',
        description:
          currentStep === 1
            ? 'Please enter company name, sector, and stage.'
            : currentStep === 2
            ? 'Please enter a pitch summary.'
            : 'Please select at least one module.',
      });
      return;
    }
    setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
    setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const goToPrev = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const toggleModule = (moduleId: string, required: boolean) => {
    if (required) return;
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Preparing triage analysis...');

    const triageContext = {
      companyName,
      sector,
      stage,
      website,
      location,
      pitchSummary,
      keyMetrics,
      teamInfo,
      productDescription,
      framework,
      selectedModules,
      reportType: 'triage',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('triageContext', JSON.stringify(triageContext));
    localStorage.setItem('activeCompanyData', JSON.stringify({ companyName, sector, stage }));

    const progressSteps = [
      { pct: 15, msg: 'Running TCA Scorecard...' },
      { pct: 35, msg: 'Assessing risk flags...' },
      { pct: 55, msg: 'Analyzing growth trajectory...' },
      { pct: 70, msg: 'Evaluating macro trends...' },
      { pct: 85, msg: 'Computing composite score...' },
      { pct: 95, msg: 'Finalizing triage report...' },
    ];

    let stepIdx = 0;
    const progressTimer = setInterval(() => {
      if (stepIdx < progressSteps.length) {
        setGenerationProgress(progressSteps[stepIdx].pct);
        setGenerationStatus(progressSteps[stepIdx].msg);
        stepIdx++;
      }
    }, 1800);

    try {
      const analysisData = await runAnalysis(framework);
      clearInterval(progressTimer);
      setGenerationProgress(100);
      setGenerationStatus('Triage complete!');

      localStorage.setItem('analysisResult', JSON.stringify(analysisData));
      localStorage.setItem('analysisFramework', framework);

      const reportId = `triage-${Date.now()}`;
      const compositeScore =
        (analysisData as { tcaData?: { overallScore?: number } })?.tcaData?.overallScore ?? 0;
      const triageReport = {
        reportId,
        reportType: 'triage',
        companyName,
        framework,
        metadata: { compositeScore, sector, stage },
        createdAt: new Date().toISOString(),
        data: analysisData,
      };
      const existingReports = JSON.parse(localStorage.getItem('tca_reports') || '[]');
      existingReports.unshift(triageReport);
      localStorage.setItem('tca_reports', JSON.stringify(existingReports.slice(0, 50)));

      toast({ title: 'Triage Complete', description: `${companyName} triage analysis finished.` });
      router.push('/analysis/result');
    } catch (error) {
      clearInterval(progressTimer);
      console.error('Triage generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Triage Failed',
        description: error instanceof Error ? error.message : 'An error occurred during triage.',
      });
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus('');
    }
  };

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
              <CardDescription>
                Basic details about the company being screened for investment consideration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., QuantumLeap AI"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sector">
                    Sector <span className="text-destructive">*</span>
                  </Label>
                  <Select value={sector} onValueChange={setSector}>
                    <SelectTrigger id="sector">
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">
                    Stage <span className="text-destructive">*</span>
                  </Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger id="stage">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location / HQ</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-5" />
                Quick Data Input
              </CardTitle>
              <CardDescription>
                Paste the pitch summary and any available metrics. More context improves triage
                accuracy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="pitchSummary">
                  Pitch Summary / Executive Overview{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="pitchSummary"
                  placeholder="Paste the company pitch deck content, executive summary, or any description of the business, market opportunity, and value proposition..."
                  rows={6}
                  value={pitchSummary}
                  onChange={(e) => setPitchSummary(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{pitchSummary.length} characters</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="keyMetrics">Key Metrics (optional)</Label>
                <Textarea
                  id="keyMetrics"
                  placeholder="ARR, MRR, growth rate, CAC, LTV, burn rate, runway, team size, number of customers..."
                  rows={4}
                  value={keyMetrics}
                  onChange={(e) => setKeyMetrics(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamInfo">Team Background (optional)</Label>
                  <Textarea
                    id="teamInfo"
                    placeholder="Founder backgrounds, key team members, advisors..."
                    rows={3}
                    value={teamInfo}
                    onChange={(e) => setTeamInfo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productDescription">Product / Technology (optional)</Label>
                  <Textarea
                    id="productDescription"
                    placeholder="Product description, tech stack, IP, differentiators..."
                    rows={3}
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="size-5" />
                Select Analysis Modules
              </CardTitle>
              <CardDescription>
                Choose the modules to include in the triage. Required modules are always included.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Analysis Framework</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFramework('general')}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-left transition-all',
                      framework === 'general'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <Zap className="size-4" />
                      General Tech
                    </div>
                    <p className="text-sm text-muted-foreground">
                      SaaS, AI, FinTech, and general technology companies
                    </p>
                  </button>
                  <button
                    onClick={() => setFramework('medtech')}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-left transition-all',
                      framework === 'medtech'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <Shield className="size-4" />
                      MedTech / Life Sciences
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Healthcare, biotech, medical devices, and regulated industries
                    </p>
                  </button>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Triage Modules ({selectedModules.length} selected)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TRIAGE_MODULES.map((mod) => {
                    const Icon = mod.icon;
                    const isSelected = selectedModules.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModule(mod.id, mod.required)}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border-2 p-4 transition-all',
                          mod.required ? 'cursor-not-allowed opacity-90' : 'cursor-pointer',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={mod.required}
                          onCheckedChange={() => toggleModule(mod.id, mod.required)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 text-primary" />
                            <span className="font-medium text-sm">{mod.name}</span>
                            {mod.required && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{mod.description}</p>
                          <div className="text-xs text-muted-foreground">
                            Weight: {mod.weight}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="size-5" />
                Review & Generate Triage Report
              </CardTitle>
              <CardDescription>
                Confirm the configuration and run the AI analysis. This typically takes 30–60
                seconds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Company</p>
                  <p className="font-semibold">{companyName}</p>
                  <p className="text-sm text-muted-foreground">{sector}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Stage</p>
                  <p className="font-semibold">{stage}</p>
                  <p className="text-sm text-muted-foreground">
                    {location || 'Location not set'}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Framework
                  </p>
                  <p className="font-semibold capitalize">{framework}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedModules.length} modules selected
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Modules to run:</Label>
                <div className="flex flex-wrap gap-2">
                  {TRIAGE_MODULES.filter((m) => selectedModules.includes(m.id)).map((m) => (
                    <Badge key={m.id} variant="secondary" className="gap-1">
                      <m.icon className="size-3" />
                      {m.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-semibold">Input data summary:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-green-500" />
                    Pitch summary: {pitchSummary.length} characters
                  </li>
                  {keyMetrics && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-green-500" />
                      Key metrics provided
                    </li>
                  )}
                  {teamInfo && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-green-500" />
                      Team information provided
                    </li>
                  )}
                  {productDescription && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-green-500" />
                      Product description provided
                    </li>
                  )}
                </ul>
              </div>
              {isGenerating && (
                <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span className="font-medium">{generationStatus}</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {generationProgress}% complete
                  </p>
                </div>
              )}
              {!isGenerating && (
                <div className="flex justify-center pt-2">
                  <Button size="lg" onClick={handleGenerate} className="gap-2 px-8">
                    <Zap className="size-5" />
                    Run Triage Analysis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/reports">
                <ArrowLeft className="mr-1 size-4" />
                Reports
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="size-6 text-primary" />
            Triage Report Wizard
          </h1>
          <p className="text-muted-foreground text-sm">
            Quick AI-powered screening to identify investment-worthy companies
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Step {currentStep} of {TRIAGE_STEPS.length}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {TRIAGE_STEPS.map((step) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          return (
            <div
              key={step.id}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all',
                isCurrent
                  ? 'border-primary bg-primary/5'
                  : isCompleted
                  ? 'border-green-500/30 bg-green-50/30'
                  : 'border-border bg-muted/20 opacity-60'
              )}
            >
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full',
                  isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold">{step.name}</p>
                <p className="text-xs text-muted-foreground hidden md:block">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {renderStepContent()}

      {!(currentStep === 4 && isGenerating) && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={goToPrev} disabled={currentStep === 1}>
            <ArrowLeft className="mr-2 size-4" />
            Previous
          </Button>
          {currentStep < 4 && (
            <Button onClick={goToNext}>
              Next
              <ArrowRight className="ml-2 size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
