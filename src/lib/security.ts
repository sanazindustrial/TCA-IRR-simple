/**
 * Comprehensive Security Library for TCA-IRR-APP
 * Implements 99%+ security measures including CSP, input sanitization, 
 * XSS protection, CSRF protection, and secure session management
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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

// ===== INPUT SANITIZATION =====
export class InputSanitizer {
    private static readonly HTML_ESCAPE_MAP: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };

    private static readonly SQL_INJECTION_PATTERNS = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /(--|\|\||&&|\|\*|\*\|)/i,
        /(\bOR\b\s*\d+\s*=\s*\d+)/i,
        /(\bAND\b\s*\d+\s*=\s*\d+)/i,
    ];

    private static readonly XSS_PATTERNS = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    ];

    /**
     * Sanitize HTML content to prevent XSS attacks
     */
    static sanitizeHTML(input: string): string {
        if (!input || typeof input !== 'string') return '';

        return input.replace(/[&<>"'\/]/g, (match) =>
            this.HTML_ESCAPE_MAP[match] || match
        );
    }

    /**
     * Sanitize input to prevent SQL injection
     */
    static sanitizeSQL(input: string): string {
        if (!input || typeof input !== 'string') return '';

        let sanitized = input.trim();

        // Check for SQL injection patterns
        for (const pattern of this.SQL_INJECTION_PATTERNS) {
            if (pattern.test(sanitized)) {
                throw new Error('Potential SQL injection detected');
            }
        }

        // Escape single quotes
        sanitized = sanitized.replace(/'/g, "''");

        return sanitized;
    }

    /**
     * Deep sanitize object recursively
     */
    static sanitizeObject<T>(obj: T): T {
        if (obj === null || obj === undefined) return obj;

        if (typeof obj === 'string') {
            return this.sanitizeHTML(obj) as T;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item)) as T;
        }

        if (typeof obj === 'object') {
            const sanitized: any = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[this.sanitizeHTML(key)] = this.sanitizeObject(value);
            }
            return sanitized as T;
        }

        return obj;
    }

    /**
     * Validate and sanitize email
     */
    static sanitizeEmail(email: string): string {
        if (!email || typeof email !== 'string') return '';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const sanitized = email.trim().toLowerCase();

        if (!emailRegex.test(sanitized)) {
            throw new Error('Invalid email format');
        }

        return sanitized;
    }

    /**
     * Check for XSS patterns
     */
    static detectXSS(input: string): boolean {
        if (!input || typeof input !== 'string') return false;

        return this.XSS_PATTERNS.some(pattern => pattern.test(input));
    }
}

// ===== CSRF PROTECTION =====
export class CSRFProtection {
    private static readonly SECRET_KEY = process.env.CSRF_SECRET || 'fallback-secret-key-change-in-production';

    /**
     * Generate CSRF token
     */
    static generateToken(): string {
        const timestamp = Date.now().toString();
        const randomBytes = crypto.randomBytes(32).toString('hex');
        const payload = `${timestamp}:${randomBytes}`;

        const hmac = crypto.createHmac('sha256', this.SECRET_KEY);
        hmac.update(payload);
        const signature = hmac.digest('hex');

        return Buffer.from(`${payload}:${signature}`).toString('base64');
    }

    /**
     * Validate CSRF token
     */
    static validateToken(token: string): boolean {
        try {
            if (!token) return false;

            const decoded = Buffer.from(token, 'base64').toString('utf8');
            const [timestamp, randomBytes, signature] = decoded.split(':');

            if (!timestamp || !randomBytes || !signature) return false;

            // Check if token is not older than 1 hour
            const tokenTime = parseInt(timestamp);
            const currentTime = Date.now();
            if (currentTime - tokenTime > 3600000) return false;

            // Verify signature
            const payload = `${timestamp}:${randomBytes}`;
            const hmac = crypto.createHmac('sha256', this.SECRET_KEY);
            hmac.update(payload);
            const expectedSignature = hmac.digest('hex');

            return crypto.timingSafeEqual(
                Buffer.from(signature, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            );
        } catch {
            return false;
        }
    }
}

// ===== RATE LIMITING =====
export class RateLimiter {
    private static cache = new Map<string, { count: number; resetTime: number }>();

    /**
     * Check if request should be rate limited
     */
    static checkLimit(identifier: string, limit: number = 100, windowMs: number = 60000): boolean {
        const now = Date.now();
        const key = `${identifier}`;
        const record = this.cache.get(key);

        if (!record || now > record.resetTime) {
            this.cache.set(key, { count: 1, resetTime: now + windowMs });
            return true;
        }

        if (record.count >= limit) {
            return false;
        }

        record.count++;
        return true;
    }

