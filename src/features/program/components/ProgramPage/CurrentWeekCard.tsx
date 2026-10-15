import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ADJUSTMENT_REASON, DAY_OF_WEEK, DIET_STYLE, GOAL_TYPE, PROGRAM_TYPE, PROTEIN_LEVEL } from '@/config/enums'
import { formatDateVi } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Program } from '../../types/program.types'

interface CurrentWeekCardProps {
  readonly program: Program
}

// Màu macro theo bảng MacroFactor (kcal cam, protein xanh dương, carb xanh lá, fat tím)
const macro = (label: string, value: number, unit: string, colorClass: string) => (
  <div key={label} className={cn('rounded-md border border-l-4 px-3 py-2', colorClass)}>
    <p className="text-muted-foreground text-[11px]">{label}</p>
    <p className="text-lg font-semibold tabular-nums">
      {Math.round(value)} <span className="text-muted-foreground text-xs font-normal">{unit}</span>
    </p>
  </div>
)

export function CurrentWeekCard({ program }: CurrentWeekCardProps) {
  const week = program.currentWeek
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Target tuần này</CardTitle>
        <CardDescription>
          {GOAL_TYPE[program.goalType]} · {Math.abs(program.weeklyWeightChangeTargetPercent)} %/tuần (
          {program.weeklyWeightChangeTargetKg > 0 ? '+' : ''}
          {program.weeklyWeightChangeTargetKg} kg) · {PROGRAM_TYPE[program.programType].split(' — ')[0]} ·{' '}
          {DIET_STYLE[program.dietStyle].split(' (')[0]} · protein {PROTEIN_LEVEL[program.proteinLevel].split(' (')[0]} (
          {program.proteinGPerKgBodyweight} g/kg) · check-in {DAY_OF_WEEK[program.checkInWeekday]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {week ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {macro('Calories', week.caloriesTarget, 'kcal', 'border-l-mf-calories')}
              {macro('Protein', week.proteinTarget, 'g', 'border-l-mf-protein')}
              {macro('Carbs', week.carbsTarget, 'g', 'border-l-mf-carbs')}
              {macro('Fat', week.fatTarget, 'g', 'border-l-mf-fat')}
            </div>
            <p className="text-muted-foreground text-[11px]">
              Hiệu lực từ {formatDateVi(week.effectiveFrom)} · {ADJUSTMENT_REASON[week.adjustmentReason]}
              {week.previousCaloriesTarget !== null && ` · tuần trước ${week.previousCaloriesTarget} kcal`}
              {program.calorieFloorKcal !== null && ` · sàn ${program.calorieFloorKcal} kcal`}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">Program Manual: bạn tự đặt target, app không sinh tuần.</p>
        )}
      </CardContent>
    </Card>
  )
}
