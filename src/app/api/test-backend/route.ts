// API route to test backend connectivity
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    try {
        console.log('Testing backend connectivity from API route...');

        const response = await fetch('http://127.0.0.1:8000/api/health', {
            method: 'GET',
        });

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json({
                success: true,
                status: response.status,
                data
            });
        } else {
            return NextResponse.json({
                success: false,
                error: `Health check failed with status ${response.status}`
            }, { status: response.status });
        }
    } catch (error) {
        console.error('API route connection test failed:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST() {
    try {
        console.log('Testing comprehensive analysis from API route...');

        const payload = {
            framework: 'general',
            companyName: 'API Test Company'
        };

        const response = await fetch('http://127.0.0.1:8000/api/analysis/comprehensive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json({
                success: true,
                status: response.status,
                responseKeys: Object.keys(data)
            });
        } else {
            const errorText = await response.text();
            return NextResponse.json({
                success: false,
                error: `Analysis failed with status ${response.status}: ${errorText}`
            }, { status: response.status });
        }
    } catch (error) {
        console.error('API route analysis test failed:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}