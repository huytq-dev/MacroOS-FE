'use client'

import { useState } from 'react'

interface SheetState<T> {
  readonly value: T | undefined
  readonly open: boolean
  /** Đổi mỗi lần mở để bảng mount mới (state nội bộ như ô nhập luôn bắt đầu lại). */
  readonly id: number
}

/**
 * Bộ đếm chung cho mọi bảng: nhiều bảng của một trang nằm cạnh nhau với `key={sheet.id}` (đóng rồi vẫn mount), nên id phải
 * duy nhất giữa các bảng, không chỉ trong một bảng — bộ đếm riêng từng hook khiến hai bảng cùng key `1`.
 */
let nextSheetId = 0

/**
 * Trạng thái cho bảng trượt từ đáy có hoạt ảnh đóng. Gỡ bảng khỏi cây ngay khi đóng (`{open && <Sheet/>}`) làm hiệu ứng trượt
 * xuống không kịp chạy, nên bảng phải còn mount sau khi đóng: `value` giữ nguyên cho tới lần mở sau, chỉ `open` về false.
 * Dùng: `{sheet.value !== undefined && <Sheet key={sheet.id} open={sheet.open} onOpenChange={sheet.onOpenChange} … />}`.
 */
export function useSheet<T>() {
  const [state, setState] = useState<SheetState<T>>({ value: undefined, open: false, id: 0 })
  return {
    value: state.value,
    open: state.open,
    id: state.id,
    show: (value: T) => {
      const id = ++nextSheetId
      setState({ value, open: true, id })
    },
    hide: () => setState((current) => ({ ...current, open: false })),
    onOpenChange: (open: boolean) => setState((current) => ({ ...current, open })),
  }
}
