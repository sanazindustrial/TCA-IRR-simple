/**
 * Evaluation Service
 * 
 * Provides secure evaluation management with:
 * - Unique evaluation IDs with timestamps
 * - User data isolation
 * - Step-by-step workflow validation
 * - Fresh evaluation initialization
 */

import { v4 as uuidv4 } from 'uuid';

// Evaluation Step definitions
export enum EvaluationStep {
    DOCUMENT_UPLOAD = 1,
    DATA_EXTRACTION = 2,
    COMPANY_INFO = 3,
    EXTERNAL_SOURCES = 4,
    MODULE_CONFIG = 5,
    ANALYSIS = 6,
    REPORT_GENERATION = 7,
}

// Step completion requirements
export const STEP_REQUIREMENTS: Record<EvaluationStep, string[]> = {
    [EvaluationStep.DOCUMENT_UPLOAD]: ['hasDocuments'],
    [EvaluationStep.DATA_EXTRACTION]: ['extractionComplete'],
    [EvaluationStep.COMPANY_INFO]: ['companyName', 'companyDescription'],
    [EvaluationStep.EXTERNAL_SOURCES]: [], // Optional for non-privileged users
    [EvaluationStep.MODULE_CONFIG]: ['moduleSelected'],
    [EvaluationStep.ANALYSIS]: ['analysisComplete'],
    [EvaluationStep.REPORT_GENERATION]: ['reportGenerated'],
};

// Evaluation identity
export interface EvaluationIdentity {
    evaluationId: string;       // Unique UUID
    userId: string;             // User who created
    userEmail: string;          // User email
    userName: string;           // User name
    companyName: string;        // Target company
    createdAt: string;          // ISO timestamp
    updatedAt: string;          // ISO timestamp
    sessionId: string;          // Browser session ID
}

// Evaluation state
export interface EvaluationState {
    identity: EvaluationIdentity;
    currentStep: EvaluationStep;
    completedSteps: EvaluationStep[];
    stepData: Record<EvaluationStep, unknown>;
    isLocked: boolean;          // Prevent edits after report generation
    version: number;            // Increment on each save
}

// Storage key for current evaluation
const CURRENT_EVALUATION_KEY = 'tca_current_evaluation';
const EVALUATION_HISTORY_KEY = 'tca_evaluation_history';

/**
 * Generate a unique evaluation ID
 */
export function generateEvaluationId(): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    return `EVAL-${timestamp}-${uuid.slice(0, 8).toUpperCase()}`;
}

/**
 * Get current session ID (creates new one if not exists)
 */
