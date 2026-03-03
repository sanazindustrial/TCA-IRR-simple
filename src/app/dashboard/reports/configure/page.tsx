
'use client';
import { useState, useEffect, useRef } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, GripVertical, RotateCcw, Save, Trash2, Plus, Link2, TestTube2, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const defaultTriageSectionsAdmin = [
    { id: 'quick-summary', title: 'Quick Summary', active: true, description: "Company, sector, date, valuation, round, runtime, report version, export buttons" },
    { id: 'tca-summary-card', title: 'TCA Summary Score Card', active: true, description: "Triage classification and statistical analysis (Total score, Score average, Std Dev, Confidence Interval, Tier Level)." },
    { id: 'executive-summary', title: 'AI Interpretation Summary', active: true, description: "GPT narrative on triage outcome, highlights, risk-opportunity balance" },
    { id: 'tca-scorecard', title: 'TCA AI Table – 12 Categories', active: true, description: "Central evaluation across fundamental categories (Raw Score, Weight, Weighted Score, Flag, PESTEL, Description, Strengths, Concerns)." },
    { id: 'weighted-score-breakdown', title: 'TCA Weighted Score Breakdown', active: true, description: "Sector-adjusted total score calculation." },
    { id: 'risk-flags', title: 'Risk Flag Summary Table', active: true, description: "Summary of top risks and breakdown of analysis, flags, descriptions, mitigations, and thresholds." },
    { id: 'flag-analysis-narrative', title: 'Flag Analysis Narrative', active: true, description: "GPT-generated narrative of risk flags and triggers." },
    { id: 'macro-trend', title: 'Macro Trend Alignment', active: true, description: "PESTEL analysis and trend overlay scores." },
    { id: 'benchmark', title: 'Benchmark Comparison', active: true, description: "Performance vs. sector averages, percentile, deviation, and gap analysis." },
    { id: 'growth-classifier', title: 'Growth Classifier Matrix', active: true, description: "6-model DSS, best/base/worst scenarios, and classification score." },
    { id: 'strategic-fit', title: 'Strategic Fit Matrix', active: true, description: "Score trend (Δ vs last), performance direction." },
    { id: 'consistency-check', title: 'Consistency Check', active: true, description: "Text coherence, score-comment match, pitch vs score stability, and more. (Admin/Reviewer Only)" },
    { id: 'gap-analysis', title: 'Gap Analysis', active: true, description: "Identifies performance gaps against an 'investor-ready' profile and provides an action plan." },
    { id: 'funder-fit-analysis', title: 'Funder Fit Analysis', active: true, description: "Generates a 'Funding Readiness' score and provides a shortlist of VCs." },
    { id: 'team-assessment', title: 'Team Assessment', active: true, description: "GPT review of founder/team alignment, fit, and gaps." },
    { id: 'reviewer-comments', title: 'Reviewer Comments & Sentiment', active: true, description: "Human reviewer input summary, sentiment, and tone." },
    { id: 'reviewer-ai-deviation', title: 'Reviewer–AI Deviation Chart', active: true, description: "Score deviation (AI vs reviewer), rationale, and visuals." },
    { id: 'reviewer-theme-analysis', title: 'Reviewer Theme Analysis', active: true, description: "NLP & manual themes (team, IP, GTM), keyword extraction, tone, topic cluster." },
    { id: 'final-flag-summary', title: 'Final Flag Summary & Threshold Table', active: true, description: "Full table of triggers, thresholds, and mitigation guidance per risk domain." },
    { id: 'final-recommendation', title: 'Final Recommendation', active: true, description: "AI and reviewer recommendation with rationale." },
    { id: 'admin-approval-panel', title: 'Admin Final Approval Panel', active: true, description: "Buttons to lock outcome (Admin/Reviewer Only)." },
    { id: 'export-links', title: 'Export & Superset Links', active: true, description: "PDF / DOCX / MD / XLSX / JSON downloads + Superset chart link." },
    { id: 'appendix', title: 'Appendix', active: true, description: "JSON view of weights, flags, benchmark rules, classifier settings, etc." },
];

const defaultTriageSectionsStandard = defaultTriageSectionsAdmin.filter(
    section => !section.description.includes('(Admin/Reviewer Only)')
);

