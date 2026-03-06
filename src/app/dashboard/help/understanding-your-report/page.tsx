'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const triageReportSections = [
    { num: 0, title: "Quick Summary", description: "Company, sector, date, valuation, round, runtime, report version, export buttons", visibility: "🔓 All (CI 🔐)" },
    { num: 1, title: "TCA summary score card: Triage Classification", description: "Total score, Score average ( after 30 times run), Std Dev, 🔐 Confidence Interval, Tier Level", visibility: "🔓 All (CI 🔐)" },
    { num: 2, title: "TCA AI Table – 12 Categories", description: "Table: Raw Score, Weight, Weighted Score, Flag, PESTEL, Description, Strengths, Concerns", visibility: "🔓 All" },
    { num: 3, title: "AI Interpretation Summary", description: "GPT narrative on triage outcome, highlights, risk-opportunity balance", visibility: "🔓 All" },
    { num: 4, title: "TCA 12 score, Weighted Score Breakdown, and detailed analysis", description: "Sector-adjusted total score calculation", visibility: "🔓 All" },
    { num: 5, title: "Risk Flag Summary Table (14 Domains)", description: "Summary of top risks, breakdown of analysis, flags, descriptions, mitigations, and thresholds.", visibility: "🔓 All" },
    { num: 6, title: "Flag Analysis Narrative", description: "GPT-generated narrative of risk flags and triggers", visibility: "🔓 All" },
    { num: 7, title: "Macro Trend Alignment Table", description: "Comparison with macro PESTEL signals, sector outlook", visibility: "🔓 All" },
    { num: 8, title: "Benchmark Overlay", description: "Score vs sector average, percentile, deviation, and gap analysis.", visibility: "🔓 All" },
    { num: 9, title: "Growth Classifier Matrix", description: "6-model DSS, detailed calculator (🔐 Admin/Reviewer Only), best/base/worst scenarios, and classification score.", visibility: "🔓 All" },
    { num: 10, title: "Historical Comparison Strategy Fit Matrix", description: "Score trend (Δ vs last), performance direction", visibility: "🔓 All" },
    { num: 11, title: "Consistency Check, quality, and statistics", description: "Text coherence, score-comment match, pitch vs score stability, and more.", visibility: "🔐 Admin/Reviewer Only" },
    { num: 12, title: "Founder Fit + Team Assessment Table", description: "GPT review of founder/team alignment, fit, and gaps.", visibility: "🔓 All" },
    { num: 13, title: "Reviewer Comments & Sentiment Analysis", description: "Human reviewer input summary, sentiment, and tone.", visibility: "🔓 All (🚫 if N/A)" },
    { num: 14, title: "Reviewer–AI Deviation Chart", description: "Score deviation (AI vs reviewer), rationale, and visuals.", visibility: "🔓 All" },
    { num: 15, title: "Reviewer Theme Analysis (NLP + Manual)", description: "GPT & manual themes (team, IP, GTM), keyword extraction, tone, topic cluster.", visibility: "🔓 All" },
    { num: 16, title: "Final Flag Summary & Threshold Table", description: "Full table of triggers, thresholds, and mitigation guidance per risk domain.", visibility: "🔓 All" },
    { num: 17, title: "Final Recommendation", description: "AI and reviewer recommendation with rationale", visibility: "🔓 All" },
    { num: 18, title: "Admin Final Approval Panel", description: "[🔘 Prescreen] [🔘 Full Screening] [🟥 Reject] buttons to lock outcome", visibility: "🔐 Admin/Reviewer Only" },
    { num: 19, title: "Export & Superset Links", description: "PDF / DOCX / MD / XLSX / JSON downloads + Superset chart link (if enabled)", visibility: "🔓 All" },
    { num: 20, title: "Appendix", description: "JSON view of weights, flags, benchmark rules, classifier settings, detailed recommendation, and summary notes.", visibility: "🔓 All" },
];

