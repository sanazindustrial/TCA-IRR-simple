#!/usr/bin/env node

/**
 * E2E Test: Upload → Extract → DB Persist → Query
 *
 * Tests all three upload paths (file, url, text) against the running backend,
 * then verifies the data was persisted in the allupload table by reading it back.
 *
 * Prerequisites:
 *   - Backend running on http://localhost:8000 (py -3.12 main.py)
 *   - allupload table created (py -3.12 migrate_allupload.py)
 *
 * Usage:  node test-upload-db-e2e.js
 */

const BASE = 'http://localhost:8000';
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;
const results = [];

function log(icon, msg) {
    console.log(`${icon}  ${msg}`);
}

function ok(name, detail) {
    passed++;
    results.push({
        name,
        status: 'PASS',
        detail
    });
    log('✅', `${name}: ${detail}`);
}

function fail(name, detail) {
    failed++;
    results.push({
        name,
        status: 'FAIL',
        detail
    });
    log('❌', `${name}: ${detail}`);
}

async function post(url, body) {
    const res = await fetch(`${BASE}${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    return {
        status: res.status,
        data: await res.json()
    };
}

async function get(url) {
    const res = await fetch(`${BASE}${url}`);
    return {
        status: res.status,
        data: await res.json()
    };
}

async function del(url) {
    const res = await fetch(`${BASE}${url}`, {
        method: 'DELETE'
    });
    return {
        status: res.status,
        data: await res.json()
    };
}

// ─── Test data files ─────────────────────────────────────────────────────────

function loadJsonFiles() {
    const jsonFiles = [
        'realistic-analysis-data.json',
        'e2e-analysis-result.json',
        'test-report-upload-analysis.json'
    ];
    const loaded = [];
    for (const f of jsonFiles) {
        const p = path.join(__dirname, f);
        if (fs.existsSync(p)) {
            loaded.push({
                name: f,
                data: JSON.parse(fs.readFileSync(p, 'utf8'))
            });
        }
    }
    return loaded;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  E2E Upload → DB Persistence Test Suite');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const uploadIds = []; // track IDs for later query/delete

    // ── 0. Health check ──────────────────────────────────────────────────────
    try {
        const h = await get('/api/health');
        if (h.data.status === 'healthy') ok('Health Check', `Backend healthy, DB ${h.data.database}`);
        else fail('Health Check', `Unexpected status: ${h.data.status}`);
    } catch (e) {
        fail('Health Check', `Backend unreachable: ${e.message}`);
        console.log('\n⛔  Backend not running. Start it with: py -3.12 main.py');
        process.exit(1);
    }

    // ── 1. File upload (single file) ────────────────────────────────────────
    try {
        const r = await post('/api/files/upload', {
            company_name: 'TestCorp',
            files: [{
                name: 'pitch-deck.pdf',
                type: 'application/pdf',
                size: 245000
            }]
        });
        if (r.status === 200 && r.data.files_processed === 1 && r.data.processed_files[0].upload_id) {
            const uid = r.data.processed_files[0].upload_id;
            uploadIds.push(uid);
            ok('File Upload (single)', `Persisted as upload_id=${uid.substring(0, 8)}…`);
        } else {
            fail('File Upload (single)', JSON.stringify(r.data).substring(0, 200));
        }
    } catch (e) {
        fail('File Upload (single)', e.message);
    }

    // ── 2. File upload (multiple files) ─────────────────────────────────────
    try {
        const r = await post('/api/files/upload', {
            company_name: 'MultiDocCorp',
            files: [{
                    name: 'financials.xlsx',
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    size: 180000
                },
                {
                    name: 'team-overview.docx',
                    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    size: 95000
                },
                {
                    name: 'market-analysis.pdf',
                    type: 'application/pdf',
                    size: 320000
                }
            ]
        });
        if (r.status === 200 && r.data.files_processed === 3) {
            r.data.processed_files.forEach(f => uploadIds.push(f.upload_id));
            ok('File Upload (multi)', `3 files persisted`);
        } else {
            fail('File Upload (multi)', `Expected 3 files, got ${r.data.files_processed}`);
        }
    } catch (e) {
        fail('File Upload (multi)', e.message);
    }

    // ── 3. URL fetch ────────────────────────────────────────────────────────
    try {
        const r = await post('/api/urls/fetch', {
            company_name: 'WebCorp',
            urls: [
                'https://www.example.com/about',
                'https://www.linkedin.com/company/webcorp'
            ]
        });
        if (r.status === 200 && r.data.urls_processed === 2) {
            r.data.processed_urls.forEach(u => uploadIds.push(u.upload_id));
            ok('URL Fetch', `2 URLs persisted`);
        } else {
            fail('URL Fetch', `Expected 2 URLs, got ${r.data.urls_processed}`);
        }
    } catch (e) {
        fail('URL Fetch', e.message);
    }

    // ── 4. Text submission ──────────────────────────────────────────────────
    try {
        const r = await post('/api/text/submit', {
            company_name: 'TextCorp',
            title: 'Investor Notes',
            text: 'TextCorp is an early-stage SaaS company focused on B2B analytics. Revenue is $120K ARR, growing 20% MoM. Team of 6 engineers, 2 sales reps. Seeking Series A at $5M valuation.'
        });
        if (r.status === 200 && r.data.upload_id) {
            uploadIds.push(r.data.upload_id);
            ok('Text Submit', `Persisted, word_count=${r.data.word_count}`);
        } else {
            fail('Text Submit', JSON.stringify(r.data).substring(0, 200));
        }
    } catch (e) {
        fail('Text Submit', e.message);
    }

    // ── 5. Upload all JSON test data files as file uploads ──────────────────
    const jsonFiles = loadJsonFiles();
    for (const jf of jsonFiles) {
        try {
            const r = await post('/api/files/upload', {
                company_name: jf.data.company_name || jf.data.companyName || 'JSON-Upload',
                files: [{
                    name: jf.name,
                    type: 'application/json',
                    size: JSON.stringify(jf.data).length
                }]
            });
            if (r.status === 200 && r.data.files_processed === 1) {
                uploadIds.push(r.data.processed_files[0].upload_id);
                ok(`JSON Upload (${jf.name})`, 'Persisted');
            } else {
                fail(`JSON Upload (${jf.name})`, 'Insert failed');
            }
        } catch (e) {
            fail(`JSON Upload (${jf.name})`, e.message);
        }
    }

    // ── 6. List all uploads ─────────────────────────────────────────────────
    try {
        const r = await get('/api/uploads');
        if (r.status === 200 && r.data.total >= uploadIds.length) {
            ok('List Uploads', `${r.data.total} uploads in allupload table`);
        } else {
            fail('List Uploads', `Expected >= ${uploadIds.length}, got ${r.data.total}`);
        }
    } catch (e) {
        fail('List Uploads', e.message);
    }

    // ── 7. Get single upload by ID ──────────────────────────────────────────
    if (uploadIds.length > 0) {
        try {
            const r = await get(`/api/uploads/${uploadIds[0]}`);
            if (r.status === 200 && r.data.upload_id === uploadIds[0]) {
                const hasExtracted = r.data.extracted_data && Object.keys(r.data.extracted_data).length > 0;
                ok('Get Upload by ID', `Found, extracted_data present=${hasExtracted}, company=${r.data.company_name}`);
            } else {
                fail('Get Upload by ID', `ID mismatch or not found`);
            }
        } catch (e) {
            fail('Get Upload by ID', e.message);
        }
    }

    // ── 8. Filter uploads by status ─────────────────────────────────────────
    try {
        const r = await get('/api/uploads?status=completed');
        if (r.status === 200 && r.data.total > 0) {
            ok('Filter by Status', `${r.data.total} completed uploads`);
        } else {
            fail('Filter by Status', 'No completed uploads found');
        }
    } catch (e) {
        fail('Filter by Status', e.message);
    }

    // ── 9. Verify extracted_data JSONB content ──────────────────────────────
    if (uploadIds.length > 0) {
        try {
            const r = await get(`/api/uploads/${uploadIds[0]}`);
            const ed = r.data.extracted_data;
            if (ed && ed.financial_data && ed.financial_data.revenue === 500000) {
                ok('JSONB Extracted Data', `financial_data.revenue=500000, key_metrics.mrr=${ed.key_metrics?.mrr}`);
            } else if (ed && ed.text_content) {
                ok('JSONB Extracted Data', `text_content present (${ed.text_content.substring(0, 40)}…)`);
            } else {
                fail('JSONB Extracted Data', 'extracted_data missing or malformed');
            }
        } catch (e) {
            fail('JSONB Extracted Data', e.message);
        }
    }

    // ── 10. Delete one upload ───────────────────────────────────────────────
    if (uploadIds.length > 0) {
        const deleteId = uploadIds[uploadIds.length - 1]; // delete last one
        try {
            const r = await del(`/api/uploads/${deleteId}`);
            if (r.status === 200 && r.data.status === 'deleted') {
                ok('Delete Upload', `Deleted ${deleteId.substring(0, 8)}…`);
                // Verify 404 on re-fetch
                const r2 = await get(`/api/uploads/${deleteId}`);
                if (r2.status === 404) {
                    ok('Delete Verify', 'Correctly returns 404 after delete');
                } else {
                    fail('Delete Verify', `Expected 404, got ${r2.status}`);
                }
            } else {
                fail('Delete Upload', `Unexpected response: ${JSON.stringify(r.data)}`);
            }
        } catch (e) {
            fail('Delete Upload', e.message);
        }
    }

    // ── Summary ─────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Write results JSON
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: passed + failed,
            passed,
            failed
        },
        upload_ids: uploadIds,
        tests: results
    };
    fs.writeFileSync('upload-db-e2e-results.json', JSON.stringify(report, null, 2));
    console.log('Report written to upload-db-e2e-results.json');

    process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});