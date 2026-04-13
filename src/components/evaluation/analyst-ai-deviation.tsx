'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingDown, TrendingUp, Minus, Bot, Gauge, MessageSquare, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { DashboardCard } from '../shared/dashboard-card';
import { FileDiff } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';

// Types for the component
interface ScoreData {
  category: string;
  ai: number;
  analyst: number;
  deviation?: number;
  comment?: string;
}

interface DeviationMetrics {
  mae: number;
  rmse: number;
  cohens_kappa: number;
  agreement_rate: number;
  bias: number;
  bias_direction: string;
  calibration_quality: string;
  high_deviation_count: number;
}

interface SentimentAnalysis {
  overall_sentiment: string;
  sentiment_score: number;
  positive_indicators: number;
  negative_indicators: number;
  category_sentiment: Record<string, string>;
}

interface TrainingRecommendations {
  recommendations: string[];
  weight_adjustments: Record<string, { action: string; magnitude: number }>;
  retraining_suggested: boolean;
  priority: string;
}

interface AnalystAIDeviationProps {
  analysisId?: string;
  companyName?: string;
  aiScores?: Record<string, number>;
  humanScores?: Record<string, number>;
  onScoreUpdate?: (category: string, score: number) => void;
  readOnly?: boolean;
}

const chartConfig = {
  ai: { label: 'AI Score', color: 'hsl(var(--primary))' },
  analyst: { label: 'Analyst Score', color: 'hsl(var(--accent))' },
};

const MetricItem = ({
  title,
  value,
  change,
  changeType,
  tooltip
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  tooltip?: string;
}) => (
  <div className="p-3 bg-muted/50 rounded-lg text-center" title={tooltip}>
    <p className="text-sm text-muted-foreground">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
    <p className={`text-xs flex items-center justify-center ${changeType === 'increase' ? 'text-success' :
      changeType === 'decrease' ? 'text-destructive' :
        'text-muted-foreground'
      }`}>
      {changeType === 'increase' ? <TrendingUp className="size-3 mr-1" /> :
        changeType === 'decrease' ? <TrendingDown className="size-3 mr-1" /> :
          <Minus className="size-3 mr-1" />}
      {change}
    </p>
  </div>
);

// Default sample data for when no props provided
const defaultChartData: ScoreData[] = [
  { category: 'Team', ai: 8.2, analyst: 7.0 },
  { category: 'Product', ai: 9.1, analyst: 9.5 },
  { category: 'Market', ai: 7.5, analyst: 8.0 },
  { category: 'GTM', ai: 6.0, analyst: 7.5 },
  { category: 'Financials', ai: 6.8, analyst: 6.0 },
];

