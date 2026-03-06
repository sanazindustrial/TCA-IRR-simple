'use client';

import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, File, X } from 'lucide-react';

export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    file: File;
}

export interface DocumentSubmissionProps {
    uploadedFiles: UploadedFile[];
    setUploadedFiles: (files: UploadedFile[]) => void;
}

export function DocumentSubmission({
    uploadedFiles,
    setUploadedFiles,
}: DocumentSubmissionProps) {
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    }, []);

    const handleFiles = (files: FileList) => {
        const newFiles: UploadedFile[] = [];
        Array.from(files).forEach((file) => {
            const uploadedFile: UploadedFile = {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                size: file.size,
                type: file.type,
                file,
            };
            newFiles.push(uploadedFile);
        });
        setUploadedFiles([...uploadedFiles, ...newFiles]);
    };

    const removeFile = (id: string) => {
        setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Document Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop your files here, or click to browse
                    </p>
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        onChange={handleChange}
                        className="hidden"
                        id="file-upload"
                        aria-label="Upload files"
                    />
                    <Label htmlFor="file-upload">
                        <Button variant="outline" className="cursor-pointer">
                            Browse Files
                        </Button>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">
                        Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
                    </p>
                </div>

                {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                        <Label>Uploaded Files</Label>
                        {uploadedFiles.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    <File className="h-4 w-4" />
                                    <div>
                                        <p className="text-sm font-medium">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(file.id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}