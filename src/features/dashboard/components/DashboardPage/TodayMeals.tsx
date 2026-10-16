import { Plus } from 'lucide-react'
import { ListRow, ListSection } from '@/components/shared/ListGroup'
import { MEAL_TYPE, type MealType } from '@/config/enums'
import { routePath } from '@/config/route-path'
import type { FoodLogEntry } from '@/features/food-log/types/food-log.types'

interface TodayMealsProps {
  readonly entries: FoodLogEntry[]
  readonly onAddFood: () => void
}

const MEAL_ORDER = Object.keys(MEAL_TYPE) as MealType[]

/** Các bữa đã có món hôm nay: tên món rút gọn, kcal bên phải; chạm sang Nhật ký. Dòng cuối thêm món. */
export function TodayMeals({ entries, onAddFood }: TodayMealsProps) {
  const meals = MEAL_ORDER.map((meal) => {
    const items = entries.filter((entry) => entry.mealType === meal)
    return { meal, items, kcal: items.reduce((sum, entry) => sum + entry.calories, 0) }
  }).filter((group) => group.items.length > 0)

  return (
    <ListSection label="Bữa ăn hôm nay">
      {meals.map(({ meal, items, kcal }) => (
        <ListRow
          key={meal}
          label={MEAL_TYPE[meal]}
          hint={items.map((entry) => entry.foodName).join(', ')}
          value={<span className="text-foreground font-bold tabular-nums">{Math.round(kcal)}</span>}
          href={routePath.foodLog}
        />
      ))}
      <ListRow
        label={meals.length === 0 ? 'Chưa có món nào, thêm món đầu tiên' : 'Thêm món'}
        leading={<Plus aria-hidden="true" className="size-5" />}
        onClick={onAddFood}
        className="font-semibold"
      />
    </ListSection>
  )
}
