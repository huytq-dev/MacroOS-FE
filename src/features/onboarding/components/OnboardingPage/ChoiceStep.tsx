'use client'

import { OptionList } from './OptionCard'
import { BadgeInfo } from './SolidIcons'
import type { ChoiceOption } from '../../types/onboarding-options.types'

interface StepHeadingProps {
  readonly title: string
  readonly subtitle?: string
}

/** Tiêu đề câu hỏi: chữ lớn, một dòng phụ ngắn (mỗi bước có đúng một h1). */
export function StepHeading({ title, subtitle }: StepHeadingProps) {
  return (
    <div className="space-y-2 pb-5">
      <h1 className="text-2xl leading-tight font-bold">{title}</h1>
      {subtitle && <p className="text-muted-foreground text-base">{subtitle}</p>}
    </div>
  )
}

interface ChoiceStepProps<T extends string> {
  readonly title: string
  readonly subtitle?: string
  readonly options: readonly ChoiceOption<T>[]
  readonly value: T | null
  readonly onChange: (value: T) => void
  /** Ghi chú nền xanh dưới danh sách (hiện sau khi đã chọn). */
  readonly info?: string
}

/** Bước chọn một đáp án từ danh sách thẻ; dùng cho hầu hết câu hỏi của Basics và Program. */
export function ChoiceStep<T extends string>({
  title,
  subtitle,
  options,
  value,
  onChange,
  info,
}: ChoiceStepProps<T>) {
  return (
    <div>
      <StepHeading title={title} subtitle={subtitle} />
      <OptionList options={options} value={value} onChange={onChange} ariaLabel={title} />
      {info && value !== null && (
        <div
          role="note"
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-300 mt-4 flex items-start gap-3 rounded-2xl bg-blue-950 p-4 text-base text-blue-50"
        >
          <BadgeInfo className="mt-0.5 size-5 shrink-0" />
          <p className="leading-snug">{info}</p>
        </div>
      )}
    </div>
  )
}
