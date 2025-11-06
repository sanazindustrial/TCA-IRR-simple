
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const Step = ({ num, title, description, badgeText }: { num: string, title: string, description: string, badgeText?: string }) => (
    <div className="flex items-start gap-4">
        <div className="flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">{num}</div>
        <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
                {title}
                {badgeText && <Badge variant="outline">{badgeText}</Badge>}
            </h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </div>
)

export default function GettingStartedGuidePage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Link href="/dashboard/help" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="size-4" />
            Back to Help & Support
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
          Getting Started Guide
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
          A complete walkthrough of your first analysis.
        </p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>This guide will walk you through the process of running your first startup evaluation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <Step 
                num="1"
                title="Navigate to New Evaluation"
                description='From the main dashboard, click the "New Evaluation" or "Run New Analysis" button. This will take you to the Analysis Setup page where you will begin the process.'
            />
            <Step 
                num="2"
                title="Enter Company Information"
                description="Fill in the company's name and select the appropriate Evaluation Framework (e.g., General Tech or MedTech). This choice determines which AI models and weights are used."
            />
             <Step 
                num="3"
                title="Submit Documents"
                description="Upload all relevant documents, such as pitch decks, financial statements, business plans, and market research. You can upload files, import from URLs, or paste raw text."
            />
            <Step 
                num="4"
                title="Configure Analysis Modules"
                description="If you have the appropriate permissions, you can customize the nine analysis modules (TCA, Risk, Benchmarking, etc.) to tailor the evaluation to your specific needs."
                badgeText="Admin/Reviewer Only"
            />
             <Step 
                num="5"
                title="Run the Analysis"
                description='Once all information is entered, click the "Run Analysis" button. The AI will process the data, which may take a few moments. You will see a loading indicator during this time.'
            />
             <Step 
                num="6"
                title="Review the Report"
                description="After the analysis is complete, you can generate and view the report. This will provide a comprehensive breakdown of the startup's performance across all configured modules."
            />
        </CardContent>
      </Card>
    </div>
  );
}
