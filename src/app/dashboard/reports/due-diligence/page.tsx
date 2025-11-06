
'use client';
import { useState, useRef } from 'react';
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
  UploadCloud,
  BrainCircuit,
  ArrowLeft,
  Link as LinkIcon,
  Type,
  X,
  Globe,
  FileUp,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { UploadedFile } from '@/components/analysis/document-submission';
import { runAnalysis } from '@/app/analysis/actions';

const TriageDataCard = () => (
    <Card>
        <CardHeader>
            <CardTitle>Triage Report Data</CardTitle>
            <CardDescription>Key data points from the initial Triage report for QuantumLeap AI.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-semibold text-muted-foreground">Triage Score</p>
                <p className="text-lg font-bold text-primary">7.8/10</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-semibold text-muted-foreground">Recommendation</p>
                <p className="text-lg font-bold text-success">Recommend</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-semibold text-muted-foreground">Top Risk</p>
                <p className="text-lg font-bold text-warning">Market Risk</p>
            </div>
             <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-semibold text-muted-foreground">Top Strength</p>
                <p className="text-lg font-bold text-success">Technology & IP</p>
            </div>
        </CardContent>
    </Card>
);

export default function DueDiligencePage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [importedUrls, setImportedUrls] = useState<string[]>([]);
  const [submittedTexts, setSubmittedTexts] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

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

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    toast({
      title: 'Generating Due Diligence Report...',
      description: 'This may take a moment as we conduct a deep-dive analysis.',
    });
     try {
      const comprehensiveData = await runAnalysis('medtech'); // Assuming DD uses medtech for this example
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

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Link
          href="/dashboard/reports"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to Reports
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
          Due Diligence Report Setup
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
          Upload additional documents for a deep-dive analysis of <span className="font-bold text-foreground">QuantumLeap AI</span>.
        </p>
      </header>

      <div className="space-y-8">
        <TriageDataCard />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileUp/>
                Additional Document Submission
            </CardTitle>
            <CardDescription>Upload legal documents, detailed financials, customer contracts, or any other relevant files for the deep-dive analysis.</CardDescription>
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
                    Drop DD files here or click to browse
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
                    placeholder="https://example.com/data-room/legal.zip\nhttps://example.com/customer-contracts.pdf"
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
                    Paste any relevant text content below.
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

        <div className="flex justify-end mt-8">
            <Button size="lg" onClick={handleGenerateReport} disabled={isLoading}>
                <BrainCircuit className="mr-2"/>
                {isLoading ? 'Generating Report...' : 'Generate Due Diligence Report'}
            </Button>
        </div>
      </div>
    </div>
  );
}
