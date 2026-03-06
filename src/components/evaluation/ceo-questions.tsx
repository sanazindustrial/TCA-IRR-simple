'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { Lightbulb, Edit3 } from 'lucide-react';
import { useEvaluationContext } from './evaluation-provider';
import { useState } from 'react';
import { Textarea } from '../ui/textarea';

const initialQuestions = [
  "What is the biggest unforeseen challenge you've faced, and how did you adapt?",
  "Can you walk me through the unit economics and the assumptions behind your LTV/CAC calculations?",
  "Who do you see as your biggest competitor in two years, and why aren't they a threat today?",
  "Describe your ideal company culture in three words.",
  "If you had to restart, what's one key thing you would do differently from the beginning?"
];

export function CEOQuestions() {
  const { isEditable } = useEvaluationContext();
  const [questions, setQuestions] = useState(initialQuestions);

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  return (
    <DashboardCard
      title="Key CEO Questions"
      icon={Lightbulb}
      description="Critical, AI-generated questions for the leadership team based on the analysis."
    >
      <div className="space-y-4">
        {questions.map((q, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Edit3 className="size-5 mt-1 text-primary flex-shrink-0" />
            {isEditable ? (
              <Textarea 
                value={q} 
                onChange={(e) => handleQuestionChange(index, e.target.value)} 
                className="text-base"
                rows={2}
              />
            ) : (
              <p className="font-medium text-muted-foreground">{q}</p>
            )}
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
