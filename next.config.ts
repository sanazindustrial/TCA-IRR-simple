
import type { NextConfig } from 'next';

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self' *.google.com picsum.photos images.unsplash.com; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src * 'self' data:; font-src 'self' fonts.gstatic.com;".replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  }
];

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
  },

  // Configure for Azure App Service deployment (dynamic)
  // Remove static export configuration for dynamic deployment
  // output: 'export',  // Commented out for dynamic deployment
  // trailingSlash: true,  // Commented out for dynamic deployment
  // skipTrailingSlashRedirect: true,  // Commented out for dynamic deployment
  // distDir: 'out',  // Commented out for dynamic deployment

  // Security headers for production
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },

  // This allows requests from the Firebase Studio environment.
  allowedDevOrigins: [
    'https://*.cluster-cxy3ise3prdrmx53pigwexthgs.cloudworkstations.dev',
  ],
  serverExternalPackages: ['@opentelemetry/context-async-hooks'],

  // Build configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Image configuration for dynamic deployment
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
}; export default nextConfig;
