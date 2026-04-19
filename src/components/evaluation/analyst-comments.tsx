
'use client';

import { MessageSquare, Smile, Frown, Meh, Star } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DashboardCard } from '../shared/dashboard-card';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

const commentsData = {
  sentiment: 'Positive',
  tone: ['Optimistic', 'Confident', 'Slightly Concerned'],
  comments: [
    {
      text: 'The founding team is one of the strongest I\'ve seen at this stage. Their prior experience at Google and a successful exit is a massive de-risking factor.',
      theme: 'Team Strength',
      sentiment: 'Very Positive',
    },
    {
      text: 'While the technology is impressive, the go-to-market strategy feels underdeveloped. They need to clarify their ideal customer profile and acquisition channels.',
      theme: 'GTM Strategy',
      sentiment: 'Concerned',
    },
    {
      text: 'The market size is enormous, and their unique approach gives them a defensible moat. If they execute, this could be a category-defining company.',
      theme: 'Market & Moat',
      sentiment: 'Very Positive',
    },
  ],
};

const getSentimentIcon = (sentiment: string) => {
  if (sentiment.toLowerCase().includes('positive')) return <Smile className="text-success" />;
  if (sentiment.toLowerCase().includes('negative') || sentiment.toLowerCase().includes('concerned')) return <Frown className="text-destructive" />;
  return <Meh className="text-muted-foreground" />;
};

interface WizardSentiment { positive: number; negative: number; neutral: number; total: number; }
interface WizardKeyword { word: string; count: number; group: string; }
interface AnalystCommentsProps {
  wizardSentiment?: WizardSentiment;
  wizardKeywords?: WizardKeyword[];
  wizardComments?: string[];
}

export function AnalystComments({ wizardSentiment, wizardKeywords, wizardComments }: AnalystCommentsProps = {}) {
  // Derive live display data from wizard props when available
  const derivedSentiment = wizardSentiment
    ? wizardSentiment.positive >= wizardSentiment.negative
      ? wizardSentiment.positive > wizardSentiment.neutral ? 'Positive' : 'Neutral'
      : 'Negative'
    : commentsData.sentiment;

  const derivedTone = wizardSentiment
    ? [
        wizardSentiment.positive > 0 ? 'Optimistic' : null,
        wizardSentiment.neutral > 0 ? 'Analytical' : null,
        wizardSentiment.negative > 0 ? 'Cautious' : null,
      ].filter(Boolean) as string[]
    : commentsData.tone;

  // Top 3 unique keyword groups as themes
  const derivedThemes = wizardKeywords && wizardKeywords.length > 0
    ? Array.from(new Set(wizardKeywords.map((k) => k.group))).slice(0, 3)
    : commentsData.comments.map((c) => c.theme);

  // Actual analyst comments as plain text entries
  const derivedComments = wizardComments && wizardComments.length > 0
    ? wizardComments.filter(Boolean).slice(0, 5).map((text, i) => ({
        text,
        theme: derivedThemes[i % derivedThemes.length] ?? 'General',
        sentiment: derivedSentiment,
      }))
    : commentsData.comments;
  return (
    <DashboardCard
      title="Analyst Comments & Analysis"
      icon={MessageSquare}
      description="Qualitative insights from the human analyst, including sentiment and thematic analysis."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Overall Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold flex items-center justify-center gap-2'>
              {getSentimentIcon(derivedSentiment)}
              {derivedSentiment}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Dominant Tone</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-2 justify-center'>
            {derivedTone.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Key Themes</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-2 justify-center'>
            {derivedThemes.map(theme => <Badge key={theme} variant="outline">{theme}</Badge>)}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="mt-6 space-y-4">
        {derivedComments.map((comment, index) => (
          <div key={index} className="p-4 bg-muted/50 rounded-lg border border-dashed">
            <div className="flex justify-between items-center mb-2">
              <Badge variant="outline">{comment.theme}</Badge>
              <div className='flex items-center gap-2 text-sm font-semibold'>
                {getSentimentIcon(comment.sentiment)}
                {comment.sentiment}
              </div>
            </div>
            <p className="text-muted-foreground">{comment.text}</p>
          </div>
        ))}
        {wizardSentiment && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border text-xs text-muted-foreground">
            Sentiment breakdown — Positive: {wizardSentiment.positive} &nbsp;|&nbsp; Neutral: {wizardSentiment.neutral} &nbsp;|&nbsp; Negative: {wizardSentiment.negative} &nbsp;(of {wizardSentiment.total} comment{wizardSentiment.total !== 1 ? 's' : ''})
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
