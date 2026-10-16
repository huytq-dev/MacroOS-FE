import type { ChoiceOption } from '@/components/shared/ChoiceGroup'

/** Nhãn enum dạng "Tên — mô tả" hoặc "Tên (mô tả)" → tách thành tiêu đề và dòng phụ cho ChoiceGroup. */
export const toChoices = <T extends string>(labels: Record<T, string>): ChoiceOption<T>[] =>
  (Object.keys(labels) as T[]).map((value) => {
    const match = /^(.*?)(?: — | \()(.*?)\)?$/.exec(labels[value])
    return match
      ? { value, label: match[1], description: match[2] }
      : { value, label: labels[value] }
  })
