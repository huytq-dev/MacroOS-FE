/**
 * Cờ nối hợp đồng BE v2 của câu Prior Weight ("Have you ever weighed more than …?"): `GET /onboarding/prior-weight-question` (số ngưỡng + đơn vị do BE tính, nguồn
 * DUY NHẤT), và gửi đúng số đã hiện (`priorWeightThresholdShown` + `priorWeightThresholdUnit`) cùng `weighedMoreThanBefore` ở `PUT /onboarding/basics` và
 * `PUT /expenditure/settings`. BE đã code nhưng CHƯA bật tới khi S25 được áp dụng nên mặc định TẮT: onboarding giữ nguyên hành vi hiện tại, More giữ Prior Weight
 * chỉ-đọc. Bật bằng `NEXT_PUBLIC_PRIOR_WEIGHT_API=true`. FE KHÔNG tự tính ngưỡng ở nhánh mới.
 */
export const PRIOR_WEIGHT_API = process.env.NEXT_PUBLIC_PRIOR_WEIGHT_API === 'true'
