// Kiểm tra FE Batch 1 (audit nghiệp vụ): "hôm nay" theo múi giờ BE, làm tròn, null ≠ 0, ánh xạ API. Vector V01–V22 tính tay.
// Chạy: node --import ./scripts/register-ts.mjs scripts/check-business-logic.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as date from '../src/lib/date.ts'
import { averageBalancePoints } from '../src/features/dashboard/energy-balance.utils.ts'
import * as foods from '../src/features/foods/types/food.types.ts'
import * as plate from '../src/features/food-log/components/FoodLogPage/PlatePanel/plate-edit.utils.ts'
import * as createFood from '../src/features/food-log/create-food.utils.ts'
import { etaViewOf } from '../src/features/dashboard/goal-progress.utils.ts'
import * as entryEdit from '../src/features/food-log/entry-edit.utils.ts'
import * as provenance from '../src/features/nutrition/target-provenance.ts'
import * as overview from '../src/features/food-log/nutrition-overview.utils.ts'
import * as balance from '../src/features/dashboard/energy-balance.utils.ts'
import * as dashboardUtils from '../src/features/dashboard/dashboard.utils.ts'
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
    assert.match(checkIn, /disabled=\{isDeciding \|\| acceptBlocked\}/)
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

console.log(`${checks} checks passed, ${failures} failed`)
process.exit(failures === 0 ? 0 : 1)
