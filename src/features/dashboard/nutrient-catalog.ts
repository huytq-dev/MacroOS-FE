import type { NutrientDef, NutrientGroup, TargetKind } from './types/dashboard.types'

const n = (
  key: string,
  name: string,
  unit: NutrientDef['unit'],
  kind: TargetKind,
  period?: string
): NutrientDef => ({ key, name, unit, kind, period })

/**
 * Danh sách nutrient của trang "Dinh dưỡng" theo MacroFactor (Docs/MacroFactor_UI/UI/Dashboard/README.md mục 4.3).
 * Ô có `kind: 'none'` không có target nên chỉ hiện giá trị; còn lại có thanh với vạch target.
 * BE chưa có vi chất: giá trị hôm nay lấy trong `use-dashboard-data` (mock) cho tới khi có API.
 */
export const NUTRIENT_GROUPS: readonly NutrientGroup[] = [
  {
    key: 'macros',
    title: 'Calories & Macros',
    tone: 'bg-zinc-500',
    nutrients: [
      n('macros', 'Macros', 'kcal', 'none', 'Last 7 Days'),
      n('calories', 'Calories', 'kcal', 'target'),
      n('protein', 'Protein', 'g', 'target'),
      n('fat', 'Fat', 'g', 'target'),
      n('carbs', 'Carbs', 'g', 'target'),
    ],
  },
  {
    key: 'carb',
    title: 'Carb Breakdown',
    tone: 'bg-emerald-500',
    nutrients: [
      n('fiber', 'Fiber', 'g', 'floor'),
      n('netCarbs', 'Net (Non-fiber)', 'g', 'none'),
      n('starch', 'Starch', 'g', 'none'),
      n('sugars', 'Sugars', 'g', 'ceiling'),
      n('sugarsAdded', 'Sugars Added', 'g', 'ceiling'),
    ],
  },
  {
    key: 'fat',
    title: 'Fat Breakdown',
    tone: 'bg-amber-500',
    nutrients: [
      n('monounsaturated', 'Monounsaturated Fat', 'g', 'none'),
      n('polyunsaturated', 'Polyunsaturated Fat', 'g', 'none'),
      n('omega3', 'Omega-3', 'g', 'floor'),
      n('omega3Ala', 'Omega-3 ALA', 'g', 'floor'),
      n('omega3Dha', 'Omega-3 DHA', 'g', 'floor'),
      n('omega3Epa', 'Omega-3 EPA', 'g', 'floor'),
      n('omega6', 'Omega-6', 'g', 'floor'),
      n('saturated', 'Saturated Fat', 'g', 'ceiling'),
      n('transFat', 'Trans Fat', 'g', 'ceiling'),
    ],
  },
  {
    key: 'protein',
    title: 'Protein Breakdown',
    tone: 'bg-orange-500',
    nutrients: [
      n('cysteine', 'Cysteine', 'g', 'floor'),
      n('histidine', 'Histidine', 'g', 'floor'),
      n('isoleucine', 'Isoleucine', 'g', 'floor'),
      n('leucine', 'Leucine', 'g', 'floor'),
      n('lysine', 'Lysine', 'g', 'floor'),
      n('methionine', 'Methionine', 'g', 'floor'),
      n('phenylalanine', 'Phenylalanine', 'g', 'floor'),
      n('threonine', 'Threonine', 'g', 'floor'),
      n('tryptophan', 'Tryptophan', 'g', 'floor'),
      n('tyrosine', 'Tyrosine', 'g', 'floor'),
      n('valine', 'Valine', 'g', 'floor'),
    ],
  },
  {
    key: 'vitamins',
    title: 'Vitamins',
    tone: 'bg-violet-500',
    nutrients: [
      n('b1', 'B1 Thiamine', 'mg', 'floor'),
      n('b2', 'B2 Riboflavin', 'mg', 'floor'),
      n('b3', 'B3 Niacin', 'mg', 'floor'),
      n('b5', 'B5 Pantothenic Acid', 'mg', 'floor'),
      n('b6', 'B6 Pyridoxine', 'mg', 'floor'),
      n('b12', 'B12 Cobalamin', 'mcg', 'floor'),
      n('folate', 'Folate', 'mcg', 'floor'),
      n('vitaminA', 'Vitamin A', 'mcg', 'floor'),
      n('vitaminC', 'Vitamin C', 'mg', 'floor'),
      n('vitaminD', 'Vitamin D', 'mcg', 'floor'),
      n('vitaminE', 'Vitamin E', 'mg', 'floor'),
      n('vitaminK', 'Vitamin K', 'mcg', 'floor'),
    ],
  },
  {
    key: 'minerals',
    title: 'Minerals',
    tone: 'bg-rose-600',
    nutrients: [
      n('calcium', 'Calcium', 'mg', 'floor'),
      n('copper', 'Copper', 'mg', 'floor'),
      n('iron', 'Iron', 'mg', 'floor'),
      n('magnesium', 'Magnesium', 'mg', 'floor'),
      n('manganese', 'Manganese', 'mg', 'floor'),
      n('phosphorus', 'Phosphorus', 'mg', 'floor'),
      n('potassium', 'Potassium', 'mg', 'floor'),
      n('selenium', 'Selenium', 'mcg', 'floor'),
      n('sodium', 'Sodium', 'mg', 'ceiling'),
      n('zinc', 'Zinc', 'mg', 'floor'),
    ],
  },
  {
    key: 'other',
    title: 'Other',
    tone: 'bg-sky-500',
    nutrients: [
      n('alcohol', 'Alcohol', 'g', 'ceiling'),
      n('caffeine', 'Caffeine', 'mg', 'ceiling'),
      n('cholesterol', 'Cholesterol', 'mg', 'none'),
      n('choline', 'Choline', 'mg', 'floor'),
      n('water', 'Water', 'g', 'floor'),
    ],
  },
]
