import { z } from 'zod'

// Khớp BE CreateRecipeCommandValidator: tên ≤ 256, 1–100 khẩu phần, ≥ 1 nguyên liệu, quantity mỗi nguyên liệu 0.01–10000
// (foodServingId null = quantity là gram, BE giữ đúng số gram)
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
})

export type RecipePayload = z.infer<typeof recipeSchema>
