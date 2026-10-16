export interface SearchableOption {
  readonly value: string
  readonly label: string
  readonly description?: string
}

/** Bỏ dấu tiếng Việt để tìm `ha noi` ra `Hà Nội` (UI.md mục 1). */
export const normalizeSearchText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()

export const filterOptions = (
  options: readonly SearchableOption[],
  query: string
): SearchableOption[] => {
  const needle = normalizeSearchText(query)
  if (!needle) return [...options]
  return options.filter((option) =>
    normalizeSearchText(`${option.label} ${option.description ?? ''}`).includes(needle)
  )
}
