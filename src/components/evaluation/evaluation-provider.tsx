
'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ReportType, UserRole } from '@/app/analysis/result/page';
import type { UploadedFile } from '@/components/analysis/document-submission';

// Extended company information fields matching Startup Steroid spec 4.1.2
export type CompanyInformationData = {
    companyName: string;
    website: string;
    industryVertical: string;
    developmentStage: string;
    businessModel: string;
    country: string;
    state: string;
    city: string;
    oneLineDescription: string;
    companyDescription: string;
    productDescription: string;
    pitchDeckPath: string;
    legalName: string;
    numberOfEmployees: number | null;
};

// Contact information fields matching Startup Steroid spec 4.1.1
export type ContactInformationData = {
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    linkedInUrl: string;
};

// Financial information fields matching Startup Steroid spec 4.1.3
export type FinancialInformationData = {
    fundingType: string;
    annualRevenue: number | null;
    preMoneyValuation: number | null;
    postMoneyValuation: number | null;
    offeringType: string;
    targetRaise: number | null;
    currentlyRaised: number | null;
};

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
    // Company information
    companyName?: string;
    setCompanyNameAction?: React.Dispatch<React.SetStateAction<string>>;
    companyDescription?: string;
    setCompanyDescriptionAction?: React.Dispatch<React.SetStateAction<string>>;
    // Extended company information
    companyInfo?: CompanyInformationData;
    setCompanyInfoAction?: React.Dispatch<React.SetStateAction<CompanyInformationData>>;
    // Contact information
    contactInfo?: ContactInformationData;
    setContactInfoAction?: React.Dispatch<React.SetStateAction<ContactInformationData>>;
    // Financial information
    financialInfo?: FinancialInformationData;
    setFinancialInfoAction?: React.Dispatch<React.SetStateAction<FinancialInformationData>>;
};

const EvaluationContext = createContext<EvaluationContextType | null>(null);

export function useEvaluationContext() {
    const context = useContext(EvaluationContext);
    if (!context) {
        throw new Error('useEvaluationContext must be used within an EvaluationProvider');
    }
    return context;
}

// Safe version that returns null if not within provider (for optional usage)
export function useEvaluationContextSafe(): EvaluationContextType | null {
    return useContext(EvaluationContext);
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
    // Company information
    companyName?: string;
    setCompanyNameAction?: React.Dispatch<React.SetStateAction<string>>;
    companyDescription?: string;
    setCompanyDescriptionAction?: React.Dispatch<React.SetStateAction<string>>;
    // Extended company information
    companyInfo?: CompanyInformationData;
    setCompanyInfoAction?: React.Dispatch<React.SetStateAction<CompanyInformationData>>;
    // Contact information
    contactInfo?: ContactInformationData;
    setContactInfoAction?: React.Dispatch<React.SetStateAction<ContactInformationData>>;
    // Financial information
    financialInfo?: FinancialInformationData;
    setFinancialInfoAction?: React.Dispatch<React.SetStateAction<FinancialInformationData>>;
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
    companyName,
    setCompanyNameAction,
    companyDescription,
    setCompanyDescriptionAction,
    companyInfo,
    setCompanyInfoAction,
    contactInfo,
    setContactInfoAction,
    financialInfo,
    setFinancialInfoAction,
}: EvaluationProviderProps) {
    const isPrivilegedUser = useMemo(() => role === 'admin' || role === 'analyst', [role]);
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
        companyName,
        setCompanyNameAction,
        companyDescription,
        setCompanyDescriptionAction,
        companyInfo,
        setCompanyInfoAction,
        contactInfo,
        setContactInfoAction,
        financialInfo,
        setFinancialInfoAction,
    };

    return (
        <EvaluationContext.Provider value={value}>
            {children}
        </EvaluationContext.Provider>
    );
}