export function getSessionId(): string {
    if (typeof window === 'undefined') return 'server';

    let sessionId = sessionStorage.getItem('tca_session_id');
    if (!sessionId) {
        sessionId = `SESSION-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem('tca_session_id', sessionId);
    }
    return sessionId;
}

/**
 * Get current user info from localStorage
 */
export function getCurrentUserInfo(): { userId: string; email: string; name: string; role: string } | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem('loggedInUser');
        if (!stored) return null;

        const user = JSON.parse(stored);
        return {
            userId: user.id || user.userId || 'unknown',
            email: user.email || 'unknown@tca.com',
            name: user.name || user.firstName || 'Unknown User',
            role: user.role || 'user',
        };
    } catch {
        return null;
    }
}

/**
 * Create a fresh evaluation with unique identity
 */
export function createFreshEvaluation(companyName: string = ''): EvaluationState {
    const user = getCurrentUserInfo();
    const now = new Date().toISOString();

    if (!user) {
        throw new Error('User must be logged in to create an evaluation');
    }

    const evaluation: EvaluationState = {
        identity: {
            evaluationId: generateEvaluationId(),
            userId: user.userId,
            userEmail: user.email,
            userName: user.name,
            companyName: companyName,
            createdAt: now,
            updatedAt: now,
            sessionId: getSessionId(),
        },
        currentStep: EvaluationStep.DOCUMENT_UPLOAD,
        completedSteps: [],
        stepData: {
            [EvaluationStep.DOCUMENT_UPLOAD]: null,
            [EvaluationStep.DATA_EXTRACTION]: null,
            [EvaluationStep.COMPANY_INFO]: null,
            [EvaluationStep.EXTERNAL_SOURCES]: null,
            [EvaluationStep.MODULE_CONFIG]: null,
            [EvaluationStep.ANALYSIS]: null,
            [EvaluationStep.REPORT_GENERATION]: null,
        },
        isLocked: false,
        version: 1,
    };

    // Clear any existing evaluation data
    clearCurrentEvaluation();

    // Save the new evaluation
    saveCurrentEvaluation(evaluation);

    return evaluation;
}

/**
 * Save current evaluation to localStorage
 */
export function saveCurrentEvaluation(evaluation: EvaluationState): void {
    if (typeof window === 'undefined') return;

    evaluation.identity.updatedAt = new Date().toISOString();
    evaluation.version += 1;

    localStorage.setItem(CURRENT_EVALUATION_KEY, JSON.stringify(evaluation));

    // Dispatch event for listeners
    window.dispatchEvent(new CustomEvent('tca_evaluation_updated', { detail: evaluation }));
}

/**
 * Get current evaluation from localStorage
 */
export function getCurrentEvaluation(): EvaluationState | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem(CURRENT_EVALUATION_KEY);
        if (!stored) return null;

        const evaluation: EvaluationState = JSON.parse(stored);

        // Verify user ownership
        const currentUser = getCurrentUserInfo();
        if (!currentUser || evaluation.identity.userId !== currentUser.userId) {
            console.warn('Evaluation belongs to different user, clearing...');
            clearCurrentEvaluation();
            return null;
        }

        return evaluation;
    } catch {
        return null;
    }
}

/**
 * Clear current evaluation (for starting fresh)
 */
export function clearCurrentEvaluation(): void {
    if (typeof window === 'undefined') return;

    // Archive the current evaluation first
    const current = getCurrentEvaluation();
    if (current && current.completedSteps.length > 0) {
        archiveEvaluation(current);
    }

    localStorage.removeItem(CURRENT_EVALUATION_KEY);

    // Also clear related step data
    localStorage.removeItem('tca_company_info');
    localStorage.removeItem('tca_uploaded_files');
    localStorage.removeItem('tca_external_data');
    localStorage.removeItem('tca_analysis_results');

    // Clear session-specific data
    sessionStorage.removeItem('tca_extraction_data');
    sessionStorage.removeItem('tca_module_config');

    window.dispatchEvent(new CustomEvent('tca_evaluation_cleared'));
}

/**
 * Archive an evaluation to history
 */
function archiveEvaluation(evaluation: EvaluationState): void {
    if (typeof window === 'undefined') return;

    try {
        const historyStr = localStorage.getItem(EVALUATION_HISTORY_KEY);
        const history: EvaluationState[] = historyStr ? JSON.parse(historyStr) : [];

        // Add to history (max 50 evaluations)
        history.unshift(evaluation);
        if (history.length > 50) {
            history.pop();
        }

        localStorage.setItem(EVALUATION_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.error('Error archiving evaluation:', e);
    }
}

/**
 * Check if a step can be accessed
 */
export function canAccessStep(step: EvaluationStep, evaluation: EvaluationState): boolean {
    // Step 1 is always accessible
    if (step === EvaluationStep.DOCUMENT_UPLOAD) return true;

    // Check if previous step is completed
    const previousStep = step - 1;
    return evaluation.completedSteps.includes(previousStep);
}

/**
 * Mark a step as complete
 */
export function completeStep(
    step: EvaluationStep,
    data: unknown,
    evaluation: EvaluationState
): EvaluationState {
    if (!evaluation.completedSteps.includes(step)) {
        evaluation.completedSteps.push(step);
        evaluation.completedSteps.sort((a, b) => a - b);
    }

    evaluation.stepData[step] = data;

    // Move to next step if not at end
    if (step < EvaluationStep.REPORT_GENERATION) {
        evaluation.currentStep = step + 1;
    } else {
        evaluation.isLocked = true; // Lock after report generation
    }

    saveCurrentEvaluation(evaluation);
    return evaluation;
}

/**
 * Validate step requirements are met
 */
export function validateStepRequirements(
    step: EvaluationStep,
    data: Record<string, unknown>
): { isValid: boolean; missingFields: string[] } {
    const requirements = STEP_REQUIREMENTS[step];
    const missingFields: string[] = [];

    for (const field of requirements) {
        if (!data[field] ||
            (typeof data[field] === 'string' && data[field].trim() === '') ||
            (Array.isArray(data[field]) && data[field].length === 0)) {
            missingFields.push(field);
        }
    }

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
}

/**
 * Get user's evaluation history (only their own evaluations)
 */
export function getUserEvaluationHistory(): EvaluationState[] {
    if (typeof window === 'undefined') return [];

    try {
        const currentUser = getCurrentUserInfo();
        if (!currentUser) return [];

        const historyStr = localStorage.getItem(EVALUATION_HISTORY_KEY);
        if (!historyStr) return [];

        const history: EvaluationState[] = JSON.parse(historyStr);

        // Filter to only show user's own evaluations
        return history.filter(e => e.identity.userId === currentUser.userId);
    } catch {
        return [];
    }
}

/**
 * Check if current user can view an evaluation
 * Admin can view all, others can only view their own
 */
export function canViewEvaluation(evaluation: EvaluationState): boolean {
    const currentUser = getCurrentUserInfo();
    if (!currentUser) return false;

    // Admin/Analyst can view all
    if (currentUser.role === 'admin' || currentUser.role === 'analyst') {
        return true;
    }

    // Others can only view their own
    return evaluation.identity.userId === currentUser.userId;
}

/**
 * Format evaluation ID for display
 */
export function formatEvaluationId(evaluationId: string): string {
    // EVAL-1234567890-ABCD1234 -> EVAL-ABCD1234
    const parts = evaluationId.split('-');
    if (parts.length >= 3) {
        return `EVAL-${parts[parts.length - 1]}`;
    }
    return evaluationId;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(isoString: string): string {
    try {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return isoString;
    }
}
