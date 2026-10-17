'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { FocusPicker } from '../components/CustomizePage/FocusPicker'
import { DisplaySheet, TilePickerSheet } from '../components/CustomizePage/TilePickerSheet'
import { TileListSection } from '../components/CustomizePage/TileListSection'
import {
  DEFAULT_LAYOUT,
  SECTIONS,
  moveItem,
  type DashboardLayout,
  type FocusKey,
  type NutrientDisplay,
  type SectionKey,
} from '../dashboard-layout'
import { useDashboardLayout } from '../hooks/use-dashboard-layout'
import { useFlip } from '../hooks/use-flip'
import { IconButton } from '@/components/shared/IconButton'
import { routePath } from '@/config/route-path'

/**
 * "Tuỳ chỉnh Dashboard" (kiểu MacroFactor): bản nháp bố cục chỉ được lưu khi bấm Lưu; quay lại là bỏ thay đổi.
 * Trang tiêu điểm: bật/tắt + dời trái/phải; các nhóm ô: dời nhóm, kéo đổi chỗ ô, thêm/bớt ô.
 */
export function CustomizePage() {
  const router = useRouter()
  const [saved, save] = useDashboardLayout()
  const [draft, setDraft] = useState<DashboardLayout | null>(null)
  const [picker, setPicker] = useState<SectionKey | null>(null)
  const [displayTile, setDisplayTile] = useState<string | null>(null)
  const layout = draft ?? saved
  const sectionRef = useFlip(layout.sections, 'y')
  const update = (patch: Partial<DashboardLayout>) => setDraft({ ...layout, ...patch })

  const toggleFocus = (key: FocusKey, visible: boolean) =>
    update({
      focusHidden: visible
        ? layout.focusHidden.filter((item) => item !== key)
        : [...layout.focusHidden, key],
    })

  const setTiles = (section: SectionKey, tiles: readonly string[]) =>
    update({ tiles: { ...layout.tiles, [section]: tiles } })

  const finish = () => {
    if (draft) save(draft)
    router.push(routePath.dashboard)
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8 pb-16 md:pb-0">
      <div className="bg-card -mx-4 -mt-4 pt-4">
        <header className="grid grid-cols-[2.75rem_1fr_auto] items-center px-1">
          <IconButton
            icon={ChevronLeft}
            label="Back"
            className="size-11"
            onClick={() => router.push(routePath.dashboard)}
          />
          <h1 className="text-center text-lg font-medium">Customize Dashboard</h1>
          <button
            type="button"
            onClick={finish}
            className="focus-visible:ring-ring/50 min-h-11 px-3 text-base font-medium focus-visible:ring-1 focus-visible:outline-none"
          >
            Save
          </button>
        </header>

        <FocusPicker
          order={layout.focus}
          hidden={layout.focusHidden}
          onToggle={toggleFocus}
          onMove={(index, delta) => update({ focus: moveItem(layout.focus, index, delta) })}
        />
      </div>

      {layout.sections.map((section, index) => (
        <div key={section} ref={sectionRef(section)}>
          <TileListSection
            section={section}
            tiles={layout.tiles[section]}
            display={layout.nutrientDisplay}
            canMoveUp={index > 0}
            canMoveDown={index < layout.sections.length - 1}
            onMoveSection={(delta) => update({ sections: moveItem(layout.sections, index, delta) })}
            onMoveTile={(tileIndex, delta) =>
              setTiles(section, moveItem(layout.tiles[section], tileIndex, delta))
            }
            onEdit={() => setPicker(section)}
            onPickDisplay={setDisplayTile}
          />
        </div>
      ))}

      <div className="px-4">
        <button
          type="button"
          onClick={() => setDraft(DEFAULT_LAYOUT)}
          className="bg-secondary text-destructive active:bg-muted focus-visible:ring-ring/50 flex min-h-14 w-full items-center justify-center rounded-lg text-lg transition-colors focus-visible:ring-1 focus-visible:outline-none"
        >
          Reset to App Defaults
        </button>
      </div>

      <TilePickerSheet
        section={picker ? SECTIONS[picker] : null}
        selected={picker ? layout.tiles[picker] : []}
        onApply={(tiles) => picker && setTiles(picker, tiles)}
        onClose={() => setPicker(null)}
      />
      <DisplaySheet
        open={displayTile !== null}
        value={(displayTile && layout.nutrientDisplay[displayTile]) || 'consumed'}
        onChange={(value: NutrientDisplay) =>
          displayTile &&
          update({ nutrientDisplay: { ...layout.nutrientDisplay, [displayTile]: value } })
        }
        onClose={() => setDisplayTile(null)}
      />
    </div>
  )
}
