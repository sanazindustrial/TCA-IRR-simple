/**
 * Full Pipeline E2E Test
 * Upload → DB persist → 9-Module Analysis → Triage Report → DD Report
 */

const API = 'http://localhost:8000';

let passed = 0;
let failed = 0;
const results = [];

function assert(name, ok, detail) {
    if (ok) {
        passed++;
        results.push({
            name,
            status: 'PASS'
        });
        console.log(`  ✅ ${name}`);
    } else {
        failed++;
        results.push({
            name,
            status: 'FAIL',
            detail
        });
        console.log(`  ❌ ${name} – ${detail}`);
    }
}

async function post(path, body) {
    const r = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
    });
    return {
        status: r.status,
        data: await r.json()
    };
}

async function main() {
    console.log('\n═══════════════════════════════════════════');
    console.log('  FULL PIPELINE E2E TEST');
    console.log('  Upload → DB → 9-Module → Triage → DD');
    console.log('═══════════════════════════════════════════\n');

    // ── 1. Health check ─────────────────────────────────────────────────
    console.log('▶ 1. Health Check');
    try {
        const r = await fetch(`${API}/api/health`);
        const d = await r.json();
        assert('Backend health endpoint reachable', r.status === 200);
        assert('Database connected', d.database === 'connected' || d.status === 'healthy');
    } catch (e) {
        assert('Backend reachable', false, e.message);
        console.log('\n⛔ Backend not running. Start with: python main.py');
        process.exit(1);
    }

    // ── 2. Upload text data (simulated company pitch) ───────────────────
    console.log('\n▶ 2. Upload Company Data via Text Submission');
    let uploadId; {
        const payload = {
            title: 'TechVenture AI Pitch Deck',
            content: `
        TechVenture AI - Series A Investment Opportunity

        Company Overview:
        TechVenture AI is a SaaS platform providing AI-powered analytics for mid-market
        enterprises. Founded in 2022, the company has grown to 45 paying customers with
        $380,000 ARR. The platform processes over 2M data points daily.

        Team: 12 full-time employees including 2 co-founders with prior exits.
        - CEO: Jane Smith (ex-Google, Stanford MBA)
        - CTO: John Doe (ex-Meta, PhD CS from MIT)
        - VP Engineering: 3 senior engineers
        - Sales team: 4 reps

        Financials:
        - Revenue: $380,000 ARR
        - MRR: $31,667
        - Burn Rate: $120,000/month
        - Runway: 14 months
        - Gross Margin: 78%

        Market:
        - TAM: $12B AI Analytics Market
        - SAM: $3.2B Mid-Market Segment
        - SOM: $480M Addressable in 3 years

        Technology:
        - Proprietary NLP engine (2 patents pending)
        - Cloud-native microservices architecture
        - SOC 2 Type II certified

        Traction:
        - 45 enterprise customers
        - 120% net revenue retention
        - 15% month-over-month growth

        Ask: $3M Series A at $15M pre-money valuation
      `,
            company_name: 'TechVenture AI',
            source_type: 'text',
            extracted_data: {
                financial_data: {
                    revenue: 380000,
                    mrr: 31667,
                    burn_rate: 120000,
                    runway_months: 14,
                    gross_margin: 78,
                },
                key_metrics: {
                    team_size: 12,
                    customers: 45,
                    nrr: 120,
                    mrr: 31667,
                    mom_growth: 15,
                },
                company_info: {
                    name: 'TechVenture AI',
                    industry: 'AI / SaaS',
                    stage: 'Series A',
                    founded: 2022,
                },
            },
        };

        const r = await post('/api/text/submit', payload);
        assert('Text upload returns 200', r.status === 200);
        assert('Upload returns upload_id', !!r.data.upload_id);
        assert('Company name persisted', r.data.company_name === 'TechVenture AI');
        uploadId = r.data.upload_id;
        console.log(`    → upload_id: ${uploadId}`);
    }

    // ── 3. Verify upload persisted in DB ────────────────────────────────
    console.log('\n▶ 3. Verify Upload in Database'); {
        const r = await fetch(`${API}/api/uploads/${uploadId}`);
        const d = await r.json();
        assert('Upload retrievable by ID', r.status === 200);
        assert('Source type is text', d.source_type === 'text');
        assert('Extracted data has financial_data', !!d.extracted_data?.financial_data);
        assert('Revenue value correct', d.extracted_data?.financial_data?.revenue === 380000);
    }

    // ── 4. Run 9-Module Analysis ────────────────────────────────────────
    console.log('\n▶ 4. Run 9-Module Analysis (reading from DB)');
    let analysisResult; {
        const payload = {
            company_name: 'TechVenture AI',
            upload_ids: [uploadId],
            framework: 'general',
            financial_data: {
                revenue: 380000,
                mrr: 31667,
                burn_rate: 120000,
                runway_months: 14,
            },
            key_metrics: {
                team_size: 12,
                customers: 45,
                mrr: 31667,
            },
        };

        const r = await post('/api/analysis/9-module', payload);
        assert('9-module analysis returns 200', r.status === 200);
        assert('Analysis type is comprehensive', r.data.analysis_type === 'comprehensive_9_module');
        assert('Company name in result', r.data.company_name === 'TechVenture AI');
        assert('Final TCA score is a number', typeof r.data.final_tca_score === 'number');
        assert('Final TCA score > 0', r.data.final_tca_score > 0);
        assert('Final TCA score <= 10', r.data.final_tca_score <= 10);
        assert('Module count is 9', r.data.module_count === 9);
        assert('All 9 modules present', r.data.active_modules?.length === 9);
        assert('Analysis completeness 100%', r.data.analysis_completeness === 100);
        assert('Has investment recommendation', !!r.data.investment_recommendation);
        assert('Source upload IDs present', r.data.source_upload_ids?.length > 0);

        // Verify individual module results
        const mods = r.data.module_results || {};
        assert('TCA Scorecard result exists', !!mods.tca_scorecard);
        assert('Risk Assessment result exists', !!mods.risk_assessment);
        assert('Market Analysis result exists', !!mods.market_analysis);
        assert('Team Assessment result exists', !!mods.team_assessment);
        assert('Financial Analysis result exists', !!mods.financial_analysis);
        assert('Technology Assessment result exists', !!mods.technology_assessment);
        assert('Business Model result exists', !!mods.business_model);
        assert('Growth Assessment result exists', !!mods.growth_assessment);
        assert('Investment Readiness result exists', !!mods.investment_readiness);

        // Verify module scores are reasonable
        const scores = Object.values(mods).map(m => m.score);
        assert('All modules have positive scores', scores.every(s => s > 0));
        assert('All module scores <= 10', scores.every(s => s <= 10));
        assert('Module weighted scores present', Object.values(mods).every(m => typeof m.weighted_score === 'number'));

        // ── REAL DATA VERIFICATION ──
        // Financial analysis should use actual uploaded values, NOT hardcoded mocks
        const finMod = mods.financial_analysis;
        assert('Financial uses uploaded revenue (380000)', finMod.revenue === 380000);
        assert('Financial uses uploaded burn_rate (120000)', finMod.burn_rate === 120000);
        assert('Financial uses uploaded runway (14)', finMod.runway_months === 14);
        assert('Financial uses uploaded MRR (31667)', finMod.mrr === 31667);

        // Market analysis should extract TAM/SAM/SOM from uploaded text
        const mktMod = mods.market_analysis;
        assert('Market TAM extracted from text', mktMod.tam && mktMod.tam !== 'Not provided');
        assert('Market SAM extracted from text', mktMod.sam && mktMod.sam !== 'Not provided');
        assert('Market SOM extracted from text', mktMod.som && mktMod.som !== 'Not provided');

        // Team assessment should extract founders from uploaded text
        const teamMod = mods.team_assessment;
        assert('Team size from uploaded data', teamMod.team_size === 12);
        assert('Founders extracted from text', teamMod.founders?.length > 0);

        // Technology should extract tech signals from text
        const techMod = mods.technology_assessment;
        assert('Tech found NLP or patent in text', techMod.tech_differentiators?.length > 0 || techMod.ip_strength?.includes('patent'));

        // All modules should report data_sources
        assert('Financial reports data_sources', !!finMod.data_sources);
        assert('Market reports data_sources', !!mktMod.data_sources);

        console.log(`    → Final TCA Score: ${r.data.final_tca_score}/10`);
        console.log(`    → Recommendation: ${r.data.investment_recommendation}`);
        console.log(`    → Revenue in financial module: $${finMod.revenue?.toLocaleString()}`);
        console.log(`    → TAM from text: ${mktMod.tam}`);
        console.log(`    → Team size: ${teamMod.team_size}`);
        analysisResult = r.data;
    }

    // ── 5. Verify Analysis persisted back to DB ─────────────────────────
    console.log('\n▶ 5. Verify Analysis Persisted in DB'); {
        const r = await fetch(`${API}/api/uploads/${uploadId}`);
        const d = await r.json();
        assert('Analysis result saved in allupload', !!d.analysis_result);
        assert('Analysis ID saved', !!d.analysis_id || !!d.analysis_result?.analysis_type);
        assert('Saved TCA score matches', d.analysis_result?.final_tca_score === analysisResult.final_tca_score);
    }

    // ── 6. Generate Triage Report ───────────────────────────────────────
    console.log('\n▶ 6. Generate Triage Report'); {
        const payload = {
            upload_ids: [uploadId],
            company_name: 'TechVenture AI',
        };

        const r = await post('/api/reports/triage', payload);
        assert('Triage report returns 200', r.status === 200);
        assert('Report type is triage', r.data.report_type === 'triage');
        assert('Company name correct', r.data.company_name === 'TechVenture AI');
        assert('Has 6 pages', r.data.total_pages === 6);
        assert('Page 1: Executive Summary', !!r.data.page_1_executive_summary);
        assert('Page 2: TCA Scorecard', !!r.data.page_2_tca_scorecard);
        assert('Page 3: Risk Assessment', !!r.data.page_3_risk_assessment);
        assert('Page 4: Market & Team', !!r.data.page_4_market_and_team);
        assert('Page 5: Financials & Tech', !!r.data.page_5_financials_and_tech);
        assert('Page 6: Recommendations', !!r.data.page_6_recommendations);
        assert('Exec Summary has TCA score', typeof r.data.page_1_executive_summary?.overall_score === 'number');
        assert('Risk score assigned', typeof r.data.page_3_risk_assessment?.overall_risk_score === 'number');
        assert('Final decision present', !!r.data.page_6_recommendations?.final_decision);

        console.log(`    → Total Pages: ${r.data.total_pages}`);
        console.log(`    → Recommendation: ${r.data.page_6_recommendations?.final_decision}`);
    }

    // ── 7. Generate DD Report ───────────────────────────────────────────
    console.log('\n▶ 7. Generate Due Diligence Report'); {
        const payload = {
            upload_ids: [uploadId],
            company_name: 'TechVenture AI',
        };

        const r = await post('/api/reports/dd', payload);
        assert('DD report returns 200', r.status === 200);
        assert('Report type is due_diligence', r.data.report_type === 'due_diligence');
        assert('Company name correct', r.data.company_name === 'TechVenture AI');
        assert('Has total pages', r.data.total_pages >= 20);
        assert('Has final TCA score', typeof r.data.final_tca_score === 'number');

        // Verify named section structure
        assert('Section: Cover', !!r.data.section_01_cover);
        assert('Section: Executive Summary', !!r.data.section_02_executive_summary);
        assert('Section: Investment Thesis', !!r.data.section_03_investment_thesis);
        assert('Section: TCA Scorecard', !!r.data.section_04_tca_scorecard);
        assert('Section: Risk Assessment', !!r.data.section_05_risk_assessment);
        assert('Section: Market Analysis', !!r.data.section_06_market_analysis);
        assert('Section: Team Assessment', !!r.data.section_07_team_assessment);
        assert('Section: Financial Analysis', !!r.data.section_08_financial_analysis);
        assert('Section: Technology & IP', !!r.data.section_09_technology);
        assert('Section: Business Model', !!r.data.section_10_business_model);
        assert('Section: Growth Assessment', !!r.data.section_11_growth);
        assert('Section: Investment Readiness', !!r.data.section_12_investment_readiness);

        // Check extra DD sections
        assert('PESTEL analysis section present', !!r.data.section_13_pestel);
        assert('Benchmarking section present', !!r.data.section_14_benchmarks);
        assert('Gap Analysis section present', !!r.data.section_15_gap_analysis);
        assert('Strategic Fit section present', !!r.data.section_16_strategic_fit);
        assert('Valuation section present', !!r.data.section_17_valuation);
        assert('Deal Structure section present', !!r.data.section_18_deal_structure);
        assert('Conditions section present', !!r.data.section_19_conditions);
        assert('Appendices section present', !!r.data.section_20_appendices);

        // Count total sections
        const sectionKeys = Object.keys(r.data).filter(k => k.startsWith('section_'));
        assert('Has 20 sections', sectionKeys.length === 20);

        console.log(`    → Total Pages: ${r.data.total_pages}`);
        console.log(`    → Total Sections: ${sectionKeys.length}`);
    }

    // ── 8. Inline analysis (no upload_ids) ──────────────────────────────
    console.log('\n▶ 8. 9-Module Analysis with Inline Data (no upload)'); {
        const payload = {
            company_name: 'InlineTestCorp',
            framework: 'general',
            financial_data: {
                revenue: 100000,
                burn_rate: 50000,
                runway_months: 6,
                mrr: 8000
            },
            key_metrics: {
                team_size: 3,
                customers: 8
            },
        };
        const r = await post('/api/analysis/9-module', payload);
        assert('Inline analysis returns 200', r.status === 200);
        assert('Inline company name correct', r.data.company_name === 'InlineTestCorp');
        assert('Inline has 9 modules', r.data.module_count === 9);
        assert('Inline score reasonable', r.data.final_tca_score > 0 && r.data.final_tca_score <= 10);

        // Verify inline data uses its OWN values, not the previous upload's data
        const inlineFin = r.data.module_results?.financial_analysis;
        assert('Inline uses its own revenue (100000)', inlineFin?.revenue === 100000);
        assert('Inline uses its own burn_rate (50000)', inlineFin?.burn_rate === 50000);
        assert('Inline uses its own runway (6)', inlineFin?.runway_months === 6);

        // Different input data should produce a different score from step 4
        assert('Inline score differs from full upload', r.data.final_tca_score !== analysisResult.final_tca_score);

        console.log(`    → Score: ${r.data.final_tca_score} vs full upload: ${analysisResult.final_tca_score}`);
        console.log(`    → Inline revenue: $${inlineFin?.revenue?.toLocaleString()} (vs $380,000 uploaded)`);
    }

    // ── 9. Triage from inline analysis data ─────────────────────────────
    console.log('\n▶ 9. Triage Report from Inline Analysis Data'); {
        const payload = {
            analysis_data: analysisResult,
            company_name: 'TechVenture AI',
        };
        const r = await post('/api/reports/triage', payload);
        assert('Inline triage returns 200', r.status === 200);
        assert('Inline triage returns 200', r.status === 200);
        assert('Inline triage has pages', r.data.total_pages === 6);
    }

    // ── 10. Triage without analysis should fail ─────────────────────────
    console.log('\n▶ 10. Error Handling: Triage without analysis'); {
        const payload = {
            company_name: 'NothingCorp'
        };
        const r = await post('/api/reports/triage', payload);
        assert('Triage without analysis returns error', r.status === 404 || r.status === 400);
    }

    // ── 11. DD without analysis should fail ─────────────────────────────
    console.log('\n▶ 11. Error Handling: DD without analysis'); {
        const payload = {
            company_name: 'NothingCorp'
        };
        const r = await post('/api/reports/dd', payload);
        assert('DD without analysis returns error', r.status === 404 || r.status === 400);
    }

    // ── 12. Cleanup ─────────────────────────────────────────────────────
    console.log('\n▶ 12. Cleanup');
    if (uploadId) {
        const r = await fetch(`${API}/api/uploads/${uploadId}`, {
            method: 'DELETE'
        });
        assert('Test upload deleted', r.status === 200);
    }

    // ── Summary ─────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════');
    console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    console.log('═══════════════════════════════════════════');

    if (failed > 0) {
        console.log('\n  Failed tests:');
        results.filter(r => r.status === 'FAIL').forEach(r => console.log(`    ❌ ${r.name}: ${r.detail || ''}`));
    }

    console.log('');
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});