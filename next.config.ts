import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // FE gọi /api/* → Next proxy sang BE (tránh CORS + cookie SameSite khi dev)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://localhost:7248/api/:path*',
      },
    ]
  },
}

export default nextConfig