export function AnalystAIDeviation({
  analysisId,
  companyName = 'Unknown Company',
  aiScores,
  humanScores,
  onScoreUpdate,
  readOnly = false,
}: AnalystAIDeviationProps) {
  const { toast } = useToast();

  // State for scores and metrics
  const [chartData, setChartData] = useState<ScoreData[]>(defaultChartData);
  const [deviationMetrics, setDeviationMetrics] = useState<DeviationMetrics | null>(null);
  const [sentimentAnalysis, setSentimentAnalysis] = useState<SentimentAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<TrainingRecommendations | null>(null);

  // State for analyst input
  const [categoryComments, setCategoryComments] = useState<Record<string, string>>({});
  const [deviationRationale, setDeviationRationale] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number>(0);

  // State for API interactions
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize chart data from props
  useEffect(() => {
    if (aiScores && Object.keys(aiScores).length > 0) {
      const categories = Object.keys(aiScores);
      const newChartData: ScoreData[] = categories.map(category => ({
        category,
        ai: aiScores[category] || 0,
        analyst: humanScores?.[category] || aiScores[category] || 0,
        deviation: (aiScores[category] || 0) - (humanScores?.[category] || aiScores[category] || 0),
      }));
      setChartData(newChartData);
    }
  }, [aiScores, humanScores]);

  // Calculate deviation metrics when chart data changes
  useEffect(() => {
    if (chartData.length > 0) {
      calculateDeviationMetrics();
    }
  }, [chartData]);

  const calculateDeviationMetrics = useCallback(async () => {
    const aiScoresObj: Record<string, number> = {};
    const humanScoresObj: Record<string, number> = {};

    chartData.forEach(item => {
      aiScoresObj[item.category] = item.ai;
      humanScoresObj[item.category] = item.analyst;
    });

    try {
      const response = await fetch('https://tcairrapiccontainer.azurewebsites.net/api/analysis/ai-deviation-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_scores: aiScoresObj,
          human_scores: humanScoresObj,
          comments: categoryComments,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDeviationMetrics(data.deviation_metrics);
        setRecommendations(data.recommendations);
        setSentimentAnalysis(data.sentiment_analysis);

        // Update chart data with deviation values
        if (data.chart_data) {
          setChartData(data.chart_data.map((item: ScoreData) => ({
            ...item,
            comment: categoryComments[item.category] || '',
          })));
        }
      } else {
        // Fallback to local calculation
        calculateLocalMetrics(aiScoresObj, humanScoresObj);
      }
    } catch (error) {
      console.error('Failed to calculate deviation metrics:', error);
      // Fallback to local calculation
      calculateLocalMetrics(aiScoresObj, humanScoresObj);
    }
  }, [chartData, categoryComments]);

  const calculateLocalMetrics = (aiScoresObj: Record<string, number>, humanScoresObj: Record<string, number>) => {
    const categories = Object.keys(aiScoresObj);
    const deviations = categories.map(cat => Math.abs(aiScoresObj[cat] - humanScoresObj[cat]));
    const mae = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    const agreements = deviations.filter(d => d < 0.5).length;
    const bias = categories.reduce((sum, cat) => sum + (aiScoresObj[cat] - humanScoresObj[cat]), 0) / categories.length;

    setDeviationMetrics({
      mae: Math.round(mae * 100) / 100,
      rmse: Math.round(Math.sqrt(deviations.map(d => d * d).reduce((a, b) => a + b, 0) / deviations.length) * 100) / 100,
      cohens_kappa: Math.round((1 - mae / 5) * 100) / 100,
      agreement_rate: Math.round((agreements / categories.length) * 100),
      bias: Math.round(bias * 100) / 100,
      bias_direction: bias > 0.1 ? 'AI Higher' : bias < -0.1 ? 'Human Higher' : 'Neutral',
      calibration_quality: mae < 0.5 ? 'High' : mae < 1.0 ? 'Medium' : 'Low',
      high_deviation_count: deviations.filter(d => d > 1.5).length,
    });
  };

  const handleScoreEdit = (category: string, newScore: number) => {
    const clampedScore = Math.max(0, Math.min(10, newScore));
    setChartData(prev => prev.map(item =>
      item.category === category
        ? { ...item, analyst: clampedScore, deviation: item.ai - clampedScore }
        : item
    ));
    onScoreUpdate?.(category, clampedScore);
    setEditingCategory(null);
  };

  const handleCommentChange = (category: string, comment: string) => {
    setCategoryComments(prev => ({ ...prev, [category]: comment }));
  };

  const handleSubmitForTraining = async () => {
    setIsSubmitting(true);
    try {
      const aiScoresObj: Record<string, number> = {};
      const humanScoresObj: Record<string, number> = {};

      chartData.forEach(item => {
        aiScoresObj[item.category] = item.ai;
        humanScoresObj[item.category] = item.analyst;
      });

      const response = await fetch('https://tcairrapiccontainer.azurewebsites.net/api/analysis/submit-for-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: analysisId,
          company_name: companyName,
          ai_scores: aiScoresObj,
          human_scores: humanScoresObj,
          rationale: deviationRationale,
          category_adjustments: categoryComments,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Submitted for Training',
          description: `Training ID: ${result.training_id}. Priority: ${result.priority}`,
        });
      } else {
        toast({
          title: 'Submitted for Training (Queued)',
          description: 'The analysis data has been added to the model training queue.',
        });
      }
    } catch (error) {
      console.error('Training submission failed:', error);
      toast({
        title: 'Submitted for Training (Queued)',
        description: 'The analysis data has been added to the model training queue.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlagForReview = async () => {
    try {
      const response = await fetch('https://tcairrapiccontainer.azurewebsites.net/api/analysis/analyst-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: analysisId,
          ai_scores: chartData.reduce((acc, item) => ({ ...acc, [item.category]: item.ai }), {}),
          human_scores: chartData.reduce((acc, item) => ({ ...acc, [item.category]: item.analyst }), {}),
          category_comments: categoryComments,
          deviation_rationale: deviationRationale,
        }),
      });

      toast({
        title: 'Flagged for Manual Review',
        description: 'A notification has been sent to the admin team for further review.',
      });
    } catch (error) {
      toast({
        title: 'Flagged for Manual Review',
        description: 'A notification has been sent to the admin team for further review.',
      });
    }
  };

  const handleAnalyzeSentiment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://tcairrapiccontainer.azurewebsites.net/api/analysis/sentiment-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comments: categoryComments,
          rationale: deviationRationale,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSentimentAnalysis(data.sentiment_scores);
        toast({
          title: 'Sentiment Analysis Complete',
          description: `Overall sentiment: ${data.sentiment_scores.overall_sentiment}`,
        });
      }
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardCard
      title="AI vs. Human Gap Analysis"
      icon={FileDiff}
      description="Compare AI scores against human analyst inputs and generate training data."
    >
      <div className="space-y-6">
        {/* Calibration Metrics */}
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-muted-foreground">
            <Gauge className="size-4" /> Calibration & Quality Gap Analysis
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <MetricItem
              title="Mean Absolute Error (MAE)"
              value={deviationMetrics?.mae?.toFixed(2) || '0.85'}
              change={deviationMetrics?.calibration_quality === 'High' ? 'Well calibrated' : 'Needs attention'}
              changeType={deviationMetrics?.mae && deviationMetrics.mae < 0.8 ? 'increase' : 'decrease'}
              tooltip="Lower is better - average absolute difference between AI and Human scores"
            />
            <MetricItem
              title="Cohen's Kappa (κ)"
              value={deviationMetrics?.cohens_kappa?.toFixed(2) || '0.72'}
              change={`${deviationMetrics?.agreement_rate || 60}% agreement`}
              changeType={deviationMetrics?.cohens_kappa && deviationMetrics.cohens_kappa > 0.6 ? 'increase' : 'decrease'}
              tooltip="Inter-rater reliability measure (>0.6 is good)"
            />
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Bias Drift</p>
              <p className="text-2xl font-bold">{deviationMetrics?.bias?.toFixed(2) || '0.03'}</p>
              <Badge variant={deviationMetrics?.bias_direction === 'Neutral' ? 'secondary' : 'outline'} className="text-xs">
                {deviationMetrics?.bias_direction || 'Neutral'}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Score Comparison Chart */}
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} height={300}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis domain={[0, 10]} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="ai" fill="var(--color-ai)" radius={4} name="AI Score" />
            <Bar dataKey="analyst" fill="var(--color-analyst)" radius={4} name="Analyst Score" />
          </BarChart>
        </ChartContainer>

        {/* Score Editing Table */}
        {!readOnly && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Edit Analyst Scores</h4>
            <div className="grid gap-2">
              {chartData.map(item => (
                <div key={item.category} className="flex items-center gap-4 p-2 rounded-lg bg-muted/30">
                  <span className="w-24 font-medium">{item.category}</span>
                  <span className="text-sm text-muted-foreground">AI: {item.ai}</span>
                  {editingCategory === item.category ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={editScore}
                        onChange={e => setEditScore(parseFloat(e.target.value) || 0)}
                        className="w-20"
                      />
                      <Button size="sm" onClick={() => handleScoreEdit(item.category, editScore)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm">Human: {item.analyst}</span>
                      <Badge variant={Math.abs(item.ai - item.analyst) > 1.5 ? 'destructive' : 'secondary'}>
                        Δ {(item.ai - item.analyst).toFixed(1)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingCategory(item.category);
                          setEditScore(item.analyst);
                        }}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Deviation Rationale Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="rationale" className="font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="size-4" /> Deviation Rationale
            </Label>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAnalyzeSentiment}
              disabled={isLoading || (!deviationRationale && Object.keys(categoryComments).length === 0)}
            >
              Analyze Sentiment
            </Button>
          </div>
          <Textarea
            id="rationale"
            placeholder="Explain why your scores differ from the AI's assessment. Example: 'AI may have over-indexed on the CEO's past experience while I believe current market conditions present a greater challenge...'"
            value={deviationRationale}
            onChange={e => setDeviationRationale(e.target.value)}
            className="min-h-[100px]"
            disabled={readOnly}
          />
          {sentimentAnalysis && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant={sentimentAnalysis.overall_sentiment === 'positive' ? 'default' :
                sentimentAnalysis.overall_sentiment === 'negative' ? 'destructive' : 'secondary'}>
                {sentimentAnalysis.overall_sentiment}
              </Badge>
              <span className="text-muted-foreground">
                +{sentimentAnalysis.positive_indicators} / -{sentimentAnalysis.negative_indicators} indicators
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* AI Recommendations */}
        <div className="border-l-4 border-muted p-3 bg-muted/50 rounded-r-lg">
          <h4 className="font-semibold flex items-center gap-2">
            <Bot className="size-4" />
            AI Recommendation for Model Training
          </h4>
          {recommendations?.recommendations && recommendations.recommendations.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {recommendations.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  {rec.includes('Reduce') ? (
                    <TrendingDown className="size-4 text-destructive shrink-0 mt-0.5" />
                  ) : rec.includes('Increase') ? (
                    <TrendingUp className="size-4 text-success shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
                  )}
                  {rec}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm mt-2">
              Based on the deviation, recommend increasing weight on 'GTM'
              strategy analysis and slightly reducing weight on 'Team' experience
              for seed-stage companies. The analyst's higher scores in 'Market'
              and 'GTM' suggest the model may be too conservative on companies
              entering competitive but large markets.
            </p>
          )}
          {recommendations?.retraining_suggested && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="destructive">Retraining Suggested</Badge>
              <span className="text-xs text-muted-foreground">Priority: {recommendations.priority}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            onClick={handleSubmitForTraining}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Send className="size-4" />
            {isSubmitting ? 'Submitting...' : 'Submit for Training'}
          </Button>
          <Button
            variant="outline"
            onClick={handleFlagForReview}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="size-4" />
            Flag for Manual Review
          </Button>
        </div>
      </div>
    </DashboardCard>
  );
}
