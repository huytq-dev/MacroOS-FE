import { Pencil, Plus } from 'lucide-react'
import type { GoalType } from '@/config/enums'
import { routePath } from '@/config/route-path'
import { formatMonthDay } from '@/lib/date'
import type { Program } from '../../types/program.types'
import { ActionChip } from './ActionChip'

const TITLE: Record<GoalType, string> = {
  WeightLoss: 'Weight Loss Goal',
  Maintenance: 'Maintenance Goal',
  WeightGain: 'Weight Gain Goal',
}

interface GoalCardProps {
  readonly program: Program
}

function Stat({
  value,
  unit,
  label,
}: {
  readonly value: string
  readonly unit?: string
  readonly label: string
}) {
  return (
    <div>
      <p className="text-[32px] leading-none tabular-nums">
        {value}
        {unit && <span className="text-muted-foreground ml-1 text-base">{unit}</span>}
      </p>
      <p className="text-muted-foreground mt-1.5 text-base">{label}</p>
    </div>
  )
}

/**
 * Thẻ "<Loại> Goal" của tab Strategy (như MacroFactor): tên + khoảng ngày, ba số (Goal Weight, Goal Rate kg, Goal Rate %) và hai
 * nút New Goal / Edit Goal. Duy trì cân thì không có tốc độ nên chỉ hiện cân mục tiêu.
 */
export function GoalCard({ program }: GoalCardProps) {
  const maintaining = program.goalType === 'Maintenance'
  const sign = program.goalType === 'WeightLoss' ? '−' : '+'
  const target = program.targetWeightKg
  return (
    <section className="bg-card rounded-2xl p-4 pt-5">
      <h3 className="text-xl font-medium">{TITLE[program.goalType]}</h3>
      <p className="text-muted-foreground text-base">{formatMonthDay(program.startDate)} - Now</p>

      <div className="mt-5 flex items-start justify-between gap-3">
        <Stat value={target === null ? '—' : target.toFixed(1)} unit="kg" label="Goal Weight" />
        {!maintaining && (
          <>
            <Stat
              value={`${sign}${Math.abs(program.weeklyWeightChangeTargetKg).toFixed(2)}`}
              unit="kg"
              label="Goal Rate"
            />
            <Stat
              value={`${sign}${Math.abs(program.weeklyWeightChangeTargetPercent).toFixed(1)}`}
              unit="%"
              label="Goal Rate"
            />
          </>
        )}
      </div>

      <div className="border-border mt-5 flex flex-wrap gap-2 border-t pt-4">
        <ActionChip icon={Plus} label="New Goal" href={routePath.programNew} />
        <ActionChip icon={Pencil} label="Edit Goal" href={routePath.programGoalEdit} />
      </div>
    </section>
  )
}
