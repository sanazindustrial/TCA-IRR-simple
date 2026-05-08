
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
import { ArrowLeft, GripVertical, RotateCcw, Save, Trash2, Plus, Link2, TestTube2, CheckCircle2, XCircle, Loader2, ExternalLink, FileText, Shield, AlertTriangle, Settings2, ClipboardList, BarChart3, Scale, Eye, Download, Play, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG } from '@/lib/api';
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
import { Badge } from '@/components/ui/badge';

const defaultTriageSectionsAdmin = [
    { id: 'executive-summary', title: 'Page 1: Executive Summary', active: true, description: 'Overall investment recommendation, key highlights, and company overview' },
    { id: 'tca-scorecard', title: 'Page 2: TCA Scorecard', active: true, description: 'Composite score with category breakdown' },
    { id: 'tca-ai-analysis-table', title: 'Page 3: TCA AI Analysis', active: true, description: 'Detailed AI-powered analysis table' },
    { id: 'tca-ai-interpretation-summary', title: 'Page 4: AI Interpretation', active: true, description: 'AI interpretation and insights summary' },
    { id: 'weighted-score-breakdown', title: 'Page 5: Weighted Scores', active: true, description: 'Weighted score breakdown by category' },
    { id: 'risk-flag-summary-table', title: 'Page 6: Risk Flags', active: true, description: 'Risk flag summary with severity levels' },
    { id: 'flag-analysis-narrative', title: 'Page 7: Flag Analysis', active: true, description: 'Detailed narrative analysis of flags' },
    { id: 'market-team-analysis', title: 'Page 8: Market & Team', active: true, description: 'Market opportunity and team strength analysis' },
    { id: 'ceo-questions', title: 'Page 9: CEO Questions', active: true, description: 'Strategic questions for the CEO' },
    { id: 'final-recommendation', title: 'Page 10: Final Recommendation', active: true, description: 'Investment decision and next steps' },
];

const defaultTriageSectionsStandard = [
    { id: 'executive-summary', title: 'Page 1: Executive Summary', active: true, description: 'Overall investment recommendation, key highlights, and company overview' },
    { id: 'tca-scorecard', title: 'Page 2: TCA Scorecard', active: true, description: 'Composite score with category breakdown' },
    { id: 'tca-ai-analysis-table', title: 'Page 3: TCA AI Analysis', active: true, description: 'Detailed AI-powered analysis table' },
    { id: 'tca-ai-interpretation-summary', title: 'Page 4: AI Interpretation', active: true, description: 'AI interpretation and insights summary' },
    { id: 'weighted-score-breakdown', title: 'Page 5: Weighted Scores', active: true, description: 'Weighted score breakdown by category' },
    { id: 'risk-flag-summary-table', title: 'Page 6: Risk Flags', active: true, description: 'Risk flag summary with severity levels' },
    { id: 'flag-analysis-narrative', title: 'Page 7: Flag Analysis', active: true, description: 'Detailed narrative analysis of flags' },
    { id: 'market-team-analysis', title: 'Page 8: Market & Team', active: true, description: 'Market opportunity and team strength analysis' },
    { id: 'ceo-questions', title: 'Page 9: CEO Questions', active: true, description: 'Strategic questions for the CEO' },
    { id: 'final-recommendation', title: 'Page 10: Final Recommendation', active: true, description: 'Investment decision and next steps' },
];

const defaultDdSections = [
    { id: 'dd-executive-summary', title: "1. Executive Summary", active: true, description: "Overall investment recommendation, key highlights, and company overview" },
    { id: 'dd-tca-ai-table', title: "2. TCA AI Table – 12 Categories", active: true, description: "Comprehensive AI-generated analysis across all 12 TCA evaluation categories" },
    { id: 'dd-weighted-score-breakdown', title: "3. Weighted Score Breakdown", active: true, description: "Detailed weighted scores by evaluation category with methodology explanation" },
    { id: 'dd-risk-flag-table', title: "4. Risk Flag Table (14 Domains)", active: true, description: "Complete risk flag analysis across all 14 risk domains with severity ratings" },
    { id: 'dd-macro-trend-benchmark', title: "5. Macro Trend + Benchmark Comparison", active: true, description: "PESTEL analysis combined with industry benchmark performance metrics" },
    { id: 'dd-growth-classifier-matrix', title: "6. Growth Classifier Matrix", active: true, description: "Growth trajectory classification with supporting metrics and projections" },
    { id: 'dd-strategic-fit-matrix', title: "7. Strategic Fit Matrix", active: true, description: "Alignment assessment with investor thesis, portfolio fit, and strategic pathways" },
    { id: 'dd-reviewer-analysis', title: "8. Reviewer Analysis & Sentiment", active: true, description: "Human reviewer analysis, sentiment scoring, and qualitative assessments" },
    { id: 'dd-reviewer-ai-deviation', title: "9. Reviewer–AI Score Deviation", active: true, description: "Analysis of variance between AI scores and human reviewer ratings" },
    { id: 'dd-reviewer-themes', title: "10. Reviewer Themes (GPT + Manual)", active: true, description: "Consolidated themes from AI analysis and manual reviewer inputs" },
    { id: 'dd-consistency-check', title: "11. Consistency Check", active: true, description: "Cross-validation of data consistency across all analysis modules" },
    { id: 'dd-founder-fit-team', title: "12. Founder Fit + Team Analysis", active: true, description: "Founder background, team composition, capabilities, and identified gaps" },
    { id: 'dd-competitive-landscape', title: "13. Competitive Landscape", active: true, description: "Market positioning, competitive dynamics, and differentiation analysis" },
    { id: 'dd-regulatory-compliance', title: "14. Regulatory / Compliance Review", active: true, description: "Regulatory requirements, compliance status, and risk mitigation plans" },
    { id: 'dd-gtm-commercial', title: "15. Go-to-Market & Commercial Strategy", active: true, description: "Sales strategy, distribution channels, pricing, and market penetration plan" },
    { id: 'dd-ip-tech-review', title: "16. IP & Technology Review", active: true, description: "Technology stack, patents, trade secrets, and technical defensibility" },
    { id: 'dd-financials-burn-rate', title: "17. Financials & Burn Rate", active: true, description: "Financial statements, runway analysis, unit economics, and projections" },
    { id: 'dd-exit-strategy-roadmap', title: "18. Exit Strategy Roadmap", active: true, description: "Exit opportunities, potential acquirers, IPO readiness, and timeline" },
    { id: 'dd-term-sheet-trigger', title: "19. Term Sheet Trigger Analysis", active: true, description: "Investment triggers, terms considerations, and deal structure recommendations" },
    { id: 'dd-final-flag-summary', title: "20. Final Flag Summary + Risk Table", active: true, description: "Consolidated risk flags with final severity assessment and mitigation status" },
    { id: 'dd-final-recommendation', title: "21. Final Recommendation", active: true, description: "Investment decision, recommended terms, and conditions for proceeding" },
    { id: 'dd-conclusion-summary', title: "22. Conclusion and Summary Note", active: true, description: "Executive conclusion with key takeaways and recommended actions" },
    { id: 'dd-appendix-artifacts', title: "23. Appendix: DD Artifacts & Config Snapshot", active: true, description: "Supporting documents, data sources, and analysis configuration snapshot" },
    { id: 'dd-export-links', title: "24. Export & Superset Links", active: true, description: "Export options, data visualization links, and additional resources" },
];

