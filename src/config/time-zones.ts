import type { SearchableOption } from '@/components/shared/searchable-options'

// Múi giờ thường dùng; danh mục có thể mở rộng nên chọn bằng SearchableSelect (UI.md mục 1)
export const TIME_ZONE_OPTIONS: readonly SearchableOption[] = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Vietnam (Ho Chi Minh City)', description: 'UTC+7' },
  { value: 'Asia/Bangkok', label: 'Bangkok', description: 'UTC+7' },
  { value: 'Asia/Singapore', label: 'Singapore', description: 'UTC+8' },
  { value: 'Asia/Shanghai', label: 'Shanghai', description: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'Tokyo', description: 'UTC+9' },
  { value: 'Asia/Seoul', label: 'Seoul', description: 'UTC+9' },
  { value: 'Australia/Sydney', label: 'Sydney', description: 'UTC+10/+11' },
  { value: 'Europe/London', label: 'London', description: 'UTC+0/+1' },
  { value: 'Europe/Paris', label: 'Paris', description: 'UTC+1/+2' },
  { value: 'America/New_York', label: 'New York', description: 'UTC-5/-4' },
  { value: 'America/Los_Angeles', label: 'Los Angeles', description: 'UTC-8/-7' },
  { value: 'UTC', label: 'UTC', description: 'UTC+0' },
]
