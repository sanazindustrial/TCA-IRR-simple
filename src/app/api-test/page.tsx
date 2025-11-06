/**
 * API Test Page
 * Test the connection between frontend and backend
 */

import ApiConnectionTest from '@/components/shared/api-connection-test';

export default function ApiTestPage() {
    return (
        <div className="container mx-auto p-8 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">TCA IRR Platform - API Connection Test</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    This page helps verify that the Next.js frontend can successfully communicate with the FastAPI backend.
                    Use this during development to ensure the API integration is working correctly.
                </p>
            </div>

            <ApiConnectionTest />

            <div className="text-center text-sm text-muted-foreground">
                <p>
                    If tests are failing, ensure both the backend (http://localhost:8000) and
                    frontend (http://localhost:3000) servers are running.
                </p>
            </div>
        </div>
    );
}