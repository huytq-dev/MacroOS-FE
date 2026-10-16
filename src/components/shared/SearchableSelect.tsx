'use client'

import { useId, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { filterOptions, type SearchableOption } from './searchable-options'

interface SearchableSelectProps {
  readonly options: readonly SearchableOption[]
  readonly value: string
  readonly onValueChange: (value: string) => void
  readonly placeholder?: string
  /** Trường không bắt buộc: thêm dòng bỏ chọn ở đầu danh sách; `onValueChange` nhận chuỗi rỗng. */
  readonly clearLabel?: string
  readonly emptyText?: string
  readonly disabled?: boolean
  readonly id?: string
  readonly 'aria-invalid'?: boolean
  readonly 'aria-describedby'?: string
}

/**
 * Ô chọn có tìm kiếm (UI.md mục 1): gõ ngay trong ô, danh sách lọc không phân biệt dấu.
 * Bàn phím: mũi tên chọn dòng, Enter chọn, Escape đóng.
 */
export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Chọn...',
  clearLabel,
  emptyText = 'Không có kết quả phù hợp',
  disabled,
  id,
  ...aria
}: SearchableSelectProps) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const selected = options.find((option) => option.value === value)
  const filtered = filterOptions(options, query)
  const items: SearchableOption[] =
    clearLabel && !query ? [{ value: '', label: clearLabel }, ...filtered] : filtered

  const close = () => {
    setOpen(false)
    setQuery('')
  }
  const choose = (next: string) => {
    onValueChange(next)
    close()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => Math.min(current + 1, items.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter' && open && items[activeIndex]) {
      event.preventDefault()
      choose(items[activeIndex].value)
    }
  }

  return (
    <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            {...aria}
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            disabled={disabled}
            value={open ? query : (selected?.label ?? '')}
            placeholder={open && selected ? selected.label : placeholder}
            className="pr-9"
            onClick={() => setOpen(true)}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
              setOpen(true)
            }}
            onKeyDown={onKeyDown}
          />
          <ChevronDown
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-(--radix-popper-anchor-width) p-1"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <ScrollArea className="max-h-60 overscroll-contain">
          <ul id={listId} role="listbox" className="space-y-0.5">
            {items.length === 0 && (
              <li className="text-muted-foreground px-2 py-3 text-center text-sm">{emptyText}</li>
            )}
            {items.map((item, index) => (
              <li
                key={item.value || '__clear'}
                role="option"
                aria-selected={item.value === value}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(item.value)}
                className={cn(
                  'flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                  index === activeIndex && 'bg-muted',
                  item.value === '' && 'text-muted-foreground'
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{item.label}</span>
                  {item.description && (
                    <span className="text-muted-foreground block truncate text-[11px]">
                      {item.description}
                    </span>
                  )}
                </span>
                {item.value === value && item.value !== '' && (
                  <Check aria-hidden="true" className="size-4 shrink-0" />
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
