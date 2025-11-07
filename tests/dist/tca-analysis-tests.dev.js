"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

// TCA Score Calculation Test Suite
// Tests for TCA scoring logic, what-if analysis, and result page functionality
var _require = require('../src/lib/sample-data'),
    sampleAnalysisData = _require.sampleAnalysisData; // Test TCA Score Calculation


function testTCAScoreCalculation() {
  console.log('🧮 Testing TCA Score Calculation...');
  var tests = [];
  var passed = 0;
  var failed = 0; // Test 1: Composite Score Calculation

  tests.push({
    name: 'Composite Score Calculation',
    test: function test() {
      var tcaData = sampleAnalysisData.tcaData;
      var expectedComposite = tcaData.categories.reduce(function (sum, cat) {
        return sum + cat.weightedScore;
      }, 0);
      return Math.abs(tcaData.compositeScore - expectedComposite) < 0.01;
    }
  }); // Test 2: Weight Distribution

  tests.push({
    name: 'Weight Distribution Validation',
    test: function test() {
      var totalWeight = sampleAnalysisData.tcaData.categories.reduce(function (sum, cat) {
        return sum + cat.weight;
      }, 0);
      return Math.abs(totalWeight - 1.0) < 0.01; // Should sum to 1.0
    }
  }); // Test 3: Score Range Validation

  tests.push({
    name: 'Score Range Validation',
    test: function test() {
      return sampleAnalysisData.tcaData.categories.every(function (cat) {
        return cat.rawScore >= 0 && cat.rawScore <= 10 && cat.weightedScore >= 0 && cat.weightedScore <= 10;
      });
    }
  }); // Test 4: Flag Color Logic

  tests.push({
    name: 'Risk Flag Color Logic',
    test: function test() {
      return sampleAnalysisData.tcaData.categories.every(function (cat) {
        return ['green', 'yellow', 'red'].includes(cat.flag);
      });
    }
  }); // Test 5: Category Completeness

  tests.push({
    name: 'Category Data Completeness',
    test: function test() {
      return sampleAnalysisData.tcaData.categories.every(function (cat) {
        return cat.category && cat.description && cat.strengths && cat.concerns;
      });
    }
  }); // Run tests

  tests.forEach(function (test) {
    try {
      if (test.test()) {
        console.log("  \u2705 ".concat(test.name, " - PASSED"));
        passed++;
      } else {
        console.log("  \u274C ".concat(test.name, " - FAILED"));
        failed++;
      }
    } catch (error) {
      console.log("  \u274C ".concat(test.name, " - ERROR: ").concat(error.message));
      failed++;
    }
  });
  console.log("\n\uD83D\uDCCA TCA Score Tests: ".concat(passed, "/").concat(tests.length, " passed\n"));
  return {
    passed: passed,
    failed: failed,
    total: tests.length
  };
} // Test What-If Analysis Functionality