const defaultDdSections = [
    { id: 'dd-executive-summary', title: "Executive Summary", active: true, description: "Startup overview, score highlights, top 3 risks, and strengths" },
    { id: 'dd-tca-scorecard', title: "TCA AI Table – 12 Categories", active: true, description: "Same table as triage, extended with notes if changed" },
    { id: 'dd-weighted-score-breakdown', title: "Weighted Score Breakdown", active: true, description: "Sector-specific weighted outcome" },
    { id: 'dd-risk-flags', title: "Risk Flag Table (14 Domains)", active: true, description: "Flag color, trigger, threshold, GPT mitigation plans" },
    { id: 'dd-macro-trend', title: "Macro Trend + Benchmark Comparison", active: true, description: "Overlays with macro & industry trendlines" },
    { id: 'dd-growth-classifier', title: "Growth Classifier Matrix", active: true, description: "6-model logic, base/best/worst, sector fit, team alignment" },
    { id: 'dd-strategic-fit', title: "Strategic Fit Matrix", active: true, description: "Alignment with key strategic pathways." },
    { id: 'dd-reviewer-analysis', title: "Reviewer Analysis & Sentiment", active: true, description: "Aggregated sentiment, score rationale, and summary of reviewers" },
    { id: 'dd-reviewer-ai-deviation', title: "Reviewer–AI Score Deviation", active: true, description: "Comparison chart of scoring deviations" },
    { id: 'dd-reviewer-themes', title: "Reviewer Themes (GPT + Manual)", active: true, description: "NLP + manual clustering (e.g. GTM, TAM, IP)" },
    { id: 'dd-consistency-check', title: "Consistency Check", active: true, description: "Logical alignment of narrative vs score vs feedback" },
    { id: 'dd-founder-fit', title: "Founder Fit + Team Analysis", active: true, description: "Extended GPT summary of team history, gaps, fit" },
    { id: 'dd-competitive-landscape', title: "Competitive Landscape", active: true, description: "Top competitors, positioning, GPT M&A and defensibility insights" },
    { id: 'dd-regulatory-compliance', title: "Regulatory / Compliance Review", active: true, description: "FDA/CE status, regulatory milestones, risk & timeline" },
    { id: 'dd-gtm-strategy', title: "Go-to-Market & Commercial Strategy", active: true, description: "Customer pipeline, LOIs, distribution, CPT codes if applicable" },
    { id: 'dd-ip-tech-review', title: "IP & Technology Review", active: true, description: "Patent filings, freedom to operate, barriers to entry" },
    { id: 'dd-financials-burn-rate', title: "Financials & Burn Rate", active: true, description: "Runway, revenue growth, CAC/LTV, breakeven roadmap" },
    { id: 'dd-exit-strategy', title: "Exit Strategy Roadmap", active: true, description: "M&A landscape, IPO viability, exit multiples, ideal acquirers" },
    { id: 'dd-term-sheet', title: "Term Sheet Trigger Analysis", active: true, description: "Ideal valuation, dilution logic, SAFE/Equity notes" },
    { id: 'dd-final-risk-summary', title: "Final Flag Summary + Risk Table", active: true, description: "An extended version of the triage risk table" },
    { id: 'dd-final-recommendation', title: "Final Recommendation", active: true, description: "Human decision based on deep data + AI view" },
    { id: 'dd-conclusion', title: "Conclusion and summary note", active: true, description: "Summary of risk, points of improvement, TCA recommendation, and detailed conclusion." },
    { id: 'dd-appendix', title: "Appendix: DD Artifacts & Config Snapshot", active: true, description: "CEO call notes, customer interviews, uploaded docs, config JSON snapshot" },
    { id: 'dd-export-links', title: 'Export & Superset Links', active: true, description: 'PDF / DOCX / MD / XLSX / JSON downloads + Superset chart link.' }
];

