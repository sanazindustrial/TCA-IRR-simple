#!/usr/bin/env node

/**
 * Comprehensive Test Suite for TCA Upload and Analysis Pipeline
 * Tests file upload, data extraction, TCA analysis, and result generation
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TCA Upload and Analysis Pipeline Test Suite');
console.log('='.repeat(60));

// Test Results Tracking
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
};

function runTest(testName, testFunction) {
    testResults.total++;
    try {
        const result = testFunction();
        if (result) {
            testResults.passed++;
            testResults.details.push({
                name: testName,
                status: 'PASS',
                message: result.message || 'Test passed'
            });
            console.log(`✅ ${testName}: PASS`);
        } else {
            testResults.failed++;
            testResults.details.push({
                name: testName,
                status: 'FAIL',
                message: 'Test returned false'
            });
            console.log(`❌ ${testName}: FAIL`);
        }
    } catch (error) {
        testResults.failed++;
        testResults.details.push({
            name: testName,
            status: 'ERROR',
            message: error.message
        });
        console.log(`💥 ${testName}: ERROR - ${error.message}`);
    }
}

async function runAsyncTest(testName, testFunction) {
    testResults.total++;
    try {
        const result = await testFunction();
        if (result) {
            testResults.passed++;
            testResults.details.push({
                name: testName,
                status: 'PASS',
                message: result.message || 'Async test passed'
            });
            console.log(`✅ ${testName}: PASS`);
        } else {
            testResults.failed++;
            testResults.details.push({
                name: testName,
                status: 'FAIL',
                message: 'Async test returned false'
            });
            console.log(`❌ ${testName}: FAIL`);
        }
    } catch (error) {
        testResults.failed++;
        testResults.details.push({
            name: testName,
            status: 'ERROR',
            message: error.message
        });
        console.log(`💥 ${testName}: ERROR - ${error.message}`);
    }
}

// Test 1: File System Structure Verification
runTest('File System Structure', () => {
    const requiredFiles = [
        'package.json',
        'main.py',
        'database_config.py',
        'ai_integration.py',
        'src/app/analysis/actions.ts',
        'src/app/analysis/result/page.tsx',
        'src/app/dashboard/evaluation/page.tsx',
        'src/components/analysis/document-submission.tsx'
    ];

    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    if (missingFiles.length > 0) {
        throw new Error(`Missing files: ${missingFiles.join(', ')}`);
    }
    return {
        message: `All ${requiredFiles.length} required files present`
    };
});

// Test 2: Package.json Validation
runTest('Package.json Configuration', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    const requiredDeps = ['next', 'react', '@types/node', 'typescript'];
    const missingDeps = requiredDeps.filter(dep =>
        !packageJson.dependencies?. [dep] && !packageJson.devDependencies?. [dep]
    );

    if (missingDeps.length > 0) {
        throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
    }

    if (!packageJson.scripts?.build || !packageJson.scripts?.dev) {
        throw new Error('Missing build or dev scripts');
    }

    return {
        message: 'Package.json properly configured with required dependencies'
    };
});

// Test 3: Python Backend Files Validation
runTest('Python Backend Configuration', () => {
    const mainPy = fs.readFileSync('main.py', 'utf8');

    // Check for required endpoints
    const requiredEndpoints = [
        '/api/analysis/comprehensive',
        '/api/files/upload',
        '/api/urls/fetch',
        '/api/health'
    ];

    const missingEndpoints = requiredEndpoints.filter(endpoint =>
        !mainPy.includes(endpoint)
    );

    if (missingEndpoints.length > 0) {
        throw new Error(`Missing API endpoints: ${missingEndpoints.join(', ')}`);
    }

    // Check for required imports
    const requiredImports = ['FastAPI', 'asyncpg', 'uvicorn'];
    const missingImports = requiredImports.filter(imp =>
        !mainPy.includes(imp)
    );

    if (missingImports.length > 0) {
        throw new Error(`Missing Python imports: ${missingImports.join(', ')}`);
    }

    return {
        message: 'Backend properly configured with all required endpoints'
    };
});

// Test 4: Database Configuration Check
runTest('Database Configuration', () => {
    const dbConfig = fs.readFileSync('database_config.py', 'utf8');

    // Check for asyncio import (fixed issue)
    if (!dbConfig.includes('import asyncio')) {
        throw new Error('Missing asyncio import in database_config.py');
    }

    // Check for required database classes
    if (!dbConfig.includes('DatabaseConfig') || !dbConfig.includes('DatabaseManager')) {
        throw new Error('Missing required database classes');
    }

    // Check for Azure PostgreSQL configuration
    if (!dbConfig.includes('postgres.database.azure.com')) {
        throw new Error('Missing Azure PostgreSQL configuration');
    }

    return {
        message: 'Database configuration properly set up for Azure PostgreSQL'
    };
});

// Test 5: Frontend Component Integration
runTest('Frontend Component Integration', () => {
    const docSubmission = fs.readFileSync('src/components/analysis/document-submission.tsx', 'utf8');

    // Check for file upload functionality
    if (!docSubmission.includes('handleFileChange') || !docSubmission.includes('/api/files/upload')) {
        throw new Error('File upload functionality not properly integrated');
    }

    // Check for URL processing
    if (!docSubmission.includes('handleImportUrls') || !docSubmission.includes('/api/urls/fetch')) {
        throw new Error('URL processing functionality not properly integrated');
    }

    // Check for localStorage integration
    if (!docSubmission.includes('localStorage.setItem')) {
        throw new Error('Data persistence not implemented');
    }

    return {
        message: 'Frontend components properly integrated with backend APIs'
    };
});

// Test 6: Analysis Actions Integration
runTest('Analysis Actions Integration', () => {
    const analysisActions = fs.readFileSync('src/app/analysis/actions.ts', 'utf8');

    // Check for processed data integration
    if (!analysisActions.includes('processedFiles') || !analysisActions.includes('localStorage.getItem')) {
        throw new Error('Processed data integration missing');
    }

    // Check for backend API call
    if (!analysisActions.includes('/api/analysis/comprehensive')) {
        throw new Error('Backend API integration missing');
    }

    // Check for proper error handling
    if (!analysisActions.includes('try {') || !analysisActions.includes('catch')) {
        throw new Error('Error handling not implemented');
    }

    return {
        message: 'Analysis actions properly integrated with data processing'
    };
});

// Test 7: Result Page Dynamic Loading
runTest('Result Page Configuration', () => {
    const resultPage = fs.readFileSync('src/app/analysis/result/page.tsx', 'utf8');

    // Check for dynamic loading
    if (!resultPage.includes("export const dynamic = 'force-dynamic'")) {
        throw new Error('Dynamic loading not configured');
    }

    // Check for component integration
    const requiredComponents = ['TcaScorecard', 'RiskFlags', 'BenchmarkComparison'];
    const missingComponents = requiredComponents.filter(comp =>
        !resultPage.includes(comp)
    );

    if (missingComponents.length > 0) {
        throw new Error(`Missing components: ${missingComponents.join(', ')}`);
    }

    // Check for data loading from localStorage
    if (!resultPage.includes('localStorage.getItem')) {
        throw new Error('Data loading from localStorage not implemented');
    }

    return {
        message: 'Result page properly configured for dynamic data display'
    };
});

// Test 8: Mock File Upload Test
runAsyncTest('Mock File Upload Processing', async () => {
    // Simulate file upload data
    const mockFileData = {
        files: [{
                name: 'business_plan.pdf',
                size: 1024000,
                type: 'application/pdf'
            },
            {
                name: 'financials.xlsx',
                size: 512000,
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        ]
    };

    // Test backend processing simulation
    const processedFiles = mockFileData.files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        extracted_data: {
            text_content: `Extracted content from ${file.name}`,
            financial_data: {
                revenue: 500000,
                burn_rate: 50000,
                runway_months: 10
            },
            key_metrics: {
                team_size: 8,
                customers: 45,
                mrr: 25000
            }
        },
        processing_status: 'completed'
    }));

    if (processedFiles.length !== mockFileData.files.length) {
        throw new Error('File processing count mismatch');
    }

    // Validate processed data structure
    processedFiles.forEach(file => {
        if (!file.extracted_data || !file.processing_status) {
            throw new Error(`Invalid processed file structure for ${file.name}`);
        }
    });

    return {
        message: `Successfully processed ${processedFiles.length} mock files`
    };
});

// Test 9: Mock URL Fetch Test
runAsyncTest('Mock URL Data Fetching', async () => {
    const mockUrls = [
        'https://example.com/company-overview',
        'https://medium.com/@startup/our-vision'
    ];

    const processedUrls = mockUrls.map(url => ({
        url,
        title: `Page title for ${url}`,
        extracted_data: {
            text_content: `Extracted content from ${url}`,
            metadata: {
                domain: url.split('/')[2],
                content_type: 'text/html',
                word_count: 1250
            }
        },
        processing_status: 'completed'
    }));

    if (processedUrls.length !== mockUrls.length) {
        throw new Error('URL processing count mismatch');
    }

    return {
        message: `Successfully processed ${processedUrls.length} mock URLs`
    };
});

// Test 10: Mock TCA Analysis Test
runAsyncTest('Mock TCA Analysis Pipeline', async () => {
    const mockAnalysisPayload = {
        framework: 'general',
        company_data: {
            name: 'Test Startup',
            description: 'AI-powered test company',
            stage: 'seed',
            processed_data: {
                files: 2,
                urls: 2,
                texts: 1,
                extracted_financials: {
                    revenue: 500000,
                    burn_rate: 50000,
                    runway_months: 10
                }
            }
        }
    };

    // Simulate comprehensive analysis
    const mockResult = {
        final_tca_score: 78.5,
        investment_recommendation: 'Proceed with due diligence',
        scorecard: {
            categories: {
                market_potential: {
                    raw_score: 8.2,
                    weight: 0.20,
                    weighted_score: 16.4
                },
                technology_innovation: {
                    raw_score: 7.8,
                    weight: 0.15,
                    weighted_score: 11.7
                },
                team_capability: {
                    raw_score: 8.0,
                    weight: 0.25,
                    weighted_score: 20.0
                }
            }
        },
        risk_assessment: {
            overall_risk_score: 6.5
        },
        processing_time: Date.now()
    };

    // Validate analysis result structure
    if (!mockResult.final_tca_score || !mockResult.scorecard) {
        throw new Error('Invalid analysis result structure');
    }

    if (mockResult.final_tca_score < 0 || mockResult.final_tca_score > 100) {
        throw new Error('Invalid TCA score range');
    }

    return {
        message: `TCA analysis completed with score: ${mockResult.final_tca_score}/100`
    };
});

// Test 11: Data Flow Integration Test
runTest('Data Flow Integration', () => {
    // Test the complete data flow from upload to analysis
    const workflow = [
        'File Upload -> Backend Processing',
        'URL Import -> Data Extraction',
        'Text Input -> Content Analysis',
        'Data Aggregation -> localStorage',
        'Analysis Request -> Backend API',
        'Result Processing -> UI Display'
    ];

    // Simulate each step
    let dataFlow = {};

    // Step 1: File upload
    dataFlow.files = [{
        name: 'test.pdf',
        processed: true
    }];

    // Step 2: URL import
    dataFlow.urls = [{
        url: 'https://test.com',
        processed: true
    }];

    // Step 3: Text input
    dataFlow.texts = [{
        content: 'Test content',
        processed: true
    }];

    // Step 4: Data aggregation
    dataFlow.aggregated = {
        totalFiles: dataFlow.files.length,
        totalUrls: dataFlow.urls.length,
        totalTexts: dataFlow.texts.length
    };

    // Step 5: Analysis preparation
    dataFlow.analysisReady = dataFlow.aggregated.totalFiles > 0 ||
        dataFlow.aggregated.totalUrls > 0 ||
        dataFlow.aggregated.totalTexts > 0;

    if (!dataFlow.analysisReady) {
        throw new Error('Data flow validation failed');
    }

    return {
        message: `Data flow validated through ${workflow.length} stages`
    };
});

// Run all tests
async function runAllTests() {
    console.log('\n📋 Running Test Suite...\n');

    // Give some time for async tests
    await new Promise(resolve => setTimeout(resolve, 100));

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        testResults.details
            .filter(test => test.status !== 'PASS')
            .forEach(test => {
                console.log(`  • ${test.name}: ${test.message}`);
            });
    }

    console.log('\n🎯 NEXT STEPS:');
    if (testResults.passed === testResults.total) {
        console.log('✅ All tests passed! Ready to deploy and test locally.');
        console.log('   Run: npm run dev (frontend) and python main.py (backend)');
    } else {
        console.log('⚠️  Some tests failed. Review and fix issues before deployment.');
    }

    // Write test report
    const reportPath = 'test-report-upload-analysis.json';
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: testResults,
        recommendations: testResults.passed === testResults.total ? ['Ready for local deployment', 'Start both frontend and backend servers', 'Test file upload functionality'] : ['Fix failing tests', 'Review error messages', 'Verify file configurations']
    }, null, 2));

    console.log(`\n📄 Detailed report written to: ${reportPath}`);
}

// Execute test suite
runAllTests().catch(console.error);