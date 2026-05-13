
'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ThumbsUp, ThumbsDown, GitBranch } from 'lucide-react';
import { useEvaluationContext } from './evaluation-provider';
import { useState } from 'react';
import { Textarea } from '../ui/textarea';

const initialAnalystRec = "Add analyst commentary here.";
const initialActionPlan = `**Immediate (Next 7 Days):**
- [HIGH] Schedule follow-up meeting with founders to deep-dive on Go-to-Market strategy and customer acquisition channels.
- [HIGH] Request detailed, 24-month financial model including burn-down chart and key hiring plan.
- [MEDIUM] Initiate technical due diligence on the core AI algorithm and scalability of the tech stack.

**Next 30 Days:**
- [HIGH] Conduct 3-5 independent customer reference calls to validate product value and support quality.
- [MEDIUM] Complete legal review of corporate structure and IP filings.
- [LOW] Begin preliminary market checks with potential strategic partners or acquirers.`;

interface FinalRecommendationProps {
  aiRecommendation?: string;
  compositeScore?: number;
  companyName?: string;
}

export function FinalRecommendation({ aiRecommendation, compositeScore, companyName }: FinalRecommendationProps = {}) {
  const { isEditable } = useEvaluationContext();

  const verdict = compositeScore !== undefined
    ? compositeScore >= 7 ? 'Proceed to Full Screening' : compositeScore >= 5.5 ? 'Conditional — Further Review' : 'Pass'
    : 'Pending Analysis';

  const derivedRec = aiRecommendation ?? (
    compositeScore !== undefined && companyName
      ? `${companyName} achieved a composite TCA score of ${compositeScore.toFixed(2)}. ${
          compositeScore >= 7
            ? 'The analysis indicates a strong investment opportunity. The recommendation is to proceed to the next stage of due diligence.'
            : compositeScore >= 5.5
            ? 'The analysis indicates a moderate opportunity with areas requiring further review before proceeding.'
            : 'The analysis indicates significant risk factors. The recommendation is to pass at this stage.'
        }`
      : 'Analysis complete. Review the composite score and module breakdowns for investment recommendation.'
  );

  const derivedConclusion = compositeScore !== undefined
    ? `TCA Recommendation: With a composite score of ${compositeScore.toFixed(2)}, the TCA recommendation is to "${verdict}".\n\nAdd detailed analyst notes and conclusion here.`
    : 'Run the analysis to generate the final conclusion.';

  const [aiRec, setAiRec] = useState(derivedRec);
  const [AnalystRec, setAnalystRec] = useState(initialAnalystRec);
  const [actionPlan, setActionPlan] = useState(initialActionPlan);
  const [conclusion, setConclusion] = useState(derivedConclusion);

  return (
    <DashboardCard
      title="Final Recommendation"
      icon={GitBranch}
      description="The final AI and Analyst recommendations with a concluding summary."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-muted/50 rounded-lg">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <ThumbsUp className="text-success" /> AI Recommendation: {verdict}
          </h3>
          {isEditable ? (
              <Textarea value={aiRec} onChange={(e) => setAiRec(e.target.value)} rows={6} className="mt-2 text-base"/>
          ) : (
            <p className="text-muted-foreground mt-2">{aiRec}</p>
          )}
        </div>
        <div className="p-6 bg-muted/50 rounded-lg">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <ThumbsUp className="text-success" /> Analyst Recommendation: {verdict}
          </h3>
           {isEditable ? (
              <Textarea value={AnalystRec} onChange={(e) => setAnalystRec(e.target.value)} rows={6} className="mt-2 text-base"/>
          ) : (
            <p className="text-muted-foreground mt-2">{AnalystRec}</p>
          )}
        </div>
      </div>
      <Separator className="my-6" />
       <div className="space-y-6">
        <div>
            <h3 className="font-semibold text-lg mb-2">Action Plan</h3>
            {isEditable ? (
                <Textarea value={actionPlan} onChange={(e) => setActionPlan(e.target.value)} rows={8} className="text-base whitespace-pre-wrap"/>
            ) : (
                <div className="text-muted-foreground whitespace-pre-wrap">{actionPlan}</div>
            )}
        </div>
        <div>
            <h3 className="font-semibold text-lg mb-2">Conclusion & Summary Note</h3>
            {isEditable ? (
                <Textarea 
                    value={conclusion} 
                    onChange={(e) => setConclusion(e.target.value)} 
                    rows={8} 
                    className="text-base whitespace-pre-wrap"
                    placeholder="Summary of Risk: ...\n\nPoints of Improvement: ...\n\nTCA Recommendation: ...\n\nDetailed Conclusion: ..."
                />
            ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">{conclusion}</p>
            )}
        </div>
       </div>
    </DashboardCard>
  );
}


