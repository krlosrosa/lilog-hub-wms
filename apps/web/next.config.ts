import type { NextConfig } from 'next';
import path from 'node:path';
import { withSentryConfig } from '@sentry/nextjs';

const isDockerBuild = process.env.DOCKER_BUILD === 'true';
const hasSentryUpload = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG,
);

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  transpilePackages: ['@lilog/ui'],
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: isDockerBuild,
  },
  typescript: {
    ignoreBuildErrors: isDockerBuild,
  },
  experimental: {
    optimizePackageImports: ['@lilog/ui', 'lucide-react'],
    // Reduz pico de RAM no webpack (Next.js 15+)
    webpackMemoryOptimizations: true,
    cpus: 1,
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
