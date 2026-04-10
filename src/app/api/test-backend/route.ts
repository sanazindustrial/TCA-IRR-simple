// API route to test backend connectivity
import { NextRequest, NextResponse } from 'next/server';

// Use environment variable or fallback to production API
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';
const API_VERSION = '/api';

export async function GET() {
    try {
        console.log(`Testing backend connectivity: ${BACKEND_API_URL}${API_VERSION}/health`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        try {
            const response = await fetch(`${BACKEND_API_URL}${API_VERSION}/health`, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                return NextResponse.json({
                    success: true,
                    status: response.status,
                    backendUrl: BACKEND_API_URL,
                    data,
                    timestamp: new Date().toISOString()
                });
            } else {
                return NextResponse.json({
                    success: false,
                    backendUrl: BACKEND_API_URL,
                    error: `Health check failed with status ${response.status}`,
                    timestamp: new Date().toISOString()
                }, { status: response.status });
            }
        } catch (fetchError: unknown) {
            clearTimeout(timeoutId);
            const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
            const isTimeout = fetchError instanceof Error && fetchError.name === 'AbortError';

            return NextResponse.json({
                success: false,
                backendUrl: BACKEND_API_URL,
                error: isTimeout ? 'Connection timeout - backend may be unavailable' : errorMessage,
                hint: 'Backend API may be starting up or temporarily unavailable. Try again in a few moments.',
                timestamp: new Date().toISOString()
            }, { status: 503 });
        }
    } catch (error) {
        console.error('API route connection test failed:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export async function POST() {
    try {
        console.log(`Testing comprehensive analysis: ${BACKEND_API_URL}${API_VERSION}/analysis/comprehensive`);

        const payload = {
            framework: 'general',
            companyName: 'API Test Company'
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for analysis

        try {
            const response = await fetch(`${BACKEND_API_URL}${API_VERSION}/analysis/comprehensive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                return NextResponse.json({
                    success: true,
                    status: response.status,
                    backendUrl: BACKEND_API_URL,
                    responseKeys: Object.keys(data),
                    timestamp: new Date().toISOString()
                });
            } else {
                const errorText = await response.text();
                return NextResponse.json({
                    success: false,
                    backendUrl: BACKEND_API_URL,
                    error: `Analysis failed with status ${response.status}: ${errorText}`,
                    timestamp: new Date().toISOString()
                }, { status: response.status });
            }
        } catch (fetchError: unknown) {
            clearTimeout(timeoutId);
            const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
            const isTimeout = fetchError instanceof Error && fetchError.name === 'AbortError';

            return NextResponse.json({
                success: false,
                backendUrl: BACKEND_API_URL,
                error: isTimeout ? 'Analysis timeout - backend may be overloaded' : errorMessage,
                hint: 'Backend API may be starting up or processing other requests. Try again shortly.',
                timestamp: new Date().toISOString()
            }, { status: 503 });
        }
    } catch (error) {
        console.error('API route analysis test failed:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}