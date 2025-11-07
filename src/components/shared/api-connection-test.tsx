/**
 * API Connection Test Component
 * This component tests the connection between frontend and backend
 */

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { checkApiHealth, api } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ApiTestResult {
    endpoint: string;
    status: 'success' | 'error' | 'loading';
    response?: any;
    error?: string;
    timestamp: string;
}

export function ApiConnectionTest() {
    const [results, setResults] = React.useState<ApiTestResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    const testEndpoints = [
        { name: 'API Root', path: '/api/', description: 'Basic API connectivity' },
        { name: 'API Docs', path: '/docs', description: 'API documentation' },
        // Add authenticated endpoints here when testing with auth
    ];

    const runTest = async (endpoint: { name: string; path: string; description: string }) => {
        const testResult: ApiTestResult = {
            endpoint: `${endpoint.name} (${endpoint.path})`,
            status: 'loading',
            timestamp: new Date().toLocaleTimeString()
        };

        setResults((prev: ApiTestResult[]) => [...prev.filter(r => !r.endpoint.includes(endpoint.name)), testResult]);
        setResults((prev: ApiTestResult[]) => [...prev.filter((r: ApiTestResult) => !r.endpoint.includes(endpoint.name)), testResult]);
        try {
            const response = await api.get(endpoint.path);

            setResults((prev: ApiTestResult[]) => prev.map((r: ApiTestResult) =>
                r.endpoint.includes(endpoint.name)
                    ? { ...r, status: 'success' as const, response: response.data }
                    : r
            ));
        } catch (error) {
            setResults((prev: ApiTestResult[]) => prev.map((r: ApiTestResult) =>
                r.endpoint.includes(endpoint.name)
                    ? {
                        ...r,
                        status: 'error' as const,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                    : r
            ));
        }
    };

    const runAllTests = async () => {
        setIsLoading(true);
        setResults([]);

        for (const endpoint of testEndpoints) {
            await runTest(endpoint);
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        setIsLoading(false);
    };

    const getStatusIcon = (status: ApiTestResult['status']) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'loading':
                return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: ApiTestResult['status']) => {
        switch (status) {
            case 'success':
                return <Badge variant="default" className="bg-green-500">Success</Badge>;
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
            case 'loading':
                return <Badge variant="secondary">Testing...</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Backend API Connection Test
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Test the connection between the Next.js frontend and FastAPI backend.
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Button
                        onClick={runAllTests}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Testing...
                            </>
                        ) : (
                            'Run Connection Tests'
                        )}
                    </Button>
                </div>

                {results.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Test Results</h3>
                        {results.map((result: ApiTestResult, index: number) => (
                            <div key={index} className="border rounded-lg p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(result.status)}
                                        <span className="font-medium">{result.endpoint}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(result.status)}
                                        <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                                    </div>
                                </div>

                                {result.error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{result.error}</AlertDescription>
                                    </Alert>
                                )}

                                {result.response && (
                                    <div className="bg-muted rounded p-3">
                                        <p className="text-xs font-mono text-muted-foreground mb-1">Response:</p>
                                        <pre className="text-xs overflow-auto max-h-40">
                                            {JSON.stringify(result.response, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Expected Results:</strong>
                        <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                            <li><strong>API Root:</strong> Should return API information and available endpoints</li>
                            <li><strong>API Docs:</strong> Should return HTML documentation page</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Backend URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</p>
                    <p><strong>Frontend URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}</p>
                    <p><strong>Environment Variables:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</li>
                        <li>NODE_ENV: {process.env.NODE_ENV}</li>
                    </ul>
                </div>

                <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Manual Test</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                        You can also test the API manually by opening the browser console and running:
                    </p>
                    <code className="block bg-muted p-2 text-xs rounded">
                        {`fetch('http://localhost:8000/api/').then(r => r.json()).then(console.log).catch(console.error)`}
                    </code>
                </div>
            </CardContent>
        </Card>
    );
}

export default ApiConnectionTest;