import { z } from 'zod'
import { FOOD_CATEGORY } from '@/config/enums'

const macro = (label: string, max: number) => z.number({ error: `Nhập ${label}` }).min(0, 'Không âm').max(max, `Tối đa ${max}`)

// Khớp BE FoodNutritionValidator + CustomFoodRules (P+C+F ≤ 105 g/100 g)
export const customFoodSchema = z
  .object({
    name: z.string().min(1, 'Nhập tên').max(256),
    brand: z.string().max(256).optional(),
    category: z.enum(Object.keys(FOOD_CATEGORY) as [keyof typeof FOOD_CATEGORY, ...(keyof typeof FOOD_CATEGORY)[]]),
    caloriesPer100g: macro('kcal', 900),
    proteinPer100g: macro('protein', 100),
    carbsPer100g: macro('carb', 100),
    fatPer100g: macro('fat', 100),
    servingName: z.string().max(100).optional(),
    servingGrams: z.number().min(0.1, 'Từ 0.1 g').max(10000, 'Tối đa 10000 g').optional(),
  })
  .refine((v) => v.proteinPer100g + v.carbsPer100g + v.fatPer100g <= 105, {
    message: 'Protein + carb + fat trên 100 g không vượt 100 g',
    path: ['fatPer100g'],
  })

export type CustomFoodFormValues = z.infer<typeof customFoodSchema>
