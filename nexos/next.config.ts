import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'export' desabilitado para permitir API routes (/api/contact) no Vercel
  // para GitHub Pages, rode com NEXT_EXPORT=1 (ver package.json deploy)
  ...(process.env.NEXT_EXPORT === '1' ? { output: 'export' as const, trailingSlash: true } : {}),
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;