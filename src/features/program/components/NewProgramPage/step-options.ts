import { Compass, CalendarDays, Equal, PencilLine, Users } from 'lucide-react'
import type { ProgramType } from '@/config/enums'
import type { ChoiceOption } from '@/features/onboarding/types/onboarding-options.types'

/** Lựa chọn riêng của New Program (các lựa chọn diet / sàn calo / training / phân bổ / protein dùng lại của onboarding). */
export const STYLE_OPTIONS: readonly ChoiceOption<ProgramType>[] = [
  {
    value: 'Coached',
    label: 'Coached',
    description:
      "We'll design your Calorie targets and macro program, adjusting weekly based on your data.",
    icon: Compass,
  },
  {
    value: 'Collaborative',
    label: 'Collaborative',
    description: "Set your own macro targets and we'll adjust your Calorie budget each week.",
    icon: Users,
  },
  {
    value: 'Manual',
    label: 'Manual',
    description: 'Set your own macro and Calorie targets using manual entry.',
    icon: PencilLine,
  },
]

export const SAME_DIFFERENT_OPTIONS: readonly ChoiceOption<'same' | 'different'>[] = [
  {
    value: 'same',
    label: 'Same targets all week',
    description: 'One set of Calorie and macro targets for every day.',
    icon: Equal,
  },
  {
    value: 'different',
    label: 'Different targets per day',
    description: 'Set Calorie and macro targets for each day separately.',
    icon: CalendarDays,
  },
]
