'use client';

import { useState, useEffect } from 'react';
import { Hash, Building2, User, Calendar, Clock, FileText, BarChart2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * Unified Record ID Component
 * Displays consistent tracking information across all pages:
 * - Evaluation ID
 * - Company ID & Name
 * - Report ID (if generated)
 * - User info
 * - Timestamps
 */

export interface UnifiedRecordData {
    evaluationId: string;
    companyId?: string;
    companyName?: string;
    reportId?: string;
    reportNumber?: number;
    userId: string;
    userEmail: string;
    userName: string;
    createdAt: string;
    updatedAt?: string;
    status?: 'draft' | 'in-progress' | 'completed' | 'archived';
    reviewerId?: string;
    reviewerName?: string;
    approvalStatus?: 'pending' | 'approved' | 'rejected' | 'needs-revision';
}

interface UnifiedRecordDisplayProps {
    data?: Partial<UnifiedRecordData>;
    compact?: boolean;
    showApproval?: boolean;
    className?: string;
}

// Storage key for unified record
const UNIFIED_RECORD_KEY = 'unified_record_data';

// Generate report number based on timestamp (unique per day/company)
export function generateReportNumber(companyName: string): string {
    const now = new Date();
    const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, '');
    const hash = Array.from(companyName || 'X').reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
    const seq = Math.abs(hash % 1000).toString().padStart(3, '0');
    return `${datePrefix}-${seq}`;
}

// Load unified record from storage
export function loadUnifiedRecord(): UnifiedRecordData | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem(UNIFIED_RECORD_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

// Save unified record to storage
export function saveUnifiedRecord(data: Partial<UnifiedRecordData>): void {
    if (typeof window === 'undefined') return;
    try {
        const existing = loadUnifiedRecord() || {};
        const merged = { ...existing, ...data, updatedAt: new Date().toISOString() };
        localStorage.setItem(UNIFIED_RECORD_KEY, JSON.stringify(merged));

        // Also update individual keys for backward compatibility
        if (data.evaluationId) localStorage.setItem('currentEvaluationId', data.evaluationId);
        if (data.companyId) localStorage.setItem('analysisCompanyId', data.companyId);
        if (data.companyName) localStorage.setItem('analysisCompanyName', data.companyName);
        if (data.reportId) localStorage.setItem('currentReportId', data.reportId);

        window.dispatchEvent(new CustomEvent('unified_record_updated', { detail: merged }));
    } catch (e) {
        console.warn('Failed to save unified record:', e);
    }
}

// Create new unified record
export function createUnifiedRecord(overrides?: Partial<UnifiedRecordData>): UnifiedRecordData {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Get user info
    let userId = 'anonymous';
    let userEmail = 'anonymous@tca-irr.com';
    let userName = 'Anonymous';

    if (typeof window !== 'undefined') {
        try {
            const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
            userId = user.id || user.user_id || userId;
            userEmail = user.email || userEmail;
            userName = user.name || user.email?.split('@')[0] || userName;
        } catch { /* ignore */ }
    }

    const record: UnifiedRecordData = {
        evaluationId: `EVAL-${timestamp}-${random}`,
        companyId: undefined,
        companyName: undefined,
        reportId: undefined,
        userId,
        userEmail,
        userName,
        createdAt: new Date().toISOString(),
        status: 'draft',
        ...overrides,
    };

    saveUnifiedRecord(record);
    return record;
}

// Update unified record with company info
export function updateUnifiedRecordCompany(companyName: string, companyId?: string): void {
    const existing = loadUnifiedRecord();
    if (!existing) return;

    const normalized = companyName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 16);
    const hash = Array.from(companyName).reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
    const generatedCompanyId = companyId || `CO-${normalized}-${Math.abs(hash).toString(36).toUpperCase().substring(0, 6)}`;

    saveUnifiedRecord({
        ...existing,
        companyName,
        companyId: generatedCompanyId,
    });
}

// Generate report ID for unified record
export function generateUnifiedReportId(reportType: 'triage' | 'dd' = 'triage'): string {
    const existing = loadUnifiedRecord();
    const prefix = reportType === 'dd' ? 'DD' : 'SSD';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reportId = `RPT-${prefix}-${timestamp}-${random}`;

    if (existing) {
        saveUnifiedRecord({
            ...existing,
            reportId,
            reportNumber: (existing.reportNumber || 0) + 1,
        });
    }

    return reportId;
}

