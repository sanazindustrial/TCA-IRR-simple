
'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ThumbsUp, ThumbsDown, GitBranch } from 'lucide-react';
import { useEvaluationContext } from './evaluation-provider';
import { useState } from 'react';
import { Textarea } from '../ui/textarea';

const initialRec = "The AI analysis indicates a strong investment opportunity. The startup scores highly on Product-Market Fit and Team Strength. While there are moderate risks in the GTM strategy, the potential for high growth outweighs the concerns. The recommendation is to proceed to the next stage of due diligence.";
const initialReviewerRec = "I concur with the AI. The founding team is exceptional, and their traction is impressive for a seed-stage company. The market is large and growing. We should schedule a follow-up meeting with the founders to dive deeper into their financial projections.";
const initialActionPlan = `**Immediate (Next 7 Days):**
- [HIGH] Schedule follow-up meeting with founders to deep-dive on Go-to-Market strategy and customer acquisition channels.
- [HIGH] Request detailed, 24-month financial model including burn-down chart and key hiring plan.
- [MEDIUM] Initiate technical due diligence on the core AI algorithm and scalability of the tech stack.

**Next 30 Days:**
- [HIGH] Conduct 3-5 independent customer reference calls to validate product value and support quality.
- [MEDIUM] Complete legal review of corporate structure and IP filings.
- [LOW] Begin preliminary market checks with potential strategic partners or acquirers.`;
const initialConclusion = 'Summary of Risk: The primary risks are market competition and a high burn rate. The GTM strategy, while flagged, is considered a manageable execution risk.\n\nPoints of Improvement: The company must diversify its customer acquisition channels and secure a longer financial runway.\n\nTCA Recommendation: With a composite score of 8.17, the TCA recommendation is to "Proceed to Full Screening".\n\nDetailed Conclusion: Both AI and human review align on a "Recommend" verdict. The company demonstrates strong fundamentals and high growth potential. The primary risks identified are considered manageable with active oversight. The recommended action plan focuses on validating the GTM execution and financial modeling. Overall, the opportunity is robust and warrants proceeding to the next stage.';

export function FinalRecommendation() {
  const { isEditable } = useEvaluationContext();

  const [aiRec, setAiRec] = useState(initialRec);
  const [reviewerRec, setReviewerRec] = useState(initialReviewerRec);
  const [actionPlan, setActionPlan] = useState(initialActionPlan);
  const [conclusion, setConclusion] = useState(initialConclusion);

  return (
    <DashboardCard
      title="Final Recommendation"
      icon={GitBranch}
      description="The final AI and reviewer recommendations with a concluding summary."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-muted/50 rounded-lg">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <ThumbsUp className="text-success" /> AI Recommendation: Recommend
          </h3>
          {isEditable ? (
              <Textarea value={aiRec} onChange={(e) => setAiRec(e.target.value)} rows={6} className="mt-2 text-base"/>
          ) : (
            <p className="text-muted-foreground mt-2">{aiRec}</p>
          )}
        </div>
        <div className="p-6 bg-muted/50 rounded-lg">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <ThumbsUp className="text-success" /> Reviewer Recommendation: Recommend
          </h3>
           {isEditable ? (
              <Textarea value={reviewerRec} onChange={(e) => setReviewerRec(e.target.value)} rows={6} className="mt-2 text-base"/>
          ) : (
            <p className="text-muted-foreground mt-2">{reviewerRec}</p>
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
