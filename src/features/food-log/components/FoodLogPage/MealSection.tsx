import { Plus } from 'lucide-react'
import { ListRow, ListSection } from '@/components/shared/ListGroup'
import { MEAL_TYPE, type MealType } from '@/config/enums'
import type { FoodLogEntry } from '../../types/food-log.types'

interface MealSectionProps {
  readonly meal: MealType
  readonly entries: FoodLogEntry[]
  readonly onSelectEntry: (entry: FoodLogEntry) => void
  /** Thêm món thẳng vào bữa này. */
  readonly onAddToMeal: (meal: MealType) => void
}

const quantityLabel = (entry: FoodLogEntry) =>
  entry.servingName ? `${entry.quantity} × ${entry.servingName}` : `${entry.quantity} g`

/** Một bữa: nhãn + tổng kcal phía trên, danh sách món (chạm để sửa), dòng "Thêm món" cuối nhóm. */
export function MealSection({ meal, entries, onSelectEntry, onAddToMeal }: MealSectionProps) {
  if (entries.length === 0) return null
  const kcal = entries.reduce((sum, entry) => sum + entry.calories, 0)
  return (
    <ListSection label={MEAL_TYPE[meal]} labelEnd={`${Math.round(kcal)} kcal`}>
      {entries.map((entry) => (
        <ListRow
          key={entry.id}
          label={entry.foodName}
          hint={`${quantityLabel(entry)} · P ${Math.round(entry.protein)} · C ${Math.round(entry.carbs)} · F ${Math.round(entry.fat)}`}
          value={
            <span className="text-foreground font-bold tabular-nums">
              {Math.round(entry.calories)}
            </span>
          }
          onClick={() => onSelectEntry(entry)}
        />
      ))}
      <ListRow
        label="Thêm món"
        leading={<Plus aria-hidden="true" className="size-5" />}
        onClick={() => onAddToMeal(meal)}
        className="min-h-11 font-semibold"
      />
    </ListSection>
  )
}
