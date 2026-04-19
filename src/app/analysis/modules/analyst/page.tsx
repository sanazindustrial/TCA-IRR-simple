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
import { ArrowLeft, Plus, Trash2, UploadCloud, FileText, MessageSquareQuote, X, Link as LinkIcon, Type, Globe, BrainCircuit, CheckCircle2, Circle, ArrowRight, Save, Eye, TrendingUp, TrendingDown, Minus, AlertCircle, BarChart3, Tag, ArrowUpDown } from 'lucide-react';
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
type AnalysisData = {
  sentiment: { positive: number; negative: number; neutral: number; total: number };
  gaps: Array<{ category: string; status: 'covered' | 'gap' | 'partial'; detail: string }>;
  keywords: Array<{ word: string; count: number; group: string }>;
  aiVsHuman: Array<{ area: string; aiNote: string; analystNote: string; aligned: boolean }>;
  aiScoresMap: Record<string, number>;
  humanScoresMap: Record<string, number>;
};

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
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
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
    // Restore saved draft
    try {
      const draft = localStorage.getItem('analyst-review-draft');
      if (draft) {
        const d = JSON.parse(draft);
        if (d.ceoQa) setCeoQa(d.ceoQa);
        if (d.analystNotes) setAnalystNotes(d.analystNotes);
        if (d.comments && d.comments.length > 0) setComments(d.comments);
        if (d.uploadedFiles) setUploadedFiles(d.uploadedFiles);
        if (d.importedUrls) setImportedUrls(d.importedUrls);
        if (d.submittedTexts) setSubmittedTexts(d.submittedTexts);
        if (d.currentStep) setCurrentStep(d.currentStep);
      }
    } catch (e) {
      // ignore
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
    try {
      const draftKey = `analyst-review-draft`;
      const draft = {
        savedAt: new Date().toISOString(),
        ceoQa,
        analystNotes,
        comments: comments.filter(c => c.trim()),
        uploadedFiles,
        importedUrls,
        submittedTexts,
        currentStep,
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
      toast({
        title: "Analysis Saved",
        description: "Your qualitative insights and comments have been saved locally."
      });
    } catch (e) {
      toast({ title: "Save Failed", description: "Could not save to local storage.", variant: "destructive" });
    }
  }

  const handleRunAnalysis = () => {
    const POSITIVE_WORDS = ['excellent', 'strong', 'impressive', 'innovative', 'growth', 'good', 'great', 'outstanding', 'solid', 'positive', 'promising', 'proven', 'scalable', 'efficient', 'robust', 'leading', 'advanced', 'strategic', 'successful', 'valuable', 'clear', 'focused', 'experienced'];
    const NEGATIVE_WORDS = ['concern', 'weak', 'limited', 'risk', 'poor', 'fail', 'difficult', 'challenge', 'problem', 'issue', 'unclear', 'unproven', 'slow', 'low', 'bad', 'negative', 'loss', 'below', 'lack', 'missing', 'doubt', 'uncertainty', 'volatile'];
    const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'do', 'does', 'did', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'this', 'that', 'it', 'its', 'as', 'not', 'no', 'so', 'if', 'can', 'will', 'would', 'could', 'should', 'may', 'might', 'also', 'which', 'their', 'they', 'we', 'our', 'i', 'you', 'he', 'she', 'his', 'her', 'about', 'all', 'more', 'very', 'than', 'into', 'there', 'these', 'those', 'what', 'how', 'when', 'where', 'who']);
    const THEME_KEYWORDS: Record<string, string[]> = {
      Financial: ['revenue', 'profit', 'margin', 'cash', 'funding', 'burn', 'valuation', 'cost', 'arr', 'mrr'],
      Market: ['market', 'competitor', 'segment', 'customer', 'tam', 'sam', 'share', 'positioning', 'demand'],
      Team: ['team', 'founder', 'ceo', 'experience', 'talent', 'hire', 'management', 'leadership'],
      Product: ['product', 'tech', 'technology', 'patent', 'mvp', 'roadmap', 'feature', 'innovation', 'scalab'],
      Risk: ['risk', 'regulatory', 'compliance', 'legal', 'churn', 'dependency', 'concentration'],
    };
    const filledComments = comments.filter(c => c.trim());
    // 1. Sentiment
    let positive = 0, negative = 0, neutral = 0;
    for (const comment of filledComments) {
      const lower = comment.toLowerCase();
      const posScore = POSITIVE_WORDS.filter(w => lower.includes(w)).length;
      const negScore = NEGATIVE_WORDS.filter(w => lower.includes(w)).length;
      if (posScore > negScore) positive++;
      else if (negScore > posScore) negative++;
      else neutral++;
    }
    const totalComments = filledComments.length || 1;
    // 2. Gap Analysis
    const gapRows: AnalysisData['gaps'] = [];
    for (const [category, keywords] of Object.entries(THEME_KEYWORDS)) {
      const inNotes = keywords.some(k => analystNotes.toLowerCase().includes(k));
      const inQa = keywords.some(k => ceoQa.toLowerCase().includes(k));
      let status: 'covered' | 'gap' | 'partial';
      let detail: string;
      if (inNotes && inQa) { status = 'covered'; detail = 'Both analyst and CEO addressed this area.'; }
      else if (inNotes && !inQa) { status = 'gap'; detail = 'Analyst noted but CEO did not address in Q&A.'; }
      else if (!inNotes && inQa) { status = 'partial'; detail = 'CEO mentioned but analyst notes lack coverage.'; }
      else { status = 'gap'; detail = 'Neither analyst notes nor CEO Q&A addressed this.'; }
      gapRows.push({ category, status, detail });
    }
    // 3. Keyword Frequency
    const allText = [...filledComments, analystNotes, ceoQa, ...submittedTexts].join(' ');
    const words = allText.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/);
    const freq: Record<string, number> = {};
    for (const w of words) {
      if (w.length > 3 && !STOP_WORDS.has(w)) freq[w] = (freq[w] || 0) + 1;
    }
    const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20);
    const KEYWORD_GROUPS: Record<string, string[]> = {
      Financial: ['revenue', 'profit', 'cash', 'funding', 'cost', 'margin', 'valuation', 'burn'],
      Market: ['market', 'customer', 'competitor', 'segment', 'demand', 'growth'],
      Team: ['team', 'founder', 'talent', 'hire', 'management', 'experience'],
      Product: ['product', 'technology', 'innovation', 'feature', 'roadmap'],
      Risk: ['risk', 'regulatory', 'compliance', 'churn', 'concern', 'challenge'],
    };
    const keywordData: AnalysisData['keywords'] = topWords.map(([word, count]) => {
      let group = 'General';
      for (const [g, ws] of Object.entries(KEYWORD_GROUPS)) {
        if (ws.some(w => word.includes(w))) { group = g; break; }
      }
      return { word, count, group };
    });
    // 4. AI vs Human
    const aiScoresMap: Record<string, number> = {};
    const humanScoresMap: Record<string, number> = {};
    const aiVsHuman: AnalysisData['aiVsHuman'] = Object.keys(THEME_KEYWORDS).map(area => {
      const keywords = THEME_KEYWORDS[area];
      const analystCoverage = keywords.filter(k => analystNotes.toLowerCase().includes(k));
      const commentsCoverage = keywords.filter(k => filledComments.some(c => c.toLowerCase().includes(k)));
      aiScoresMap[area] = parseFloat(((commentsCoverage.length / keywords.length) * 10).toFixed(1));
      humanScoresMap[area] = parseFloat(((analystCoverage.length / keywords.length) * 10).toFixed(1));
      return {
        area,
        aiNote: commentsCoverage.length > 0 ? `${commentsCoverage.length} indicator(s) found in NLP comments` : 'No indicators found in comments',
        analystNote: analystCoverage.length > 0 ? `${analystCoverage.length} indicator(s) in analyst notes` : 'Not mentioned in analyst notes',
        aligned: (commentsCoverage.length > 0) === (analystCoverage.length > 0),
      };
    });
    setAnalysisData({ sentiment: { positive, negative, neutral, total: totalComments }, gaps: gapRows, keywords: keywordData, aiVsHuman, aiScoresMap, humanScoresMap });
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
          <CardFooter className="p-4 border-t flex justify-end">
            <Button onClick={() => setCurrentStep(2)}>
              Next Step <ArrowRight className="ml-2 size-4" />
            </Button>
          </CardFooter>
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
          <CardFooter className="p-4 border-t flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="mr-2 size-4" /> Previous Step
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave}>
                <Save className="mr-2 size-4" /> Save Progress
              </Button>
              <Button onClick={() => setCurrentStep(3)}>
                Next Step <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </CardFooter>
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

        <Card className={currentStep === 4 ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant={currentStep > 4 ? 'default' : 'outline'} className="size-6 flex items-center justify-center p-0">4</Badge>
              <CardTitle>Run Analysis</CardTitle>
            </div>
            <CardDescription>Execute thematic, sentiment, deep content, and AI vs Human gap analysis on your inputs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
              <BrainCircuit className="size-16 text-primary opacity-80" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Ready to Run Analysis</h3>
                <p className="text-muted-foreground max-w-md">Click the button below to process your documents, qualitative insights, and NLP comments through thematic, sentiment, and AI-Human comparison analysis.</p>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center w-full max-w-md">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{uploadedFiles.length + importedUrls.length + submittedTexts.length}</p>
                  <p className="text-sm text-muted-foreground">Sources</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{comments.filter(c => c.trim()).length}</p>
                  <p className="text-sm text-muted-foreground">Comments</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{(analystNotes.trim() || ceoQa.trim()) ? '✓' : '—'}</p>
                  <p className="text-sm text-muted-foreground">Notes</p>
                </div>
              </div>
              <Button size="lg" className="bg-primary gap-2" onClick={() => { handleRunAnalysis(); setCurrentStep(5); }}>
                <BrainCircuit className="mr-2 size-5" /> Run Full Analysis
              </Button>
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(3)}>
              <ArrowLeft className="mr-2 size-4" /> Previous Step
            </Button>
            <Button variant="outline" onClick={handleSave}>
              <Save className="mr-2 size-4" /> Save Progress
            </Button>
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
                  <AnalystAIDeviation
                    aiScores={analysisData?.aiScoresMap}
                    humanScores={analysisData?.humanScoresMap}
                  />
                </EvaluationProvider>
              </CardContent>
              <CardFooter className="p-4 border-t flex justify-between">
                <Button variant="outline" onClick={() => router.push('/analysis/result')}>
                  <Eye className="mr-2 size-4" /> View Full Report
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => {
                  try {
                    const storedUser = localStorage.getItem('loggedInUser');
                    const user = storedUser ? JSON.parse(storedUser) : { name: 'Analyst', email: 'analyst@tca.com', role: 'analyst' };
                    const reportId = `RPT-DD-${Date.now()}`;
                    const now = new Date().toISOString();
                    const ddReport = {
                      id: reportId,
                      userId: user.email,
                      companyName: `DD Analysis — ${new Date().toLocaleDateString()}`,
                      reportType: 'dd',
                      framework: 'general',
                      data: {
                        ceoQa,
                        analystNotes,
                        comments: comments.filter(c => c.trim()),
                        uploadedFiles,
                        importedUrls,
                        submittedTexts,
                        approvedBy: user.email,
                        approvedAt: now,
                      },
                      createdAt: now,
                      updatedAt: now,
                      metadata: {
                        moduleCount: 5,
                        compositeScore: 7.5,
                        status: 'completed',
                        tags: ['due-diligence', 'analyst-approved'],
                      },
                    };
                    const existing = JSON.parse(localStorage.getItem('tca_reports') || '[]');
                    existing.push(ddReport);
                    localStorage.setItem('tca_reports', JSON.stringify(existing));
                    // Clear the draft
                    localStorage.removeItem('analyst-review-draft');
                  } catch (e) {
                    console.warn('Failed to save DD report:', e);
                  }
                  toast({ title: 'Results Approved', description: 'Due Diligence report saved to reports page.' });
                  router.push('/dashboard/reports');
                }}>
                  <CheckCircle2 className="mr-2 size-4" /> Approve & Save DD Report
                </Button>
              </CardFooter>
            </Card>

            {/* Sentiment Analysis */}
            {analysisData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-primary" />
                    <CardTitle>Sentiment Analysis</CardTitle>
                  </div>
                  <CardDescription>Positive / negative / neutral breakdown across {analysisData.sentiment.total} analyst comments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <TrendingUp className="size-6 text-green-600 mb-2" />
                      <span className="text-2xl font-bold text-green-700 dark:text-green-400">{Math.round((analysisData.sentiment.positive / analysisData.sentiment.total) * 100)}%</span>
                      <span className="text-sm text-green-600">Positive ({analysisData.sentiment.positive})</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <TrendingDown className="size-6 text-red-600 mb-2" />
                      <span className="text-2xl font-bold text-red-700 dark:text-red-400">{Math.round((analysisData.sentiment.negative / analysisData.sentiment.total) * 100)}%</span>
                      <span className="text-sm text-red-600">Negative ({analysisData.sentiment.negative})</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
                      <Minus className="size-6 text-gray-500 mb-2" />
                      <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">{Math.round((analysisData.sentiment.neutral / analysisData.sentiment.total) * 100)}%</span>
                      <span className="text-sm text-gray-500">Neutral ({analysisData.sentiment.neutral})</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-20 text-muted-foreground">Positive</span>
                      <Progress value={Math.round((analysisData.sentiment.positive / analysisData.sentiment.total) * 100)} className="flex-1" />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-20 text-muted-foreground">Negative</span>
                      <Progress value={Math.round((analysisData.sentiment.negative / analysisData.sentiment.total) * 100)} className="flex-1" />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-20 text-muted-foreground">Neutral</span>
                      <Progress value={Math.round((analysisData.sentiment.neutral / analysisData.sentiment.total) * 100)} className="flex-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gap Analysis */}
            {analysisData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-5 text-orange-500" />
                    <CardTitle>Gap Analysis</CardTitle>
                  </div>
                  <CardDescription>Coverage comparison between analyst notes and CEO Q&A responses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4">Category</th>
                          <th className="text-left py-2 pr-4">Status</th>
                          <th className="text-left py-2">Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisData.gaps.map(row => (
                          <tr key={row.category} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{row.category}</td>
                            <td className="py-2 pr-4">
                              {row.status === 'covered' && <Badge variant="success" className="gap-1"><CheckCircle2 className="size-3" />Covered</Badge>}
                              {row.status === 'gap' && <Badge variant="destructive" className="gap-1"><AlertCircle className="size-3" />Gap</Badge>}
                              {row.status === 'partial' && <Badge variant="secondary" className="gap-1"><Minus className="size-3" />Partial</Badge>}
                            </td>
                            <td className="py-2 text-muted-foreground">{row.detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI vs Human Analysis */}
            {analysisData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="size-5 text-blue-500" />
                    <CardTitle>AI vs Human Analysis</CardTitle>
                  </div>
                  <CardDescription>Side-by-side comparison of NLP comment signals (AI proxy) versus analyst notes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4">Area</th>
                          <th className="text-left py-2 pr-4">NLP / AI Signal</th>
                          <th className="text-left py-2 pr-4">Analyst Input</th>
                          <th className="text-left py-2">Alignment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisData.aiVsHuman.map(row => (
                          <tr key={row.area} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{row.area}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{row.aiNote}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{row.analystNote}</td>
                            <td className="py-2">
                              {row.aligned
                                ? <Badge variant="success" className="gap-1"><CheckCircle2 className="size-3" />Aligned</Badge>
                                : <Badge variant="destructive" className="gap-1"><AlertCircle className="size-3" />Divergent</Badge>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deep Content Analysis */}
            {analysisData && analysisData.keywords.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Tag className="size-5 text-purple-500" />
                    <CardTitle>Deep Content Analysis</CardTitle>
                  </div>
                  <CardDescription>Top keyword frequency across all analyst content (comments, notes, Q&A, uploaded texts)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {analysisData.keywords.map(kw => {
                      const groupColors: Record<string, string> = {
                        Financial: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
                        Market: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
                        Team: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
                        Product: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
                        Risk: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
                        General: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                      };
                      return (
                        <span key={kw.word} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${groupColors[kw.group] || groupColors.General}`} title={`${kw.group}: ${kw.count} occurrences`}>
                          {kw.word}
                          <span className="opacity-60 font-bold">{kw.count}</span>
                        </span>
                      );
                    })}
                  </div>
                  <div className="space-y-1.5">
                    {analysisData.keywords.slice(0, 10).map(kw => (
                      <div key={kw.word} className="flex items-center gap-2 text-sm">
                        <span className="w-24 truncate text-muted-foreground">{kw.word}</span>
                        <Progress value={Math.round((kw.count / (analysisData.keywords[0]?.count || 1)) * 100)} className="flex-1" />
                        <span className="text-xs text-muted-foreground w-6 text-right">{kw.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
