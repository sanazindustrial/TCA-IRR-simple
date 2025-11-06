'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { FileSignature, FileText } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useState } from 'react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';

const initialData = {
  valuation: "Based on comparable companies in the AI SaaS sector, an ideal pre-money valuation would be in the $8M - $12M range. This is supported by the strong team and technology, but tempered by the early revenue stage.",
  dilution: "Founders should aim for a dilution of 15-20% in this round. A SAFE note with a valuation cap of $12M and a 20% discount is recommended to align interests. The option pool should be increased to 15% pre-money to account for future key hires.",
  notes: "Key terms to negotiate include the pro-rata rights, board composition (aim for a 3-person board initially), and ensuring the liquidation preference is non-participating. The AI-generated terms provide a solid baseline for negotiation."
};

export function TermSheetTriggerAnalysis() {
  const { isEditable } = useEvaluationContext();
  const [data, setData] = useState(initialData);

  const handleTextChange = (field: 'valuation' | 'dilution' | 'notes', value: string) => {
    setData(prev => ({...prev, [field]: value}));
  };

  return (
    <DashboardCard
      title="Term Sheet Trigger Analysis"
      icon={FileSignature}
      description="Ideal valuation, dilution logic, and SAFE/Equity notes."
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Ideal Valuation</h4>
          {isEditable ? (
            <Textarea value={data.valuation} onChange={e => handleTextChange('valuation', e.target.value)} rows={3}/>
          ) : (
            <p className="text-sm text-muted-foreground">{data.valuation}</p>
          )}
        </div>
        
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Dilution & Structure Logic</h4>
          {isEditable ? (
            <Textarea value={data.dilution} onChange={e => handleTextChange('dilution', e.target.value)} rows={3}/>
          ) : (
            <p className="text-sm text-muted-foreground">{data.dilution}</p>
          )}
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Key SAFE/Equity Notes</h4>
          {isEditable ? (
            <Textarea value={data.notes} onChange={e => handleTextChange('notes', e.target.value)} rows={3}/>
          ) : (
            <p className="text-sm text-muted-foreground">{data.notes}</p>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
