import { redirect } from 'next/navigation'
import { routePath } from '@/config/route-path'

/** `/program/goal/edit` vào thẳng màn đặt cân nặng đích và tốc độ. */
export default function GoalEditRoute() {
  redirect(`${routePath.programGoalEdit}/params`)
}
