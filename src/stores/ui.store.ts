import { create } from 'zustand'
import type { AddTab } from '@/features/food-log/components/FoodLogPage/AddFoodDialog'
import type { LibraryView } from '@/features/food-log/components/FoodLogPage/LibraryPanel'
import type { ShortcutSheetKind } from '@/features/shortcuts/types/shortcuts.types'

/** Yêu cầu mở bảng Thêm món ở một tab cụ thể (từ shortcut / toolbar); màn Nhật ký đọc rồi xoá. */
export interface AddFoodRequest {
  readonly tab: AddTab
  readonly libraryView?: LibraryView
  /** Mở từ thanh Search của Dashboard: focus ô tìm (mở bằng "+" thì không, tránh bật bàn phím ngoài ý muốn). */
  readonly focusSearch?: boolean
}

/** Một nguyên liệu điền sẵn: lượng theo đúng entry đã log (khẩu phần + số lượng, hoặc gram khi `foodServingId` null). */
export interface RecipeDraftLine {
  readonly foodItemId: string
  readonly name: string
  readonly foodServingId: string | null
  readonly quantity: number
  readonly emoji?: string | null
  readonly iconKey?: string | null
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
  /** Nguyên liệu điền sẵn cho trang Create Recipe (Create Recipe từ các món đã chọn trên timeline); trang đọc rồi xoá. */
  recipeDraft: readonly RecipeDraftLine[] | null
  setRecipeDraft: (lines: readonly RecipeDraftLine[]) => void
  clearRecipeDraft: () => void
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
  recipeDraft: null,
  setRecipeDraft: (recipeDraft) => set({ recipeDraft }),
  clearRecipeDraft: () => set({ recipeDraft: null }),
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
