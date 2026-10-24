# Navigation & Action Audit — click verification (FE, phase 2)

Date: 2026-10-23 · Builds on [Navigation_Audit.md](Navigation_Audit.md) (phase 1: static trace of 917 elements, 55 routes, 13 fixes).
Rule applied: a button is not PASS because it has an `onClick`. Each row states purpose, route/API target, and how it was verified.

## Test status legend

- **CLICKED-PASS** — clicked in the browser (http://localhost:3000), result observed (route change, sheet open/close, validation, focus, no stray API call).
- **CLICKED-FAIL** — clicked and wrong.
- **CODE-ONLY** — handler traced to its end in code (route exists + params accepted, mutation + endpoint, loading/error state), plus check scripts where noted. Not clicked.
- **UNKNOWN** — purpose unclear vs MacroFactor, or behaviour depends on BE; needs the user.

## Totals

| | Count |
|---|---|
| Interactive elements | 917 |
| CLICKED-PASS | 98 (16 logged out + 82 logged in, MOS-FE) |
| CLICKED-FAIL | 0 |
| CODE-ONLY | 813 |
| UNKNOWN | 6 |

## Why most rows are CODE-ONLY

Every page except the 5 auth pages is behind `AuthGuard`. mos-nav could not sign in (no password given in its own chat), so the logged-in pass was run by MOS-FE on test account `e2e-macros-7k3q@example.test` (see "Logged-in click pass" below: 82 rows). The remaining CODE-ONLY rows are the areas listed under "Still CODE-ONLY".

## What was clicked (logged out)

Viewports: **390×844** (full pass), **320×640**, **430×932**, **desktop 1024** (spot checks).

| Page | Clicked | Result |
|---|---|---|
| /login | Forgot password? · Create account · empty "Log in" · Show password (mouse) · Tab order email → Forgot → password → Show password, Enter toggles | PASS: routes change; "Enter your email/password" inline, focus to email, no `/api` request; type toggles password↔text, label Show↔Hide |
| /register | Gender sheet → Female → closes, value "Female" · empty "Create account" · both Show password · Log in | PASS: 5 inline errors, focus to First name, no `/api` request |
| /forgot-password | empty "Send instructions" · Back to log in | PASS: email invalid, no request; back → /login |
| /reset-password | empty "Reset password" · Back to log in | PASS: token / new / confirm invalid, no request |
| /confirm-email | empty "Verify email" · empty "Resend" · Back to log in | PASS: inline errors, no request |
| /more (logged out) | direct URL | PASS: AuthGuard → `/login?redirect=%2Fmore` |
| all 5 auth pages | horizontal overflow at 320/390/430/1024 | none |
| Shortcuts sheet vs bottom nav (phase-1 fix) | dev overlays on :3000 | Next dev indicator 0×0, no React Query devtools button; tab bar z-40 < dialog z-50 |

## Touch & keyboard

- Touch targets measured on auth pages at 320/390/430: inputs 44–48px, buttons ≥44px. **Fixed (phase 2):** "Back to log in" on /forgot-password, /reset-password, /confirm-email was 88×18 → hit area now 44px via `before:` (no layout change; 25px clear of the submit button, verified with `elementFromPoint` ±10px). **Not fixed:** "Forgot password?" on /login is 100×16; it sits in the label row 8px above the password field, so enlarging the hit area would steal taps from the field — needs a layout decision (question 12).
- Keyboard: auth forms fully reachable by Tab, Enter submits, icon toggles operable with Enter. Code scan of every non-button element with `onClick/onPointer*` (18 files): all are gesture surfaces (swipe-to-delete, chart pan/pick, week strip, calendar swipe, crop, sheet drag handle) — each has a keyboard/button alternative (SwipeToDelete reveals a focusable Delete; calendars have arrow buttons; `ManualTdeeSheet` `role=radio` handles Enter/Space) except **chart point picking** (Weight Trend, Expenditure, Energy Balance, Macros, Nutrient, Steps, body metric charts), which is pointer-only. The summary values above each chart give the same numbers, so I left it as a note.

## Fixed in phase 2

| Where | Bug | Fix |
|---|---|---|
| `src/features/dashboard/components/DashboardPage/SubPageHeader.tsx:34`, `progress-photos/pages/GalleryPage.tsx:194`, `ComparePage.tsx:160`, `shortcuts/pages/ShortcutsPage.tsx:28-29` | Back = `router.back()`. Opened by link / new tab / bookmark (history length 1) → Back does nothing (dead button). Was UNKNOWN in phase 1. | `goBack()` in new `src/lib/back-target.ts`: history → `router.back()`; none → nearest parent that exists in `routePath` (static or dynamic), else /dashboard. Never an invented route; asserted for 9 paths in `scripts/check-routes.mjs`. `onBack` overrides unchanged. |
| `src/features/auth/pages/{Forgot,Reset}PasswordPage.tsx`, `ConfirmEmailPage.tsx` "Back to log in" | 18px-tall touch target | 44px hit area via pseudo-element |
| `src/features/dashboard/pages/DashboardPage.tsx:74`, `food-log/pages/FoodLogPage.tsx:239`, `FoodLogPage/AddFoodDialog.tsx:340`, `stores/ui.store.ts:7`, `components/shared/SearchInput.tsx:18` | Dashboard search bar opened Add food without focusing the search input | `focusSearch` request flag → `autoFocus` on the search input, only for that entry point |
| `src/features/dashboard/components/DashboardPage/DashboardCarousel.tsx:58` | Page dots 28px wide (< UI.md 32px) | 32px hit area, same spacing |
| `src/features/auth/auth.utils.ts:40` (review finding) | `safeRedirect` prefix check bypassable: browsers strip tab/CR/LF and map `\` → `/`, so `/\t/evil.com` became `//evil.com` | Rejects control chars / `\`, then resolves `new URL(target, origin)` and keeps only same-origin `path+search+hash`. 16 cases in `check-routes.mjs` (incl. `/\t/`, `/\n/`, `/\r/`, `/\\`, `//`, `%2F%2F`, `javascript:`, `/dashboard?x=1#a`). |
| `src/lib/back-target.ts:36`, `src/app/(protected)/layout.tsx` (review finding) | `history.length > 1` counted pages outside the app and "forward" entries: a deep link from another site went Back out of the app; the push fallback let the parent "go back" into the child | In-memory record of in-app paths (`trackPath` from the protected layout); `router.back()` only with an in-app previous page, else `router.replace(parent)` and the record drops the child. Fake-history scenario in `check-routes.mjs`: deep link → Back → parent → Back → grandparent with 0 `back()` calls and 2 history entries; in-app child → Back uses `back()`. |

## UNKNOWN (need the user / BE)

1. `FoodDetailView.tsx:283` — "To Custom" shown on the user's own foods (doc says hide). Intended?
2. `FoodLogSettingsPage.tsx:108` — Premove setting saved, no FE consumer. Does BE use it?
3. `FoodLogSettingsPage.tsx:119` — Branded / Open Food Facts toggles: does BE search filter by them?
4. `FoodLogSettingsPage.tsx:151` — Optimization setting saved, no FE consumer.
5. `CheckInHub.tsx:40` — all visible modules done → no CTA, only Back (only if program-update module is absent).
6. `CropPhotoScreen.tsx:65` — Escape may close the whole photo sheet instead of only the crop screen (window listener + Radix Dialog). Needs a logged-in click.

Plus the 10 questions and the item-11 list in Navigation_Audit.md (New Goal target, Nutrition Overview chevrons, desktop Shortcuts entry, "Not available yet" rows, Expenditure flags, coming-soon toasts, check-in "turn back on from More", trial plan, post-End-program onboarding, Goal Progress tutorial), and:

12. /login "Forgot password?" touch target (see Touch & keyboard).

## Open items for MOS-FE (hooks/services) — unchanged from phase 1

Detail-page errors have no Retry/Back (hooks don't expose `refetch`); silent failures on delete / End program / settings writes (no error surface, `ConfirmDialog` has no error slot); `pendingGoal` not cleared on wizard exit; Quick Add error hidden on its own tab. See Navigation_Audit.md "Not fixed — needs MOS-FE".

## Logged-in click plan (run once signed in; non-destructive, cancel confirms; destroy only own-created items)

390px, then spot 320/430/desktop: tab bar (Dashboard, Food Log, +, Strategy, More) · "+" → Shortcuts sheet, every row, last row above tab bar · Dashboard cards + chevrons → each detail, Back (in-app and via direct URL) · /dashboard/nutrition tiles incl. Macros · Food Log: day strip, search, Multi-Add "+" (adds to plate; remove before logging), Library/Favorites, hour pill tap + long-press (mode), settings rows · Strategy: program card actions, New Program wizard Back/Next to Review (cancel), Edit Goal to Review (cancel), check-in hub · More: every row (Units, Expenditure, BMR, Tutorials, "Not available yet" toasts) · Weight / Steps / Period / Body metrics / Full Body: open add sheets, Select Date, cancel · Progress Photos: gallery from a row, Compare, Back via direct URL · confirm dialogs (delete weigh-in/photo/food/note, End program): open → Cancel only, unless the item was created in this run.

## Logged-in click pass (MOS-FE, 2026-10-23)

Account: `e2e-macros-7k3q@example.test` on the production API (user-approved in MOS-FE's chat). Viewport **390×844** for every row flipped below; spot checks at **320×640, 430×932, 1024 desktop**. Destructive actions only on items MOS-FE created; confirm dialogs opened and cancelled. Evidence is appended to each row's *Actual* column as "**Clicked:** …" (390 = tapped at 390px, E2E = the earlier Phase-4 real-write run at 1024, 1024 = desktop sidebar).

| Area | Result |
|---|---|
| Tab bar (Dashboard, Food Log, +, Strategy, More) | all route; "+" opens Shortcuts, last row bottom 820px < 844, sheet above tab bar |
| Shortcuts sheet (Search, Barcode, AI, Weight, Recipes, Quick Add, Photos, Metrics, Customize) | each opens the right tab / sheet / page |
| Dashboard: 25 links + day columns, Consumed/Remaining, carousel tabs, search bar | all open the right page; Back returns to /dashboard |
| Food Log: calendar, week strip, More sheet, Customize, Nutrition Overview (+ range tabs, Back), Add note, Hour Range editor | PASS |
| Strategy: ⋮ menu (style, TDEE, End program), Edit Program, New Program, Edit Goal | sheets open/cancel; End confirm opens with focus on Cancel; TDEE empty → inline "Enter a whole number from 1000 to 6000 kcal." |
| More: 8 links + theme System/Light/Dark | PASS (theme restored to System) |
| Detail charts (Expenditure, Weight Trend, Energy Balance, Macros): 1M/3M/1Y | range label changes |
| Check-in (/program/check-in) | "It's not check-in time yet · Your next check-in is Oct 30" + Back to Strategy; the new BE Accept gate (400 DERIVED_DATA_UPDATING / FAILED) could not be reached (not due) |
| Layout 320 / 390 / 430 / 1024 on Dashboard, Food Log, Strategy, More, Profile, Expenditure, Weight Trend, Goal Progress, Shortcuts | no horizontal overflow, no target < 24px |

Side effect: Set TDEE "Save" was tapped with the prefilled 2419 kcal (current estimate) → `PUT /programs/current/expenditure` 200; the test account's targets moved 2006 → 2014 kcal.

Notes (not failures): Dashboard search bar opens Add food on the Search tab without focusing the input (no keyboard on mobile until tapped). TDEE input keeps `aria-invalid="false"` while its inline error shows. Carousel tab hit areas are 28×44 (≥ 24px, < 44px wide).

Outcome (mos-nav, code + checks; not re-clicked):
- **Search focus — fixed.** Dashboard search now sends `requestAddFood({ tab: 'search', focusSearch: true })`; FoodLogPage passes `autoFocusSearch` to AddFoodDialog's search input and drops it when the sheet closes, so opening via "+" still does not raise the keyboard (`onOpenAutoFocus` prevention kept). Wiring check in `check-business-logic.mjs`.
- **TDEE aria-invalid — not a bug.** With the field empty, `ProgramActions.tsx:296` shows the bounds text as the field *hint* (muted, `aria-describedby`), not as an error, and Save is disabled. A typed out-of-range / non-integer value shows the red error with `aria-invalid="true"` (FormField passes `Boolean(error)`). `ManualTdeeSheet.tsx:144` also matches its hint condition.
- **Carousel dots — fixed per UI.md:292** ("Vùng bấm tối thiểu 32px"): hit area 32×44 via `before:-inset-x-0.5`; dot spacing stays 28px. Wiring check added.

Still CODE-ONLY: Profile pickers / Save / Sign out, Foods & recipe editors, Progress Photos, Full Body, Nutrition Data sheets, Check-in modules (not due), food-log Copy/Select/Clear (disabled on an empty day; Clear Day on the shared account was blocked by the safety classifier), onboarding rows (account already onboarded), error/Retry variants not forced in this pass.

## Full matrix

Columns: Source (file:line, pre-fix) | Button/Action | Expected | Actual | Route / API target | Test status | Fix status

### A. Dashboard / nutrient detail / habits

| Source (file:line) | Button/Action | Expected | Actual | Route / API target | Test status | Fix status |
|---|---|---|---|---|---|---|
| `src/features/dashboard/pages/DashboardPage.tsx:90` | Customize icon link (SlidersHorizontal) | open Customize Dashboard | `<Link href={routePath.dashboardCustomize}>` → /dashboard/customize (exists) · **Clicked:** 390: → /dashboard/customize "Customize Dashboard", Back ok | `/dashboard/customize` | CLICKED-PASS | - |
| `src/features/dashboard/pages/DashboardPage.tsx:80` | ErrorState Retry (program) | refetch program | `onRetry={() => void program.refetch()}` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/pages/DashboardPage.tsx:81` | ErrorState Retry (week log) | refetch week | `onRetry={() => void week.refetch()}` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/pages/DashboardPage.tsx:74` | Search bar "Search" (via DashboardSearchBar onSearch, :223) | open Add Food | `setAddFoodOpen(true)` + `router.push('/food-log')`; FoodLogPage.tsx:122 reads `addFoodOpen` · **Clicked:** 390: tap bar → /food-log, Add food sheet on Search tab | `/food-log` | CLICKED-PASS | - |
| `src/features/dashboard/components/DashboardPage/DashboardSearchBar.tsx:45` | Barcode button | open scanner | `onScan ?? (() => run('barcode'))` → shortcuts runner (out of scope) | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/DashboardSearchBar.tsx:46` | Custom shortcut buttons | run shortcut | `onRun={run}` (useShortcutRunner, out of scope) | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/pages/DashboardPage.tsx:177` | DerivedFailed Retry (Energy focus page) | retry derived-data rebuild | `derived.retry` → `retry.mutate()` → POST /derived-data/retry, invalidates status | `POST /derived-data/retry` | CODE-ONLY | - |
| `src/features/dashboard/pages/DashboardPage.tsx:119` | Setup step "Your profile" (ListRow href, SetupChecklist.tsx:46) | go to profile | /profile (exists) | `/profile` | CODE-ONLY | - |
| `src/features/dashboard/pages/DashboardPage.tsx:126` | Setup step "Today's weight" | go to weight | /weight (exists) | `/weight` | CODE-ONLY | - |
| `src/features/dashboard/pages/DashboardPage.tsx:133` | Setup step "Goal and program" | create program | /program/new (exists) | `/program/new` | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/SetupChecklist.tsx:67` | "Continue: {label}" button | go to next unfinished step | `<Link href={next.href}>` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/DashboardCarousel.tsx:57` | Carousel page dots | scroll to page | `goTo(index)` → `track.scrollTo(...)`; onScroll updates active dot · **Clicked:** 390: tabs Weekly / Energy Balance / Daily → aria-selected true each | state / UI only | CLICKED-PASS | - |
| `src/features/dashboard/components/DashboardPage/WeekMatrix.tsx:88` | Weekly Nutrition day column | show that day's numbers / toggle back to week | `onSelect(active ? null : day.logDate)` → setSelectedDate; `current` drives summary · **Clicked:** 390: tap Fri column toggles selection (today pre-selected), summary follows | state / UI only | CLICKED-PASS | - |
| `src/features/dashboard/components/DashboardPage/WeekMatrix.tsx:180` | Consumed/Remaining toggle (weekly) | switch mode | ModeToggle → `setNutritionMode` (usePersistedChoice) · **Clicked:** 390: Consumed / Remaining → aria-checked flips, numbers switch | state / UI only | CLICKED-PASS | - |
| `src/features/dashboard/components/DashboardPage/DailyNutritionCard.tsx:182` | Consumed/Remaining toggle (daily) | switch mode | ModeToggle → `setNutritionMode` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/DailyNutritionCard.tsx:30` | ModeToggle ToggleGroup onValueChange (shared) | change value, ignore deselect | `next && onChange(next)` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/EnergyBalanceCard.tsx:91` | "Energy Balance ›" heading link | open detail | /dashboard/energy-balance (exists) | `/dashboard/energy-balance` | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/EnergyBalanceCard.tsx:165` | Expenditure/Target toggle | switch compare mode | ModeToggle → `setBalanceMode` (persisted) | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/TileSection.tsx:37` | "See All" (Insights section) | open all insights | SEE_ALL.insights → /dashboard/insights (exists) | `/dashboard/insights` | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/TileSection.tsx:37` | "See All" (Nutrition section) | open nutrition list | SEE_ALL.nutrition → /dashboard/nutrition (exists) | `/dashboard/nutrition` | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/LayoutSection.tsx:43` | Weigh-In tile | open habit page | /habits/weigh-in (exists) · **Clicked:** 390: → /habits/weigh-in "Weigh-In" | `/habits/weigh-in` | CLICKED-PASS | - |
| `src/features/dashboard/components/DashboardPage/LayoutSection.tsx:43` | Food Logging tile | open habit page | /habits/food-logging (exists) · **Clicked:** 390: → /habits/food-logging "Food Logging" | `/habits/food-logging` | CLICKED-PASS | - |
| `src/features/dashboard/components/DashboardPage/LayoutSection.tsx:56` | Scale Weight tile | open weight | /weight (exists) | `/weight` | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/LayoutSection.tsx:68` | Visual Body Fat tile | open body fat | /body-fat (exists) | `/body-fat` | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/LayoutSection.tsx:84` | Steps tile | open steps | /steps (exists) | `/steps` | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/LayoutSection.tsx:96` | Period tile | open period | /period (exists) | `/period` | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/LayoutSection.tsx:110` | Macros tile (dashboard) | open macros detail | /dashboard/macros (exists) | `/dashboard/macros` | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/NutrientTile.tsx:77` | Nutrient tile (calories, protein, vitamins…) | open nutrient detail | `routePath.dashboardNutrient(tileKey)`; every catalog key except `macros` is in NUTRIENT_CODE so `findNutrient` resolves (macros never reaches NutrientTile: LayoutSection.tsx:105, NutrientGroupSection.tsx:45) · **Clicked:** 390: Calories / Protein / Fat / Carbs tiles → /dashboard/nutrition/{key} | state / UI only | CLICKED-PASS | - |
| `src/features/dashboard/components/DashboardPage/BodyMetricTiles.tsx:64` | Measurement tiles (Neck…Right Ankle) | open measurement page | `routePath.bodyMeasurement(TILE_KEY[k])`; all 18 mapped keys exist in features/weight/body-measurements.ts (findMeasurement) · **Clicked:** 390: Neck / Shoulders / Waist → /body-metrics/* | state / UI only | CLICKED-PASS | - |
| `src/features/dashboard/components/DashboardPage/BodyMetricTiles.tsx:109` | Waist to Height / Waist to Hip tiles | open related page | /body-metrics/waist (valid key) · **Clicked:** 390: → /body-metrics/waist | `/body-metrics/waist` | CLICKED-PASS | - |
| `src/features/dashboard/components/DashboardPage/BodyMetricTiles.tsx:137` | Progress Photos tile (empty "Add") | open progress photos | /progress-photos (exists) | `/progress-photos` | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/BodyMetricTiles.tsx:142` | Progress Photos tile (photo + chevron) | open progress photos | `<Link href={routePath.progressPhotos}>` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/BodyMetricTiles.tsx:198` | Full Body tile (empty) | open full body | /full-body (exists) | `/full-body` | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/BodyMetricTiles.tsx:203` | Full Body tile (chips + chevron) | open full body | `<Link href={routePath.fullBody}>` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/DashboardTiles.tsx:40` | Expenditure tile | open detail | /dashboard/expenditure (exists) · **Clicked:** 390: → /dashboard/expenditure | `/dashboard/expenditure` | CLICKED-PASS | - |
| `src/features/dashboard/components/DashboardPage/DashboardTiles.tsx:63` | Weight Trend tile | open detail | /dashboard/weight-trend (exists) · **Clicked:** 390: → /dashboard/weight-trend | `/dashboard/weight-trend` | CLICKED-PASS | - |
| `src/features/dashboard/components/DashboardPage/DashboardTiles.tsx:96` | Energy Balance tile | open detail | /dashboard/energy-balance (exists) · **Clicked:** 390: → /dashboard/energy-balance | `/dashboard/energy-balance` | CLICKED-PASS | - |
| `src/features/dashboard/components/DashboardPage/DashboardTiles.tsx:135` | Goal Progress tile | open detail | /dashboard/goal-progress (exists) | `/dashboard/goal-progress` | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/DashboardTiles.tsx:31` | DerivedFailed Retry in insight tiles (:31,:54,:83,:123) | retry rebuild | POST /derived-data/retry | `POST /derived-data/retry` | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/DashboardTiles.tsx:149` | "Nutrition Data Manager ›" (Other section) | open manager | /nutrition-data (exists) · **Clicked:** 390: → /nutrition-data "Nutrition Data Manager" | `/nutrition-data` | CLICKED-PASS | - |
| `src/features/dashboard/components/DashboardPage/MetricTile.tsx:81` | MetricTile wrapper (chevron) | whole tile is a link when href given | `href ? <Link> : <div>`; without href chevron dimmed, not clickable (by design; used during loading) | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/SubPageHeader.tsx:34` | Back chevron (all detail pages, habits, nutrient pages) | go back | `onBack ?? (() => router.back())` | state / UI only | CODE-ONLY (parentRoute asserted in check-routes.mjs) | Fixed (phase 2) — was UNKNOWN: Back with no history did nothing; now goBack() → nearest existing parent route |
| `src/features/dashboard/components/DashboardPage/NutrientGroupSection.tsx:47` | Nutrient tiles on /dashboard/nutrition | open nutrient detail | NutrientTile → /dashboard/nutrition/{key} (valid) · **Clicked:** 390: /dashboard/nutrition → nutrient detail pages open | `/dashboard/nutrition/{key}` | CLICKED-PASS | - |
| `src/features/dashboard/components/DashboardPage/NutrientGroupSection.tsx:60` | "Macros" tile on /dashboard/nutrition (chevron shown) | open Macros detail like the Dashboard tile does | `<MetricTile ... />` with no `href` → renders `<div>`, dimmed chevron, nothing happens | state / UI only | CODE-ONLY | Fixed — (was DEAD) |
| `src/features/dashboard/pages/CustomizePage.tsx:60` | Back chevron | leave Customize | `router.push(routePath.dashboard)`; discards draft without confirm | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/pages/CustomizePage.tsx:65` | Save | persist layout | `finish`: `if (draft) save(draft)` → localStorage `dashboard.layout.v1` (no API by design, hook comment) + push /dashboard | `/dashboard` | CODE-ONLY | - |
| `src/features/dashboard/pages/CustomizePage.tsx:101` | Reset to App Defaults | reset layout | `setDraft(DEFAULT_LAYOUT)` (applied on Save) | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/CustomizePage/FocusPicker.tsx:52` | Focus page Switch | show/hide focus page | `onToggle(key,next)` → toggleFocus updates `focusHidden` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/CustomizePage/FocusPicker.tsx:65` | Move focus left | reorder | `onMove(index,-1)` → moveItem; hidden+disabled at index 0 | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/CustomizePage/FocusPicker.tsx:72` | Move focus right | reorder | `onMove(index,1)`; hidden+disabled at last | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/CustomizePage/TileListSection.tsx:72` | Move section up | reorder sections | `onMoveSection(-1)`; disabled when first | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/CustomizePage/TileListSection.tsx:79` | Move section down | reorder sections | `onMoveSection(1)`; disabled when last | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/CustomizePage/TileListSection.tsx:101` | Nutrient display mode "Consumed ▾" | open display sheet | `onPickDisplay(key)` → setDisplayTile → DisplaySheet open | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/CustomizePage/TileListSection.tsx:112` | Drag handle (pointer) | drag reorder tiles | pointer capture + handleMove → `onMoveTile` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/CustomizePage/TileListSection.tsx:119` | Drag handle (ArrowUp/Down keys) | keyboard reorder | `onMoveTile(index,±1)`; moveItem clamps | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/CustomizePage/TileListSection.tsx:139` | "Add or Remove …" button | open tile picker | `onEdit` → `setPicker(section)` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/CustomizePage/TilePickerSheet.tsx:69` | Tile Switch in picker | add/remove tile in draft | `toggle(tile.key,next)` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/CustomizePage/TilePickerSheet.tsx:47` | Picker "Done" | apply selection | SheetFrame Done → `onDone()` (`onApply(draft)` → setTiles) then `onOpenChange(false)` → onClose | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/CustomizePage/TilePickerSheet.tsx:46` | Picker close / backdrop | close without applying | `!open && onClose()` → setPicker(null) | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/CustomizePage/TilePickerSheet.tsx:109` | DisplaySheet option (Percent/Consumed/Remaining) | set display + close | `onChange(option); onClose()` → update nutrientDisplay | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/CustomizePage/TilePickerSheet.tsx:96` | DisplaySheet close | close | `!next && onClose()` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/pages/ExpenditurePage.tsx:87` | Tutorial (GraduationCap) toggle | show/hide tutorial | `setTutorial(show/hidden)` persisted | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/pages/ExpenditurePage.tsx:93` | DerivedFailed Retry | retry rebuild | POST /derived-data/retry | `POST /derived-data/retry` | CODE-ONLY | - |
| `src/features/dashboard/chart/use-chart-expand.tsx:171` | Expand/Shrink chart button (Expenditure, WeightTrend, EnergyBalance, GoalProgress, Macros, Nutrient detail) | toggle tall chart | `onClick={expand.toggle}` → setExpanded + scroll | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DetailPage/RangeBar.tsx:46` | Range 1W…All | change range | `onRangeChange(option)` → setRange · **Clicked:** 390: 1M/3M/1Y change range label on Expenditure, Weight Trend, Energy Balance, Macros | state / UI only | CLICKED-PASS | - |
| `src/features/dashboard/components/DetailPage/RangeBar.tsx:59` | Averaging "D ▾" | open Chart Averaging sheet | `setOpen(true)` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DetailPage/RangeBar.tsx:76` | Averaging option | set averaging + close | `onAveragingChange(option); setOpen(false)` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DetailPage/TutorialCard.tsx:70` | Dismiss Tutorial | hide | `onDismiss` → setTutorial('hidden') | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DetailPage/TutorialCard.tsx:77` | Previous | previous step | `go(step-1)` scroll | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DetailPage/TutorialCard.tsx:83` | Next / Done | next step / dismiss | `last ? onDismiss() : go(step+1)` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DetailPage/UnderlineTabs.tsx:34` | Underline tab (Energy Balance compare / Goal Progress basis) | switch tab | `onChange(tab.value)` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DetailPage/DetailBlocks.tsx:47` | SourceRow "Manage Data ›" (generic) | open source page | `<Link href={href}>` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/ExpenditurePage/ExpenditureInsights.tsx:144` | Data Sources: Nutrition Data Manager | open manager | /nutrition-data | `/nutrition-data` | CODE-ONLY | - |
| `src/features/dashboard/components/ExpenditurePage/ExpenditureInsights.tsx:149` | Data Sources: Scale Weight | open weight | /weight | `/weight` | CODE-ONLY | - |
| `src/features/dashboard/components/ExpenditurePage/ExpenditureChart.tsx:86` | Chart tap (select day) | show day tooltip | `pick` → setPicked (ignored after drag) | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/chart/use-chart-pan.ts:94` | Chart drag (pointer down/move/up) | pan back in time | pan.bind on every chart; coast/snap | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/pages/WeightTrendPage.tsx:95` | Tutorial toggle | show/hide tutorial | `setTutorial(...)` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/pages/WeightTrendPage.tsx:101` | DerivedFailed Retry | retry rebuild | POST /derived-data/retry | `POST /derived-data/retry` | CODE-ONLY | - |
| `src/features/dashboard/components/WeightTrendPage/WeightTrendChart.tsx:113` | Chart tap | select day | `pick` → setPicked | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/WeightTrendPage/WeightTrendInsights.tsx:136` | Data Sources: Scale Weight | open weight | /weight | `/weight` | CODE-ONLY | - |
| `src/features/dashboard/pages/EnergyBalancePage.tsx:72` | ModeTabs (Expenditure/Target) | switch compare | ModeTabs.tsx:34 → UnderlineTabs → setMode | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/pages/EnergyBalancePage.tsx:75` | DerivedFailed Retry | retry rebuild | POST /derived-data/retry | `POST /derived-data/retry` | CODE-ONLY | - |
| `src/features/dashboard/components/EnergyBalancePage/EnergyBalanceChart.tsx:91` | Chart tap | select day | `pick` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/pages/GoalProgressPage.tsx:74` | Scale/Trend Weight tabs | switch basis | `onChange={setTab}` → refetch by tab | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/pages/GoalProgressPage.tsx:77` | DerivedFailed Retry | retry rebuild | POST /derived-data/retry | `POST /derived-data/retry` | CODE-ONLY | - |
| `src/features/dashboard/pages/GoalProgressPage.tsx:130` | Goal Progress TutorialCard (Dismiss/Next/Done) | dismiss tutorial; can be re-shown like Expenditure/Weight Trend | dismiss → `setTutorial('hidden')` persisted; header `<SubPageHeader title="Goal Progress" />` (:73) has no GraduationCap action, so tutorial can never be re-shown | state / UI only | CODE-ONLY | Question for user |
| `src/features/dashboard/components/GoalProgressPage/WaterfallChart.tsx:142` | Waterfall bar click | select bar tooltip | `toggle(bar.key)` (ignored after drag) | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/GoalProgressPage/WaterfallChart.tsx:143` | Waterfall bar Enter/Space | select bar | `setSelected(...)` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/pages/MacrosDetailPage.tsx:67` | ErrorState Retry | refetch | `history.refetch()` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/MacrosPage/MacrosChart.tsx:91` | Chart tap | select day | `pick` | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/pages/ExpenditurePage.tsx:56` | Error state (Expenditure/WeightTrend:61/EnergyBalance:60/GoalProgress:69) | retry or go back | `<ErrorState error={new Error(...)} />` without onRetry and without SubPageHeader → no retry button, no back button · **Clicked:** E2E 1024: forced 500 → ErrorState → Try again re-sent request, data back (4 pages) | state / UI only | CLICKED-PASS | Question for user |
| `src/features/nutrient-detail/pages/NutrientDetailPage.tsx:85` | ErrorState Retry | refetch | `series.refetch()` | state / UI only | CODE-ONLY | - |
| `src/features/nutrient-detail/components/NutrientChart.tsx:99` | Chart tap | select day | `pick` → setPicked(date) | state / UI only | CODE-ONLY | - |
| `src/features/nutrient-detail/components/NutrientLegend.tsx:33` | Legend "About Nutrient Goals" link | open goals explainer | `routePath.dashboardNutrientGoals(info.nutrient.key)` (key already validated by findNutrient) | state / UI only | CODE-ONLY | - |
| `src/features/nutrient-detail/components/NutrientTodayCard.tsx:27` | Today card | open summary | `routePath.dashboardNutrientSummary(nutrient.key)` (valid) | state / UI only | CODE-ONLY | - |
| `src/features/nutrient-detail/pages/NutrientSummaryPage.tsx:135` | ErrorState Retry | refetch | `query.refetch()` | state / UI only | CODE-ONLY | - |
| `src/features/derived-data/components/DerivedFailed.tsx:27` | Retry button (shared) | retry rebuild | ErrorState onRetry → `useDerivedGate().retry` → POST /derived-data/retry | `POST /derived-data/retry` | CODE-ONLY | - |
| `src/features/habits/pages/HabitsPage.tsx:50` | ErrorState Retry | refetch summary | `summary.refetch` | state / UI only | CODE-ONLY | - |
| `src/features/habits/components/HabitsPage/HabitCalendar.tsx:103` | Calendar day (weigh-in) | open weigh-in sheet for date | HabitsPage.tsx:54 `sheet.show(iso)` → ScaleWeightSheet | state / UI only | CODE-ONLY | - |
| `src/features/habits/components/HabitsPage/HabitCalendar.tsx:103` | Calendar day (food-logging) | open food log at date | HabitsPage.tsx:57 `openFoodLogDate(iso)` + push /food-log; FoodLogPage.tsx:262 reads `foodLogDate` | `/food-log` | CODE-ONLY | - |
| `src/features/habits/components/HabitsPage/HabitCalendar.tsx:47` | Calendar swipe (pointer down/up) | swipe months | only active when `onSwipe` passed; HabitsPage does not pass it (PeriodPage does) → no-op here | state / UI only | CODE-ONLY | - |
| `src/features/habits/components/HabitsPage/HabitControls.tsx:49` | Previous month ‹ | previous month | `go(-1)` → onChange → setPicked | state / UI only | CODE-ONLY | - |
| `src/features/habits/components/HabitsPage/HabitControls.tsx:58` | Next month › | next month | `go(1)`; disabled at current month | state / UI only | CODE-ONLY | - |
| `src/features/habits/components/HabitsPage/HabitControls.tsx:71` | Month ▾ / Year ▾ triggers | open picker sheet | `setPicker({mode,open:true})` | state / UI only | CODE-ONLY | - |
| `src/features/habits/components/HabitsPage/HabitControls.tsx:87` | MonthYearPickerSheet select / close (:81) | change month/year | `onSelect={onChange}`; onOpenChange updates state | state / UI only | CODE-ONLY | - |
| `src/features/habits/components/HabitsPage/ScaleWeightSheet.tsx:121` | Weigh-in form submit / Save (:152) | save weight + body fat | `submit()` → `useUpsertWeight` POST /weights and/or `useSaveFullBody` PUT /body-metrics/full-body; closes on success, inline error | `POST /weights`, `PUT /body-metrics/full-body`, `/weights` | CODE-ONLY | - |
| `src/features/habits/components/HabitsPage/ScaleWeightSheet.tsx:165` | Numeric keypad (touch) | type digits | `setField(active, ...)` / backspace | state / UI only | CODE-ONLY | - |
| `src/features/habits/components/HabitsPage/ScaleWeightSheet.tsx:197` | Sheet close | close | `onOpenChange` → sheet.onOpenChange · **Clicked:** 390: Weight shortcut sheet → Cancel closes, no dialog left | state / UI only | CLICKED-PASS | - |
| `src/features/habits/components/HabitsPage/ScaleWeightSheet.tsx:206` | Trash (Delete weigh-in) | open confirm | `setConfirmOpen(true)`; only when entry exists | state / UI only | CODE-ONLY | - |
| `src/features/habits/components/HabitsPage/ScaleWeightSheet.tsx:238` | Confirm "Delete weigh-in" | delete weight for date | `remove.mutate(date, { onSuccess })` → DELETE /weights/{date}; works on success, but no onError and ConfirmDialog has no error prop while hook (use-weights.ts:104) says errors are shown inline → failure is silent; body fat for that date is not deleted | `DELETE /weights/{date}`, `/weights/{date}` | CODE-ONLY | - |

### B. Food log / foods / nutrition data

| Source (file:line) | Button/Action | Expected | Actual | Route / API target | Test status | Fix status |
|---|---|---|---|---|---|---|
| `src/features/food-log/pages/FoodLogPage.tsx:429` | ErrorState Retry (day load error) | refetch day | `day.refetch()` → GET foodLogs.root?date | `GET foodLogs.root?date` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:528` | FoodLogHeader onDateChange (WeekStrip day) | switch viewed day | `setSelectedDate(next)` + close calendar · **Clicked:** 390: Th 22 → header YESTERDAY, today chip → TODAY | state / UI only | CLICKED-PASS | - |
| `src/features/food-log/pages/FoodLogPage.tsx:543` | Header calendar toggle | open/close CalendarSheet | `setCalendarOpen(!open)` → mounts CalendarSheet · **Clicked:** 390: calendar expands to month grid, tap again collapses | state / UI only | CLICKED-PASS | - |
| `src/features/food-log/pages/FoodLogPage.tsx:544` | Header More (⋮) | open More sheet | `moreSheet.show(true)` → MoreSheet · **Clicked:** 390: More sheet opens (Copy/Select/Clear disabled on empty day) | state / UI only | CLICKED-PASS | - |
| `src/features/food-log/pages/FoodLogPage.tsx:565` | CalendarSheet onSelect | pick day | `setSelectedDate` + close | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:596` | DayTimeline onAddAt (hour +/long-press) | open Add Food at hour | `openAdd(time)` → ui.store addFoodOpen=true · **Clicked:** E2E: + at 08:00/12:00/13:00 opens Add food at that hour | state / UI only | CLICKED-PASS | - |
| `src/features/food-log/pages/FoodLogPage.tsx:597` | DayTimeline onSelectEntry (tap food tile) | open entry editor | `openEdit` → editSheet.show(entry) → EntryEditDialog | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:604` | DayTimeline onPaste (Multi-Paste) | paste selection at hour | `copySelected([date], time, false)` → POST foodLogs.bulkCopy | `POST foodLogs.bulkCopy` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:609` | NotesSection onAdd | new note sheet | `noteSheet.show(null)` · **Clicked:** 390: Add note → New Note sheet | state / UI only | CLICKED-PASS | - |
| `src/features/food-log/pages/FoodLogPage.tsx:613` | NotesSection onSelect | edit note sheet | `noteSheet.show(note)` | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:617` | NotesSection onDelete (swipe) | delete note | `deleteNote.mutate(id)` → DELETE foodLogs.note(id); on error only logger.error (use-food-log.ts useNoteMutation), no UI feedback when sheet closed | `DELETE foodLogs.note` | CODE-ONLY | Open (BROKEN (silent failure)) — see Open items |
| `src/features/food-log/pages/FoodLogPage.tsx:637` | DashboardSearchBar onSearch | open Add Food (search) | `openAdd()` | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:639` | DashboardSearchBar onScan | open Add Food (scan tab) | `barcode.reset(); setTab('scan'); openAdd()` | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:655` | MoreSheet Hide Food Details switch | hide tile details | `setHideDetails` (usePersistedChoice, local) → HIDDEN_DETAILS tile opts | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:656` | MoreSheet Hide Empty Hours switch | hide empty hours | `setHideEmptyHours` → DayTimeline hideEmptyHours | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:657` | MoreSheet Copy Day | open CopyDialog | `openCopy` → setCopyOpen(true) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:658` | MoreSheet Select All | select all entries | `selection.start(all ids)` → SelectionBar | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:659` | MoreSheet Clear Day | confirm clear day | `setClearOpen(true)` → ConfirmDialog | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:680` | NoteSheet onSave | add/update note | `updateNote.mutate` PUT foodLogs.note(id) / `addNote.mutate` POST foodLogs.notes | `PUT foodLogs.note`, `POST foodLogs.notes` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:691` | NoteSheet onDelete | delete note | `deleteNote.mutate` + hide; error shown in sheet | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:714` | SelectDatesSheet onConfirm (Paste to Dates) | bulk copy to dates | `copySelected(dates)` → POST bulkCopy {toDates} | `POST bulkCopy` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:737` | DateTimeWheelSheet onConfirm | copy/move/retime selection | copy-datetime→bulkCopy; move-datetime→bulkMove; timestamp→bulkMove{toTime} | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:752` | RemoveFoodsDialog onConfirm | bulk delete | `bulkDelete.mutate(ids)` → POST foodLogs.bulkDelete; error toast | `POST foodLogs.bulkDelete` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:770` | BarcodeSheet onLookup | look up barcode | `barcode.mutate` (foodService.byBarcode) → tab search + pick | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:788` | DateTimeSheet onSelect | set log date/time | setLogDate/setEatenAt/setMeal | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:793` | DateTimeSheet onLog | log plate to date/time | `logPlate(plate,{date,time})` → POST entries / quickAdd | `POST entries` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:808` | AddFoodDialog onTimeClick (MealTimePill) | open Select Date and Time | `dateTimeSheet.show(true)` | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:829` | AddFoodDialog error for Quick Add tab | show log errors | `quickAdd.error && tab !== 'quick'` → quickAdd failure while on Quick Add tab is hidden; logPlate catch returns false silently · **Clicked:** E2E: blocked quick-add → "Couldn't add food" shown on Quick Add tab | state / UI only | CLICKED-PASS | Open (BROKEN (silent failure)) — see Open items |
| `src/features/food-log/pages/FoodLogPage.tsx:836` | Plate remove | remove plate row | setPlate filter | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:839` | Plate update item | edit row amount | setPlate map | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:844` | onLogPlate | log plate | `logPlate(items)` sequential POST foodLogs.entries / quickAdd · **Clicked:** E2E: egg logged, POST /food-logs/entries 200 | `POST foodLogs.entries` | CLICKED-PASS | - |
| `src/features/food-log/pages/FoodLogPage.tsx:851` | ScanPanel onCode | auto barcode lookup | `lookupBarcode(code)` | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:852` | ScanPanel onManual | open Manual Barcode | `barcodeSheet.show(true)` | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:876` | AiPanel onLog | log AI plate + confirm | `logPlate([...plate,...items])` then `aiPlate.confirm` (POST aiConfirm) | `POST aiConfirm` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:887` | LibraryPanel onViewChange | switch Recipes/Foods/♥ | setLibraryView | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:907` | LibraryPanel createFoodHref/createRecipeHref | go to create pages | `/foods/new`, `/recipes/new` (both exist) + onNavigate closes sheet | `/foods/new`, `/recipes/new` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:910` | LibraryPanel onPickFood | open food detail | setPickedId + tab search | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:935` | Favorite add/remove (Search detail) | toggle favorite | `addFavorite.mutate` / `removeFavorite.mutate` (favoriteService) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:948` | Food Detail Log Foods | add + log plate | `logFromDetail` → logPlate | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:949` | Food Detail To Custom | open Create Food prefilled | `router.push('/foods/new?from=<id>')`; page reads `from` (app/(protected)/foods/new/page.tsx) | `/foods/new?from=`, `/foods/new/page.tsx` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:954` | QuickAddPanel onAdd | add quick item to plate | setPlate append · **Clicked:** E2E: Quick Add 300 / 200 kcal added to plate and logged | state / UI only | CLICKED-PASS | - |
| `src/features/food-log/pages/FoodLogPage.tsx:978` | EntryEdit To Custom | Create Food prefilled | foodItemId null → `/foods/new?name&calories&protein&carbs&fat` (all read by route as seed); else `?from=` | `/foods/new?name&calories&protein&carbs&fat` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:993` | EntryEdit onSave (Done) | update entry | `updateEntry.mutate` PUT foodLogs.entry(id) · **Clicked:** E2E: amount 1→3, PUT entry 200, 215 kcal everywhere | `PUT foodLogs.entry` | CLICKED-PASS | - |
| `src/features/food-log/pages/FoodLogPage.tsx:994` | EntryEdit Remove | delete entry | `deleteEntry.mutate` DELETE foodLogs.entry(id), optimistic; error in top FormErrorAlert · **Clicked:** E2E: Remove → DELETE entry 200; blocked delete → toast + rollback | `DELETE foodLogs.entry` | CLICKED-PASS | - |
| `src/features/food-log/pages/FoodLogPage.tsx:1010` | CopyDialog onCopy | copy day/meal | `copyLog.mutate` POST foodLogs.copy | `POST foodLogs.copy` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:1026` | Clear Day confirm | delete day log | `clearDay.mutate(date)` DELETE foodLogs.byDate | `DELETE foodLogs.byDate` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogPage.tsx:497` | Selection Create Recipe | build recipe from selection | `setRecipeDraft(lines); router.push('/recipes/new')`; RecipeCreatePage reads `useUiStore.getState().recipeDraft` | `/recipes/new` | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodLogHeader.tsx:101` | Calendar button | toggle calendar | onClick={onCalendarToggle} · **Clicked:** 390: calendar toggle | state / UI only | CLICKED-PASS | - |
| `src/features/food-log/components/FoodLogPage/FoodLogHeader.tsx:114` | Customize (sliders) Link | food log settings | href `/food-log/settings` (exists) · **Clicked:** 390: → /food-log/settings | `/food-log/settings` | CLICKED-PASS | - |
| `src/features/food-log/components/FoodLogPage/FoodLogHeader.tsx:118` | More options button | open More sheet | onClick={onMore} · **Clicked:** 390: More sheet opens | state / UI only | CLICKED-PASS | - |
| `src/features/food-log/components/FoodLogPage/WeekStrip.tsx:53` | Day pill (week strip) | select day | onClick → onSelect(day) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/WeekStrip.tsx:175` | Week strip swipe/scroll | page weeks / load week data | onScroll→onWeeksView; pointer drag on desktop; click-capture suppresses after swipe | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/WeekStrip.tsx:240` | Back to this week | scroll to today's week | scrollToWeek(startOf(today)) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/CalendarSheet.tsx:88` | Calendar scroll | load visible weeks | onScroll → onWeeksView | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/CalendarSheet.tsx:125` | Calendar DayPill | pick day | onSelect | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/MacroSummary.tsx:64` | Macro summary swipe | page between 2 summaries | onScroll → setPage (dots) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/MoreSheet.tsx:60` | Nutrition Overview link | open overview | href `/food-log/nutrition-overview` (exists) | `/food-log/nutrition-overview` | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/MoreSheet.tsx:65` | Copy Day | copy day | act(onCopyDay); disabled when no entries | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/MoreSheet.tsx:70` | Select All | select all | act(onSelectAll) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/MoreSheet.tsx:75` | Clear Day | clear day | act(onClearDay) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/MoreSheet.tsx:82` | Hide Food Details switch | toggle | onCheckedChange → parent | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/MoreSheet.tsx:92` | Hide Empty Hours switch | toggle | onCheckedChange → parent | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/NotesSection.tsx:36` | Note card | edit note | onClick → onSelect(note) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/NotesSection.tsx:85` | Add note (+) | new note | onAdd unless full (aria-disabled + explanatory text) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/NotesSection.tsx:116` | SwipeToDelete note | delete | onDelete(note) → see FoodLogPage:617 | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:110` | Color palette trigger | open palette | Popover open | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:134` | Color swatch | pick color | setColor + close | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:165` | Save note (✓) | save | `save()` → onSave | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:190` | Sheet close (requestClose) | close / discard prompt | dirty → discard ConfirmDialog | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:203` | form onSubmit | save | save() | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:217` | Time input | set noted time | setTime | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:231` | Name Enter key | jump to body | focus body | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:253` | Delete note | delete | onDelete(note) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/NoteSheet.tsx:265` | Discard confirm | discard edits | close sheet | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:64` | ✕ / ‹ | exit selection / back to main bar | onExit / onBack | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:96` | View chip | summary sheet | onAction('view') | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:97` | Copy chip | copy submenu | onMode('copy') | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:98` | Move chip | move submenu | onMode('move') | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:99` | Remove chip | confirm remove | onAction('remove') | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:100` | Modify Timestamp chip | time wheel | onAction('timestamp') | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:101` | Create Recipe chip | go to recipe | onAction('recipe') | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:106` | Copy To Now | copy to now | onCopyTo('now') → bulkCopy | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:107` | Copy To Today | copy | onCopyTo('today') | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:108` | Copy To Tomorrow | copy | onCopyTo('tomorrow') | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:109` | Copy To Dates | dates sheet | onCopyTo('dates') | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:110` | Copy To Date & Time | wheel | onCopyTo('datetime') | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:111` | Multi-Paste Inline | paste mode | onMode('paste') → DayTimeline paste buttons | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:116` | Move To Today | move | onMoveTo('today') → bulkMove | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:117` | Move To Tomorrow | move | onMoveTo('tomorrow') | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionBar.tsx:118` | Move To Date & Time | wheel | onMoveTo('datetime') | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/RemoveFoodsDialog.tsx:37` | Close ✕ | close | onOpenChange(false) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/RemoveFoodsDialog.tsx:52` | Remove | bulk delete | onConfirm | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/RemoveFoodsDialog.tsx:61` | Go Back | close | onOpenChange(false) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectionSummarySheet.tsx:-` | (read-only sheet) | - | no interactive controls besides SheetFrame close | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectDatesSheet.tsx:96` | Selection mode switch | single/range mode | setMode | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectDatesSheet.tsx:109` | Previous month | nav | go(-1) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectDatesSheet.tsx:117` | Next month | nav | go(1) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectDatesSheet.tsx:157` | Day cell | toggle date | tap(iso) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/SelectDatesSheet.tsx:178` | Paste to Dates | confirm | onConfirm(selected) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/DateTimeWheelSheet.tsx:89` | Date/Hour/Minute wheels | pick | setDay/setHour/setMinute | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/DateTimeWheelSheet.tsx:124` | Confirm (Paste/Move/Done) | confirm | onConfirm(day, time) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/DateTimeWheelSheet.tsx:133` | Cancel | close | onOpenChange(false) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/DateTimeSheet.tsx:76` | Date/Hour wheels | pick | setDay/setHour | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/DateTimeSheet.tsx:93` | Select Date and Time | apply | onSelect + close | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/DateTimeSheet.tsx:105` | Log to Date and Time | log plate | onLog (disabled when plate empty) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/DateTimeSheet.tsx:115` | Cancel | close | onOpenChange(false) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/CopyDialog.tsx:68` | Copy scope picker | day/meal | setScope | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/CopyDialog.tsx:82` | To date field | date | setToDate | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/CopyDialog.tsx:87` | To meal picker | meal | setToMeal | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/CopyDialog.tsx:99` | Cancel | close | onOpenChange(false) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/CopyDialog.tsx:107` | Copy | copy | onCopy({fromDate,toDate,mealType,toMealType}) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/BarcodeSheet.tsx:37` | Manual barcode form submit | lookup | onLookup(code) when 8–14 digits | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:137` | Dialog onOpenChange | close sheet | blocked while logging | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:150` | Close ✕ | close | onOpenChange(false) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:159` | MealTimePill | date/time sheet | onTimeClick | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:173` | Plate pill | toggle Your Plate | setPlateOpen(!) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:193` | Show/Hide plate arrow | toggle plate | setPlateOpen(!) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:251` | Drag handle | drag to open/close plate | pointer delta ±40px → setPlateOpen | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:273` | Tabs (Scan/Search/AI/Quick Add/Library) | switch tab | onValueChange → onTabChange; trigger onClick closes plate | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:314` | Quick Add (submit) | add quick item | type=submit form=quick-add-form → QuickAddPanel onSubmit | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:322` | Log Foods (quick tab) | log plate | onLogPlate() | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:340` | Search input | search foods | onSearchChange | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:350` | Library filter input | filter | libraryFilter.onChange (recipes server-side, foods/favs client-side) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AddFoodDialog.tsx:360` | Log Foods (search/library) | log plate | onLogPlate() | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/MealTimePill.tsx:12` | Time pill | open date/time sheet | onClick | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/QuickAddPanel.tsx:130` | Quick Add form onSubmit | add to plate | validates → onAdd(...) + reset | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/QuickAddPanel.tsx:168` | Energy unit (kcal/kJ) | choose unit | setUnitOpen(true) → ChoiceSheet | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/QuickAddPanel.tsx:185` | Unit ChoiceSheet onSelect | convert unit | changeUnit | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:79` | See N More | full group list | setOpenGroup(name) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:117` | Back to results | back | setOpenGroup(null) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:185` | Search result row | open detail | onSelect → onPick(food) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:212` | Result row "+" (Multi-Add) | add default serving to plate without leaving search (doc :163-164, :255; settings food-log-settings.ts:43) | `onAdd={() => onPick(food)}` (line 333) → opens Food Detail, nothing added | state / UI only | CODE-ONLY | Fixed — (was BROKEN) |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:336` | History FoodTile + (Multi-Add) | add default serving to plate | `onAdd={() => onPick(food)}` (line 341) → opens detail | state / UI only | CODE-ONLY | Fixed — (was BROKEN) |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:347` | Load more (group full list) | load more results | onLoadMore → top += 25 | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:383` | FavoritesBar tile | add favorite to plate | quickAddFavorite → onAddToPlate | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodSearchPanel.tsx:416` | FoodList (History) Clear filters / Load more | clear / load | onSearchChange('') / onLoadMore | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FavoritesBar.tsx:20` | Favorite tile | add to plate | onQuickAdd(favorite) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:207` | Recipes/Foods/♥ switch | switch view | onViewChange | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:216` | Sort favorites | sort favorites | `onClick={() => toast('Sorting is coming soon')}` | state / UI only | CODE-ONLY | Question for user |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:225` | + Create food / recipe Link | create pages | `/foods/new` or `/recipes/new`, onClick closes sheet | `/foods/new`, `/recipes/new` | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:262` | Recipe tile (tap and +) | add recipe to plate | addRecipe(recipe) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:274` | Load more recipes | load more | onLoadMoreRecipes | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:297` | FoodList Clear filters / Load more | clear / load | onClearFilter / onLoadMoreFoods | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:307` | My food tile tap | open detail | onPickFood | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:312` | My food tile + | add default serving | addFood(food) → onAddToPlate | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/LibraryPanel.tsx:335` | Favorite tile (tap and +) | add to plate | addFavorite | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodTile.tsx:225` | Tile + button (MultiAdd) | quick add | onClick={onAdd}; disabled={!onAdd} | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodTile.tsx:255` | Tile main button (split) | select | onSelect | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodTile.tsx:265` | Tile button | select | onSelect | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/DayTimeline.tsx:90` | HourPill (hour with foods) | select hour's foods | onPress → onToggleHour / onStart | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/DayTimeline.tsx:105` | HourPill long-press (setting LongPress) | hold to add food at hour | only rendered when `onPress` undefined (line 88 `if (onPress) return <button onClick={onPress}>`); hours that have foods get onPress (line 319-324) so long-press-to-add is lost, and "+" is hidden when longPressToAdd (line 337) → no way to add at an hour that already has foods | state / UI only | CODE-ONLY | Fixed — (was BROKEN, setting-dependent) |
| `src/features/food-log/components/FoodLogPage/DayTimeline.tsx:328` | Paste at hour | paste selection | selection.onPaste(time) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/DayTimeline.tsx:338` | + Add at hour | open Add Food | onAddAt(time) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/DayTimeline.tsx:381` | Food tile long-press | start selection | 500ms hold → selection.onStart([id]); click suppressed after hold | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/DayTimeline.tsx:400` | Food tile tap | edit / toggle in selection | onSelectEntry / onToggleEntry | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/DayTimeline.tsx:139` | SelectCheck | toggle selection | onToggle | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/EntryEditDialog.tsx:195` | Time pill | change time | timeSheet.show → DateTimeSheet timeOnly → setTime | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/EntryEditDialog.tsx:203` | Done (header) | save entry | save(change.current) → onSave → PUT entry | `PUT entry` | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/EntryEditDialog.tsx:247` | FoodDetailView onBack (✕) | close | onOpenChange(false) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/EntryEditDialog.tsx:248` | FoodDetailView onAdd/onLogFoods | n/a in edit mode | `() => undefined` but QuantityBar variant='edit' only renders Done (→ edit.onDone) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/FoodDetailHeader.tsx:15` | Back / Close | back to results / close | onBack | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/DetailActions.tsx:33` | To Custom | Create Food prefilled | onCopyToCustom → router.push `/foods/new?from=` | `/foods/new?from=` | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/FoodDetailView.tsx:283` | canCopyToCustom flag | hide "To Custom" for user's own food (DetailActions.tsx:11 doc) | passed as constant `canCopyToCustom` (always true) → shown for own foods too | state / UI only | UNKNOWN | UNKNOWN — needs MF reference |
| `src/features/food-log/components/FoodLogPage/FoodDetail/DetailActions.tsx:41` | Favorite | toggle favorite preset | toggleFavorite → add/remove favorite; disabled for logged-only entries (EntryEditDialog passes isFavoritePending \ | state / UI only | CODE-ONLY | Open (\) — see Open items |
| `src/features/food-log/components/FoodLogPage/FoodDetail/DetailActions.tsx:60` | Remove (edit) | delete entry | edit.onRemove → onRequestDelete | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:172` | Done (edit variant) | save | onAdd → edit.onDone | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:183` | Log Foods | log immediately | onLogFoods → logFromDetail | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:193` | Add | add to plate | onAdd → onAddToPlate | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:229` | Amount/macro mode toggle | switch entry mode | toggleMode | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:242` | g/oz/serving unit chips | change unit | onUnitChange | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:262` | Serving chips | change serving | onSelectServing | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:281` | Macro key chips | pick macro to enter | onMacroKeyChange | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:311` | Amount field wrapper | focus input | amountInput.focus() | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/FoodDetail/QuantityBar.tsx:322` | Quantity / macro inputs | edit amount | onQuantityChange / onMacroTextChange | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlatePanel.tsx:89` | Empty plate "Add" | back to tabs | onAddFoods → setPlateOpen(false) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlatePanel.tsx:146` | Log Foods (plate) | log plate | onLog() | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlateItemRow.tsx:50` | Swipe to delete row | remove from plate | onRemove | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlateItemRow.tsx:71` | Amount button | edit amount | `disabled={disabled \ | state / UI only | CODE-ONLY | Open (\) — see Open items |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlateQuantityEditor.tsx:43` | Unit chips (g/oz/servings) | switch unit | onChange(switchUnit) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlateQuantityEditor.tsx:66` | Numeric keypad | type amount | type() | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlateQuantityEditor.tsx:76` | Log Foods | apply + log | onLog → onUpdate + onLog(items) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlateQuantityEditor.tsx:86` | Done | apply edit | onDone → finish → onUpdate | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/PlatePanel/PlateNutrition.tsx:114` | Plate/Day switch | switch nutrition view | setView | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/ScanPanel.tsx:81` | Barcode / Label switch | change scan mode | setMode; Label mode has no working action (see below) | state / UI only | CODE-ONLY | Question for user |
| `src/features/food-log/components/FoodLogPage/ScanPanel.tsx:90` | Enter barcode manually | manual sheet | onManual | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/ScanPanel.tsx:99` | Upload label photo | upload label | opens file picker; input onChange (line 163) → `comingSoon()` toast 'Label scanning is coming soon' | state / UI only | CODE-ONLY | Question for user |
| `src/features/food-log/components/FoodLogPage/ScanPanel.tsx:108` | Flash toggle | torch | toggleTorch; disabled when unsupported (hardware) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/ScanPanel.tsx:133` | Capture nutrition label | capture label | `onClick={comingSoon}` → toast | state / UI only | CODE-ONLY | Question for user |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:90` | Remove photo | remove | onRemove | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:178` | File input | add photos | addPhotos | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:217` | Snap/Describe switch | mode | setMode | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:246` | Capture | go to camera | setMode('snap') | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:255` | Upload photos | file picker | fileInput.click() | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:281` | Description textarea | describe meal | setDescription | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:290` | Analyze / Try again | AI analyze | onAnalyze → useAiPlate.analyze → POST foodLogs.aiAnalyze | `POST foodLogs.aiAnalyze` | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:354` | Upload (camera view) | file picker | fileInput.click() | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:363` | Flash toggle | torch | toggleTorch | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPanel.tsx:380` | Take photo | capture frame | capture() → canvas → addPhotos | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:90` | Ingredient amount button | amount sheet | onEdit → amountSheet.show(ingredient) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:156` | Remove ingredient | remove | onRemove → onRemoveIngredient | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:200` | Retry / Search (unmatched ingredient) | retry resolve / search replacement | onRetry (POST aiResolveIngredient) / searchSheet.show | `POST aiResolveIngredient` | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:207` | Remove (unmatched) | remove | onRemove | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:300` | Dish amount button | scale dish | onEditDish → amountSheet dish | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:305` | Expand/Collapse Ingredients | toggle | setOpen(!open) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:501` | Start over | reset AI | onStartOver → aiPlate.reset | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:547` | Log Foods | log AI result | logFoods → onLog(items, confirmations) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:566` | AmountSheet onSave | set grams / dish scale | onSetDishScale / onSetGrams | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AiPlateView.tsx:595` | IngredientSearchSheet onSelect | replace ingredient | onReplaceIngredient | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AmountSheet.tsx:76` | Amount form submit | save | onSave(grams,{unit,amount}) + close | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AmountSheet.tsx:101` | Unit chips | change unit | changeUnit | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/AmountSheet.tsx:132` | Cancel | close | onOpenChange(false) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/IngredientSearchSheet.tsx:75` | Search input | search | setSearch | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/IngredientSearchSheet.tsx:94` | Result tile | replace ingredient | onSelect(resolvedFrom) + close | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogPage/IngredientSearchSheet.tsx:94` | Result tile "+" (when Logger highlight = MultiAdd) | add | FoodTile gets onSelect but no onAdd → split layout renders `plusButton` with `disabled={!onAdd}` (FoodTile.tsx:229) — visible dead + | state / UI only | CODE-ONLY | Fixed — (was DEAD, setting-dependent) |
| `src/features/food-log/components/FoodLogSettingsPage/SettingsSection.tsx:51` | SettingRow (href) | open subpage | Link href | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogSettingsPage/SettingsSection.tsx:58` | SettingRow (onEdit/onOpen) | open sheet / subpage | onClick={onEdit ?? onOpen} | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogSettingsPage/OptionList.tsx:22` | Radio option | choose | onChange(value) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogSettingsPage/CheckList.tsx:25` | Checkbox row | toggle | onToggle | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogSettingsPage/ToggleList.tsx:27` | Switch | toggle | onCheckedChange → onToggle | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogSettingsPage/SettingSheets.tsx:77` | Hour range handles (drag + arrow keys) | set range | pointer drag / keydown → move | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogSettingsPage/SettingSheets.tsx:103` | Save hour range | save | onSave(range) + close → update() → PUT foodLogs.settings | `PUT foodLogs.settings` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:90` | SubPageHeader back | back | router.back() (SubPageHeader default) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:94` | Nutrient Reporting options | overages mode | choose('overages') → PUT settings; consumed by FoodLogPage showOverages | `PUT settings` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:103` | Hour Range Edit | edit range | sheet.show('hourRange') · **Clicked:** 390: Hour Range sheet opens, X closes without saving | state / UI only | CLICKED-PASS | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:108` | Timeline rows Edit (Alignment, Add Foods to Hour, Timestamps, Hourly Totals, Week Banner, Calendar Scrolling) | change setting | sheet.show(key) → ChoiceSheet → PUT settings; all consumed in FoodLogPage/DayTimeline/FoodLogHeader | `PUT settings` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:108` | Timeline row Edit: Premove (`premoveEnabled`) | change behaviour | saved via PUT settings but no FE consumer (`premoveEnabled` only referenced in FoodLogSettingsPage + food-log-settings.ts) | `PUT settings` | UNKNOWN | UNKNOWN — needs MF reference |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:119` | Branded / Open Food Facts Results Edit | filter search sources | saved; FE only invalidates ['foods'] (use-food-log-settings.ts:38-41); filter assumed server-side | state / UI only | UNKNOWN | UNKNOWN — needs MF reference |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:130` | Timeline Food Tiles | subpage | href `/food-log/settings/timeline-tiles` (exists) | `/food-log/settings/timeline-tiles` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:135` | Logger Food Tiles | subpage | href `/food-log/settings/logger-tiles` (exists) | `/food-log/settings/logger-tiles` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:143` | Logger Banner | subpage | href `/food-log/settings/logger-banner` (exists) | `/food-log/settings/logger-banner` | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:149` | Time Selection (chevron row) | subpage | `onOpen={comingSoon}` → toast 'This setting is coming soon' | state / UI only | CODE-ONLY | Question for user |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:149` | Favorite Measurements (chevron row) | subpage | `onOpen={comingSoon}` → toast | state / UI only | CODE-ONLY | Question for user |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:151` | Optimization Edit | change optimization | saved via PUT settings; no FE consumer of `optimization` | `PUT settings` | UNKNOWN | UNKNOWN — needs MF reference |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:161` | foodiconpack.com / CC BY 4.0 / Noto Emoji links | external attribution | `<a target=_blank>` | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/FoodLogSettingsPage.tsx:200` | ChoiceSheet onSelect | apply choice | choose(editing, value) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/hooks/use-food-log-settings.ts:33` | All settings writes (update) | persist + feedback | optimistic set; onError only `logger.error` + rollback, no toast → toggle silently snaps back | state / UI only | CODE-ONLY | Open (BROKEN (silent failure)) — see Open items |
| `src/features/food-log/pages/LoggerBannerPage.tsx:32` | SubPageHeader back | back | router.back() | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/LoggerBannerPage.tsx:41` | Banner nutrient toggles | show/hide nutrient | update({[key]:checked}) → PUT settings; consumed by AddFoodDialog banner | `PUT settings` | CODE-ONLY | - |
| `src/features/food-log/pages/LoggerBannerPage.tsx:51` | Banner display option | display mode | update({loggerBannerDisplay}) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/LoggerFoodTilesPage.tsx:42` | Tile density / display info / highlight | logger tile opts | change → update(logger*) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/TimelineFoodTilesPage.tsx:42` | Tile density / display info / highlight | timeline tile opts | change → update(timeline*) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/FoodLogSettingsPage/TileOptionSections.tsx:31` | Density/Display/Highlight lists | change | onChange(patch) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/NutritionOverviewPage.tsx:33` | ErrorState Retry | refetch | data.refetch() → GET nutrition.overview | `GET nutrition.overview` | CODE-ONLY | - |
| `src/features/food-log/pages/NutritionOverviewPage.tsx:39` | SubPageHeader back | back | router.back() · **Clicked:** 390: Back → /food-log | state / UI only | CLICKED-PASS | - |
| `src/features/food-log/pages/NutritionOverviewPage.tsx:41` | RangeTabs | change range | setRange → refetch overview · **Clicked:** 390: Today → 1 Week switches cards | state / UI only | CLICKED-PASS | - |
| `src/features/food-log/pages/NutritionOverviewPage.tsx:70` | Contributors switch | show top contributors | setContributorsOn → NutrientCard contributors | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/NutritionOverviewPage/RangeTabs.tsx:22` | Range tab button | select range | onChange(range) · **Clicked:** 390: 1 Week tab selected, cards reload | state / UI only | CLICKED-PASS | - |
| `src/features/food-log/components/NutritionOverviewPage/NutrientCard.tsx:116` | Tile ChevronRight (each nutrient card) | open nutrient detail (`/dashboard/nutrition/[key]` exists) | chevron inside plain `<li>`; no Link/onClick | state / UI only | CODE-ONLY | Open (DEAD) — see Open items |
| `src/features/food-log/components/NutritionOverviewPage/NutrientCard.tsx:78` | "Top 3 Contributors" row with ChevronRight | open contributors/summary (`/dashboard/nutrition/[key]/summary` exists) | static `<p>` + chevron, no handler | state / UI only | CODE-ONLY | Open (DEAD) — see Open items |
| `src/features/food-log/pages/CreateFoodPage.tsx:91` | SubPageHeader back | back | router.back() | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/CreateFoodPage.tsx:39` | Edit Icon | icon sheet | iconSheet.show → ChooseIconSheet → patch iconKey | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/CreateFoodPage.tsx:56` | Create | create food | form.submit(false) → useCreateFood (foodService.create) → router.back() | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/CreateFoodPage.tsx:57` | Create & Add | create + log | createFood then addEntry (POST foodLogs.entries, today, grams) → push `/food-log` | `POST foodLogs.entries`, `/food-log` | CODE-ONLY | - |
| `src/features/food-log/pages/CreateFoodPage.tsx:85` | `?from=` / `?name&calories&protein&carbs&fat` prefill | prefill | read by app/(protected)/foods/new/page.tsx and passed as fromFoodId/seed; if `from` fetch errors, form silently blank | `/foods/new/page.tsx` | CODE-ONLY | - |
| `src/features/food-log/components/CreateFoodPage/FormFooter.tsx:16` | Create | create | onCreate | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/CreateFoodPage/FormFooter.tsx:26` | Create & Add | create+add | onCreateAndAdd | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/CreateFoodPage/GeneralSection.tsx:58` | Edit Icon | open icon sheet | onEditIcon | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/CreateFoodPage/GeneralSection.tsx:78` | Name / Brand inputs | edit | onChange patch | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/CreateFoodPage/GeneralSection.tsx:100` | Scan barcode | camera scan | setSheet('scan') → ScanPanel → setCode (sets barcode + closes) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/CreateFoodPage/GeneralSection.tsx:110` | Remove barcode | clear | onChange({barcode:''}) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/CreateFoodPage/GeneralSection.tsx:119` | Enter barcode manually | manual sheet | setSheet('manual') → BarcodeSheet onLookup=setCode | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/CreateFoodPage/GeneralSection.tsx:139` | ScanPanel inside Create Food (Label mode/upload/capture) | - | same ScanPanel → Label mode actions toast 'coming soon' | state / UI only | CODE-ONLY | Question for user |
| `src/features/food-log/components/CreateFoodPage/ServingSection.tsx:33` | Per serving / per 100g switch | basis | onBasisChange | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/CreateFoodPage/ServingSection.tsx:53` | Weight / unit / serving qty / serving name | edit | onChange patch | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/CreateFoodPage/NutritionSection.tsx:54` | Nutrient unit picker | change unit | onUnit → setUnit (converts) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/CreateFoodPage/NutritionSection.tsx:72` | Nutrient value input | edit | onValue | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/CreateFoodPage/NutritionSection.tsx:101` | Table layout switch | mode | onModeChange | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:253` | SubPageHeader back | step2→step1 else router.back() | onBack override on step 2 | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:311` | Next (step 1 submit) | validate → step 2 | next() (zod STEP_ONE) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:354` | Create & Add | create + log | createAndLog.mutate → POST recipes.createAndLog → push `/food-log` | `POST recipes.createAndLog`, `/food-log` | CODE-ONLY | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:355` | Create | create recipe | createRecipe.mutate → POST recipes.root → push `/food-log` | `POST recipes.root`, `/food-log` | CODE-ONLY | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:364` | IngredientEditorBar (line) | edit qty/unit | patch line / setEditingKey(null) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:386` | IngredientEditorBar (field) | edit servings/weight/prep/cook | setFieldValue / setField(null) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:396` | IngredientPickerSheet onSelect | add ingredient | addFood(food) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:410` | ChooseIconSheet onSelect | set icon | setIconKey | state / UI only | CODE-ONLY | - |
| `src/features/food-log/pages/RecipeCreatePage.tsx:420` | StepSheet onSave | add/edit step | setSteps | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipeForm.tsx:74` | form onSubmit | Next | onNext | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipeForm.tsx:99` | Recipe name input | edit | onNameChange | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipeForm.tsx:104` | Serving Quantity / Total Weight KeypadField | open keypad | onFieldPress | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipeForm.tsx:134` | Add ingredient (+) | picker | onAddIngredient → picker.show | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipeForm.tsx:168` | Next | submit | type=submit | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipeIngredientRow.tsx:43` | Swipe delete ingredient | remove | onRemove | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipeIngredientRow.tsx:68` | Amount button | edit amount | onEdit (disabled until detail loads) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/IngredientEditorBar.tsx:62` | Unit chips | change unit | onUnit | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/IngredientEditorBar.tsx:79` | Keypad | type | onText | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/IngredientEditorBar.tsx:82` | Done | close editor | onDone | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/KeypadField.tsx:37` | Keypad field button | open keypad | onPress(button) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/IngredientPickerSheet.tsx:51` | Search input | search | setSearch | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/IngredientPickerSheet.tsx:68` | Result tile | add ingredient | onSelect(food) + close | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/IngredientPickerSheet.tsx:68` | Result tile "+" (Logger highlight = MultiAdd) | add | FoodTile has onSelect, no onAdd → disabled + rendered (FoodTile.tsx:229) | state / UI only | CODE-ONLY | Fixed — (was DEAD, setting-dependent) |
| `src/features/food-log/components/RecipeCreatePage/RecipeNutrition.tsx:62` | Serving/Recipe switch | view | setView | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:146` | Reorder step handle | drag reorder | dnd-kit listeners → onDragEnd → onReorderSteps | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:157` | Swipe delete step | remove | onRemove | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:158` | Step row | edit step | onEdit → stepSheet.show({id}) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:252` | Edit Icon | icon sheet | onEditIcon | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:263` | Prep / Cook time fields | keypad | onFieldPress | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:294` | Link / Description inputs | edit | onLinkChange / onDescriptionChange | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:328` | Add step (+) | step sheet | onAddStep (disabled at 50) | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:367` | Create & Add | create+log | onCreateAndAdd | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/RecipePreparation.tsx:378` | Create | create | onCreate | state / UI only | CODE-ONLY | - |
| `src/features/food-log/components/RecipeCreatePage/StepSheet.tsx:31` | Step form submit / Save | save step | onSave(text) | state / UI only | CODE-ONLY | - |
| `src/features/foods/pages/FoodsPage.tsx:133` | ErrorState Retry | refetch | foods.refetch() | state / UI only | CODE-ONLY | - |
| `src/features/foods/pages/FoodsPage.tsx:140` | Create food (header) | open create dialog | openCreate → CustomFoodDialog | state / UI only | CODE-ONLY | - |
| `src/features/foods/pages/FoodsPage.tsx:146` | Search input | search | setSearch + reset top | state / UI only | CODE-ONLY | - |
| `src/features/foods/pages/FoodsPage.tsx:156` | Scope ToggleGroup | filter scope | setScope | state / UI only | CODE-ONLY | - |
| `src/features/foods/pages/FoodsPage.tsx:187` | Clear filters | reset | clearFilters | state / UI only | CODE-ONLY | - |
| `src/features/foods/pages/FoodsPage.tsx:189` | Create food (empty state) | open create dialog | openCreate | state / UI only | CODE-ONLY | - |
| `src/features/foods/pages/FoodsPage.tsx:193` | Food row (FoodRow, chevron inside button) | open detail | setSelectedId → FoodDetailDialog (GET food) | `GET food` | CODE-ONLY | - |
| `src/features/foods/pages/FoodsPage.tsx:194` | Load more | load more | top += 25 | state / UI only | CODE-ONLY | - |
| `src/features/foods/pages/FoodsPage.tsx:213` | CustomFoodDialog submit | create/update food | createFood.mutate / updateFood.mutate (foodService.create/update); errors inline | state / UI only | CODE-ONLY | - |
| `src/features/foods/pages/FoodsPage.tsx:227` | Delete food confirm | delete food | `deleteFood.mutate(id,{onSuccess})`; no onError, ConfirmDialog has no error prop, useFoodMutation onError only logs (use-foods.ts:105-108, comment says error shown inline but nothing renders deleteFood.error) | state / UI only | CODE-ONLY | Open (BROKEN (silent failure)) — see Open items |
| `src/features/foods/components/FoodsPage/FoodDetailDialog.tsx:101` | Delete | open confirm | onRequestDelete(food) | state / UI only | CODE-ONLY | - |
| `src/features/foods/components/FoodsPage/FoodDetailDialog.tsx:104` | Edit | open edit dialog | onEdit(food) | state / UI only | CODE-ONLY | - |
| `src/features/foods/components/FoodsPage/CustomFoodDialog.tsx:80` | form submit | save | handleSubmit(submit) → onSubmit | state / UI only | CODE-ONLY | - |
| `src/features/foods/components/FoodsPage/CustomFoodDialog.tsx:97` | Icon picker | choose icon | iconSheet.show → onSelect=onChange | state / UI only | CODE-ONLY | - |
| `src/features/foods/components/FoodsPage/CustomFoodDialog.tsx:145` | Category select | choose category | onValueChange=onChange | state / UI only | CODE-ONLY | - |
| `src/features/foods/components/FoodsPage/CustomFoodDialog.tsx:178` | Cancel | close | onOpenChange(false) | state / UI only | CODE-ONLY | - |
| `src/features/foods/components/FoodsPage/CustomFoodDialog.tsx:186` | Save | submit | type=submit | state / UI only | CODE-ONLY | - |
| `src/features/foods/components/FoodList.tsx:53` | Clear filters | clear | onClearFilters | state / UI only | CODE-ONLY | - |
| `src/features/foods/components/FoodList.tsx:84` | Load more | load more | onLoadMore | state / UI only | CODE-ONLY | - |
| `src/features/foods/components/FoodRow.tsx:20` | Row button (chevron inside) | select | onSelect(food) | state / UI only | CODE-ONLY | - |
| `src/features/foods/components/FoodRow.tsx:56` | + quick add | quick add | onQuickAdd(food) | state / UI only | CODE-ONLY | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:56` | + Add nutrition data | open sheet for today | open() | state / UI only | CODE-ONLY | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:53` | SubPageHeader back | back | router.back() | state / UI only | CODE-ONLY | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:71` | ErrorState Retry | refetch | query.refetch() | state / UI only | CODE-ONLY | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:118` | Edit (pencil) per day | edit day | open(day.date) | state / UI only | CODE-ONLY | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:142` | Sheet onDateChange | switch day | setTarget date (sheet remounts via key) | state / UI only | CODE-ONLY | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:144` | Sheet onDelete | confirm delete | confirm.show | state / UI only | CODE-ONLY | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:150` | Sheet onSave | save day | save.mutate → PUT nutritionData.root | `PUT nutritionData.root` | CODE-ONLY | - |
| `src/features/nutrition-data/pages/NutritionDataPage.tsx:163` | Delete confirm | delete day | remove.mutate → DELETE nutritionData.root?date; error toast | `DELETE nutritionData.root?date` | CODE-ONLY | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:198` | Title click | pick date | onTitleClick → SelectDateSheet → onDateChange | state / UI only | CODE-ONLY | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:212` | Trash | delete | onDelete | state / UI only | CODE-ONLY | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:225` | form submit / Save | save | submit() validates → onSave | state / UI only | CODE-ONLY | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:244` | Open Food Log | go to that day's log | `openFoodLogDate(date)` + href `/food-log`; FoodLogPage reads ui.store foodLogDate (FoodLogPage.tsx:262-271) | `/food-log` | CODE-ONLY | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:280` | Calories/Protein/Fat/Carbs inputs | edit | set(key) (readOnly when locked, with explanatory note) | state / UI only | CODE-ONLY | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:323` | Fasting switch | toggle | setFasting (disabled when locked, note explains) | state / UI only | CODE-ONLY | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:333` | Incomplete switch | toggle | setIncomplete | state / UI only | CODE-ONLY | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:351` | Numeric keypad (coarse pointer) | type | set(active) | state / UI only | CODE-ONLY | - |
| `src/features/nutrition-data/components/NutritionDaySheet.tsx:360` | SelectDateSheet onSelect | change date | onDateChange | state / UI only | CODE-ONLY | - |

### C. Program / onboarding / auth / users

| Source (file:line) | Button/Action | Expected | Actual | Route / API target | Test status | Fix status |
|---|---|---|---|---|---|---|
| `src/app/(protected)/program/new/page.tsx:6` | redirect /program/new | go to first wizard step | redirect(stepHref('style')) → /program/new/style (valid) | `/program/new/style` | CODE-ONLY | - |
| `src/app/(protected)/program/new/[step]/page.tsx:14` | [step] guard | accept only wizard steps | isWizardStep(WIZARD_STEPS: style,diet,floor,training,distribute,protein,editor,same-different,manual-targets,review) else notFound() | state / UI only | CODE-ONLY | - |
| `src/app/(protected)/program/goal/edit/page.tsx:6` | redirect /program/goal/edit | open first goal-edit step | redirect('/program/goal/edit/params') (valid) | `/program/goal/edit/params` | CODE-ONLY | - |
| `src/app/(protected)/program/goal/edit/[step]/page.tsx:9` | [step] guard | accept params/review | step !== params && !== review → notFound() | state / UI only | CODE-ONLY | - |
| `src/app/(protected)/program/check-in/[module]/page.tsx:14` | [module] guard | accept known modules | isModuleKey (intro, partial-logging, program-update) else notFound() | state / UI only | CODE-ONLY | - |
| `src/app/(onboarding)/layout.tsx:6` | AuthGuard wrapper | require login for /onboarding | AuthGuard → /login?redirect=/onboarding | `/login?redirect=/onboarding` | CODE-ONLY | - |
| `src/features/program/pages/ProgramPage.tsx:57` | ErrorState Retry | refetch program | program.refetch() | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/ProgramPage.tsx:80` | "Create program" (empty state) | open New Program wizard | Link /program/new → redirect /program/new/style · **Clicked:** E2E: Create program → wizard → POST /programs 200, lands on /program (after P6 fix) | `/program/new`, `/program/new/style` | CLICKED-PASS | - |
| `src/features/program/pages/ProgramPage.tsx:92` | "More" (⋮) button | open Strategy menu sheet | openSheet('menu') → ProgramActions SheetFrame · **Clicked:** 390: ⋮ opens Strategy sheet | state / UI only | CLICKED-PASS | - |
| `src/features/program/pages/ProgramPage.tsx:141` | ProgramCard onEdit | open Edit Program sheet | openSheet('program') | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/ProgramPage.tsx:109` | Empty state after End program | user can create new program right after ending | BE onboarding IsRequired = !hasProgram; OnboardingGuard redirects to /onboarding once ['onboarding','state'] refetches (stale 60s / focus) | `/onboarding` | CODE-ONLY | Open (BROKEN) — see Open items |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:366` | "Change program style" row | open style sheet | show('style') (session++) · **Clicked:** 390: opens Program style sheet, Cancel closes | state / UI only | CLICKED-PASS | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:371` | "Set TDEE manually" row | open TDEE sheet | show('tdee') · **Clicked:** 390: opens Manual TDEE sheet | state / UI only | CLICKED-PASS | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:376` | "End program" row | open confirm | show('end') → ConfirmDialog · **Clicked:** 390: opens End program confirm | state / UI only | CLICKED-PASS | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:360` | Menu sheet onOpenChange | close menu | onChange('menu') → close() · **Clicked:** 390: menu sheet opens / closes | state / UI only | CLICKED-PASS | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:385` | Edit Program sheet onOpenChange | close unless pending | onChange('program', programEdit) · **Clicked:** 390: Edit Program sheet opens, Cancel closes | state / UI only | CLICKED-PASS | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:169` | Edit Program form onSubmit | save diet/protein/floor | onSaveProgram → useUpdateProgramGoal → PUT apiRoutes.programs.goal, close on success · **Clicked:** E2E: Low fat → PUT 200, targets 2014/139/45/264 | `PUT apiRoutes.programs.goal` | CLICKED-PASS | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:191` | Diet style ChoiceGroup | pick diet | setDietStyle | state / UI only | CODE-ONLY | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:200` | Protein level ChoiceGroup | pick protein | setProteinLevel | state / UI only | CODE-ONLY | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:212` | Calorie floor input | edit floor | setFloor, validated 800-3000 | state / UI only | CODE-ONLY | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:71` | "Use a N% shift" (feasibility) | resubmit with reduced shift | submit(reduceShiftRequestOf) → PUT programs.goal | `PUT programs.goal` | CODE-ONLY | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:80` | "Use an even split" | resubmit Even | submit({calorieShiftMode:'Even'}) | state / UI only | CODE-ONLY | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:125` | Footer Save (submit) | submit sheet form | type=submit, disabled while pending/invalid | state / UI only | CODE-ONLY | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:138` | Footer Cancel | close sheet | onCancel → close() · **Clicked:** 390: Cancel closes Edit Program | state / UI only | CLICKED-PASS | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:400` | Style sheet onOpenChange | close | onChange('style', style) · **Clicked:** 390: style sheet opens / Cancel | state / UI only | CLICKED-PASS | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:239` | Style form onSubmit | change style | onChangeStyle → PUT apiRoutes.programs.style | `PUT apiRoutes.programs.style` | CODE-ONLY | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:252` | Style ChoiceGroup | pick style | setStyle | state / UI only | CODE-ONLY | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:415` | TDEE sheet onOpenChange | close | onChange('tdee', tdee) · **Clicked:** 390: TDEE sheet opens / Cancel | state / UI only | CLICKED-PASS | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:281` | TDEE form onSubmit | set manual TDEE | onSetManualTdee → PUT apiRoutes.programs.expenditure · **Clicked:** 390: Save (prefilled 2419) → PUT 200, sheet closes | `PUT apiRoutes.programs.expenditure` | CLICKED-PASS | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:309` | TDEE input | type value | setTyped · **Clicked:** 390: empty → "Enter a whole number from 1000 to 6000 kcal.", no submit | state / UI only | CLICKED-PASS | - |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:436` | ConfirmDialog "End program" | end program, show failure | onEnd → DELETE programs/current; on error nothing shown: `end.error` never rendered (ConfirmDialog has no error prop) and useProgramMutation onError only logs — FIXED by MOS-FE (ConfirmDialog `error` prop, End-program error inline, verified E2E with a forced failure) · **Clicked:** 390: dialog opens, focus on Cancel, Cancel keeps program; E2E: confirm → DELETE 200 | `DELETE programs/current` | CLICKED-PASS | Open (BROKEN) — see Open items |
| `src/features/program/components/ProgramPage/ProgramActions.tsx:430` | ConfirmDialog onOpenChange | close | onChange('end') | state / UI only | CODE-ONLY | - |
| `src/features/program/components/ProgramPage/ProgramCard.tsx:51` | "New Program" chip | open wizard | Link /program/new | `/program/new` | CODE-ONLY | - |
| `src/features/program/components/ProgramPage/ProgramCard.tsx:52` | "Edit Program" chip | open Edit Program sheet | onClick=onEdit | state / UI only | CODE-ONLY | - |
| `src/features/program/components/ProgramPage/GoalCard.tsx:76` | "New Goal" chip | start a new goal flow | Link routePath.programNew (/program/new) — same target as New Program; wizard has no goal step, goal comes from current program | `/program/new` | CODE-ONLY | Open (BROKEN) — see Open items |
| `src/features/program/components/ProgramPage/GoalCard.tsx:77` | "Edit Goal" chip | open goal edit | Link /program/goal/edit → redirect /params | `/program/goal/edit` | CODE-ONLY | - |
| `src/features/program/components/ProgramPage/ActionChip.tsx:25` | ActionChip (Link/button) | link or button | href → Link, else button onClick | state / UI only | CODE-ONLY | - |
| `src/features/program/components/ProgramPage/WeekMacroChart.tsx:124` | Day letter buttons | select day | onSelect(index) (only when onSelect passed) | state / UI only | CODE-ONLY | - |
| `src/features/program/components/CheckInPage/CheckInButton.tsx:11` | "CHECK IN" | open check-in hub | Link /program/check-in | `/program/check-in` | CODE-ONLY | - |
| `src/features/program/components/FeasibilityNotice.tsx:98` | Apply buttons | apply BE suggestion | button.onClick from caller | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/CalorieShiftAlert.tsx:116` | "Pick a fix" buttons | apply shift fix | onApply(fix) + focusWizardContent | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/WizardShell.tsx:78` | Back (chevron) | go back | onBack prop | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/WizardShell.tsx:129` | Primary Next button | advance | onNext unless pending | state / UI only | CODE-ONLY | - |
| `src/features/program/hooks/use-wizard-nav.ts:159` | wizard next() | next step in flow | push stepHref(steps[index+1]) | state / UI only | CODE-ONLY | - |
| `src/features/program/hooks/use-wizard-nav.ts:163` | wizard back() first step | leave wizard cleanly | index 0 → wizard reset() + push /program; goal-edit pendingGoal NOT cleared, so next "New Program" shows "Your new goal is set" and creates program with the abandoned goal (wizardGoalOf prefers pending) | `/program` | CODE-ONLY | Open (BROKEN) — see Open items |
| `src/features/program/hooks/use-wizard-nav.ts:138` | Deep-link/reload guard | send to first unanswered step | firstUnansweredBefore returns null when step not in stepsFor(programType) (new-program-steps.ts:82 `index <= 0`), so /program/new/editor, /same-different, /manual-targets with empty store render; index falls back to 0 so Next goes to 'diet', Back exits | `/program/new/editor` | CODE-ONLY | Fixed — (was BROKEN) |
| `src/features/program/hooks/use-wizard-nav.ts:169` | close() | close wizard | defined but no caller | state / UI only | CODE-ONLY | Open (DEAD) — see Open items |
| `src/features/program/pages/NewProgramStepPage.tsx:185` | "Try again" (setup) | refetch setup | setup.refetch() | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:236` | Style option | choose type | setPref('programType') | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:239` | Style Next | prefill from pending goal, next | setPref diet/protein if pendingGoal, nav.next | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:249` | Diet option | choose diet | setPref('dietStyle') | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:253` | Floor option | choose floor | setPref('floor') | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:260` | Training option | choose training | setPref('trainingType') | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:269` | Distribution mode/days/percent | set distribution | setPref distribution/shiftDays/shiftPercent | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:279` | Distribute Next | persist shown mode, next | setPref if differs, nav.next | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:286` | Protein option | choose protein | setPref('proteinLevel') | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:310` | Editor onChange | edit day | wizard.updateDay | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:311` | Editor Reset All Days | restore unlocked days | setDays from baseDays | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:317` | Editor Try again | rerun preview | preview.reset() → effect reruns POST programs/preview | `POST programs/preview` | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:116` | applyShiftFix | apply BE fix | setPref + reset preview/create + toast | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:330` | Same/different option | choose mode | setPref('manualMode') | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:332` | Same/different Next | seed manual days once | always setManualDays(base) → coming Back then Next wipes all edits made on manual-targets | state / UI only | CODE-ONLY | Open (BROKEN) — see Open items |
| `src/features/program/pages/NewProgramStepPage.tsx:353` | Manual targets onChange | edit day | setManualDays patch | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:404` | Review "Try again" | rerun preview | preview.reset() | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:433` | Review reached end | unlock Done | markReviewed | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:444` | Review "Done" | create program | createProgram → POST programs; success: reset wizard, clear pendingGoal, push /program | `POST programs`, `/program` | CODE-ONLY | - |
| `src/features/program/pages/NewProgramStepPage.tsx:472` | WizardShell onBack | previous step / exit | nav.back | state / UI only | CODE-ONLY | - |
| `src/features/program/components/NewProgramPage/EditorStep.tsx:69` | "Try again" | retry preview | onRetry | state / UI only | CODE-ONLY | - |
| `src/features/program/components/NewProgramPage/EditorStep.tsx:93` | "Reset All Days" | reset | onResetAll | state / UI only | CODE-ONLY | - |
| `src/features/program/components/NewProgramPage/EditorStep.tsx:101` | Lock/unlock day | toggle lock | onChange(selected,{locked}) | state / UI only | CODE-ONLY | - |
| `src/features/program/components/NewProgramPage/EditorStep.tsx:126` | Calorie NumberField | set kcal | clamp 0..kcalMax, cap protein | state / UI only | CODE-ONLY | - |
| `src/features/program/components/NewProgramPage/EditorStep.tsx:145` | Protein RangeField | set g/kg | onChange | state / UI only | CODE-ONLY | - |
| `src/features/program/components/NewProgramPage/EditorStep.tsx:159` | Carb:Fat RangeField | set ratio | onChange(percent/100) | state / UI only | CODE-ONLY | - |
| `src/features/program/components/NewProgramPage/ManualTargetsStep.tsx:77` | Day selector (different mode) | select day | onSelect | state / UI only | CODE-ONLY | - |
| `src/features/program/components/NewProgramPage/ManualTargetsStep.tsx:90` | Calories field | set kcal | onChange(index,{kcal}) | state / UI only | CODE-ONLY | - |
| `src/features/program/components/NewProgramPage/ManualTargetsStep.tsx:96` | Protein/Carbs/Fat fields | set grams | onChange | state / UI only | CODE-ONLY | - |
| `src/features/program/components/NewProgramPage/NumberField.tsx:37` | number input | emit valid numbers | onChange on finite value, draft kept | state / UI only | CODE-ONLY | - |
| `src/features/program/components/NewProgramPage/RangeField.tsx:54` | number input + Slider:72 | set value | clamped onChange | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/DistributionStep.tsx:53` | Distribution OptionCard | pick mode | onModeChange | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/DistributionStep.tsx:62` | Days ToggleGroup | pick days | onDaysChange | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/DistributionStep.tsx:93` | Percent Slider | set % | onPercentChange | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/OptionCard.tsx:42` | OptionCard radio | select option | onSelect | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/OptionCard.tsx:118` | UnitToggle | switch unit | onValueChange(next && onChange) | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/GoalEditStepPage.tsx:105` | Back | params→/program (reset); review→/params | leave() / push /program/goal/edit/params | `/program/goal/edit/params` | CODE-ONLY | - |
| `src/features/program/pages/GoalEditStepPage.tsx:117` | Next (params) | go to review | push /program/goal/edit/review · **Clicked:** E2E: Next → /program/goal/edit/review | `/program/goal/edit/review` | CLICKED-PASS | - |
| `src/features/program/pages/GoalEditStepPage.tsx:118` | Done / "Set new program" (review) | save or switch to wizard | requiresNewProgram → setPendingGoal + push /program/new; else PUT apiRoutes.goals.edit → leave() · **Clicked:** E2E: Done → PUT /goals/edit 200; "Set new program" → wizard with pending goal | `PUT apiRoutes.goals.edit`, `/program/new` | CLICKED-PASS | - |
| `src/features/program/pages/GoalEditStepPage.tsx:132` | "Try again" | refetch preview | query.refetch() | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/GoalEditStepPage.tsx:148` | GoalTargetStep onTargetChange | set target | edit.setTarget → debounced POST goals/edit-preview · **Clicked:** E2E: slider → preview POST, budget / date update | `POST goals/edit-preview` | CLICKED-PASS | - |
| `src/features/program/pages/GoalEditStepPage.tsx:150` | GoalTargetStep onRateChange | set rate | edit.setRate clamped to fastMaxPercent | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/GoalTargetStep.tsx:106` | RulerSlider target | set goal weight | onTargetChange(revert) | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/GoalTargetStep.tsx:141` | Rate Slider | set rate 0.1-1 | onRateChange | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/GoalTargetStep.tsx:164` | Rate % input | set rate | accepts 0.1..1.5 while slider MAX_RATE=1 (slider clamps display); controlled value rejects intermediate text (empty / "0.") so retyping snaps back | state / UI only | CODE-ONLY | Open (BROKEN) — see Open items |
| `src/features/onboarding/components/OnboardingPage/RulerSlider.tsx:122` | Ruler scroll + keys (:123) | set value | onScroll/onKeyDown → onChange | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/CheckInHubPage.tsx:33` | Back | exit to Strategy | exit() → push /program | `/program` | CODE-ONLY | - |
| `src/features/program/pages/CheckInHubPage.tsx:52` | "Try again" | refetch session | session.refetch() | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/CheckInHubPage.tsx:68` | onOpen module | open module page | push /program/check-in/<key>; keys pre-filtered by visibleModules→isModuleKey | `/program/check-in/` | CODE-ONLY | - |
| `src/features/program/pages/CheckInHubPage.tsx:72` | onSkip | skip module | progress.markDone (sessionStorage only) | state / UI only | CODE-ONLY | - |
| `src/features/program/components/CheckInPage/CheckInHub.tsx:33` | "Back to Strategy" | exit | onExit | state / UI only | CODE-ONLY | - |
| `src/features/program/components/CheckInPage/CheckInHub.tsx:86` | "Go to <module>" | open module | onOpen(module.key) | state / UI only | CODE-ONLY | - |
| `src/features/program/components/CheckInPage/CheckInHub.tsx:94` | "Skip Module" | skip | onSkip(key) | state / UI only | CODE-ONLY | - |
| `src/features/program/components/CheckInPage/CheckInHub.tsx:40` | Hub with every visible module completed | some CTA to finish | current = -1 → no button rendered (only Back) | state / UI only | UNKNOWN | UNKNOWN — needs MF reference |
| `src/features/program/pages/CheckInModulePage.tsx:43` | Not-due redirect | send to hub | router.replace /program/check-in | `/program/check-in` | CODE-ONLY | - |
| `src/features/program/pages/CheckInModulePage.tsx:57` | Back (loading shell) | hub | backToHub | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/CheckInModulePage.tsx:76` | "Try again" | refetch session | session.refetch() | state / UI only | CODE-ONLY | - |
| `src/features/program/pages/CheckInModulePage.tsx:108` | Intro finish | save introSeen, back to hub | PUT check-ins/modules {introSeen} (fire-and-forget) + markDone + hub | `PUT check-ins/modules` | CODE-ONLY | - |
| `src/features/program/pages/CheckInModulePage.tsx:123` | Partial logging save days | save incomplete days | PUT check-ins/incomplete-days, then confirm step | `PUT check-ins/incomplete-days` | CODE-ONLY | - |
| `src/features/program/pages/CheckInModulePage.tsx:124` | Partial logging finish | optionally hide module | PUT check-ins/modules {partialLoggingHidden} + markDone + hub | `PUT check-ins/modules` | CODE-ONLY | - |
| `src/features/program/pages/CheckInModulePage.tsx:143` | Accept | accept proposal | POST check-ins/accept → markDone + /program | `POST check-ins/accept`, `/program` | CODE-ONLY | - |
| `src/features/program/pages/CheckInModulePage.tsx:144` | Decline | reject proposal | POST check-ins/reject → markDone + /program | `POST check-ins/reject`, `/program` | CODE-ONLY | - |
| `src/features/program/components/CheckInPage/IntroModule.tsx:61` | Back | hub | onExit | state / UI only | CODE-ONLY | - |
| `src/features/program/components/CheckInPage/IntroModule.tsx:68` | "Next Module" | finish intro | onFinish | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/FeatureCarouselStep.tsx:118` | Previous page arrow | prev slide | goTo(page-1) | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/FeatureCarouselStep.tsx:138` | Next page arrow | next slide | goTo(page+1) | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/FeatureCarouselStep.tsx:84` | Track onScroll | sync dots | setPage | state / UI only | CODE-ONLY | - |
| `src/features/program/components/CheckInPage/PartialLoggingModule.tsx:80` | Back | prev step / hub on first | go(prev) or onExit | state / UI only | CODE-ONLY | - |
| `src/features/program/components/CheckInPage/PartialLoggingModule.tsx:87` | Next / Next Module | advance; save on select | next(): select→onSaveDays; complete→onFinish | state / UI only | CODE-ONLY | - |
| `src/features/program/components/CheckInPage/PartialLoggingModule.tsx:145` | "Don't show this module again" checkbox | hide module, re-enable later from More | setHide → partialLoggingHidden saved; copy says "turn it back on any time from More" but no UI anywhere sets partialLoggingHidden=false (also IntroModule.tsx:49 slide) | state / UI only | CODE-ONLY | Question for user |
| `src/features/program/components/CheckInPage/IncompleteDaysChart.tsx:59` | Day bar | toggle incomplete | onToggle(date) | state / UI only | CODE-ONLY | - |
| `src/features/program/components/CheckInPage/ProgramUpdateModule.tsx:89` | Back | hub | onExit (hidden while reviewing) | state / UI only | CODE-ONLY | - |
| `src/features/program/components/CheckInPage/ProgramUpdateModule.tsx:107` | "Accept Program Changes" | accept | onAccept, disabled if infeasible | state / UI only | CODE-ONLY | - |
| `src/features/program/components/CheckInPage/ProgramUpdateModule.tsx:115` | "Decline and Silence" | reject | onDecline | state / UI only | CODE-ONLY | - |
| `src/features/program/components/CheckInPage/ProgramUpdateModule.tsx:96` | "Done" (no proposal) | record check-in | onAccept → POST accept | `POST accept` | CODE-ONLY | - |
| `src/features/onboarding/pages/OnboardingPage.tsx:45` | Finished redirect | leave wizard | router.replace /dashboard | `/dashboard` | CODE-ONLY | - |
| `src/features/onboarding/pages/OnboardingPage.tsx:48` | ErrorState Retry | refetch state | state.refetch() | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/pages/OnboardingPage.tsx:22` | Wizard Back | previous step | wizard.back (canGoBack index>1, not in finish) | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/pages/OnboardingPage.tsx:29` | Wizard Next | save step + advance | next(): basics → saveBasics (onboarding service), ready → POST programs, then go(next) | `POST programs` | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingGuard.tsx:18` | Guard redirect | force onboarding | router.replace /onboarding when isRequired | `/onboarding` | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/BasicsSteps.tsx:49` | Sex option | set gender | patch | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/BirthDateStep.tsx:53` | Month/Day/Year wheels (:59,:65) | set DOB | update → onChange iso | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/BasicsSteps.tsx:61` | "Use this value" (DOB) | confirm suggestion | patch same value + focus Next | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/HeightStep.tsx:43` | Unit toggle / ruler (:54,:61) | set height & unit | onUnitChange / onChange | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/BasicsSteps.tsx:75` | "Use this value" (height) | confirm | patch | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/WeightStep.tsx:32` | Unit toggle / ruler (:46,:55) | set weight & unit | onUnitChange / onChange | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/BasicsSteps.tsx:89` | "Use this value" (weight) | confirm | patch | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/WeightHistoryStep.tsx:67` | Weight-history option | answer + shown threshold | onAnswer → patch | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/WeightHistoryStep.tsx:43` | Retry | refetch question | question.refetch() | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/BasicsSteps.tsx:115` | Legacy weight-history option (flag off) | answer | patch | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/BasicsSteps.tsx:125` | Weight trend option | answer | patch | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/BodyFatStep.tsx:82` | Body-fat −/slider(:94)/+(:117) | choose level | select(level) | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/BasicsSteps.tsx:144` | Exercise / activity(:154) / lifting(:163) / cardio(:172) options | answer | patch | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/EstimateChatStep.tsx:146` | Chat reply chips | reply | setReplies/setPath | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/EstimateChatStep.tsx:159` | Skip / Next | advance | onNext = wizard.next | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/ChatBubbles.tsx:25` | Edit expenditure (pencil) | open edit sheet | onEdit → setEditing(true) | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/EstimateChatStep.tsx:167` | Edit sheet close | commit manual TDEE | commits if 1000..6000 else silently discarded | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/EstimateChatStep.tsx:184` | TDEE input | type | setDraft | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/EstimateChatStep.tsx:93` | Estimate Retry | refetch | onRetry | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/ReferralStep.tsx:55` | Referral option | pick source | onSourceChange | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/ReferralStep.tsx:67` | Affiliate code input | type code | onAffiliateCodeChange | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:42` | Shift fix (onboarding) | apply fix | wizard.applyShiftFix → patch | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:65` | Preview Retry | refetch preview | retryPreview | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:100` | Goal type option | set goal | setGoalType | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:110` | Goal target / rate (:112) | set | patch | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:120` | "Use these values" | confirm suggestions | confirmGoalSuggestions | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:145` | Diet / floor(:154) / training(:163) / protein(:183) options | answer | patch | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:170` | Distribution controls | set | patch shiftMode/Days/Percent | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/ProgramSteps.tsx:210` | Ready reached end | unlock Done | onReadyReached | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/PlanStep.tsx:38` | Plan cards + "Start trial" | choose/subscribe plan | setPlan local state only; never sent; "Start trial" only advances | state / UI only | CODE-ONLY | Question for user |
| `src/features/onboarding/components/OnboardingPage/ConsentStep.tsx:90` | Consent switches | accept terms | onCheckedChange → setConsent | state / UI only | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/ConsentStep.tsx:99` | "Accept and continue" | complete onboarding | acceptConsent → complete mutation → /dashboard | `/dashboard` | CODE-ONLY | - |
| `src/features/onboarding/components/OnboardingPage/SuggestionNote.tsx:29` | Suggestion button | confirm | onConfirm + focus Next | state / UI only | CODE-ONLY | - |
| `src/features/auth/components/AuthGuard.tsx:16` | Unauth redirect | /login with return path | /login?redirect=encodeURIComponent(pathname) — query string dropped (e.g. /progress-photos/gallery?date=…) | `/login?redirect=encodeURIComponent`, `/progress-photos/gallery?date=…` | CLICKED-PASS (/more logged out → /login?redirect=%2Fmore) | Fixed — (was BROKEN) |
| `src/features/auth/pages/LoginPage.tsx:19` | Already-authed redirect | go to safe redirect target | router.replace(searchParams.get('redirect') ?? '/dashboard') unvalidated | `/dashboard` | CODE-ONLY | Fixed — (was BROKEN) |
| `src/features/auth/components/login/LoginForm.tsx:66` | Login form onSubmit | log in | login() → POST auth.login, setUser, toast | `POST auth.login` | CLICKED-PASS (empty-submit validation + focus; success path not clicked) | - |
| `src/features/auth/components/login/LoginForm.tsx:53` | Post-login redirect | go to redirect target | same unvalidated redirect param (open redirect) | state / UI only | CODE-ONLY | Fixed — (was BROKEN) |
| `src/features/auth/components/login/LoginForm.tsx:69` | "Resend verification email" | open confirm page with email | Link /confirm-email?email=…; target reads `email` (ConfirmEmailPage.tsx:112) | `/confirm-email?email=…` | CODE-ONLY | - |
| `src/features/auth/components/login/LoginForm.tsx:99` | "Forgot password?" | forgot page | Link /forgot-password | `/forgot-password` | CLICKED-PASS | - |
| `src/features/auth/components/login/LoginForm.tsx:119` | "Log in" submit | submit | type=submit | state / UI only | CLICKED-PASS (empty-submit validation + focus; success path not clicked) | - |
| `src/features/auth/pages/LoginPage.tsx:43` | "Create account" (AuthAltAction:24) | register | Link /register (redirect param not forwarded) | `/register` | CLICKED-PASS | - |
| `src/features/auth/pages/RegisterPage.tsx:100` | Register form onSubmit | create account | authService.register → POST auth.register → "Check your email" | `POST auth.register` | CLICKED-PASS (empty-submit validation, no API call) | - |
| `src/features/auth/pages/RegisterPage.tsx:118` | Gender PickerSelect | pick gender | Controller onChange | state / UI only | CLICKED-PASS (sheet opens, Female selected, closes) | - |
| `src/features/auth/pages/RegisterPage.tsx:166` | "Create account" submit | submit | type=submit | state / UI only | CLICKED-PASS (empty-submit validation, no API call) | - |
| `src/features/auth/pages/RegisterPage.tsx:87` | "Link not working? Enter the code or resend" | confirm page | Link /confirm-email?email=…; target reads email → ResendSection prefill | `/confirm-email?email=…` | CODE-ONLY | - |
| `src/features/auth/pages/RegisterPage.tsx:70` | "Log in" (AuthAltAction) | login | Link /login | `/login` | CLICKED-PASS | - |
| `src/features/auth/pages/ForgotPasswordPage.tsx:83` | Forgot form onSubmit | send reset email | POST auth.forgotPassword → sent state | `POST auth.forgotPassword` | CLICKED-PASS (validation, no API call) | - |
| `src/features/auth/pages/ForgotPasswordPage.tsx:58` | "Back to log in" | login | Link /login | `/login` | CLICKED-PASS | - |
| `src/features/auth/pages/ForgotPasswordPage.tsx:79` | "I already have a token" | reset page | Link /reset-password | `/reset-password` | CODE-ONLY | - |
| `src/features/auth/pages/ResetPasswordPage.tsx:75` | Reset form onSubmit | reset password | POST auth.resetPassword → toast + replace /login; token prefilled from ?token (:38) | `POST auth.resetPassword`, `/login` | CLICKED-PASS (validation, no API call) | - |
| `src/features/auth/pages/ResetPasswordPage.tsx:67` | "Back to log in" | login | Link /login | `/login` | CLICKED-PASS | - |
| `src/features/auth/pages/ConfirmEmailPage.tsx:132` | Auto-verify from ?token | verify | POST auth.confirmEmail once (ref guard) | `POST auth.confirmEmail` | CODE-ONLY | - |
| `src/features/auth/pages/ConfirmEmailPage.tsx:194` | Verify code form onSubmit | verify | POST auth.confirmEmail | `POST auth.confirmEmail` | CLICKED-PASS (validation, no API call) | - |
| `src/features/auth/pages/ConfirmEmailPage.tsx:210` | Code input | type | setToken | state / UI only | CODE-ONLY | - |
| `src/features/auth/pages/ConfirmEmailPage.tsx:59` | Resend form onSubmit | resend email | POST auth.resendVerification, 60s cooldown | `POST auth.resendVerification` | CLICKED-PASS (validation, no API call) | - |
| `src/features/auth/pages/ConfirmEmailPage.tsx:87` | Resend email input | type | setEmail | state / UI only | CODE-ONLY | - |
| `src/features/auth/pages/ConfirmEmailPage.tsx:162` | "Log in" (success) | login | Link /login | `/login` | CODE-ONLY | - |
| `src/features/auth/pages/ConfirmEmailPage.tsx:187` | "Back to log in" | login | Link /login | `/login` | CLICKED-PASS | - |
| `src/features/auth/hooks/use-auth.ts:47` | logout() | sign out | POST auth.logout, clear store/cache/drafts, push /login | `POST auth.logout`, `/login` | CODE-ONLY | - |
| `src/features/users/pages/ProfilePage.tsx:64` | ErrorState Retry | refetch profile | profile.refetch() | state / UI only | CODE-ONLY | - |
| `src/features/users/pages/ProfilePage.tsx:81` | Profile form onSubmit | save dirty fields | profileUpdatePayload → useUpdateProfile → userService.updateProfile | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:107` | Name row | open name sheet | setSheet('name') | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:114` | Date of birth row | open sheet | setSheet('dob') | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:116` | Gender row | open sheet | setSheet('gender') | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:121` | Height row | open sheet | setSheet('height') | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:129` | Activity row | open sheet | setSheet('activity') | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:137` | Units row | open sheet | setSheet('unit') | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:143` | Energy row | open sheet | setSheet('energy') | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:149` | Week starts on row | open sheet | setSheet('weekStart') | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:158` | Time zone row | open sheet | setSheet('timeZone') | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:163` | "My foods" | foods page | ListRow href /foods | `/foods` | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:164` | "Sign out" | log out | onLogout → useAuth.logout | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:170` | "Save changes" | submit | type=submit (shown when dirty) | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:182` | PickerSheets onOpenChange (×9) | close sheet | close() | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:185` | First/last name inputs (:188) | edit | register | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:205` | DateField DOB | set DOB | setValue dirty+validate | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:218` | Gender OptionList | pick | pick('gender') | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:230` | Height input | edit | register setValueAs | state / UI only | CODE-ONLY | - |
| `src/features/users/components/ProfilePage/ProfileForm.tsx:246` | Activity / Units(:255) / Energy(:269) / Week start(:283) / Time zone(:298) OptionLists | pick | pick(name) dirty+validate | state / UI only | CODE-ONLY | - |
| `src/features/users/components/TimeZoneGate.tsx:36` | Toast action "Set time zone" | open Profile time zone | router.push('/profile#units') (ProfileForm scrolls to #units) | `/profile` | CODE-ONLY | - |

### D. More / shortcuts / body / photos / shell / routes

| Source (file:line) | Button/Action | Expected | Actual | Route / API target | Test status | Fix status |
|---|---|---|---|---|---|---|
| `src/app/(protected)/layout.tsx:47` | AppSidebar onToggleCollapse | collapse/expand sidebar | setIsCollapsed (localStorage 'sidebar-collapsed') | state / UI only | CODE-ONLY | - |
| `src/app/(protected)/layout.tsx:59` | PageTransition key=pathname | page enter anim per route | keyed remount | state / UI only | CODE-ONLY | - |
| `src/app/(protected)/layout.tsx:16` | FULL_SCREEN_PREFIXES (/shortcuts, /progress-photos/gallery, /progress-photos/compare, program flows) | no chrome on these routes | ShortcutSheetsPage/TabBar not mounted there | state / UI only | CODE-ONLY | - |
| `src/app/(protected)/body-metrics/[metric]/page.tsx:15` | dynamic [metric] validation | unknown key -> 404 | findMeasurement (case-insensitive) else notFound() | state / UI only | CODE-ONLY | - |
| `src/app/(protected)/dashboard/nutrition/[nutrient]/page.tsx` | dynamic [nutrient] validation | unknown -> 404 | findNutrient else notFound() | state / UI only | CODE-ONLY | - |
| `src/app/(protected)/dashboard/nutrition/[nutrient]/summary/page.tsx` | dynamic [nutrient] validation | unknown -> 404 | notFound() | state / UI only | CODE-ONLY | - |
| `src/app/(protected)/dashboard/nutrition/[nutrient]/goals/page.tsx` | dynamic [nutrient] validation | unknown -> 404 | notFound() | state / UI only | CODE-ONLY | - |
| `src/app/(protected)/foods/new/page.tsx` | searchParams from/name/calories/... | prefill Create Food | parsed, passed as fromFoodId/seed | state / UI only | CODE-ONLY | - |
| `src/app/(protected)/*/page.tsx` (body-fat, full-body{,/all,/compare}, more{,/expenditure,/expenditure/bmr,/tutorials}, period, profile, progress-photos{,/gallery,/compare}, shortcuts, steps, weight, dashboard/*, food-log/*, foods, recipes/new, habits/*, nutrition-data) | static route pages | render feature page | each renders its feature page component (verified) | state / UI only | CODE-ONLY | - |
| `src/components/shared/AppHeader.tsx:13` | Wordmark link | go to dashboard | Link /dashboard | `/dashboard` | CODE-ONLY | - |
| `src/components/shared/AvatarMenu.tsx:46` | Account avatar trigger | open menu | DropdownMenuTrigger | state / UI only | CODE-ONLY | - |
| `src/components/shared/AvatarMenu.tsx:66` | Profile item | /profile | Link routePath.profile | state / UI only | CODE-ONLY | - |
| `src/components/shared/AvatarMenu.tsx:72` | My foods item | /foods | Link routePath.foods | state / UI only | CODE-ONLY | - |
| `src/components/shared/AvatarMenu.tsx:80` | Theme sub-trigger | open submenu | DropdownMenuSubTrigger (client only) | state / UI only | CODE-ONLY | - |
| `src/components/shared/AvatarMenu.tsx:86` | Theme Light/Dark/System items | set theme | setTheme(value) | state / UI only | CODE-ONLY | - |
| `src/components/shared/AvatarMenu.tsx:99` | Sign out | log out | useAuth().logout | state / UI only | CODE-ONLY | - |
| `src/components/shared/AppSidebar.tsx:67` | Sidebar Dashboard | /dashboard | Link · **Clicked:** 1024: sidebar → /dashboard | state / UI only | CLICKED-PASS | - |
| `src/components/shared/AppSidebar.tsx:67` | Sidebar Food log | /food-log | Link · **Clicked:** 1024: sidebar → /food-log | state / UI only | CLICKED-PASS | - |
| `src/components/shared/AppSidebar.tsx:67` | Sidebar Foods | /foods | Link | state / UI only | CODE-ONLY | - |
| `src/components/shared/AppSidebar.tsx:67` | Sidebar Strategy | /program | Link · **Clicked:** 1024: sidebar → /program | state / UI only | CLICKED-PASS | - |
| `src/components/shared/AppSidebar.tsx:67` | Sidebar Weight | /weight | Link · **Clicked:** 1024: sidebar → /weight | state / UI only | CLICKED-PASS | - |
| `src/components/shared/AppSidebar.tsx:67` | Sidebar Profile | /profile | Link | state / UI only | CODE-ONLY | - |
| `src/components/shared/AppSidebar.tsx:82` | Collapse/Expand button | toggle width | onToggleCollapse | state / UI only | CODE-ONLY | - |
| `src/components/shared/AppSidebar.tsx:27` | NAV_ITEMS (missing entries) | desktop users can reach More + Shortcuts "+" | no More item, no Shortcuts trigger; MobileTabBar is md:hidden -> /more, /more/*, Shortcuts sheet, Customize unreachable from nav at >=768px | `/more`, `/more/` | CODE-ONLY | Fixed — (was BROKEN) |
| `src/components/shared/MobileTabBar.tsx:55` | Tab Dashboard | /dashboard | Link · **Clicked:** 390: tap → /dashboard | state / UI only | CLICKED-PASS | - |
| `src/components/shared/MobileTabBar.tsx:55` | Tab Food Log | /food-log | Link · **Clicked:** 390: tap → /food-log | state / UI only | CLICKED-PASS | - |
| `src/components/shared/MobileTabBar.tsx:84` | "+" Shortcuts button | open Shortcuts sheet | setShortcutsOpen(true) -> ShortcutSheetsPage · **Clicked:** 390: tap → Shortcuts sheet, last row bottom 820 < 844 | state / UI only | CLICKED-PASS | - |
| `src/components/shared/MobileTabBar.tsx:55` | Tab Strategy | /program | Link · **Clicked:** 390: tap → /program | state / UI only | CLICKED-PASS | - |
| `src/components/shared/MobileTabBar.tsx:55` | Tab More | /more | Link · **Clicked:** 390: tap → /more | state / UI only | CLICKED-PASS | - |
| `src/components/shared/SheetFrame.tsx:61` | X close | close sheet | onOpenChange(false) · **Clicked:** 390: X closes sheet (Hour Range, Weight) | state / UI only | CLICKED-PASS | - |
| `src/components/shared/SheetFrame.tsx:74` | Title button (date ▾) | open Select Date | onTitleClick | state / UI only | CODE-ONLY | - |
| `src/components/shared/SheetFrame.tsx:100` | Done | apply + close | onDone?.(); onOpenChange(false) | state / UI only | CODE-ONLY | - |
| `src/components/shared/ConfirmDialog.tsx:47` | Cancel | close | AlertDialogCancel · **Clicked:** 390: Cancel closes End program dialog | state / UI only | CLICKED-PASS | - |
| `src/components/shared/ConfirmDialog.tsx:50` | Confirm (destructive) | run action | onConfirm() (no error slot) · **Clicked:** E2E: End program confirm → DELETE 200 | state / UI only | CLICKED-PASS | - |
| `src/components/shared/ListGroup.tsx:105` | ListRow href | navigate | Link | state / UI only | CODE-ONLY | - |
| `src/components/shared/ListGroup.tsx:111` | ListRow onClick | run handler | button onClick | state / UI only | CODE-ONLY | - |
| `src/components/shared/DateField.tsx:36` | native date input | pick date | onValueChange(value); no max -> future dates selectable | state / UI only | CODE-ONLY | - |
| `src/components/shared/ErrorState.tsx:92` | Try again | refetch | onRetry · **Clicked:** E2E: Try again re-fetches (4 detail pages) | state / UI only | CLICKED-PASS | - |
| `src/components/shared/ErrorState.tsx:161` | Go back | backHref | Link (only when backHref passed) | state / UI only | CODE-ONLY | - |
| `src/components/shared/ErrorState.tsx:166` | Sign in again | /login | Link | state / UI only | CODE-ONLY | - |
| `src/components/shared/NumericKeypad.tsx:44` | Phone keypad digits/./delete | type into active field | onKey / onBackspace | state / UI only | CODE-ONLY | - |
| `src/components/shared/NumericKeypad.tsx:102` | Grid keypad digits,/,space,.,delete | type | onKey / onBackspace | state / UI only | CODE-ONLY | - |
| `src/components/shared/ChoiceSheet.tsx:66` | choice row | select + close | onSelect + delayed close | state / UI only | CODE-ONLY | - |
| `src/components/shared/PickerSheet.tsx:46` | Done | close | onOpenChange(false) | state / UI only | CODE-ONLY | - |
| `src/components/shared/PickerSheet.tsx:85` | OptionList row | select | onValueChange | state / UI only | CODE-ONLY | - |
| `src/components/shared/PickerSelect.tsx:43` | select trigger | open picker | setOpen(true) | state / UI only | CODE-ONLY | - |
| `src/components/shared/ChooseIconSheet.tsx:68` | category tab | filter icons | selectCategory | state / UI only | CODE-ONLY | - |
| `src/components/shared/ChooseIconSheet.tsx:113` | Default icon cell | select default | setSelected(null) | state / UI only | CODE-ONLY | - |
| `src/components/shared/ChooseIconSheet.tsx:124` | icon cell | select icon | setSelected(key) | state / UI only | CODE-ONLY | - |
| `src/components/shared/ChooseIconSheet.tsx:138` | Select Icon | apply | onSelect(selected)+close | state / UI only | CODE-ONLY | - |
| `src/components/shared/ChooseIconSheet.tsx:148` | Cancel | close | onOpenChange(false) | state / UI only | CODE-ONLY | - |
| `src/components/shared/MonthYearPickerSheet.tsx:73` | month cell | pick month | pick(year,index), future disabled | state / UI only | CODE-ONLY | - |
| `src/components/shared/MonthYearPickerSheet.tsx:92` | current month button | jump to today | pick(todayYear,todayMonth) | state / UI only | CODE-ONLY | - |
| `src/components/shared/MonthYearPickerSheet.tsx:128` | decade prev/next | page years | page(-1/1), next bounded | state / UI only | CODE-ONLY | - |
| `src/components/shared/MonthYearPickerSheet.tsx:166` | year cell | pick year | onPick(value) | state / UI only | CODE-ONLY | - |
| `src/components/shared/SearchableSelect.tsx:91` | combobox input focus/type/keys/options/clear | search+select | setOpen/onChange/onKeyDown/choose | state / UI only | CODE-ONLY | - |
| `src/components/shared/SearchableSelect.tsx:177` | sheet variant trigger/search/options | search+select | setOpen/setQuery/onValueChange | state / UI only | CODE-ONLY | - |
| `src/components/shared/SwipeToDelete.tsx:69` | Delete revealed button | delete row | onDelete | state / UI only | CODE-ONLY | - |
| `src/components/shared/SwipeToDelete.tsx:75` | swipe gesture | reveal / commit delete | pointer handlers -> onDelete past COMMIT_PX | state / UI only | CODE-ONLY | - |
| `src/components/shared/WheelPicker.tsx:87` | wheel scroll / arrow keys | change value | onChange | state / UI only | CODE-ONLY | - |
| `src/components/shared/PasswordInput.tsx:39` | show/hide password | toggle visibility | setVisible | state / UI only | CODE-ONLY | - |
| `src/components/shared/SearchInput.tsx:40` | search input | type | onValueChange | state / UI only | CODE-ONLY | - |
| `src/components/shared/SearchInput.tsx:50` | clear (x) | clear text | onValueChange('') | state / UI only | CODE-ONLY | - |
| `src/components/shared/ChoiceGroup.tsx:34` | ToggleGroup | select | onValueChange (ignores empty) | state / UI only | CODE-ONLY | - |
| `src/components/shared/IconButton.tsx:27` | generic icon button | pass-through | Button + tooltip | state / UI only | CODE-ONLY | - |
| `src/stores/ui.store.ts:63` | setShortcutsOpen | open/close Shortcuts sheet | consumed by MobileTabBar + ShortcutSheetsPage | state / UI only | CODE-ONLY | - |
| `src/stores/ui.store.ts:66` | openSheet/closeSheet | open Weight/Metrics/Photos sheet | consumed by ShortcutSheetsPage (session counter remount) | state / UI only | CODE-ONLY | - |
| `src/stores/ui.store.ts:54` | requestAddFood/clearAddFoodRequest | open Add Food at tab | consumed by FoodLogPage.tsx:236 | state / UI only | CODE-ONLY | - |
| `src/stores/ui.store.ts:57` | recipeDraft / foodLogDate setters | cross-page handoff | consumed by food-log/recipe pages | state / UI only | CODE-ONLY | - |
| `src/stores/auth.store.ts:22` | setUser/clearAuth | auth state | persist + token | state / UI only | CODE-ONLY | - |
| `src/stores/flow.store.ts`, `goal-edit.store.ts`, `program-wizard.store.ts`, `check-in-progress.store.ts` | store actions | program flows (out of UI scope) | plain setters | state / UI only | CODE-ONLY | - |
| `src/features/more/pages/MorePage.tsx:82` | Account row | /profile | Link routePath.profile | state / UI only | CODE-ONLY | - |
| `src/features/more/pages/MorePage.tsx:95` | Subscription row | subscription page | div aria-disabled, "Not available yet" | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/MorePage.tsx:95` | Integrations row | integrations page | disabled "Not available yet" | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/MorePage.tsx:82` | Units row | profile units section | Link /profile#units (ProfileForm scrolls to #units) · **Clicked:** 390: → /profile | `/profile` | CLICKED-PASS | - |
| `src/features/more/pages/MorePage.tsx:95` | Language row | language setting | disabled "Not available yet" | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/MorePage.tsx:82` | Dashboard row | dashboard customize | Link /dashboard/customize · **Clicked:** 390: → /dashboard/customize | `/dashboard/customize` | CLICKED-PASS | - |
| `src/features/more/pages/MorePage.tsx:82` | Food Log row | food log settings | Link /food-log/settings · **Clicked:** 390: → /food-log/settings | `/food-log/settings` | CLICKED-PASS | - |
| `src/features/more/pages/MorePage.tsx:82` | Shortcuts row | customize shortcuts | Link /shortcuts · **Clicked:** 390: → /shortcuts | `/shortcuts` | CLICKED-PASS | - |
| `src/features/more/pages/MorePage.tsx:82` | Expenditure row | expenditure settings | Link /more/expenditure · **Clicked:** 390: → /more/expenditure | `/more/expenditure` | CLICKED-PASS | - |
| `src/features/more/pages/MorePage.tsx:95` | Weight Trend row | weight trend settings | disabled "Not available yet" (more.config.ts:87) | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/MorePage.tsx:82` | Strategy row | program | Link /program · **Clicked:** 390: → /program | `/program` | CLICKED-PASS | - |
| `src/features/more/pages/MorePage.tsx:221` | Theme System/Light/Dark cards (x3) | set theme | setTheme(value) · **Clicked:** 390: Light → html.light bg #f5f5f5, Dark → html.dark; restored System | state / UI only | CLICKED-PASS | - |
| `src/features/more/pages/MorePage.tsx:95` | Data Export row | export | disabled "Not available yet" | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/MorePage.tsx:95` | Data Visibility row | visibility | disabled "Not available yet" | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/MorePage.tsx:95` | Account & Data Deletion row | delete account | disabled "Not available yet" | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/MorePage.tsx:95` | Knowledge Base row | docs | disabled "Not available yet" | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/MorePage.tsx:95` | Roadmap row | roadmap | disabled "Not available yet" | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/MorePage.tsx:95` | Support row | support | disabled "Not available yet" | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/MorePage.tsx:95` | Legal row | legal | disabled "Not available yet" | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/MorePage.tsx:82` | Tutorials row | tutorials | Link /more/tutorials · **Clicked:** 390: → /more/tutorials | `/more/tutorials` | CLICKED-PASS | - |
| `src/features/more/pages/MorePage.tsx:95` | About row | about | disabled "Not available yet" | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/components/SettingRows.tsx:53` | SettingRow link | navigate | Link with chevron | state / UI only | CODE-ONLY | - |
| `src/features/more/components/SettingRows.tsx:70` | SettingRow Edit pill | open sheet | onEdit (disabled when `disabled`) | state / UI only | CODE-ONLY | - |
| `src/features/more/components/SettingRows.tsx:100` | SettingSwitchRow Switch | toggle modifier | checked={false} hard-coded, no onCheckedChange; only ever rendered disabled | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:101` | Back (SubPageHeader) | previous page | router.back() | state / UI only | CODE-ONLY | - |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:116` | Estimation Method Edit | open Default/Manual sheet | setSheet('method') -> ManualTdeeSheet; save = setManual (PUT /programs/current/expenditure) or PUT /expenditure/settings when flag on | `PUT /programs/current/expenditure`, `PUT /expenditure/settings`, `/programs/current/expenditure` | CODE-ONLY | - |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:122` | Calculation Start Date Edit | edit date | always `disabled` (even with EXPENDITURE_SETTINGS_API on) | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:132` | BMR Equation row | /more/expenditure/bmr | Link routePath.moreBmr | state / UI only | CODE-ONLY | - |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:140` | Calculation Mode Edit | Dynamic/Static sheet | disabled unless NEXT_PUBLIC_EXPENDITURE_MODE_API=true (not set in .env/.env.example) | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:147` | Algorithm row | display only | readOnly | state / UI only | CODE-ONLY | - |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:155` | Step-Informed Updates switch | toggle | disabled, "Not available yet" | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/ExpenditureSettingsPage.tsx:160` | Predictive Goal Adjustment switch | toggle | disabled, "Not available yet" | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/components/ManualTdeeSheet.tsx:94` | "Default" radio | revert to default estimate | only clickable if onUseDefault passed; flag OFF -> undefined, so once Manual is saved user cannot go back to Default | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/components/ManualTdeeSheet.tsx:123` | "Manual"/"Static" radio | select manual | display-only radio (no handler); selection implied by typing in input | state / UI only | CODE-ONLY | - |
| `src/features/more/components/ManualTdeeSheet.tsx:141` | kcal input (+Enter) | enter value | setText digits; Enter -> save() | state / UI only | CODE-ONLY | - |
| `src/features/more/components/ManualTdeeSheet.tsx:163` | Save | save kcal | run(onSave) -> mutateAsync, closes on success, inline error | state / UI only | CODE-ONLY | - |
| `src/features/more/components/ManualTdeeSheet.tsx:82` | sheet close | reset + close | blocked while pending | state / UI only | CODE-ONLY | - |
| `src/features/more/pages/BmrEquationPage.tsx:135` | Equation radio (flag ON) | choose MacroFactor/Cunningham | PUT /expenditure/settings { bmrEquation } | `PUT /expenditure/settings` | CODE-ONLY | - |
| `src/features/more/pages/BmrEquationPage.tsx:233` | Equation list (flag OFF) | choose equation | aria-disabled display + "Choosing the equation is not available yet" | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/BmrEquationPage.tsx:279` | Activity Edit | choose activity | SettingChoiceSheet -> PUT /onboarding/basics {step:0,dailyActivity} + toast | `PUT /onboarding/basics`, `/onboarding/basics` | CODE-ONLY | - |
| `src/features/more/pages/BmrEquationPage.tsx:285` | Exercise Edit | choose exercise | same, field exerciseSessions | state / UI only | CODE-ONLY | - |
| `src/features/more/pages/BmrEquationPage.tsx:301` | Athletic Pursuits Edit (flag OFF) | choose | disabled "Not available yet" (flag ON :292 -> PUT /expenditure/settings) | `PUT /expenditure/settings` | CODE-ONLY | Question for user |
| `src/features/more/pages/BmrEquationPage.tsx:308` | Prior Weight Edit | answer question | disabled unless settings flag + PRIOR_WEIGHT_API + question loaded; flag OFF -> "Not available yet" | state / UI only | CODE-ONLY | Question for user |
| `src/features/more/pages/BmrEquationPage.tsx:327` | Prior Progress Edit | choose | PUT /onboarding/basics {recentWeightTrend} | `PUT /onboarding/basics`, `/onboarding/basics` | CODE-ONLY | - |
| `src/features/more/pages/BmrEquationPage.tsx:336` | Sex for BMR Edit (flag ON, gender Other) | choose | PUT /expenditure/settings { bmrSex } | `PUT /expenditure/settings` | CODE-ONLY | - |
| `src/features/more/components/SettingChoiceSheet.tsx:74` | choice row | save + close | await onSave; error inline; same value -> close | state / UI only | CODE-ONLY | - |
| `src/features/more/pages/TutorialsPage.tsx:22` | Show (per dismissed tutorial) | re-enable tutorial | persistChoice(key,'show'); keys match usePersistedChoice keys in Steps/ScaleWeight/Measurement/VBF/Expenditure/WeightTrend/GoalProgress | state / UI only | CODE-ONLY | - |
| `src/features/more/pages/TutorialsPage.tsx:48` | Show All Tutorials | reset all | persistChoice for all 7 keys | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/pages/ShortcutSheetsPage.tsx:32` | pathname effect | auto-close Shortcuts sheet on navigation | setShortcutsOpen(false) | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:52` | Customize (sliders icon) | /shortcuts | Link customizeHref=/shortcuts · **Clicked:** 390: → /shortcuts | `/shortcuts` | CLICKED-PASS | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:92` | Top shortcut Search | open Add Food › Search | run -> addFood({tab:'search'}) + push /food-log if elsewhere · **Clicked:** 390: → /food-log, Add food on Search | `/food-log` | CLICKED-PASS | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:92` | Top shortcut Barcode | Add Food › Scan | addFood({tab:'scan'}) (AddTab 'scan' exists) · **Clicked:** 390: → Add food on Scan | state / UI only | CLICKED-PASS | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:92` | Top shortcut AI | Add Food › AI | addFood({tab:'ai'}) · **Clicked:** 390: → Add food on AI | state / UI only | CLICKED-PASS | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:92` | Top shortcut Weight | open Weight sheet | openSheet('weight') -> WeightShortcutPage · **Clicked:** 390: → Scale Weight sheet | state / UI only | CLICKED-PASS | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:109` | Row Recipes | Library › Recipes | addFood({tab:'library',libraryView:'recipes'}) · **Clicked:** 390: → Add food on Library | state / UI only | CLICKED-PASS | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:109` | Row Quick Add | Add Food › Quick | addFood({tab:'quick'}) · **Clicked:** 390: → Add food on Quick Add | state / UI only | CLICKED-PASS | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:109` | Row Photos | open Photos sheet | openSheet('photos') -> ProgressPhotosShortcutPage · **Clicked:** 390: → Photos sheet | state / UI only | CLICKED-PASS | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:109` | Row Metrics | open Full Body sheet | openSheet('metrics') -> FullBodyShortcutPage · **Clicked:** 390: → Full Body metrics sheet | state / UI only | CLICKED-PASS | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:109` | Row Your Foods (if enabled) | Library › Foods | addFood({tab:'library',libraryView:'foods'}) | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:88` | New Recipe (if enabled) | /recipes/new | Link via SHORTCUT_HREF | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:88` | New Food (if enabled) | /foods/new | Link via SHORTCUT_HREF | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsSheet.tsx:109` | Row Favorites (if enabled) | Library › Favorites | addFood({tab:'library',libraryView:'favorites'}) | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/hooks/use-shortcut-runner.ts:24` | runner switch | dispatch every key | all 12 catalog keys handled (10 here + 2 hrefs) | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutToolbarContent.tsx:45` | toolbar circle (href key) | navigate | Link | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutToolbarContent.tsx:49` | toolbar circle (action key) | run shortcut | onRun(key) | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutToolbarContent.tsx:70` | "Search for a food" | open search | onSearch | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutToolbarContent.tsx:82` | Scan barcode | open scan | onScan | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:178` | Toolbar preview handlers | inert preview | () => undefined inside `inert` aria-hidden div (intentional) | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:151` | Back | exit (confirm if dirty) | dirty ? ConfirmDialog : onExit (router.back) | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:153` | Save | save config | useSaveShortcuts -> PUT /shortcuts, then router.back() | `PUT /shortcuts`, `/shortcuts` | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:184` | Toolbar Style row | open style sheet | setStyleOpen(true) | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:201` | Order/Color switch | change mode | setMode | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:209` | DnD reorder | reorder enabled shortcuts | onDragEnd arrayMove within enabled | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:236` | Add or Remove Shortcuts | open toggle sheet | setChooseOpen(true) | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:243` | Reset to App Defaults | reset draft | setStyle/setItems(DEFAULT_SHORTCUTS) (draft; needs Save) | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:257` | Toolbar Style ChoiceSheet | pick style | setStyle | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:271` | Choose Shortcuts ToggleList | enable/disable | setItems enabled flag | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:286` | ChooseColorSheet | set color | setColor | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ShortcutsCustomize.tsx:293` | Exit Without Saving confirm | discard + exit | onExit | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/SortableShortcutRow.tsx:59` | "=" drag handle | drag to reorder | dnd-kit listeners | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/SortableShortcutRow.tsx:70` | Brush button | open Choose Color | onChooseColor | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ChooseColorSheet.tsx:31` | 7 color swatches | pick color + close | choose(color) | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ChooseColorSheet.tsx:52` | No color (trash) | clear color | choose(null) | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/pages/ShortcutsPage.tsx:28` | onSave/onExit | save then return | router.back() after mutate success / on exit | state / UI only | CODE-ONLY (parentRoute asserted in check-routes.mjs) | Fixed (phase 2) — was UNKNOWN: Back with no history did nothing; now goBack() → nearest existing parent route |
| `src/features/shortcuts/pages/WeightShortcutPage.tsx:56` | Weight sheet Save | log weight | useUpsertWeight -> POST /weights {logDate, weightKg}; close on success | `POST /weights`, `/weights` | CODE-ONLY | - |
| `src/features/shortcuts/pages/WeightShortcutPage.tsx:50` | Weight sheet Delete | delete weigh-in | close dialog -> ConfirmDialog -> DELETE /weights/{date} | `DELETE /weights/{date}`, `/weights/{date}` | CODE-ONLY | - |
| `src/features/weight/components/WeightPage/LogWeightDialog.tsx:147` | Date field | pick date | setValue('logDate'); no future limit in DateField | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/WeightPage/LogWeightDialog.tsx:76` | Weight input + keypad | enter weight | update() -> setValue('weight') | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/WeightPage/LogWeightDialog.tsx:160` | Delete | delete entry | onDelete(logDate) when date in entryDates | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/WeightPage/LogWeightDialog.tsx:170` | Cancel | close | onOpenChange(false) | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/WeightPage/LogWeightDialog.tsx:179` | Save (submit) | submit | handleSubmit -> onSubmit | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/FullBodySheet.tsx:246` | Date title ▾ | Select Date | setDateOpen(true) -> SelectDateSheet -> onDateChange -> refetch day | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/FullBodySheet.tsx:252` | Delete metrics (trash) | delete day | ConfirmDialog -> DELETE /body-metrics/full-body?date | `DELETE /body-metrics/full-body?date`, `/body-metrics/full-body?date` | CODE-ONLY | - |
| `src/features/shortcuts/components/FullBodySheet.tsx:146` | Reference button | open BF reference | setReferenceOpen(true) | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/FullBodySheet.tsx:210` | BodyFatReferenceSheet (from Full Body) | pick % by body type | `body` prop not passed -> always male figures | state / UI only | CODE-ONLY | Fixed — (was BROKEN) |
| `src/features/shortcuts/components/FullBodySheet.tsx:97` | 19 numeric inputs + keypad | enter cm / % | setField with regex | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/FullBodySheet.tsx:180` | Save | save metrics | zod check -> PUT /body-metrics/full-body; invalidates body-metrics/VBF/measurements | `PUT /body-metrics/full-body`, `/body-metrics/full-body` | CODE-ONLY | - |
| `src/features/shortcuts/components/BodyFatReferenceSheet.tsx:96` | 9 body-fat bands | fill midPercent + close | onSelect + close | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ProgressPhotosSheet.tsx:147` | Date field | change day | onDateChange -> refetch; no future limit | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ProgressPhotosSheet.tsx:150` | Delete this day's photos | delete with confirmation | onDelete -> remove.mutate(date) immediately, NO confirm, permanent | state / UI only | CODE-ONLY | Fixed — (was BROKEN) |
| `src/features/shortcuts/components/ProgressPhotosSheet.tsx:64` | Front/Side/Back tiles | pick photo | hidden file input click -> type/size check | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ProgressPhotosSheet.tsx:178` | Consent checkbox | consent | setConsent | state / UI only | CODE-ONLY | - |
| `src/features/shortcuts/components/ProgressPhotosSheet.tsx:188` | Save | upload | sequential PUT /progress-photos (multipart) | `PUT /progress-photos`, `/progress-photos` | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/BodyMetricView.tsx:81` | "+" Add | open entry sheet today | onAdd -> openSheet(today) | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/BodyMetricView.tsx:79` | Back | previous | router.back() | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/BodyMetricView.tsx:121` | Expand chart | expand | ExpandButton | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/MetricChart.tsx:101` | chart tap / drag | select point / pan | pick + pan.bind | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/BodyMetricView.tsx:147` | RangeBar 1W..All + D/W/M | change range/averaging | setRange / setAveraging | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/BodyMetricView.tsx:163` | Tutorial dismiss/prev/next | dismiss | onDismissTutorial -> persisted 'hidden' | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/MetricHistoryList.tsx:35` | pencil per row | edit that date | onEdit(date) | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/MetricEntrySheet.tsx:117` | Date title ▾ | Select Date | SelectDateSheet -> onDateChange (page re-keys sheet) | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/MetricEntrySheet.tsx:122` | Delete (trash) | delete entry | onDelete -> page ConfirmDialog | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/MetricEntrySheet.tsx:159` | value inputs + keypad | enter value | setField regex | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/MetricEntrySheet.tsx:175` | Reference (VBF only) | open reference | onReference | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/MetricEntrySheet.tsx:185` | Save | validate + save | zod per field, empty -> local error, onSave | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/SelectDateSheet.tsx:64` | Previous month | page back | go(-1) | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/SelectDateSheet.tsx:72` | Next month | page fwd | go(1), disabled at current month | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/SelectDateSheet.tsx:99` | day cell | pick date | pick(iso), future + isDateEnabled disabled | state / UI only | CODE-ONLY | - |
| `src/features/weight/components/BodyMetricPage/SelectDateSheet.tsx:120` | Go to Today | jump to today | pick(today) ignores isDateEnabled; in AllMetrics/Compare today w/o data -> picked invalid -> silently falls back to latest date | state / UI only | CODE-ONLY | Open (BROKEN) — see Open items |
| `src/features/weight/pages/ScaleWeightPage.tsx:64` | Scale Weight save | upsert weight + body fat | POST /weights (kgToSend, bodyFatPercent / clearBodyFat) | `POST /weights`, `/weights` | CODE-ONLY | - |
| `src/features/weight/pages/ScaleWeightPage.tsx:154` | Delete weigh-in confirm | delete | DELETE /weights/{date} | `DELETE /weights/{date}`, `/weights/{date}` | CODE-ONLY | - |
| `src/features/weight/pages/MeasurementPage.tsx:96` | Measurement save | upsert | POST /body-metrics/measurements/{key} | `POST /body-metrics/measurements/{key}`, `/body-metrics/measurements/{key}` | CODE-ONLY | - |
| `src/features/weight/pages/MeasurementPage.tsx:120` | Delete entry confirm | delete | DELETE measurementByDate(key,date) | `DELETE measurementByDate` | CODE-ONLY | - |
| `src/features/weight/pages/VisualBodyFatPage.tsx:102` | VBF save | upsert | POST /body-metrics/visual-body-fat | `POST /body-metrics/visual-body-fat`, `/body-metrics/visual-body-fat` | CODE-ONLY | - |
| `src/features/weight/pages/VisualBodyFatPage.tsx:116` | Reference sheet | pick % (gender aware) | setPicked -> re-key sheet with value | state / UI only | CODE-ONLY | - |
| `src/features/weight/pages/VisualBodyFatPage.tsx:131` | Delete entry confirm | delete | DELETE visual-body-fat/{date} | `DELETE visual-body-fat/{date}` | CODE-ONLY | - |
| `src/features/weight/body-measurements.ts:2` | bodyMeasurement(key) callers vs accepted keys | every key resolves | Dashboard BodyMetricTiles TILE_KEY (18 keys + 'waist') all present in BODY_MEASUREMENTS | state / UI only | CODE-ONLY | - |
| `src/features/full-body/pages/FullBodyPage.tsx:34` | "+" Add metrics | open sheet today | open() -> FullBodyShortcutPage (new key) | state / UI only | CODE-ONLY | - |
| `src/features/full-body/components/FullBodyPage/FullBodyPills.tsx:23` | View All Metrics | /full-body/all | Link when >=1 day, else dim span | state / UI only | CODE-ONLY | - |
| `src/features/full-body/components/FullBodyPage/FullBodyPills.tsx:23` | Compare All Metrics | /full-body/compare | Link when >=2 days, else dim span | state / UI only | CODE-ONLY | - |
| `src/features/full-body/components/FullBodyPage/FullBodyList.tsx:63` | day row | open sheet for date | onOpen(date) -> initialDate | state / UI only | CODE-ONLY | - |
| `src/features/full-body/pages/AllMetricsPage.tsx:51` | Calendar icon | Select Date (data days only) | setCalendarOpen | state / UI only | CODE-ONLY | - |
| `src/features/full-body/components/FullBodyPage/MetricDateTabs.tsx:49` | date tab | select date | onChange(date) | state / UI only | CODE-ONLY | - |
| `src/features/full-body/components/FullBodyPage/SwipeArea.tsx:22` | horizontal swipe | prev/next date | onNext/onPrevious | state / UI only | CODE-ONLY | - |
| `src/features/full-body/pages/CompareMetricsPage.tsx:53` | Calendar icon | Select Date for active side | setCalendarOpen | state / UI only | CODE-ONLY | - |
| `src/features/full-body/components/FullBodyPage/FullBodyPills.tsx:57` | Compare from/to pills | choose side to edit | onActiveChange | state / UI only | CODE-ONLY | - |
| `src/features/full-body/pages/CompareMetricsPage.tsx:65` | date tabs + swipe | change active side date | select / step | state / UI only | CODE-ONLY | - |
| `src/features/period/pages/PeriodPage.tsx:77` | Back | previous | router.back() | state / UI only | CODE-ONLY | - |
| `src/features/period/pages/PeriodPage.tsx:86` | Calendar day | open day sheet | onSelect -> sheet.show(date); future days not buttons | state / UI only | CODE-ONLY | - |
| `src/features/period/pages/PeriodPage.tsx:93` | Calendar swipe | change month | step(next/prev) unbounded -> can swipe into future months | state / UI only | CODE-ONLY | Open (BROKEN) — see Open items |
| `src/features/period/pages/PeriodPage.tsx:97` | HabitControls (‹ › / month-year) | change month | goTo | state / UI only | CODE-ONLY | - |
| `src/features/period/components/PeriodHistoryList.tsx:34` | pencil per day | edit | onEdit(date) | state / UI only | CODE-ONLY | - |
| `src/features/period/components/PeriodDaySheet.tsx:73` | "Are you on your period?" switch | toggle | setIsOn | state / UI only | CODE-ONLY | - |
| `src/features/period/components/PeriodDaySheet.tsx:80` | Save | set day | PUT /periods/days/{date} {isOnPeriod} | `PUT /periods/days/{date}`, `/periods/days/{date}` | CODE-ONLY | - |
| `src/features/period/components/PeriodDaySheet.tsx:49` | Delete (trash) | unmark day | disabled if untracked; ConfirmDialog -> DELETE /periods/days/{date} | `DELETE /periods/days/{date}`, `/periods/days/{date}` | CODE-ONLY | - |
| `src/features/steps/pages/StepsPage.tsx:85` | "+" Add steps | open sheet today | openSheet(today) | state / UI only | CODE-ONLY | - |
| `src/features/steps/pages/StepsPage.tsx:122` | Expand chart | expand | ExpandButton | state / UI only | CODE-ONLY | - |
| `src/features/steps/components/StepsChart.tsx:87` | chart tap/drag | select bar / pan | pick + pan | state / UI only | CODE-ONLY | - |
| `src/features/steps/pages/StepsPage.tsx:141` | RangeBar | range/averaging | setRange/setAveraging | state / UI only | CODE-ONLY | - |
| `src/features/steps/pages/StepsPage.tsx:155` | Tutorial | dismiss | setTutorial('hidden') | state / UI only | CODE-ONLY | - |
| `src/features/steps/components/StepsHistoryList.tsx:56` | pencil per day | edit | onEdit(date) | state / UI only | CODE-ONLY | - |
| `src/features/steps/pages/StepsPage.tsx:185` | Steps sheet Save | upsert | POST /steps {logDate, steps} | `POST /steps`, `/steps` | CODE-ONLY | - |
| `src/features/steps/pages/StepsPage.tsx:206` | Delete steps confirm | delete | DELETE /steps/{date} | `DELETE /steps/{date}`, `/steps/{date}` | CODE-ONLY | - |
| `src/features/progress-photos/pages/ProgressPhotosPage.tsx:86` | "+" Add photos | open sheet today | open() -> PhotoSessionSheet | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/ProgressPhotosPage.tsx:96` | Open Gallery pill | /progress-photos/gallery | Link when >=1 session else dim | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/ProgressPhotosPage.tsx:99` | Compare Before & After pill | /progress-photos/compare | Link when >=2 sessions else dim | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/components/SessionRow.tsx:27` | session row | open gallery at that day | Link `?date=${date}` only; Gallery defaults angle=Front and filters timeline to sessions WITH Front -> a Side/Back-only day opens on a different (nearest earlier) date | state / UI only | CODE-ONLY | Fixed — (was BROKEN) |
| `src/features/progress-photos/components/SessionRow.tsx:51` | pencil | edit day | onEdit -> open(date) | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/components/PhotoSessionSheet.tsx:248` | Date title ▾ | Select Date | SelectDateSheet -> onDateChange | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/components/PhotoSessionSheet.tsx:263` | Delete (trash) | delete day | onDelete -> page ConfirmDialog -> DELETE /progress-photos?date | `DELETE /progress-photos?date`, `/progress-photos?date` | CODE-ONLY | - |
| `src/features/progress-photos/components/PhotoSessionSheet.tsx:76` | pose slot | add/replace -> crop | file input -> choose -> CropPhotoScreen | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/components/PhotoSessionSheet.tsx:99` | X remove angle | mark removal | clear(angle) -> removals on Save | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/components/PhotoSessionSheet.tsx:194` | consent checkbox | consent | setConsent | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/components/PhotoSessionSheet.tsx:203` | Save | upload + remove | PUT per angle, DELETE ?date&angle per removal | `PUT per`, `DELETE ?date&angle` | CODE-ONLY | - |
| `src/features/progress-photos/components/CropPhotoScreen.tsx:151` | pan / pinch | crop | pointer handlers -> update | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/components/CropPhotoScreen.tsx:210` | Cancel crop | close crop | dismiss | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/components/CropPhotoScreen.tsx:65` | Escape key | close crop only | window keydown -> dismiss; parent Radix Dialog also handles Escape (may close the whole sheet) | state / UI only | UNKNOWN | UNKNOWN — needs MF reference |
| `src/features/progress-photos/components/CropPhotoScreen.tsx:220` | Rotate left | rotate | update turns-1 | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/components/CropPhotoScreen.tsx:229` | Reset | reset crop | setState(START) | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/components/CropPhotoScreen.tsx:238` | Rotate right | rotate | update turns+1 | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/components/CropPhotoScreen.tsx:249` | Use this crop | confirm | renderCrop -> onConfirm(blob) | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/ProgressPhotosPage.tsx:175` | Delete these photos confirm | delete day | DELETE /progress-photos?date (toast on error) | `DELETE /progress-photos?date`, `/progress-photos?date` | CODE-ONLY | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:105` | ?date / ?angle params | open at date/angle | useSearchParams date + parseAngle(angle, default Front) | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:191` | Back | previous | router.back() | state / UI only | CODE-ONLY (parentRoute asserted in check-routes.mjs) | Fixed (phase 2) — was UNKNOWN: Back with no history did nothing; now goBack() → nearest existing parent route |
| `src/features/progress-photos/pages/GalleryPage.tsx:200` | Front/Side/Back tabs | change angle | setAngle | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:239` | photo swipe | prev/next date | go(-1/1) | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:318` | thumbnail strip | jump to date | jump(position) | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:350` | Share | share/download photo | navigator.share or download | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:359` | Previous date | go back | go(-1) | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:368` | Hide/Show details | toggle | setCompact | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:378` | Next date | go forward | go(1) | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:387` | Edit photos | edit current day | edit(session.date) -> PhotoSessionSheet | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:220` | Add photos (empty angle) | open add sheet | edit() | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/GalleryPage.tsx:428` | Delete confirm | delete day | DELETE /progress-photos?date | `DELETE /progress-photos?date`, `/progress-photos?date` | CODE-ONLY | - |
| `src/features/progress-photos/pages/ComparePage.tsx:157` | Back | previous | router.back() | state / UI only | CODE-ONLY (parentRoute asserted in check-routes.mjs) | Fixed (phase 2) — was UNKNOWN: Back with no history did nothing; now goBack() → nearest existing parent route |
| `src/features/progress-photos/pages/ComparePage.tsx:171` | Angle switch | change angle | setAngle | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/ComparePage.tsx:195` | Before / After pickers | choose date | pick.show(slot) -> ChoiceSheet -> setChosen | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/ComparePage.tsx:217` | Side by side / Slider | change mode | setMode | state / UI only | CODE-ONLY | - |
| `src/features/progress-photos/pages/ComparePage.tsx:109` | slider range input | reveal split | setSplit | state / UI only | CODE-ONLY | - |
| `src/features/dashboard/components/DashboardPage/SubPageHeader (used by every subpage in scope)` | Back | return to parent | router.back() default | state / UI only | CODE-ONLY (parentRoute asserted in check-routes.mjs) | Fixed (phase 2) — was UNKNOWN: Back with no history did nothing; now goBack() → nearest existing parent route |