// ─── SSD → TCA TIRR Integration Report Sections (6-page triage) ──────
const defaultSsdSections: ReportSection[] = [
    { id: 'ssd-executive-summary', title: 'Page 1: Executive Summary', active: true, description: 'Overall score, score interpretation, investment recommendation, analysis completeness, modules run, company & founder snapshot' },
    { id: 'ssd-tca-scorecard', title: 'Page 2: TCA Scorecard', active: true, description: 'Composite score, category breakdown (score, weight, flag), top strengths, areas of concern — radar/bar chart' },
    { id: 'ssd-risk-assessment', title: 'Page 3: Risk Assessment & Flags', active: true, description: 'Overall risk score, total flags, high risk count, risk flags with severity, risk domains' },
    { id: 'ssd-market-team', title: 'Page 4: Market & Team Assessment', active: true, description: 'Market score, TAM/SAM/SOM, growth rate, competitive position, team score, completeness, founders, gaps' },
    { id: 'ssd-financials-tech', title: 'Page 5: Financials & Technology', active: true, description: 'Financial score, revenue, MRR, burn rate, runway, LTV/CAC ratio, gross margin, technology score, TRL, IP strength' },
    { id: 'ssd-recommendations', title: 'Page 6: Investment Recommendation', active: true, description: 'Final decision, business model & growth scores, exit potential, funding recommendation, next steps' },
];

// ─── SSD Scoring Thresholds ──────────────────────────────────────────
const defaultSsdThresholds = [
    { tier: 'STRONG_BUY', minScore: 8.0, label: 'STRONG BUY', description: 'High confidence investment opportunity', color: '#2F855A' },
    { tier: 'PROCEED', minScore: 7.0, label: 'PROCEED', description: 'Proceed with due diligence', color: '#3182CE' },
    { tier: 'CONDITIONAL', minScore: 5.5, label: 'CONDITIONAL', description: 'Address key risks before investing', color: '#D69E2E' },
    { tier: 'PASS', minScore: 0.0, label: 'PASS', description: 'Risk/reward profile not aligned', color: '#E53E3E' },
];

// ─── SSD Mandatory Fields (spec section 6) ───────────────────────────
const ssdMandatoryFields = [
    { section: 'Contact', field: 'email', type: 'String', required: true },
    { section: 'Contact', field: 'phoneNumber', type: 'String', required: true },
    { section: 'Contact', field: 'firstName', type: 'String', required: true },
    { section: 'Contact', field: 'lastName', type: 'String', required: true },
    { section: 'Company', field: 'industryVertical', type: 'String', required: true },
    { section: 'Company', field: 'developmentStage', type: 'String', required: true },
    { section: 'Company', field: 'businessModel', type: 'String', required: true },
    { section: 'Company', field: 'country', type: 'String', required: true },
    { section: 'Company', field: 'state', type: 'String', required: true },
    { section: 'Company', field: 'city', type: 'String', required: true },
    { section: 'Company', field: 'oneLineDescription', type: 'String', required: true },
    { section: 'Company', field: 'companyDescription', type: 'String', required: true },
    { section: 'Company', field: 'productDescription', type: 'String', required: true },
    { section: 'Company', field: 'pitchDeckPath', type: 'String', required: true },
    { section: 'Financial', field: 'fundingType', type: 'String', required: true },
    { section: 'Financial', field: 'annualRevenue', type: 'Decimal', required: true },
    { section: 'Financial', field: 'preMoneyValuation', type: 'Decimal', required: true },
];


type ReportSection = {
    id: string;
    title: string;
    active: boolean;
    description: string;
};

