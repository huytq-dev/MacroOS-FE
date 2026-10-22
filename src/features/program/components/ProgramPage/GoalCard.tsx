import { Pencil, Plus } from 'lucide-react'
import { routePath } from '@/config/route-path'
import { useUnits } from '@/features/users/hooks/use-units'
import { formatMonthDay } from '@/lib/date'
import type { Program } from '../../types/program.types'
import { goalTitleOf, kgRateSign, percentRateSign } from '../../utils/goal-display'
import { ActionChip } from './ActionChip'

interface GoalCardProps {
  readonly program: Program
}

function Stat({
  value,
  unit,
  label,
  className,
}: {
  readonly value: string
  readonly unit?: string
  readonly label: string
  readonly className?: string
}) {
  return (
    <div className={className}>
      <p className="text-[32px] leading-none whitespace-nowrap tabular-nums">
        {value}
        {unit && <span className="text-muted-foreground ml-1 text-base">{unit}</span>}
      </p>
      <p className="text-muted-foreground mt-1.5 text-base whitespace-nowrap">{label}</p>
    </div>
  )
}

/**
 * Thẻ "<Loại> Goal" của tab Strategy (như MacroFactor): tên + khoảng ngày, ba số (Goal Weight, "Per Week" = cân mỗi tuần, Goal Rate = % BW mỗi
 * tuần: hai nhãn lấy từ màn Goal của MacroFactor, "Per Week" là hàng kg | % BW và "Goal Rate +x% BW per week" là bảng tóm tắt) và hai nút
 * New Goal / Edit Goal. Duy trì cân thì không có tốc độ nên chỉ hiện cân mục tiêu. Ba số nằm một hàng khi đủ chỗ; hẹp hơn (~19rem, điện thoại
 * 360px trở xuống) thì Goal Weight chiếm một hàng riêng và hai tốc độ nằm hàng dưới, không bao giờ bị cắt ở mép phải (kể cả số lb dài).
 */
export function GoalCard({ program }: GoalCardProps) {
  const { weight } = useUnits()
  const maintaining = program.goalType === 'Maintenance'
  const target = program.targetWeightKg
  return (
    <section className="bg-card rounded-2xl p-4 pt-5">
      <h3 className="text-xl font-medium">{goalTitleOf(program.goalType)}</h3>
      <p className="text-muted-foreground text-base">{formatMonthDay(program.startDate)} - Now</p>

      <div className="@container mt-5">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-4">
          <Stat
            className="@max-[19rem]:basis-full"
            value={weight.format(target)}
            unit={weight.unit}
            label="Goal Weight"
          />
          {!maintaining && (
            <>
              <Stat
                value={`${kgRateSign(program.weeklyWeightChangeTargetKg)}${weight.format(Math.abs(program.weeklyWeightChangeTargetKg), 2)}`}
                unit={weight.unit}
                label="Per Week"
              />
              <Stat
                value={`${percentRateSign(program.weeklyWeightChangeTargetPercent)}${Math.abs(program.weeklyWeightChangeTargetPercent).toFixed(1)}`}
                unit="%"
                label="Goal Rate"
              />
            </>
          )}
        </div>
      </div>

      <div className="border-border mt-5 flex flex-wrap gap-2 border-t pt-4">
        <ActionChip icon={Plus} label="New Goal" href={routePath.programNew} />
        <ActionChip icon={Pencil} label="Edit Goal" href={routePath.programGoalEdit} />
      </div>
    </section>
  )
}
