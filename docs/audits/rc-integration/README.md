# FE RC integration results + readiness — 2026-10-26

Change map and Flux / mock-code proofs: `RC_Audit_FE.md`. Compatibility table + full scenario list: `../S29_Compat_and_Integration_Plan.md`.

## Integration run status: NOT RUN (blocked)
The isolated LocalDB API (:7000) is DOWN; MOS-BE was asked (queued) to start it. My earlier `api.ps1 start` was denied by the auto-mode classifier and I did not work around it. :3000 is never used (user's KOVIA app); the FE would run on :3002. When the API is up, run the scenarios below at 375×812 and desktop with throwaway accounts, save screenshots next to this file and fill the log.

| Area | Scenarios (ids from the plan) | Result |
|---|---|---|
| Onboarding → Create Program | sign-up, consents, onboarding, program | NOT RUN |
| Food Search → Food Log | search, "+", plate banner, Log foods (L1–L4) | NOT RUN |
| Add / Edit / Delete Food Log | add, edit entry, delete, clear day | NOT RUN |
| Partial / Incomplete days | N1, N2 (flags, override, remove override) | NOT RUN |
| Weekly Nutrition | W1–W4, F1 | NOT RUN |
| Scale Weight → Weight Trend | log weights, trend | NOT RUN |
| Expenditure Holding / Updating | H1, H2, X1 | NOT RUN |
| Strategy → Check-in | check-in flow, early-check-in not nagged (F2) | NOT RUN |
| Historical Targets | provenance note, LEGACY days | NOT RUN |
| Expenditure Settings | settings screen | NOT RUN |
| To Custom | T1–T3 | NOT RUN |
| Time zone | F3 (profile zone ≠ device zone) | NOT RUN (unit-level TZ1 passes) |

Earlier live evidence (LocalDB, before the freeze): F2 Holding card + tile (screenshots in `../flux/f2-*.jpg`), To Custom prefilled (`../to-custom/`), Food Search 375 px sweep (`../food-search/`).

## FE readiness section (for the Master report)

### Completed & verified (static / unit; all re-run today)
tsc 0 · eslint (raw) exit 0 · prettier clean · contract 156/0 · business-logic 124/0 · calorie-shift 26 · defaults 31 · fe-fixes 27 · goal-progress 23 · more 20 · onboarding 32 · strategy 35 · check-routes 55 pages / 0 unresolved. Every new check mutation-tested.
Included: plate persistence + banner (G1); Food Search mobile UX (G2); To Custom incl. Back → Food Detail and nutrient copy (G3); NDM v2 / effective numbers (G4); derived-data retry robustness (G5); Holding/Calibrating reason card + tile with all six BE codes (G6); Flux band dormant, `FLUX_BAND_ENABLED=false` (G7); Weekly Nutrition: reference-only legacy targets, not in official goal/remaining, future logs not counted (G8); profile-zone clock for eaten-at / To Now / meal (G9).
Clean-build of the earlier snapshot passed (MOS-Master, `.fe-release`, exit 0); it must be repeated for the final tree (G8/G9 changed after it).

### Pending
- Integration run (blocked on the LocalDB API).
- Final clean-worktree `pnpm run build` of the exact commit (rule: before any push).
- Product decisions not mine: incomplete-day confirmation UX, Holding resume UX (MOS-BE proposes first); USDA fallback UI (no contract yet).
- Skipped by decision: NDM "upcoming" marker for future-dated days.

### Compatibility (summary; full table in the S29 doc)
- Safe order: S29 on isolated DB → new BE → new FE immediately after.
- New FE on old BE 08a16ec: NDM Edit Day intents (fasting / incomplete / remove override) 404; saving on a day with foods 400; the rest falls back to raw totals.
- Old FE 2df9854 on new BE + S29: NDM list truncated to 90 days, NDM lock logic wrong (`source` FoodLog), saves create overrides that beat foods; override days show raw numbers elsewhere.

### Release blockers
- **P0**: none found by static checks. A P0 would be NDM broken on a version mix: mitigated only by deploying BE then FE back-to-back (deploy-order risk, not a code bug).
- **P1**: (1) integration run not executed; (2) final clean build of the final tree not yet done; (3) S29 must be applied before the new BE (BE/DB side).
- **P2**: Weekly Nutrition future-day look differs from MF (dash vs dim bar); MF week start / navigation unknown; Create Food copies only the nutrients the source has (LocalDB catalog rows have 5); Back-to-detail uses a 3 s window; Flux band (dormant) has straight polygon edges.
