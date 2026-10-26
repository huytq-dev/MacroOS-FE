import type { PlateItem } from './types/food-log.types'

/**
 * Plate = món đã bấm "+" nhưng CHƯA ghi vào nhật ký. Trước đây chỉ nằm trong state của FoodLogPage nên rời trang (nút Back của điện thoại, đổi tab dưới) là mất sạch mà
 * không ai báo — user tưởng đã "log 4 món" rồi quay lại thấy trống. Giờ plate nằm trong store và được giữ trong sessionStorage (qua tải lại trang), hết hạn sau
 * `PLATE_TTL_MS` để không kéo món của hôm qua sang hôm nay.
 */
export const PLATE_STORAGE_KEY = 'mos.food-log.plate.v1'
export const PLATE_TTL_MS = 12 * 60 * 60 * 1000

interface StoredPlate {
  readonly savedAt: number
  readonly items: readonly PlateItem[]
}

const isPlateItem = (value: unknown): value is PlateItem => {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    typeof item.key === 'string' &&
    typeof item.name === 'string' &&
    typeof item.quantity === 'number' &&
    typeof item.calories === 'number'
  )
}

/** Đọc chuỗi đã lưu: hỏng / sai dạng / quá hạn → plate rỗng (không bao giờ ném lỗi). */
export function parseStoredPlate(raw: string | null, now: number): PlateItem[] {
  if (!raw) return []
  try {
    const stored = JSON.parse(raw) as Partial<StoredPlate> | null
    if (!stored || typeof stored.savedAt !== 'number' || !Array.isArray(stored.items)) return []
    if (now - stored.savedAt > PLATE_TTL_MS || now < stored.savedAt) return []
    return stored.items.filter(isPlateItem)
  } catch {
    return []
  }
}

export function serializePlate(items: readonly PlateItem[], now: number): string {
  return JSON.stringify({ savedAt: now, items } satisfies StoredPlate)
}

/** sessionStorage có thể bị chặn / đầy (chế độ riêng tư): mọi thao tác đều nuốt lỗi, plate vẫn chạy trong bộ nhớ. */
export function loadPlate(): PlateItem[] {
  try {
    return parseStoredPlate(window.sessionStorage.getItem(PLATE_STORAGE_KEY), Date.now())
  } catch {
    return []
  }
}

export function savePlate(items: readonly PlateItem[]): void {
  try {
    if (items.length === 0) window.sessionStorage.removeItem(PLATE_STORAGE_KEY)
    else window.sessionStorage.setItem(PLATE_STORAGE_KEY, serializePlate(items, Date.now()))
  } catch {
    // không lưu được thì thôi: plate vẫn còn trong bộ nhớ tới khi tải lại trang
  }
}
