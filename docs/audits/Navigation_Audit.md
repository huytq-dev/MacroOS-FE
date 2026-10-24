# Navigation & Button Audit (FE)

Date: 2026-10-23 · Scope: every interactive element in `FE/src/app/**`, `FE/src/features/**`, `FE/src/components/shared/**`, `FE/src/stores/**`.
Method: static trace of every `<button>`, `<Link>/<a>`, `router.push/replace/back`, `redirect()`, `onClick/onPointer*/onKeyDown`, menu items, tab/select/switch handlers, sheet/dialog triggers and `onSubmit` to its end (route, state setter, mutation + endpoint). Routes were checked against real `page.tsx` files (not just "the file exists": dynamic segments were checked for which params they accept and `notFound()` on others). Public pages were clicked through in a browser; logged-in flows were verified by code + check scripts only (local API points at production — no login).

## Totals

| Area | Elements | OK | DEAD | BROKEN | UNIMPLEMENTED | UNKNOWN |
|---|---|---|---|---|---|---|
| A. Dashboard, nutrient detail, nutrition, derived-data, habits | 110 | 106 (+1 OK w/ caveat) | 1 | 0 | 2 | 0 |
| B. Food log, foods, nutrition data | 339 | 316 | 4 | 7 | 8 | 4 |
| C. Program/Strategy, onboarding, auth, users | 207 | 193 | 1 | 10 (1 dup) | 2 | 1 |
| D. More, shortcuts, weight, full body, period, steps, progress photos, shared shell, stores, protected routes | 261 | 229 | 0 | 6 | 21 | 5 |
| **Total** | **917** | **844** | **6** | **23** | **33** | **10** |

Routes: 55 `page.tsx` routes. `scripts/check-routes.mjs`: every `routePath` value, every literal `href="/…"`, `router.push/replace('/…')`, `redirect('/…')` and `` `${routePath.x}/…` `` (66 targets) resolves to a page file → **0 unresolved**. Dynamic params verified by reading the pages:
- `/dashboard/nutrition/[nutrient]` (+`/summary`, `/goals`): keys from `nutrient-catalog`; unknown → `notFound()`. `macros` never reaches it (goes to `/dashboard/macros`).
- `/body-metrics/[metric]`: all 18 dashboard tile keys + `waist` valid; unknown → `notFound()`.
- `/program/new/[step]`: all `stepHref()` values ∈ `WizardStep`, `isWizardStep` → else `notFound()`. `/program/goal/edit/[step]`: only `params`, `review`. `/program/check-in/[module]`: filtered by `visibleModules`/`isModuleKey`, else `notFound()`.
- Query params read by targets: `/foods/new?from=` + seed, `/progress-photos/gallery?date=&angle=`, `/confirm-email?email=`, `/reset-password?token=`, `/login?redirect=`, `/profile#units`.
- Auth guard: protected routes → `/login?redirect=<path+query>`; onboarding guard → `/onboarding`.

Browser click-through (http://localhost:3000, logged out): `/login` → Forgot password → `/forgot-password` → Back to log in → `/login` → Create account → `/register` (Log in link → `/login`); `/confirm-email?email=…` (Verify, Resend, Back to log in); `/reset-password` (Reset, Back to log in); `/more` while logged out → `/login?redirect=%2Fmore`. All OK.

## Fixed (verified bugs)

| # | Where | Bug | Fix |
|---|---|---|---|
| F1 | `src/components/shared/MobileTabBar.tsx:78`, `src/lib/providers.tsx:22`, `next.config.ts:8` | **User-reported**: on /more the Shortcuts sheet's last row ("Metrics") was covered by the round "N" badge and the round palm-tree button. Root cause: those two are dev-only floating overlays — the Next.js dev indicator (bottom-left) and the TanStack Query Devtools toggle (bottom-right), z-index ≈ 99999, outside the app's stacking order. Separately the tab bar and Dialog/Sheet were both `z-50`, so dialogs won only by portal DOM order. | `devIndicators: false` (build/runtime error overlay still appears); RQ Devtools only when `NEXT_PUBLIC_RQ_DEVTOOLS=1`; tab bar `z-40` so every Dialog/Sheet/Drawer (`z-50`) is strictly above it at every width (tab bar is `md:hidden`; desktop has no bottom nav). Verified on :3000: indicator 0×0, no devtools button. |
| F2 | `src/features/auth/pages/LoginPage.tsx:20`, `components/login/LoginForm.tsx:53`, `auth.utils.ts:40` | Open redirect: `?redirect=` accepted `//host` / `https://…`. | `safeRedirect()` accepts only internal `/path`; asserted in `check-routes.mjs`. |
| F3 | `src/features/auth/components/AuthGuard.tsx:16` | Redirect dropped the query string (e.g. `/progress-photos/gallery?date=` lost its day after login). | Keeps `pathname + search`. |
| F4 | `src/features/dashboard/components/DashboardPage/NutrientGroupSection.tsx:60` | DEAD: "Macros" tile on /dashboard/nutrition had a chevron but no `href` (same tile on Dashboard links to /dashboard/macros). | `href={routePath.dashboardMacros}`. |
| F5 | `src/features/dashboard/pages/MacrosDetailPage.tsx:52` (reported by MOS-MOTION via MOS-Master) | Crash: `series.days[0].date` when BE returns empty `days`. | `historyDayCount()` in `macros-detail.ts` (empty → 1 day, today only; existing empty chart/list render). Check in `check-business-logic.mjs` (fails on old code: helper missing + page regex). |
| F6 | `src/features/progress-photos/components/SessionRow.tsx:28` | Gallery opened on the wrong day for a session with only Side/Back photos (no `&angle`, gallery defaults to Front). | Adds `&angle=<first angle that exists>`. |
| F7 | `src/features/shortcuts/pages/ProgressPhotosShortcutPage.tsx:39` | Shortcuts › Photos trash deleted a whole day immediately, no confirmation (Progress Photos page asks). | Same `ConfirmDialog` as Progress Photos page. |
| F8 | `src/features/shortcuts/components/FullBodySheet.tsx:210` | Body-fat Reference always showed male figures. | Passes `body` from `useProfile()` gender, as Visual Body Fat page does. |
| F9 | `src/components/shared/AppSidebar.tsx:27` | ≥768px: /more and everything under it (Units, Expenditure, Tutorials…) unreachable — sidebar had no More, tab bar hidden. | Sidebar item "More" → `/more` (existing route). |
| F10 | `src/features/program/utils/new-program-steps.ts:82` | Deep link / reload to a step not in the current flow (`/program/new/editor`, `/same-different`, `/manual-targets` with empty store) rendered it; Next then jumped to `diet`. | Off-flow step → first unanswered step of the flow (`style` when nothing chosen). Asserted in `check-business-logic.mjs`. |
| F11 | `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:333,341` | Multi-Add "+" on search results / History opened Food Detail instead of adding (setting text: "MultiAdd = nút + thêm món vào plate không rời tìm kiếm"; Library "+" already adds). | Calls `onAddToPlate(plateItemOfFood(food))` — builder hoisted from `LibraryPanel` and shared. **If MacroFactor's "+" should open detail instead, revert this one.** |
| F12 | `src/features/food-log/components/FoodLogPage/IngredientSearchSheet.tsx:94`, `RecipeCreatePage/IngredientPickerSheet.tsx:68` | DEAD: visible but disabled "+" (single-pick sheets have no `onAdd`) when Logger highlight = MultiAdd. | Those sheets render with highlight `None` instead of `MultiAdd`. Settings preview still shows "+". |
| F13 | `src/features/food-log/components/FoodLogPage/DayTimeline.tsx:88` | "Add Foods to Hour = LongPress": an hour that already has foods could not be long-pressed (pill only handled tap), and the "+" is hidden in that mode → no way to add. | Pill with foods handles both: tap = select hour, hold 0.5 s = add (click after a hold suppressed). |

## Not fixed — needs MOS-FE (hooks/services/query keys)

1. Detail pages error state has no Retry and no Back: `ExpenditurePage.tsx:56`, `WeightTrendPage.tsx:61`, `EnergyBalancePage.tsx:60`, `GoalProgressPage.tsx:69` return `<ErrorState>` without `onRetry` before the header. The hooks `use-expenditure-detail`, `use-weight-trend-detail`, `use-energy-balance-detail`, `use-goal-progress-detail` don't expose `refetch`. Once exposed, pages can pass `onRetry` and render `SubPageHeader` above the error.
2. Silent failures (mutation `onError` only logs, `ConfirmDialog` has no error slot): delete weigh-in (`ScaleWeightSheet.tsx:238`, `use-weights.ts:102`), delete steps/period/measurement/visual body fat, delete food (`FoodsPage.tsx:227`, `use-foods.ts:105`), delete note (`FoodLogPage.tsx:617`), End program (`ProgramActions.tsx:436`), food-log settings writes roll back silently (`use-food-log-settings.ts:33`). Needs an error toast or an error prop on `ConfirmDialog`.
3. `use-wizard-nav.ts:163` Back on first wizard step doesn't clear `useGoalEditStore.pendingGoal` (`goal-edit.store.ts:28` `reset` doesn't either): an abandoned goal edit is reused by the next New Program.
4. `use-wizard-nav.ts:169` returns `close()` that nothing calls (dead export).
5. `FoodLogPage.tsx:832`: Quick Add log error hidden while on the Quick Add tab (`tab !== 'quick'`).

## Questions for the user (unimplemented / purpose unclear vs MacroFactor — no route invented)

1. **Nutrition Overview tiles** (`food-log/components/NutritionOverviewPage/NutrientCard.tsx:116`) show a chevron but are not tappable; "Top 3 Contributors" (`:80`) also has a chevron. Should the tile open `/dashboard/nutrition/[nutrient]` and Contributors open `/dashboard/nutrition/[nutrient]/summary`? (No MF screenshot for this tap.)
2. **Program › "New Goal"** (`program/components/ProgramPage/GoalCard.tsx:76`) goes to `/program/new` (New Program wizard has no goal step). Should it go to `/program/goal/edit` instead?
3. **Shortcuts "+" on desktop**: the Shortcuts sheet opens only from the mobile tab bar "+". Desktop (≥768px) has no entry. Where should it live (sidebar button? header)?
4. **More rows "Not available yet"** (12): Subscription, Integrations, Language, Weight Trend, Data Export, Data Visibility, Account & Data Deletion, Knowledge Base, Roadmap, Support, Legal, About — they render dimmed and toast. Keep as-is or hide until BE exists?
5. **Expenditure settings**: Calculation Start Date always disabled; Calculation Mode disabled unless `NEXT_PUBLIC_EXPENDITURE_MODE_API=true` (not set anywhere); Step-Informed Updates / Predictive Goal Adjustment are disabled switches (`SettingRows.tsx:100` hard-codes `checked={false}`); Manual TDEE has no "back to Default" while `EXPENDITURE_SETTINGS_API` is off; BMR equation / Athletic / Prior Weight toast "Not available yet" with the flag off. Enable the flags (BE ready?) or hide?
6. **Food log "coming soon"**: Sort favorites (`LibraryPanel.tsx:219`), label scanning (`ScanPanel.tsx:81/99/136/163`, also in Create Food), Settings › Time Selection and Favorite Measurements (`FoodLogSettingsPage.tsx:149`). Keep toasts or hide?
7. **Check-in "turn it back on from More"** (`PartialLoggingModule.tsx:145`): nothing sets `partialLoggingHidden` back to false. Add a More row (needs BE field) or change the copy?
8. **Onboarding Plan / Start trial** (`PlanStep.tsx:38`) only moves to next step (no billing). OK as intended?
9. **After End program**, `OnboardingGuard` sends the user into full onboarding on next refetch (BE `IsRequired: !hasProgram || !consent`), contradicting the dialog "You can create a new program right after". BE or FE change?
10. **Goal Progress tutorial** can't be re-shown after dismiss (Expenditure / Weight Trend have a GraduationCap button). Add the same button?
11. Behaviour with no MF reference, left as-is: Period calendar swipes into future months (`PeriodPage.tsx:56`); Select Date "Go to Today" ignores allowed days (`SelectDateSheet.tsx:122`); `router.back()` with no history on Gallery/Compare/Shortcuts (`GalleryPage.tsx:194`, `ComparePage.tsx:160`, `ShortcutsPage.tsx:28`); plate items without grams show a disabled amount (`PlateItemRow.tsx:71`); "To Custom" shown on the user's own foods (`FoodDetailView.tsx:283`); same-different Next overwrites manual targets after Back (`NewProgramStepPage.tsx:332`); goal rate input max 1.5 vs slider 1 (`GoalTargetStep.tsx:164`).

## Logged-in flows to click (not clicked: local API = production DB)

/more → "+" tab → Shortcuts sheet at 320/375/390/430 (last row fully visible, above tab bar) · desktop sidebar → More · /dashboard/nutrition → Macros tile → /dashboard/macros · /dashboard/macros with no logged days · Progress Photos → a Side-only day → gallery opens on it · Shortcuts › Photos → trash → confirm dialog · Shortcuts › Full Body → Reference (female profile) · Food Log search with Logger highlight = MultiAdd → "+" adds to plate · Timeline with "Add Foods to Hour = LongPress" → hold an hour that has foods · `/program/new/editor` direct with empty store → lands on `/program/new/style` · log out on `/progress-photos/gallery?date=…`, log in → returns with the query.

## Files changed

`next.config.ts`, `scripts/check-routes.mjs` (new), `scripts/check-business-logic.mjs`, `src/lib/providers.tsx`, `src/components/shared/MobileTabBar.tsx`, `src/components/shared/AppSidebar.tsx`, `src/features/auth/auth.utils.ts`, `src/features/auth/pages/LoginPage.tsx`, `src/features/auth/components/login/LoginForm.tsx`, `src/features/auth/components/AuthGuard.tsx`, `src/features/dashboard/components/DashboardPage/NutrientGroupSection.tsx`, `src/features/dashboard/macros-detail.ts`, `src/features/dashboard/pages/MacrosDetailPage.tsx`, `src/features/progress-photos/components/SessionRow.tsx`, `src/features/shortcuts/pages/ProgressPhotosShortcutPage.tsx`, `src/features/shortcuts/components/FullBodySheet.tsx`, `src/features/program/utils/new-program-steps.ts`, `src/features/food-log/components/FoodLogPage/{FoodSearchPanel,LibraryPanel,FoodTile,IngredientSearchSheet,DayTimeline}.tsx`, `src/features/food-log/components/RecipeCreatePage/IngredientPickerSheet.tsx`.

## Full matrix

Status is as found **before** the fixes above; fixed rows are marked `FIXED (was …)`. Line numbers are pre-fix. Columns: | Component (file:line) | Button/Action | Expected | Actual (route/handler → effect, API) | Status | Fix |

### A. Dashboard / nutrient detail / habits

