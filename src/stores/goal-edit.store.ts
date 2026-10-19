import { create } from 'zustand'

/** Goal đã chốt ở Edit Goal nhưng cần tạo program mới (đổi hướng): wizard New Program dùng lại, goal bị khoá. */
export interface PendingGoal {
  readonly goalType: string
  readonly weeklyWeightChangeTargetPercent: number
  readonly targetWeightKg: number | null
}

interface GoalEditStore {
  /** Đích / tốc độ user đã sửa; null = chưa sửa (màn lấy số hiện tại từ preview của BE). */
  targetWeightKg: number | null
  weeklyRatePercent: number | null
  pendingGoal: PendingGoal | null
  setTarget: (value: number) => void
  setRate: (value: number) => void
  setPendingGoal: (goal: PendingGoal | null) => void
  reset: () => void
}

export const useGoalEditStore = create<GoalEditStore>()((set) => ({
  targetWeightKg: null,
  weeklyRatePercent: null,
  pendingGoal: null,
  setTarget: (targetWeightKg) => set({ targetWeightKg }),
  setRate: (weeklyRatePercent) => set({ weeklyRatePercent }),
  setPendingGoal: (pendingGoal) => set({ pendingGoal }),
  reset: () => set({ targetWeightKg: null, weeklyRatePercent: null }),
}))
