/**
 * E2E Test: Upload → DB Read → 9-Module Analysis → Triage Report → DD Report
 * 
 * Tests the full pipeline:
 * 1. Health check
 * 2. Upload a file (persisted to allupload table)
 * 3. Upload text data (persisted)
 * 4. Run 9-module analysis (reads from DB, runs all 9 modules, writes back)
 * 5. Verify all 9 module results
 * 6. Generate triage report (6-page structure)
 * 7. Generate DD report (25-page, 20-section structure)
 * 8. Verify analysis persisted back to DB
 */

const BASE = 'http://localhost:8000';
let passed = 0, failed = 0;
const uploadIds = [];
const COMPANY = 'TechVenture AI';

function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✅ ${msg}`); }
    else      { failed++; console.log(`  ❌ FAIL: ${msg}`); }
}

async function post(path, body) {
    const r = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return { status: r.status, data: await r.json() };
}

async function get(path) {
    const r = await fetch(`${BASE}${path}`);
    return { status: r.status, data: await r.json() };
}

// ─── File upload via JSON (matches backend endpoint format) ──────────────────
async function uploadFile(filename, content, contentType = 'text/plain') {
    const r = await fetch(`${BASE}/api/files/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            files: [{ name: filename, type: contentType, size: content.length }],
            company_name: COMPANY
        })
    });
    return { status: r.status, data: await r.json() };
}

