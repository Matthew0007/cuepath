import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Vercel 배포 시 빌드 에러 확인용
  typescript: { ignoreBuildErrors: false },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
