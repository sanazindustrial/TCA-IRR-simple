#!/usr/bin/env node

/**
 * E2E Report Pipeline Test
 * - Uploads a real file (metadata)
 * - Calls comprehensive analysis
 * - Writes analysis result and a markdown report
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const UPLOAD_FILE = process.argv[2] || 'test-report-upload-analysis.json';
const OUTPUT_JSON = 'e2e-analysis-result.json';
const OUTPUT_MD = 'E2E_REPORT_RUN.md';

function mimeFromExt(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const map = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.csv': 'text/csv',
        '.json': 'application/json',
        '.txt': 'text/plain'
    };
    return map[ext] || 'application/octet-stream';
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
}

async function run() {
    const runLog = [];
    const startedAt = new Date().toISOString();

    if (!fs.existsSync(UPLOAD_FILE)) {
        throw new Error(`Upload file not found: ${UPLOAD_FILE}`);
    }

    const uploadStats = fs.statSync(UPLOAD_FILE);
    const uploadName = path.basename(UPLOAD_FILE);
    const uploadType = mimeFromExt(UPLOAD_FILE);
    const uploadPayload = {
        files: [{
            name: uploadName,
            size: uploadStats.size,
            type: uploadType
        }]
    };

    const rawUploadContent = fs.readFileSync(UPLOAD_FILE, 'utf8');
    let parsedUploadContent = null;
    try {
        parsedUploadContent = JSON.parse(rawUploadContent);
    } catch {
        parsedUploadContent = {
            raw_text: rawUploadContent.slice(0, 2000)
        };
    }

    // Step 1: Health check
    const healthRes = await fetchWithTimeout(`${BASE_URL}/api/health`, {
        method: 'GET'
    }, 10000);
    const healthData = await healthRes.json();
    runLog.push({
        step: 'health_check',
        ok: healthRes.ok,
        data: healthData
    });

    // Step 2: Upload file metadata
    const uploadRes = await fetchWithTimeout(`${BASE_URL}/api/files/upload`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(uploadPayload)
    }, 15000);
    const uploadData = await uploadRes.json();
    runLog.push({
        step: 'file_upload',
        ok: uploadRes.ok,
        data: uploadData
    });

    // Step 3: Run comprehensive analysis
    const companyName = parsedUploadContent.company_name || parsedUploadContent.companyName || uploadName.replace(path.extname(uploadName), '');
    const analysisPayload = {
        framework: 'general',
        company_data: {
            name: companyName,
            description: 'Imported from upload file for E2E run',
            source_file: uploadName
        },
        tcaInput: {
            uploadedFiles: uploadData.processed_files || [],
            uploadedReport: parsedUploadContent,
            reportFileName: uploadName
        }
    };

    const analysisRes = await fetchWithTimeout(`${BASE_URL}/api/analysis/comprehensive`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(analysisPayload)
    }, 60000);
    const analysisData = await analysisRes.json();
    runLog.push({
        step: 'analysis',
        ok: analysisRes.ok,
        data: analysisData
    });

    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(analysisData, null, 2));

    const score = analysisData.final_tca_score ?? 'N/A';
    const recommendation = analysisData.investment_recommendation ?? 'N/A';
    const categoryCount = analysisData.scorecard?.categories ? Object.keys(analysisData.scorecard.categories).length : 0;
    const riskCount = analysisData.risk_assessment?.flags ? Object.keys(analysisData.risk_assessment.flags).length : 0;

    const report = [
        '# E2E Report Run',
        '',
        `Date: ${new Date().toISOString()}`,
        '',
        '## Inputs',
        `- Upload file: ${UPLOAD_FILE}`,
        `- Backend: ${BASE_URL}`,
        '',
        '## Steps Executed',
        '1. Health check',
        '2. File upload (metadata)',
        '3. Comprehensive analysis',
        '',
        '## Results',
        `- Health status: ${healthData.status || 'unknown'}`,
        `- File upload: ${uploadData.status || 'unknown'} (files processed: ${uploadData.files_processed || 0})`,
        `- Analysis score: ${score}`,
        `- Recommendation: ${recommendation}`,
        `- Categories evaluated: ${categoryCount}`,
        `- Risk flags: ${riskCount}`,
        '',
        '## Notes',
        '- File upload and analysis endpoints are simulated in main.py; no persistent DB write occurs.',
        '- Analysis response saved to e2e-analysis-result.json for export validation.',
        ''
    ].join('\n');

    fs.writeFileSync(OUTPUT_MD, report);

    console.log('E2E run complete.');
    console.log(`- Result JSON: ${OUTPUT_JSON}`);
    console.log(`- Report: ${OUTPUT_MD}`);
    console.log(`- Score: ${score}`);
    console.log(`- Recommendation: ${recommendation}`);
}

run().catch((error) => {
    console.error('E2E run failed:', error.message);
    process.exit(1);
});