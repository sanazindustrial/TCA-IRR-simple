// Comprehensive analysis API route
import { NextRequest, NextResponse } from 'next/server';
import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';

const BACKEND_API_URL = 'http://127.0.0.1:8000/api';

export async function POST(request: NextRequest) {
    try {
        const { framework } = await request.json();

        // Validate framework
        if (!['general', 'medtech'].includes(framework)) {
            return NextResponse.json(
                { error: `Invalid framework: ${framework}` },
                { status: 400 }
            );
        }

        console.log('API Route: Running comprehensive analysis for framework:', framework);

        // Prepare comprehensive analysis payload
        const analysisPayload = {
            framework,
            sector: framework === 'medtech' ? 'life_sciences_medical' : 'technology_others',
            legacySector: framework === 'medtech' ? 'med_life' : 'tech',

            company_data: {
                name: 'Sample Company',
                description: 'AI-powered startup using machine learning for optimization',
                stage: 'seed',
                sector: framework === 'medtech' ? 'life_sciences_medical' : 'technology_others',
                framework: framework
            },

            tcaInput: {
                founderQuestionnaire: 'Our team has extensive experience in AI and SaaS. We are solving a major pain point in the market.',
                uploadedPitchDecks: 'Pitch deck contains market analysis, product roadmap, and financial projections.',
                financials: 'We have secured $500k in pre-seed funding and have a 12-month runway.',
                framework: framework,
            },

            riskInput: {
                marketConcerns: 'Competitive landscape is evolving rapidly',
                technicalChallenges: 'Scalability and data privacy are key considerations',
                operationalRisks: 'Talent acquisition in key technical roles'
            },

            macroInput: {
                marketTrends: 'AI adoption is accelerating across industries',
                economicFactors: 'Current funding environment is challenging but improving',
                regulatoryEnvironment: 'Data privacy regulations continue to evolve'
            },

            benchmarkInput: {
                competitors: ['Competitor A', 'Competitor B', 'Competitor C'],
                marketPosition: 'Strong differentiation in core technology'
            },

            Growth_classifier: {
                currentMetrics: 'Revenue growing 15% MoM, 1000+ active users',
                projections: '10x growth target over next 24 months'
            },

            Strategic_Fit_Matrix: {
                gotoMarket: 'Direct enterprise sales with channel partnerships',
                productMarketFit: 'Strong early indicators with pilot customers'
            },

            Gap_Analysis: {
                keyGaps: 'Sales team scaling, international expansion capability',
                timeline: '6-12 month roadmap for gap closure'
            },

            Funder_Fit_Analysis: {
                fundingNeeds: '$2M Series A to scale sales and product development',
                investorPreferences: 'Looking for strategic investors with industry expertise'
            },

            Team_Assessment: {
                currentTeam: 'CEO (15y exp), CTO (12y exp), 8 engineers',
                keyHires: 'VP Sales, VP Marketing, Senior Engineers'
            },

            stage: 'seed',
            companyName: 'Sample Company'
        };

        console.log('API Route: Making request to backend...');

        const response = await fetch(`${BACKEND_API_URL}/analysis/comprehensive`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(analysisPayload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Route: Backend error response:', errorText);
            return NextResponse.json(
                { error: `Backend analysis failed: ${response.status} ${response.statusText} - ${errorText}` },
                { status: response.status }
            );
        }

        const backendData = await response.json();
        console.log('API Route: Successfully received backend response');

        // Return the backend data directly since it's already in the correct format
        return NextResponse.json(backendData);

    } catch (error) {
        console.error('API Route: Analysis failed:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                details: 'Failed to run comprehensive analysis'
            },
            { status: 500 }
        );
    }
}