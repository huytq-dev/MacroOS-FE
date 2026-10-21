import type { NutrientDef, NutrientGroup } from './types/dashboard.types'

const n = (key: string, name: string, unit: NutrientDef['unit'], period?: string): NutrientDef => ({
  key,
  name,
  unit,
  period,
})

/**
 * Danh sách nutrient của trang "Dinh dưỡng" theo MacroFactor (Docs/MacroFactor_UI/UI/Dashboard/README.md mục 4.3).
 * Mục tiêu (floor / target / ceiling) KHÔNG nằm ở đây: lấy từ BE theo từng ngày (`GET /nutrients`), thanh vẽ bằng `NutrientGoalBar`.
 * Giá trị hôm nay lấy từ `GET /nutrients?date=` (`use-dashboard-data`, mã BE ở `nutrient-codes.ts`).
 */
export const NUTRIENT_GROUPS: readonly NutrientGroup[] = [
  {
    key: 'macros',
    title: 'Calories & Macros',
    tone: 'bg-zinc-500',
    nutrients: [
      n('macros', 'Macros', 'kcal', 'Last 7 Days'),
      n('calories', 'Calories', 'kcal'),
      n('protein', 'Protein', 'g'),
      n('fat', 'Fat', 'g'),
      n('carbs', 'Carbs', 'g'),
    ],
  },
  {
    key: 'carb',
    title: 'Carb Breakdown',
    tone: 'bg-mf-tile-carbs',
    nutrients: [
      n('fiber', 'Fiber', 'g'),
      n('netCarbs', 'Net (Non-fiber)', 'g'),
      n('starch', 'Starch', 'g'),
      n('sugars', 'Sugars', 'g'),
      n('sugarsAdded', 'Sugars Added', 'g'),
    ],
  },
  {
    key: 'fat',
    title: 'Fat Breakdown',
    tone: 'bg-mf-tile-fat',
    nutrients: [
      n('monounsaturated', 'Monounsaturated Fat', 'g'),
      n('polyunsaturated', 'Polyunsaturated Fat', 'g'),
      n('omega3', 'Omega-3', 'g'),
      n('omega3Ala', 'Omega-3 ALA', 'g'),
      n('omega3Dha', 'Omega-3 DHA', 'g'),
      n('omega3Epa', 'Omega-3 EPA', 'g'),
      n('omega6', 'Omega-6', 'g'),
      n('saturated', 'Saturated Fat', 'g'),
      n('transFat', 'Trans Fat', 'g'),
    ],
  },
  {
    key: 'protein',
    title: 'Protein Breakdown',
    tone: 'bg-mf-tile-protein',
    nutrients: [
      n('cysteine', 'Cysteine', 'g'),
      n('histidine', 'Histidine', 'g'),
      n('isoleucine', 'Isoleucine', 'g'),
      n('leucine', 'Leucine', 'g'),
      n('lysine', 'Lysine', 'g'),
      n('methionine', 'Methionine', 'g'),
      n('phenylalanine', 'Phenylalanine', 'g'),
      n('threonine', 'Threonine', 'g'),
      n('tryptophan', 'Tryptophan', 'g'),
      n('tyrosine', 'Tyrosine', 'g'),
      n('valine', 'Valine', 'g'),
    ],
  },
  {
    key: 'vitamins',
    title: 'Vitamins',
    tone: 'bg-mf-vitamins',
    nutrients: [
      n('b1', 'B1 Thiamine', 'mg'),
      n('b2', 'B2 Riboflavin', 'mg'),
      n('b3', 'B3 Niacin', 'mg'),
      n('b5', 'B5 Pantothenic Acid', 'mg'),
      n('b6', 'B6 Pyridoxine', 'mg'),
      n('b12', 'B12 Cobalamin', 'mcg'),
      n('folate', 'Folate', 'mcg'),
      n('vitaminA', 'Vitamin A', 'mcg'),
      n('vitaminC', 'Vitamin C', 'mg'),
      n('vitaminD', 'Vitamin D', 'mcg'),
      n('vitaminE', 'Vitamin E', 'mg'),
      n('vitaminK', 'Vitamin K', 'mcg'),
    ],
  },
  {
    key: 'minerals',
    title: 'Minerals',
    tone: 'bg-mf-minerals',
    nutrients: [
      n('calcium', 'Calcium', 'mg'),
      n('copper', 'Copper', 'mg'),
      n('iron', 'Iron', 'mg'),
      n('magnesium', 'Magnesium', 'mg'),
      n('manganese', 'Manganese', 'mg'),
      n('phosphorus', 'Phosphorus', 'mg'),
      n('potassium', 'Potassium', 'mg'),
      n('selenium', 'Selenium', 'mcg'),
      n('sodium', 'Sodium', 'mg'),
      n('zinc', 'Zinc', 'mg'),
    ],
  },
  {
    key: 'other',
    title: 'Other',
    tone: 'bg-muted-foreground',
    nutrients: [
      n('alcohol', 'Alcohol', 'g'),
      n('caffeine', 'Caffeine', 'mg'),
      n('cholesterol', 'Cholesterol', 'mg'),
      n('choline', 'Choline', 'mg'),
      n('water', 'Water', 'g'),
    ],
  },
]
