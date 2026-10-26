import { create } from 'zustand'
import type { AddTab } from '@/features/food-log/components/FoodLogPage/AddFoodDialog'
import type { LibraryView } from '@/features/food-log/components/FoodLogPage/LibraryPanel'
import type { ShortcutSheetKind } from '@/features/shortcuts/types/shortcuts.types'
import { loadPlate, savePlate } from '@/features/food-log/plate-storage'
import type { PlateItem } from '@/features/food-log/types/food-log.types'

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
  /**
   * Plate: món đã bấm "+" nhưng chưa ghi vào nhật ký. Nằm trong store (không phải state của trang) và được giữ trong sessionStorage để rời trang / tải lại không làm mất món
   * đã chọn. `hydratePlate` đọc lại sau khi mount (tránh lệch HTML server / client).
   */
  plate: PlateItem[]
  setPlate: (update: PlateItem[] | ((current: PlateItem[]) => PlateItem[])) => void
  hydratePlate: () => void
  /** Tab (và ngăn Library) bảng Thêm món cần mở sẵn; null = giữ tab đang có. */
  addFoodRequest: AddFoodRequest | null
  /** Yêu cầu mở bảng Thêm món ở một tab (mở luôn bảng). */
  requestAddFood: (request: AddFoodRequest) => void
  /** Màn Nhật ký đã áp dụng yêu cầu: xoá nó nhưng KHÔNG đóng bảng. */
  clearAddFoodRequest: () => void
  /**
   * "To Custom" mở Create Food từ Food Detail: nhớ món nguồn để Back từ Create Food quay về ĐÚNG Food Detail đó (như MacroFactor). `at` = lúc bắt đầu, rồi lúc rời Create Food;
   * Nhật ký chỉ mở lại Food Detail nếu vừa rời Create Food trong vài giây (Back), nếu không thì bỏ cờ (không bật Food Detail bất ngờ sau khi đã đi chỗ khác).
   */
  detailReturn: { readonly foodId: string; readonly at: number } | null
  setDetailReturn: (foodId: string) => void
  /** Rời Create Food: đóng dấu lúc rời (không đổi gì nếu không có cờ). */
  stampDetailReturn: () => void
  clearDetailReturn: () => void
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
  plate: [],
  setPlate: (update) =>
    set((state) => {
      const plate = typeof update === 'function' ? update(state.plate) : update
      savePlate(plate)
      return { plate }
    }),
  hydratePlate: () => set((state) => (state.plate.length > 0 ? state : { plate: loadPlate() })),
  addFoodRequest: null,
  requestAddFood: (addFoodRequest) => set({ addFoodRequest, addFoodOpen: true }),
  clearAddFoodRequest: () => set({ addFoodRequest: null }),
  detailReturn: null,
  setDetailReturn: (foodId) => set({ detailReturn: { foodId, at: Date.now() } }),
  stampDetailReturn: () =>
    set((state) =>
      state.detailReturn ? { detailReturn: { ...state.detailReturn, at: Date.now() } } : state
    ),
  clearDetailReturn: () => set({ detailReturn: null }),
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
