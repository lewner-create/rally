import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@rally/db'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
}

export default config