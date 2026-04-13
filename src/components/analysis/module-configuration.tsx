
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Settings, ChevronRight, PlusCircle, MessageSquareQuote, SlidersHorizontal } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export type ModuleConfig = {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  version?: string;
  category?: 'core' | 'analysis' | 'specialized' | 'review' | 'medtech' | 'strategic' | 'compliance';
  requiredRole?: ('user' | 'admin' | 'analyst')[];
  reportTypes?: ('triage' | 'dd')[];
  frameworks?: ('general' | 'medtech')[];
};

export type ReportType = 'triage' | 'dd' | 'ssd' | 'comprehensive';
export type ModuleReportType = 'triage' | 'dd';
export type Framework = 'general' | 'medtech';

type Module = ModuleConfig;

const generalModules: Module[] = [
  { id: 'tca', name: 'TCA Scorecard', description: 'Central evaluation across fundamental categories.', status: 'active', version: '2.1' },
  { id: 'risk', name: 'Risk Flags', description: 'Risk analysis across 14 domains.', status: 'active', version: '1.8' },
  { id: 'benchmark', name: 'Benchmark Comparison', description: 'Performance vs. sector averages.', status: 'active', version: '1.5' },
  { id: 'macro', name: 'Macro Trend Alignment', description: 'PESTEL analysis and trend scores.', status: 'active', version: '1.2' },
  { id: 'gap', name: 'Gap Analysis', description: 'Identify performance gaps.', status: 'active', version: '2.0' },
  { id: 'growth', name: 'Growth Classifier', description: 'Predict growth potential.', status: 'active', version: '3.1' },
  { id: 'funderFit', name: 'Funder Fit Analysis', description: 'Investor matching & readiness.', status: 'active', version: '1.0' },
  { id: 'team', name: 'Team Assessment', description: 'Analyze founder and team strength.', status: 'active', version: '1.4' },
  { id: 'strategicFit', name: 'Strategic Fit Matrix', description: 'Align with strategic pathways.', status: 'active', version: '1.1' },
];

const medtechModules: Module[] = [
  { id: 'tca', name: 'TCA Scorecard (MedTech)', description: 'MedTech-focused category evaluation.', status: 'active', version: '2.1' },
  { id: 'risk', name: 'Risk Flags (Regulatory)', description: 'Regulatory and compliance risk analysis.', status: 'active', version: '1.8' },
  { id: 'benchmark', name: 'Clinical Benchmark', description: 'Compare against clinical trial data.', status: 'active', version: '1.5' },
  { id: 'macro', name: 'Macro Trend Alignment', description: 'PESTEL analysis and FDA trends.', status: 'active', version: '1.2' },
  { id: 'gap', name: 'Gap Analysis', description: 'Clinical/Regulatory performance gaps.', status: 'active', version: '2.0' },
  { id: 'growth', name: 'Growth Classifier', description: 'MedTech growth potential prediction.', status: 'active', version: '3.1' },
  { id: 'funderFit', name: 'Funder Fit Analysis', description: 'HealthTech investor matching.', status: 'active', version: '1.0' },
  { id: 'team', name: 'Team Assessment', description: 'Medical/Technical team evaluation.', status: 'active', version: '1.4' },
  { id: 'strategicFit', name: 'Strategic Fit Matrix', description: 'MedTech strategic pathways.', status: 'active', version: '1.1' },
];

type ModuleConfigurationProps = {
  framework: 'general' | 'medtech';
};

export function ModuleConfiguration({ framework }: ModuleConfigurationProps) {
  const [modules, setModules] = useState<Module[]>(generalModules);

  useEffect(() => {
    const newModules = framework === 'medtech' ? medtechModules : generalModules;
    setModules(newModules);
  }, [framework]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Settings className="text-primary" />
            Module Configuration
          </CardTitle>
          <CardDescription className="mt-2">
            Configure the analysis modules for the selected framework. The following are quick links to the most common modules.
          </CardDescription>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/evaluation/modules">
            <SlidersHorizontal className="mr-2" />
            Module Control Deck
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <Link
              href={`/analysis/modules/${mod.id}`}
              key={mod.id}
              className="block rounded-lg border p-4 transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div className="flex justify-between items-start">
                <div className='flex-1'>
                  <h3 className="font-semibold text-sm">{mod.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
                </div>
                <ChevronRight className="size-5 text-muted-foreground shrink-0 ml-2" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
