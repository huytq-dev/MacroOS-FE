import type { AiDish, ResolvedIngredient } from '../../types/food-log.types'

// ponytail: dữ liệu mẫu để xem thiết kế khi BE chưa có API AI; xoá file này (và nút "Preview sample") khi BE có endpoint.
export const SAMPLE_AI_PLATE: {
  readonly dishes: AiDish[]
  readonly resolved: Record<string, ResolvedIngredient>
} = {
  dishes: [
    {
      id: 'dish-1',
      name: 'Sizzling Beef with Egg',
      ingredients: [
        { id: 'ing-1', name: 'Beef', grams: 150 },
        { id: 'ing-2', name: 'Egg', grams: 50 },
        { id: 'ing-3', name: 'Onion', grams: 30 },
        { id: 'ing-4', name: 'Secret sauce', grams: 20 },
      ],
    },
    {
      id: 'dish-2',
      name: 'Steamed Rice',
      ingredients: [{ id: 'ing-5', name: 'White rice', grams: 180 }],
    },
  ],
  resolved: {
    'ing-1': {
      matched: true,
      foodItemId: null,
      foodName: 'Beef, sirloin, grilled',
      emoji: '🥩',
      quantity: 1,
      unitLabel: 'serving',
      weightGrams: 150,
      calories: 380,
      protein: 40,
      fat: 24,
      carbs: 0,
    },
    'ing-2': {
      matched: true,
      foodItemId: null,
      foodName: 'Egg, fried',
      emoji: '🍳',
      quantity: 1,
      unitLabel: 'large',
      weightGrams: 50,
      calories: 90,
      protein: 6,
      fat: 7,
      carbs: 0,
    },
    'ing-3': {
      matched: true,
      foodItemId: null,
      foodName: 'Onion, sautéed',
      emoji: '🧅',
      quantity: 30,
      unitLabel: 'g',
      weightGrams: 30,
      calories: 19,
      protein: 0,
      fat: 1,
      carbs: 4,
      estimated: true,
    },
    'ing-4': {
      matched: false,
      foodItemId: null,
      foodName: null,
      emoji: null,
      quantity: 0,
      unitLabel: 'g',
      weightGrams: 0,
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    },
    'ing-5': {
      matched: true,
      foodItemId: null,
      foodName: 'Rice, white, cooked',
      emoji: '🍚',
      quantity: 1,
      unitLabel: 'cup',
      weightGrams: 180,
      calories: 234,
      protein: 4,
      fat: 0,
      carbs: 51,
    },
  },
}
