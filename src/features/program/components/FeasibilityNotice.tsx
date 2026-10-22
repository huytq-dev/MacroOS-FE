'use client'

import { CircleAlert, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useUnits } from '@/features/users/hooks/use-units'
import { cn } from '@/lib/utils'
import type { Feasibility } from '../types/feasibility.types'
import { actionTexts, proposalRows, violationText, warningText } from '../utils/feasibility'

export interface FeasibilityNoticeProps {
  readonly feasibility: Feasibility
  readonly className?: string
  /**
   * Đề xuất BE mà trang thực hiện được (giảm % / chia đều): mỗi cái là một nút xác nhận, chỉ khi user bấm mới áp. Bảng "trước / sau" của BE hiện khi có nút
   * ứng với `suggestedAction` (BE chỉ dựng bảng cho đề xuất đó).
   */
  readonly apply?: readonly {
    readonly code: 'REDUCE_SHIFT' | 'USE_EVEN_DISTRIBUTION'
    readonly label: string
    readonly onClick: () => void
    readonly disabled?: boolean
  }[]
}

/**
 * Target không khả thi (BE `FeasibilityResponse`, HTTP 200 trong preview hoặc `data` của 400): nêu câu tóm tắt của BE, từng vi phạm theo đúng số BE
 * và các cách chỉnh BE đề xuất. Chỉ thông tin: không có nút tự đổi giá trị (BE không bao giờ tự đổi shift / protein / fat / sàn); riêng Calorie Shift có
 * `CalorieShiftAlert` với nút xác nhận. Nơi gọi tự khoá nút Next / Save khi `isFeasible = false`.
 */
export function FeasibilityNotice({ feasibility, className, apply }: FeasibilityNoticeProps) {
  const { energy } = useUnits()
  const actions = actionTexts(feasibility)
  const buttons = apply ?? []
  const rows = buttons.some((button) => button.code === feasibility.suggestedAction)
    ? proposalRows(feasibility)
    : []
  return (
    <Alert variant="destructive" className={className} role="alert">
      <CircleAlert aria-hidden="true" />
      <AlertTitle className="text-sm font-medium">
        {feasibility.message ?? "These targets don't work"}
      </AlertTitle>
      <AlertDescription className="text-sm">
        {feasibility.violations.length > 0 && (
          <ul className="mt-1 space-y-1">
            {feasibility.violations.map((violation, index) => (
              <li key={`${violation.day ?? 'week'}-${violation.detail}-${index}`}>
                {violationText(violation, energy)}
              </li>
            ))}
          </ul>
        )}
        {actions.length > 0 && (
          <div className="mt-2">
            <p className="text-foreground font-medium">You can</p>
            <ul className="list-disc pl-5">
              {actions.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </div>
        )}
        {rows.length > 0 && (
          <div className="bg-secondary/60 mt-3 rounded-xl px-3 py-2">
            <p className="text-foreground font-medium">What the suggestion changes</p>
            <table className="mt-1 w-full tabular-nums">
              <thead>
                <tr className="text-muted-foreground text-left text-xs">
                  <th className="font-normal">Day</th>
                  <th className="text-right font-normal">Now</th>
                  <th className="text-right font-normal">Suggested</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.day}>
                    <td>{row.day.slice(0, 3)}</td>
                    <td className="text-right">
                      {row.before === null ? '—' : energy.format(row.before)}
                    </td>
                    <td className="text-right">
                      {row.after === null ? '—' : energy.format(row.after)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-muted-foreground pt-1 text-xs">{energy.unit} per day</p>
          </div>
        )}
        {buttons.map((button) => (
          <Button
            key={button.code}
            type="button"
            variant="outline"
            disabled={button.disabled}
            onClick={button.onClick}
            className="text-foreground mt-3 h-11 w-full rounded-2xl text-base"
          >
            {button.label}
          </Button>
        ))}
        <p className="text-muted-foreground mt-2 text-xs">
          {buttons.length > 0
            ? 'Nothing was saved, and your numbers only change if you tap the button above.'
            : 'Nothing was saved, and your numbers are never adjusted for you.'}
        </p>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Cảnh báo KHÔNG chặn của target tự nhập (macro lệch kcal, `FeasibilityResponse.warnings`): nói rõ kcal macro so với target và chênh lệch, vẫn cho Lưu.
 * Không đổi giá trị nào của user. Không có cảnh báo thì không vẽ gì.
 */
export function FeasibilityWarnings({ feasibility, className }: FeasibilityNoticeProps) {
  const { energy } = useUnits()
  if (feasibility.warnings.length === 0) return null
  return (
    <Alert className={cn('border-amber-500/40', className)} role="status">
      <Info aria-hidden="true" />
      <AlertTitle className="text-sm font-medium">Macros and calories don&apos;t match</AlertTitle>
      <AlertDescription className="text-sm">
        <ul className="mt-1 space-y-1">
          {feasibility.warnings.map((warning, index) => (
            <li key={`${warning.day ?? 'week'}-${index}`}>
              <p className="text-foreground font-medium tabular-nums">
                {warningText(warning, energy)}
              </p>
              {warning.message && <p className="text-muted-foreground">{warning.message}</p>}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
