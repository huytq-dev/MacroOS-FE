# FE side of S29 readiness + integration test plan — 2026-10-26

Static analysis only (code + `git diff 08a16ec` of BE Contract/Controllers). Nothing was run against any DB or port. FE working tree = uncommitted changes on top of prod HEAD 2df9854.

## 1. Compatibility matrix

BE contract changes since 08a16ec that matter to the FE (from `git diff 08a16ec -- src/Contract src/API`):
NDM contract v2 (effective numbers nullable, `source` Manual|FoodLog|Fasting|Imported, `hasOverride`, manual*, foodLog*, `isValidForAlgorithms`, `conflict`, `limit`/`before`/`hasMore`/`nextBefore`, new endpoints `DELETE {date}/override`, `PUT {date}/fasting`, `PUT {date}/incomplete`, PUT/DELETE semantics changed); `WeekDayModel.Effective`; `DailyProgress.protein/carbs/fatConsumed` nullable; plate/nutrients `effectiveDay`; `ExpenditureInsights` codes + `FluxModel` (null by default); IdempotencyKey-reuse 409; new error messages/codes (`FASTING_WITH_MANUAL_NUTRITION`, `FASTING_NEEDS_EMPTY_DAY`, `USE_REMOVE_OVERRIDE`, `NOTHING_TO_SAVE`); ClearDay now only soft-deletes entries; `AmountSource` on nutrient detail.

### A. Prod FE (2df9854) + NEW BE + S28/S29 schema
| Screen | Effect | Severity |
|---|---|---|
| Nutrition Data Manager list | Old FE calls `GET /nutrition-data` without `limit`: new BE defaults to 90 days and the old FE never asks for more → history silently truncated to the newest 90 days | MEDIUM |
| NDM day sheet | Old types: `source` 'App' \| 'Manual', non-null `calories`. New `source` is `FoodLog` (not `App`) → `locked` (= source App) is false → days with foods look editable; `calories` null on macro-only overrides → blank / possible NaN in old render. Save now writes an OVERRIDE that beats the foods (old FE believed it replaced them) | HIGH (wrong semantics shown, data meaning changes) |
| NDM Delete / flags | Old FE: delete sends `DELETE ?date=`: now removes override + fasting only; FoodLog-only day → 400 (old text generic). Fasting/Incomplete toggles go through the old single PUT: new BE may answer 400/409 with codes the old FE shows as generic errors | MEDIUM |
| Dashboard / Macros / Daily progress | `proteinConsumed/carbsConsumed/fatConsumed` can be null for unlogged / macro-less days; old FE types are non-null → arithmetic treats null as 0 (no crash seen in code paths read), `.toFixed` on null would throw wherever used | LOW–MEDIUM (needs run to confirm) |
| Weekly Nutrition / Food Log day | (old FE has none of the F4 changes) Old FE reads RAW `totals`, ignores `effective` → days with a manual override show raw food numbers (override ignored). `isLogged` now true for override/fasting days (shows, harmless) | MEDIUM (numbers wrong on override days) |
| Add Food plate / Multi-select | `effectiveDay` additive → ignored; day line shows RAW | LOW |
| Expenditure | New codes unknown to old FE → ignored (no reason card on old FE anyway); Flux null → old FE draws none | OK |
| Food Log add / lost-entries | Old FE logs foods one request at a time with fresh keys → no 409 reuse. The plate-lost bug (state loss on Back) exists in old FE regardless of BE | OK (bug remains) |
| Clear day | Behaviour change (keeps fasting/manual/notes) | LOW |

