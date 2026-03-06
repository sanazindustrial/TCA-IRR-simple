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
import { Briefcase, FileSignature, Truck } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useState } from 'react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';

const initialGtmData = {
  pipeline: [
    { stage: 'Prospects', count: 120, value: '$5M' },
    { stage: 'Qualified Leads', count: 45, value: '$2.2M' },
    { stage: 'Proposals Sent', count: 20, value: '$1.5M' },
    { stage: 'Negotiation', count: 8, value: '$800K' },
  ],
  lois: [
    { from: 'Major Health System', value: '$250k Pilot', status: 'Signed' },
    { from: 'Regional Pharma Co.', value: '$1M Annual', status: 'In Negotiation' },
  ],
  distribution_insights: "The current strategy is a direct sales model targeting large enterprise clients. For MedTech applications, the company plans to utilize existing CPT codes for reimbursement (Codes: 99201, 99211), which simplifies market entry. Distribution will initially be handled in-house before exploring channel partnerships in Year 3.",
  interpretation: "The sales pipeline shows healthy top-of-funnel activity, but the conversion rate from 'Qualified' to 'Proposal' needs improvement. The signed LOI from a major health system is a strong validation point. The reimbursement strategy using existing CPT codes is sound and reduces market access risk."
};


export function GtmStrategy() {
  const { isEditable } = useEvaluationContext();
  const [data, setData] = useState(initialGtmData);
  
  const handleTextChange = (field: 'distribution_insights' | 'interpretation', value: string) => {
    setData(prev => ({...prev, [field]: value}));
  };

  return (
    <DashboardCard
      title="Go-to-Market & Commercial Strategy"
      icon={Briefcase}
      description="Customer pipeline, LOIs, distribution, and CPT codes (if applicable)."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Customer Pipeline Summary</h4>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Stage</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.pipeline.map(item => (
                            <TableRow key={item.stage}>
                                <TableCell className="font-medium">{item.stage}</TableCell>
                                <TableCell className="text-right">{item.count}</TableCell>
                                <TableCell className="text-right font-semibold">{item.value}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-2"><FileSignature/>Letters of Intent (LOIs)</h4>
                <div className="space-y-3">
                    {data.lois.map(loi => (
                        <div key={loi.from} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex justify-between items-center">
                                <p className="font-semibold">{loi.from}</p>
                                <Badge variant={loi.status === 'Signed' ? 'success' : 'warning'}>{loi.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{loi.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
         <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground"><Truck/>Distribution & Reimbursement Strategy</h4>
            {isEditable ? (
                <Textarea value={data.distribution_insights} onChange={(e) => handleTextChange('distribution_insights', e.target.value)} rows={3} />
            ) : (
                <p className="text-sm text-muted-foreground">{data.distribution_insights}</p>
            )}
        </div>
        
        <Separator />

        <div>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">AI Interpretation</h4>
            {isEditable ? (
                <Textarea value={data.interpretation} onChange={(e) => handleTextChange('interpretation', e.target.value)} rows={4} className="text-base"/>
            ) : (
                <p className="text-sm text-muted-foreground">{data.interpretation}</p>
            )}
        </div>
      </div>
    </DashboardCard>
  );
}
