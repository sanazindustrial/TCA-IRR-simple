'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Shield, ClipboardCheck, MessageSquare, User, Building2, Calendar, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Types
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs-revision';

export interface ReviewCheckItem {
    id: string;
    label: string;
    checked: boolean;
    required?: boolean;
}

export interface ReviewerInfo {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'analyst';
    reviewedAt?: string;
}

export interface ApprovalRecord {
    evaluationId: string;
    companyId: string;
    companyName: string;
    reportId?: string;
    status: ApprovalStatus;
    checklist: ReviewCheckItem[];
    reviewerComments: string;
    reviewer?: ReviewerInfo;
    createdAt: string;
    updatedAt: string;
    userId: string;
    userEmail: string;
}

// Default checklist items
const defaultChecklist: ReviewCheckItem[] = [
    { id: 'data-accuracy', label: 'Data accuracy verified against source documents', checked: false, required: true },
    { id: 'company-match', label: 'Company information matches uploaded documents', checked: false, required: true },
    { id: 'scoring-consistency', label: 'TCA scoring consistency checked', checked: false, required: true },
    { id: 'risk-flags-reviewed', label: 'All risk flags reviewed and addressed', checked: false, required: true },
    { id: 'recommendations-valid', label: 'Recommendations are valid and actionable', checked: false, required: true },
    { id: 'formatting-correct', label: 'Report formatting is correct', checked: false },
    { id: 'modules-complete', label: 'All selected modules have complete data', checked: false, required: true },
    { id: 'no-pii-exposed', label: 'No sensitive PII exposed inappropriately', checked: false, required: true },
];

interface ReviewerApprovalProps {
    evaluationId: string;
    companyId?: string;
    companyName?: string;
    reportId?: string;
    onApprovalChange?: (status: ApprovalStatus, record: ApprovalRecord) => void;
    isReviewer?: boolean;
    showOnlyIfReviewer?: boolean;
    compact?: boolean;
    className?: string;
}

const statusConfig: Record<ApprovalStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'Pending Review', color: 'bg-yellow-500/20 text-yellow-600', icon: <Clock className="h-4 w-4" /> },
    approved: { label: 'Approved', color: 'bg-green-500/20 text-green-600', icon: <CheckCircle2 className="h-4 w-4" /> },
    rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-600', icon: <XCircle className="h-4 w-4" /> },
    'needs-revision': { label: 'Needs Revision', color: 'bg-orange-500/20 text-orange-600', icon: <AlertTriangle className="h-4 w-4" /> },
};

