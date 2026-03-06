
'use client';
import type { GenerateRiskFlagsAndMitigationOutput } from '@/ai/flows/schemas';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { ShieldAlert, ChevronDown, ChevronRight } from 'lucide-react';
import { CardTitle } from '../ui/card';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

const flagVariantMap: Record<string, BadgeProps['variant']> = {
  red: 'destructive',
  yellow: 'warning',
  green: 'success',
};

type RiskFlagsProps = {
  initialData: GenerateRiskFlagsAndMitigationOutput;
};

const RiskRow = ({ risk, isEditable, onFieldChange }: { risk: any, isEditable: boolean, onFieldChange: (field: any, value: string) => void}) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <TableRow onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                <TableCell>
                    <div className="flex items-center justify-center">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                </TableCell>
                <TableCell className="font-medium">{risk.domain}</TableCell>
                <TableCell>
                    <Badge variant={flagVariantMap[risk.flag] || 'default'}>
                        {risk.flag}
                    </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground truncate max-w-xs">{risk.trigger}</TableCell>
                <TableCell>{risk.impact}</TableCell>
                <TableCell className="text-muted-foreground truncate max-w-xs">{risk.mitigation}</TableCell>
            </TableRow>
             {isOpen && (
                <TableRow>
                    <TableCell colSpan={6} className="p-0">
                         <div className="p-4 bg-muted/30 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-muted/50 p-3 rounded-lg">
                                <p className="font-semibold text-muted-foreground">Description</p>
                                <p>{risk.description}</p>
                                </div>
                                 <div className="bg-muted/50 p-3 rounded-lg">
                                <p className="font-semibold text-muted-foreground">Thresholds</p>
                                <p>{risk.thresholds}</p>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-lg col-span-2">
                                    <p className="font-semibold text-accent">AI Recommendation</p>
                                    {isEditable ? (
                                        <Textarea value={risk.aiRecommendation} onChange={(e) => onFieldChange('aiRecommendation', e.target.value)} rows={2} className="text-sm mt-1 bg-transparent border-0"/>
                                    ) : (
                                        <p className="text-sm text-accent-foreground/80">
                                        {risk.aiRecommendation}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};


export function RiskFlags({ initialData }: RiskFlagsProps) {
  const { isEditable } = useEvaluationContext();
  const [data, setData] = useState(initialData);

  if (!data) {
    return null;
  }

  const handleFieldChange = (
    index: number,
    field: 'mitigation' | 'aiRecommendation',
    value: string
  ) => {
    const newRiskFlags = [...data.riskFlags];
    (newRiskFlags[index] as any)[field] = value;
    setData((prev) => (prev ? { ...prev, riskFlags: newRiskFlags } : null));
  };

  const handleSummaryChange = (value: string) => {
    setData((prev) => (prev ? { ...prev, riskSummary: value } : null));
  };

  return (
    <DashboardCard
      title="Final Flag Summary + Risk Table"
      icon={ShieldAlert}
      description="An extended version of the triage risk table with full details."
    >
      <div className="p-4 bg-muted/50 rounded-lg mb-6">
        <CardTitle className="font-semibold text-base mb-2 flex items-center gap-2">
          <ShieldAlert className="text-warning" />
          Flag Analysis Narrative
        </CardTitle>
        {isEditable ? (
          <Textarea
            value={data.riskSummary}
            onChange={(e) => handleSummaryChange(e.target.value)}
            rows={3}
            className="text-base"
          />
        ) : (
          <p className="text-sm text-muted-foreground">{data.riskSummary}</p>
        )}
      </div>

      <Table>
        <TableHeader>
            <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Flag</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Mitigation</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {data.riskFlags.map((risk, index) => (
                <RiskRow 
                    key={risk.domain}
                    risk={risk} 
                    isEditable={isEditable}
                    onFieldChange={(field, value) => handleFieldChange(index, field, value)}
                />
            ))}
        </TableBody>
      </Table>
      
    </DashboardCard>
  );
}