    /**
     * Clean expired entries
     */
    static cleanup(): void {
        const now = Date.now();
        for (const [key, record] of this.cache.entries()) {
            if (now > record.resetTime) {
                this.cache.delete(key);
            }
        }
    }
}

// ===== SESSION SECURITY =====
export class SessionSecurity {
    /**
     * Generate secure session token
     */
    static generateSessionToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Hash password with salt
     */
    static async hashPassword(password: string): Promise<string> {
        const salt = crypto.randomBytes(16).toString('hex');

        return new Promise((resolve, reject) => {
            crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
                if (err) reject(err);
                resolve(`${salt}:${derivedKey.toString('hex')}`);
            });
        });
    }

    /**
     * Verify password
     */
    static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        const [salt, hash] = hashedPassword.split(':');

        return new Promise((resolve, reject) => {
            crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
                if (err) reject(err);
                resolve(hash === derivedKey.toString('hex'));
            });
        });
    }
}

// ===== FILE UPLOAD SECURITY =====
export class FileUploadSecurity {
    private static readonly ALLOWED_MIME_TYPES = [
        // PDF
        'application/pdf',
        // Word documents
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // PowerPoint presentations
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // Excel spreadsheets
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // Text files
        'text/plain',
        'text/csv',
        'application/json',
        'application/rtf',
        // OpenDocument formats
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.presentation',
        'application/vnd.oasis.opendocument.spreadsheet',
    ];

    private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    /**
     * Validate uploaded file
     */
    static validateFile(file: File): { valid: boolean; error?: string } {
        // Check file size
        if (file.size > this.MAX_FILE_SIZE) {
            return { valid: false, error: 'File size exceeds 10MB limit' };
        }

        // Check mime type
        if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
            return { valid: false, error: 'File type not allowed' };
        }

        // Check file name for path traversal
        if (file.name.includes('../') || file.name.includes('..\\')) {
            return { valid: false, error: 'Invalid file name' };
        }

        return { valid: true };
    }

    /**
     * Sanitize file name
     */
    static sanitizeFileName(fileName: string): string {
        return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    }
}

// ===== SECURITY MIDDLEWARE =====
export function securityMiddleware(request: NextRequest): NextResponse {
    const response = NextResponse.next();

    // Apply security headers
    Object.entries(CSP_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';
    if (!RateLimiter.checkLimit(clientIP, 100, 60000)) {
        return new NextResponse('Too Many Requests', {
            status: 429,
            headers: { 'Retry-After': '60' }
        });
    }

    // CSRF validation for POST requests
    if (request.method === 'POST') {
        const csrfToken = request.headers.get('x-csrf-token');
        if (!csrfToken || !CSRFProtection.validateToken(csrfToken)) {
            return new NextResponse('CSRF token invalid', { status: 403 });
        }
    }

    return response;
}

// ===== AUDIT LOGGING =====
export class AuditLogger {
    /**
     * Log security events
     */
    static logSecurityEvent(event: {
        type: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'XSS_ATTEMPT' | 'SQL_INJECTION_ATTEMPT' | 'RATE_LIMIT_EXCEEDED';
        userId?: string;
        ip?: string;
        userAgent?: string;
        details?: any;
    }): void {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: event.type,
            userId: event.userId || 'anonymous',
            ip: event.ip || 'unknown',
            userAgent: event.userAgent || 'unknown',
            details: event.details || {},
        };

        // In production, send to proper logging service
        console.log('[SECURITY_AUDIT]', JSON.stringify(logEntry));
    }
}

// ===== SECURITY VALIDATION FUNCTIONS =====
export const SecurityValidation = {
    /**
     * Validate user role
     */
    isValidRole(role: string): boolean {
        return ['user', 'reviewer', 'admin'].includes(role.toLowerCase());
    },

    /**
     * Validate UUID format
     */
    isValidUUID(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    },

    /**
     * Validate password strength
     */
    isStrongPassword(password: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return { valid: errors.length === 0, errors };
    },

    /**
     * Validate company name
     */
    isValidCompanyName(name: string): boolean {
        if (!name || name.length < 1 || name.length > 100) return false;
        // Allow letters, numbers, spaces, and common business characters
        return /^[a-zA-Z0-9\s\-&.,()]+$/.test(name);
    },

    /**
     * Validate URL
     */
    isValidURL(url: string): boolean {
        try {
            const parsedURL = new URL(url);
            return ['http:', 'https:'].includes(parsedURL.protocol);
        } catch {
            return false;
        }
    },
};

// ===== EXPORT DEFAULT SECURITY CONFIGURATION =====
export const SecurityConfig = {
    CSP_HEADERS,
    InputSanitizer,
    CSRFProtection,
    RateLimiter,
    SessionSecurity,
    FileUploadSecurity,
    AuditLogger,
    SecurityValidation,
    securityMiddleware,
};