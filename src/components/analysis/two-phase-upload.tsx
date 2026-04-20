'use client';
import { useState, useRef, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    FileUp,
    FileText,
    Check,
    ChevronRight,
    UploadCloud,
    Link,
    Type,
    X,
    ArrowLeft,
    Loader2,
    Building,
    FileSearch,
} from 'lucide-react';

export type UploadedFile = {
    name: string;
    size: number;
};

type TwoPhaseUploadProps = {
    uploadedFiles: UploadedFile[];
    setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
    importedUrls: string[];
    setImportedUrls: React.Dispatch<React.SetStateAction<string[]>>;
    submittedTexts: string[];
    setSubmittedTexts: React.Dispatch<React.SetStateAction<string[]>>;
    onPhaseComplete?: (phase: number) => void;
    companyName?: string;
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1] || result;
            resolve(base64);
        };
        reader.onerror = reject;
    });
};

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export function TwoPhaseUpload({
    uploadedFiles,
    setUploadedFiles,
    importedUrls,
    setImportedUrls,
    submittedTexts,
    setSubmittedTexts,
    onPhaseComplete,
    companyName,
}: TwoPhaseUploadProps) {
    const [currentPhase, setCurrentPhase] = useState<1 | 2>(1);
    const [pitchDeckUploaded, setPitchDeckUploaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [textInput, setTextInput] = useState('');
    const pitchDeckInputRef = useRef<HTMLInputElement>(null);
    const additionalFilesInputRef = useRef<HTMLInputElement>(null);

    // Check if pitch deck is already uploaded
    useEffect(() => {
        const hasPitchDeck = uploadedFiles.some(f =>
            f.name.toLowerCase().includes('pitch') ||
            f.name.toLowerCase().includes('deck') ||
            f.name.toLowerCase().endsWith('.pdf') ||
            f.name.toLowerCase().endsWith('.pptx')
        );
        if (hasPitchDeck) {
            setPitchDeckUploaded(true);
        }
    }, [uploadedFiles]);

    // Handle pitch deck upload (Phase 1) - Only 1 file: PDF, DOCX, or PPTX
    const handlePitchDeckUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            
            // Validate file type - only pdf, docx, pptx allowed
            const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            const validTypes = ['.pdf', '.docx', '.pptx'];
            if (!validTypes.includes(ext)) {
                alert('Only PDF, DOCX, or PPTX files are allowed for the pitch deck.');
                return;
            }
            
            setIsProcessing(true);

            // Replace any existing pitch deck file
            setUploadedFiles([]);
            
            // Add file to uploaded files
            const newFile = { name: file.name, size: file.size };
            setUploadedFiles([newFile]);

            // Process the pitch deck
            let textContent = '';
            try {
                if (file.type === 'application/pdf' || file.name.endsWith('.pdf') ||
                    file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc') ||
                    file.type.includes('presentation') || file.name.endsWith('.pptx') || file.name.endsWith('.ppt')) {
                    const base64Content = await fileToBase64(file);
                    const response = await fetch('https://tcairrapiccontainer.azurewebsites.net/api/v1/analysis/extract-text-from-file', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            content: base64Content,
                            filename: file.name,
                        }),
                    });

                    if (response.ok) {
                        const result = await response.json();
                        textContent = result.text_content || '';
                        console.log(`[Phase 1] Extracted ${textContent.length} characters from pitch deck: ${file.name}`);
                    }
                } else {
                    textContent = await file.text();
                }
            } catch (e) {
                console.warn('Pitch deck extraction failed:', e);
                textContent = `[Extraction pending for: ${file.name}]`;
            }

            // Store as pitch deck specifically
            const pitchDeckData = {
                name: file.name,
                size: file.size,
                type: file.type,
                isPitchDeck: true,
                extracted_data: {
                    text_content: textContent,
                    financial_data: { revenue: 0, burn_rate: 0, runway_months: 0 },
                    key_metrics: { team_size: 0, customers: 0, mrr: 0 }
                }
            };

            // Start fresh: pitch deck is phase 1, so clear any files from previous sessions
            localStorage.setItem('processedFiles', JSON.stringify([pitchDeckData]));

            setPitchDeckUploaded(true);
            setIsProcessing(false);
            onPhaseComplete?.(1);
        }
    };

    // Handle additional file uploads (Phase 2)
    const handleAdditionalFilesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            setIsProcessing(true);

            const newFiles = files.map(file => ({ name: file.name, size: file.size }));
            setUploadedFiles(prev => [...prev, ...newFiles]);

            const processedFiles = await Promise.all(files.map(async (file) => {
                let textContent = '';
                try {
                    if (file.type === 'application/pdf' || file.name.endsWith('.pdf') ||
                        file.type.includes('word') || file.name.endsWith('.docx')) {
                        const base64Content = await fileToBase64(file);
                        const response = await fetch('https://tcairrapiccontainer.azurewebsites.net/api/v1/analysis/extract-text-from-file', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ content: base64Content, filename: file.name }),
                        });
                        if (response.ok) {
                            const result = await response.json();
                            textContent = result.text_content || '';
                        }
                    } else if (file.type === 'text/plain' || file.type === 'application/json') {
                        textContent = await file.text();
                    }
                } catch (e) {
                    console.warn('File extraction failed:', file.name, e);
                }

                return {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    isPitchDeck: false,
                    extracted_data: {
                        text_content: textContent,
                        financial_data: { revenue: 0, burn_rate: 0, runway_months: 0 },
                        key_metrics: { team_size: 0, customers: 0, mrr: 0 }
                    }
                };
            }));

            const existingFiles = JSON.parse(localStorage.getItem('processedFiles') || '[]');
            localStorage.setItem('processedFiles', JSON.stringify([...existingFiles, ...processedFiles]));
            setIsProcessing(false);
        }
    };

    // Handle URL import
    const handleImportUrls = () => {
        if (urlInput.trim()) {
            const urls = urlInput.split('\n').filter(url => url.trim() !== '');
            setImportedUrls(prev => [...prev, ...urls]);
            setUrlInput('');

            const localProcessed = urls.map(url => ({
                url,
                title: `URL Import: ${url}`,
                extracted_data: {
                    text_content: `[URL content from ${url}]`,
                    metadata: { domain: url.split('/')[2] || url }
                }
            }));

            const existingUrls = JSON.parse(localStorage.getItem('processedUrls') || '[]');
            localStorage.setItem('processedUrls', JSON.stringify([...existingUrls, ...localProcessed]));
        }
    };

    // Handle text submission
    const handleSubmitText = () => {
        if (textInput.trim()) {
            setSubmittedTexts(prev => [...prev, textInput]);

            const processedTexts = JSON.parse(localStorage.getItem('processedTexts') || '[]');
            processedTexts.push({
                content: textInput,
                word_count: textInput.split(' ').length,
                processed_at: new Date().toISOString(),
            });
            localStorage.setItem('processedTexts', JSON.stringify(processedTexts));
            setTextInput('');
        }
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeUrl = (index: number) => {
        setImportedUrls(prev => prev.filter((_, i) => i !== index));
    };

    const removeText = (index: number) => {
        setSubmittedTexts(prev => prev.filter((_, i) => i !== index));
    };

    const proceedToPhase2 = () => {
        setCurrentPhase(2);
        onPhaseComplete?.(1);
    };

    const goBackToPhase1 = () => {
        setCurrentPhase(1);
    };

    return (
        <div className="space-y-6">
            {/* Phase Progress Indicator */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 ${currentPhase === 1 ? 'text-primary font-semibold' : pitchDeckUploaded ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentPhase === 1 ? 'bg-primary text-primary-foreground' : pitchDeckUploaded ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                            {pitchDeckUploaded ? <Check className="h-4 w-4" /> : '1'}
                        </div>
                        <span>Pitch Deck</span>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground" />

                    <div className={`flex items-center gap-2 ${currentPhase === 2 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentPhase === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            2
                        </div>
                        <span>Additional Content</span>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground">
                    {uploadedFiles.length} files • {importedUrls.length} URLs • {submittedTexts.length} texts
                </div>
            </div>

            {/* Phase 1: Pitch Deck Upload */}
            {currentPhase === 1 && (
                <Card className="shadow-lg border-2 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="text-primary h-6 w-6" />
                            Phase 1: Upload Pitch Deck
                        </CardTitle>
                        <CardDescription>
                            Upload your company's pitch deck to auto-populate company information and analysis data.
                            This is the primary document for extraction.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!pitchDeckUploaded ? (
                            <>
                                <div
                                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-12 text-center transition-all hover:border-primary hover:bg-primary/10"
                                    onClick={() => pitchDeckInputRef.current?.click()}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                            <h3 className="mt-4 text-lg font-semibold">Processing Pitch Deck...</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Extracting company information and key data
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <FileUp className="h-12 w-12 text-primary" />
                                            <h3 className="mt-4 text-lg font-semibold">
                                                Upload Pitch Deck
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                PDF, PowerPoint (PPTX), or Word document (DOCX) - Max 30MB
                                            </p>
                                            <p className="mt-2 text-xs text-primary">
                                                Company name, description, and key metrics will be auto-extracted
                                            </p>
                                        </>
                                    )}
                                    <Input
                                        type="file"
                                        ref={pitchDeckInputRef}
                                        className="hidden"
                                        accept=".pdf,.pptx,.docx"
                                        onChange={handlePitchDeckUpload}
                                    />
                                </div>

                                <p className="text-center text-sm text-muted-foreground">
                                    Or <button className="text-primary underline" onClick={proceedToPhase2}>skip to additional content</button> if you don't have a pitch deck
                                </p>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <Check className="h-6 w-6 text-green-600" />
                                    <div>
                                        <p className="font-medium text-green-700 dark:text-green-400">Pitch Deck Uploaded</p>
                                        <p className="text-sm text-green-600 dark:text-green-500">
                                            {uploadedFiles.find(f => f.name.toLowerCase().includes('pitch') || f.name.toLowerCase().endsWith('.pdf'))?.name || uploadedFiles[0]?.name}
                                        </p>
                                    </div>
                                </div>

                                {companyName && (
                                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <Building className="h-6 w-6 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-blue-700 dark:text-blue-400">Company Detected</p>
                                            <p className="text-sm text-blue-600 dark:text-blue-500">{companyName}</p>
                                        </div>
                                    </div>
                                )}

                                <Button onClick={proceedToPhase2} className="w-full gap-2">
                                    Continue to Additional Content <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Phase 2: Additional Content */}
            {currentPhase === 2 && (
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileSearch className="text-primary h-6 w-6" />
                                    Phase 2: Additional Content
                                </CardTitle>
                                <CardDescription>
                                    Add more files, URLs, or text to enrich the analysis with supplementary data.
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={goBackToPhase1} className="gap-1">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="files">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="files">
                                    <UploadCloud className="mr-2 h-4 w-4" /> Files
                                </TabsTrigger>
                                <TabsTrigger value="urls">
                                    <Link className="mr-2 h-4 w-4" /> URLs
                                </TabsTrigger>
                                <TabsTrigger value="text">
                                    <Type className="mr-2 h-4 w-4" /> Text
                                </TabsTrigger>
                            </TabsList>

                            {/* Files Tab */}
                            <TabsContent value="files" className="space-y-4">
                                <div
                                    className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
                                    onClick={() => additionalFilesInputRef.current?.click()}
                                >
                                    {isProcessing ? (
                                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                    ) : (
                                        <UploadCloud className="h-8 w-8 text-muted-foreground" />
                                    )}
                                    <h3 className="mt-2 text-sm font-medium">
                                        {isProcessing ? 'Processing files...' : 'Upload additional files'}
                                    </h3>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Financial reports, market research, cap tables, etc.
                                    </p>
                                    <Input
                                        type="file"
                                        ref={additionalFilesInputRef}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.json"
                                        onChange={handleAdditionalFilesUpload}
                                        multiple
                                    />
                                </div>

                                {uploadedFiles.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</p>
                                        {uploadedFiles.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">{file.name}</span>
                                                    <Badge variant="outline" className="text-xs">{formatBytes(file.size)}</Badge>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* URLs Tab */}
                            <TabsContent value="urls" className="space-y-4">
                                <div className="space-y-2">
                                    <Textarea
                                        placeholder="https://example.com/company-page&#10;https://linkedin.com/company/startup&#10;https://crunchbase.com/organization/startup"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        rows={4}
                                    />
                                    <Button onClick={handleImportUrls} disabled={!urlInput.trim()} className="w-full">
                                        <Link className="mr-2 h-4 w-4" /> Import URLs
                                    </Button>
                                </div>

                                {importedUrls.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Imported URLs ({importedUrls.length})</p>
                                        {importedUrls.map((url, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate max-w-[80%]">
                                                    {url}
                                                </a>
                                                <Button variant="ghost" size="sm" onClick={() => removeUrl(index)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Text Tab */}
                            <TabsContent value="text" className="space-y-4">
                                <div className="space-y-2">
                                    <Textarea
                                        placeholder="Paste company description, news articles, or any relevant text content here..."
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        rows={6}
                                    />
                                    <Button onClick={handleSubmitText} disabled={!textInput.trim()} className="w-full">
                                        <Type className="mr-2 h-4 w-4" /> Add Text Content
                                    </Button>
                                </div>

                                {submittedTexts.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Submitted Texts ({submittedTexts.length})</p>
                                        {submittedTexts.map((text, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                                <span className="text-sm truncate max-w-[80%]">{text.slice(0, 100)}...</span>
                                                <Button variant="ghost" size="sm" onClick={() => removeText(index)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>

                        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-center text-muted-foreground">
                                All content will be analyzed together with the pitch deck for comprehensive company evaluation.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
