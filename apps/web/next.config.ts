import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@lilog/ui'],
  experimental: {
    optimizePackageImports: ['@lilog/ui', 'lucide-react'],
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.module.rules.unshift({
        test: /[\\/]features[\\/].*[\\/]mocks[\\/].*\.(ts|tsx)$/,
        use: path.resolve(__dirname, 'mock-stub-loader.cjs'),
      });
    }

    return config;
  },
};

export default nextConfig;
