# Dashboard Weekly Nutrition ("only today shows") — F4, 2026-10-26

NO live verification / screenshots yet: the LocalDB API was down and could not be restarted from this session (classifier denied `api.ps1 start`). Findings below are from code + unit tests. Prod is not touched.

## MF behaviour (sources)
- VERIFIED, help article 225 ("Understanding the widgets at the top of the Dashboard", https://help.macrofactorapp.com/en/articles/225-understanding-the-widgets-at-the-top-of-the-dashboard): the widget shows targets "for the full week, with the current day in focus"; the current day is the default; tap the bars of another day to bring it into focus; tap the selected day again to unselect it (= whole week); Remaining = what you can still consume before reaching the intake target.
- UNKNOWN (same article does not say; web search of help.macrofactorapp.com found nothing): week start day, a week-start setting, previous / next week inside the widget, how future days look. Our MF screenshots (`Docs/MacroFactor_UI/UI/Dashboard/Weekly_Nutrition/1.png`, `2.png`): columns M–S, selected day outlined, dashes for days without data, the future day (Sunday in 2.png) shown as a dimmed bar. So: Monday–Sunday kept, NO week navigation added.

## Finding 1: on a Monday only Monday can have data (not a bug)
Prod screenshot (`Docs/MacroFactor_UI/MOS_Bugs/weekly_nutrition_monday_only.png`, Mon Oct 26): Tue–Sun are future days → dashes, same as MF. BE `/food-logs/week` returns Mon–Sun of the week containing `date`; FE `useWeekLog` handles a non-Monday week start by combining two BE blocks. Week bounds / day keys are fine (checked in code; `weekBlocksOf`).

## Finding 2 (real bug, matches "only today shows"): past days of the week with an old target were dropped
- For a past day whose target the BE marks `LEGACY_UNVERIFIED`, `withoutUnverifiedTarget` set `target = null`. Then (a) `weekBarProgress` had no scale → the day's bars were dashes although food was logged, and (b) `weekSummary` summed consumed ONLY over days that have a target → the whole-week numbers on the right were today's only. Business-logic checks (1)(2)(3) even asserted this ("không trộn 5800 kcal ngày lịch sử").
- Fix: `withoutUnverifiedTarget` keeps the stripped target as `referenceTarget` (bar scale only; `target` stays null, `targetUnverified` stays true, so no pass/fail conclusion, no "over target" cap). `WeekMatrix` uses `target ?? referenceTarget` for bar height; `weekSummary` includes those days (consumed, goal and remaining over the same set). A small "Historical target not verified" line shows when a shown column uses a reference target.
- Checks: new `WN1`; business-logic (1)(2)(3) updated to the new rule; 6 mutants killed.
- NEEDS USER OK (reverses an earlier rule): historical unverified targets now size bars and add to the weekly goal sum (labelled). Alternative if the user disagrees: bars with no scale (e.g. full-height neutral) and no weekly goal for those days.

## Tap-to-focus / whole week
Already implemented, now pinned by WN1: default = today; tap another day focuses it; tap the selected day again → `selected = null` → right column = whole week (consumed summed over 7 days, goal = sum of day targets, Remaining = goal − consumed). NDM manual overrides: totals come from `shownTotals` (BE `effective`), so overridden days show.

## Not verified
Real data (prod read needs the user-approved SELECT-only SQL via MOS-BE). To confirm Finding 2 on the user's account, BE should report, for the week containing a mid-week date, each day's `target.targetProvenance` (LEGACY_UNVERIFIED on past days would reproduce it).
