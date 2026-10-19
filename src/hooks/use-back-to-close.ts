'use client'

import { useEffect, useId, useRef } from 'react'

/** Khoá đánh dấu mục lịch sử do sheet/dialog thêm vào (giữ nguyên state của Next để router không tải lại trang). */
const KEY = '__sheet'
const openSheets = new Set<string>()
let skipInstalled = false

const currentSheet = (): string | undefined => window.history.state?.[KEY]

/**
 * Mục lịch sử của sheet đã đóng bằng nút (không xoá được vì có thể đang điều hướng sang trang khác) còn nằm lại; quay về đúng mục đó
 * thì tự lùi thêm một bước để người dùng không phải bấm Back hai lần.
 */
function installSkip() {
  if (skipInstalled) return
  skipInstalled = true
  window.addEventListener('popstate', () => {
    const id = currentSheet()
    if (id && !openSheets.has(id)) window.history.back()
  })
}

/**
 * Như app di động: khi sheet/dialog đang mở, cử chỉ hoặc nút Back của trình duyệt đóng sheet (chạy hoạt ảnh đóng) thay vì rời trang.
 * Mở → thêm một mục lịch sử cùng URL; Back → `onClose`. Đóng bằng nút X/Done → lùi bỏ mục đó ở khung hình sau, trừ khi trang đã
 * chuyển đi (vd. "To Custom" đóng bảng rồi mở Create Food) thì để lại và `installSkip` tự bỏ qua sau.
 * ponytail: còn khe race rất nhỏ nếu Next đẩy URL mới đúng giữa lúc kiểm tra và lúc lùi; gặp thì chuyển sang router của Next.
 */
export function useBackToClose(active: boolean, onClose: () => void) {
  const id = useId()
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!active) return
    installSkip()
    openSheets.add(id)
    // StrictMode (dev) chạy effect hai lần: mục của chính sheet này đã ở đỉnh thì không thêm mục thứ hai
    if (currentSheet() !== id)
      window.history.pushState({ ...window.history.state, [KEY]: id }, '', window.location.href)
    // Sheet lồng nhau: lùi khỏi sheet trên thì mục hiện tại là của sheet dưới, sheet dưới giữ nguyên
    const onPop = () => {
      if (currentSheet() !== id) closeRef.current()
    }
    window.addEventListener('popstate', onPop)
    return () => {
      openSheets.delete(id)
      window.removeEventListener('popstate', onPop)
      // Chỉ lùi khi sheet thật sự đã đóng (StrictMode gỡ rồi gắn lại effect ngay thì sheet vẫn mở)
      requestAnimationFrame(() => {
        if (currentSheet() === id && !openSheets.has(id)) window.history.back()
      })
    }
  }, [active, id])
}
