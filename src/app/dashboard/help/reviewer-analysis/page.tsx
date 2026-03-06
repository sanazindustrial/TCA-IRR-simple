
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UploadCloud, MessageSquareQuote, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

const Step = ({ num, title, description, link }: { num: string, title: string, description: string, link?: { href: string; text: string } }) => (
    <div className="flex items-start gap-4">
        <div className="flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">{num}</div>
        <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
            {link && (
                <Link href={link.href} className="text-sm text-primary hover:underline mt-1 inline-block">
                    {link.text}
                </Link>
            )}
        </div>
    </div>
)

export default function ReviewerAnalysisGuidePage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Link href="/dashboard/help" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="size-4" />
            Back to Help & Support
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
          Guide: Reviewer Analysis & Manual Input
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
          Learn how to add qualitative insights and run deeper analysis as a reviewer.
        </p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquareQuote /> Performing a Manual Review</CardTitle>
            <CardDescription>This guide explains how to use the "Reviewer Analysis" page to enrich the AI's evaluation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <Step
                num="1"
                title="Start a Review from the Hub"
                description="Navigate to the 'Reviewer Hub' from the sidebar. Find a 'Pending Review' assignment and click 'Start Review'. This will take you to the main Reviewer Analysis page."
                link={{ href: "/dashboard/reviewer", text: "Go to Reviewer Hub" }}
            />
            <Step
                num="2"
                title="Submit All Relevant Documents"
                description="Use the 'Document Submission' section to upload any files (transcripts, reports), import from URLs, or paste raw text. This contextual information is crucial for both your manual review and the AI's deep analysis."
            />
            <Step
                num="3"
                title="Add Qualitative Insights"
                description="In the 'Qualitative Insights' section, add your notes from CEO interviews, general observations, or any deep analysis you've conducted. This is where your human expertise provides critical context."
            />
             <Step
                num="4"
                title="Provide Specific Comments for NLP Analysis"
                description="Use the 'NLP Analysis Input' section to add 30-40 specific, distinct comments. These comments will be used for thematic analysis, sentiment scoring, and to compare your findings against the AI's (AI vs. Human Gap Analysis)."
            />
            <Step
                num="5"
                title="Save and Run Full Analysis"
                description="First, save your qualitative inputs using the 'Save Reviewer Analysis' button. Then, click 'Run Full Reviewer Analysis'. This triggers the deep NLP analysis on your comments and generates the final comparison charts."
            />
             <Step
                num="6"
                title="Incorporate into the Final Report"
                description="Once the analysis is complete, the results (Thematic Analysis, AI-Human Deviation, etc.) will be displayed on the page. These insights will also be automatically included in the final Due Diligence report for this company."
            />
        </CardContent>
      </Card>
    </div>
  );
}
