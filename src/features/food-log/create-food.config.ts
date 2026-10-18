/**
 * Cấu hình trang Create Food (kiểu MacroFactor): danh sách chất, đơn vị phụ, nhóm hàng theo từng kiểu bảng (Non-US / US Label / Food
 * Detail) và khoá chất → mã chất của BE (`NutrientDefinition.Code`). Bốn macro nằm ở cột của món nên không có mã.
 */

export type Basis = 'serving' | '100g' | '100ml'
export type TableMode = 'non-us' | 'us' | 'detail'

export const BASIS_OPTIONS = [
  { value: 'serving', label: 'Serving' },
  { value: '100g', label: '100 g' },
  { value: '100ml', label: '100 ml' },
] as const

export const TABLE_MODES = [
  { value: 'us', label: 'US Label' },
  { value: 'non-us', label: 'Non-US' },
  { value: 'detail', label: 'Food Detail' },
] as const

export const WEIGHT_UNITS = [
  { label: 'g', grams: 1 },
  { label: 'oz', grams: 28.3495 },
] as const

/** Đơn vị phụ của một chất: `factor` nhân với số đã gõ để ra đơn vị gốc của chất. Đơn vị gốc luôn đứng đầu. */
export interface AltUnit {
  readonly label: string
  readonly factor: number
}

export interface NutrientRowDef {
  readonly key: string
  readonly label: string
  /** Đơn vị gốc (nhãn đã nằm trong `label` nếu không có đơn vị phụ). */
  readonly unit: string
  /** Mã chất của BE; null = cột macro của món (calo, đạm, béo, bột đường). */
  readonly code: string | null
  readonly required?: boolean
  readonly indent?: boolean
  readonly alt?: readonly AltUnit[]
  /** Nhãn khi có đơn vị phụ (không kèm đơn vị vì đơn vị nằm trong ô chọn). */
  readonly shortLabel?: string
}

const row = (
  key: string,
  label: string,
  unit: string,
  code: string | null,
  extra: Partial<NutrientRowDef> = {}
): NutrientRowDef => ({ key, label, unit, code, ...extra })

export const NUTRIENT_ROWS: Readonly<Record<string, NutrientRowDef>> = Object.fromEntries(
  [
    row('calories', 'Energy', 'kcal', null, {
      required: true,
      alt: [
        { label: 'kcal', factor: 1 },
        { label: 'kJ', factor: 1 / 4.184 },
      ],
      shortLabel: 'Energy',
    }),
    row('fat', 'Total Fat (g)', 'g', null, { required: true }),
    row('saturated', 'Saturated Fat (g)', 'g', 'fat_saturated_g', { indent: true }),
    row('carbs', 'Total Carbohydrate (g)', 'g', null, { required: true }),
    row('fiber', 'Fiber (g)', 'g', 'fiber_g', { indent: true }),
    row('sugars', 'Sugars (g)', 'g', 'sugars_g', { indent: true }),
    row('protein', 'Protein (g)', 'g', null, { required: true }),
    row('sodium', 'Sodium (mg)', 'mg', 'sodium_mg', {
      alt: [
        { label: 'mg', factor: 1 },
        { label: 'g', factor: 1000 },
      ],
      shortLabel: 'Sodium',
    }),
    row('b1', 'B1, Thiamine (mg)', 'mg', 'vitamin_b1_mg'),
    row('b2', 'B2, Riboflavin (mg)', 'mg', 'vitamin_b2_mg'),
    row('b3', 'B3, Niacin (mg)', 'mg', 'vitamin_b3_mg'),
    row('b5', 'B5, Pantothenic Acid (mg)', 'mg', 'vitamin_b5_mg'),
    row('b6', 'B6, Pyridoxine (mg)', 'mg', 'vitamin_b6_mg'),
    row('b12', 'B12, Cobalamin (mcg)', 'mcg', 'vitamin_b12_mcg'),
    row('folate', 'Folate (mcg)', 'mcg', 'folate_mcg'),
    row('vitaminA', 'Vitamin A (mcg)', 'mcg', 'vitamin_a_mcg', {
      alt: [
        { label: 'mcg', factor: 1 },
        { label: 'IU', factor: 0.3 },
      ],
      shortLabel: 'Vitamin A',
    }),
    row('vitaminC', 'Vitamin C (mg)', 'mg', 'vitamin_c_mg'),
    row('vitaminD', 'Vitamin D (mcg)', 'mcg', 'vitamin_d_mcg', {
      alt: [
        { label: 'mcg', factor: 1 },
        { label: 'IU', factor: 0.025 },
      ],
      shortLabel: 'Vitamin D',
    }),
    row('vitaminE', 'Vitamin E (mg)', 'mg', 'vitamin_e_mg', {
      alt: [
        { label: 'mg', factor: 1 },
        { label: 'IU', factor: 0.67 },
      ],
      shortLabel: 'Vitamin E',
    }),
    row('vitaminK', 'Vitamin K (mcg)', 'mcg', 'vitamin_k_mcg'),
    row('calcium', 'Calcium (mg)', 'mg', 'calcium_mg'),
    row('copper', 'Copper (mg)', 'mg', 'copper_mg'),
    row('iron', 'Iron (mg)', 'mg', 'iron_mg'),
    row('magnesium', 'Magnesium (mg)', 'mg', 'magnesium_mg'),
    row('manganese', 'Manganese (mg)', 'mg', 'manganese_mg'),
    row('phosphorus', 'Phosphorus (mg)', 'mg', 'phosphorus_mg'),
    row('potassium', 'Potassium (mg)', 'mg', 'potassium_mg'),
    row('selenium', 'Selenium (mcg)', 'mcg', 'selenium_mcg'),
    row('zinc', 'Zinc (mg)', 'mg', 'zinc_mg'),
    row('alcohol', 'Alcohol (g)', 'g', 'alcohol_g'),
    row('caffeine', 'Caffeine (mg)', 'mg', 'caffeine_mg'),
    row('cholesterol', 'Cholesterol (mg)', 'mg', 'cholesterol_mg'),
    row('choline', 'Choline (mg)', 'mg', 'choline_mg'),
    row('water', 'Water (g)', 'g', 'water_g'),
    row('starch', 'Starch (g)', 'g', 'starch_g'),
    row('sugarsAdded', 'Sugars Added (g)', 'g', 'sugars_added_g'),
    row('transFat', 'Trans Fat (g)', 'g', 'fat_trans_g'),
    row('monounsaturated', 'Monounsaturated Fat (g)', 'g', 'fat_monounsaturated_g'),
    row('polyunsaturated', 'Polyunsaturated Fat (g)', 'g', 'fat_polyunsaturated_g'),
    row('omega3', 'Omega-3 (g)', 'g', 'omega3_g'),
    row('omega3Ala', 'Omega-3 ALA (g)', 'g', 'omega3_ala_g'),
    row('omega3Dha', 'Omega-3 DHA (g)', 'g', 'omega3_dha_g'),
    row('omega3Epa', 'Omega-3 EPA (g)', 'g', 'omega3_epa_g'),
    row('omega6', 'Omega-6 (g)', 'g', 'omega6_g'),
    row('cysteine', 'Cysteine (g)', 'g', 'cysteine_g'),
    row('histidine', 'Histidine (g)', 'g', 'histidine_g'),
    row('isoleucine', 'Isoleucine (g)', 'g', 'isoleucine_g'),
    row('leucine', 'Leucine (g)', 'g', 'leucine_g'),
    row('lysine', 'Lysine (g)', 'g', 'lysine_g'),
    row('methionine', 'Methionine (g)', 'g', 'methionine_g'),
    row('phenylalanine', 'Phenylalanine (g)', 'g', 'phenylalanine_g'),
    row('threonine', 'Threonine (g)', 'g', 'threonine_g'),
    row('tryptophan', 'Tryptophan (g)', 'g', 'tryptophan_g'),
    row('tyrosine', 'Tyrosine (g)', 'g', 'tyrosine_g'),
    row('valine', 'Valine (g)', 'g', 'valine_g'),
  ].map((def) => [def.key, def])
)

