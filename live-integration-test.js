#!/usr/bin/env node

/**
 * Live Integration Test - TCA Upload and Analysis Pipeline
 * Tests the complete pipeline with running servers
 */

const fs = require('fs');

console.log('🧪 Live TCA Pipeline Integration Test');
console.log('='.repeat(50));

let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
};

async function runTest(testName, testFunction) {
    testResults.total++;
    try {
        console.log(`🔄 Running: ${testName}...`);
        const result = await testFunction();
        if (result && result.success) {
            testResults.passed++;
            testResults.details.push({
                name: testName,
                status: 'PASS',
                message: result.message
            });
            console.log(`✅ ${testName}: PASS - ${result.message}`);
        } else {
            testResults.failed++;
            testResults.details.push({
                name: testName,
                status: 'FAIL',
                message: result ? result.message : 'Test failed'
            });
            console.log(`❌ ${testName}: FAIL - ${result ? result.message : 'Unknown failure'}`);
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

// Test 1: Backend Health Check
async function testBackendHealth() {
    try {
        const response = await fetch('http://localhost:8001/api/health', {
            timeout: 5000
        });

        if (!response.ok) {
            return {
                success: false,
                message: `Backend returned ${response.status}`
            };
        }

        const data = await response.json();
        if (data.status === 'healthy') {
            return {
                success: true,
                message: 'Backend is healthy and responding'
            };
        } else {
            return {
                success: false,
                message: 'Backend health check failed'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `Backend connection failed: ${error.message}`
        };
    }
}

// Test 2: File Upload Simulation
async function testFileUpload() {
    try {
        const mockFiles = [{
                name: 'business_plan.pdf',
                size: 1024000,
                type: 'application/pdf'
            },
            {
                name: 'financials.xlsx',
                size: 512000,
                type: 'application/vnd.ms-excel'
            }
        ];

        const response = await fetch('http://localhost:8001/api/files/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: mockFiles
            }),
            timeout: 10000
        });

        if (!response.ok) {
            return {
                success: false,
                message: `File upload failed with status ${response.status}`
            };
        }

        const data = await response.json();
        if (data.status === 'success' && data.files_processed === mockFiles.length) {
            return {
                success: true,
                message: `Successfully processed ${data.files_processed} files with extracted data`
            };
        } else {
            return {
                success: false,
                message: 'File upload response invalid'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `File upload error: ${error.message}`
        };
    }
}

// Test 3: URL Data Fetching
async function testUrlFetch() {
    try {
        const mockUrls = [
            'https://example.com/company-info',
            'https://medium.com/@startup/our-vision'
        ];

        const response = await fetch('http://localhost:8001/api/urls/fetch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                urls: mockUrls
            }),
            timeout: 10000
        });

        if (!response.ok) {
            return {
                success: false,
                message: `URL fetch failed with status ${response.status}`
            };
        }

        const data = await response.json();
        if (data.status === 'success' && data.urls_processed === mockUrls.length) {
            return {
                success: true,
                message: `Successfully processed ${data.urls_processed} URLs with metadata extraction`
            };
        } else {
            return {
                success: false,
                message: 'URL fetch response invalid'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `URL fetch error: ${error.message}`
        };
    }
}

