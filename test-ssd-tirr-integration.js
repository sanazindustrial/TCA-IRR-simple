/**
 * ═══════════════════════════════════════════════════════════════════════
 *  SSD → TCA TIRR INTEGRATION TEST SUITE
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Tests the full integration flow using the spec-compliant JSON schema
 *  (sections 4.1.1 – 4.1.8):
 *    1. POST startup data to /api/ssd/tirr  (full SSD payload)
 *    2. Poll /api/ssd/tirr/{tracking_id} until report is ready
 *    3. Validate generated report structure (6-page triage)
 *    4. Validation edge cases  (missing fields, bad email, minimal)
 *    5. Data persistence in allupload
 *
 *  Run:  node test-ssd-tirr-integration.js
 *  Requires: Backend running on http://localhost:8000
 */

const BASE = 'http://localhost:8000';
const fs = require('fs');

let passed = 0,
    failed = 0,
    warnings = 0;
const results = {};

// ─── Helpers ─────────────────────────────────────────────────────
function assert(condition, label, detail) {
    if (condition) {
        console.log(`  ✅ ${label}`);
        passed++;
    } else {
        console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
        failed++;
    }
    return condition;
}

function warn(label, detail) {
    console.log(`  ⚠️  ${label}${detail ? ' — ' + detail : ''}`);
    warnings++;
}

