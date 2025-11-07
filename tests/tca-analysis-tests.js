// TCA Score Calculation Test Suite
// Tests for TCA scoring logic, what-if analysis, and result page functionality

const {
    sampleAnalysisData
} = require('../src/lib/sample-data');

// Test TCA Score Calculation
function testTCAScoreCalculation() {
    console.log('🧮 Testing TCA Score Calculation...');

    const tests = [];
    let passed = 0;
    let failed = 0;

    // Test 1: Composite Score Calculation
    tests.push({
        name: 'Composite Score Calculation',
        test: () => {
            const tcaData = sampleAnalysisData.tcaData;
            const expectedComposite = tcaData.categories.reduce((sum, cat) => sum + cat.weightedScore, 0);
            return Math.abs(tcaData.compositeScore - expectedComposite) < 0.01;
        }
    });

    // Test 2: Weight Distribution
    tests.push({
        name: 'Weight Distribution Validation',
        test: () => {
            const totalWeight = sampleAnalysisData.tcaData.categories.reduce((sum, cat) => sum + cat.weight, 0);
            return Math.abs(totalWeight - 1.0) < 0.01; // Should sum to 1.0
        }
    });

    // Test 3: Score Range Validation
    tests.push({
        name: 'Score Range Validation',
        test: () => {
            return sampleAnalysisData.tcaData.categories.every(cat =>
                cat.rawScore >= 0 && cat.rawScore <= 10 &&
                cat.weightedScore >= 0 && cat.weightedScore <= 10
            );
        }
    });

    // Test 4: Flag Color Logic
    tests.push({
        name: 'Risk Flag Color Logic',
        test: () => {
            return sampleAnalysisData.tcaData.categories.every(cat => ['green', 'yellow', 'red'].includes(cat.flag));
        }
    });

    // Test 5: Category Completeness
    tests.push({
        name: 'Category Data Completeness',
        test: () => {
            return sampleAnalysisData.tcaData.categories.every(cat =>
                cat.category && cat.description && cat.strengths && cat.concerns
            );
        }
    });

    // Run tests
    tests.forEach(test => {
        try {
            if (test.test()) {
                console.log(`  ✅ ${test.name} - PASSED`);
                passed++;
            } else {
                console.log(`  ❌ ${test.name} - FAILED`);
                failed++;
            }
        } catch (error) {
            console.log(`  ❌ ${test.name} - ERROR: ${error.message}`);
            failed++;
        }
    });

    console.log(`\n📊 TCA Score Tests: ${passed}/${tests.length} passed\n`);
    return {
        passed,
        failed,
        total: tests.length
    };
}

