
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BarChart, Calendar, Filter, FileDown } from 'lucide-react';
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

export default function CostAnalysisGuidePage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Link href="/dashboard/help" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="size-4" />
            Back to Help & Support
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
          Guide: Cost Management & Analytics
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
          Learn how to monitor, analyze, and optimize your platform-related costs.
        </p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart /> Analyzing Your Costs</CardTitle>
            <CardDescription>This guide explains the features of the Advanced Cost Management dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <Step
                num="1"
                title="Navigate to Cost Management"
                description="From the sidebar, go to Administration > Cost Management. This is your central hub for tracking all costs."
                link={{ href: "/dashboard/cost", text: "Go to Cost Management" }}
            />
            <Step
                num="2"
                title="Use the Date and Filter Controls"
                description="At the top of the page, you can select a date range, filter by specific activities (like AI Analysis or Data Storage), and filter by individual users to narrow down the cost data."
            />
            <Step
                num="3"
                title="Understand the Main Breakdown"
                description="The 'Cost Breakdown by Category' card shows you which parts of the application are contributing the most to your overall costs, such as Networking, Cybersecurity, and Storage."
            />
             <Step
                num="4"
                title="Dive into AI & ML Costs"
                description="The 'AI & ML Cost Breakdown' card provides a detailed look at your AI-related expenses. You can see the cost per analysis, token usage, and breakdowns by AI model, user, and report type."
            />
            <Step
                num="5"
                title="Review Cost Trends"
                description="The 'Cost Trends' table shows a historical log of daily costs and the number of executions, helping you identify spikes or changes in usage patterns over time."
            />
             <Step
                num="6"
                title="Export Your Data"
                description="Use the 'Export & Share' button to download your filtered cost data as a PDF, DOCX, or raw data file (ZIP/XLSX) for further analysis or reporting."
            />
        </CardContent>
      </Card>
    </div>
  );
}
