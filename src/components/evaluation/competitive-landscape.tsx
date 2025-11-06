'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Target, Shield, Recycle } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useState } from 'react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';

const initialCompetitiveData = {
  competitors: [
    { name: 'Legacy Systems Inc.', category: 'Incumbent', valuation: '$5B', weakness: 'Slow to innovate, poor UI/UX' },
    { name: 'Agile Solutions Co.', category: 'Direct Competitor', valuation: '$50M', weakness: 'Lacks enterprise-grade features' },
    { name: 'NichePlayer AI', category: 'Niche Specialist', valuation: '$20M', weakness: 'Limited market scope' },
  ],
  positioning: "Innovate Inc. positions itself as a premium, AI-native solution contrasting with Legacy Systems' outdated technology. Compared to Agile Solutions, it offers a more robust feature set for enterprise clients. Its main value proposition is its superior AI-driven optimization engine.",
  ma_insights: "Potential acquirers include larger enterprise software companies like Oracle or SAP looking to integrate AI into their supply chain offerings. Legacy Systems Inc. could also be a strategic acquirer to modernize their tech stack, though an acqui-hire is more likely.",
  defensibility_insights: "The primary moat is the patent-pending AI algorithm. Network effects from a growing customer base will further strengthen this position. A key risk is the ability of larger, well-funded competitors to replicate the AI capabilities over time."
};

export function CompetitiveLandscape() {
  const { isEditable } = useEvaluationContext();
  const [data, setData] = useState(initialCompetitiveData);
  
  const handleTextChange = (field: 'positioning' | 'ma_insights' | 'defensibility_insights', value: string) => {
    setData(prev => ({...prev, [field]: value}));
  };

  return (
    <DashboardCard
      title="Competitive Landscape"
      icon={Target}
      description="Top competitors, positioning, and AI-driven M&A and defensibility insights."
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Top Competitors</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competitor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Valuation</TableHead>
                <TableHead>Key Weakness</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.competitors.map((competitor) => (
                <TableRow key={competitor.name}>
                  <TableCell className="font-medium">{competitor.name}</TableCell>
                  <TableCell>{competitor.category}</TableCell>
                  <TableCell>{competitor.valuation}</TableCell>
                  <TableCell className="text-muted-foreground">{competitor.weakness}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <Separator />

        <div className="space-y-4">
            <div>
                 <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Market Positioning</h4>
                {isEditable ? (
                    <Textarea value={data.positioning} onChange={(e) => handleTextChange('positioning', e.target.value)} rows={3} />
                ) : (
                    <p className="text-sm text-muted-foreground">{data.positioning}</p>
                )}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                     <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground"><Recycle /> AI-Generated M&A Insights</h4>
                    {isEditable ? (
                        <Textarea value={data.ma_insights} onChange={(e) => handleTextChange('ma_insights', e.target.value)} rows={4} />
                    ) : (
                        <p className="text-sm text-muted-foreground">{data.ma_insights}</p>
                    )}
                </div>
                 <div>
                     <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground"><Shield /> AI-Generated Defensibility Insights</h4>
                    {isEditable ? (
                        <Textarea value={data.defensibility_insights} onChange={(e) => handleTextChange('defensibility_insights', e.target.value)} rows={4} />
                    ) : (
                        <p className="text-sm text-muted-foreground">{data.defensibility_insights}</p>
                    )}
                </div>
            </div>
        </div>

      </div>
    </DashboardCard>
  );
}
