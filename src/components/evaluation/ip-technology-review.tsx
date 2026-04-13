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
import { FileText, Unlock, Shield } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useState } from 'react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';

const initialIpData = {
  patents: [
    { id: 'US20230012345A1', title: 'AI-Driven Predictive Logistics Engine', status: 'Pending', type: 'Utility' },
    { id: 'USD0987654S1', title: 'Dashboard UI for Supply Chain', status: 'Granted', type: 'Design' },
  ],
  fto_analysis: "An initial Freedom to Operate (FTO) search reveals a moderately crowded landscape. While several patents exist for general supply chain optimization, Innovate Inc.'s specific AI-driven approach appears novel. A more detailed FTO analysis by legal counsel is recommended before a major funding round.",
  barriers_to_entry: "The primary barrier to entry is the complexity and proprietary nature of the core algorithm. Replicating its performance would require significant R&D investment. Secondary barriers include network effects from an expanding customer base and the team's domain expertise.",
  interpretation: "The company holds a strong IP position for its core technology with a pending utility patent. The granted design patent provides a secondary layer of protection. While the FTO landscape is not entirely clear, the novel AI approach provides a solid foundation for defensibility. The technical complexity serves as a significant barrier to entry for new competitors."
};


export function IpTechnologyReview() {
  const { isEditable } = useEvaluationContext();
  const [data, setData] = useState(initialIpData);
  
  const handleTextChange = (field: 'fto_analysis' | 'barriers_to_entry' | 'interpretation', value: string) => {
    setData(prev => ({...prev, [field]: value}));
  };

  return (
    <DashboardCard
      title="IP & Technology Review"
      icon={FileText}
      description="Patent filings, freedom to operate, and barriers to entry."
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Patent Status</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patent ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.patents.map((patent) => (
                <TableRow key={patent.id}>
                  <TableCell className="font-mono text-xs">{patent.id}</TableCell>
                  <TableCell className="font-medium">{patent.title}</TableCell>
                  <TableCell>{patent.type}</TableCell>
                  <TableCell>
                      <Badge variant={patent.status === 'Granted' ? 'success' : 'warning'}>{patent.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                 <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground"><Unlock/>Freedom to Operate (FTO) Analysis</h4>
                {isEditable ? (
                    <Textarea value={data.fto_analysis} onChange={(e) => handleTextChange('fto_analysis', e.target.value)} rows={5} />
                ) : (
                    <p className="text-sm text-muted-foreground">{data.fto_analysis}</p>
                )}
            </div>
             <div>
                 <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground"><Shield/>Barriers to Entry</h4>
                {isEditable ? (
                    <Textarea value={data.barriers_to_entry} onChange={(e) => handleTextChange('barriers_to_entry', e.target.value)} rows={5} />
                ) : (
                    <p className="text-sm text-muted-foreground">{data.barriers_to_entry}</p>
                )}
            </div>
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
