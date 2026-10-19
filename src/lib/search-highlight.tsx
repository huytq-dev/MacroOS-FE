import { Fragment } from 'react'

/** Bỏ dấu + chữ thường từng ký tự: "Muối" → "muoi". */
const fold = (char: string): string => char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/**
 * Tách `text` thành các đoạn, đoạn nào chứa từ khoá tìm kiếm thì `match = true`. So khớp không phân biệt hoa thường và dấu
 * ("muoi" khớp "Muối"); mỗi từ trong `query` được tìm riêng. Không có từ khoá thì trả nguyên chuỗi.
 */
export function splitByQuery(
  text: string,
  query: string | undefined
): { readonly text: string; readonly match: boolean }[] {
  const terms = (query ?? '')
    .split(/\s+/)
    .map((term) => [...term].map(fold).join(''))
    .filter(Boolean)
  if (terms.length === 0) return [{ text, match: false }]

  const chars = [...text]
  // Vị trí bắt đầu của từng ký tự gốc trong chuỗi đã bỏ dấu (một ký tự có thể bỏ dấu thành nhiều hoặc 0 ký tự)
  const starts: number[] = []
  let joined = ''
  for (const char of chars) {
    starts.push(joined.length)
    joined += fold(char)
  }
  const marked = new Array<boolean>(chars.length).fill(false)
  for (const term of terms) {
    for (let at = joined.indexOf(term); at !== -1; at = joined.indexOf(term, at + 1)) {
      chars.forEach((_, index) => {
        if (starts[index] >= at && starts[index] < at + term.length) marked[index] = true
      })
    }
  }

  const parts: { text: string; match: boolean }[] = []
  chars.forEach((char, index) => {
    const last = parts[parts.length - 1]
    if (last && last.match === marked[index]) last.text += char
    else parts.push({ text: char, match: marked[index] })
  })
  return parts
}

/** Tên có từ khoá tìm kiếm được in đậm (vd. "Salt" trong "Rice White Cooked Without Salt"). */
export function HighlightedText({
  text,
  query,
}: {
  readonly text: string
  readonly query?: string
}) {
  return (
    <>
      {splitByQuery(text, query).map((part, index) => (
        <Fragment key={index}>
          {part.match ? <strong className="font-bold">{part.text}</strong> : part.text}
        </Fragment>
      ))}
    </>
  )
}