export interface TableGroup {
  readonly title?: string
  readonly keys: readonly string[]
}

const MAIN = ['calories', 'fat', 'saturated', 'carbs', 'fiber', 'sugars', 'protein', 'sodium']
const VITAMINS = [
  'b1',
  'b2',
  'b3',
  'b5',
  'b6',
  'b12',
  'folate',
  'vitaminA',
  'vitaminC',
  'vitaminD',
  'vitaminE',
  'vitaminK',
]
const MINERALS = [
  'calcium',
  'copper',
  'iron',
  'magnesium',
  'manganese',
  'phosphorus',
  'potassium',
  'selenium',
  'zinc',
]
const OTHER = ['alcohol', 'caffeine', 'cholesterol', 'choline', 'water']
const AMINO = [
  'cysteine',
  'histidine',
  'isoleucine',
  'leucine',
  'lysine',
  'methionine',
  'phenylalanine',
  'threonine',
  'tryptophan',
  'tyrosine',
  'valine',
]

/** Nhóm hàng của từng kiểu bảng. Non-US theo ảnh MacroFactor; US Label là bộ chất của nhãn FDA; Food Detail gom theo nhóm của app. */
export const TABLE_GROUPS: Readonly<Record<TableMode, readonly TableGroup[]>> = {
  'non-us': [
    { keys: MAIN },
    { title: 'Vitamins', keys: VITAMINS },
    { title: 'Minerals', keys: MINERALS },
    { title: 'Other', keys: OTHER },
    { title: 'Additional Carb Breakdown', keys: ['starch', 'sugarsAdded'] },
    {
      title: 'Additional Fat Breakdown',
      keys: [
        'transFat',
        'monounsaturated',
        'polyunsaturated',
        'omega3',
        'omega3Ala',
        'omega3Dha',
        'omega3Epa',
        'omega6',
      ],
    },
    { title: 'Protein Breakdown', keys: AMINO },
  ],
  us: [
    {
      keys: [
        'calories',
        'fat',
        'saturated',
        'transFat',
        'cholesterol',
        'sodium',
        'carbs',
        'fiber',
        'sugars',
        'sugarsAdded',
        'protein',
        'vitaminD',
        'calcium',
        'iron',
        'potassium',
      ],
    },
  ],
  detail: [
    { title: 'Calories & Macros', keys: ['calories', 'protein', 'fat', 'carbs'] },
    { title: 'Carb Breakdown', keys: ['fiber', 'starch', 'sugars', 'sugarsAdded'] },
    {
      title: 'Fat Breakdown',
      keys: [
        'saturated',
        'transFat',
        'monounsaturated',
        'polyunsaturated',
        'omega3',
        'omega3Ala',
        'omega3Dha',
        'omega3Epa',
        'omega6',
      ],
    },
    { title: 'Protein Breakdown', keys: AMINO },
    { title: 'Vitamins', keys: VITAMINS },
    { title: 'Minerals', keys: [...MINERALS, 'sodium'] },
    { title: 'Other', keys: OTHER },
  ],
}

/** Giới hạn của BE (CustomFoodRules / FoodNutritionValidator): kcal ≤ 900, macro ≤ 100 g trên 100 g, đạm + bột đường + béo ≤ 105. */
export const LIMITS = { caloriesPer100g: 900, macroPer100g: 100, macroSumPer100g: 105 } as const
