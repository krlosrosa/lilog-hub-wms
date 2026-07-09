import type { NextConfig } from 'next';
import path from 'node:path';
import { withSentryConfig } from '@sentry/nextjs';

const hasSentryUpload = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG,
);

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
        exclude: /[\\/]features[\\/]peso-variavel[\\/]mocks[\\/]/,
        use: path.resolve(__dirname, 'mock-stub-loader.cjs'),
      });
    }

    return config;
  },
};

const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT ?? 'lilog-web',
  silent: true,
  widenClientFileUpload: false,
  disableLogger: true,
  automaticVercelMonitors: false,
  sourcemaps: {
    disable: !hasSentryUpload,
  },
};

export default hasSentryUpload
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig;