// ─── Startup Steroid → TCA TIRR Integration Report Sections (10-page triage) ──────
const defaultStartupSteroidSections: ReportSection[] = [
    { id: 'ss-page-1', title: 'Page 1: Executive Summary', active: true, description: 'Overall score, investment recommendation, analysis completeness, company snapshot' },
    { id: 'ss-page-2', title: 'Page 2: TCA Scorecard', active: true, description: 'Composite score, category breakdown, top strengths, areas of concern' },
    { id: 'ss-page-3', title: 'Page 3: TCA AI Interpretation', active: true, description: 'AI-powered analysis insights and interpretation of key metrics' },
    { id: 'ss-page-4', title: 'Page 4: Weighted Score Breakdown', active: true, description: 'Detailed breakdown of weighted scores by evaluation category' },
    { id: 'ss-page-5', title: 'Page 5: Risk Assessment', active: true, description: 'Risk score, flags count, severity levels, risk domains' },
    { id: 'ss-page-6', title: 'Page 6: Flag Analysis Narrative', active: true, description: 'In-depth narrative analysis of identified risk flags' },
    { id: 'ss-page-7', title: 'Page 7: Market & Team', active: true, description: 'Market score, TAM/SAM/SOM, team score, founders, gaps' },
    { id: 'ss-page-8', title: 'Page 8: Financials & Technology', active: true, description: 'Financial score, revenue, burn rate, runway, technology score, IP' },
    { id: 'ss-page-9', title: 'Page 9: CEO Questions', active: true, description: 'Strategic questions for CEO and leadership team' },
    { id: 'ss-page-10', title: 'Page 10: Final Recommendation', active: true, description: 'Final decision, funding recommendation, next steps' },
];

// ─── Startup Steroid Scoring Thresholds ──────────────────────────────────────────
const defaultStartupSteroidThresholds = [
    { tier: 'STRONG_BUY', minScore: 8.0, label: 'STRONG BUY', description: 'High confidence investment opportunity', color: '#2F855A' },
    { tier: 'PROCEED', minScore: 7.0, label: 'PROCEED', description: 'Proceed with due diligence', color: '#3182CE' },
    { tier: 'CONDITIONAL', minScore: 5.5, label: 'CONDITIONAL', description: 'Address key risks before investing', color: '#D69E2E' },
    { tier: 'PASS', minScore: 0.0, label: 'PASS', description: 'Risk/reward profile not aligned', color: '#E53E3E' },
];

// ─── Startup Steroid Risk Domains (matches /analysis/modules/risk) ──────────────
const defaultStartupSteroidRiskDomains = [
    { id: '1', name: 'Regulatory / Compliance', techWeight: 5, medWeight: 15, enabled: true },
    { id: '2', name: 'Clinical / Safety / Product Safety', techWeight: 5, medWeight: 15, enabled: true },
    { id: '3', name: 'Liability / Legal Exposure', techWeight: 5, medWeight: 10, enabled: true },
    { id: '4', name: 'Technical Execution Risk', techWeight: 12, medWeight: 8, enabled: true },
    { id: '5', name: 'Market Risk', techWeight: 10, medWeight: 8, enabled: true },
    { id: '6', name: 'Go-To-Market (GTM) Risk', techWeight: 10, medWeight: 5, enabled: true },
    { id: '7', name: 'Financial Risk', techWeight: 10, medWeight: 10, enabled: true },
    { id: '8', name: 'Team / Execution Risk', techWeight: 8, medWeight: 8, enabled: true },
    { id: '9', name: 'IP / Defensibility Risk', techWeight: 8, medWeight: 10, enabled: true },
    { id: '10', name: 'Data Privacy / Governance', techWeight: 7, medWeight: 5, enabled: true },
    { id: '11', name: 'Security / Cyber Risk', techWeight: 7, medWeight: 5, enabled: true },
    { id: '12', name: 'Operational / Supply Chain', techWeight: 5, medWeight: 6, enabled: true },
    { id: '13', name: 'Ethical / Societal Risk', techWeight: 4, medWeight: 3, enabled: true },
    { id: '14', name: 'Adoption / Customer Retention Risk', techWeight: 4, medWeight: 2, enabled: true },
];

// ─── Startup Steroid Risk Penalties (flag severity penalties) ────────────────────
const defaultStartupSteroidRiskPenalties = [
    { id: 'green', flag: '🟢 Green', techPenalty: 0, medPenalty: 0 },
    { id: 'yellow', flag: '🟡 Yellow', techPenalty: -0.5, medPenalty: -1.0 },
    { id: 'red', flag: '🔴 Red', techPenalty: -3.0, medPenalty: -6.0 },
];

