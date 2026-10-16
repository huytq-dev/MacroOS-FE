import { Card } from '@/components/ui/card'
import { MEAL_TYPE, type MealType } from '@/config/enums'
import type { FoodLogEntry } from '../../types/food-log.types'

interface MealSectionProps {
  readonly meal: MealType
  readonly entries: FoodLogEntry[]
  readonly onSelectEntry: (entry: FoodLogEntry) => void
}

const quantityLabel = (entry: FoodLogEntry) =>
  entry.servingName ? `${entry.quantity} × ${entry.servingName}` : `${entry.quantity} g`

export function MealSection({ meal, entries, onSelectEntry }: MealSectionProps) {
  if (entries.length === 0) return null
  const kcal = entries.reduce((sum, entry) => sum + entry.calories, 0)
  return (
    <Card
      className="gap-0 overflow-hidden rounded-2xl py-0"
      role="region"
      aria-label={MEAL_TYPE[meal]}
    >
      <header className="flex items-center justify-between px-4 pt-3 pb-1">
        <h2 className="text-sm font-semibold">{MEAL_TYPE[meal]}</h2>
        <span className="text-muted-foreground text-xs tabular-nums">{Math.round(kcal)} kcal</span>
      </header>
      <ul className="divide-border divide-y">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onSelectEntry(entry)}
              className="hover:bg-muted active:bg-muted focus-visible:ring-ring/50 flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left transition-colors focus-visible:ring-3 focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{entry.foodName}</span>
                <span className="text-muted-foreground block truncate text-xs tabular-nums">
                  {quantityLabel(entry)} · P {Math.round(entry.protein)} · C{' '}
                  {Math.round(entry.carbs)} · F {Math.round(entry.fat)}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {Math.round(entry.calories)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
