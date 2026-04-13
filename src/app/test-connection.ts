// Test server action connectivity
'use server';

export async function testBackendConnection() {
    try {
        console.log('Testing backend connection from server action...');

        const healthResponse = await fetch('http://127.0.0.1:8000/api/health', {
            method: 'GET',
        });

        console.log('Health response status:', healthResponse.status);

        if (healthResponse.ok) {
            const data = await healthResponse.json();
            console.log('Health response data:', data);
            return { success: true, data };
        } else {
            console.error('Health check failed with status:', healthResponse.status);
            return { success: false, error: `Status: ${healthResponse.status}` };
        }
    } catch (error) {
        console.error('Connection test failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}