
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

// Required fields for validation
const REQUIRED_FIELDS = [
  'companyName',
  'industryVertical',
  'developmentStage',
  'businessModel',
  'oneLineDescription',
  'companyDescription',
  'productDescription',
] as const;

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
  const [showValidation, setShowValidation] = useState(false);

  // Use extended company info if available, fallback to basic fields
  const currentInfo = companyInfo || DEFAULT_COMPANY_INFO;

  // Validation helper
  const isFieldEmpty = (field: keyof CompanyInformationData): boolean => {
    const value = field === 'companyName' ? (companyName || currentInfo.companyName) :
      field === 'companyDescription' ? (companyDescription || currentInfo.companyDescription) :
        currentInfo[field];
    return !value || (typeof value === 'string' && value.trim() === '');
  };

  const getMissingFields = (): string[] => {
    return REQUIRED_FIELDS.filter(field => isFieldEmpty(field)).map(field =>
      field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
    );
  };

  const missingFields = getMissingFields();
  const hasValidationErrors = missingFields.length > 0;

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
    // Show validation after first edit
    if (!showValidation) {
      setShowValidation(true);
    }
  }, [setCompanyInfoAction, setCompanyNameAction, setCompanyDescriptionAction, showValidation]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="text-primary" />
          Company Information
          <Badge variant="outline" className="ml-2 text-xs">Startup Steroid Compatible</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Validation Warning */}
        {showValidation && hasValidationErrors && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-amber-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Missing Required Fields ({missingFields.length})</span>
            </div>
            <p className="text-amber-700 text-sm mt-2">
              Please fill in: {missingFields.map(f => f.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())).join(', ')}
            </p>
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              name="companyName"
              placeholder="Enter company name"
              value={companyName || currentInfo.companyName || ''}
              onChange={(e) => {
                updateCompanyInfo('companyName', e.target.value);
              }}
              className={showValidation && isFieldEmpty('companyName') ? 'border-red-500 focus:border-red-500' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legal-name">Legal Name</Label>
            <Input
              id="legal-name"
              name="legalName"
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
              name="website"
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
              name="numberOfEmployees"
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
              name="industryVertical"
              value={currentInfo.industryVertical || ''}
              onValueChange={(val) => updateCompanyInfo('industryVertical', val)}
            >
              <SelectTrigger id="industry" className={showValidation && isFieldEmpty('industryVertical') ? 'border-red-500' : ''}>
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
              name="developmentStage"
              value={currentInfo.developmentStage || ''}
              onValueChange={(val) => updateCompanyInfo('developmentStage', val)}
            >
              <SelectTrigger id="stage" className={showValidation && isFieldEmpty('developmentStage') ? 'border-red-500' : ''}>
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
              name="businessModel"
              value={currentInfo.businessModel || ''}
              onValueChange={(val) => updateCompanyInfo('businessModel', val)}
            >
              <SelectTrigger id="business-model" className={showValidation && isFieldEmpty('businessModel') ? 'border-red-500' : ''}>
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
              id="city"
              name="city"
              placeholder="City"
              value={currentInfo.city || ''}
              onChange={(e) => updateCompanyInfo('city', e.target.value)}
            />
            <Input
              id="state"
              name="state"
              placeholder="State/Province"
              value={currentInfo.state || ''}
              onChange={(e) => updateCompanyInfo('state', e.target.value)}
            />
            <Input
              id="country"
              name="country"
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
            name="oneLineDescription"
            placeholder="A brief one-sentence description of your company"
            value={currentInfo.oneLineDescription || ''}
            onChange={(e) => updateCompanyInfo('oneLineDescription', e.target.value)}
            maxLength={200}
            className={showValidation && isFieldEmpty('oneLineDescription') ? 'border-red-500 focus:border-red-500' : ''}
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
            name="companyDescription"
            placeholder="Detailed description of your company and what it does..."
            rows={4}
            value={companyDescription || currentInfo.companyDescription || ''}
            onChange={(e) => {
              updateCompanyInfo('companyDescription', e.target.value);
            }}
            className={showValidation && isFieldEmpty('companyDescription') ? 'border-red-500 focus:border-red-500' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-description">Product Description *</Label>
          <Textarea
            id="product-description"
            name="productDescription"
            placeholder="Describe your product or service offering in detail..."
            rows={3}
            value={currentInfo.productDescription || ''}
            onChange={(e) => updateCompanyInfo('productDescription', e.target.value)}
            className={showValidation && isFieldEmpty('productDescription') ? 'border-red-500 focus:border-red-500' : ''}
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
