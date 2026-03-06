// Script to clear any stored analysis data that might be causing issues
// This will ensure the application shows all 12 TCA categories

console.log('Clearing stored analysis data...');

// Clear localStorage
if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('analysisResult');
    localStorage.removeItem('analysisData');
    localStorage.removeItem('tcaData');
    localStorage.removeItem('reportData');

    // Clear any other analysis-related data
    Object.keys(localStorage).forEach(key => {
        if (key.includes('analysis') || key.includes('tca') || key.includes('scorecard')) {
            localStorage.removeItem(key);
            console.log('Removed:', key);
        }
    });
}

// Clear sessionStorage
if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('analysisResult');
    sessionStorage.removeItem('analysisData');
    sessionStorage.removeItem('tcaData');
    sessionStorage.removeItem('reportData');

    // Clear any other analysis-related data
    Object.keys(sessionStorage).forEach(key => {
        if (key.includes('analysis') || key.includes('tca') || key.includes('scorecard')) {
            sessionStorage.removeItem(key);
            console.log('Removed from session:', key);
        }
    });
}

console.log('Analysis data cleared! Please refresh the page.');
console.log('You should now see all 12 TCA categories.');

// Show instructions
console.log('\nTo run this script:');
console.log('1. Open your browser developer tools (F12)');
console.log('2. Go to Console tab');
console.log('3. Copy and paste this script');
console.log('4. Press Enter');
console.log('5. Refresh the page');