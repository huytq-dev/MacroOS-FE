'use client'

import { Search, X } from 'lucide-react'
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
}

/** Ô tìm kiếm có biểu tượng (UI.md mục 7: `InputGroup`); nút x xoá nhanh, bàn phím iOS hiện phím "Tìm". */
export function SearchInput({ value, onValueChange, placeholder, ...aria }: SearchInputProps) {
  return (
    <InputGroup className="h-11 rounded-xl md:h-8">
      <InputGroupAddon>
        <Search aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        className="text-base md:text-xs"
        {...aria}
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label="Xoá từ khoá"
            onClick={() => onValueChange('')}
          >
            <X aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
