import { create } from 'zustand'

interface UiStore {
  /** Bảng "Thêm món": mở được từ nút + giữa thanh tab ở mọi trang, màn Nhật ký lắng nghe để hiện bảng. */
  addFoodOpen: boolean
  setAddFoodOpen: (open: boolean) => void
}

export const useUiStore = create<UiStore>()((set) => ({
  addFoodOpen: false,
  setAddFoodOpen: (open) => set({ addFoodOpen: open }),
}))
