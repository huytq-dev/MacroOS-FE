/**
 * Các hướng dẫn (thẻ `TutorialCard`) có thể bị ẩn bằng "Dismiss Tutorial". Cờ ẩn nằm ở localStorage (`'show' | 'hidden'`, hook `usePersistedChoice`) nên
 * trang More › Tutorials chỉ cần ghi lại 'show' vào đúng key mà từng trang đang đọc. KHÔNG có BE. Thêm hướng dẫn mới ở trang nào thì thêm key vào đây
 * (check M12 so key ở đây với các `usePersistedChoice('….tutorial')` trong src).
 */
export interface TutorialEntry {
  readonly key: string
  readonly title: string
  /** Nơi thẻ hiện ra. */
  readonly where: string
}

export const TUTORIALS: readonly TutorialEntry[] = [
  { key: 'expenditure.tutorial', title: 'Expenditure', where: 'Dashboard › Expenditure' },
  { key: 'weight-trend.tutorial', title: 'Weight Trend', where: 'Dashboard › Weight Trend' },
  { key: 'goal-progress.tutorial', title: 'Goal Progress', where: 'Dashboard › Goal Progress' },
  { key: 'steps.tutorial', title: 'Steps', where: 'Steps' },
  { key: 'scale-weight.tutorial', title: 'Scale Weight', where: 'Scale Weight' },
  { key: 'body-measurement.tutorial', title: 'Body Measurements', where: 'Body Measurements' },
  { key: 'visual-body-fat.tutorial', title: 'Visual Body Fat', where: 'Visual Body Fat' },
]
