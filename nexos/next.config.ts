import type { NextConfig } from 'next';

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), fullscreen=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
];

// CSP robusta com Trusted Types para mitigar XSS
const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://api.asaas.com https://lgfttyeezviecfqbbmqk.supabase.co https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "trusted-types default nextjs#internal",
  "require-trusted-types-for 'script'",
].join('; ');

const CSP_REPORT_ONLY = CSP_POLICY.replace('require-trusted-types-for', 'require-trusted-types-for').replace("trusted-types default", "trusted-types default nextjs#internal");

// CSP estrita para assets (mais restritiva)
const STATIC_CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  images: { unoptimized: true, formats: ['image/avif', 'image/webp'] },
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: false },
  experimental: { optimizePackageImports: ['lucide-react', 'motion/react'] },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.nexoslab.online' }],
        destination: 'https://nexoslab.online/:path*',
        permanent: true,
      },
      { source: '/entrar', destination: '/portal/acesso', permanent: true },
      { source: '/login', destination: '/admin-dashboard-su/secure-entry', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...SECURITY_HEADERS,
          { key: 'Content-Security-Policy', value: CSP_POLICY },
          { key: 'Content-Security-Policy-Report-Only', value: CSP_REPORT_ONLY },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [...SECURITY_HEADERS, { key: 'Content-Security-Policy', value: STATIC_CSP }],
      },
      {
        source: '/.well-known/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ];
  },
};

export default nextConfig;
