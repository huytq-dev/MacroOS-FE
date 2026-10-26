# FE Release Candidate audit — 2026-10-26

Base: prod HEAD 2df9854 + 57 modified + 7 new source files (uncommitted). Static review + checks only; see `README.md` here for the integration results.

## 1. Change map (every group → approved decision)

| # | Group | Files (main) | Decision / source |
|---|---|---|---|
| G1 | Food Log "4 foods gone": plate persisted in `ui.store` + sessionStorage (12 h TTL), `PendingPlateBar` banner, "Log N foods", add-to-plate toast + Undo, Log-Foods lock, failure toasts | `plate-storage.ts`, `ui.store.ts`, `FoodLogPage.tsx`, `PendingPlateBar.tsx`, `AddFoodDialog.tsx`, `use-food-log.ts` | User task 1 (Master brief): "log 4 món nhưng khi quay lại thì không có" · checks PL1 |
| G2 | Food Search mobile UX: debounce 250 ms + abort, keep-previous, recent searches, no-results actions, paging past BE top=100, auto-load, 44 px hit areas, 375 px fixes | `FoodSearchPanel.tsx`, `SearchInput.tsx`, `FoodList.tsx`, `use-foods.ts`, `food.service.ts`, `food-search.utils.ts`, `use-recent-searches.ts`, `use-auto-load-more.ts`, `ServingSection.tsx`, `AddFoodProgress.tsx` | User task 1 ("tối ưu cái phần search food… mobile") · FS1 |
| G3 | To Custom (F1): push-only (no history race), leave cleanup, Create Food load-error alert, Back → same Food Detail, all nutrients copied | `FoodLogPage.tsx`, `CreateFoodPage.tsx`, `use-create-food-form.ts`, `ui.store.ts` | Master F1 · TC1, TC2 |
| G4 | NDM contract v2 + effective daily numbers (override beats foods, null stays null), per-intent endpoints, paging | `nutrition-data/*`, `effective.ts`, `food-log.types.ts`, `api-routes.ts`, Food Log (`EntryEditDialog`, `FoodLogHeader`, `MacroSummary`, `PlatePanel*`, `AiPanel`, `AiPlateView`, `WeekStrip`), Dashboard (`DailyNutritionCard`, `MacrosBreakdownList`, `macros-detail`, `MacrosDetailPage`, `use-dashboard-data`), `goal-progress.ts`, `remaining.ts` | NDM decisions 2026-10-25 rounds 1–4 · ND1–ND13 |
| G5 | Derived-data / Retry robustness (race-safe Retry, retry state on Try again buttons, habits/check-in retry) | `derived-data/*`, `use-check-in.ts`, `CheckInModulePage.tsx`, `use-habit-days.ts`, `HabitsPage.tsx`, `LayoutSection.tsx` | Earlier G6 round (derived-data freshness) · F4–F10, Y1–Y2 |
| G6 | Expenditure Holding/Calibrating reason card + Dashboard tile note (BE codes only) | `HoldingNotice.tsx`, `ExpenditurePage.tsx`, `expenditure-series.ts`, `expenditure-series.types.ts`, `use-expenditure-detail.ts`, `MetricTile.tsx`, `DashboardTiles.tsx` | Master F2 + user decision "show BE reason codes" (Decisions E1/E2 §F2) · V10 |
| G7 | Flux band: DORMANT code only (see §2) | `expenditure-series.ts`, `ExpenditureChart.tsx`, `theme.css`, `index.css` (token) | User: "không render band… không tự kích hoạt Flux" · V5/V5b/V5c |
| G8 | Weekly Nutrition: past days of the week keep bars via a reference target, NOT in official goal / remaining; future days not counted; tap-to-focus / whole week | `WeekMatrix.tsx`, `dashboard.utils.ts`, `target-provenance.ts`, `food-log.types.ts` | Round 3 §1: "giữ legacy target tham khảo với provenance rõ, không tính vào adherence chính thức"; round 2 §7 (future logs) · WN1, FL1, business-logic (1)(2)(3) |
| G9 | Profile time zone for default eaten-at time, "To Now", default meal | `lib/date.ts`, `selection.utils.ts`, `FoodLogPage.tsx`, `use-create-food-form.ts` | Master RC task 2 (release-correctness) · TZ1 |
| G10 | Docs / scripts | `docs/UI.md`, `docs/audits/*`, `scripts/check-contract.mjs`, `scripts/check-business-logic.mjs` | — |
| — | `DayTimeline.tsx` | one-line prettier reflow only (not behavioural; file owned by another agent) | n/a |

No file in the diff is outside these groups.

## 2. Proofs
- **Flux off**: `FLUX_BAND_ENABLED = false` (only definition; `expenditure-series.ts:71`). `toExpDay(day, showFlux = FLUX_BAND_ENABLED)` always yields `fluxLow/fluxHigh = null` by default; the hook calls `toExpDay(day)` with ONE argument (a `.map(toExpDay)` would pass the index as `showFlux`; check V5 asserts the call shape). With no band: no `<path data-flux-band>`, `expLegend.flux = false` (no "Flux Range" entry), no tooltip lines, axis fits the line only. Checks V5, V5b, V5c, V4. If Flux is ever enabled, any label must say "MacroOS approximation" (MOS-BE note).
- **No experimental UI on by default**: grep of the whole diff and of every new file for `mock|MOCK|console.log|debugger|TODO|FIXME|localhost|__flux` found nothing. The in-page mock used for the Flux screenshots lived only in the browser session (never in source). No new `NEXT_PUBLIC_*` flag was added. `.claude/launch.json` got an extra dev config `fe-3002` (tooling only, not part of the app bundle).
- **No mock/test code in prod paths**: all test helpers are in `scripts/` (not imported by `src`). `showFlux` is the only test-only parameter (defaults to the off flag).
- **No FE-side resolver of business rules**: Holding reasons from BE codes; Flux not computed; targets/provenance read from BE flags.

## 3. Compatibility
See `../S29_Compat_and_Integration_Plan.md` §1 (kept current). Order from the FE view: S29 on the isolated DB → new BE → new FE right after. Not safe: new FE on the old BE for NDM intents; old FE on the new BE for NDM semantics / paging.
