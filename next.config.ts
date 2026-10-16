import type { NextConfig } from 'next'

// Địa chỉ BE lấy từ .env (BACKEND_URL); mặc định = profile https của BE khi chạy local
const backendUrl = process.env.BACKEND_URL ?? 'https://localhost:7000'

const nextConfig: NextConfig = {
  // FE gọi /api/* → Next proxy sang BE (tránh CORS + cookie SameSite khi dev)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
