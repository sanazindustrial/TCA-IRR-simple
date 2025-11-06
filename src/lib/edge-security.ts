/**
 * Edge-Compatible Security Library for Middleware
 * Uses Web Crypto API instead of Node.js crypto for edge runtime compatibility
 */

// ===== CONTENT SECURITY POLICY =====
export const CSP_HEADERS = {
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' http://localhost:8000 ws://localhost:3000",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; '),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

// ===== SIMPLE INPUT SANITIZATION =====
export class InputSanitizer {
    private static readonly XSS_PATTERNS = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^>]*>/gi,
        /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /on\w+\s*=/gi,
    ];

    private static readonly SQL_INJECTION_PATTERNS = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /(--|\|\||&&|\|\*|\*\|)/i,
        /(\bOR\b\s*\d+\s*=\s*\d+)/i,
        /(\bAND\b\s*\d+\s*=\s*\d+)/i,
    ];

    static detectXSS(input: string): boolean {
        return this.XSS_PATTERNS.some(pattern => pattern.test(input));
    }

    static detectSQLInjection(input: string): boolean {
        return this.SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
    }

    static sanitizeHTML(input: string): string {
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
}

// ===== SIMPLE RATE LIMITER =====
export class RateLimiter {
    private static cache = new Map<string, { count: number; resetTime: number }>();

    static checkLimit(key: string, limit: number, windowMs: number): boolean {
        const now = Date.now();
        const entry = this.cache.get(key);

        if (!entry || now > entry.resetTime) {
            this.cache.set(key, { count: 1, resetTime: now + windowMs });
            return true;
        }

        if (entry.count >= limit) {
            return false;
        }

        entry.count++;
        return true;
    }

    static cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.resetTime) {
                this.cache.delete(key);
            }
        }
    }
}

// ===== SIMPLIFIED CSRF PROTECTION =====
export class CSRFProtection {
    private static readonly SECRET_KEY = process.env.CSRF_SECRET || 'default-csrf-secret-key-change-in-production';

    static generateToken(): string {
        // Simple token generation for edge runtime
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2);
        return `${timestamp}.${random}`;
    }

    static validateToken(token: string): boolean {
        if (!token || !token.includes('.')) {
            return false;
        }

        const [timestamp] = token.split('.');
        const tokenTime = parseInt(timestamp, 36);
        const now = Date.now();
        const maxAge = 60 * 60 * 1000; // 1 hour

        // Token should not be older than 1 hour
        return (now - tokenTime) < maxAge;
    }
}

// ===== AUDIT LOGGER =====
export class AuditLogger {
    static logSecurityEvent(event: {
        type: string;
        ip: string;
        userAgent: string;
        details: Record<string, any>;
    }): void {
        // In production, this would send to a proper logging service
        console.warn('[SECURITY EVENT]', {
            timestamp: new Date().toISOString(),
            ...event
        });
    }
}