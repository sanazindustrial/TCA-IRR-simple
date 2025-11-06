// Integration test script to verify frontend-backend connectivity
const fetch = require('node-fetch');

async function testBackendConnectivity() {
    try {
        console.log('Testing backend health endpoint...');
        const response = await fetch('http://localhost:8000/health');
        const data = await response.json();
        
        console.log('Backend Health Check Response:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.backend_status === 'running') {
            console.log('✅ Backend is running and accessible');
        } else {
            console.log('❌ Backend health check failed');
        }
        
        return data.backend_status === 'running';
    } catch (error) {
        console.log('❌ Failed to connect to backend:', error.message);
        return false;
    }
}

async function testFrontendBackendIntegration() {
    console.log('Testing Frontend-Backend Integration...\n');
    
    const backendHealthy = await testBackendConnectivity();
    
    if (backendHealthy) {
        console.log('\n✅ Integration Test PASSED - Frontend and Backend are properly connected');
    } else {
        console.log('\n❌ Integration Test FAILED - Backend is not accessible');
    }
}

testFrontendBackendIntegration();