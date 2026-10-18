import { z } from 'zod'

// Khớp BE CreateRecipeCommandValidator: tên ≤ 256, 1–100 khẩu phần, ≥ 1 nguyên liệu, quantity mỗi nguyên liệu 0.01–10000
export const recipeSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(256, 'Max 256 characters'),
  servingsCount: z
    .number({ error: 'Enter servings' })
    .int('Whole servings only')
    .min(1, 'At least 1')
    .max(100, 'Max 100'),
  ingredients: z
    .array(
      z.object({
        foodItemId: z.string(),
        foodServingId: z.string(),
        // Chỉ để hiển thị dòng nguyên liệu, không gửi lên BE
        name: z.string(),
        servingName: z.string(),
        quantity: z
          .number({ error: 'Enter an amount' })
          .min(0.01, 'At least 0.01')
          .max(10000, 'Max 10000'),
      })
    )
    .min(1, 'Add at least one ingredient'),
})

export type RecipeFormValues = z.infer<typeof recipeSchema>