export function UnifiedRecordDisplay({ data, compact = false, showApproval = false, className }: UnifiedRecordDisplayProps) {
    const [record, setRecord] = useState<UnifiedRecordData | null>(null);

    useEffect(() => {
        // Load from props or storage
        if (data?.evaluationId) {
            setRecord(data as UnifiedRecordData);
        } else {
            setRecord(loadUnifiedRecord());
        }

        // Listen for updates
        const handleUpdate = (e: CustomEvent) => {
            setRecord(e.detail);
        };
        window.addEventListener('unified_record_updated', handleUpdate as EventListener);
        return () => window.removeEventListener('unified_record_updated', handleUpdate as EventListener);
    }, [data]);

    if (!record) return null;

    const statusColors: Record<string, string> = {
        'draft': 'bg-gray-500/20 text-gray-600',
        'in-progress': 'bg-blue-500/20 text-blue-600',
        'completed': 'bg-green-500/20 text-green-600',
        'archived': 'bg-purple-500/20 text-purple-600',
    };

    const approvalColors: Record<string, string> = {
        'pending': 'bg-yellow-500/20 text-yellow-600',
        'approved': 'bg-green-500/20 text-green-600',
        'rejected': 'bg-red-500/20 text-red-600',
        'needs-revision': 'bg-orange-500/20 text-orange-600',
    };

    if (compact) {
        return (
            <div className={cn("flex flex-wrap items-center gap-2 text-xs", className)}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge variant="outline" className="font-mono gap-1">
                                <Hash className="h-3 w-3" />
                                {record.evaluationId}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Evaluation ID</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {record.companyName && (
                    <Badge variant="secondary" className="gap-1">
                        <Building2 className="h-3 w-3" />
                        {record.companyName}
                    </Badge>
                )}

                {record.reportId && (
                    <Badge variant="outline" className="font-mono gap-1 text-primary">
                        <FileText className="h-3 w-3" />
                        {record.reportId}
                    </Badge>
                )}

                {record.status && (
                    <Badge className={statusColors[record.status]}>
                        {record.status}
                    </Badge>
                )}

                {showApproval && record.approvalStatus && (
                    <Badge className={approvalColors[record.approvalStatus]}>
                        <Shield className="h-3 w-3 mr-1" />
                        {record.approvalStatus}
                    </Badge>
                )}
            </div>
        );
    }

    return (
        <Card className={cn("bg-muted/30", className)}>
            <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* Evaluation ID */}
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Hash className="h-3 w-3" /> Evaluation ID
                        </p>
                        <p className="font-mono text-sm font-medium">{record.evaluationId}</p>
                    </div>

                    {/* Company */}
                    {record.companyName && (
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3" /> Company
                            </p>
                            <p className="text-sm font-medium truncate">{record.companyName}</p>
                            {record.companyId && (
                                <p className="text-xs text-muted-foreground font-mono">{record.companyId}</p>
                            )}
                        </div>
                    )}

                    {/* Report ID */}
                    {record.reportId && (
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <FileText className="h-3 w-3" /> Report ID
                            </p>
                            <p className="font-mono text-sm font-medium text-primary">{record.reportId}</p>
                            {record.reportNumber && (
                                <p className="text-xs text-muted-foreground">Report #{record.reportNumber}</p>
                            )}
                        </div>
                    )}

                    {/* User */}
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" /> Created By
                        </p>
                        <p className="text-sm font-medium">{record.userName}</p>
                        <p className="text-xs text-muted-foreground truncate">{record.userEmail}</p>
                    </div>

                    {/* Timestamps */}
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Created
                        </p>
                        <p className="text-sm">{new Date(record.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">{new Date(record.createdAt).toLocaleTimeString()}</p>
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <BarChart2 className="h-3 w-3" /> Status
                        </p>
                        <div className="flex flex-col gap-1">
                            {record.status && (
                                <Badge className={cn("w-fit", statusColors[record.status])}>
                                    {record.status}
                                </Badge>
                            )}
                            {showApproval && record.approvalStatus && (
                                <Badge className={cn("w-fit", approvalColors[record.approvalStatus])}>
                                    <Shield className="h-3 w-3 mr-1" />
                                    {record.approvalStatus}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default UnifiedRecordDisplay;
