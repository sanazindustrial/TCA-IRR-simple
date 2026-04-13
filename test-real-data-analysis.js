/**
 * REAL DATA 9-MODULE ANALYSIS TEST
 * ─────────────────────────────────
 * Verifies the FULL pipeline with precise client data:
 *   1. Upload specific client data → DB
 *   2. Confirm DB stores every field accurately
 *   3. Run 9-module analysis (must pull FROM DB)
 *   4. Verify every module score is derived from ACTUAL data (not mock)
 *   5. Confirm analysis result is saved back to DB
 *   6. Pull saved analysis from DB and verify precision
 *   7. Run a SECOND client with different data → different scores
 *   8. Cleanup
 */

const BASE = 'http://localhost:8000';
let passed = 0,
    failed = 0;
const createdIds = [];

function assert(condition, label, detail) {
    if (condition) {
        console.log(`  ✅ ${label}`);
        passed++;
    } else {
        console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
        failed++;
    }
}

async function api(method, path, body) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(`${BASE}${path}`, opts);
    const text = await r.text();
    let json = null;
    try {
        json = JSON.parse(text);
    } catch {}
    return {
        status: r.status,
        json,
        text
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT A — strong startup (high revenue, long runway, big team)
// ═══════════════════════════════════════════════════════════════════════════
const CLIENT_A = {
    company_name: 'AlphaVenture AI',
    title: 'AlphaVenture AI Series A Pitch',
    text: `AlphaVenture AI — Series A Pitch Deck
Company Overview: AlphaVenture AI is a B2B SaaS platform using proprietary NLP 
and machine learning to automate enterprise contract analysis.
TAM: $8.5B  SAM: $2.1B  SOM: $420M
Growth: 18% month-over-month revenue growth with 125% NRR.
CEO: Sarah Chen — ex-Google, Stanford MBA, prior exit ($45M).
CTO: James Park — ex-Amazon, MIT PhD, 3 patents granted in NLP.
VP Sales: Maria Lopez — 12 years enterprise sales.
VP Engineering: Raj Patel — ex-Microsoft, cloud-native architecture.
Team: 18 engineers, 6 sales, 4 ops = 28 total.
Technology: Cloud-native microservice architecture on AWS with Kubernetes.
  2 patents granted, 1 pending. SOC 2 Type II certified. GDPR compliant.
  Stack: Python, React, Node, PostgreSQL, Redis, Terraform.
Funding: Raising $5M Series A at $25M pre-money valuation.
Traction: 68 enterprise customers, $520K ARR, subscription model.
Product-led growth with land and expand strategy.`,
    extracted_data: {
        financial_data: {
            revenue: 520000,
            mrr: 43333,
            burn_rate: 95000,
            runway_months: 22,
            gross_margin: 78
        },
        key_metrics: {
            customers: 68,
            nrr: 125,
            mom_growth: 18,
            team_size: 28
        },
        company_info: {
            name: 'AlphaVenture AI',
            stage: 'Series A',
            industry: 'Enterprise SaaS'
        }
    }
};

// CLIENT B — weak startup (low revenue, short runway, small team)
const CLIENT_B = {
    company_name: 'BetaWidget Inc',
    title: 'BetaWidget Pre-Seed Pitch',
    text: `BetaWidget Inc — Pre-Seed
BetaWidget is an early-stage consumer app for budget tracking.
No TAM/SAM data available.
CEO: Tom Smith.
Team of 3 — CEO, 1 developer, 1 intern.
No patents. No compliance certifications.
Looking for $200K seed funding.`,
    extracted_data: {
        financial_data: {
            revenue: 12000,
            mrr: 1000,
            burn_rate: 25000,
            runway_months: 4,
            gross_margin: 30
        },
        key_metrics: {
            customers: 5,
            nrr: 85,
            mom_growth: 2,
            team_size: 3
        },
        company_info: {
            name: 'BetaWidget Inc',
            stage: 'Pre-seed'
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════

async function run() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  REAL DATA 9-MODULE ANALYSIS — PRECISION TEST');
    console.log('  Verify DB pull → real scoring → DB push');
    console.log('═══════════════════════════════════════════════════\n');

    // ─────────────────────────────────────────────────────────────────
    // STEP 1: Upload Client A data to database
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 1. Upload Client A (AlphaVenture AI) to Database');
    const u1 = await api('POST', '/api/text/submit', CLIENT_A);
    assert(u1.status === 200, 'Upload returns 200');
    assert(u1.json?.upload_id, 'Returns upload_id');
    assert(u1.json?.company_name === 'AlphaVenture AI', 'Company name returned');
    const uploadIdA = u1.json?.upload_id;
    if (uploadIdA) createdIds.push(uploadIdA);
    console.log(`    → upload_id: ${uploadIdA}\n`);

    // ─────────────────────────────────────────────────────────────────
    // STEP 2: Verify Client A data stored in DB precisely
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 2. Verify Client A Data in Database (exact values)');
    const g1 = await api('GET', `/api/uploads/${uploadIdA}`);
    assert(g1.status === 200, 'Upload retrievable from DB');
    const ext = g1.json?.extracted_data;
    assert(ext?.financial_data?.revenue === 520000, `DB revenue = 520000 (got ${ext?.financial_data?.revenue})`);
    assert(ext?.financial_data?.mrr === 43333, `DB mrr = 43333 (got ${ext?.financial_data?.mrr})`);
    assert(ext?.financial_data?.burn_rate === 95000, `DB burn_rate = 95000 (got ${ext?.financial_data?.burn_rate})`);
    assert(ext?.financial_data?.runway_months === 22, `DB runway_months = 22 (got ${ext?.financial_data?.runway_months})`);
    assert(ext?.financial_data?.gross_margin === 78, `DB gross_margin = 78 (got ${ext?.financial_data?.gross_margin})`);
    assert(ext?.key_metrics?.customers === 68, `DB customers = 68 (got ${ext?.key_metrics?.customers})`);
    assert(ext?.key_metrics?.nrr === 125, `DB nrr = 125 (got ${ext?.key_metrics?.nrr})`);
    assert(ext?.key_metrics?.mom_growth === 18, `DB mom_growth = 18 (got ${ext?.key_metrics?.mom_growth})`);
    assert(ext?.key_metrics?.team_size === 28, `DB team_size = 28 (got ${ext?.key_metrics?.team_size})`);
    assert(g1.json?.extracted_text?.includes('AlphaVenture AI'), 'DB has extracted_text with company name');
    assert(g1.json?.extracted_text?.includes('TAM: $8.5B'), 'DB text includes TAM: $8.5B');
    assert(g1.json?.extracted_text?.includes('3 patents granted'), 'DB text includes patent info');
    console.log('');

    // ─────────────────────────────────────────────────────────────────
    // STEP 3: Run 9-Module Analysis for Client A (pulls from DB)
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 3. Run 9-Module Analysis for Client A (upload_ids → DB pull)');
    const a1 = await api('POST', '/api/analysis/9-module', {
        company_name: 'AlphaVenture AI',
        upload_ids: [uploadIdA]
    });
    assert(a1.status === 200, 'Analysis returns 200');
    assert(a1.json?.analysis_type === 'comprehensive_9_module', 'Type = comprehensive');
    assert(a1.json?.company_name === 'AlphaVenture AI', 'Company name correct');
    assert(a1.json?.module_count === 9, '9 modules returned');
    assert(a1.json?.source_upload_ids?.includes(uploadIdA), 'Source includes our upload_id');
    assert(a1.json?.analysis_completeness === 100, 'Analysis 100% complete');

    const scoreA = a1.json?.final_tca_score;
    const modules = a1.json?.module_results;
    console.log(`    → Final TCA Score: ${scoreA}/10`);
    console.log(`    → Recommendation: ${a1.json?.investment_recommendation}\n`);

    // ─────────────────────────────────────────────────────────────────
    // STEP 4: Verify FINANCIAL ANALYSIS uses exact DB values
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 4. Verify Financial Analysis — exact client data from DB');
    const fin = modules?.financial_analysis;
    assert(fin?.revenue === 520000, `Revenue = 520000 (got ${fin?.revenue})`);
    assert(fin?.mrr === 43333, `MRR = 43333 (got ${fin?.mrr})`);
    assert(fin?.burn_rate === 95000, `Burn rate = 95000 (got ${fin?.burn_rate})`);
    assert(fin?.runway_months === 22, `Runway = 22 months (got ${fin?.runway_months})`);
    // Gross margin stored as decimal (78 → 0.78)
    const gm = fin?.gross_margin;
    assert(gm === 0.78 || gm === 78, `Gross margin from client data (got ${gm})`);
    // Burn multiple = burn / (revenue/12) = 95000 / (520000/12) = 95000/43333 ≈ 2.19
    assert(fin?.burn_multiple > 2.0 && fin?.burn_multiple < 2.5, `Burn multiple ≈ 2.19 (got ${fin?.burn_multiple})`);
    // MoM growth stored as decimal (18 → 0.18)
    const rgm = fin?.revenue_growth_mom;
    assert(rgm === 0.18 || rgm === 18, `Revenue growth MoM from data (got ${rgm})`);
    // LTV/CAC should exist and be > 0 (we have MRR, customers, NRR, burn)
    assert(fin?.ltv_cac_ratio > 0, `LTV/CAC ratio calculated (got ${fin?.ltv_cac_ratio})`);
    // Projections should use 18% MoM compound growth
    assert(fin?.projections?. ['12m_revenue'] > 520000, `12m projection > current revenue (got ${fin?.projections?.['12m_revenue']})`);
    assert(fin?.projections?. ['24m_revenue'] > fin?.projections?. ['12m_revenue'], `24m > 12m projection`);
    // Score: revenue 520K>500K → +2.0, runway 22>18 → +1.5, margin 78>70 → +1.0, growth 18>10 → +0.5, burn multiple 2.19 < 3 → +0.3 = 5+2+1.5+1+0.5+0.3 = 10.3 → clamped 10.0
    assert(fin?.score >= 9.0, `Financial score high for strong data (got ${fin?.score})`);
    assert(fin?.data_sources?.financial_data === true, 'Reports financial_data source = true');
    assert(fin?.data_sources?.key_metrics === true, 'Reports key_metrics source = true');
    console.log(`    → Financial Score: ${fin?.score}/10`);
    console.log(`    → Burn Multiple: ${fin?.burn_multiple}`);
    console.log(`    → LTV/CAC: ${fin?.ltv_cac_ratio}`);
    console.log(`    → 12m Projection: $${fin?.projections?.['12m_revenue']?.toLocaleString()}`);
    console.log('');

    // ─────────────────────────────────────────────────────────────────
    // STEP 5: Verify MARKET ANALYSIS extracts TAM/SAM/SOM from DB text
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 5. Verify Market Analysis — TAM/SAM/SOM parsed from DB text');
    const mkt = modules?.market_analysis;
    assert(mkt?.tam === '$8.5B', `TAM = $8.5B (got ${mkt?.tam})`);
    assert(mkt?.sam === '$2.1B', `SAM = $2.1B (got ${mkt?.sam})`);
    assert(mkt?.som === '$420M', `SOM = $420M (got ${mkt?.som})`);
    assert(mkt?.growth_rate?.includes('18'), `Growth rate includes 18% (got ${mkt?.growth_rate})`);
    // Competitive advantages from text: proprietary, NLP, machine learning, etc.
    const advs = mkt?.competitive_advantages || [];
    assert(advs.some(a => /proprietary|NLP|machine learning|patent/i.test(a)),
        `Competitive advantages from text (got ${JSON.stringify(advs)})`);
    assert(mkt?.competitive_position === 'Leader' || mkt?.competitive_position === 'Challenger',
        `Strong market position (got ${mkt?.competitive_position})`);
    assert(mkt?.score >= 8.0, `Market score high for strong data (got ${mkt?.score})`);
    assert(mkt?.data_sources?.text_analysis === true, 'Market used text_analysis');
    console.log(`    → Market Score: ${mkt?.score}/10`);
    console.log(`    → TAM: ${mkt?.tam}  SAM: ${mkt?.sam}  SOM: ${mkt?.som}`);
    console.log('');

    // ─────────────────────────────────────────────────────────────────
    // STEP 6: Verify TEAM ASSESSMENT parses founders from DB text
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 6. Verify Team Assessment — founders & team from DB');
    const team = modules?.team_assessment;
    assert(team?.team_size === 28, `Team size = 28 (got ${team?.team_size})`);
    const founders = team?.founders || [];
    assert(founders.length >= 2, `At least 2 founders parsed (got ${founders.length})`);
    // Should find CEO: Sarah Chen and CTO: James Park from text
    const founderRoles = founders.map(f => f.role);
    assert(founderRoles.includes('CEO'), `CEO role found (got ${JSON.stringify(founderRoles)})`);
    assert(founderRoles.includes('CTO'), `CTO role found`);
    // Team completeness should be high (CEO, CTO, VP Sales, VP Engineering all present)
    assert(team?.team_completeness >= 60, `Team completeness ≥ 60% (got ${team?.team_completeness}%)`);
    // Gaps should be small (CFO is missing)
    const gaps = team?.gaps || [];
    assert(gaps.some(g => /CFO/i.test(g)), `Identifies CFO gap (got ${JSON.stringify(gaps)})`);
    assert(team?.score >= 8.0, `Team score high for strong team (got ${team?.score})`);
    console.log(`    → Team Score: ${team?.score}/10`);
    console.log(`    → Founders: ${founders.map(f => f.role + ': ' + f.description).join(', ')}`);
    console.log(`    → Completeness: ${team?.team_completeness}%  Gaps: ${gaps.join(', ')}`);
    console.log('');

    // ─────────────────────────────────────────────────────────────────
    // STEP 7: Verify TECHNOLOGY ASSESSMENT from DB text
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 7. Verify Technology Assessment — patents, stack from DB text');
    const tech = modules?.technology_assessment;
    // Should find: patent, proprietary, NLP, machine learning, cloud-native, microservice, kubernetes, SOC 2
    const techDiff = tech?.tech_differentiators || [];
    assert(techDiff.some(t => /NLP/i.test(t)), `NLP detected (got ${JSON.stringify(techDiff)})`);
    assert(techDiff.some(t => /machine learning/i.test(t)), `Machine learning detected`);
    assert(techDiff.some(t => /proprietary/i.test(t)), `Proprietary detected`);
    assert(techDiff.some(t => /cloud-native|microservice|kubernetes/i.test(t)), `Cloud-native/k8s detected`);
    // Security: SOC 2, GDPR
    const secComp = tech?.security_compliance || [];
    assert(secComp.some(s => /SOC/i.test(s)), `SOC 2 compliance found (got ${JSON.stringify(secComp)})`);
    assert(secComp.some(s => /GDPR/i.test(s)), `GDPR compliance found`);
    // Stack: Python, React, Node, PostgreSQL, Redis, Terraform
    const stack = tech?.stack || [];
    assert(stack.some(s => /Python/i.test(s)), `Python in stack`);
    assert(stack.some(s => /React/i.test(s)), `React in stack`);
    assert(stack.some(s => /PostgreSQL/i.test(s)), `PostgreSQL in stack`);
    // IP strength should mention patents
    assert(tech?.ip_strength?.toLowerCase().includes('patent'), `IP strength mentions patents (got ${tech?.ip_strength})`);
    // TRL should be high (68 customers, $520K revenue)
    assert(tech?.trl >= 8, `TRL ≥ 8 for mature product (got ${tech?.trl})`);
    assert(tech?.score >= 8.0, `Tech score high for strong tech (got ${tech?.score})`);
    console.log(`    → Tech Score: ${tech?.score}/10`);
    console.log(`    → IP: ${tech?.ip_strength}`);
    console.log(`    → TRL: ${tech?.trl}  Stack: ${stack.join(', ')}`);
    console.log('');

    // ─────────────────────────────────────────────────────────────────
    // STEP 8: Verify RISK ASSESSMENT uses actual metrics from DB
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 8. Verify Risk Assessment — risk levels from actual DB data');
    const risk = modules?.risk_assessment;
    const rd = risk?.risk_domains || {};
    // Financial risk: runway 22 months → low risk  (10 - 22/2 = -1 → clamped to 1)
    assert(rd?.financial_risk?.trigger?.includes('95,000'), `Financial trigger uses burn $95,000 (got ${rd?.financial_risk?.trigger})`);
    assert(rd?.financial_risk?.trigger?.includes('22'), `Financial trigger uses 22 months runway (got ${rd?.financial_risk?.trigger})`);
    // Market risk: 68 customers → low concentration (8 - 68/15 = 3.47 → good)
    assert(rd?.market_risk?.trigger?.includes('68'), `Market trigger uses 68 customers (got ${rd?.market_risk?.trigger})`);
    // Team risk: team of 28 → low risk
    assert(rd?.team_risk?.trigger?.includes('28'), `Team trigger uses team of 28 (got ${rd?.team_risk?.trigger})`);
    // Overall risk score should be moderate to low
    assert(risk?.score >= 6.0, `Risk module score good for strong data (got ${risk?.score})`);
    assert(risk?.data_sources?.financial_data === true, 'Risk used financial_data');
    assert(risk?.data_sources?.key_metrics === true, 'Risk used key_metrics');
    assert(risk?.data_sources?.text_analysis === true, 'Risk used text_analysis');
    console.log(`    → Risk Score: ${risk?.score}/10 (higher = lower risk)`);
    console.log(`    → Financial Risk: ${rd?.financial_risk?.score} (${rd?.financial_risk?.level})`);
    console.log(`    → Market Risk: ${rd?.market_risk?.score} (${rd?.market_risk?.level})`);
    console.log('');

    // ─────────────────────────────────────────────────────────────────
    // STEP 9: Verify BUSINESS MODEL from DB data
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 9. Verify Business Model — model type & unit economics from DB');
    const bm = modules?.business_model;
    // Model type should detect SaaS, B2B, subscription from text
    assert(bm?.model_type?.toLowerCase().includes('saas') || bm?.model_type?.toLowerCase().includes('b2b') || bm?.model_type?.toLowerCase().includes('subscription'),
        `Model type from text (got ${bm?.model_type})`);
    // Unit economics: CAC and LTV should be calculated
    const ue = bm?.unit_economics || {};
    assert(ue?.ltv > 0, `LTV calculated from MRR/customers (got ${ue?.ltv})`);
    assert(ue?.cac > 0, `CAC calculated from burn/customers (got ${ue?.cac})`);
    assert(ue?.ltv_cac_ratio > 0, `LTV/CAC ratio calculated (got ${ue?.ltv_cac_ratio})`);
    assert(bm?.score >= 7.0, `Business model score strong (got ${bm?.score})`);
    console.log(`    → BM Score: ${bm?.score}/10  Model: ${bm?.model_type}`);
    console.log(`    → LTV: $${ue?.ltv}  CAC: $${ue?.cac}  Ratio: ${ue?.ltv_cac_ratio}x`);
    console.log('');

    // ─────────────────────────────────────────────────────────────────
    // STEP 10: Verify GROWTH ASSESSMENT uses actual MoM & NRR
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 10. Verify Growth Assessment — actual growth metrics from DB');
    const growth = modules?.growth_assessment;
    assert(growth?.actual_growth_rate?.includes('18'), `Uses actual 18% MoM (got ${growth?.actual_growth_rate})`);
    assert(growth?.nrr === 125, `Uses actual NRR 125 (got ${growth?.nrr})`);
    // Growth projections should use actual 18% MoM compound
    const projY1 = parseFloat(growth?.growth_projections?.year1);
    // (1.18)^12 ≈ 6.6x
    assert(projY1 > 5.0 && projY1 < 8.0, `Year 1 projection ~6.6x from 18% MoM (got ${projY1}x)`);
    // Growth drivers should mention actual NRR and growth
    const drivers = growth?.growth_drivers || [];
    assert(drivers.some(d => /125/.test(d) || /NRR/.test(d) || /retention/i.test(d)),
        `Growth driver mentions NRR 125% (got ${JSON.stringify(drivers)})`);
    assert(drivers.some(d => /18/.test(d) || /growth/i.test(d)),
        `Growth driver mentions 18% growth`);
    assert(growth?.score >= 8.0, `Growth score high for strong metrics (got ${growth?.score})`);
    console.log(`    → Growth Score: ${growth?.score}/10`);
    console.log(`    → Projections: Y1=${growth?.growth_projections?.year1}  Y2=${growth?.growth_projections?.year2}`);
    console.log('');

    // ─────────────────────────────────────────────────────────────────
    // STEP 11: Verify INVESTMENT READINESS uses actual data
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 11. Verify Investment Readiness — funding & metrics from DB');
    const ir = modules?.investment_readiness;
    assert(ir?.actual_metrics_used?.revenue === 520000, `IR uses revenue 520000 (got ${ir?.actual_metrics_used?.revenue})`);
    assert(ir?.actual_metrics_used?.mrr === 43333, `IR uses MRR 43333 (got ${ir?.actual_metrics_used?.mrr})`);
    assert(ir?.actual_metrics_used?.burn_rate === 95000, `IR uses burn 95000 (got ${ir?.actual_metrics_used?.burn_rate})`);
    assert(ir?.actual_metrics_used?.runway_months === 22, `IR uses runway 22 (got ${ir?.actual_metrics_used?.runway_months})`);
    assert(ir?.actual_metrics_used?.customers === 68, `IR uses customers 68 (got ${ir?.actual_metrics_used?.customers})`);
    // Funding recommendation should extract from text: $5M Series A at $25M pre-money
    const fr = ir?.funding_recommendation || {};
    assert(fr?.round?.includes('Series A') || fr?.round?.includes('Series'), `Round = Series A from text (got ${fr?.round})`);
    assert(fr?.ask !== 'Not specified', `Funding ask extracted from text (got ${fr?.ask})`);
    assert(ir?.score >= 8.0, `Investment readiness high (got ${ir?.score})`);
    console.log(`    → IR Score: ${ir?.score}/10`);
    console.log(`    → Round: ${fr?.round}  Ask: ${fr?.ask}`);
    console.log(`    → Metrics: rev=$${ir?.actual_metrics_used?.revenue} burn=$${ir?.actual_metrics_used?.burn_rate} runway=${ir?.actual_metrics_used?.runway_months}mo`);
    console.log('');

    // ─────────────────────────────────────────────────────────────────
    // STEP 12: Verify TCA SCORECARD composite from actual data
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 12. Verify TCA Scorecard — composite from actual data');
    const tca = modules?.tca_scorecard;
    const cats = tca?.categories || [];
    assert(cats.length === 5, `5 scoring categories (got ${cats.length})`);
    // Check each category has proper flag based on actual score
    for (const cat of cats) {
        const expectedFlag = cat.raw_score >= 7.0 ? 'green' : cat.raw_score >= 5.0 ? 'yellow' : 'red';
        assert(cat.flag === expectedFlag,
            `${cat.category}: flag=${cat.flag} matches score ${cat.raw_score} (expected ${expectedFlag})`);
    }
    // Composite should be weighted average of categories
    assert(tca?.composite_score > 0, `Composite score calculated (got ${tca?.composite_score})`);
    assert(tca?.score === tca?.composite_score, `Module score = composite (${tca?.score})`);
    assert(tca?.data_sources?.financial_data === true, 'TCA used financial_data');
    console.log(`    → TCA Composite: ${tca?.composite_score}/10`);
    console.log(`    → Categories: ${cats.map(c => `${c.category}=${c.raw_score}(${c.flag})`).join(', ')}`);
    console.log('');

    // ─────────────────────────────────────────────────────────────────
    // STEP 13: Verify analysis SAVED BACK to DB
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 13. Verify Analysis Saved Back to Database');
    const saved = await api('GET', `/api/uploads/${uploadIdA}`);
    assert(saved.status === 200, 'Saved upload retrievable');
    const savedAnalysis = saved.json?.analysis_result;
    assert(savedAnalysis !== null && savedAnalysis !== undefined, 'analysis_result is NOT null in DB');
    // Parse if string
    const ar = typeof savedAnalysis === 'string' ? JSON.parse(savedAnalysis) : savedAnalysis;
    assert(ar?.final_tca_score === scoreA, `Saved TCA score matches (${ar?.final_tca_score} === ${scoreA})`);
    assert(ar?.company_name === 'AlphaVenture AI', 'Saved company name correct');
    assert(ar?.module_count === 9, 'Saved module count = 9');
    assert(ar?.source_upload_ids?.includes(uploadIdA), 'Saved source_upload_ids includes our ID');
    // Verify saved financial module has exact values
    const savedFin = ar?.module_results?.financial_analysis;
    assert(savedFin?.revenue === 520000, `Saved financial revenue = 520000 (got ${savedFin?.revenue})`);
    assert(savedFin?.burn_rate === 95000, `Saved financial burn_rate = 95000 (got ${savedFin?.burn_rate})`);
    assert(savedFin?.runway_months === 22, `Saved financial runway = 22 (got ${savedFin?.runway_months})`);
    // Verify saved market module has TAM from text
    const savedMkt = ar?.module_results?.market_analysis;
    assert(savedMkt?.tam === '$8.5B', `Saved market TAM = $8.5B (got ${savedMkt?.tam})`);
    // Verify analysis_id was set
    assert(saved.json?.analysis_id !== null, `analysis_id set in DB (got ${saved.json?.analysis_id})`);
    console.log(`    → DB analysis_id: ${saved.json?.analysis_id}`);
    console.log(`    → DB TCA score: ${ar?.final_tca_score}`);
    console.log(`    → DB revenue: $${savedFin?.revenue}  TAM: ${savedMkt?.tam}`);
    console.log('');

    // ─────────────────────────────────────────────────────────────────
    // STEP 14: Upload Client B (weak startup) — DIFFERENT DATA
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 14. Upload Client B (BetaWidget) — weak startup');
    const u2 = await api('POST', '/api/text/submit', CLIENT_B);
    assert(u2.status === 200, 'Client B upload returns 200');
    const uploadIdB = u2.json?.upload_id;
    if (uploadIdB) createdIds.push(uploadIdB);
    console.log(`    → upload_id: ${uploadIdB}\n`);

    // ─────────────────────────────────────────────────────────────────
    // STEP 15: Run 9-Module Analysis for Client B
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 15. Run 9-Module Analysis for Client B (from DB)');
    const a2 = await api('POST', '/api/analysis/9-module', {
        company_name: 'BetaWidget Inc',
        upload_ids: [uploadIdB]
    });
    assert(a2.status === 200, 'Client B analysis returns 200');
    const scoreB = a2.json?.final_tca_score;
    const modsB = a2.json?.module_results;
    console.log(`    → Final TCA Score: ${scoreB}/10`);
    console.log(`    → Recommendation: ${a2.json?.investment_recommendation}\n`);

    // ─────────────────────────────────────────────────────────────────
    // STEP 16: Compare scores — Client A vs Client B (MUST differ)
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 16. Compare Client A vs Client B — Scores MUST Differ');
    assert(scoreA > scoreB, `Client A (${scoreA}) > Client B (${scoreB}) — strong beats weak`);
    assert(scoreA - scoreB >= 2.0, `Score gap ≥ 2.0 points (gap = ${(scoreA - scoreB).toFixed(1)})`);

    // Module-by-module comparison
    for (const modId of ['financial_analysis', 'market_analysis', 'team_assessment', 'growth_assessment']) {
        const sA = modules?. [modId]?.score;
        const sB = modsB?. [modId]?.score;
        assert(sA > sB, `${modId}: A(${sA}) > B(${sB})`);
    }

    // Client B financial should use CLIENT B's numbers
    const finB = modsB?.financial_analysis;
    assert(finB?.revenue === 12000, `Client B revenue = 12000 (got ${finB?.revenue})`);
    assert(finB?.burn_rate === 25000, `Client B burn = 25000 (got ${finB?.burn_rate})`);
    assert(finB?.runway_months === 4, `Client B runway = 4 months (got ${finB?.runway_months})`);
    assert(finB?.mrr === 1000, `Client B MRR = 1000 (got ${finB?.mrr})`);
    assert(finB?.score < 6.0, `Client B fin score low (got ${finB?.score})`);

    // Client B market should NOT find TAM (not in text)
    const mktB = modsB?.market_analysis;
    assert(mktB?.tam === 'Not provided', `Client B TAM = Not provided (got ${mktB?.tam})`);
    assert(mktB?.score < modules?.market_analysis?.score, `Client B market score < A (${mktB?.score} < ${modules?.market_analysis?.score})`);

    // Client B team should use team of 3
    const teamB = modsB?.team_assessment;
    assert(teamB?.team_size === 3, `Client B team = 3 (got ${teamB?.team_size})`);
    assert(teamB?.score < team?.score, `Client B team score < A (${teamB?.score} < ${team?.score})`);

    console.log(`    → A: ${scoreA}/10  vs  B: ${scoreB}/10  (gap: ${(scoreA - scoreB).toFixed(1)})`);
    console.log(`    → A fin: ${fin?.score}  vs  B fin: ${finB?.score}`);
    console.log(`    → A mkt: ${mkt?.score}  vs  B mkt: ${mktB?.score}`);
    console.log(`    → A team: ${team?.score}  vs  B team: ${teamB?.score}`);
    console.log('');

    // ─────────────────────────────────────────────────────────────────
    // STEP 17: Verify Client B analysis also saved to DB
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 17. Verify Client B Analysis Saved to DB');
    const savedB = await api('GET', `/api/uploads/${uploadIdB}`);
    const arB = typeof savedB.json?.analysis_result === 'string' ?
        JSON.parse(savedB.json.analysis_result) : savedB.json?.analysis_result;
    assert(arB?.final_tca_score === scoreB, `Saved B score matches (${arB?.final_tca_score} === ${scoreB})`);
    assert(arB?.module_results?.financial_analysis?.revenue === 12000, `Saved B revenue = 12000`);
    assert(arB?.company_name === 'BetaWidget Inc', 'Saved B company name correct');
    assert(savedB.json?.analysis_id !== null, 'Client B analysis_id set in DB');
    console.log(`    → DB score: ${arB?.final_tca_score}  DB revenue: ${arB?.module_results?.financial_analysis?.revenue}`);
    console.log('');

    // ─────────────────────────────────────────────────────────────────
    // STEP 18: Verify final TCA score is weighted average of modules
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 18. Verify Final Score = Weighted Average of Modules');
    const weights = {
        tca_scorecard: 3.0,
        risk_assessment: 2.5,
        market_analysis: 2.0,
        team_assessment: 2.0,
        financial_analysis: 2.0,
        technology_assessment: 1.5,
        business_model: 1.5,
        growth_assessment: 1.5,
        investment_readiness: 1.5
    };
    let wSum = 0,
        wTotal = 0;
    for (const [id, w] of Object.entries(weights)) {
        const s = modules?. [id]?.score || 0;
        wSum += s * w;
        wTotal += w;
        console.log(`    ${id}: score=${s} × weight=${w} = ${(s * w).toFixed(1)}`);
    }
    const expectedFinal = Math.round(wSum / wTotal * 10) / 10;
    assert(Math.abs(scoreA - expectedFinal) < 0.2,
        `Final score ${scoreA} ≈ weighted avg ${expectedFinal} (diff ${Math.abs(scoreA - expectedFinal).toFixed(2)})`);
    console.log(`    → Calculated: ${expectedFinal}  Actual: ${scoreA}\n`);

    // ─────────────────────────────────────────────────────────────────
    // STEP 19: Cleanup — delete test uploads
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ 19. Cleanup — delete test uploads');
    for (const id of createdIds) {
        const d = await api('DELETE', `/api/uploads/${id}`);
        assert(d.status === 200, `Deleted ${id.substring(0, 8)}..`);
    }
    // Verify they're gone
    for (const id of createdIds) {
        const check = await api('GET', `/api/uploads/${id}`);
        assert(check.status === 404, `Upload ${id.substring(0, 8)}.. confirmed gone`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════');
    console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    console.log('═══════════════════════════════════════════════════');

    process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});