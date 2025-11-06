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
import { ArrowLeft, Plus, Trash2, UploadCloud, FileText, MessageSquareQuote, X, Link as LinkIcon, Type, Globe, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EvaluationProvider } from '@/components/evaluation/evaluation-provider';
import { ReviewerComments } from '@/components/evaluation/reviewer-comments';
import { ReviewerAIDeviation } from '@/components/evaluation/reviewer-ai-deviation';

type UploadedFile = {
  name: string;
  size: number;
};

const initialComments = Array(5).fill('');

export default function ReviewerAnalysisPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [importedUrls, setImportedUrls] = useState<string[]>([]);
  const [submittedTexts, setSubmittedTexts] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');

  const [ceoQa, setCeoQa] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [comments, setComments] = useState<string[]>(initialComments);
  const [analysisResults, setAnalysisResults] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        const role = user.role?.toLowerCase();
        if (role !== 'admin' && role !== 'reviewer') {
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
          Reviewer Analysis &amp; Manual Input
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
          Upload interview notes, add qualitative comments, and provide manual analysis to enrich the AI evaluation.
        </p>
      </header>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Document Submission</CardTitle>
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

        <Card>
            <CardHeader>
                <CardTitle>Qualitative Insights</CardTitle>
                <CardDescription>Add notes from CEO interviews, Q&A sessions, and other qualitative assessments. This data is stored temporarily and should be saved.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="ceo-qa">CEO Q&A / Interview Notes</Label>
                    <Textarea id="ceo-qa" value={ceoQa} onChange={e => setCeoQa(e.target.value)} rows={8} placeholder="e.g., Q: What is your biggest challenge? A: ..."/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="reviewer-notes">General Reviewer Notes & Deep Analysis</Label>
                    <Textarea id="reviewer-notes" value={reviewerNotes} onChange={e => setReviewerNotes(e.target.value)} rows={8} placeholder="Summarize key findings, compare AI vs. human analysis, and provide overall impressions..."/>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>NLP Analysis Input</CardTitle>
                <CardDescription>Add 30-40 specific comments for thematic, sentiment, and AI-Human comparison analysis. Each comment should be a distinct thought, observation, or quote from your review. Currently, these are not saved to a database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {comments.map((comment, index) => (
                    <div key={index} className="flex items-start gap-2">
                         <MessageSquareQuote className="size-5 text-muted-foreground mt-2"/>
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
                    <Button variant="outline" onClick={() => toast({title: 'Loading Comments', description: 'This would load saved comments from a database.'})}>
                        Load Saved Comments
                    </Button>
                </div>
            </CardContent>
             <CardFooter className="p-4 flex justify-end gap-2 border-t">
                <Button variant="outline" onClick={handleSave}>Save Reviewer Analysis</Button>
                <Button onClick={handleRunAnalysis}>
                    <BrainCircuit className="mr-2" /> Run Full Reviewer Analysis
                </Button>
            </CardFooter>
        </Card>

        {analysisResults && (
            <div className="space-y-8 mt-8">
                 <EvaluationProvider
                    role="reviewer"
                    reportType="dd"
                    framework="general"
                    onFrameworkChange={() => {}}
                    setReportType={() => {}}
                    isLoading={false}
                    handleRunAnalysis={() => {}}
                >
                    <ReviewerComments />
                    <ReviewerAIDeviation />
                 </EvaluationProvider>
            </div>
        )}
      </div>
    </div>
  );
}
