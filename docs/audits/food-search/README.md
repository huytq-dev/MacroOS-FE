# Food Search + "logged 4 foods, gone on return" (FE) — 2026-10-26

Real UI on LocalDB (https://localhost:7000), 375×812, throwaway account. Screenshots in this folder (`before-*`, `after-*`).

## A. Root cause of "log 4 foods, they are gone when I come back"

What is NOT the cause (all verified, real BE, real UI):
- Search tab "+" ×4 → "Log Foods": 4 sequential `POST /food-logs/entries` (200, ~0.4 s each), `GET /food-logs?date=` returns the 4 entries, they survive client navigation (Dashboard and back) and a full reload.
- Food Detail "Log Foods": 1 entry each, persisted. Quick Add, Library path, AI path use the same `logPlate` loop.
- No parallel POSTs (the loop awaits each), no optimistic cache entries that could be wiped, date key is the selected day (`logDate ?? date`), invalidation uses the right key family, errors of the inline path are shown in the sheet.

What IS the cause (reproduced):
- The "+" on a result row (and the plate "Add" in Food Detail) only STAGES the food in an in-memory plate — `useState` inside `FoodLogPage`. Nothing is posted until "Log Foods". Closing the sheet keeps it (while the page stays mounted), but pressing **Back** on a phone or leaving the page (bottom nav) unmounts the page and the plate is silently discarded. The user thinks 4 foods were logged, comes back, and the day is empty. Nothing was ever sent to the BE, so no BE log can show it.
- Compounding: after "+" there was no feedback that the food was only staged, the button said a generic "Log Foods", and a failed log from outside the sheet showed no error at all.

## Fixes (FE)
- Plate moved into `ui.store` and persisted in `sessionStorage` (12 h TTL, corrupt/expired → empty): survives Back, leaving the page and reload (`features/food-log/plate-storage.ts`).
- New banner `PendingPlateBar` on the Food Log page when the sheet is closed and the plate is not empty: "N foods are not logged yet" + Discard (with Undo) / Review / Log foods.
- "+" shows one updating toast "X added to plate · N on your plate · tap Log Foods to save" with **Undo**; the bottom button says **"Log N foods"**.
- Phone **Back closing the Add Food sheet** is done by the shared Dialog (`components/ui/dialog.tsx` → `hooks/use-back-to-close.ts`, committed earlier, not mine). I briefly added a second page-level copy of that hook; it double-pushed history and broke "To Custom", so it was removed again (see `FE/docs/audits/to-custom/README.md`). Data safety does not depend on it: the plate is persisted and the banner shows on return.
- A failed log started from the banner (sheet closed, no inline alert) is now a toast.
- Check script: `PL1` (contract suite) — storage round trip / TTL / corruption + wiring; 7 mutations each fail it.

## B. Food Search, mobile first (MF fidelity kept; affectui used for interaction quality only)
- Request: 250 ms debounce (was 300) + `AbortController` (TanStack `signal` passed to axios) so a stale keyword request is cancelled.
- Type-ahead keeps the previous results (dimmed) when going keyword → keyword; skeleton only when there is nothing to keep (History → keyword). `keepsPreviousResults` is a pure function with tests.
- Recent searches (localStorage, max 6, newest first, de-duplicated, only remembered when the keyword led to a food) shown when nothing is typed; "Clear".
- No-results state with three 44 px actions: Quick Add calories / Create a food / Clear search.
- Rows skip painting off-screen (`content-visibility:auto`, 46 px intrinsic size); matched text highlight, 44 px "+" hit area, 44 px clear button hit area, 16 px input font, `enterkeyhint=search` (all already/now in place).
- Check script `FS1`; 9 mutations each fail it.
- NOT done on purpose: underline tabs with counts / All-Recent-Favorites-My foods-Recipes filter row — the Add Food sheet follows MacroFactor (Scan / Search / AI / Quick Add / Library) and `FE/docs/UI.md`; autofocus on open stays limited to opening from the Dashboard search bar (MF behaviour: no keyboard when opened with "+"); virtualization not needed (25 rows per page + content-visibility); infinite scroll waits for a BE paging contract.

## Mobile sweep (375 px)
Automated audit (horizontal overflow + interactive elements < 44 px, ignoring elements with a 44 px `before:` hit area) on /dashboard, /foods, /foods/new, /program, /weight, /profile, /more, /nutrition-data and the Add Food sheet tabs (Search, Quick Add, Library, Food Detail), selection bar:
- No horizontal page scroll anywhere.
- Fixed: **Create Food serving name input was squeezed to 32 px** (quantity input kept `w-full`) → `before-02` / `after-05`.
- Fixed: Add Food header strip clipped "1085 / 2…" at 375 px (smaller type below 390 px, tighter gaps) and the plate pill item button was 28 px wide (now 44).
- Selection bar sits above the bottom nav (no overlap).
- Known, by design: Dashboard Weekly Nutrition columns are 32 px wide (7 days + totals in 375 px) but 230 px tall; pagination dots 28×44.
- Detail screen: the bottom bar has "Log Foods" (logs now) next to "Add" (adds to plate); labels kept (MF) — the new toast explains "added to plate".

## Checks
tsc 0, eslint (rtk proxy, raw) exit 0, contract 149/0 (PL1, FS1 new), business-logic 124, calorie-shift 26, defaults 31, fe-fixes 27, goal-progress 23, more 20, onboarding 32, strategy 35, routes 55/0 unresolved. Prettier clean on all touched files (DayTimeline.tsx belongs to another agent and was not touched).
