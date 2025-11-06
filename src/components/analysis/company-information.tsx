
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useEvaluationContext } from '../evaluation/evaluation-provider';
import { Badge } from '../ui/badge';

type CompanyInformationProps = {
  framework: 'general' | 'medtech';
  onFrameworkChange: (value: 'general' | 'medtech') => void;
};

export function CompanyInformation({
  framework,
  onFrameworkChange,
}: CompanyInformationProps) {
  const { isPrivilegedUser } = useEvaluationContext();

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="text-primary" />
          Company Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input id="company-name" placeholder="Enter company name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry-sector">Evaluation Framework *</Label>
            {isPrivilegedUser ? (
              <>
                <RadioGroup
                  value={framework}
                  onValueChange={onFrameworkChange}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="general"
                      id="general"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="general"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      General Tech / SaaS
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="medtech"
                      id="medtech"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="medtech"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      MedTech / Biotech
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Select the evaluation framework that best fits the company's
                  industry.
                </p>
              </>
            ) : (
                <div className="p-4 border rounded-md bg-muted/50">
                    <p className="font-semibold">{framework === 'general' ? 'General Tech / SaaS' : 'MedTech / Biotech'}</p>
                    <p className="text-xs text-muted-foreground">Framework is automatically selected. Contact an admin to change.</p>
                </div>
            )}
          </div>
        </div>

        {isPrivilegedUser && (
          <div>
            <Label className="font-medium">External Data Sources</Label>
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Configure and manage the 100+ available data sources to enhance
                your analysis.
              </p>
              <Button asChild variant="outline">
                <Link href="/data-sources">
                  <Settings2 className="mr-2" />
                  Manage Sources
                </Link>
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="company-description">
            Company Description (Optional)
          </Label>
          <Textarea
            id="company-description"
            placeholder="Brief description of your company and what it does..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
