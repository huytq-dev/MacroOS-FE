import type { Metadata } from 'next'
import { CreateFoodPage } from '@/features/food-log/pages/CreateFoodPage'

export const metadata: Metadata = { title: 'Create Food' }

type Search = Promise<{
  from?: string
  name?: string
  calories?: string
  protein?: string
  carbs?: string
  fat?: string
}>

export default async function CreateFoodRoute({ searchParams }: { searchParams: Search }) {
  const { from, name, calories, protein, carbs, fat } = await searchParams
  // "To Custom" từ dòng log không có món trong thư viện (Quick Add / AI): không có `from`, chỉ có tên và macro của dòng đó
  const seed =
    !from && name
      ? {
          name,
          calories: Number(calories) || 0,
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
        }
      : undefined
  return <CreateFoodPage fromFoodId={from} seed={seed} />
}
