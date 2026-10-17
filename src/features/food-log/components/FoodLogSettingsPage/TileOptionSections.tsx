import { CheckList } from './CheckList'
import { OptionList } from './OptionList'
import type { SettingChoice, TileOptions } from '../../food-log-settings'
import { FOOD_LOG_CHOICES } from '../../food-log-settings'

const DISPLAY_ITEMS = [
  { key: 'showMacros', label: 'Macros' },
  { key: 'showWeight', label: 'Weight (g)' },
  { key: 'showServing', label: 'Serving' },
] as const

type DisplayKey = (typeof DISPLAY_ITEMS)[number]['key']

interface TileOptionSectionsProps {
  readonly options: TileOptions
  /** Lựa chọn Highlight Element: Edit cho timeline, Multi-Add cho tìm kiếm. */
  readonly highlightChoices: readonly SettingChoice<string>[]
  readonly onChange: (patch: Partial<TileOptions>) => void
}

/** Ba nhóm lựa chọn giống nhau của hai trang Food Tiles: Tile Density, Display Information, Highlight Element. */
export function TileOptionSections({
  options,
  highlightChoices,
  onChange,
}: TileOptionSectionsProps) {
  return (
    <>
      <section aria-label="Tile Density" className="space-y-3">
        <h2 className="text-xl font-bold">Tile Density</h2>
        <OptionList
          label="Tile Density"
          options={FOOD_LOG_CHOICES.timelineTileDensity}
          value={options.density}
          onChange={(value) => onChange({ density: value as TileOptions['density'] })}
        />
      </section>

      <section aria-label="Display Information" className="space-y-3">
        <h2 className="text-xl font-bold">Display Information</h2>
        <CheckList
          label="Display Information"
          items={DISPLAY_ITEMS.map(({ key, label }) => ({ key, label, checked: options[key] }))}
          onToggle={(key, checked) => onChange({ [key as DisplayKey]: checked })}
        />
      </section>

      <section aria-label="Highlight Element" className="space-y-3">
        <h2 className="text-xl font-bold">Highlight Element</h2>
        <OptionList
          label="Highlight Element"
          options={highlightChoices}
          value={options.highlight}
          onChange={(value) => onChange({ highlight: value as TileOptions['highlight'] })}
        />
      </section>
    </>
  )
}
