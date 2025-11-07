'use client';
import { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UploadCloud,
  FileUp,
  Link,
  Type,
  FileText,
  X,
  Globe,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';

export type UploadedFile = {
  name: string;
  size: number;
};

type DocumentSubmissionProps = {
  uploadedFiles: UploadedFile[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  importedUrls: string[];
  setImportedUrls: React.Dispatch<React.SetStateAction<string[]>>;
  submittedTexts: string[];
  setSubmittedTexts: React.Dispatch<React.SetStateAction<string[]>>;
}

export function DocumentSubmission({
  uploadedFiles,
  setUploadedFiles,
  importedUrls,
  setImportedUrls,
  submittedTexts,
  setSubmittedTexts
}: DocumentSubmissionProps) {
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);

      // Create file objects for immediate UI feedback
      const newFiles = files.map((file) => ({
        name: file.name,
        size: file.size,
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Process files with backend (if available)
      try {
        const fileData = files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        }));

        const response = await fetch('http://localhost:8000/api/files/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: fileData })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Files processed:', result);
          // Store processed file data in localStorage for analysis
          localStorage.setItem('processedFiles', JSON.stringify(result.processed_files));
        }
      } catch (error) {
        console.warn('Backend file processing unavailable, using local processing:', error);
        // Fallback to local processing
        const localProcessed = files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          extracted_data: {
            text_content: `Local processing: ${file.name} content...`,
            financial_data: { revenue: 0, burn_rate: 0, runway_months: 0 },
            key_metrics: { team_size: 0, customers: 0, mrr: 0 }
          }
        }));
        localStorage.setItem('processedFiles', JSON.stringify(localProcessed));
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImportUrls = async () => {
    if (urlInput.trim()) {
      const urls = urlInput.split('\n').filter((url) => url.trim() !== '');
      setImportedUrls((prev) => [...prev, ...urls]);
      setUrlInput('');

      // Process URLs with backend (if available)
      try {
        const response = await fetch('http://localhost:8000/api/urls/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('URLs processed:', result);
          // Store processed URL data in localStorage for analysis
          localStorage.setItem('processedUrls', JSON.stringify(result.processed_urls));
        }
      } catch (error) {
        console.warn('Backend URL processing unavailable, using local processing:', error);
        // Fallback to local processing
        const localProcessed = urls.map(url => ({
          url,
          title: `Local processing: ${url}`,
          extracted_data: {
            text_content: `Local processing: content from ${url}...`,
            metadata: { domain: url.split('/')[2] || url, content_type: 'text/html', word_count: 500 }
          }
        }));
        localStorage.setItem('processedUrls', JSON.stringify(localProcessed));
      }
    }
  };

  const removeUrl = (index: number) => {
    setImportedUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitText = () => {
    if (textInput.trim()) {
      setSubmittedTexts((prev) => [...prev, textInput]);

      // Store processed text data for analysis
      const processedTexts = JSON.parse(localStorage.getItem('processedTexts') || '[]');
      processedTexts.push({
        content: textInput,
        word_count: textInput.split(' ').length,
        processed_at: new Date().toISOString(),
        extracted_data: {
          key_points: textInput.split('.').slice(0, 3),
          sentiment: 'positive',
          topics: ['business', 'strategy', 'growth']
        }
      });
      localStorage.setItem('processedTexts', JSON.stringify(processedTexts));

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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="text-primary" />
          Document Submission
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="file">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file">
              <UploadCloud className="mr-2" /> File Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link className="mr-2" /> URL Import
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
                Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, CSV, JSON, RTF, ODT (Max 30MB)
              </p>
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.json,.rtf,.odt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,application/json,application/rtf,application/vnd.oasis.opendocument.text"
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
                          <span>{formatBytes(file.size)}</span>
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
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUrlInput(e.target.value)}
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
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextInput(e.target.value)}
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
  );
}