### B. NEW FE (uncommitted) + OLD BE (08a16ec, no NDM v2 / S29)
| Screen | Effect | Severity |
|---|---|---|
| NDM save (day sheet) | FE intent endpoints `PUT {date}/fasting`, `PUT {date}/incomplete`, `DELETE {date}/override` do not exist → 404/405: fasting / incomplete toggles and Remove Manual Override FAIL (error toast). Main PUT with numbers works on days without foods (old BE writes ONE manual entry); on a day with Food Log foods the old BE answers 400 (it only allows the incomplete flag there) while the new FE offers an override → error toast | HIGH |
| NDM list | FE sends `limit`/`before`: ignored by old BE (returns everything; `hasMore` undefined = falsy → OK). v1 `source` 'App' unknown to the FE enum: foods-lock / "Food Log" source labels wrong | MEDIUM |
| Food Log day / Weekly Nutrition / Dashboard | `effective` absent → FE falls back to raw `totals` (documented in `shownTotals`): works | OK |
| Add Food Plate | `effectiveDay` absent → `dayBreakdown` null → day strip falls back to raw `day` row: works, no override info | LOW |
| Expenditure reasons | New codes absent; `minLoggedDaysPer7`/`minWeighInDaysPer7` absent → FE falls back to 4 / 1; a Holding caused by too few weigh-ins shows no card (same as today) | OK |
| Flux | FE flag off | OK |
| To Custom, Food Search, plate persistence, Weekly Nutrition fix, future-log fix | FE-only | OK |
| Error text | New FE keys on `errors.reasonCode`; old BE sends none → generic messages | LOW |

### Recommended order (FE view)
1. Apply S29 on the isolated DB first and run the plan below. Then BE with S29 compat, THEN FE: the new FE needs the new BE for NDM intents (B shows HIGH breakage on old BE), and the old FE on the new BE has HIGH NDM semantics drift (A). Smallest-risk sequence: **migration S29 → new BE → new FE immediately after** (keep the window between BE and FE deploys as short as possible and avoid NDM edits in it). If the FE must go first: NDM (Edit Day, flags, Remove Override) breaks; everything else works through fallbacks.
2. Open item for BE: does old BE 08a16ec tolerate the S29 columns/CHECK (rollback path)? FE cannot tell.

## 2. Future food logs (§7) — FE audit
| Area | Result |
|---|---|
| Add / Copy / Quick Add / Batch / BulkMove to a future date | FE has NO future-date guard in Food Log (only the weight/body-metric date sheet disables `iso > today`, used by NDM). Matches "no future-blocking guard" |
| Weekly Nutrition | Future days stay dashes (`future || progress <= 0`). GAP FOUND + FIXED: whole-week and focused-day numbers added the consumption of future-dated logs. Now `weekSummary(..., today)` ignores consumption after today; the week goal keeps their targets. Check `FL1`. Round 3 rule: legacy-unverified past days keep their bars as a REFERENCE only and are NOT in the official goal / remaining (WN1) |
| Food Log week strip rings | `kcalPercent` returns null for `logDate > today` — OK |
| Habits (Food Logging calendar/heatmap/streak) | Range `to = min(year end, today)`; calendar/heatmap mark `iso > today` as future; `habitCells`/`weekCount` bounded by today — OK |
| Dashboard | Daily Nutrition = today; `macrosWeek` = last 7 days ending today — OK |
| Nutrition Data Manager | List comes from BE: a future-dated food-log day will appear (newest first, at the top) with no "upcoming" marker. GAP (cosmetic, SKIPPED by decision): no label; NDM save UI cannot target a future date (date sheet disables it) — matches BE ("not in the future") |
| Check-in | FE has no date logic; it renders BE status — OK |
| Timezone | `todayIso()` uses the profile `effectiveTimeZone` (BE-aligned). FIXED 2026-10-26 (round 3): was a GAP — `nowHourMinute` / `nowClock` / `getHours()` (default eaten-at time, "To Now", meal for the default hour in Create Food "Create & Add") use the DEVICE clock while the date key uses the profile zone → if device zone ≠ profile zone, default time and meal can be off (and around midnight the time may belong to another day). Now `nowClockIso()` (lib/date.ts) formats the time in the profile zone, same as `todayIso()`; check TZ1 |

