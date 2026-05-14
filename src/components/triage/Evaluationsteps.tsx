import { LucideIcon } from 'lucide-react';

export type WorkflowStatus = 'pending' | 'active' | 'completed' | 'warning' | 'failed';

export type WorkflowStep = {
  id: number;
  name: string;
  description: string;
  icon: LucideIcon;
};

export type WorkflowStepWithStatus = WorkflowStep & {
  status: WorkflowStatus;
};

export const STATUS_STYLES: Record<WorkflowStatus, { badge: string; card: string; dot: string; label: string }> = {
  pending: {
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    card: 'border-slate-200 bg-slate-50/70',
    dot: 'bg-slate-400',
    label: 'Pending',
  },
  active: {
    badge: 'bg-blue-100 text-blue-700 border-blue-300',
    card: 'border-blue-300 bg-blue-50/80 shadow-[0_0_0_1px_rgba(59,130,246,0.2),0_10px_30px_-20px_rgba(37,99,235,0.75)]',
    dot: 'bg-blue-500',
    label: 'Active',
  },
  completed: {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    card: 'border-emerald-300 bg-emerald-50/70',
    dot: 'bg-emerald-500',
    label: 'Completed',
  },
  warning: {
    badge: 'bg-amber-100 text-amber-700 border-amber-300',
    card: 'border-amber-300 bg-amber-50/80',
    dot: 'bg-amber-500',
    label: 'Warning',
  },
  failed: {
    badge: 'bg-red-100 text-red-700 border-red-300',
    card: 'border-red-300 bg-red-50/80',
    dot: 'bg-red-500',
    label: 'Failed',
  },
};

const INVESTOR_WORDING: Record<string, { name: string; description: string }> = {
  'Data Extraction': {
    name: 'AI Extraction',
    description: 'Analyze uploaded materials and identify business signals, KPIs, risks, and investment indicators.',
  },
  Modules: {
    name: 'Evaluation Engines',
    description: 'Select institutional-grade engines for investment analysis coverage.',
  },
  Generate: {
    name: 'Investment Analysis',
    description: 'Run AI-powered evaluation engines and produce investor-grade scoring.',
  },
  'Storage & Export': {
    name: 'Report Vault',
    description: 'Store the investment memo and export decision-ready outputs.',
  },
};

export function withInvestorTerminology(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((step) => {
    const replacement = INVESTOR_WORDING[step.name];
    if (!replacement) return step;
    return {
      ...step,
      name: replacement.name,
      description: replacement.description,
    };
  });
}

export function formatEta(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}m ${String(remainder).padStart(2, '0')}s`;
}
