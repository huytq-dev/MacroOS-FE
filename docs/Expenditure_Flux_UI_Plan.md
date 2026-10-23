# Expenditure Flux Range — audit + UI plan (MacroFactor V3 style)

Trạng thái: **AUDIT + KẾ HOẠCH UI, chưa implement.** Công thức Flux của BE chưa được duyệt; mọi phần phụ thuộc trường Flux mới chờ contract đã duyệt. Văn bản này thay thế (khi được duyệt) dòng "Flux Range: KHÔNG VẼ" trong `docs/UI.md` mục Dashboard.

## 1. Hiện trạng (audit)

| Hạng mục | Nơi | Hiện tại |
|---|---|---|
| Trang chi tiết | `features/dashboard/pages/ExpenditurePage.tsx` | Header "Expenditure" + nút mũ tốt nghiệp (tutorial); Average / Difference + khoảng ngày + nút phóng to; `ExpenditureChart`; `RangeBar` 1W…All + D/W/M; chú giải; tutorial; Insights; MonthlyList |
| Biểu đồ | `components/ExpenditurePage/ExpenditureChart.tsx` | SVG dùng chung hạ tầng `chart/*` (ChartAxes nhãn trục phải, kéo ngang `use-chart-pan`, `use-tween`, `use-chart-expand`). Đường cam `stroke-mf-tile-protein` + marker: vòng tròn = Updating, ô vuông = Holding / Calibrating. KHÔNG có dải Flux. Chạm một ngày → tooltip kcal + trạng thái (Mixed cho nhóm W/M) |
| Dữ liệu | `hooks/use-expenditure-detail.ts` | `GET /expenditure/series?all=true&to=today&granularity=Day` (một lần, toàn lịch sử, khoá theo hôm nay) + `GET /expenditure/insights`. BE fill-forward nên chuỗi liên tục từng ngày |
| Kiểu | `types/expenditure-series.types.ts` | `ExpenditureSeriesDay` đã có `fluxLowKcal` / `fluxHighKcal` (BE gửi, FE bỏ qua); `summary {average, difference, first, last, min, max, count}`; `buckets?` chỉ `{start,end,count,average}` |
| Chuỗi / trục | `expenditure-series.ts` | `toExpDay`, `averageExpDays` (gộp W/M ở FE: kcal = trung bình, marker chỉ khi mọi ngày cùng trạng thái, lẫn = `Mixed` không marker), `expAxis` (vừa khít ĐƯỜNG, tối thiểu 4% khoảng, tick 1/2/5/10), `expLegend` |
| Average / Difference | `ExpenditurePage.tsx` | FE tự tính từ các ngày thô trong khung đang xem (trung bình, cuối − đầu, làm tròn SAU khi đổi kcal → kJ). Không dùng `summary` của BE |
| Ô Dashboard | `DashboardTiles.tsx` `ExpenditureTile` + `InsightCharts.tsx` `ExpenditureMini` | Đường mảnh + marker 7 ngày, thang y quanh đường (khoảng tối thiểu `MIN_EXPENDITURE_SPAN_KCAL`), số lớn = `insights.currentKcal` |
| Flux hôm nay | `docs/UI.md` (Flux Range: KHÔNG VẼ) | Quyết định cũ của user: không vẽ vì công thức BE (`FluxTrendErrorKg` 0.1 × 7700 ÷ max(cửa sổ, 7), nửa bề rộng cố định quanh TDEE) không phải của MF và không phải khoảng tin cậy |
| Updating / Holding | `expenditure-series.ts`, chú giải ở trang | Marker theo `status` của BE (`markerOf`); chú giải chỉ liệt kê lớp đang vẽ: "Expenditure" (vòng tròn nếu có Updating) và "Holding" (ô vuông) |
| Expand | `chart/use-chart-expand.tsx` | Chỉ đổi chiều cao; trục y luôn vừa khít đường (không đổi domain khi phóng) |
| Responsive | chung với các trang chi tiết | Đã kiểm 320–430 / desktop ở các màn dùng cùng hạ tầng; trang Expenditure chưa có kiểm riêng cho dải Flux (chưa có dải) |

## 2. Tham chiếu MF và khoảng cách

Ảnh: `Expenditure/1-chart-collapsed|2-chart-expanded|3-chart-averaging-sheet|4-legend…|6-monthly-list`, `Expenditure_v2/01_mf_chart_flux_range.png` (MF V3: 3M, dải mờ cam + đường + ô vuông Holding, trục 2410–2450, Average 2429 / Difference −3), `Expenditure_v2/00_ours_flux_flat.png` (bản của ta cũ: dải phẳng, trục 0–3000), `Energy_Balance_v2/01_mf_expenditure_tab.png`, `05_mf_expenditure_insights_history.png`, `Phan_Tich_Chi_Tiet/05_Expenditure.md`.

