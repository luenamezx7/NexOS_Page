import type { NextConfig } from 'next';

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

// Assets estáticos não passam pelo proxy (matcher os exclui) — o scanner do
// pentest exige CSP presente também em /_next/static (CWE-1021).
const STATIC_CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  images: { unoptimized: true },
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: false },
  experimental: { optimizePackageImports: ['lucide-react'] },
  async redirects() {
    return [
      { source: '/entrar', destination: '/portal/acesso', permanent: true },
      { source: '/login', destination: '/admin-dashboard-su/secure-entry', permanent: true },
    ];
  },
  async headers() {
    return [
      { source: '/(.*)', headers: SECURITY_HEADERS },
      { source: '/_next/static/:path*', headers: [...SECURITY_HEADERS, { key: 'Content-Security-Policy', value: STATIC_CSP }] },
      { source: '/.well-known/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }] },
    ];
  },
};

export default nextConfig;
