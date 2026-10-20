// Khớp BE Application/Features/BodyMetrics/FullBody/BodyMeasurementCatalog.cs (khoá API, nhãn, khoảng hợp lệ cm)
export const BODY_MEASUREMENTS = [
  { key: 'neck', label: 'Neck', min: 20, max: 70 },
  { key: 'shoulders', label: 'Shoulders', min: 60, max: 200 },
  { key: 'bust', label: 'Bust', min: 50, max: 200 },
  { key: 'chest', label: 'Chest', min: 50, max: 200 },
  { key: 'waist', label: 'Waist', min: 40, max: 250 },
  { key: 'hips', label: 'Hips', min: 50, max: 250 },
  { key: 'leftBicep', label: 'Left Bicep', min: 10, max: 80 },
  { key: 'rightBicep', label: 'Right Bicep', min: 10, max: 80 },
  { key: 'leftForearm', label: 'Left Forearm', min: 10, max: 60 },
  { key: 'rightForearm', label: 'Right Forearm', min: 10, max: 60 },
  { key: 'leftWrist', label: 'Left Wrist', min: 8, max: 35 },
  { key: 'rightWrist', label: 'Right Wrist', min: 8, max: 35 },
  { key: 'leftThigh', label: 'Left Thigh', min: 20, max: 120 },
  { key: 'rightThigh', label: 'Right Thigh', min: 20, max: 120 },
  { key: 'leftCalf', label: 'Left Calf', min: 15, max: 80 },
  { key: 'rightCalf', label: 'Right Calf', min: 15, max: 80 },
  { key: 'leftAnkle', label: 'Left Ankle', min: 10, max: 45 },
  { key: 'rightAnkle', label: 'Right Ankle', min: 10, max: 45 },
] as const

export type BodyMeasurement = (typeof BODY_MEASUREMENTS)[number]
export type MeasurementKey = BodyMeasurement['key']

/** Khoá trên URL (`/body-metrics/leftBicep`), không phân biệt hoa thường như BE. */
export const findMeasurement = (key: string) =>
  BODY_MEASUREMENTS.find((item) => item.key.toLowerCase() === key.toLowerCase())
