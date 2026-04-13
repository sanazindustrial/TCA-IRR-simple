'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { FileText } from 'lucide-react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';

const triageSummaryText = "Innovate Inc. presents a compelling investment case, characterized by a strong product-market fit (8.5/10) and a seasoned leadership team with prior exits. The company operates in the high-growth B2B SaaS market, with AI-driven supply chain optimization. Key strengths include a robust technology stack and significant market traction. However, the analysis identifies moderate risks in the go-to-market strategy and high competition. The overall recommendation is to proceed to due diligence, with a focus on validating the GTM execution plan and financial projections.";

const ddSummaryText = "Startup Overview: Innovate Inc. is a B2B SaaS company leveraging AI for supply chain optimization. The company is at the seed stage with significant market traction.\n\nScore Highlights:\n- TCA Composite Score: 8.17 (Strong)\n- Top Categories: Product-Market Fit (9.0), Leadership (8.5)\n- Lowest Category: Go-to-Market Strategy (6.5)\n\nTop 3 Risks:\n1. GTM Risk: Over-reliance on a single acquisition channel.\n2. Financial Risk: High burn rate with a 12-month runway.\n3. Market Risk: Highly competitive landscape with well-funded incumbents.\n\nKey Strengths:\n- Experienced founding team with prior exits.\n- Proprietary, patent-pending technology.\n- Strong initial user engagement and product-market fit.";

export function ExecutiveSummary() {
  const { isEditable, reportType } = useEvaluationContext();
  
  const initialText = reportType === 'dd' ? ddSummaryText : triageSummaryText;
  const [summaryText, setSummaryText] = useState(initialText);

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
