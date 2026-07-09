import type { NextConfig } from 'next';
import path from 'node:path';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
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

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT ?? 'lilog-web',
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
