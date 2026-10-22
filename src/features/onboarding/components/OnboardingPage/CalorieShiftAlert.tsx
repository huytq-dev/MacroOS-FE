'use client'

import { useEffect, useRef } from 'react'
import { CircleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useUnits } from '@/features/users/hooks/use-units'
import { cn } from '@/lib/utils'
import {
  issuesByDay,
  type CalorieShiftProblem,
  type ShiftFix,
} from '@/features/program/utils/calorie-shift'
import { focusWizardContent } from './WizardShell'

interface CalorieShiftAlertProps {
  readonly problem: CalorieShiftProblem
  readonly fixes: readonly ShiftFix[]
  readonly onApply: (fix: ShiftFix) => void
  readonly className?: string
}

/**
 * 400 Calorie Shift của BE: cách chia kcal này làm một số ngày không hợp lệ. Nêu ngày nào hỏng và vì sao, mỗi cách sửa là một nút.
 * Chỉ khi người dùng bấm thì giá trị mới được đặt; không bao giờ tự đổi %, số ngày hay macro. Khung xuất hiện dưới nội dung bước
 * nên cuộn nó vào tầm nhìn (chừa chỗ cho thanh nút dính đáy), nếu không người dùng chỉ thấy nút Next bị khoá mà không biết vì sao.
 */
export function CalorieShiftAlert({ problem, fixes, onApply, className }: CalorieShiftAlertProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { energy } = useUnits()
  const issues = issuesByDay(problem, energy)
  const proposal = problem.proposal ?? []

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ref.current?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [])

  return (
    <Alert
      ref={ref}
      variant="destructive"
      className={cn(
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-200 scroll-mt-20 scroll-mb-28',
        className
      )}
    >
      <CircleAlert aria-hidden="true" />
      <AlertTitle className="text-sm font-medium">
        This calorie shift doesn&apos;t fit your week
      </AlertTitle>
      <AlertDescription className="text-sm">
        {issues.length === 0
          ? 'Some days would be out of range.'
          : problem.percent !== null
            ? `A ${problem.percent}% shift leaves ${issues.length === 1 ? 'this day' : 'these days'} out of range.`
            : 'These days would be out of range.'}
      </AlertDescription>

      <div className="col-start-2 mt-3 space-y-3">
        {issues.length > 0 && (
          <ul className="space-y-2">
            {issues.map((issue) => (
              <li key={issue.day} className="bg-destructive/5 rounded-xl px-3 py-2 text-sm">
                <p className="text-foreground font-medium">
                  {issue.day}{' '}
                  <span className="text-muted-foreground font-normal tabular-nums">
                    · {issue.calories}
                  </span>
                </p>
                {issue.reasons.map((reason) => (
                  <p key={reason} className="text-muted-foreground">
                    {reason}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        )}

        {fixes.length > 0 && proposal.length > 0 && (
          <div className="bg-secondary/60 rounded-xl px-3 py-2 text-sm">
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
                {proposal.map((row) => (
                  <tr key={row.day}>
                    <td>{row.day.slice(0, 3)}</td>
                    <td className="text-right">
                      {row.before === null ? '—' : energy.format(row.before)}
                    </td>
                    <td className="text-right">{energy.format(row.after ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-muted-foreground pt-1 text-xs">{energy.unit} per day</p>
          </div>
        )}

        {fixes.length > 0 ? (
          <div className="space-y-2">
            <p className="text-foreground text-sm font-medium">Pick a fix</p>
            {fixes.map((fix) => (
              <Button
                key={fix.code}
                type="button"
                variant="outline"
                onClick={() => {
                  onApply(fix)
                  focusWizardContent()
                }}
                className="text-foreground h-auto min-h-11 w-full flex-col items-start gap-0 rounded-2xl px-4 py-2.5 text-left whitespace-normal md:h-auto md:min-h-11 md:px-4"
              >
                <span className="text-base font-medium">{fix.label}</span>
                {fix.detail && (
                  <span className="text-muted-foreground text-sm font-normal">{fix.detail}</span>
                )}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Go back and lower the percentage, pick fewer days or choose an even split.
          </p>
        )}
        <p className="text-muted-foreground text-xs">
          Nothing changes until you tap a fix, and your macros are never adjusted for you.
        </p>
      </div>
    </Alert>
  )
}
