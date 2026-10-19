import { create } from 'zustand'

export type FlowDirection = 'forward' | 'back'

interface FlowStore {
  /** Hướng chuyển bước gần nhất của các luồng nhiều bước (wizard, check-in): bước mới trượt vào từ phải (tiến) hoặc từ trái (lùi). */
  direction: FlowDirection
  setDirection: (direction: FlowDirection) => void
}

export const useFlowStore = create<FlowStore>()((set) => ({
  direction: 'forward',
  setDirection: (direction) => set({ direction }),
}))
