'use client'

import { useEffect } from 'react'
import { useVisibleViewport } from '@/hooks/use-keyboard-inset'

/** Chừa chỗ cho header dính phía trên và nút chính dính đáy khi tính ô đang gõ có bị che không (px). */
const HEADER_ALLOWANCE = 72
const FOOTER_ALLOWANCE = 160

/**
 * Đặt một lần ở layout gốc. Khi bàn phím ảo mở (iOS Safari không co layout viewport mà đẩy trang lên):
 * - gắn `data-keyboard="open"` và biến `--kb-top` / `--kb-bottom` lên `<html>`: header dính (`in-data-[keyboard=open]:top-(--kb-top)`) dịch xuống đúng
 *   phần trang bị đẩy lên và thanh nút đáy dính (`in-data-[keyboard=open]:bottom-(--kb-bottom)`) nằm sát bàn phím như MacroFactor; tab bar và toolbar ẩn bằng `in-data-[keyboard=open]:hidden`;
 * - ô nhập đang focus mà nằm ngoài dialog thì cuộn trang để nó nằm giữa vùng nhìn thấy, không bị bàn phím hay thanh dính che.
 * Bàn phím đóng thì gỡ hết nên không tốn gì. Dialog/sheet tự co theo `--vv-*` riêng trong `DialogContent`.
 */
export function KeyboardViewport() {
  const box = useVisibleViewport(true)

  useEffect(() => {
    const root = document.documentElement
    if (!box) {
      delete root.dataset.keyboard
      root.style.removeProperty('--kb-top')
      root.style.removeProperty('--kb-bottom')
      return
    }
    root.dataset.keyboard = 'open'
    root.style.setProperty('--kb-top', `${box.top}px`)
    root.style.setProperty('--kb-bottom', `${box.bottom}px`)
  }, [box])

  const open = box !== null
  const height = box?.height ?? 0
  useEffect(() => {
    if (!open) return
    const reveal = () => {
      const viewport = window.visualViewport
      const field = document.activeElement
      if (!viewport || !(field instanceof HTMLElement)) return
      if (!field.matches('input, textarea, select, [contenteditable]')) return
      // Dialog/sheet tự cuộn trong khung của nó
      if (field.closest('[role="dialog"]')) return
      const rect = field.getBoundingClientRect()
      const top = viewport.offsetTop + HEADER_ALLOWANCE
      const bottom = viewport.offsetTop + viewport.height - FOOTER_ALLOWANCE
      if (rect.top >= top && rect.bottom <= bottom) return
      // Đưa ô lên phần trên của vùng nhìn thấy (không phải chính giữa) để chừa chỗ cho thanh nút dính đáy
      const delta = rect.top + rect.height / 2 - (viewport.offsetTop + viewport.height * 0.35)
      window.scrollBy({ top: delta, behavior: 'smooth' })
    }
    // Bàn phím vừa mở / đổi chiều cao (đợi bố cục ổn định một khung hình) và khi chuyển focus sang ô khác lúc bàn phím đang mở
    const frame = requestAnimationFrame(reveal)
    const onFocusIn = () => requestAnimationFrame(reveal)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [open, height])

  return null
}