const ReportConfigTable = ({ sections, onUpdate, onRemove, setSections }: { sections: ReportSection[], onUpdate: (id: string, field: keyof ReportSection, value: string | boolean) => void, onRemove: (id: string) => void, setSections: React.Dispatch<React.SetStateAction<ReportSection[]>> }) => {
    const draggedItem = useRef<string | null>(null);
    const dropTargetItem = useRef<string | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
        draggedItem.current = id;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
        e.preventDefault();
        const targetRow = e.currentTarget;
        if (targetRow) {
            targetRow.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
        }
        dropTargetItem.current = id;
    };

    const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
        e.currentTarget.style.backgroundColor = '';
    }

    const handleDrop = (e: React.DragEvent<HTMLTableRowElement>) => {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = '';
        if (draggedItem.current === null || dropTargetItem.current === null || draggedItem.current === dropTargetItem.current) return;

        const currentIndex = sections.findIndex(s => s.id === draggedItem.current);
        const targetIndex = sections.findIndex(s => s.id === dropTargetItem.current);

        if (currentIndex !== -1 && targetIndex !== -1) {
            const newSections = [...sections];
            const [removed] = newSections.splice(currentIndex, 1);
            newSections.splice(targetIndex, 0, removed);
            setSections(newSections);
        }

        draggedItem.current = null;
        dropTargetItem.current = null;
    };


    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-16"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody onDragOver={(e) => e.preventDefault()}>
                {sections.map(section => (
                    <TableRow
                        key={section.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className="cursor-move"
                    >
                        <TableCell className="cursor-grab text-center">
                            <GripVertical className="inline-block text-muted-foreground" />
                        </TableCell>
                        <TableCell>
                            <Input
                                value={section.title}
                                onChange={(e) => onUpdate(section.id, 'title', e.target.value)}
                                className="font-semibold h-8"
                            />
                            <Textarea
                                value={section.description}
                                onChange={(e) => onUpdate(section.id, 'description', e.target.value)}
                                className="text-xs text-muted-foreground mt-1"
                                rows={2}
                            />
                        </TableCell>
                        <TableCell className="text-center">
                            <Switch checked={section.active} onCheckedChange={(checked) => onUpdate(section.id, 'active', checked)} />
                        </TableCell>
                        <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => onRemove(section.id)}>
                                <Trash2 className="size-4 text-destructive" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export default function ReportConfigurationPage() {
    const [triageSectionsAdmin, setTriageSectionsAdmin] = useState<ReportSection[]>(defaultTriageSectionsAdmin);
    const [triageSectionsStandard, setTriageSectionsStandard] = useState<ReportSection[]>(defaultTriageSectionsStandard);
    const [ddSections, setDdSections] = useState<ReportSection[]>(defaultDdSections);
    const [ssdSections, setSsdSections] = useState<ReportSection[]>(defaultSsdSections);

    const [newTriageSection, setNewTriageSection] = useState({ title: '', description: '' });
    const [newDdSection, setNewDdSection] = useState({ title: '', description: '' });
    const [newSsdSection, setNewSsdSection] = useState({ title: '', description: '' });

    // SSD Integration settings
    const [ssdCallbackUrl, setSsdCallbackUrl] = useState('');
    const [ssdEndpointUrl, setSsdEndpointUrl] = useState('/api/ssd/tirr');
    const [ssdTestStatus, setSsdTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [ssdTestResult, setSsdTestResult] = useState<string>('');
    const [ssdThresholds, setSsdThresholds] = useState(defaultSsdThresholds);

    const { toast } = useToast();

    useEffect(() => {
        try {
            const savedTriageAdmin = localStorage.getItem('report-config-triage-admin');
            const savedTriageStandard = localStorage.getItem('report-config-triage-standard');
            const savedDd = localStorage.getItem('report-config-dd');
            const savedSsd = localStorage.getItem('report-config-ssd-sections');
            const savedSsdCallback = localStorage.getItem('report-config-ssd-callback');
            const savedSsdThresholds = localStorage.getItem('report-config-ssd-thresholds');
            if (savedTriageAdmin) setTriageSectionsAdmin(JSON.parse(savedTriageAdmin));
            if (savedTriageStandard) setTriageSectionsStandard(JSON.parse(savedTriageStandard));
            if (savedDd) setDdSections(JSON.parse(savedDd));
            if (savedSsd) setSsdSections(JSON.parse(savedSsd));
            if (savedSsdCallback) setSsdCallbackUrl(savedSsdCallback);
            if (savedSsdThresholds) setSsdThresholds(JSON.parse(savedSsdThresholds));
        } catch (error) {
            console.error("Failed to load report configurations from localStorage", error);
        }
    }, []);

    const handleUpdate = (reportType: 'triageAdmin' | 'triageStandard' | 'dd' | 'ssd', sectionId: string, field: keyof ReportSection, value: string | boolean) => {
        const setSections = reportType === 'triageAdmin' ? setTriageSectionsAdmin
            : reportType === 'triageStandard' ? setTriageSectionsStandard
                : reportType === 'ssd' ? setSsdSections
                    : setDdSections;
        setSections(prev =>
            prev.map(s => s.id === sectionId ? { ...s, [field]: value } : s)
        );
    };

    const handleRemove = (reportType: 'triageAdmin' | 'triageStandard' | 'dd' | 'ssd', sectionId: string) => {
        const setSections = reportType === 'triageAdmin' ? setTriageSectionsAdmin
            : reportType === 'triageStandard' ? setTriageSectionsStandard
                : reportType === 'ssd' ? setSsdSections
                    : setDdSections;
        setSections(prev => prev.filter(s => s.id !== sectionId));
    };

    const handleAdd = (reportType: 'triageAdmin' | 'triageStandard' | 'dd' | 'ssd') => {
        let setSections, newSectionData, setNewSectionData;
        if (reportType === 'triageAdmin' || reportType === 'triageStandard') {
            setSections = reportType === 'triageAdmin' ? setTriageSectionsAdmin : setTriageSectionsStandard;
            newSectionData = newTriageSection;
            setNewSectionData = setNewTriageSection;
        } else if (reportType === 'ssd') {
            setSections = setSsdSections;
            newSectionData = newSsdSection;
            setNewSectionData = setNewSsdSection;
        } else {
            setSections = setDdSections;
            newSectionData = newDdSection;
            setNewSectionData = setNewDdSection;
        }

        if (!newSectionData.title.trim() || !newSectionData.description.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Title and description cannot be empty.' });
            return;
        }

        const newSection: ReportSection = {
            id: `${reportType}-${Date.now()}`,
            title: newSectionData.title,
            description: newSectionData.description,
            active: true
        };

        setSections(prev => [...prev, newSection]);
        setNewSectionData({ title: '', description: '' });
    };

    const handleReset = (reportType: 'triageAdmin' | 'triageStandard' | 'dd' | 'ssd') => {
        if (reportType === 'triageAdmin') setTriageSectionsAdmin(defaultTriageSectionsAdmin);
        if (reportType === 'triageStandard') setTriageSectionsStandard(defaultTriageSectionsStandard);
        if (reportType === 'dd') setDdSections(defaultDdSections);
        if (reportType === 'ssd') {
            setSsdSections(defaultSsdSections);
            setSsdThresholds(defaultSsdThresholds);
            setSsdCallbackUrl('');
        }

        toast({
            title: 'Configuration Reset',
            description: `The configuration has been reset to its default state.`
        });
    };

    const handleSsdTest = async () => {
        setSsdTestStatus('testing');
        setSsdTestResult('');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/health`);
            if (response.ok) {
                setSsdTestStatus('success');
                setSsdTestResult('Backend connection successful! SSD integration endpoint is available at /api/ssd/tirr');
            } else {
                throw new Error('Backend not responding');
            }
        } catch {
            setSsdTestStatus('error');
            setSsdTestResult('Failed to connect to backend. Make sure the server is running.');
        }
    };

    const handleSave = () => {
        try {
            localStorage.setItem('report-config-triage-admin', JSON.stringify(triageSectionsAdmin));
            localStorage.setItem('report-config-triage-standard', JSON.stringify(triageSectionsStandard));
            localStorage.setItem('report-config-dd', JSON.stringify(ddSections));
            localStorage.setItem('report-config-ssd-sections', JSON.stringify(ssdSections));
            localStorage.setItem('report-config-ssd-callback', ssdCallbackUrl);
            localStorage.setItem('report-config-ssd-thresholds', JSON.stringify(ssdThresholds));
            toast({
                title: 'Configuration Saved',
                description: 'Your report configurations have been saved locally.'
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'Could not save configurations to local storage.'
            });
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <Link href="/dashboard/evaluation" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
                        <ArrowLeft className="size-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold">Report Configuration</h1>
                    <p className="text-muted-foreground">Customize the sections included in Triage and Due Diligence reports.</p>
                </div>
            </header>

            <Tabs defaultValue="triage">
                <TabsList>
                    <TabsTrigger value="triage">Triage Report</TabsTrigger>
                    <TabsTrigger value="dd">Due Diligence Report</TabsTrigger>
                    <TabsTrigger value="ssd">SSD Integration</TabsTrigger>
                </TabsList>
                <TabsContent value="triage">
                    <Card>
                        <CardHeader>
                            <CardTitle>Triage Report Sections</CardTitle>
                            <CardDescription>Enable, disable, edit, add, or remove sections for the Triage report. Drag to reorder.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="admin" className="w-full">
                                <TabsList>
                                    <TabsTrigger value="admin">Admin/Reviewer View</TabsTrigger>
                                    <TabsTrigger value="standard">Standard User View</TabsTrigger>
                                </TabsList>
                                <TabsContent value="admin" className="mt-4">
                                    <div className="flex justify-end mb-4">
                                        <Button variant="ghost" onClick={() => handleReset('triageAdmin')}><RotateCcw className="mr-2" /> Reset to Default</Button>
                                    </div>
                                    <ReportConfigTable sections={triageSectionsAdmin} onUpdate={(id, field, value) => handleUpdate('triageAdmin', id, field, value)} onRemove={(id) => handleRemove('triageAdmin', id)} setSections={setTriageSectionsAdmin} />
                                </TabsContent>
                                <TabsContent value="standard" className="mt-4">
                                    <div className="flex justify-end mb-4">
                                        <Button variant="ghost" onClick={() => handleReset('triageStandard')}><RotateCcw className="mr-2" /> Reset to Default</Button>
                                    </div>
                                    <ReportConfigTable sections={triageSectionsStandard} onUpdate={(id, field, value) => handleUpdate('triageStandard', id, field, value)} onRemove={(id) => handleRemove('triageStandard', id)} setSections={setTriageSectionsStandard} />
                                </TabsContent>
                            </Tabs>
                            <div className="mt-6 p-4 border-t">
                                <h4 className="font-semibold mb-2">Add New Section (to both views)</h4>
                                <div className="flex items-start gap-4">
                                    <div className="flex-grow space-y-2">
                                        <Input placeholder="Section Title" value={newTriageSection.title} onChange={(e) => setNewTriageSection({ ...newTriageSection, title: e.target.value })} />
                                        <Textarea placeholder="Section Description" value={newTriageSection.description} onChange={(e) => setNewTriageSection({ ...newTriageSection, description: e.target.value })} rows={2} />
                                    </div>
                                    <Button onClick={() => { handleAdd('triageAdmin'); handleAdd('triageStandard'); }}><Plus className="mr-2" /> Add Section</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="dd">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Due Diligence Report Sections</CardTitle>
                                    <CardDescription>Enable, disable, edit, add, or remove sections for the Due Diligence report. Drag to reorder.</CardDescription>
                                </div>
                                <Button variant="ghost" onClick={() => handleReset('dd')}><RotateCcw className="mr-2" /> Reset to Default</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ReportConfigTable sections={ddSections} onUpdate={(id, field, value) => handleUpdate('dd', id, field, value)} onRemove={(id) => handleRemove('dd', id)} setSections={setDdSections} />
                            <div className="mt-6 p-4 border-t">
                                <h4 className="font-semibold mb-2">Add New Section</h4>
                                <div className="flex items-start gap-4">
                                    <div className="flex-grow space-y-2">
                                        <Input placeholder="Section Title" value={newDdSection.title} onChange={(e) => setNewDdSection({ ...newDdSection, title: e.target.value })} />
                                        <Textarea placeholder="Section Description" value={newDdSection.description} onChange={(e) => setNewDdSection({ ...newDdSection, description: e.target.value })} rows={2} />
                                    </div>
                                    <Button onClick={() => handleAdd('dd')}><Plus className="mr-2" /> Add Section</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SSD Integration Tab */}
                <TabsContent value="ssd">
                    <div className="space-y-6">
                        {/* SSD Integration Overview */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Link2 className="size-5" />
                                            SSD → TCA TIRR Integration
                                        </CardTitle>
                                        <CardDescription>Configure the integration endpoint for SSD Application report generation</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link href="/dashboard/ssd-audit">
                                            <Button variant="outline">
                                                <ExternalLink className="size-4 mr-2" />
                                                View Audit Logs
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="ssd-endpoint">Endpoint URL</Label>
                                        <Input id="ssd-endpoint" value={ssdEndpointUrl} onChange={(e) => setSsdEndpointUrl(e.target.value)} placeholder="/api/ssd/tirr" />
                                        <p className="text-xs text-muted-foreground mt-1">The endpoint that receives SSD payloads (POST)</p>
                                    </div>
                                    <div>
                                        <Label htmlFor="ssd-callback">Callback URL (CaptureTCAReportResponse)</Label>
                                        <Input id="ssd-callback" value={ssdCallbackUrl} onChange={(e) => setSsdCallbackUrl(e.target.value)} placeholder="https://ssd-app.com/api/CaptureTCAReportResponse" />
                                        <p className="text-xs text-muted-foreground mt-1">URL to POST generated report path after completion</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                                    <Button onClick={handleSsdTest} disabled={ssdTestStatus === 'testing'}>
                                        {ssdTestStatus === 'testing' ? (
                                            <><Loader2 className="size-4 mr-2 animate-spin" />Testing...</>
                                        ) : (
                                            <><TestTube2 className="size-4 mr-2" />Test Connection</>
                                        )}
                                    </Button>
                                    {ssdTestStatus === 'success' && (
                                        <div className="flex items-center text-green-600">
                                            <CheckCircle2 className="size-4 mr-2" />
                                            {ssdTestResult}
                                        </div>
                                    )}
                                    {ssdTestStatus === 'error' && (
                                        <div className="flex items-center text-red-600">
                                            <XCircle className="size-4 mr-2" />
                                            {ssdTestResult}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* SSD Report Sections */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>SSD Triage Report Sections (6-Page Format)</CardTitle>
                                        <CardDescription>Configure sections included in the automated SSD triage report</CardDescription>
                                    </div>
                                    <Button variant="ghost" onClick={() => handleReset('ssd')}><RotateCcw className="mr-2" /> Reset to Default</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ReportConfigTable
                                    sections={ssdSections}
                                    onUpdate={(id, field, value) => handleUpdate('ssd', id, field, value)}
                                    onRemove={(id) => handleRemove('ssd', id)}
                                    setSections={setSsdSections}
                                />
                                <div className="mt-6 p-4 border-t">
                                    <h4 className="font-semibold mb-2">Add New Section</h4>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-grow space-y-2">
                                            <Input placeholder="Section Title" value={newSsdSection.title} onChange={(e) => setNewSsdSection({ ...newSsdSection, title: e.target.value })} />
                                            <Textarea placeholder="Section Description" value={newSsdSection.description} onChange={(e) => setNewSsdSection({ ...newSsdSection, description: e.target.value })} rows={2} />
                                        </div>
                                        <Button onClick={() => handleAdd('ssd')}><Plus className="mr-2" /> Add Section</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Scoring Thresholds */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Scoring Thresholds</CardTitle>
                                <CardDescription>Configure score ranges for investment recommendations</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tier</TableHead>
                                            <TableHead>Label</TableHead>
                                            <TableHead>Min Score</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Color</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ssdThresholds.map((threshold, index) => (
                                            <TableRow key={threshold.tier}>
                                                <TableCell className="font-mono text-sm">{threshold.tier}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={threshold.label}
                                                        onChange={(e) => {
                                                            const updated = [...ssdThresholds];
                                                            updated[index] = { ...threshold, label: e.target.value };
                                                            setSsdThresholds(updated);
                                                        }}
                                                        className="h-8 w-32"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        value={threshold.minScore}
                                                        onChange={(e) => {
                                                            const updated = [...ssdThresholds];
                                                            updated[index] = { ...threshold, minScore: parseFloat(e.target.value) || 0 };
                                                            setSsdThresholds(updated);
                                                        }}
                                                        className="h-8 w-20"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={threshold.description}
                                                        onChange={(e) => {
                                                            const updated = [...ssdThresholds];
                                                            updated[index] = { ...threshold, description: e.target.value };
                                                            setSsdThresholds(updated);
                                                        }}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={threshold.color} aria-label={`Color for ${threshold.tier} tier`} onChange={(e) => {
                                                                const updated = [...ssdThresholds];
                                                                updated[index] = { ...threshold, color: e.target.value };
                                                                setSsdThresholds(updated);
                                                            }}
                                                            className="w-8 h-8 rounded cursor-pointer"
                                                        />
                                                        <span className="font-mono text-xs">{threshold.color}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Mandatory Fields Reference */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Mandatory Fields (Spec Section 6)</CardTitle>
                                <CardDescription>These fields must be present in the SSD payload for valid report generation</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Section</TableHead>
                                            <TableHead>Field Name</TableHead>
                                            <TableHead>Data Type</TableHead>
                                            <TableHead>Required</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ssdMandatoryFields.map((field, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{field.section}</TableCell>
                                                <TableCell className="font-mono text-sm">{field.field}</TableCell>
                                                <TableCell>{field.type}</TableCell>
                                                <TableCell>
                                                    {field.required ? (
                                                        <CheckCircle2 className="size-4 text-green-500" />
                                                    ) : (
                                                        <span className="text-muted-foreground">Optional</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
            <Card className="mt-8">
                <CardFooter className="p-4 flex justify-end">
                    <Button onClick={handleSave}><Save className="mr-2" /> Save All Configurations</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
