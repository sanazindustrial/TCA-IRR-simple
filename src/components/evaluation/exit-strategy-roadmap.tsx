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
import { DoorOpen, TrendingUp, Handshake, Building } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useState } from 'react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';

const initialExitData = {
  multiples: [
    { sector: 'AI SaaS', multiple: '10-15x ARR' },
    { sector: 'Supply Chain Tech', multiple: '6-8x ARR' },
  ],
  idealAcquirers: [
    { name: 'Oracle', rationale: 'Strengthen supply chain offerings.' },
    { name: 'SAP', rationale: 'Expand AI capabilities in ERP.' },
    { name: 'Microsoft', rationale: 'Integrate into Azure/Dynamics 365.' },
  ],
  maLandscape: "The M&A landscape for AI-driven vertical SaaS is active. Recent acquisitions in the space show a strong appetite for companies with proprietary data and proven ROI. Key acquirers are large enterprise software vendors seeking to modernize their platforms.",
  ipoViability: "An IPO is a viable long-term option but is unlikely in the next 3-5 years. The company would need to achieve significant scale ($100M+ ARR) and demonstrate consistent profitability. Current market conditions for tech IPOs are cautious.",
  interpretation: "The company has multiple clear exit paths. A strategic acquisition by a major enterprise software player is the most likely and lucrative outcome in the medium term. The key to maximizing exit value will be demonstrating strong, defensible revenue growth and continued technological innovation."
};


export function ExitStrategyRoadmap() {
  const { isEditable } = useEvaluationContext();
  const [data, setData] = useState(initialExitData);
  
  const handleTextChange = (field: 'maLandscape' | 'ipoViability' | 'interpretation', value: string) => {
    setData(prev => ({...prev, [field]: value}));
  };

  return (
    <DashboardCard
      title="Exit Strategy Roadmap"
      icon={DoorOpen}
      description="M&A landscape, IPO viability, exit multiples, and ideal acquirers."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground"><TrendingUp/>Exit Multiples</h4>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sector</TableHead>
                            <TableHead>Typical Multiple</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.multiples.map(item => (
                            <TableRow key={item.sector}>
                                <TableCell className="font-medium">{item.sector}</TableCell>
                                <TableCell className="font-semibold">{item.multiple}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground"><Building/>Ideal Acquirers</h4>
                 <div className="space-y-2">
                    {data.idealAcquirers.map(item => (
                        <div key={item.name} className="p-2 bg-muted/50 rounded-lg">
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.rationale}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                 <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground"><Handshake/>M&A Landscape</h4>
                {isEditable ? (
                    <Textarea value={data.maLandscape} onChange={(e) => handleTextChange('maLandscape', e.target.value)} rows={4} />
                ) : (
                    <p className="text-sm text-muted-foreground">{data.maLandscape}</p>
                )}
            </div>
             <div>
                 <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground"><TrendingUp/>IPO Viability</h4>
                {isEditable ? (
                    <Textarea value={data.ipoViability} onChange={(e) => handleTextChange('ipoViability', e.target.value)} rows={4} />
                ) : (
                    <p className="text-sm text-muted-foreground">{data.ipoViability}</p>
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
