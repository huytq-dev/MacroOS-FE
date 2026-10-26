# Expenditure Flux range + Holding reason (F3 / F2) — 2026-10-26

Real UI on LocalDB (https://localhost:7000), throwaway account, Chrome-pane screenshots in this folder.

## F3 Flux range — ON HOLD (user decision 2026-10-26: not approved, do not render)
The shipped build draws NO band: `FLUX_BAND_ENABLED = false`, `toExpDay` always gives null bands. Everything below describes the dormant code and the mock screenshots (a proposal, not a shipped UI).
- FE draws only the band the BE returns (`fluxLowKcal` / `fluxHighKcal`). `toExpDay` copies it; a missing, one-sided or contract-breaking band (low > kcal or high < kcal) is dropped, never drawn.
- One closed SVG path per continuous run (`fluxSegments`): a null day (Calibrating) or a missing day splits the band, a lone day is a 6-unit wide bar. Drawn under the line and markers, token `--mf-flux-band` (light + dark) at 30%.
- Axis (`expAxis`) fits the line AND the band with 6% padding; no band = unchanged axis.
- Legend "Flux Range" first (only when a band is in view); tooltip "Flux Lower … · Upper …" + "Flux range is not a confidence interval." only for days with a band.
- W / M: band = BE bucket policy mirrored on the Day series (average ± mean half-width of the days that have a band, floor / ceil; no banded day = no band).
- Dashboard tile unchanged (line + markers).
- Checks: V5, V5b, V5c (+ V4 legend keys); 9 mutations killed.

### Evidence
- `mock-01..03`: the BE running on this machine was built BEFORE Flux V1 landed (API.dll 19:14, `ExpenditureFluxService.cs` 19:32), so `/expenditure/series` still returned null bands. These three screenshots use an in-page response rewrite (low = kcal − 55…, high = kcal + 70…, null on BE `isCalibrating` days and Oct 17) to prove the drawing only. They are NOT evidence of the BE formula.
- Real-BE screenshots: pending a rebuilt API (MOS-BE asked).

## F2 Holding reason
- Real BE: after deleting the last 8 weigh-ins the BE returned `strategy: Holding`, `holdingReasonCodes: [NoRecentWeighIn]`, `minWeighInDaysPer7: 1`.
- `f2-01`: Expenditure page, notice above the chart: "Expenditure is on hold — No weigh-in in the last 7 days. Updating needs at least 1." + 44 px "Log weight".
- `f2-02`: Dashboard tile at 375 px: "On hold: No weigh-in in 7 days" (no horizontal scroll).
- Reasons come only from BE codes (`holdingNoticeOf`); thresholds from `minLoggedDaysPer7` / `minWeighInDaysPer7`. Check V10, 5 mutations killed.
- Before this change the reason existed only as small grey text at the bottom of Insights (Current Strategy), under the chart, the tutorial and the changes list.
