
'use client';

import type { ReportType, UserRole } from '@/app/analysis/result/page';
import type { UploadedFile } from '@/components/analysis/document-submission';
import { createContext, useContext, useMemo, useState } from 'react';

type EvaluationContextType = {
    role: UserRole;
    reportType: ReportType;
    isPrivilegedUser: boolean;
    isEditable: boolean;
    framework: 'general' | 'medtech';
    onFrameworkChange: (value: 'general' | 'medtech') => void;
    setReportType: (value: ReportType) => void;
    isLoading: boolean;
    handleRunAnalysis: () => void;
    uploadedFiles?: UploadedFile[];
    setUploadedFiles?: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
    importedUrls?: string[];
    setImportedUrls?: React.Dispatch<React.SetStateAction<string[]>>;
    submittedTexts?: string[];
    setSubmittedTexts?: React.Dispatch<React.SetStateAction<string[]>>;
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
    onFrameworkChange: (value: 'general' | 'medtech') => void;
    setReportType: (value: ReportType) => void;
    isLoading: boolean;
    handleRunAnalysis: () => void;
    uploadedFiles?: UploadedFile[];
    setUploadedFiles?: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
    importedUrls?: string[];
    setImportedUrls?: React.Dispatch<React.SetStateAction<string[]>>;
    submittedTexts?: string[];
    setSubmittedTexts?: React.Dispatch<React.SetStateAction<string[]>>;
};

export function EvaluationProvider({ children, role, reportType, ...props }: EvaluationProviderProps) {
    const isPrivilegedUser = useMemo(() => role === 'admin' || role === 'reviewer', [role]);
    const isEditable = useMemo(() => isPrivilegedUser, [isPrivilegedUser]);
    
    const value = {
        role,
        reportType,
        isPrivilegedUser,
        isEditable,
        ...props,
    };

    return (
        <EvaluationContext.Provider value={value}>
            {children}
        </EvaluationContext.Provider>
    );
}