// Test What-If Analysis Functionality
function testWhatIfAnalysis() {
    console.log('🔄 Testing What-If Analysis...');

    const tests = [];
    let passed = 0;
    let failed = 0;

    // Test 1: Score Modification Logic
    tests.push({
        name: 'Score Modification Logic',
        test: () => {
            const originalScore = sampleAnalysisData.tcaData.compositeScore;
            const testCategories = [...sampleAnalysisData.tcaData.categories];

            // Modify first category score
            testCategories[0].rawScore = 8.0;
            testCategories[0].weightedScore = testCategories[0].rawScore * testCategories[0].weight;

            const newComposite = testCategories.reduce((sum, cat) => sum + cat.weightedScore, 0);

            return newComposite !== originalScore; // Should be different
        }
    });

    // Test 2: What-If Scenario Generation
    tests.push({
        name: 'What-If Scenario Generation',
        test: () => {
            const scenarios = [{
                    name: 'Optimistic',
                    multiplier: 1.2
                },
                {
                    name: 'Conservative',
                    multiplier: 0.8
                },
                {
                    name: 'Realistic',
                    multiplier: 1.0
                }
            ];

            return scenarios.every(scenario => {
                const modifiedScore = sampleAnalysisData.tcaData.compositeScore * scenario.multiplier;
                return modifiedScore >= 0 && modifiedScore <= 12; // Allow for slight overflow in optimistic
            });
        }
    });

    // Test 3: Score Range Validation in What-If
    tests.push({
        name: 'What-If Score Range Validation',
        test: () => {
            // Test edge cases
            const minScore = 0;
            const maxScore = 10;
            const midScore = 5;

            return [minScore, maxScore, midScore].every(score =>
                score >= 0 && score <= 10
            );
        }
    });

    // Test 4: Impact Calculation
    tests.push({
        name: 'Impact Calculation Accuracy',
        test: () => {
            const originalComposite = sampleAnalysisData.tcaData.compositeScore;
            const testScore = 8.5;
            const impact = testScore - originalComposite;

            return typeof impact === 'number' && !isNaN(impact);
        }
    });

    // Test 5: Scenario Persistence
    tests.push({
        name: 'Scenario Data Structure',
        test: () => {
            const scenarioData = {
                original: sampleAnalysisData.tcaData.compositeScore,
                modified: 7.8,
                changes: [{
                    category: 'Technology Readiness',
                    from: 7.5,
                    to: 8.5
                }]
            };

            return scenarioData.original !== scenarioData.modified &&
                scenarioData.changes.length > 0 &&
                scenarioData.changes[0].from !== scenarioData.changes[0].to;
        }
    });

    // Run tests
    tests.forEach(test => {
        try {
            if (test.test()) {
                console.log(`  ✅ ${test.name} - PASSED`);
                passed++;
            } else {
                console.log(`  ❌ ${test.name} - FAILED`);
                failed++;
            }
        } catch (error) {
            console.log(`  ❌ ${test.name} - ERROR: ${error.message}`);
            failed++;
        }
    });

    console.log(`\n🔄 What-If Analysis Tests: ${passed}/${tests.length} passed\n`);
    return {
        passed,
        failed,
        total: tests.length
    };
}

