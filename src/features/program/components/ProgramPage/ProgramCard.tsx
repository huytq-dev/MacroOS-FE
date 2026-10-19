import { Pencil, RefreshCw } from 'lucide-react'
import { routePath } from '@/config/route-path'
import { formatMonthDay } from '@/lib/date'
import type { Program } from '../../types/program.types'
import { ActionChip } from './ActionChip'
import { WeekMacroChart, type ChartDay } from './WeekMacroChart'

interface ProgramCardProps {
  readonly program: Program
  readonly onEdit: () => void
}

/** Bảy ngày của biểu đồ: BE trả `days` khi các ngày khác nhau, không thì mọi ngày bằng mục tiêu của tuần hiện tại. */
const chartDaysOf = (program: Program): ChartDay[] | null => {
  if (program.days && program.days.length === 7)
    return program.days.map((day) => ({
      kcal: day.calories,
      proteinG: day.proteinG,
      carbsG: day.carbsG,
      fatG: day.fatG,
      locked: day.isLocked,
    }))
  const week = program.currentWeek
  if (!week) return null
  const day = {
    kcal: week.caloriesTarget,
    proteinG: week.proteinTarget,
    carbsG: week.carbsTarget,
    fatG: week.fatTarget,
  }
  return Array.from({ length: 7 }, () => day)
}

/**
 * Thẻ "<Style> Program" của tab Strategy (như MacroFactor): tên + khoảng ngày, biểu đồ bảy ngày dùng chung với wizard
 * (`WeekMacroChart`, chiều cao có animation) và hai nút New Program (mở wizard) / Edit Program.
 */
export function ProgramCard({ program, onEdit }: ProgramCardProps) {
  const days = chartDaysOf(program)
  return (
    <section className="bg-card rounded-2xl p-4 pt-5">
      <h3 className="text-xl font-medium">{program.programType} Program</h3>
      <p className="text-muted-foreground text-base">{formatMonthDay(program.startDate)} - Now</p>

      {days ? (
        <div className="mt-5">
          <WeekMacroChart days={days} />
        </div>
      ) : (
        <p className="text-muted-foreground mt-4 text-base">
          Manual program: you set your own targets, so no weekly targets are generated.
        </p>
      )}

      <div className="border-border mt-5 flex flex-wrap gap-2 border-t pt-4">
        <ActionChip icon={RefreshCw} label="New Program" href={routePath.programNew} />
        <ActionChip icon={Pencil} label="Edit Program" onClick={onEdit} />
      </div>
    </section>
  )
}
