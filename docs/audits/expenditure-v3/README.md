# Expenditure screen — MF V3 comparison pack (FE) — 2026-10-27

**All screenshots in this folder are SYNTHETIC demonstration data (labelled on screen: "Preview — synthetic demonstration data (layout only). Not your Expenditure and not a Flux result."). They show layout and drawing only. They are NOT production Flux and NOT a result of any Flux model.** Real-data screenshots from the isolated environment are pending (see "Not done").

How they were made: `NEXT_PUBLIC_EXPENDITURE_PREVIEW=1`, FE on :3002, route `/expenditure-preview` (404 in production builds; no API, no login). The same `ExpenditureScreen` renders the real page; only the data source differs.

## Preview paths (both build-flag gated, off by default)
- `/expenditure-preview`: hand-made synthetic series (calibrating → updating → holding, per-point asymmetric band) — label above.
- real page + `?fluxPreview=1`: draws the band the BE test endpoint/flag returns, label "Preview — MacroOS Flux V1 (test data)"; BE null → no band and the label says so. Production: `FLUX_BAND_ENABLED=false`, no flag, BE null → no band, no legend, no Flux text.

## Comparison with the MF references (Docs/MacroFactor_UI/UI/Dashboard/Expenditure*/…)
| Item | MF ref | Ours (synthetic shots) | Status |
|---|---|---|---|
| Header | back, centered "Expenditure", tutorial icon; Average, Difference, date range, round expand button (`Expenditure/1-chart-collapsed.png`) | same elements, same order (`synthetic-375-3M-tooltip.jpg`) | match |
| Chart height / y-axis | tall plot, right-hand labels, thin dashed grid, x labels weekday (1W) / dates | same; labels on the right, dashed thin grid | match |
| Line / markers | orange line, hollow circle (Updating), hollow square (Holding) | 2 px orange line, hollow circles / squares (`synthetic-430-1W.jpg`); markers hidden beyond ~14 days like MF | match (line a little thicker than MF) |
| Flux area | translucent orange-brown fill that follows each day, asymmetric (`01_mf_chart_flux_range.png`, user illustration) | per-day smooth band, edges are monotone cubic curves through each BE number, asymmetric, gaps at null (calibrating) days, no rectangle / ±N | match in shape; MF band is smoother on sparse data |
| Legend | Flux Range / Expenditure / Holding | Flux Range / Updating / Holding (+ Initial estimate when calibrating days are in view); Flux only when a valid band is in view | match + one extra entry (Initial vs Learned) |
| Range + averaging | 1W 1M 3M 6M 1Y All + "D ▾" | same | match |
| Expanded chart | taller chart, controls stay above the tab bar (`2-chart-expanded.png`) | `synthetic-375-1W-expanded.jpg`: chart fills the space, range bar above the tab bar, page still scrolls | match |
| Tooltip | n/a in MF screenshots | date, kcal, status (Updating / Holding / Initial estimate), "MacroOS Flux lower – upper" + "Not a confidence interval." only when a band exists | spec item |
| About / strategy / data | "The Key to Our Smart Programs", Expenditure Changes, Current Strategy, Data Sources, monthly list | About Expenditure (Initial / Learned / Holding / Static, Flux note only when a band is shown) added; the others unchanged (not in the synthetic page, they need the API) | partly shown |

Responsive checks (JS metrics in the preview): 320 px (header row fixed: expand button was clipped, now fits), 375, 390, 430 px and desktop: no horizontal page scroll; chart + legend end above the bottom tab bar's content padding; expanded chart keeps the range bar above the tab bar and the page scroll height stays > viewport (content below still reachable).

## Changes in this round (FE)
- `chart/smooth-path.ts`: monotone cubic edges for the band (passes through every BE number, never overshoots).
- `ExpenditureChart`: smooth band, 2 px line, 4 px markers, tooltip with status + "MacroOS Flux".
- `ExpenditureLegend`, `AboutExpenditure`, `ExpenditureScreen` (page body, shared with the preview), `ExpenditurePreviewPage`, `expenditure-preview.ts`, route `(preview)/expenditure-preview`, middleware public path only when the flag is on.
- `buildExpenditureDetail` (pure, shared by the hook and the preview), `expLegend` now splits Holding days and Calibrating days.
- Checks EX1 (+ V4/V5/V5b updated); mutants killed for edge smoothing, overshoot, lone point, chart wiring, Flux legend/About gating.

