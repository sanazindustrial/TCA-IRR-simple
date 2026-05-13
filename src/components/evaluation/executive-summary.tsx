'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { FileText } from 'lucide-react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';
import { useEffect, useState } from 'react';

const triageSummaryText = "No summary available. Run the analysis to generate an executive summary.";

const ddSummaryText = "No summary available. Run the analysis to generate an executive summary.";

interface ExecutiveSummaryProps {
  summaryText?: string;
}

export function ExecutiveSummary({ summaryText: propSummaryText }: ExecutiveSummaryProps = {}) {
  const { isEditable, reportType } = useEvaluationContext();
  
  const initialText = propSummaryText ?? (reportType === 'dd' ? ddSummaryText : triageSummaryText);
  const [summaryText, setSummaryText] = useState(initialText);

  useEffect(() => {
    const nextText = propSummaryText ?? (reportType === 'dd' ? ddSummaryText : triageSummaryText);
    setSummaryText(nextText);
  }, [propSummaryText, reportType]);

  return (
    <DashboardCard
      title="Executive Summary"
      icon={FileText}
      description="A high-level overview of the comprehensive analysis."
    >
        {isEditable ? (
            <Textarea 
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                rows={reportType === 'dd' ? 12 : 6}
                className="text-base whitespace-pre-wrap"
            />
        ) : (
            <p className="text-muted-foreground whitespace-pre-wrap">
                {summaryText}
            </p>
        )}
    </DashboardCard>
  );
}
