'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search } from 'lucide-react'
import { useCreateFood, useDeleteFood, useFoodDetail, useFoodSearch, useUpdateFood } from '../hooks/use-foods'
import { customFoodSchema, type CustomFoodFormValues } from '../schemas/custom-food.schema'
import { FoodList } from '../components/FoodList'
import { CustomFoodDialog, FoodDetailDialog } from '../components/FoodsPage'
import type { CustomFoodRequest, FoodDetail } from '../types/food.types'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FOOD_SCOPE, enumOptions, type FoodScope } from '@/config/enums'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'

const PAGE_STEP = 25

const emptyForm: CustomFoodFormValues = {
  name: '',
  brand: '',
  category: 'Other',
  caloriesPer100g: Number.NaN,
  proteinPer100g: Number.NaN,
  carbsPer100g: Number.NaN,
  fatPer100g: Number.NaN,
  servingName: '',
  servingGrams: undefined,
}

export function FoodsPage() {
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<FoodScope>('All')
  const [top, setTop] = useState(PAGE_STEP)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search.trim(), 300)
  const foods = useFoodSearch({ search: debouncedSearch || undefined, scope, top })
  const detail = useFoodDetail(selectedId)
  const createFood = useCreateFood()
  const updateFood = useUpdateFood()
  const deleteFood = useDeleteFood()

  const form = useForm<CustomFoodFormValues>({ resolver: zodResolver(customFoodSchema), defaultValues: emptyForm })

  const openCreate = () => {
    form.reset(emptyForm)
    setEditingId(null)
    setFormOpen(true)
  }

  const openEdit = (food: FoodDetail) => {
    form.reset({
      name: food.name,
      brand: food.brand ?? '',
      category: food.category,
      caloriesPer100g: food.nutrition.caloriesPer100g,
      proteinPer100g: food.nutrition.proteinPer100g,
      carbsPer100g: food.nutrition.carbsPer100g,
      fatPer100g: food.nutrition.fatPer100g,
      servingName: '',
      servingGrams: undefined,
    })
    setEditingId(food.id)
    setSelectedId(null)
    setFormOpen(true)
  }

  const onSubmit = (values: CustomFoodFormValues) => {
    const payload: CustomFoodRequest = {
      name: values.name.trim(),
      brand: values.brand?.trim() || null,
      category: values.category,
      barcode: null,
      nutrition: {
        caloriesPer100g: values.caloriesPer100g,
        proteinPer100g: values.proteinPer100g,
        carbsPer100g: values.carbsPer100g,
        fatPer100g: values.fatPer100g,
      },
      // Bỏ trống khẩu phần: tạo mới → BE tự thêm "100 g"; sửa → giữ khẩu phần cũ
      servings:
        values.servingName?.trim() && values.servingGrams
          ? [{ servingName: values.servingName.trim(), weightInGrams: values.servingGrams, isDefault: true }]
          : null,
    }
    const onSuccess = () => setFormOpen(false)
    if (editingId) updateFood.mutate({ id: editingId, payload }, { onSuccess })
    else createFood.mutate(payload, { onSuccess })
  }

  if (foods.isError) return <ErrorState error={foods.error} onRetry={() => void foods.refetch()} />

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Thực phẩm</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus /> Tạo món
        </Button>
      </div>

      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
        <Input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          placeholder="Tìm theo tên hoặc thương hiệu"
          value={search}
          className="pl-9"
          onChange={(event) => {
            setSearch(event.target.value)
            setTop(PAGE_STEP)
          }}
        />
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {enumOptions(FOOD_SCOPE).map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={scope === option.value}
            onClick={() => {
              setScope(option.value)
              setTop(PAGE_STEP)
            }}
            className={cn(
              'h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors',
              scope === option.value ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="bg-card overflow-hidden rounded-lg border">
        <FoodList
          items={foods.data?.items ? [...foods.data.items] : []}
          totalCount={foods.data?.totalCount ?? null}
          isLoading={foods.isLoading}
          isFetching={foods.isFetching}
          emptyText={debouncedSearch ? 'Không tìm thấy thực phẩm phù hợp.' : 'Chưa có thực phẩm. Tạo món đầu tiên của bạn.'}
          onSelect={(food) => setSelectedId(food.id)}
          onLoadMore={() => setTop((current) => current + PAGE_STEP)}
        />
      </div>

      <FoodDetailDialog
        open={selectedId !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
        food={detail.data ?? undefined}
        isLoading={detail.isLoading}
        isDeleting={deleteFood.isPending}
        onEdit={openEdit}
        onDelete={(id) => deleteFood.mutate(id, { onSuccess: () => setSelectedId(null) })}
      />
      <CustomFoodDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        isEdit={editingId !== null}
        form={form}
        isPending={createFood.isPending || updateFood.isPending}
        onSubmit={onSubmit}
      />
    </div>
  )
}
