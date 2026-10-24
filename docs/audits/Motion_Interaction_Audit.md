# Motion, Interaction & UI/UX Audit — MacroOS FE

**Date:** 2026-10-23

**Type:** AUDIT + REPORT ONLY.
- No source file was edited.
- Nothing was committed.
- No login and no mutation against the API (`https://localhost:7000` points at production).

**Scope:** `FE/src/**`: every route, layout, feature component, shared component, UI primitive, hook, and the motion CSS.

**Method:**
1. Read the code of every area in four area audits. Their full reports are the appendices:
   - A: Dashboard + Analytics
   - B: Nutrition
   - C: Strategy + Onboarding
   - D: Shell, shared primitives and Other screens
2. Re-checked the highest-severity findings by hand. One finding (SH-3) was rejected.
3. Checked the public pages on `http://localhost:3000` in a browser at 320, 375, 390, 430, 768 and 1280 px.

**Rules applied:** `FE/docs/UI.md` and `FE/.rules`. `docs/TIEU-CHUAN-UI.md` was ignored.

> **There is no MacroFactor (MF) motion evidence.**
>
> `Docs/MacroFactor_UI/**` holds 292 files and **0 videos or GIFs**. I searched the whole repo for `*.mp4 *.mov *.webm *.gif`, excluding `node_modules` and the backend. Every screenshot is static. As a result:
>
> - Every "Motion vs MF" rating in this report is **UNKNOWN**.
> - No animation is claimed to match MacroFactor.
> - Motion findings are internal bugs only: the animation doesn't run, has the wrong timing, is janky, leaks, or ignores reduced motion. None of them says "differs from MF".
>
> Rating motion against MF needs screen recordings from the user (question 1 in §10).

---

## 0. Totals

| | Critical | High | Medium | Low | Info | Total |
|---|---|---|---|---|---|---|
| A. Dashboard + Analytics (DA-*) | 0 | 1 | 9 | 24 | 0 | 34 |
| B. Nutrition (NU-*) | 0 | 2 | 18 | 15 | 0 | 35 |
| C. Strategy + Onboarding (ST-*, ON-*) | 0 | 0 | 8 | 26 | 1 | 35 |
| D. Shell + primitives + Other (SH-*, OT-*) | 0 | 3 | 10 | 24 | 1 | 38 (SH-3 rejected) |
| X. Cross-cutting / browser (this file, §7) | 0 | 0 | 1 | 3 | 1 | 5 |
| **Total** | **0** | **6** | **46** | **92** | **3** | **147** |

About 100 issues are **safe technical fixes** (bugs). About 47 **need the user's UX decision**. Every issue row in the appendices is tagged `SAFE-FIX` or `UX-DECISION`.

Some findings share one root cause, so one fix in a shared place closes several IDs at once (see §6):

| Root cause | IDs it closes |
|---|---|
| No global reduced-motion rule | NU-1 and SH-4 (same issue), DA-14, ON-13, ON-14, ON-18, NU-21 |
| Raw colours in the light theme | DA-23, SH-5, OT-4, NU-23 |
| Sheet drag handle that doesn't drag | SH-6, NU-26 |
| No motion tokens | SH-13, NU-24 |
| Bars animating `width` instead of transform | DA-16, NU-16 |

**What was verified:**
- I re-read the code myself for DA-6, NU-1, NU-2, SH-1, OT-1, ST-1 and ON-8. Each one is confirmed.
- **SH-3 (open redirect after login) is REJECTED.** `safeRedirect` (`features/auth/auth.utils.ts:40-43`) already rejects anything that does not start with a single `/`, and both call sites use it.
- Everything else comes from the area audits' code reading, with a file:line for each claim.
- Runtime behaviour still needs to be clicked through using the lists in §9.

---

## 1. Inventory

### 1.1 Routes (`src/app/**`)

The app has:
- **57 route pages**
- **3 layouts**
- **1 `loading.tsx`**
- **1 `manifest.ts`**
- **1 root `page.tsx`**, which redirects to `/login` when logged out

| Group | Count | Routes |
|---|---|---|
| `(auth)` | 5 | login, register, forgot-password, reset-password, confirm-email |
| `(onboarding)` | 1 + layout | onboarding |
| Dashboard (`(protected)`) | 12 | dashboard, customize, energy-balance, expenditure, goal-progress, insights, macros, nutrition, nutrition/[nutrient], …/goals, …/summary, weight-trend |
| Food log / foods / recipes (`(protected)`) | 9 | food-log, nutrition-overview, settings (+ logger-banner, logger-tiles, timeline-tiles), foods, foods/new, recipes/new |
| Strategy (`(protected)`) | 7 | program, program/new, program/new/[step], program/goal/edit, …/[step], program/check-in, …/[module] |
| Body / analytics (`(protected)`) | 13 | weight, body-fat, body-metrics/[metric], steps, period, habits/food-logging, habits/weigh-in, full-body, full-body/all, full-body/compare, progress-photos (+ gallery, compare) |
| Other (`(protected)`) | 7 | more, more/expenditure, more/expenditure/bmr, more/tutorials, profile, shortcuts, nutrition-data |

What each layout does:
- **Root `app/layout.tsx`:** providers, `NextTopLoader`, theme.
- **`(onboarding)/layout.tsx`:** onboarding wrapper.
- **`(protected)/layout.tsx`:** AuthGuard → TimeZoneGate → OnboardingGuard, then the header and sidebar, `PageTransition key={pathname}`, `MobileTabBar` and `ShortcutSheetsPage`. Routes under six "full-screen" prefixes skip the shell and the transition.

### 1.2 Source files

- 656 `.ts`/`.tsx`/`.css` files under `src`.
- `components/shared` has 33 files and `components/ui` has 61.
- There are 19 feature folders.
- Motion CSS lives in `src/app/index.css` (5 custom keyframes), plus `tw-animate-css` 1.4.0 and `shadcn/tailwind.css`.

### 1.3 Shared UI primitives

Counts are instances outside `components/ui`.

| Primitive | Count | Built on | Motion |
|---|---|---|---|
| `SheetFrame` bottom sheet | 36 in 32 files | Radix Dialog (`ui/dialog`) | Phone: slides up from the bottom and fades in, 300ms. ≥sm: zooms from 95% and fades in, 250ms. Overlay fades in 100ms. **No reduced-motion guard.** Shows a drag handle, but dragging does nothing (SH-6) |
| `PickerSheet` / `ChoiceSheet` / raw `Dialog` | 11 / 5 / 10 | Radix Dialog | Same as `SheetFrame` |
| `ConfirmDialog` / AlertDialog | 16 | Radix AlertDialog | Fade + zoom, 100ms. Not wired to the Back button (SH-2) |
| Tabs (`ui/tabs`) | 3 | Radix | Colour change only. 36px tall |
| Custom tab lists / segmented controls (RangeBar, UnderlineTabs, RangeTabs, SlidingSwitch, MetricDateTabs, Gallery AngleTabs) | 6 kinds | Hand-rolled | Indicator slides via `transform`, 300ms, respects `motion-reduce` |
| ToggleGroup / ChoiceGroup | 10 | Radix | Colour change only |
| Carousels: DashboardCarousel, FeatureCarouselStep, MacroSummary pager, WeekStrip (none use embla) | 4 | Native scroll-snap | Smooth `scrollTo`, which mostly ignores reduced motion |
| Charts (`ui/chart`/recharts has 0 consumers) | About 20 custom SVG charts | `features/dashboard/chart/*` | Draw / rise / grow keyframes, requestAnimationFrame tween, pan with inertia |
| Progress bars: `NutrientGoalBar`, `MacroSummary`, `AddFoodProgress`, `WeekMatrix`, wizard bar (`ui/progress` has 0 consumers) | 5 | divs | `bar-grow` (a `width` keyframe) + `transition-[width]` 500ms |
| Rings / dials: DayPill ring, ImpactRings, DailyNutrition arc, CheckInDial | 4 | SVG stroke | `ring-fill` 700ms + `stroke-dashoffset` transition |
| Buttons | `Button` 104, `IconButton` 18 | cva | `transition-all` 150ms. Shrinks to 97% when pressed on touch |
| Forms | 23 `<form>`, 33 `FormField` | react-hook-form + zod | None |
| Skeleton | 132 in 59 files | `animate-pulse` | **No** reduced-motion guard |
| Spinner (`Loader2 animate-spin`) | 50 | lucide | 2 of 50 guarded. Acceptable, since spinners are essential |
| `ErrorState` / `EmptyState` | 33 / 4 | — | — |
| Popover / Dropdown / Tooltip | 6 / 13 / 3 files | Radix | tw-animate fade + zoom, no guard |
| `CollapseItem` + `useExitingList` | 7 | `grid-template-rows` | Rows animate 0fr↔1fr and fade, 300ms, guarded |
| `SwipeToDelete`, `WheelPicker`, `NumericKeypad`, `RulerSlider` | 4 / 11 / 9 / 2 | Hand-rolled | Translate, scroll-snap, press scale |
| Route transition | 1 `PageTransition` + `nextjs-toploader` | tw-animate | Fades in over 300ms. Pages deeper than the top level slide in from the right (100%). Back slides in from the left (25%). **No exit animation** |
| Toasts | 1 | sonner | Built-in |
| Unused primitives | vaul drawer, embla carousel, ui/sheet, select, accordion, collapsible, progress, chart, spinner, calendar, combobox, command | — | Dead code (SH-24) |

---

## 2. Animation architecture

### Libraries
- No JavaScript animation library (no framer-motion or motion).
- Motion comes from four sources:
  - Tailwind v4 transitions.
  - `tw-animate-css` enter/exit utilities.
  - 5 custom keyframes in `index.css:91-141`: `ring-fill`, `chart-draw`, `chart-rise`, `chart-grow`, `bar-grow`.
  - Hand-written requestAnimationFrame loops in 13 files: `use-tween`, `use-chart-pan`, `use-flip`, `use-back-to-close`, `use-scroll-hidden`, `use-keyboard-inset`, `KeyboardViewport`, `QuantityBar`, `CompareSections`, `RulerSlider`, `WizardShell`, `IncompleteDaysChart`, `CheckInDial`.

### Validity
- Every `animate-*` and tw-animate class in `src` resolves to a real keyframe or utility, so there are no dead classes (Appendix D §b).
- Some classes have no effect on what they target. For example (ST-1), `animation-duration-700` is set on a CSS *transition*, so the transition runs at Tailwind's 150ms default instead of 700ms.

### Motion tokens
There are none: `@theme` defines no `--ease-*` or `--duration-*`.

Durations in use (9 different values):

| Duration | 300ms | 200ms | 100ms | 500ms | 400ms | 150ms | 700ms | 250ms | 1000ms |
|---|---|---|---|---|---|---|---|---|---|
| Uses | 130 | 115 | 44 | 23 | 15 | 8 | 4 | 1 | 1 |

Other inconsistencies:
- **Easings:** `ease-out` 53 times, plus 4 different inline `cubic-bezier` curves.
- **Duplicated easing code:** the same ease-out-cubic formula `1-(1-t)^3` is written separately in `use-tween.ts:20`, `use-chart-pan.ts:65`, `CompareSections`, `QuantityBar` and `CheckInDial`. `use-flip.ts:32` uses a different bezier.
- **Wrong duration utility:** 36 `animate-in` sites use `duration-*`, but UI.md:92 asks for `animation-duration-*`. They still work through tw-animate's `--tw-duration` fallback (SH-13, NU-24).
- **Stagger steps** are ad hoc: 12, 40, 45, 60, 70, 80, 110, 120 and 140 ms.

### Reduced motion
**Feature code is mostly disciplined:**
- 531 `motion-safe:` and 137 `motion-reduce:` prefixes.
- All 21 uses of the custom keyframes are guarded.

**The gaps are in shared code:**
- **There is no global `@media (prefers-reduced-motion: reduce)` rule.**
- Every Radix primitive (dialog, alert-dialog, popover, dropdown, tooltip, select, sheet) runs its animations unguarded: 21 `animate-in` and 21 `animate-out`.
- The skeleton pulse is unguarded (132 instances).
- JavaScript motion ignores the setting in several places:
  - chart pan inertia and snap;
  - smooth `scrollTo` in the carousels, tutorial pager and chat;
  - a few transitions without `motion-reduce:transition-none`.
- Only 9 places check `matchMedia('(prefers-reduced-motion: reduce)')`.

The in-app browser pane used for this audit itself reports `prefers-reduced-motion: reduce`, so no motion could be observed there.

### Performance: transform/opacity vs layout properties
Most entrance motion uses transform/opacity, which is cheap. Animating layout properties, which forces reflow every frame, is still common:
- the `bar-grow` keyframe (`width`);
- `transition-[width]` ×9;
- `grid-template-rows` ×13;
- `flex-grow` ×4;
- `height` (WeekMatrix, `AnimatedHeight`);
- `left,width`, `margin`, `padding,gap`, `font-size`;
- 11 `transition-all`, including the `Button` base;
- `useChartExpand`, which tweens the SVG height through React state, so the whole chart re-renders every frame for 400ms (X-2).

Each case is small. On low-end phones, the likeliest to stutter are:
- NU-15: the Add Food plate toggle re-lays out the whole sheet.
- WeekMatrix and NutrientGoalBar.

### Hydration
No mismatch was found:
- `today` is only read after `useIsClient`.
- `useLocalStorage` has a server snapshot.
- `PageTransition`'s module-level `goingBack` is `false` on the server and on the first client render.

Two after-mount changes cause visible jumps:
- **Sidebar (SH-21):** on desktop reload, a collapsed sidebar renders expanded first, then animates closed.
- **`useIsMobile`:** it flips after mount, so `SearchableSelect` swaps from a popover to a sheet.

### Leaks
- **One real leak (OT-1):** `CropPhotoScreen` creates a new `ResizeObserver` on every render and never disconnects it.
- **Minor:** the requestAnimationFrame in `use-flip` is not cancelled on unmount, nor is the one in `KeyboardViewport`'s focusin handler; AI photo object URLs can leak (NU-32).
- **Clean:** every other animation frame, timer and listener, including the camera scanner.

### Route transitions
`PageTransition.tsx` is mounted at `(protected)/layout.tsx:59`. It has an enter animation only and is keyed by pathname: the old page vanishes instantly, and the new one fades in (or slides in, for deeper pages). Back detection uses the Navigation API or `popstate`, and it works.

Problems:
- **SH-1, fixed bars jump on every navigation.** tw-animate's `enter` keyframe always sets `transform` and `filter`. For 300ms, every `position:fixed` child is positioned against the animating wrapper instead of the screen. Affected:
  - the dashboard search bar
  - the food-log selection bar
  - the recipe editor bar
  - the profile save bar
- **SH-14:** the full-screen flows (program/new, goal/edit, check-in, shortcuts, gallery) have no route transition at all.
- **SH-15:** with `loading.tsx`, the enter animation plays on the skeleton and the real page then pops in.
- **ST-3 / ST-4:** the wizards that use one route per step don't reset the slide direction on entry, and their in-app Back uses `router.push`.

---

## 3. Charts (priority area)

The shared chart code in `features/dashboard/chart/` (`use-chart-pan`, `use-tween`, `use-chart-expand`, `geometry`, `ChartAxes`) is well factored and is used by 8 pannable detail charts. Details are in Appendix A; below is the summary, with a few findings of my own (X-*).

| Concern | Finding | IDs |
|---|---|---|
| **First render** | Line charts draw themselves in (`chart-draw`, 700ms) and dashboard tile bars rise. Bars on detail pages (Energy Balance, Macros, Nutrient, Steps, Waterfall, the Energy Balance card) only fade the chart in at 50%, which is inconsistent. `chart-draw` keeps `stroke-dasharray:1` after it finishes (fill mode `both`); if a WebKit build ignores `pathLength`, lines stay dashed (needs checking on iOS). `MiniArea` squashes its strokes because it scales horizontally | DA-11, DA-3, DA-17 |
| **Data update** | Range and averaging data come from one all-history query keyed by `today`, so switching the range does **not** refetch. This is good, and I verified it in the `use-*-detail.ts` query keys. While the backend recalculates after a log ("Updating"), four detail pages swap the whole body for an `h-96` skeleton: the chart unmounts, the selection is lost and the page jumps. Line paths swap instantly when new data arrives, with no morph. The Daily Nutrition arc mounts at its final value, so going from 0 to a value jumps. Goal Progress bars snap on a tab switch, even though the code comment says they glide | DA-7, DA-15, DA-8 |
| **Range 1W…All and D/W/M** | The X-axis slot count and the Y min/max tween over 400ms (`useTween`), and that works. Axis ticks pop in and out because they are keyed by value. Switching D/W/M remounts the chart with `key={averaging}` and fades it in, which is intentional. **Macros detail** briefly shows stale or wrong buckets under the new D/W/M label, because `keepPreviousData` keeps data from a different granularity; it also sends one summary request per day crossed while panning. Detail queries include `today` with no placeholder data, so after midnight every chart drops to a skeleton | DA-13, DA-4, DA-5, DA-33 |
| **Expand / collapse** | Height tweens via `useTween`. It is measured to the top of the bottom nav (`[data-bottom-nav]`) minus the range-bar footer, and re-measured on window resize, `visualViewport` changes and ResizeObserver. There is no scroll lock: the page still scrolls, by design. It does not re-measure when content *above* the chart changes height, so the footer can overlap the tab bar again, as in our earlier bug capture `Nutrient_Detail/00_ours_expanded_overlap.png`. The tween re-renders the chart on every frame (X-2) | DA-26, X-2 |
| **Touch, hover, selection, pan** | What works: pointer capture starts only after 6px of horizontal movement; `touch-pan-y`; inertia plus a 180ms snap; the animation frame is cancelled on unmount and on a new pointerdown. Bugs: (1) on desktop, releasing the mouse outside the chart leaves the drag stuck on. (2) After a range switch shrinks `maxPos`, `posRef` is not clamped, so the next drag has a dead zone. (3) In W/M averaging, a tap only hits the bucket's start day, so 6 of 7 taps miss. (4) A line that is mounted conditionally replays its draw-in while panning across gaps. (5) Inertia ignores reduced motion. (6) `onPointerCancel` reuses `onPointerUp`, so a cancelled gesture can still coast (X-3) | DA-1, DA-2, DA-9, DA-12, DA-14, X-3 |
| **Macros detail crash** | `series.days[0].date` is read without a length check (`MacrosDetailPage.tsx:52`), so a new account whose series returns `days: []` throws | DA-6 (High; depends on the backend contract) |

**Progress bars** (NutrientGoalBar, MacroSummary, AddFoodProgress, WeekMatrix, DailyNutrition):

What works:
- Bars fill from 0 on mount (`bar-grow`).
- On change, they move **from the previous value** (`transition-[width]`, 500ms).
- The target tick and target zone fade in.
- The over-ceiling segment uses `bg-destructive`.
- In WeekMatrix, switching Consumed↔Remaining glides over 400ms and the cap follows.

Gaps:
- **NU-4:** switching range on Nutrition Overview resets every bar to 0. The content remounts (`key={range}`) and the query has no placeholder data.
- **NU-18, DA-15:** the DayPill ring and MacroSummary show no over-target cue. MF's over-target look is UNKNOWN.
- **DA-16, NU-16:** bars animate `width` and `height` instead of a transform.

---

## 4. Loading, empty and error states

| Pattern | Where | IDs |
|---|---|---|
| Skeleton never ends (query is disabled but code checks `isPending`) | Nutrition "See All" when the user has no program | DA-24 |
| An error replaces the whole page, with no way out | Food Log day error, Nutrition Overview | NU-2 |
| An error is shown as "No matching results" | Food search, Library | NU-6 |
| Failures with no message | Note swipe-delete, Nutrition Data delete, AI-chat TDEE | NU-9, NU-13, ON-15 |
| Layout shift while loading | Food Log day switch; Nutrition Overview range; Strategy skeleton vs the CHECK IN button; cold start (a desktop sidebar skeleton on a phone, then a blank screen, then the page); blank Login page in the server render; Habits year switch; detail pages while "Updating" | NU-3, NU-4, ST-8, SH-8, SH-9, DA-21, DA-7 |
| 0 or "—" flashes before data loads | Period "Last Period Duration", Compare count-up, Progress Photos thumbnails | DA-22, OT-7, OT-6 |
| Old data shown as current, with no cue | Macros W/M buckets and stats, Goal preview cards | DA-4, DA-5, ON-17 |
| Chart remounts when data refetches | Detail pages while "Updating"; entry sheets keyed by `dataUpdatedAt` | DA-7, DA-19 |
| Good patterns to reuse | Dashboard tiles keep their size while loading. The Food Log header uses week data, so there's no 0-flash. Food search shows a skeleton instead of the previous keyword's results. Every known error path has a Retry | — |

---

## 5. Browser checks (public pages, no login)

