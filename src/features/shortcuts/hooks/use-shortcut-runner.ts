'use client'

import { usePathname, useRouter } from 'next/navigation'
import { routePath } from '@/config/route-path'
import type { AddFoodRequest } from '@/stores/ui.store'
import { useUiStore } from '@/stores/ui.store'

/**
 * Chạy hành động của một shortcut (dùng chung cho sheet Shortcuts và toolbar): các shortcut thêm món mở bảng Thêm món ở đúng tab
 * (rồi sang Nhật ký nếu đang ở trang khác), Weight / Metrics / Photos mở sheet tương ứng. New Recipe / New Food chỉ điều hướng nên là
 * `<Link>` (`shortcutHref`), không đi qua đây.
 */
export function useShortcutRunner() {
  const router = useRouter()
  const pathname = usePathname()
  const requestAddFood = useUiStore((state) => state.requestAddFood)
  const openSheet = useUiStore((state) => state.openSheet)

  const addFood = (request: AddFoodRequest) => {
    requestAddFood(request)
    if (pathname !== routePath.foodLog) router.push(routePath.foodLog)
  }

  return (key: string) => {
    switch (key) {
      case 'search':
        return addFood({ tab: 'search' })
      case 'barcode':
        return addFood({ tab: 'scan' })
      case 'ai':
        return addFood({ tab: 'ai' })
      case 'quick-add':
        return addFood({ tab: 'quick' })
      case 'recipes':
        return addFood({ tab: 'library', libraryView: 'recipes' })
      case 'your-foods':
        return addFood({ tab: 'library', libraryView: 'foods' })
      case 'favorites':
        return addFood({ tab: 'library', libraryView: 'favorites' })
      case 'weight':
      case 'metrics':
      case 'photos':
        return openSheet(key)
    }
  }
}
