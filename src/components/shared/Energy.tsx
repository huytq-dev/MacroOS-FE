'use client'

import { useUnits } from '@/features/users/hooks/use-units'

/**
 * Một số năng lượng theo kcal / kJ của user (BE luôn trả kcal): `<Energy kcal={156} />` → "156" hoặc "653". Chỉ in số, làm tròn
 * `digits` chữ số (mặc định 0); thiếu số thì "—". Chữ đơn vị lấy từ `<EnergyUnit />` hoặc `useUnits().energy.unit`.
 */
export function Energy({
  kcal,
  digits,
}: {
  readonly kcal: number | null | undefined
  readonly digits?: number
}) {
  const { energy } = useUnits()
  return <>{energy.format(kcal, digits)}</>
}

/** Chữ đơn vị năng lượng của user: "kcal" hoặc "kJ". */
export function EnergyUnit() {
  const { energy } = useUnits()
  return <>{energy.unit}</>
}
