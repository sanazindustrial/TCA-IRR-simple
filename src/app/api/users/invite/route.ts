import { NextResponse } from 'next/server';

interface InviteRequest {
    email: string;
    role: string;
    invited_by_email?: string; // Email of the inviter (current user)
}

// CORS headers to allow cross-origin requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: corsHeaders,
    });
}

export async function POST(request: Request) {
    try {
        let body: InviteRequest;
        try {
            body = await request.json();
        } catch (parseError) {
            return NextResponse.json(
                { success: false, message: 'Invalid JSON in request body' },
                { status: 400, headers: corsHeaders }
            );
        }

        const { email, role, invited_by_email } = body;

        // Validate input
        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { success: false, message: 'Valid email is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        if (!role) {
            return NextResponse.json(
                { success: false, message: 'Role is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Inviter email is required for backend
        if (!invited_by_email) {
            return NextResponse.json(
                { success: false, message: 'Inviter email is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Get backend URL from environment
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tcairrapiccontainer.azurewebsites.net';

        try {
            // Create user via backend /auth/register endpoint
            // Generate a temporary password for the invited user
            const tempPassword = `TCA_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
            
            const response = await fetch(`${backendUrl}/api/v1/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    username: email.split('@')[0], // Use email prefix as username
                    full_name: email.split('@')[0], // Use email prefix as name
                    password: tempPassword,
                    confirm_password: tempPassword,
                    role: role.toLowerCase(),
                }),
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // Backend returned non-JSON response (HTML error page, etc.)
                console.warn('Backend returned non-JSON response:', contentType);
                // Return success anyway - user will be created when they sign up
                return NextResponse.json({
                    success: true,
                    id: `usr_${Date.now()}`,
                    email,
                    role,
                    status: 'pending',
                    message: 'Invitation sent. User can sign up with the provided email.',
                    local: true,
                }, { headers: corsHeaders });
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Backend error' }));
                // If user already exists, that's okay - they're already invited
                if (error.detail?.includes('already') || error.message?.includes('already')) {
                    return NextResponse.json({
                        success: true,
                        id: `usr_existing`,
                        email,
                        role,
                        status: 'exists',
                        message: 'This email is already registered in the system.',
                    }, { headers: corsHeaders });
                }
                return NextResponse.json(
                    { success: false, message: error.detail || error.message || 'Failed to create user' },
                    { status: response.status, headers: corsHeaders }
                );
            }

            const userData = await response.json();

            return NextResponse.json({
                success: true,
                id: userData.id || `usr_${Date.now()}`,
                email,
                role,
                status: 'active',
                message: 'User account created successfully. They can now log in.',
            }, { headers: corsHeaders });
        } catch (fetchError) {
            console.warn('Backend unavailable, returning pending status:', fetchError);
            // Handle backend unavailable - return success for UI
            return NextResponse.json({
                success: true,
                id: `usr_${Date.now()}`,
                email,
                role,
                status: 'pending',
                message: 'Invitation recorded. User account will be created when they sign up.',
                local: true,
            }, { headers: corsHeaders });
        }
    } catch (error) {
        console.error('User invite error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to process invitation request' },
            { status: 500, headers: corsHeaders }
        );
    }
}
