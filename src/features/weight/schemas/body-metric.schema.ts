import { z } from 'zod'
import { weightMeasure, type WeightUnit } from '@/lib/units'

// Khớp BE UpsertWeightEntryCommandValidator (20–400 kg)
const WEIGHT_KG = { min: 20, max: 400 } as const

/**
 * Giới hạn cân nặng theo đơn vị user nhập: kg đúng của BE; lb là kg đổi bằng hằng số chung rồi làm tròn VÀO TRONG khoảng (1 chữ số),
 * nên số lb nào hợp lệ ở đây cũng đổi ra kg mà BE nhận.
 */
export const weightLimits = (unit: WeightUnit) => {
  if (unit === 'kg') return WEIGHT_KG
  const lb = weightMeasure('lb')
  return {
    min: Math.ceil(lb.convert(WEIGHT_KG.min) * 10) / 10,
    max: Math.floor(lb.convert(WEIGHT_KG.max) * 10) / 10,
  }
}

export const weightValueSchema = (unit: WeightUnit) => {
  const { min, max } = weightLimits(unit)
  return z.number().min(min, `At least ${min} ${unit}`).max(max, `Max ${max} ${unit}`)
}

// Khớp BE UpsertBodyFatCommandValidator (2–70 %)
export const bodyFatValueSchema = z.number().min(2, 'At least 2%').max(70, 'Max 70%')

// Khớp BE UpsertMeasurementCommandValidator: khoảng cm theo từng số đo (BodyMeasurementCatalog)
export const measurementValueSchema = (min: number, max: number) =>
  z.number().min(min, `At least ${min} cm`).max(max, `Max ${max} cm`)
