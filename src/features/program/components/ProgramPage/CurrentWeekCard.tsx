import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ADJUSTMENT_REASON,
  DAY_OF_WEEK,
  DIET_STYLE,
  GOAL_TYPE,
  PROGRAM_TYPE,
  PROTEIN_LEVEL,
} from '@/config/enums'
import { formatDateVi } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Program } from '../../types/program.types'

interface CurrentWeekCardProps {
  readonly program: Program
}

// Màu macro theo bảng MacroFactor (kcal cam, protein xanh dương, carb xanh lá, fat tím)
const macro = (label: string, value: number, unit: string, colorClass: string) => (
  <div key={label} className="bg-secondary rounded-xl px-3 py-2.5">
    <p className={cn('text-[11px] font-medium', colorClass)}>{label}</p>
    <p className="text-lg font-semibold tabular-nums">
      {Math.round(value)} <span className="text-muted-foreground text-xs font-normal">{unit}</span>
    </p>
  </div>
)

export function CurrentWeekCard({ program }: CurrentWeekCardProps) {
  const week = program.currentWeek
  const rate = `${Math.abs(program.weeklyWeightChangeTargetPercent)} %/tuần (${program.weeklyWeightChangeTargetKg > 0 ? '+' : ''}${program.weeklyWeightChangeTargetKg} kg)`
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Target tuần này</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{GOAL_TYPE[program.goalType]}</Badge>
          <Badge variant="secondary">{PROGRAM_TYPE[program.programType].split(' — ')[0]}</Badge>
          <Badge variant="secondary">{DIET_STYLE[program.dietStyle].split(' (')[0]}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {week ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {macro('Calories', week.caloriesTarget, 'kcal', 'text-mf-calories')}
            {macro('Protein', week.proteinTarget, 'g', 'text-mf-protein')}
            {macro('Carbs', week.carbsTarget, 'g', 'text-mf-carbs')}
            {macro('Fat', week.fatTarget, 'g', 'text-mf-fat')}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">
            Program Manual: bạn tự đặt target, app không sinh tuần.
          </p>
        )}
        <dl className="text-muted-foreground grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
          <dt>Tốc độ</dt>
          <dd className="text-foreground tabular-nums">{rate}</dd>
          <dt>Protein</dt>
          <dd className="text-foreground tabular-nums">
            {PROTEIN_LEVEL[program.proteinLevel].split(' (')[0]} ({program.proteinGPerKgBodyweight}{' '}
            g/kg)
          </dd>
          <dt>Check-in</dt>
          <dd className="text-foreground">{DAY_OF_WEEK[program.checkInWeekday]}</dd>
          {week && (
            <>
              <dt>Hiệu lực</dt>
              <dd className="text-foreground tabular-nums">
                từ {formatDateVi(week.effectiveFrom)} · {ADJUSTMENT_REASON[week.adjustmentReason]}
                {week.previousCaloriesTarget !== null &&
                  ` · tuần trước ${week.previousCaloriesTarget} kcal`}
              </dd>
            </>
          )}
          {program.calorieFloorKcal !== null && (
            <>
              <dt>Sàn</dt>
              <dd className="text-foreground tabular-nums">{program.calorieFloorKcal} kcal</dd>
            </>
          )}
        </dl>
      </CardContent>
    </Card>
  )
}
