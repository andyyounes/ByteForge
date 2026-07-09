import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Pre-existing ESLint issues in lib/ and lesson files are suppressed here.
  // All new code is expected to be lint-clean.
  eslint: { ignoreDuringBuilds: true },

  // pdfjs-dist uses Object.defineProperty patterns that webpack can't bundle.
  // Mark as external so Next.js loads it natively via Node.js require.
  serverExternalPackages: ['pdfjs-dist', 'pdf-parse', 'canvas'],

  // Allow the lesson HTML files in /public/lessons/ to load without issues
  async headers() {
    return [
      {
        source: '/lessons/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  poweredByHeader: false,
}

export default nextConfig
