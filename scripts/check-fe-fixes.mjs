// Kiểm tra các lỗi FE đã sửa (khớp hợp đồng BE sẵn có, không đổi nghiệp vụ):
//   H1  sparkline lấy 7 lần đo MỚI NHẤT (BE trả mới → cũ), vẽ cũ → mới
//   H2  vượt mục tiêu không hiện "còn 1 kg": giữ hướng của goal, báo "đã tới" + phần quá
//   M9  thác nước Goal Progress: tuần đổi < 0.05 kg bị bỏ qua nhưng vạch nối giữa các cột vẫn khớp
//   M10 một cách đếm ngày goal cho ô Dashboard và trang Goal Progress
//   M11 Waist-to-Hip: số lớn là cặp eo / hông CÙNG NGÀY như đường nhỏ
//   H16 trục y biểu đồ nutrient không tính trần quá xa (cùng luật `ceilingDrawn` với thanh mục tiêu)
//   M1  gộp tuần / tháng giữ `goalKind`
//   M2  Logger Banner "còn lại" chưa có target → "—", không "−850 left"
//   M3  chỉ có MỘT điểm trong khung thì vẫn vẽ chấm (Expenditure / Weight Trend)
//   L4  thông báo Create Food khớp luật 105 g của BE
//   L1  mã chết đã xoá (MOCK_FLUX, hàm không ai gọi, 7700, ai-sample + nút Preview sample, useExpenditureChanges)
// Chạy: node --import ./scripts/register-ts.mjs scripts/check-fe-fixes.mjs   (hoặc `pnpm run check:fixes`)
//
// Thiết kế để FAIL trên bản cũ (HEAD) đúng lý do (hàm mới chưa có, hành vi cũ sai, mã chết còn đó). Mỗi check chạy độc lập: in lỗi rồi
// tiếp tục; có lỗi thì thoát mã 1.
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const load = (specifier) => import(specifier).catch((error) => ({ error }))
const dash = await load('../src/features/dashboard/dashboard.utils.ts')
const goalUtils = await load('../src/features/dashboard/goal-progress.utils.ts')
const nutrition = await load('../src/features/nutrition/goal-progress.ts')
const detail = await load('../src/features/nutrient-detail/nutrient-detail.utils.ts')
const settings = await load('../src/features/food-log/food-log-settings.ts')
const geometry = await load('../src/features/dashboard/chart/geometry.ts')
const createFood = await load('../src/features/food-log/create-food.utils.ts')

const urlOf = (file) => new URL(`../src/${file}`, import.meta.url)
const source = (file) => readFileSync(urlOf(file), 'utf8')
const need = (module, name) => {
  assert.ok(!module.error, `module failed to load: ${String(module.error?.message).split('\n')[0]}`)
  assert.equal(typeof module[name], 'function', `${name} is not exported`)
  return module[name]
}

