
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

type Module = {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
};

const generalModules: Module[] = [
  { id: 'tca', name: 'TCA Scorecard', description: 'Central evaluation across fundamental categories.', status: 'active' },
  { id: 'risk', name: 'Risk Flags', description: 'Risk analysis across 14 domains.', status: 'active' },
  { id: 'benchmark', name: 'Benchmark Comparison', description: 'Performance vs. sector averages.', status: 'active' },
];

const medtechModules: Module[] = [
  { id: 'tca', name: 'TCA Scorecard (MedTech)', description: 'MedTech-focused category evaluation.', status: 'active' },
  { id: 'risk', name: 'Risk Flags (Regulatory Focus)', description: 'Regulatory and compliance risk.', status: 'active' },
  { id: 'benchmark', name: 'Clinical Trial Benchmark', description: 'Compare against clinical trial data.', status: 'active' },
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
