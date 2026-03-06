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
                weight: 15,
                weightedScore: 1.28,
                flag: 'green',
                pestel: 'Political: Regulatory approval processes; Social: Public trust in leadership',
                description: 'Evaluates founder/CEO experience, vision clarity, and decision-making capability',
                strengths: 'Strong technical background, clear communication, proven track record',
                concerns: 'Limited industry experience, single founder risk',
                interpretation: 'Strong leadership foundation with room for advisory board expansion',
                aiRecommendation: 'Consider adding industry veterans to advisory board'
            },
            {
                category: 'Regulatory/Compliance',
                rawScore: 7.0,
                weight: 15,
                weightedScore: 1.05,
                flag: 'yellow',
                pestel: 'Political: FDA regulations; Legal: Compliance requirements; Economic: Approval costs',
                description: 'Assesses regulatory pathway clarity, compliance readiness, and approval timeline',
                strengths: 'Clear regulatory pathway identified, initial FDA engagement',
                concerns: 'Complex approval process, potential delays, high compliance costs',
                interpretation: 'Moderate regulatory risk with manageable pathway',
                aiRecommendation: 'Engage regulatory consultant and establish compliance timeline'
            },
            {
                category: 'Product-Market Fit',
                rawScore: 9.0,
                weight: 15,
                weightedScore: 1.35,
                flag: 'green',
                pestel: 'Social: Patient needs; Economic: Market demand; Technological: Innovation fit',
                description: 'Measures product-market alignment, customer validation, and market demand evidence',
                strengths: 'Strong customer validation, clear unmet need, positive pilot results',
                concerns: 'Limited market testing, potential competition',
                interpretation: 'Excellent product-market alignment with strong validation',
                aiRecommendation: 'Expand pilot programs and gather additional customer testimonials'
            },
            {
                category: 'Team Strength',
                rawScore: 7.5,
                weight: 10,
                weightedScore: 0.75,
                flag: 'yellow',
                pestel: 'Social: Team dynamics; Economic: Talent costs; Technological: Technical expertise',
                description: 'Evaluates team composition, expertise coverage, and execution capability',
                strengths: 'Strong technical team, complementary skills, good retention',
                concerns: 'Missing commercial expertise, limited sales experience',
                interpretation: 'Solid foundation requiring commercial talent addition',
                aiRecommendation: 'Recruit experienced commercial team members'
            },
            {
                category: 'Technology & IP',
                rawScore: 8.0,
                weight: 10,
                weightedScore: 0.80,
                flag: 'green',
                pestel: 'Technological: Innovation level; Legal: IP protection; Economic: R&D investment',
                description: 'Assesses technology differentiation, IP portfolio strength, and defensibility',
                strengths: 'Strong patent portfolio, innovative technology, clear differentiation',
                concerns: 'Competitive IP landscape, potential infringement risks',
                interpretation: 'Well-protected innovative technology with competitive advantages',
                aiRecommendation: 'Continue IP development and monitor competitive landscape'
            },
            {
                category: 'Business Model & Financials',
                rawScore: 7.0,
                weight: 10,
                weightedScore: 0.70,
                flag: 'yellow',
                pestel: 'Economic: Revenue model; Legal: Contract structures; Political: Reimbursement',
                description: 'Reviews revenue model viability, unit economics, and financial sustainability',
                strengths: 'Clear revenue model, positive unit economics potential',
                concerns: 'Unproven scalability, reimbursement uncertainty',
                interpretation: 'Promising model requiring validation and refinement',
                aiRecommendation: 'Validate unit economics through pilot implementations'
            },
            {
                category: 'Go-to-Market Strategy',
                rawScore: 6.5,
                weight: 5,
                weightedScore: 0.33,
                flag: 'red',
                pestel: 'Social: Customer adoption; Economic: Market access costs; Political: Channel regulations',
                description: 'Evaluates market entry strategy, sales approach, and customer acquisition plan',
                strengths: 'Identified key customer segments, partnership opportunities',
                concerns: 'Unclear sales strategy, limited channel validation, high CAC',
                interpretation: 'GTM strategy needs significant development and validation',
                aiRecommendation: 'Develop detailed sales playbook and validate customer acquisition channels'
            },
            {
                category: 'Competition & Moat',
                rawScore: 7.8,
                weight: 5,
                weightedScore: 0.39,
                flag: 'yellow',
                pestel: 'Economic: Market competition; Technological: Competitive advantages; Legal: Barriers',
                description: 'Analyzes competitive landscape, differentiation, and sustainable advantages',
                strengths: 'Clear differentiation, technological advantages, patent protection',
                concerns: 'Emerging competitors, potential market consolidation',
                interpretation: 'Strong competitive position with moderate threat monitoring needed',
                aiRecommendation: 'Monitor competitive developments and strengthen market positioning'
            },
            {
                category: 'Market Potential',
                rawScore: 8.8,
                weight: 5,
                weightedScore: 0.44,
                flag: 'green',
                pestel: 'Economic: Market size; Social: Demographics; Technological: Adoption trends',
                description: 'Assesses total addressable market, growth trends, and market dynamics',
                strengths: 'Large TAM, growing market, favorable demographics',
                concerns: 'Market fragmentation, adoption barriers',
                interpretation: 'Excellent market opportunity with strong growth potential',
                aiRecommendation: 'Focus on addressable segments and develop market entry priorities'
            },
            {
                category: 'Traction',
                rawScore: 7.2,
                weight: 5,
                weightedScore: 0.36,
                flag: 'yellow',
                pestel: 'Economic: Revenue growth; Social: Customer adoption; Technological: Usage metrics',
                description: 'Measures customer adoption, revenue growth, and validation milestones',
                strengths: 'Early customer adoption, positive feedback, pilot agreements',
                concerns: 'Limited revenue, slow customer onboarding, pilot conversion',
                interpretation: 'Promising early traction requiring acceleration',
                aiRecommendation: 'Accelerate pilot conversions and expand customer base'
            },
            {
                category: 'Scalability',
                rawScore: 6.8,
                weight: 2.5,
                weightedScore: 0.17,
                flag: 'yellow',
                pestel: 'Technological: Infrastructure; Economic: Cost structure; Social: Team scaling',
                description: 'Evaluates business scalability, operational leverage, and growth sustainability',
                strengths: 'Technology scalability, automation potential',
                concerns: 'Manual processes, limited operational systems',
                interpretation: 'Moderate scalability with operational improvements needed',
                aiRecommendation: 'Implement scalable processes and operational systems'
            },
            {
                category: 'Risk Assessment',
                rawScore: 7.5,
                weight: 2.5,
                weightedScore: 0.19,
                flag: 'yellow',
                pestel: 'All factors: Comprehensive risk evaluation across PESTEL dimensions',
                description: 'Overall risk evaluation including operational, financial, and strategic risks',
                strengths: 'Identified risk mitigation strategies, proactive risk management',
                concerns: 'Regulatory risks, market timing, execution risks',
                interpretation: 'Manageable risk profile with identified mitigation strategies',
                aiRecommendation: 'Implement risk monitoring dashboard and contingency plans'
            }
        ],
        compositeScore: 7.81,
        summary: 'Strong potential with excellent leadership and product-market fit. The 12-category analysis reveals a well-rounded startup with key strengths in leadership, technology, and market potential. Areas for improvement include go-to-market strategy and scalability.'
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