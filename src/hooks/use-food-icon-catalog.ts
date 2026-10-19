'use client'

import { useQuery } from '@tanstack/react-query'
import { FOOD_ICON_CATALOG_URL, FOOD_ICON_VERSION, type FoodIconDef } from '@/lib/food-icons'

/** Danh mục 529 icon (file tĩnh `icons.json`, ~45 KB): chỉ tải khi bảng chọn icon mở, rồi cache vô hạn trong phiên. */
export const useFoodIconCatalog = (enabled: boolean) =>
  useQuery({
    queryKey: ['food-icon-catalog', FOOD_ICON_VERSION],
    queryFn: async (): Promise<FoodIconDef[]> => {
      const response = await fetch(FOOD_ICON_CATALOG_URL)
      if (!response.ok) throw new Error('Could not load the icon list')
      return response.json()
    },
    enabled,
    staleTime: Infinity,
  })
