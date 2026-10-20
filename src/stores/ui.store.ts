import { create } from 'zustand'
import type { AddTab } from '@/features/food-log/components/FoodLogPage/AddFoodDialog'
import type { LibraryView } from '@/features/food-log/components/FoodLogPage/LibraryPanel'
import type { ShortcutSheetKind } from '@/features/shortcuts/types/shortcuts.types'

/** Yêu cầu mở bảng Thêm món ở một tab cụ thể (từ shortcut / toolbar); màn Nhật ký đọc rồi xoá. */
export interface AddFoodRequest {
  readonly tab: AddTab
  readonly libraryView?: LibraryView
}

interface UiStore {
  /** Bảng "Thêm món": mở được từ shortcut / toolbar ở mọi trang, màn Nhật ký lắng nghe để hiện bảng. */
  addFoodOpen: boolean
  setAddFoodOpen: (open: boolean) => void
  /** Tab (và ngăn Library) bảng Thêm món cần mở sẵn; null = giữ tab đang có. */
  addFoodRequest: AddFoodRequest | null
  /** Yêu cầu mở bảng Thêm món ở một tab (mở luôn bảng). */
  requestAddFood: (request: AddFoodRequest) => void
  /** Màn Nhật ký đã áp dụng yêu cầu: xoá nó nhưng KHÔNG đóng bảng. */
  clearAddFoodRequest: () => void
  /** Ngày Food Log cần mở sẵn (bấm một ngày ở lịch Habits); màn Nhật ký đọc rồi xoá. */
  foodLogDate: string | null
  openFoodLogDate: (date: string) => void
  clearFoodLogDate: () => void
  /** Sheet "Shortcuts" mở từ nút "+" ở thanh tab. */
  shortcutsOpen: boolean
  setShortcutsOpen: (open: boolean) => void
  /** Sheet nhập liệu đang mở (Weight / Metrics / Photos) và số lần mở, để dựng lại sheet với form sạch mỗi lần mở. */
  activeSheet: ShortcutSheetKind | null
  sheetSession: number
  openSheet: (sheet: ShortcutSheetKind) => void
  closeSheet: () => void
}

export const useUiStore = create<UiStore>()((set) => ({
  addFoodOpen: false,
  setAddFoodOpen: (open) => set({ addFoodOpen: open }),
  addFoodRequest: null,
  requestAddFood: (addFoodRequest) => set({ addFoodRequest, addFoodOpen: true }),
  clearAddFoodRequest: () => set({ addFoodRequest: null }),
  foodLogDate: null,
  openFoodLogDate: (foodLogDate) => set({ foodLogDate }),
  clearFoodLogDate: () => set({ foodLogDate: null }),
  shortcutsOpen: false,
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  activeSheet: null,
  sheetSession: 0,
  openSheet: (activeSheet) =>
    set((state) => ({ activeSheet, sheetSession: state.sheetSession + 1 })),
  closeSheet: () => set({ activeSheet: null }),
}))
