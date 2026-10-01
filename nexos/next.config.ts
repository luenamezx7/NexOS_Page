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
          // A CSP das páginas é gerada com nonce em src/proxy.ts.
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
      {
        // Fontes e assets de marca não mudam sem troca de nome: cache longo imutável.
        source: '/:path*\\.(svg|png|jpe?g|webp|avif|otf|ttf|woff2?)$',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
