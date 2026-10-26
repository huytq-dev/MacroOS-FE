'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Cuộn tới cuối danh sách thì tự tải trang kế (nút "Load more" vẫn còn làm lối dự phòng cho bàn phím / trình đọc màn hình). Gắn kết quả vào phần tử "chân danh sách" (ref callback).
 * `enabled` = còn trang và KHÔNG đang tải: mỗi lần tải xong `enabled` bật lại nên quan sát được dựng lại — chân danh sách còn trong tầm nhìn (trang ngắn) thì tải tiếp ngay,
 * không đứng lại chờ cuộn. Trình duyệt không có IntersectionObserver thì chỉ dùng nút.
 */
export function useAutoLoadMore(enabled: boolean, onLoadMore: () => void) {
  const [node, setNode] = useState<HTMLElement | null>(null)
  const loadRef = useRef(onLoadMore)
  useEffect(() => {
    loadRef.current = onLoadMore
  })

  useEffect(() => {
    if (!enabled || !node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadRef.current()
      },
      { rootMargin: '240px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, node])

  return setNode
}
