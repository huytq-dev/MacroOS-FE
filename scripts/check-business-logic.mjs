// Kiểm tra FE Batch 1 (audit nghiệp vụ): "hôm nay" theo múi giờ BE, làm tròn, null ≠ 0, ánh xạ API. Vector V01–V22 tính tay.
// Chạy: node --import ./scripts/register-ts.mjs scripts/check-business-logic.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as date from '../src/lib/date.ts'
import * as enums from '../src/config/enums.ts'
import { averageBalancePoints } from '../src/features/dashboard/energy-balance.utils.ts'
import * as foods from '../src/features/foods/types/food.types.ts'
import * as plate from '../src/features/food-log/components/FoodLogPage/PlatePanel/plate-edit.utils.ts'
import * as createFood from '../src/features/food-log/create-food.utils.ts'
import { etaViewOf } from '../src/features/dashboard/goal-progress.utils.ts'
import * as entryEdit from '../src/features/food-log/entry-edit.utils.ts'
import * as provenance from '../src/features/nutrition/target-provenance.ts'
import * as overview from '../src/features/food-log/nutrition-overview.utils.ts'
import * as balance from '../src/features/dashboard/energy-balance.utils.ts'
import * as stepsBars from '../src/features/dashboard/steps-bars.ts'
import * as periodUtils from '../src/features/period/period.utils.ts'
import * as dashboardUtils from '../src/features/dashboard/dashboard.utils.ts'
import * as units from '../src/lib/units.ts'
import * as macrosDetail from '../src/features/dashboard/macros-detail.ts'
import * as geometry from '../src/features/dashboard/chart/geometry.ts'
import * as entrySpark from '../src/features/dashboard/entry-spark.ts'
import * as bodyMetric from '../src/features/weight/body-metric.utils.ts'
import { targetRatio } from '../src/features/nutrition/goal-progress.ts'
import { nutrientValue } from '../src/features/dashboard/dashboard.utils.ts'
import { toDayTarget } from '../src/features/program/utils/day-macros.ts'
import { weightRates } from '../src/features/dashboard/weight-trend.utils.ts'
import { AxiosError } from 'axios'
import * as steps from '../src/features/program/utils/new-program-steps.ts'
import * as feasibility from '../src/features/program/utils/feasibility.ts'
import * as shift from '../src/features/program/utils/calorie-shift.ts'

const source = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')
let checks = 0
let failures = 0
function check(name, fn) {
  try {
    fn()
    checks++
  } catch (error) {
    failures++
    console.error(`FAIL ${name}\n  ${error.message.split('\n').join('\n  ')}`)
  }
}

// G-01 / V15: cùng một thời điểm UTC, "hôm nay" khác nhau theo múi giờ; FE phải dùng múi giờ hiệu lực của BE.
check('G-01 isoInZone: 2026-10-22T20:00Z là 10-23 ở Tokyo, 10-22 ở New York', () => {
  const now = new Date('2026-10-22T20:00:00Z')
  assert.equal(date.isoInZone(now, 'Asia/Tokyo'), '2026-10-23')
  assert.equal(date.isoInZone(now, 'America/New_York'), '2026-10-22')
  assert.equal(date.isoInZone(now, 'UTC'), '2026-10-22')
})
check('G-01 todayIso theo effectiveTimeZone, null thì về giờ máy', () => {
  date.setEffectiveTimeZone('Pacific/Kiritimati') // UTC+14
  const expected = date.isoInZone(new Date(), 'Pacific/Kiritimati')
  assert.equal(date.todayIso(), expected)
  date.setEffectiveTimeZone('Not/AZone') // id lạ: không ném lỗi
  assert.match(date.todayIso(), /^\d{4}-\d{2}-\d{2}$/)
  date.setEffectiveTimeZone(null)
  assert.equal(date.todayIso(), new Date().toLocaleDateString('sv'))
})
check(
  'G-01 hồ sơ đặt múi giờ hiệu lực trước khi trả dữ liệu; gate nhắc khi timeZoneFallback',
  () => {
    assert.match(
      source('features/users/hooks/use-profile.ts'),
      /setEffectiveTimeZone\(profile\?\.effectiveTimeZone\)/
    )
    const gate = source('features/users/components/TimeZoneGate.tsx')
    assert.match(gate, /timeZoneFallback/)
    assert.match(gate, /routePath\.profile\}#units/)
    const layout = source('app/(protected)/layout.tsx')
    assert.equal((layout.match(/<TimeZoneGate>/g) ?? []).length, 2)
  }
)

// E-01 / V09: thẻ Energy Balance lấy "Dinh dưỡng" từng tab của BE (cùng tập ngày với mốc), không phải avgCaloriesKcal (mọi ngày).
check('E-01 thẻ đọc avgCaloriesVs* của BE, không đọc avgCaloriesKcal', () => {
  const card = source('features/dashboard/components/DashboardPage/EnergyBalanceCard.tsx')
  assert.match(card, /summary\?\.avgCaloriesVsExpenditureKcal/)
  assert.match(card, /summary\?\.avgCaloriesVsTargetKcal/)
  assert.doesNotMatch(card, /summary\?\.avgCaloriesKcal/)
  const types = source('features/dashboard/types/energy-balance.types.ts')
  assert.match(types, /avgCaloriesVsExpenditureKcal: number \| null/)
  assert.match(types, /avgCaloriesVsTargetKcal: number \| null/)
})
// E-05 / V09: tuần có ngày tính (exp 2500, ăn 2000) + ngày chưa đủ (exp 3000): mốc tuần phải 2500 (BE), không 2750.
check('E-05 mốc trung bình tuần chỉ lấy các ngày tính', () => {
  const week = averageBalancePoints(
    [
      { date: '2026-10-18', consumed: 2000, baseline: 2500, diff: -500 },
      { date: '2026-10-19', consumed: 1500, baseline: 3000, diff: null, incomplete: true },
    ],
    'weekly'
  )
  assert.equal(week.length, 1)
  assert.equal(week[0].baseline, 2500)
  assert.equal(week[0].consumed, 2000)
  assert.equal(week[0].diff, -500)
})

// F-01 / V11: cộng số thật rồi làm tròn một lần (3 × 100.4 kcal = 301.2), không cộng từng dòng đã làm tròn (3 × 100 = 300).
check('F-01 scaleExact không làm tròn từng dòng', () => {
  const total = [1, 2, 3].reduce((sum) => sum + foods.scaleExact(100.4, 100), 0)
  assert.ok(Math.abs(total - 301.2) < 1e-9)
  assert.equal(foods.scaleExact(0.4, 100), 0.4)
  const detail = source('features/food-log/components/FoodLogPage/FoodDetail/FoodDetailView.tsx')
  assert.doesNotMatch(detail, /scaleNutrition/)
  assert.doesNotMatch(
    source('features/food-log/components/FoodLogPage/LibraryPanel.tsx').split('const addFood')[1],
    /scaleNutrition/
  )
})
// F-06 / V11: 4.9 g @ 400 kcal/100 g sửa thành 9.8 g phải ra 39.2 (không phải 40 do làm tròn khối lượng/calo trước).
const plateItem = {
  key: 'k',
  foodItemId: 'f',
  name: 'x',
  foodServingId: null,
  servingLabel: '4.9 g',
  quantity: 4.9,
  calories: foods.scaleExact(400, 4.9),
  protein: 0,
  carbs: 0,
  fat: 0,
  grams: 4.9,
  servings: [{ id: 's', name: 'third', weightInGrams: 100 }],
}
check('F-06 sửa lượng giữ tỉ lệ chính xác', () => {
  const next = plate.applyEdit(plateItem, { text: '9.8', unit: 'g', servingId: null })
  assert.ok(Math.abs(next.calories - 39.2) < 1e-9, `calories ${next.calories}`)
  assert.equal(next.grams, 9.8)
  const again = plate.applyEdit(next, { text: '4.9', unit: 'g', servingId: null })
  assert.ok(Math.abs(again.calories - 19.6) < 1e-9, `round trip ${again.calories}`)
})
// F-05 / V11: "1/3" khẩu phần gửi 0.33 (BE lưu 8,2), không 0.3333333333333333.
check('F-05 số lượng gửi BE làm tròn 2 số lẻ', () => {
  const next = plate.applyEdit(plateItem, { text: '1/3', unit: 'serving', servingId: 's' })
  assert.equal(next.quantity, 0.33)
  const detail = source('features/food-log/components/FoodLogPage/FoodDetail/FoodDetailView.tsx')
  assert.match(detail, /logQuantity = roundTo\(unit === 'serving' \? quantityNumber : grams, 2\)/)
})
// F-04 / F-02: chất vi lượng chưa có số BE hiện "---" (null), plate luôn hỏi BE.
check('F-04 không cộng cục bộ vi chất, F-02 luôn hỏi BE', () => {
  const nutrition = source('features/food-log/components/FoodLogPage/PlatePanel/PlateNutrition.tsx')
  assert.doesNotMatch(nutrition, /sumNutrients|plateNutrients\[key\] \?\? 0/)
  assert.match(
    nutrition,
    /usePlateNutrients\(\{ date, items \}, plate\.length > 0 \|\| view === 'day'\)/
  )
  assert.match(nutrition, /useDebounce/)
})
// F-08 / F-09: bốn macro 2 số lẻ; số thập phân chặt.
check('F-09 parseNumber chỉ nhận số thập phân thuần', () => {
  assert.equal(createFood.parseNumber('12,5'), 12.5)
  assert.equal(createFood.parseNumber('.5'), 0.5)
  assert.equal(createFood.parseNumber('1/2'), 0.5)
  for (const bad of ['1,234.5', '0x10', '1e2', '1.2.3', 'abc'])
    assert.equal(createFood.parseNumber(bad), null, bad)
})
check('F-08 macro gửi BE 2 số lẻ, F-09 lỗi đúng chữ', () => {
  const base = { ...createFood.EMPTY_STATE, name: 'x', basis: '100g' }
  const ok = createFood.buildRequest({
    ...base,
    values: { calories: '400', protein: '33.33333', fat: '1', carbs: '1' },
  })
  assert.equal(ok.request.nutrition.proteinPer100g, 33.33)
  const bad = createFood.buildRequest({
    ...base,
    values: { calories: '1,234.5', protein: '-1', fat: '1', carbs: '1' },
  })
  assert.equal(bad.errors.calories, 'Enter a valid number')
  assert.equal(bad.errors.protein, "Can't be negative")
})
// F-15 / F-03: AmountSheet và lượng AI theo 0.01–10000 của BE; Quick Add / recipe không hiện "100 g" / "2 g".
check('F-15 AmountSheet và AI quantity bị kẹp 0.01–10000', () => {
  assert.match(
    source('features/food-log/components/FoodLogPage/AmountSheet.tsx'),
    /amount >= 0\.01 &&\s*amount <= 10000/
  )
  assert.match(source('features/food-log/ai-plate.utils.ts'), /Math\.min\(10000, Math\.max\(0\.01/)
})
// B3: nguồn + đơn vị do BE gửi (`entrySource`, `quantityUnit`), không suy từ weightGrams / servingName null (suy ra sai khi BE đổi).
check('F-03/B3 Quick Add / recipe đọc entrySource + quantityUnit của BE, không suy từ null', () => {
  const timeline = source('features/food-log/components/FoodLogPage/DayTimeline.tsx')
  assert.match(timeline, /entry\.entrySource === 'QuickAdd'/)
  assert.match(timeline, /entry\.entrySource === 'Recipe'/)
  assert.match(timeline, /entry\.quantityUnit === 'Serving'/)
  assert.doesNotMatch(timeline, /byCount|entry\.recipeId/)
  const types = source('features/food-log/types/food-log.types.ts')
  assert.match(types, /entrySource: EntrySource/)
  assert.match(types, /quantityUnit: QuantityUnit/)
})

// Batch 3 / ETA: ngày, trạng thái "đã đạt" và lý do không có ETA đều do BE quyết (`estimatedCompletionStatus`); FE không còn tự tính "Optimistic ETA" từ tốc độ program
// (fail-before: bản cũ tự tính today + còn lại / tốc độ, kể cả khi đã đạt hay dữ liệu cân không đủ).
check('ETA: Estimated có ngày BE → ngày; Estimated thiếu ngày → không bịa', () => {
  assert.deepEqual(
    etaViewOf({
      estimatedCompletionDate: '2027-02-01',
      estimatedCompletionStatus: 'Estimated',
      estimatedCompletionReasonCode: null,
    }),
    { kind: 'date', date: '2027-02-01' }
  )
  assert.deepEqual(
    etaViewOf({
      estimatedCompletionDate: null,
      estimatedCompletionStatus: 'Estimated',
      estimatedCompletionReasonCode: null,
    }),
    { kind: 'none' }
  )
})
check('ETA: GoalAchieved là trạng thái đạt, KHÔNG có ngày (kể cả khi payload còn ngày)', () => {
  assert.deepEqual(
    etaViewOf({
      estimatedCompletionDate: '2027-02-01',
      estimatedCompletionStatus: 'GoalAchieved',
      estimatedCompletionReasonCode: null,
    }),
    { kind: 'achieved' }
  )
})
check('ETA: Unavailable → câu lý do theo mã BE, không ngày; mã lạ → câu chung', () => {
  for (const code of [
    'INSUFFICIENT_WEIGHT_DATA',
    'STALE_WEIGHT_DATA',
    'NO_TARGET_WEIGHT',
    'RATE_NOT_TOWARD_GOAL',
    'ETA_IN_PAST',
    'ETA_TOO_FAR',
  ]) {
    const view = etaViewOf({
      estimatedCompletionDate: '2027-02-01',
      estimatedCompletionStatus: 'Unavailable',
      estimatedCompletionReasonCode: code,
    })
    assert.equal(view.kind, 'unavailable', code)
    assert.ok(view.reason.length > 10 && !('date' in view), code)
  }
  const reasons = new Set(
    ['INSUFFICIENT_WEIGHT_DATA', 'RATE_NOT_TOWARD_GOAL', 'ETA_TOO_FAR'].map(
      (code) =>
        etaViewOf({
          estimatedCompletionDate: null,
          estimatedCompletionStatus: 'Unavailable',
          estimatedCompletionReasonCode: code,
        }).reason
    )
  )
  assert.equal(reasons.size, 3, 'mỗi mã một câu riêng')
  assert.equal(
    etaViewOf({
      estimatedCompletionDate: null,
      estimatedCompletionStatus: 'Unavailable',
      estimatedCompletionReasonCode: 'NEW_CODE',
    }).kind,
    'unavailable'
  )
})
check(
  'ETA: thiếu status (BE cũ) / NotApplicable → không hiện gì, không suy ngày từ estimatedCompletionDate',
  () => {
    for (const status of [undefined, null, 'NotApplicable'])
      assert.deepEqual(
        etaViewOf({
          estimatedCompletionDate: '2027-02-01',
          estimatedCompletionStatus: status,
          estimatedCompletionReasonCode: null,
        }),
        { kind: 'none' }
      )
  }
)
check(
  'ETA: trang chi tiết không còn tự tính (optimisticEta đã gỡ), GoalInsights nhận EtaView của BE',
  () => {
    assert.doesNotMatch(
      source('features/dashboard/hooks/use-goal-progress-detail.ts'),
      /optimisticEta|weeklyWeightChangeTargetKg/
    )
    assert.match(
      source('features/dashboard/hooks/use-goal-progress-detail.ts'),
      /eta: etaViewOf\(data\)/
    )
    assert.doesNotMatch(source('features/dashboard/goal-progress.utils.ts'), /optimisticEta/)
    assert.match(
      source('features/dashboard/components/GoalProgressPage/GoalInsights.tsx'),
      /readonly eta: EtaView/
    )
  }
)

// Batch 3 / NUT strict: đổi khẩu phần của dòng log cũ → 400 LEGACY_SERVING_SNAPSHOT_MISSING: giải thích rõ, không đổi khẩu phần ngầm, không tự xoá + log lại,
// không kiểm dòng cũ ở FE (chỉ phản ứng với lỗi BE).
const legacyError = (data) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: {},
    data: {
      isSuccess: false,
      statusCode: 400,
      message: 'Entry này được log trước khi lưu snapshot…',
      errors: { foodServingId: ['LEGACY_SERVING_SNAPSHOT_MISSING'] },
      data,
    },
  })
