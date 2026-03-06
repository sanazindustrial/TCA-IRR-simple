
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Settings2, Building2, MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useEvaluationContext, type CompanyInformationData } from '../evaluation/evaluation-provider';
import { Badge } from '../ui/badge';
import { useState, useCallback } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

type CompanyInformationProps = {
  framework: 'general' | 'medtech';
  onFrameworkChange: (value: 'general' | 'medtech') => void;
};

// Industry verticals
const INDUSTRY_VERTICALS = [
  'Software/SaaS',
  'FinTech',
  'HealthTech/MedTech',
  'BioTech',
  'E-commerce',
  'EdTech',
  'CleanTech/GreenTech',
  'PropTech',
  'AgTech',
  'AI/ML',
  'Cybersecurity',
  'IoT',
  'Hardware',
  'Consumer Goods',
  'Enterprise Software',
  'Other',
];

// Development stages
const DEVELOPMENT_STAGES = [
  'Pre-seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C+',
  'Growth',
  'Pre-IPO',
];

// Business models
const BUSINESS_MODELS = [
  'B2B SaaS',
  'B2C SaaS',
  'Marketplace',
  'E-commerce',
  'Platform',
  'Subscription',
  'Freemium',
  'Transaction Fee',
  'Licensing',
  'Hardware + Software',
  'Professional Services',
  'Hybrid',
  'Other',
];

// Default company info
const DEFAULT_COMPANY_INFO: CompanyInformationData = {
  companyName: '',
  website: '',
  industryVertical: '',
  developmentStage: '',
  businessModel: '',
  country: '',
  state: '',
  city: '',
  oneLineDescription: '',
  companyDescription: '',
  productDescription: '',
  pitchDeckPath: '',
  legalName: '',
  numberOfEmployees: null,
};

export function CompanyInformation({
  framework,
  onFrameworkChange,
}: CompanyInformationProps) {
  const { 
    isPrivilegedUser, 
    companyName, 
    setCompanyNameAction, 
    companyDescription, 
    setCompanyDescriptionAction,
    companyInfo,
    setCompanyInfoAction,
  } = useEvaluationContext();

  const [isExpanded, setIsExpanded] = useState(false);
  
  // Use extended company info if available, fallback to basic fields
  const currentInfo = companyInfo || DEFAULT_COMPANY_INFO;

  const updateCompanyInfo = useCallback((field: keyof CompanyInformationData, value: string | number | null) => {
    if (setCompanyInfoAction) {
      setCompanyInfoAction(prev => ({
        ...prev,
        [field]: value,
      }));
    }
    // Also update legacy fields for backward compatibility
    if (field === 'companyName' && setCompanyNameAction) {
      setCompanyNameAction(value as string);
    }
    if (field === 'companyDescription' && setCompanyDescriptionAction) {
      setCompanyDescriptionAction(value as string);
    }
  }, [setCompanyInfoAction, setCompanyNameAction, setCompanyDescriptionAction]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="text-primary" />
          Company Information
          <Badge variant="outline" className="ml-2 text-xs">SSD Compatible</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              placeholder="Enter company name"
              value={companyName || currentInfo.companyName || ''}
              onChange={(e) => {
                updateCompanyInfo('companyName', e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legal-name">Legal Name</Label>
            <Input
              id="legal-name"
              placeholder="Legal entity name (if different)"
              value={currentInfo.legalName || ''}
              onChange={(e) => updateCompanyInfo('legalName', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://www.example.com"
              value={currentInfo.website || ''}
              onChange={(e) => updateCompanyInfo('website', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employees">Number of Employees</Label>
            <Input
              id="employees"
              type="number"
              placeholder="e.g., 25"
              value={currentInfo.numberOfEmployees || ''}
              onChange={(e) => updateCompanyInfo('numberOfEmployees', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
        </div>

        {/* Industry & Stage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="industry">Industry Vertical *</Label>
            <Select 
              value={currentInfo.industryVertical || ''} 
              onValueChange={(val) => updateCompanyInfo('industryVertical', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_VERTICALS.map(industry => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage">Development Stage *</Label>
            <Select 
              value={currentInfo.developmentStage || ''} 
              onValueChange={(val) => updateCompanyInfo('developmentStage', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {DEVELOPMENT_STAGES.map(stage => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="business-model">Business Model *</Label>
            <Select 
              value={currentInfo.businessModel || ''} 
              onValueChange={(val) => updateCompanyInfo('businessModel', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_MODELS.map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location *
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="City"
              value={currentInfo.city || ''}
              onChange={(e) => updateCompanyInfo('city', e.target.value)}
            />
            <Input
              placeholder="State/Province"
              value={currentInfo.state || ''}
              onChange={(e) => updateCompanyInfo('state', e.target.value)}
            />
            <Input
              placeholder="Country"
              value={currentInfo.country || ''}
              onChange={(e) => updateCompanyInfo('country', e.target.value)}
            />
          </div>
        </div>

        {/* One-liner & Descriptions */}
        <div className="space-y-2">
          <Label htmlFor="one-liner">One-Line Description *</Label>
          <Input
            id="one-liner"
            placeholder="A brief one-sentence description of your company"
            value={currentInfo.oneLineDescription || ''}
            onChange={(e) => updateCompanyInfo('oneLineDescription', e.target.value)}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            {(currentInfo.oneLineDescription || '').length}/200 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-description">
            Company Description *
          </Label>
          <Textarea
            id="company-description"
            placeholder="Detailed description of your company and what it does..."
            rows={4}
            value={companyDescription || currentInfo.companyDescription || ''}
            onChange={(e) => {
              updateCompanyInfo('companyDescription', e.target.value);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-description">Product Description *</Label>
          <Textarea
            id="product-description"
            placeholder="Describe your product or service offering in detail..."
            rows={3}
            value={currentInfo.productDescription || ''}
            onChange={(e) => updateCompanyInfo('productDescription', e.target.value)}
          />
        </div>

        {/* Framework Selection */}
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
      </CardContent>
    </Card>
  );
}
