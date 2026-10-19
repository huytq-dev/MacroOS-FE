import { redirect } from 'next/navigation'
import { stepHref } from '@/features/program/utils/new-program-steps'

/** `/program/new` vào thẳng bước đầu của wizard (chọn kiểu program). */
export default function NewProgramRoute() {
  redirect(stepHref('style'))
}