// ─── Startup Steroid Mandatory Fields (spec section 6) ───────────────────────────
const startupSteroidMandatoryFields = [
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

// ─── TCA Scorecard Categories for Startup Steroid Configuration ──────────────────
// Matches categories from /analysis/modules/tca (General + MedTech dual-framework)
const defaultTcaScorecardCategories = [
    { id: 'leadership', name: 'Leadership', weight: 20, enabled: true, medtechWeight: 15 },
    { id: 'pmf', name: 'Product-Market Fit / Product Quality', weight: 20, enabled: true, medtechWeight: 15 },
    { id: 'team', name: 'Team Strength', weight: 10, enabled: true, medtechWeight: 10 },
    { id: 'tech', name: 'Technology & IP', weight: 10, enabled: true, medtechWeight: 10 },
    { id: 'financials', name: 'Business Model & Financials', weight: 10, enabled: true, medtechWeight: 10 },
    { id: 'gtm', name: 'Go-to-Market Strategy', weight: 10, enabled: true, medtechWeight: 5 },
    { id: 'competition', name: 'Competition & Moat', weight: 5, enabled: true, medtechWeight: 5 },
    { id: 'market', name: 'Market Potential', weight: 5, enabled: true, medtechWeight: 5 },
    { id: 'traction', name: 'Traction', weight: 5, enabled: true, medtechWeight: 5 },
    { id: 'scalability', name: 'Scalability', weight: 2.5, enabled: true, medtechWeight: 0, medtechNA: true },
    { id: 'risk', name: 'Risk Assessment', weight: 2.5, enabled: true, medtechWeight: 0, medtechNA: true },
    { id: 'exit', name: 'Exit Potential', weight: 0, enabled: false, generalNA: true, medtechWeight: 0, medtechNA: true },
    { id: 'regulatory', name: 'Regulatory', weight: 0, enabled: false, generalNA: true, medtechWeight: 15 },
];


type ReportSection = {
    id: string;
    title: string;
    active: boolean;
    description: string;
};

type TcaScorecardCategory = {
    id: string;
    name: string;
    weight: number;
    enabled: boolean;
    medtechWeight: number;
    medtechNA?: boolean;
    generalNA?: boolean;
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
    const [startupSteroidSections, setStartupSteroidSections] = useState<ReportSection[]>(defaultStartupSteroidSections);

    const [newTriageSection, setNewTriageSection] = useState({ title: '', description: '' });
    const [newDdSection, setNewDdSection] = useState({ title: '', description: '' });
    const [newStartupSteroidSection, setNewStartupSteroidSection] = useState({ title: '', description: '' });

    // Startup Steroid Integration settings
    const [ssdCallbackUrl, setSsdCallbackUrl] = useState('');
    const [ssdEndpointUrl, setSsdEndpointUrl] = useState('/api/v1/startup-steroid/tirr');
    const [ssdTestStatus, setSsdTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [ssdTestResult, setSsdTestResult] = useState<string>('');
    const [startupSteroidThresholds, setStartupSteroidThresholds] = useState(defaultStartupSteroidThresholds);
    // Aliases for backward compatibility with short names
    const ssdThresholds = startupSteroidThresholds;
    const setSsdThresholds = setStartupSteroidThresholds;
    const [tcaScorecardCategories, setTcaScorecardCategories] = useState(defaultTcaScorecardCategories);
    const [startupSteroidRiskDomains, setStartupSteroidRiskDomains] = useState(defaultStartupSteroidRiskDomains);
    const [startupSteroidRiskPenalties, setStartupSteroidRiskPenalties] = useState(defaultStartupSteroidRiskPenalties);
    // More aliases for shorthand variable names
    const ssdRiskDomains = startupSteroidRiskDomains;
    const setSsdRiskDomains = setStartupSteroidRiskDomains;
    const defaultSsdRiskDomains = defaultStartupSteroidRiskDomains;
    const ssdRiskPenalties = startupSteroidRiskPenalties;
    const setSsdRiskPenalties = setStartupSteroidRiskPenalties;
    const defaultSsdRiskPenalties = defaultStartupSteroidRiskPenalties;
    const ssdMandatoryFields = startupSteroidMandatoryFields;
    const [showPreview, setShowPreview] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewDataOverride, setPreviewDataOverride] = useState<null | typeof rawSampleData>(null);

    const { toast } = useToast();

    // Normalize TCA weights to 100%
    const normalizeTcaWeights = (type: 'general' | 'medtech') => {
        const enabledCategories = tcaScorecardCategories.filter(c => c.enabled);
        if (enabledCategories.length === 0) return;

        const currentTotal = type === 'general'
            ? enabledCategories.reduce((sum, c) => sum + c.weight, 0)
            : enabledCategories.reduce((sum, c) => sum + (c.medtechWeight || 0), 0);

        if (currentTotal === 0) return;

        const scaleFactor = 100 / currentTotal;
        const updated = tcaScorecardCategories.map(cat => {
            if (!cat.enabled) return cat;
            if (type === 'general') {
                return { ...cat, weight: Math.round(cat.weight * scaleFactor * 10) / 10 };
            } else {
                return { ...cat, medtechWeight: Math.round((cat.medtechWeight || 0) * scaleFactor * 10) / 10 };
            }
        });

        // Final adjustment to ensure exactly 100%
        const newTotal = type === 'general'
            ? updated.filter(c => c.enabled).reduce((sum, c) => sum + c.weight, 0)
            : updated.filter(c => c.enabled).reduce((sum, c) => sum + (c.medtechWeight || 0), 0);

        if (newTotal !== 100 && updated.filter(c => c.enabled).length > 0) {
            const firstEnabled = updated.findIndex(c => c.enabled);
            if (firstEnabled !== -1) {
                const diff = 100 - newTotal;
                if (type === 'general') {
                    updated[firstEnabled] = { ...updated[firstEnabled], weight: Math.round((updated[firstEnabled].weight + diff) * 10) / 10 };
                } else {
                    updated[firstEnabled] = { ...updated[firstEnabled], medtechWeight: Math.round(((updated[firstEnabled].medtechWeight || 0) + diff) * 10) / 10 };
                }
            }
        }

        setTcaScorecardCategories(updated);
        toast({ title: 'Weights Normalized', description: `${type === 'general' ? 'General' : 'MedTech'} weights adjusted to total 100%` });
    };

    // Normalize Risk Domain weights to 100%
    const normalizeRiskWeights = (type: 'tech' | 'medtech') => {
        const enabledDomains = startupSteroidRiskDomains.filter(d => d.enabled);
        if (enabledDomains.length === 0) return;

        const currentTotal = type === 'tech'
            ? enabledDomains.reduce((sum, d) => sum + d.techWeight, 0)
            : enabledDomains.reduce((sum, d) => sum + d.medWeight, 0);

        if (currentTotal === 0) return;

        const scaleFactor = 100 / currentTotal;
        const updated = startupSteroidRiskDomains.map(domain => {
            if (!domain.enabled) return domain;
            if (type === 'tech') {
                return { ...domain, techWeight: Math.round(domain.techWeight * scaleFactor) };
            } else {
                return { ...domain, medWeight: Math.round(domain.medWeight * scaleFactor) };
            }
        });

        // Final adjustment to ensure exactly 100%
        const newTotal = type === 'tech'
            ? updated.filter(d => d.enabled).reduce((sum, d) => sum + d.techWeight, 0)
            : updated.filter(d => d.enabled).reduce((sum, d) => sum + d.medWeight, 0);

        if (newTotal !== 100 && updated.filter(d => d.enabled).length > 0) {
            const firstEnabled = updated.findIndex(d => d.enabled);
            if (firstEnabled !== -1) {
                const diff = 100 - newTotal;
                if (type === 'tech') {
                    updated[firstEnabled] = { ...updated[firstEnabled], techWeight: updated[firstEnabled].techWeight + diff };
                } else {
                    updated[firstEnabled] = { ...updated[firstEnabled], medWeight: updated[firstEnabled].medWeight + diff };
                }
            }
        }

        setStartupSteroidRiskDomains(updated);
        toast({ title: 'Weights Normalized', description: `${type === 'tech' ? 'Tech' : 'MedTech'} risk weights adjusted to total 100%` });
    };

    // Expanded sample data for comprehensive 10-page report preview
    const rawSampleData = {
        companyName: 'TechVenture AI Inc.',
        industry: 'Technology / AI',
        stage: 'Series A',
        requestAmount: '$5,000,000',
        founded: '2021',
        location: 'San Francisco, CA',
        website: 'techventureai.com',
        tcaScore: 7.8,
        riskScore: 6.5,
        recommendation: 'PROCEED',
        analysisCompleteness: '95%',
        categories: [
            { name: 'Leadership', score: 8.2, weight: 20 },
            { name: 'Product-Market Fit', score: 7.5, weight: 20 },
            { name: 'Team Strength', score: 8.0, weight: 10 },
            { name: 'Technology & IP', score: 7.8, weight: 10 },
            { name: 'Business Model', score: 7.2, weight: 10 },
            { name: 'Go-to-Market', score: 7.5, weight: 10 },
            { name: 'Competition', score: 6.8, weight: 5 },
            { name: 'Market Potential', score: 8.5, weight: 5 },
            { name: 'Traction', score: 7.0, weight: 5 },
            { name: 'Scalability', score: 7.8, weight: 2.5 },
            { name: 'Risk Assessment', score: 6.5, weight: 2.5 },
        ],
        riskFlags: [
            { domain: 'Market Risk', flag: '🟡 Yellow', description: 'Competitive landscape emerging rapidly', severity: 'Medium' },
            { domain: 'Financial Risk', flag: '🟢 Green', description: 'Strong burn rate management', severity: 'Low' },
            { domain: 'Technical Execution', flag: '🟢 Green', description: 'Experienced tech team', severity: 'Low' },
            { domain: 'Regulatory', flag: '🟢 Green', description: 'Standard compliance requirements', severity: 'Low' },
            { domain: 'Team Risk', flag: '🟡 Yellow', description: 'Key person dependency', severity: 'Medium' },
        ],
        strengths: ['Strong founding team with domain expertise', 'Patent-pending AI technology', 'Early customer traction with Fortune 500', 'Clear go-to-market strategy'],
        concerns: ['Market competition increasing', 'Dependency on key technical hires', 'Runway needs extension'],
        aiInterpretation: 'The company demonstrates strong fundamentals with above-average leadership and technology scores. The AI analysis indicates high probability of achieving product-market fit within 12 months.',
        weightedBreakdown: [
            { category: 'Leadership', rawScore: 8.2, weight: 20, weightedScore: 1.64 },
            { category: 'Product-Market Fit', rawScore: 7.5, weight: 20, weightedScore: 1.50 },
            { category: 'Team Strength', rawScore: 8.0, weight: 10, weightedScore: 0.80 },
            { category: 'Technology & IP', rawScore: 7.8, weight: 10, weightedScore: 0.78 },
            { category: 'Business Model', rawScore: 7.2, weight: 10, weightedScore: 0.72 },
        ],
        marketData: {
            tam: '$50B',
            sam: '$12B',
            som: '$500M',
            marketScore: 8.5,
            growthRate: '25% CAGR',
        },
        teamData: {
            founders: ['John Smith (CEO) - 15y exp', 'Jane Doe (CTO) - 12y exp'],
            teamSize: 25,
            keyHires: ['VP Sales', 'VP Marketing'],
            gaps: ['CFO needed for Series B'],
        },
        financials: {
            revenue: '$1.2M ARR',
            burnRate: '$150K/month',
            runway: '14 months',
            techScore: 7.8,
            ipStatus: '2 patents pending',
        },
        ceoQuestions: [
            'What is your customer acquisition cost and how does it compare to LTV?',
            'How do you plan to defend against larger competitors entering the space?',
            'What are the key milestones for the next 18 months?',
            'How will you use the Series A funding?',
            'What keeps you up at night about this business?',
        ],
        finalDecision: {
            recommendation: 'PROCEED',
            fundingRecommendation: 'Recommend proceeding with due diligence',
            nextSteps: ['Complete financial DD', 'Technical review', 'Customer reference calls'],
            keyConditions: ['Board seat', 'Pro-rata rights', 'Information rights'],
        },
    };

    // Use real analysis data for preview if available, otherwise fall back to sample data
    const sampleReportData = previewDataOverride ?? rawSampleData;

    // Generate sample report and log
    const generateSampleReport = async () => {
        setPreviewLoading(true);
        try {
            // Try to load real analysis data from localStorage
            try {
                const storedAnalysis = localStorage.getItem('analysisResult');
                const storedCompanyName = localStorage.getItem('analysisCompanyName');
                if (storedAnalysis) {
                    const analysis = JSON.parse(storedAnalysis);
                    const tcaScore = typeof analysis?.tcaData?.overallScore === 'number'
                        ? analysis.tcaData.overallScore : rawSampleData.tcaScore;
                    const riskScore = typeof analysis?.riskData?.overallRiskScore === 'number'
                        ? analysis.riskData.overallRiskScore : rawSampleData.riskScore;
                    const categories = Array.isArray(analysis?.tcaData?.categories) && analysis.tcaData.categories.length > 0
                        ? analysis.tcaData.categories : rawSampleData.categories;
                    const recommendation: 'PROCEED' | 'CONDITIONAL' | 'PASS' =
                        tcaScore >= 7 ? 'PROCEED' : tcaScore >= 5.5 ? 'CONDITIONAL' : 'PASS';
                    setPreviewDataOverride({
                        ...rawSampleData,
                        companyName: storedCompanyName || rawSampleData.companyName,
                        tcaScore: Math.round(tcaScore * 10) / 10,
                        riskScore: Math.round(riskScore * 10) / 10,
                        recommendation,
                        categories,
                        aiInterpretation: analysis?.tcaData?.aiInterpretation || rawSampleData.aiInterpretation,
                        strengths: Array.isArray(analysis?.tcaData?.strengths) ? analysis.tcaData.strengths : rawSampleData.strengths,
                        concerns: Array.isArray(analysis?.tcaData?.concerns) ? analysis.tcaData.concerns : rawSampleData.concerns,
                    });
                }
            } catch {
                // Keep rawSampleData fallback if localStorage read fails
            }

            const reportLog = {
                timestamp: new Date().toISOString(),
                type: 'sample_report_preview',
                config: {
                    triageSectionsAdmin,
                    tcaScorecardCategories,
                    startupSteroidRiskDomains,
                    startupSteroidThresholds,
                },
                sampleData: sampleReportData,
            };
            console.log('Sample Report Generated:', JSON.stringify(reportLog, null, 2));
            localStorage.setItem('last-report-preview-log', JSON.stringify(reportLog));
            setShowPreview(true);
            toast({ title: 'Preview Generated', description: 'Sample report preview created and logged for quality review.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate preview' });
        } finally {
            setPreviewLoading(false);
        }
    };

    useEffect(() => {
        try {
            const savedTriageAdmin = localStorage.getItem('report-config-triage-admin');
            const savedTriageStandard = localStorage.getItem('report-config-triage-standard');
            const savedDd = localStorage.getItem('report-config-dd');
            const savedSsd = localStorage.getItem('report-config-ssd-sections');
            const savedSsdCallback = localStorage.getItem('report-config-ssd-callback');
            const savedStartupSteroidThresholds = localStorage.getItem('report-config-ssd-thresholds');
            const savedTcaCategories = localStorage.getItem('report-config-tca-scorecard-categories');
            const savedStartupSteroidRiskDomains = localStorage.getItem('report-config-ssd-risk-domains');
            const savedStartupSteroidRiskPenalties = localStorage.getItem('report-config-ssd-risk-penalties');
            if (savedTriageAdmin) setTriageSectionsAdmin(JSON.parse(savedTriageAdmin));
            if (savedTriageStandard) setTriageSectionsStandard(JSON.parse(savedTriageStandard));
            if (savedDd) setDdSections(JSON.parse(savedDd));
            // Startup Steroid sections migration: ensure all 10 pages are present
            if (savedSsd) {
                const parsedSsd = JSON.parse(savedSsd);
                // If saved config has fewer pages than default, reset to default
                if (parsedSsd.length < defaultStartupSteroidSections.length) {
                    console.log('Migrating Startup Steroid sections from', parsedSsd.length, 'to', defaultStartupSteroidSections.length, 'pages');
                    setStartupSteroidSections(defaultStartupSteroidSections);
                    localStorage.setItem('report-config-ssd-sections', JSON.stringify(defaultStartupSteroidSections));
                } else {
                    setStartupSteroidSections(parsedSsd);
                }
            }
            if (savedSsdCallback) setSsdCallbackUrl(savedSsdCallback);
            if (savedStartupSteroidThresholds) setStartupSteroidThresholds(JSON.parse(savedStartupSteroidThresholds));
            // TCA categories migration: ensure medtechWeight exists
            if (savedTcaCategories) {
                const parsedCategories = JSON.parse(savedTcaCategories);
                const migratedCategories = parsedCategories.map((cat: TcaScorecardCategory, idx: number) => ({
                    ...cat,
                    medtechWeight: cat.medtechWeight ?? defaultTcaScorecardCategories[idx]?.medtechWeight ?? cat.weight
                }));
                setTcaScorecardCategories(migratedCategories);
            }
            if (savedStartupSteroidRiskDomains) setStartupSteroidRiskDomains(JSON.parse(savedStartupSteroidRiskDomains));
            if (savedStartupSteroidRiskPenalties) setStartupSteroidRiskPenalties(JSON.parse(savedStartupSteroidRiskPenalties));
        } catch (error) {
            console.error("Failed to load report configurations from localStorage", error);
        }
    }, []);

    const handleUpdate = (reportType: 'triageAdmin' | 'triageStandard' | 'dd' | 'startupSteroid', sectionId: string, field: keyof ReportSection, value: string | boolean) => {
        const setSections = reportType === 'triageAdmin' ? setTriageSectionsAdmin
            : reportType === 'triageStandard' ? setTriageSectionsStandard
                : reportType === 'startupSteroid' ? setStartupSteroidSections
                    : setDdSections;
        setSections(prev =>
            prev.map(s => s.id === sectionId ? { ...s, [field]: value } : s)
        );
    };

    const handleRemove = (reportType: 'triageAdmin' | 'triageStandard' | 'dd' | 'startupSteroid', sectionId: string) => {
        const setSections = reportType === 'triageAdmin' ? setTriageSectionsAdmin
            : reportType === 'triageStandard' ? setTriageSectionsStandard
                : reportType === 'startupSteroid' ? setStartupSteroidSections
                    : setDdSections;
        setSections(prev => prev.filter(s => s.id !== sectionId));
    };

    const handleAdd = (reportType: 'triageAdmin' | 'triageStandard' | 'dd' | 'startupSteroid') => {
        let setSections, newSectionData, setNewSectionData;
        if (reportType === 'triageAdmin' || reportType === 'triageStandard') {
            setSections = reportType === 'triageAdmin' ? setTriageSectionsAdmin : setTriageSectionsStandard;
            newSectionData = newTriageSection;
            setNewSectionData = setNewTriageSection;
        } else if (reportType === 'startupSteroid') {
            setSections = setStartupSteroidSections;
            newSectionData = newStartupSteroidSection;
            setNewSectionData = setNewStartupSteroidSection;
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

    const handleReset = (reportType: 'triageAdmin' | 'triageStandard' | 'dd' | 'startupSteroid') => {
        if (reportType === 'triageAdmin') setTriageSectionsAdmin(defaultTriageSectionsAdmin);
        if (reportType === 'triageStandard') setTriageSectionsStandard(defaultTriageSectionsStandard);
        if (reportType === 'dd') setDdSections(defaultDdSections);
        if (reportType === 'startupSteroid') {
            setStartupSteroidSections(defaultStartupSteroidSections);
            setStartupSteroidThresholds(defaultStartupSteroidThresholds);
            setTcaScorecardCategories(defaultTcaScorecardCategories);
            setStartupSteroidRiskDomains(defaultStartupSteroidRiskDomains);
            setStartupSteroidRiskPenalties(defaultStartupSteroidRiskPenalties);
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
            // Use the centralized API configuration with CORS
            const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setSsdTestStatus('success');
                setSsdTestResult(`Backend connection successful! Status: ${data.status}, Database: ${data.database}. Startup Steroid endpoint: ${API_CONFIG.BASE_URL}/api/v1/startup-steroid/tirr`);
            } else {
                throw new Error(`Backend responded with status: ${response.status}`);
            }
        } catch (error) {
            setSsdTestStatus('error');
            const errMsg = error instanceof Error ? error.message : 'Unknown error';
            setSsdTestResult(`Failed to connect to backend at ${API_CONFIG.BASE_URL}. Error: ${errMsg}`);
        }
    };

    const handleSave = () => {
        try {
            localStorage.setItem('report-config-triage-admin', JSON.stringify(triageSectionsAdmin));
            localStorage.setItem('report-config-triage-standard', JSON.stringify(triageSectionsStandard));
            localStorage.setItem('report-config-dd', JSON.stringify(ddSections));
            localStorage.setItem('report-config-ssd-sections', JSON.stringify(startupSteroidSections));
            localStorage.setItem('report-config-ssd-callback', ssdCallbackUrl);
            localStorage.setItem('report-config-ssd-thresholds', JSON.stringify(startupSteroidThresholds));
            localStorage.setItem('report-config-tca-scorecard-categories', JSON.stringify(tcaScorecardCategories));
            localStorage.setItem('report-config-ssd-risk-domains', JSON.stringify(startupSteroidRiskDomains));
            localStorage.setItem('report-config-ssd-risk-penalties', JSON.stringify(startupSteroidRiskPenalties));
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
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            <header className="mb-8">
                <Link href="/dashboard/evaluation" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
                    <ArrowLeft className="size-4" />
                    Back to Dashboard
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Settings2 className="size-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Report Configuration</h1>
                </div>
                <p className="text-muted-foreground">Customize report sections, Startup Steroid integration settings, and scoring thresholds.</p>
            </header>

            <Tabs defaultValue="triage" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[500px] h-12">
                    <TabsTrigger value="triage" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <FileText className="size-4" />
                        <span className="hidden sm:inline">Triage Report</span>
                        <span className="sm:hidden">Triage</span>
                    </TabsTrigger>
                    <TabsTrigger value="dd" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <ClipboardList className="size-4" />
                        <span className="hidden sm:inline">Due Diligence</span>
                        <span className="sm:hidden">DD</span>
                    </TabsTrigger>
                    <TabsTrigger value="startupSteroid" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Link2 className="size-4" />
                        <span className="hidden sm:inline">Startup Steroid</span>
                        <span className="sm:hidden">SS</span>
                    </TabsTrigger>
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
                                    <TabsTrigger value="admin">Admin/Analyst View</TabsTrigger>
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

                {/* Startup Steroid Integration Tab */}
                <TabsContent value="startupSteroid">
                    <div className="space-y-6">
                        {/* Startup Steroid Integration Overview */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Link2 className="size-5" />
                                            Startup Steroid → TCA TIRR Integration
                                        </CardTitle>
                                        <CardDescription>Configure the integration endpoint for Startup Steroid Application report generation</CardDescription>
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
                                        <Input id="ssd-endpoint" value={ssdEndpointUrl} onChange={(e) => setSsdEndpointUrl(e.target.value)} placeholder="/api/v1/startup-steroid/tirr" />
                                        <p className="text-xs text-muted-foreground mt-1">The endpoint that receives Startup Steroid payloads (POST)</p>
                                    </div>
                                    <div>
                                        <Label htmlFor="ssd-callback">Callback URL (CaptureTCAReportResponse)</Label>
                                        <Input id="ssd-callback" value={ssdCallbackUrl} onChange={(e) => setSsdCallbackUrl(e.target.value)} placeholder="https://startup-steroid.com/api/CaptureTCAReportResponse" />
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

                        {/* Startup Steroid Report Sections */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Startup Steroid Triage Report Sections (10-Page Format)</CardTitle>
                                        <CardDescription>Configure sections included in the automated Startup Steroid triage report</CardDescription>
                                    </div>
                                    <Button variant="ghost" onClick={() => handleReset('startupSteroid')}><RotateCcw className="mr-2" /> Reset to Default</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ReportConfigTable
                                    sections={startupSteroidSections}
                                    onUpdate={(id, field, value) => handleUpdate('startupSteroid', id, field, value)}
                                    onRemove={(id) => handleRemove('startupSteroid', id)}
                                    setSections={setStartupSteroidSections}
                                />
                                <div className="mt-6 p-4 border-t">
                                    <h4 className="font-semibold mb-2">Add New Section</h4>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-grow space-y-2">
                                            <Input placeholder="Section Title" value={newStartupSteroidSection.title} onChange={(e) => setNewStartupSteroidSection({ ...newStartupSteroidSection, title: e.target.value })} />
                                            <Textarea placeholder="Section Description" value={newStartupSteroidSection.description} onChange={(e) => setNewStartupSteroidSection({ ...newStartupSteroidSection, description: e.target.value })} rows={2} />
                                        </div>
                                        <Button onClick={() => handleAdd('startupSteroid')}><Plus className="mr-2" /> Add Section</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* TCA Scorecard Configuration */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>TCA Scorecard Configuration</CardTitle>
                                        <CardDescription>Configure category weights for TCA analysis scoring - General and MedTech frameworks (each total should equal 100%)</CardDescription>
                                    </div>
                                    <Button variant="ghost" onClick={() => setTcaScorecardCategories(defaultTcaScorecardCategories)}>
                                        <RotateCcw className="mr-2" /> Reset to Default
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Category</TableHead>
                                            <TableHead className="w-[120px]">General Weight (%)</TableHead>
                                            <TableHead className="w-[120px]">MedTech Weight (%)</TableHead>
                                            <TableHead className="w-[100px] text-center">Enabled</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tcaScorecardCategories.map((category, index) => (
                                            <TableRow key={category.id}>
                                                <TableCell className="font-medium">{category.name}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={category.weight}
                                                        onChange={(e) => {
                                                            const updated = [...tcaScorecardCategories];
                                                            updated[index] = { ...category, weight: parseInt(e.target.value) || 0 };
                                                            setTcaScorecardCategories(updated);
                                                        }}
                                                        className="h-8 w-20"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={category.medtechWeight}
                                                        onChange={(e) => {
                                                            const updated = [...tcaScorecardCategories];
                                                            updated[index] = { ...category, medtechWeight: parseInt(e.target.value) || 0 };
                                                            setTcaScorecardCategories(updated);
                                                        }}
                                                        className="h-8 w-20"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={category.enabled}
                                                        onCheckedChange={(checked) => {
                                                            const updated = [...tcaScorecardCategories];
                                                            updated[index] = { ...category, enabled: checked };
                                                            setTcaScorecardCategories(updated);
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="mt-4 flex flex-wrap justify-between items-center gap-4 p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium">General Total:</span>
                                        <span className={`text-lg font-bold ${tcaScorecardCategories.filter(c => c.enabled).reduce((sum, c) => sum + c.weight, 0) === 100
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                            }`}>
                                            {tcaScorecardCategories.filter(c => c.enabled).reduce((sum, c) => sum + c.weight, 0)}%
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => normalizeTcaWeights('general')}
                                            disabled={tcaScorecardCategories.filter(c => c.enabled).reduce((sum, c) => sum + c.weight, 0) === 100}
                                        >
                                            <Scale className="size-4 mr-1" />
                                            Normalize
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium">MedTech Total:</span>
                                        <span className={`text-lg font-bold ${tcaScorecardCategories.filter(c => c.enabled).reduce((sum, c) => sum + (c.medtechWeight || 0), 0) === 100
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                            }`}>
                                            {tcaScorecardCategories.filter(c => c.enabled).reduce((sum, c) => sum + (c.medtechWeight || 0), 0)}%
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => normalizeTcaWeights('medtech')}
                                            disabled={tcaScorecardCategories.filter(c => c.enabled).reduce((sum, c) => sum + (c.medtechWeight || 0), 0) === 100}
                                        >
                                            <Scale className="size-4 mr-1" />
                                            Normalize
                                        </Button>
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

                        {/* Risk Domains Configuration */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Risk Domains Configuration</CardTitle>
                                        <CardDescription>Configure risk domains with Tech/General and MedTech weights (matches /analysis/modules/risk)</CardDescription>
                                    </div>
                                    <Button variant="ghost" onClick={() => setSsdRiskDomains(defaultSsdRiskDomains)}>
                                        <RotateCcw className="mr-2" /> Reset to Default
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Risk Domain</TableHead>
                                            <TableHead className="w-[120px]">Tech Weight (%)</TableHead>
                                            <TableHead className="w-[120px]">MedTech Weight (%)</TableHead>
                                            <TableHead className="w-[80px] text-center">Enabled</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ssdRiskDomains.map((domain, index) => (
                                            <TableRow key={domain.id}>
                                                <TableCell className="font-medium">{domain.name}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={domain.techWeight}
                                                        onChange={(e) => {
                                                            const updated = [...ssdRiskDomains];
                                                            updated[index] = { ...domain, techWeight: parseInt(e.target.value) || 0 };
                                                            setSsdRiskDomains(updated);
                                                        }}
                                                        className="h-8 w-20"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={domain.medWeight}
                                                        onChange={(e) => {
                                                            const updated = [...ssdRiskDomains];
                                                            updated[index] = { ...domain, medWeight: parseInt(e.target.value) || 0 };
                                                            setSsdRiskDomains(updated);
                                                        }}
                                                        className="h-8 w-20"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={domain.enabled}
                                                        onCheckedChange={(checked) => {
                                                            const updated = [...ssdRiskDomains];
                                                            updated[index] = { ...domain, enabled: checked };
                                                            setSsdRiskDomains(updated);
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="mt-4 flex flex-wrap justify-between items-center gap-4 p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium">Tech Total:</span>
                                        <span className={`text-lg font-bold ${ssdRiskDomains.filter(d => d.enabled).reduce((sum, d) => sum + d.techWeight, 0) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                                            {ssdRiskDomains.filter(d => d.enabled).reduce((sum, d) => sum + d.techWeight, 0)}%
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => normalizeRiskWeights('tech')}
                                            disabled={ssdRiskDomains.filter(d => d.enabled).reduce((sum, d) => sum + d.techWeight, 0) === 100}
                                        >
                                            <Scale className="size-4 mr-1" />
                                            Normalize
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium">MedTech Total:</span>
                                        <span className={`text-lg font-bold ${ssdRiskDomains.filter(d => d.enabled).reduce((sum, d) => sum + d.medWeight, 0) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                                            {ssdRiskDomains.filter(d => d.enabled).reduce((sum, d) => sum + d.medWeight, 0)}%
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => normalizeRiskWeights('medtech')}
                                            disabled={ssdRiskDomains.filter(d => d.enabled).reduce((sum, d) => sum + d.medWeight, 0) === 100}
                                        >
                                            <Scale className="size-4 mr-1" />
                                            Normalize
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Risk Penalties Configuration */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Risk Flag Penalties</CardTitle>
                                        <CardDescription>Configure score penalties for different risk flag severities</CardDescription>
                                    </div>
                                    <Button variant="ghost" onClick={() => setSsdRiskPenalties(defaultSsdRiskPenalties)}>
                                        <RotateCcw className="mr-2" /> Reset to Default
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Flag Severity</TableHead>
                                            <TableHead className="w-[150px]">Tech Penalty</TableHead>
                                            <TableHead className="w-[150px]">MedTech Penalty</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ssdRiskPenalties.map((penalty, index) => (
                                            <TableRow key={penalty.id}>
                                                <TableCell className="font-medium">{penalty.flag}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        value={penalty.techPenalty}
                                                        onChange={(e) => {
                                                            const updated = [...ssdRiskPenalties];
                                                            updated[index] = { ...penalty, techPenalty: parseFloat(e.target.value) || 0 };
                                                            setSsdRiskPenalties(updated);
                                                        }}
                                                        className="h-8 w-24"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        value={penalty.medPenalty}
                                                        onChange={(e) => {
                                                            const updated = [...ssdRiskPenalties];
                                                            updated[index] = { ...penalty, medPenalty: parseFloat(e.target.value) || 0 };
                                                            setSsdRiskPenalties(updated);
                                                        }}
                                                        className="h-8 w-24"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Report Preview Section */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Eye className="size-5" />
                                            Report Preview
                                        </CardTitle>
                                        <CardDescription>Preview report layout with sample data - generates quality log for review</CardDescription>
                                    </div>
                                    <Button onClick={generateSampleReport} disabled={previewLoading}>
                                        {previewLoading ? (
                                            <><Loader2 className="size-4 mr-2 animate-spin" />Generating...</>
                                        ) : (
                                            <><Play className="size-4 mr-2" />Generate Preview</>
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                            {showPreview && (
                                <CardContent className="space-y-6">
                                    {/* Page 1: Executive Summary */}
                                    <div className="border rounded-lg p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                                        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-primary">
                                            <FileText className="size-4" />
                                            PAGE 1: EXECUTIVE SUMMARY
                                        </div>
                                        <div className="text-center mb-6 pb-4 border-b">
                                            <h2 className="text-2xl font-bold text-primary">{sampleReportData.companyName}</h2>
                                            <p className="text-muted-foreground">{sampleReportData.industry} | {sampleReportData.stage}</p>
                                            <p className="text-sm">Funding Request: {sampleReportData.requestAmount}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow text-center">
                                                <div className="text-3xl font-bold text-blue-600">{sampleReportData.tcaScore}</div>
                                                <div className="text-sm text-muted-foreground">TCA Score</div>
                                            </div>
                                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow text-center">
                                                <div className="text-xl font-bold text-green-600">{sampleReportData.recommendation}</div>
                                                <div className="text-sm text-muted-foreground">Recommendation</div>
                                            </div>
                                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow text-center">
                                                <div className="text-xl font-bold">{sampleReportData.analysisCompleteness}</div>
                                                <div className="text-sm text-muted-foreground">Completeness</div>
                                            </div>
                                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow text-center">
                                                <div className="text-sm font-medium">{sampleReportData.location}</div>
                                                <div className="text-sm text-muted-foreground">Location</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Page 2: TCA Scorecard */}
                                    <div className="border rounded-lg p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                                        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-blue-600">
                                            <BarChart3 className="size-4" />
                                            PAGE 2: TCA SCORECARD
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {sampleReportData.categories.slice(0, 8).map((cat, i) => (
                                                <div key={i} className="p-3 bg-white dark:bg-slate-800 rounded border text-sm">
                                                    <div className="font-medium truncate">{cat.name}</div>
                                                    <div className="flex justify-between mt-1">
                                                        <span className="text-muted-foreground">{cat.weight}%</span>
                                                        <span className={`font-bold ${cat.score >= 7 ? 'text-green-600' : cat.score >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                            {cat.score}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Page 3: TCA AI Interpretation */}
                                    <div className="border rounded-lg p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                                        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-purple-600">
                                            <Settings2 className="size-4" />
                                            PAGE 3: TCA AI INTERPRETATION
                                        </div>
                                        <p className="text-sm bg-white dark:bg-slate-800 p-4 rounded border">{sampleReportData.aiInterpretation}</p>
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                                                <h4 className="font-semibold text-green-700 text-sm">Key Strengths</h4>
                                                <ul className="text-xs mt-1">
                                                    {sampleReportData.strengths.slice(0, 2).map((s, i) => <li key={i}>• {s}</li>)}
                                                </ul>
                                            </div>
                                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                                <h4 className="font-semibold text-yellow-700 text-sm">Areas to Watch</h4>
                                                <ul className="text-xs mt-1">
                                                    {sampleReportData.concerns.slice(0, 2).map((c, i) => <li key={i}>• {c}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Page 4: Weighted Score Breakdown */}
                                    <div className="border rounded-lg p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
                                        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-indigo-600">
                                            <Scale className="size-4" />
                                            PAGE 4: WEIGHTED SCORE BREAKDOWN
                                        </div>
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="text-xs">
                                                    <TableHead>Category</TableHead>
                                                    <TableHead className="text-center">Raw Score</TableHead>
                                                    <TableHead className="text-center">Weight</TableHead>
                                                    <TableHead className="text-center">Weighted</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {sampleReportData.weightedBreakdown.map((row, i) => (
                                                    <TableRow key={i} className="text-xs">
                                                        <TableCell>{row.category}</TableCell>
                                                        <TableCell className="text-center">{row.rawScore}</TableCell>
                                                        <TableCell className="text-center">{row.weight}%</TableCell>
                                                        <TableCell className="text-center font-bold">{row.weightedScore.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Page 5: Risk Assessment */}
                                    <div className="border rounded-lg p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                                        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-orange-600">
                                            <Shield className="size-4" />
                                            PAGE 5: RISK ASSESSMENT
                                        </div>
                                        <div className="text-center mb-4 p-4 bg-white dark:bg-slate-800 rounded">
                                            <div className="text-3xl font-bold text-orange-500">{sampleReportData.riskScore}</div>
                                            <div className="text-sm text-muted-foreground">Overall Risk Score</div>
                                        </div>
                                        <div className="space-y-2">
                                            {sampleReportData.riskFlags.map((flag, i) => (
                                                <div key={i} className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded border text-sm">
                                                    <span>{flag.flag}</span>
                                                    <span className="font-medium">{flag.domain}</span>
                                                    <span className="text-muted-foreground flex-1">{flag.description}</span>
                                                    <Badge variant="outline">{flag.severity}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Page 6: Flag Analysis Narrative */}
                                    <div className="border rounded-lg p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
                                        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-amber-600">
                                            <AlertTriangle className="size-4" />
                                            PAGE 6: FLAG ANALYSIS NARRATIVE
                                        </div>
                                        <div className="space-y-3">
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded border">
                                                <h4 className="font-semibold text-sm">Market Risk Analysis</h4>
                                                <p className="text-xs text-muted-foreground mt-1">Competitive landscape is evolving with new entrants. Company maintains differentiation through patent-pending technology.</p>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded border">
                                                <h4 className="font-semibold text-sm">Team Risk Analysis</h4>
                                                <p className="text-xs text-muted-foreground mt-1">Key person dependency on CTO mitigated by strong engineering team. Succession planning recommended.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Page 7: Market & Team */}
                                    <div className="border rounded-lg p-6 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20">
                                        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-teal-600">
                                            <Users className="size-4" />
                                            PAGE 7: MARKET & TEAM
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-white dark:bg-slate-800 rounded border">
                                                <h4 className="font-semibold text-sm mb-2">Market Opportunity</h4>
                                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                                    <div><div className="font-bold">{sampleReportData.marketData.tam}</div><div className="text-muted-foreground">TAM</div></div>
                                                    <div><div className="font-bold">{sampleReportData.marketData.sam}</div><div className="text-muted-foreground">SAM</div></div>
                                                    <div><div className="font-bold">{sampleReportData.marketData.som}</div><div className="text-muted-foreground">SOM</div></div>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-white dark:bg-slate-800 rounded border">
                                                <h4 className="font-semibold text-sm mb-2">Team Summary</h4>
                                                <ul className="text-xs space-y-1">
                                                    {sampleReportData.teamData.founders.map((f, i) => <li key={i}>• {f}</li>)}
                                                    <li className="text-muted-foreground">Team size: {sampleReportData.teamData.teamSize}</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Page 8: Financials & Technology */}
                                    <div className="border rounded-lg p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20">
                                        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-cyan-600">
                                            <TrendingUp className="size-4" />
                                            PAGE 8: FINANCIALS & TECHNOLOGY
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded border text-center">
                                                <div className="font-bold text-lg">{sampleReportData.financials.revenue}</div>
                                                <div className="text-xs text-muted-foreground">Revenue</div>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded border text-center">
                                                <div className="font-bold text-lg">{sampleReportData.financials.burnRate}</div>
                                                <div className="text-xs text-muted-foreground">Burn Rate</div>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded border text-center">
                                                <div className="font-bold text-lg">{sampleReportData.financials.runway}</div>
                                                <div className="text-xs text-muted-foreground">Runway</div>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded border text-center">
                                                <div className="font-bold text-lg">{sampleReportData.financials.ipStatus}</div>
                                                <div className="text-xs text-muted-foreground">IP Status</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Page 9: CEO Questions */}
                                    <div className="border rounded-lg p-6 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20">
                                        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-rose-600">
                                            <ClipboardList className="size-4" />
                                            PAGE 9: CEO QUESTIONS
                                        </div>
                                        <div className="space-y-2">
                                            {sampleReportData.ceoQuestions.map((q, i) => (
                                                <div key={i} className="p-3 bg-white dark:bg-slate-800 rounded border text-sm flex items-start gap-2">
                                                    <span className="font-bold text-rose-600">{i + 1}.</span>
                                                    <span>{q}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Page 10: Final Recommendation */}
                                    <div className="border rounded-lg p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
                                        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-emerald-600">
                                            <CheckCircle2 className="size-4" />
                                            PAGE 10: FINAL RECOMMENDATION
                                        </div>
                                        <div className="text-center mb-4 p-4 bg-white dark:bg-slate-800 rounded">
                                            <div className="text-3xl font-bold text-emerald-600">{sampleReportData.finalDecision.recommendation}</div>
                                            <p className="text-sm text-muted-foreground mt-1">{sampleReportData.finalDecision.fundingRecommendation}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded border">
                                                <h4 className="font-semibold text-sm mb-2">Next Steps</h4>
                                                <ul className="text-xs space-y-1">
                                                    {sampleReportData.finalDecision.nextSteps.map((s, i) => (
                                                        <li key={i} className="flex items-center gap-1">
                                                            <CheckCircle2 className="size-3 text-emerald-500" />{s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded border">
                                                <h4 className="font-semibold text-sm mb-2">Key Conditions</h4>
                                                <ul className="text-xs space-y-1">
                                                    {sampleReportData.finalDecision.keyConditions.map((c, i) => (
                                                        <li key={i}>• {c}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground text-center">
                                        Preview log saved to localStorage (key: last-report-preview-log) for quality review
                                    </p>
                                </CardContent>
                            )}
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

            {/* Sticky Save Footer */}
            <div className="sticky bottom-0 left-0 right-0 mt-8 -mx-4 md:-mx-8 px-4 md:px-8 py-4 bg-background/95 backdrop-blur border-t shadow-lg">
                <div className="container mx-auto max-w-7xl flex items-center justify-between">
                    <p className="text-sm text-muted-foreground hidden sm:block">
                        <CheckCircle2 className="size-4 inline mr-1 text-green-500" />
                        Changes are saved locally to your browser
                    </p>
                    <Button onClick={handleSave} size="lg" className="ml-auto gap-2">
                        <Save className="size-4" />
                        Save All Configurations
                    </Button>
                </div>
            </div>
        </div>
    );
}


