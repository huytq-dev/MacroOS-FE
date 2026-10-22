import { z } from 'zod'

const minutes = (label: string) =>
  z
    .number({ error: `Enter whole minutes for ${label}` })
    .int(`Enter whole minutes for ${label}`)
    .min(0, `${label} can't be negative`)
    .max(1440, `${label} is at most 1440 minutes`)
    .optional()

// Khớp BE CreateRecipeCommandValidator: tên ≤ 256, 1–100 khẩu phần, ≥ 1 nguyên liệu, quantity mỗi nguyên liệu 0.01–10000
// (foodServingId null = quantity là gram, BE giữ đúng số gram); khối lượng sau nấu 0.1–100000 g; thời gian 0–1440 phút;
// link http(s) ≤ 500; mô tả ≤ 1500; tối đa 50 bước, mỗi bước 1–300 ký tự
export const recipeSchema = z.object({
  name: z.string().trim().min(1, 'Enter a recipe name').max(256, 'Max 256 characters'),
  servingsCount: z
    .number({ error: 'Enter the serving quantity' })
    .int('Whole servings only')
    .min(1, 'At least 1')
    .max(100, 'Max 100'),
  ingredients: z
    .array(
      z.object({
        foodItemId: z.string(),
        foodServingId: z.string().nullable(),
        quantity: z
          .number({ error: 'Enter an amount for every ingredient' })
          .min(0.01, 'Amounts must be at least 0.01')
          .max(10000, 'Amounts must be at most 10000'),
      })
    )
    .min(1, 'Add at least one ingredient'),
  cookedYieldGrams: z
    .number({ error: 'Enter the total weight in grams' })
    .min(0.1, 'Total weight must be at least 0.1 g')
    .max(100000, 'Total weight is at most 100000 g')
    .optional(),
  prepTimeMinutes: minutes('preparation time'),
  cookTimeMinutes: minutes('cooking time'),
  sourceUrl: z
    .string()
    .trim()
    .max(500, 'Link is at most 500 characters')
    .regex(/^https?:\/\/\S+$/i, 'Link must start with http:// or https://')
    .optional(),
  description: z.string().max(1500, 'Description is at most 1500 characters').optional(),
  steps: z
    .array(z.object({ text: z.string().trim().min(1, 'Describe the step').max(300) }))
    .max(50, 'At most 50 steps')
    .optional(),
  iconKey: z.string().optional(),
})
