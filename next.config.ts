
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Production configuration for Azure App Service
  output: 'standalone',  // Required for Azure App Service deployment

  // SECURITY: Disable source maps in production to hide source code
  productionBrowserSourceMaps: false,

  // Build configuration for production
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  serverExternalPackages: ['@opentelemetry/context-async-hooks'],

  // Webpack optimization for code protection
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      // Disable source maps completely
      config.devtool = false;

      // Minimize and obfuscate code
      if (config.optimization) {
        config.optimization.minimize = true;
        config.optimization.moduleIds = 'deterministic';
        config.optimization.chunkIds = 'deterministic';
      }
    }
    return config;
  },

  // Comprehensive security headers for production
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // XSS Protection
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer Policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions Policy - restrict browser features
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Prevent caching of sensitive data
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          // Content Security Policy - allow external API connections
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https: wss: http://localhost:* https://api.stlouisfed.org https://hacker-news.firebaseio.com https://newsapi.org https://*.azurewebsites.net https://*.azure.com; frame-ancestors 'self'; worker-src 'self' blob:;"
          },
        ],
      },
      // Block source map requests
      {
        source: '/:path*.map',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },

  // Image optimization
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

  // Redirects for case-insensitive module URLs (Azure Linux is case-sensitive)
  async redirects() {
    return [
      { source: '/analysis/modules/Analyst', destination: '/analysis/modules/analyst', permanent: true },
      { source: '/analysis/modules/Benchmark', destination: '/analysis/modules/benchmark', permanent: true },
      { source: '/analysis/modules/Risk', destination: '/analysis/modules/risk', permanent: true },
      { source: '/analysis/modules/Tca', destination: '/analysis/modules/tca', permanent: true },
      { source: '/analysis/modules/Macro', destination: '/analysis/modules/macro', permanent: true },
      { source: '/analysis/modules/Gap', destination: '/analysis/modules/gap', permanent: true },
      { source: '/analysis/modules/Growth', destination: '/analysis/modules/growth', permanent: true },
      { source: '/analysis/modules/Team', destination: '/analysis/modules/team', permanent: true },
    ];
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;