let passed = 0
let failed = 0
async function check(name, fn) {
  try {
    await fn()
    passed += 1
    console.log(`ok    ${name}`)
  } catch (error) {
    failed += 1
    console.log(`FAIL  ${name}\n        ${String(error.message).split('\n')[0]}`)
  }
}
const close = (actual, expected, label, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${label}: ${actual} ≠ ${expected}`)

// ── H1: sparkline = the 7 NEWEST, oldest → newest ───────────────────────────────────────────────────────────────────────────────

// BE: newest first (2026-10-20 … 2026-10-11); the weight rises with time so a wrong slice is obvious
const newestFirst = Array.from({ length: 10 }, (_, index) => ({
  logDate: `2026-10-${String(20 - index).padStart(2, '0')}`,
  weightKg: 80 - index,
}))

await check('H1 latestByDate takes the 7 NEWEST of a newest-first list, oldest → newest', () => {
  const picked = need(dash, 'latestByDate')(newestFirst, (entry) => entry.logDate, 7)
  assert.deepEqual(
    picked.map((entry) => entry.logDate),
    [
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
      '2026-10-19',
      '2026-10-20',
    ]
  )
  assert.deepEqual(
    picked.map((entry) => entry.weightKg),
    [74, 75, 76, 77, 78, 79, 80]
  )
})
await check('H1 the old `slice(-7)` on that list returned the OLDEST entries (the bug)', () => {
  const oldWay = newestFirst.slice(-7).map((entry) => entry.logDate)
  assert.ok(oldWay.includes('2026-10-11') && !oldWay.includes('2026-10-20'), oldWay.join())
})
await check('H1 ascending input, fewer than count and empty input all behave', () => {
  const latestByDate = need(dash, 'latestByDate')
  const ascending = [...newestFirst].reverse()
  assert.deepEqual(
    latestByDate(ascending, (entry) => entry.logDate, 3).map((entry) => entry.logDate),
    ['2026-10-18', '2026-10-19', '2026-10-20']
  )
  assert.equal(latestByDate(newestFirst, (entry) => entry.logDate, 99).length, 10)
  assert.deepEqual(
    latestByDate([], (entry) => entry.logDate, 7),
    []
  )
})
await check(
  'H1 [wiring] the dashboard hook reads the newest entries for scale, trend / raw and body fat',
  () => {
    const hook = source('features/dashboard/hooks/use-dashboard-data.ts')
    assert.equal((hook.match(/latestByDate\(/g) ?? []).length, 3, 'scale, spark and body fat')
    assert.ok(!/entries\.slice\(-/.test(hook), 'no raw slice(-n) on the BE list')
    assert.ok(!/items \?\? \[\]\)\s*\.slice\(-/.test(hook), 'no raw slice(-n) on body fat')
  }
)

// ── H2 / M9: Goal Progress waterfall ────────────────────────────────────────────────────────────────────────────────────────────

const weigh = (logDate, weightKg) => ({
  id: logDate,
  logDate,
  weightKg,
  trendWeightKg: weightKg,
  notes: null,
  bodyFatPercent: null,
})
// `weight` (đơn vị của user) là bắt buộc, không có mặc định kg ngầm: các check này nói chuyện bằng kg
const unitsModule = await load('../src/lib/units.ts')
const KG = unitsModule.error ? null : unitsModule.weightMeasure('kg')
const waterfall = (input) =>
  need(goalUtils, 'buildWaterfall')({ tab: 'scale', weight: KG, ...input })
const lose = { startKg: 80, targetKg: 70, startDate: '2026-09-01', today: '2026-09-08' }

await check(
  'H2 overshooting a LOSS target is "reached" with the part past it, never "1 kg to lose"',
  () => {
    const result = waterfall({ ...lose, entries: [weigh('2026-09-05', 69)] })
    assert.equal(result.reached, true, 'reached')
    assert.equal(result.distance, 0)
    close(result.pastKg, 1, 'pastKg')
    const status = result.bars[result.bars.length - 1]
    assert.match(status.tip, /goal reached/i)
    assert.ok(!/to lose/.test(status.tip), status.tip)
  }
)
await check('H2 overshooting a GAIN target is also reached', () => {
  const result = waterfall({
    startKg: 60,
    targetKg: 70,
    startDate: '2026-09-01',
    today: '2026-09-08',
    entries: [weigh('2026-09-05', 71)],
  })
  assert.equal(result.reached, true)
  assert.equal(result.distance, 0)
  close(result.pastKg, 1, 'pastKg')
})
await check('H2 not yet at the target keeps "N kg to go" and is not reached', () => {
  const result = waterfall({ ...lose, entries: [weigh('2026-09-05', 72)] })
  assert.equal(result.reached, false)
  close(result.distance, 2, 'distance')
  assert.equal(result.pastKg, 0)
  assert.match(result.bars[result.bars.length - 1].tip, /2 kg to lose/)
})
await check(
  'H2 passing the target and drifting back is toward then away (the overshoot is not lost)',
  () => {
    const result = waterfall({
      ...lose,
      today: '2026-09-15',
      entries: [weigh('2026-09-05', 69), weigh('2026-09-12', 71)],
    })
    assert.deepEqual(
      result.bars.map((bar) => bar.kind),
      ['start', 'toward', 'away', 'status']
    )
    const [, toward, away] = result.bars
    assert.deepEqual([toward.low, toward.high], [0, 10], 'down to the target')
    assert.deepEqual([away.low, away.high], [0, 1], 'then 1 kg away again')
    close(result.distance, 1, 'distance')
    assert.equal(result.reached, false)
  }
)

// Một cột bắt đầu / kết thúc ở mức nào: toward đi từ cao xuống thấp, away từ thấp lên cao, status bắt đầu ở đỉnh của nó
const startLevel = (bar) => (bar.kind === 'away' ? bar.low : bar.high)
const endLevel = (bar) => (bar.kind === 'toward' ? bar.low : bar.high)
await check('M9 weeks that change < 0.05 kg add no bar but the connectors still meet', () => {
  const result = waterfall({
    startKg: 80,
    targetKg: 70,
    startDate: '2026-09-01',
    today: '2026-09-29',
    entries: [
      weigh('2026-09-03', 79.0), // 9.00 left: −1.00 → bar
      weigh('2026-09-10', 78.97), // 8.97 left: −0.03 → skipped
      weigh('2026-09-17', 78.0), // 8.00 left: bar from the LAST DRAWN level
      weigh('2026-09-24', 77.98), // 7.98 left: −0.02 → skipped
    ],
  })
  assert.deepEqual(
    result.bars.map((bar) => bar.label),
    ['Day 0', 'Wk 1', 'Wk 3', 'Status']
  )
  for (let index = 0; index < result.bars.length - 1; index += 1)
    close(
      endLevel(result.bars[index]),
      startLevel(result.bars[index + 1]),
      `${result.bars[index].label} → ${result.bars[index + 1].label} connector`
    )
  close(result.distance, 7.98, 'the real distance is still reported')
})

await check(
  'M10 goalDuration counts the start day and today (one rule for the tile and the page)',
  () => {
    const duration = need(goalUtils, 'goalDuration')
    assert.equal(duration('2026-10-14', '2026-10-21'), 8)
    assert.equal(duration('2026-10-21', '2026-10-21'), 1)
    assert.equal(duration('2026-10-22', '2026-10-21'), 0, 'not started yet')
  }
)
await check('M10 [wiring] the tile and the page share goalDuration; no second copy', () => {
  const tiles = source('features/dashboard/components/DashboardPage/DashboardTiles.tsx')
  assert.match(tiles, /goalDuration\(data\.startDate, today\)/)
  assert.ok(!/MS_PER_DAY/.test(tiles), 'tile must not recompute days itself')
  const page = source('features/dashboard/hooks/use-goal-progress-detail.ts')
  assert.match(page, /goalDuration\(data\.startDate, today\)/)
  assert.ok(!/goalDays|MS_PER_DAY/.test(source('features/dashboard/hooks/use-dashboard-data.ts')))
})

// ── M11: Waist-to-Hip uses same-date pairs ──────────────────────────────────────────────────────────────────────────────────────

await check(
  'M11 Waist to Hip: the big number is the latest SAME-DATE pair (not latest waist / latest hips)',
  () => {
    const waist = [
      { date: '2026-10-20', valueCm: 90 },
      { date: '2026-10-13', valueCm: 91 },
    ]
    const hips = [
      { date: '2026-10-19', valueCm: 100 },
      { date: '2026-10-13', valueCm: 105 },
    ]
    const ratios = need(dash, 'bodyRatios')('waistToHip', waist, hips, null)
    assert.deepEqual(
      ratios.map((point) => point.date),
      ['2026-10-13']
    )
    close(ratios[0].ratio, 91 / 105, 'ratio of the same day')
    assert.notEqual(
      ratios[0].ratio.toFixed(2),
      (90 / 100).toFixed(2),
      'not latest waist / latest hips'
    )
  }
)
await check(
  'M11 Waist to Height divides each waist by the profile height; no height → nothing',
  () => {
    const bodyRatios = need(dash, 'bodyRatios')
    const waist = [
      { date: '2026-10-20', valueCm: 90 },
      { date: '2026-10-13', valueCm: 88 },
    ]
    const ratios = bodyRatios('waistToHeight', waist, [], 180)
    close(ratios[0].ratio, 0.5, 'newest first')
    close(ratios[1].ratio, 88 / 180, 'older')
    assert.deepEqual(bodyRatios('waistToHeight', waist, [], null), [])
  }
)
await check(
  'M11 [wiring] the tile reads its big number from the same list as the sparkline',
  () => {
    const tiles = source('features/dashboard/components/DashboardPage/BodyMetricTiles.tsx')
    assert.match(tiles, /const latest = ratios\[0\]\?\.ratio \?\? null/)
    assert.ok(
      !/latestDivisor|hips\?\.latestCm/.test(tiles),
      'no more latest-waist / latest-hips division'
    )
  }
)

// ── H16 / M1: nutrient history chart ────────────────────────────────────────────────────────────────────────────────────────────

const goal = (floor, target, ceiling, goalKind) => ({ floor, target, ceiling, goalKind })

await check(
  'H16 the chart axis leaves a FAR ceiling out (vitamin C 90 / 2000) but keeps a near one',
  () => {
    const axisTop = need(nutrition, 'goalAxisTop')
    assert.equal(axisTop(goal(null, 90, 2000, 'TargetWithCeiling')), 90, 'far ceiling is text only')
    assert.equal(
      axisTop(goal(null, 1500, 2300, 'TargetWithCeiling')),
      2300,
      'near ceiling is drawn'
    )
    assert.equal(axisTop(goal(null, null, 22, 'Maximum')), 22, 'a lone limit is drawn')
    assert.equal(axisTop(goal(60, 100, 145, 'Range')), 145)
    assert.equal(axisTop(goal(5, 10, 20, 'None')), 0)
    assert.equal(axisTop(null), 0)
  }
)
await check('H16 so a 60 mg day on a 90 / 2000 goal is not squashed under a 2000 axis', () => {
  const niceAxis = need(goalUtils, 'niceAxis')
  const top = Math.max(
    60,
    need(nutrition, 'goalAxisTop')(goal(null, 90, 2000, 'TargetWithCeiling'))
  )
  assert.ok(niceAxis(top).max <= 100, `axis max ${niceAxis(top).max}`)
  assert.equal(niceAxis(2000).max, 2000, 'the old axis (ceiling included)')
})
await check('H16 [wiring] NutrientChart uses goalAxisTop and shows the limit as text', () => {
  const chart = source('features/nutrient-detail/components/NutrientChart.tsx')
  assert.match(chart, /goalAxisTop\(day\)/)
  assert.ok(!/goal\.ceiling \?\? 0/.test(chart), 'the far ceiling must not feed the axis')
  assert.match(chart, /Limit \{formatAmount\(selectedGoal\.ceiling/)
})

await check(
  'M1 weekly / monthly averaging keeps goalKind (and still averages logged days only)',
  () => {
    const averageNutrientDays = need(detail, 'averageNutrientDays')
    const days = [
      {
        date: '2026-10-05',
        amount: 10,
        floor: null,
        target: null,
        ceiling: 22,
        goalKind: 'Maximum',
      },
      {
        date: '2026-10-06',
        amount: null,
        floor: null,
        target: null,
        ceiling: 22,
        goalKind: 'Maximum',
      },
      {
        date: '2026-10-07',
        amount: 20,
        floor: null,
        target: null,
        ceiling: 22,
        goalKind: 'Maximum',
      },
    ]
    for (const averaging of ['weekly', 'monthly']) {
      const [point] = averageNutrientDays(days, averaging, 'Monday')
      assert.equal(point.goalKind, 'Maximum', `${averaging} keeps goalKind`)
      assert.equal(point.amount, 15, `${averaging} amount`)
      assert.equal(point.ceiling, 22)
    }
    assert.equal(averageNutrientDays(days, 'daily', 'Monday')[0].goalKind, 'Maximum')
  }
)

// ── M2: Logger Banner ───────────────────────────────────────────────────────────────────────────────────────────────────────────

await check('M2 "remaining after plate" without a target is null ("—"), never −850', () => {
  const bannerValue = need(settings, 'bannerValue')
  assert.equal(bannerValue('RemainingAfterPlate', undefined, 850, 0), null)
  assert.equal(bannerValue('RemainingAfterPlate', null, 850, 0), null)
  assert.equal(bannerValue('RemainingAfterPlate', 0, 850, 0), null, 'target 0 = no target')
  assert.equal(bannerValue('RemainingAfterPlate', 2000, 850, 100), 1050)
  assert.equal(bannerValue('PlateOnly', undefined, 850, 120.4), 120)
  assert.equal(bannerValue('AllDayAndPlate', undefined, 850, 120.4), 970)
})
await check('M2 [wiring] the banner renders "—" for a missing target and draws no bar', () => {
  const banner = source('features/food-log/components/FoodLogPage/AddFoodProgress.tsx')
  assert.match(banner, /bannerValue\(\s*display,\s*cell\.goal/)
  assert.match(banner, /value === null\s*\?\s*'—'/)
  assert.ok(!/\(cell\.goal \?\? 0\) - day/.test(banner), 'the "goal ?? 0" shortcut must be gone')
})

// ── M3: a single point is still drawn ───────────────────────────────────────────────────────────────────────────────────────────

await check(
  'M3 showMarkers: short periods yes, long periods only when ONE point is in view',
  () => {
    const showMarkers = need(geometry, 'showMarkers')
    assert.equal(showMarkers(30, 1), true, 'one averaged point on a long period')
    assert.equal(showMarkers(30, 2), false)
    assert.equal(showMarkers(14.5, 14), true)
    assert.equal(showMarkers(14.6, 3), false)
    assert.equal(showMarkers(365, 0), false)
  }
)
await check('M3 [wiring] both charts use showMarkers and no longer keep their own cut-off', () => {
  const expenditure = source('features/dashboard/components/ExpenditurePage/ExpenditureChart.tsx')
  const weight = source('features/dashboard/components/WeightTrendPage/WeightTrendChart.tsx')
  assert.match(expenditure, /showMarkers\(slots, shown\.length\)/)
  assert.match(weight, /showMarkers\(slots, trendShown\.length\)/)
  for (const text of [expenditure, weight]) assert.ok(!/const MARKER_MODE_MAX/.test(text))
})

// ── L4: Create Food message matches the 105 g rule ──────────────────────────────────────────────────────────────────────────────

const foodState = (values) => ({
  name: 'Test food',
  brand: '',
  barcode: '',
  iconKey: null,
  category: 'Other',
  basis: '100g',
  weight: '',
  weightUnit: 'g',
  servingQty: '1',
  servingName: '',
  mode: 'Basic',
  values,
  units: {},
})
await check('L4 over the macro sum the message states the real limit (105 g), not 100 g', () => {
  const over = need(
    createFood,
    'buildRequest'
  )(foodState({ calories: '600', protein: '40', carbs: '40', fat: '26' }))
  assert.ok(over.errors, '106 g per 100 g must be rejected')
  assert.match(over.errors.fat, /105 g/)
  assert.ok(!/exceed 100 g/.test(over.errors.fat), over.errors.fat)
})
await check('L4 exactly 105 g per 100 g is still accepted (the rule the message describes)', () => {
  const ok = need(
    createFood,
    'buildRequest'
  )(foodState({ calories: '600', protein: '40', carbs: '40', fat: '25' }))
  assert.ok(ok.request && !ok.errors, JSON.stringify(ok.errors))
})

// ── L1: dead code is gone ───────────────────────────────────────────────────────────────────────────────────────────────────────

await check(
  'L1 expenditure.utils / weight-trend.utils keep only what is imported (no MOCK_FLUX, no 7700)',
  () => {
    const expenditure = source('features/dashboard/expenditure.utils.ts')
    const weight = source('features/dashboard/weight-trend.utils.ts')
    for (const dead of [
      'MOCK_FLUX',
      'mockSpread',
      'toChartPoints',
      'windowOf',
      'averagePoints',
      'yScale',
      'changeOver',
      'FETCH_DAYS',
    ])
      assert.ok(!expenditure.includes(dead), `expenditure.utils still has ${dead}`)
    for (const dead of [
      'KCAL_PER_KG',
      '7700',
      'weeklyRate',
      'dailyEnergyKcal',
      'projectWeight',
      'toWeightPoints',
    ])
      assert.ok(!weight.includes(dead), `weight-trend.utils still has ${dead}`)
    for (const kept of ['export const CHANGE_DAYS', 'export const rangeLabel'])
      assert.ok(expenditure.includes(kept), `expenditure.utils lost ${kept}`)
    assert.ok(weight.includes('export const moveOf') && weight.includes('WEIGHT_CHANGE_DAYS'))
  }
)
await check('L1 the AI sample data and its dev "Preview sample" path are gone', () => {
  assert.ok(
    !existsSync(urlOf('features/food-log/components/FoodLogPage/ai-sample.ts')),
    'ai-sample.ts exists'
  )
  const hook = source('features/food-log/hooks/use-food-log.ts')
  assert.ok(!/previewSample|SAMPLE_AI_PLATE|SAMPLE_DELAY_MS|clearTimers/.test(hook))
  const panel = source('features/food-log/components/FoodLogPage/AiPanel.tsx')
  assert.ok(!/onPreviewSample|Preview sample/.test(panel))
  assert.ok(
    !/previewSample|onPreviewSample/.test(source('features/food-log/pages/FoodLogPage.tsx'))
  )
})
await check('L1 useExpenditureChanges and its service / type / route are gone', () => {
  assert.ok(!/useExpenditureChanges/.test(source('features/dashboard/hooks/use-dashboard.ts')))
  const service = source('features/dashboard/services/dashboard.service.ts')
  assert.ok(!/expenditureChanges|ExpenditureChange\b/.test(service))
  assert.ok(
    !/interface ExpenditureChange\b/.test(source('features/dashboard/types/dashboard.types.ts'))
  )
  assert.ok(!/expenditure\/changes/.test(source('config/api-routes.ts')))
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
