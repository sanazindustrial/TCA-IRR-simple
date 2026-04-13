'use client';
import { useState, useRef, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2, UploadCloud, FileText, MessageSquareQuote, X, Link as LinkIcon, Type, Globe, BrainCircuit, CheckCircle2, Circle, ArrowRight, Save, Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EvaluationProvider } from '@/components/evaluation/evaluation-provider';
import { AnalystComments } from '@/components/evaluation/analyst-comments';
import { AnalystAIDeviation } from '@/components/evaluation/analyst-ai-deviation';
import { Progress } from '@/components/ui/progress';

type UploadedFile = {
  name: string;
  size: number;
};

// Workflow Step Definition
type WorkflowStep = {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
};

const initialComments = Array(5).fill('');

export default function AnalystAnalysisPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [importedUrls, setImportedUrls] = useState<string[]>([]);
  const [submittedTexts, setSubmittedTexts] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');

  const [ceoQa, setCeoQa] = useState('');
  const [analystNotes, setAnalystNotes] = useState('');
  const [comments, setComments] = useState<string[]>(initialComments);
  const [analysisResults, setAnalysisResults] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Workflow Steps for clear analyst guidance
  const workflowSteps: WorkflowStep[] = [
    { id: 1, title: 'Upload Documents', description: 'Upload interview transcripts, DD reports, pitch decks', status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'pending' },
    { id: 2, title: 'Add Qualitative Insights', description: 'Enter CEO Q&A notes and analyst observations', status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'pending' },
    { id: 3, title: 'NLP Analysis Input', description: 'Add 30-40 specific comments for analysis', status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'pending' },
    { id: 4, title: 'Run Analysis', description: 'Execute thematic, sentiment, and gap analysis', status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'current' : 'pending' },
    { id: 5, title: 'Review Results', description: 'Review AI vs Human insights and finalize', status: currentStep === 5 ? 'current' : 'pending' },
  ];

  const progressPercentage = ((currentStep - 1) / (workflowSteps.length - 1)) * 100;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const role = user.role?.toLowerCase();
      if (role !== 'admin' && role !== 'analyst') {
        router.push('/unauthorized');
      }
    } else {
      // If no user is logged in, redirect to login
      router.push('/login');
    }
  }, [router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map((file) => ({
        name: file.name,
        size: file.size,
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
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
    }
  };

  const removeUrl = (index: number) => {
    setImportedUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitText = () => {
    if (textInput.trim()) {
      setSubmittedTexts((prev) => [...prev, textInput]);
      setTextInput('');
    }
  };

  const removeText = (index: number) => {
    setSubmittedTexts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCommentChange = (index: number, value: string) => {
    const newComments = [...comments];
    newComments[index] = value;
    setComments(newComments);
  };

  const addComment = () => setComments([...comments, '']);
  const removeComment = (index: number) => setComments(comments.filter((_, i) => i !== index));

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleSave = () => {
    toast({
      title: "Analysis Saved",
      description: "Your qualitative insights and comments have been saved."
    })
  }

  const handleRunAnalysis = () => {
    toast({
      title: "Analysis Started",
      description: "Running thematic, sentiment, deep analysis, and AI vs. human gap analysis."
    });
    setAnalysisResults(true);
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Link
          href="/dashboard/evaluation"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to Analysis Setup
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
          Analyst Review &amp; Deep Analysis
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
          Upload interview notes, add qualitative comments, and conduct deep analysis to compare Human vs AI insights.
        </p>
      </header>

      {/* Step-by-Step Workflow Tracker */}
      <Card className="mb-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Analysis Workflow Progress</CardTitle>
            <Badge variant="outline" className="text-primary">
              Step {currentStep} of {workflowSteps.length}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 md:gap-4 justify-between">
            {workflowSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 p-2 md:p-3 rounded-lg transition-all flex-1 min-w-[120px] ${step.status === 'current'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : step.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
              >
                <div className="flex-shrink-0">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="size-5" />
                  ) : step.status === 'current' ? (
                    <div className="size-5 rounded-full border-2 border-current flex items-center justify-center">
                      <span className="text-xs font-bold">{step.id}</span>
                    </div>
                  ) : (
                    <Circle className="size-5" />
                  )}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-semibold">{step.title}</div>
                  <div className="text-[10px] opacity-80 truncate max-w-[100px]">{step.description}</div>
                </div>
                <div className="text-left md:hidden">
                  <div className="text-xs font-semibold">{step.id}</div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <Card className={currentStep === 1 ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant={currentStep > 1 ? 'default' : 'outline'} className="size-6 flex items-center justify-center p-0">1</Badge>
              <CardTitle>Document Submission</CardTitle>
            </div>
            <CardDescription>Upload interview transcripts, DD reports, or other relevant documents.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="file">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="file">
                  <UploadCloud className="mr-2" /> File Upload
                </TabsTrigger>
                <TabsTrigger value="url">
                  <LinkIcon className="mr-2" /> URL Import
                </TabsTrigger>
                <TabsTrigger value="text">
                  <Type className="mr-2" /> Text Input
                </TabsTrigger>
              </TabsList>
              <TabsContent value="file">
                <div
                  className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    Drop your file here or click to browse
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Supported: PDF, DOCX, TXT
                  </p>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                  />
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-semibold text-muted-foreground">
                      Uploaded Files
                    </h4>
                    <ul className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between rounded-md border bg-muted/30 p-2"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="size-5 text-primary" />
                            <span className="font-medium">{file.name}</span>
                            <Badge variant="secondary">
                              {formatBytes(file.size)}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                            className="size-6"
                          >
                            <X className="size-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="url">
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter URLs to import data from. One URL per line.
                  </p>
                  <Textarea
                    placeholder="https://example.com/pitch-deck.pdf\nhttps://medium.com/my-startup/our-vision"
                    rows={5}
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <Button onClick={handleImportUrls}>Import from URLs</Button>
                </div>
                {importedUrls.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-semibold text-muted-foreground">
                      Imported URLs
                    </h4>
                    <ul className="space-y-2">
                      {importedUrls.map((url, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between rounded-md border bg-muted/30 p-2"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Globe className="size-5 flex-shrink-0 text-primary" />
                            <span className="truncate font-medium">{url}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeUrl(index)}
                            className="size-6"
                          >
                            <X className="size-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="text">
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Paste any relevant text content below, such as a business plan
                    or executive summary.
                  </p>
                  <Textarea
                    placeholder="Paste your content here..."
                    rows={8}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                  <Button onClick={handleSubmitText}>Submit Text</Button>
                </div>
                {submittedTexts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-semibold text-muted-foreground">
                      Submitted Texts
                    </h4>
                    <ul className="space-y-2">
                      {submittedTexts.map((text, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between rounded-md border bg-muted/30 p-2"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Type className="size-5 flex-shrink-0 text-primary" />
                            <p className="truncate text-sm font-medium">
                              {text}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeText(index)}
                            className="size-6"
                          >
                            <X className="size-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className={currentStep === 2 ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant={currentStep > 2 ? 'default' : 'outline'} className="size-6 flex items-center justify-center p-0">2</Badge>
              <CardTitle>Qualitative Insights</CardTitle>
            </div>
            <CardDescription>Add notes from CEO interviews, Q&A sessions, and other qualitative assessments. This data is stored temporarily and should be saved.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ceo-qa">CEO Q&A / Interview Notes</Label>
              <Textarea id="ceo-qa" value={ceoQa} onChange={e => setCeoQa(e.target.value)} rows={8} placeholder="e.g., Q: What is your biggest challenge? A: ..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="analyst-notes">Analyst Notes & Deep Content Analysis</Label>
              <Textarea id="analyst-notes" value={analystNotes} onChange={e => setAnalystNotes(e.target.value)} rows={8} placeholder="Summarize key findings, compare AI vs. human analysis, sentiment analysis, and provide overall impressions..." />
            </div>
          </CardContent>
        </Card>

        <Card className={currentStep === 3 ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant={currentStep > 3 ? 'default' : 'outline'} className="size-6 flex items-center justify-center p-0">3</Badge>
              <CardTitle>NLP Analysis Input</CardTitle>
            </div>
            <CardDescription>Add 30-40 specific comments for thematic, sentiment, and AI-Human comparison analysis. Each comment should be a distinct thought, observation, or quote from your review. Currently, these are not saved to a database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {comments.map((comment, index) => (
              <div key={index} className="flex items-start gap-2">
                <MessageSquareQuote className="size-5 text-muted-foreground mt-2" />
                <Textarea
                  value={comment}
                  onChange={e => handleCommentChange(index, e.target.value)}
                  placeholder={`Comment ${index + 1}...`}
                  rows={2}
                />
                <Button variant="ghost" size="icon" onClick={() => removeComment(index)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
            <div className="flex justify-between">
              <Button variant="outline" onClick={addComment}>
                <Plus className="mr-2" /> Add Comment
              </Button>
              <Button variant="outline" onClick={() => toast({ title: 'Loading Comments', description: 'This would load saved comments from a database.' })}>
                Load Saved Comments
              </Button>
            </div>
          </CardContent>
          <CardFooter className="p-4 flex justify-between gap-2 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1}>
                <ArrowLeft className="mr-2 size-4" /> Previous Step
              </Button>
              <Button variant="outline" onClick={() => { setCurrentStep(Math.min(5, currentStep + 1)); }} disabled={currentStep === 5}>
                Next Step <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave}>
                <Save className="mr-2 size-4" /> Save Progress
              </Button>
              <Button onClick={() => { handleRunAnalysis(); setCurrentStep(5); }} className="bg-primary">
                <BrainCircuit className="mr-2" /> Run Full Analysis
              </Button>
            </div>
          </CardFooter>
        </Card>

        {analysisResults && (
          <div className="space-y-8 mt-8">
            {/* Step 5: Review Results */}
            <Card className={currentStep === 5 ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="flex items-center gap-2">
                  <Badge className="size-6 flex items-center justify-center p-0 bg-green-600">5</Badge>
                  <CardTitle className="text-green-700 dark:text-green-400">Analysis Results - Review & Finalize</CardTitle>
                </div>
                <CardDescription>Review the AI vs Human comparison below. Make any final adjustments before approving.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-6 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="size-8 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-400">Analysis Complete</h4>
                    <p className="text-sm text-green-700 dark:text-green-500">Thematic analysis, sentiment analysis, and AI-Human gap analysis have been processed.</p>
                  </div>
                </div>
                <EvaluationProvider
                  role="analyst"
                  reportType="dd"
                  framework="general"
                  onFrameworkChangeAction={() => { }}
                  setReportTypeAction={() => { }}
                  isLoading={false}
                  handleRunAnalysisAction={() => { }}
                >
                  <AnalystComments />
                  <AnalystAIDeviation />
                </EvaluationProvider>
              </CardContent>
              <CardFooter className="p-4 border-t flex justify-between">
                <Button variant="outline" onClick={() => router.push('/analysis/result')}>
                  <Eye className="mr-2 size-4" /> View Full Report
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => {
                  toast({ title: 'Results Approved', description: 'Your analysis has been approved and saved.' });
                  router.push('/analysis/result');
                }}>
                  <CheckCircle2 className="mr-2 size-4" /> Approve & Continue to Report
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