check(
  'NUT: 400 LEGACY_SERVING_SNAPSHOT_MISSING → câu giải thích tiếng Anh nêu còn sửa được số lượng / bữa / giờ hoặc xoá và log lại',
  () => {
    const text = entryEdit.entryEditErrorOf(
      legacyError({ reasonCode: 'LEGACY_SERVING_SNAPSHOT_MISSING', entryId: 'e1' })
    )
    assert.match(text, /serving can't be changed/)
    assert.match(text, /quantity, meal and time/)
    assert.match(text, /delete it and log the food again/)
    assert.doesNotMatch(text, /snapshot|Entry này/)
  }
)
check(
  'NUT: lỗi 400 khác / không có reasonCode không bị đổi thành câu legacy; không tự áp gì',
  () => {
    assert.notEqual(
      entryEdit.entryEditErrorOf(legacyError({ reasonCode: 'SOMETHING_ELSE' })),
      entryEdit.entryEditErrorOf(legacyError({ reasonCode: 'LEGACY_SERVING_SNAPSHOT_MISSING' }))
    )
    assert.notEqual(
      entryEdit.entryEditErrorOf(legacyError(null)),
      entryEdit.entryEditErrorOf(legacyError({ reasonCode: 'LEGACY_SERVING_SNAPSHOT_MISSING' }))
    )
    assert.equal(typeof entryEdit.entryEditErrorOf(new Error('x')), 'string')
    const util = source('features/food-log/entry-edit.utils.ts')
    assert.doesNotMatch(
      util,
      /entrySource|quantityUnit|weightGrams|\.mutate\(|deleteEntry|addEntry/,
      'không kiểm dòng cũ ở FE, không tự xoá / log lại'
    )
    assert.match(
      source('features/food-log/pages/FoodLogPage.tsx'),
      /error=\{updateEntry\.error \? entryEditErrorOf\(updateEntry\.error\) : null\}/
    )
  }
)

// Batch 3 / targetProvenance (VERIFIED | LEGACY_UNVERIFIED | null, cờ do BE): target chưa xác minh chỉ để tham khảo: không đạt / không đạt, không tính vào thống kê.
check(
  'provenance: isUnverifiedTarget chỉ đúng với LEGACY_UNVERIFIED (không suy từ giá trị khác)',
  () => {
    assert.equal(provenance.isUnverifiedTarget('LEGACY_UNVERIFIED'), true)
    for (const value of ['VERIFIED', null, undefined, '', 'legacy_unverified'])
      assert.equal(provenance.isUnverifiedTarget(value), false)
  }
)
// Production bug (Weekly Nutrition "0 of —"): tuần chạy từ trước S26 bị BE gắn LEGACY_UNVERIFIED cho CẢ hôm nay / tương lai. Chỉ ngày LỊCH SỬ (< hôm nay theo múi giờ user)
// mới bị coi là chưa xác minh; hôm nay + tương lai hiện bình thường; giá trị lạ (CURRENT_ACTIVE, PLANNED, ...) không bao giờ là unverified.
const LEGACY = 'LEGACY_UNVERIFIED'
const WEEK_DATES = [
  '2026-10-19',
  '2026-10-20',
  '2026-10-21',
  '2026-10-22',
  '2026-10-23',
  '2026-10-24',
  '2026-10-25',
]
const wk = (logDate, calories, prov, target = 2000) => ({
  logDate,
  isLogged: calories > 0,
  totals: { calories, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  target:
    prov === undefined
      ? null
      : {
          caloriesTarget: target,
          proteinTarget: 0,
          carbsTarget: 0,
          fatTarget: 0,
          targetProvenance: prov,
        },
})
const noRound = (value) => value
const weekSum = (days, mode = 'consumed') =>
  dashboardUtils.weekSummary(days, 'calories', (t) => t.caloriesTarget, mode, noRound)
const applyBoundary = (days, today) =>
  days.map((day) => provenance.withoutUnverifiedTarget(day, today))

check(
  'provenance: isUnverifiedTarget chỉ đúng với LEGACY_UNVERIFIED; giá trị lạ / mới / null không bao giờ là unverified',
  () => {
    assert.equal(provenance.isUnverifiedTarget(LEGACY), true)
    for (const value of [
      'VERIFIED',
      'CURRENT_ACTIVE',
      'PLANNED',
      'SOMETHING_NEW',
      null,
      undefined,
      '',
      'legacy_unverified',
    ])
      assert.equal(provenance.isUnverifiedTarget(value), false, String(value))
    assert.equal(provenance.isHistoricalUnverified(LEGACY, '2026-10-21', '2026-10-22'), true)
    assert.equal(
      provenance.isHistoricalUnverified(LEGACY, '2026-10-22', '2026-10-22'),
      false,
      'hôm nay'
    )
    assert.equal(
      provenance.isHistoricalUnverified(LEGACY, '2026-10-23', '2026-10-22'),
      false,
      'tương lai'
    )
    assert.equal(
      provenance.isHistoricalUnverified(LEGACY, '2026-10-21', null),
      false,
      'chưa biết hôm nay thì không ẩn'
    )
    for (const value of ['CURRENT_ACTIVE', 'PLANNED', 'NEW_VALUE'])
      assert.equal(
        provenance.isHistoricalUnverified(value, '2020-01-01', '2026-10-22'),
        false,
        value
      )
  }
)
check(
  '(1) tuần chạy từ trước S26, mọi ngày LEGACY: hôm nay + tương lai vẫn có target ("0 of <target>", không "—")',
  () => {
    const today = '2026-10-22'
    const days = applyBoundary(
      WEEK_DATES.map((d) => wk(d, 0, LEGACY)),
      today
    )
    const todayDay = days.find((day) => day.logDate === today)
    assert.equal(todayDay.target?.caloriesTarget, 2000)
    assert.equal(todayDay.targetUnverified, undefined)
    const { goal } = weekSum(days)
    assert.notEqual(goal, null)
    assert.equal(goal, 4 * 2000, 'Thu–Sun (4 ngày) còn target, ba ngày lịch sử bị bỏ')
  }
)
check(
  '(2) tuần hiện tại trộn ngày legacy lịch sử + hôm nay: Consumed / goal / tiến độ cùng một tập ngày',
  () => {
    const today = '2026-10-22'
    const days = applyBoundary(
      [
        wk('2026-10-19', 1900, LEGACY),
        wk('2026-10-20', 2100, LEGACY),
        wk('2026-10-21', 1800, LEGACY),
        wk('2026-10-22', 500, LEGACY),
        ...['2026-10-23', '2026-10-24', '2026-10-25'].map((d) => wk(d, 0, LEGACY)),
      ],
      today
    )
    const consumed = weekSum(days, 'consumed')
    const remaining = weekSum(days, 'remaining')
    assert.equal(consumed.goal, 8000)
    assert.equal(
      consumed.value,
      500,
      'chỉ ăn của các ngày CÓ target (không trộn 5800 kcal ngày lịch sử vào target 4 ngày)'
    )
    assert.equal(remaining.value, 8000 - 500)
  }
)
check(
  '(3) tuần lịch sử không có snapshot (mọi ngày LEGACY, < hôm nay): không target, cờ targetUnverified; "—" đúng chỗ',
  () => {
    const days = applyBoundary(
      WEEK_DATES.map((d) => wk(d, 1800, LEGACY)),
      '2026-11-10'
    )
    for (const day of days) {
      assert.equal(day.target, null)
      assert.equal(day.targetUnverified, true)
    }
    const { goal, value } = weekSum(days)
    assert.equal(goal, null)
    assert.equal(value, 7 * 1800, 'chưa có target thì vẫn hiện số đã ăn của cả tuần')
  }
)
check('(4) tuần lịch sử có snapshot (VERIFIED): giữ nguyên, tổng target đủ bảy ngày', () => {
  const days = applyBoundary(
    WEEK_DATES.map((d) => wk(d, 1800, 'VERIFIED')),
    '2026-11-10'
  )
  for (const day of days) assert.equal(day.target.caloriesTarget, 2000)
  assert.equal(weekSum(days).goal, 7 * 2000)
})
check('(6) shift với bảy target khác nhau: tổng đúng từng ngày, không nhân bảy một ngày', () => {
  const targets = [2200, 1800, 2200, 1800, 2200, 1800, 2000]
  const days = applyBoundary(
    WEEK_DATES.map((d, i) => wk(d, 0, 'VERIFIED', targets[i])),
    '2026-10-19'
  )
  assert.equal(
    weekSum(days).goal,
    targets.reduce((a, b) => a + b, 0)
  )
})
check('(7) không có program: không target, không cờ unverified, goal null', () => {
  const days = applyBoundary(
    WEEK_DATES.map((d) => wk(d, 1500)),
    '2026-10-22'
  )
  for (const day of days) {
    assert.equal(day.target, null)
    assert.equal(day.targetUnverified, undefined)
  }
  assert.equal(weekSum(days).goal, null)
})
check(
  '(8) ranh giới ngày theo múi giờ user: cùng một thời điểm UTC, ngày 10-22 là lịch sử ở Tokyo nhưng là hôm nay ở New York',
  () => {
    const now = new Date('2026-10-22T20:00:00Z')
    const tokyo = date.isoInZone(now, 'Asia/Tokyo')
    const newYork = date.isoInZone(now, 'America/New_York')
    assert.equal(tokyo, '2026-10-23')
    assert.equal(newYork, '2026-10-22')
    const row = wk('2026-10-22', 0, LEGACY)
    assert.equal(
      provenance.withoutUnverifiedTarget(row, tokyo).target,
      null,
      'Tokyo: 10-22 đã là quá khứ'
    )
    assert.equal(
      provenance.withoutUnverifiedTarget(row, newYork).target.caloriesTarget,
      2000,
      'New York: 10-22 là hôm nay'
    )
  }
)
check(
  '(9) Dashboard / Food Log / Strategy cùng một target: tuần và ngày qua cùng một ranh giới; Strategy không lọc theo provenance',
  () => {
    const today = '2026-10-22'
    const week = applyBoundary(
      WEEK_DATES.map((d) => wk(d, 0, LEGACY, 2150)),
      today
    )
    const fromWeek = week.find((day) => day.logDate === today).target
    const fromDay = provenance.withoutUnverifiedTarget(wk(today, 0, LEGACY, 2150), today).target
    assert.deepEqual(fromWeek, fromDay)
    assert.equal(fromDay.caloriesTarget, 2150)
    const service = source('features/food-log/services/food-log.service.ts')
    assert.match(service, /withoutUnverifiedTarget\(day, todayIso\(\)\)/)
    assert.match(service, /withoutUnverifiedTarget\(day, today\)/)
    assert.doesNotMatch(
      source('features/program/components/ProgramPage/ProgramCard.tsx'),
      /Unverified|provenance/i
    )
    assert.match(source('features/dashboard/hooks/use-dashboard-data.ts'), /dayLog\.data\?\.target/)
  }
)
check(
  '(10) ngày unverified (lịch sử) bị loại khỏi thống kê FE: Energy Balance tab Target không mốc / chênh lệch; hôm nay và tab Expenditure giữ nguyên',
  () => {
    const day = (d, prov) => ({
      date: d,
      caloriesKcal: 2000,
      expenditureKcal: 2500,
      targetKcal: 1800,
      vsExpenditureKcal: -500,
      vsTargetKcal: 200,
      targetProvenance: prov,
      isFasting: false,
      isIncomplete: false,
    })
    const past = balance.fromSeriesDay(day('2026-10-20', LEGACY), 'targets', '2026-10-22')
    assert.equal(past.baseline, null)
    assert.equal(past.diff, null)
    const current = balance.fromSeriesDay(day('2026-10-22', LEGACY), 'targets', '2026-10-22')
    assert.equal(current.baseline, 1800, 'hôm nay hiện bình thường')
    assert.equal(current.diff, 200)
    const spend = balance.fromSeriesDay(day('2026-10-20', LEGACY), 'expenditure', '2026-10-22')
    assert.equal(spend.baseline, 2500)
    assert.equal(spend.diff, -500)
    for (const value of ['CURRENT_ACTIVE', 'PLANNED', 'VERIFIED'])
      assert.equal(
        balance.fromSeriesDay(day('2026-10-20', value), 'targets', '2026-10-22').baseline,
        1800,
        value
      )
  }
)
check(
  'provenance Nutrition Overview: hôm nay LEGACY vẫn có mốc; kỳ dài giữ trung bình BE và hiện cờ khi có ngày bị loại',
  () => {
    const item = (over) => ({
      key: 'calories',
      value: 1800,
      target: 2000,
      floor: null,
      ceiling: null,
      goalKind: 'Target',
      unit: 'kcal',
      targetProvenance: 'VERIFIED',
      unverifiedTargetDays: 0,
      ...over,
    })
    const values = overview.overviewFromItems([
      item({ key: 'calories', targetProvenance: LEGACY }),
      item({ key: 'protein', unverifiedTargetDays: 3 }),
      item({ key: 'fat' }),
      item({ key: 'carbs', target: null, targetProvenance: null, unverifiedTargetDays: 5 }),
    ])
    assert.equal(values.calories.goal.target, 2000, 'hôm nay không bao giờ là lịch sử')
    assert.equal(values.calories.targetUnverified, false)
    assert.equal(values.protein.goal.target, 2000)
    assert.equal(values.protein.targetUnverified, true)
    assert.equal(values.fat.targetUnverified, false)
    assert.equal(values.carbs.goal.target, null)
    assert.equal(values.carbs.targetUnverified, true)
  }
)
check(
  'provenance: câu "Historical target not verified" ở Food Log, Nutrition History, Analytics, check-in; Strategy không cần (kế hoạch đang chạy); tên trường là targetProvenance',
  () => {
    assert.equal(provenance.UNVERIFIED_TARGET_NOTE, 'Historical target not verified')
    for (const file of [
      'features/food-log/components/FoodLogPage/FoodLogHeader.tsx',
      'features/food-log/pages/NutritionOverviewPage.tsx',
      'features/nutrient-detail/pages/NutrientDetailPage.tsx',
      'features/nutrient-detail/pages/NutrientSummaryPage.tsx',
      'features/program/components/CheckInPage/IncompleteDaysChart.tsx',
      'features/dashboard/pages/EnergyBalancePage.tsx',
      'features/dashboard/components/DashboardPage/EnergyBalanceCard.tsx',
    ])
      assert.match(source(file), /UNVERIFIED_TARGET_NOTE/, file)
    assert.doesNotMatch(source('features/food-log/services/food-log.service.ts'), /dayTargetSource/)
  }
)
// N-06: không có target thì không vượt.
check('N-06 targetRatio không bịa trạng thái vượt khi chưa có target', () => {
  assert.deepEqual(targetRatio(10, null), { progress: 0, over: false })
  assert.deepEqual(targetRatio(10, 0), { progress: 0, over: false })
  assert.deepEqual(targetRatio(150, 100), { progress: 1, over: true })
})
// N-02: chất chưa có dữ liệu là null ("---"), không phải 0 đã biết.
check('N-02 nutrientValue và chất xơ giữ known:false', () => {
  assert.equal(nutrientValue({}, 'fiber').known, false)
  const hook = source('features/dashboard/hooks/use-dashboard-data.ts')
  assert.doesNotMatch(hook, /fiber[^\n]*known: true/)
  assert.doesNotMatch(hook, /totals\?\.fiber/)
})
// P-05 / V19: ở đúng trần 4.0 g/kg × 72.38 kg = 289.52 g, protein gửi BE không được làm tròn lên 290 (bị 400 DayProteinMax).
check('P-05 protein gửi BE không vượt trần', () => {
  const day = { dayOfWeek: 'Monday', kcal: 3000, locked: false, proteinPerKg: 4, carbPct: 0.5 }
  const withCap = toDayTarget(day, 72.38, 4)
  assert.ok(withCap.proteinG <= 4 * 72.38, `protein ${withCap.proteinG}`)
  assert.equal(withCap.proteinG, 289)
  assert.equal(toDayTarget(day, 72.38).proteinG, 290) // không trần: giữ làm tròn cũ
})
// P-07 / V17: band 50%+ dùng 52, như BE OnboardingCalculator.
check('P-07 midpoint 50%+ là 52', () => {
  assert.match(
    source('features/onboarding/types/onboarding-options.types.ts'),
    /value: 'Bf50Plus', label: '50%\+', midPercent: 52/
  )
})
// P-08: Edit Goal lấy goalType của BE (Maintenance không phải "Gain").
check('P-08 Edit Goal dùng goalType BE, Maintenance không có hướng sai', () => {
  const page = source('features/program/pages/GoalEditStepPage.tsx')
  assert.doesNotMatch(page, /targetKg < currentKg \? 'WeightLoss' : 'WeightGain'/)
  assert.match(page, /data\?\.goalType === 'Maintenance'/)
  const step = source('features/onboarding/components/OnboardingPage/GoalTargetStep.tsx')
  assert.match(step, /!maintaining &&/)
  assert.match(step, /disabled=\{maintaining\}/)
})

// Weight trend sufficiency (BE rateReasonCode): chưa đủ cân / lâu không cân thì tốc độ, thâm hụt, dự báo là null ("---"), không 0; có lý do giải thích.
const insights = (over) => ({
  today: '2026-10-22',
  firstWeighInDate: '2026-10-10',
  dataDays: 13,
  currentWeightKg: 80,
  weightChanges: [],
  weeklyChangeKg: -0.5,
  energyDeficitKcalPerDay: -550,
  projected30DaysKg: 78,
  trendDays: 13,
  kcalPerKg: 7700,
  ...over,
})
check('trend: rateReasonCode null → số của BE giữ nguyên, không có "waiting"', () => {
  const rates = weightRates(insights({ rateReasonCode: null }))
  assert.deepEqual(rates, { weeklyChange: -0.5, energyKcal: -550, projection: 78, waiting: null })
})
check('trend: INSUFFICIENT (2 / 3 lần cân) → ba số null và nói rõ thiếu bao nhiêu', () => {
  const rates = weightRates(
    insights({
      rateReasonCode: 'INSUFFICIENT_WEIGHT_DATA',
      weighInCount: 2,
      minWeighIns: 3,
      rateWindowDays: 20,
      weeklyChangeKg: 0,
    })
  )
  assert.equal(rates.weeklyChange, null)
  assert.equal(rates.energyKcal, null)
  assert.equal(rates.projection, null)
  assert.equal(rates.waiting, 'Waiting for more weigh-ins: 2 of 3 needed in the last 20 days.')
})
check(
  'trend: INSUFFICIENT do khoảng cách < 7 ngày; STALE nói bao lâu chưa cân; payload còn số vẫn bị null',
  () => {
    const span = weightRates(
      insights({
        rateReasonCode: 'INSUFFICIENT_WEIGHT_DATA',
        weighInCount: 3,
        minWeighIns: 3,
        minSpanDays: 7,
      })
    )
    assert.equal(span.waiting, 'Waiting for more history: weigh-ins need to span at least 7 days.')
    assert.equal(span.weeklyChange, null)
    const stale = weightRates(
      insights({ rateReasonCode: 'STALE_WEIGHT_DATA', recencyDays: 7, daysSinceLastWeighIn: 9 })
    )
    assert.equal(
      stale.waiting,
      'Waiting for a new weigh-in: none in the last 7 days (last was 9 days ago).'
    )
    assert.equal(stale.projection, null)
    assert.deepEqual(weightRates(undefined), {
      weeklyChange: null,
      energyKcal: null,
      projection: null,
      waiting: null,
    })
  }
)
check('trend: trang đọc qua weightRates, hiện ghi chú waiting, biểu đồ không bị chặn', () => {
  assert.match(
    source('features/dashboard/hooks/use-weight-trend-detail.ts'),
    /weeklyRate: rates\.weeklyChange/
  )
  assert.match(
    source('features/dashboard/components/WeightTrendPage/WeightTrendInsights.tsx'),
    /waiting !== null/
  )
  assert.match(
    source('features/dashboard/hooks/use-weight-trend-detail.ts'),
    /daily,\s*\n[\s\S]*trend: averageTrendDays/
  )
})

// Feasibility (BE FeasibilityResponse): preview 200 và 400 `data` cùng một object; shift → vấn đề có nút xác nhận, còn lại chỉ nêu vi phạm; không tự áp.
const day = (dayOfWeek, calories, carbsG = 200) => ({
  dayOfWeek,
  calories,
  proteinG: 150,
  carbsG,
  fatG: 60,
  isLocked: false,
})
const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const shiftFeasibility = {
  isFeasible: false,
  reasonCode: 'CALORIE_SHIFT_INFEASIBLE',
  reasonCodes: ['CALORIE_SHIFT_INFEASIBLE', 'INVALID_CALORIE_TARGET'],
  violations: [
    {
      code: 'INVALID_CALORIE_TARGET',
      detail: 'BELOW_FLOOR',
      day: 'Sunday',
      calories: 1100,
      proteinG: 150,
      carbsG: 20.5,
      fatG: 60,
      macroKcal: 1222,
      minFeasibleCalories: null,
      floorKcal: 1200,
    },
  ],
  affectedDays: ['Sunday'],
  currentShiftPercent: 30,
  suggestedShiftPercent: 18.27,
  suggestedAction: 'REDUCE_SHIFT',
  actions: ['REDUCE_SHIFT', 'USE_EVEN_DISTRIBUTION'],
  currentDailyTargets: WEEK.map((name) => day(name, name === 'Sunday' ? 1100 : 1900)),
  proposedDailyTargets: WEEK.map((name) => day(name, name === 'Sunday' ? 1250 : 1850)),
  message: 'Reduce the shift to 18.27%.',
  warnings: [],
}
const fakeError = (data) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: {},
    data: { success: false, message: 'x', data },
  })
check(
  'feasibility: parse giữ đúng số BE, mã lạ / thiếu số thì bỏ, dạng cũ không phải Feasibility',
  () => {
    const parsed = feasibility.parseFeasibility(shiftFeasibility)
    assert.equal(parsed.suggestedShiftPercent, 18.27)
    assert.equal(parsed.violations[0].floorKcal, 1200)
    assert.equal(parsed.proposedDailyTargets.length, 7)
    assert.equal(
      feasibility.parseFeasibility({ reasonCode: 'CALORIE_SHIFT_INFEASIBLE', options: [] }),
      null
    )
    assert.equal(feasibility.parseFeasibility(null), null)
  }
)
check('feasibility: 400 → object trong data; lỗi khác / feasible thì null', () => {
  assert.equal(
    feasibility.feasibilityOfError(fakeError(shiftFeasibility)).reasonCode,
    'CALORIE_SHIFT_INFEASIBLE'
  )
  assert.equal(
    feasibility.feasibilityOfError(fakeError({ ...shiftFeasibility, isFeasible: true })),
    null
  )
  assert.equal(feasibility.feasibilityOfError(new Error('x')), null)
  assert.equal(feasibility.infeasibleOf({ ...shiftFeasibility, isFeasible: true }), null)
})
check(
  'feasibility: shift → CalorieShiftProblem với REDUCE_PERCENT + chia đều + bảng trước / sau; preview 200 và 400 cùng kết quả',
  () => {
    const fromPreview = shift.calorieShiftProblemOfFeasibility(
      feasibility.parseFeasibility(shiftFeasibility)
    )
    const from400 = shift.calorieShiftProblemOf(fakeError(shiftFeasibility))
    assert.deepEqual(from400, fromPreview)
    assert.equal(fromPreview.percent, 30)
    assert.equal(fromPreview.floorKcal, 1200)
    assert.deepEqual(fromPreview.violations, [
      { day: 'Sunday', code: 'BELOW_FLOOR', calories: 1100, carbsG: 20.5 },
    ])
    assert.deepEqual(
      fromPreview.options.map((o) => o.code),
      ['REDUCE_PERCENT', 'USE_EVEN_DISTRIBUTION']
    )
    assert.equal(fromPreview.proposal.length, 7)
    assert.deepEqual(fromPreview.proposal[6], { day: 'Sunday', before: 1100, after: 1250 })
  }
)
check(
  'feasibility: nút sửa = % làm tròn xuống theo bước thanh trượt (≤ BE đề xuất) và chia đều; chỉ đổi cấu hình khi bấm',
  () => {
    const problem = shift.calorieShiftProblemOfFeasibility(
      feasibility.parseFeasibility(shiftFeasibility)
    )
    const fixes = shift.shiftFixesOf(
      problem,
      { floor: 'Standard', lowFloorKcal: null },
      { unit: 'kcal', convert: (v) => v, format: (v) => String(v) }
    )
    assert.deepEqual(
      fixes.map((f) => f.change),
      [{ shiftPercent: 18 }, { shiftMode: 'Even' }]
    )
  }
)
check(
  'feasibility: không do shift (MACRO_BUDGET_EXCEEDED) không thành vấn đề shift; có câu chữ từ số BE',
  () => {
    const macro = {
      ...shiftFeasibility,
      reasonCode: 'MACRO_BUDGET_EXCEEDED',
      reasonCodes: ['MACRO_BUDGET_EXCEEDED', 'INFEASIBLE_PROGRAM'],
      violations: [
        {
          code: 'MACRO_BUDGET_EXCEEDED',
          detail: 'MACRO_EXCEEDS_CALORIES',
          day: null,
          calories: 1500,
          proteinG: 200,
          carbsG: 200,
          fatG: 80,
          macroKcal: 2320,
          minFeasibleCalories: 2320,
          floorKcal: null,
        },
      ],
      actions: ['ADJUST_CALORIES', 'ADJUST_GOAL_RATE', 'ADJUST_MACRO_PREFERENCES'],
      suggestedAction: null,
      proposedDailyTargets: [],
    }
    const parsed = feasibility.parseFeasibility(macro)
    assert.equal(shift.calorieShiftProblemOfFeasibility(parsed), null)
    assert.equal(feasibility.isShiftInfeasible(parsed), false)
    const energy = { unit: 'kcal', convert: (v) => v }
    assert.match(
      feasibility.violationText(parsed.violations[0], energy),
      /add up to 2,320 kcal, more than the day's 1,500 kcal\. It needs at least 2,320 kcal\./
    )
    assert.deepEqual(feasibility.proposalRows(parsed), [])
  }
)
check(
  'feasibility: cảnh báo macro ≠ kcal là thông tin, không chặn; câu chữ có chênh lệch của BE',
  () => {
    const warning = {
      code: 'MACRO_KCAL_MISMATCH',
      day: 'Monday',
      calories: 2000,
      macroKcal: 2300,
      differenceKcal: 300,
      toleranceKcal: 2,
      proteinG: 150,
      carbsG: 250,
      fatG: 77,
      message: 'm',
    }
    const parsed = feasibility.parseFeasibility({
      ...shiftFeasibility,
      isFeasible: true,
      reasonCode: null,
      reasonCodes: [],
      violations: [],
      warnings: [warning],
    })
    assert.equal(feasibility.infeasibleOf(parsed), null)
    assert.equal(parsed.warnings.length, 1)
    assert.match(
      feasibility.warningText(parsed.warnings[0], { unit: 'kcal', convert: (v) => v }),
      /^Monday: macros 2,300 kcal vs target 2,000 kcal \(\+300 kcal\)$/
    )
  }
)
check(
  'feasibility: wiring ở bốn luồng (onboarding, New Program, Edit Goal, check-in) + UpdateGoal; chia đều chỉ gửi khi bấm',
  () => {
    assert.match(
      source('features/onboarding/hooks/use-onboarding-wizard.ts'),
      /calorieShiftProblemOfFeasibility\(preview\?\.feasibility\)/
    )
    assert.match(
      source('features/onboarding/hooks/use-onboarding-wizard.ts'),
      /shiftBlocked: shiftProblem !== null \|\| feasibilityIssue !== null/
    )
    const newProgram = source('features/program/pages/NewProgramStepPage.tsx')
    assert.match(newProgram, /previewInfeasible === null/)
    assert.match(newProgram, /if \(data\.feasibility && !data\.feasibility\.isFeasible\) return/)
    assert.match(newProgram, /<FeasibilityWarnings/)
    assert.match(newProgram, /!preview\.data\.feasibility && preview\.data\.warnings\.length > 0/)
    const edit = source('features/program/pages/GoalEditStepPage.tsx')
    assert.match(edit, /infeasibleOf\(data\?\.feasibility\)/)
    assert.match(edit, /feasibilityOfError\(save\.error\)/)
    const checkIn = source('features/program/components/CheckInPage/ProgramUpdateModule.tsx')
    assert.match(checkIn, /infeasibleOf\(preview\.feasibility\)/)
    // Đề xuất không khả thi vẫn khoá Accept; G6 thêm khoá khi dữ liệu dẫn xuất chưa Ready (`notReady`, xem check-contract G5)
    assert.match(checkIn, /disabled=\{isDeciding \|\| acceptBlocked( \|\| notReady)?\}/)
    const actions = source('features/program/components/ProgramPage/ProgramActions.tsx')
    // Chỉ gửi khi user bấm nút; Even không bao giờ tự áp
    assert.match(actions, /onClick: \(\) => submit\(\{ calorieShiftMode: 'Even' \}\)/)
    assert.match(actions, /onClick: \(\) => submit\(reduce\)/)
    const hook = source('features/program/pages/ProgramPage.tsx')
    assert.doesNotMatch(hook, /calorieShiftMode/)
  }
)

// B1: giảm shift sau khi user xác nhận = Custom + NGÀY ĐANG LƯU của program (BE trả `calorieShiftDays`) + % BE đề xuất; Even thì không gửi ngày.
const programShift = {
  calorieShiftMode: 'Custom',
  calorieShiftDays: ['Monday', 'Tuesday', 'Friday'],
  calorieShiftPercent: 30,
}
const reduceFeasibility = (over = {}) =>
  feasibility.parseFeasibility({ ...shiftFeasibility, ...over })
check('B1 reduceShiftRequestOf: Custom + ngày đang lưu + suggestedShiftPercent', () => {
  assert.deepEqual(shift.reduceShiftRequestOf(programShift, reduceFeasibility()), {
    calorieShiftMode: 'Custom',
    calorieShiftDays: ['Monday', 'Tuesday', 'Friday'],
    calorieShiftPercent: 18.27,
  })
})
check('B1 reduceShiftRequestOf: giữ kiểu đang lưu (TrainingDays không bị đổi thành Custom)', () => {
  const trainingDays = { ...programShift, calorieShiftMode: 'TrainingDays' }
  const request = shift.reduceShiftRequestOf(trainingDays, reduceFeasibility())
  assert.equal(request.calorieShiftMode, 'TrainingDays')
  assert.deepEqual(request.calorieShiftDays, ['Monday', 'Tuesday', 'Friday'])
})
check(
  'B1 reduceShiftRequestOf: không đoán ngày, không áp khi % không thấp hơn / ngoài 5–30 / BE không đề xuất',
  () => {
    const of = (program, over) => shift.reduceShiftRequestOf(program, reduceFeasibility(over))
    assert.equal(
      of({ calorieShiftMode: 'Custom', calorieShiftPercent: 30 }),
      null,
      'BE cũ: thiếu ngày'
    )
    assert.equal(of({ ...programShift, calorieShiftDays: [] }), null)
    assert.equal(
      of({
        ...programShift,
        calorieShiftDays: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
      }),
      null,
      '7 ngày bị BE từ chối'
    )
    assert.equal(
      of({
        ...programShift,
        calorieShiftMode: 'Even',
        calorieShiftDays: [],
        calorieShiftPercent: null,
      }),
      null
    )
    assert.equal(of(programShift, { suggestedShiftPercent: 4.2 }), null, 'dưới 5')
    assert.equal(of(programShift, { suggestedShiftPercent: 30 }), null, 'không thấp hơn 30')
    assert.equal(of(programShift, { suggestedShiftPercent: null }), null)
    assert.equal(of(programShift, { actions: ['USE_EVEN_DISTRIBUTION'] }), null)
  }
)
// B2: model Calorie Shift cũ (reasonCode + options) không còn được đọc; chỉ FeasibilityResponse.
check('B2 dạng cũ (reasonCode + options) không còn là vấn đề Calorie Shift', () => {
  const legacy = {
    reasonCode: 'CALORIE_SHIFT_INFEASIBLE',
    floorKcal: 1000,
    percent: 20,
    days: ['Monday'],
    violations: [{ day: 'Saturday', code: 'CARBS_BELOW_ZERO', calories: 1350, carbsG: -9 }],
    options: [{ code: 'REDUCE_PERCENT', maxPercent: 19 }],
  }
  assert.equal(shift.parseCalorieShiftProblem(legacy), null)
  assert.equal(shift.calorieShiftProblemOf(fakeError(legacy)), null)
  const src = source('features/program/utils/calorie-shift.ts')
  assert.doesNotMatch(src, /REDUCE_DAYS|LOWER_FLOOR|REMOVE_FLOOR|optionOf|VIOLATION_CODES/)
})

// Wizard guard: vào thẳng Review (hoặc bước sau) khi bước trước chưa trả lời → về bước chưa trả lời ĐẦU TIÊN; Manual không bị đưa tới distribute.
const wizardAnswers = {
  programType: 'Coached',
  dietStyle: 'Balanced',
  floor: 'Standard',
  trainingType: 'Lifting',
  distribution: null,
  proteinLevel: 'Moderate',
  manualMode: null,
  days: null,
  manualDays: null,
}
check('wizard guard: review với distribution chưa chọn → về distribute', () => {
  assert.equal(steps.firstUnansweredBefore('review', wizardAnswers), 'distribute')
  assert.equal(
    steps.firstUnansweredBefore('review', { ...wizardAnswers, distribution: 'Even' }),
    null
  )
})
check(
  'wizard guard: về bước ĐẦU TIÊN chưa trả lời, theo thứ tự bước (style, diet, floor, training, distribute, protein)',
  () => {
    const none = {
      ...wizardAnswers,
      dietStyle: null,
      floor: null,
      trainingType: null,
      proteinLevel: null,
    }
    assert.equal(steps.firstUnansweredBefore('review', none), 'diet')
    assert.equal(steps.firstUnansweredBefore('review', { ...none, dietStyle: 'Balanced' }), 'floor')
    assert.equal(
      steps.firstUnansweredBefore('review', { ...none, dietStyle: 'Balanced', floor: 'Low' }),
      'training'
    )
    assert.equal(
      steps.firstUnansweredBefore('review', {
        ...wizardAnswers,
        distribution: 'Even',
        proteinLevel: null,
      }),
      'protein'
    )
    assert.equal(
      steps.firstUnansweredBefore('review', { ...wizardAnswers, programType: null }),
      'style'
    )
  }
)
check(
  'wizard guard: chỉ nhìn các bước ĐỨNG TRƯỚC; bước đang ở (hoặc trước nó) không bị đẩy đi',
  () => {
    assert.equal(steps.firstUnansweredBefore('distribute', wizardAnswers), null)
    assert.equal(steps.firstUnansweredBefore('diet', { ...wizardAnswers, dietStyle: null }), null)
    assert.equal(
      steps.firstUnansweredBefore('style', { ...wizardAnswers, programType: null }),
      null
    )
  }
)
check(
  'wizard guard: Manual không bao giờ bị đưa tới distribute / diet; Collaborative cần editor',
  () => {
    const manual = {
      ...wizardAnswers,
      programType: 'Manual',
      dietStyle: null,
      floor: null,
      trainingType: null,
      proteinLevel: null,
    }
    assert.equal(steps.firstUnansweredBefore('review', manual), 'same-different')
    const done = { ...manual, manualMode: 'same', manualDays: [{}] }
    assert.equal(steps.firstUnansweredBefore('review', done), null)
    assert.deepEqual(steps.stepsFor('Manual').includes('distribute'), false)
    const collaborative = { ...wizardAnswers, programType: 'Collaborative', distribution: 'Even' }
    assert.equal(steps.firstUnansweredBefore('review', collaborative), 'editor')
    assert.equal(steps.firstUnansweredBefore('review', { ...collaborative, days: [{}] }), null)
  }
)
check(
  'wizard guard: nối vào use-wizard-nav; Next ở distribute lưu lựa chọn đang hiện; mặc định Even và `??` không đổi',
  () => {
    assert.match(source('features/program/hooks/use-wizard-nav.ts'), /firstUnansweredBefore\(step,/)
    assert.match(
      source('features/program/hooks/use-wizard-nav.ts'),
      /router\.replace\(stepHref\(unanswered\)\)/
    )
    const page = source('features/program/pages/NewProgramStepPage.tsx')
    assert.match(page, /const mode = wizard\.distribution \?\? 'Even'/)
    assert.match(
      page,
      /if \(wizard\.distribution !== mode\) wizard\.setPref\('distribution', mode\)/
    )
    assert.match(
      source('features/program/utils/program-request.ts'),
      /choices\.distribution \?\? 'Even'/
    )
  }
)

// Dashboard → General: ô Steps (cột 7 ngày trống dù đã có dữ liệu) và ô Period (lưới 30 ngày). Fail-before: ô Steps không có `visual`, hook chỉ giữ trung bình BE,
// `steps-bars` chưa tồn tại.
const TODAY = '2026-10-23'
const stepItem = (logDate, steps) => ({ id: logDate, logDate, steps, source: 'Manual' })

check('Steps: một ngày 1505 vẫn vẽ một cột cao hết vùng, đúng ngày, hôm nay ở mép phải', () => {
  const days = stepsBars.stepsWeekOf([stepItem(TODAY, 1505)], TODAY)
  assert.equal(days.length, 7)
  assert.equal(days[6].date, TODAY)
  assert.equal(days[6].steps, 1505)
  assert.ok(days.slice(0, 6).every((day) => day.steps === null))
  const rects = stepsBars.stepsBarRects(days, 120, 44)
  assert.equal(rects.length, 1)
  assert.equal(rects[0].date, TODAY)
  assert.equal(rects[0].height, 42, 'một ngày duy nhất = cao hết vùng vẽ (thang 0 → max)')
  assert.equal(rects[0].y + rects[0].height, 44, 'mọc từ đáy')
  assert.ok(rects[0].x + rects[0].width <= 120 + 1e-9 && rects[0].x > 120 - 25)
})
check('Steps: nhiều ngày khác nhau → bảy ngày theo thứ tự thời gian, cao tỉ lệ số bước', () => {
  const items = [
    stepItem('2026-10-19', 1000),
    stepItem('2026-10-20', 2000),
    stepItem('2026-10-23', 500),
  ]
  const days = stepsBars.stepsWeekOf(items, TODAY)
  assert.deepEqual(
    days.map((day) => day.date),
    [
      '2026-10-17',
      '2026-10-18',
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
    ]
  )
  const rects = stepsBars.stepsBarRects(days, 120, 44)
  assert.deepEqual(
    rects.map((rect) => rect.date),
    ['2026-10-19', '2026-10-20', '2026-10-23']
  )
  const [a, b, c] = rects
  assert.equal(b.height, 42)
  assert.ok(Math.abs(a.height / b.height - 0.5) < 1e-9, '1000 / 2000')
  assert.ok(Math.abs(c.height / b.height - 0.25) < 1e-9, '500 / 2000')
  assert.ok(a.x < b.x && b.x < c.x, 'thời gian tăng dần từ trái sang phải')
})
check('Steps: ngày không có bản ghi và ngày 0 bước đều KHÔNG có cột; chỉ ngày > 0 có cột', () => {
  const days = stepsBars.stepsWeekOf(
    [stepItem('2026-10-21', 0), stepItem('2026-10-22', 800)],
    TODAY
  )
  const rects = stepsBars.stepsBarRects(days, 120, 44)
  assert.deepEqual(
    rects.map((rect) => rect.date),
    ['2026-10-22'],
    'chỉ ngày > 0 bước có hình (0 và thiếu đều không có bar)'
  )
})
check(
  'Steps: 0 bước = bản ghi thật nhưng KHÔNG vẽ bar (không vạch giả); null không bar; 1 và nhiều giá trị vẽ đúng thang',
  () => {
    const week = (values) =>
      stepsBars.stepsWeekOf(
        values
          .map((steps, index) => (steps === null ? null : stepItem(`2026-10-${17 + index}`, steps)))
          .filter(Boolean),
        TODAY
      )
    const zeroDay = week([null, null, null, null, 0, 800, null])
    assert.equal(zeroDay[4].steps, 0, 'model vẫn giữ 0 phân biệt với null')
    assert.equal(zeroDay[3].steps, null)
    assert.deepEqual(
      stepsBars.stepsBarRects(zeroDay, 120, 44).map((rect) => rect.date),
      ['2026-10-22'],
      '0 và null không có bar'
    )
    assert.deepEqual(stepsBars.stepsBarRects(week([0, 0, 0, 0, 0, 0, 0]), 120, 44), [])
    const one = stepsBars.stepsBarRects(week([null, null, null, null, null, null, 1]), 120, 44)
    assert.equal(one.length, 1)
    assert.ok(one[0].height > 0 && one[0].height <= 44)
    const mixed = stepsBars.stepsBarRects(week([1000, 0, 5000, null, 2500, 10000, 7500]), 120, 44)
    assert.equal(mixed.length, 5)
    const h = (date) => mixed.find((rect) => rect.date === date).height
    assert.ok(Math.abs(h('2026-10-23') / h('2026-10-22') - 0.75) < 1e-9, 'tỉ lệ thật 7500/10000')
    assert.ok(Math.abs(h('2026-10-21') / h('2026-10-22') - 0.25) < 1e-9)
    assert.ok(h('2026-10-22') > h('2026-10-19'), 'cao nhất là ngày 10000')
  }
)
check('Steps: chưa có dữ liệu / không có items → không cột nào, không bịa số', () => {
  assert.deepEqual(stepsBars.stepsBarRects(stepsBars.stepsWeekOf([], TODAY), 120, 44), [])
  assert.deepEqual(stepsBars.stepsBarRects(stepsBars.stepsWeekOf(undefined, TODAY), 120, 44), [])
  assert.ok(stepsBars.stepsWeekOf(undefined, TODAY).every((day) => day.steps === null))
})
check('Steps: bản ghi ngoài Last 7 Days (cũ hơn hoặc tương lai) không vào ô', () => {
  const items = [
    stepItem('2026-10-16', 9999),
    stepItem('2026-10-24', 7777),
    stepItem('2026-10-17', 1200),
  ]
  const days = stepsBars.stepsWeekOf(items, TODAY)
  assert.equal(days.filter((day) => day.steps !== null).length, 1)
  assert.equal(days[0].date, '2026-10-17')
  assert.equal(days[0].steps, 1200, 'ngày đầu của cửa sổ 7 ngày vẫn vào')
  const rects = stepsBars.stepsBarRects(days, 120, 44)
  assert.equal(rects.length, 1)
  assert.equal(
    rects[0].height,
    42,
    'thang chỉ tính các ngày trong ô (9999 ngoài cửa sổ không làm thấp cột)'
  )
})
check(
  'Steps: vùng vẽ chưa đo (0 px) không vẽ gì; cột rất thấp vẫn nhìn thấy (không co về 0px)',
  () => {
    const days = stepsBars.stepsWeekOf([stepItem(TODAY, 5), stepItem('2026-10-22', 100000)], TODAY)
    assert.deepEqual(stepsBars.stepsBarRects(days, 0, 44), [])
    assert.deepEqual(stepsBars.stepsBarRects(days, 120, 0), [])
    const tiny = stepsBars.stepsBarRects(days, 120, 44).find((rect) => rect.date === TODAY)
    assert.ok(tiny.height >= 2, 'cột rất thấp được nâng lên sàn nhìn thấy')
  }
)
check(
  'Steps: múi giờ — cùng một thời điểm UTC, "Last 7 Days" kết thúc ở ngày khác nhau nên cột dịch chỗ',
  () => {
    const now = new Date('2026-10-22T20:00:00Z')
    const tokyo = date.isoInZone(now, 'Asia/Tokyo')
    const newYork = date.isoInZone(now, 'America/New_York')
    const items = [stepItem('2026-10-22', 1505)]
    const inTokyo = stepsBars.stepsWeekOf(items, tokyo)
    const inNewYork = stepsBars.stepsWeekOf(items, newYork)
    assert.equal(
      inTokyo.findIndex((day) => day.steps === 1505),
      5
    )
    assert.equal(
      inNewYork.findIndex((day) => day.steps === 1505),
      6
    )
  }
)
check(
  'Steps: footer = số bước của HÔM NAY từ cùng nguồn với cột (không trung bình BE); ô có visual; cache dùng chung tiền tố',
  () => {
    const data = source('features/dashboard/hooks/use-dashboard-data.ts')
    assert.doesNotMatch(data, /last7DayAverage/)
    assert.match(data, /stepsWeekOf\(stepsQuery\.data\?\.items, today\)/)
    assert.match(data, /stepsTodayOf\(stepsWeek\)/)
    assert.doesNotMatch(data, /items\.reduce|steps\.reduce/)
    assert.match(
      source('features/dashboard/components/DashboardPage/LayoutSection.tsx'),
      /visual=\{<StepsBars days=\{data\.stepsWeek\} \/>\}/
    )
    // Add / Edit / Delete làm mới ô Dashboard ngay: khoá ['steps', from, to] cùng tiền tố 'steps' với mutation
    assert.match(
      source('features/dashboard/hooks/use-dashboard.ts'),
      /queryKey: \['steps', from \?\? '', to \?\? ''\]/
    )
    const hook = source('features/steps/hooks/use-steps.ts')
    assert.match(hook, /all: \['steps'\] as const/)
    assert.match(hook, /invalidateQueries\(\{ queryKey: stepsKeys\.all \}\)/)
    assert.match(hook, /useUpsertSteps/)
    assert.match(hook, /useDeleteSteps/)
  }
)

// ── Period ──
const periodDays = (...dates) => dashboardUtils.habitCells(periodUtils.periodDaySet(dates), TODAY)
check('Period: chưa từng nhập → đúng 30 ô, không ô nào có dữ liệu (xám), không bịa', () => {
  const cells = dashboardUtils.habitCells(periodUtils.periodDaySet(undefined), TODAY)
  assert.equal(cells.length, 30)
  assert.ok(cells.every((cell) => cell === false))
})
check('Period: một ngày → đúng một ô hồng, ở đúng vị trí (ô cuối là hôm nay)', () => {
  const cells = periodDays('2026-10-23')
  assert.equal(cells.length, 30)
  assert.equal(cells.filter(Boolean).length, 1)
  assert.equal(cells[29], true)
  const earlier = periodDays('2026-10-20')
  assert.equal(earlier.findIndex(Boolean), 26)
})
check(
  'Period: nhiều ngày liên tiếp + hai kỳ → mọi ngày BE trả đều có ô, không ngày nào khác',
  () => {
    const cells = periodDays('2026-10-02', '2026-10-03', '2026-10-04', '2026-10-21', '2026-10-22')
    assert.equal(cells.filter(Boolean).length, 5)
    assert.deepEqual(
      cells.map((on, index) => (on ? index : -1)).filter((index) => index >= 0),
      [8, 9, 10, 27, 28]
    )
  }
)
check(
  'Period: tắt một ngày (BE bỏ ngày đó khỏi `days`) → ô trở lại xám; không suy / dự đoán chu kỳ',
  () => {
    const on = periodDays('2026-10-20', '2026-10-21', '2026-10-22')
    const off = periodDays('2026-10-20', '2026-10-22')
    assert.equal(on[27], true)
    assert.equal(off[27], false, 'ngày vừa tắt về xám')
    assert.equal(off[28], true)
    assert.equal(off[26], true)
    assert.doesNotMatch(
      source('features/dashboard/hooks/use-dashboard-data.ts'),
      /cycleLength|predict|forecast/i
    )
    assert.doesNotMatch(source('features/period/period.utils.ts'), /cycleLength|predict|forecast/i)
  }
)
check('Period: ngày lịch sử ngoài 30 ngày không vào lưới; ngày tương lai không vào', () => {
  const cells = periodDays('2026-09-20', '2026-10-24', '2026-10-10')
  assert.equal(cells.length, 30)
  assert.equal(cells.filter(Boolean).length, 1)
  assert.equal(cells[16], true)
})
check(
  'Period: múi giờ — cùng một thời điểm UTC, 30 ô kết thúc ở ngày khác nhau nên ô dịch chỗ',
  () => {
    const now = new Date('2026-10-22T20:00:00Z')
    const tokyo = date.isoInZone(now, 'Asia/Tokyo')
    const newYork = date.isoInZone(now, 'America/New_York')
    const days = periodUtils.periodDaySet(['2026-10-22'])
    assert.equal(dashboardUtils.habitCells(days, tokyo).findIndex(Boolean), 28)
    assert.equal(dashboardUtils.habitCells(days, newYork).findIndex(Boolean), 29)
  }
)
check(
  'Period: Dashboard và trang Period cùng đọc `days` của BE; mọi thay đổi làm mới cả hai; ô hồng có màu',
  () => {
    const data = source('features/dashboard/hooks/use-dashboard-data.ts')
    assert.match(data, /periodDaySet\(periodsQuery\.data\?\.days\)/)
    assert.match(data, /daysAgo: periodsQuery\.data\?\.daysSinceLastPeriodDay \?\? null/)
    assert.doesNotMatch(
      data,
      /daysSinceLastStart/,
      'không rơi về daysSinceLastStart khi BE cũ thiếu field'
    )
    assert.match(
      source('features/period/types/period.types.ts'),
      /daysSinceLastPeriodDay\?: number \| null/
    )
    assert.match(
      source('features/period/pages/PeriodPage.tsx'),
      /periodDaySet\(history\.data\?\.days\)/
    )
    assert.match(
      source('features/dashboard/hooks/use-dashboard.ts'),
      /queryKey: \['periods', from \?\? '', to \?\? ''\]/
    )
    const hook = source('features/period/hooks/use-period.ts')
    assert.match(hook, /all: \['periods'\] as const/)
    assert.equal(
      (hook.match(/invalidateQueries\(\{ queryKey: periodKeys\.all \}\)/g) ?? []).length,
      2,
      'Add/Toggle và Delete'
    )
    assert.match(
      source('features/dashboard/components/DashboardPage/LayoutSection.tsx'),
      /<HabitGrid cells=\{data\.period\.cells\} tone="bg-mf-period" \/>/
    )
  }
)
// Quyết định của user: chân ô Steps = số bước của HÔM NAY (không trung bình 7 ngày); ô Period điền theo cột như ảnh MF.
check('Steps footer: hôm nay có bản ghi → đúng số đó, kể cả khi các ngày khác có số khác', () => {
  const days = stepsBars.stepsWeekOf([stepItem(TODAY, 1505), stepItem('2026-10-22', 9000)], TODAY)
  assert.equal(stepsBars.stepsTodayOf(days), 1505)
})
check(
  'Steps footer: hôm nay chưa có bản ghi nhưng các ngày trước có (cột vẫn vẽ) → null ("--- steps"), không thành 0, không lấy ngày gần nhất',
  () => {
    const items = [stepItem('2026-10-20', 1000), stepItem('2026-10-21', 2000)]
    const days = stepsBars.stepsWeekOf(items, TODAY)
    assert.equal(stepsBars.stepsTodayOf(days), null)
    assert.equal(
      stepsBars.stepsBarRects(days, 120, 44).length,
      2,
      'cột phía trên độc lập với chân ô'
    )
  }
)
check('Steps footer: hôm nay có bản ghi 0 bước thật → 0 ("0 steps"), khác "---"', () => {
  const days = stepsBars.stepsWeekOf([stepItem(TODAY, 0)], TODAY)
  assert.equal(stepsBars.stepsTodayOf(days), 0)
  assert.notEqual(stepsBars.stepsTodayOf(days), null)
  assert.equal(stepsBars.stepsTodayOf(stepsBars.stepsWeekOf([], TODAY)), null)
})
check(
  'Steps footer: "hôm nay" theo múi giờ user — cùng một thời điểm UTC, Tokyo thấy hôm nay chưa có bản ghi còn New York thì có',
  () => {
    const now = new Date('2026-10-22T20:00:00Z')
    const items = [stepItem('2026-10-22', 1505)]
    assert.equal(
      stepsBars.stepsTodayOf(stepsBars.stepsWeekOf(items, date.isoInZone(now, 'Asia/Tokyo'))),
      null
    )
    assert.equal(
      stepsBars.stepsTodayOf(stepsBars.stepsWeekOf(items, date.isoInZone(now, 'America/New_York'))),
      1505
    )
  }
)
check(
  'Steps footer: 0 thật hiện "0" (không bị falsy thành "---"), null hiện "---"; trang chi tiết (Average) không đổi',
  () => {
    const layout = source('features/dashboard/components/DashboardPage/LayoutSection.tsx')
    assert.match(layout, /value=\{data\.steps === null \? '---' : String\(data\.steps\)\}/)
    assert.match(
      source('features/dashboard/hooks/use-dashboard-data.ts'),
      /steps: steps === null \? null : Math\.round\(steps\)/
    )
    assert.match(source('features/steps/steps.utils.ts'), /summarizeSteps/)
  }
)
check(
  'Steps chart: khoảng hở = 50% bề rộng cột, 7 cột trải hết bề rộng nội dung (đo từ ảnh MF)',
  () => {
    const days = stepsBars.stepsWeekOf(
      [
        '2026-10-17',
        '2026-10-18',
        '2026-10-19',
        '2026-10-20',
        '2026-10-21',
        '2026-10-22',
        '2026-10-23',
      ].map((d) => stepItem(d, 1000)),
      TODAY
    )
    const rects = stepsBars.stepsBarRects(days, 118, 36)
    assert.equal(rects.length, 7)
    const bar = rects[0].width
    assert.ok(Math.abs(bar - 118 / 10) < 1e-9, 'cột = bề rộng / (7 + 6 × 0.5)')
    assert.ok(Math.abs(rects[1].x - rects[0].x - bar * 1.5) < 1e-9, 'bước cột = 1.5 × cột')
    assert.ok(Math.abs(rects[6].x + rects[6].width - 118) < 1e-9, 'cột cuối chạm mép phải')
  }
)
check(
  'Period lưới điền THEO CỘT (3 hàng × 10 cột, hôm nay ở góc dưới phải): ngày thứ 27 của 30 nằm ở đầu cột cuối, khớp "2 days ago" của MF',
  () => {
    const pos = (index) => ({ col: Math.floor(index / 3), row: index % 3 }) // grid-flow-col, 3 hàng
    assert.deepEqual(pos(29), { col: 9, row: 2 }, 'hôm nay: góc dưới phải')
    assert.deepEqual(
      pos(27),
      { col: 9, row: 0 },
      '2 ngày trước: đầu cột cuối (ô hồng trong ảnh MF)'
    )
    const cells = dashboardUtils.habitCells(periodUtils.periodDaySet(['2026-10-21']), TODAY)
    assert.equal(cells.findIndex(Boolean), 27)
    const grid = source('features/dashboard/components/DashboardPage/TileVisuals.tsx')
    assert.match(grid, /grid grid-flow-col grid-rows-3 gap-\[4cqw\]/)
    assert.doesNotMatch(grid, /grid grid-cols-10 gap-1/)
  }
)
// Body Metrics (Scale Weight / Visual Body Fat / số đo vòng): mỗi lần ghi = đúng một điểm thật, thẻ "Last 7 Entries" = 7 lần ghi gần nhất
const SPARK_W = 265
const SPARK_H = 48
const xsOf = (values) => entrySpark.entrySparkPoints(values, SPARK_W, SPARK_H).map((p) => p.x)
check('Spark thẻ: 1 / 2 / 3 / 5 / 7 lần ghi = đúng ngần ấy điểm, không thêm điểm giả', () => {
  for (const n of [1, 2, 3, 5, 7]) {
    const values = Array.from({ length: n }, (_, i) => 78 + i * 0.3)
    assert.equal(entrySpark.entrySparkPoints(values, SPARK_W, SPARK_H).length, n, `${n} lần ghi`)
  }
  assert.deepEqual(entrySpark.entrySparkPoints([], SPARK_W, SPARK_H), [])
  assert.deepEqual(entrySpark.entrySparkPoints([79], 0, SPARK_H), [], 'chưa đo xong thì chưa vẽ')
})
check('Spark thẻ: nhiều hơn 7 lần ghi chỉ lấy 7 lần MỚI NHẤT (cuối chuỗi cũ → mới)', () => {
  const values = [70, 71, 72, 73, 74, 75, 76, 77, 78, 79]
  const points = entrySpark.entrySparkPoints(values, SPARK_W, SPARK_H)
  assert.equal(points.length, 7)
  const y = entrySpark.sparkY(values.slice(-7), SPARK_H)
  assert.deepEqual(
    points.map((p) => p.y),
    values.slice(-7).map(y),
    'thang y chỉ tính trên 7 lần hiện, giá trị cũ hơn không ảnh hưởng'
  )
})
check(
  'Spark thẻ: ít lần ghi thì đường NGẮN nằm bên phải, 7 lần trải hết bề rộng; điểm cuối luôn ở mép phải',
  () => {
    const two = xsOf([79.3, 79.3])
    const seven = xsOf([1, 2, 3, 4, 5, 6, 7])
    assert.equal(two[1], SPARK_W - 6)
    assert.equal(seven[6], SPARK_W - 6)
    assert.equal(seven[0], 6, '7 lần ghi: điểm đầu ở mép trái')
    const step = two[1] - two[0]
    assert.ok(step > 0 && step < SPARK_W / 4, `2 điểm chỉ rộng ${step}px, không dàn hết ô`)
    assert.deepEqual(xsOf([1]), [SPARK_W - 6], '1 lần ghi: một điểm bên phải')
    const five = xsOf([1, 2, 3, 4, 5])
    assert.ok(
      five.every((x, i) => i === 0 || Math.abs(x - five[i - 1] - step) < 1e-9),
      'bước đều nhau theo thứ tự ghi'
    )
  }
)
check(
  'Spark thẻ: y tự co giãn theo chính dữ liệu (không từ 0), cao hơn = giá trị lớn hơn, chuỗi phẳng nằm giữa, lb và kg cho cùng hình',
  () => {
    const kg = [79.3, 79.3, 81.8, 78.3, 78.8]
    const ys = entrySpark.entrySparkPoints(kg, SPARK_W, SPARK_H).map((p) => p.y)
    assert.ok(ys[2] < ys[0] && ys[3] > ys[0], '81.8 cao nhất, 78.3 thấp nhất')
    assert.equal(ys[0], ys[1], 'hai lần 79.3 cùng độ cao')
    assert.ok(
      Math.min(...ys) >= 7 - 1e-9 && Math.max(...ys) <= SPARK_H - 7 + 1e-9,
      'trong khung, có lề'
    )
    const flat = entrySpark.entrySparkPoints([80, 80, 80], SPARK_W, SPARK_H).map((p) => p.y)
    assert.equal(new Set(flat).size, 1)
    const lb = entrySpark
      .entrySparkPoints(
        kg.map((v) => v * 2.2046226),
        SPARK_W,
        SPARK_H
      )
      .map((p) => p.y)
    lb.forEach((y, i) => assert.ok(Math.abs(y - ys[i]) < 1e-6, 'đổi đơn vị không đổi hình đường'))
    const tiny = entrySpark.entrySparkPoints([79.3, 79.31], SPARK_W, SPARK_H).map((p) => p.y)
    assert.ok(Math.abs(tiny[0] - tiny[1]) < 4, 'dao động 0.01 kg không thành đường dốc')
  }
)
check(
  'Thẻ Last 7 Entries: BE trả mới → cũ, FE lấy 7 lần MỚI NHẤT rồi xếp cũ → mới theo ngày (không lấy 7 lần cũ nhất)',
  () => {
    const be = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((d) => ({
      date: `2026-10-${String(d).padStart(2, '0')}`,
      v: d,
    }))
    const out = dashboardUtils.latestByDate(be, (e) => e.date, 7)
    assert.deepEqual(
      out.map((e) => e.v),
      [4, 5, 6, 7, 8, 9, 10]
    )
    const gaps = ['2026-10-22', '2026-10-17', '2026-09-30'].map((d) => ({ date: d }))
    assert.deepEqual(
      dashboardUtils.latestByDate(gaps, (e) => e.date, 7).map((e) => e.date),
      ['2026-09-30', '2026-10-17', '2026-10-22'],
      'ngày không liên tiếp: mỗi lần ghi một điểm, không điền ngày thiếu'
    )
  }
)
check(
  'Thẻ + chi tiết cùng nguồn: thẻ Scale Weight đọc GET /weights?all&limit=7 (không giới hạn 365 ngày), số lớn là lần cân mới nhất của CÙNG phản hồi',
  () => {
    const data = source('features/dashboard/hooks/use-dashboard-data.ts')
    assert.match(data, /useRecentWeights\(today, SPARK_ENTRIES\)/)
    assert.match(
      data,
      /scale: \{ spark: scaleSpark, latest: recentWeights\.data\?\.latestWeightKg \?\? null \}/
    )
    assert.doesNotMatch(data, /latestByDate\(entries, \(entry\) => entry\.logDate, DAYS_PER_WEEK\)/)
    assert.match(
      source('features/weight/services/weight.service.ts'),
      /listRecent: \(to: string, limit: number\)[\s\S]{0,160}all: true, limit/
    )
    assert.match(
      source('features/weight/hooks/use-weights.ts'),
      /recent: \(to: string, limit: number\) => \['weights', 'recent'/
    )
  }
)
check(
  'Thẻ body metric: không đường làm mượt, không nhân đôi điểm một giá trị, mọi thẻ dùng EntrySparkline',
  () => {
    const visuals = source('features/dashboard/components/DashboardPage/TileVisuals.tsx')
    const entry = visuals.slice(
      visuals.indexOf('export function EntrySparkline'),
      visuals.indexOf('const STACK_SEGMENTS')
    )
    assert.match(entry, /<polyline/)
    assert.doesNotMatch(entry, / Q |smoothPath/)
    const tiles = source('features/dashboard/components/DashboardPage/BodyMetricTiles.tsx')
    assert.doesNotMatch(tiles, /sparkOf|<Sparkline/)
    assert.equal((tiles.match(/<EntrySparkline/g) ?? []).length, 2)
    assert.match(
      tiles,
      /latestByDate\(metric\?\.entries \?\? \[\], \(entry\) => entry\.date, SPARK_ENTRIES\)/
    )
    const layout = source('features/dashboard/components/DashboardPage/LayoutSection.tsx')
    assert.doesNotMatch(layout, /sparkOf|<Sparkline/)
    assert.equal((layout.match(/<EntrySparkline/g) ?? []).length, 2)
  }
)
check(
  'Chi tiết Scale Weight 1W (ảnh MF): Fri 79.3, Mon 79.3, Tue 81.8, Wed 78.3, Thu 78.8 → Average 79.5, Difference −0.5, trục 78–82 vạch số tròn',
  () => {
    const points = [
      { date: '2026-10-16', value: 79.3 },
      { date: '2026-10-19', value: 79.3 },
      { date: '2026-10-20', value: 81.8 },
      { date: '2026-10-21', value: 78.3 },
      { date: '2026-10-22', value: 78.8 },
    ]
    assert.deepEqual(bodyMetric.summarizeMetric(points), { average: 79.5, difference: -0.5 })
    const axis = bodyMetric.metricScale(
      points.map((p) => p.value),
      4,
      true
    )
    assert.deepEqual(axis.ticks, [78, 79, 80, 81, 82])
    assert.equal(bodyMetric.summarizeMetric([]).average, null)
    assert.deepEqual(bodyMetric.summarizeMetric([points[0]]), { average: 79.3, difference: null })
    const daily = bodyMetric.averageMetric(points, 'daily', 'Monday')
    assert.equal(daily.length, 5, 'ngày thiếu (Sat, Sun) không có điểm')
    assert.deepEqual(
      daily.map((p) => p.date),
      points.map((p) => p.date)
    )
  }
)
check(
  'Chi tiết body metric: trục y luôn vừa dữ liệu, đường chỉ nối điểm thật theo thứ tự thời gian (kể cả điểm liền kề ngoài khung)',
  () => {
    const view = source('features/weight/components/BodyMetricPage/BodyMetricView.tsx')
    assert.doesNotMatch(view, /fit=\{expand\.expanded\}/)
    assert.match(view, /tickCount=\{4\}\s*\n\s*fit\b/)
    const chart = source('features/weight/components/BodyMetricPage/MetricChart.tsx')
    assert.match(chart, /<polyline/)
    assert.doesNotMatch(chart, /<path|smooth|curve/i)
    assert.match(chart, /lineSpan/)
    assert.match(chart, /shown\.map\(\(point\) => \(\s*<circle/, 'mỗi điểm thật một vòng tròn')
  }
)
// Y-axis đo vòng / cân: luôn co theo dữ liệu, một logic dùng chung, Expand/Collapse không đổi domain
const scaleOf = (values) => bodyMetric.metricScale(values, 4, true)
check(
  'Y-axis: domain bao hết mọi điểm, có lề (điểm cao nhất / thấp nhất không bị cắt) và vạch ở số tròn',
  () => {
    for (const values of [
      [79.3, 79.3, 81.8, 78.3, 78.8],
      [17, 20],
      [26.5, 26],
      [60, 62.5, 61, 80],
      [0.5, 2.5],
    ]) {
      const axis = scaleOf(values)
      assert.ok(axis.min <= Math.min(...values) && axis.max >= Math.max(...values), `${values}`)
      assert.ok(axis.ticks.length >= 3, 'ít nhất 3 vạch')
      assert.equal(axis.min, axis.ticks[0])
      assert.equal(axis.max, axis.ticks[axis.ticks.length - 1])
    }
    assert.deepEqual(scaleOf([17, 20]).ticks, [17, 18, 19, 20], 'Neck 1W như ảnh MF')
  }
)
check(
  'Y-axis: một điểm hoặc mọi giá trị bằng nhau vẫn có domain hợp lệ chứa điểm đó (không chia cho 0, không dẹt)',
  () => {
    for (const values of [[79.3], [80, 80, 80], [0], [26]]) {
      const axis = scaleOf(values)
      assert.ok(axis.max > axis.min, `${values} domain rộng > 0`)
      assert.ok(axis.min <= values[0] && axis.max >= values[0])
      assert.ok(Number.isFinite(axis.min) && Number.isFinite(axis.max))
    }
    assert.ok(scaleOf([79.3]).ticks.length >= 3)
  }
)
check('Y-axis: không phóng đại biến động cực nhỏ (79.30 → 79.31 không thành đường dốc)', () => {
  const axis = scaleOf([79.3, 79.31])
  assert.ok(axis.max - axis.min >= 1, `domain ${axis.max - axis.min} đủ rộng so với dao động 0.01`)
  const wide = scaleOf([70, 90])
  assert.ok(wide.max - wide.min >= 20)
})
check(
  'Y-axis: Expand/Collapse chỉ đổi chiều cao, không đổi domain (tickCount / fit không phụ thuộc expand); chỉ chart đo vòng dùng metricScale',
  () => {
    const view = source('features/weight/components/BodyMetricPage/BodyMetricView.tsx')
    assert.doesNotMatch(view, /tickCount=\{[^}]*expand/)
    assert.doesNotMatch(view, /fit=\{[^}]*expand/)
    assert.match(view, /height=\{expand\.height\}/)
    assert.deepEqual(scaleOf([79.3, 81.8]), scaleOf([79.3, 81.8]))
    const users = [
      'features/dashboard/components/DashboardPage/InsightCharts.tsx',
      'features/steps/components/StepsChart.tsx',
    ]
    for (const file of users) {
      try {
        assert.doesNotMatch(source(file), /metricScale/, `${file}: thang nghiệp vụ từ 0 giữ nguyên`)
      } catch (error) {
        if (error.code === 'ENOENT') continue
        throw error
      }
    }
  }
)
check(
  'Left / Right độc lập: 6 cặp là 12 số đo riêng, ô Dashboard ánh xạ từng bên vào khoá bên đó, không thay thế / gộp',
  () => {
    const catalog = source('features/weight/body-measurements.ts')
    for (const part of ['Bicep', 'Forearm', 'Wrist', 'Thigh', 'Calf', 'Ankle']) {
      assert.match(catalog, new RegExp(`key: 'left${part}'`))
      assert.match(catalog, new RegExp(`key: 'right${part}'`))
    }
    const tiles = source('features/dashboard/components/DashboardPage/BodyMetricTiles.tsx')
    for (const [tile, key] of [
      ['bicepL', 'leftBicep'],
      ['bicepR', 'rightBicep'],
      ['thighL', 'leftThigh'],
      ['thighR', 'rightThigh'],
      ['calfL', 'leftCalf'],
      ['calfR', 'rightCalf'],
    ])
      assert.match(tiles, new RegExp(`${tile}: '${key}'`))
    assert.doesNotMatch(tiles, /left\w*\s*\?\?\s*right|right\w*\s*\?\?\s*left/)
    assert.match(tiles, /metric\?\.entries \?\? \[\]/)
    assert.match(tiles, /metric && values\.length > 0 \? trim\(metric\.latestCm\) : '---'/)
  }
)
check(
  'Ngày chỉ có một bên: bên có dữ liệu có điểm, bên kia "---" và không đường (tìm theo đúng khoá)',
  () => {
    const tiles = source('features/dashboard/components/DashboardPage/BodyMetricTiles.tsx')
    assert.match(tiles, /overview\.data\?\.metrics\.find\(\(item\) => item\.key === key\)/)
    const left = [
      { date: '2026-10-20', valueCm: 34 },
      { date: '2026-10-22', valueCm: 34.5 },
    ]
    const byDate = (entries) => dashboardUtils.latestByDate(entries, (entry) => entry.date, 7)
    assert.deepEqual(
      byDate(left).map((entry) => entry.valueCm),
      [34, 34.5]
    )
    assert.deepEqual(byDate([]), [], 'bên kia: không điểm nào')
    assert.deepEqual(
      { left: byDate(left).length, right: byDate([{ date: '2026-10-21', valueCm: 33 }]).length },
      { left: 2, right: 1 },
      'số lần ghi hai bên không đều: mỗi bên đúng số của nó'
    )
  }
)
check(
  'Dữ liệu đổi (log / sửa / xoá / nhập lịch sử) thì thẻ Dashboard và trang chi tiết cùng làm mới: mọi mutation invalidate đúng nhóm khoá của cả hai',
  () => {
    const hooks = source('features/weight/hooks/use-weights.ts')
    assert.match(hooks, /WEIGHT_INVALIDATE = \[\s*weightKeys\.all,[\s\S]*?\['body-metrics'\]/)
    assert.match(hooks, /MEASUREMENT_INVALIDATE = \[measurementKeys\.all, \['body-metrics'\]\]/)
    assert.match(hooks, /VISUAL_INVALIDATE = \[visualBodyFatKeys\.all, \['body-metrics'\]\]/)
    const overview = source('features/dashboard/hooks/use-measurement-overview.ts')
    assert.match(overview, /queryKey: \['body-metrics', 'measurement-overview'/)
    assert.match(hooks, /recent: \(to: string, limit: number\) => \['weights', 'recent'/)
    assert.match(hooks, /history: \(to: string\) => \['weights', 'all'/)
    assert.match(hooks, /visualBodyFatKeys = \{\s*all: \['visual-body-fat'\]/)
  }
)
check(
  'Last 7 Entries = 7 NGÀY GẦN NHẤT CÓ DỮ LIỆU (không phải 7 ngày liên tiếp), nhập lịch sử cũ vẫn tính; hôm nay theo múi giờ user',
  () => {
    const dates = [
      '2026-01-05',
      '2026-03-10',
      '2026-04-01',
      '2026-06-30',
      '2026-08-15',
      '2026-09-09',
      '2026-10-01',
      '2026-10-22',
    ]
    const newest = dashboardUtils.latestByDate([...dates].reverse(), (d) => d, 7)
    assert.deepEqual(newest, dates.slice(1), '8 ngày có dữ liệu rải 10 tháng: lấy 7 ngày mới nhất')
    const imported = dashboardUtils.latestByDate(['2024-02-01', '2024-01-01'], (d) => d, 7)
    assert.deepEqual(
      imported,
      ['2024-01-01', '2024-02-01'],
      'chỉ có dữ liệu nhập lịch sử vẫn có thẻ'
    )
    const now = new Date('2026-10-22T20:00:00Z')
    assert.equal(date.isoInZone(now, 'Asia/Tokyo'), '2026-10-23')
    assert.equal(date.isoInZone(now, 'America/New_York'), '2026-10-22')
  }
)
// Macros Detail: MỌI số (kcal từng phần, % calo, trung bình, bucket) do BE tính — GET /nutrients/macros/series; FE chỉ vẽ / định dạng
const mday = (date, cal, p, f, c, extra = {}) => ({
  date,
  isLogged: true,
  isFasting: false,
  isIncomplete: false,
  caloriesKcal: cal,
  proteinG: p,
  fatG: f,
  carbsG: c,
  proteinKcal: p * 4,
  fatKcal: f * 9,
  carbsKcal: c * 4,
  otherKcal: cal - (p * 4 + f * 9 + c * 4),
  ...extra,
})
const unlogged = (date) => ({
  date,
  isLogged: false,
  isFasting: false,
  isIncomplete: false,
  caloriesKcal: null,
  proteinG: null,
  fatG: null,
  carbsG: null,
  proteinKcal: null,
  fatKcal: null,
  carbsKcal: null,
  otherKcal: null,
})
const avg = (over = {}) => ({
  caloriesKcal: 1000,
  proteinG: 43.5,
  fatG: 13,
  carbsG: 133,
  proteinKcal: 174,
  fatKcal: 117,
  carbsKcal: 532,
  otherKcal: 177,
  proteinPercent: 17.4,
  fatPercent: 11.7,
  carbsPercent: 53.2,
  otherPercent: 17.7,
  ...over,
})
const SERIES = {
  from: '2026-10-18',
  to: '2026-10-24',
  days: [
    mday('2026-10-18', 280, 10, 0, 50),
    mday('2026-10-19', 95, 0, 0, 0),
    mday('2026-10-20', 1460, 107.5, 32.2, 185),
    mday('2026-10-21', 3250, 55, 20, 297),
    unlogged('2026-10-22'),
    mday('2026-10-23', 0, 0, 0, 0, { isFasting: true }),
    mday('2026-10-24', 100, 50, 0, 0),
  ],
  summary: {
    from: '2026-10-18',
    to: '2026-10-24',
    loggedDays: 6,
    calendarDays: 7,
    averages: avg(),
  },
  buckets: [
    {
      start: '2026-10-18',
      end: '2026-10-18',
      loggedDays: 1,
      averages: avg({
        caloriesKcal: 280,
        carbsKcal: 200,
        proteinKcal: 40,
        fatKcal: 0,
        otherKcal: 40,
      }),
    },
    { start: '2026-10-19', end: '2026-10-25', loggedDays: 5, averages: avg() },
  ],
}
check(
  'Macros: cột lấy NGUYÊN kcal của BE (không tính lại); ngày chưa log không có cột; ngày nhịn ăn là cột 0',
  () => {
    const bars = macrosDetail.macroBarsOf(SERIES, 'daily')
    assert.deepEqual(
      bars.map((b) => b.date),
      ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-23', '2026-10-24'],
      'ngày 22 chưa log: không cột'
    )
    const wed = bars.find((b) => b.date === '2026-10-21')
    assert.deepEqual(
      [wed.carbs, wed.fat, wed.protein, wed.other, wed.total],
      [1188, 180, 220, 1662, 3250],
      'như BE: C 1188 / F 180 / P 220 / Other 1662 / tổng 3250'
    )
    const fast = bars.find((b) => b.date === '2026-10-23')
    assert.equal(macrosDetail.stackTotal(fast), 0)
    assert.deepEqual(macrosDetail.MACRO_PARTS, ['carbs', 'fat', 'protein', 'other'])
  }
)
check(
  'Macros: Other ÂM (macro nhiều hơn kcal): số thật giữ trong bar, chỉ VẼ Other khi > 0, % của P / F / C không bị kẹp',
  () => {
    const neg = macrosDetail.macroBarsOf(SERIES, 'daily').find((b) => b.date === '2026-10-24')
    assert.equal(neg.other, -100, 'số thô có dấu của BE')
    assert.equal(macrosDetail.drawnKcal(neg, 'other'), 0)
    assert.equal(macrosDetail.drawnKcal(neg, 'protein'), 200)
    assert.equal(macrosDetail.stackTotal(neg), 200, 'cột = các phần được vẽ')
    assert.equal(macrosDetail.percentText(neg, 'protein'), '200%', 'không kẹp xuống 100%')
    assert.equal(macrosDetail.percentText(neg, 'carbs'), '0%')
  }
)
check(
  'Macros: % calo mỗi ngày theo đúng công thức BE (kcal phần ÷ kcal tổng × 100, 1 số lẻ ra xa 0) rồi hiện số nguyên: ảnh MF 7% P • 6% F • 37% C',
  () => {
    const bars = macrosDetail.macroBarsOf(SERIES, 'daily')
    const wed = bars.find((b) => b.date === '2026-10-21')
    assert.equal(macrosDetail.percentOf(wed.protein, wed.total), 6.8) // 220 / 3250 = 6.769…
    assert.equal(macrosDetail.percentOf(wed.fat, wed.total), 5.5) // 180 / 3250 = 5.538…
    assert.equal(macrosDetail.percentOf(wed.carbs, wed.total), 36.6) // 1188 / 3250 = 36.55
    assert.deepEqual(
      ['protein', 'fat', 'carbs'].map((part) => macrosDetail.percentText(wed, part)),
      ['7%', '6%', '37%']
    )
    const mon = bars.find((b) => b.date === '2026-10-19')
    assert.deepEqual(
      ['protein', 'fat', 'carbs'].map((part) => macrosDetail.percentText(mon, part)),
      ['0%', '0%', '0%'],
      'ngày chỉ có calo Quick Add'
    )
    assert.equal(macrosDetail.drawnKcal(mon, 'other'), 95, 'cột toàn Other')
  }
)
check('Macros: tổng kcal 0 (ngày nhịn ăn) → null / 0%, không chia cho 0, thanh để trống', () => {
  assert.equal(macrosDetail.percentOf(0, 0), null)
  assert.equal(macrosDetail.percentOf(5, 0), null)
  const fast = macrosDetail.macroBarsOf(SERIES, 'daily').find((b) => b.date === '2026-10-23')
  for (const part of ['protein', 'fat', 'carbs'])
    assert.equal(macrosDetail.percentText(fast, part), '0%')
  const list = source('features/dashboard/components/MacrosPage/MacrosBreakdownList.tsx')
  assert.match(list, /total > 0 &&/)
})
check(
  'Macros: W / M lấy bucket của BE (chỉ bucket có ngày log), đặt ở ngày đầu nhóm; D lấy ngày',
  () => {
    const weekly = macrosDetail.macroBarsOf(SERIES, 'weekly')
    assert.deepEqual(
      weekly.map((b) => [b.date, b.end, b.days, b.total]),
      [
        ['2026-10-18', '2026-10-18', 1, 280],
        ['2026-10-19', '2026-10-25', 5, 1000],
      ]
    )
    assert.equal(macrosDetail.macroBarsOf(SERIES, 'monthly').length, 2)
    assert.deepEqual(macrosDetail.macroBarsOf({ ...SERIES, buckets: [] }, 'weekly'), [])
  }
)
check(
  'Macros: tóm tắt Protein / Fat / Carbs = summary.averages của BE cho đúng khoảng đang xem (không tự tính); không ngày log → "---"',
  () => {
    assert.equal(macrosDetail.gramText(43.5), '44', 'làm tròn ra xa 0 khi hiển thị')
    assert.equal(macrosDetail.gramText(43.4), '43')
    assert.equal(macrosDetail.gramText(null), null)
    assert.equal(macrosDetail.gramText(undefined), null)
    const page = source('features/dashboard/pages/MacrosDetailPage.tsx')
    assert.match(page, /range === 'All' \? series\.summary : windowSummary\.data\?\.summary/)
    assert.match(page, /useMacrosSeries\(\s*win \? \{ from: win\.from, to: win\.to \} : \{\}/)
    assert.match(page, /gramText\(averages\?\.proteinG\)/)
    for (const gone of [
      'macroSummary',
      'averageMacroDays',
      'compositionOf',
      'macroDaysOf',
      'MACROS_ALL_FROM',
    ])
      assert.equal(macrosDetail[gone], undefined, `${gone} đã bỏ: FE không tự tính`)
  }
)
check(
  'Macros: mỗi kỳ 1W / 1M / 3M / 6M / 1Y gửi from / to của cửa sổ kết thúc hôm nay; kéo biểu đồ đổi from / to; All dùng toàn lịch sử',
  () => {
    const today = '2026-10-23'
    const total = 400
    const wins = ['1W', '1M', '3M', '6M', '1Y'].map((r) => {
      const w = geometry.viewWindow(today, geometry.slotsOf(r, total), 0)
      return [r, date.daysBetween(w.from, w.to) + 1, w.to]
    })
    assert.deepEqual(wins, [
      ['1W', 7, today],
      ['1M', 30, today],
      ['3M', 91, today],
      ['6M', 182, today],
      ['1Y', 365, today],
    ])
    const panned = geometry.viewWindow(today, 7, 7)
    assert.deepEqual([panned.from, panned.to], ['2026-10-10', '2026-10-16'])
    const hooks = source('features/dashboard/hooks/use-dashboard.ts')
    assert.match(hooks, /'nutrients',\s*'macros-series'/)
    assert.match(hooks, /placeholderData: keepPreviousData/)
  }
)
check(
  'Macros: nguồn duy nhất GET /nutrients/macros/series; log món làm mới (khoá nutrients); Dashboard tile giữ nguồn riêng',
  () => {
    assert.match(source('config/api-routes.ts'), /macrosSeries: '\/nutrients\/macros\/series'/)
    assert.match(
      source('features/dashboard/services/dashboard.service.ts'),
      /macrosSeries: \(params: MacrosSeriesParams\)[\s\S]{0,160}apiRoutes\.nutrients\.macrosSeries, \{ params \}/
    )
    const foodLog = source('features/food-log/hooks/use-food-log.ts')
    assert.match(foodLog, /LOG_DERIVED_KEYS = \[\s*\['nutrients'\]/)
    const page = source('features/dashboard/pages/MacrosDetailPage.tsx')
    assert.doesNotMatch(page, /useDailyProgress|macroDayOf|KCAL_PER_GRAM/)
    const detail = source('features/dashboard/macros-detail.ts')
    const bars = detail.slice(
      detail.indexOf('const barOf'),
      detail.indexOf('export const drawnKcal')
    )
    assert.doesNotMatch(bars, /KCAL_PER_GRAM|\* 4|\* 9/, 'không quy gram → kcal ở FE')
    assert.match(
      source('features/dashboard/hooks/use-dashboard-data.ts'),
      /macroBarOn\(macrosSeries\.data, date\)/
    )
    assert.match(
      source('features/dashboard/components/DashboardPage/LayoutSection.tsx'),
      /href=\{routePath\.dashboardMacros\}/
    )
  }
)
check(
  'Macros: ô Dashboard và màn chi tiết cùng một nguồn / helper — cùng fixture cho đúng cùng các phần kcal, Other âm không vẽ ở cả hai',
  () => {
    const detail = macrosDetail.macroBarsOf(SERIES, 'daily')
    for (const bar of detail) {
      const tile = macrosDetail.macroBarOn(SERIES, bar.date)
      assert.deepEqual(tile, bar, bar.date + ': ô và chi tiết cùng một bar')
      for (const part of macrosDetail.MACRO_PARTS)
        assert.equal(macrosDetail.drawnKcal(tile, part), macrosDetail.drawnKcal(bar, part))
      assert.equal(macrosDetail.stackTotal(tile), macrosDetail.stackTotal(bar))
    }
    assert.equal(
      macrosDetail.macroBarOn(SERIES, '2026-10-22'),
      null,
      'ngày chưa log: ô không có cột, như chi tiết'
    )
    assert.equal(macrosDetail.macroBarOn(SERIES, '2030-01-01'), null, 'ngoài phản hồi: không cột')
    const neg = macrosDetail.macroBarOn(SERIES, '2026-10-24')
    assert.equal(neg.other, -100, 'số thật của BE không bị sửa')
    assert.equal(macrosDetail.drawnKcal(neg, 'other'), 0, 'Other âm không vẽ ở ô')
    assert.equal(macrosDetail.stackTotal(neg), 200)
    const tiles = source('features/dashboard/components/DashboardPage/TileVisuals.tsx')
    const stack = tiles.slice(
      tiles.indexOf('export function MacroStack'),
      tiles.indexOf('export function StepsBars')
    )
    assert.match(stack, /stackTotal\(day\)/)
    assert.match(stack, /drawnKcal\(day, part\)/)
    assert.doesNotMatch(
      stack,
      /day\.carbs \+ day\.fat|day\[part\]/,
      'không tự cộng / đọc Other thô ở ô'
    )
    assert.doesNotMatch(
      source('features/dashboard/hooks/use-dashboard-data.ts'),
      /macroDayOf|KCAL_PER_GRAM|dailyByDate/
    )
  }
)

// ── Sửa món đã log: lượng / khẩu phần / bữa, một PUT cho mỗi lần lưu (không mạng) ──
check(
  'Edit entry: bữa suy từ giờ theo đúng ngưỡng BE (<10:00, <11:30, <14:00, <17:00, <21:00); đổi giờ đổi bữa, không đổi giờ giữ bữa cũ',
  () => {
    const cases = [
      ['06:59', 'Breakfast'],
      ['09:59', 'Breakfast'],
      ['10:00', 'MorningSnack'],
      ['11:29', 'MorningSnack'],
      ['11:30', 'Lunch'],
      ['13:59', 'Lunch'],
      ['14:00', 'AfternoonSnack'],
      ['16:59', 'AfternoonSnack'],
      ['17:00', 'Dinner'],
      ['20:59', 'Dinner'],
      ['21:00', 'EveningSnack'],
      ['23:59', 'EveningSnack'],
      ['00:00', 'Breakfast'],
    ]
    for (const [time, meal] of cases) assert.equal(enums.mealForTime(time), meal, time)
    const dialog = source('features/food-log/components/FoodLogPage/EntryEditDialog.tsx')
    assert.match(
      dialog,
      /mealType: time === entryTime\(entry\) \? entry\.mealType : mealForTime\(time\)/
    )
  }
)
check(
  'Edit entry: payload = { mealType, eatenAt HH:mm:00, foodServingId (khẩu phần ảo → khẩu phần gốc của dòng), quantity } và cả hai nút Done lưu CÙNG một thay đổi',
  () => {
    const dialog = source('features/food-log/components/FoodLogPage/EntryEditDialog.tsx')
    assert.match(dialog, /eatenAt: \x60\$\{time\}:00\x60/)
    assert.match(
      dialog,
      /foodServingId: servingId === LOGGED_UNIT \? entry\.foodServingId : servingId/
    )
    assert.match(dialog, /quantity,\n\s*\}\)/)
    assert.match(dialog, /onDone: save/)
    assert.match(
      dialog,
      /if \(change\.current\.valid\) save\(change\.current\)/,
      'Done trên cùng chỉ lưu khi số nhập hợp lệ'
    )
    assert.match(dialog, /disabled=\{isPending \|\| !detail\}/, 'Done trên bị khoá khi đang lưu')
  }
)
check(
  'Edit entry: MỘT lần lưu = MỘT PUT — khoá đồng bộ theo ref chống bấm Done hai lần (PUT thứ hai cùng món bị BE từ chối), mở lại khi PUT xong',
  () => {
    const page = source('features/food-log/pages/FoodLogPage.tsx')
    assert.match(page, /import \{ useEffect, useRef, useState \} from 'react'/)
    assert.match(page, /const savingEntry = useRef\(false\)/)
    assert.match(page, /if \(savingEntry\.current\) return\s*\n\s*savingEntry\.current = true/)
    assert.match(page, /onSettled: \(\) => \{\s*\n\s*savingEntry\.current = false/)
    assert.match(page, /onSuccess: \(\) => editSheet\.hide\(\)/)
    // mô phỏng: hai lần gọi liên tiếp trước khi PUT xong chỉ gửi một lần
    let inflight = false,
      sent = 0
    const save = (done) => {
      if (inflight) return
      inflight = true
      sent += 1
      done.settle = () => {
        inflight = false
      }
    }
    const call = {}
    save(call)
    save(call)
    assert.equal(sent, 1)
    call.settle()
    save(call)
    assert.equal(sent, 2, 'lần sửa sau khi PUT xong vẫn gửi bình thường')
  }
)
check(
  'Edit entry: sửa / xoá món làm mới nhật ký, tổng ngày, tuần, Macros và Dashboard (khoá food-log + nutrients + expenditure + energy-balance)',
  () => {
    const hooks = source('features/food-log/hooks/use-food-log.ts')
    assert.match(
      hooks,
      /LOG_DERIVED_KEYS = \[\s*\['nutrients'\],\s*\['nutrition-overview'\],\s*\['expenditure'\],\s*\['energy-balance'\],\s*\['weights', 'trend'\],\s*\['nutrition-data'\],\s*\]/
    )
    assert.match(hooks, /void queryClient\.invalidateQueries\(\{ queryKey: foodLogKeys\.all \}\)/)
    assert.match(hooks, /export const useUpdateEntry = \(\) =>\s*useLogMutation\(/)
    assert.match(
      hooks,
      /onMutate: async \(id\) => \{/,
      'xoá món: bỏ khỏi cache ngay, lỗi thì trả lại'
    )
  }
)

check(
  'Macros: biểu đồ và danh sách chỉ đọc bar BE: xếp chồng theo MACRO_PARTS, trục y theo năng lượng user từ 0, chú giải / thanh ngang cùng bảng màu',
  () => {
    const chart = source('features/dashboard/components/MacrosPage/MacrosChart.tsx')
    assert.match(chart, /MACRO_PARTS\.map\(\(part\) =>/)
    assert.match(chart, /energy\.convert\(drawnKcal\(day, part\)\)/)
    assert.match(chart, /energy\.convert\(stackTotal\(day\)\)/)
    assert.match(chart, /niceAxis\(top\)/)
    assert.match(chart, /min=\{0\}/)
    const list = source('features/dashboard/components/MacrosPage/MacrosBreakdownList.tsx')
    assert.match(list, /percentText\(day, part\)/)
    assert.match(list, /MACRO_PART_STYLE\[part\]\.bg/)
    const styles = macrosDetail.MACRO_PART_STYLE
    assert.deepEqual(
      macrosDetail.MACRO_PARTS.map((p) => styles[p].fill),
      ['fill-mf-tile-carbs', 'fill-mf-tile-fat', 'fill-mf-tile-protein', 'fill-mf-tile-calories']
    )
  }
)
// Parity FE ↔ BE cho Average / Difference của Body Metrics. Kết quả BE tính TAY từ BE/src/Application/Features/Metrics/MetricSeries.cs:
//   dòng 12  inRange = điểm có from ≤ ngày ≤ to, tăng dần theo ngày
//   dòng 13  rỗng → Count 0, Average / Difference null
//   dòng 20  Average = Round(mean)  — dòng 46: Math.Round(value, 2, MidpointRounding.AwayFromZero)
//   dòng 21  Difference = Count ≥ 2 ? Round(last − first) : null   (giữ dấu, không abs)
//   dòng 27  bucket Average = Round(mean các điểm ngày của nhóm); Summary luôn tính trên điểm NGÀY thô, không phải bucket
const pts = (rows) => rows.map(([d, v]) => ({ date: d, value: v }))
const BE_VECTORS = [
  { name: '0 entry', rows: [], average: null, difference: null },
  { name: '1 entry', rows: [['2026-10-20', 79.3]], average: 79.3, difference: null },
  {
    name: '2 entries, Difference ÂM',
    rows: [
      ['2026-10-17', 79.3],
      ['2026-10-22', 78.8],
    ],
    average: 79.05, // 158.1 / 2
    difference: -0.5, // 78.8 − 79.3
  },
  {
    name: '2 entries, Difference DƯƠNG',
    rows: [
      ['2026-10-17', 78.8],
      ['2026-10-22', 79.3],
    ],
    average: 79.05,
    difference: 0.5,
  },
  {
    name: '7 entries',
    rows: [
      ['2026-10-17', 80.1],
      ['2026-10-18', 79.9],
      ['2026-10-19', 80.4],
      ['2026-10-20', 80.0],
      ['2026-10-21', 79.5],
      ['2026-10-22', 79.8],
      ['2026-10-23', 79.2],
    ],
    average: 79.84, // 558.9 / 7 = 79.842857… → 79.84
    difference: -0.9, // 79.2 − 80.1
  },
  {
    name: 'nhiều entries (10)',
    rows: Array.from({ length: 10 }, (_, i) => [
      `2026-10-${String(10 + i).padStart(2, '0')}`,
      60 + i,
    ]),
    average: 64.5, // 645 / 10
    difference: 9,
  },
  {
    name: 'ngày thiếu KHÔNG tính 0 (hai điểm cách nhau 19 ngày)',
    rows: [
      ['2026-10-01', 79],
      ['2026-10-20', 81],
    ],
    average: 80, // không phải (79 + 81) / 20
    difference: 2,
  },
  {
    name: 'nửa làm tròn RA XA 0 (dương): 79.305 → 79.31',
    rows: [
      ['2026-10-20', 79.3],
      ['2026-10-21', 79.31],
    ],
    average: 79.31, // Round(79.305, 2, AwayFromZero)
    difference: 0.01,
  },
  {
    name: 'nửa làm tròn RA XA 0 (âm): Difference −0.005 → −0.01',
    rows: [
      ['2026-10-20', 10.005],
      ['2026-10-21', 10.0],
    ],
    average: 10.0, // Round(10.0025, 2)
    difference: -0.01, // Math.Round(-0.005, 2, AwayFromZero)
  },
]
check(
  'Parity BE: Average / Difference của mọi vector (0, 1, 2, 7, nhiều điểm, ngày thiếu, nửa làm tròn, dương / âm) khớp kết quả BE tính tay',
  () => {
    for (const v of BE_VECTORS) {
      const got = bodyMetric.summarizeMetric(pts(v.rows))
      assert.equal(got.average, v.average, `${v.name}: Average`)
      assert.equal(got.difference, v.difference, `${v.name}: Difference`)
    }
  }
)
check(
  'roundAway = Math.Round(decimal, d, AwayFromZero): nửa luôn ra xa 0 kể cả âm, không ra -0',
  () => {
    assert.equal(bodyMetric.roundAway(0.005, 2), 0.01)
    assert.equal(bodyMetric.roundAway(-0.005, 2), -0.01)
    assert.equal(bodyMetric.roundAway(1.005, 2), 1.01)
    assert.equal(bodyMetric.roundAway(2.675, 2), 2.68)
    assert.equal(bodyMetric.roundAway(-2.675, 2), -2.68)
    assert.equal(bodyMetric.roundAway(79.305, 2), 79.31)
    assert.equal(bodyMetric.roundAway(0.25, 1), 0.3)
    assert.equal(bodyMetric.roundAway(-0.25, 1), -0.3)
    assert.ok(Object.is(bodyMetric.roundAway(-0.001, 2), 0), 'không ra -0')
  }
)
check(
  'Parity BE: bucket W / M = trung bình các điểm ngày của nhóm làm tròn 2 chữ số (MetricSeries.cs dòng 27); Summary không dùng bucket',
  () => {
    const week = bodyMetric.averageMetric(
      pts([
        ['2026-10-20', 79.3],
        ['2026-10-21', 79.31],
        ['2026-10-27', 80],
      ]),
      'weekly',
      'Monday'
    )
    assert.deepEqual(
      week.map((b) => [b.date, b.days, b.value]),
      [
        ['2026-10-19', 2, 79.31],
        ['2026-10-26', 1, 80],
      ]
    )
    const month = bodyMetric.averageMetric(
      pts([
        ['2026-10-20', 79.3],
        ['2026-10-21', 79.31],
      ]),
      'monthly',
      'Monday'
    )
    assert.deepEqual(
      month.map((b) => [b.date, b.value]),
      [['2026-10-01', 79.31]]
    )
    const view = source('features/weight/components/BodyMetricPage/BodyMetricView.tsx')
    assert.match(view, /summarizeMetric\(inWindow\)/, 'Summary từ điểm ngày thô trong khoảng')
    assert.match(view, /const inWindow = points\.filter/)
    assert.doesNotMatch(view, /summarizeMetric\(averageMetric/)
  }
)
check(
  'Khoảng đang xem: 1W / 1M / 3M / 6M / 1Y / All lấy đúng điểm trong cửa sổ kết thúc hôm nay (khớp from / to BE); kéo biểu đồ đổi cửa sổ; kỳ trống → null',
  () => {
    const today = '2026-10-23'
    const points = pts([
      ['2026-01-01', 90],
      ['2026-09-25', 78],
      ['2026-10-17', 79],
      ['2026-10-20', 81],
      ['2026-10-23', 80],
    ])
    const total = date.daysBetween(points[0].date, today) + 1
    const summaryOf = (range, snapped = 0) => {
      const win = geometry.viewWindow(today, geometry.slotsOf(range, total), snapped)
      return bodyMetric.summarizeMetric(
        points.filter((p) => p.date >= win.from && p.date <= win.to)
      )
    }
    assert.deepEqual(summaryOf('1W'), { average: 80, difference: 1 }) // 79, 81, 80
    assert.deepEqual(summaryOf('1M'), { average: 79.5, difference: 2 }) // 78, 79, 81, 80
    assert.deepEqual(summaryOf('3M'), { average: 79.5, difference: 2 })
    assert.deepEqual(summaryOf('All'), { average: 81.6, difference: -10 }) // 408 / 5 ; 80 − 90 (ÂM)
    assert.deepEqual(
      summaryOf('1W', 7),
      { average: null, difference: null },
      'kéo lùi một tuần: không có điểm → không số giả'
    )
    assert.deepEqual(
      summaryOf('1W', 4),
      { average: 79, difference: null },
      'một điểm → Average của nó, Difference null'
    )
  }
)
check(
  'Kéo biểu đồ / đổi kỳ / D-W-M không gọi lại API: một query toàn lịch sử khoá theo hôm nay, khoảng chỉ lọc ở FE',
  () => {
    const hooks = source('features/weight/hooks/use-weights.ts')
    assert.match(hooks, /history: \(to: string\) => \['weights', 'all', to\]/)
    const view = source('features/weight/components/BodyMetricPage/BodyMetricView.tsx')
    assert.doesNotMatch(view, /useQuery|refetch|invalidateQueries|useWeights|useMeasurement/)
  }
)
check(
  'kg ↔ lb và % mỡ: Average / Difference tính trên đơn vị CHUẨN (kg) như BE rồi mới đổi + làm tròn 1 chữ số; Difference giữ dấu',
  () => {
    const view = source('features/weight/components/BodyMetricPage/BodyMetricView.tsx')
    assert.match(view, /roundAway\(convert\(average\), 1\)/)
    assert.match(view, /roundAway\(convert\(difference\), 1\)/)
    assert.doesNotMatch(view, /Math\.abs/)
    const page = source('features/weight/pages/ScaleWeightPage.tsx')
    assert.match(
      page,
      /value: item\.weightKg \}/,
      'điểm gửi vào view là kg chuẩn, không làm tròn lb trước'
    )
    assert.match(page, /convert=\{weight\.convert\}/)
    const kg = bodyMetric.summarizeMetric(
      pts([
        ['2026-10-17', 79.3],
        ['2026-10-22', 78.8],
      ])
    )
    const lb = (v) => bodyMetric.roundAway(units.weightMeasure('lb').convert(v), 1)
    assert.equal(lb(kg.difference), -1.1, '−0.5 kg = −1.1 lb, giữ dấu âm')
    assert.equal(lb(kg.average), 174.3, '79.05 kg → 174.3 lb')
    const fat = bodyMetric.summarizeMetric(
      pts([
        ['2026-10-17', 26],
        ['2026-10-20', 26.5],
      ])
    )
    assert.deepEqual(fat, { average: 26.25, difference: 0.5 })
  }
)
check(
  'Left / Right và các số đo khác nhau không gộp: mỗi trang / thẻ một khoá, tóm tắt chỉ từ điểm của khoá đó',
  () => {
    const page = source('features/weight/pages/MeasurementPage.tsx')
    assert.match(page, /useMeasurement\(metric\.key, today\)/)
    const left = bodyMetric.summarizeMetric(
      pts([
        ['2026-10-20', 34],
        ['2026-10-22', 34.5],
      ])
    )
    const right = bodyMetric.summarizeMetric(pts([['2026-10-21', 33]]))
    assert.deepEqual(left, { average: 34.25, difference: 0.5 })
    assert.deepEqual(
      right,
      { average: 33, difference: null },
      'bên phải một điểm: không mượn điểm bên trái'
    )
  }
)
check(
  'Nhập lại cùng ngày (Neck 10 → 19): BE giữ một giá trị, FE hiện 19 ở chi tiết và thẻ Dashboard, không còn điểm 10',
  () => {
    const afterReentry = [{ date: '2026-10-20', valueCm: 19 }] // BE: một giá trị / số đo / ngày
    const detail = bodyMetric.summarizeMetric(
      afterReentry.map((e) => ({ date: e.date, value: e.valueCm }))
    )
    assert.deepEqual(detail, { average: 19, difference: null })
    const spark = dashboardUtils.latestByDate(afterReentry, (e) => e.date, 7).map((e) => e.valueCm)
    assert.deepEqual(spark, [19], 'thẻ chỉ có điểm 19')
    assert.ok(!spark.includes(10))
    assert.equal(entrySpark.entrySparkPoints(spark, 265, 48).length, 1)
    const tiles = source('features/dashboard/components/DashboardPage/BodyMetricTiles.tsx')
    assert.match(tiles, /trim\(metric\.latestCm\)/, 'số lớn của thẻ = latestCm của BE (19)')
    const hooks = source('features/weight/hooks/use-weights.ts')
    assert.match(hooks, /MEASUREMENT_INVALIDATE = \[measurementKeys\.all, \['body-metrics'\]\]/)
  }
)
check(
  'Macros Detail: BE trả days rỗng (chưa log ngày nào) không làm sập trang, chỉ hiện hôm nay trống',
  () => {
    const empty = { ...SERIES, days: [], buckets: [] }
    assert.equal(macrosDetail.historyDayCount(empty, '2026-10-23'), 1)
    assert.deepEqual(macrosDetail.macroBarsOf(empty, 'daily'), [])
    const first = SERIES.days[0].date
    assert.equal(macrosDetail.historyDayCount(SERIES, first), 1, 'ngày đầu = hôm nay → 1 ngày')
    const page = source('features/dashboard/pages/MacrosDetailPage.tsx')
    assert.doesNotMatch(page, /days\[0\]\.date/, 'không đọc days[0] khi chưa chắc có phần tử')
  }
)
check(
  'wizard guard: mở thẳng bước không thuộc luồng (store trống / sai kiểu program) → về luồng, không render bước lạc',
  () => {
    const none = { ...wizardAnswers, programType: null }
    assert.equal(steps.firstUnansweredBefore('editor', none), 'style')
    assert.equal(steps.firstUnansweredBefore('manual-targets', none), 'style')
    // Coached không có editor / manual-targets: về bước chưa trả lời đầu tiên của luồng Coached
    assert.equal(steps.firstUnansweredBefore('editor', wizardAnswers), 'distribute')
    assert.equal(
      steps.firstUnansweredBefore('manual-targets', { ...wizardAnswers, distribution: 'Even' }),
      'style'
    )
    assert.equal(steps.firstUnansweredBefore('style', none), null)
  }
)
check(
  '[wiring] thanh Search của Dashboard mở Add food ở tab Search VÀ focus ô tìm; mở bằng "+" thì không focus',
  () => {
    const dashboard = source('features/dashboard/pages/DashboardPage.tsx')
    assert.match(dashboard, /requestAddFood\(\{ tab: 'search', focusSearch: true \}\)/)
    const page = source('features/food-log/pages/FoodLogPage.tsx')
    assert.match(page, /setFocusSearch\(Boolean\(addRequest\.focusSearch\)\)/)
    assert.match(
      page,
      /if \(focusSearch && !addOpen\) setFocusSearch\(false\)/,
      'đóng bảng thì bỏ focus cho lần mở sau'
    )
    assert.match(page, /autoFocusSearch=\{focusSearch\}/)
    const dialog = source('features/food-log/components/FoodLogPage/AddFoodDialog.tsx')
    assert.match(dialog, /aria-label="Search for a food"\s+autoFocus=\{autoFocusSearch\}/)
    assert.match(dialog, /autoFocusSearch = false/)
  }
)
check('[wiring] chấm carousel Dashboard: vùng bấm ≥ 32px (UI.md) mà vẫn cách nhau 28px', () => {
  const carousel = source('features/dashboard/components/DashboardPage/DashboardCarousel.tsx')
  assert.match(carousel, /h-11 w-7/)
  assert.match(carousel, /before:-inset-x-0\.5/)
})
console.log(`${checks} checks passed, ${failures} failed`)
process.exit(failures === 0 ? 0 : 1)