| Component (file:line) | Button/Action | Expected | Actual | Status | Fix |
|---|---|---|---|---|---|
| `src/features/dashboard/pages/DashboardPage.tsx:90` | Customize icon link (SlidersHorizontal) | open Customize Dashboard | `<Link href={routePath.dashboardCustomize}>` → /dashboard/customize (exists) | OK | - |
| `src/features/dashboard/pages/DashboardPage.tsx:80` | ErrorState Retry (program) | refetch program | `onRetry={() => void program.refetch()}` | OK | - |
| `src/features/dashboard/pages/DashboardPage.tsx:81` | ErrorState Retry (week log) | refetch week | `onRetry={() => void week.refetch()}` | OK | - |
| `src/features/dashboard/pages/DashboardPage.tsx:74` | Search bar "Search" (via DashboardSearchBar onSearch, :223) | open Add Food | `setAddFoodOpen(true)` + `router.push('/food-log')`; FoodLogPage.tsx:122 reads `addFoodOpen` | OK | - |
| `src/features/dashboard/components/DashboardPage/DashboardSearchBar.tsx:45` | Barcode button | open scanner | `onScan ?? (() => run('barcode'))` → shortcuts runner (out of scope) | OK | - |
| `src/features/dashboard/components/DashboardPage/DashboardSearchBar.tsx:46` | Custom shortcut buttons | run shortcut | `onRun={run}` (useShortcutRunner, out of scope) | OK | - |
| `src/features/dashboard/pages/DashboardPage.tsx:177` | DerivedFailed Retry (Energy focus page) | retry derived-data rebuild | `derived.retry` → `retry.mutate()` → POST /derived-data/retry, invalidates status | OK | - |
| `src/features/dashboard/pages/DashboardPage.tsx:119` | Setup step "Your profile" (ListRow href, SetupChecklist.tsx:46) | go to profile | /profile (exists) | OK | - |
| `src/features/dashboard/pages/DashboardPage.tsx:126` | Setup step "Today's weight" | go to weight | /weight (exists) | OK | - |
| `src/features/dashboard/pages/DashboardPage.tsx:133` | Setup step "Goal and program" | create program | /program/new (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/SetupChecklist.tsx:67` | "Continue: {label}" button | go to next unfinished step | `<Link href={next.href}>` | OK | - |
| `src/features/dashboard/components/DashboardPage/DashboardCarousel.tsx:57` | Carousel page dots | scroll to page | `goTo(index)` → `track.scrollTo(...)`; onScroll updates active dot | OK | - |
| `src/features/dashboard/components/DashboardPage/WeekMatrix.tsx:88` | Weekly Nutrition day column | show that day's numbers / toggle back to week | `onSelect(active ? null : day.logDate)` → setSelectedDate; `current` drives summary | OK | - |
| `src/features/dashboard/components/DashboardPage/WeekMatrix.tsx:180` | Consumed/Remaining toggle (weekly) | switch mode | ModeToggle → `setNutritionMode` (usePersistedChoice) | OK | - |
| `src/features/dashboard/components/DashboardPage/DailyNutritionCard.tsx:182` | Consumed/Remaining toggle (daily) | switch mode | ModeToggle → `setNutritionMode` | OK | - |
| `src/features/dashboard/components/DashboardPage/DailyNutritionCard.tsx:30` | ModeToggle ToggleGroup onValueChange (shared) | change value, ignore deselect | `next && onChange(next)` | OK | - |
| `src/features/dashboard/components/DashboardPage/EnergyBalanceCard.tsx:91` | "Energy Balance ›" heading link | open detail | /dashboard/energy-balance (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/EnergyBalanceCard.tsx:165` | Expenditure/Target toggle | switch compare mode | ModeToggle → `setBalanceMode` (persisted) | OK | - |
| `src/features/dashboard/components/DashboardPage/TileSection.tsx:37` | "See All" (Insights section) | open all insights | SEE_ALL.insights → /dashboard/insights (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/TileSection.tsx:37` | "See All" (Nutrition section) | open nutrition list | SEE_ALL.nutrition → /dashboard/nutrition (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/LayoutSection.tsx:43` | Weigh-In tile | open habit page | /habits/weigh-in (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/LayoutSection.tsx:43` | Food Logging tile | open habit page | /habits/food-logging (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/LayoutSection.tsx:56` | Scale Weight tile | open weight | /weight (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/LayoutSection.tsx:68` | Visual Body Fat tile | open body fat | /body-fat (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/LayoutSection.tsx:84` | Steps tile | open steps | /steps (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/LayoutSection.tsx:96` | Period tile | open period | /period (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/LayoutSection.tsx:110` | Macros tile (dashboard) | open macros detail | /dashboard/macros (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/NutrientTile.tsx:77` | Nutrient tile (calories, protein, vitamins…) | open nutrient detail | `routePath.dashboardNutrient(tileKey)`; every catalog key except `macros` is in NUTRIENT_CODE so `findNutrient` resolves (macros never reaches NutrientTile: LayoutSection.tsx:105, NutrientGroupSection.tsx:45) | OK | - |
| `src/features/dashboard/components/DashboardPage/BodyMetricTiles.tsx:64` | Measurement tiles (Neck…Right Ankle) | open measurement page | `routePath.bodyMeasurement(TILE_KEY[k])`; all 18 mapped keys exist in features/weight/body-measurements.ts (findMeasurement) | OK | - |
| `src/features/dashboard/components/DashboardPage/BodyMetricTiles.tsx:109` | Waist to Height / Waist to Hip tiles | open related page | /body-metrics/waist (valid key) | OK | - |
| `src/features/dashboard/components/DashboardPage/BodyMetricTiles.tsx:137` | Progress Photos tile (empty "Add") | open progress photos | /progress-photos (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/BodyMetricTiles.tsx:142` | Progress Photos tile (photo + chevron) | open progress photos | `<Link href={routePath.progressPhotos}>` | OK | - |
| `src/features/dashboard/components/DashboardPage/BodyMetricTiles.tsx:198` | Full Body tile (empty) | open full body | /full-body (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/BodyMetricTiles.tsx:203` | Full Body tile (chips + chevron) | open full body | `<Link href={routePath.fullBody}>` | OK | - |
| `src/features/dashboard/components/DashboardPage/DashboardTiles.tsx:40` | Expenditure tile | open detail | /dashboard/expenditure (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/DashboardTiles.tsx:63` | Weight Trend tile | open detail | /dashboard/weight-trend (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/DashboardTiles.tsx:96` | Energy Balance tile | open detail | /dashboard/energy-balance (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/DashboardTiles.tsx:135` | Goal Progress tile | open detail | /dashboard/goal-progress (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/DashboardTiles.tsx:31` | DerivedFailed Retry in insight tiles (:31,:54,:83,:123) | retry rebuild | POST /derived-data/retry | OK | - |
| `src/features/dashboard/components/DashboardPage/DashboardTiles.tsx:149` | "Nutrition Data Manager ›" (Other section) | open manager | /nutrition-data (exists) | OK | - |
| `src/features/dashboard/components/DashboardPage/MetricTile.tsx:81` | MetricTile wrapper (chevron) | whole tile is a link when href given | `href ? <Link> : <div>`; without href chevron dimmed, not clickable (by design; used during loading) | OK | - |
| `src/features/dashboard/components/DashboardPage/SubPageHeader.tsx:34` | Back chevron (all detail pages, habits, nutrient pages) | go back | `onBack ?? (() => router.back())` | OK | - |
| `src/features/dashboard/components/DashboardPage/NutrientGroupSection.tsx:47` | Nutrient tiles on /dashboard/nutrition | open nutrient detail | NutrientTile → /dashboard/nutrition/{key} (valid) | OK | - |
| `src/features/dashboard/components/DashboardPage/NutrientGroupSection.tsx:60` | "Macros" tile on /dashboard/nutrition (chevron shown) | open Macros detail like the Dashboard tile does | `<MetricTile ... />` with no `href` → renders `<div>`, dimmed chevron, nothing happens | FIXED (was DEAD) | add `href={routePath.dashboardMacros}` (same as LayoutSection.tsx:110) |
| `src/features/dashboard/pages/CustomizePage.tsx:60` | Back chevron | leave Customize | `router.push(routePath.dashboard)`; discards draft without confirm | OK | - |
| `src/features/dashboard/pages/CustomizePage.tsx:65` | Save | persist layout | `finish`: `if (draft) save(draft)` → localStorage `dashboard.layout.v1` (no API by design, hook comment) + push /dashboard | OK | - |
| `src/features/dashboard/pages/CustomizePage.tsx:101` | Reset to App Defaults | reset layout | `setDraft(DEFAULT_LAYOUT)` (applied on Save) | OK | - |
| `src/features/dashboard/components/CustomizePage/FocusPicker.tsx:52` | Focus page Switch | show/hide focus page | `onToggle(key,next)` → toggleFocus updates `focusHidden` | OK | - |
| `src/features/dashboard/components/CustomizePage/FocusPicker.tsx:65` | Move focus left | reorder | `onMove(index,-1)` → moveItem; hidden+disabled at index 0 | OK | - |
| `src/features/dashboard/components/CustomizePage/FocusPicker.tsx:72` | Move focus right | reorder | `onMove(index,1)`; hidden+disabled at last | OK | - |
| `src/features/dashboard/components/CustomizePage/TileListSection.tsx:72` | Move section up | reorder sections | `onMoveSection(-1)`; disabled when first | OK | - |
| `src/features/dashboard/components/CustomizePage/TileListSection.tsx:79` | Move section down | reorder sections | `onMoveSection(1)`; disabled when last | OK | - |
| `src/features/dashboard/components/CustomizePage/TileListSection.tsx:101` | Nutrient display mode "Consumed ▾" | open display sheet | `onPickDisplay(key)` → setDisplayTile → DisplaySheet open | OK | - |
| `src/features/dashboard/components/CustomizePage/TileListSection.tsx:112` | Drag handle (pointer) | drag reorder tiles | pointer capture + handleMove → `onMoveTile` | OK | - |
| `src/features/dashboard/components/CustomizePage/TileListSection.tsx:119` | Drag handle (ArrowUp/Down keys) | keyboard reorder | `onMoveTile(index,±1)`; moveItem clamps | OK | - |
| `src/features/dashboard/components/CustomizePage/TileListSection.tsx:139` | "Add or Remove …" button | open tile picker | `onEdit` → `setPicker(section)` | OK | - |
| `src/features/dashboard/components/CustomizePage/TilePickerSheet.tsx:69` | Tile Switch in picker | add/remove tile in draft | `toggle(tile.key,next)` | OK | - |
| `src/features/dashboard/components/CustomizePage/TilePickerSheet.tsx:47` | Picker "Done" | apply selection | SheetFrame Done → `onDone()` (`onApply(draft)` → setTiles) then `onOpenChange(false)` → onClose | OK | - |
| `src/features/dashboard/components/CustomizePage/TilePickerSheet.tsx:46` | Picker close / backdrop | close without applying | `!open && onClose()` → setPicker(null) | OK | - |
| `src/features/dashboard/components/CustomizePage/TilePickerSheet.tsx:109` | DisplaySheet option (Percent/Consumed/Remaining) | set display + close | `onChange(option); onClose()` → update nutrientDisplay | OK | - |
| `src/features/dashboard/components/CustomizePage/TilePickerSheet.tsx:96` | DisplaySheet close | close | `!next && onClose()` | OK | - |
| `src/features/dashboard/pages/ExpenditurePage.tsx:87` | Tutorial (GraduationCap) toggle | show/hide tutorial | `setTutorial(show/hidden)` persisted | OK | - |
| `src/features/dashboard/pages/ExpenditurePage.tsx:93` | DerivedFailed Retry | retry rebuild | POST /derived-data/retry | OK | - |
| `src/features/dashboard/chart/use-chart-expand.tsx:171` | Expand/Shrink chart button (Expenditure, WeightTrend, EnergyBalance, GoalProgress, Macros, Nutrient detail) | toggle tall chart | `onClick={expand.toggle}` → setExpanded + scroll | OK | - |
| `src/features/dashboard/components/DetailPage/RangeBar.tsx:46` | Range 1W…All | change range | `onRangeChange(option)` → setRange | OK | - |
| `src/features/dashboard/components/DetailPage/RangeBar.tsx:59` | Averaging "D ▾" | open Chart Averaging sheet | `setOpen(true)` | OK | - |
| `src/features/dashboard/components/DetailPage/RangeBar.tsx:76` | Averaging option | set averaging + close | `onAveragingChange(option); setOpen(false)` | OK | - |
| `src/features/dashboard/components/DetailPage/TutorialCard.tsx:70` | Dismiss Tutorial | hide | `onDismiss` → setTutorial('hidden') | OK | - |
| `src/features/dashboard/components/DetailPage/TutorialCard.tsx:77` | Previous | previous step | `go(step-1)` scroll | OK | - |
| `src/features/dashboard/components/DetailPage/TutorialCard.tsx:83` | Next / Done | next step / dismiss | `last ? onDismiss() : go(step+1)` | OK | - |
| `src/features/dashboard/components/DetailPage/UnderlineTabs.tsx:34` | Underline tab (Energy Balance compare / Goal Progress basis) | switch tab | `onChange(tab.value)` | OK | - |
| `src/features/dashboard/components/DetailPage/DetailBlocks.tsx:47` | SourceRow "Manage Data ›" (generic) | open source page | `<Link href={href}>` | OK | - |
| `src/features/dashboard/components/ExpenditurePage/ExpenditureInsights.tsx:144` | Data Sources: Nutrition Data Manager | open manager | /nutrition-data | OK | - |
| `src/features/dashboard/components/ExpenditurePage/ExpenditureInsights.tsx:149` | Data Sources: Scale Weight | open weight | /weight | OK | - |
| `src/features/dashboard/components/ExpenditurePage/ExpenditureChart.tsx:86` | Chart tap (select day) | show day tooltip | `pick` → setPicked (ignored after drag) | OK | - |
| `src/features/dashboard/chart/use-chart-pan.ts:94` | Chart drag (pointer down/move/up) | pan back in time | pan.bind on every chart; coast/snap | OK | - |
| `src/features/dashboard/pages/WeightTrendPage.tsx:95` | Tutorial toggle | show/hide tutorial | `setTutorial(...)` | OK | - |
| `src/features/dashboard/pages/WeightTrendPage.tsx:101` | DerivedFailed Retry | retry rebuild | POST /derived-data/retry | OK | - |
| `src/features/dashboard/components/WeightTrendPage/WeightTrendChart.tsx:113` | Chart tap | select day | `pick` → setPicked | OK | - |
| `src/features/dashboard/components/WeightTrendPage/WeightTrendInsights.tsx:136` | Data Sources: Scale Weight | open weight | /weight | OK | - |
| `src/features/dashboard/pages/EnergyBalancePage.tsx:72` | ModeTabs (Expenditure/Target) | switch compare | ModeTabs.tsx:34 → UnderlineTabs → setMode | OK | - |
| `src/features/dashboard/pages/EnergyBalancePage.tsx:75` | DerivedFailed Retry | retry rebuild | POST /derived-data/retry | OK | - |
| `src/features/dashboard/components/EnergyBalancePage/EnergyBalanceChart.tsx:91` | Chart tap | select day | `pick` | OK | - |
| `src/features/dashboard/pages/GoalProgressPage.tsx:74` | Scale/Trend Weight tabs | switch basis | `onChange={setTab}` → refetch by tab | OK | - |
| `src/features/dashboard/pages/GoalProgressPage.tsx:77` | DerivedFailed Retry | retry rebuild | POST /derived-data/retry | OK | - |
| `src/features/dashboard/pages/GoalProgressPage.tsx:130` | Goal Progress TutorialCard (Dismiss/Next/Done) | dismiss tutorial; can be re-shown like Expenditure/Weight Trend | dismiss → `setTutorial('hidden')` persisted; header `<SubPageHeader title="Goal Progress" />` (:73) has no GraduationCap action, so tutorial can never be re-shown | UNIMPLEMENTED | add the same tutorial IconButton `action` as ExpenditurePage.tsx:83 |
| `src/features/dashboard/components/GoalProgressPage/WaterfallChart.tsx:142` | Waterfall bar click | select bar tooltip | `toggle(bar.key)` (ignored after drag) | OK | - |
| `src/features/dashboard/components/GoalProgressPage/WaterfallChart.tsx:143` | Waterfall bar Enter/Space | select bar | `setSelected(...)` | OK | - |
| `src/features/dashboard/pages/MacrosDetailPage.tsx:67` | ErrorState Retry | refetch | `history.refetch()` | OK | - |
| `src/features/dashboard/components/MacrosPage/MacrosChart.tsx:91` | Chart tap | select day | `pick` | OK | - |
| `src/features/dashboard/pages/ExpenditurePage.tsx:56` | Error state (Expenditure/WeightTrend:61/EnergyBalance:60/GoalProgress:69) | retry or go back | `<ErrorState error={new Error(...)} />` without onRetry and without SubPageHeader → no retry button, no back button | UNIMPLEMENTED | pass `onRetry={() => void data.refetch?.()}` (if hook exposes it) and render header above |
| `src/features/nutrient-detail/pages/NutrientDetailPage.tsx:85` | ErrorState Retry | refetch | `series.refetch()` | OK | - |
| `src/features/nutrient-detail/components/NutrientChart.tsx:99` | Chart tap | select day | `pick` → setPicked(date) | OK | - |
| `src/features/nutrient-detail/components/NutrientLegend.tsx:33` | Legend "About Nutrient Goals" link | open goals explainer | `routePath.dashboardNutrientGoals(info.nutrient.key)` (key already validated by findNutrient) | OK | - |
| `src/features/nutrient-detail/components/NutrientTodayCard.tsx:27` | Today card | open summary | `routePath.dashboardNutrientSummary(nutrient.key)` (valid) | OK | - |
| `src/features/nutrient-detail/pages/NutrientSummaryPage.tsx:135` | ErrorState Retry | refetch | `query.refetch()` | OK | - |
| `src/features/derived-data/components/DerivedFailed.tsx:27` | Retry button (shared) | retry rebuild | ErrorState onRetry → `useDerivedGate().retry` → POST /derived-data/retry | OK | - |
| `src/features/habits/pages/HabitsPage.tsx:50` | ErrorState Retry | refetch summary | `summary.refetch` | OK | - |
| `src/features/habits/components/HabitsPage/HabitCalendar.tsx:103` | Calendar day (weigh-in) | open weigh-in sheet for date | HabitsPage.tsx:54 `sheet.show(iso)` → ScaleWeightSheet | OK | - |
| `src/features/habits/components/HabitsPage/HabitCalendar.tsx:103` | Calendar day (food-logging) | open food log at date | HabitsPage.tsx:57 `openFoodLogDate(iso)` + push /food-log; FoodLogPage.tsx:262 reads `foodLogDate` | OK | - |
| `src/features/habits/components/HabitsPage/HabitCalendar.tsx:47` | Calendar swipe (pointer down/up) | swipe months | only active when `onSwipe` passed; HabitsPage does not pass it (PeriodPage does) → no-op here | OK | optional: pass `onSwipe` for parity with PeriodPage |
| `src/features/habits/components/HabitsPage/HabitControls.tsx:49` | Previous month ‹ | previous month | `go(-1)` → onChange → setPicked | OK | - |
| `src/features/habits/components/HabitsPage/HabitControls.tsx:58` | Next month › | next month | `go(1)`; disabled at current month | OK | - |
| `src/features/habits/components/HabitsPage/HabitControls.tsx:71` | Month ▾ / Year ▾ triggers | open picker sheet | `setPicker({mode,open:true})` | OK | - |
| `src/features/habits/components/HabitsPage/HabitControls.tsx:87` | MonthYearPickerSheet select / close (:81) | change month/year | `onSelect={onChange}`; onOpenChange updates state | OK | - |
| `src/features/habits/components/HabitsPage/ScaleWeightSheet.tsx:121` | Weigh-in form submit / Save (:152) | save weight + body fat | `submit()` → `useUpsertWeight` POST /weights and/or `useSaveFullBody` PUT /body-metrics/full-body; closes on success, inline error | OK | - |
| `src/features/habits/components/HabitsPage/ScaleWeightSheet.tsx:165` | Numeric keypad (touch) | type digits | `setField(active, ...)` / backspace | OK | - |
| `src/features/habits/components/HabitsPage/ScaleWeightSheet.tsx:197` | Sheet close | close | `onOpenChange` → sheet.onOpenChange | OK | - |
| `src/features/habits/components/HabitsPage/ScaleWeightSheet.tsx:206` | Trash (Delete weigh-in) | open confirm | `setConfirmOpen(true)`; only when entry exists | OK | - |
| `src/features/habits/components/HabitsPage/ScaleWeightSheet.tsx:238` | Confirm "Delete weigh-in" | delete weight for date | `remove.mutate(date, { onSuccess })` → DELETE /weights/{date}; works on success, but no onError and ConfirmDialog has no error prop while hook (use-weights.ts:104) says errors are shown inline → failure is silent; body fat for that date is not deleted | OK (caveat) | surface `remove.error` in the dialog |

### B. Food log / foods / nutrition data

| Component (file:line) | Button/Action | Expected | Actual | Status | Fix |
|---|---|---|---|---|---|
| `src/features/food-log/pages/FoodLogPage.tsx:429` | ErrorState Retry (day load error) | refetch day | `day.refetch()` → GET foodLogs.root?date | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:528` | FoodLogHeader onDateChange (WeekStrip day) | switch viewed day | `setSelectedDate(next)` + close calendar | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:543` | Header calendar toggle | open/close CalendarSheet | `setCalendarOpen(!open)` → mounts CalendarSheet | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:544` | Header More (⋮) | open More sheet | `moreSheet.show(true)` → MoreSheet | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:565` | CalendarSheet onSelect | pick day | `setSelectedDate` + close | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:596` | DayTimeline onAddAt (hour +/long-press) | open Add Food at hour | `openAdd(time)` → ui.store addFoodOpen=true | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:597` | DayTimeline onSelectEntry (tap food tile) | open entry editor | `openEdit` → editSheet.show(entry) → EntryEditDialog | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:604` | DayTimeline onPaste (Multi-Paste) | paste selection at hour | `copySelected([date], time, false)` → POST foodLogs.bulkCopy | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:609` | NotesSection onAdd | new note sheet | `noteSheet.show(null)` | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:613` | NotesSection onSelect | edit note sheet | `noteSheet.show(note)` | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:617` | NotesSection onDelete (swipe) | delete note | `deleteNote.mutate(id)` → DELETE foodLogs.note(id); on error only logger.error (use-food-log.ts useNoteMutation), no UI feedback when sheet closed | BROKEN (silent failure) | add onError toast for swipe-delete |
| `src/features/food-log/pages/FoodLogPage.tsx:637` | DashboardSearchBar onSearch | open Add Food (search) | `openAdd()` | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:639` | DashboardSearchBar onScan | open Add Food (scan tab) | `barcode.reset(); setTab('scan'); openAdd()` | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:655` | MoreSheet Hide Food Details switch | hide tile details | `setHideDetails` (usePersistedChoice, local) → HIDDEN_DETAILS tile opts | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:656` | MoreSheet Hide Empty Hours switch | hide empty hours | `setHideEmptyHours` → DayTimeline hideEmptyHours | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:657` | MoreSheet Copy Day | open CopyDialog | `openCopy` → setCopyOpen(true) | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:658` | MoreSheet Select All | select all entries | `selection.start(all ids)` → SelectionBar | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:659` | MoreSheet Clear Day | confirm clear day | `setClearOpen(true)` → ConfirmDialog | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:680` | NoteSheet onSave | add/update note | `updateNote.mutate` PUT foodLogs.note(id) / `addNote.mutate` POST foodLogs.notes | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:691` | NoteSheet onDelete | delete note | `deleteNote.mutate` + hide; error shown in sheet | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:714` | SelectDatesSheet onConfirm (Paste to Dates) | bulk copy to dates | `copySelected(dates)` → POST bulkCopy {toDates} | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:737` | DateTimeWheelSheet onConfirm | copy/move/retime selection | copy-datetime→bulkCopy; move-datetime→bulkMove; timestamp→bulkMove{toTime} | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:752` | RemoveFoodsDialog onConfirm | bulk delete | `bulkDelete.mutate(ids)` → POST foodLogs.bulkDelete; error toast | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:770` | BarcodeSheet onLookup | look up barcode | `barcode.mutate` (foodService.byBarcode) → tab search + pick | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:788` | DateTimeSheet onSelect | set log date/time | setLogDate/setEatenAt/setMeal | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:793` | DateTimeSheet onLog | log plate to date/time | `logPlate(plate,{date,time})` → POST entries / quickAdd | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:808` | AddFoodDialog onTimeClick (MealTimePill) | open Select Date and Time | `dateTimeSheet.show(true)` | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:829` | AddFoodDialog error for Quick Add tab | show log errors | `quickAdd.error && tab !== 'quick'` → quickAdd failure while on Quick Add tab is hidden; logPlate catch returns false silently | BROKEN (silent failure) | show quickAdd.error on quick tab too (QuickAddPanel has no own error UI) |
| `src/features/food-log/pages/FoodLogPage.tsx:836` | Plate remove | remove plate row | setPlate filter | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:839` | Plate update item | edit row amount | setPlate map | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:844` | onLogPlate | log plate | `logPlate(items)` sequential POST foodLogs.entries / quickAdd | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:851` | ScanPanel onCode | auto barcode lookup | `lookupBarcode(code)` | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:852` | ScanPanel onManual | open Manual Barcode | `barcodeSheet.show(true)` | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:876` | AiPanel onLog | log AI plate + confirm | `logPlate([...plate,...items])` then `aiPlate.confirm` (POST aiConfirm) | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:887` | LibraryPanel onViewChange | switch Recipes/Foods/♥ | setLibraryView | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:907` | LibraryPanel createFoodHref/createRecipeHref | go to create pages | `/foods/new`, `/recipes/new` (both exist) + onNavigate closes sheet | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:910` | LibraryPanel onPickFood | open food detail | setPickedId + tab search | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:935` | Favorite add/remove (Search detail) | toggle favorite | `addFavorite.mutate` / `removeFavorite.mutate` (favoriteService) | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:948` | Food Detail Log Foods | add + log plate | `logFromDetail` → logPlate | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:949` | Food Detail To Custom | open Create Food prefilled | `router.push('/foods/new?from=<id>')`; page reads `from` (app/(protected)/foods/new/page.tsx) | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:954` | QuickAddPanel onAdd | add quick item to plate | setPlate append | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:978` | EntryEdit To Custom | Create Food prefilled | foodItemId null → `/foods/new?name&calories&protein&carbs&fat` (all read by route as seed); else `?from=` | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:993` | EntryEdit onSave (Done) | update entry | `updateEntry.mutate` PUT foodLogs.entry(id) | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:994` | EntryEdit Remove | delete entry | `deleteEntry.mutate` DELETE foodLogs.entry(id), optimistic; error in top FormErrorAlert | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:1010` | CopyDialog onCopy | copy day/meal | `copyLog.mutate` POST foodLogs.copy | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:1026` | Clear Day confirm | delete day log | `clearDay.mutate(date)` DELETE foodLogs.byDate | OK | - |
| `src/features/food-log/pages/FoodLogPage.tsx:497` | Selection Create Recipe | build recipe from selection | `setRecipeDraft(lines); router.push('/recipes/new')`; RecipeCreatePage reads `useUiStore.getState().recipeDraft` | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodLogHeader.tsx:101` | Calendar button | toggle calendar | onClick={onCalendarToggle} | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodLogHeader.tsx:114` | Customize (sliders) Link | food log settings | href `/food-log/settings` (exists) | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodLogHeader.tsx:118` | More options button | open More sheet | onClick={onMore} | OK | - |
| `src/features/food-log/components/FoodLogPage/WeekStrip.tsx:53` | Day pill (week strip) | select day | onClick → onSelect(day) | OK | - |
| `src/features/food-log/components/FoodLogPage/WeekStrip.tsx:175` | Week strip swipe/scroll | page weeks / load week data | onScroll→onWeeksView; pointer drag on desktop; click-capture suppresses after swipe | OK | - |
| `src/features/food-log/components/FoodLogPage/WeekStrip.tsx:240` | Back to this week | scroll to today's week | scrollToWeek(startOf(today)) | OK | - |
| `src/features/food-log/components/FoodLogPage/CalendarSheet.tsx:88` | Calendar scroll | load visible weeks | onScroll → onWeeksView | OK | - |
| `src/features/food-log/components/FoodLogPage/CalendarSheet.tsx:125` | Calendar DayPill | pick day | onSelect | OK | - |
| `src/features/food-log/components/FoodLogPage/MacroSummary.tsx:64` | Macro summary swipe | page between 2 summaries | onScroll → setPage (dots) | OK | - |
| `src/features/food-log/components/FoodLogPage/MoreSheet.tsx:60` | Nutrition Overview link | open overview | href `/food-log/nutrition-overview` (exists) | OK | - |
| `src/features/food-log/components/FoodLogPage/MoreSheet.tsx:65` | Copy Day | copy day | act(onCopyDay); disabled when no entries | OK | - |
| `src/features/food-log/components/FoodLogPage/MoreSheet.tsx:70` | Select All | select all | act(onSelectAll) | OK | - |
| `src/features/food-log/components/FoodLogPage/MoreSheet.tsx:75` | Clear Day | clear day | act(onClearDay) | OK | - |
| `src/features/food-log/components/FoodLogPage/MoreSheet.tsx:82` | Hide Food Details switch | toggle | onCheckedChange → parent | OK | - |
| `src/features/food-log/components/FoodLogPage/MoreSheet.tsx:92` | Hide Empty Hours switch | toggle | onCheckedChange → parent | OK | - |
| `src/features/food-log/components/FoodLogPage/NotesSection.tsx:36` | Note card | edit note | onClick → onSelect(note) | OK | - |
| `src/features/food-log/components/FoodLogPage/NotesSection.tsx:85` | Add note (+) | new note | onAdd unless full (aria-disabled + explanatory text) | OK | - |
| `src/features/food-log/components/FoodLogPage/NotesSection.tsx:116` | SwipeToDelete note | delete | onDelete(note) → see FoodLogPage:617 | OK | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:110` | Color palette trigger | open palette | Popover open | OK | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:134` | Color swatch | pick color | setColor + close | OK | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:165` | Save note (✓) | save | `save()` → onSave | OK | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:190` | Sheet close (requestClose) | close / discard prompt | dirty → discard ConfirmDialog | OK | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:203` | form onSubmit | save | save() | OK | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:217` | Time input | set noted time | setTime | OK | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:231` | Name Enter key | jump to body | focus body | OK | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:253` | Delete note | delete | onDelete(note) | OK | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:265` | Discard confirm | discard edits | close sheet | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:64` | ✕ / ‹ | exit selection / back to main bar | onExit / onBack | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:96` | View chip | summary sheet | onAction('view') | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:97` | Copy chip | copy submenu | onMode('copy') | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:98` | Move chip | move submenu | onMode('move') | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:99` | Remove chip | confirm remove | onAction('remove') | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:100` | Modify Timestamp chip | time wheel | onAction('timestamp') | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:101` | Create Recipe chip | go to recipe | onAction('recipe') | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:106` | Copy To Now | copy to now | onCopyTo('now') → bulkCopy | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:107` | Copy To Today | copy | onCopyTo('today') | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:108` | Copy To Tomorrow | copy | onCopyTo('tomorrow') | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:109` | Copy To Dates | dates sheet | onCopyTo('dates') | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:110` | Copy To Date & Time | wheel | onCopyTo('datetime') | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:111` | Multi-Paste Inline | paste mode | onMode('paste') → DayTimeline paste buttons | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:116` | Move To Today | move | onMoveTo('today') → bulkMove | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:117` | Move To Tomorrow | move | onMoveTo('tomorrow') | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:118` | Move To Date & Time | wheel | onMoveTo('datetime') | OK | - |
| `src/features/food-log/components/FoodLogPage/RemoveFoodsDialog.tsx:37` | Close ✕ | close | onOpenChange(false) | OK | - |
| `src/features/food-log/components/FoodLogPage/RemoveFoodsDialog.tsx:52` | Remove | bulk delete | onConfirm | OK | - |
| `src/features/food-log/components/FoodLogPage/RemoveFoodsDialog.tsx:61` | Go Back | close | onOpenChange(false) | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectionSummarySheet.tsx:-` | (read-only sheet) | - | no interactive controls besides SheetFrame close | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectDatesSheet.tsx:96` | Selection mode switch | single/range mode | setMode | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectDatesSheet.tsx:109` | Previous month | nav | go(-1) | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectDatesSheet.tsx:117` | Next month | nav | go(1) | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectDatesSheet.tsx:157` | Day cell | toggle date | tap(iso) | OK | - |
| `src/features/food-log/components/FoodLogPage/SelectDatesSheet.tsx:178` | Paste to Dates | confirm | onConfirm(selected) | OK | - |
| `src/features/food-log/components/FoodLogPage/DateTimeWheelSheet.tsx:89` | Date/Hour/Minute wheels | pick | setDay/setHour/setMinute | OK | - |
| `src/features/food-log/components/FoodLogPage/DateTimeWheelSheet.tsx:124` | Confirm (Paste/Move/Done) | confirm | onConfirm(day, time) | OK | - |
| `src/features/food-log/components/FoodLogPage/DateTimeWheelSheet.tsx:133` | Cancel | close | onOpenChange(false) | OK | - |
| `src/features/food-log/components/FoodLogPage/DateTimeSheet.tsx:76` | Date/Hour wheels | pick | setDay/setHour | OK | - |
| `src/features/food-log/components/FoodLogPage/DateTimeSheet.tsx:93` | Select Date and Time | apply | onSelect + close | OK | - |
| `src/features/food-log/components/FoodLogPage/DateTimeSheet.tsx:105` | Log to Date and Time | log plate | onLog (disabled when plate empty) | OK | - |
| `src/features/food-log/components/FoodLogPage/DateTimeSheet.tsx:115` | Cancel | close | onOpenChange(false) | OK | - |
| `src/features/food-log/components/FoodLogPage/CopyDialog.tsx:68` | Copy scope picker | day/meal | setScope | OK | - |
| `src/features/food-log/components/FoodLogPage/CopyDialog.tsx:82` | To date field | date | setToDate | OK | - |
| `src/features/food-log/components/FoodLogPage/CopyDialog.tsx:87` | To meal picker | meal | setToMeal | OK | - |
| `src/features/food-log/components/FoodLogPage/CopyDialog.tsx:99` | Cancel | close | onOpenChange(false) | OK | - |
| `src/features/food-log/components/FoodLogPage/CopyDialog.tsx:107` | Copy | copy | onCopy({fromDate,toDate,mealType,toMealType}) | OK | - |
| `src/features/food-log/components/FoodLogPage/BarcodeSheet.tsx:37` | Manual barcode form submit | lookup | onLookup(code) when 8–14 digits | OK | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:137` | Dialog onOpenChange | close sheet | blocked while logging | OK | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:150` | Close ✕ | close | onOpenChange(false) | OK | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:159` | MealTimePill | date/time sheet | onTimeClick | OK | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:173` | Plate pill | toggle Your Plate | setPlateOpen(!) | OK | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:193` | Show/Hide plate arrow | toggle plate | setPlateOpen(!) | OK | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:251` | Drag handle | drag to open/close plate | pointer delta ±40px → setPlateOpen | OK | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:273` | Tabs (Scan/Search/AI/Quick Add/Library) | switch tab | onValueChange → onTabChange; trigger onClick closes plate | OK | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:314` | Quick Add (submit) | add quick item | type=submit form=quick-add-form → QuickAddPanel onSubmit | OK | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:322` | Log Foods (quick tab) | log plate | onLogPlate() | OK | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:340` | Search input | search foods | onSearchChange | OK | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:350` | Library filter input | filter | libraryFilter.onChange (recipes server-side, foods/favs client-side) | OK | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:360` | Log Foods (search/library) | log plate | onLogPlate() | OK | - |
| `src/features/food-log/components/FoodLogPage/MealTimePill.tsx:12` | Time pill | open date/time sheet | onClick | OK | - |
| `src/features/food-log/components/FoodLogPage/QuickAddPanel.tsx:130` | Quick Add form onSubmit | add to plate | validates → onAdd(...) + reset | OK | - |
| `src/features/food-log/components/FoodLogPage/QuickAddPanel.tsx:168` | Energy unit (kcal/kJ) | choose unit | setUnitOpen(true) → ChoiceSheet | OK | - |
| `src/features/food-log/components/FoodLogPage/QuickAddPanel.tsx:185` | Unit ChoiceSheet onSelect | convert unit | changeUnit | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:79` | See N More | full group list | setOpenGroup(name) | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:117` | Back to results | back | setOpenGroup(null) | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:185` | Search result row | open detail | onSelect → onPick(food) | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:212` | Result row "+" (Multi-Add) | add default serving to plate without leaving search (doc :163-164, :255; settings food-log-settings.ts:43) | `onAdd={() => onPick(food)}` (line 333) → opens Food Detail, nothing added | FIXED (was BROKEN) | build PlateItem from default serving (like LibraryPanel.addFood) and call onAddToPlate |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:336` | History FoodTile + (Multi-Add) | add default serving to plate | `onAdd={() => onPick(food)}` (line 341) → opens detail | FIXED (was BROKEN) | same as above |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:347` | Load more (group full list) | load more results | onLoadMore → top += 25 | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:383` | FavoritesBar tile | add favorite to plate | quickAddFavorite → onAddToPlate | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:416` | FoodList (History) Clear filters / Load more | clear / load | onSearchChange('') / onLoadMore | OK | - |
| `src/features/food-log/components/FoodLogPage/FavoritesBar.tsx:20` | Favorite tile | add to plate | onQuickAdd(favorite) | OK | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:207` | Recipes/Foods/♥ switch | switch view | onViewChange | OK | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:216` | Sort favorites | sort favorites | `onClick={() => toast('Sorting is coming soon')}` | UNIMPLEMENTED | implement sort or hide button |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:225` | + Create food / recipe Link | create pages | `/foods/new` or `/recipes/new`, onClick closes sheet | OK | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:262` | Recipe tile (tap and +) | add recipe to plate | addRecipe(recipe) | OK | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:274` | Load more recipes | load more | onLoadMoreRecipes | OK | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:297` | FoodList Clear filters / Load more | clear / load | onClearFilter / onLoadMoreFoods | OK | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:307` | My food tile tap | open detail | onPickFood | OK | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:312` | My food tile + | add default serving | addFood(food) → onAddToPlate | OK | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:335` | Favorite tile (tap and +) | add to plate | addFavorite | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodTile.tsx:225` | Tile + button (MultiAdd) | quick add | onClick={onAdd}; disabled={!onAdd} | OK | (callers without onAdd: see IngredientSearchSheet/IngredientPickerSheet rows) |
| `src/features/food-log/components/FoodLogPage/FoodTile.tsx:255` | Tile main button (split) | select | onSelect | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodTile.tsx:265` | Tile button | select | onSelect | OK | - |
| `src/features/food-log/components/FoodLogPage/DayTimeline.tsx:90` | HourPill (hour with foods) | select hour's foods | onPress → onToggleHour / onStart | OK | - |
| `src/features/food-log/components/FoodLogPage/DayTimeline.tsx:105` | HourPill long-press (setting LongPress) | hold to add food at hour | only rendered when `onPress` undefined (line 88 `if (onPress) return <button onClick={onPress}>`); hours that have foods get onPress (line 319-324) so long-press-to-add is lost, and "+" is hidden when longPressToAdd (line 337) → no way to add at an hour that already has foods | FIXED (was BROKEN, setting-dependent) | combine: tap=select, hold=add on the same pill |
| `src/features/food-log/components/FoodLogPage/DayTimeline.tsx:328` | Paste at hour | paste selection | selection.onPaste(time) | OK | - |
| `src/features/food-log/components/FoodLogPage/DayTimeline.tsx:338` | + Add at hour | open Add Food | onAddAt(time) | OK | - |
| `src/features/food-log/components/FoodLogPage/DayTimeline.tsx:381` | Food tile long-press | start selection | 500ms hold → selection.onStart([id]); click suppressed after hold | OK | - |
| `src/features/food-log/components/FoodLogPage/DayTimeline.tsx:400` | Food tile tap | edit / toggle in selection | onSelectEntry / onToggleEntry | OK | - |
| `src/features/food-log/components/FoodLogPage/DayTimeline.tsx:139` | SelectCheck | toggle selection | onToggle | OK | - |
| `src/features/food-log/components/FoodLogPage/EntryEditDialog.tsx:195` | Time pill | change time | timeSheet.show → DateTimeSheet timeOnly → setTime | OK | - |
| `src/features/food-log/components/FoodLogPage/EntryEditDialog.tsx:203` | Done (header) | save entry | save(change.current) → onSave → PUT entry | OK | - |
| `src/features/food-log/components/FoodLogPage/EntryEditDialog.tsx:247` | FoodDetailView onBack (✕) | close | onOpenChange(false) | OK | - |
| `src/features/food-log/components/FoodLogPage/EntryEditDialog.tsx:248` | FoodDetailView onAdd/onLogFoods | n/a in edit mode | `() => undefined` but QuantityBar variant='edit' only renders Done (→ edit.onDone) | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/FoodDetailHeader.tsx:15` | Back / Close | back to results / close | onBack | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/DetailActions.tsx:33` | To Custom | Create Food prefilled | onCopyToCustom → router.push `/foods/new?from=` | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/FoodDetailView.tsx:283` | canCopyToCustom flag | hide "To Custom" for user's own food (DetailActions.tsx:11 doc) | passed as constant `canCopyToCustom` (always true) → shown for own foods too | UNKNOWN | pass `!food.isMine` if doc is the intent |
| `src/features/food-log/components/FoodLogPage/FoodDetail/DetailActions.tsx:41` | Favorite | toggle favorite preset | toggleFavorite → add/remove favorite; disabled for logged-only entries (EntryEditDialog passes isFavoritePending \|\| !inLibrary) | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/DetailActions.tsx:60` | Remove (edit) | delete entry | edit.onRemove → onRequestDelete | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:172` | Done (edit variant) | save | onAdd → edit.onDone | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:183` | Log Foods | log immediately | onLogFoods → logFromDetail | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:193` | Add | add to plate | onAdd → onAddToPlate | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:229` | Amount/macro mode toggle | switch entry mode | toggleMode | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:242` | g/oz/serving unit chips | change unit | onUnitChange | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:262` | Serving chips | change serving | onSelectServing | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:281` | Macro key chips | pick macro to enter | onMacroKeyChange | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:311` | Amount field wrapper | focus input | amountInput.focus() | OK | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:322` | Quantity / macro inputs | edit amount | onQuantityChange / onMacroTextChange | OK | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlatePanel.tsx:89` | Empty plate "Add" | back to tabs | onAddFoods → setPlateOpen(false) | OK | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlatePanel.tsx:146` | Log Foods (plate) | log plate | onLog() | OK | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlateItemRow.tsx:50` | Swipe to delete row | remove from plate | onRemove | OK | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlateItemRow.tsx:71` | Amount button | edit amount | `disabled={disabled \|\| !onEdit}`; onEdit undefined when `!canEditItem(item)` (plate-edit.utils.ts:20 requires `item.grams`) → Quick Add, recipe and favorite items (FoodSearchPanel.quickAddFavorite, LibraryPanel.addRecipe/addFavorite set no `grams`) show a greyed amount with no explanation | UNIMPLEMENTED | set grams on favorite items; allow serving-count edit for recipes |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlateQuantityEditor.tsx:43` | Unit chips (g/oz/servings) | switch unit | onChange(switchUnit) | OK | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlateQuantityEditor.tsx:66` | Numeric keypad | type amount | type() | OK | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlateQuantityEditor.tsx:76` | Log Foods | apply + log | onLog → onUpdate + onLog(items) | OK | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlateQuantityEditor.tsx:86` | Done | apply edit | onDone → finish → onUpdate | OK | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlateNutrition.tsx:114` | Plate/Day switch | switch nutrition view | setView | OK | - |
| `src/features/food-log/components/FoodLogPage/ScanPanel.tsx:81` | Barcode / Label switch | change scan mode | setMode; Label mode has no working action (see below) | UNIMPLEMENTED | hide Label option until implemented |
| `src/features/food-log/components/FoodLogPage/ScanPanel.tsx:90` | Enter barcode manually | manual sheet | onManual | OK | - |
| `src/features/food-log/components/FoodLogPage/ScanPanel.tsx:99` | Upload label photo | upload label | opens file picker; input onChange (line 163) → `comingSoon()` toast 'Label scanning is coming soon' | UNIMPLEMENTED | - |
| `src/features/food-log/components/FoodLogPage/ScanPanel.tsx:108` | Flash toggle | torch | toggleTorch; disabled when unsupported (hardware) | OK | - |
| `src/features/food-log/components/FoodLogPage/ScanPanel.tsx:133` | Capture nutrition label | capture label | `onClick={comingSoon}` → toast | UNIMPLEMENTED | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:90` | Remove photo | remove | onRemove | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:178` | File input | add photos | addPhotos | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:217` | Snap/Describe switch | mode | setMode | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:246` | Capture | go to camera | setMode('snap') | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:255` | Upload photos | file picker | fileInput.click() | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:281` | Description textarea | describe meal | setDescription | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:290` | Analyze / Try again | AI analyze | onAnalyze → useAiPlate.analyze → POST foodLogs.aiAnalyze | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:354` | Upload (camera view) | file picker | fileInput.click() | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:363` | Flash toggle | torch | toggleTorch | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:380` | Take photo | capture frame | capture() → canvas → addPhotos | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:90` | Ingredient amount button | amount sheet | onEdit → amountSheet.show(ingredient) | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:156` | Remove ingredient | remove | onRemove → onRemoveIngredient | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:200` | Retry / Search (unmatched ingredient) | retry resolve / search replacement | onRetry (POST aiResolveIngredient) / searchSheet.show | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:207` | Remove (unmatched) | remove | onRemove | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:300` | Dish amount button | scale dish | onEditDish → amountSheet dish | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:305` | Expand/Collapse Ingredients | toggle | setOpen(!open) | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:501` | Start over | reset AI | onStartOver → aiPlate.reset | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:547` | Log Foods | log AI result | logFoods → onLog(items, confirmations) | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:566` | AmountSheet onSave | set grams / dish scale | onSetDishScale / onSetGrams | OK | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:595` | IngredientSearchSheet onSelect | replace ingredient | onReplaceIngredient | OK | - |
| `src/features/food-log/components/FoodLogPage/AmountSheet.tsx:76` | Amount form submit | save | onSave(grams,{unit,amount}) + close | OK | - |
| `src/features/food-log/components/FoodLogPage/AmountSheet.tsx:101` | Unit chips | change unit | changeUnit | OK | - |
| `src/features/food-log/components/FoodLogPage/AmountSheet.tsx:132` | Cancel | close | onOpenChange(false) | OK | - |
| `src/features/food-log/components/FoodLogPage/IngredientSearchSheet.tsx:75` | Search input | search | setSearch | OK | - |
| `src/features/food-log/components/FoodLogPage/IngredientSearchSheet.tsx:94` | Result tile | replace ingredient | onSelect(resolvedFrom) + close | OK | - |
| `src/features/food-log/components/FoodLogPage/IngredientSearchSheet.tsx:94` | Result tile "+" (when Logger highlight = MultiAdd) | add | FoodTile gets onSelect but no onAdd → split layout renders `plusButton` with `disabled={!onAdd}` (FoodTile.tsx:229) — visible dead + | FIXED (was DEAD, setting-dependent) | pass `onAdd` = same as onSelect, or pass settings with highlight 'None' |
| `src/features/food-log/components/FoodLogSettingsPage/SettingsSection.tsx:51` | SettingRow (href) | open subpage | Link href | OK | - |
| `src/features/food-log/components/FoodLogSettingsPage/SettingsSection.tsx:58` | SettingRow (onEdit/onOpen) | open sheet / subpage | onClick={onEdit ?? onOpen} | OK | - |
| `src/features/food-log/components/FoodLogSettingsPage/OptionList.tsx:22` | Radio option | choose | onChange(value) | OK | - |
| `src/features/food-log/components/FoodLogSettingsPage/CheckList.tsx:25` | Checkbox row | toggle | onToggle | OK | - |
| `src/features/food-log/components/FoodLogSettingsPage/ToggleList.tsx:27` | Switch | toggle | onCheckedChange → onToggle | OK | - |
| `src/features/food-log/components/FoodLogSettingsPage/SettingSheets.tsx:77` | Hour range handles (drag + arrow keys) | set range | pointer drag / keydown → move | OK | - |
| `src/features/food-log/components/FoodLogSettingsPage/SettingSheets.tsx:103` | Save hour range | save | onSave(range) + close → update() → PUT foodLogs.settings | OK | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:90` | SubPageHeader back | back | router.back() (SubPageHeader default) | OK | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:94` | Nutrient Reporting options | overages mode | choose('overages') → PUT settings; consumed by FoodLogPage showOverages | OK | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:103` | Hour Range Edit | edit range | sheet.show('hourRange') | OK | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:108` | Timeline rows Edit (Alignment, Add Foods to Hour, Timestamps, Hourly Totals, Week Banner, Calendar Scrolling) | change setting | sheet.show(key) → ChoiceSheet → PUT settings; all consumed in FoodLogPage/DayTimeline/FoodLogHeader | OK | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:108` | Timeline row Edit: Premove (`premoveEnabled`) | change behaviour | saved via PUT settings but no FE consumer (`premoveEnabled` only referenced in FoodLogSettingsPage + food-log-settings.ts) | UNKNOWN | verify BE uses it or hide row |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:119` | Branded / Open Food Facts Results Edit | filter search sources | saved; FE only invalidates ['foods'] (use-food-log-settings.ts:38-41); filter assumed server-side | UNKNOWN | verify BE applies flags in search |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:130` | Timeline Food Tiles | subpage | href `/food-log/settings/timeline-tiles` (exists) | OK | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:135` | Logger Food Tiles | subpage | href `/food-log/settings/logger-tiles` (exists) | OK | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:143` | Logger Banner | subpage | href `/food-log/settings/logger-banner` (exists) | OK | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:149` | Time Selection (chevron row) | subpage | `onOpen={comingSoon}` → toast 'This setting is coming soon' | UNIMPLEMENTED | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:149` | Favorite Measurements (chevron row) | subpage | `onOpen={comingSoon}` → toast | UNIMPLEMENTED | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:151` | Optimization Edit | change optimization | saved via PUT settings; no FE consumer of `optimization` | UNKNOWN | verify BE uses it |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:161` | foodiconpack.com / CC BY 4.0 / Noto Emoji links | external attribution | `<a target=_blank>` | OK | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:200` | ChoiceSheet onSelect | apply choice | choose(editing, value) | OK | - |
| `src/features/food-log/hooks/use-food-log-settings.ts:33` | All settings writes (update) | persist + feedback | optimistic set; onError only `logger.error` + rollback, no toast → toggle silently snaps back | BROKEN (silent failure) | toast on error |
| `src/features/food-log/pages/LoggerBannerPage.tsx:32` | SubPageHeader back | back | router.back() | OK | - |
| `src/features/food-log/pages/LoggerBannerPage.tsx:41` | Banner nutrient toggles | show/hide nutrient | update({[key]:checked}) → PUT settings; consumed by AddFoodDialog banner | OK | - |
| `src/features/food-log/pages/LoggerBannerPage.tsx:51` | Banner display option | display mode | update({loggerBannerDisplay}) | OK | - |
| `src/features/food-log/pages/LoggerFoodTilesPage.tsx:42` | Tile density / display info / highlight | logger tile opts | change → update(logger*) | OK | - |
| `src/features/food-log/pages/TimelineFoodTilesPage.tsx:42` | Tile density / display info / highlight | timeline tile opts | change → update(timeline*) | OK | - |
| `src/features/food-log/components/FoodLogSettingsPage/TileOptionSections.tsx:31` | Density/Display/Highlight lists | change | onChange(patch) | OK | - |
| `src/features/food-log/pages/NutritionOverviewPage.tsx:33` | ErrorState Retry | refetch | data.refetch() → GET nutrition.overview | OK | - |
| `src/features/food-log/pages/NutritionOverviewPage.tsx:39` | SubPageHeader back | back | router.back() | OK | - |
| `src/features/food-log/pages/NutritionOverviewPage.tsx:41` | RangeTabs | change range | setRange → refetch overview | OK | - |
| `src/features/food-log/pages/NutritionOverviewPage.tsx:70` | Contributors switch | show top contributors | setContributorsOn → NutrientCard contributors | OK | - |
| `src/features/food-log/components/NutritionOverviewPage/RangeTabs.tsx:22` | Range tab button | select range | onChange(range) | OK | - |
| `src/features/food-log/components/NutritionOverviewPage/NutrientCard.tsx:116` | Tile ChevronRight (each nutrient card) | open nutrient detail (`/dashboard/nutrition/[key]` exists) | chevron inside plain `<li>`; no Link/onClick | DEAD | wrap tile in Link to routePath.dashboardNutrient(nutrient.key) |
| `src/features/food-log/components/NutritionOverviewPage/NutrientCard.tsx:78` | "Top 3 Contributors" row with ChevronRight | open contributors/summary (`/dashboard/nutrition/[key]/summary` exists) | static `<p>` + chevron, no handler | DEAD | Link to routePath.dashboardNutrientSummary(key) |
| `src/features/food-log/pages/CreateFoodPage.tsx:91` | SubPageHeader back | back | router.back() | OK | - |
| `src/features/food-log/pages/CreateFoodPage.tsx:39` | Edit Icon | icon sheet | iconSheet.show → ChooseIconSheet → patch iconKey | OK | - |
| `src/features/food-log/pages/CreateFoodPage.tsx:56` | Create | create food | form.submit(false) → useCreateFood (foodService.create) → router.back() | OK | - |
| `src/features/food-log/pages/CreateFoodPage.tsx:57` | Create & Add | create + log | createFood then addEntry (POST foodLogs.entries, today, grams) → push `/food-log` | OK | note: if create succeeds and addEntry fails, a retry creates a duplicate food |
| `src/features/food-log/pages/CreateFoodPage.tsx:85` | `?from=` / `?name&calories&protein&carbs&fat` prefill | prefill | read by app/(protected)/foods/new/page.tsx and passed as fromFoodId/seed; if `from` fetch errors, form silently blank | OK | - |
| `src/features/food-log/components/CreateFoodPage/FormFooter.tsx:16` | Create | create | onCreate | OK | - |
| `src/features/food-log/components/CreateFoodPage/FormFooter.tsx:26` | Create & Add | create+add | onCreateAndAdd | OK | - |
| `src/features/food-log/components/CreateFoodPage/GeneralSection.tsx:58` | Edit Icon | open icon sheet | onEditIcon | OK | - |
| `src/features/food-log/components/CreateFoodPage/GeneralSection.tsx:78` | Name / Brand inputs | edit | onChange patch | OK | - |
| `src/features/food-log/components/CreateFoodPage/GeneralSection.tsx:100` | Scan barcode | camera scan | setSheet('scan') → ScanPanel → setCode (sets barcode + closes) | OK | - |
| `src/features/food-log/components/CreateFoodPage/GeneralSection.tsx:110` | Remove barcode | clear | onChange({barcode:''}) | OK | - |
| `src/features/food-log/components/CreateFoodPage/GeneralSection.tsx:119` | Enter barcode manually | manual sheet | setSheet('manual') → BarcodeSheet onLookup=setCode | OK | - |
| `src/features/food-log/components/CreateFoodPage/GeneralSection.tsx:139` | ScanPanel inside Create Food (Label mode/upload/capture) | - | same ScanPanel → Label mode actions toast 'coming soon' | UNIMPLEMENTED | hide Label mode here |
| `src/features/food-log/components/CreateFoodPage/ServingSection.tsx:33` | Per serving / per 100g switch | basis | onBasisChange | OK | - |
| `src/features/food-log/components/CreateFoodPage/ServingSection.tsx:53` | Weight / unit / serving qty / serving name | edit | onChange patch | OK | - |
| `src/features/food-log/components/CreateFoodPage/NutritionSection.tsx:54` | Nutrient unit picker | change unit | onUnit → setUnit (converts) | OK | - |
| `src/features/food-log/components/CreateFoodPage/NutritionSection.tsx:72` | Nutrient value input | edit | onValue | OK | - |
| `src/features/food-log/components/CreateFoodPage/NutritionSection.tsx:101` | Table layout switch | mode | onModeChange | OK | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:253` | SubPageHeader back | step2→step1 else router.back() | onBack override on step 2 | OK | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:311` | Next (step 1 submit) | validate → step 2 | next() (zod STEP_ONE) | OK | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:354` | Create & Add | create + log | createAndLog.mutate → POST recipes.createAndLog → push `/food-log` | OK | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:355` | Create | create recipe | createRecipe.mutate → POST recipes.root → push `/food-log` | OK | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:364` | IngredientEditorBar (line) | edit qty/unit | patch line / setEditingKey(null) | OK | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:386` | IngredientEditorBar (field) | edit servings/weight/prep/cook | setFieldValue / setField(null) | OK | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:396` | IngredientPickerSheet onSelect | add ingredient | addFood(food) | OK | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:410` | ChooseIconSheet onSelect | set icon | setIconKey | OK | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:420` | StepSheet onSave | add/edit step | setSteps | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipeForm.tsx:74` | form onSubmit | Next | onNext | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipeForm.tsx:99` | Recipe name input | edit | onNameChange | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipeForm.tsx:104` | Serving Quantity / Total Weight KeypadField | open keypad | onFieldPress | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipeForm.tsx:134` | Add ingredient (+) | picker | onAddIngredient → picker.show | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipeForm.tsx:168` | Next | submit | type=submit | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipeIngredientRow.tsx:43` | Swipe delete ingredient | remove | onRemove | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipeIngredientRow.tsx:68` | Amount button | edit amount | onEdit (disabled until detail loads) | OK | - |
| `src/features/food-log/components/RecipeCreatePage/IngredientEditorBar.tsx:62` | Unit chips | change unit | onUnit | OK | - |
| `src/features/food-log/components/RecipeCreatePage/IngredientEditorBar.tsx:79` | Keypad | type | onText | OK | - |
| `src/features/food-log/components/RecipeCreatePage/IngredientEditorBar.tsx:82` | Done | close editor | onDone | OK | - |
| `src/features/food-log/components/RecipeCreatePage/KeypadField.tsx:37` | Keypad field button | open keypad | onPress(button) | OK | - |
| `src/features/food-log/components/RecipeCreatePage/IngredientPickerSheet.tsx:51` | Search input | search | setSearch | OK | - |
| `src/features/food-log/components/RecipeCreatePage/IngredientPickerSheet.tsx:68` | Result tile | add ingredient | onSelect(food) + close | OK | - |
| `src/features/food-log/components/RecipeCreatePage/IngredientPickerSheet.tsx:68` | Result tile "+" (Logger highlight = MultiAdd) | add | FoodTile has onSelect, no onAdd → disabled + rendered (FoodTile.tsx:229) | FIXED (was DEAD, setting-dependent) | pass onAdd |
| `src/features/food-log/components/RecipeCreatePage/RecipeNutrition.tsx:62` | Serving/Recipe switch | view | setView | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:146` | Reorder step handle | drag reorder | dnd-kit listeners → onDragEnd → onReorderSteps | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:157` | Swipe delete step | remove | onRemove | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:158` | Step row | edit step | onEdit → stepSheet.show({id}) | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:252` | Edit Icon | icon sheet | onEditIcon | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:263` | Prep / Cook time fields | keypad | onFieldPress | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:294` | Link / Description inputs | edit | onLinkChange / onDescriptionChange | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:328` | Add step (+) | step sheet | onAddStep (disabled at 50) | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:367` | Create & Add | create+log | onCreateAndAdd | OK | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:378` | Create | create | onCreate | OK | - |
| `src/features/food-log/components/RecipeCreatePage/StepSheet.tsx:31` | Step form submit / Save | save step | onSave(text) | OK | - |
| `src/features/foods/pages/FoodsPage.tsx:133` | ErrorState Retry | refetch | foods.refetch() | OK | - |
| `src/features/foods/pages/FoodsPage.tsx:140` | Create food (header) | open create dialog | openCreate → CustomFoodDialog | OK | - |
| `src/features/foods/pages/FoodsPage.tsx:146` | Search input | search | setSearch + reset top | OK | - |
| `src/features/foods/pages/FoodsPage.tsx:156` | Scope ToggleGroup | filter scope | setScope | OK | - |
| `src/features/foods/pages/FoodsPage.tsx:187` | Clear filters | reset | clearFilters | OK | - |
| `src/features/foods/pages/FoodsPage.tsx:189` | Create food (empty state) | open create dialog | openCreate | OK | - |
| `src/features/foods/pages/FoodsPage.tsx:193` | Food row (FoodRow, chevron inside button) | open detail | setSelectedId → FoodDetailDialog (GET food) | OK | - |
| `src/features/foods/pages/FoodsPage.tsx:194` | Load more | load more | top += 25 | OK | - |
| `src/features/foods/pages/FoodsPage.tsx:213` | CustomFoodDialog submit | create/update food | createFood.mutate / updateFood.mutate (foodService.create/update); errors inline | OK | - |
| `src/features/foods/pages/FoodsPage.tsx:227` | Delete food confirm | delete food | `deleteFood.mutate(id,{onSuccess})`; no onError, ConfirmDialog has no error prop, useFoodMutation onError only logs (use-foods.ts:105-108, comment says error shown inline but nothing renders deleteFood.error) | BROKEN (silent failure) | render deleteFood.error or toast |
| `src/features/foods/components/FoodsPage/FoodDetailDialog.tsx:101` | Delete | open confirm | onRequestDelete(food) | OK | - |
| `src/features/foods/components/FoodsPage/FoodDetailDialog.tsx:104` | Edit | open edit dialog | onEdit(food) | OK | - |
| `src/features/foods/components/FoodsPage/CustomFoodDialog.tsx:80` | form submit | save | handleSubmit(submit) → onSubmit | OK | - |
| `src/features/foods/components/FoodsPage/CustomFoodDialog.tsx:97` | Icon picker | choose icon | iconSheet.show → onSelect=onChange | OK | - |
| `src/features/foods/components/FoodsPage/CustomFoodDialog.tsx:145` | Category select | choose category | onValueChange=onChange | OK | - |
| `src/features/foods/components/FoodsPage/CustomFoodDialog.tsx:178` | Cancel | close | onOpenChange(false) | OK | - |
| `src/features/foods/components/FoodsPage/CustomFoodDialog.tsx:186` | Save | submit | type=submit | OK | - |
| `src/features/foods/components/FoodList.tsx:53` | Clear filters | clear | onClearFilters | OK | - |
| `src/features/foods/components/FoodList.tsx:84` | Load more | load more | onLoadMore | OK | - |
| `src/features/foods/components/FoodRow.tsx:20` | Row button (chevron inside) | select | onSelect(food) | OK | - |
| `src/features/foods/components/FoodRow.tsx:56` | + quick add | quick add | onQuickAdd(food) | OK | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:56` | + Add nutrition data | open sheet for today | open() | OK | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:53` | SubPageHeader back | back | router.back() | OK | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:71` | ErrorState Retry | refetch | query.refetch() | OK | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:118` | Edit (pencil) per day | edit day | open(day.date) | OK | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:142` | Sheet onDateChange | switch day | setTarget date (sheet remounts via key) | OK | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:144` | Sheet onDelete | confirm delete | confirm.show | OK | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:150` | Sheet onSave | save day | save.mutate → PUT nutritionData.root | OK | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:163` | Delete confirm | delete day | remove.mutate → DELETE nutritionData.root?date; error toast | OK | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:198` | Title click | pick date | onTitleClick → SelectDateSheet → onDateChange | OK | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:212` | Trash | delete | onDelete | OK | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:225` | form submit / Save | save | submit() validates → onSave | OK | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:244` | Open Food Log | go to that day's log | `openFoodLogDate(date)` + href `/food-log`; FoodLogPage reads ui.store foodLogDate (FoodLogPage.tsx:262-271) | OK | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:280` | Calories/Protein/Fat/Carbs inputs | edit | set(key) (readOnly when locked, with explanatory note) | OK | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:323` | Fasting switch | toggle | setFasting (disabled when locked, note explains) | OK | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:333` | Incomplete switch | toggle | setIncomplete | OK | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:351` | Numeric keypad (coarse pointer) | type | set(active) | OK | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:360` | SelectDateSheet onSelect | change date | onDateChange | OK | - |

### C. Program / onboarding / auth / users

| Component (file:line) | Button/Action | Expected | Actual | Status | Fix |
|---|---|---|---|---|---|
| `src/app/(protected)/program/new/page.tsx:6` | redirect /program/new | go to first wizard step | redirect(stepHref('style')) → /program/new/style (valid) | OK | - |
| `src/app/(protected)/program/new/[step]/page.tsx:14` | [step] guard | accept only wizard steps | isWizardStep(WIZARD_STEPS: style,diet,floor,training,distribute,protein,editor,same-different,manual-targets,review) else notFound() | OK | - |
| `src/app/(protected)/program/goal/edit/page.tsx:6` | redirect /program/goal/edit | open first goal-edit step | redirect('/program/goal/edit/params') (valid) | OK | - |
| `src/app/(protected)/program/goal/edit/[step]/page.tsx:9` | [step] guard | accept params/review | step !== params && !== review → notFound() | OK | - |
| `src/app/(protected)/program/check-in/[module]/page.tsx:14` | [module] guard | accept known modules | isModuleKey (intro, partial-logging, program-update) else notFound() | OK | - |
| `src/app/(onboarding)/layout.tsx:6` | AuthGuard wrapper | require login for /onboarding | AuthGuard → /login?redirect=/onboarding | OK | - |
| `src/features/program/pages/ProgramPage.tsx:57` | ErrorState Retry | refetch program | program.refetch() | OK | - |
| `src/features/program/pages/ProgramPage.tsx:80` | "Create program" (empty state) | open New Program wizard | Link /program/new → redirect /program/new/style | OK | see End program row: empty state reachable only until onboarding state refetches |
| `src/features/program/pages/ProgramPage.tsx:92` | "More" (⋮) button | open Strategy menu sheet | openSheet('menu') → ProgramActions SheetFrame | OK | - |
| `src/features/program/pages/ProgramPage.tsx:141` | ProgramCard onEdit | open Edit Program sheet | openSheet('program') | OK | - |
| `src/features/program/pages/ProgramPage.tsx:109` | Empty state after End program | user can create new program right after ending | BE onboarding IsRequired = !hasProgram; OnboardingGuard redirects to /onboarding once ['onboarding','state'] refetches (stale 60s / focus) | BROKEN | exempt users with consent from onboarding when program ended, or route End→/program/new |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:366` | "Change program style" row | open style sheet | show('style') (session++) | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:371` | "Set TDEE manually" row | open TDEE sheet | show('tdee') | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:376` | "End program" row | open confirm | show('end') → ConfirmDialog | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:360` | Menu sheet onOpenChange | close menu | onChange('menu') → close() | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:385` | Edit Program sheet onOpenChange | close unless pending | onChange('program', programEdit) | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:169` | Edit Program form onSubmit | save diet/protein/floor | onSaveProgram → useUpdateProgramGoal → PUT apiRoutes.programs.goal, close on success | OK | success toast reads "Goal updated" (use-program.ts:88) for a program edit; floor bounds/label hard-coded kcal |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:191` | Diet style ChoiceGroup | pick diet | setDietStyle | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:200` | Protein level ChoiceGroup | pick protein | setProteinLevel | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:212` | Calorie floor input | edit floor | setFloor, validated 800-3000 | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:71` | "Use a N% shift" (feasibility) | resubmit with reduced shift | submit(reduceShiftRequestOf) → PUT programs.goal | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:80` | "Use an even split" | resubmit Even | submit({calorieShiftMode:'Even'}) | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:125` | Footer Save (submit) | submit sheet form | type=submit, disabled while pending/invalid | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:138` | Footer Cancel | close sheet | onCancel → close() | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:400` | Style sheet onOpenChange | close | onChange('style', style) | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:239` | Style form onSubmit | change style | onChangeStyle → PUT apiRoutes.programs.style | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:252` | Style ChoiceGroup | pick style | setStyle | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:415` | TDEE sheet onOpenChange | close | onChange('tdee', tdee) | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:281` | TDEE form onSubmit | set manual TDEE | onSetManualTdee → PUT apiRoutes.programs.expenditure | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:309` | TDEE input | type value | setTyped | OK | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:436` | ConfirmDialog "End program" | end program, show failure | onEnd → DELETE programs/current; on error nothing shown: `end.error` never rendered (ConfirmDialog has no error prop) and useProgramMutation onError only logs | BROKEN | pass error into ConfirmDialog or toast in onError |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:430` | ConfirmDialog onOpenChange | close | onChange('end') | OK | - |
| `src/features/program/components/ProgramPage/ProgramCard.tsx:51` | "New Program" chip | open wizard | Link /program/new | OK | - |
| `src/features/program/components/ProgramPage/ProgramCard.tsx:52` | "Edit Program" chip | open Edit Program sheet | onClick=onEdit | OK | - |
| `src/features/program/components/ProgramPage/GoalCard.tsx:76` | "New Goal" chip | start a new goal flow | Link routePath.programNew (/program/new) — same target as New Program; wizard has no goal step, goal comes from current program | BROKEN | point to routePath.programGoalEdit (or a goal-first flow) |
| `src/features/program/components/ProgramPage/GoalCard.tsx:77` | "Edit Goal" chip | open goal edit | Link /program/goal/edit → redirect /params | OK | - |
| `src/features/program/components/ProgramPage/ActionChip.tsx:25` | ActionChip (Link/button) | link or button | href → Link, else button onClick | OK | - |
| `src/features/program/components/ProgramPage/WeekMacroChart.tsx:124` | Day letter buttons | select day | onSelect(index) (only when onSelect passed) | OK | - |
| `src/features/program/components/CheckInPage/CheckInButton.tsx:11` | "CHECK IN" | open check-in hub | Link /program/check-in | OK | - |
| `src/features/program/components/FeasibilityNotice.tsx:98` | Apply buttons | apply BE suggestion | button.onClick from caller | OK | - |
| `src/features/onboarding/components/OnboardingPage/CalorieShiftAlert.tsx:116` | "Pick a fix" buttons | apply shift fix | onApply(fix) + focusWizardContent | OK | - |
| `src/features/onboarding/components/OnboardingPage/WizardShell.tsx:78` | Back (chevron) | go back | onBack prop | OK | - |
| `src/features/onboarding/components/OnboardingPage/WizardShell.tsx:129` | Primary Next button | advance | onNext unless pending | OK | - |
| `src/features/program/hooks/use-wizard-nav.ts:159` | wizard next() | next step in flow | push stepHref(steps[index+1]) | OK | - |
| `src/features/program/hooks/use-wizard-nav.ts:163` | wizard back() first step | leave wizard cleanly | index 0 → wizard reset() + push /program; goal-edit pendingGoal NOT cleared, so next "New Program" shows "Your new goal is set" and creates program with the abandoned goal (wizardGoalOf prefers pending) | BROKEN | call useGoalEditStore.getState().setPendingGoal(null) in back/close |
| `src/features/program/hooks/use-wizard-nav.ts:138` | Deep-link/reload guard | send to first unanswered step | firstUnansweredBefore returns null when step not in stepsFor(programType) (new-program-steps.ts:82 `index <= 0`), so /program/new/editor, /same-different, /manual-targets with empty store render; index falls back to 0 so Next goes to 'diet', Back exits | FIXED (was BROKEN) | treat index === -1 as "redirect to first unanswered (style)" |
| `src/features/program/hooks/use-wizard-nav.ts:169` | close() | close wizard | defined but no caller | DEAD | remove or wire |
| `src/features/program/pages/NewProgramStepPage.tsx:185` | "Try again" (setup) | refetch setup | setup.refetch() | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:236` | Style option | choose type | setPref('programType') | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:239` | Style Next | prefill from pending goal, next | setPref diet/protein if pendingGoal, nav.next | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:249` | Diet option | choose diet | setPref('dietStyle') | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:253` | Floor option | choose floor | setPref('floor') | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:260` | Training option | choose training | setPref('trainingType') | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:269` | Distribution mode/days/percent | set distribution | setPref distribution/shiftDays/shiftPercent | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:279` | Distribute Next | persist shown mode, next | setPref if differs, nav.next | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:286` | Protein option | choose protein | setPref('proteinLevel') | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:310` | Editor onChange | edit day | wizard.updateDay | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:311` | Editor Reset All Days | restore unlocked days | setDays from baseDays | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:317` | Editor Try again | rerun preview | preview.reset() → effect reruns POST programs/preview | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:116` | applyShiftFix | apply BE fix | setPref + reset preview/create + toast | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:330` | Same/different option | choose mode | setPref('manualMode') | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:332` | Same/different Next | seed manual days once | always setManualDays(base) → coming Back then Next wipes all edits made on manual-targets | BROKEN | seed only when manualDays null or mode length changed |
| `src/features/program/pages/NewProgramStepPage.tsx:353` | Manual targets onChange | edit day | setManualDays patch | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:404` | Review "Try again" | rerun preview | preview.reset() | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:433` | Review reached end | unlock Done | markReviewed | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:444` | Review "Done" | create program | createProgram → POST programs; success: reset wizard, clear pendingGoal, push /program | OK | - |
| `src/features/program/pages/NewProgramStepPage.tsx:472` | WizardShell onBack | previous step / exit | nav.back | OK | see use-wizard-nav.ts:163 |
| `src/features/program/components/NewProgramPage/EditorStep.tsx:69` | "Try again" | retry preview | onRetry | OK | - |
| `src/features/program/components/NewProgramPage/EditorStep.tsx:93` | "Reset All Days" | reset | onResetAll | OK | - |
| `src/features/program/components/NewProgramPage/EditorStep.tsx:101` | Lock/unlock day | toggle lock | onChange(selected,{locked}) | OK | - |
| `src/features/program/components/NewProgramPage/EditorStep.tsx:126` | Calorie NumberField | set kcal | clamp 0..kcalMax, cap protein | OK | - |
| `src/features/program/components/NewProgramPage/EditorStep.tsx:145` | Protein RangeField | set g/kg | onChange | OK | - |
| `src/features/program/components/NewProgramPage/EditorStep.tsx:159` | Carb:Fat RangeField | set ratio | onChange(percent/100) | OK | - |
| `src/features/program/components/NewProgramPage/ManualTargetsStep.tsx:77` | Day selector (different mode) | select day | onSelect | OK | - |
| `src/features/program/components/NewProgramPage/ManualTargetsStep.tsx:90` | Calories field | set kcal | onChange(index,{kcal}) | OK | - |
| `src/features/program/components/NewProgramPage/ManualTargetsStep.tsx:96` | Protein/Carbs/Fat fields | set grams | onChange | OK | - |
| `src/features/program/components/NewProgramPage/NumberField.tsx:37` | number input | emit valid numbers | onChange on finite value, draft kept | OK | - |
| `src/features/program/components/NewProgramPage/RangeField.tsx:54` | number input + Slider:72 | set value | clamped onChange | OK | - |
| `src/features/onboarding/components/OnboardingPage/DistributionStep.tsx:53` | Distribution OptionCard | pick mode | onModeChange | OK | - |
| `src/features/onboarding/components/OnboardingPage/DistributionStep.tsx:62` | Days ToggleGroup | pick days | onDaysChange | OK | - |
| `src/features/onboarding/components/OnboardingPage/DistributionStep.tsx:93` | Percent Slider | set % | onPercentChange | OK | - |
| `src/features/onboarding/components/OnboardingPage/OptionCard.tsx:42` | OptionCard radio | select option | onSelect | OK | - |
| `src/features/onboarding/components/OnboardingPage/OptionCard.tsx:118` | UnitToggle | switch unit | onValueChange(next && onChange) | OK | - |
| `src/features/program/pages/GoalEditStepPage.tsx:105` | Back | params→/program (reset); review→/params | leave() / push /program/goal/edit/params | OK | leave() uses edit.reset() which keeps pendingGoal (goal-edit.store.ts:28) |
| `src/features/program/pages/GoalEditStepPage.tsx:117` | Next (params) | go to review | push /program/goal/edit/review | OK | - |
| `src/features/program/pages/GoalEditStepPage.tsx:118` | Done / "Set new program" (review) | save or switch to wizard | requiresNewProgram → setPendingGoal + push /program/new; else PUT apiRoutes.goals.edit → leave() | OK | - |
| `src/features/program/pages/GoalEditStepPage.tsx:132` | "Try again" | refetch preview | query.refetch() | OK | - |
| `src/features/program/pages/GoalEditStepPage.tsx:148` | GoalTargetStep onTargetChange | set target | edit.setTarget → debounced POST goals/edit-preview | OK | - |
| `src/features/program/pages/GoalEditStepPage.tsx:150` | GoalTargetStep onRateChange | set rate | edit.setRate clamped to fastMaxPercent | OK | - |
| `src/features/onboarding/components/OnboardingPage/GoalTargetStep.tsx:106` | RulerSlider target | set goal weight | onTargetChange(revert) | OK | - |
| `src/features/onboarding/components/OnboardingPage/GoalTargetStep.tsx:141` | Rate Slider | set rate 0.1-1 | onRateChange | OK | - |
| `src/features/onboarding/components/OnboardingPage/GoalTargetStep.tsx:164` | Rate % input | set rate | accepts 0.1..1.5 while slider MAX_RATE=1 (slider clamps display); controlled value rejects intermediate text (empty / "0.") so retyping snaps back | BROKEN | use MAX_RATE for input max; keep a draft string like NumberField |
| `src/features/onboarding/components/OnboardingPage/RulerSlider.tsx:122` | Ruler scroll + keys (:123) | set value | onScroll/onKeyDown → onChange | OK | - |
| `src/features/program/pages/CheckInHubPage.tsx:33` | Back | exit to Strategy | exit() → push /program | OK | - |
| `src/features/program/pages/CheckInHubPage.tsx:52` | "Try again" | refetch session | session.refetch() | OK | - |
| `src/features/program/pages/CheckInHubPage.tsx:68` | onOpen module | open module page | push /program/check-in/<key>; keys pre-filtered by visibleModules→isModuleKey | OK | - |
| `src/features/program/pages/CheckInHubPage.tsx:72` | onSkip | skip module | progress.markDone (sessionStorage only) | OK | - |
| `src/features/program/components/CheckInPage/CheckInHub.tsx:33` | "Back to Strategy" | exit | onExit | OK | - |
| `src/features/program/components/CheckInPage/CheckInHub.tsx:86` | "Go to <module>" | open module | onOpen(module.key) | OK | - |
| `src/features/program/components/CheckInPage/CheckInHub.tsx:94` | "Skip Module" | skip | onSkip(key) | OK | - |
| `src/features/program/components/CheckInPage/CheckInHub.tsx:40` | Hub with every visible module completed | some CTA to finish | current = -1 → no button rendered (only Back) | UNKNOWN | only reachable if program-update absent/hidden; add Back to Strategy fallback |
| `src/features/program/pages/CheckInModulePage.tsx:43` | Not-due redirect | send to hub | router.replace /program/check-in | OK | - |
| `src/features/program/pages/CheckInModulePage.tsx:57` | Back (loading shell) | hub | backToHub | OK | - |
| `src/features/program/pages/CheckInModulePage.tsx:76` | "Try again" | refetch session | session.refetch() | OK | - |
| `src/features/program/pages/CheckInModulePage.tsx:108` | Intro finish | save introSeen, back to hub | PUT check-ins/modules {introSeen} (fire-and-forget) + markDone + hub | OK | - |
| `src/features/program/pages/CheckInModulePage.tsx:123` | Partial logging save days | save incomplete days | PUT check-ins/incomplete-days, then confirm step | OK | - |
| `src/features/program/pages/CheckInModulePage.tsx:124` | Partial logging finish | optionally hide module | PUT check-ins/modules {partialLoggingHidden} + markDone + hub | OK | - |
| `src/features/program/pages/CheckInModulePage.tsx:143` | Accept | accept proposal | POST check-ins/accept → markDone + /program | OK | - |
| `src/features/program/pages/CheckInModulePage.tsx:144` | Decline | reject proposal | POST check-ins/reject → markDone + /program | OK | - |
| `src/features/program/components/CheckInPage/IntroModule.tsx:61` | Back | hub | onExit | OK | - |
| `src/features/program/components/CheckInPage/IntroModule.tsx:68` | "Next Module" | finish intro | onFinish | OK | - |
| `src/features/onboarding/components/OnboardingPage/FeatureCarouselStep.tsx:118` | Previous page arrow | prev slide | goTo(page-1) | OK | - |
| `src/features/onboarding/components/OnboardingPage/FeatureCarouselStep.tsx:138` | Next page arrow | next slide | goTo(page+1) | OK | aria-label is Vietnamese "Trang sau" (others English) |
| `src/features/onboarding/components/OnboardingPage/FeatureCarouselStep.tsx:84` | Track onScroll | sync dots | setPage | OK | - |
| `src/features/program/components/CheckInPage/PartialLoggingModule.tsx:80` | Back | prev step / hub on first | go(prev) or onExit | OK | - |
| `src/features/program/components/CheckInPage/PartialLoggingModule.tsx:87` | Next / Next Module | advance; save on select | next(): select→onSaveDays; complete→onFinish | OK | - |
| `src/features/program/components/CheckInPage/PartialLoggingModule.tsx:145` | "Don't show this module again" checkbox | hide module, re-enable later from More | setHide → partialLoggingHidden saved; copy says "turn it back on any time from More" but no UI anywhere sets partialLoggingHidden=false (also IntroModule.tsx:49 slide) | UNIMPLEMENTED | add a More toggle or drop the promise |
| `src/features/program/components/CheckInPage/IncompleteDaysChart.tsx:59` | Day bar | toggle incomplete | onToggle(date) | OK | - |
| `src/features/program/components/CheckInPage/ProgramUpdateModule.tsx:89` | Back | hub | onExit (hidden while reviewing) | OK | - |
| `src/features/program/components/CheckInPage/ProgramUpdateModule.tsx:107` | "Accept Program Changes" | accept | onAccept, disabled if infeasible | OK | - |
| `src/features/program/components/CheckInPage/ProgramUpdateModule.tsx:115` | "Decline and Silence" | reject | onDecline | OK | - |
| `src/features/program/components/CheckInPage/ProgramUpdateModule.tsx:96` | "Done" (no proposal) | record check-in | onAccept → POST accept | OK | - |
| `src/features/onboarding/pages/OnboardingPage.tsx:45` | Finished redirect | leave wizard | router.replace /dashboard | OK | - |
| `src/features/onboarding/pages/OnboardingPage.tsx:48` | ErrorState Retry | refetch state | state.refetch() | OK | - |
| `src/features/onboarding/pages/OnboardingPage.tsx:22` | Wizard Back | previous step | wizard.back (canGoBack index>1, not in finish) | OK | - |
| `src/features/onboarding/pages/OnboardingPage.tsx:29` | Wizard Next | save step + advance | next(): basics → saveBasics (onboarding service), ready → POST programs, then go(next) | OK | - |
| `src/features/onboarding/components/OnboardingGuard.tsx:18` | Guard redirect | force onboarding | router.replace /onboarding when isRequired | OK | - |
| `src/features/onboarding/components/OnboardingPage/BasicsSteps.tsx:49` | Sex option | set gender | patch | OK | - |
| `src/features/onboarding/components/OnboardingPage/BirthDateStep.tsx:53` | Month/Day/Year wheels (:59,:65) | set DOB | update → onChange iso | OK | - |
| `src/features/onboarding/components/OnboardingPage/BasicsSteps.tsx:61` | "Use this value" (DOB) | confirm suggestion | patch same value + focus Next | OK | - |
| `src/features/onboarding/components/OnboardingPage/HeightStep.tsx:43` | Unit toggle / ruler (:54,:61) | set height & unit | onUnitChange / onChange | OK | - |
| `src/features/onboarding/components/OnboardingPage/BasicsSteps.tsx:75` | "Use this value" (height) | confirm | patch | OK | - |
| `src/features/onboarding/components/OnboardingPage/WeightStep.tsx:32` | Unit toggle / ruler (:46,:55) | set weight & unit | onUnitChange / onChange | OK | - |
| `src/features/onboarding/components/OnboardingPage/BasicsSteps.tsx:89` | "Use this value" (weight) | confirm | patch | OK | - |
| `src/features/onboarding/components/OnboardingPage/WeightHistoryStep.tsx:67` | Weight-history option | answer + shown threshold | onAnswer → patch | OK | - |
| `src/features/onboarding/components/OnboardingPage/WeightHistoryStep.tsx:43` | Retry | refetch question | question.refetch() | OK | - |
| `src/features/onboarding/components/OnboardingPage/BasicsSteps.tsx:115` | Legacy weight-history option (flag off) | answer | patch | OK | - |
| `src/features/onboarding/components/OnboardingPage/BasicsSteps.tsx:125` | Weight trend option | answer | patch | OK | - |
| `src/features/onboarding/components/OnboardingPage/BodyFatStep.tsx:82` | Body-fat −/slider(:94)/+(:117) | choose level | select(level) | OK | - |
| `src/features/onboarding/components/OnboardingPage/BasicsSteps.tsx:144` | Exercise / activity(:154) / lifting(:163) / cardio(:172) options | answer | patch | OK | - |
| `src/features/onboarding/components/OnboardingPage/EstimateChatStep.tsx:146` | Chat reply chips | reply | setReplies/setPath | OK | - |
| `src/features/onboarding/components/OnboardingPage/EstimateChatStep.tsx:159` | Skip / Next | advance | onNext = wizard.next | OK | - |
| `src/features/onboarding/components/OnboardingPage/ChatBubbles.tsx:25` | Edit expenditure (pencil) | open edit sheet | onEdit → setEditing(true) | OK | - |
| `src/features/onboarding/components/OnboardingPage/EstimateChatStep.tsx:167` | Edit sheet close | commit manual TDEE | commits if 1000..6000 else silently discarded | OK | silently drops out-of-range value; show error |
| `src/features/onboarding/components/OnboardingPage/EstimateChatStep.tsx:184` | TDEE input | type | setDraft | OK | - |
| `src/features/onboarding/components/OnboardingPage/EstimateChatStep.tsx:93` | Estimate Retry | refetch | onRetry | OK | - |
| `src/features/onboarding/components/OnboardingPage/ReferralStep.tsx:55` | Referral option | pick source | onSourceChange | OK | - |
| `src/features/onboarding/components/OnboardingPage/ReferralStep.tsx:67` | Affiliate code input | type code | onAffiliateCodeChange | OK | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:42` | Shift fix (onboarding) | apply fix | wizard.applyShiftFix → patch | OK | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:65` | Preview Retry | refetch preview | retryPreview | OK | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:100` | Goal type option | set goal | setGoalType | OK | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:110` | Goal target / rate (:112) | set | patch | OK | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:120` | "Use these values" | confirm suggestions | confirmGoalSuggestions | OK | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:145` | Diet / floor(:154) / training(:163) / protein(:183) options | answer | patch | OK | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:170` | Distribution controls | set | patch shiftMode/Days/Percent | OK | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:210` | Ready reached end | unlock Done | onReadyReached | OK | - |
| `src/features/onboarding/components/OnboardingPage/PlanStep.tsx:38` | Plan cards + "Start trial" | choose/subscribe plan | setPlan local state only; never sent; "Start trial" only advances | UNIMPLEMENTED | intentional (no billing, per comment) |
| `src/features/onboarding/components/OnboardingPage/ConsentStep.tsx:90` | Consent switches | accept terms | onCheckedChange → setConsent | OK | - |
| `src/features/onboarding/components/OnboardingPage/ConsentStep.tsx:99` | "Accept and continue" | complete onboarding | acceptConsent → complete mutation → /dashboard | OK | - |
| `src/features/onboarding/components/OnboardingPage/SuggestionNote.tsx:29` | Suggestion button | confirm | onConfirm + focus Next | OK | - |
| `src/features/auth/components/AuthGuard.tsx:16` | Unauth redirect | /login with return path | /login?redirect=encodeURIComponent(pathname) — query string dropped (e.g. /progress-photos/gallery?date=…) | FIXED (was BROKEN) | include searchParams in redirect |
| `src/features/auth/pages/LoginPage.tsx:19` | Already-authed redirect | go to safe redirect target | router.replace(searchParams.get('redirect') ?? '/dashboard') unvalidated | FIXED (was BROKEN) | allow only paths starting with "/" and not "//" |
| `src/features/auth/components/login/LoginForm.tsx:66` | Login form onSubmit | log in | login() → POST auth.login, setUser, toast | OK | - |
| `src/features/auth/components/login/LoginForm.tsx:53` | Post-login redirect | go to redirect target | same unvalidated redirect param (open redirect) | FIXED (was BROKEN) | same as above |
| `src/features/auth/components/login/LoginForm.tsx:69` | "Resend verification email" | open confirm page with email | Link /confirm-email?email=…; target reads `email` (ConfirmEmailPage.tsx:112) | OK | - |
| `src/features/auth/components/login/LoginForm.tsx:99` | "Forgot password?" | forgot page | Link /forgot-password | OK | - |
| `src/features/auth/components/login/LoginForm.tsx:119` | "Log in" submit | submit | type=submit | OK | - |
| `src/features/auth/pages/LoginPage.tsx:43` | "Create account" (AuthAltAction:24) | register | Link /register (redirect param not forwarded) | OK | forward ?redirect |
| `src/features/auth/pages/RegisterPage.tsx:100` | Register form onSubmit | create account | authService.register → POST auth.register → "Check your email" | OK | - |
| `src/features/auth/pages/RegisterPage.tsx:118` | Gender PickerSelect | pick gender | Controller onChange | OK | - |
| `src/features/auth/pages/RegisterPage.tsx:166` | "Create account" submit | submit | type=submit | OK | - |
| `src/features/auth/pages/RegisterPage.tsx:87` | "Link not working? Enter the code or resend" | confirm page | Link /confirm-email?email=…; target reads email → ResendSection prefill | OK | - |
| `src/features/auth/pages/RegisterPage.tsx:70` | "Log in" (AuthAltAction) | login | Link /login | OK | - |
| `src/features/auth/pages/ForgotPasswordPage.tsx:83` | Forgot form onSubmit | send reset email | POST auth.forgotPassword → sent state | OK | - |
| `src/features/auth/pages/ForgotPasswordPage.tsx:58` | "Back to log in" | login | Link /login | OK | - |
| `src/features/auth/pages/ForgotPasswordPage.tsx:79` | "I already have a token" | reset page | Link /reset-password | OK | - |
| `src/features/auth/pages/ResetPasswordPage.tsx:75` | Reset form onSubmit | reset password | POST auth.resetPassword → toast + replace /login; token prefilled from ?token (:38) | OK | - |
| `src/features/auth/pages/ResetPasswordPage.tsx:67` | "Back to log in" | login | Link /login | OK | - |
| `src/features/auth/pages/ConfirmEmailPage.tsx:132` | Auto-verify from ?token | verify | POST auth.confirmEmail once (ref guard) | OK | - |
| `src/features/auth/pages/ConfirmEmailPage.tsx:194` | Verify code form onSubmit | verify | POST auth.confirmEmail | OK | - |
| `src/features/auth/pages/ConfirmEmailPage.tsx:210` | Code input | type | setToken | OK | - |
| `src/features/auth/pages/ConfirmEmailPage.tsx:59` | Resend form onSubmit | resend email | POST auth.resendVerification, 60s cooldown | OK | - |
| `src/features/auth/pages/ConfirmEmailPage.tsx:87` | Resend email input | type | setEmail | OK | - |
| `src/features/auth/pages/ConfirmEmailPage.tsx:162` | "Log in" (success) | login | Link /login | OK | - |
| `src/features/auth/pages/ConfirmEmailPage.tsx:187` | "Back to log in" | login | Link /login | OK | - |
| `src/features/auth/hooks/use-auth.ts:47` | logout() | sign out | POST auth.logout, clear store/cache/drafts, push /login | OK | - |
| `src/features/users/pages/ProfilePage.tsx:64` | ErrorState Retry | refetch profile | profile.refetch() | OK | - |
| `src/features/users/pages/ProfilePage.tsx:81` | Profile form onSubmit | save dirty fields | profileUpdatePayload → useUpdateProfile → userService.updateProfile | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:107` | Name row | open name sheet | setSheet('name') | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:114` | Date of birth row | open sheet | setSheet('dob') | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:116` | Gender row | open sheet | setSheet('gender') | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:121` | Height row | open sheet | setSheet('height') | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:129` | Activity row | open sheet | setSheet('activity') | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:137` | Units row | open sheet | setSheet('unit') | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:143` | Energy row | open sheet | setSheet('energy') | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:149` | Week starts on row | open sheet | setSheet('weekStart') | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:158` | Time zone row | open sheet | setSheet('timeZone') | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:163` | "My foods" | foods page | ListRow href /foods | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:164` | "Sign out" | log out | onLogout → useAuth.logout | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:170` | "Save changes" | submit | type=submit (shown when dirty) | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:182` | PickerSheets onOpenChange (×9) | close sheet | close() | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:185` | First/last name inputs (:188) | edit | register | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:205` | DateField DOB | set DOB | setValue dirty+validate | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:218` | Gender OptionList | pick | pick('gender') | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:230` | Height input | edit | register setValueAs | OK | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:246` | Activity / Units(:255) / Energy(:269) / Week start(:283) / Time zone(:298) OptionLists | pick | pick(name) dirty+validate | OK | - |
| `src/features/users/components/TimeZoneGate.tsx:36` | Toast action "Set time zone" | open Profile time zone | router.push('/profile#units') (ProfileForm scrolls to #units) | OK | - |

### D. More / shortcuts / body / photos / shell / routes

| Component (file:line) | Button/Action | Expected | Actual | Status | Fix |
|---|---|---|---|---|---|
| `src/app/(protected)/layout.tsx:47` | AppSidebar onToggleCollapse | collapse/expand sidebar | setIsCollapsed (localStorage 'sidebar-collapsed') | OK | - |
| `src/app/(protected)/layout.tsx:59` | PageTransition key=pathname | page enter anim per route | keyed remount | OK | - |
| `src/app/(protected)/layout.tsx:16` | FULL_SCREEN_PREFIXES (/shortcuts, /progress-photos/gallery, /progress-photos/compare, program flows) | no chrome on these routes | ShortcutSheetsPage/TabBar not mounted there | OK | - |
| `src/app/(protected)/body-metrics/[metric]/page.tsx:15` | dynamic [metric] validation | unknown key -> 404 | findMeasurement (case-insensitive) else notFound() | OK | - |
| `src/app/(protected)/dashboard/nutrition/[nutrient]/page.tsx` | dynamic [nutrient] validation | unknown -> 404 | findNutrient else notFound() | OK | - |
| `src/app/(protected)/dashboard/nutrition/[nutrient]/summary/page.tsx` | dynamic [nutrient] validation | unknown -> 404 | notFound() | OK | - |
| `src/app/(protected)/dashboard/nutrition/[nutrient]/goals/page.tsx` | dynamic [nutrient] validation | unknown -> 404 | notFound() | OK | - |
| `src/app/(protected)/foods/new/page.tsx` | searchParams from/name/calories/... | prefill Create Food | parsed, passed as fromFoodId/seed | OK | - |
| `src/app/(protected)/*/page.tsx` (body-fat, full-body{,/all,/compare}, more{,/expenditure,/expenditure/bmr,/tutorials}, period, profile, progress-photos{,/gallery,/compare}, shortcuts, steps, weight, dashboard/*, food-log/*, foods, recipes/new, habits/*, nutrition-data) | static route pages | render feature page | each renders its feature page component (verified) | OK | - |
| `src/components/shared/AppHeader.tsx:13` | Wordmark link | go to dashboard | Link /dashboard | OK | - |
| `src/components/shared/AvatarMenu.tsx:46` | Account avatar trigger | open menu | DropdownMenuTrigger | OK | - |
| `src/components/shared/AvatarMenu.tsx:66` | Profile item | /profile | Link routePath.profile | OK | - |
| `src/components/shared/AvatarMenu.tsx:72` | My foods item | /foods | Link routePath.foods | OK | - |
| `src/components/shared/AvatarMenu.tsx:80` | Theme sub-trigger | open submenu | DropdownMenuSubTrigger (client only) | OK | - |
| `src/components/shared/AvatarMenu.tsx:86` | Theme Light/Dark/System items | set theme | setTheme(value) | OK | - |
| `src/components/shared/AvatarMenu.tsx:99` | Sign out | log out | useAuth().logout | OK | - |
| `src/components/shared/AppSidebar.tsx:67` | Sidebar Dashboard | /dashboard | Link | OK | - |
| `src/components/shared/AppSidebar.tsx:67` | Sidebar Food log | /food-log | Link | OK | - |
| `src/components/shared/AppSidebar.tsx:67` | Sidebar Foods | /foods | Link | OK | - |
| `src/components/shared/AppSidebar.tsx:67` | Sidebar Strategy | /program | Link | OK | - |
| `src/components/shared/AppSidebar.tsx:67` | Sidebar Weight | /weight | Link | OK | - |
| `src/components/shared/AppSidebar.tsx:67` | Sidebar Profile | /profile | Link | OK | - |
| `src/components/shared/AppSidebar.tsx:82` | Collapse/Expand button | toggle width | onToggleCollapse | OK | - |
| `src/components/shared/AppSidebar.tsx:27` | NAV_ITEMS (missing entries) | desktop users can reach More + Shortcuts "+" | no More item, no Shortcuts trigger; MobileTabBar is md:hidden -> /more, /more/*, Shortcuts sheet, Customize unreachable from nav at >=768px | FIXED (was BROKEN) | add { More: routePath.more } and a "+"/Shortcuts button calling useUiStore.setShortcutsOpen(true) |
| `src/components/shared/MobileTabBar.tsx:55` | Tab Dashboard | /dashboard | Link | OK | - |
| `src/components/shared/MobileTabBar.tsx:55` | Tab Food Log | /food-log | Link | OK | - |
| `src/components/shared/MobileTabBar.tsx:84` | "+" Shortcuts button | open Shortcuts sheet | setShortcutsOpen(true) -> ShortcutSheetsPage | OK | - |
| `src/components/shared/MobileTabBar.tsx:55` | Tab Strategy | /program | Link | OK | - |
| `src/components/shared/MobileTabBar.tsx:55` | Tab More | /more | Link | OK | - |
| `src/components/shared/SheetFrame.tsx:61` | X close | close sheet | onOpenChange(false) | OK | - |
| `src/components/shared/SheetFrame.tsx:74` | Title button (date ▾) | open Select Date | onTitleClick | OK | - |
| `src/components/shared/SheetFrame.tsx:100` | Done | apply + close | onDone?.(); onOpenChange(false) | OK | - |
| `src/components/shared/ConfirmDialog.tsx:47` | Cancel | close | AlertDialogCancel | OK | - |
| `src/components/shared/ConfirmDialog.tsx:50` | Confirm (destructive) | run action | onConfirm() (no error slot) | OK | consider error prop: callers' delete errors are silent |
| `src/components/shared/ListGroup.tsx:105` | ListRow href | navigate | Link | OK | - |
| `src/components/shared/ListGroup.tsx:111` | ListRow onClick | run handler | button onClick | OK | - |
| `src/components/shared/DateField.tsx:36` | native date input | pick date | onValueChange(value); no max -> future dates selectable | OK | add max={today} where future dates invalid (weight dialog, photos sheet) |
| `src/components/shared/ErrorState.tsx:92` | Try again | refetch | onRetry | OK | - |
| `src/components/shared/ErrorState.tsx:161` | Go back | backHref | Link (only when backHref passed) | OK | - |
| `src/components/shared/ErrorState.tsx:166` | Sign in again | /login | Link | OK | - |
| `src/components/shared/NumericKeypad.tsx:44` | Phone keypad digits/./delete | type into active field | onKey / onBackspace | OK | - |
| `src/components/shared/NumericKeypad.tsx:102` | Grid keypad digits,/,space,.,delete | type | onKey / onBackspace | OK | - |
| `src/components/shared/ChoiceSheet.tsx:66` | choice row | select + close | onSelect + delayed close | OK | - |
| `src/components/shared/PickerSheet.tsx:46` | Done | close | onOpenChange(false) | OK | - |
| `src/components/shared/PickerSheet.tsx:85` | OptionList row | select | onValueChange | OK | - |
| `src/components/shared/PickerSelect.tsx:43` | select trigger | open picker | setOpen(true) | OK | - |
| `src/components/shared/ChooseIconSheet.tsx:68` | category tab | filter icons | selectCategory | OK | - |
| `src/components/shared/ChooseIconSheet.tsx:113` | Default icon cell | select default | setSelected(null) | OK | - |
| `src/components/shared/ChooseIconSheet.tsx:124` | icon cell | select icon | setSelected(key) | OK | - |
| `src/components/shared/ChooseIconSheet.tsx:138` | Select Icon | apply | onSelect(selected)+close | OK | - |
| `src/components/shared/ChooseIconSheet.tsx:148` | Cancel | close | onOpenChange(false) | OK | - |
| `src/components/shared/MonthYearPickerSheet.tsx:73` | month cell | pick month | pick(year,index), future disabled | OK | - |
| `src/components/shared/MonthYearPickerSheet.tsx:92` | current month button | jump to today | pick(todayYear,todayMonth) | OK | - |
| `src/components/shared/MonthYearPickerSheet.tsx:128` | decade prev/next | page years | page(-1/1), next bounded | OK | - |
| `src/components/shared/MonthYearPickerSheet.tsx:166` | year cell | pick year | onPick(value) | OK | - |
| `src/components/shared/SearchableSelect.tsx:91` | combobox input focus/type/keys/options/clear | search+select | setOpen/onChange/onKeyDown/choose | OK | - |
| `src/components/shared/SearchableSelect.tsx:177` | sheet variant trigger/search/options | search+select | setOpen/setQuery/onValueChange | OK | - |
| `src/components/shared/SwipeToDelete.tsx:69` | Delete revealed button | delete row | onDelete | OK | - |
| `src/components/shared/SwipeToDelete.tsx:75` | swipe gesture | reveal / commit delete | pointer handlers -> onDelete past COMMIT_PX | OK | - |
| `src/components/shared/WheelPicker.tsx:87` | wheel scroll / arrow keys | change value | onChange | OK | - |
| `src/components/shared/PasswordInput.tsx:39` | show/hide password | toggle visibility | setVisible | OK | - |
| `src/components/shared/SearchInput.tsx:40` | search input | type | onValueChange | OK | - |
| `src/components/shared/SearchInput.tsx:50` | clear (x) | clear text | onValueChange('') | OK | - |
| `src/components/shared/ChoiceGroup.tsx:34` | ToggleGroup | select | onValueChange (ignores empty) | OK | - |
| `src/components/shared/IconButton.tsx:27` | generic icon button | pass-through | Button + tooltip | OK | - |
| `src/stores/ui.store.ts:63` | setShortcutsOpen | open/close Shortcuts sheet | consumed by MobileTabBar + ShortcutSheetsPage | OK | - |
| `src/stores/ui.store.ts:66` | openSheet/closeSheet | open Weight/Metrics/Photos sheet | consumed by ShortcutSheetsPage (session counter remount) | OK | - |
| `src/stores/ui.store.ts:54` | requestAddFood/clearAddFoodRequest | open Add Food at tab | consumed by FoodLogPage.tsx:236 | OK | - |
| `src/stores/ui.store.ts:57` | recipeDraft / foodLogDate setters | cross-page handoff | consumed by food-log/recipe pages | OK | - |
| `src/stores/auth.store.ts:22` | setUser/clearAuth | auth state | persist + token | OK | - |
| `src/stores/flow.store.ts`, `goal-edit.store.ts`, `program-wizard.store.ts`, `check-in-progress.store.ts` | store actions | program flows (out of UI scope) | plain setters | OK | - |
| `src/features/more/pages/MorePage.tsx:82` | Account row | /profile | Link routePath.profile | OK | - |
| `src/features/more/pages/MorePage.tsx:95` | Subscription row | subscription page | div aria-disabled, "Not available yet" | UNIMPLEMENTED | - |
| `src/features/more/pages/MorePage.tsx:95` | Integrations row | integrations page | disabled "Not available yet" | UNIMPLEMENTED | - |
| `src/features/more/pages/MorePage.tsx:82` | Units row | profile units section | Link /profile#units (ProfileForm scrolls to #units) | OK | - |
| `src/features/more/pages/MorePage.tsx:95` | Language row | language setting | disabled "Not available yet" | UNIMPLEMENTED | - |
| `src/features/more/pages/MorePage.tsx:82` | Dashboard row | dashboard customize | Link /dashboard/customize | OK | - |
| `src/features/more/pages/MorePage.tsx:82` | Food Log row | food log settings | Link /food-log/settings | OK | - |
| `src/features/more/pages/MorePage.tsx:82` | Shortcuts row | customize shortcuts | Link /shortcuts | OK | - |
| `src/features/more/pages/MorePage.tsx:82` | Expenditure row | expenditure settings | Link /more/expenditure | OK | - |
| `src/features/more/pages/MorePage.tsx:95` | Weight Trend row | weight trend settings | disabled "Not available yet" (more.config.ts:87) | UNIMPLEMENTED | - |
| `src/features/more/pages/MorePage.tsx:82` | Strategy row | program | Link /program | OK | - |
| `src/features/more/pages/MorePage.tsx:221` | Theme System/Light/Dark cards (x3) | set theme | setTheme(value) | OK | - |
| `src/features/more/pages/MorePage.tsx:95` | Data Export row | export | disabled "Not available yet" | UNIMPLEMENTED | - |
| `src/features/more/pages/MorePage.tsx:95` | Data Visibility row | visibility | disabled "Not available yet" | UNIMPLEMENTED | - |
| `src/features/more/pages/MorePage.tsx:95` | Account & Data Deletion row | delete account | disabled "Not available yet" | UNIMPLEMENTED | - |
| `src/features/more/pages/MorePage.tsx:95` | Knowledge Base row | docs | disabled "Not available yet" | UNIMPLEMENTED | - |
| `src/features/more/pages/MorePage.tsx:95` | Roadmap row | roadmap | disabled "Not available yet" | UNIMPLEMENTED | - |
| `src/features/more/pages/MorePage.tsx:95` | Support row | support | disabled "Not available yet" | UNIMPLEMENTED | - |
| `src/features/more/pages/MorePage.tsx:95` | Legal row | legal | disabled "Not available yet" | UNIMPLEMENTED | - |
| `src/features/more/pages/MorePage.tsx:82` | Tutorials row | tutorials | Link /more/tutorials | OK | - |
| `src/features/more/pages/MorePage.tsx:95` | About row | about | disabled "Not available yet" | UNIMPLEMENTED | - |
| `src/features/more/components/SettingRows.tsx:53` | SettingRow link | navigate | Link with chevron | OK | - |
| `src/features/more/components/SettingRows.tsx:70` | SettingRow Edit pill | open sheet | onEdit (disabled when `disabled`) | OK | - |
| `src/features/more/components/SettingRows.tsx:100` | SettingSwitchRow Switch | toggle modifier | checked={false} hard-coded, no onCheckedChange; only ever rendered disabled | UNIMPLEMENTED | wire to BE when modifiers exist |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:101` | Back (SubPageHeader) | previous page | router.back() | OK | - |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:116` | Estimation Method Edit | open Default/Manual sheet | setSheet('method') -> ManualTdeeSheet; save = setManual (PUT /programs/current/expenditure) or PUT /expenditure/settings when flag on | OK | - |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:122` | Calculation Start Date Edit | edit date | always `disabled` (even with EXPENDITURE_SETTINGS_API on) | UNIMPLEMENTED | - |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:132` | BMR Equation row | /more/expenditure/bmr | Link routePath.moreBmr | OK | - |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:140` | Calculation Mode Edit | Dynamic/Static sheet | disabled unless NEXT_PUBLIC_EXPENDITURE_MODE_API=true (not set in .env/.env.example) | UNIMPLEMENTED | enable flag when BE route live |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:147` | Algorithm row | display only | readOnly | OK | - |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:155` | Step-Informed Updates switch | toggle | disabled, "Not available yet" | UNIMPLEMENTED | - |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:160` | Predictive Goal Adjustment switch | toggle | disabled, "Not available yet" | UNIMPLEMENTED | - |
| `src/features/more/components/ManualTdeeSheet.tsx:94` | "Default" radio | revert to default estimate | only clickable if onUseDefault passed; flag OFF -> undefined, so once Manual is saved user cannot go back to Default | UNIMPLEMENTED | add BE path to clear manual TDEE (or enable EXPENDITURE_SETTINGS_API) |
| `src/features/more/components/ManualTdeeSheet.tsx:123` | "Manual"/"Static" radio | select manual | display-only radio (no handler); selection implied by typing in input | OK | - |
| `src/features/more/components/ManualTdeeSheet.tsx:141` | kcal input (+Enter) | enter value | setText digits; Enter -> save() | OK | - |
| `src/features/more/components/ManualTdeeSheet.tsx:163` | Save | save kcal | run(onSave) -> mutateAsync, closes on success, inline error | OK | - |
| `src/features/more/components/ManualTdeeSheet.tsx:82` | sheet close | reset + close | blocked while pending | OK | - |
| `src/features/more/pages/BmrEquationPage.tsx:135` | Equation radio (flag ON) | choose MacroFactor/Cunningham | PUT /expenditure/settings { bmrEquation } | OK | - |
| `src/features/more/pages/BmrEquationPage.tsx:233` | Equation list (flag OFF) | choose equation | aria-disabled display + "Choosing the equation is not available yet" | UNIMPLEMENTED | - |
| `src/features/more/pages/BmrEquationPage.tsx:279` | Activity Edit | choose activity | SettingChoiceSheet -> PUT /onboarding/basics {step:0,dailyActivity} + toast | OK | - |
| `src/features/more/pages/BmrEquationPage.tsx:285` | Exercise Edit | choose exercise | same, field exerciseSessions | OK | - |
| `src/features/more/pages/BmrEquationPage.tsx:301` | Athletic Pursuits Edit (flag OFF) | choose | disabled "Not available yet" (flag ON :292 -> PUT /expenditure/settings) | UNIMPLEMENTED | - |
| `src/features/more/pages/BmrEquationPage.tsx:308` | Prior Weight Edit | answer question | disabled unless settings flag + PRIOR_WEIGHT_API + question loaded; flag OFF -> "Not available yet" | UNIMPLEMENTED | - |
| `src/features/more/pages/BmrEquationPage.tsx:327` | Prior Progress Edit | choose | PUT /onboarding/basics {recentWeightTrend} | OK | - |
| `src/features/more/pages/BmrEquationPage.tsx:336` | Sex for BMR Edit (flag ON, gender Other) | choose | PUT /expenditure/settings { bmrSex } | OK | - |
| `src/features/more/components/SettingChoiceSheet.tsx:74` | choice row | save + close | await onSave; error inline; same value -> close | OK | - |
| `src/features/more/pages/TutorialsPage.tsx:22` | Show (per dismissed tutorial) | re-enable tutorial | persistChoice(key,'show'); keys match usePersistedChoice keys in Steps/ScaleWeight/Measurement/VBF/Expenditure/WeightTrend/GoalProgress | OK | - |
| `src/features/more/pages/TutorialsPage.tsx:48` | Show All Tutorials | reset all | persistChoice for all 7 keys | OK | - |
| `src/features/shortcuts/pages/ShortcutSheetsPage.tsx:32` | pathname effect | auto-close Shortcuts sheet on navigation | setShortcutsOpen(false) | OK | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:52` | Customize (sliders icon) | /shortcuts | Link customizeHref=/shortcuts | OK | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:92` | Top shortcut Search | open Add Food › Search | run -> addFood({tab:'search'}) + push /food-log if elsewhere | OK | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:92` | Top shortcut Barcode | Add Food › Scan | addFood({tab:'scan'}) (AddTab 'scan' exists) | OK | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:92` | Top shortcut AI | Add Food › AI | addFood({tab:'ai'}) | OK | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:92` | Top shortcut Weight | open Weight sheet | openSheet('weight') -> WeightShortcutPage | OK | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:109` | Row Recipes | Library › Recipes | addFood({tab:'library',libraryView:'recipes'}) | OK | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:109` | Row Quick Add | Add Food › Quick | addFood({tab:'quick'}) | OK | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:109` | Row Photos | open Photos sheet | openSheet('photos') -> ProgressPhotosShortcutPage | OK | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:109` | Row Metrics | open Full Body sheet | openSheet('metrics') -> FullBodyShortcutPage | OK | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:109` | Row Your Foods (if enabled) | Library › Foods | addFood({tab:'library',libraryView:'foods'}) | OK | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:88` | New Recipe (if enabled) | /recipes/new | Link via SHORTCUT_HREF | OK | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:88` | New Food (if enabled) | /foods/new | Link via SHORTCUT_HREF | OK | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:109` | Row Favorites (if enabled) | Library › Favorites | addFood({tab:'library',libraryView:'favorites'}) | OK | - |
| `src/features/shortcuts/hooks/use-shortcut-runner.ts:24` | runner switch | dispatch every key | all 12 catalog keys handled (10 here + 2 hrefs) | OK | - |
| `src/features/shortcuts/components/ShortcutToolbarContent.tsx:45` | toolbar circle (href key) | navigate | Link | OK | - |
| `src/features/shortcuts/components/ShortcutToolbarContent.tsx:49` | toolbar circle (action key) | run shortcut | onRun(key) | OK | - |
| `src/features/shortcuts/components/ShortcutToolbarContent.tsx:70` | "Search for a food" | open search | onSearch | OK | - |
| `src/features/shortcuts/components/ShortcutToolbarContent.tsx:82` | Scan barcode | open scan | onScan | OK | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:178` | Toolbar preview handlers | inert preview | () => undefined inside `inert` aria-hidden div (intentional) | OK | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:151` | Back | exit (confirm if dirty) | dirty ? ConfirmDialog : onExit (router.back) | OK | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:153` | Save | save config | useSaveShortcuts -> PUT /shortcuts, then router.back() | OK | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:184` | Toolbar Style row | open style sheet | setStyleOpen(true) | OK | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:201` | Order/Color switch | change mode | setMode | OK | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:209` | DnD reorder | reorder enabled shortcuts | onDragEnd arrayMove within enabled | OK | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:236` | Add or Remove Shortcuts | open toggle sheet | setChooseOpen(true) | OK | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:243` | Reset to App Defaults | reset draft | setStyle/setItems(DEFAULT_SHORTCUTS) (draft; needs Save) | OK | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:257` | Toolbar Style ChoiceSheet | pick style | setStyle | OK | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:271` | Choose Shortcuts ToggleList | enable/disable | setItems enabled flag | OK | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:286` | ChooseColorSheet | set color | setColor | OK | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:293` | Exit Without Saving confirm | discard + exit | onExit | OK | - |
| `src/features/shortcuts/components/SortableShortcutRow.tsx:59` | "=" drag handle | drag to reorder | dnd-kit listeners | OK | - |
| `src/features/shortcuts/components/SortableShortcutRow.tsx:70` | Brush button | open Choose Color | onChooseColor | OK | - |
| `src/features/shortcuts/components/ChooseColorSheet.tsx:31` | 7 color swatches | pick color + close | choose(color) | OK | - |
| `src/features/shortcuts/components/ChooseColorSheet.tsx:52` | No color (trash) | clear color | choose(null) | OK | - |
| `src/features/shortcuts/pages/ShortcutsPage.tsx:28` | onSave/onExit | save then return | router.back() after mutate success / on exit | UNKNOWN | on direct load (no in-app history) back leaves app; fall back to router.push(routePath.more) when history.length<=1 |
| `src/features/shortcuts/pages/WeightShortcutPage.tsx:56` | Weight sheet Save | log weight | useUpsertWeight -> POST /weights {logDate, weightKg}; close on success | OK | - |
| `src/features/shortcuts/pages/WeightShortcutPage.tsx:50` | Weight sheet Delete | delete weigh-in | close dialog -> ConfirmDialog -> DELETE /weights/{date} | OK | errors silent (mutation onError logs only) |
| `src/features/weight/components/WeightPage/LogWeightDialog.tsx:147` | Date field | pick date | setValue('logDate'); no future limit in DateField | OK | - |
| `src/features/weight/components/WeightPage/LogWeightDialog.tsx:76` | Weight input + keypad | enter weight | update() -> setValue('weight') | OK | - |
| `src/features/weight/components/WeightPage/LogWeightDialog.tsx:160` | Delete | delete entry | onDelete(logDate) when date in entryDates | OK | - |
| `src/features/weight/components/WeightPage/LogWeightDialog.tsx:170` | Cancel | close | onOpenChange(false) | OK | - |
| `src/features/weight/components/WeightPage/LogWeightDialog.tsx:179` | Save (submit) | submit | handleSubmit -> onSubmit | OK | - |
| `src/features/shortcuts/components/FullBodySheet.tsx:246` | Date title ▾ | Select Date | setDateOpen(true) -> SelectDateSheet -> onDateChange -> refetch day | OK | - |
| `src/features/shortcuts/components/FullBodySheet.tsx:252` | Delete metrics (trash) | delete day | ConfirmDialog -> DELETE /body-metrics/full-body?date | OK | - |
| `src/features/shortcuts/components/FullBodySheet.tsx:146` | Reference button | open BF reference | setReferenceOpen(true) | OK | - |
| `src/features/shortcuts/components/FullBodySheet.tsx:210` | BodyFatReferenceSheet (from Full Body) | pick % by body type | `body` prop not passed -> always male figures | FIXED (was BROKEN) | pass body={profile.gender==='Female'?'female':'male'} like VisualBodyFatPage.tsx:119 |
| `src/features/shortcuts/components/FullBodySheet.tsx:97` | 19 numeric inputs + keypad | enter cm / % | setField with regex | OK | unit always "cm" regardless of user length unit (UNKNOWN if intended) |
| `src/features/shortcuts/components/FullBodySheet.tsx:180` | Save | save metrics | zod check -> PUT /body-metrics/full-body; invalidates body-metrics/VBF/measurements | OK | - |
| `src/features/shortcuts/components/BodyFatReferenceSheet.tsx:96` | 9 body-fat bands | fill midPercent + close | onSelect + close | OK | - |
| `src/features/shortcuts/components/ProgressPhotosSheet.tsx:147` | Date field | change day | onDateChange -> refetch; no future limit | OK | - |
| `src/features/shortcuts/components/ProgressPhotosSheet.tsx:150` | Delete this day's photos | delete with confirmation | onDelete -> remove.mutate(date) immediately, NO confirm, permanent | FIXED (was BROKEN) | wrap in ConfirmDialog like ProgressPhotosPage.tsx:166 |
| `src/features/shortcuts/components/ProgressPhotosSheet.tsx:64` | Front/Side/Back tiles | pick photo | hidden file input click -> type/size check | OK | no crop step (PhotoSessionSheet has one); 10 MB vs 30 MB limit mismatch |
| `src/features/shortcuts/components/ProgressPhotosSheet.tsx:178` | Consent checkbox | consent | setConsent | OK | - |
| `src/features/shortcuts/components/ProgressPhotosSheet.tsx:188` | Save | upload | sequential PUT /progress-photos (multipart) | OK | - |
| `src/features/weight/components/BodyMetricPage/BodyMetricView.tsx:81` | "+" Add | open entry sheet today | onAdd -> openSheet(today) | OK | - |
| `src/features/weight/components/BodyMetricPage/BodyMetricView.tsx:79` | Back | previous | router.back() | OK | - |
| `src/features/weight/components/BodyMetricPage/BodyMetricView.tsx:121` | Expand chart | expand | ExpandButton | OK | - |
| `src/features/weight/components/BodyMetricPage/MetricChart.tsx:101` | chart tap / drag | select point / pan | pick + pan.bind | OK | - |
| `src/features/weight/components/BodyMetricPage/BodyMetricView.tsx:147` | RangeBar 1W..All + D/W/M | change range/averaging | setRange / setAveraging | OK | - |
| `src/features/weight/components/BodyMetricPage/BodyMetricView.tsx:163` | Tutorial dismiss/prev/next | dismiss | onDismissTutorial -> persisted 'hidden' | OK | - |
| `src/features/weight/components/BodyMetricPage/MetricHistoryList.tsx:35` | pencil per row | edit that date | onEdit(date) | OK | - |
| `src/features/weight/components/BodyMetricPage/MetricEntrySheet.tsx:117` | Date title ▾ | Select Date | SelectDateSheet -> onDateChange (page re-keys sheet) | OK | - |
| `src/features/weight/components/BodyMetricPage/MetricEntrySheet.tsx:122` | Delete (trash) | delete entry | onDelete -> page ConfirmDialog | OK | - |
| `src/features/weight/components/BodyMetricPage/MetricEntrySheet.tsx:159` | value inputs + keypad | enter value | setField regex | OK | - |
| `src/features/weight/components/BodyMetricPage/MetricEntrySheet.tsx:175` | Reference (VBF only) | open reference | onReference | OK | - |
| `src/features/weight/components/BodyMetricPage/MetricEntrySheet.tsx:185` | Save | validate + save | zod per field, empty -> local error, onSave | OK | - |
| `src/features/weight/components/BodyMetricPage/SelectDateSheet.tsx:64` | Previous month | page back | go(-1) | OK | - |
| `src/features/weight/components/BodyMetricPage/SelectDateSheet.tsx:72` | Next month | page fwd | go(1), disabled at current month | OK | - |
| `src/features/weight/components/BodyMetricPage/SelectDateSheet.tsx:99` | day cell | pick date | pick(iso), future + isDateEnabled disabled | OK | - |
| `src/features/weight/components/BodyMetricPage/SelectDateSheet.tsx:120` | Go to Today | jump to today | pick(today) ignores isDateEnabled; in AllMetrics/Compare today w/o data -> picked invalid -> silently falls back to latest date | BROKEN | disable when isDateEnabled?.(today)===false |
| `src/features/weight/pages/ScaleWeightPage.tsx:64` | Scale Weight save | upsert weight + body fat | POST /weights (kgToSend, bodyFatPercent / clearBodyFat) | OK | - |
| `src/features/weight/pages/ScaleWeightPage.tsx:154` | Delete weigh-in confirm | delete | DELETE /weights/{date} | OK | delete error silent |
| `src/features/weight/pages/MeasurementPage.tsx:96` | Measurement save | upsert | POST /body-metrics/measurements/{key} | OK | - |
| `src/features/weight/pages/MeasurementPage.tsx:120` | Delete entry confirm | delete | DELETE measurementByDate(key,date) | OK | delete error silent |
| `src/features/weight/pages/VisualBodyFatPage.tsx:102` | VBF save | upsert | POST /body-metrics/visual-body-fat | OK | - |
| `src/features/weight/pages/VisualBodyFatPage.tsx:116` | Reference sheet | pick % (gender aware) | setPicked -> re-key sheet with value | OK | - |
| `src/features/weight/pages/VisualBodyFatPage.tsx:131` | Delete entry confirm | delete | DELETE visual-body-fat/{date} | OK | delete error silent |
| `src/features/weight/body-measurements.ts:2` | bodyMeasurement(key) callers vs accepted keys | every key resolves | Dashboard BodyMetricTiles TILE_KEY (18 keys + 'waist') all present in BODY_MEASUREMENTS | OK | - |
| `src/features/full-body/pages/FullBodyPage.tsx:34` | "+" Add metrics | open sheet today | open() -> FullBodyShortcutPage (new key) | OK | - |
| `src/features/full-body/components/FullBodyPage/FullBodyPills.tsx:23` | View All Metrics | /full-body/all | Link when >=1 day, else dim span | OK | - |
| `src/features/full-body/components/FullBodyPage/FullBodyPills.tsx:23` | Compare All Metrics | /full-body/compare | Link when >=2 days, else dim span | OK | - |
| `src/features/full-body/components/FullBodyPage/FullBodyList.tsx:63` | day row | open sheet for date | onOpen(date) -> initialDate | OK | - |
| `src/features/full-body/pages/AllMetricsPage.tsx:51` | Calendar icon | Select Date (data days only) | setCalendarOpen | OK | - |
| `src/features/full-body/components/FullBodyPage/MetricDateTabs.tsx:49` | date tab | select date | onChange(date) | OK | - |
| `src/features/full-body/components/FullBodyPage/SwipeArea.tsx:22` | horizontal swipe | prev/next date | onNext/onPrevious | OK | - |
| `src/features/full-body/pages/CompareMetricsPage.tsx:53` | Calendar icon | Select Date for active side | setCalendarOpen | OK | - |
| `src/features/full-body/components/FullBodyPage/FullBodyPills.tsx:57` | Compare from/to pills | choose side to edit | onActiveChange | OK | - |
| `src/features/full-body/pages/CompareMetricsPage.tsx:65` | date tabs + swipe | change active side date | select / step | OK | from may end up after to (no ordering), minor |
| `src/features/period/pages/PeriodPage.tsx:77` | Back | previous | router.back() | OK | - |
| `src/features/period/pages/PeriodPage.tsx:86` | Calendar day | open day sheet | onSelect -> sheet.show(date); future days not buttons | OK | - |
| `src/features/period/pages/PeriodPage.tsx:93` | Calendar swipe | change month | step(next/prev) unbounded -> can swipe into future months | BROKEN | clamp step() to currentYear/currentMonth like HabitControls |
| `src/features/period/pages/PeriodPage.tsx:97` | HabitControls (‹ › / month-year) | change month | goTo | OK | - |
| `src/features/period/components/PeriodHistoryList.tsx:34` | pencil per day | edit | onEdit(date) | OK | - |
| `src/features/period/components/PeriodDaySheet.tsx:73` | "Are you on your period?" switch | toggle | setIsOn | OK | - |
| `src/features/period/components/PeriodDaySheet.tsx:80` | Save | set day | PUT /periods/days/{date} {isOnPeriod} | OK | - |
| `src/features/period/components/PeriodDaySheet.tsx:49` | Delete (trash) | unmark day | disabled if untracked; ConfirmDialog -> DELETE /periods/days/{date} | OK | delete error silent |
| `src/features/steps/pages/StepsPage.tsx:85` | "+" Add steps | open sheet today | openSheet(today) | OK | - |
| `src/features/steps/pages/StepsPage.tsx:122` | Expand chart | expand | ExpandButton | OK | - |
| `src/features/steps/components/StepsChart.tsx:87` | chart tap/drag | select bar / pan | pick + pan | OK | - |
| `src/features/steps/pages/StepsPage.tsx:141` | RangeBar | range/averaging | setRange/setAveraging | OK | - |
| `src/features/steps/pages/StepsPage.tsx:155` | Tutorial | dismiss | setTutorial('hidden') | OK | - |
| `src/features/steps/components/StepsHistoryList.tsx:56` | pencil per day | edit | onEdit(date) | OK | - |
| `src/features/steps/pages/StepsPage.tsx:185` | Steps sheet Save | upsert | POST /steps {logDate, steps} | OK | - |
| `src/features/steps/pages/StepsPage.tsx:206` | Delete steps confirm | delete | DELETE /steps/{date} | OK | delete error silent |
| `src/features/progress-photos/pages/ProgressPhotosPage.tsx:86` | "+" Add photos | open sheet today | open() -> PhotoSessionSheet | OK | - |
| `src/features/progress-photos/pages/ProgressPhotosPage.tsx:96` | Open Gallery pill | /progress-photos/gallery | Link when >=1 session else dim | OK | - |
| `src/features/progress-photos/pages/ProgressPhotosPage.tsx:99` | Compare Before & After pill | /progress-photos/compare | Link when >=2 sessions else dim | OK | - |
| `src/features/progress-photos/components/SessionRow.tsx:27` | session row | open gallery at that day | Link `?date=${date}` only; Gallery defaults angle=Front and filters timeline to sessions WITH Front -> a Side/Back-only day opens on a different (nearest earlier) date | FIXED (was BROKEN) | append `&angle=${thumbs[0].angle}` |
| `src/features/progress-photos/components/SessionRow.tsx:51` | pencil | edit day | onEdit -> open(date) | OK | - |
| `src/features/progress-photos/components/PhotoSessionSheet.tsx:248` | Date title ▾ | Select Date | SelectDateSheet -> onDateChange | OK | - |
| `src/features/progress-photos/components/PhotoSessionSheet.tsx:263` | Delete (trash) | delete day | onDelete -> page ConfirmDialog -> DELETE /progress-photos?date | OK | - |
| `src/features/progress-photos/components/PhotoSessionSheet.tsx:76` | pose slot | add/replace -> crop | file input -> choose -> CropPhotoScreen | OK | - |
| `src/features/progress-photos/components/PhotoSessionSheet.tsx:99` | X remove angle | mark removal | clear(angle) -> removals on Save | OK | - |
| `src/features/progress-photos/components/PhotoSessionSheet.tsx:194` | consent checkbox | consent | setConsent | OK | - |
| `src/features/progress-photos/components/PhotoSessionSheet.tsx:203` | Save | upload + remove | PUT per angle, DELETE ?date&angle per removal | OK | - |
| `src/features/progress-photos/components/CropPhotoScreen.tsx:151` | pan / pinch | crop | pointer handlers -> update | OK | - |
| `src/features/progress-photos/components/CropPhotoScreen.tsx:210` | Cancel crop | close crop | dismiss | OK | - |
| `src/features/progress-photos/components/CropPhotoScreen.tsx:65` | Escape key | close crop only | window keydown -> dismiss; parent Radix Dialog also handles Escape (may close the whole sheet) | UNKNOWN | stopPropagation / handle via Dialog onEscapeKeyDown |
| `src/features/progress-photos/components/CropPhotoScreen.tsx:220` | Rotate left | rotate | update turns-1 | OK | - |
| `src/features/progress-photos/components/CropPhotoScreen.tsx:229` | Reset | reset crop | setState(START) | OK | - |
| `src/features/progress-photos/components/CropPhotoScreen.tsx:238` | Rotate right | rotate | update turns+1 | OK | - |
| `src/features/progress-photos/components/CropPhotoScreen.tsx:249` | Use this crop | confirm | renderCrop -> onConfirm(blob) | OK | - |
| `src/features/progress-photos/pages/ProgressPhotosPage.tsx:175` | Delete these photos confirm | delete day | DELETE /progress-photos?date (toast on error) | OK | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:105` | ?date / ?angle params | open at date/angle | useSearchParams date + parseAngle(angle, default Front) | OK | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:191` | Back | previous | router.back() | UNKNOWN | full-screen route with no nav: deep link/refresh-less entry has no in-app back target; fallback to /progress-photos |
| `src/features/progress-photos/pages/GalleryPage.tsx:200` | Front/Side/Back tabs | change angle | setAngle | OK | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:239` | photo swipe | prev/next date | go(-1/1) | OK | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:318` | thumbnail strip | jump to date | jump(position) | OK | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:350` | Share | share/download photo | navigator.share or download | OK | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:359` | Previous date | go back | go(-1) | OK | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:368` | Hide/Show details | toggle | setCompact | OK | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:378` | Next date | go forward | go(1) | OK | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:387` | Edit photos | edit current day | edit(session.date) -> PhotoSessionSheet | OK | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:220` | Add photos (empty angle) | open add sheet | edit() | OK | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:428` | Delete confirm | delete day | DELETE /progress-photos?date | OK | - |
| `src/features/progress-photos/pages/ComparePage.tsx:157` | Back | previous | router.back() | UNKNOWN | same as Gallery back |
| `src/features/progress-photos/pages/ComparePage.tsx:171` | Angle switch | change angle | setAngle | OK | - |
| `src/features/progress-photos/pages/ComparePage.tsx:195` | Before / After pickers | choose date | pick.show(slot) -> ChoiceSheet -> setChosen | OK | before can be set later than after (no ordering), minor |
| `src/features/progress-photos/pages/ComparePage.tsx:217` | Side by side / Slider | change mode | setMode | OK | - |
| `src/features/progress-photos/pages/ComparePage.tsx:109` | slider range input | reveal split | setSplit | OK | - |
| `src/features/dashboard/components/DashboardPage/SubPageHeader (used by every subpage in scope)` | Back | return to parent | router.back() default | UNKNOWN | deep-link/new-tab entry has no history; consider parent fallback |


