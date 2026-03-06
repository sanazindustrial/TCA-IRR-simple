
'use client';

import type { GenerateTcaScorecardOutput } from '@/ai/flows/schemas';
import { DashboardCard } from '@/components/shared/dashboard-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ClipboardList, Info, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import React, { useState } from 'react';
import { useEvaluationContext } from './evaluation-provider';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

type TcaScorecardProps = {
  initialData: GenerateTcaScorecardOutput | null;
};

const flagVariantMap: Record<string, BadgeProps['variant']> = {
  red: 'destructive',
  yellow: 'warning',
  green: 'success',
};

export function TcaScorecard({ initialData }: TcaScorecardProps) {
  const { reportType, isPrivilegedUser, isEditable } = useEvaluationContext();
  const [data, setData] = useState(initialData);
  const [isDeepDiveOpen, setDeepDiveOpen] = useState(false);

  if (!data) {
    return null;
  }
  
  const handleCategoryChange = (
    index: number,
    field: 'strengths' | 'concerns' | 'interpretation' | 'notes' | 'aiRecommendation',
    value: string
  ) => {
    if (!data) return;
    const newCategories = [...data.categories];
    (newCategories[index] as any)[field] = value;
    setData((prev) => (prev ? { ...prev, categories: newCategories } : null));
  };

  const showExtendedNotes = reportType === 'dd' && isPrivilegedUser;


  return (
    <DashboardCard
      title="TCA Scorecard"
      icon={ClipboardList}
      description="Central evaluation across fundamental categories."
    >
      <div className="grid grid-cols-1">
        <div className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] pl-4">Category</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Weight</TableHead>
                  <TableHead className="text-center">Weighted</TableHead>
                  <TableHead className="text-center">Flag</TableHead>
                  <TableHead>PESTEL</TableHead>
                  {showExtendedNotes && <TableHead>DD Notes</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.categories.map((item, index) => (
                    <TableRow key={item.category}>
                      <TableCell className="font-medium pl-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help flex items-center gap-1">
                                {item.category}
                                <Info className="size-3 text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{item.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-center font-bold',
                        )}
                      >
                        {item.rawScore.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {item.weight}%
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {item.weightedScore.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={flagVariantMap[item.flag]}>
                          {item.flag}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {item.pestel}
                      </TableCell>
                      {showExtendedNotes && (
                          <TableCell>
                              {isEditable ? (
                                  <Textarea 
                                      placeholder="Add DD notes..."
                                      defaultValue={(item as any).notes || ''}
                                      onChange={(e) => handleCategoryChange(index, 'notes', e.target.value)}
                                      className="text-xs"
                                      rows={2}
                                  />
                              ) : (
                                  <p className="text-xs text-muted-foreground">{(item as any).notes || 'No notes added.'}</p>
                              )}
                          </TableCell>
                      )}
                    </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
      </div>
      
      {showExtendedNotes && (
        <Collapsible open={isDeepDiveOpen} onOpenChange={setDeepDiveOpen} className="mt-6">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full">
              {isDeepDiveOpen ? <ChevronUp className="mr-2" /> : <ChevronDown className="mr-2" />}
              {isDeepDiveOpen ? 'Hide' : 'Show'} Category-by-Category Analysis (Extended Notes)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 animate-in fade-in-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.categories.map((item, index) => (
                  <Card key={item.category} className="flex flex-col">
                      <CardHeader>
                          <CardTitle className="text-lg">{item.category}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 flex-grow flex flex-col">
                          <div>
                              <h4 className="font-semibold text-success">
                              Strengths
                              </h4>
                              {isEditable ? (
                              <Textarea
                                  value={item.strengths}
                                  onChange={(e) =>
                                  handleCategoryChange(index, 'strengths', e.target.value)
                                  }
                                  rows={3}
                                  className="text-sm mt-1"
                              />
                              ) : (
                              <p className="text-sm text-muted-foreground">
                                  {item.strengths}
                              </p>
                              )}
                          </div>
                          <div>
                              <h4 className="font-semibold text-destructive">
                              Concerns
                              </h4>
                              {isEditable ? (
                              <Textarea
                                  value={item.concerns}
                                  onChange={(e) =>
                                  handleCategoryChange(index, 'concerns', e.target.value)
                                  }
                                  rows={3}
                                  className="text-sm mt-1"
                              />
                              ) : (
                              <p className="text-sm text-muted-foreground">
                                  {item.concerns}
                              </p>
                              )}
                          </div>
                          <div className="border-t-2 border-accent/50 pt-3">
                              <h4 className="font-semibold text-accent">
                              AI Interpretation
                              </h4>
                              {isEditable ? (
                              <Textarea
                                  value={item.interpretation}
                                  onChange={(e) =>
                                  handleCategoryChange(
                                      index,
                                      'interpretation',
                                      e.target.value
                                  )
                                  }
                                  rows={4}
                                  className="text-sm mt-1 bg-transparent border-0 p-0 focus-visible:ring-0"
                              />
                              ) : (
                              <p className="text-sm text-muted-foreground">
                                  {item.interpretation}
                              </p>
                              )}
                          </div>
                           <div className="border-t-2 border-primary/50 pt-3 mt-auto">
                              <h4 className="font-semibold text-primary flex items-center gap-2">
                                <Bot />
                                AI Recommendation
                              </h4>
                              {isEditable ? (
                              <Textarea
                                  value={(item as any).aiRecommendation || ''}
                                  onChange={(e) =>
                                  handleCategoryChange(
                                      index,
                                      'aiRecommendation',
                                      e.target.value
                                  )
                                  }
                                  rows={3}
                                  className="text-sm mt-1 bg-transparent border-0 p-0 focus-visible:ring-0"
                              />
                              ) : (
                              <p className="text-sm text-muted-foreground">
                                  {(item as any).aiRecommendation || 'No recommendation available.'}
                              </p>
                              )}
                          </div>
                      </CardContent>
                  </Card>
              ))}
          </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </DashboardCard>
  );
}
