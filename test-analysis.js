/**
 * Test script for verifying the real analysis system
 * Run this in the browser console after starting the app
 */

async function testAnalysis() {
    console.log('🔍 Testing Real Analysis System...');

    // Clear any existing localStorage to start fresh
    localStorage.removeItem('analysisData');
    localStorage.removeItem('analysisTimestamp');
    console.log('✅ Cleared localStorage');

    try {
        // Test the analysis endpoint
        const testPayload = {
            framework: 'general',
            reportType: 'triage',
            companyName: 'Test Company',
            companyData: {
                name: 'Test Company',
                industry: 'Technology',
                stage: 'Series A',
                description: 'A test company for analysis verification'
            },
            documents: [],
            urls: [],
            texts: []
        };

        console.log('📤 Sending analysis request...');

        const response = await fetch('/api/analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload)
        });

        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📥 Analysis complete!');
        console.log('Result structure:', {
            hasScorecard: !!result.scorecard,
            hasBenchmark: !!result.benchmark,
            hasRisk: !!result.risk,
            tcaCategoriesCount: result.scorecard?.categories?.length || 0,
            riskFlagsCount: result.risk?.riskFlags?.length || 0,
            compositeScore: result.scorecard?.compositeScore
        });

        // Verify we have all 12 TCA categories
        if (result.scorecard?.categories?.length === 12) {
            console.log('✅ All 12 TCA categories present!');
            console.log('Categories:', result.scorecard.categories.map(c => c.category));
        } else {
            console.warn(`⚠️  Expected 12 TCA categories, got ${result.scorecard?.categories?.length || 0}`);
        }

        return result;

    } catch (error) {
        console.error('❌ Analysis test failed:', error);
        throw error;
    }
}

// Test function for checking localStorage
function checkStoredAnalysis() {
    const stored = localStorage.getItem('analysisData');
    if (stored) {
        const data = JSON.parse(stored);
        console.log('📊 Found stored analysis:', {
            timestamp: localStorage.getItem('analysisTimestamp'),
            tcaCategories: data.tcaData?.categories?.length || 0,
            riskFlags: data.riskData?.riskFlags?.length || 0,
            compositeScore: data.tcaData?.compositeScore
        });
    } else {
        console.log('📭 No stored analysis found');
    }
}

// Export functions to window for console use
window.testAnalysis = testAnalysis;
window.checkStoredAnalysis = checkStoredAnalysis;

console.log(`
🧪 Analysis Testing Tools Available:
- testAnalysis() - Run a complete analysis test
- checkStoredAnalysis() - Check what's in localStorage
`);