## Not done / needs input
- Real-data screenshots from the isolated DB (API down; MOS-BE copying read-only prod data pending). No claim about real Flux is made anywhere here.
- Contract fields (`learnedExpenditureKcal`, `activeExpenditureKcal`, `fluxStatus` + reason codes, `fluxModelVersion`, bucket Flux) are not used yet: MOS-BE has not sent the contract. Initial vs Learned is shown today from the BE status (Calibrating = "Initial estimate").
- W / M aggregation: the FE averages the BE daily series (kcal mean) and mirrors the BE bucket-band policy; the spec wants BE aggregation — switch to `series.buckets` when the contract fixes it.
- Average / Difference are computed from the BE daily values of the visible window (display arithmetic, no constants); BE `summary` is for a fixed from/to and is not requested per pan.
- Pan smoothness and bottom-nav overlap were only checked in the emulated browser pane (not on a phone).

## Update 2026-10-27 (BE contract + fixtures received)
BE fields now handled: per day `fluxStatus` (Available / Unavailable), `fluxReasonCode`, `fluxDirection` (Up / Down / Stable), `activeSource` (Learned / Static), `learnedExpenditureKcal` / `activeExpenditureKcal`; per response `fluxModelVersion`, `fluxIsPreview`, `calculationRevision`, `fluxOverallStatus`.
- A band is drawn only for `fluxStatus === "Available"` (and only when the build flag / preview allows it); `Unavailable` never has a band even if numbers were left behind. Stable bands (width ≤ 1 kcal) are drawn with a minimum 2-unit thickness so they read as a thin line (drawing only; the numbers are untouched). Holding days repeat the BE band.
- `fluxIsPreview: true` → banner "Preview — MacroOS Flux V1 (preview, unapproved)" and the legend entry reads "MacroOS Flux V1 (preview, unapproved)"; never "live".
- Empty state from `fluxReasonCode` (e.g. CALIBRATING → "No Flux range yet: Expenditure is still calibrating, there is not enough evidence.").
- Tooltip: status, "MacroOS Flux · rising/falling/stable" + lower – upper; Static days read "Static (set by you)". The chart line stays the LEARNED value; Active is not presented as the number Strategy uses (BE: Strategy / Check-in still read Learned).
- `/expenditure-preview?scenario=S01|S04|S05|S07|S11|S12a|S18` runs MOS-BE's SYNTHETIC fixtures (real Flux V1 code path, `dev-fixtures/expenditure-flux/*.json`, debug `truthKcal` removed, dates shifted so the last day is today). Every such screen is labelled SYNTHETIC and "preview, unapproved".
- Check EX2 validates all fixtures against the contract (band contains learned TDEE, Up/Down/Stable shapes to ±1 kcal rounding, Unavailable ⇒ null + reason, `fluxIsPreview` true, no debug field).

Screenshots from the fixtures (SYNTHETIC, not user data, not production Flux): `synthetic-BE-fixture-S04-step-up.jpg`, `…-S05-step-down.jpg`, `…-S11-holding-tooltip.jpg`, `…-S18-no-evidence-empty-state.jpg`. Honest reading of S04/S05: with real V1 the band is mostly a hairline (Stable) and only opens briefly around the step (up above the line for a rise, below the line for a fall) — much narrower than the user's illustration; that is what the model returns, not a drawing choice.

Real prod copy (MOS-BE): 11 days, all Calibrating (frozen 2381) → Flux null, reason CALIBRATING: this is the empty/Calibrating state shown in the S18 shot's logic; real-account screenshots still need the isolated API.

## Update 2026-10-27 (final contract: BE aggregation + BE summary)
- Live page: Average / Difference are the BE `summary` of `GET /expenditure/series?from&to` for the exact visible window (debounced 250 ms, previous value kept while loading); the FE only converts the unit and rounds for display. W / M points are the BE `buckets` (`granularity=Week|Month`: average, flux low/high by the BE policy); the FE only derives the marker from the member days' statuses. No FE averaging on the live path (check EX3, 7 mutants killed).
- Offline preview (`/expenditure-preview`) mirrors the BE rule only because it has no API; its Average (S04 "All" = 2597 / +352) equals the fixture's own BE summary. Buckets are labelled with the rest of the synthetic screen.
- Still waiting for the isolated API + read-only copy of the prod account (11 days, Calibrating, Flux null / CALIBRATING) to take real-data screenshots.
