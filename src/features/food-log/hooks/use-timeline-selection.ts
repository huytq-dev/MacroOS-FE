'use client'

import { useState } from 'react'

/** select = thanh chính (View, Copy, Move…); copy / move = thanh con; paste = Multi-Paste Inline (nút + mỗi giờ thành nút dán). */
export type SelectionMode = 'select' | 'copy' | 'move' | 'paste'

/**
 * Trạng thái chế độ chọn nhiều món trên timeline: chế độ hiện tại (null = đang xem bình thường) và tập id món đã chọn. Lựa chọn giữ
 * nguyên khi đổi ngày (Multi-Paste cần chuyển ngày để dán); thoát chế độ thì xoá hết.
 */
export function useTimelineSelection() {
  const [mode, setMode] = useState<SelectionMode | null>(null)
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())

  const start = (ids: readonly string[]) => {
    setSelected(new Set(ids))
    setMode('select')
  }
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  /** Chọn đủ cả nhóm; nếu cả nhóm đã được chọn thì bỏ chọn cả nhóm. */
  const toggleMany = (ids: readonly string[]) =>
    setSelected((current) => {
      const all = ids.every((id) => current.has(id))
      const next = new Set(current)
      ids.forEach((id) => (all ? next.delete(id) : next.add(id)))
      return next
    })
  const exit = () => {
    setMode(null)
    setSelected(new Set())
  }

  return { mode, setMode, selected, start, toggle, toggleMany, exit }
}