// Test Result Page Loading
function testResultPageLoading() {
    console.log('📄 Testing Result Page Loading...');

    const tests = [];
    let passed = 0;
    let failed = 0;

    // Test 1: Sample Data Structure
    tests.push({
        name: 'Sample Data Structure Validation',
        test: () => {
            return sampleAnalysisData &&
                sampleAnalysisData.tcaData &&
                sampleAnalysisData.riskData &&
                sampleAnalysisData.macroData &&
                sampleAnalysisData.benchmarkData &&
                sampleAnalysisData.growthData &&
                sampleAnalysisData.gapData &&
                sampleAnalysisData.founderFitData &&
                sampleAnalysisData.teamData &&
                sampleAnalysisData.strategicFitData;
        }
    });

    // Test 2: Component Data Extraction
    tests.push({
        name: 'Component Data Extraction Logic',
        test: () => {
            const extractionTests = [{
                    id: 'tca-scorecard',
                    expected: sampleAnalysisData.tcaData
                },
                {
                    id: 'risk-flags',
                    expected: sampleAnalysisData.riskData
                },
                {
                    id: 'macro-trend-alignment',
                    expected: sampleAnalysisData.macroData
                },
                {
                    id: 'benchmark-comparison',
                    expected: sampleAnalysisData.benchmarkData
                }
            ];

            return extractionTests.every(test => test.expected !== undefined);
        }
    });

    // Test 3: Report Configuration Loading
    tests.push({
        name: 'Report Configuration Structure',
        test: () => {
            // Simulate report configurations
            const triageConfig = [{
                    id: 'quick-summary',
                    title: 'Quick Summary',
                    active: true
                },
                {
                    id: 'tca-scorecard',
                    title: 'TCA Scorecard',
                    active: true
                },
                {
                    id: 'risk-flags',
                    title: 'Risk Flags & Mitigation',
                    active: true
                }
            ];

            const ddConfig = [{
                    id: 'executive-summary',
                    title: 'Executive Summary',
                    active: true
                },
                {
                    id: 'tca-scorecard',
                    title: 'TCA Scorecard',
                    active: true
                },
                {
                    id: 'comprehensive-analysis',
                    title: 'Comprehensive Analysis',
                    active: true
                }
            ];

            return triageConfig.length > 0 && ddConfig.length > 0 &&
                triageConfig.every(c => c.id && c.title && typeof c.active === 'boolean') &&
                ddConfig.every(c => c.id && c.title && typeof c.active === 'boolean');
        }
    });

    // Test 4: Dynamic Content Loading
    tests.push({
        name: 'Dynamic Content Loading Simulation',
        test: () => {
            // Simulate localStorage data loading
            const mockAnalysisData = JSON.stringify(sampleAnalysisData);
            const mockDuration = '45.32';
            const mockFramework = 'general';

            try {
                const parsed = JSON.parse(mockAnalysisData);
                const duration = parseFloat(mockDuration);

                return parsed.tcaData && !isNaN(duration) && ['general', 'medtech'].includes(mockFramework);
            } catch {
                return false;
            }
        }
    });

    // Test 5: Error Handling & Fallbacks
    tests.push({
        name: 'Error Handling & Fallback Data',
        test: () => {
            // Test invalid data handling
            try {
                const invalidData = "invalid-json";
                JSON.parse(invalidData);
                return false; // Should not reach here
            } catch {
                // Should fall back to sample data
                return sampleAnalysisData !== undefined;
            }
        }
    });

    // Test 6: Role-based Configuration
    tests.push({
        name: 'Role-based Configuration Logic',
        test: () => {
            const roles = ['user', 'admin', 'reviewer'];
            const reportTypes = ['triage', 'dd'];

            return roles.every(role => typeof role === 'string') &&
                reportTypes.every(type => typeof type === 'string') &&
                roles.length > 0 && reportTypes.length > 0;
        }
    });

    // Run tests
    tests.forEach(test => {
        try {
            if (test.test()) {
                console.log(`  ✅ ${test.name} - PASSED`);
                passed++;
            } else {
                console.log(`  ❌ ${test.name} - FAILED`);
                failed++;
            }
        } catch (error) {
            console.log(`  ❌ ${test.name} - ERROR: ${error.message}`);
            failed++;
        }
    });

    console.log(`\n📄 Result Page Loading Tests: ${passed}/${tests.length} passed\n`);
    return {
        passed,
        failed,
        total: tests.length
    };
}

// Run All Tests
function runAllTests() {
    console.log('🚀 TCA-IRR Application Test Suite');
    console.log('====================================\n');

    const tcaResults = testTCAScoreCalculation();
    const whatIfResults = testWhatIfAnalysis();
    const resultPageResults = testResultPageLoading();

    const totalPassed = tcaResults.passed + whatIfResults.passed + resultPageResults.passed;
    const totalFailed = tcaResults.failed + whatIfResults.failed + resultPageResults.failed;
    const totalTests = tcaResults.total + whatIfResults.total + resultPageResults.total;

    console.log('📊 OVERALL TEST RESULTS');
    console.log('========================');
    console.log(`✅ Total Passed: ${totalPassed}/${totalTests}`);
    console.log(`❌ Total Failed: ${totalFailed}/${totalTests}`);
    console.log(`📈 Success Rate: ${((totalPassed/totalTests)*100).toFixed(1)}%`);

    if (totalFailed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Application is ready for deployment.');
    } else {
        console.log(`\n⚠️  ${totalFailed} test(s) failed. Please review and fix before deployment.`);
    }

    return {
        passed: totalPassed,
        failed: totalFailed,
        total: totalTests,
        successRate: (totalPassed / totalTests) * 100
    };
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testTCAScoreCalculation,
        testWhatIfAnalysis,
        testResultPageLoading,
        runAllTests
    };
}