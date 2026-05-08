import {
  ClipboardList,
  ShieldAlert,
  Activity,
  Globe,
  Search,
  TrendingUp,
  DollarSign,
  Users,
  LayoutGrid,
  BarChart2,
  Leaf,
  Megaphone,
  Heart,
  Target,
  Compass,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';

export type ModuleGuide = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const modules: ModuleGuide[] = [
  {
    icon: ClipboardList,
    title: 'TCA Scorecard',
    description: 'The core of the evaluation. Assesses the startup across 12 fundamental categories like Leadership, Product-Market Fit, and Team Strength. Each category gets a raw score (1-10) and a weighted score based on the selected framework.',
  },
  {
    icon: ShieldAlert,
    title: 'Risk Flags',
    description: 'Analyzes the startup across 14 risk domains (Regulatory, Market, Technical, etc.). Assigns a red, yellow, or green flag to each domain and suggests mitigation strategies.',
  },
  {
    icon: Activity,
    title: 'Benchmark Comparison',
    description: 'Compares the startup key metrics (revenue growth, retention) against sector averages and top performers. Generates percentile rankings and a spider chart.',
  },
  {
    icon: Globe,
    title: 'Macro Trend Alignment',
    description: 'Uses a PESTEL framework to assess how well the startup aligns with broader macro-economic trends. Provides alignment scores and an overall trend overlay score.',
  },
  {
    icon: Search,
    title: 'Gap Analysis',
    description: 'Identifies performance gaps by comparing TCA scores against an investor-ready ideal profile. Highlights critical, major, and minor gaps with a recommended action plan.',
  },
  {
    icon: TrendingUp,
    title: 'Growth Classifier',
    description: 'A 6-model ensemble that predicts the startup growth potential. Classifies the company into High, Moderate, or Low Growth tiers with scenario simulations (best, base, worst case).',
  },
  {
    icon: DollarSign,
    title: 'Funder Fit Analysis',
    description: 'Determines alignment with potential investors. Generates a Funding Readiness score and provides a shortlist of VCs whose investment thesis matches the startup profile.',
  },
  {
    icon: Users,
    title: 'Team Assessment',
    description: 'Evaluates the founding team across Founder-Market Fit, Execution Capability, and Leadership. Can use NLP to parse resumes for behavioral traits.',
  },
  {
    icon: LayoutGrid,
    title: 'Strategic Fit Matrix',
    description: 'Assesses alignment with strategic pathways such as Build, Buy, or Partner. Provides a fit score for different corporate strategies, useful for M&A considerations.',
  },
  {
    icon: BarChart2,
    title: 'Financial Analysis',
    description: 'Deep-dive into financial health including revenue trajectory, burn rate, runway, unit economics, and P&L structure. Generates a forward-looking 18-month financial model.',
  },
  {
    icon: TrendingUp,
    title: 'Economic Impact',
    description: 'Quantifies the broader economic contribution of the startup: job creation, multiplier effects, regional GDP impact, and supply-chain value for impact-focused evaluations.',
  },
  {
    icon: Heart,
    title: 'Social Impact',
    description: 'Measures social value creation using SROI and SDG alignment frameworks. Evaluates community benefit, DEI practices, and stakeholder well-being.',
  },
  {
    icon: Megaphone,
    title: 'Marketing Assessment',
    description: 'Evaluates go-to-market strategy, brand positioning, digital presence, CAC, and channel mix effectiveness. Provides a competitive differentiation score and marketing maturity index.',
  },
  {
    icon: Leaf,
    title: 'Environmental Analysis',
    description: 'Assesses environmental footprint and sustainability practices. Covers carbon emissions, ESG compliance, circular economy alignment, and readiness for green-finance instruments.',
  },
  {
    icon: Compass,
    title: 'Strategic Planning',
    description: 'Reviews the startup strategic roadmap, OKR framework, competitive moat, and long-term positioning. Scores the quality of the 3-5 year growth plan against market realities.',
  },
  {
    icon: UserCheck,
    title: 'Founder Fit',
    description: 'Evaluates alignment between the founding team background, domain expertise, and the problem they are solving. Includes psychometric indicators and prior exit history analysis.',
  },
  {
    icon: Target,
    title: 'Analyst Review',
    description: 'Captures manual analyst inputs, commentary, and score overrides that supplement AI-generated results. Enables senior analysts to add due-diligence notes and adjust final recommendations.',
  },
];