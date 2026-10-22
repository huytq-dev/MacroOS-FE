'use client'

import { useMemo } from 'react'
import type { DayOfWeek } from '@/config/enums'
import {
  energyMeasure,
  unitsOf,
  weightMeasure,
  type EnergyUnit,
  type Measure,
  type WeightUnit,
} from '@/lib/units'
import { useProfile } from './use-profile'

export interface UnitsView {
  /** Cân nặng ở đơn vị user chọn (BE luôn kg): `weight.text(79.3)` → "79.3 kg" / "174.8 lb"; `weight.unit` là "kg" / "lb". */
  readonly weight: Measure<WeightUnit>
  /** Năng lượng ở đơn vị user chọn (BE luôn kcal): `energy.text(2861)` → "2861 kcal" / "11970 kJ"; `energy.unit` là "kcal" / "kJ". */
  readonly energy: Measure<EnergyUnit>
  /** Ngày đầu tuần của mọi dải tuần / thống kê tuần. */
  readonly weekStartDay: DayOfWeek
}

/**
 * Đơn vị hiển thị của user (cân nặng kg / lb, năng lượng kcal / kJ, ngày đầu tuần) đọc từ hồ sơ `GET /users/me` — cùng một query với
 * trang Profile nên đổi cài đặt là mọi màn đổi theo ngay. Hồ sơ chưa tải xong thì dùng mặc định của BE (Metric, Kcal, Monday).
 */
export function useUnits(): UnitsView {
  const profile = useProfile().data
  const unitPreference = profile?.unitPreference
  const energyUnit = profile?.energyUnit
  const weekStartDay = profile?.weekStartDay
  return useMemo(() => {
    const units = unitsOf({ unitPreference, energyUnit, weekStartDay })
    return {
      weight: weightMeasure(units.weight),
      energy: energyMeasure(units.energy),
      weekStartDay: units.weekStartDay,
    }
  }, [unitPreference, energyUnit, weekStartDay])
}
