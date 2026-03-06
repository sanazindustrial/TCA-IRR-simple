'use client';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ShieldCheck, Calendar, AlertTriangle } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useState } from 'react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';

const initialRegulatoryData = {
  status: {
    fda: '510(k) Cleared',
    ce: 'Pending',
  },
  milestones: [
    { name: 'Pre-Submission Meeting', status: 'Completed', date: 'Q2 2024' },
    { name: '510(k) Submission', status: 'Completed', date: 'Q3 2024' },
    { name: 'CE Mark Submission', status: 'In Progress', date: 'Q4 2024 (est.)' },
    { name: 'Post-Market Surveillance Plan', status: 'Planned', date: 'Q1 2025 (est.)' },
  ],
  riskTimelineInsights: "The company has successfully navigated the 510(k) process, a significant de-risking event. The primary regulatory risk shifts to achieving the CE mark for European market access. The timeline for this appears realistic, but any delays could impact revenue projections for FY2025. Post-market surveillance will require dedicated resources."
};

const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'completed':
            return 'success';
        case 'in progress':
            return 'warning';
        case 'pending':
            return 'default';
        default:
            return 'secondary';
    }
}

export function RegulatoryComplianceReview() {
  const { isEditable } = useEvaluationContext();
  const [data, setData] = useState(initialRegulatoryData);
  
  const handleInsightsChange = (value: string) => {
    setData(prev => ({...prev, riskTimelineInsights: value}));
  };

  return (
    <DashboardCard
      title="Regulatory / Compliance Review"
      icon={ShieldCheck}
      description="FDA/CE status, regulatory milestones, risk & timeline."
    >
      <div className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">FDA Status</h4>
                <Badge variant={data.status.fda.includes('Cleared') ? 'success' : 'warning'}>{data.status.fda}</Badge>
            </div>
             <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">CE Mark Status</h4>
                <Badge variant={data.status.ce.includes('Pending') ? 'warning' : 'success'}>{data.status.ce}</Badge>
            </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground"><Calendar/>Key Milestones & Timeline</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date / ETA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.milestones.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                      <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <Separator />

        <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground"><AlertTriangle/>Risk & Timeline Insights</h4>
            {isEditable ? (
                <Textarea value={data.riskTimelineInsights} onChange={(e) => handleInsightsChange(e.target.value)} rows={4} className="text-base"/>
            ) : (
                <p className="text-sm text-muted-foreground">{data.riskTimelineInsights}</p>
            )}
        </div>
      </div>
    </DashboardCard>
  );
}
