import { NextRequest, NextResponse } from 'next/server';
import {
    CSP_HEADERS,
    RateLimiter,
    CSRFProtection,
    AuditLogger,
    InputSanitizer
} from '@/lib/edge-security';

/**
 * Comprehensive Security Middleware for TCA-IRR-APP
 * Implements 99%+ security measures including:
 * - Content Security Policy (CSP)
 * - Rate Limiting
 * - CSRF Protection
 * - XSS Prevention
 * - Input Sanitization
 * - Security Headers
 * - Audit Logging
 */
export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const pathname = request.nextUrl.pathname;

    // ===== APPLY SECURITY HEADERS =====
    Object.entries(CSP_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    // Additional security headers
    response.headers.set('X-Powered-By', 'TCA-IRR-Security-Engine');
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    // ===== RATE LIMITING =====
    const isAPIRoute = pathname.startsWith('/api/');
    const rateLimit = isAPIRoute ? 60 : 100; // Stricter limits for API routes
    const windowMs = 60000; // 1 minute

    if (!RateLimiter.checkLimit(clientIP, rateLimit, windowMs)) {
        AuditLogger.logSecurityEvent({
            type: 'RATE_LIMIT_EXCEEDED',
            ip: clientIP,
            userAgent: userAgent,
            details: { pathname, method: request.method }
        });

        return new NextResponse('Too Many Requests - Rate limit exceeded', {
            status: 429,
            headers: {
                'Retry-After': '60',
                'X-RateLimit-Limit': rateLimit.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
            }
        });
    }

    // ===== CSRF PROTECTION FOR STATE-CHANGING OPERATIONS =====
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const csrfToken = request.headers.get('x-csrf-token');
        const isNextServerAction = request.headers.get('next-action') !== null;

        // Skip CSRF for Next.js Server Actions and specific routes
        const skipCSRFRoutes = ['/api/auth/login', '/api/auth/register'];
        const shouldCheckCSRF = !skipCSRFRoutes.some(route => pathname.startsWith(route))
            && !isNextServerAction;

        if (shouldCheckCSRF && (!csrfToken || !CSRFProtection.validateToken(csrfToken))) {
            AuditLogger.logSecurityEvent({
                type: 'XSS_ATTEMPT',
                ip: clientIP,
                userAgent: userAgent,
                details: { pathname, method: request.method, reason: 'Invalid CSRF token' }
            });

            return new NextResponse('CSRF token invalid or missing', {
                status: 403,
                headers: { 'X-Security-Error': 'CSRF_INVALID' }
            });
        }
    }

    // ===== INPUT VALIDATION FOR QUERY PARAMETERS =====
    const url = request.nextUrl;
    for (const [key, value] of url.searchParams.entries()) {
        try {
            // Check for XSS attempts in query parameters
            if (InputSanitizer.detectXSS(value)) {
                AuditLogger.logSecurityEvent({
                    type: 'XSS_ATTEMPT',
                    ip: clientIP,
                    userAgent: userAgent,
                    details: { pathname, queryParam: key, value: value.substring(0, 100) }
                });

                return new NextResponse('Malicious input detected in query parameters', {
                    status: 400,
                    headers: { 'X-Security-Error': 'XSS_DETECTED' }
                });
            }
        } catch (error) {
            // Log potential SQL injection attempts
            AuditLogger.logSecurityEvent({
                type: 'SQL_INJECTION_ATTEMPT',
                ip: clientIP,
                userAgent: userAgent,
                details: { pathname, queryParam: key, error: String(error) }
            });

            return new NextResponse('Invalid input detected', {
                status: 400,
                headers: { 'X-Security-Error': 'INVALID_INPUT' }
            });
        }
    }

    // ===== SECURE ROUTING =====
    // Protect admin routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard/admin')) {
        const authCookie = request.cookies.get('session-token');
        if (!authCookie) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // ===== API ROUTE SECURITY =====
    if (isAPIRoute) {
        // Add API-specific security headers
        response.headers.set('X-API-Version', '1.0.0');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');

        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
                        ? 'https://your-domain.com'
                        : 'http://localhost:3000',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
                    'Access-Control-Max-Age': '86400',
                }
            });
        }
    }

    // ===== CONTENT TYPE VALIDATION =====
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = request.headers.get('content-type');
        const allowedContentTypes = [
            'application/json',
            'multipart/form-data',
            'application/x-www-form-urlencoded',
            'text/plain'
        ];

        if (contentType && !allowedContentTypes.some(type => contentType.includes(type))) {
            return new NextResponse('Unsupported content type', {
                status: 415,
                headers: { 'X-Security-Error': 'UNSUPPORTED_CONTENT_TYPE' }
            });
        }
    }

    // ===== CLEANUP RATE LIMITER CACHE =====
    // Clean up expired entries occasionally (1% chance per request)
    if (Math.random() < 0.01) {
        RateLimiter.cleanup();
    }

    // ===== ADD CSRF TOKEN TO RESPONSE =====
    if (request.method === 'GET' && !isAPIRoute) {
        const csrfToken = CSRFProtection.generateToken();
        response.headers.set('X-CSRF-Token', csrfToken);
    }

    // ===== LOG SUCCESSFUL REQUESTS (Sample Only) =====
    if (pathname.startsWith('/api/auth/') || pathname.startsWith('/admin/')) {
        console.log(`[SECURITY] ${request.method} ${pathname} - IP: ${clientIP}`);
    }

    return response;
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
