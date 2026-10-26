import type { FoodSearchParams } from './types/food.types'

/**
 * Có giữ kết quả CŨ (mờ đi) trong lúc tải kết quả mới không: cùng phạm vi và (cùng từ khoá — Load more / đổi trang — hoặc cả hai từ khoá đều có chữ: gõ tiếp "app" → "apple").
 * Từ khoá rỗng (danh sách History) ↔ từ khoá có chữ thì KHÔNG giữ: danh sách History lạc vào kết quả tìm kiếm trông như kết quả của từ khoá mới.
 */
export function keepsPreviousResults(
  previous: FoodSearchParams | undefined,
  next: FoodSearchParams
): boolean {
  if (!previous || previous.scope !== next.scope) return false
  const before = (previous.search ?? '').trim()
  const after = (next.search ?? '').trim()
  return before === after || (before !== '' && after !== '')
}

/** BE kẹp `top` vào 1–100 (`GET /foods?top&skip`): muốn nhiều hơn 100 dòng thì phải đọc nhiều trang bằng `skip`. */
export const FOOD_PAGE_MAX = 100

/**
 * Gom `want` dòng đầu của một truy vấn phân trang (`top` ≤ `FOOD_PAGE_MAX`, `skip` = số dòng đã có): trước đây "Load more" tăng `top` 25, 50 … 125 nên từ 100 trở đi BE vẫn trả 100
 * dòng và danh sách kẹt. Dừng khi đủ, khi BE trả ít hơn đã xin (hết dữ liệu) hoặc khi `skip` chạm `totalCount`. `fetchPage` trả null (không có dữ liệu) thì dừng.
 */
export async function collectFoodPages<T>(
  fetchPage: (page: {
    top: number
    skip: number
  }) => Promise<{ items: readonly T[]; totalCount: number } | null>,
  want: number,
  startSkip = 0
): Promise<{ items: T[]; totalCount: number }> {
  const items: T[] = []
  let totalCount: number | null = null
  let skip = startSkip
  while (items.length < want) {
    const take = Math.min(FOOD_PAGE_MAX, want - items.length)
    const page = await fetchPage({ top: take, skip })
    if (!page) break
    items.push(...page.items)
    totalCount = page.totalCount
    skip += page.items.length
    if (page.items.length < take || skip >= page.totalCount) break
  }
  return { items, totalCount: totalCount ?? items.length }
}

export const RECENT_SEARCH_KEY = 'mos.food-search.recent.v1'
export const RECENT_SEARCH_MAX = 6
const RECENT_SEARCH_MIN_LENGTH = 2

/** Danh sách đã lưu: hỏng / sai dạng → rỗng (không bao giờ ném lỗi). */
export function parseRecentSearches(raw: string | null): string[] {
  if (!raw) return []
  try {
    const value = JSON.parse(raw) as unknown
    if (!Array.isArray(value)) return []
    return value
      .filter((item): item is string => typeof item === 'string' && item.trim() !== '')
      .slice(0, RECENT_SEARCH_MAX)
  } catch {
    return []
  }
}

/** Thêm một từ khoá vào đầu danh sách: bỏ khoảng trắng thừa, bỏ từ quá ngắn, không trùng (không phân biệt hoa thường), tối đa `RECENT_SEARCH_MAX`. */
export function addRecentSearch(list: readonly string[], query: string): string[] {
  const text = query.trim().replace(/\s+/g, ' ')
  if (text.length < RECENT_SEARCH_MIN_LENGTH) return [...list]
  const lower = text.toLowerCase()
  return [text, ...list.filter((item) => item.toLowerCase() !== lower)].slice(0, RECENT_SEARCH_MAX)
}
