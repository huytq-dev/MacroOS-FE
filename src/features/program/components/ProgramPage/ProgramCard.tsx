import { Pencil, RefreshCw } from 'lucide-react'
import { routePath } from '@/config/route-path'
import { UNVERIFIED_TARGET_NOTE, isUnverifiedTarget } from '@/features/nutrition/target-provenance'
import { formatMonthDay } from '@/lib/date'
import type { Program } from '../../types/program.types'
import { ActionChip } from './ActionChip'
import { WeekMacroChart, type ChartDay } from './WeekMacroChart'

interface ProgramCardProps {
  readonly program: Program
  readonly onEdit: () => void
}

/**
 * Bảy ngày của biểu đồ: đúng `days` BE trả (luôn đủ 7 khi có tuần hiện tại, kể cả khi các ngày bằng nhau). Thiếu thì không có biểu đồ:
 * không bao giờ dựng bảy ngày từ một mục tiêu tuần (ngày dịch kcal / Collaborative khác mục tiêu tuần).
 */
const chartDaysOf = (program: Program): ChartDay[] | null =>
  program.days?.length === 7
    ? program.days.map((day) => ({
        kcal: day.calories,
        proteinG: day.proteinG,
        carbsG: day.carbsG,
        fatG: day.fatG,
        locked: day.isLocked,
      }))
    : null

/**
 * Thẻ "<Style> Program" của tab Strategy (như MacroFactor): tên + khoảng ngày, biểu đồ bảy ngày dùng chung với wizard
 * (`WeekMacroChart`, chiều cao có animation) và hai nút New Program (mở wizard) / Edit Program.
 */
export function ProgramCard({ program, onEdit }: ProgramCardProps) {
  const days = chartDaysOf(program)
  // Cờ của BE (tuần hoặc ngày): target cũ chưa xác minh chỉ để tham khảo; thẻ này không có đạt / không đạt nên chỉ thêm câu giải thích
  const unverified = (program.days ?? []).some((day) => isUnverifiedTarget(day.targetProvenance))
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
          There are no daily targets to show for this week yet.
        </p>
      )}
      {unverified && <p className="text-muted-foreground mt-3 text-sm">{UNVERIFIED_TARGET_NOTE}</p>}

      <div className="border-border mt-5 flex flex-wrap gap-2 border-t pt-4">
        <ActionChip icon={RefreshCw} label="New Program" href={routePath.programNew} />
        <ActionChip icon={Pencil} label="Edit Program" onClick={onEdit} />
      </div>
    </section>
  )
}
