
'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ReportType, UserRole } from '@/app/analysis/result/page';
import type { UploadedFile } from '@/components/analysis/document-submission';

type EvaluationContextType = {
    role: UserRole;
    reportType: ReportType;
    isPrivilegedUser: boolean;
    isEditable: boolean;
    framework: 'general' | 'medtech';
    onFrameworkChangeAction: (value: 'general' | 'medtech') => void;
    setReportTypeAction: (value: ReportType) => void;
    isLoading: boolean;
    handleRunAnalysisAction: () => void;
    uploadedFiles?: UploadedFile[];
    setUploadedFilesAction?: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
    importedUrls?: string[];
    setImportedUrlsAction?: React.Dispatch<React.SetStateAction<string[]>>;
    submittedTexts?: string[];
    setSubmittedTextsAction?: React.Dispatch<React.SetStateAction<string[]>>;
};

const EvaluationContext = createContext<EvaluationContextType | null>(null);

export function useEvaluationContext() {
    const context = useContext(EvaluationContext);
    if (!context) {
        throw new Error('useEvaluationContext must be used within an EvaluationProvider');
    }
    return context;
}

type EvaluationProviderProps = {
    children: React.ReactNode;
    role: UserRole;
    reportType: ReportType;
    framework: 'general' | 'medtech';
    onFrameworkChangeAction: (value: 'general' | 'medtech') => void;
    setReportTypeAction: (value: ReportType) => void;
    isLoading: boolean;
    handleRunAnalysisAction: () => void;
    uploadedFiles?: UploadedFile[];
    setUploadedFilesAction?: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
    importedUrls?: string[];
    setImportedUrlsAction?: React.Dispatch<React.SetStateAction<string[]>>;
    submittedTexts?: string[];
    setSubmittedTextsAction?: React.Dispatch<React.SetStateAction<string[]>>;
};

export function EvaluationProvider({
    children,
    role,
    reportType,
    framework,
    onFrameworkChangeAction,
    setReportTypeAction,
    isLoading,
    handleRunAnalysisAction,
    uploadedFiles,
    setUploadedFilesAction,
    importedUrls,
    setImportedUrlsAction,
    submittedTexts,
    setSubmittedTextsAction,
}: EvaluationProviderProps) {
    const isPrivilegedUser = useMemo(() => role === 'admin' || role === 'reviewer', [role]);
    const isEditable = useMemo(() => isPrivilegedUser, [isPrivilegedUser]);

    const value: EvaluationContextType = {
        role,
        reportType,
        isPrivilegedUser,
        isEditable,
        framework,
        onFrameworkChangeAction,
        setReportTypeAction,
        isLoading,
        handleRunAnalysisAction,
        uploadedFiles,
        setUploadedFilesAction,
        importedUrls,
        setImportedUrlsAction,
        submittedTexts,
        setSubmittedTextsAction,
    };

    return (
        <EvaluationContext.Provider value={value}>
            {children}
        </EvaluationContext.Provider>
    );
}
