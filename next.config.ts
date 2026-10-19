import type { NextConfig } from 'next'

// Địa chỉ BE lấy từ .env (BACKEND_URL); mặc định = profile https của BE khi chạy local
const backendUrl = process.env.BACKEND_URL ?? 'https://localhost:7000'

const nextConfig: NextConfig = {
  // Icon món ăn là file tĩnh đặt tên theo phiên bản (public/food-icons/v1): cache trình duyệt/CDN một năm, đổi bộ icon thì đổi thư mục.
  async headers() {
    return [
      {
        source: '/food-icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Danh mục icons.json cùng thư mục v1 nhưng được mở rộng thêm khoá: luôn hỏi lại (304 khi chưa đổi) để không kẹt bản cũ một năm.
      // Đặt sau luật chung để ghi đè Cache-Control.
      {
        source: '/food-icons/:version/icons.json',
        headers: [{ key: 'Cache-Control', value: 'public, no-cache' }],
      },
    ]
  },
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
