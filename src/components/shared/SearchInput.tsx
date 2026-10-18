'use client'

import { Search, X, type LucideIcon } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'

interface SearchInputProps {
  readonly value: string
  readonly onValueChange: (value: string) => void
  readonly placeholder: string
  readonly 'aria-label': string
  /** Biểu tượng bên trái; mặc định kính lúp (ô lọc dùng biểu tượng bộ lọc). */
  readonly icon?: LucideIcon
}

/** Ô tìm kiếm có biểu tượng (UI.md mục 7: `InputGroup`); nút x xoá nhanh, bàn phím iOS hiện phím "Tìm". */
export function SearchInput({
  value,
  onValueChange,
  placeholder,
  icon: Icon = Search,
  ...aria
}: SearchInputProps) {
  return (
    <InputGroup className="bg-secondary md:border-input h-11 rounded-full border-transparent md:h-8 md:rounded-md md:bg-transparent">
      <InputGroupAddon>
        <Icon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        // Ẩn nút x gốc của type="search" (WebKit/Blink) để chỉ còn nút x trắng của app bên dưới
        className="text-base md:text-xs [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        {...aria}
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label="Clear search"
            onClick={() => onValueChange('')}
          >
            <X aria-hidden="true" className="text-foreground" />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
