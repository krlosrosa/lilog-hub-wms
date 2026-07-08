import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  transpilePackages: ['@lilog/ui'],
  experimental: {
    optimizePackageImports: ['@lilog/ui', 'lucide-react'],
  },
};

export default nextConfig;