## 3. Integration test plan (ISOLATED test DB only, after "RESTART PORTS"; no prod)
Setup: LocalDB `MacroOS_IT` via `BE/.it/api.ps1`, throwaway account(s) + consents, FE dev on a free port (3002) with `NODE_EXTRA_CA_CERTS` via `scripts/dev.mjs`. Test timezone: set profile zone to one far from the device zone for F3. Record screenshots under `FE/docs/audits/integration/`.

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| L1 | Lost entries: plate survives Back | Add 4 foods with "+", press Back / leave / reload, return | Plate banner "4 foods not logged", Log foods writes 4 entries once |
| L2 | Lost entries: log 4 then return | Log Foods (4), open Dashboard, back | `GET /food-logs?date` shows 4; totals = sum |
| L3 | Rapid double tap Log Foods | Double click | One batch of entries (lock), no 409 toast, no duplicates |
| L4 | Failure surfaces | Kill network mid-log | "Couldn't add food" toast, plate kept |
| L5 | IdempotencyKey | (BE) two different batches same key | 409 `IdempotencyKeyReused`, FE shows message, nothing silently lost |
| N1 | NDM v2 save | Edit Day: macro-only override; calories-only; clear all | override beats foods; null shows "—"; clear → `USE_REMOVE_OVERRIDE` message |
| N2 | NDM intents | Fasting on empty day / on day with entries; Incomplete on logged / empty day; Remove Override | 200 / `FASTING_NEEDS_EMPTY_DAY` / `IncompleteNeedsLoggedDay`; correct per-intent endpoint |
| N3 | NDM paging | >90 days seeded | first page 90, "load older" reaches older, picked old date looked up on its own |
| N4 | NDM effective day everywhere | Override a day | Food Log day, Weekly Nutrition, Dashboard, Add-Food strip all show the override; Plate view shows `effectiveDay` |
| H1 | Holding reasons | Seed: no weigh-in 8 d; one weigh-in only; logs <4/7; recovering; no logs between weigh-ins; calibrating | Expenditure card + tile text and buttons per code (NoRecentWeighIn, NeedsTwoWeighIns, MissingLogs, RecoveringLogs, NoLogsBetweenWeighIns, InitialCalibration); Updating → no card |
| H2 | Unknown code | BE sends a new code | Ignored, no crash |
| W1 | Weekly Nutrition mid-week | Today = Wed, logs Mon–Wed incl. one past day with LEGACY_UNVERIFIED target | Mon, Tue, Wed bars; whole-week total = sum; note "Historical target not verified" |
| W2 | Tap focus | Tap Mon, tap Mon again | Focus Mon numbers → whole week |
| W3 | Override day in the week | Manual override on Tue | Tue bar/number = override |
| W4 | Non-Monday week start | Profile week start Sunday | Correct 7 days, today in week, two BE blocks merged |
| T1 | To Custom | Food Detail → To Custom → Back | Create Food prefilled; Back reopens the same Food Detail; Create → Food Log with no stray detail |
| T2 | To Custom failure | Source food 404 | "Couldn't load this food" + Try again, form usable |
| T3 | Nutrients | Source food with many nutrients | All copied (scaled to serving) |
| F1 | Future log Add | Add Quick Add / food to tomorrow | Saved; Weekly Nutrition tomorrow stays dash, week total unchanged; habits/streak unchanged; NDM lists it |
| F2 | Future Copy / Bulk move | Copy today → tomorrow, move selection → tomorrow | Allowed; no completed-day effects; Expenditure unchanged; check-in not enabled early (BE) |
| F3 | Timezone | Profile zone UTC+13, device UTC-8, around local midnight | Day key = profile today; known GAP: default eaten-at time from device clock |
| X1 | Flux off | Seed an Updating series | No band, no Flux legend/tooltip anywhere |
| M1 | Compatibility (optional) | Old BE build + new FE | Matches table B |
