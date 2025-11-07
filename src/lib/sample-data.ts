// Sample data for analysis components - extracted to avoid Next.js entry export issues

// Define the comprehensive analysis output type
export type ComprehensiveAnalysisOutput = {
    tcaData: {
        categories: Array<{
            category: string;
            rawScore: number;
            weight: number;
            weightedScore: number;
            flag: "green" | "yellow" | "red";
            pestel: string;
            description: string;
            strengths: string;
            concerns: string;
            interpretation: string;
            aiRecommendation: string;
        }>;
        compositeScore: number;
        summary: string;
    };
    riskData: {
        riskSummary: string;
        riskFlags: Array<{
            domain: string;
            flag: 'green' | 'yellow' | 'red';
            trigger: string;
            description: string;
            impact: string;
            mitigation: string;
            aiRecommendation: string;
            thresholds: string;
        }>;
    };
    macroData: {
        pestelDashboard: {
            political: number;
            economic: number;
            social: number;
            technological: number;
            environmental: number;
            legal: number;
        };
        trendOverlayScore: number;
        summary: string;
        sectorOutlook: string;
        trendSignals: string[];
    };
    benchmarkData: {
        benchmarkOverlay: Array<{
            category: string;
            score: number;
            avg: number;
            percentile: number;
            deviation: number;
        }>;
        competitorAnalysis: Array<{
            metric: string;
            startup: number;
            competitorA: number;
            competitorB: number;
        }>;
        performanceSummary: string;
        overlayScore: number;
    };
    growthData: {
        tier: number;
        confidence: number;
        scenarios: Array<{
            name: string;
            growth: number;
        }>;
        analysis: string;
        models: Array<{
            name: string;
            score: number;
            contribution: string;
        }>;
        interpretation: string;
    };
    gapData: {
        heatmap: Array<{
            category: string;
            gap: number;
            priority: string;
            trend: number;
            direction: string;
        }>;
        roadmap: Array<{
            area: string;
            action: string;
            type: string;
        }>;
        interpretation: string;
    };
    founderFitData: {
        readinessScore: number;
        investorList: Array<{
            name: string;
            thesis: string;
            match: number;
            stage: string;
        }>;
        interpretation: string;
    };
    teamData: {
        teamScore: number;
        members: Array<{
            name: string;
            role: string;
            experience: string;
            skills: string;
            avatarId: string;
        }>;
        interpretation: string;
    };
    strategicFitData: any;
};

export const sampleAnalysisData: ComprehensiveAnalysisOutput = {
    tcaData: {
        categories: [
            {
                category: 'Leadership',
                rawScore: 8.5,
                weight: 20,
                weightedScore: 1.7,
                flag: 'green',
                pestel: 'Social',
                description: 'Assesses the quality, experience, and vision of the leadership team.',
                strengths: 'Experienced founders with multiple prior exits.',
                concerns: 'First-time CEO.',
                interpretation: 'Strong leadership is a key asset.',
                aiRecommendation: 'Leverage founder track record in investor meetings.'
            }
        ],
        compositeScore: 8.17,
        summary: 'Strong potential with excellent leadership and product-market fit.'
    },
    riskData: {
        riskSummary: 'Primary risks are market competition and go-to-market execution.',
        riskFlags: [
            {
                domain: 'Market Risk',
                flag: 'yellow',
                trigger: 'Incumbent competitors are well-funded.',
                description: 'The market has 3-4 established players.',
                impact: 'Medium',
                mitigation: 'Focus on a niche vertical to establish a strong foothold.',
                aiRecommendation: 'Niche-down strategy is advised.',
                thresholds: 'Yellow if >2 major competitors.'
            }
        ]
    },
    macroData: {
        pestelDashboard: {
            political: 7,
            economic: 6,
            social: 8,
            technological: 9,
            environmental: 7,
            legal: 8
        },
        trendOverlayScore: 0.04,
        summary: 'Well-aligned with major technological and social trends.',
        sectorOutlook: 'B2B SaaS sector remains strong.',
        trendSignals: ['Increased enterprise adoption of AI']
    },
    benchmarkData: {
        benchmarkOverlay: [
            {
                category: 'Revenue Growth',
                score: 8.5,
                avg: 6.5,
                percentile: 80,
                deviation: 2.0
            }
        ],
        competitorAnalysis: [
            {
                metric: 'Growth',
                startup: 8.5,
                competitorA: 7.0,
                competitorB: 6.0
            }
        ],
        performanceSummary: 'Outperforms peers in revenue growth.',
        overlayScore: 0.035
    },
    growthData: {
        tier: 2,
        confidence: 82,
        scenarios: [
            { name: 'Base Case', growth: 2.5 }
        ],
        analysis: 'Moderate growth potential with strong positioning.',
        models: [
            { name: 'XGBoost', score: 8.1, contribution: '20%' }
        ],
        interpretation: 'Solid foundation with areas for improvement.'
    },
    gapData: {
        heatmap: [
            {
                category: 'Team Strength',
                gap: -25,
                priority: 'High',
                trend: -5,
                direction: 'down'
            }
        ],
        roadmap: [
            {
                area: 'Team Strength',
                action: 'Hire a senior backend engineer.',
                type: 'Priority Area'
            }
        ],
        interpretation: 'Critical deficiencies in Team Strength.'
    },
    founderFitData: {
        readinessScore: 78,
        investorList: [
            {
                name: 'Sequoia',
                thesis: 'SaaS',
                match: 92,
                stage: 'Seed'
            }
        ],
        interpretation: 'Strong readiness score.'
    },
    teamData: {
        teamScore: 7.5,
        members: [
            {
                name: 'John Doe',
                role: 'CEO',
                experience: '10 years',
                skills: 'Leadership, Strategy',
                avatarId: '1'
            }
        ],
        interpretation: 'Strong technical team.'
    },
    strategicFitData: {}
};