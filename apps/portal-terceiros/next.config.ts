import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@lilog/ui'],
  experimental: {
    optimizePackageImports: ['@lilog/ui', 'lucide-react'],
  },
};

export default nextConfig;