| # | Khoảng cách | Hiện tại | MF / spec user | Cần BE? |
|---|---|---|---|---|
| G1 | Dải Flux | Không vẽ | Dải cam mờ lower/upper, đường nằm TRONG dải | Có (công thức duyệt, đảm bảo low ≤ kcal ≤ high) |
| G2 | Trục y | Vừa khít đường | Vừa khít dải + đường (MF 2410–2450, không cố định 0–5000), có đệm | Không (FE) sau G1 |
| G3 | Chú giải | Expenditure / Holding | Flux Range / Updating / Holding (MF: Flux Range, Expenditure ○, Holding □) | Không |
| G4 | Tooltip | kcal + trạng thái | kcal + Flux Lower / Upper + ghi chú "không phải khoảng tin cậy" | Có (số Flux) |
| G5 | Null / khoảng trống | Không có (BE fill-forward) | Không vẽ dải khi null; không nối sai qua khoảng trống | Có (nullable fields + quy tắc ngày thiếu) |
| G6 | W/M | FE gộp trung bình kcal; marker Mixed | Cần chính sách gộp dải (min/max, trung bình hai biên, hay ẩn) do BE thống nhất; FE không tự bịa | Có (chính sách) |
| G7 | Average / Difference | FE tự tính | Chỉ hiển thị `summary` của BE (cùng nguyên tắc Body Metrics / Macros) hoặc test song song như Avg/Diff | Có (xác nhận quy tắc) |
| G8 | Header | back + title + nút tutorial, nút phóng to ở hàng stat | Spec: back, "Expenditure", Average, Difference, ngày, expand — nút tutorial khớp ảnh MF (mũ tốt nghiệp) nên giữ | Không |
| G9 | Marker | Có (vòng tròn / ô vuông) | Khớp; MF V3 chỉ vẽ ô vuông trên đường trong dải | Không |
| G10 | Ô Dashboard | Đường + marker | MF ô nhỏ: chưa có ảnh dải trong ô; giữ như cũ cho tới khi có ảnh/quyết định | Không |
| G11 | Expand/scroll/nav | Dùng chung, ổn | Cần kiểm lại khi có dải (không cuộn lồng, không bị bottom nav che) | Không |
| G12 | Ghi chú nội bộ cũ | `docs/UI.md` + check V5 khẳng định KHÔNG vẽ Flux | Phải sửa cùng lúc khi implement | Không |

Lỗi thuần trình bày đã phát hiện trong chart hiện tại: **không có lỗi đã xác nhận để sửa ngay** (đường, marker, trục, kéo, expand khớp thiết kế hiện hành). Mục G7 là chênh lệch nguyên tắc, không phải lỗi số.

## 3. Kế hoạch component (chờ contract BE đã duyệt)

Contract BE cần (đề xuất, phải được duyệt trước khi code): mỗi ngày `fluxLowKcal` / `fluxHighKcal` có thể null và luôn `low ≤ expenditureKcal ≤ high` khi không null; bucket W/M trả sẵn biên dải theo chính sách thống nhất; `summary` của BE cho khoảng; ngày thiếu dữ liệu trả null thay vì fill-forward giả (hoặc cờ `isCarried`).

Component / chức năng FE (tất cả **chỉ vẽ**, không tính Flux):
1. `expenditure-series.ts`: `ExpDay` thêm `fluxLow?`, `fluxHigh?` (null giữ null); `toExpDay` chỉ copy; `averageExpDays` chỉ theo chính sách BE đã chốt (không tự suy biên).
2. `expAxis(days)`: gộp thêm biên dải vào min/max, đệm ~6% hai phía, vẫn khoảng tối thiểu 4% cho đường phẳng; test: đường phẳng + dải, một điểm, null, đơn vị kJ.
3. `FluxBand` (SVG `path` đóng kín giữa upper và lower; MỘT path cho mỗi đoạn LIÊN TỤC các ngày có dải; ngắt đoạn khi gặp null hoặc khoảng trống > 1 ngày để không nối sai); màu `--mf-flux-band` (cam mờ); vẽ DƯỚI đường và marker; vào bằng `animate-in fade`.
4. `ExpenditureChart`: thêm lớp `FluxBand`; giữ đường / marker; tooltip thêm "Flux Lower / Upper" + dòng nhỏ "Flux range is not a confidence interval." chỉ khi có dải; không dải thì không dòng nào.
5. Chú giải: `expLegend` thêm `flux` (có dải trong khung), thứ tự "Flux Range, Updating (○), Holding (□)" như MF, chỉ liệt kê lớp đang vẽ.
6. Average / Difference: đọc `summary` của BE theo khoảng (cần refetch theo cửa sổ hoặc test song song kiểu `summarizeMetric`); chốt cùng BE trước khi code.
7. Ô Dashboard: giữ `ExpenditureMini`; quyết định thêm dải mini khi có ảnh MF.
8. Test bắt buộc khi implement: low ≤ line ≤ high; null → không dải; khoảng trống → hai path rời; trục chứa cả dải; W/M theo chính sách; expand giữ domain; 320/375/390/430/desktop; không cuộn lồng, không bị bottom nav che; check V5 đổi thành "chỉ vẽ dải khi BE trả"; sửa dòng Flux trong `docs/UI.md`.
9. Kiểm trình duyệt với BE thật sau khi BE duyệt (không dùng mock làm bằng chứng cuối).

## 4. Câu hỏi mở (cần user / BE)
- Công thức Flux của BE khi nào được duyệt, và dải có thật sự là "không phải khoảng tin cậy"?
- Chính sách gộp W/M cho dải (trung bình biên / min–max / ẩn).
- Ngày thiếu dữ liệu: null hay fill-forward có cờ?
- Average / Difference: FE tính (test khớp BE) hay hiển thị `summary` của BE?
- Ô Dashboard có dải mini không (cần ảnh MF)?