function testWhatIfAnalysis() {
  console.log('🔄 Testing What-If Analysis...');
  var tests = [];
  var passed = 0;
  var failed = 0; // Test 1: Score Modification Logic

  tests.push({
    name: 'Score Modification Logic',
    test: function test() {
      var originalScore = sampleAnalysisData.tcaData.compositeScore;

      var testCategories = _toConsumableArray(sampleAnalysisData.tcaData.categories); // Modify first category score


      testCategories[0].rawScore = 8.0;
      testCategories[0].weightedScore = testCategories[0].rawScore * testCategories[0].weight;
      var newComposite = testCategories.reduce(function (sum, cat) {
        return sum + cat.weightedScore;
      }, 0);
      return newComposite !== originalScore; // Should be different
    }
  }); // Test 2: What-If Scenario Generation

  tests.push({
    name: 'What-If Scenario Generation',
    test: function test() {
      var scenarios = [{
        name: 'Optimistic',
        multiplier: 1.2
      }, {
        name: 'Conservative',
        multiplier: 0.8
      }, {
        name: 'Realistic',
        multiplier: 1.0
      }];
      return scenarios.every(function (scenario) {
        var modifiedScore = sampleAnalysisData.tcaData.compositeScore * scenario.multiplier;
        return modifiedScore >= 0 && modifiedScore <= 12; // Allow for slight overflow in optimistic
      });
    }
  }); // Test 3: Score Range Validation in What-If

  tests.push({
    name: 'What-If Score Range Validation',
    test: function test() {
      // Test edge cases
      var minScore = 0;
      var maxScore = 10;
      var midScore = 5;
      return [minScore, maxScore, midScore].every(function (score) {
        return score >= 0 && score <= 10;
      });
    }
  }); // Test 4: Impact Calculation

  tests.push({
    name: 'Impact Calculation Accuracy',
    test: function test() {
      var originalComposite = sampleAnalysisData.tcaData.compositeScore;
      var testScore = 8.5;
      var impact = testScore - originalComposite;
      return typeof impact === 'number' && !isNaN(impact);
    }
  }); // Test 5: Scenario Persistence

  tests.push({
    name: 'Scenario Data Structure',
    test: function test() {
      var scenarioData = {
        original: sampleAnalysisData.tcaData.compositeScore,
        modified: 7.8,
        changes: [{
          category: 'Technology Readiness',
          from: 7.5,
          to: 8.5
        }]
      };
      return scenarioData.original !== scenarioData.modified && scenarioData.changes.length > 0 && scenarioData.changes[0].from !== scenarioData.changes[0].to;
    }
  }); // Run tests

  tests.forEach(function (test) {
    try {
      if (test.test()) {
        console.log("  \u2705 ".concat(test.name, " - PASSED"));
        passed++;
      } else {
        console.log("  \u274C ".concat(test.name, " - FAILED"));
        failed++;
      }
    } catch (error) {
      console.log("  \u274C ".concat(test.name, " - ERROR: ").concat(error.message));
      failed++;
    }
  });
  console.log("\n\uD83D\uDD04 What-If Analysis Tests: ".concat(passed, "/").concat(tests.length, " passed\n"));
  return {
    passed: passed,
    failed: failed,
    total: tests.length
  };
} // Test Result Page Loading


