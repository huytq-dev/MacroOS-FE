import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface CheckInProgressStore {
  /** `nextCheckInDate` của lần check-in đang làm; đổi ngày thì danh sách đã xong coi như trống. */
  date: string | null
  completed: string[]
  markDone: (date: string, key: string) => void
}

/** Module nào đã xong trong lần check-in này (lưu sessionStorage để tải lại trang vẫn giữ dấu ✓; luồng tuyến tính trong một lần ngồi). */
export const useCheckInProgressStore = create<CheckInProgressStore>()(
  persist(
    (set) => ({
      date: null,
      completed: [],
      markDone: (date, key) =>
        set((state) =>
          state.date === date
            ? state.completed.includes(key)
              ? state
              : { completed: [...state.completed, key] }
            : { date, completed: [key] }
        ),
    }),
    { name: 'check-in-progress', storage: createJSONStorage(() => sessionStorage) }
  )
)

/** Các module đã xong của lần check-in `date` (rỗng nếu store đang giữ lần khác). */
export const completedFor = (
  store: Pick<CheckInProgressStore, 'date' | 'completed'>,
  date: string
) => (store.date === date ? store.completed : [])