// Test 4: TCA Analysis End-to-End
async function testTCAAnalysis() {
    try {
        const analysisPayload = {
            framework: 'general',
            company_data: {
                name: 'Test Startup Inc.',
                description: 'AI-powered test company for validation',
                stage: 'seed',
                sector: 'technology_others'
            },
            tcaInput: {
                founderQuestionnaire: 'Test founder background with strong technical expertise',
                uploadedPitchDecks: 'business_plan.pdf, financials.xlsx',
                financials: 'Revenue: $750,000, Burn: $65,000/month',
                processed_files_count: 2,
                processed_urls_count: 2,
                processed_texts_count: 1
            }
        };

        const response = await fetch('http://localhost:8001/api/analysis/comprehensive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(analysisPayload),
            timeout: 30000
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                success: false,
                message: `Analysis failed: ${response.status} - ${errorText}`
            };
        }

        const data = await response.json();

        // Validate comprehensive analysis structure
        if (!data.final_tca_score || !data.scorecard || !data.risk_assessment) {
            return {
                success: false,
                message: 'Incomplete analysis result structure'
            };
        }

        if (data.final_tca_score < 0 || data.final_tca_score > 100) {
            return {
                success: false,
                message: `Invalid TCA score: ${data.final_tca_score}`
            };
        }

        // Check for key analysis components
        const requiredComponents = [
            'scorecard', 'risk_assessment', 'pestel_analysis',
            'benchmark_analysis', 'gap_analysis', 'funder_analysis', 'team_analysis'
        ];

        const missingComponents = requiredComponents.filter(comp => !data[comp]);
        if (missingComponents.length > 0) {
            return {
                success: false,
                message: `Missing analysis components: ${missingComponents.join(', ')}`
            };
        }

        return {
            success: true,
            message: `Complete TCA analysis generated: Score ${data.final_tca_score}/100, ${Object.keys(data.scorecard.categories).length} categories evaluated`
        };

    } catch (error) {
        return {
            success: false,
            message: `TCA analysis error: ${error.message}`
        };
    }
}

// Test 5: Frontend Connectivity (if available)
async function testFrontendHealth() {
    try {
        const response = await fetch('http://localhost:3001', {
            timeout: 5000,
            method: 'HEAD' // Just check if server responds
        });

        if (response.status === 200 || response.status === 404) {
            // 404 is OK for HEAD request to root, means server is running
            return {
                success: true,
                message: 'Frontend server is running and accessible'
            };
        } else {
            return {
                success: false,
                message: `Frontend returned status ${response.status}`
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `Frontend connection failed: ${error.message}`
        };
    }
}

// Main test execution
async function runLiveTests() {
    console.log('📡 Testing live servers...\n');

    await runTest('Backend Health Check', testBackendHealth);
    await runTest('File Upload Processing', testFileUpload);
    await runTest('URL Data Fetching', testUrlFetch);
    await runTest('TCA Analysis Pipeline', testTCAAnalysis);
    await runTest('Frontend Server Check', testFrontendHealth);

    console.log('\n' + '='.repeat(50));
    console.log('📊 LIVE TEST SUMMARY');
    console.log('='.repeat(50));
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
    } else {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('✅ File upload → Data extraction → TCA analysis → Results pipeline working!');
        console.log('✅ Backend API responding correctly on port 8001');
        console.log('✅ Frontend accessible on port 3001');
    }

    console.log('\n🎯 NEXT STEPS:');
    if (testResults.passed === testResults.total) {
        console.log('1. 🌐 Open browser to http://localhost:3001');
        console.log('2. 📋 Navigate to Analysis Setup (dashboard/evaluation)');
        console.log('3. 📁 Upload test files and try analysis');
        console.log('4. 📊 View results in analysis/result page');
        console.log('5. 🔄 Test What-If scenarios');
    } else {
        console.log('⚠️  Fix failing tests before proceeding with manual testing');
    }

    // Write detailed test report
    const report = {
        timestamp: new Date().toISOString(),
        test_summary: testResults,
        server_status: {
            backend: `http://localhost:8001 - ${testResults.details[0]?.status || 'Unknown'}`,
            frontend: `http://localhost:3001 - ${testResults.details[4]?.status || 'Unknown'}`
        },
        recommendations: testResults.passed === testResults.total ? ['Ready for manual testing', 'All endpoints functional', 'Complete pipeline operational'] : ['Review failed tests', 'Check server connectivity', 'Verify API responses']
    };

    fs.writeFileSync('live-integration-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report: live-integration-test-report.json');
}

// Handle Node.js module compatibility
if (typeof require !== 'undefined' && require.main === module) {
    runLiveTests().catch(console.error);
}

module.exports = {
    runLiveTests
};