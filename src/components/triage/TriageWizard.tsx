import { ReactNode } from 'react';
import EvaluationProgressHeader from './EvaluationProgressHeader';
import WorkflowStepper from './WorkflowStepper';
import { WorkflowStepWithStatus } from './Evaluationsteps';

type ActivityItem = {
  id: string;
  text: string;
  tone: 'success' | 'warning' | 'info';
};

type MetricItem = {
  label: string;
  value: string;
};

type TriageWizardProps = {
  trackingId: string;
  companyName: string;
  owner: string;
  roleLabel: string;
  progressPercent: number;
  eta: string;
  stage: string;
  engine: string;
  confidencePercent: number | null;
  metrics: MetricItem[];
  steps: WorkflowStepWithStatus[];
  currentStepId: number;
  onStepSelect?: (stepId: number) => void;
  activityItems: ActivityItem[];
  children: ReactNode;
};

export default function TriageWizard(props: TriageWizardProps) {
  const {
    trackingId,
    companyName,
    owner,
    roleLabel,
    progressPercent,
    eta,
    stage,
    engine,
    confidencePercent,
    metrics,
    steps,
    currentStepId,
    onStepSelect,
    children,
  } = props;

  return (
    <div className="space-y-4">
      <EvaluationProgressHeader
        trackingId={trackingId}
        companyName={companyName}
        owner={owner}
        roleLabel={roleLabel}
        progressPercent={progressPercent}
        eta={eta}
        stage={stage}
        engine={engine}
        confidencePercent={confidencePercent}
        metrics={metrics}
      />

      <WorkflowStepper steps={steps} currentStepId={currentStepId} compact onStepSelect={onStepSelect} />

      <div>{children}</div>
    </div>
  );
}
