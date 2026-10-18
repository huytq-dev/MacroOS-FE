import { Pencil, RefreshCw } from 'lucide-react'
import { routePath } from '@/config/route-path'
import { formatMonthDay } from '@/lib/date'
import type { Program, ProgramWeek } from '../../types/program.types'
import { ActionChip } from './ActionChip'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const

const BLOCK_COLORS = {
  P: 'bg-[var(--mf-tile-protein)]',
  F: 'bg-[var(--mf-tile-fat)]',
  C: 'bg-[var(--mf-tile-carbs)]',
} as const

interface ProgramCardProps {
  readonly program: Program
  readonly onEdit: () => void
}

/** Một cột ngày của biểu đồ: viên calo xanh dương + ba khối P / F / C cao theo phần calo mỗi chất đóng góp. */
function DayColumn({ label, week }: { readonly label: string; readonly week: ProgramWeek }) {
  const blocks = [
    { key: 'P', grams: week.proteinTarget, kcal: week.proteinTarget * 4 },
    { key: 'F', grams: week.fatTarget, kcal: week.fatTarget * 9 },
    { key: 'C', grams: week.carbsTarget, kcal: week.carbsTarget * 4 },
  ] as const
  return (
    <li className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <span className="flex h-8 w-full items-center justify-center rounded-full bg-[var(--mf-tile-calories)] text-sm font-medium text-black/80 tabular-nums">
        {Math.round(week.caloriesTarget)}
      </span>
      <div className="flex h-64 w-full flex-col gap-2">
        {blocks.map((block) => (
          <span
            key={block.key}
            style={{ flexGrow: Math.max(block.kcal, 1) }}
            className={`${BLOCK_COLORS[block.key]} flex min-h-10 basis-0 items-center justify-center rounded-lg text-sm font-medium text-black/80 tabular-nums`}
          >
            {Math.round(block.grams)} {block.key}
          </span>
        ))}
      </div>
      <span className="text-muted-foreground text-base">{label}</span>
    </li>
  )
}

/**
 * Thẻ "<Style> Program" của tab Strategy (như MacroFactor): tên + khoảng ngày, biểu đồ bảy ngày (calo, P, F, C) và hai nút New
 * Program / Edit Program. BE mới trả mục tiêu theo tuần nên cả bảy cột bằng nhau cho tới khi có calorie shifting theo ngày.
 */
export function ProgramCard({ program, onEdit }: ProgramCardProps) {
  const week = program.currentWeek
  return (
    <section className="bg-card rounded-2xl p-4 pt-5">
      <h3 className="text-xl font-medium">{program.programType} Program</h3>
      <p className="text-muted-foreground text-base">{formatMonthDay(program.startDate)} - Now</p>

      {week ? (
        <ul aria-label="Daily targets this week" className="mt-5 flex gap-2">
          {DAY_LABELS.map((label, index) => (
            <DayColumn key={index} label={label} week={week} />
          ))}
        </ul>
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
