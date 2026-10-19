import type { MetadataRoute } from 'next'

/**
 * Web app manifest: cho phép "Thêm vào Màn hình chính" và chạy toàn màn hình (standalone) trên iPhone/Android,
 * không còn thanh công cụ của trình duyệt. Next phục vụ tại `/manifest.webmanifest` và tự gắn `<link rel="manifest">`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MacroOS',
    short_name: 'MacroOS',
    description: 'Track your daily calories and macros',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#141414',
    theme_color: '#141414',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