const ddReportSections = [
    { num: 0, title: "Executive Summary", description: "Startup overview, score highlights, top 3 risks, and strengths", visibility: "🔐 Admin/Reviewer" },
    { num: 1, title: "TCA AI Table – 12 Categories", description: "Same table as triage, extended with notes if changed", visibility: "🔐 Admin/Reviewer" },
    { num: 2, title: "Weighted Score Breakdown", description: "Sector-specific weighted outcome", visibility: "🔐 Admin/Reviewer" },
    { num: 3, title: "Risk Flag Table (14 Domains)", description: "Flag color, trigger, threshold, GPT mitigation plans", visibility: "🔐 Admin/Reviewer" },
    { num: 4, title: "Macro Trend + Benchmark Comparison", description: "Overlays with macro & industry trendlines", visibility: "🔐 Admin/Reviewer" },
    { num: 5, title: "Growth Classifier Matrix", description: "6-model logic, base/best/worst, sector fit, team alignment", visibility: "🔐 Admin/Reviewer" },
    { num: 6, title: "Reviewer Analysis & Sentiment", description: "Aggregated sentiment, score rationale, and summary of reviewers", visibility: "🔐 Admin/Reviewer" },
    { num: 7, title: "Reviewer–AI Score Deviation", description: "Comparison chart of scoring deviations", visibility: "🔐 Admin/Reviewer" },
    { num: 8, title: "Reviewer Themes (GPT + Manual)", description: "NLP + manual clustering (e.g. GTM, TAM, IP)", visibility: "🔐 Admin/Reviewer" },
    { num: 9, title: "Consistency Check", description: "Logical alignment of narrative vs score vs feedback", visibility: "🔐 Admin/Reviewer" },
    { num: 10, title: "Founder Fit + Team Analysis", description: "Extended GPT summary of team history, gaps, fit", visibility: "🔐 Admin/Reviewer" },
    { num: 11, title: "Competitive Landscape", description: "Top competitors, positioning, GPT M&A and defensibility insights", visibility: "🔐 Admin/Reviewer" },
    { num: 12, title: "Regulatory / Compliance Review", description: "FDA/CE status, regulatory milestones, risk & timeline", visibility: "🔐 Admin/Reviewer" },
    { num: 13, title: "Go-to-Market & Commercial Strategy", description: "Customer pipeline, LOIs, distribution, CPT codes if applicable", visibility: "🔐 Admin/Reviewer" },
    { num: 14, title: "IP & Technology Review", description: "Patent filings, freedom to operate, barriers to entry", visibility: "🔐 Admin/Reviewer" },
    { num: 15, title: "Financials & Burn Rate", description: "Runway, revenue growth, CAC/LTV, breakeven roadmap", visibility: "🔐 Admin/Reviewer" },
    { num: 16, title: "Exit Strategy Roadmap", description: "M&A landscape, IPO viability, exit multiples, ideal acquirers", visibility: "🔐 Admin/Reviewer" },
    { num: 17, title: "Term Sheet Trigger Analysis", description: "Ideal valuation, dilution logic, SAFE/Equity notes", visibility: "🔐 Admin/Reviewer" },
    { num: 18, title: "Final Flag Summary + Risk Table", description: "An extended version of the triage risk table", visibility: "🔐 Admin/Reviewer" },
    { num: 19, title: "Final Recommendation", description: "Human decision based on deep data + AI view", visibility: "🔐 Admin/Reviewer" },
    { num: 20, title: "Conclusion and summary note", description: "Summary of risk, points of improvement, TCA recommendation, and detailed conclusion.", visibility: "🔐 Admin/Reviewer" },
    { num: 21, title: "Appendix: DD Artifacts & Config Snapshot", description: "CEO call notes, customer interviews, uploaded docs, config JSON snapshot", visibility: "🔐 Admin/Reviewer" },
    { num: 22, title: "Export & Superset Links", description: "PDF / DOCX / MD / XLSX / JSON downloads + Superset chart link (if enabled)", visibility: "🔐 Admin/Reviewer" }
];

export default function UnderstandingReportGuidePage() {
  const [userRole, setUserRole] = useState('user');
  const isPrivilegedUser = userRole === 'admin' || userRole === 'reviewer';

  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            setUserRole(user.role?.toLowerCase() || 'user');
        } catch (e) {
            setUserRole('user');
        }
    }
  }, []);


  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <Link href="/dashboard/help" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="size-4" />
            Back to Help & Support
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
          Understanding Your Report
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
          Learn what each section of the analysis means for both Triage and Due Diligence reports.
        </p>
      </header>

      <div className="space-y-12">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-2xl"><BookOpen/>Decoding the Triage Report</CardTitle>
                        <CardDescription>A breakdown of the high-level Triage report (typically 5-6 pages), designed for initial screening. This report is structured into 21 distinct sections for a quick yet comprehensive overview.</CardDescription>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard/help/triage-report">View Sample Triage Report</Link>
                    </Button>
                </div>
                <div className='text-sm text-muted-foreground pt-2'><b>Visibility Legend:</b> 🔓 Visible to all | 🔐 Visible only to Admin / Reviewer | 🚫 Hidden if data not available</div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">#</TableHead>
                            <TableHead className="w-1/4">Section Title</TableHead>
                            <TableHead className="w-1/2">Output Description</TableHead>
                            <TableHead>Visibility</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {triageReportSections.map(section => (
                            <TableRow key={`triage-${section.num}`}>
                                <TableCell className="font-mono">{section.num}</TableCell>
                                <TableCell className="font-semibold">{section.title}</TableCell>
                                <TableCell className="text-xs">{section.description}</TableCell>
                                <TableCell className="text-xs font-mono">{section.visibility}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        {isPrivilegedUser && (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-2xl"><Eye/>Decoding the Due Diligence (DD) Report <Badge variant="outline">Admin/Reviewer Only</Badge></CardTitle>
                            <CardDescription>A detailed breakdown of the comprehensive DD report (typically 25-100 pages), which includes all analysis modules and deeper insights. This is triggered after admin approval for Full Screening.</CardDescription>
                        </div>
                        <Button asChild>
                            <Link href="/dashboard/help/detailed-report">View Sample DD Report</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">#</TableHead>
                                <TableHead className="w-1/4">Section Title</TableHead>
                                <TableHead className="w-1/2">Output Description</TableHead>
                                <TableHead>Visibility</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ddReportSections.map(section => (
                                <TableRow key={`dd-${section.num}`}>
                                    <TableCell className="font-mono">{section.num}</TableCell>
                                    <TableCell className="font-semibold">{section.title}</TableCell>
                                    <TableCell className="text-xs">{section.description}</TableCell>
                                    <TableCell className="text-xs font-mono">{section.visibility}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
