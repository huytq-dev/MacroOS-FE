'use client'

import { useEffect, useState } from 'react'

export interface PresenceItem<T> {
  readonly item: T
  readonly key: string
  /** Vừa được thêm vào danh sách (sau lần hiển thị đầu) → chạy hoạt ảnh vào. */
  readonly entering: boolean
  /** Đã bị gỡ khỏi danh sách nguồn nhưng còn giữ lại `ms` để chạy hoạt ảnh biến mất. */
  readonly leaving: boolean
}

interface Leaving<T> {
  readonly item: T
  readonly index: number
}

/**
 * Danh sách có hoạt ảnh vào/ra: món bị gỡ khỏi `items` vẫn được trả về (leaving = true) thêm `ms` mili giây ở đúng vị trí cũ để
 * ô co lại rồi mới biến mất; món mới thêm có `entering = true`. Món có sẵn lúc mount không chạy hoạt ảnh vào. Danh sách nguồn
 * so theo khoá (không theo tham chiếu mảng) nên truyền `data ?? []` mới mỗi lần render vẫn an toàn.
 */
export function useExitingList<T>(
  items: readonly T[],
  getKey: (item: T) => string,
  ms = 300
): PresenceItem<T>[] {
  const signature = items.map(getKey).join('\u0000')
  const [previous, setPrevious] = useState({ signature, items })
  const [leaving, setLeaving] = useState<Leaving<T>[]>([])
  const [added, setAdded] = useState<ReadonlySet<string>>(new Set())

  // Đổi danh sách thì tính phần bị gỡ / phần mới ngay trong lúc render (không qua effect để khỏi nháy một khung hình)
  if (signature !== previous.signature) {
    const keys = new Set(items.map(getKey))
    const before = new Set(previous.items.map(getKey))
    const gone = previous.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !keys.has(getKey(item)))
    setPrevious({ signature, items })
    setLeaving((current) => [...current.filter(({ item }) => !keys.has(getKey(item))), ...gone])
    setAdded((current) => {
      const next = new Set([...current].filter((key) => keys.has(key)))
      keys.forEach((key) => {
        if (!before.has(key)) next.add(key)
      })
      return next
    })
  }

  const leavingKeys = leaving.map(({ item }) => getKey(item)).join('\u0000')
  useEffect(() => {
    if (!leavingKeys) return
    const timer = setTimeout(() => setLeaving([]), ms)
    return () => clearTimeout(timer)
  }, [leavingKeys, ms])

  const view: PresenceItem<T>[] = items.map((item) => {
    const key = getKey(item)
    return { item, key, entering: added.has(key), leaving: false }
  })
  // Chèn theo thứ tự chỉ số tăng dần để mỗi món bị gỡ về đúng vị trí cũ
  ;[...leaving]
    .sort((a, b) => a.index - b.index)
    .forEach(({ item, index }) => {
      view.splice(Math.min(index, view.length), 0, {
        item,
        key: getKey(item),
        entering: false,
        leaving: true,
      })
    })
  return view
}