async function api(method, path, body, headers = {}) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
    };
    if (body) opts.body = JSON.stringify(body);
    try {
        const res = await fetch(`${BASE}${path}`, opts);
        let json = null;
        const text = await res.text();
        try {
            json = JSON.parse(text);
        } catch {}
        return {
            status: res.status,
            json,
            text,
            headers: res.headers
        };
    } catch (e) {
        return {
            status: 0,
            json: null,
            text: '',
            error: e.message
        };
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════
//  SAMPLE SSD PAYLOAD  (spec sections 4.1.1 – 4.1.8)
// ═══════════════════════════════════════════════════════════════════
function buildSSDPayload(overrides = {}) {
    return {
        contactInformation: {
            email: 'john.doe@techstartup.com',
            phoneNumber: '+1-555-0123',
            firstName: 'John',
            lastName: 'Doe',
            jobTitle: 'CEO & Co-Founder',
            linkedInUrl: 'https://www.linkedin.com/in/johndoe',
        },
        companyInformation: {
            companyName: 'TechStartup Inc.',
            website: 'https://www.techstartup.com',
            industryVertical: 'Artificial Intelligence',
            developmentStage: 'Seed',
            businessModel: 'B2B SaaS',
            country: 'United States',
            state: 'California',
            city: 'San Francisco',
            oneLineDescription: 'AI-powered customer service automation platform',
            companyDescription: 'TechStartup Inc. is revolutionizing customer service through advanced AI and machine learning technologies. Our platform enables businesses to automate up to 80% of customer inquiries while maintaining high satisfaction rates.',
            productDescription: 'Our flagship product is an AI chatbot that integrates seamlessly with existing CRM systems, providing 24/7 customer support with natural language understanding and multi-language capabilities.',
            pitchDeckPath: '/documents/pitchdecks/techstartup_deck_2024.pdf',
            legalName: 'TechStartup Incorporated',
            numberOfEmployees: 12,
        },
        financialInformation: {
            fundingType: 'Seed',
            annualRevenue: 250000.0,
            preMoneyValuation: 5000000.0,
            postMoneyValuation: 6500000.0,
            offeringType: 'SAFE Note',
            targetRaise: 1500000.0,
            currentlyRaised: 750000.0,
        },
        investorQuestions: {
            problemSolution: 'Businesses struggle with high customer service costs and slow response times. Our AI solution reduces costs by 60% while improving response times from hours to seconds.',
            companyBackgroundTeam: 'Founded by John Doe (ex-Google AI) and Jane Smith (ex-Salesforce), with a team of 12 including 5 PhDs in machine learning and natural language processing.',
            markets: 'Primary market: Mid-size B2B companies (100-1000 employees) in e-commerce, SaaS, and financial services. TAM of $50B globally.',
            competitionDifferentiation: 'Unlike competitors like Zendesk and Intercom, our proprietary NLP engine achieves 95% accuracy vs industry average of 75%, with half the training time.',
            businessModelChannels: 'Monthly SaaS subscription ($500-5000/month based on volume), with enterprise packages. Distribution through direct sales, partnerships with CRM providers, and digital marketing.',
            timeline: 'Q1 2024: Launched MVP with 5 beta customers. Q2-Q3: Grew to 25 paying customers. Q4: Planning Series A raise and expansion to European market.',
            technologyIP: 'Proprietary NLP algorithm with patent pending. Custom-trained language models on 10M+ customer service interactions. Trade secrets in data processing pipeline.',
            specialAgreements: 'Strategic partnership with major CRM provider for distribution. Pilot program with Fortune 500 company.',
            cashFlow: 'Current burn rate: $85K/month. Runway: 18 months. Monthly revenue growing at 25% MoM. Expect to reach break-even in 24 months.',
            fundingHistory: 'Pre-seed: $250K from angel investors in Jan 2023. Current seed round: $750K raised of $1.5M target.',
            risksChallenges: 'Key risks: Large competitors may replicate technology, customer data privacy concerns, dependency on cloud infrastructure. Mitigation: Strong IP protection, SOC2 compliance, multi-cloud strategy.',
            exitStrategy: 'Target acquisition by major CRM or customer service platform (Salesforce, ServiceNow, Zendesk) within 5-7 years. Alternative: IPO if we reach $100M ARR.',
        },
        documents: {
            executiveSummaryPath: '/documents/executive_summary_2024.pdf',
            businessPlanPath: '/documents/business_plan_2024_2027.pdf',
            financialProjectionPath: '/documents/financial_projections_5yr.pdf',
            additionalDocumentsPaths: [
                '/documents/patent_application.pdf',
                '/documents/partnership_agreement.pdf',
                '/documents/customer_testimonials.pdf',
            ],
        },
        customerMetrics: {
            customerAcquisitionCost: 1200.0,
            customerLifetimeValue: 18000.0,
            churn: 5.5,
            margins: 75.0,
        },
        revenueMetrics: {
            totalRevenuesToDate: 450000.0,
            monthlyRecurringRevenue: 62500.0,
            yearToDateRevenue: 250000.0,
            burnRate: 85000.0,
        },
        marketSize: {
            totalAvailableMarket: 50000000000.0,
            serviceableAreaMarket: 12000000000.0,
            serviceableObtainableMarket: 500000000.0,
        },
        ...overrides,
    };
}

// ═══════════════════════════════════════════════════════════════════
//  TEST 1: Health check — make sure backend is up
// ═══════════════════════════════════════════════════════════════════
async function testHealthCheck() {
    console.log('\n▶ TEST 1: HEALTH CHECK');
    const health = await api('GET', '/health');
    assert(health.status === 200, '1.1 Backend is running (health 200)');
    assert(health.json?.table_count >= 1, `1.2 Database connected (tables: ${health.json?.table_count})`);
    results.health = health.status;
}

// ═══════════════════════════════════════════════════════════════════
//  TEST 2: Submit startup data via /api/ssd/tirr
// ═══════════════════════════════════════════════════════════════════
async function testSubmitSSDData() {
    console.log('\n▶ TEST 2: SUBMIT STARTUP DATA TO TCA TIRR (full SSD spec payload)');

    const payload = buildSSDPayload();

    const start = Date.now();
    const res = await api('POST', '/api/ssd/tirr', payload);
    const elapsed = Date.now() - start;

    assert(res.status === 202, `2.1 Returns 202 Accepted (got ${res.status})`);
    assert(res.json?.status === 'accepted', `2.2 Status = accepted`);
    assert(!!res.json?.tracking_id, `2.3 Tracking ID returned: ${res.json?.tracking_id}`);
    assert(elapsed < 3000, `2.4 Response time < 3s (${elapsed}ms) — async processing`);
    assert(res.json?.message?.includes('TechStartup'), `2.5 Message includes company name`);

    results.submit = {
        status: res.status,
        tracking_id: res.json?.tracking_id,
        elapsed
    };
    return res.json?.tracking_id;
}

// ═══════════════════════════════════════════════════════════════════
//  TEST 3: Poll for report completion
// ═══════════════════════════════════════════════════════════════════
async function testPollForReport(trackingId) {
    console.log('\n▶ TEST 3: POLL FOR REPORT COMPLETION');

    if (!trackingId) {
        console.log('  ⏭️  Skipped — no tracking ID from TEST 2');
        return null;
    }

    const maxWait = 60000; // 60 seconds max
    const pollInterval = 2000;
    const startPoll = Date.now();
    let report = null;

    while (Date.now() - startPoll < maxWait) {
        const res = await api('GET', `/api/ssd/tirr/${trackingId}`);

        if (res.json?.status === 'completed') {
            report = res.json;
            const waitTime = Date.now() - startPoll;
            assert(true, `3.1 Report completed in ${waitTime}ms`);
            assert(!!res.json?.report_file_path, `3.2 Report file path returned: ${res.json?.report_file_path}`);
            assert(!!res.json?.report, '3.3 Report data included in response');
            break;
        }

        assert(res.status === 202, `3.0 Polling — status still processing (${res.json?.status})`);
        await sleep(pollInterval);
    }

    if (!report) {
        assert(false, '3.1 Report generation timed out after 60s');
        return null;
    }

    results.poll = {
        status: 'completed',
        trackingId
    };
    return report;
}

// ═══════════════════════════════════════════════════════════════════
//  TEST 4: Validate triage report structure
// ═══════════════════════════════════════════════════════════════════
async function testReportStructure(reportData) {
    console.log('\n▶ TEST 4: VALIDATE TRIAGE REPORT STRUCTURE');

    if (!reportData?.report) {
        console.log('  ⏭️  Skipped — no report data');
        return;
    }

    const r = reportData.report;

    // Top-level fields
    assert(r.report_type === 'triage', `4.1 report_type = triage (got ${r.report_type})`);
    assert(r.company_name === 'TechStartup Inc.', `4.2 company_name correct (got ${r.company_name})`);
    assert(!!r.founder_email, `4.3 founder_email present: ${r.founder_email}`);
    assert(r.founder_email === 'john.doe@techstartup.com', `4.3b founder_email value correct`);
    assert(!!r.founder_name, `4.3c founder_name present: ${r.founder_name}`);
    assert(!!r.tracking_id, `4.4 tracking_id present`);
    assert(!!r.generated_at, `4.5 generated_at timestamp present`);
    assert(typeof r.final_tca_score === 'number', `4.6 final_tca_score is number: ${r.final_tca_score}`);
    assert(r.final_tca_score >= 0 && r.final_tca_score <= 10, `4.7 Score in 0-10 range: ${r.final_tca_score}`);
    assert(!!r.recommendation, `4.8 Recommendation present: ${r.recommendation}`);
    assert(r.total_pages === 6, `4.9 Total pages = 6`);

    // Page structure
    assert(!!r.page_1_executive_summary, '4.10 Page 1: Executive Summary present');
    assert(!!r.page_2_tca_scorecard, '4.11 Page 2: TCA Scorecard present');
    assert(!!r.page_3_risk_assessment, '4.12 Page 3: Risk Assessment present');
    assert(!!r.page_4_market_and_team, '4.13 Page 4: Market & Team present');
    assert(!!r.page_5_financials_and_tech, '4.14 Page 5: Financials & Tech present');
    assert(!!r.page_6_recommendations, '4.15 Page 6: Recommendations present');

    // Validate executive summary
    const p1 = r.page_1_executive_summary;
    assert(p1.overall_score === r.final_tca_score, '4.16 Executive summary score matches final score');
    assert(!!p1.score_interpretation, '4.17 Score interpretation present');
    assert(p1.modules_run === 9, `4.18 Modules run = 9 (got ${p1.modules_run})`);

    // Validate scorecard has categories
    const p2 = r.page_2_tca_scorecard;
    assert(Array.isArray(p2.categories) && p2.categories.length > 0, `4.19 Scorecard has categories (${p2.categories?.length})`);

    // Validate risk assessment
    const p3 = r.page_3_risk_assessment;
    assert(typeof p3.overall_risk_score === 'number', `4.20 Risk score is number: ${p3.overall_risk_score}`);
    assert(Array.isArray(p3.risk_flags), '4.21 Risk flags is array');

    // Validate financial data present
    const p5 = r.page_5_financials_and_tech;
    assert(p5.revenue > 0 || p5.financial_score > 0, '4.22 Financial data present in report');

    // Validate recommendations page
    const p6 = r.page_6_recommendations;
    assert(!!p6.final_decision, '4.23 Final decision present');
    assert(Array.isArray(p6.next_steps) && p6.next_steps.length > 0, '4.24 Next steps present');

    results.report = {
        score: r.final_tca_score,
        recommendation: r.recommendation,
        pages: r.total_pages,
    };
}

// ═══════════════════════════════════════════════════════════════════
//  TEST 5: Validation edge cases
// ═══════════════════════════════════════════════════════════════════
async function testValidation() {
    console.log('\n▶ TEST 5: VALIDATION & EDGE CASES');

    // 5.1 Missing required contactInformation.email
    const noEmail = await api('POST', '/api/ssd/tirr', {
        contactInformation: {
            phoneNumber: '+1-555-0000',
            firstName: 'X',
            lastName: 'Y'
        },
        companyInformation: {
            industryVertical: 'AI',
            developmentStage: 'Seed',
            businessModel: 'SaaS',
            country: 'US',
            state: 'CA',
            city: 'SF',
            oneLineDescription: 'Test',
            companyDescription: 'Test',
            productDescription: 'Test',
            pitchDeckPath: '/test.pdf',
        },
        financialInformation: {
            fundingType: 'Seed',
            annualRevenue: 100,
            preMoneyValuation: 1000
        },
    });
    assert(noEmail.status === 422, `5.1 Missing email rejected (got ${noEmail.status})`);

    // 5.2 Invalid email format
    const badEmail = await api('POST', '/api/ssd/tirr', {
        contactInformation: {
            email: 'not-an-email',
            phoneNumber: '+1-555-0000',
            firstName: 'X',
            lastName: 'Y'
        },
        companyInformation: {
            industryVertical: 'AI',
            developmentStage: 'Seed',
            businessModel: 'SaaS',
            country: 'US',
            state: 'CA',
            city: 'SF',
            oneLineDescription: 'Test',
            companyDescription: 'Test',
            productDescription: 'Test',
            pitchDeckPath: '/test.pdf',
        },
        financialInformation: {
            fundingType: 'Seed',
            annualRevenue: 100,
            preMoneyValuation: 1000
        },
    });
    assert(badEmail.status === 422, `5.2 Invalid email format rejected (got ${badEmail.status})`);

    // 5.3 Missing companyInformation entirely
    const noCompany = await api('POST', '/api/ssd/tirr', {
        contactInformation: {
            email: 'test@example.com',
            phoneNumber: '+1-555-0000',
            firstName: 'X',
            lastName: 'Y'
        },
        financialInformation: {
            fundingType: 'Seed',
            annualRevenue: 100,
            preMoneyValuation: 1000
        },
    });
    assert(noCompany.status === 422, `5.3 Missing companyInformation rejected (got ${noCompany.status})`);

    // 5.4 Missing financialInformation
    const noFinance = await api('POST', '/api/ssd/tirr', {
        contactInformation: {
            email: 'test@example.com',
            phoneNumber: '+1-555-0000',
            firstName: 'X',
            lastName: 'Y'
        },
        companyInformation: {
            industryVertical: 'AI',
            developmentStage: 'Seed',
            businessModel: 'SaaS',
            country: 'US',
            state: 'CA',
            city: 'SF',
            oneLineDescription: 'Test',
            companyDescription: 'Test',
            productDescription: 'Test',
            pitchDeckPath: '/test.pdf',
        },
    });
    assert(noFinance.status === 422, `5.4 Missing financialInformation rejected (got ${noFinance.status})`);

    // 5.5 Minimal valid payload (only required fields across all sections)
    const minimal = await api('POST', '/api/ssd/tirr', {
        contactInformation: {
            email: 'minimal@example.com',
            phoneNumber: '+1-555-0001',
            firstName: 'Min',
            lastName: 'Test'
        },
        companyInformation: {
            industryVertical: 'FinTech',
            developmentStage: 'Pre-Seed',
            businessModel: 'Marketplace',
            country: 'US',
            state: 'NY',
            city: 'NYC',
            oneLineDescription: 'Minimal test',
            companyDescription: 'Minimal',
            productDescription: 'Minimal product',
            pitchDeckPath: '/minimal.pdf',
        },
        financialInformation: {
            fundingType: 'Pre-Seed',
            annualRevenue: 0,
            preMoneyValuation: 500000
        },
    });
    assert(minimal.status === 202, `5.5 Minimal valid payload accepted (got ${minimal.status})`);
    if (minimal.json?.tracking_id) {
        assert(true, `5.6 Tracking ID for minimal: ${minimal.json.tracking_id}`);
    }

    // 5.7 Non-existent tracking ID status check
    const badTrack = await api('GET', '/api/ssd/tirr/nonexistent-id-000');
    assert(badTrack.status === 202 && badTrack.json?.status === 'processing',
        `5.7 Unknown tracking ID returns processing (got ${badTrack.status})`);

    // 5.8 Empty body
    const emptyBody = await api('POST', '/api/ssd/tirr', {});
    assert(emptyBody.status === 422, `5.8 Empty body rejected (got ${emptyBody.status})`);

    results.validation = 'tested';
}

// ═══════════════════════════════════════════════════════════════════
//  TEST 6: Verify data persisted in allupload
// ═══════════════════════════════════════════════════════════════════
async function testDataPersistence(trackingId) {
    console.log('\n▶ TEST 6: DATA PERSISTENCE');

    if (!trackingId) {
        console.log('  ⏭️  Skipped — no tracking ID');
        return;
    }

    // List uploads and find our SSD entry
    const list = await api('GET', '/api/uploads?limit=10');
    assert(list.status === 200, '6.1 Can list uploads');

    if (list.json?.uploads) {
        const ssdUpload = list.json.uploads.find(
            u => u.company_name === 'TechStartup Inc.' && u.source_type === 'ssd_tirr'
        );
        assert(!!ssdUpload, '6.2 SSD upload found in allupload table');
        if (ssdUpload) {
            assert(ssdUpload.processing_status === 'completed', `6.3 Processing status = completed (got ${ssdUpload.processing_status})`);
            assert(!!ssdUpload.analysis_id, `6.4 Analysis ID present: ${ssdUpload.analysis_id}`);

            // Retrieve full upload details
            const detail = await api('GET', `/api/uploads/${ssdUpload.upload_id}`);
            assert(detail.status === 200, '6.5 Can retrieve upload detail');
            if (detail.json?.analysis_result) {
                assert(detail.json.analysis_result.analysis_type === 'comprehensive_9_module',
                    '6.6 Analysis result type = comprehensive_9_module');
                assert(typeof detail.json.analysis_result.final_tca_score === 'number',
                    `6.7 Analysis score stored: ${detail.json.analysis_result.final_tca_score}`);
            }
        }
    }

    results.persistence = 'verified';
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN RUNNER
// ═══════════════════════════════════════════════════════════════════
async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SSD → TCA TIRR INTEGRATION TEST SUITE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Target: ${BASE}`);
    console.log(`  Time:   ${new Date().toISOString()}\n`);

    try {
        await testHealthCheck();
        const trackingId = await testSubmitSSDData();
        const reportData = await testPollForReport(trackingId);
        await testReportStructure(reportData);
        await testValidation();
        await testDataPersistence(trackingId);
    } catch (e) {
        console.error('\n💥 FATAL ERROR:', e.message);
    }

    // Summary
    const total = passed + failed;
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`  RESULTS: ${passed}/${total} passed, ${failed} failed, ${warnings} warnings`);
    console.log('═══════════════════════════════════════════════════════════');

    if (failed === 0) {
        console.log('\n  ✅ ALL TESTS PASSED — SSD-TIRR integration is working correctly.');
    } else {
        console.log(`\n  ❌ ${failed} TEST(S) FAILED — review output above.`);
    }

    // Save report
    const report = {
        suite: 'SSD-TIRR Integration',
        timestamp: new Date().toISOString(),
        passed,
        failed,
        warnings,
        total,
        success_rate: `${((passed / total) * 100).toFixed(1)}%`,
        results,
    };

    fs.writeFileSync('test-ssd-tirr-report.json', JSON.stringify(report, null, 2));
    console.log('\n  📄 Report saved → test-ssd-tirr-report.json\n');
}

main().catch(console.error);