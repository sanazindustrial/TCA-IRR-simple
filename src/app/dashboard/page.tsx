
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BarChart2, Send } from 'lucide-react';
import Link from 'next/link';

export default function DashboardHome() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
          Welcome to Startup Compass
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Your central hub for AI-powered startup evaluation and due diligence.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BarChart2 className="text-primary" />
              New Analysis
            </CardTitle>
            <CardDescription>
              Start a new evaluation by providing company information, documents, and configuring analysis modules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href="/dashboard/evaluation">Run New Analysis</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="text-primary" />
              View Reports
            </CardTitle>
            <CardDescription>
              Access, review, and export previously generated Triage and Due Diligence reports for your portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" variant="outline" className="w-full">
              <Link href="/dashboard/reports">Browse Reports</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Send className="text-primary" />
              Submit a Request
            </CardTitle>
            <CardDescription>
              Need help? Request additional reports, suggest a feature, or report a technical issue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" variant="outline" className="w-full">
              <Link href="/dashboard/request">Submit Request</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