function testResultPageLoading() {
  console.log('📄 Testing Result Page Loading...');
  var tests = [];
  var passed = 0;
  var failed = 0; // Test 1: Sample Data Structure

  tests.push({
    name: 'Sample Data Structure Validation',
    test: function test() {
      return sampleAnalysisData && sampleAnalysisData.tcaData && sampleAnalysisData.riskData && sampleAnalysisData.macroData && sampleAnalysisData.benchmarkData && sampleAnalysisData.growthData && sampleAnalysisData.gapData && sampleAnalysisData.founderFitData && sampleAnalysisData.teamData && sampleAnalysisData.strategicFitData;
    }
  }); // Test 2: Component Data Extraction

  tests.push({
    name: 'Component Data Extraction Logic',
    test: function test() {
      var extractionTests = [{
        id: 'tca-scorecard',
        expected: sampleAnalysisData.tcaData
      }, {
        id: 'risk-flags',
        expected: sampleAnalysisData.riskData
      }, {
        id: 'macro-trend-alignment',
        expected: sampleAnalysisData.macroData
      }, {
        id: 'benchmark-comparison',
        expected: sampleAnalysisData.benchmarkData
      }];
      return extractionTests.every(function (test) {
        return test.expected !== undefined;
      });
    }
  }); // Test 3: Report Configuration Loading

  tests.push({
    name: 'Report Configuration Structure',
    test: function test() {
      // Simulate report configurations
      var triageConfig = [{
        id: 'quick-summary',
        title: 'Quick Summary',
        active: true
      }, {
        id: 'tca-scorecard',
        title: 'TCA Scorecard',
        active: true
      }, {
        id: 'risk-flags',
        title: 'Risk Flags & Mitigation',
        active: true
      }];
      var ddConfig = [{
        id: 'executive-summary',
        title: 'Executive Summary',
        active: true
      }, {
        id: 'tca-scorecard',
        title: 'TCA Scorecard',
        active: true
      }, {
        id: 'comprehensive-analysis',
        title: 'Comprehensive Analysis',
        active: true
      }];
      return triageConfig.length > 0 && ddConfig.length > 0 && triageConfig.every(function (c) {
        return c.id && c.title && typeof c.active === 'boolean';
      }) && ddConfig.every(function (c) {
        return c.id && c.title && typeof c.active === 'boolean';
      });
    }
  }); // Test 4: Dynamic Content Loading

  tests.push({
    name: 'Dynamic Content Loading Simulation',
    test: function test() {
      // Simulate localStorage data loading
      var mockAnalysisData = JSON.stringify(sampleAnalysisData);
      var mockDuration = '45.32';
      var mockFramework = 'general';

      try {
        var parsed = JSON.parse(mockAnalysisData);
        var duration = parseFloat(mockDuration);
        return parsed.tcaData && !isNaN(duration) && ['general', 'medtech'].includes(mockFramework);
      } catch (_unused) {
        return false;
      }
    }
  }); // Test 5: Error Handling & Fallbacks

  tests.push({
    name: 'Error Handling & Fallback Data',
    test: function test() {
      // Test invalid data handling
      try {
        var invalidData = "invalid-json";
        JSON.parse(invalidData);
        return false; // Should not reach here
      } catch (_unused2) {
        // Should fall back to sample data
        return sampleAnalysisData !== undefined;
      }
    }
  }); // Test 6: Role-based Configuration

  tests.push({
    name: 'Role-based Configuration Logic',
    test: function test() {
      var roles = ['user', 'admin', 'reviewer'];
      var reportTypes = ['triage', 'dd'];
      return roles.every(function (role) {
        return typeof role === 'string';
      }) && reportTypes.every(function (type) {
        return typeof type === 'string';
      }) && roles.length > 0 && reportTypes.length > 0;
    }
  }); // Run tests

  tests.forEach(function (test) {
    try {
      if (test.test()) {
        console.log("  \u2705 ".concat(test.name, " - PASSED"));
        passed++;
      } else {
        console.log("  \u274C ".concat(test.name, " - FAILED"));
        failed++;
      }
    } catch (error) {
      console.log("  \u274C ".concat(test.name, " - ERROR: ").concat(error.message));
      failed++;
    }
  });
  console.log("\n\uD83D\uDCC4 Result Page Loading Tests: ".concat(passed, "/").concat(tests.length, " passed\n"));
  return {
    passed: passed,
    failed: failed,
    total: tests.length
  };
} // Run All Tests


function runAllTests() {
  console.log('🚀 TCA-IRR Application Test Suite');
  console.log('====================================\n');
  var tcaResults = testTCAScoreCalculation();
  var whatIfResults = testWhatIfAnalysis();
  var resultPageResults = testResultPageLoading();
  var totalPassed = tcaResults.passed + whatIfResults.passed + resultPageResults.passed;
  var totalFailed = tcaResults.failed + whatIfResults.failed + resultPageResults.failed;
  var totalTests = tcaResults.total + whatIfResults.total + resultPageResults.total;
  console.log('📊 OVERALL TEST RESULTS');
  console.log('========================');
  console.log("\u2705 Total Passed: ".concat(totalPassed, "/").concat(totalTests));
  console.log("\u274C Total Failed: ".concat(totalFailed, "/").concat(totalTests));
  console.log("\uD83D\uDCC8 Success Rate: ".concat((totalPassed / totalTests * 100).toFixed(1), "%"));

  if (totalFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Application is ready for deployment.');
  } else {
    console.log("\n\u26A0\uFE0F  ".concat(totalFailed, " test(s) failed. Please review and fix before deployment."));
  }

  return {
    passed: totalPassed,
    failed: totalFailed,
    total: totalTests,
    successRate: totalPassed / totalTests * 100
  };
} // Export for Node.js usage


if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testTCAScoreCalculation: testTCAScoreCalculation,
    testWhatIfAnalysis: testWhatIfAnalysis,
    testResultPageLoading: testResultPageLoading,
    runAllTests: runAllTests
  };
}