import { ADJUSTMENT_REASON } from '@/config/enums'
import { formatDateVi } from '@/lib/date'
import type { ProgramWeek } from '../../types/program.types'

interface WeeksTableProps {
  readonly weeks: ProgramWeek[]
}

export function WeeksTable({ weeks }: WeeksTableProps) {
  if (weeks.length === 0) return null
  const sorted = [...weeks].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
  return (
    <div className="bg-card overflow-auto rounded-lg border">
      <table className="w-full text-xs">
        <thead className="text-muted-foreground">
          <tr className="border-b">
            <th className="px-3 py-2 text-left font-medium">Từ ngày</th>
            <th className="px-3 py-2 text-right font-medium">kcal</th>
            <th className="px-3 py-2 text-right font-medium">P</th>
            <th className="px-3 py-2 text-right font-medium">C</th>
            <th className="px-3 py-2 text-right font-medium">F</th>
            <th className="px-3 py-2 text-right font-medium">Δ</th>
            <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">Lý do</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {sorted.map((week) => (
            <tr key={week.id} className="border-b last:border-0">
              <td className="px-3 py-1.5 whitespace-nowrap">{formatDateVi(week.effectiveFrom)}</td>
              <td className="px-3 py-1.5 text-right font-medium">{week.caloriesTarget}</td>
              <td className="px-3 py-1.5 text-right">{Math.round(week.proteinTarget)}</td>
              <td className="px-3 py-1.5 text-right">{Math.round(week.carbsTarget)}</td>
              <td className="px-3 py-1.5 text-right">{Math.round(week.fatTarget)}</td>
              <td className="px-3 py-1.5 text-right">
                {week.previousCaloriesTarget === null ? '—' : week.caloriesTarget - week.previousCaloriesTarget}
              </td>
              <td className="hidden px-3 py-1.5 sm:table-cell">{ADJUSTMENT_REASON[week.adjustmentReason]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