// ═══════════════════════════════════════════════════════════════════════════════
async function runTests() {
    console.log('\n🔬 9-MODULE ANALYSIS + REPORTS — E2E TEST SUITE\n');
    console.log('═'.repeat(60));

    // ── 1. Health check ──────────────────────────────────────────────────────
    console.log('\n📡 Test 1: Health Check');
    try {
        const { status, data } = await get('/api/health');
        assert(status === 200, 'Health endpoint returns 200');
        assert(data.status === 'healthy', 'Backend status is healthy');
    } catch (e) {
        assert(false, `Health check failed: ${e.message}`);
        console.log('\n⛔ Backend not running. Start with: python main.py\n');
        process.exit(1);
    }

    // ── 2. Upload a company pitch doc ────────────────────────────────────────
    console.log('\n📁 Test 2: Upload Company Pitch File');
    const pitchContent = `
Company: ${COMPANY}
Founded: 2023
Sector: AI/ML Platform
Stage: Seed → Series A

Market Opportunity:
TAM: $4.2B | SAM: $1.1B | SOM: $180M
Growth rate: 18% CAGR

Team:
CEO/Founder — John Smith, 10+ years AI experience, previous exit
CTO — Jane Doe, ex-Google, ML infrastructure specialist

Financials:
Revenue: $500K ARR | MRR: $42K
Burn Rate: $50K/month | Runway: 10 months
LTV/CAC: 3.2 | Gross Margin: 72%

Technology:
2 patents pending, TRL 7
Stack: Python, React, PostgreSQL, Azure
Product: AI-powered investment analysis platform

Business Model:
B2B SaaS, subscription-based
Pricing tiers: Starter ($99/mo), Pro ($499/mo), Enterprise (custom)
Current customers: 45 SMBs, 3 enterprise

Ask: $3-5M Series A at $15-20M valuation
`;
    const { status: fs, data: fd } = await uploadFile('techventure-pitch.txt', pitchContent);
    assert(fs === 200, 'File upload returns 200');
    const fileUploadId = fd.processed_files?.[0]?.upload_id;
    assert(fileUploadId !== undefined, `Upload ID returned: ${fileUploadId}`);
    if (fileUploadId) uploadIds.push(fileUploadId);

    // ── 3. Upload supplementary text data ────────────────────────────────────
    console.log('\n📝 Test 3: Submit Supplementary Text Data');
    const { status: ts, data: td } = await post('/api/text/submit', {
        text: `${COMPANY} competitive analysis: Main competitors include DataRobot, H2O.ai. Differentiation through vertical-specific AI models. Strong IP moat with proprietary training data pipeline.`,
        source_name: 'competitive-analysis',
        company_name: COMPANY
    });
    assert(ts === 200, 'Text submit returns 200');
    assert(td.upload_id !== undefined, `Text upload ID: ${td.upload_id}`);
    if (td.upload_id) uploadIds.push(td.upload_id);

    // ── 4. Verify uploads stored in DB ───────────────────────────────────────
    console.log('\n🗄️  Test 4: Verify Uploads in Database');
    const { status: ls, data: ld } = await get('/api/uploads');
    assert(ls === 200, 'List uploads returns 200');
    assert(ld.total >= 2, `At least 2 uploads in DB (found ${ld.total})`);

    // ── 5. Run 9-module analysis ─────────────────────────────────────────────
    console.log('\n🧪 Test 5: Run 9-Module Analysis');
    const { status: as_, data: ad } = await post('/api/analysis/9-module', {
        company_name: COMPANY,
        upload_ids: uploadIds
    });
    assert(as_ === 200, 'Analysis endpoint returns 200');
    assert(ad.analysis_type === 'comprehensive_9_module', 'Analysis type is comprehensive_9_module');
    assert(ad.company_name === COMPANY, `Company name matches: ${ad.company_name}`);
    assert(ad.module_count === 9, `Module count is 9`);
    assert(ad.analysis_completeness === 100, 'Analysis completeness is 100%');
    assert(typeof ad.final_tca_score === 'number' && ad.final_tca_score > 0, `TCA score: ${ad.final_tca_score}`);
    assert(ad.investment_recommendation && ad.investment_recommendation.length > 0, `Recommendation: ${ad.investment_recommendation}`);
    assert(ad.source_upload_ids && ad.source_upload_ids.length === uploadIds.length, `Source IDs count matches: ${ad.source_upload_ids.length}`);

    // ── 6. Verify all 9 modules present ──────────────────────────────────────
    console.log('\n🔍 Test 6: Verify All 9 Module Results');
    const expectedModules = [
        'tca_scorecard', 'risk_assessment', 'market_analysis',
        'team_assessment', 'financial_analysis', 'technology_assessment',
        'business_model', 'growth_assessment', 'investment_readiness'
    ];
    const mr = ad.module_results || {};
    for (const mod of expectedModules) {
        assert(mr[mod] !== undefined, `Module present: ${mod} (score: ${mr[mod]?.score})`);
    }

    // ── 7. Verify individual module data quality ─────────────────────────────
    console.log('\n📊 Test 7: Module Data Quality Checks');
    // TCA Scorecard
    assert(mr.tca_scorecard?.categories?.length >= 3, `TCA has ${mr.tca_scorecard?.categories?.length} categories`);
    assert(mr.tca_scorecard?.composite_score > 0, `TCA composite: ${mr.tca_scorecard?.composite_score}`);
    // Risk Assessment
    assert(mr.risk_assessment?.flags?.length > 0, `Risk flags: ${mr.risk_assessment?.flags?.length}`);
    assert(mr.risk_assessment?.overall_risk_score > 0, `Overall risk: ${mr.risk_assessment?.overall_risk_score}`);
    // Market
    assert(mr.market_analysis?.tam !== undefined, `TAM: ${mr.market_analysis?.tam}`);
    // Team
    assert(mr.team_assessment?.founders?.length > 0, `Founders: ${mr.team_assessment?.founders?.length}`);
    assert(mr.team_assessment?.gaps?.length > 0, `Team gaps: ${mr.team_assessment?.gaps}`);
    // Financial
    assert(mr.financial_analysis?.revenue > 0, `Revenue: ${mr.financial_analysis?.revenue}`);
    assert(mr.financial_analysis?.ltv_cac_ratio > 0, `LTV/CAC: ${mr.financial_analysis?.ltv_cac_ratio}`);
    // Technology
    assert(mr.technology_assessment?.trl > 0, `TRL: ${mr.technology_assessment?.trl}`);
    assert(mr.technology_assessment?.stack?.length > 0, `Stack: ${mr.technology_assessment?.stack}`);
    // Business Model
    assert(mr.business_model?.unit_economics?.cac > 0, `CAC: ${mr.business_model?.unit_economics?.cac}`);
    // Growth
    assert(mr.growth_assessment?.growth_drivers?.length > 0, 'Growth drivers present');
    // Investment Readiness
    assert(mr.investment_readiness?.exit_potential !== undefined, 'Exit potential present');
    assert(mr.investment_readiness?.funding_recommendation?.target !== undefined, `Funding target: ${mr.investment_readiness?.funding_recommendation?.target}`);

    // ── 8. Generate Triage Report ────────────────────────────────────────────
    console.log('\n📋 Test 8: Generate Triage Report');
    const { status: trs, data: tr } = await post('/api/reports/triage', {
        company_name: COMPANY,
        analysis_data: ad
    });
    assert(trs === 200, 'Triage endpoint returns 200');
    assert(tr.report_type === 'triage', 'Report type is triage');
    assert(tr.total_pages === 6, `Triage report has ${tr.total_pages} pages`);
    assert(tr.final_tca_score === ad.final_tca_score, 'TCA score matches analysis');
    // Page structure
    assert(tr.page_1_executive_summary !== undefined, 'Page 1: Executive Summary present');
    assert(tr.page_2_tca_scorecard !== undefined, 'Page 2: TCA Scorecard present');
    assert(tr.page_3_risk_assessment !== undefined, 'Page 3: Risk Assessment present');
    assert(tr.page_4_market_and_team !== undefined, 'Page 4: Market & Team present');
    assert(tr.page_5_financials_and_tech !== undefined, 'Page 5: Financials & Tech present');
    assert(tr.page_6_recommendations !== undefined, 'Page 6: Recommendations present');
    // Content checks
    assert(tr.page_1_executive_summary.overall_score > 0, `Exec summary score: ${tr.page_1_executive_summary.overall_score}`);
    assert(tr.page_2_tca_scorecard.categories?.length > 0, 'Scorecard has categories');
    assert(tr.page_3_risk_assessment.risk_flags?.length > 0, 'Risk flags in report');
    assert(tr.page_4_market_and_team.tam !== 'N/A', 'TAM populated');
    assert(tr.page_5_financials_and_tech.revenue > 0, 'Revenue in financials');
    assert(tr.page_6_recommendations.next_steps?.length >= 3, `Next steps: ${tr.page_6_recommendations.next_steps?.length}`);

    // ── 9. Triage Report from DB (no analysis_data provided) ─────────────────
    console.log('\n📋 Test 9: Triage Report from DB (auto-fetch analysis)');
    const { status: trs2, data: tr2 } = await post('/api/reports/triage', {
        company_name: COMPANY
        // no analysis_data — should read from DB
    });
    assert(trs2 === 200, 'Triage from DB returns 200');
    assert(tr2.report_type === 'triage', 'Auto-fetch report is triage');
    assert(tr2.final_tca_score > 0, `Auto-fetch score: ${tr2.final_tca_score}`);

    // ── 10. Generate DD Report ───────────────────────────────────────────────
    console.log('\n📑 Test 10: Generate DD Report');
    const { status: dds, data: dd } = await post('/api/reports/dd', {
        company_name: COMPANY,
        analysis_data: ad
    });
    assert(dds === 200, 'DD endpoint returns 200');
    assert(dd.report_type === 'due_diligence', 'Report type is due_diligence');
    assert(dd.total_pages === 25, `DD report has ${dd.total_pages} pages`);
    assert(dd.final_tca_score === ad.final_tca_score, 'TCA score matches');

    // Verify all 20 sections
    console.log('\n📑 Test 11: DD Report — 20 Section Verification');
    const sectionKeys = [
        'section_01_cover', 'section_02_executive_summary', 'section_03_investment_thesis',
        'section_04_tca_scorecard', 'section_05_risk_assessment', 'section_06_market_analysis',
        'section_07_team_assessment', 'section_08_financial_analysis', 'section_09_technology',
        'section_10_business_model', 'section_11_growth', 'section_12_investment_readiness',
        'section_13_pestel', 'section_14_benchmarks', 'section_15_gap_analysis',
        'section_16_strategic_fit', 'section_17_valuation', 'section_18_deal_structure',
        'section_19_conditions', 'section_20_appendices',
    ];
    let sectionsOk = 0;
    for (const key of sectionKeys) {
        if (dd[key] && dd[key].title) sectionsOk++;
    }
    assert(sectionsOk === 20, `All 20 DD sections present (${sectionsOk}/20)`);

    // DD content depth
    assert(dd.section_02_executive_summary.key_findings?.length >= 5, 'Exec summary has ≥5 findings');
    assert(dd.section_05_risk_assessment.risk_matrix !== undefined, 'Risk matrix present');
    assert(dd.section_08_financial_analysis.current_metrics?.revenue > 0, 'Revenue in DD financials');
    assert(dd.section_13_pestel.factors?.political !== undefined, 'PESTEL political factor present');
    assert(dd.section_14_benchmarks.overall_percentile > 0, 'Benchmark percentile present');
    assert(dd.section_15_gap_analysis.gaps?.length >= 3, `Gap analysis items: ${dd.section_15_gap_analysis.gaps?.length}`);
    assert(dd.section_18_deal_structure.key_terms?.length >= 3, 'Deal terms present');

    // ── 12. DD Report from DB ────────────────────────────────────────────────
    console.log('\n📑 Test 12: DD Report from DB (auto-fetch)');
    const { status: dds2, data: dd2 } = await post('/api/reports/dd', {
        company_name: COMPANY
    });
    assert(dds2 === 200, 'DD from DB returns 200');
    assert(dd2.report_type === 'due_diligence', 'Auto-fetch DD report type correct');

    // ── 13. Verify analysis stored back in allupload ─────────────────────────
    console.log('\n🗄️  Test 13: Verify Analysis Persisted to DB');
    if (uploadIds.length > 0) {
        const { status: gs, data: gd } = await get(`/api/uploads/${uploadIds[0]}`);
        assert(gs === 200, 'Can read upload by ID');
        assert(gd.analysis_result !== null && gd.analysis_result !== undefined, 'analysis_result stored in DB');
        if (gd.analysis_result) {
            const ar = typeof gd.analysis_result === 'string' ? JSON.parse(gd.analysis_result) : gd.analysis_result;
            assert(ar.analysis_type === 'comprehensive_9_module', 'Stored result is 9-module type');
            assert(ar.final_tca_score > 0, `Stored TCA score: ${ar.final_tca_score}`);
        }
        assert(gd.analysis_id && gd.analysis_id.startsWith('9mod_'), `Analysis ID stored: ${gd.analysis_id}`);
    }

    // ── 14. Error handling — analysis with no uploads ────────────────────────
    console.log('\n⚠️  Test 14: Error Handling — No Matching Uploads');
    const { status: es } = await post('/api/analysis/9-module', {
        company_name: 'NonExistentCompanyXYZ99999',
        upload_ids: ['00000000-0000-0000-0000-000000000000']
    });
    assert(es === 404, `No-match returns 404 (got ${es})`);

    // ── 15. Error handling — report with no analysis ─────────────────────────
    console.log('\n⚠️  Test 15: Error Handling — Report Without Analysis');
    const { status: re } = await post('/api/reports/triage', {
        company_name: 'NoAnalysisCompany999'
    });
    assert(re === 404, `Triage no-analysis returns 404 (got ${re})`);

    // ═══════════════════════════════════════════════════════════════════════════
    // Cleanup
    console.log('\n🧹 Cleanup: Removing test uploads');
    for (const uid of uploadIds) {
        try { await fetch(`${BASE}/api/uploads/${uid}`, { method: 'DELETE' }); } catch {}
    }

    // ═══════════════════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(60));
    console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    if (failed === 0) {
        console.log('🎉 ALL TESTS PASSED — Full pipeline verified!\n');
        console.log('Pipeline: Upload → DB → 9-Module Analysis → Triage (6p) → DD (25p, 20 sections)\n');
    } else {
        console.log(`⚠️  ${failed} test(s) failed\n`);
    }
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => { console.error('Fatal:', e); process.exit(1); });
