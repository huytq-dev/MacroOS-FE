import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Bàn phím iOS tiếng Việt gõ dấu phẩy thập phân ("155,6"): chấp nhận "," như "." ở mọi ô số tự kiểm soát. */
export const normalizeDecimal = (text: string) => text.replace(/,/g, '.')
