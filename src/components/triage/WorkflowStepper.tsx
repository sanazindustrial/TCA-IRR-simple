import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, CheckCircle2 } from 'lucide-react';
import { STATUS_STYLES, WorkflowStepWithStatus } from './Evaluationsteps';

type WorkflowStepperProps = {
  steps: WorkflowStepWithStatus[];
  currentStepId: number;
  compact?: boolean;
  onStepSelect?: (stepId: number) => void;
};

export default function WorkflowStepper({ steps, currentStepId, compact = false, onStepSelect }: WorkflowStepperProps) {
  const currentIndex = Math.max(0, steps.findIndex((step) => step.id === currentStepId));

  return (
    <div className="overflow-x-auto">
      <div className={cn('flex min-w-max items-center gap-0', compact ? 'pb-1' : 'pb-2')}>
        {steps.map((step, index) => {
        const Icon = step.icon;
        const isCurrent = step.id === currentStepId;
        const styles = STATUS_STYLES[step.status];
        const isAccessible = index <= currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              onClick={() => isAccessible && onStepSelect?.(step.id)}
              disabled={!isAccessible || !onStepSelect}
              className={cn(
                'flex min-w-[108px] flex-col items-center gap-2 rounded-lg px-3 py-2 text-center transition-all',
                isCurrent && 'bg-primary/10',
                isAccessible && !isCurrent && onStepSelect && 'hover:bg-muted',
                !isAccessible && 'cursor-not-allowed opacity-50'
              )}
            >
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-full border transition-all',
                  isCurrent && 'border-primary bg-primary text-primary-foreground shadow-sm',
                  step.status === 'completed' && !isCurrent && 'border-emerald-500 bg-emerald-500 text-white',
                  step.status === 'warning' && !isCurrent && 'border-amber-300 bg-amber-50 text-amber-700',
                  step.status === 'failed' && !isCurrent && 'border-red-300 bg-red-50 text-red-700',
                  step.status === 'pending' && !isCurrent && 'border-slate-200 bg-slate-100 text-slate-400',
                  step.status === 'active' && !isCurrent && 'border-blue-300 bg-blue-50 text-blue-700'
                )}
              >
                {step.status === 'completed' && !isCurrent ? (
                  <Check className="size-5" />
                ) : step.status === 'completed' && isCurrent ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <Icon className="size-5" />
                )}
              </div>
              <div className="space-y-1">
                <p className={cn('text-xs font-medium whitespace-nowrap', isCurrent ? 'text-primary' : 'text-muted-foreground')}>
                  {step.name}
                </p>
                {!compact && (
                  <Badge variant="outline" className={cn('text-[10px] font-semibold uppercase', styles.badge)}>
                    {styles.label}
                  </Badge>
                )}
              </div>
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-0.5 w-8 sm:w-10',
                  index < currentIndex ? 'bg-emerald-500' : 'bg-border'
                )}
              />
            )}
          </div>
        );
        })}
      </div>
    </div>
  );
}
