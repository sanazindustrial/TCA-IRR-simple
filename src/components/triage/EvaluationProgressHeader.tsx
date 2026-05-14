import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type WorkflowMetric = {
  label: string;
  value: string;
};

type EvaluationProgressHeaderProps = {
  trackingId: string;
  companyName: string;
  owner: string;
  roleLabel: string;
  progressPercent: number;
  eta: string;
  stage: string;
  engine: string;
  confidencePercent: number | null;
  metrics: WorkflowMetric[];
};

export default function EvaluationProgressHeader(props: EvaluationProgressHeaderProps) {
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
  } = props;

  const visibleMetrics = metrics.filter((metric) => metric.value.trim().length > 0);

  return (
    <Card>
      <CardContent className="px-3 py-3">
        <div className="space-y-2.5">
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.9fr)]">
            <div className="rounded-md border bg-slate-50 px-3 py-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Workflow</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="text-sm font-semibold text-slate-900">{trackingId}</p>
                    <p className="truncate text-xs text-slate-600">{companyName || 'Company not set yet'}</p>
                  </div>
                </div>
                <div className="min-w-[140px] space-y-1 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-slate-500">Progress</span>
                    <span className="text-sm font-semibold text-slate-900">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-1.5" />
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border bg-slate-50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Role</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{roleLabel}</p>
                <p className="truncate text-[11px] text-slate-600">{owner}</p>
              </div>
              <div className="rounded-md border bg-slate-50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Engine</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{engine}</p>
                <p className="text-[11px] text-slate-600">ETA {eta}</p>
              </div>
              <div className="rounded-md border bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Confidence</p>
                  <p className="text-sm font-semibold text-slate-900">{typeof confidencePercent === 'number' ? `${confidencePercent}%` : 'Not computed'}</p>
                </div>
                <Badge variant="outline" className="mt-1 h-auto max-w-full truncate border-slate-300 px-2 py-0 text-[10px] text-slate-700">
                  {stage}
                </Badge>
              </div>
            </div>
          </div>

          {visibleMetrics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {visibleMetrics.map((metric) => (
                <div key={metric.label} className="rounded-full border bg-white px-3 py-1.5">
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">{metric.label}</span>
                  <span className="ml-2 text-xs font-semibold text-slate-900">{metric.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
