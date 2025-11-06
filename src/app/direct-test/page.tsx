/**
 * Direct API Test - Bypassing API Client
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DirectApiTest() {
    const [result, setResult] = React.useState<string>('');
    const [loading, setLoading] = React.useState(false);

    const testDirectFetch = async () => {
        setLoading(true);
        
        const logMessages: string[] = [];
        const log = (message: string) => {
            logMessages.push(`[${new Date().toLocaleTimeString()}] ${message}`);
            setResult(logMessages.join('\n'));
        };

        log('Starting API test...');
        log('Frontend URL: ' + (typeof window !== 'undefined' ? window.location.origin : 'SSR'));
        log('Target API URL: http://localhost:8000/api/');
        log('Environment NEXT_PUBLIC_API_URL: ' + (process.env.NEXT_PUBLIC_API_URL || 'Not set'));

        try {
            log('Making fetch request...');
            
            const response = await fetch('http://localhost:8000/api/', {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            log(`Response received: ${response.status} ${response.statusText}`);
            log(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);

            if (!response.ok) {
                const errorText = await response.text();
                log(`Error response body: ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            log(`Success! Response data: ${JSON.stringify(data, null, 2)}`);
        } catch (error) {
            log(`Error caught: ${error instanceof Error ? error.message : 'Unknown error'}`);
            log(`Error type: ${error?.constructor?.name || 'Unknown'}`);
            log(`Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Direct API Test</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={testDirectFetch} disabled={loading}>
                        {loading ? 'Testing...' : 'Test Direct Fetch'}
                    </Button>

                    {result && (
                        <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">
                            {result}
                        </pre>
                    )}

                    <div className="text-xs text-muted-foreground">
                        <p>This test bypasses the API client and makes a direct fetch request to the backend.</p>
                        <p>Backend URL: http://localhost:8000/api/</p>
                        <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}