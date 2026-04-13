
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
    description: 'The core of the evaluation. It assesses the startup across 12 fundamental categories like Leadership, Product-Market Fit, and Team Strength. Each category is given a raw score (1-10) and a weighted score based on the selected framework (General or MedTech).',
  },
  {
    icon: ShieldAlert,
    title: 'Risk Flags',
    description: 'Analyzes the startup across 14 standard risk domains (e.g., Regulatory, Market, Technical). It assigns a "red," "yellow," or "green" flag to each domain, provides a description of the risk, and suggests mitigation strategies.',
  },
  {
    icon: Activity,
    title: 'Benchmark Comparison',
    description: 'Compares the startup’s key metrics (like revenue growth and retention) against sector averages and top performers. It generates percentile rankings and a spider chart comparing the startup to fictional competitors.',
  },
  {
    icon: Globe,
    title: 'Macro Trend Alignment',
    description: 'Uses a PESTEL (Political, Economic, Social, Technological, Environmental, Legal) framework to assess how well the startup aligns with broader macro-economic trends. It provides alignment scores and an overall trend overlay score.',
  },
  {
    icon: Search,
    title: 'Gap Analysis',
    description: 'Identifies performance gaps by comparing the startup’s TCA scores against an "investor-ready" ideal profile. It highlights critical, major, and minor gaps and provides a recommended action plan to address them.',
  },
  {
    icon: TrendingUp,
    title: 'Growth Classifier',
    description: 'A 6-model ensemble (DSS) that predicts the startup’s growth potential. It classifies the company into one of three tiers (High, Moderate, or Low Growth) and provides scenario simulations (best, base, worst case).',
  },
  {
    icon: DollarSign,
    title: 'Funder Fit Analysis',
    description: 'Determines the startup’s alignment with potential investors. It generates a "Funding Readiness" score and provides a shortlist of VCs whose investment thesis matches the startup’s profile.',
  },
  {
    icon: Users,
    title: 'Team Assessment',
    description: 'Evaluates the strength and completeness of the founding team. It analyzes dimensions like Founder-Market Fit, Execution Capability, and Leadership, and can use NLP to parse resumes for behavioral traits.',
  },
  {
    icon: LayoutGrid,
    title: 'Strategic Fit Matrix',
    description: 'Assesses the startup’s alignment with key strategic pathways, such as "Build," "Buy," or "Partner." It provides a fit score for different corporate strategies, which is useful for M&A or partnership considerations.',
  },
];