export function ReviewerApproval({
    evaluationId,
    companyId,
    companyName,
    reportId,
    onApprovalChange,
    isReviewer = false,
    showOnlyIfReviewer = true,
    compact = false,
    className,
}: ReviewerApprovalProps) {
    const [approvalRecord, setApprovalRecord] = useState<ApprovalRecord | null>(null);
    const [checklist, setChecklist] = useState<ReviewCheckItem[]>(defaultChecklist);
    const [comments, setComments] = useState('');
    const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
    const [loading, setLoading] = useState(true);

    // Load current user and existing approval record
    useEffect(() => {
        const loadData = () => {
            try {
                // Get current user
                const userStr = localStorage.getItem('loggedInUser');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    setCurrentUser({
                        id: user.id || user.user_id || 'unknown',
                        email: user.email || 'unknown',
                        name: user.name || user.email?.split('@')[0] || 'User',
                        role: (user.role || 'user').toLowerCase(),
                    });
                }

                // Load existing approval record
                const storageKey = `approval_${evaluationId}`;
                const existingRecord = localStorage.getItem(storageKey);
                if (existingRecord) {
                    const record: ApprovalRecord = JSON.parse(existingRecord);
                    setApprovalRecord(record);
                    setChecklist(record.checklist);
                    setComments(record.reviewerComments);
                }
            } catch (error) {
                console.error('Error loading approval data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [evaluationId]);

    // Check if user is a reviewer (admin or analyst)
    const userIsReviewer = currentUser && (currentUser.role === 'admin' || currentUser.role === 'analyst');

    // Handle checklist item toggle
    const handleChecklistToggle = useCallback((itemId: string) => {
        setChecklist(prev => prev.map(item => 
            item.id === itemId ? { ...item, checked: !item.checked } : item
        ));
    }, []);

    // Check if all required items are checked
    const allRequiredChecked = checklist.filter(item => item.required).every(item => item.checked);

    // Save approval record
    const saveApprovalRecord = useCallback((status: ApprovalStatus) => {
        if (!currentUser) return;

        const now = new Date().toISOString();
        const record: ApprovalRecord = {
            evaluationId,
            companyId: companyId || '',
            companyName: companyName || '',
            reportId,
            status,
            checklist,
            reviewerComments: comments,
            reviewer: {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role as 'admin' | 'analyst',
                reviewedAt: now,
            },
            createdAt: approvalRecord?.createdAt || now,
            updatedAt: now,
            userId: currentUser.id,
            userEmail: currentUser.email,
        };

        // Save to localStorage
        const storageKey = `approval_${evaluationId}`;
        localStorage.setItem(storageKey, JSON.stringify(record));

        // Update approval index for tracking
        try {
            const indexStr = localStorage.getItem('approval_index') || '[]';
            const index: string[] = JSON.parse(indexStr);
            if (!index.includes(evaluationId)) {
                index.push(evaluationId);
                localStorage.setItem('approval_index', JSON.stringify(index));
            }
        } catch (e) {
            console.warn('Failed to update approval index:', e);
        }

        setApprovalRecord(record);
        onApprovalChange?.(status, record);

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('approval_updated', { detail: record }));
    }, [evaluationId, companyId, companyName, reportId, checklist, comments, currentUser, approvalRecord, onApprovalChange]);

    // Don't show if showOnlyIfReviewer is true and user is not a reviewer
    if (showOnlyIfReviewer && !userIsReviewer) {
        return null;
    }

    if (loading) {
        return (
            <div className={cn("animate-pulse bg-muted h-32 rounded-lg", className)} />
        );
    }

    // Compact view for status display
    if (compact) {
        const status = approvalRecord?.status || 'pending';
        const config = statusConfig[status];
        
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <Badge className={cn("gap-1", config.color)}>
                    {config.icon}
                    {config.label}
                </Badge>
                {approvalRecord?.reviewer && (
                    <span className="text-xs text-muted-foreground">
                        by {approvalRecord.reviewer.name}
                    </span>
                )}
            </div>
        );
    }

    return (
        <Card className={cn("border-2", className, {
            'border-yellow-500/30': !approvalRecord || approvalRecord.status === 'pending',
            'border-green-500/30': approvalRecord?.status === 'approved',
            'border-red-500/30': approvalRecord?.status === 'rejected',
            'border-orange-500/30': approvalRecord?.status === 'needs-revision',
        })}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <CardTitle>Reviewer Approval Process</CardTitle>
                    </div>
                    {approvalRecord && (
                        <Badge className={cn("gap-1", statusConfig[approvalRecord.status].color)}>
                            {statusConfig[approvalRecord.status].icon}
                            {statusConfig[approvalRecord.status].label}
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    Complete the checklist below before approving this report
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Tracking Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Evaluation ID</p>
                            <p className="font-mono text-sm font-semibold">{evaluationId}</p>
                        </div>
                    </div>
                    {companyName && (
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Company</p>
                                <p className="text-sm font-semibold">{companyName}</p>
                            </div>
                        </div>
                    )}
                    {reportId && (
                        <div className="flex items-center gap-2">
                            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Report ID</p>
                                <p className="font-mono text-sm font-semibold">{reportId}</p>
                            </div>
                        </div>
                    )}
                    {currentUser && (
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Reviewer</p>
                                <p className="text-sm font-semibold">{currentUser.name}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Checklist */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4" />
                        Review Checklist
                        <span className="text-xs text-muted-foreground font-normal">
                            ({checklist.filter(i => i.checked).length}/{checklist.length} completed)
                        </span>
                    </Label>
                    <div className="space-y-2 p-4 border rounded-lg bg-background">
                        {checklist.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "flex items-center space-x-3 p-2 rounded-md transition-colors",
                                    item.checked ? "bg-green-500/10" : "hover:bg-muted/50"
                                )}
                            >
                                <Checkbox
                                    id={item.id}
                                    checked={item.checked}
                                    onCheckedChange={() => handleChecklistToggle(item.id)}
                                    disabled={!userIsReviewer || approvalRecord?.status === 'approved'}
                                />
                                <label
                                    htmlFor={item.id}
                                    className={cn(
                                        "text-sm leading-none cursor-pointer flex-1",
                                        item.checked && "line-through text-muted-foreground"
                                    )}
                                >
                                    {item.label}
                                    {item.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comments */}
                <div className="space-y-2">
                    <Label htmlFor="reviewer-comments" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Reviewer Comments
                    </Label>
                    <Textarea
                        id="reviewer-comments"
                        placeholder="Add any comments, concerns, or notes about this report..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        disabled={!userIsReviewer || approvalRecord?.status === 'approved'}
                        className="min-h-[100px]"
                    />
                </div>

                {/* Warning if not all required items checked */}
                {!allRequiredChecked && userIsReviewer && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Required Items Incomplete</AlertTitle>
                        <AlertDescription>
                            All required checklist items (marked with *) must be checked before approval.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Previous Review Info */}
                {approvalRecord?.reviewer && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <p className="text-sm font-medium">Last Reviewed</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {approvalRecord.reviewer.name} ({approvalRecord.reviewer.role})
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(approvalRecord.reviewer.reviewedAt || '').toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>

            {userIsReviewer && approvalRecord?.status !== 'approved' && (
                <CardFooter className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        variant="outline"
                        onClick={() => saveApprovalRecord('needs-revision')}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Request Revision
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => saveApprovalRecord('rejected')}
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                    </Button>
                    <Button
                        onClick={() => saveApprovalRecord('approved')}
                        disabled={!allRequiredChecked}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve Report
                    </Button>
                </CardFooter>
            )}

            {approvalRecord?.status === 'approved' && (
                <CardFooter className="pt-6 border-t">
                    <Alert className="w-full bg-green-500/10 border-green-500/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-700">Report Approved</AlertTitle>
                        <AlertDescription className="text-green-600">
                            This report has been approved by {approvalRecord.reviewer?.name} on{' '}
                            {new Date(approvalRecord.reviewer?.reviewedAt || '').toLocaleString()}.
                        </AlertDescription>
                    </Alert>
                </CardFooter>
            )}
        </Card>
    );
}

// Helper to get approval status for an evaluation
export function getApprovalStatus(evaluationId: string): ApprovalStatus {
    try {
        const record = localStorage.getItem(`approval_${evaluationId}`);
        if (record) {
            return JSON.parse(record).status;
        }
    } catch (e) {
        console.warn('Failed to get approval status:', e);
    }
    return 'pending';
}

// Helper to get all pending approvals
export function getPendingApprovals(): ApprovalRecord[] {
    try {
        const indexStr = localStorage.getItem('approval_index') || '[]';
        const index: string[] = JSON.parse(indexStr);
        const pending: ApprovalRecord[] = [];
        
        for (const evalId of index) {
            const record = localStorage.getItem(`approval_${evalId}`);
            if (record) {
                const parsed: ApprovalRecord = JSON.parse(record);
                if (parsed.status === 'pending') {
                    pending.push(parsed);
                }
            }
        }
        
        return pending;
    } catch (e) {
        console.warn('Failed to get pending approvals:', e);
        return [];
    }
}