**What was run:**
- Pages: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/confirm-email`.
- Each page was loaded in a same-origin iframe at exactly 320, 375, 390, 430, 768 and 1280 px (36 combinations).
- Each combination was checked for horizontal overflow, visible controls smaller than 44×44, and inputs with a font size under 16px.
- One screenshot was taken at 375×812 in the dark theme.

**Results:**
- **No horizontal overflow** at any width on any page.
- `/` redirects to `/login` when logged out.
- On every phone width, inputs are 16px and buttons are at least 48px tall.
- **Text links are too small at every width:** "Forgot password?" is 100×16 and "Back to log in" is 88×18 on 4 pages (SH-23 and X-1).
- **Tablet (768) and desktop (1280) use the `md:` desktop sizing:** inputs are 32–40px tall with 12px text, and the password eye button is 32×32. That's fine for a mouse, but **iPad portrait (768px) is a touch screen**, so the targets are under 44px and iOS will zoom in when an input is focused (X-4, needs a UX decision).
- **Motion could not be observed.** The browser pane reports `prefers-reduced-motion: reduce`, and the auth pages sit outside `PageTransition`. Their only motion is button spinners.
- **Logged-in screens were not opened,** since logging in was not allowed. They rely on code reading and the click-through lists in §9.

---

## 6. Root-cause fixes (recommended order)

Each item below is a few lines in one shared place and closes many IDs.

1. **Global reduced motion.**
   - Add one rule in `index.css`:
     ```css
     @media (prefers-reduced-motion: reduce) {
       *, ::before, ::after {
         animation-duration: 1ms !important;
         animation-iteration-count: 1 !important;
         transition-duration: 0s !important;
         scroll-behavior: auto !important;
       }
     }
     ```
   - Add a small `prefersReducedMotion()` helper for JavaScript `scrollTo` and chart inertia.
   - Closes NU-1, SH-4, DA-14, ON-13, ON-14, ON-18, NU-21, and part of NU-16.
   - Trade-off: spinners still show, but frozen. Exempt `animate-spin` if that's not wanted.
2. **SH-1, fixed bars jumping during page transitions.** Either portal the fixed bars to `document.body`, or give top-level pages an opacity-only keyframe.
3. **`useChartPan` (DA-1, DA-2, X-3),** all in one file:
   - Ignore pointer moves when `buttons === 0` (no button held).
   - Clamp `posRef` when `maxPos` shrinks.
   - Don't coast on `pointercancel`.
4. **W/M tap hit-test (DA-9).** Move the nearest-point picking from `MetricChart.tsx:80-88` into `chart/geometry.ts` and use it in all six charts.
5. **Loading flags and page-level errors (DA-24, NU-2).**
   - Use `isLoading` instead of `isPending` for queries that can be disabled.
   - Keep the header and navigation, and put the inline `ErrorState` only in the content area.
6. **Light-theme colour tokens:** DA-23, SH-5, OT-4, NU-23, and OT-5 (fallback background).
7. **Sheets:**
   - Use `useSheet` instead of `{cond && <Sheet/>}`, so close animations run (OT-3, NU-28).
   - Wire `ConfirmDialog` to `useBackToClose` (SH-2).
   - Portal the crop screen to `document.body` (OT-2).
   - Fix the crop screen's `ResizeObserver` leak (OT-1).
8. **One- or two-line fixes:**
   - CheckInDial: `duration-700` instead of `animation-duration-700` (ST-1).
   - %BW input: keep the typed text as a draft (ON-8).
   - Disable Back while a save is pending (ON-1).
   - Reset the flow direction when entering a flow (ST-3).
9. **Motion tokens (SH-13):**
   - Add `--duration-micro/list/dialog/drawer` and `--ease-mf-out` to `@theme`.
   - Export one shared `easeOutCubic` from `chart/use-tween.ts` for the other files to use.
   - Do this only after the user confirms the timing scale (question 3 in §10).

---

## 7. Cross-cutting issues found in this pass (X-*)

| ID | Page / component | file:line | Current behaviour | MF ref | Gap | Sev | Proposed fix | Test plan | Type |
|---|---|---|---|---|---|---|---|---|---|
| X-1 | Auth "Back to log in" link | `features/auth/components/AuthAltAction.tsx` (forgot / reset / confirm pages) | Measured 88×18 px at every width | none | Touch target under 44px (same family as SH-23) | Low | `inline-flex min-h-11 items-center`, or a `before:` hit area | In the browser, the link measures at least 44px tall at 375px | SAFE-FIX |
| X-2 | Chart expand tween | `features/dashboard/chart/use-chart-expand.tsx:127`, `use-tween.ts:21` | The height tween calls React `setState` on every animation frame, so the whole SVG chart (axes and all points) re-renders each frame for 400ms | none | Possible dropped frames on long histories (All range) | Low | Tween a CSS `height` on the wrapper and let the SVG `viewBox` scale, or render at the target height and animate `transform: scaleY` on the wrapper | Performance panel with 4× CPU throttle, Weight Trend All → Expand: every frame under 16ms | SAFE-FIX |
| X-3 | Chart pan cancel | `use-chart-pan.ts:152` | `onPointerCancel: onPointerUp`, so when the browser cancels a gesture (OS edge swipe, scroll takeover), the computed velocity can still start `coast()` | none | The chart keeps sliding after a cancelled gesture | Low | On cancel: `g.down=false; setDragging(false); snap()`, with no coast | Touch device: start a horizontal pan, then trigger the iOS back-swipe from the edge; the chart must not keep sliding | SAFE-FIX |
| X-4 | Tablet sizing (all forms and buttons) | `components/ui/input.tsx`, `button.tsx` (`md:` shrink); seen on /login, /register, /reset-password at 768px | At 768px, inputs are 32–40px tall with 12px text, and the password eye button is 32×32 | none | iPad portrait is touch: targets are under 44px, and iOS zooms in on focus below 16px | Medium | Base the shrink on `@media (pointer:fine)` instead of screen width, or move it to `lg:` | iPad or 768px touch emulation: inputs at least 44px tall with 16px text; desktop unchanged | UX-DECISION |
| X-5 | Process: MF motion references | `Docs/MacroFactor_UI/**` | 292 static files, 0 videos | — | Motion cannot be validated against MF | Info | The user records MF screen videos of: tab switch, page push/pop, sheet open/close, chart range switch / expand / pan, Weekly Nutrition Consumed↔Remaining, food log add/delete, check-in dial | — | UX-DECISION |

---

## 8. Per-screen fidelity summary

How to read this table:
- Ratings are MATCHED / PARTIAL / MISSING / BROKEN / UNKNOWN.
- MATCHED is used only where an auditor opened and compared the named MF file.
- **Motion vs MF is UNKNOWN on every screen**, because there is no video. The note in brackets describes the motion's internal state.
- The full tables, with the MF file behind each cell, are in Appendix A §c, B §c, C §c and D §d.

| Area / screen | Visual | Interaction | Motion (internal) | Data | Responsive | MF ref used |
|---|---|---|---|---|---|---|
| Dashboard: Weekly Nutrition | MATCHED | MATCHED | UNKNOWN (works) | PARTIAL | PARTIAL | `UI/Dashboard/Weekly_Nutrition/03_mf_consumed_data.png` |
| Dashboard: Daily Nutrition | MATCHED (zero state) | PARTIAL | UNKNOWN (arc doesn't fill on mount) | PARTIAL | UNKNOWN | `Daily_Nutrition/5.png` |
| Dashboard: Energy Balance card | PARTIAL | PARTIAL | UNKNOWN (no motion) | PARTIAL | UNKNOWN | `Energy_Balance_v2/01_mf_expenditure_tab.png` |
| Dashboard: Insights, Steps & Period, and Body Metric tiles | PARTIAL | PARTIAL | UNKNOWN (works; press scale snaps) | PARTIAL | PARTIAL | `Daily_Nutrition/5.png` |
| Dashboard: Macros detail | UNKNOWN | PARTIAL | UNKNOWN (stale-data flash) | **BROKEN risk** (DA-6) | PARTIAL | none opened |
| Dashboard: Goal Progress | PARTIAL | PARTIAL | UNKNOWN (bars snap) | PARTIAL | PARTIAL | `Energy_Balance_v2/07_goal_progress_expand_button.png` |
| Nutrition See All | UNKNOWN | PARTIAL | UNKNOWN | **BROKEN** without a program (DA-24) | UNKNOWN | — |
| Analytics: Weight Trend | MATCHED | PARTIAL | UNKNOWN | PARTIAL | PARTIAL | `Weight_Trend/02_mf_week_scale_vs_trend.png` |
| Analytics: Expenditure | PARTIAL (no Flux band) | PARTIAL | UNKNOWN | PARTIAL | PARTIAL | `Expenditure/2-chart-expanded.png` |
| Analytics: Energy Balance | PARTIAL | PARTIAL | UNKNOWN | PARTIAL | PARTIAL | `Energy_Balance_v2/01_mf_expenditure_tab.png` |
| Analytics: Scale Weight / Body Measurements | PARTIAL | PARTIAL | UNKNOWN | PARTIAL | PARTIAL | `Body_Metrics/03_scale_weight_fit_data.png` |
| Analytics: Nutrient detail / history | PARTIAL | PARTIAL | UNKNOWN | PARTIAL | PARTIAL | `Nutrient_Detail/16_mf_expanded_fits_viewport.png` |
| Steps / Period | MATCHED | PARTIAL | UNKNOWN | PARTIAL | PARTIAL | `Steps/03_data_week_panned.png`, `Period/01_calendar_month.png` |
| Food Log: header, week strip, timeline | PARTIAL | PARTIAL | UNKNOWN (works) | **BROKEN** on error (NU-2) | PARTIAL | `Food_Log/1-timeline-consumed.png`, `Day_Strip/*` |
| Add Food: search, detail, plate | PARTIAL | PARTIAL (Back closes the whole sheet) | UNKNOWN (animates layout properties) | PARTIAL (errors shown as empty) | UNKNOWN | `Add_Flow/1…5`, `Search_Groups/*` |
| Calendar overlay | PARTIAL | **BROKEN** as a modal (NU-11) | UNKNOWN | PARTIAL | PARTIAL | `Day_Strip/1_mf_calendar_grid_rings.webp` |
| Scanner / AI / Quick Add | UNKNOWN | PARTIAL | UNKNOWN | PARTIAL (camera stays on behind the plate) | UNKNOWN | none in the set |
| Nutrition Overview / Goals / Data Manager | PARTIAL | PARTIAL | UNKNOWN (bars reset to 0) | PARTIAL | UNKNOWN | `Nutrition_Detail/11.png`, `Nutrition_Data_Manager/01-03` |
| Recipes / Create Food | PARTIAL / UNKNOWN | PARTIAL (no unsaved-changes guard) | UNKNOWN | PARTIAL | UNKNOWN | `Multi_Select/12-23` |
| Strategy: Program page (dial, 7-day chart, goal card, history) | UNKNOWN (no MF Strategy refs) | PARTIAL | UNKNOWN (dial runs 150ms instead of 700ms, ST-1) | PARTIAL | PARTIAL | none |
| Strategy: New Program wizard | UNKNOWN (review step PARTIAL) | PARTIAL | UNKNOWN (wrong slide direction on entry) | PARTIAL | PARTIAL | `Get_Started/Program/6.png`, `7.png` |
| Strategy: Edit Goal | UNKNOWN | **BROKEN** (%BW input, ON-8) | UNKNOWN | PARTIAL | PARTIAL | `Get_Started/Goal/2.png` |
| Strategy: Check-in hub / modules | UNKNOWN | PARTIAL | UNKNOWN | PARTIAL | PARTIAL | none |
| Onboarding | PARTIAL | PARTIAL (Goal target **BROKEN**, ON-8) | UNKNOWN (direction-aware slide works) | PARTIAL | PARTIAL | `Get_Started/Basic/1.png`, `Goal/2.png` |
| Bottom nav | PARTIAL | PARTIAL (no active tab on sub-pages) | UNKNOWN (no motion) | n/a | MATCHED (safe area, height) | `More/01_more_top.png`, `Full_Body/01_list.png` |
| More / Settings | PARTIAL | PARTIAL | UNKNOWN (close animation cut off, OT-3) | PARTIAL | PARTIAL | `More/01`, `More/04` |
| Profile | UNKNOWN | PARTIAL | UNKNOWN | PARTIAL | PARTIAL | none |
| Full Body | PARTIAL | PARTIAL | UNKNOWN | PARTIAL | PARTIAL | `Full_Body/01_list.png`, `09_compare_with_deltas.png` |
| Progress Photos | PARTIAL | **BROKEN** at ≥sm (crop, OT-2) | UNKNOWN | PARTIAL | **BROKEN** at ≥sm | `Progress_Photos/05`, `06_viewer_front.webp` |
| Auth (public) | UNKNOWN (no MF ref) | PARTIAL | UNKNOWN | PARTIAL | PARTIAL (tablet sizing X-4; small links) | none; checked in the browser |

---

## 9. What the user should click to confirm

Logged in, on a 375px-wide phone unless noted. These are the top 15; the full lists are in Appendix A §d, B §d, C §d and D §e.

1. **DA-6:** On a brand-new account with no food logs, open `/dashboard/macros`. Does it crash?
2. **NU-1 / SH-4:** Turn on the OS Reduce Motion setting and open Add Food and any sheet. Do they still slide or zoom? Do skeletons still pulse?
3. **NU-2:** Block `GET /food-logs/day` in DevTools. Can you still change the day on Food Log?
4. **SH-1:** Set DevTools Animations to 10% speed. Navigate Dashboard ↔ Food Log (with a selection active) and open `/recipes/new`. Do the fixed bottom bars jump?
5. **SH-2:** Full Body → Delete (confirm dialog open) → system Back. Does the sheet close underneath the confirm?
6. **OT-2:** On desktop (≥640px): Progress Photos → + → pick a photo. Is the crop screen trapped inside the dialog? Does Esc lose the photos already picked?
7. **DA-24:** On an account without a program, open `/dashboard/nutrition`. Do the tiles stay grey forever?
8. **DA-9:** Weight Trend → W → 1M, then tap mid-week. Does a tooltip appear?
9. **DA-1:** With a desktop mouse, press on a chart, drag outside it, release, then hover back over it. Does the chart pan by itself?
10. **DA-7:** Log a weight, then open Weight Trend while it is still updating. Does the page collapse and redraw?
11. **ST-1:** On the Strategy tab, does the check-in dial sweep over about 0.7s, or snap?
12. **ON-8:** In Onboarding Goal target and in Edit Goal, select the %BW box and type `0.45`. Does it accept the value?
13. **ST-3:** Finish Edit Goal, then tap New Program. Does the first step slide in from the left?
14. **DA-23 / SH-5 / OT-4:** In the light theme, check these are visible: the theme card and avatar on More, ChoiceSheet radios, the D▾ averaging sheet, the Period switch, and the Goal Progress status bar.
15. **NU-20:** On an iPhone, long-press a food on the timeline. Does an iOS callout appear?

---

## 10. Questions for the user

1. **MF motion reference.** Can you record short MF screen videos (or allow them to be taken) of:
   - switching tabs;
   - opening a page and going back;
   - opening, closing and dragging a sheet;
   - switching chart range, expanding and panning a chart;
   - the Weekly Nutrition toggle;
   - adding and deleting food;
   - the check-in dial?

   Without them, every motion rating stays UNKNOWN and we can only fix internal bugs.
2. **Reduced-motion policy.** Should one global rule turn off *all* animation, including spinners and the skeleton pulse (both would freeze)? Or should essential indicators keep moving?
3. **Timing scale.** UI.md says micro 150, list 200, dialog 250, drawer 300 ms. The code also uses 400, 500 and 700 ms.
   - Should this scale be fixed as tokens?
   - Is 400ms right for chart range tweens?
   - Is 700ms right for ring and line draws?
4. **Sheets (SH-6 / NU-26).** Should bottom sheets close on a downward swipe, by moving `SheetFrame` to vaul (already installed)? Or should the drag handle be removed?
5. **Route transitions (SH-14).** Should pages also animate out, like a native push/pop? Should the full-screen flows get transitions? Or is the current enter-only fade/slide fine?
6. **Bottom nav on sub-pages (SH-7).** Should the parent tab stay highlighted, as in `Full_Body/01_list.png`? For example, Dashboard for Full Body, Progress Photos and Weight, and More for Profile.
7. **"Updating" state (DA-7, NU-3).** On detail charts, should the old chart stay visible but dimmed, with an "Updating…" badge, instead of the h-96 skeleton? Same question for switching days on Food Log.
8. **Tablet at 768px (X-4).** Phone-size touch targets on iPad, or keep the current desktop sizing?
9. **Remaining UX decisions from the appendices:**
   - DA-27: show the Flux band?
   - DA-28: should the expanded Scale Weight axis start at 0?
   - DA-29: Energy Balance collapsed chart height.
   - DA-11: entrance animation for bars on detail charts.
   - ON-10: pill or rectangle primary buttons.
   - ON-3, ST-4: should browser Back go back one wizard step?
   - NU-27: unsaved-changes prompt on Recipe and Create Food.

---

## Appendices

The full area reports follow, copied verbatim from the session notes. The only change is that SH-3 is marked REJECTED. They contain every ID with its file:line, MF reference, proposed fix and test plan.

---

# Appendix A — Dashboard + Analytics


Date: 2026-10-23. Scope: `FE/src/features/{dashboard,nutrient-detail,weight,steps,period,habits}/**` + the shared chart infra in `features/dashboard/chart/` + the keyframes in `src/app/index.css`.
Method: I read every chart, page, hook and the shared infra listed below. Each claim cites a file and line. The MF references are static PNG/WEBP files, so MF motion is always **UNKNOWN**. Anything marked "verify" was not reproduced in a browser.
All paths are relative to `L:\workspace\personal_project\MacroOS\FE\src\` unless they start with `Docs/`.

MF screenshots compared (opened and looked at): `Docs/MacroFactor_UI/UI/Dashboard/Expenditure/2-chart-expanded.png`, `Dashboard/Energy_Balance_v2/01_mf_expenditure_tab.png`, `Dashboard/Energy_Balance_v2/07_goal_progress_expand_button.png`, `Dashboard/Weekly_Nutrition/03_mf_consumed_data.png`, `Dashboard/Daily_Nutrition/5.png`, `Dashboard/Weight_Trend/02_mf_week_scale_vs_trend.png`, `Dashboard/Steps/03_data_week_panned.png`, `Dashboard/Period/01_calendar_month.png`, `Body_Metrics/03_scale_weight_fit_data.png`, and our own bug capture `Dashboard/Nutrient_Detail/00_ours_expanded_overlap.png`.

---

## (a) Component inventory + motion

### Shared infra
| Unit | Motion it provides | Status |
|---|---|---|
| `app/index.css:91-141` keyframes | `ring-fill` (stroke-dashoffset), `chart-draw` (dasharray/offset; needs `pathLength=1`, fill `both`), `chart-rise` (scaleY, fill-box/bottom), `chart-grow` (scaleX, origin left), `bar-grow` (**width** 0 → w) | All keyframes exist and every `animate-*` class used has one. There is no global reduced-motion rule; it relies on a `motion-safe:` prefix at each call site, and every call site in scope has that prefix |
| `dashboard/chart/use-tween.ts:10-32` | rAF ease-out-cubic 400ms number tween; cancels its rAF on cleanup; reduced motion → jumps (`:17,21`) | Works. First render does not animate (by design) |
| `dashboard/chart/use-chart-pan.ts` | Horizontal drag, pointer capture after a 6px horizontal intent (`:109-117`), inertia `coast` (`:71-92`), 180ms snap (`:58-69`), rAF cancelled on unmount (`:51`) and on a new pointerdown (`:95`) | Works on touch. Two bugs: DA-1 and DA-2. Inertia and snap ignore reduced motion (DA-14) |
| `dashboard/chart/use-chart-expand.tsx` | Height tween through `useTween` (`:127`); measures the real viewport down to the top of `[data-bottom-nav]` minus the range-bar footer (`:31-47`); re-measures on resize, visualViewport and ResizeObserver (`:79-104`); smooth scroll to top respects reduced motion (`:115-120`); no scroll lock (the page keeps scrolling, which is by design per UI.md:484) | Works. DA-26 is a minor gap |
| `dashboard/chart/ChartAxes.tsx` | Grid and labels follow the tweened `y`, `slots` and `pos`; x labels are keyed by date so they slide with a pan | Ticks pop in and out on a range switch (DA-13); global clip ids (DA-30) |
| `dashboard/components/DetailPage/RangeBar.tsx:32-39` | Sliding pill via `transform` 300ms with `motion-reduce` | Works. Light-theme colours are hard-coded (DA-23) |
| `DetailPage/UnderlineTabs.tsx:46-50` | Underline slides via `transform` 300ms with `motion-reduce` | Works |
| `DetailPage/MiniArea.tsx:39` | `animate-chart-grow` scaleX on the whole SVG | Runs, but squashes the stroke (DA-17) |
| `DetailPage/TutorialCard.tsx` | Scroll-snap pager, smooth `scrollTo` (`:35-36`), colour transition 500ms | Smooth scroll ignores reduced motion (DA-14). Dismiss unmounts instantly, so the page jumps (DA-33) |
| `dashboard/hooks/use-flip.ts` | FLIP reorder 380ms via inline transform; reduced motion respected (`:22`) | Works. Animates during a drag and jumps on rapid reorders (DA-25) |

### Dashboard page (`dashboard/pages/DashboardPage.tsx`)
| Component | Motion | Status |
|---|---|---|
| `DashboardCarousel.tsx` | Native scroll-snap; dots use `transition-colors` 200ms; dot tap → smooth `scrollTo` (`:22`) | Works. Smooth scroll ignores reduced motion; `page` is not clamped when slides change (DA-20) |
| `WeekMatrix.tsx` | Bar `height` + `opacity` 400ms ease-out with `motion-reduce` (`:33-34,126`); empty dash fades; selected column border `transition-colors` | Works on a Consumed↔Remaining switch. No mount grow (the transition does not run on mount). `height` is a layout property (DA-16, Low) |
| `DailyNutritionCard.tsx` | Arc `transition-[stroke-dasharray]` 500ms (`:131`); macro bars `animate-bar-grow` + `transition-[width]` (`:167`) | The arc has no mount animation and is conditionally mounted (`:123`), so 0 → >0 jumps (DA-15). Neither transition has `motion-reduce:transition-none` (DA-14) |
| `ModeToggle` (`DailyNutritionCard.tsx:20-45`) | ToggleGroup background `transition-colors` (no sliding pill, unlike RangeBar) | Works; consistency is a UX decision |
| `EnergyBalanceCard.tsx` | **None** (no bar rise, no line draw, a mode switch jumps) | Missing (DA-10, DA-11) |
| `TileSection.tsx:27-30` | Section fade + slide-up 400ms, stagger 70ms × index, `motion-safe` | Works (mount only) |
| `MetricTile.tsx:76-78` | `active:bg-muted` colour transition; `motion-safe:active:scale-[0.99]` | The press scale snaps without animating: `transition-colors` does not cover `scale` (DA-18) |
| `InsightCharts.tsx` `ExpenditureMini`, `TrendMini` | Line `animate-chart-draw` (`:110,171`), markers fade 500ms (`:120,183`) | Works on mount. Data updates swap the path instantly (Low) |
| `InsightCharts.tsx` `BalanceMini` | Bars `animate-chart-rise` (`:245`), baseline fade 700ms (`:259`) | Works |
| `InsightCharts.tsx` `GoalMini` | `animate-chart-grow` scaleX (`:282`); the `-translate-y-1/2` uses the separate v4 `translate` property, so there is no conflict | Works |
| `TileVisuals.tsx` `Sparkline`/`EntrySparkline`/`MacroStack`/`StepsBars`/`HabitGrid` | draw / rise / colour 300ms | Works on mount. `ChartArea` (`InsightCharts.tsx:33-58`) draws nothing until measured, which is client-only and fine |
| `NutrientTile` → `nutrition/NutrientGoalBar.tsx` | Fill `bar-grow` + `transition-[width]` 500ms with `motion-reduce` (`:81`); zone and tick fade 500ms; over-ceiling segment `transition-[left,width]` (`:90`) | Works. Animates layout props (DA-16) |
| `BodyMetricTiles.tsx` ProgressPhotos / FullBody | Image fade 500ms (`:151`); chips stagger slide-in 70ms (`:218-219`); press scale (`:145` ok, `:205` snaps) | Works except the FullBody press scale (DA-18) |
| `DashboardSearchBar.tsx:37-38` | Auto-hide opacity + translate 300ms, `motion-reduce`, `inert` when hidden | Works |
| Loading | `MetricTile loading` keeps the tile geometry (`MetricTile.tsx:46-52`); focus slides use the same `h-72` skeleton | Good; no 0-flash on tiles |

### Detail pages (all use the shared pan, tween and expand)
| Page / chart | Initial render | Data update / refetch | Range 1W..All & D/W/M | Expand | Selection |
|---|---|---|---|---|---|
| Weight Trend `WeightTrendChart.tsx` + `pages/WeightTrendPage.tsx` | Whole-chart fade-in-50 300ms (`page:128`); scale and trend lines `chart-draw` (`chart:151-152,165-166`) | Derived "updating" → whole body becomes an h-96 skeleton (`page:102-103`; DA-7). One query for all history (`use-weight-trend-detail.ts:31-38`), so a range switch fetches nothing | Range: x tween + y min/max tween (`chart:83-84`), works. D/W/M: `key={averaging}` remount + fade (`page:127`), intentional | Tween OK | Tooltip zoom-in 200ms (`chart:199`); marker `transition-[r]` (`chart:178`). W/M tap misses (DA-9) |
| Expenditure `ExpenditureChart.tsx` + `pages/ExpenditurePage.tsx` | Fade + line draw (`chart:125`); lower block slides up (`page:139`) | Same as Weight Trend (DA-7) | Same as Weight Trend; one `all=true` query (`use-expenditure-detail.ts:47-54`) | OK | Same as Weight Trend (DA-9) |
| Energy Balance `EnergyBalanceChart.tsx` + page | Fade only; bars do not rise (DA-11) | DA-7 | Same as above. Mode switch: no refetch (`use-energy-balance-detail.ts` comment :35), but the baseline jumps (DA-10) | OK | DA-9 |
| Goal Progress `WaterfallChart.tsx` + page | No mount motion | Tab switch: bar heights snap; only `fill` 500ms (`chart:157`) and axis max tween (`chart:53`) (DA-8) | Slot count tween (`chart:39`) | OK, collapsed height 340 (`page:58`) | Keyboard-accessible `<g role=button>`; tooltip has no enter animation |
| Macros `MacrosChart.tsx` + `pages/MacrosDetailPage.tsx` | Fade only; no rise | DA-4, DA-5, DA-6 | `keepPreviousData` on all three series queries (`hooks/use-dashboard.ts:24`) | OK | DA-9 |
| Nutrient detail `nutrient-detail/components/NutrientChart.tsx` + page | Fade only; no rise | One `series` query (`use-nutrient-detail.ts:13-18`) | Range tween OK | OK. The page comment (`NutrientDetailPage.tsx:45`) says "phần dưới ẩn" (lower part hidden), but the shared hook keeps it rendered: doc drift | DA-9 |
| Scale Weight / Body metric `weight/components/BodyMetricPage/MetricChart.tsx` + `BodyMetricView.tsx` | Fade + line draw (`chart:137`) | Entry sheet remount (DA-19) | Range tween OK; y always `fit` (DA-28) | OK | Nearest-point pick (`chart:80-88`), which is the right model |
| Steps `steps/components/StepsChart.tsx` + page | Fade only; no rise | DA-19 | OK; the empty axis switches on expand (`chart:62`) | OK | DA-9 |
| Period `period/pages/PeriodPage.tsx` + `habits/.../HabitCalendar.tsx` | Month slide in from left or right 300ms, keyed by month (`HabitCalendar.tsx:63-71`); tracked day zoom-in 75 with 12ms stagger (`:83-85,105`); history rows stagger (`PeriodHistoryList.tsx:27-28`) | Stat shows "—" before load (DA-22); sheet remount (DA-19) | n/a | n/a | Swipe on pointerup (`HabitCalendar.tsx:47-61`); no drag-follow |
| Habits `habits/pages/HabitsPage.tsx` | Calendar same as Period; heatmap fade 500ms keyed by year (`HabitHeatmap.tsx:44-45`); summary numbers fade when the value changes, keyed by value (`HabitSummary.tsx:15,25`) | Year change → skeleton + empty heatmap (DA-21) | n/a | n/a | — |
| Insights `pages/InsightsPage.tsx` | Same 4 tiles as Dashboard | Shared cache with the detail pages | — | — | — |
| Nutrition See All `pages/NutritionDetailPage.tsx` | `NutrientGroupSection` fade-up, stagger 60ms capped at 4 (`NutrientGroupSection.tsx:37-38`) | Skeleton never ends without a program (DA-24) | — | — | — |
| Customize `pages/CustomizePage.tsx` | FLIP on sections (`:34,81`), focus cards (x) and tile rows (y) | — | — | — | Drag handle swaps rows at half-row distance (`TileListSection.tsx:48-58`) |

Hydration: every page reads `today` only after `useIsClient()`, and `usePersistedChoice` uses a server snapshot (`hooks/use-dashboard.ts:116-127`). There is no `Date.now()` or `window` in render inside scope. (`window` appears in `InsightCharts.tsx:65,207` and `DashboardTiles.tsx:86-87`, but only as a parameter name that shadows the global. That is safe and only a readability issue.)

---

## (b) Issues

Severity: Critical = crash or data loss; High = broken core interaction or likely crash; Medium = visible bug or claimed behaviour missing; Low = polish or consistency.

| ID | Page / component | file:line | Current behaviour | MF ref | Gap | Sev | Proposed fix | Test plan | Type |
|---|---|---|---|---|---|---|---|---|---|
| DA-1 | All pannable charts (8 pages) / `useChartPan` | `dashboard/chart/use-chart-pan.ts:94-125` | Pointer capture is only taken once a horizontal pan starts. With a mouse: press on the chart, move vertically or out, release outside the chart → no `pointerup` reaches it, so `gesture.down` stays `true`. Hovering back later (no button held) passes the 6px test, and the chart **pans with no button pressed** | none | Sticky drag on desktop | Medium | In `onPointerMove`: `if (event.pointerType === 'mouse' && event.buttons === 0) { g.down = false; return }`. Optionally also reset on `onPointerLeave` when not panning | Desktop Chrome, Weight Trend 1M: mousedown on the chart, drag down out of it, release, then hover back over the chart → the chart must not move | SAFE-FIX |
| DA-2 | All pannable charts / `useChartPan` | `use-chart-pan.ts:46-56` (bounds effect does not clamp `posRef`) | After a range switch shrinks `maxPos`, the displayed `pos` is clamped (`:34`) but `posRef` keeps the old larger value. The next drag toward today is a **dead zone** for `(oldPos − newMax)` days | none | Pan feels stuck after a range change | Medium | In the `maxPos` effect: `posRef.current = Math.min(posRef.current, bounds.current); setRaw(posRef.current)` | With ≥90 days of data: 1W, drag back ~80 days, switch to 1M → drag right (toward today); the chart must move immediately | SAFE-FIX |
| DA-3 | Every `animate-chart-draw` line (detail + tiles) | `app/index.css:101-113` (fill `both`) | The animation fill keeps `stroke-dasharray:1` forever after the 700ms. This is correct only if the browser honours `pathLength=1` on `<polyline>`/`<path>`. If not (older WebKit), lines stay rendered as a 1-unit dash pattern | none | Possible permanently dashed lines on iOS (verify) | Medium (verify) | Use `animation: chart-draw 700ms ease-out backwards` so the dash props are dropped after the draw | iOS Safari: open Weight Trend / Scale Weight / Dashboard tiles → lines must be solid after load. DevTools: computed `stroke-dasharray` on the polyline after 1s = `none` | SAFE-FIX |
| DA-4 | Macros detail, D→W→M | `dashboard/hooks/use-dashboard.ts:12-25`; `dashboard/pages/MacrosDetailPage.tsx:48-51,80,100-102` | `buckets` uses `keepPreviousData`. On D→W, `buckets.data` is the placeholder from the previous key (a series fetched without granularity, so `buckets` is empty or daily). `key={averaging}` remounts the chart with **empty or wrong bars**, then they jump when the real weekly data arrives. W→M briefly draws **weekly buckets as monthly** | none | Stale data shown as fresh plus a flash | Medium | `const chartSeries = averaging === 'daily' ? series : buckets.isPlaceholderData ? undefined : buckets.data`, and render an in-chart loading state (or drop `placeholderData` for `buckets`) | Throttle the network to Slow 3G. Macros → W: no transient wrong or empty bars; then M: no weekly bars shown under the M label |
| DA-5 | Macros detail stats while panning | `MacrosDetailPage.tsx:57-62,79` | `windowSummary` is keyed by `win.from/win.to`, which changes on **every snapped day** during a drag or coast → one request per day crossed. `keepPreviousData` shows the previous window's Protein/Fat/Carbs as if current, with no pending cue | none | Redundant fetches; stale stats shown as fresh | Medium | Debounce the window (fetch only when `!pan.view.dragging` and the snap has settled) and dim the StatBlocks while `windowSummary.isPlaceholderData` | DevTools Network: drag across 1M; the request count should be ~1 after release, not one per day. Stats dim until fresh | UX-DECISION |
| DA-6 | Macros detail, user with zero logged days | `MacrosDetailPage.tsx:53` | `series.days[0].date` throws if the BE returns `days: []` (new account, no logs) | none | Likely crash of the whole page (verify the BE contract for an empty history) | High (verify) | `series && series.days.length ? daysBetween(series.days[0].date, today) + 1 : 0` | New account with no food log → open `/dashboard/macros`; it must render the empty 0–4000 axis (`MacrosChart.tsx:21`) without an error boundary | SAFE-FIX |
| DA-7 | Weight Trend, Expenditure, Energy Balance, Goal Progress detail | `pages/WeightTrendPage.tsx:100-104`, `ExpenditurePage.tsx:92-96`, `EnergyBalancePage.tsx:74-78`, `GoalProgressPage.tsx:79-82` | Whenever `useDerivedGate()` reports `updating` (after any weight or food change while the BE rebuilds; it polls every ~4s), the **whole page body** is swapped for an `h-96` skeleton. The chart unmounts (selection lost, redraw on return) and the page height collapses to 384px, then jumps back | none | Chart remount on refetch + layout shift | Medium | Keep the last chart rendered, dimmed with an "Updating…" badge and `aria-busy`, or at least a skeleton that matches the real content height | Log a weight, open Weight Trend while status=Updating: no collapse and no redraw flash when it flips to Ready | UX-DECISION |
| DA-8 | Goal Progress, Scale↔Trend tab | `components/GoalProgressPage/WaterfallChart.tsx:151-158` (doc claim at `:31-33`) | Only `fill` transitions (500ms) and the axis max tweens. Bar `y` and `height` snap to the new data | `Energy_Balance_v2/07_goal_progress_expand_button.png` (static) | The comment claims bars "giãn / co mượt" (expand / shrink smoothly); they don't on a tab switch | Medium | Tween each bar's low/high with `useTween` (or one tween of an interpolation factor between the old and new arrays) | Switch tabs: bars glide 400ms; with reduce motion they jump | UX-DECISION |
| DA-9 | Weight Trend, Expenditure, Energy Balance, Macros, Nutrient, Steps charts in W/M averaging | `WeightTrendChart.tsx:97-98`, `ExpenditureChart.tsx:71-72`, `EnergyBalanceChart.tsx:75-76`, `MacrosChart.tsx:76-77`, `nutrient-detail/components/NutrientChart.tsx:83-84`, `steps/components/StepsChart.tsx:72-73` | Tap hit-testing requires an exact match on the day index of the bucket **start date**. In W mode 6/7 of taps (M: ~29/30) clear the selection instead of selecting the week or month | none | Selection nearly unusable in W/M | Medium | Pick the nearest shown point (reuse the `MetricChart.tsx:80-88` approach) or the bucket whose `[date, end]` contains the tapped day | Weight Trend → W → 1M: tap mid-week; the tooltip shows that week. Repeat on each chart | SAFE-FIX |
| DA-10 | Energy Balance detail + Dashboard card, Expenditure↔Targets | `EnergyBalanceChart.tsx:130-139`; `components/DashboardPage/EnergyBalanceCard.tsx:119-129` | The baseline polyline points and colour swap instantly; summary numbers swap | `Energy_Balance_v2/01_mf_expenditure_tab.png`, `02_mf_targets_tab.png` (static) | No transition on the mode switch | Low | Key the baseline by mode with a `motion-safe` fade-in, or tween the y values | Toggle the mode: the line cross-fades over ~300ms | UX-DECISION |
| DA-11 | Bar charts: EB, Macros, Nutrient, Steps, Waterfall, EB card | `EnergyBalanceChart.tsx:113-129`, `MacrosChart.tsx:113-131`, `NutrientChart.tsx:138-153`, `StepsChart.tsx:109-119`, `WaterfallChart.tsx:151-158`, `EnergyBalanceCard.tsx:106-118` | Only the whole-chart 50% fade. Line charts get a draw-in and dashboard tile bars rise (`TileVisuals.tsx:199,228`), but detail bars do not | none | Inconsistent entrance | Low | Add `chart-rise` gated to **first mount only** (otherwise every bar that pans into view would rise while the user drags, violating UI.md:394 "không bật chuyển động ở nơi người dùng đang kéo/vuốt" (no motion while the user drags or swipes)) | Open each page: bars rise once; panning does not re-trigger rises | UX-DECISION |
| DA-12 | Line charts while panning sparse data | `WeightTrendChart.tsx:144-168`, `ExpenditureChart.tsx:118-127`, `weight/components/BodyMetricPage/MetricChart.tsx:132-141` | The line is mounted conditionally (`length > 1`). Panning across a gap unmounts and remounts it, so the 700ms draw-in **replays mid-drag** | none | Motion during a drag | Low | Always render the `<path>` (an empty `d` when <2 points) so the mount animation runs once | Scale Weight with sparse entries, 1W: drag across a gap; the line must not redraw | SAFE-FIX |
| DA-13 | All detail charts, range switch | `dashboard/chart/ChartAxes.tsx:32-52` | Tick `<g>` elements are keyed by value: new ticks pop in and old ones vanish while the lines tween | none | Small flash on the axis | Low | `motion-safe:animate-in fade-in-0 animation-duration-300` on the tick `<g>` | 1W→All: labels fade rather than pop | SAFE-FIX |
| DA-14 | Reduced-motion leaks | `use-chart-pan.ts:58-92` (inertia + snap); `DashboardCarousel.tsx:22`; `DetailPage/TutorialCard.tsx:35-36` (smooth scroll); `DailyNutritionCard.tsx:131,167` (no `motion-reduce:transition-none`); `WeightTrendChart.tsx:178`, `MetricChart.tsx:149` (`transition-[r]`) | These keep animating under `prefers-reduced-motion` | none | A11y | Low | Read `matchMedia('(prefers-reduced-motion: reduce)')`: skip coast/snap (call `apply(Math.round(...))`) and use `behavior: 'auto'`; add `motion-reduce:transition-none` | DevTools rendering → emulate reduced motion: no inertia, instant carousel and tutorial paging, no arc or bar tween | SAFE-FIX |
| DA-15 | Daily Nutrition arc | `DailyNutritionCard.tsx:105,123-133` | The arc path only mounts when `arc > 0`, with no fill-in on mount; 0→first log jumps. `targetRatio().over` is ignored (no over-target cue on the arc or macro bars; the WeekMatrix has one) | `Daily_Nutrition/5.png` (zero state only) | Missing mount fill; over-target styling UNKNOWN vs MF | Low | Always render the arc with `strokeDasharray={arc*100+' 100'}` plus an `animate-ring-fill`-style keyframe (`--ring-start`). Over-target: product decision | Fresh day: log food; the arc grows from 0. Reload: the arc fills on mount | UX-DECISION |
| DA-16 | Width/height-based bars | `app/index.css:130-137` (`bar-grow` animates `width`); `WeekMatrix.tsx:33-34,126` (`height`); `nutrition/NutrientGoalBar.tsx:90` (`left,width`) | Layout properties animate (reflow each frame) | none | Janky on low-end phones (small elements, so low impact) | Low | Move to `transform: scaleX/scaleY` with the right origin (keep the width as the final state) | Performance panel: no Layout events per frame during the dashboard mount | SAFE-FIX |
| DA-17 | Weight / Expenditure Changes mini areas | `DetailPage/MiniArea.tsx:39` | The whole SVG scaleX-grows, so strokes and dots are horizontally squashed during the 700ms | `Weight_Trend/06_mf_weight_changes_mini_charts.png` (static) | Distorted entrance | Low | Draw the line with `chart-draw` (pathLength) and fade the area | Visual check of the Insights rows on Weight Trend / Expenditure | SAFE-FIX |
| DA-18 | Tile press feedback | `DashboardPage/MetricTile.tsx:76-78`; `BodyMetricTiles.tsx:205` | `transition-colors` + `active:scale-[0.99]`: the scale is applied without a transition (v4 `scale` is not in `transition-colors`) | none | Press scale snaps | Low | `transition-[background-color,scale]` (or `transition-[color,background-color,scale]`) | Press and hold a tile: smooth 150–200ms shrink | SAFE-FIX |
| DA-19 | Entry sheets (Scale Weight, Steps, Period, Measurements, Visual BF, Habits weigh-in) | `weight/pages/ScaleWeightPage.tsx:112`, `steps/pages/StepsPage.tsx:165`, `period/pages/PeriodPage.tsx:111`, `weight/pages/MeasurementPage.tsx:77`, `weight/pages/VisualBodyFatPage.tsx:82`, `habits/components/HabitsPage/ScaleWeightSheet.tsx:221` | `key` includes `history.dataUpdatedAt`. Save → `setSheetOpen(false)` (200ms exit, `components/ui/sheet.tsx:59`) while the invalidation refetch is in flight (`weight/hooks/use-weights.ts:95` not awaited). If it lands within the exit, the sheet remounts **closed**, which cuts the slide-out. Habits: the form remounts with new values during the exit | none | Key remount kills the exit transition (timing-dependent) | Low | Key on an open counter bumped in `openSheet()` instead of `dataUpdatedAt` | Fast local BE: save a weight; the sheet always slides out fully (record at 0.25× speed) | SAFE-FIX |
| DA-20 | Dashboard carousel dots | `DashboardCarousel.tsx:18,35` | `page` is not clamped when slides are hidden or reordered in Customize; it can point past the end (no active dot) until the next scroll | none | Minor state bug | Low | `const active = Math.min(page, slides.length - 1)` | Hide a focus slide while on the last page, then come back | SAFE-FIX |
| DA-21 | Habits / Period year switch | `habits/pages/HabitsPage.tsx:69-80,95`; `habits/hooks/use-habit-days.ts:16-20,47` | An uncached year → the calendar is replaced by an `h-96` skeleton (month slide lost, layout jump) while the heatmap renders an **all-empty** year that fills in later (looks like a 0-flash) | `Period/01_calendar_month.png` | Loading state misleads | Low | Keep the grid (no tracked rings) with `aria-busy` and a dim overlay; give the heatmap a skeleton until loaded | Habits → pick the previous year from HabitControls on throttled network | UX-DECISION |
| DA-22 | Period "Last Period Duration" | `period/pages/PeriodPage.tsx:78-82` | Renders `—` while the history query is pending, which reads as "no data" (contradicts the `dashboard-pending.ts:4-6` rule) | `Period/01_calendar_month.png` | 0/— flash before load | Low | A skeleton for the stat while `history.isLoading` | Throttle and reload `/period` | SAFE-FIX |
| DA-23 | Theme tokens | `DetailPage/RangeBar.tsx:90-93` (`border-white bg-white`, `bg-black`, `border-zinc-600`); `period/components/PeriodDaySheet.tsx:77` (`bg-white! bg-zinc-600! bg-black!`); `pages/GoalProgressPage.tsx:26-37` (raw hex incl. `#3a3a3a`) | Raw colours: in light theme, the averaging radio and period switch are white-on-white/black, and the Status bar is dark grey on a light card | Expenditure `3-chart-averaging-sheet.png`, Period `04_day_sheet_toggle.png` (dark only) | Breaks light theme and the UI.md / .rules token rule | Low | Use `bg-foreground` / `bg-background` / `border-muted-foreground` and theme CSS vars for the goal colours | Toggle light theme; open D▾ sheet, the Period day sheet and Goal Progress | SAFE-FIX |
| DA-24 | Nutrition "See All" without a program | `dashboard/hooks/use-dashboard-data.ts:103,108,184-185`; `dashboard/pages/NutritionDetailPage.tsx:16`; `dashboard-pending.ts:36-58` | `dayLog` and `nutrients` are disabled when `enabled=false`, but `pending.*` uses `isPending`, which stays **true forever** for a disabled query → every nutrient tile shows a skeleton forever | none | Skeleton forever when the query is disabled | Medium | Use `isLoading` (pending **and** fetching) or `isPending && fetchStatus !== 'idle'` for the pending flags | An account without a program: open `/dashboard/nutrition`; tiles show `---`, not skeletons | SAFE-FIX |
| DA-25 | Customize reorder | `dashboard/hooks/use-flip.ts:28-34`; `components/CustomizePage/TileListSection.tsx:48-58` | FLIP runs on every swap **during** a drag (UI.md:394 says no motion while dragging). A rapid second reorder starts from the layout `offsetTop` rather than the visual position, so items jump. rAF is not cancelled on unmount | none | Janky reorder | Low | Skip FLIP for the dragged item (or for all while a drag is active); compute `before` from `getBoundingClientRect()` | Drag a tile across 4 rows quickly; tap ↑ five times fast | UX-DECISION |
| DA-26 | Expanded charts | `dashboard/chart/use-chart-expand.tsx:79-104` | Re-measures only on chart resize or a viewport resize. Content above the chart that changes height after expanding (e.g. the "Historical target not verified" note, `EnergyBalancePage.tsx:89-91`; "Goal reached", `GoalProgressPage.tsx:97-107`) leaves the range bar mis-positioned | `Nutrient_Detail/00_ours_expanded_overlap.png` (our earlier overlap bug), `16_mf_expanded_fits_viewport.png` | Possible footer overlap with the bottom nav | Low | Also observe the page container (ResizeObserver on `chart.parentElement`) while expanded | Expand, then trigger a note above (switch to the Targets tab with unverified days); the range bar stays above the tab bar | SAFE-FIX |
| DA-27 | Expenditure chart + tile | `ExpenditurePage/ExpenditureChart.tsx:30-31`; `docs/UI.md:380` (still describes `FluxMini`) | No Flux band (deliberate); the doc still documents the Flux mini | `Expenditure/1-chart-collapsed.png`, `Expenditure_v2/01_mf_chart_flux_range.png` | Visual gap vs MF; doc drift | Low | Decide; update UI.md:380 either way | n/a | UX-DECISION |
| DA-28 | Scale Weight expanded axis | `BodyMetricView.tsx:140-142` | Always `fit` (min–max) | `Body_Metrics/03_scale_weight_fit_data.png` shows **expanded** 0–80 kg | Differs from MF (the code comment says the user decided) | Low | Confirm with the user | n/a | UX-DECISION |
| DA-29 | Energy Balance collapsed chart | `EnergyBalancePage.tsx:45` (300-unit default), `EnergyBalanceChart.tsx:101-110` | Tall chart with tick labels | `Energy_Balance_v2/01_mf_expenditure_tab.png`: short chart, only a "0" label, no grid | Visual mismatch | Low | Pass a smaller `collapsedHeight` and hide the non-zero tick labels for EB | Compare side-by-side with 01 | UX-DECISION |
| DA-30 | Clip ids | `ChartAxes.tsx:74-79` | Global ids `plot-clip` / `plot-clip-x`; any page that ever shows two charts (or a future dashboard embed) will clip with the wrong rect | none | Robustness | Low | `useId()` for the ids | n/a | SAFE-FIX |
| DA-31 | Tutorial dismiss | `DetailPage/TutorialCard.tsx:68-74` + pages | Dismiss unmounts instantly; the content below jumps up ~150px | none | Abrupt layout shift | Low | Wrap it in the shared `components/shared/CollapseItem.tsx` (grid-rows collapse, motion-reduce aware) | Dismiss on Weight Trend: the card collapses smoothly | SAFE-FIX |
| DA-32 | Scale Weight / body metric history | `weight/components/BodyMetricPage/MetricHistoryList.tsx:24` | No staggered row entrance; every other history list has one (`WeightMonthlyList.tsx:39-40`, `MonthlyList.tsx:49-50`, `StepsHistoryList.tsx:46-47`, `BalanceHistory.tsx:35-36`, `NutrientHistory.tsx:39-40`) | none | Inconsistency | Low | Copy the same classes and delay | Visual | SAFE-FIX |
| DA-33 | All detail pages at midnight | `use-weight-trend-detail.ts:32`, `use-expenditure-detail.ts:30,48`, `use-energy-balance-detail.ts:42,50`, `use-nutrient-detail.ts:15`, `steps/hooks/use-steps.ts:18` | `today` is in every query key with no placeholder: when the app stays open across midnight (on the next re-render), every chart drops to a skeleton and refetches | none | Skeleton flash | Low | `placeholderData: keepPreviousData` on these all-history queries (the history is a superset, so the previous data is valid) | Fake the clock across midnight with DevTools overrides | SAFE-FIX |
| DA-34 | Energy Balance baseline | `EnergyBalanceChart.tsx:66-69` | Days with `baseline === null` are filtered, then the points are joined, so the dotted line bridges gaps | `Energy_Balance_v2/01_mf_expenditure_tab.png` | Minor data-shape mismatch | Low | Split into segments at nulls | EB 1M with a gap day | SAFE-FIX |

**Counts (34 issues):** Critical 0 · High 1 · Medium 9 · Low 24.
- High: DA-6 (verify).
- Medium: DA-1, DA-2, DA-3 (verify), DA-4, DA-5, DA-7, DA-8, DA-9, DA-24.
- Low: DA-10 to DA-23, and DA-25 to DA-34.

---

## (c) Per-screen ratings

MATCHED is used only where a named MF file was compared. Motion is always UNKNOWN vs MF; it is BROKEN or PARTIAL only for an internal bug.

| Screen | Visual | Interaction | Motion | Data | Responsive |
|---|---|---|---|---|---|
| Dashboard: Weekly Nutrition (`WeekMatrix`) | MATCHED (`Weekly_Nutrition/03_mf_consumed_data.png`) | MATCHED (same file: select column, white border) | UNKNOWN (internal: works) | PARTIAL (not verified against MF numbers) | PARTIAL (h-12 rows fixed; untested <360px) |
| Dashboard: Daily Nutrition card | MATCHED (`Daily_Nutrition/5.png`, zero state) | PARTIAL (no over-target cue, DA-15) | UNKNOWN (internal: arc lacks mount fill, DA-15) | PARTIAL | UNKNOWN |
| Dashboard: Energy Balance card | PARTIAL (`Energy_Balance/3.png` not opened; EB_v2/01 is the detail) | PARTIAL | UNKNOWN (internal: none, DA-10/11) | PARTIAL | UNKNOWN |
| Dashboard: tiles / Insights page | PARTIAL (`Daily_Nutrition/5.png` shows Expenditure + Weight Trend tiles; no Flux band, DA-27) | PARTIAL (press scale snaps, DA-18) | UNKNOWN (internal OK) | PARTIAL | PARTIAL (2-col grid, `@container` title fit) |
| Nutrition See All | UNKNOWN | PARTIAL | UNKNOWN | BROKEN without a program (DA-24) | UNKNOWN |
| Weight Trend detail | MATCHED (`Weight_Trend/02_mf_week_scale_vs_trend.png`) | PARTIAL (DA-1, DA-2, DA-9) | UNKNOWN (internal: DA-7, DA-12) | PARTIAL | PARTIAL (expand measured; DA-26) |
| Expenditure detail | PARTIAL (`Expenditure/2-chart-expanded.png`: no Flux band, DA-27) | PARTIAL (DA-1, 2, 9) | UNKNOWN (internal: DA-7) | PARTIAL | PARTIAL (layout matches `2-chart-expanded.png` intent) |
| Energy Balance detail | PARTIAL (`Energy_Balance_v2/01_mf_expenditure_tab.png`: height and ticks differ, DA-29) | PARTIAL (DA-1, 2, 9) | UNKNOWN (internal: DA-7, 10, 11) | PARTIAL (DA-34) | PARTIAL |
| Goal Progress detail | PARTIAL (`Energy_Balance_v2/07_goal_progress_expand_button.png`; raw colours, DA-23) | PARTIAL | UNKNOWN (internal: DA-8) | PARTIAL | PARTIAL |
| Macros detail | UNKNOWN (no MF file opened) | PARTIAL (DA-9) | UNKNOWN (internal: DA-4 flash) | BROKEN risk (DA-6) / PARTIAL (DA-4, DA-5) | PARTIAL (3 StatBlocks shrink <360px, `MacrosDetailPage.tsx:88`) |
| Nutrient detail | PARTIAL (`Nutrient_Detail/00_ours_expanded_overlap.png` was our bug; needs a recheck) | PARTIAL (DA-9) | UNKNOWN | PARTIAL | PARTIAL (DA-26) |
| Scale Weight / Body metric | PARTIAL (`Body_Metrics/03_scale_weight_fit_data.png`: expanded axis 0-based in MF, DA-28) | PARTIAL (DA-1, 2) | UNKNOWN (internal: DA-12, DA-19) | PARTIAL | PARTIAL |
| Steps | MATCHED (`Steps/03_data_week_panned.png`) | PARTIAL (DA-9) | UNKNOWN (internal: DA-19) | PARTIAL | PARTIAL |
| Period | MATCHED (`Period/01_calendar_month.png`) | PARTIAL (swipe without drag-follow) | UNKNOWN (internal: DA-22) | PARTIAL | PARTIAL |
| Habits | UNKNOWN (no habits MF file opened) | PARTIAL | UNKNOWN (internal: DA-21) | PARTIAL | PARTIAL (heatmap scrolls horizontally) |
| Customize | UNKNOWN | PARTIAL (DA-25) | UNKNOWN | n/a | UNKNOWN |

---

## (d) "User should click to confirm" checklist (logged-in, mobile 375px unless noted)

1. [ ] **Macros detail on a fresh account with no food logs**: `/dashboard/macros` must not crash (DA-6).
2. [ ] **iOS Safari**: lines on Weight Trend, Expenditure, Scale Weight and the Dashboard Weight Trend / Expenditure / Scale Weight tiles are solid, not dashed, after the draw-in (DA-3).
3. [ ] **Desktop mouse**: on Weight Trend 1M, press on the chart, drag down out of it, release outside, then hover back. Does the chart move by itself? (DA-1)
4. [ ] With ≥3 months of data: Weight Trend 1W, drag back ~2 months, tap 1M, then drag toward today. Is there a "stuck" stretch before it moves? (DA-2)
5. [ ] Weight Trend / Expenditure / Energy Balance / Macros / Steps / a Nutrient: switch to **W**, range 1M, tap the middle of a week. Does a tooltip appear? (DA-9)
6. [ ] Macros detail: tap D▾ → Weekly, then Monthly, on a throttled network. Any flash of empty or wrong bars? Network tab while dragging: how many `macros/series?from=` requests? (DA-4, DA-5)
7. [ ] Log a weight, then immediately open Weight Trend / Expenditure / Energy Balance / Goal Progress. Does the page collapse to a grey box and jump back when the BE finishes? (DA-7)
8. [ ] Goal Progress: switch Scale Weight ↔ Trend Weight. Bars snap vs glide? (DA-8)
9. [ ] Each detail page: tap Expand. The range bar (1W…All, D▾) must sit fully above the bottom tab bar (compare `Docs/MacroFactor_UI/UI/Dashboard/Nutrient_Detail/00_ours_expanded_overlap.png` vs `16_mf_expanded_fits_viewport.png`), and collapse/expand must animate height (DA-26).
10. [ ] Energy Balance detail and Dashboard card: toggle Expenditure ↔ Target. Line jump acceptable? (DA-10)
11. [ ] Dashboard: toggle Consumed ↔ Remaining in Weekly Nutrition (bars should glide 400ms) and in Daily Nutrition (arc and macro bars should tween 500ms).
12. [ ] Save in the Scale Weight / Steps / Period sheets: the sheet slides out fully every time (DA-19).
13. [ ] Account **without** a program: open `/dashboard/nutrition`. Tiles must not stay grey forever (DA-24).
14. [ ] Habits: go to the previous year with the month/year picker. Calendar collapse and empty heatmap flash? (DA-21)
15. [ ] Period page reload: does "Last Period Duration" show "—" before the real value? (DA-22)
16. [ ] **Light theme**: D▾ averaging sheet radios, the Period day sheet switch, and the Goal Progress Status bar are visible (DA-23).
17. [ ] OS "Reduce motion" on: chart pan has no inertia, the carousel and tutorial pager jump instantly, and no arc or bar tweens remain (DA-14).
18. [ ] Customize: drag a tile across several rows quickly and tap the ↑ arrow rapidly. Any jitter? (DA-25)
19. [ ] Dismiss a tutorial card (Weight Trend). Does the content snap up? (DA-31)
20. [ ] Decide on the UX items DA-27 (Flux band), DA-28 (expanded 0-based axis), DA-29 (EB collapsed height), DA-11 (bar entrance).

---

# Appendix B — Nutrition


Scope: `FE/src/features/food-log/**`, `features/foods/**`, `features/nutrition/**`, `features/nutrition-data/**`, `features/nutrient-detail/pages/NutrientGoalsPage.tsx`, hooks `use-exiting-list.ts`, `use-camera-scanner.ts`, `use-keyboard-inset.ts` (plus the shared pieces they lean on: `components/ui/dialog.tsx`, `components/shared/{SheetFrame,SwipeToDelete,CollapseItem,ConfirmDialog}.tsx`, `hooks/use-back-to-close.ts`, `hooks/use-sheet.ts`).
How this was checked: I read the code statically. Nothing was run in a browser, so every runtime claim is still in the "click to confirm" list in section (d). MacroFactor has only static screenshots, so motion compared with MF is always UNKNOWN.

Global facts the findings rely on:
- `src/app/index.css:90-141` defines `ring-fill`, `chart-draw`, `chart-rise`, `chart-grow` and `bar-grow`. All are used through `motion-safe:` in this area (a grep found no unguarded `animate-in/bar-grow/ring-fill/pulse`). `bar-grow` animates `width`, which forces layout on every frame.
- No CSS file has a global `@media (prefers-reduced-motion)` rule. Only `WeekStrip.tsx:35` and `QuantityBar.tsx:129` check reduced motion in JS.
- Every sheet and dialog in scope goes through `components/ui/dialog.tsx`, which is Radix. Radix gives a focus trap, focus restore and scroll lock. The file also adds back-to-close (`useBackToClose`, line 28) and keyboard inset (`useVisibleViewport`, line 72 → `--vv-height/--vv-bottom`). Its open/close animations at lines 52 and 77 have **no** `motion-reduce` guard.

---

## (a) Component inventory and the motion each one has

| Component (file) | Motion / micro-interaction present | Status |
|---|---|---|
| `NutrientGoalBar` (nutrition/NutrientGoalBar.tsx) | Fill: `motion-safe:animate-bar-grow` (0 to width on mount) and `transition-[width] 500ms` (moves from the previous value). Target tick and zone: fade-in 500ms; tick colour changes 500ms once the target is reached. Over-ceiling segment uses `bg-destructive`, fades in, and transitions `left,width`. All have `motion-reduce` | Works. Uses width, not transform (janky, Low) |
| `MacroSummary` (FoodLogPage/MacroSummary.tsx) | Two pages (consumed/left) with native scroll-snap. Text fades in 300ms per date (`key={date}`, l.96). Bars use bar-grow plus a width transition 500ms. Dots change colour 200ms | Works. Dots cannot be operated (NU-17) |
| `WeekStrip` / `DayPill` | Native scroll-snap. Mouse drag of 40px or more scrolls one step smoothly (respects reduced motion). The kcal ring runs `animate-ring-fill` on mount and transitions `stroke-dashoffset` 700ms. The "today" button fades and zooms in 200ms. The pill has a colour transition | Works. 371 pills rendered (NU-29). The today button has no exit animation |
| `CalendarSheet` | Fade and slide in from the top. Closes with opacity/translate 200ms, then `onExited` | Animation works. The a11y shell is incomplete (NU-11) |
| `FoodLogHeader` | Strip and summary collapse with `grid-rows` 300ms while the calendar is open (l.127, 148) | Works |
| `DayTimeline` + `CollapseItem` + `useExitingList` | Added entry: slide-in-from-right and fade 300ms. Removed entry: grid-rows to 0fr and fade 300ms, `inert`. Select check zooms in 200ms. Hour pill uses active:scale. Paste button zooms in. Long press of 500ms starts multi-select | Works. The hour header pops in and out (NU-19). Long press can trigger iOS text callout (NU-20) |
| `FoodTile` | `AnimatedHeight` (ResizeObserver plus a height transition 300ms) when density settings change. Padding, gap and font size transition 300ms. Elements fade in | Works. One ResizeObserver per tile (NU-30) |
| `NotesSection` | `useExitingList` + `CollapseItem` + `SwipeToDelete`. The "limit" note slides in | Works. Failed deletes are silent (NU-9) |
| `AddFoodDialog` | Dialog slides in from the bottom (mobile) or zooms (desktop). The plate pill bounces (`key={plate.length}`, l.182). The arrow rotates 300ms. Plate and tab body swap with a **flex-grow** transition 300ms. The drag handle toggles at a 40px threshold | Works. Animates layout (NU-15). Dialog motion is not reduced-motion safe (NU-1) |
| `AddFoodProgress` | Bar-grow plus width 500ms. Cells fade in. Grid columns transition | The width transition has no motion-reduce (l.150), nor does grid (l.85) (NU-16) |
| `FoodSearchPanel` | Debounce 300ms (FoodLogPage.tsx:180). While typing, `isLoading` is forced (FoodLogPage.tsx:926), so a skeleton shows instead of a stale list. `opacity-70` while fetching. "See more" group list slides in from the right; going back slides in from the left | Works. No error state (NU-6). Food Detail enters with no transition (NU-14) |
| `FoodDetailView` / `QuantityBar` / `ImpactRings` | Number and unit re-animate on unit change (WAAPI 220ms, reduced-motion checked). Mode toggle slides in. Rings run ring-fill on mount and transition dashoffset 500ms. Keypad and chips slide up | Works. Rings remount (replay from 0) whenever `isTargetsLoading` toggles (ImpactRings.tsx:28-31) |
| `PlatePanel` / `PlateItemRow` / `PlateQuantityEditor` / `PlateNutrition` | Panel fades and translates 300ms. Rows use `useExitingList` + `CollapseItem` + `SwipeToDelete`. The editing cell has a pulsing caret. The editor bar slides up | Works. No keyboard removal (NU-10) |
| `ScanPanel` (+ `useCameraScanner`) | Video fades in at `ready`. Shutter has active:scale. Mode switch uses SlidingSwitch | Camera cleanup is correct (tracks stopped on cancel and unmount). Stays active behind the plate (NU-7). No lookup feedback (NU-8) |
| `BarcodeSheet` | SheetFrame (Dialog) | Works in Food Log (`useSheet`). Unmounted on close in Create Food (NU-28) |
| `AiPanel` / `AiPlateView` | Camera as above. Photos and object URLs. Analyze spinner. Ingredient skeleton pulse. Results fade in | Works. Object URL leak edge case (NU-32) |
| `QuickAddPanel` | None beyond button press. Adds to the plate, and the plate pill bounces | Feedback is minimal (acceptable) |
| `LibraryPanel` | View fade-in on `key={view}`. `opacity-70` while fetching | No error state (NU-6) |
| `SelectionBar` | Bar slides up 300ms. Chip row slides from the right 200ms per mode (`key={mode}`). Chips use active:scale. Count is `aria-live` | Works. No exit animation (unmounts at FoodLogPage.tsx:625) |
| `SlidingSwitch` | Thumb moves with translateX 300ms (motion-reduce). Buttons use active:scale | Works. No arrow keys (NU-25) |
| `RangeTabs` (Nutrition Overview) | Underline moves with translateX 300ms | Works. No arrow keys (NU-25) |
| `NutritionOverviewPage` / `NutrientCard` | Content fades in per `key={range}`. Contributors open with grid-rows 300ms. Bars as NutrientGoalBar | Range switch resets bars to 0 (NU-4). Chevrons are non-interactive (NU-5) |
| `CreateFoodPage` / `GeneralSection` | Skeleton while loading from `?from=`. Scan sheet (ScanPanel). Manual sheet | Manual sheet has no close animation (NU-28). An error loading `from` is not handled |
| `RecipeCreatePage` / `RecipeForm` / `RecipePreparation` / `StepSheet` / `IngredientEditorBar` | Progress bar width 300ms. Step body slides in from the right per `key={step}`. Rows use `useExitingList` + `CollapseItem` + `SwipeToDelete`. Steps sort with dnd-kit (reduced motion via `motion-reduce:transition-none!`). Editor bar slides up | Works. Back also slides from the right. No unsaved guard (NU-27) |
| `NutritionDataPage` / `NutritionDaySheet` | Month sections stagger in (70ms). Empty state fades in. Fasting panel uses grid-rows 300ms. Keypad slides up | Changing the date remounts the sheet (NU-12). Failed deletes are silent (NU-13) |
| `NutrientGoalsPage` | Sections stagger (fade and slide from the bottom, 400ms, 70ms step). GoalAnatomy reuses NutrientGoalBar | Works |
| `FoodsPage` / `FoodList` / `FoodRow` | Skeleton, `opacity-70` fetch, `ErrorState` on error (FoodsPage.tsx:133) | Works |
| `useExitingList` | Enter/leave state computed during render (no frame flash). A single timer clears **all** leaving rows `ms` after the last change | Works. A second delete extends the first one's lifetime (cosmetic) |
| `useCameraScanner` | `cancelled` flag stops the late stream. Cleanup stops tracks and resets torch. Detect interval cleared | No leak found. Does not pause on `visibilitychange` (browser usually does) |
| `useVisibleViewport` (use-keyboard-inset.ts) | rAF-batched visualViewport resize/scroll, pinch-zoom excluded, cleanup ok | Works |

---

## (b) Issues

Severity: High 2, Medium 18, Low 15 (35 total).

| ID | Page/component | file:line | Current behaviour | MF ref | Gap | Sev | Proposed fix | Test plan | Type |
|---|---|---|---|---|---|---|---|---|---|
| NU-1 | All nutrition sheets/dialogs (AddFood, SheetFrame sheets, ConfirmDialog, RemoveFoods, Copy…) | components/ui/dialog.tsx:52, 77; no reduced-motion rule in any CSS | Overlay fades, and content slides in from the bottom (full-screen on mobile) or zooms. These still run when the OS asks for reduced motion | none | UI.md:93 says "always `motion-safe:`". A full-screen slide can trigger vestibular symptoms | High | Add `motion-reduce:animate-none` to the overlay and content class strings (or one global `@media (prefers-reduced-motion: reduce)` rule for `[data-slot=dialog-*]`) | DevTools → Rendering → emulate reduce. Open Add Food, More, Copy, Calendar sheet: they should appear instantly. Normal mode is unchanged | SAFE-FIX |
| NU-2 | Food Log page and Nutrition Overview | FoodLogPage.tsx:429; NutritionOverviewPage.tsx:33 | If the day query fails, the **whole page** (header, week strip, calendar, search bar) becomes `ErrorState`. The user cannot move to another day. In Overview the SubPageHeader (back) and range tabs disappear too | none | Dead end: only Retry or the tab bar remain | High | Render the header normally and show the inline ErrorState (`variant="inline"`) only where the timeline or cards go | Block `GET /food-logs/day` in DevTools. The header and week strip stay usable, and picking another day works. Same for `/nutrition/overview` with the tabs and back button | SAFE-FIX |
| NU-3 | Food Log timeline on day switch | FoodLogPage.tsx:572-578; use-food-log.ts:141-146 (no placeholderData) | Switching to an uncached day replaces the timeline (about 18 hour rows) with 3 × `h-16` skeletons, then it pops back. The page height collapses and jumps | 1-timeline-consumed.png | Layout shift and scroll jump. The header avoids the 0-flash (uses week data), but the timeline does not | Medium | Make the skeleton match the timeline shape (hour pills from `hourRangeFirst..Last`), **or** keep the previous day dimmed with `aria-busy` (needs a decision: stale-as-fresh risk) | Throttle to Slow 3G and tap a future day in the strip. There should be no big height jump | UX-DECISION |
| NU-4 | Nutrition Overview range switch | use-nutrition-overview.ts:18-23; NutritionOverviewPage.tsx:44-53 | No `placeholderData`, so each new range shows 4 × h-24 skeletons. Content then remounts (`key={range}`), so every bar grows from 0 instead of moving from the old value | Nutrition_Detail/11.png (static) | The skeleton is shorter than the real page, so layout shifts. Bars reset to 0 | Medium | Add `placeholderData: keepPreviousData` with an `isPlaceholderData` dim, and drop `key={range}` so the NutrientGoalBar width transition carries the change | Switch Today → 1 Week → 1 Month. Bars should slide between values and there should be no skeleton flash once cached | SAFE-FIX |
| NU-5 | Nutrition Overview tiles | NutrientCard.tsx:105-117, 78-81 | Each tile and "Top 3 Contributors" shows a `ChevronRight`, but the `<li>` is not interactive | Nutrition_Detail/11.png (chevrons in MF lead to detail) | The chevron promises an action that does nothing | Medium | Wrap the tile in a `Link` to the nutrient detail route (or remove the chevrons) | Tap the Protein tile and expect the nutrient detail page | UX-DECISION |
| NU-6 | Food search / Library | FoodSearchPanel.tsx (no isError prop; FoodLogPage.tsx:917-927); FoodList.tsx:46-58; LibraryPanel.tsx (only isLoading, FoodLogPage.tsx:896-905) | If the search request fails, `isLoading=false` and `items=[]`, so the user sees "No matching results / Clear filters". Library shows the same | none | An error is shown as if nothing matched | Medium | Pass `isError` and `refetch`, and render an inline `ErrorState` with Retry | Block `/foods/search` and type "apple". You should see an error with a Retry button, not "No matching results" | SAFE-FIX |
| NU-7 | Scan tab | FoodLogPage.tsx:848; AddFoodDialog.tsx:119, 290-293 | With Your Plate expanded, the scan body is hidden (`inert`, opacity 0) but `active` ignores `plateOpen`. The camera stays on and BarcodeDetector keeps reading. A hidden code can start a lookup and jump to Food Detail | none | Hidden camera, battery drain, surprise navigation | Medium | Lift `plateOpen` (or a callback) so ScanPanel and AiPanel get `active && !plateOpen` | On Android Chrome open Scan, then expand the plate. The camera indicator should turn off, and holding a barcode in front should not navigate | SAFE-FIX |
| NU-8 | Scan lookup | ScanPanel.tsx:48 (isLookingUp only pauses detection) | After a code is read, nothing on screen changes until the lookup returns | none | No feedback that a scan registered | Medium | Overlay "Looking up…" with `Loader2` (and optionally `navigator.vibrate(30)`) while `isLookingUp` | Scan a barcode on slow 3G. A spinner should appear right away | SAFE-FIX |
| NU-9 | Notes swipe-delete | SwipeToDelete.tsx:58; FoodLogPage.tsx:617, 674-677 | A swipe past 150px calls `onDelete` but leaves the row slid open. If the DELETE fails there is no toast (the error only shows inside NoteSheet, which is closed), and the row stays slid red | none | Silent failure, stuck row | Medium | `deleteNote.mutate(id, { onError: toast.error })`, and have SwipeToDelete reset `offset` to 0 after commit (or on `disabled` change) | Block `DELETE /food-logs/notes/*` and swipe a note away. You should get a toast and the row should snap back | SAFE-FIX |
| NU-10 | Your Plate rows, Recipe ingredients/steps | SwipeToDelete.tsx:64-67 (button `tabIndex=-1` until revealed); PlateItemRow.tsx:50; RecipeIngredientRow.tsx:43; PlateQuantityEditor (no Remove) | Swipe is the only way to remove an item. Keyboard and switch users cannot reveal Delete | none | A11y gap (Notes and step sheets have other delete paths; Plate does not) | Medium | Add a "Remove" chip or button to PlateQuantityEditor and IngredientEditorBar, or make Delete keyboard-revealable (e.g. Delete key on the focused row) | Use only the keyboard to remove a plate item | UX-DECISION |
| NU-11 | Calendar overlay | CalendarSheet.tsx:84-92, 75-81 | `role="dialog"` without `aria-modal`. Focus does not move in or get restored, Escape does nothing, and browser Back leaves the page (no `useBackToClose`). The scroll lock only sets `body.overflow`, but desktop scrolls `main` | Day_Strip/1_mf_calendar_grid_rings.webp | Not a real modal | Medium | Add `useBackToClose(open, close)`, Escape handler, focus the selected pill on open and restore to the calendar button, and `aria-modal` | Open the calendar and press Esc, then the browser Back button (should close, not leave), then Tab (should stay inside). On desktop wheel over the page and check what scrolls | SAFE-FIX |
| NU-12 | Nutrition Data day sheet | NutritionDataPage.tsx:137 (`key={sheet.id-target.date}`) | Picking a different date in the sheet's date picker remounts the whole sheet. The slide-up replays, the nested SelectDateSheet is torn down without its close animation, and an extra history entry is pushed | Nutrition_Data_Manager/02_mf_entry_sheet.png | Broken motion on date change | Medium | Key by `sheet.id` only, and reset the form from `existing` when `date` changes (derive in render) | Open the sheet, tap the date title, choose another day. The sheet should stay in place and only its values change | SAFE-FIX |
| NU-13 | Nutrition Data delete | ConfirmDialog.tsx:16-25 (no error prop); NutritionDataPage.tsx:160-167 | If the DELETE fails, the button re-enables and nothing explains why | none | Silent failure | Medium | `onError: (e) => toast.error(getFormErrorMessage(e))`, or add an `error` prop to ConfirmDialog | Block `DELETE /nutrition-data`, then confirm. You should see an error | SAFE-FIX |
| NU-14 | Search → Food Detail | FoodSearchPanel.tsx:281-296; dialog.tsx:28 | Detail replaces the list with no transition (group lists do slide). Browser or gesture Back closes the **whole Add sheet** instead of returning to results. Focus is lost (the clicked row unmounts) | Add_Flow/1_mf_food_detail_sheet.png | Missing push/pop motion, and the wrong thing happens on Back | Medium | `motion-safe:animate-in slide-in-from-right-6` on the detail root (and from the left on return), `useBackToClose(Boolean(pickedId), onBack)`, focus the back button on mount | Search, open a food, press Android Back: you should return to the results with the query kept | UX-DECISION |
| NU-15 | Add Food sheet plate toggle | AddFoodDialog.tsx:220, 243, 292 | The expand/collapse animates `flex-grow` on three containers, so the whole sheet (including the long search list) re-lays out every frame for 300ms | Add_Flow/3_mf_your_plate_expanded.png | Janky on low-end phones (animates layout, not transform) | Medium | Animate `transform: translateY` of the tab sheet over a fixed-height plate, or at least use `grid-template-rows` on a single container | Turn on DevTools Performance with 4× CPU throttle and toggle the plate with 50 results loaded. Look for long frames | SAFE-FIX |
| NU-16 | Progress bars (NutrientGoalBar, MacroSummary, AddFoodProgress) | index.css:131-137; NutrientGoalBar.tsx:81; MacroSummary.tsx:118; AddFoodProgress.tsx:85, 150 | Fill uses the `width` keyframe and transition. AddFoodProgress l.150 (width) and l.85 (grid-template-columns) lack `motion-reduce:transition-none` | none | Layout animation. One reduced-motion leak | Low | Add `motion-reduce:transition-none` to AddFoodProgress l.85/150. Optionally switch to `scaleX` with `origin-left` | Reduced motion on: open Add Food and add an item. Bars should jump without tweening | SAFE-FIX |
| NU-17 | MacroSummary consumed/left pager | MacroSummary.tsx:63-69, 129-139 | Pages switch only by horizontal scroll. Dots are `aria-hidden` spans. A desktop mouse with no horizontal wheel and keyboard users cannot reach "left". There is no scroll-snap paging by drag (unlike WeekStrip) | 3-header-remaining.png, 1-timeline-consumed.png | Desktop and keyboard users cannot reach the second page | Medium | Make the dots buttons (`aria-label="Show remaining"`) that `scrollTo` a page, and reuse WeekStrip's mouse-drag step | Desktop Chrome with a plain mouse: switch to the "left" view | SAFE-FIX |
| NU-18 | DayPill ring and MacroSummary at over-target | WeekStrip.tsx:28-33 (min 100); MacroSummary.tsx:88-91 | Over target looks the same as exactly 100%: no marker and no colour change. BR-18 (neutral) is intentional | 1-timeline-consumed.png (only 0% shown) | MF over-target look is unknown | Low | Keep as is unless an MF over-target screenshot shows otherwise | Log more than the kcal target: ring and bar are full and neutral | UX-DECISION |
| NU-19 | Timeline hour header and moved entries | DayTimeline.tsx:304-313, 359-362 | The hour pill and totals row mount or unmount instantly when an hour goes from 1 to 2 entries or selection starts. An entry whose time changes is re-parented, so it jumps with no enter animation (same key, `entering=false`) | 1-timeline-consumed.png | Abrupt pop next to otherwise animated rows | Low | Wrap the header in a grid-rows collapse (like CollapseItem). Treat cross-hour moves as entering | Add a 2nd food to an hour that already has one. Change an entry's time | SAFE-FIX |
| NU-20 | Long-press on a food tile (start multi-select) | DayTimeline.tsx:379-398 | 500ms hold with no `select-none`, no `-webkit-touch-callout:none`, and no `onContextMenu` preventDefault (the HourPill has them, l.115-118). iOS may show the text-selection or link callout at the same moment. No haptic | Multi_Select/01_select_mode_bar.png | Collides with system gestures on iOS | Medium | Add `select-none [-webkit-touch-callout:none]` and `onContextMenu={e=>e.preventDefault()}` on the wrapper, plus optional `navigator.vibrate?.(10)` | On an iPhone, long-press a food tile: selection mode should start with no callout or text selection | SAFE-FIX |
| NU-21 | Programmatic smooth scrolls | FoodLogPage.tsx:358; PlatePanel.tsx:122; RecipeCreatePage.tsx:161 | `behavior:'smooth'` regardless of reduced motion (WeekStrip does check) | none | Reduced-motion leak | Low | Reuse a `prefersReducedMotion()` helper and pass `'auto'` | Reduced motion on, log a food: the jump to the hour should be instant | SAFE-FIX |
| NU-22 | Timeline "Now" dot | FoodLogPage.tsx:165 | `currentHour` is frozen at mount, so the dot is wrong if the page stays open past the hour | 1-timeline-consumed.png (dot at 17:00) | Stale state | Low | Recompute on `visibilitychange` or once a minute | Leave the tab open across an hour boundary and refocus | SAFE-FIX |
| NU-23 | Token violations | PlatePanel.tsx:79, 91 (`bg-blue-950/700`, `text-white`); DetailActions.tsx:51 (`fill-red-500`); NutritionOverviewPage.tsx:73, MoreSheet.tsx:20, ToggleList.tsx:30 (`bg-white!`, `bg-zinc-600!`) | Raw Tailwind colours in place of theme tokens | Add_Flow (MF empty-plate blue) | Theme or light mode drift | Low | Move them to tokens (`--mf-info`, `--destructive`) or a Switch variant | Switch to light theme and view the empty plate and the toggles | SAFE-FIX |
| NU-24 | tw-animate durations | CollapseItem.tsx:35; MacroSummary.tsx:97; WeekStrip.tsx:236; NutritionOverviewPage.tsx:53; AddFoodProgress.tsx (cell fade); LibraryPanel.tsx:238 | Uses `motion-safe:duration-*` for enter animations, but UI.md:92 requires `animation-duration-*` | none | Rule drift. It works only if tw-animate's `--tw-duration` fallback applies (not verified) | Low | Replace with `motion-safe:animation-duration-*` | In DevTools, inspect the computed `animation-duration` of a newly added timeline row (should be 300ms) | SAFE-FIX |
| NU-25 | SlidingSwitch / RangeTabs | SlidingSwitch.tsx:32-72; RangeTabs.tsx:20-35 | `radiogroup` and `tablist` with every option a separate tab stop. No arrow keys, no roving tabindex. Tabs have no `aria-controls` | none | ARIA pattern incomplete | Low | Roving tabindex with ←/→ | Tab to the switch and press arrow keys | SAFE-FIX |
| NU-26 | Sheet gestures | AddFoodDialog.tsx:251-271 (handle h-6, threshold only); SheetFrame.tsx:58 (grabber, no gesture) | The handle does not follow the finger (it toggles at 40px). SheetFrame shows a grabber but there is no swipe-down to dismiss | Add_Flow/3_mf_your_plate_expanded.png (handle) | The handle looks draggable but the gesture is missing | Medium | Drag-follow with translateY and snap, plus swipe-down dismiss in SheetFrame (motion-safe, no animation while dragging per UI.md:394) | Drag the More sheet down on a phone | UX-DECISION |
| NU-27 | Recipe / Create Food navigation | RecipeCreatePage.tsx:254-282; CreateFoodPage.tsx (no guard) | Step 2→1 also slides in from the **right**. Browser Back on step 2 leaves the page. No unsaved-changes confirm anywhere, so the draft is lost | Multi_Select/12_create_recipe_from_selection.png | Wrong direction cue and data loss | Medium | Direction-aware slide (`slide-in-from-left` on back). `useBackToClose(step===2, ()=>setStep(1))`. "Exit without saving?" ConfirmDialog (already used in Shortcuts) | Fill a recipe, press browser Back on step 2 and on step 1 | UX-DECISION |
| NU-28 | Create Food manual barcode sheet | GeneralSection.tsx:149-157 | `{sheet==='manual' && <BarcodeSheet open/>}` unmounts on close, so there is no slide-down (the pattern `useSheet` exists to avoid) | none | Close animation missing | Low | Use `useSheet` like FoodLogPage.tsx:763-766 | Create Food → keyboard icon → close: it should slide down | SAFE-FIX |
| NU-29 | WeekStrip / CalendarSheet size | WeekStrip.tsx:12, 206-230; CalendarSheet.tsx:95-131 | ±26 weeks gives 371 DayPills (each with an SVG) per component, re-rendered on every date and weekDays change | none | Possible jank on low-end phones | Low | Virtualize or limit the rendered weeks to ±4 around the viewport | Performance trace of a day tap with 4× CPU throttle | SAFE-FIX |
| NU-30 | FoodTile AnimatedHeight | FoodTile.tsx:104-125 | One ResizeObserver plus an explicit height per tile in History, Library and the timeline. When text wraps on resize, content is clipped for 300ms | none | Overhead and brief clipping | Low | Animate only while the density setting changes (gate by a `settingsChanged` flag) or use `interpolate-size` | Resize the window narrow with a long history list | SAFE-FIX |
| NU-31 | Plate empty-state swap | PlatePanel.tsx:78 | After the last row collapses (300ms), the blue empty card pops in with no fade | Add_Flow/3_mf_your_plate_expanded.png | Abrupt | Low | Add `motion-safe:animate-in fade-in-0` to the empty card | Swipe-delete the last plate item | SAFE-FIX |
| NU-32 | AI photo previews | AiPanel.tsx:74-82 | The object URL is revoked only in `onLoad`, so a photo removed before load or that fails to load leaks | none | Minor memory leak | Low | Revoke in a `useEffect` cleanup | Add and remove photos quickly | SAFE-FIX |
| NU-33 | Scan overlays | ScanPanel.tsx:56-65, 143-156 | `starting` shows a black frame with no indicator. The error banner and the "detector unsupported" note both sit at `bottom-6` and overlap | none | Visual overlap, no loading cue | Low | Spinner while `starting`, and stack the banners | iOS Safari (no BarcodeDetector) with an invalid manual lookup | SAFE-FIX |
| NU-34 | Clearing the search box | FoodLogPage.tsx:926 | After clearing, `search !== debouncedSearch` for 300ms, so a 6-row skeleton flashes before History returns | 2_mf_search_with_plate_pill.png | Flash | Low | Don't force `isLoading` when the new query is empty (History is cached) | Type "egg", clear it, watch for a flash | SAFE-FIX |
| NU-35 | Timeline deletes and moves | use-food-log.ts:205-221 (invalidate only) | Delete, bulk delete and move wait for the network round-trip before the row collapses. Rows show no pending dim | Multi_Select/10_remove_confirm.png | Feels laggy on slow networks | Medium | Optimistic `setQueryData` removal with rollback, or dim affected rows while pending | Slow 3G, remove 2 selected foods | UX-DECISION |

---

## (c) Per-screen ratings

The Visual column is never MATCHED. I compared code structure against the named screenshots, but did not render our UI and compare pixels. Motion compared with MF is UNKNOWN everywhere, because MF has no video.

| Screen | Visual | Interaction | Motion (vs MF) | Data | Responsive |
|---|---|---|---|---|---|
| Food Log: header + WeekStrip + MacroSummary | PARTIAL (structure consistent with 1-timeline-consumed.png, 3-header-remaining.png, Day_Strip/0_mf_day_pill_ring.png) | PARTIAL (NU-17, NU-11) | UNKNOWN (internally: works, reduced-motion ok) | PARTIAL (week-data fallback avoids 0-flash; NU-2) | PARTIAL (desktop pager NU-17) |
| Food Log: DayTimeline + Notes | PARTIAL (vs 1-timeline-consumed.png, 2-timeline-bottom-notes.webp) | PARTIAL (NU-20, NU-9) | UNKNOWN (enter/exit present; NU-19) | BROKEN on error (NU-2); PARTIAL on switch (NU-3) | UNKNOWN |
| Multi-select (SelectionBar, sheets) | PARTIAL (vs Multi_Select/01–11) | PARTIAL (NU-20) | UNKNOWN | PARTIAL (NU-35) | UNKNOWN |
| Calendar overlay | PARTIAL (vs Day_Strip/1_mf_calendar_grid_rings.webp) | BROKEN as a modal (NU-11) | UNKNOWN | PARTIAL (rings load per viewed week) | PARTIAL (desktop scroll lock NU-11) |
| Add Food sheet: Search | PARTIAL (vs Add_Flow/2_mf_search_with_plate_pill.png, Search_Groups/*) | PARTIAL (NU-14) | UNKNOWN (NU-1, NU-15) | PARTIAL (debounce plus skeleton ok; errors as empty NU-6) | UNKNOWN |
| Food Detail | PARTIAL (vs Add_Flow/1_mf_food_detail_sheet.png, Food_Detail_Nutrients/*) | PARTIAL (Back closes the sheet, NU-14) | UNKNOWN (rings and bars animate) | PARTIAL (rings replay when targets reload) | UNKNOWN |
| Your Plate | PARTIAL (vs Add_Flow/3_…, 4_…, 5_…) | PARTIAL (NU-10, NU-26) | UNKNOWN (NU-15) | MATCHED internally (numbers summed unrounded); no MF numeric check | UNKNOWN |
| Scan (barcode) | UNKNOWN (no MF scan screenshot) | PARTIAL (NU-8) | UNKNOWN | PARTIAL (NU-7) | UNKNOWN |
| AI tab | UNKNOWN (no MF ref) | PARTIAL | UNKNOWN | PARTIAL (NU-32) | UNKNOWN |
| Quick Add | UNKNOWN (no MF ref in set) | PARTIAL (feedback is only the plate bounce) | UNKNOWN | PARTIAL | UNKNOWN |
| Library | UNKNOWN | PARTIAL | UNKNOWN | PARTIAL (NU-6) | UNKNOWN |
| Nutrition Overview | PARTIAL (vs Dashboard/Nutrition_Detail/11.png; ours adds range tabs) | PARTIAL (NU-5) | UNKNOWN (NU-4) | PARTIAL (NU-2, NU-4) | UNKNOWN |
| Create Food | UNKNOWN (no MF ref in scope) | PARTIAL (NU-27) | UNKNOWN (NU-28) | PARTIAL (`?from` fetch error not handled, CreateFoodPage.tsx:85-102) | UNKNOWN |
| Create Recipe | PARTIAL (vs Multi_Select/12–23) | PARTIAL (NU-27, NU-10) | UNKNOWN | PARTIAL | UNKNOWN |
| Nutrition Data Manager | PARTIAL (vs Nutrition_Data_Manager/01_mf_list.png, 02_mf_entry_sheet.png, 03_mf_fasting_on_keypad.png) | PARTIAL (NU-13) | UNKNOWN (NU-12) | PARTIAL (NU-13) | UNKNOWN |
| About Nutrient Goals | PARTIAL (close to Nutrient_Detail/11_mf_about_nutrient_goals_fat.png; ours adds an "Example" label) | MATCHED in substance (static page, back only) | UNKNOWN (stagger present) | n/a (static copy) | UNKNOWN |
| Foods page (My Foods) | UNKNOWN | PARTIAL | UNKNOWN | PARTIAL (ErrorState ok) | UNKNOWN |

---

## (d) Click-through checklist for the user

1. Turn on Reduced Motion at the OS level, open Add Food and the More sheet: do they still slide or zoom? (NU-1)
2. In DevTools, block `GET /food-logs/day…` and reload Food Log: can you still use the week strip and the calendar? (NU-2) Then block `/nutrition/overview`: is the back button still there? (NU-2)
3. On Slow 3G, tap a day you haven't viewed: does the page height jump when the timeline arrives? (NU-3)
4. In Nutrition Overview, switch Today → 1 Week → Today: do the bars slide from their old values or restart at 0? (NU-4) Tap a tile: does anything happen? (NU-5)
5. Block `/foods/search` and type a query: do you see "No matching results"? (NU-6)
6. On an Android phone: open Scan, then expand Your Plate. Is the camera light still on? Does pointing at a barcode navigate? (NU-7) Scan a real barcode: is there any feedback before the result? (NU-8)
7. Block note DELETE and swipe a note away: does the row stay red with no message? (NU-9)
8. With only a keyboard, try to remove an item from Your Plate. (NU-10)
9. Open the calendar and press Esc, then the browser Back button, then Tab several times. (NU-11)
10. In the Nutrition Data Manager, open a day, tap the date title, pick another date: does the sheet re-slide? (NU-12) Block DELETE and delete a day: any message? (NU-13)
11. Search, open a food, press Android/browser Back: do you land on the results or does the whole sheet close? (NU-14)
12. With CPU throttled 4×, toggle Your Plate while 50 results are loaded: is it smooth? (NU-15)
13. On desktop with a plain mouse, try to switch the macro summary to "left". (NU-17)
14. On an iPhone, long-press a food on the timeline: does an iOS callout or text selection appear? (NU-20)
15. On Create Recipe step 2, press browser Back: is the draft lost with no prompt? (NU-27)
16. On Create Food, open the keyboard-barcode sheet and close it: does it slide down or vanish? (NU-28)

---

# Appendix C — Strategy + Onboarding


Read-only audit, 2026-10-23. All paths are relative to `FE/src/` unless noted. Every claim below comes from reading the code. Nothing was run in a browser; the items that need a click are in section (d).
MF references I compared visually: `Get_Started/Basic/1.png` (intro), `Goal/2.png` (target weight and rate), `Program/6.png` and `Program/7.png` (program ready/review), `sau-khi-bam-next-1.png` (What you get).
No MF screenshots exist for the Strategy tab, check-in, Edit Goal or the 3-dot sheets, so their Visual rating is UNKNOWN. Motion against MF is UNKNOWN everywhere because no videos exist.

Global facts that apply to many items:
- `app/index.css` has no global `prefers-reduced-motion` rule. Only `motion-safe:`/`motion-reduce:` utilities are guarded. Plain `transition-*` classes still run when the user asks for reduced motion.
- tw-animate `animation-duration-*` sets `animation-duration` only. It has **no effect on CSS transitions**, which fall back to Tailwind's default 150ms. UI.md:92 ("use animation-duration-*, not duration-*") is about tw-animate enter/exit animations. It does not apply to `transition-*`.
- The onboarding wizard is state-driven: one `WizardShell` instance, with the content keyed by `stepKey`. New Program, Edit Goal and Check-in use one route per step, so the whole `WizardShell` remounts on every step.

---

## (a) Component inventory + motion

### Onboarding
| Component | Motion / micro-interaction present | Status |
|---|---|---|
| `app/(onboarding)/layout.tsx` | none (AuthGuard + bg) | n/a |
| `pages/OnboardingPage.tsx` | skeleton while state loads (49-55); ErrorState + retry (48) | OK |
| `WizardShell.tsx` | step content enters with fade plus a direction-aware slide (`key={stepKey}`, 103-114, motion-safe); progress bar width transition 300ms with motion-reduce (95-97); back 44px (75-82); Next has pending spinner and guard (124-135); focus moves to content on step change (66-68) | Works. Enter-only (no exit anim). Back stays enabled while pending (ON-1); scroll is not reset (ON-2) |
| `StepRenderer.tsx` | none | n/a |
| `IntroStep.tsx` | staggered timeline rows (33-34) | Works |
| `ChoiceStep.tsx` / `OptionCard.tsx` | staggered card enter (OptionCard 29-30), border/radio-dot transition (34, 57-65), press scale motion-safe (43); info note enters (ChoiceStep 48) | Works. No arrow-key roving (ON-19) |
| `BirthDateStep.tsx` / `HeightStep.tsx` (shared `WheelPicker`) | native scroll-snap wheel, 100ms settle; under-18 alert enters | Works |
| `WeightStep.tsx` / `RulerSlider.tsx` | native horizontal scroll (touch momentum = native inertia), rAF-coalesced onChange with cleanup (54-70), keyboard ±0.1/±1 | Works on touch/trackpad. No mouse drag (ON-4), no snap (ON-5), initial-position flash (ON-6) |
| `WeightHistoryStep.tsx` | skeleton + ErrorState retry | OK |
| `BodyFatStep.tsx` | Radix slider (touch-none); fill bar width transition without motion-reduce (67); tick dots color transition | Works (ON-18) |
| `EstimateChatStep.tsx` / `ChatBubbles.tsx` | typing dots bounce (motion-safe), bubbles zoom/slide in, reveal timers cleaned up (64-84), reply chips staggered, auto-scroll smooth (87) | Works. Smooth scroll ignores reduced motion (ON-14). Invalid TDEE is silently dropped (ON-15) |
| `ValueStep.tsx`, `WhatYouGetStep.tsx`, `First30DaysStep.tsx`, `PlanStep.tsx` | staggered list enters; PlanStep check badge zoom-in | Works |
| `ReferralStep.tsx` | affiliate field slides in (58) | Works |
| `GoalTargetStep.tsx` | ruler + highlight band, Radix rate slider, zone pill color transition, preview cards skeleton → value (keepPreviousData) | %BW input broken for typing (ON-8). Stale numbers have no pending cue (ON-17) |
| `GoalSummaryStep.tsx` | banner zoom-in + staggered cards | Works |
| `DistributionStep.tsx` | custom panel slides in; day toggles h-11 | Works. Slider hit area about 32px (ON-16) |
| `CalorieShiftAlert.tsx` | slide/fade in; scrollIntoView respects reduced motion (34-37); fix buttons min-h-11; focus returns to content | Works (good reference pattern) |
| `ProgramReadyStep.tsx` | 7 columns stagger slide-in (70-71); IntersectionObserver unlocks Done (33-47) | Works. No sticky day row like MF (ON-11) |
| `FeatureCarouselStep.tsx` | native scroll-snap swipe, arrow buttons 44px, dot width transition | Works. Smooth scroll ignores reduced motion; one label is Vietnamese (ON-13) |
| `ConsentStep.tsx` | switches disabled while pending; button guard | OK |

### Strategy
| Component | Motion / micro-interaction present | Status |
|---|---|---|
| `pages/ProgramPage.tsx` | sections enter (ENTER, 36-37); skeleton (101-107); EmptyState; ErrorState | Skeleton shape mismatch / CLS (ST-8) |
| `CheckInDial.tsx` | arcs draw from 0 after a rAF flip (54-58, cleaned up); `motion-safe:transition-[stroke-dashoffset]` | **Timing broken: runs 150ms, not 700ms** (ST-1). Goal arc pops in late (ST-2) |
| `CheckInButton.tsx` | pulse ring motion-safe, press scale motion-reduce | Works |
| `ProgramCard.tsx` / `WeekMacroChart.tsx` | block heights tween via `flex-grow` 300ms with motion-reduce (43); selected-day pill color/scale | Works. Animates a layout property, no mount animation (ST-7). Day pills 40px (ST-6) |
| `GoalCard.tsx` | none (static stats) | OK |
| `GoalHistory.tsx` | `useExitingList` + `CollapseItem` enter/leave | Works (rows animate in on first load because the list starts empty) |
| `ActionChip.tsx` | h-11, press scale, motion-reduce | Works. Links do not set flow direction (ST-3) |
| `ProgramActions.tsx` | Dialog-based sheets (Radix enter/exit), pending-guarded close (346-348), submit guards (171, 241, 283), inline validation | Works |
| `pages/NewProgramStepPage.tsx` + `use-wizard-nav.ts` | WizardShell per route; direction from `flow.store` | Remounts per step (ST-5). History/back issues (ST-4) |
| `EditorStep.tsx` | per-day fields fade (key=selected, 117-120); chart tweens while sliding | Works |
| `RangeField.tsx` / `NumberField.tsx` | draft-string inputs, focus ring transition | Silent clamping, a11y (ST-11) |
| `ManualTargetsStep.tsx` | fields fade per day; mismatch warning live region | Works |
| `pages/GoalEditStepPage.tsx` | reuses GoalTargetStep/GoalSummaryStep; preview keepPreviousData (use-goal-edit.ts:28) | ON-8 applies here too. Double error (ST-9). Slider max (ST-10) |
| `pages/CheckInHubPage.tsx` / `CheckInHub.tsx` | module list stagger, opacity for later modules, done badge color transition | Works |
| `pages/CheckInModulePage.tsx` | loading shell → module shell | Double enter (ST-12) |
| `IntroModule.tsx` | reuses FeatureCarouselStep | ST-13 |
| `PartialLoggingModule.tsx` / `IncompleteDaysChart.tsx` | internal steps slide (one shell instance, so the progress bar animates); bars grow from 0 (rAF flip, cleaned up, motion-reduce) with height transition; selection hatch fade | Works. Back during save (ON-1) |
| `ProgramUpdateModule.tsx` / `OrbitAnimation.tsx` | 1.6s review screen (timer cleaned up, 69-72); 3 orbits at 3.2/4.4/5.6s plus a pulsing nucleus, all motion-safe (static dots under reduced motion); result enters with staggered reasons | Works. Footer pop-in (ST-14) |
| `FeasibilityNotice.tsx` | none (role=alert, pops in) | ST-15 |
| Stores `program-wizard.store.ts`, `goal-edit.store.ts`, `check-in-progress.store.ts`, `flow.store.ts` | in-memory zustand; check-in progress persisted to sessionStorage | No hydration risk found: the pages that read them render skeletons on the server because query data is client-only |

---

## (b) Issues

Severity: High = broken flow or data; Medium = visible bug or real usability gap; Low = polish, a11y or perf.

| ID | Page / component | file:line | Current behaviour | MF ref | Gap | Sev | Proposed fix | Test plan | Type |
|---|---|---|---|---|---|---|---|---|---|
| ON-1 | WizardShell (Onboarding, PartialLogging, ProgramUpdate, New Program) | WizardShell.tsx:74-82; use-onboarding-wizard.ts:244-245; PartialLoggingModule.tsx:70,80 | The header Back button stays enabled while `isPending`. `next()` captured the old `index`, so when the save resolves it calls `go(visibleSteps[index+1])`. If the user tapped Back during the save, they get jumped 2 steps forward. PartialLogging works the same way: back during save, then `onDone` → `go('confirm')`. | none | wrong step after a race | Medium | Disable Back (or no-op `onBack`) while `isPending` in WizardShell | Throttle the network to Slow 3G. On the Sex step, tap Next then Back right away; you should stay on the previous step. Same on Partial Logging "select" → Next → Back | SAFE-FIX |
| ON-2 | Onboarding step change | WizardShell.tsx:66-68 | The steps are state, not routes. Focus uses `preventScroll` and nothing resets the window scroll, so a long step scrolled down (Goal target, Ready, Consent) leaves the next step opening mid-page. | none | stale scroll | Medium | In the same effect, call `window.scrollTo({top:0})` (instant) when `stepKey` changes | Scroll to the bottom of Goal target → Next → Goal summary should start at the top |
| ON-3 | Onboarding navigation | use-onboarding-wizard.ts:219-224 | Steps never push history. Browser/Android Back leaves `/onboarding` (OnboardingGuard sends the user back and the draft resumes). | none | no system-back per step | Medium | Push `?step=` with `history.pushState` and handle popstate → `back()`; or intercept popstate | Press browser Back on step 5: you should land on step 4 and still be in the wizard | UX-DECISION |
| ON-4 | RulerSlider (weight, goal weight; also Edit Goal) | RulerSlider.tsx:113-125 | Only native horizontal scroll. A desktop mouse cannot drag it, and a vertical wheel does not move it. Only trackpad, shift+wheel or the keyboard work. | Goal/2.png (drag ruler) | cannot drag with a mouse | Medium | Add pointer handlers for `pointerType==='mouse'` that call `setPointerCapture` and move `scrollLeft -= movementX`; map `wheel` deltaY → scrollLeft | Desktop Chrome with a mouse: drag the ruler and use the wheel on it. The value should change |
| ON-5 | RulerSlider | RulerSlider.tsx:61-70 | There is no snapping. The value rounds to 0.1, but at rest the needle can sit up to 5px between ticks. | Goal/2.png (needle on tick) | imprecise rest | Low | On `scrollend`, or after 120ms idle, `scrollTo({left: steps*TICK_WIDTH, behavior: reduce?'auto':'smooth'})` | Fling the ruler: it should settle exactly on a tick | SAFE-FIX |
| ON-6 | RulerSlider mount | RulerSlider.tsx:47-52 | The initial `scrollLeft` is set in `useEffect` (after paint), which risks a 1-frame flash at `min` (30 kg). | none | flash | Low | `useLayoutEffect` | Open the Weight step with CPU 6x throttle: the ruler should not jump | SAFE-FIX |
| ON-7 | Ruler drag perf | use-onboarding-wizard.ts:181-184 | Every rAF onChange → `patch` → `writeDraft` (JSON plus sessionStorage) and a new preview request: about 60 writes/s while dragging. | none | possible jank on low-end devices | Low | Debounce `writeDraft` (300ms) or write on step change only | Performance panel while dragging the Weight ruler: no long tasks | SAFE-FIX |
| ON-8 | GoalTargetStep %BW input (Onboarding + Edit Goal) | GoalTargetStep.tsx:163-167 | Controlled `value={ratePercent}` only commits values in [0.1, 1.5]. Typing "0", "0." or clearing the field reverts immediately, so the user cannot type a new value. | Goal/2.png (editable inputs) | input unusable | Medium | Use the draft-string pattern from `NumberField.tsx:18-42` (keep the typed text, commit valid numbers, reset on blur) and show an inline range error | Select all in the %BW box, type `0.45`: it should show 0.45 and the slider should move |
| ON-9 | GoalTargetStep rate rows | GoalTargetStep.tsx:145-185, 135-144 | Only "% BW per week" is editable. kg/week, kg/month and %BW/month are read-only. The label sits in the left column. The slider fills from min, with no green "Standard" band. | Goal/2.png | layout and editability differ | Low | Four editable cells in MF order (sign, kg, %BW, label on the right); track band 0.35–0.65 | Compare with Goal/2.png side by side | UX-DECISION |
| ON-10 | Primary buttons (wizard footers) | WizardShell.tsx:126; EstimateChatStep.tsx:158; ConsentStep.tsx:96 | Primary buttons are `rounded-full` pills. MF uses a white rectangle with about a 12px radius. | Basic/1.png, Goal/2.png, Program/6.png | visual mismatch | Low | `rounded-xl`, or match the radius measured from the screenshot | Overlay screenshot | UX-DECISION (app-wide style) |
| ON-11 | ProgramReadyStep (Onboarding + New Program review) | ProgramReadyStep.tsx:55-99 | The day-letter row scrolls away with the chart. | Program/7.png (sticky M T W… under the header) | missing sticky header | Low | Copy the letters row as a `sticky top-[header]` element once the chart leaves the viewport (IntersectionObserver) | Scroll the Ready screen: the letters should stay pinned |
| ON-12 | Progress bar at section boundary | WizardShell.tsx:95-97; use-onboarding-wizard.ts:160-165 | Progress is per section, so moving from Basics (100%) into Goal animates a 300ms shrink to 1/n, which reads as "going back". | Goal/2.png shows the per-section bar; the animation is unknown | odd motion | Low | Key the bar by section, or skip the transition when the section changes | Finish Basics → Next: the bar should not visibly shrink | UX-DECISION |
| ON-13 | FeatureCarouselStep (Onboarding + check-in Intro) | FeatureCarouselStep.tsx:76, 136, 82-91 | `scrollTo({behavior:'smooth'})` ignores reduced motion. The next arrow has `aria-label="Trang sau"` (Vietnamese in an English UI). The track has no keyboard ←/→. | sau-khi-bam-next-*.png | a11y/motion | Low | Read `matchMedia` like CalorieShiftAlert.tsx:35; label "Next page"; add arrow keys on the region (tabIndex=0) | Turn on reduced motion and tap the arrow: it should jump instantly. Screen reader should read "Next page" | SAFE-FIX |
| ON-14 | EstimateChatStep auto-scroll | EstimateChatStep.tsx:87 | Smooth `scrollIntoView` runs even with reduced motion. | none | motion | Low | Same matchMedia guard | Reduced motion: no smooth scroll | SAFE-FIX |
| ON-15 | EstimateChat "Edit expenditure" sheet | EstimateChatStep.tsx:165-187 | On close, values outside 1000–6000 or non-numeric input are silently discarded with no message. | AI-chat-1.png (not compared in detail) | no validation feedback | Low | Inline error under the input; keep a Done button disabled until valid | Type 500 → close: an error should show and the value should not silently revert | UX-DECISION |
| ON-16 | Slider touch height | GoalTargetStep.tsx:143 (`py-3`, about 40px); DistributionStep.tsx:94 (`py-2`, about 32px); RangeField.tsx:76 (about 40px) | Radix root hit area is under 44px. | none | touch target | Low | `min-h-11` on the Slider root | Measure in devtools ≥ 44px | SAFE-FIX |
| ON-17 | Live preview cards (Onboarding goalTarget, Edit Goal params) | use-onboarding-wizard.ts:137-140; GoalTargetStep.tsx:68-91; GoalEditStepPage.tsx:53-54 | keepPreviousData shows the old budget and end date for 600ms (300ms in Edit Goal) plus the fetch time, with no "updating" cue. | Goal/2.png (static) | stale data looks final | Low | Dim the cards or show a small spinner while `isPlaceholderData \|\| debounce pending` | Drag the ruler fast: the cards should dim until the new numbers arrive | UX-DECISION |
| ON-18 | Unguarded transitions under reduced motion | BodyFatStep.tsx:67; FeatureCarouselStep.tsx:128 (`transition-all` width); OptionCard.tsx:34,57,63 | These still animate with reduced motion on (no global rule). | none | reduced motion | Low | Add `motion-reduce:transition-none`, or one global `@media (prefers-reduced-motion: reduce){*{transition-duration:0s!important}}` | Emulate reduced motion and toggle options: no tweens | SAFE-FIX |
| ON-19 | OptionCard radiogroup | OptionCard.tsx:38-44, 89 | `role=radio` buttons are each a Tab stop. Arrow keys do nothing. | none | a11y pattern | Low | Roving tabindex + ←/→/↑/↓ (or Radix RadioGroup) | Keyboard: Tab into the group, arrows move the selection | SAFE-FIX |
| ST-1 | CheckInDial arc draw | CheckInDial.tsx:44 | `motion-safe:animation-duration-700` on a **transition** has no effect, so `transition-[stroke-dashoffset]` uses the default 150ms. The "draw" is close to a snap. | none (no Strategy refs) | wrong timing | Medium | Replace with `motion-safe:duration-700` (transition-duration), matching `animate-ring-fill`'s 700ms | Open Strategy: both arcs should sweep for about 0.7s. With reduced motion they should appear static | SAFE-FIX |
| ST-2 | CheckInDial goal arc | CheckInDial.tsx:54-58, 75-82 | If `goalProgress` resolves after mount, the outer `Arc` mounts with `ready=true`, so it appears at its final offset with no draw. | none | inconsistent | Low | Gate `ready` on `goalPercent!==null` too, or key the Arc and rAF inside it | Slow network: the outer ring should also sweep in | SAFE-FIX |
| ST-3 | Entry links into flows | ProgramCard.tsx:51; GoalCard.tsx:76-77; CheckInButton.tsx:11-13; flow.store.ts:11-14 | Exits set `direction='back'` (use-wizard-nav.ts:81, NewProgramStepPage.tsx:448, GoalEditStepPage.tsx:80, CheckInModulePage.tsx:97). The entry links never reset it, so the next flow's first screen slides in **from the left**. | none | wrong direction | Medium | `onClick={() => setDirection('forward')}` on those links (or reset to forward in the flow pages on mount) | Finish Edit Goal, then tap New Program: the first step should slide in from the right | SAFE-FIX |
| ST-4 | Route-based flows: back behaviour | use-wizard-nav.ts:72-79; GoalEditStepPage.tsx:105-109; CheckInModulePage.tsx:46-49; CheckInHubPage.tsx:23-26 | In-app Back uses `router.push`, so history grows. Browser Back after an in-app Back walks *forward* through steps. Browser back/forward never updates `direction`, so the slide direction is wrong. Exits push `/program`, so Back from Strategy re-enters a reset flow. | none | history pollution | Medium | In-app Back → `router.back()` when the previous entry is the prior step; exits → `router.replace`; set direction from popstate (PageTransition.tsx already detects traverse) | Do Style→Diet→Floor, in-app Back twice, then browser Back: you should leave the flow and not return to Diet | UX-DECISION |
| ST-5 | New Program / Edit Goal shells | NewProgramStepPage.tsx:467-483; GoalEditStepPage.tsx:100-111 | One route per step remounts `WizardShell`, so the progress bar `transition-[width]` never runs (it jumps) and the header re-mounts. Onboarding animates it. | Program/6.png shows the bar | inconsistent motion | Low | Lift the shell (header/progress) into `app/(protected)/program/new/layout.tsx`, or accept the jump | Next in New Program: the bar should grow smoothly | UX-DECISION |
| ST-6 | WeekMacroChart day selector | WeekMacroChart.tsx:113 (`h-10`) | Selectable day pills in the Editor/Manual steps are 40px tall. | none | touch target < 44 | Low | `h-11` | Devtools measure | SAFE-FIX |
| ST-7 | WeekMacroChart bars | WeekMacroChart.tsx:43, 79-86 | Heights tween through `flex-grow` (a layout property, reflow every frame while dragging). No mount animation on Strategy, while ProgramReadyStep staggers its bars. `min-h-9`↔`min-h-0` jumps when grams cross 0. | Program/6.png (static) | jank risk, inconsistent | Low | Keep flex-grow (cheap with 21 cells) but add a mount rise (`animate-chart-rise` already exists in index.css:114-123); transition `min-height` too | Edit Program → change protein: the blocks should tween. Check the Performance panel while dragging the editor slider | UX-DECISION |
| ST-8 | ProgramPage loading | ProgramPage.tsx:101-107, 122-147 | The skeleton is always a 288px circle + 288px + 160px. When `checkInDue`, the real content is a roughly 120px button, so a big layout jump. GoalHistory has no skeleton and pops in below. | none | CLS | Low | Use a neutral skeleton height or reserve the space; add a small GoalHistory skeleton while `history.isLoading` | Throttle: compare the skeleton with the final layout | SAFE-FIX |
| ST-9 | Error feedback duplicated | use-goal-edit.ts:39-42 + GoalEditStepPage.tsx:122,179-181; use-check-in.ts:61-64 + CheckInModulePage.tsx:136-141 | The mutation `onError` toasts **and** the page shows an inline FormErrorAlert/FeasibilityNotice. The rule in use-program.ts:51 says inline only, no toast. | none | double message | Low | Drop the toasts in those hooks | Force a 400 on Edit Goal Done: you should see only the inline notice | SAFE-FIX |
| ST-10 | Edit Goal rate slider | GoalEditStepPage.tsx:150-157; GoalTargetStep.tsx:137-139 | The slider max is fixed at 1, but `onRateChange` clamps to `rateBounds.fastMaxPercent`, so the thumb snaps back while dragging past the clamp. | none | jumpy thumb | Low | Pass `maxRate` into GoalTargetStep | Weight-gain goal: drag to the max, no snap-back | SAFE-FIX |
| ST-11 | NumberField / RangeField | NumberField.tsx:36-55; RangeField.tsx:53-59; EditorStep.tsx:126-135 | Out-of-range input is clamped silently: the chart shows the clamped value while the input shows the typed text until blur. The error `<p role=alert>` is not linked with `aria-describedby` and re-announces on every keystroke. | none | feedback/a11y | Low | Show "max X" inline when clamped; add `aria-describedby`; `aria-live=polite` instead of role=alert | Type 99999 kcal in the editor: you should see a message and the input and chart should agree | SAFE-FIX |
| ST-12 | CheckInModulePage first load | CheckInModulePage.tsx:51-89 | A loading `WizardShell` (stepKey="loading") is replaced by the module's own shell, so the content slides in twice on a cold load or refresh. | none | double animation | Low | Render the skeleton inside the module shell, or drop the enter animation for the loading shell | Hard-refresh `/program/check-in/partial-logging`: there should be one slide | SAFE-FIX |
| ST-13 | IntroModule finish | CheckInModulePage.tsx:108-111 | `setModules.mutate` fires and the page navigates at once. The "Saving…" pending state is never seen, and a failure toast appears on the hub later. | none | fire-and-forget | Low | Navigate in `onSuccess` (keep the pending label), or accept optimistic | Throttle → Next Module: "Saving…" should show, then the hub | UX-DECISION |
| ST-14 | ProgramUpdateModule result | ProgramUpdateModule.tsx:98-121, 126 | After 1.6s the footer goes from none to 2 buttons with no animation, so the content jumps. The `aria-live` <p> mounts already containing its text, so it may not be announced. | none | polish/a11y | Low | Give the footer `motion-safe:animate-in fade-in slide-in-from-bottom-2`; keep a persistent live region and swap its text | Watch the transition; check that VoiceOver announces "Reviewing…" | SAFE-FIX |
| ST-15 | FeasibilityNotice | FeasibilityNotice.tsx:39 | It appears with no enter animation, while CalorieShiftAlert (same role) slides in and scrolls itself into view. | none | inconsistent | Low | Same enter classes + scrollIntoView pattern as CalorieShiftAlert.tsx:34-44 | Trigger an infeasible preview: the notice should animate in and be visible above the footer | SAFE-FIX |
| ST-16 | ProgramUpdate 1.6s review | ProgramUpdateModule.tsx:30, 69-72 | The min-display timer still runs with reduced motion on (the orbit is static). | none | n/a | Info | Keep it (pacing, not motion) | n/a | n/a |

**Counts:** High 0 · Medium 8 (ON-1, ON-2, ON-3, ON-4, ON-8, ST-1, ST-3, ST-4) · Low 26 · Info 1. Total 35.
SAFE-FIX: 22 · UX-DECISION: 12 (ON-2 and ON-8 count as SAFE-FIX).

Things I checked that are fine: the rAF loops all cancel (RulerSlider 54-59, CheckInDial 55-58, IncompleteDaysChart 30-33). Chat/review timers are cleared. Radix sliders set `touch-none`. Submit buttons are pending-guarded (WizardShell 127-131, ConsentStep 97-101, ProgramActions Footer 128, ConfirmDialog). Sheets cannot close while pending (ProgramActions.tsx:346-348). The editor fields get a fresh draft per day (`key=selected`). Errors have retry (OnboardingPage 48, EstimateChat 90-99, WeightHistoryStep 35-52, ProgramSteps 59-76, NewProgram 193-227, GoalEdit 124-137, CheckIn hub/module). There is no infinite skeleton on a known error path. Hydration: Date, sessionStorage and zustand-persist are only read inside client-only branches that render after query data, and the SSR output is a skeleton, so I found no mismatch.

---

## (c) Per-screen ratings
Legend: MATCHED / PARTIAL / MISSING / BROKEN / UNKNOWN. Visual is MATCHED only after comparing with the named screenshot. Motion vs MF is always UNKNOWN. Interaction, Data and Responsive are rated from the code.

| Screen | Visual | Interaction | Motion | Data | Responsive | Notes |
|---|---|---|---|---|---|---|
| Onboarding Intro | PARTIAL (Basic/1.png: timeline matches; button is a pill vs MF rectangle) | MATCHED behaviour (Go to Basics) | UNKNOWN | n/a | OK | ON-10 |
| Onboarding Basics choice steps | UNKNOWN (not compared) | PARTIAL (ON-1, ON-2, ON-3, ON-19) | UNKNOWN | OK (saved per step) | OK | |
| Birth / Height wheels | UNKNOWN | OK | UNKNOWN | OK | OK | |
| Weight ruler | UNKNOWN | PARTIAL (ON-4/5/6) | UNKNOWN | OK | OK | |
| Body fat | UNKNOWN (body-fat refs not compared) | OK | UNKNOWN | OK | OK | ON-18 |
| Estimate chat | UNKNOWN (AI-chat-1/Chat-2 not compared) | PARTIAL (ON-15) | UNKNOWN | OK (error + retry) | OK | ON-14 |
| Goal target + rate | PARTIAL (Goal/2.png: cards and ruler match; rate rows differ) | **BROKEN** (%BW typing, ON-8) / ruler mouse (ON-4) | UNKNOWN | PARTIAL (stale cue, ON-17) | OK | |
| Goal summary | UNKNOWN (Goal/3-6 not compared) | OK | UNKNOWN | OK | OK | |
| Program choice steps / Distribution | UNKNOWN | OK (ON-16) | UNKNOWN | OK | OK | |
| Program ready / review (Onboarding + New Program) | PARTIAL (Program/6.png chart matches; Program/7.png sticky day row missing) | MATCHED behaviour vs Program/6.png (Done disabled until scrolled) | UNKNOWN | OK | OK | ON-11 |
| Carousel / What you get / Plan / First 30 / Consent | PARTIAL for What you get (sau-khi-bam-next-1.png: list + dividers match; pill button, no tagline); rest UNKNOWN | OK | UNKNOWN | n/a | OK | ON-13 |
| Strategy (ProgramPage) | UNKNOWN (no MF refs) | OK | UNKNOWN; internally the dial arc timing is BROKEN (ST-1) | PARTIAL (CLS, ST-8) | OK (dial min(78vw,300px), GoalCard @container) | |
| Strategy sheets (Edit Program / style / TDEE / end) | UNKNOWN | OK | UNKNOWN | OK | OK | |
| New Program wizard (style→review, editor, manual) | UNKNOWN except review | PARTIAL (ST-4, ST-6, ST-11) | UNKNOWN; internal direction BROKEN on entry (ST-3); progress bar jumps (ST-5) | OK | OK | |
| Edit Goal (params, review) | UNKNOWN (Goal/2 layout shared) | **BROKEN** %BW input (ON-8), ST-10 | UNKNOWN | PARTIAL (ST-9 double error, ON-17) | OK | |
| Check-in hub | UNKNOWN | PARTIAL (ST-4) | UNKNOWN | OK | OK | |
| Check-in Intro module | UNKNOWN | PARTIAL (ST-13) | UNKNOWN | OK | OK | |
| Check-in Partial Logging | UNKNOWN | PARTIAL (ON-1 race) | UNKNOWN | OK | OK | |
| Check-in Program Update | UNKNOWN | OK | UNKNOWN (orbit respects reduced motion) | PARTIAL (ST-9 double error) | OK | ST-14 |

---

## (d) "User should click to confirm" checklist
1. Onboarding, Goal target: select the %BW box, type `0.45`. Today I expect the field to refuse (ON-8). Do the same in Strategy → Edit Goal.
2. Desktop with a mouse: try to drag the weight ruler and to scroll it with the wheel (ON-4).
3. Onboarding: scroll to the bottom of Goal target or Ready → Next. Does the next step open scrolled down? (ON-2)
4. Throttle the network (Slow 3G), tap Next then Back quickly on a Basics step and on Partial Logging "select". Where do you land? (ON-1)
5. Strategy tab: watch the check-in dial. It should sweep for about 0.7s; I expect a near-instant 150ms snap (ST-1).
6. Finish Edit Goal (or exit any check-in), then tap New Program. Does the first step slide in from the left? (ST-3)
7. New Program: Style → Diet → Floor, tap the in-app Back twice, then press browser Back. Do you return into Diet? (ST-4)
8. New Program: tap Next between steps and look for (a) the progress bar jumping (ST-5) and (b) any flash of the `(protected)/loading.tsx` dashboard skeleton between steps. I believe the transition keeps the old UI, but it could not be verified without running.
9. Onboarding: on browser/Android Back in the middle of the wizard, does it leave the wizard? (ON-3)
10. Turn on OS reduced motion: carousel arrows and chat auto-scroll should not animate smoothly (ON-13, ON-14). Body-fat fill and option borders still tween (ON-18).
11. Force a failing Edit Goal save or check-in Accept: toast **and** inline error both appear (ST-9).
12. Hard-refresh `/program/check-in/partial-logging`: does the content slide in twice? (ST-12)
13. Strategy with check-in due, on a slow network: the skeleton circle jumps to the small CHECK IN button (ST-8).
14. 320px width: the editor day pills (40px) and the Distribution slider (about 32px) are hard to hit (ST-6, ON-16).

---

# Appendix D — Shell, primitives, Other screens


Read-only audit, 2026-10-23. No source file was edited. Paths are relative to `L:\workspace\personal_project\MacroOS\FE\src` unless they start with `Docs/`.
MF refs used: `Docs/MacroFactor_UI/UI/More/01_more_top.png`, `More/04_more_theme_data_community.png`, `Full_Body/01_list.png`, `Full_Body/09_compare_with_deltas.png`, `Progress_Photos/05_list_by_month.png`, `Progress_Photos/06_viewer_front.webp`, `Docs/MacroFactor_UI/MOS_Bugs/shortcuts_sheet_overlapped_by_nav.png`. The refs are static screenshots, so every Motion-vs-MF rating is UNKNOWN.

Versions checked in node_modules: tw-animate-css 1.4.0, vaul 1.1.2, next 16.1.6, radix-ui 1.5, sonner 2.0.7, nextjs-toploader 3.9.17. `index.css` imports `tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css` (which redefines `accordion-down/up` to also read `--accordion-panel-height`) and `theme.css`.

---

## (a) Primitive inventory and motion

Counts are JSX instances outside `components/ui/` (grep `<Name`), with the number of files in brackets.

| Primitive | Count | Built on | Open/close motion | Close animation survives unmount? | Reduced motion | Scroll-lock / focus / Esc / Back / keyboard |
|---|---|---|---|---|---|---|
| `SheetFrame` (bottom sheet, the main sheet) | 36 [32 files] | `ui/dialog` (Radix Dialog) | phone: `slide-in-from-bottom` (100%) + fade, `animation-duration-300`, ease-out; ≥sm: `zoom-in-95` + fade, 250ms (`dialog.tsx:77`). Overlay fades in 100ms (`dialog.tsx:52`) | Yes, when the consumer keeps it mounted (Radix Presence; `useSheet` contract `hooks/use-sheet.ts:18-21`). No in the places that use `{cond && <Sheet open/>}` (OT-3) | No `motion-safe`/`motion-reduce` (SH-4) | Radix gives scroll-lock, focus trap and focus restore, and Esc. Back: `useBackToClose` (`dialog.tsx:28`). iOS keyboard: `useVisibleViewport` → `--vv-height/--vv-bottom` (`dialog.tsx:70-85`). Drag handle is drawn (`SheetFrame.tsx:56-59`) but swiping does nothing (SH-6) |
| `PickerSheet` | 11 [3] | `ui/dialog` | same as Dialog | yes (always mounted in ProfileForm) | no | same as Dialog; default button label is `'Xong'` (SH-11) |
| `ChoiceSheet` | 5 [2] | SheetFrame | same, plus a 180ms delay before closing after a pick (`ChoiceSheet.tsx:14,70`) | yes | no | same; radio dot invisible in light theme (SH-5) |
| Raw `Dialog` | 10 [10] | Radix | same | depends on the consumer | no | same |
| `ConfirmDialog` / AlertDialog | 16 [16] | Radix AlertDialog | fade + zoom-95, `duration-100` (`alert-dialog.tsx:31,53`) | yes | no | Radix gives focus/Esc and `autoFocus` Cancel. **No Back-to-close** (SH-2) |
| `ui/sheet`, `ui/drawer` (vaul) | 0 | Radix / vaul | – | – | – | not used; vaul is a dead dependency |
| `ui/tabs` | 3 [1] (AddFoodDialog) | Radix Tabs | the active tab changes colour/shadow only (`transition-all`); no sliding indicator | – | – | `h-9` = 36px target (SH-18) |
| Custom tablists | `MetricDateTabs`, Gallery `AngleTabs` | hand-rolled | **the indicator slides**: `transition-[transform,width] 300ms ease-out` (`MetricDateTabs.tsx:68-73`), `transition-transform 300ms` (`GalleryPage.tsx:72-76`). Both have `motion-reduce:transition-none` | – | yes | radiogroup/tablist without arrow keys (OT-15) |
| `ToggleGroup` / `ChoiceGroup` (segmented) | 10 [5] | Radix ToggleGroup | colour change only | – | – | min-h-11 OK |
| Carousel (embla) | 0 | – | – | – | – | `ui/carousel.tsx` is not used. The swipe surfaces are hand-rolled: `SwipeArea` (no drag-follow), Gallery drag (follows at 0.6×, 200ms settle), `SwipeToDelete` (follows, 300ms settle), `WheelPicker` (native scroll-snap) |
| Charts | `ui/chart` 0. Custom SVG uses `animate-chart-*` (21 sites, all motion-safe) | – | keyframes in `index.css:91-141` | – | yes | – |
| Progress bar | `ui/progress` 0 consumers | – | `transition-all` on the indicator | – | – | – |
| Buttons | `Button` 104, `IconButton` 18 | cva | `transition-all duration-150`, `active:scale-[0.97]` on touch, `motion-reduce:active:scale-100`; global coarse-pointer `:active{opacity:.8}` (`index.css:165-170`) | – | partial | sizes `default/sm/icon/icon-sm` are 44px on phone and 32px on md+ |
| Forms | `<form` 23, `FormField` 33 | RHF + zod | none | – | – | – |
| Skeleton | 132 [59] | `animate-pulse` | pulse | – | **not prefixed** (`skeleton.tsx:7`) | – |
| Spinner (`Loader2 animate-spin`) | 50 | – | spin | – | 2/50 prefixed (an essential indicator, so acceptable) | – |
| `ErrorState` | 33 [31] | – | only the retry icon spins | – | – | "Technical details" summary is `text-xs` (SH-23) |
| `EmptyState` | 4 [3] | `ui/empty` | fades in where the consumer adds it (FullBodyPage:63) | – | yes | – |
| Popover / DropdownMenu / Tooltip | 6 / 13 / 3 files | Radix | tw-animate fade + zoom-95 + slide-2 | yes | no | Radix |
| Switch / Slider | 12 / 9 | Radix | thumb transition | – | – | – |
| Toasts | 1 Toaster | sonner | sonner's built-in animation; top-center, safe-area offset (`sonner.tsx:36-38`) | – | sonner default | – |
| Route transition | 1 (`PageTransition`) | tw-animate | fade-in 300ms; child pages (depth>1) slide in from the right (100%); Back slides in from the left (25%) | – | yes (motion-safe) | see SH-1 / SH-14 / SH-15 |
| `CollapseItem` | 7 | grid-rows | `grid-template-rows` 0fr↔1fr + opacity 300ms; enter `slide-in-from-right-6` | `useExitingList` holds rows 300ms | `motion-reduce:transition-none` | – |
| `WheelPicker` / `NumericKeypad` / `SwipeToDelete` | 11 / 9 / 4 | – | colour 150ms / active scale 100ms / translate 300ms | – | partial | – |
| Top loader | 1 | nextjs-toploader | 3px bar, `#FF8B41` hard-coded | – | – | SH-16 |

**Bottom nav (`MobileTabBar.tsx`).** It is fixed, `z-50`, with height `3.75rem + safe-area` and `pb-[env(safe-area-inset-bottom)]` (OK), and is hidden while the keyboard is open (`in-data-[keyboard=open]:hidden`). The active tab only changes colour, weight and stroke; it has no indicator and no motion. It does not hide on scroll (MF's nav doesn't either, so that's fine). Touch targets are OK: tabs are flex-1 by 60px, and "+" is `size-11`. Sheets are also `z-50` but portal to the end of `<body>`, so they stack above the nav. That fixes the old MOS_Bugs screenshot, but it depends on DOM order rather than z-index. The chart expand measures `[data-bottom-nav]` (`use-chart-expand.tsx:36`), so there is no overlap.

**Durations and easings (all of `src`).** The `duration-N` / `animation-duration-N` counts are: 300 ×130, 200 ×115, 100 ×44, 500 ×23, 400 ×15, 150 ×8, 700 ×4, 250 ×1, 1000 ×1. Easings are `ease-out` ×53, `ease-linear` ×4, `ease-in-out` ×2, `ease-in` ×1, plus four different inline `cubic-bezier(...)` curves. There are **no shared motion tokens** (no `--ease-*` or `--duration-*` in `index.css`/`theme.css`). `docs/UI.md` §8 (lines 91-94) says to use `animation-duration-*` (not `duration-*`), with micro 150, list 200, dialog 250 and drawer 300. **36** `animate-in` sites use `duration-*` instead. It works, because tw-animate falls back to `--tw-duration`, but it breaks the rule. Examples: `PageTransition.tsx:56`, `CollapseItem.tsx:35`, `MetricSections.tsx:30`, `FullBodyList.tsx:58`, `FullBodyPills.tsx:70`, `FullBodyPage.tsx:63`, `CompareSections.tsx:80`, `FullBodySheet.tsx:54,274`, `dialog.tsx:52`, `alert-dialog.tsx:31,53`, `sheet.tsx:34,59`.

**motion-safe and reduced motion (all of `src`).** There are 531 `motion-safe:` and 137 `motion-reduce:` prefixes.
- `animate-in`: 131 of 154 prefixed. The 23 unprefixed ones are all in `components/ui/*`.
- `animate-out`: 0 of 21 prefixed.
- `animate-spin`: 2 of 50.
- `animate-pulse`: 6 of 7. The unprefixed one is `skeleton.tsx`, which renders 132 times.
- Custom `animate-chart-*`, `bar-grow`, `ring-fill`: 21 of 21.
- `transition-*`: 336 utilities against 137 `motion-reduce` overrides.

There is no global `@media (prefers-reduced-motion: reduce)` rule in `index.css`. JS checks `matchMedia` in 8 places.

**Transform/opacity versus layout properties.**
- Layout-property animations:
  - the `bar-grow` keyframe animates `width` (`index.css:130-137`)
  - `transition-[width]` ×10
  - `grid-template-rows` ×13
  - sidebar `width` + main `margin` (`AppSidebar.tsx:47`, `(protected)/layout.tsx:54`)
  - `Button` base `transition-all`, plus 11 other `transition-all`
  - `MetricDateTabs` bar `width`
  - accordion `height`
- Everything else is transform or opacity.
- Note: tw-animate's `enter` keyframe always sets `transform` and `filter`, even for a fade-only animation. That is the cause of SH-1.

**Leaks in rAF, listeners and timers.**
- **Real leak:** `CropPhotoScreen.tsx:70-75` (OT-1).
- Intentional global singletons: `PageTransition.tsx:13-33` (listeners added once) and `use-back-to-close.ts:16-23` (`installSkip`).
- Intentional uncancelled rAF: `use-back-to-close.ts:54`.
- Trivial: `KeyboardViewport.tsx:54` (`focusin` rAF not cancelled).
- Clean: `use-scroll-hidden`, `use-keyboard-inset`, `use-coarse-pointer`, `use-exiting-list`, `WheelPicker`, `ChoiceSheet`, `CountUp`, `MetricDateTabs`.

**Hydration risks.**
- `PageTransition` is safe: `goingBack` is false on both server and client at first render.
- MorePage theme uses `useIsClient` (`MorePage.tsx:191,228`), which is safe.
- `useIsMobile` returns `false` and then flips after mount (`hooks/use-mobile.ts:6-19`), so `SearchableSelect` swaps popover↔sheet after hydration.
- `useLocalStorage('sidebar-collapsed')` uses `false` as the server snapshot, which gives the animated desktop jump in SH-21.
- The Login page server-renders an empty body (SH-9).
- `<html suppressHydrationWarning>` is set (`layout.tsx:115`).

---

## (b) Validity of `animate-*` and tw-animate classes (tw-animate-css v1.4.0)

Every class used in `src` was matched against Tailwind core, `tw-animate.css` (`@utility` / `--animate-*` list), `shadcn/tailwind.css` and `index.css`.

| Class (uses) | Source | Valid? | Note |
|---|---|---|---|
| `animate-in` (154), `animate-out` (21) | tw-animate `--animate-in/out` | ✔ | default 150ms ease. ui/* uses them without motion-safe |
| `animate-spin` (50), `animate-pulse` (7), `animate-bounce` (1), `animate-none` (5) | Tailwind core | ✔ | |
| `animate-accordion-down/up` (2+2) | tw-animate + overridden in `shadcn/tailwind.css` (reads `--radix-accordion-content-height` → `--accordion-panel-height`) | ✔ | only `ui/accordion.tsx:68` (0 consumers) and `ui/trace.tsx:124` |
| `animate-collapsible-down/up` (0) | tw-animate (reads `--radix-collapsible-content-height`) | ✔ defined, unused | UI.md §8 prescribes it, but `CollapseItem` uses grid-rows instead |
| `animate-caret-blink` (1) | tw-animate | ✔ | input-otp |
| `animate-chart-draw` (8) | `index.css:101-113` | ✔ | all motion-safe |
| `animate-chart-rise` (4) | `index.css:114-123` | ✔ | |
| `animate-bar-grow` (4) | `index.css:130-137` | ✔ | animates `width` (layout) |
| `animate-chart-grow` (2) | `index.css:124-141` | ✔ | |
| `animate-ring-fill` (2) | `index.css:91-98` | ✔ | |
| `fade-in-0` (142), `fade-in-50` (7), `fade-in` (2), `fade-out-0` (18), `fade-out` (2) | tw-animate `fade-in-*` (number/100) | ✔ | |
| `zoom-in-95/90/75/50`, `zoom-out-95/90` | tw-animate `zoom-*-*` (number %) | ✔ | |
| `slide-in-from-{top,bottom,left,right}-{1,2,3,4,6,8,10,52}`, `slide-out-to-*-{10,52}` | tw-animate (integer × `--spacing`) | ✔ | |
| `slide-in-from-right-full`, `-left-full` | tw-animate (`--percentage-*`/`--translate-full`) | ✔ | |
| `slide-in-from-left-1/4` | tw-animate (ratio) | ✔ | `PageTransition.tsx:58` |
| `slide-in-from-bottom` / `slide-out-to-bottom` (bare) | tw-animate (100%) | ✔ | `dialog.tsx:77` |
| `animation-duration-{150,200,250,300,400,500,700}` | tw-animate (`calc(n*1ms)`) | ✔ | `CheckInDial.tsx:44` (outside this scope) puts `animation-duration-700` on an element that has no animation, so it does nothing; `duration-700` was probably meant |
| `fill-mode-both` (5), `[animation-fill-mode:backwards]` (arbitrary) | tw-animate / arbitrary | ✔ | |
| `repeat-x` (2) | Tailwind core `background-repeat` | ✔ (not tw-animate) | |
| `duration-N` used with `animate-in` (36 sites) | Tailwind `--tw-duration`, which tw-animate falls back to | ✔ works | Breaks UI.md §8. It also changes `transition-duration` |

**Result: no invalid or undefined animation class in `src`.** The related problems are the missing `fill-mode` on staggered delays and the missing `motion-safe`. These files have `animationDelay` but no fill-mode:
- in this scope: `progress-photos/components/SessionRow.tsx:43` (OT-6)
- outside this scope: `habits/HabitCalendar.tsx:105`, `nutrient-detail/pages/NutrientSummaryPage.tsx:162,173,206`
- infinite loops, where it's fine: `onboarding/ChatBubbles.tsx:63`, `program/CheckInPage/OrbitAnimation.tsx:23`

---

## (c) Issues

Severity: High = broken behaviour or data loss, or a visible glitch on every navigation. Medium = clearly wrong in a common flow, theme or security. Low = polish or consistency.

| ID | Page/component | file:line | Current behaviour | MF ref | Gap | Sev | Proposed fix | Test plan | Type |
|---|---|---|---|---|---|---|---|---|---|
| SH-1 | PageTransition (every protected route) | `components/shared/PageTransition.tsx:54-61`; tw-animate `enter` keyframe | The wrapper runs `animate-in`, whose keyframe sets `transform` and `filter` for 300ms, even for the fade-only depth-1 pages. While it runs, the wrapper becomes the containing block for every `position:fixed` child, so fixed bars jump on each navigation. Affected: `DashboardSearchBar`, `DashboardTiles`, `food-log/SelectionBar`, `RecipeCreatePage/IngredientEditorBar`, Profile save bar | none | the bars should stay pinned to the viewport while the page animates | High | Portal the fixed bars to `document.body`. Or animate depth-1 pages with a custom opacity-only keyframe (no transform/filter) and keep the transform slide only for pages that have no fixed children | DevTools › Animations at 10% speed: switch to /dashboard, /food-log with a selection, /recipes/new. The bars should not start at the bottom of the page and then snap | SAFE-FIX (portal) |
| SH-2 | ConfirmDialog over a sheet | `components/shared/ConfirmDialog.tsx:40`; `hooks/use-back-to-close.ts`; consumers `shortcuts/components/FullBodySheet.tsx:294`, `shortcuts/pages/WeightShortcutPage.tsx:63`, `progress-photos/pages/ProgressPhotosPage.tsx:165`, `GalleryPage` | AlertDialog never pushes a history entry. Pressing Back with a confirm open fires the underlying sheet's `onPop`, so the **sheet closes and the confirm stays open** over the page, or the page navigates away | none | Back should close the top-most layer only | High | In `ConfirmDialog`, call `useBackToClose(open, () => !isPending && onOpenChange(false))`, or do it in the `AlertDialog` wrapper as `Dialog` does | Phone: Full Body + → Delete → hardware/gesture Back. Expect only the confirm to close |  SAFE-FIX |
| ~~SH-3~~ **REJECTED** (verified: `safeRedirect` in `features/auth/auth.utils.ts:40-43` already blocks `//` and absolute URLs; both call sites use it) | Login redirect | `features/auth/components/login/LoginForm.tsx:53`; `features/auth/pages/LoginPage.tsx:19` | `router.replace(searchParams.get('redirect'))` accepts `https://evil.example` and `//evil.example` (open redirect after login) | – | security | Medium | Accept only values that match `^/(?!/)`; otherwise use `/dashboard` | `/login?redirect=//example.com` → log in → should land on /dashboard | SAFE-FIX |
| SH-4 | Radix primitives and Skeleton: reduced motion | `ui/dialog.tsx:52,77`, `ui/alert-dialog.tsx:31,53`, `ui/popover.tsx:28`, `ui/dropdown-menu.tsx:38,226`, `ui/tooltip.tsx:41`, `ui/select.tsx:66`, `ui/sheet.tsx:34,59`, `ui/drawer.tsx:31`, `ui/skeleton.tsx:7` | 21 `animate-in`, 21 `animate-out` and the 132-instance skeleton pulse ignore `prefers-reduced-motion`. UI.md §8 says "Luôn có tiền tố `motion-safe:`" ("always use the `motion-safe:` prefix") | – | a11y | Medium | Add one global rule in `index.css`: `@media (prefers-reduced-motion: reduce){[data-state],[data-slot=skeleton]{animation-duration:1ms!important;animation-iteration-count:1!important}}`. Or add `motion-reduce:animate-none` to each primitive | OS "Reduce motion" on → open any SheetFrame/Confirm, view a loading page | SAFE-FIX |
| SH-5 | ChoiceSheet radio | `components/shared/ChoiceSheet.tsx:84-91` | Selected: `border-white bg-white` + `bg-black` dot. Unselected: `border-zinc-600`. In the light theme the white circle on a white sheet (`--popover:#fff`) is invisible | More/Expenditure_Settings sheets (dark only) | light theme broken | Medium | `border-foreground bg-foreground` + `bg-background` dot; unselected `border-muted-foreground/50` | Theme → Light, open Food Log settings › Calendar Week Banner (ChoiceSheet) | SAFE-FIX |
| SH-6 | SheetFrame drag handle | `components/shared/SheetFrame.tsx:55-59` (comment on line 21 says "vuốt", i.e. swipe) | A handle is drawn, but Radix Dialog has no drag, so swiping down does nothing. vaul is installed but unused (`ui/drawer.tsx`, 0 consumers) | MF sheets (iOS) close on drag | interaction | Medium | Either move SheetFrame onto vaul `Drawer` (it gets drag-to-dismiss and keeps the Radix focus model), or remove the handle | On a phone, drag any sheet down | UX-DECISION |
| SH-7 | Bottom nav active tab | `components/shared/MobileTabBar.tsx:53` | `active = pathname startsWith(href)`, so on /profile, /full-body, /progress-photos, /weight, /foods, /steps, /period, /body-fat, /nutrition-data **no tab is highlighted** | `Full_Body/01_list.png`, `Progress_Photos/05_list_by_month.png` (Dashboard stays active) | visual + orientation | Medium | Add a route→tab owner map (e.g. full-body, progress-photos, weight… → Dashboard; profile → More) or remember the last tab in `ui.store` | Open Dashboard → Full Body tile; More → Account | UX-DECISION |
| SH-8 | AuthGuard → TimeZoneGate → page | `features/auth/components/AuthGuard.tsx:20-42`; `features/users/components/TimeZoneGate.tsx:41` | On a phone, the loading skeleton draws the **desktop** shell (h-12 top bar + 240px sidebar column). After that TimeZoneGate shows a blank `bg-background` screen, and then the page appears: three different frames and layout jumps on every cold start | none | flash / CLS | Medium | Make the sidebar skeleton `hidden md:flex` and the header `hidden md:flex`. Have TimeZoneGate render the same skeleton (e.g. reuse `(protected)/loading.tsx` markup) | Hard reload /dashboard on a 375px viewport, slow-3G throttle | SAFE-FIX |
| SH-9 | Login page first paint | `features/auth/pages/LoginPage.tsx:23-36,57-62,50` | The outer `<Suspense>` has no fallback and wraps `useSearchParams`, so the server HTML is empty. Then a skeleton appears in a different layout from AuthShell, then the form (whose inner `Suspense fallback={null}`) | none | flash / CLS | Medium | Give the outer Suspense a fallback of AuthShell with a skeleton body. Make the `isLoading` branch reuse AuthShell | Disable JS / slow 3G on /login | SAFE-FIX |
| SH-10 | Bottom nav active styling | `MobileTabBar.tsx:60-68` | Only `LayoutDashboard` is filled when active. The More/Strategy/Food Log icons just get thicker. Activation has no motion | `More/01_more_top.png` (More icon filled white, label bold) | visual | Low | Use filled icon variants for each tab (as the custom StrategyIcon does); optionally a 150ms colour/scale transition | Tap each tab | SAFE-FIX |
| SH-11 | PickerSheet button text | `components/shared/PickerSheet.tsx:29` | `doneLabel = 'Xong'` (Vietnamese) shows on all 9 Profile sheets, SearchableSelect and EstimateChatStep in an English UI | – | copy | Low | Default to `'Done'` | Profile › Gender | SAFE-FIX |
| SH-12 | Overlay vs content timing | `ui/dialog.tsx:52` (`duration-100`) vs `:77` (300/250ms); `ui/alert-dialog.tsx:31,53` (100ms) | The backdrop finishes fading out about 200ms before the sheet finishes sliding out. The confirm pop is 100ms, below the 250ms in UI.md | – | polish | Low | Overlay `animation-duration-300 sm:animation-duration-250`; AlertDialog `animation-duration-250` | Slow-mo close of any sheet | SAFE-FIX |
| SH-13 | Motion tokens | `app/index.css` (none), many sites | 9 different durations, 4 inline cubic-beziers, 36 `duration-*` sites against the UI.md §8 rule | – | consistency | Low | Add `--ease-mf-out`, `--duration-micro/list/dialog/drawer` in `@theme` and migrate | grep after migration | UX-DECISION |
| SH-14 | Full-screen routes | `app/(protected)/layout.tsx:16-38` | /shortcuts, /progress-photos/gallery and /compare, /program/new, /check-in and /goal/edit render without `PageTransition`, so they appear with no animation while every other route slides | – | consistency | Low | Wrap the full-screen branch in `PageTransition` too (beware SH-1 for their fixed footers) | More › Shortcuts; Progress Photos › Open Gallery | UX-DECISION |
| SH-15 | PageTransition + loading.tsx | `(protected)/layout.tsx:59`, `(protected)/loading.tsx` | `key={pathname}`, so a searchParam change does **not** re-run the animation (good). When a segment suspends, the 300ms enter animation plays on the skeleton and the real page then appears with no animation | – | polish | Low | Accept, or move `loading.tsx` outside PageTransition | Navigate with throttling; watch whether the page content animates | UX-DECISION |
| SH-16 | NextTopLoader | `app/layout.tsx:118` | Sits at `top:0` with no safe-area inset, so it hides under the notch/status bar in the standalone PWA (`statusBarStyle: 'black-translucent'`, line 90). It only starts on `<a>` clicks, so `router.back()` / `router.push` (SubPageHeader back, shortcuts) show no progress. Colour is hard-coded | – | polish | Low | Pass `template`/`style` with `top: env(safe-area-inset-top)`, or set `crawl`/manual `NProgress.start()` in the router wrappers; use `var(--mf-orange)` | iPhone PWA, slow 3G, tap a tile | UX-DECISION |
| SH-17 | SubPageHeader Back | `features/dashboard/components/DashboardPage/SubPageHeader…:34` | Always `router.back()`. With a deep link, reload or PWA cold start, Back leaves the app or does nothing | – | navigation | Low | If `window.history.length <= 1` (or there's no same-origin `document.referrer`), `router.push(parentHref)` | Open /more/expenditure in a new tab → Back | SAFE-FIX |
| SH-18 | `ui/tabs` | `components/ui/tabs.tsx:24,58` | `h-9` (36px) touch target; no sliding indicator (other tablists in the app do slide) | – | touch / consistency | Low | `h-11 md:h-9`; optional indicator | AddFoodDialog tabs on a phone | SAFE-FIX |
| SH-19 | SheetFrame height | `SheetFrame.tsx:50` vs `ui/dialog.tsx:77` | SheetFrame's `max-h-[88dvh]` loses to DialogContent's `max-sm:max-h-[min(92dvh,…)]` (a different variant, so twMerge keeps both and the media rule wins). Phones get 92dvh | – | spec drift | Low | Use `max-sm:max-h-[min(88dvh,var(--vv-height))]` in SheetFrame | Measure a long sheet on 375×667 | SAFE-FIX |
| SH-20 | useScrollHidden | `hooks/use-scroll-hidden.ts:23-24` | `last = y` is updated every frame, even when the delta is under 6px, so slow scrolling never hides or shows the search bar | – | interaction | Low | Update `last` only when the delta is ≥ MIN_DELTA | Slow-scroll the dashboard | SAFE-FIX |
| SH-21 | Sidebar on hydrate (desktop) | `(protected)/layout.tsx:26,54`; `AppSidebar.tsx:47` | A collapsed sidebar renders expanded on the server, then animates width and margin over 200ms on every reload | – | layout jump | Low | Gate `transition-*` behind a `mounted` flag, or store it in a cookie | Collapse sidebar → reload | SAFE-FIX |
| SH-22 | QueryClient | `lib/query-client.ts:3` | A module-level singleton, also evaluated during SSR of `Providers`, so the cache is shared across requests on the server (low practical risk: the data is fetched client-side behind AuthGuard) | – | robustness | Low | `const [client] = useState(() => new QueryClient(...))` in `Providers` | – | SAFE-FIX |
| SH-23 | Touch targets under 44px | `LoginForm.tsx:99-104` ("Forgot password?" `text-xs`, ~16px tall); `ErrorState.tsx:99` (`<summary>` text-xs); `ui/tabs` (SH-18); desktop-only `AppSidebar` 30px rows | small targets | – | a11y | Low | `inline-flex min-h-11 items-center` (or a `before:-inset-y-3` hit area) | Tap on a 375px phone | SAFE-FIX |
| SH-24 | Dead primitives/deps | `ui/drawer.tsx` (vaul), `ui/carousel.tsx` (embla), `ui/sheet`, `ui/select`, `ui/accordion`, `ui/collapsible`, `ui/progress`, `ui/chart`, `ui/spinner`, `ui/calendar`, `ui/combobox`, `ui/command` | 0 consumers | – | bundle / clarity | Info | Remove, or adopt vaul for SH-6 | `pnpm build` size diff | UX-DECISION |
| OT-1 | Crop photo: memory/CPU leak | `features/progress-photos/components/CropPhotoScreen.tsx:70-75` | `measure` is an inline callback ref that creates a **new `ResizeObserver` on every render** and never disconnects it. Each pointermove during a pan/pinch re-renders, so hundreds of observers pile up | none | leak / jank | Medium | `useCallback` ref returning a cleanup (React 19), or an effect with `observer.disconnect()` | DevTools Memory: pan for 10s and compare ResizeObserver counts; check FPS | SAFE-FIX |
| OT-2 | Crop photo inside a sheet | `CropPhotoScreen.tsx:64-68,139`; mounted inside SheetFrame children at `PhotoSessionSheet.tsx:214-229` | (1) Esc runs the crop's `dismiss` **and** Radix closes the whole PhotoSessionSheet, so the picked photos are lost. (2) On ≥sm, DialogContent's `-translate-x/y-1/2` (Tailwind v4 `translate` property) plus `overflow-y-auto` make `fixed inset-0 z-[80]` relative to and clipped by the 28rem dialog, not the viewport. (3) Back closes the sheet, not the crop | `Progress_Photos/04_crop_photo.webp` (full screen) | broken on desktop, data loss on Esc | High | `createPortal(..., document.body)`. Pass `onEscapeKeyDown={e => cropping && e.preventDefault()}` (needs a prop on SheetFrame). Give the crop its own `useBackToClose` | Desktop: + → choose photo → crop must cover the viewport; press Esc → only the crop closes and other picked angles remain | SAFE-FIX |
| OT-3 | More › Expenditure, BMR Equation | `features/more/pages/ExpenditureSettingsPage.tsx:168-200`; `features/more/pages/BmrEquationPage.tsx:348-406` | `{sheet === 'method' && <ManualTdeeSheet open/>}` and `{variable && <SettingChoiceSheet open/>}`: closing unmounts at once, so the **slide-down close animation never runs** (against the `useSheet` contract) | More/Expenditure_Settings/02-10 | motion | Medium | Use `useSheet()` + `{sheet.value && <X key={sheet.id} open={sheet.open} …/>}` | Open and close Estimation Method / Activity sheet | SAFE-FIX |
| OT-4 | More light theme | `SettingChoiceSheet.tsx:94-103`, `ManualTdeeSheet.tsx:116-137`, `BmrEquationPage.tsx:89-98` (radios); `MorePage.tsx:161` (ThemeCard selected `border-white`); `MorePage.tsx:205` (avatar `bg-white text-black` on a white card) | The selected radio, the selected theme card border and the avatar circle all disappear in the light theme | More/01, More/04 (dark) | theme | Medium | Use tokens: `bg-foreground/border-foreground`, dot `bg-background`, ThemeCard `border-foreground` / `border-border`, avatar `bg-foreground text-background` (or `bg-secondary`) | Switch to Light on More; open Expenditure sheets | SAFE-FIX |
| OT-5 | Progress Photos viewer tint | `progress-photos/pages/GalleryPage.tsx:184-188,253-262`; `image.utils.ts:97-118` | The `<img>` has no `crossOrigin`, so the canvas is tainted for signed cross-origin URLs, `dominantColor` returns null and the background stays `var(--background)`. In the light theme the hard-coded `text-white` controls (`ROUND` :26, AngleTabs, header) become white on #f5f5f5 | `Progress_Photos/06_viewer_front.webp` (blue-grey tinted background) | visual + data | Medium | Add `crossOrigin="anonymous"` + storage-bucket CORS, and fall back to a fixed dark background (e.g. `#1f1f1f`) instead of `var(--background)` | Open Gallery; check whether the background tints; repeat in the light theme | UX-DECISION (needs BE/storage CORS) |
| OT-6 | Progress Photos list thumbnails | `progress-photos/components/SessionRow.tsx:40-43` | Delays of 60/120ms with no fill-mode: thumbnails 2 and 3 show, vanish (opacity 0 / scale .9) and then fade in | `Progress_Photos/05` | flicker | Low | Add `motion-safe:fill-mode-backwards` | Slow-mo load of /progress-photos | SAFE-FIX |
| OT-7 | Compare All Metrics count-up | `full-body/components/FullBodyPage/CompareSections.tsx:24-35` | `useState(delta)` paints the final value for one frame, then the rAF resets it to 0 and counts up, so the number visibly flashes | `Full_Body/09_compare_with_deltas.png` | flicker | Low | Initialise to 0 when reduced motion is off (client-only page) | Change compare dates | SAFE-FIX |
| OT-8 | Full Body / Progress Photos header strip | `full-body/components/FullBodyPage/FullBodyHeader.tsx:17` + `SubPageHeader:28` (`bg-background sticky`); `progress-photos/pages/ProgressPhotosPage.tsx:82` | SubPageHeader paints `bg-background` (#141414) inside the `bg-card` (#1f1f1f) strip, so the title row is darker than the pill row. The Progress Photos strip also lacks the safe-area negative top margin, so it doesn't reach under the notch | `Full_Body/01_list.png`, `Progress_Photos/05` (one-tone strip) | visual | Low | Add a `className` prop to SubPageHeader (`bg-transparent` inside the strips); copy FullBodyHeader's `max-md:-mt-[safe+1.25rem]` | Compare a screenshot side by side in dark mode | SAFE-FIX |
| OT-9 | Profile sticky Save | `users/components/ProfilePage/ProfileForm.tsx:168-169` | The fixed bar (~4.5rem) sits on top of the 3.75rem tab bar, but main only has `pb-[5rem+safe]`, so the last rows (Sign out / My foods) are hidden when the form is dirty. When the keyboard is open the tab bar hides but the bar stays 60px above the keyboard | none | layout | Low | Add `pb-28` to the form while `isDirty`; `in-data-[keyboard=open]:bottom-(--kb-bottom)` | Edit a field → scroll to the bottom; open the Name sheet keyboard | SAFE-FIX |
| OT-10 | More visual density | `features/more/pages/MorePage.tsx:67,108`; `more.config.ts:103-111` | Rows are `text-lg min-h-16`, larger than MF (~16px, ~52px rows). The Community & Support social-icon row (Reddit/Facebook/Instagram) is missing. Desktop: the header uses `-mx-4` while main is `md:p-5`, a 4px misalignment | `More/01_more_top.png`, `More/04_more_theme_data_community.png` | visual | Low | `text-base min-h-13`; add the icon row (links can be disabled); `md:-mx-5` | Side by side at 390px | UX-DECISION |
| OT-11 | Profile single-choice sheets | `ProfileForm.tsx:213-301` (PickerSheet + OptionList) | Picking an option doesn't close the sheet; the user must press "Xong". More's ChoiceSheet/SettingChoiceSheet close on pick | `More/Expenditure_Settings/02_estimation_method_sheet.png` (no Done) | consistency | Low | Close on pick (reuse ChoiceSheet) | Profile › Gender | UX-DECISION |
| OT-12 | Full Body All Metrics swipe | `full-body/components/FullBodyPage/SwipeArea.tsx:17-41` | Only detects the swipe on release; there is no drag-follow (Gallery follows the finger) | `Full_Body/05_all_metrics_day.png` | interaction | Low | Translate with the pointer like the Gallery (`dragX*0.6`) | Swipe slowly on /full-body/all | UX-DECISION |
| OT-13 | Gallery share fallback | `GalleryPage.tsx:41-54` | `URL.revokeObjectURL` runs right after `link.click()`, so the download can fail in Safari/Firefox | – | bug | Low | `setTimeout(() => URL.revokeObjectURL(href), 1000)` | Desktop Safari: Share → file downloads | SAFE-FIX |
| OT-14 | Gallery state ↔ URL | `GalleryPage.tsx:101-102` | `angle`/`date` are read from the URL once and never written back, so refresh/Back loses the position | – | navigation | Low | `router.replace(?date&angle)` on change (PageTransition is not keyed on search, so there's no re-animation) | Swipe two dates → refresh | UX-DECISION |
| OT-15 | Small a11y/touch items | `PhotoSessionSheet.tsx:103` (remove-photo X `size-8` = 32px); `GalleryPage.tsx:68-91` and `MorePage.tsx:223` radiogroups have no arrow-key handling | – | – | a11y | Low | `size-11` hit area via `before:`; roving tabindex + arrows | Keyboard only | SAFE-FIX |

**Severity totals:** **High 3** (SH-1, SH-2, OT-2), **Medium 11** (SH-3 to SH-9, OT-1, OT-3, OT-4, OT-5), **Low 24** (SH-10 to SH-23, OT-6 to OT-15), **Info 1** (SH-24). That is 39 total: 26 SAFE-FIX and 13 UX-DECISION.

---

## (d) Per-screen ratings

MATCHED is used only after comparing with the named MF screenshot. Motion vs MF is always UNKNOWN (static refs).

| Screen | Visual | Interaction | Motion | Data | Responsive | Notes |
|---|---|---|---|---|---|---|
| App shell: bottom nav (`MobileTabBar`) | PARTIAL vs `More/01_more_top.png` (same 5 slots + centre "+"; More icon not filled; SH-10) | PARTIAL (no active tab on sub-pages, SH-7) | UNKNOWN | n/a | MATCHED vs `More/01` and `Full_Body/01` for safe-area/height layout. Hidden on md+; desktop uses the sidebar | |
| App shell: route transition / loaders | n/a | PARTIAL (Back detection via Navigation API/popstate works; deep-link Back SH-17) | UNKNOWN (fixed-child jump SH-1) | n/a | PARTIAL (desktop slides by 100% of the main width) | |
| Auth (Login/AuthShell) | UNKNOWN (no MF ref in `UI/`) | PARTIAL (open redirect SH-3) | UNKNOWN | PARTIAL | PARTIAL (SSR blank + skeleton mismatch SH-9) | |
| More | PARTIAL vs `More/01`, `More/04`: section order, titles, theme cards (System split top-light/bottom-dark) and version line match; rows larger, social row missing, light theme broken (OT-4, OT-10) | PARTIAL (unavailable rows correctly disabled; theme radiogroup has no arrows) | UNKNOWN | PARTIAL (name, member-since, version real; 9 rows "Not available yet") | PARTIAL (desktop 4px misalign) | |
| More › Expenditure / BMR | UNKNOWN (refs `More/Expenditure_Settings/01-10` exist but were not pixel-compared in this audit) | PARTIAL (sheets save to BE and show errors correctly; close animation cut OT-3) | UNKNOWN | PARTIAL (several modifiers "Not available yet") | PARTIAL | |
| Profile (Account) | UNKNOWN (no MF ref) | PARTIAL ("Xong" label SH-11, no auto-close OT-11, save bar overlap OT-9) | UNKNOWN | PARTIAL (only dirty fields sent `ProfilePage.tsx:82-83`; looks correct) | PARTIAL | |
| Shortcuts (sheet + Customize) | UNKNOWN (no MF ref except the MOS bug image) | PARTIAL (no swipe-dismiss SH-6; confirm Back SH-2; dnd-kit reorder has keyboard + reduced motion) | UNKNOWN | PARTIAL | PARTIAL (Customize is full-screen without route transition SH-14) | |
| Full Body (list / All Metrics / Compare) | PARTIAL vs `Full_Body/01_list.png`, `09_compare_with_deltas.png`: structure, pills (disabled = dark pill), date tabs with full-width grey line + white bar and compare columns match; two-tone header OT-8 | PARTIAL (swipe without follow OT-12; tab indicator slides) | UNKNOWN | PARTIAL (count-up flash OT-7) | PARTIAL (`text-[min(15px,3.6vw)]` pills fit at 375px) | |
| Progress Photos (list / gallery / compare / crop) | PARTIAL vs `Progress_Photos/05`, `06`: list rows and pills match; viewer tint missing OT-5 | BROKEN on ≥sm for crop and Esc data loss (OT-2) | UNKNOWN | PARTIAL (tint never computed OT-5) | BROKEN (crop confined in the dialog on desktop, OT-2) | |

---

## (e) User should click to confirm

1. **SH-1:** DevTools › Animations › 10%. Navigate Food Log ↔ Dashboard and open /recipes/new. Does any bottom or top fixed bar start in the wrong place and then snap?
2. **SH-2:** Phone: + → Metrics → Delete (confirm open) → swipe Back. Does the sheet close underneath while the confirm stays open? Repeat for Progress Photos edit → Delete and for Weight.
3. **OT-2:** Desktop ≥640px: Progress Photos + → pick a photo. Is the crop screen trapped inside the 28rem dialog? Press Esc: does the whole sheet close and lose the picked angles?
4. **OT-1:** Pan or pinch in the crop for about 10s with the Performance monitor open. Does CPU climb, or does the JS heap keep growing?
5. **OT-5:** Open Gallery. Does the background tint to the photo colour as in MF `06_viewer_front.webp`? Then switch to the Light theme: are the controls readable?
6. **OT-4 / SH-5:** Light theme → More: can you see which Theme card is selected and the avatar circle? Open Expenditure › Estimation Method and Food Log settings sheets: is the selected radio visible?
7. **SH-7:** From Dashboard open Full Body and Progress Photos, and from More open Account. Is any tab highlighted?
8. **SH-6:** Drag any bottom sheet down by its handle on a phone. It should dismiss (MF behaviour); currently nothing happens.
9. **SH-8 / SH-9:** Cold-load /dashboard and /login on a 375px phone with slow 3G. Count the distinct frames: desktop sidebar skeleton → blank → page?
10. **More › Units** (`/profile#units`): does the page scroll to the Display section after the Profile data loads, and does the 300ms slide-in interfere?
11. **SH-16:** iPhone standalone PWA: is the orange top loader visible under the status bar? Does it appear when you tap the back chevron?
12. **SH-19:** Measure the maximum sheet height on a 375×667 phone: 88% or 92% of the viewport?
13. **SH-15:** Throttle the network and navigate to a new route. Does the page content animate in, or only the skeleton?
14. **Shortcuts handoff:** + → Weight (the Shortcuts sheet closes and Weight opens) → press Back once, then once more. Does the second Back leave the page as expected, and does it never need a third press?
15. **OT-7 / OT-6:** In Compare All Metrics change a date and watch the change column. On /progress-photos watch the overlapping thumbnails. Is there a one-frame flash?
