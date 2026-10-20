import type { TapeField } from './types/body-metrics.types'

export interface TapeGroup {
  readonly title: 'Upper Body' | 'Arms' | 'Legs'
  readonly fields: readonly { readonly key: TapeField; readonly label: string }[]
}

/** Thứ tự và tên số đo vòng như MacroFactor; dùng chung cho bảng nhập Full Body, All Metrics và Compare. */
export const TAPE_GROUPS: readonly TapeGroup[] = [
  {
    title: 'Upper Body',
    fields: [
      { key: 'neckCm', label: 'Neck' },
      { key: 'shouldersCm', label: 'Shoulders' },
      { key: 'bustCm', label: 'Bust' },
      { key: 'chestCm', label: 'Chest' },
      { key: 'waistCm', label: 'Waist' },
      { key: 'hipCm', label: 'Hips' },
    ],
  },
  {
    title: 'Arms',
    fields: [
      { key: 'leftArmCm', label: 'Left Bicep' },
      { key: 'rightArmCm', label: 'Right Bicep' },
      { key: 'leftForearmCm', label: 'Left Forearm' },
      { key: 'rightForearmCm', label: 'Right Forearm' },
      { key: 'leftWristCm', label: 'Left Wrist' },
      { key: 'rightWristCm', label: 'Right Wrist' },
    ],
  },
  {
    title: 'Legs',
    fields: [
      { key: 'leftThighCm', label: 'Left Thigh' },
      { key: 'rightThighCm', label: 'Right Thigh' },
      { key: 'leftCalfCm', label: 'Left Calf' },
      { key: 'rightCalfCm', label: 'Right Calf' },
      { key: 'leftAnkleCm', label: 'Left Ankle' },
      { key: 'rightAnkleCm', label: 'Right Ankle' },
    ],
  },
]
