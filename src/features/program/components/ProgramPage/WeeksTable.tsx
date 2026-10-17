import { ListRow, ListSection } from '@/components/shared/ListGroup'
import { ADJUSTMENT_REASON } from '@/config/enums'
import { formatDateVi } from '@/lib/date'
import type { ProgramWeek } from '../../types/program.types'

interface WeeksTableProps {
  readonly weeks: ProgramWeek[]
}

/** Lịch sử tuần dạng danh sách: ngày hiệu lực + lý do bên trái, kcal và chênh lệch bên phải, macro ở dòng phụ. */
export function WeeksTable({ weeks }: WeeksTableProps) {
  if (weeks.length === 0) return null
  const sorted = [...weeks].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
  return (
    <ListSection label="Weekly history">
      {sorted.map((week) => {
        const delta =
          week.previousCaloriesTarget === null
            ? null
            : week.caloriesTarget - week.previousCaloriesTarget
        return (
          <ListRow
            key={week.id}
            label={`From ${formatDateVi(week.effectiveFrom)}`}
            hint={`${ADJUSTMENT_REASON[week.adjustmentReason]} · P ${Math.round(week.proteinTarget)} · C ${Math.round(week.carbsTarget)} · F ${Math.round(week.fatTarget)}`}
            value={
              <span className="text-foreground font-bold tabular-nums">
                {week.caloriesTarget}
                {delta !== null && delta !== 0 && (
                  <span className="text-muted-foreground ml-1 text-xs font-normal">
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
              </span>
            }
          />
        )
      })}
    </ListSection>
  )
}
