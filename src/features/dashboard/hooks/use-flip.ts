'use client'

import { useCallback, useLayoutEffect, useRef } from 'react'

const SLIDE_MS = 380

/**
 * Hoạt ảnh đổi chỗ kiểu FLIP: sau mỗi lần `order` đổi, đo vị trí mới của từng phần tử (offsetLeft/offsetTop, không phụ thuộc
 * cuộn), đặt transform về vị trí cũ rồi cho chạy về 0 trong ~380ms với đường cong êm. Tắt khi người dùng bật "giảm chuyển động".
 * Dùng: `const item = useFlip(order, 'y')` rồi `<li ref={item(key)}>`.
 */
export function useFlip<K extends string>(order: readonly K[], axis: 'x' | 'y' = 'x') {
  const items = useRef(new Map<K, HTMLElement>())
  const positions = useRef(new Map<K, number>())
  const lastOrder = useRef(order.join('|'))

  useLayoutEffect(() => {
    // Luôn cập nhật vị trí sau mỗi lần render (nội dung đổi cao làm các phần tử khác dịch chỗ), nhưng chỉ chạy hoạt ảnh khi thứ tự đổi
    const orderKey = order.join('|')
    const reordered = orderKey !== lastOrder.current
    lastOrder.current = orderKey
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const [key, element] of items.current) {
      const position = axis === 'x' ? element.offsetLeft : element.offsetTop
      const before = positions.current.get(key)
      positions.current.set(key, position)
      if (!reordered || reduce || before === undefined || Math.abs(before - position) < 1) continue
      const move = axis === 'x' ? 'translateX' : 'translateY'
      element.style.transition = 'none'
      element.style.transform = `${move}(${before - position}px)`
      requestAnimationFrame(() => {
        element.style.transition = `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
        element.style.transform = ''
      })
    }
  })

  return useCallback(
    (key: K) => (node: HTMLElement | null) => {
      if (node) items.current.set(key, node)
      else items.current.delete(key)
    },
    []
  )
}
