// Kiểm tra D14 (đơn vị + ngày đầu tuần) và Contract audit (FE khớp hợp đồng BE, không đổi nghiệp vụ):
//   G   goalKind của BE được giữ nguyên ở mọi nơi vẽ thanh (FE không đoán loại mục tiêu từ các con số)
//   U   MỘT mô-đun đơn vị: lb/kg đúng hằng số, đổi ngược không làm tròn trước khi gửi (cân 100.0–400.0 lb về đúng số cũ), kcal/kJ ×4.184
//   W   ngày đầu tuần của user cho MỌI dải tuần / bucket tuần (thanh tuần, lịch, lưới Weekly Nutrition, Habits, biểu đồ D/W/M), bucket FE
//       trùng `MetricSeries.BucketStart` của BE với đủ bảy ngày đầu tuần
//   C1  Goal Progress đọc `weeks` của BE, không tự tính % khi BE đã có
//   C3  lý do Holding bằng tiếng Anh dựng từ mã (câu của BE là tiếng Việt)
//   C4  ô Macros "Last 7 Days" theo 7 ngày LỊCH
//   C5  kiểu dữ liệu khớp BE: trường BE luôn gửi không còn `?` và không còn nhánh dự phòng chết
//   C6  Habits Weigh-In đọc `GET /weights/habit` (streak toàn thời gian)
//   C7  Sparkline không phóng đại dao động nhỏ (thang tối thiểu như TrendMini)
//   B4  phản hồi BE có đủ SÁU loại goal (MuscleGain / Endurance / Flexibility cũng có nhãn, không `undefined`), dấu tốc độ đọc từ số BE gửi chứ không suy từ
//       loại goal, `calorieShiftMode` đủ ba giá trị, không còn trường `isFastingDay` BE không trả; picker vẫn chỉ ba lựa chọn
//   R   MỘT quy tắc "Remaining / left" cho mọi màn (Daily + Weekly Nutrition, Food Log, banner, ô nutrient): làm tròn đã ăn và mục tiêu ở đơn vị
//       đang hiện TRƯỚC rồi mới trừ, nên cùng một ngày không bao giờ ra hai đáp án (2796 vs 2797 kcal) và Consumed + Remaining = Target
//   F   review độc lập (F1–F13): ghi / xoá cân làm mới mọi số suy từ cân, kJ có đơn vị ở câu giải thích macro, Quick Add theo đơn vị hồ sơ và đi qua
//       `lib/units`, Atwater 4/4/9 và nhãn một chữ cái của ngày mỗi thứ MỘT nguồn, một hàm tính ngày đầu tuần, một quy tắc "gửi lại kg đã lưu", mã chết
//   M   mọi mutation làm mới đúng dữ liệu BE suy ra từ nó (Full Body → Body Fat / số đo, món tự tạo → Library / Favorites, hồ sơ, onboarding, target →
//       Food Detail), cache bị xoá khi đăng nhập / đăng xuất, và một check tĩnh bắt mutation mới quên làm mới cache
// Chạy: node --import ./scripts/register-ts.mjs scripts/check-contract.mjs   (hoặc `pnpm run check:contract`)
//
// Thiết kế để FAIL trên bản cũ (HEAD) đúng lý do (mô-đun / hàm mới chưa có, hành vi cũ sai, kiểu cũ còn `?`). Component .tsx không chạy được trong
// Node nên phần "wiring" đọc mã nguồn để chắc các hàm thuần được NỐI vào màn hình. Mỗi check chạy độc lập: in lỗi rồi tiếp tục; có lỗi thì thoát mã 1.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const load = (specifier) => import(specifier).catch((error) => ({ error }))
const units = await load('../src/lib/units.ts')
const week = await load('../src/lib/week.ts')
const goal = await load('../src/features/nutrition/goal-progress.ts')
const expUtils = await load('../src/features/dashboard/expenditure.utils.ts')
const expSeries = await load('../src/features/dashboard/expenditure-series.ts')
const trendSeries = await load('../src/features/dashboard/weight-trend-series.ts')
const stepsUtils = await load('../src/features/steps/steps.utils.ts')
const metricUtils = await load('../src/features/weight/body-metric.utils.ts')
const nutrientUtils = await load('../src/features/nutrient-detail/nutrient-detail.utils.ts')
const habitsUtils = await load('../src/features/habits/habits.utils.ts')
const weightSchema = await load('../src/features/weight/schemas/body-metric.schema.ts')
const goalUtils = await load('../src/features/dashboard/goal-progress.utils.ts')
const enums = await load('../src/config/enums.ts')
const goalDisplay = await load('../src/features/program/utils/goal-display.ts')
const remaining = await load('../src/features/nutrition/remaining.ts')
const dashboardUtils = await load('../src/features/dashboard/dashboard.utils.ts')
const atwater = await load('../src/features/nutrition/atwater.ts')
const reviewCopy = await load('../src/features/program/utils/review-copy.ts')
const energyBalance = await load('../src/features/dashboard/energy-balance.utils.ts')
const foodHooks = await load('../src/features/foods/hooks/use-foods.ts')
const bodyHooks = await load('../src/features/shortcuts/hooks/use-body-metrics.ts')
const profileHooks = await load('../src/features/users/hooks/use-profile.ts')
const onboardingHooks = await load('../src/features/onboarding/hooks/use-onboarding.ts')
const foodLogHooks = await load('../src/features/food-log/hooks/use-food-log.ts')
const fullBodyUtils = await load('../src/features/full-body/full-body.utils.ts')
const photoUtils = await load('../src/features/progress-photos/progress-photos.utils.ts')
const checkInUtils = await load('../src/features/program/utils/check-in.utils.ts')
const calorieShift = await load('../src/features/program/utils/calorie-shift.ts')

const SRC = fileURLToPath(new URL('../src', import.meta.url))
const source = (file) => readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const file = `${dir}/${name}`
    if (statSync(file).isDirectory()) return walk(file)
    return /\.(ts|tsx)$/.test(name) ? [file] : []
  })
const allSources = () =>
  walk(SRC).map((file) => [
    file.slice(SRC.length + 1).replaceAll('\\', '/'),
    readFileSync(file, 'utf8'),
  ])
const need = (module, name) => {
  assert.ok(!module.error, `module failed to load: ${String(module.error?.message).split('\n')[0]}`)
  assert.equal(typeof module[name], 'function', `${name} is not exported`)
  return module[name]
}
const constant = (module, name) => {
  assert.ok(!module.error, `module failed to load: ${String(module.error?.message).split('\n')[0]}`)
  assert.ok(name in module, `${name} is not exported`)
  return module[name]
}
/** Thân của `interface NAME { ... }` trong file kiểu. */
const interfaceOf = (text, name) => {
  const start = text.indexOf(`interface ${name} `)
  assert.ok(start >= 0, `interface ${name} is not declared`)
  return text.slice(start, text.indexOf('\n}', start))
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

// ── Chuẩn tham chiếu của BE (`MetricSeries.BucketStart`) viết lại độc lập bằng UTC ────────────────────────────────────────────────

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MS_DAY = 864e5
const toMs = (iso) => {
  const [year, month, day] = iso.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}
const toIso = (ms) => new Date(ms).toISOString().slice(0, 10)
const dayName = (iso) => DAYS[new Date(toMs(iso)).getUTCDay()]
const beWeekStart = (iso, start) =>
  toIso(toMs(iso) - ((new Date(toMs(iso)).getUTCDay() - DAYS.indexOf(start) + 7) % 7) * MS_DAY)
const beMonthStart = (iso) => `${iso.slice(0, 7)}-01`
const range = (from, count) =>
  Array.from({ length: count }, (_, index) => toIso(toMs(from) + index * MS_DAY))
const close = (actual, expected, label) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: ${actual} ≠ ${expected}`)
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length

// ── G: goalKind ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────

await check('G goalOfModel passes the four BE fields through (one mapping for every bar)', () => {
  const goalOfModel = need(goal, 'goalOfModel')
  const model = { floor: 10, target: 20, ceiling: 30, goalKind: 'TargetWithCeiling', extra: 'x' }
  assert.deepEqual(goalOfModel(model), {
    floor: 10,
    target: 20,
    ceiling: 30,
    goalKind: 'TargetWithCeiling',
  })
})
await check(
  'G goalKind alone decides which marks are drawn: no Range fallback, no kind guessed from the numbers',
  () => {
    const normalizeGoal = need(goal, 'normalizeGoal')
    const kept = (goalKind) => {
      const g = normalizeGoal({ floor: 10, target: 20, ceiling: 30, goalKind })
      return [g.floor, g.target, g.ceiling]
    }
    assert.deepEqual(kept('Range'), [10, 20, 30])
    assert.deepEqual(kept('Minimum'), [10, 20, null])
    assert.deepEqual(kept('Maximum'), [null, null, 30])
    assert.deepEqual(kept('Target'), [null, 20, null])
    assert.deepEqual(kept('TargetWithCeiling'), [null, 20, 30])
    assert.deepEqual(kept('None'), [null, null, null])
    const loneCeiling = normalizeGoal({ floor: null, target: null, ceiling: 22, goalKind: 'Range' })
    assert.equal(loneCeiling.goalKind, 'Range', 'a lone ceiling is not inferred as Maximum')
    assert.equal(loneCeiling.ceiling, 22)
    assert.equal(constant(goal, 'NO_GOAL').goalKind, 'None')
    assert.deepEqual(
      normalizeGoal(null),
      constant(goal, 'NO_GOAL'),
      'no goal is NO_GOAL, not Range'
    )
    assert.deepEqual(normalizeGoal(undefined), constant(goal, 'NO_GOAL'))
    assert.ok(
      !/\?\?\s*'Range'/.test(source('features/nutrition/goal-progress.ts')),
      "the `?? 'Range'` fallback is back"
    )
    assert.deepEqual(
      allSources()
        .filter(([, text]) => /Partial<NutrientGoal>/.test(text))
        .map(([file]) => file),
      [],
      'a goal without goalKind can still be passed'
    )
  }
)
await check('G every nutrient model type requires goalKind (BE always sends it)', () => {
  for (const file of [
    'features/dashboard/types/dashboard.types.ts',
    'features/food-log/types/food-log.types.ts',
    'features/foods/types/food.types.ts',
  ]) {
    const text = source(file)
    assert.ok(/goalKind: GoalKind/.test(text), `${file}: goalKind: GoalKind`)
    assert.ok(!/goalKind\?/.test(text), `${file}: goalKind must not be optional`)
  }
  // BE trả loại mục tiêu ở cấp chuỗi / ngày chi tiết (bắt buộc); `NutrientSeriesDay.goalKind` là trường FE tự điền từ cấp chuỗi nên có thể thiếu
  const detail = source('features/nutrient-detail/types/nutrient-detail.types.ts')
  for (const name of ['NutrientSeriesResponse', 'NutrientDayResponse'])
    assert.ok(interfaceOf(detail, name).includes('goalKind: GoalKind'), `${name}.goalKind`)
})
await check(
  'G food detail, overview and Dashboard read goals through goalOfModel / BE goalKind',
  () => {
    assert.match(
      source('features/food-log/components/FoodLogPage/FoodDetail/food-detail.utils.ts'),
      /goalOfModel\(/
    )
    assert.match(source('features/food-log/nutrition-overview.utils.ts'), /goalOfModel\(/)
    assert.match(
      source('features/dashboard/hooks/use-dashboard-data.ts'),
      /goalKind: item\.goalKind/
    )
  }
)

// ── U: đơn vị ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

await check('U one lb/kg constant (2.20462262) for the whole app', () => {
  assert.equal(constant(units, 'LB_PER_KG'), 2.20462262)
  const stray = allSources().filter(
    ([file, text]) => file !== 'lib/units.ts' && /2\.20462(?!262)|2\.2046226(?!2)/.test(text)
  )
  assert.deepEqual(
    stray.map(([file]) => file),
    [],
    'another lb/kg factor is hard-coded'
  )
})
await check(
  'U weight round-trip: every 0.1 lb from 100.0 to 400.0 comes back as the same value',
  () => {
    const toApiKg = need(units, 'toApiKg')
    const weightMeasure = need(units, 'weightMeasure')
    const lb = weightMeasure('lb')
    for (let tenths = 1000; tenths <= 4000; tenths += 1) {
      const typed = tenths / 10
      const sent = toApiKg(typed, 'lb')
      assert.equal(
        lb.format(sent),
        typed.toFixed(1),
        `${typed} lb → ${sent} kg → ${lb.format(sent)} lb`
      )
    }
  }
)
await check('U kg sent to BE has 2 decimals and is never rounded before converting', () => {
  const toApiKg = need(units, 'toApiKg')
  assert.equal(toApiKg(150, 'lb'), 68.04)
  assert.equal(toApiKg(70.5, 'kg'), 70.5)
  assert.equal(toApiKg(173.2, 'lb'), 78.56)
  for (const typed of [199.9, 123.4, 321.7])
    assert.ok(String(toApiKg(typed, 'lb')).split('.')[1].length <= 2, `${typed} lb`)
})
await check('U lb input limits map back inside the BE range (20–400 kg)', () => {
  const weightLimits = need(weightSchema, 'weightLimits')
  const toApiKg = need(units, 'toApiKg')
  const { min, max } = weightLimits('lb')
  assert.ok(toApiKg(min, 'lb') >= 20, `${min} lb → ${toApiKg(min, 'lb')} kg`)
  assert.ok(toApiKg(max, 'lb') <= 400, `${max} lb → ${toApiKg(max, 'lb')} kg`)
  assert.deepEqual(weightLimits('kg'), { min: 20, max: 400 })
})
await check(
  'U energy: kJ = kcal × 4.184 for display, whole kcal sent back, display kJ round-trips',
  () => {
    const energyMeasure = need(units, 'energyMeasure')
    const toApiKcal = need(units, 'toApiKcal')
    const kj = energyMeasure('kJ')
    close(kj.convert(1000), 4184, 'convert')
    assert.equal(kj.format(2000), '8368')
    assert.equal(toApiKcal(4184, 'kJ'), 1000)
    assert.equal(energyMeasure('kcal').format(2000.4), '2000')
    for (let kcal = 1; kcal <= 6000; kcal += 1)
      assert.equal(toApiKcal(Math.round(kj.convert(kcal)), 'kJ'), kcal, `${kcal} kcal`)
  }
)
await check('U unitsOf: BE defaults while the profile loads, the user choices afterwards', () => {
  const unitsOf = need(units, 'unitsOf')
  assert.deepEqual(unitsOf(undefined), { weight: 'kg', energy: 'kcal', weekStartDay: 'Monday' })
  assert.deepEqual(
    unitsOf({ unitPreference: 'Imperial', energyUnit: 'Kj', weekStartDay: 'Sunday' }),
    { weight: 'lb', energy: 'kJ', weekStartDay: 'Sunday' }
  )
})
await check(
  'U [wiring] Profile lets the user choose weight unit, energy unit and week start (dirty fields only)',
  () => {
    const form = source('features/users/components/ProfilePage/ProfileForm.tsx')
    for (const row of ["'unitPreference'", "'energyUnit'", "'weekStartDay'"])
      assert.ok(form.includes(row), `ProfileForm row ${row}`)
    const payload = source('features/users/profile.utils.ts')
    for (const line of ['dirty.unitPreference', 'dirty.energyUnit', 'dirty.weekStartDay'])
      assert.ok(payload.includes(line), `payload ${line}`)
    assert.match(source('features/users/hooks/use-units.ts'), /useProfile\(\)/)
  }
)

await check(
  'U2 the unit parameter is required wherever a number is shown: forgetting it throws instead of silently printing kg / kcal',
  () => {
    const lb = need(units, 'weightMeasure')('lb')
    assert.equal(need(fullBodyUtils, 'formatMetric')(79.3, 'kg', lb), '174.8 lb')
    assert.throws(() => need(fullBodyUtils, 'formatMetric')(79.3, 'kg'), TypeError, 'formatMetric')
    assert.throws(() => need(photoUtils, 'kgLabel')(79.3), TypeError, 'kgLabel')
    assert.throws(
      () =>
        need(
          checkInUtils,
          'reasonSentences'
        )({
          reasonCodes: ['FASTER_THAN_TARGET'],
          reasonParams: { daysMarkedIncomplete: 0, weightChangeKg: 0.4 },
        }),
      TypeError,
      'reasonSentences'
    )
    assert.throws(
      () =>
        need(
          reviewCopy,
          'reviewCopyOf'
        )({
          programType: 'Manual',
          tdeeKcal: 2400,
          averageKcal: 2000,
          weeklyBudgetKcal: 14000,
          weeklyChangePercent: -0.5,
          macroKcalAverage: 1980,
        }),
      TypeError,
      'reviewCopyOf'
    )
    const problem = {
      violations: [{ day: 'Saturday', code: 'CARBS_BELOW_ZERO', calories: 1350, carbsG: -9 }],
      floorKcal: 1000,
      percent: 20,
      days: ['Monday'],
      options: [],
    }
    assert.throws(() => need(calorieShift, 'issuesByDay')(problem), TypeError, 'issuesByDay')
    // shiftFixesOf không còn hiện số năng lượng nào (nhãn chỉ có %, không có sàn kcal) nên không cần đơn vị
    assert.throws(
      () =>
        need(
          goalUtils,
          'buildWaterfall'
        )({
          startKg: 90,
          targetKg: 80,
          startDate: '2026-09-01',
          today: '2026-09-08',
          entries: [],
          tab: 'scale',
        }),
      TypeError,
      'buildWaterfall'
    )
    assert.deepEqual(
      allSources()
        .filter(([, text]) =>
          /Measure<\w+>\s*=\s*(?:weight|energy)Measure\(|(?<!const |let )\b(?:weight|energy)\s*=\s*(?:weight|energy)Measure\(/.test(
            text
          )
        )
        .map(([file]) => file),
      [],
      'a parameter still defaults to kg / kcal'
    )
  }
)

// ── W: ngày đầu tuần ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

await check('W weekStartOf = BE BucketStart(Week) for all 7 start days over 800 days', () => {
  const weekStartOf = need(week, 'weekStartOf')
  for (const start of DAYS)
    for (const date of range('2025-01-01', 800))
      assert.equal(weekStartOf(date, start), beWeekStart(date, start), `${date} / ${start}`)
  assert.equal(weekStartOf('2026-10-21', 'Sunday'), '2026-10-18')
  assert.equal(weekStartOf('2026-10-21', 'Monday'), '2026-10-19')
  assert.equal(weekStartOf('2026-10-21', 'Wednesday'), '2026-10-21')
  assert.equal(weekStartOf('2026-10-21', 'Thursday'), '2026-10-15')
})
await check('W weekDates / weekdayIndex follow the start day', () => {
  const weekDates = need(week, 'weekDates')
  const weekdayIndex = need(week, 'weekdayIndex')
  const weekStartOf = need(week, 'weekStartOf')
  for (const [index, start] of DAYS.entries()) {
    const days = Array.from({ length: 7 }, (_, offset) => DAYS[(index + offset) % 7])
    for (const date of range('2026-09-27', 21)) {
      const dates = weekDates(weekStartOf(date, start))
      assert.equal(dates[weekdayIndex(date, start)], date, `${date} / ${start}`)
      assert.deepEqual(dates.map(dayName), days)
    }
  }
})
await check(
  'W GET /food-logs/week returns Mon–Sun blocks: every start day is covered by the blocks asked for',
  () => {
    const weekBlocksOf = need(week, 'weekBlocksOf')
    const weekStartOf = need(week, 'weekStartOf')
    const weekDates = need(week, 'weekDates')
    for (const start of DAYS)
      for (const date of range('2026-01-01', 60)) {
        const weekStart = weekStartOf(date, start)
        const blocks = weekBlocksOf([weekStart])
        assert.equal(blocks.length, start === 'Monday' ? 1 : 2, `${weekStart} / ${start}`)
        for (const day of weekDates(weekStart))
          assert.ok(
            blocks.some(
              (block) =>
                dayName(block) === 'Monday' &&
                day >= block &&
                day <= toIso(toMs(block) + 6 * MS_DAY)
            ),
            `${day} not inside the blocks of the ${start} week starting ${weekStart}`
          )
      }
  }
)
await check('W month grid and year heatmap start every row / column on the start day', () => {
  const monthGrid = need(habitsUtils, 'monthGrid')
  const yearHeatmap = need(habitsUtils, 'yearHeatmap')
  for (const start of DAYS) {
    const grid = monthGrid(2026, 9, start)
    assert.equal(grid.length, 42)
    for (let row = 0; row < 6; row += 1)
      assert.equal(dayName(grid[row * 7].iso), start, `${start} row ${row}`)
    assert.equal(grid.filter((cell) => cell.inMonth).length, 31)
    for (const column of yearHeatmap(2026, start).weeks)
      column.days.forEach((iso, row) => {
        if (iso !== null)
          assert.equal(dayName(iso), DAYS[(DAYS.indexOf(start) + row) % 7], `${start} ${iso}`)
      })
  }
})

/** Chuỗi ngày liên tục có giá trị tăng dần, đi qua nhiều tuần và hai tháng. */
const SERIES = range('2026-09-24', 28)
const valueOf = (index) => 70 + index * 0.37
/** Nhóm các chỉ số của `dates` theo `key(date)`, giữ thứ tự xuất hiện. */
const groupBy = (dates, key) => {
  const groups = new Map()
  dates.forEach((date, index) => groups.set(key(date), [...(groups.get(key(date)) ?? []), index]))
  return [...groups.entries()]
}

await check('W bucketKey: week = BE week start of the user, month = first day', () => {
  const bucketKey = need(expUtils, 'bucketKey')
  for (const start of DAYS)
    for (const date of SERIES) {
      assert.equal(bucketKey(date, 'weekly', start), beWeekStart(date, start), `${date} / ${start}`)
      assert.equal(bucketKey(date, 'monthly', start), beMonthStart(date))
    }
  assert.equal(
    expUtils.weekStart,
    undefined,
    'a second weekStart helper is back: lib/week weekStartOf is the only one'
  )
})
await check(
  'W Weight Trend D/W/M: weekly trend and scale buckets equal the BE buckets for every start day',
  () => {
    const averageTrendDays = need(trendSeries, 'averageTrendDays')
    const averageScaleDays = need(trendSeries, 'averageScaleDays')
    const trend = SERIES.map((date, index) => ({ date, trend: valueOf(index) }))
    const scale = trend
      .filter((_, index) => index % 3 !== 1)
      .map((day) => ({ date: day.date, value: day.trend + 0.2 }))
    const shapes = new Set()
    for (const start of DAYS) {
      const expected = groupBy(SERIES, (date) => beWeekStart(date, start))
      const got = averageTrendDays(trend, 'weekly', start)
      assert.equal(got.length, expected.length, `${start}: trend buckets`)
      expected.forEach(([, indices], index) => {
        close(got[index].trend, mean(indices.map((i) => trend[i].trend)), `${start} trend ${index}`)
        assert.equal(
          got[index].date,
          beWeekStart(SERIES[indices[0]], start),
          `${start} bucket start`
        )
      })
      const scaleExpected = groupBy(
        scale.map((point) => point.date),
        (date) => beWeekStart(date, start)
      )
      const scaleGot = averageScaleDays(scale, 'weekly', start)
      assert.equal(scaleGot.length, scaleExpected.length, `${start}: scale buckets`)
      scaleExpected.forEach(([, indices], index) =>
        close(
          scaleGot[index].value,
          mean(indices.map((i) => scale[i].value)),
          `${start} scale ${index}`
        )
      )
      shapes.add(got.map((point) => point.date).join())
    }
    assert.ok(shapes.size > 1, 'the buckets must actually move with the start day')
    assert.equal(averageTrendDays(trend, 'monthly', 'Sunday').length, 2)
  }
)
await check('W Expenditure D/W/M follows the start day (status kept in the FE bucket)', () => {
  const averageExpDays = need(expSeries, 'averageExpDays')
  const days = SERIES.map((date, index) => ({
    date,
    kcal: 2400 + index * 3,
    holding: index % 5 === 0,
    status: index % 5 === 0 ? 'Holding' : 'Updating',
    change: 1,
  }))
  for (const start of DAYS) {
    const expected = groupBy(SERIES, (date) => beWeekStart(date, start))
    const got = averageExpDays(days, 'weekly', start)
    assert.equal(got.length, expected.length, `${start}`)
    expected.forEach(([, indices], index) => {
      close(got[index].kcal, mean(indices.map((i) => days[i].kcal)), `${start} kcal`)
      assert.equal(got[index].date, beWeekStart(SERIES[indices[0]], start), `${start} bucket start`)
    })
  }
})
await check(
  'W Steps, body metrics and Nutrient detail D/W/M follow the start day (point = BE week start)',
  () => {
    const averageSteps = need(stepsUtils, 'averageSteps')
    const averageMetric = need(metricUtils, 'averageMetric')
    const averageNutrientDays = need(nutrientUtils, 'averageNutrientDays')
    const steps = SERIES.map((date, index) => ({ date, steps: 4000 + index * 100 }))
    const metric = SERIES.map((date, index) => ({ date, value: valueOf(index) }))
    const nutrient = SERIES.map((date, index) => ({
      date,
      amount: index % 4 === 0 ? null : 50 + index,
      floor: null,
      target: 80,
      ceiling: null,
      goalKind: 'Target',
    }))
    for (const start of DAYS) {
      const keys = groupBy(SERIES, (date) => beWeekStart(date, start)).map(([key]) => key)
      assert.deepEqual(
        averageSteps(steps, 'weekly', start).map((point) => point.date),
        keys,
        `${start} steps`
      )
      assert.deepEqual(
        averageMetric(metric, 'weekly', start).map((point) => point.date),
        keys,
        `${start} metric`
      )
      const grouped = averageNutrientDays(nutrient, 'weekly', start)
      assert.deepEqual(
        grouped.map((point) => point.date),
        keys,
        `${start} nutrient`
      )
      groupBy(SERIES, (date) => beWeekStart(date, start)).forEach(([, indices], index) => {
        const logged = indices.map((i) => nutrient[i].amount).filter((amount) => amount !== null)
        if (logged.length > 0) close(grouped[index].amount, mean(logged), `${start} amount`)
      })
    }
  }
)
await check(
  'W [wiring] every D/W/M screen hands the user week start to its bucketing, nothing calls weekStart() with a default',
  () => {
    const expected = [
      [
        'features/dashboard/hooks/use-expenditure-detail.ts',
        /averageExpDays\(\s*daily,\s*averaging,\s*weekStartDay\s*\)/,
      ],
      [
        'features/dashboard/hooks/use-weight-trend-detail.ts',
        /averageTrendDays\(\s*daily,\s*averaging,\s*weekStartDay\s*\)/,
      ],
      [
        'features/dashboard/hooks/use-weight-trend-detail.ts',
        /averageScaleDays\(\s*weighIns,\s*averaging,\s*weekStartDay\s*\)/,
      ],
      [
        'features/steps/pages/StepsPage.tsx',
        /averageSteps\(\s*days,\s*averaging,\s*weekStartDay\s*\)/,
      ],
      [
        'features/nutrient-detail/pages/NutrientDetailPage.tsx',
        /averageNutrientDays\(\s*days,\s*averaging,\s*weekStartDay\s*\)/,
      ],
      [
        'features/weight/components/BodyMetricPage/BodyMetricView.tsx',
        /averageMetric\(\s*points,\s*averaging,\s*weekStartDay\s*\)/,
      ],
    ]
    for (const [file, pattern] of expected)
      assert.match(source(file), pattern, `${file}: ${pattern}`)
    const oneArgument = allSources().filter(([, text]) => /\bweekStart\(\s*[^,()]+\)/.test(text))
    assert.deepEqual(
      oneArgument.map(([file]) => file),
      [],
      'weekStart(date) with the Monday default is still called'
    )
    assert.match(
      source('features/dashboard/energy-balance.utils.ts'),
      /export const BALANCE_WEEK_STARTS_ON: DayOfWeek = 'Sunday'/,
      'D12 is left alone'
    )
  }
)
await check(
  'W [wiring] food-log week strip, calendar and Dashboard Weekly Nutrition use the start day, not Monday',
  () => {
    const strip = source('features/food-log/components/FoodLogPage/WeekStrip.tsx')
    const calendar = source('features/food-log/components/FoodLogPage/CalendarSheet.tsx')
    const matrix = source('features/dashboard/components/DashboardPage/WeekMatrix.tsx')
    const dashboard = source('features/dashboard/pages/DashboardPage.tsx')
    const page = source('features/food-log/pages/FoodLogPage.tsx')
    const hook = source('features/food-log/hooks/use-food-log.ts')
    for (const [name, text] of [
      ['WeekStrip', strip],
      ['CalendarSheet', calendar],
    ]) {
      assert.ok(
        !/\bWEEKDAYS\b|\bmondayOf\b/.test(text),
        `${name} still has the Monday-first constants`
      )
      assert.match(text, /useUnits\(\)/, `${name} reads the start day`)
      assert.match(text, /weekStartOf\(/, `${name} week start`)
      assert.match(text, /dayOfWeekOf\(/, `${name} labels come from the date`)
    }
    assert.ok(
      !/WEEKDAY_LABELS|WEEKDAY_NAMES/.test(matrix) && /dayOfWeekOf\(/.test(matrix),
      'WeekMatrix labels come from the date'
    )
    assert.match(
      dashboard,
      /useWeekLog\(\s*hasProgram && today \? weekStartOf\(today, weekStartDay\) : null\s*\)/
    )
    assert.match(page, /weekStartOf\(date, weekStartDay\)/)
    assert.ok(!/\bmondayOf\b/.test(page), 'FoodLogPage still uses mondayOf')
    assert.match(
      hook,
      /weekBlocksOf\(weekStarts\)/,
      'the Mon–Sun blocks of the BE are stitched by logDate'
    )
    assert.ok(
      !allSources().some(([, text]) => /export const mondayOf/.test(text)),
      'mondayOf is gone'
    )
  }
)
await check(
  'W [wiring] Habits, Period and the date pickers build their month grid from the start day',
  () => {
    const grid = /monthGrid\(view\.year, view\.month, weekStartDay\)/
    for (const [file, pattern] of [
      ['features/habits/pages/HabitsPage.tsx', grid],
      ['features/period/pages/PeriodPage.tsx', grid],
      ['features/food-log/components/FoodLogPage/SelectDatesSheet.tsx', grid],
      ['features/weight/components/BodyMetricPage/SelectDateSheet.tsx', grid],
      [
        'features/habits/components/HabitsPage/HabitHeatmap.tsx',
        /yearHeatmap\(year, weekStartDay\)/,
      ],
    ])
      assert.match(source(file), pattern, file)
    const calendar = source('features/habits/components/HabitsPage/HabitCalendar.tsx')
    assert.ok(
      !/WEEKDAY_LABELS/.test(calendar) && /grid\.slice\(0, 7\)/.test(calendar),
      'HabitCalendar header comes from the grid'
    )
    for (const file of [
      'features/food-log/components/FoodLogPage/SelectDatesSheet.tsx',
      'features/weight/components/BodyMetricPage/SelectDateSheet.tsx',
    ])
      assert.ok(
        !/WEEKDAY_INITIALS/.test(source(file)),
        `${file} still has the Monday-first letters`
      )
  }
)

// ── C1: Goal Progress đọc `weeks` của BE ─────────────────────────────────────────────────────────────────────────────────────────

await check(
  'C1 Goal Progress waterfall (Trend tab) draws the BE weeks, not weeks regrouped from entries',
  () => {
    const buildWaterfall = need(goalUtils, 'buildWaterfall')
    const result = buildWaterfall({
      startKg: 90,
      targetKg: 80,
      startDate: '2026-09-01',
      today: '2026-09-20',
      entries: [],
      tab: 'trend',
      weeks: [
        { weekStart: '2026-09-01', trendKg: 89, deltaKg: -1 },
        { weekStart: '2026-09-08', trendKg: 88.5, deltaKg: -0.5 },
        { weekStart: '2026-09-15', trendKg: null, deltaKg: null },
      ],
      weight: need(units, 'weightMeasure')('kg'),
    })
    assert.deepEqual(
      result.bars.map((bar) => bar.key),
      ['start', '2026-09-01', '2026-09-08', 'status']
    )
    close(result.distance, 8.5, 'distance from the last BE week')
  }
)
await check(
  'C1 [wiring] Trend tab passes data.weeks, % comes from BE progressPercent, ETA is typed',
  () => {
    assert.match(
      source('features/dashboard/hooks/use-goal-progress-detail.ts'),
      /weeks: tab === 'trend' \? data\.weeks : null/
    )
    const types = source('features/dashboard/types/dashboard.types.ts')
    assert.match(types, /weeks: GoalWeek\[\]/)
    assert.match(types, /estimatedCompletionDate: string \| null/)
    assert.ok(
      !/goalProgressPercent/.test(source('features/dashboard/dashboard.utils.ts')),
      'the FE % fallback is gone'
    )
  }
)

// ── C3: Holding bằng tiếng Anh ───────────────────────────────────────────────────────────────────────────────────────────────────

await check(
  'C3 Holding reasons are English sentences built from the BE codes (BE text is Vietnamese)',
  () => {
    const holdingReasonsOf = need(expSeries, 'holdingReasonsOf')
    const both = holdingReasonsOf({
      holdingReasonCodes: ['MissingLogs', 'NoRecentWeighIn'],
      loggedDaysLast7: 2,
      weighInDaysLast7: 0,
    })
    assert.equal(both.length, 2)
    assert.match(both[0], /Only 2 of the last 7 days/)
    assert.match(both[1], /No weigh-in in the last 7 days/)
    for (const sentence of both) assert.match(sentence, /^[\x20-\x7e]+$/, 'ASCII English only')
    assert.deepEqual(
      holdingReasonsOf({ holdingReasonCodes: [], loggedDaysLast7: 7, weighInDaysLast7: 3 }),
      []
    )
    assert.deepEqual(
      holdingReasonsOf({
        holdingReasonCodes: ['SomethingNew'],
        loggedDaysLast7: 0,
        weighInDaysLast7: 0,
      }),
      []
    )
    assert.deepEqual(holdingReasonsOf(null), [])
  }
)
await check(
  'C3 [wiring] the Expenditure page shows the built reasons, never the BE sentence',
  () => {
    const insights = source('features/dashboard/components/ExpenditurePage/ExpenditureInsights.tsx')
    assert.match(insights, /holdingReasons\.map\(/)
    assert.ok(!/\{holdingReason\}/.test(insights), 'the Vietnamese BE sentence is rendered')
    assert.match(
      source('features/dashboard/hooks/use-expenditure-detail.ts'),
      /holdingReasons: holdingReasonsOf\(/
    )
  }
)

// ── C4: Macros "Last 7 Days" ─────────────────────────────────────────────────────────────────────────────────────────────────────

await check(
  'C4 [wiring] the Macros tile covers the 7 calendar days ending today (a missing day stays empty)',
  () => {
    const hook = source('features/dashboard/hooks/use-dashboard-data.ts')
    assert.match(
      hook,
      /lastDays\(today, DAYS_PER_WEEK\) : \[\]\)\.map\(\s*\(date\): MacroBar \| null/
    )
    assert.ok(
      !/daily\.slice\(-(DAYS_PER_WEEK|WEEK_DAYS)\)/.test(hook),
      'the last 7 points of daily are not the last 7 days'
    )
  }
)

// ── C5: kiểu dữ liệu khớp BE ─────────────────────────────────────────────────────────────────────────────────────────────────────

await check(
  'C5 DayLog mirrors BE DayLogResponse (water, fasting, incomplete, notes max) with no legacy notes branch',
  () => {
    const text = source('features/food-log/types/food-log.types.ts')
    const dayLog = interfaceOf(text, 'DayLog')
    for (const field of [
      'isLogged: boolean',
      'notes: FoodLogNote[]',
      'notesMaxPerDay: number',
      'waterMl: number',
      'isFasting: boolean',
      'isIncomplete: boolean',
    ])
      assert.ok(dayLog.includes(field), `DayLog.${field}`)
    assert.ok(!/toNotes/.test(text), 'toNotes (string notes of the old BE) is gone')
    assert.ok(
      !allSources().some(([, content]) => /DEFAULT_MAX_NOTES/.test(content)),
      'DEFAULT_MAX_NOTES default is gone'
    )
  }
)
await check(
  'C5 always-sent fields are not optional: DailyProgress, ExpenditurePoint flux, Profile.createdAt, CheckInProposal.reason',
  () => {
    const dashboard = source('features/dashboard/types/dashboard.types.ts')
    const daily = interfaceOf(dashboard, 'DailyProgress')
    assert.ok(
      daily.includes('isLogged: boolean') && daily.includes('estimatedTdeeKcal: number | null'),
      'DailyProgress'
    )
    const point = interfaceOf(dashboard, 'ExpenditurePoint')
    assert.ok(
      point.includes('fluxLowKcal: number | null') && point.includes('fluxHighKcal: number | null'),
      'ExpenditurePoint flux'
    )
    assert.ok(
      /createdAt: string/.test(source('features/users/types/user.types.ts')),
      'Profile.createdAt'
    )
    assert.ok(
      /reason: string/.test(
        interfaceOf(source('features/program/types/check-in.types.ts'), 'CheckInProposal')
      ),
      'CheckInProposal.reason'
    )
    assert.ok(
      /value: number \| null/.test(
        interfaceOf(source('features/food-log/types/food-log.types.ts'), 'NutritionOverviewItem')
      ),
      'NutritionOverviewItem.value'
    )
  }
)
await check(
  'C5 isLogged comes from the BE flag: no guess from calories, no dead `??` fallback',
  () => {
    const utils = source('features/dashboard/dashboard.utils.ts')
    assert.match(utils, /export const isLogged = \(point: DailyProgress\) => point\.isLogged\b/)
    assert.ok(!/isLogged \?\?/.test(utils), 'isLogged ?? caloriesConsumed > 0')
  }
)

// ── C6: Habits Weigh-In ──────────────────────────────────────────────────────────────────────────────────────────────────────────

await check(
  'C6 [wiring] Habits Weigh-In reads GET /weights/habit (per-day weight + all-time streak)',
  () => {
    assert.match(source('config/api-routes.ts'), /habit: '\/weights\/habit'/)
    assert.match(source('features/weight/services/weight.service.ts'), /habit: \(year: number\)/)
    assert.match(source('features/weight/hooks/use-weights.ts'), /useWeighInHabit/)
    const hook = source('features/habits/hooks/use-habit-days.ts')
    assert.match(hook, /useWeighInHabit\(/)
    assert.match(hook, /habit\.data\?\.currentStreak/)
    assert.match(hook, /day\.weightKg === null/, 'a day with only body fat is not a weigh-in')
    assert.match(source('features/habits/pages/HabitsPage.tsx'), /streak=\{summary\.streak\}/)
  }
)

// ── C7: Sparkline ────────────────────────────────────────────────────────────────────────────────────────────────────────────────

await check(
  'C7 [wiring] Sparkline keeps a minimum y-span so tiny wiggles stay flat (like TrendMini)',
  () => {
    const visuals = source('features/dashboard/components/DashboardPage/TileVisuals.tsx')
    assert.match(visuals, /const MIN_SPAN_RATIO = 0\.0125/)
    assert.match(visuals, /Math\.max\(hi - lo, Math\.abs\(mid\) \* MIN_SPAN_RATIO\)/)
  }
)

// ── B4: đủ sáu loại goal của BE ──────────────────────────────────────────────────────────────────────────────────────────────

/** `Domain/Enums/Users/GoalType.cs` của BE. */
const BE_GOAL_TYPES = [
  'WeightLoss',
  'WeightGain',
  'MuscleGain',
  'Maintenance',
  'Endurance',
  'Flexibility',
]

await check(
  'B4 every BE goal type has a read-only label (no `undefined` title / history label), pickers keep three',
  () => {
    const goalTitleOf = need(goalDisplay, 'goalTitleOf')
    const goalShortOf = need(goalDisplay, 'goalShortOf')
    assert.deepEqual(
      Object.keys(constant(enums, 'PROGRAM_GOAL_TYPE')).sort(),
      [...BE_GOAL_TYPES].sort()
    )
    for (const type of BE_GOAL_TYPES) {
      assert.ok(goalTitleOf(type).endsWith(' Goal'), `${type} title: ${goalTitleOf(type)}`)
      assert.ok(goalShortOf(type), `${type} short label`)
    }
    assert.equal(goalTitleOf('MuscleGain'), 'Muscle Gain Goal')
    assert.equal(goalTitleOf('Endurance'), 'Endurance Goal')
    assert.equal(goalTitleOf('Flexibility'), 'Flexibility Goal')
    assert.equal(goalShortOf('MuscleGain'), 'Muscle Gain')
    assert.equal(goalShortOf('WeightLoss'), 'Loss')
    assert.equal(goalTitleOf('SomethingNew'), 'Goal', 'an unknown type still has text')
    // Picker (Lose / Maintain / Gain) không thêm lựa chọn: đó là quyết định nghiệp vụ
    assert.deepEqual(Object.keys(constant(enums, 'GOAL_TYPE')).sort(), [
      'Maintenance',
      'WeightGain',
      'WeightLoss',
    ])
  }
)
await check(
  'B4 rate signs come from the numbers BE sends (kg negative = loss, percent positive = loss), never from the goal type',
  () => {
    const kgRateSign = need(goalDisplay, 'kgRateSign')
    const percentRateSign = need(goalDisplay, 'percentRateSign')
    // Chương trình tăng cân thật của tài khoản thử: kg +0.44, percent −0.55 → cả hai tile là "+"
    assert.deepEqual([kgRateSign(0.44), percentRateSign(-0.55)], ['+', '+'])
    assert.deepEqual([kgRateSign(-0.44), percentRateSign(0.55)], ['−', '−'])
    // Endurance / Flexibility chưa có hướng: 0 thì chỉ hiện độ lớn, không dấu
    assert.deepEqual([kgRateSign(0), percentRateSign(0)], ['', ''])
  }
)
await check(
  'B4 [wiring] response types cover all BE values; GoalCard / GoalHistory use the shared labels; no dead isFastingDay',
  () => {
    const types = source('features/program/types/program.types.ts')
    assert.match(interfaceOf(types, 'Program'), /goalType: ProgramGoalType/)
    assert.match(interfaceOf(types, 'GoalHistoryItem'), /goalType: ProgramGoalType/)
    assert.match(types, /calorieShiftMode\?: 'Even' \| 'TrainingDays' \| 'Custom' \| null/)
    // Chỉ xét mã (bỏ chú thích): comment được phép nhắc tên trường đã gỡ
    const codeOnly = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    assert.ok(
      !allSources().some(([, text]) => /isFastingDay/.test(codeOnly(text))),
      'BE never sends isFastingDay'
    )
    const card = source('features/program/components/ProgramPage/GoalCard.tsx')
    const history = source('features/program/components/ProgramPage/GoalHistory.tsx')
    assert.ok(
      !/Record<GoalType/.test(card + history),
      'no local label map that only knows three types'
    )
    assert.ok(
      !/goalType === 'WeightLoss'/.test(card),
      'GoalCard must not derive the sign from the goal type'
    )
    assert.match(card, /kgRateSign\(program\.weeklyWeightChangeTargetKg\)/)
    assert.match(card, /percentRateSign\(program\.weeklyWeightChangeTargetPercent\)/)
    assert.match(card, /goalTitleOf\(program\.goalType\)/)
    assert.match(history, /goalShortOf\(item\.goalType\)/)
  }
)

// ── R: một quy tắc "còn lại" ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** Ngày thật làm lộ lỗi: đã ăn 64.5 kcal / 8.13 g protein, target 2861 kcal / 174.5 g protein. */
const OCT21_TOTALS = { calories: 64.5, protein: 8.13, fat: 3.4, carbs: 0, fiber: 0 }
const OCT21_TARGET = { caloriesTarget: 2861, proteinTarget: 174.5, fatTarget: 95, carbsTarget: 326 }
const NO_TOTALS = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }

await check(
  'R shownProgress rounds consumed and target in the shown unit FIRST, then subtracts (Consumed + Remaining = Target)',
  () => {
    const shownProgress = need(remaining, 'shownProgress')
    assert.deepEqual(shownProgress(64.5, 2861, Math.round), {
      consumed: 65,
      goal: 2861,
      remaining: 2796,
    })
    assert.deepEqual(shownProgress(8.13, 174.5, Math.round), {
      consumed: 8,
      goal: 175,
      remaining: 167,
    })
    const kj = (value) => Math.round(value * 4.184)
    const inKj = shownProgress(64.5, 2861, kj)
    assert.deepEqual(inKj, { consumed: 270, goal: 11970, remaining: 11700 })
    // Số thập phân (chất có một chữ số lẻ) không để lại nhiễu dấu phẩy động
    assert.equal(shownProgress(8.13, 20.04, (value) => Math.round(value * 10) / 10).remaining, 11.9)
    // Tính chất: chưa vượt mục tiêu thì ba số cộng đúng, ở kcal lẫn kJ
    let seed = 7
    const next = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31
    for (let index = 0; index < 2000; index += 1) {
      const goal = 1200 + next() * 3000
      const eaten = next() * goal
      for (const shown of [Math.round, kj]) {
        const progress = shownProgress(eaten, goal, shown)
        assert.equal(progress.consumed + progress.remaining, progress.goal, `${eaten} / ${goal}`)
      }
    }
  }
)
await check(
  'R over the target Remaining stops at 0 unless Show Overages; no (or 0) target means no Remaining',
  () => {
    const shownProgress = need(remaining, 'shownProgress')
    assert.equal(shownProgress(3000, 2861, Math.round).remaining, 0)
    assert.equal(shownProgress(3000, 2861, Math.round, true).remaining, -139)
    for (const goal of [null, undefined, 0])
      assert.deepEqual(shownProgress(850, goal, Math.round), {
        consumed: 850,
        goal: null,
        remaining: null,
      })
  }
)
await check(
  'R Weekly Nutrition shows the same Remaining as Daily Nutrition for the same day (2796 kcal / 167 g, not 2797 / 166)',
  () => {
    const weekSummary = need(dashboardUtils, 'weekSummary')
    const day = {
      logDate: '2026-10-21',
      isLogged: true,
      totals: OCT21_TOTALS,
      target: OCT21_TARGET,
    }
    const left = (key, goalOf) => weekSummary([day], key, goalOf, 'remaining', Math.round)
    assert.deepEqual(
      left('calories', (t) => t.caloriesTarget),
      { value: 2796, goal: 2861 }
    )
    assert.deepEqual(
      left('protein', (t) => t.proteinTarget),
      { value: 167, goal: 175 }
    )
    assert.deepEqual(
      weekSummary([day], 'calories', (t) => t.caloriesTarget, 'consumed', Math.round),
      { value: 65, goal: 2861 }
    )
    // Cả tuần cộng target các ngày có target và vẫn cộng đúng
    const week = Array.from({ length: 7 }, (_, index) => ({
      ...day,
      logDate: `2026-10-${18 + index}`,
      totals: index === 3 ? OCT21_TOTALS : NO_TOTALS,
    }))
    assert.deepEqual(
      weekSummary(week, 'calories', (t) => t.caloriesTarget, 'remaining', Math.round),
      { value: 7 * 2861 - 65, goal: 7 * 2861 }
    )
    // Chưa có target CHÍNH THỨC: không có "còn lại" ("—"), KHÔNG đổi sang số đã ăn (Remaining bật mà hiện số đã ăn gây hiểu nhầm); Consumed vẫn hiện số đã ăn
    assert.deepEqual(
      weekSummary(
        [{ ...day, target: null }],
        'calories',
        (t) => t.caloriesTarget,
        'remaining',
        Math.round
      ),
      { value: null, goal: null }
    )
    assert.deepEqual(
      weekSummary(
        [{ ...day, target: null }],
        'calories',
        (t) => t.caloriesTarget,
        'consumed',
        Math.round
      ),
      { value: 65, goal: null }
    )
  }
)
await check(
  'R [wiring] every Remaining display goes through the shared rule; none subtracts before rounding',
  () => {
    for (const [file, pattern] of [
      ['features/dashboard/components/DashboardPage/WeekMatrix.tsx', /weekSummary\(/],
      ['features/dashboard/dashboard.utils.ts', /shownProgress\(/],
      [
        'features/dashboard/components/DashboardPage/DailyNutritionCard.tsx',
        /shownProgressOrUnknown\(/,
      ],
      ['features/dashboard/components/DashboardPage/NutrientTile.tsx', /shownProgress\(/],
      ['features/food-log/components/FoodLogPage/MacroSummary.tsx', /shownProgressOrUnknown\(/],
      ['features/food-log/food-log-settings.ts', /shownProgress\(/],
    ])
      assert.match(source(file), pattern, file)
    const daily = source('features/dashboard/components/DashboardPage/DailyNutritionCard.tsx')
    assert.ok(
      (daily.match(/shownProgressOrUnknown\(/g) ?? []).length >= 2,
      'calories and the three macros'
    )
    assert.match(
      source('features/food-log/components/FoodLogPage/AddFoodProgress.tsx'),
      /bannerValue\(\s*display,\s*cell\.goal,[^)]*toShown/,
      'the banner converts to kJ before rounding'
    )
    const offenders = allSources().filter(
      ([file, text]) =>
        file !== 'features/nutrition/remaining.ts' &&
        text
          .split('\n')
          .some(
            (line) =>
              !/^\s*(\/\/|\*|\/\*)/.test(line) &&
              (/Math\.max\(0,\s*\w*(oal|arget)\w*\s*-/.test(line) ||
                (/(oal|arget)\w*\)?\s*-\s*\(?(value|consumed|eaten|inPlate)/.test(line) &&
                  !/targetRatio\(|\/ goal\)/.test(line)))
          )
    )
    assert.deepEqual(
      offenders.map(([file]) => file),
      [],
      'a Remaining display subtracts the unrounded numbers'
    )
    assert.ok(
      !allSources().some(([, text]) => /goalRemaining/.test(text)),
      'goalRemaining (subtract first) is gone'
    )
  }
)

// ── F: review độc lập (F1–F13); F2 (đánh dấu ngày chưa đủ) nằm ở check-strategy S1, F12 (cỡ chữ biểu đồ) ở S9 ─────────────────────────

const sourcesOf = (pattern) =>
  allSources()
    .filter(([, text]) => pattern.test(text))
    .map(([file]) => file)
/** Phần mã từ `from` tới `to` (hoặc hết file) trong `text`. */
const bodyOf = (text, from, to) => {
  const start = text.indexOf(from)
  assert.ok(start >= 0, `${from} is not found`)
  const end = to ? text.indexOf(to, start + from.length) : -1
  return text.slice(start, end < 0 ? text.length : end)
}
const flat = (text) => text.replace(/\s+/g, ' ')

await check(
  'F1 saving / deleting a weigh-in refreshes everything BE derives from weight (goals, expenditure, energy balance, check-in, full body)',
  () => {
    const text = source('features/weight/hooks/use-weights.ts')
    const list = bodyOf(text, 'export const WEIGHT_INVALIDATE', '] as const')
    for (const key of [
      'weightKeys.all',
      "['goals']",
      "['expenditure']",
      "['energy-balance']",
      "['check-in']",
      "['body-metrics']",
    ])
      assert.ok(list.includes(key), `WEIGHT_INVALIDATE misses ${key}`)
    assert.ok(
      bodyOf(text, 'export const useUpsertWeight', 'export const useDeleteWeight').includes(
        'WEIGHT_INVALIDATE'
      ),
      'useUpsertWeight'
    )
    assert.ok(
      bodyOf(text, 'export const useDeleteWeight', 'export const useUpsertVisualBodyFat').includes(
        'WEIGHT_INVALIDATE'
      ),
      'useDeleteWeight'
    )
    // Body fat / tape chỉ nằm trong BodyMetrics của BE (không có số suy ra nào khác): chỉ Full Body cần đọc lại
    assert.ok(bodyOf(text, 'const VISUAL_INVALIDATE', '\n\n').includes("['body-metrics']"))
  }
)
await check(
  'F3 the Manual review copy gives both per-gram numbers a unit (4 / 9 kcal, 17 / 38 kJ) from the one Atwater source',
  () => {
    const reviewCopyOf = need(reviewCopy, 'reviewCopyOf')
    const energyMeasure = need(units, 'energyMeasure')
    const { KCAL_PER_GRAM } = atwater
    assert.equal(KCAL_PER_GRAM?.protein, KCAL_PER_GRAM?.carbs, 'the copy says "protein and carbs"')
    const facts = {
      programType: 'Manual',
      tdeeKcal: 2400,
      averageKcal: 2000,
      weeklyBudgetKcal: 14000,
      weeklyChangePercent: -0.5,
      macroKcalAverage: 1980,
    }
    const line = (unit) =>
      reviewCopyOf(facts, energyMeasure(unit)).details.find(
        (detail) => detail.title === 'Average Macro Calorie Content'
      ).text
    assert.match(line('kcal'), /\(4 kcal per gram of protein and carbs, 9 kcal per gram of fat\)/)
    assert.match(line('kJ'), /\(17 kJ per gram of protein and carbs, 38 kJ per gram of fat\)/)
  }
)
await check('F4 Goal summary names the weight unit the user chose, not a fixed "kg"', () => {
  const text = flat(source('features/onboarding/components/OnboardingPage/GoalSummaryStep.tsx'))
  assert.ok(text.includes('The {weight.unit} per week will change'), 'uses weight.unit')
  assert.ok(!text.includes('The kg per week'), 'still says kg')
})
await check(
  'F5 Quick Add starts on the profile energy unit, follows it when the profile loads, keeps a unit the user picked',
  () => {
    const convertEnergyText = need(units, 'convertEnergyText')
    assert.equal(convertEnergyText('2000', 'kcal', 'kJ'), '8368')
    assert.equal(convertEnergyText('8368', 'kJ', 'kcal'), '2000')
    assert.equal(convertEnergyText('', 'kcal', 'kJ'), '', 'an empty box stays empty')
    assert.equal(convertEnergyText('2000', 'kcal', 'kcal'), '2000')
    const panel = source('features/food-log/components/FoodLogPage/QuickAddPanel.tsx')
    assert.ok(
      !/useState<EnergyUnit>\(useUnits\(\)/.test(panel),
      'the unit is captured at first render'
    )
    assert.match(panel, /useState<EnergyUnit>\(profileUnit\)/)
    assert.match(
      panel,
      /!touched && unit !== profileUnit/,
      'follows the profile until a manual choice'
    )
    assert.match(panel, /setTouched\(true\)/, 'a manual choice stops the sync')
  }
)
await check(
  'F6 saving / deleting a Nutrition Data day also refreshes nutrients, overview, energy balance',
  () => {
    const text = source('features/nutrition-data/hooks/use-nutrition-data.ts')
    assert.match(
      text,
      /import \{ invalidateLogData \} from '@\/features\/food-log\/hooks\/use-food-log'/
    )
    assert.match(
      bodyOf(text, 'const useInvalidate', 'export const useSaveNutritionDay'),
      /invalidateLogData\(queryClient\)/
    )
  }
)
await check(
  'F7 Atwater 4 / 4 / 9 (+ alcohol 7) is written in ONE place and every macro maths reads it',
  () => {
    assert.deepEqual(
      { ...constant(atwater, 'KCAL_PER_GRAM') },
      { protein: 4, carbs: 4, fat: 9, alcohol: 7 }
    )
    assert.deepEqual(sourcesOf(/\bKCAL_PER_GRAM\s*=/), ['features/nutrition/atwater.ts'])
    const bare = allSources().filter(
      ([file, text]) =>
        file !== 'features/nutrition/atwater.ts' &&
        text
          .split('\n')
          .some(
            (line) =>
              !/^\s*(\/\/|\*|\/\*)/.test(line) &&
              /\b(protein|carbs?|fat)\w*\)?\s*\*\s*[49]\b|\b[49]\s*\*\s*\(?(protein|carbs?|fat)/i.test(
                line
              )
          )
    )
    assert.deepEqual(
      bare.map(([file]) => file),
      [],
      'a macro is still multiplied by a bare 4 / 9'
    )
  }
)
await check(
  'F8 one-letter day labels come from lib/week (one source, not four hand-written copies)',
  () => {
    const dayLetter = need(week, 'dayLetter')
    const dayLetterOfDate = need(week, 'dayLetterOfDate')
    assert.deepEqual(DAYS.map(dayLetter), ['S', 'M', 'T', 'W', 'T', 'F', 'S'])
    assert.deepEqual(range('2026-10-19', 7).map(dayLetterOfDate), [
      'M',
      'T',
      'W',
      'T',
      'F',
      'S',
      'S',
    ])
    for (const name of ['DAY_LETTERS', 'DAY_LETTER', 'dayLetterOf'])
      assert.deepEqual(sourcesOf(new RegExp(`\\b${name}\\b`)), [], `${name} is still defined`)
    assert.deepEqual(sourcesOf(/Monday:\s*'M'/), [], 'a hand-written letter map is back')
    assert.deepEqual(
      sourcesOf(/dayOfWeekOf\([^)]*\)\[0\]/),
      [],
      'a day letter is derived by hand from dayOfWeekOf'
    )
    for (const file of [
      'features/dashboard/components/DashboardPage/WeekMatrix.tsx',
      'features/food-log/components/FoodLogPage/SelectDatesSheet.tsx',
      'features/weight/components/BodyMetricPage/SelectDateSheet.tsx',
      'features/program/components/CheckInPage/IncompleteDaysChart.tsx',
      'features/onboarding/components/OnboardingPage/ProgramReadyStep.tsx',
      'features/program/components/ProgramPage/WeekMacroChart.tsx',
    ])
      assert.match(source(file), /dayLetter(OfDate)?\(/, `${file} does not use the shared helper`)
  }
)
await check(
  'F9 one "resend the stored kg when the shown value is unchanged" rule for every weigh-in editor',
  () => {
    const kgToSend = need(units, 'kgToSend')
    const toApiKg = need(units, 'toApiKg')
    // 79.3 kg is shown as 174.8 lb: unchanged → the stored kg itself, not 174.8 lb → 79.29 kg
    assert.equal(kgToSend(174.8, 'lb', 79.3), 79.3)
    assert.notEqual(toApiKg(174.8, 'lb'), 79.3, 'sanity: the round trip through lb really drifts')
    assert.equal(kgToSend(175, 'lb', 79.3), toApiKg(175, 'lb'))
    assert.equal(kgToSend(79.3, 'kg', 79.3), 79.3)
    assert.equal(kgToSend(80, 'kg', 79.3), 80)
    assert.equal(kgToSend(174.8, 'lb', null), toApiKg(174.8, 'lb'))
    assert.equal(kgToSend(174.8, 'lb', undefined), toApiKg(174.8, 'lb'))
    for (const file of [
      'features/weight/pages/ScaleWeightPage.tsx',
      'features/habits/components/HabitsPage/ScaleWeightSheet.tsx',
    ]) {
      const text = source(file)
      assert.match(text, /kgToSend\(/, `${file} does not use kgToSend`)
      assert.ok(!/toApiKg\(/.test(text), `${file} still converts by hand`)
    }
  }
)
await check(
  'F10 Quick Add converts and rounds through lib/units (no own kJ maths), still sending 0.1 kcal',
  () => {
    const toApiKcal = need(units, 'toApiKcal')
    assert.equal(toApiKcal(4184, 'kJ', 1), 1000)
    assert.equal(toApiKcal(100, 'kJ', 1), 23.9)
    assert.equal(toApiKcal(123.44, 'kcal', 1), 123.4)
    assert.equal(toApiKcal(4184, 'kJ'), 1000, 'whole kcal stays the default for TDEE / floors')
    const panel = source('features/food-log/components/FoodLogPage/QuickAddPanel.tsx')
    assert.ok(!/KJ_PER_KCAL|\* 10\) \/ 10/.test(panel), 'Quick Add has its own kJ maths')
    assert.match(panel, /toApiKcal\(toNumber\(energy\), unit, 1\)/)
    assert.match(
      panel,
      /measure\.convert\(LIMITS\.calories\)/,
      'the limit is shown in the chosen unit'
    )
    assert.deepEqual(sourcesOf(/\b4\.184\b/), ['lib/units.ts'], 'the kJ factor is written once')
  }
)
await check(
  'F11 Energy Balance groups weeks with lib/week (Sunday kept for D12); no second weekStart helper',
  () => {
    assert.equal(expUtils.weekStart, undefined, 'expenditure.utils still has its own weekStart')
    const text = source('features/dashboard/energy-balance.utils.ts')
    assert.match(text, /export const BALANCE_WEEK_STARTS_ON: DayOfWeek = 'Sunday'/)
    assert.match(text, /weekStartOf\(point\.date, BALANCE_WEEK_STARTS_ON\)/)
    assert.ok(!/import \{[^}]*\bweekStart\b[^}]*\} from/.test(text), 'imports the second helper')
    const averageBalancePoints = need(energyBalance, 'averageBalancePoints')
    const point = (date) => ({ date, consumed: 2000, baseline: 2500 })
    // Chủ nhật 18/10 → Thứ Bảy 31/10: đúng hai tuần Chủ nhật; từ Thứ Hai 19/10 thì Chủ nhật 25/10 mở tuần mới
    assert.deepEqual(
      averageBalancePoints(range('2026-10-18', 14).map(point), 'weekly').map((p) => p.date),
      ['2026-10-18', '2026-10-25']
    )
    assert.deepEqual(
      averageBalancePoints(range('2026-10-19', 7).map(point), 'weekly').map((p) => p.date),
      ['2026-10-18', '2026-10-25'],
      'a bucket sits at its BE start (the Sunday), not at the first logged day'
    )
  }
)
await check(
  'F12 the chart font maths sits next to WeekMacroChart, and the "7 days" constant is not called WEEK_DAYS',
  () => {
    assert.equal(constant(week, 'DAYS_PER_WEEK'), 7)
    const macros = source('features/program/utils/day-macros.ts')
    assert.ok(
      !/cellFontSize|_EXTRA_EM|DIGIT_EM/.test(macros),
      'day-macros (macro maths) has chart font maths'
    )
    assert.match(
      source('features/program/components/ProgramPage/chart-fit.ts'),
      /export const cellFontSize/
    )
    assert.deepEqual(
      sourcesOf(/(?:const|let)\s+WEEK_DAYS\s*=\s*7\b/),
      [],
      'WEEK_DAYS = 7 clashes with the WEEK_DAYS day-name list'
    )
    assert.deepEqual(sourcesOf(/export const WEEK_DAYS\b/), [
      'features/program/utils/day-macros.ts',
    ])
  }
)
await check(
  'F13 dead code is gone: unused helpers removed, own-file exports unexported, no orphan JSDoc, scoped refetch',
  () => {
    for (const name of ['energySettingOf', 'weekDaysFrom'])
      assert.deepEqual(sourcesOf(new RegExp(`\\b${name}\\b`)), [], `${name} is still in src`)
    for (const [file, name] of [
      ['lib/units.ts', 'DEFAULT_UNITS'],
      ['features/onboarding/onboarding.utils.ts', 'SUGGESTED_DATE_OF_BIRTH'],
      ['features/onboarding/types/onboarding-options.types.ts', 'FLOOR_ICON'],
    ])
      assert.ok(
        !new RegExp(`export const ${name}\\b`).test(source(file)),
        `${file} exports ${name}`
      )
    assert.ok(
      !/\*\/\s*\n\s*\/\*\*/.test(source('features/users/profile.utils.ts')),
      'profile.utils.ts has a JSDoc block with no declaration'
    )
    const weekLog = bodyOf(
      source('features/food-log/hooks/use-food-log.ts'),
      'export const useWeekLog',
      'export const useWeekDays'
    )
    const refetch = bodyOf(weekLog, 'refetch:', '\n  }\n}')
    assert.ok(refetch.includes('foodLogKeys.week('), 'refetch does not target its own week blocks')
    assert.ok(!refetch.includes('foodLogKeys.all'), 'refetch re-fetches every food-log query')
  }
)

// ── D: một nguồn cho ngày / làm tròn / hằng số, và không còn export chết ───────────────────────────────────────────────────────────────────

/** Mã không kể comment (để quét chuỗi / hằng số mà không dính phần giải thích). */
const codeOf = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n')
const codeSourcesOf = (pattern) =>
  allSources()
    .filter(([, text]) => pattern.test(codeOf(text)))
    .map(([file]) => file)

await check(
  'D1 one date reader and one day-difference (lib/date): calendar days, DST-safe, same answer from every screen',
  async () => {
    const dateLib = await load('../src/lib/date.ts')
    const daysBetween = need(dateLib, 'daysBetween')
    const parseIso = need(dateLib, 'parseIso')
    const zone = process.env.TZ
    try {
      for (const tz of ['America/New_York', 'Asia/Ho_Chi_Minh', 'Europe/London']) {
        process.env.TZ = tz
        assert.equal(daysBetween('2026-03-07', '2026-03-09'), 2, `${tz} spring forward`)
        assert.equal(daysBetween('2026-10-31', '2026-11-02'), 2, `${tz} fall back`)
        assert.equal(daysBetween('2026-10-21', '2026-10-21'), 0)
        assert.equal(daysBetween('2026-10-21', '2026-10-14'), -7)
        assert.equal(
          daysBetween('1970-01-01', '2026-10-21'),
          Math.round(Date.UTC(2026, 9, 21) / 864e5),
          `${tz} epoch day`
        )
        const date = parseIso('2026-10-21')
        assert.deepEqual(
          [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()],
          [2026, 9, 21, 0]
        )
      }
    } finally {
      if (zone === undefined) delete process.env.TZ
      else process.env.TZ = zone
    }
  }
)
await check(
  'D2 no screen builds its own date: no `T00:00:00`, 864e5 / DAY_MS maths, Intl month / weekday names or second month table (all through lib/date + lib/week)',
  () => {
    assert.deepEqual(codeSourcesOf(/T00:00:00/), ['lib/date.ts'], 'a date is parsed by hand')
    assert.deepEqual(
      codeSourcesOf(/864e5|\bDAY_MS\b|86400000|24 \* 60 \* 60/),
      ['lib/date.ts'],
      'a day length is written by hand'
    )
    assert.deepEqual(codeSourcesOf(/export const daysBetween\b/), ['lib/date.ts'])
    assert.deepEqual(codeSourcesOf(/const parse = \(iso/), [], 'a local parse(iso) is back')
    assert.deepEqual(
      codeSourcesOf(/toLocale(?:Date)?String\(\s*'en-US',\s*\{[^}]*\b(?:weekday|month)\b/),
      ['features/more/pages/MorePage.tsx'],
      'a month / weekday name comes from Intl (only MorePage, which formats an instant, may)'
    )
    assert.deepEqual(
      codeSourcesOf(/new Date\(2000,/),
      [],
      'a month table is built from a throw-away Date'
    )
    assert.deepEqual(codeSourcesOf(/'January'/), ['lib/date.ts'], 'a second month-name table')
    assert.deepEqual(
      codeSourcesOf(
        /(?:const|function)\s+(?:entryDayLabel|weekdayLabel|rowDate|longDate|tabDate|monthTitle|monthLabel|monthName)\b/
      ),
      [],
      'a per-screen date label helper is back'
    )
    assert.ok(
      !/\bshortDay\b/.test(source('features/dashboard/expenditure.utils.ts')),
      'expenditure.utils has its own weekday + month + day formatter again (formatWeekdayMonthDay)'
    )
  }
)
await check('D3 rounding and gram constants live once in lib/units (roundTo, ounce, pound)', () => {
  assert.equal(constant(units, 'GRAMS_PER_OUNCE'), 28.3495)
  assert.equal(constant(units, 'GRAMS_PER_POUND'), 453.592)
  assert.deepEqual(codeSourcesOf(/\b28\.3495\b/), ['lib/units.ts'], 'ounce grams written twice')
  assert.deepEqual(codeSourcesOf(/\b453\.592\b/), ['lib/units.ts'], 'pound grams written twice')
  assert.deepEqual(codeSourcesOf(/export const roundTo\b/), ['lib/units.ts'], 'two roundTo')
  assert.deepEqual(codeSourcesOf(/const round[12] = /), [], 'a local round1 / round2 is back')
  assert.equal(need(units, 'roundTo')(1.005 + 1e-9, 2), 1.01)
})
await check(
  'D4 no dead exports: every exported name is referenced somewhere (src, scripts, middleware)',
  () => {
    const SPECIAL = new Set([
      'metadata',
      'generateMetadata',
      'viewport',
      'config',
      'default',
      'GET',
      'POST',
      'dynamic',
      'revalidate',
    ])
    const EXPORT =
      /^export\s+(?:declare\s+)?(?:async\s+)?(?:const|let|function\*?|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm
    const scriptsDir = new URL('../scripts/', import.meta.url)
    const files = new Map([
      ...allSources().map(([file, text]) => [`src/${file}`, text]),
      ...readdirSync(scriptsDir)
        .filter((name) => name.endsWith('.mjs'))
        .map((name) => [`scripts/${name}`, readFileSync(new URL(name, scriptsDir), 'utf8')]),
      ['middleware.ts', readFileSync(new URL('../middleware.ts', import.meta.url), 'utf8')],
    ])
    const dead = []
    for (const [file, text] of files) {
      if (!file.startsWith('src/')) continue
      if (
        /\/(page|layout|route|loading|error|not-found|template)\.tsx?$/.test(file) ||
        file.endsWith('/index.ts')
      )
        continue
      for (const match of text.matchAll(EXPORT)) {
        const name = match[1]
        if (SPECIAL.has(name)) continue
        const word = new RegExp(`(?<![\\w$.])${name.replace(/\$/g, '\\$')}(?![\\w$])`, 'g')
        const elsewhere = [...files].some(([other, body]) => other !== file && word.test(body))
        word.lastIndex = 0
        if (!elsewhere && (text.match(word) ?? []).length <= 1) dead.push(`${file} ${name}`)
      }
    }
    assert.deepEqual(dead, [], 'dead exports')
  }
)
await check(
  'D5 one set of date labels (lib/date + lib/week): the same text from every screen, no Intl, any time zone',
  async () => {
    const dateLib = await load('../src/lib/date.ts')
    const weekLib = await load('../src/lib/week.ts')
    const expenditure = await load('../src/features/dashboard/expenditure.utils.ts')
    const monthShort = constant(dateLib, 'MONTH_SHORT')
    const monthDay = need(dateLib, 'formatMonthDay')
    const monthYear = need(dateLib, 'formatMonthYear')
    const full = need(dateLib, 'formatDate')
    const weekdayMonthDay = need(weekLib, 'formatWeekdayMonthDay')
    const longDate = need(weekLib, 'formatLongDate')
    const relative = need(weekLib, 'relativeDayLabel')
    const range = need(expenditure, 'rangeLabel')
    assert.deepEqual(
      [...monthShort],
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    )
    assert.equal(constant(dateLib, 'MONTH_NAMES')[8], 'September')
    const zone = process.env.TZ
    try {
      for (const tz of [
        'America/New_York',
        'Asia/Ho_Chi_Minh',
        'Pacific/Auckland',
        'Europe/London',
      ]) {
        process.env.TZ = tz
        assert.equal(monthDay('2026-10-05'), 'Oct 5', tz)
        assert.equal(monthYear('2026-10-05'), 'October 2026', tz)
        assert.equal(monthYear('2026-10'), 'October 2026', tz)
        assert.equal(full('2026-10-20'), 'Oct 20, 2026', tz)
        assert.equal(weekdayMonthDay('2026-10-20'), 'Tue, Oct 20', tz)
        assert.equal(weekdayMonthDay('2026-03-08'), 'Sun, Mar 8', `${tz} DST day`)
        assert.equal(longDate('2026-10-20'), 'Tuesday, October 20, 2026', tz)
        assert.equal(longDate('2027-01-01'), 'Friday, January 1, 2027', tz)
        assert.equal(relative('2026-10-21', '2026-10-21'), 'Today', tz)
        assert.equal(relative('2026-10-20', '2026-10-21'), 'Yesterday', tz)
        assert.equal(relative('2026-10-22', '2026-10-21'), 'Tomorrow', tz)
        assert.equal(relative('2026-11-01', '2026-10-31'), 'Tomorrow', `${tz} month edge`)
        assert.equal(relative('2026-10-19', '2026-10-21'), 'Mon, Oct 19', tz)
        assert.equal(relative('2026-10-21', null), 'Wed, Oct 21', tz)
      }
    } finally {
      if (zone === undefined) delete process.env.TZ
      else process.env.TZ = zone
    }
    assert.equal(range('2026-10-14', '2026-10-20'), 'Oct 14 – 20, 2026')
    assert.equal(range('2026-10-28', '2026-11-03'), 'Oct 28, 2026 – Nov 3, 2026')
    assert.equal(range('2025-12-29', '2026-01-04'), 'Dec 29, 2025 – Jan 4, 2026')
  }
)
await check(
  'D6 one relative-day label and one display date (no second Today / Yesterday / Tomorrow, no formatDate alias)',
  () => {
    assert.deepEqual(codeSourcesOf(/'Yesterday'/), ['lib/week.ts'], 'a second relative-day label')
    assert.deepEqual(codeSourcesOf(/export const formatDate\b/), ['lib/date.ts'])
    assert.deepEqual(codeSourcesOf(/formatMonthDayYear/), [], 'the formatDate alias is back')
  }
)

await check(
  'X1 fields the BE always sends are required in the types and carry no dead fallback (food, log entry, note, trend changes)',
  () => {
    const detail = interfaceOf(source('features/foods/types/food.types.ts'), 'FoodDetail')
    for (const field of [
      'emoji: string | null',
      'iconKey: string | null',
      'nutrientsPer100g: Record<string, number | null>',
      'gramsPerMl: number | null',
    ])
      assert.ok(detail.includes(field), `FoodDetail needs "${field}"`)
    assert.ok(
      !/\b(emoji|iconKey|nutrientsPer100g|gramsPerMl)\?:/.test(detail),
      'FoodDetail field optional'
    )
    const entry = interfaceOf(source('features/food-log/types/food-log.types.ts'), 'FoodLogEntry')
    for (const field of [
      'emoji: string | null',
      'iconKey: string | null',
      'weightGrams: number | null',
    ])
      assert.ok(entry.includes(field), `FoodLogEntry needs "${field}"`)
    assert.ok(!/\b(emoji|iconKey|weightGrams)\?:/.test(entry), 'FoodLogEntry field optional')
    const lookup = codeOf(
      source('features/food-log/components/FoodLogPage/FoodDetail/food-detail.utils.ts')
    )
    assert.ok(
      !/nutrientsPer100g\?|nutrientsPer100g \?\?/.test(lookup),
      'dead nutrientsPer100g fallback'
    )
    assert.ok(
      !/note\.text\?/.test(source('features/food-log/components/FoodLogPage/NotesSection.tsx'))
    )
    assert.ok(!/data\.changes \?\?/.test(source('features/dashboard/pages/WeightTrendPage.tsx')))
  }
)
await check(
  'X2 Create Food and Food Detail read a food per-100 g amounts through ONE lookup, rounded by roundTo',
  async () => {
    const createFood = await load('../src/features/food-log/create-food.utils.ts')
    const foodDetail = await load(
      '../src/features/food-log/components/FoodLogPage/FoodDetail/food-detail.utils.ts'
    )
    const text = source('features/food-log/create-food.utils.ts')
    assert.ok(!/function sourcePer100g/.test(text), 'a second per-100 g lookup is back')
    assert.match(text, /nutrientPer100g\(source, key\)/)
    const food = {
      nutrition: { caloriesPer100g: 250, proteinPer100g: 10, carbsPer100g: 30, fatPer100g: 9 },
      nutrientsPer100g: { sodium: 120, zinc: null },
    }
    const lookup = need(foodDetail, 'nutrientPer100g')
    assert.equal(lookup(food, 'calories'), 250)
    assert.equal(lookup(food, 'sodium'), 120)
    assert.equal(lookup(food, 'zinc'), null)
    assert.equal(lookup(food, 'iron'), null)
    assert.equal(need(createFood, 'formatValue')(1.23456), '1.2346')
    assert.ok(!/Math\.round\(/.test(codeOf(text)), 'create-food rounds by hand')
  }
)

// ── V: lỗi bố cục tìm thấy khi quét 320 / 375 / 390 / 430 / 768 / 1280px ───────────────────────────────────────────────────────────────────

await check(
  'V1 the Changes / Relative-to rows keep each number on one line and shrink below 360px (kcal, kJ, kg, lb)',
  () => {
    for (const file of [
      'features/dashboard/components/ExpenditurePage/ExpenditureInsights.tsx',
      'features/dashboard/components/WeightTrendPage/WeightTrendInsights.tsx',
      'features/dashboard/components/EnergyBalancePage/EnergyBalanceInsights.tsx',
    ]) {
      const text = source(file)
      assert.ok(/max-\[359px\]:grid-cols-/.test(text), `${file}: row does not narrow below 360px`)
      assert.ok(/max-\[359px\]:text-sm/.test(text), `${file}: row text does not shrink below 360px`)
      assert.ok(
        /whitespace-nowrap tabular-nums/.test(text),
        `${file}: the number can wrap onto two lines`
      )
    }
    assert.ok(
      !/grid-cols-\[4rem_3\.5rem_1fr_auto\]/.test(
        source('features/dashboard/components/ExpenditurePage/ExpenditureInsights.tsx')
      ),
      'the sparkline column cannot shrink'
    )
  }
)
await check(
  'V2 a tile title fits its longest word: the font shrinks with the tile so "Monounsaturated Fat" is never clipped',
  async () => {
    const fit = await load('../src/lib/text-fit.ts')
    const wordFontSize = need(fit, 'wordFontSize')
    // em width of the longest word, measured in the browser at 18px font-medium
    const WORDS = [
      ['Monounsaturated Fat', 8.39],
      ['Polyunsaturated Fat', 7.72],
      ['Phenylalanine', 6.5],
    ]
    for (const width of [106, 134, 141, 165]) {
      for (const [title, em] of WORDS) {
        const css = wordFontSize(title, 1.125)
        const [, rem, cqw] = /^min\(([\d.]+)rem, ([\d.]+)cqw\)$/.exec(css) ?? []
        assert.ok(rem, `unexpected font-size ${css}`)
        const px = Math.min(Number(rem) * 16, (Number(cqw) * width) / 100)
        assert.ok(
          em * px <= width,
          `${title} at ${width}px: ${(em * px).toFixed(1)}px > ${width}px`
        )
      }
    }
    assert.equal(wordFontSize('Calories', 1.125).startsWith('min(1.125rem'), true)
    assert.ok(!/Infinity|NaN/.test(wordFontSize('', 1.125)), 'empty title')
    const tile = source('features/dashboard/components/DashboardPage/MetricTile.tsx')
    assert.ok(/wordFontSize\(title/.test(tile) && /@container/.test(tile), 'MetricTile ignores it')
  }
)

await check(
  'V3 the Weight Trend y axis always fits the visible data (never from 0), even for one point and in kg or lb',
  async () => {
    const series = await load('../src/features/dashboard/weight-trend-series.ts')
    const yAxis = need(series, 'yAxis')
    for (const values of [
      [78.3, 79.3, 79.2, 79.15], // MF ref 02: one week around 79
      [79.3], // a single point
      [172.6, 174.8], // lb
      [55, 140], // a long range
    ]) {
      const axis = yAxis(values)
      assert.ok(axis.min <= Math.min(...values) && axis.max >= Math.max(...values), 'data outside')
      assert.ok(axis.ticks.length >= 3, `too few ticks for ${values}`)
      assert.ok(
        axis.min > Math.min(...values) * 0.5 || (values.length > 1 && Math.min(...values) < 60),
        `${values}: the axis starts at ${axis.min} instead of fitting the data`
      )
    }
    assert.ok(
      yAxis([78.3, 79.3]).max - yAxis([78.3, 79.3]).min <= 3,
      'a one-week range is flattened'
    )
    assert.ok(yAxis([]).ticks.length > 1, 'empty chart has no axis')
    assert.ok(
      !/fit=\{/.test(source('features/dashboard/pages/WeightTrendPage.tsx')),
      'the page still switches the axis mode'
    )
  }
)

await check(
  'V4 the Weight Trend / Expenditure legends list only the layers drawn, markers come from the BE status, headers name their series',
  async () => {
    const exp = await load('../src/features/dashboard/expenditure-series.ts')
    const trend = await load('../src/features/dashboard/weight-trend-series.ts')
    const expLegend = need(exp, 'expLegend')
    const trendLegend = need(trend, 'trendLegend')
    const day = (status) => ({
      date: '2026-10-20',
      kcal: 2400,
      status,
      holding: status !== 'Updating',
      marker: status === 'Updating' ? 'circle' : 'square',
      change: 0,
    })
    assert.deepEqual(expLegend([]), { flux: false, line: false, holding: false, updating: false })
    assert.deepEqual(expLegend([day('Updating')]), {
      flux: false,
      line: true,
      holding: false,
      updating: true,
    })
    assert.equal(
      expLegend([day('Calibrating')]).holding,
      true,
      'Calibrating is a square like Holding'
    )
    assert.deepEqual(
      [
        expLegend([day('Holding'), day('Updating')]).holding,
        expLegend([day('Holding'), day('Updating')]).updating,
      ],
      [true, true]
    )
    assert.equal(
      need(
        exp,
        'toExpDay'
      )({
        date: 'd',
        expenditureKcal: 1,
        fluxLowKcal: 0,
        fluxHighKcal: 2,
        status: 'Updating',
        changeKcal: null,
      }).holding,
      false
    )
    assert.deepEqual(
      trendLegend(0, 7),
      { scale: false, trend: true },
      'Scale listed with no weigh-in'
    )
    assert.deepEqual(trendLegend(3, 7), { scale: true, trend: true })
    const wt = source('features/dashboard/pages/WeightTrendPage.tsx')
    assert.ok(/Average and Difference of Trend Weight/.test(wt) && /legend\.scale &&/.test(wt))
    const ex = source('features/dashboard/pages/ExpenditurePage.tsx')
    assert.ok(
      /Average and Difference of the Expenditure line/.test(ex) && /legend\.holding &&/.test(ex)
    )
  }
)

await check(
  'V5 the Expenditure Flux band is OFF in the shipped build (user has not approved the new Flux); the dormant code draws only a BE band (low ≤ line ≤ high), under the line; the axis fits line AND band; null band changes nothing',
  async () => {
    const chart = source('features/dashboard/components/ExpenditurePage/ExpenditureChart.tsx')
    const code = codeOf(chart)
    assert.match(code, /fluxSegments\(shown\)/, 'band is built from the visible days')
    assert.match(code, /fill-mf-flux-band/, 'band uses the Flux token')
    assert.ok(
      code.indexOf('data-flux-band') > 0 &&
        code.indexOf('data-flux-band') < code.indexOf('<polyline'),
      'band is drawn UNDER the line'
    )
    assert.match(chart, /Flux range is not a confidence interval\./)
    assert.match(code, /Flux Lower/)
    assert.match(
      code,
      /selected\.fluxLow !== null && selected\.fluxHigh !== null/,
      'tooltip only with a band'
    )
    assert.ok(
      !/fluxLow|fluxHigh/.test(
        codeOf(source('features/dashboard/components/DashboardPage/InsightCharts.tsx'))
      ),
      'the Dashboard tile keeps the plain line (G10)'
    )
    const css = source('app/theme.css')
    assert.equal((css.match(/--mf-flux-band:/g) ?? []).length, 2, 'token in light AND dark')
    assert.match(source('app/index.css'), /--color-mf-flux-band: var\(--mf-flux-band\)/)
    const exp = await load('../src/features/dashboard/expenditure-series.ts')
    // SHIPPED BEHAVIOUR: the band is OFF until the user approves the new Flux, even though the BE sends the fields
    assert.equal(exp.FLUX_BAND_ENABLED, false, 'Flux switch must stay off until approved')
    const sent = need(
      exp,
      'toExpDay'
    )({
      date: '2026-10-20',
      expenditureKcal: 2400,
      fluxLowKcal: 2300,
      fluxHighKcal: 2500,
      status: 'Updating',
      changeKcal: null,
    })
    assert.deepEqual(
      [sent.fluxLow, sent.fluxHigh],
      [null, null],
      'BE band must not reach the chart'
    )
    assert.equal(need(exp, 'expLegend')([sent]).flux, false, 'no Flux legend entry while off')
    assert.match(
      codeOf(source('features/dashboard/hooks/use-expenditure-detail.ts')),
      /toExpDay\(day\)/,
      'the hook must not pass a second argument (.map(toExpDay) would turn the Flux switch on)'
    )
    const expAxis = need(exp, 'expAxis')
    const at = (...kcal) =>
      kcal.map((value, i) => ({ date: `2026-10-${10 + i}`, kcal: value, holding: false }))
    const wide = expAxis(at(2300, 2500))
    assert.ok(wide.min <= 2300 && wide.max >= 2500 && wide.min > 1500, 'axis does not fit the line')
    const flat = expAxis(at(2429, 2429, 2429))
    assert.ok(flat.max - flat.min >= 2429 * 0.04 - 1, 'a flat line is squashed to a hair')
    assert.ok(flat.max - flat.min < 2429 * 0.5, 'a flat line gets a huge axis')
    assert.ok(expAxis(at(2429)).ticks.length >= 3, 'a single point has no axis')
    // band: axis contains every low / high with padding, a null band does not move it
    const banded = at(2420, 2425, 2430).map((day, i) => ({
      ...day,
      fluxLow: day.kcal - 30 - i * 5,
      fluxHigh: day.kcal + 40,
    }))
    const axis = expAxis(banded)
    assert.ok(axis.min <= 2420 - 30 && axis.max >= 2430 + 40, 'axis does not contain the band')
    assert.ok(
      axis.max - axis.min >= 2430 + 40 - (2420 - 40) + 20,
      'axis hugs the band with no padding'
    )
    assert.ok(axis.max - axis.min < 400, 'band axis is far wider than the band')
    const tall = expAxis(
      banded.map((day, i) => (i === 1 ? { ...day, fluxHigh: 2700, fluxLow: 2100 } : day))
    )
    assert.ok(tall.max >= 2700 && tall.min <= 2100, 'axis must reach each band edge on its own')
    const nulled = banded.map((day) => ({ ...day, fluxLow: null, fluxHigh: null }))
    assert.deepEqual(
      expAxis(nulled),
      expAxis(at(2420, 2425, 2430)),
      'null band must not move the axis'
    )
    assert.ok(
      expAxis(banded.slice(0, 1).map((day) => ({ ...day, fluxLow: 2300, fluxHigh: 2600 }))).ticks
        .length >= 3,
      'a single banded point has no axis'
    )
  }
)
await check(
  'V5b Flux fields are optional / nullable: only a valid BE band (low ≤ kcal ≤ high, both present) is kept; null / missing / broken = no band, no legend entry, nothing generated from the line',
  async () => {
    const types = source('features/dashboard/types/expenditure-series.types.ts')
    assert.match(types, /fluxLowKcal\?: number \| null/)
    assert.match(types, /fluxHighKcal\?: number \| null/)
    const exp = await load('../src/features/dashboard/expenditure-series.ts')
    const toExpDay = need(exp, 'toExpDay')
    const expLegend = need(exp, 'expLegend')
    const fluxSegments = need(exp, 'fluxSegments')
    const base = { date: '2026-10-20', expenditureKcal: 2400, status: 'Updating', changeKcal: null }
    const band = (low, high) => {
      const day = toExpDay({ ...base, fluxLowKcal: low, fluxHighKcal: high }, true)
      return [day.fluxLow, day.fluxHigh]
    }
    assert.deepEqual(band(2300, 2500), [2300, 2500], 'BE band is copied as is')
    assert.deepEqual(band(2400, 2400), [2400, 2400], 'a zero-width band is still a band')
    assert.deepEqual(band(null, null), [null, null])
    assert.deepEqual(toExpDay(base, true).fluxLow, null, 'missing fields = no band')
    assert.deepEqual(band(2300, null), [null, null], 'one-sided band is dropped')
    assert.deepEqual(
      band(2450, 2500),
      [null, null],
      'line below the band: contract broken, not drawn'
    )
    assert.deepEqual(
      band(2300, 2350),
      [null, null],
      'line above the band: contract broken, not drawn'
    )
    assert.deepEqual(band(Number.NaN, 2500), [null, null])
    const withNull = toExpDay({ ...base, fluxLowKcal: null, fluxHighKcal: null }, true)
    assert.deepEqual(withNull, toExpDay(base, true), 'null / missing Flux gives the same chart day')
    const day = (date, low, high) =>
      toExpDay({ ...base, date, fluxLowKcal: low, fluxHighKcal: high }, true)
    // legend: Flux Range listed only while a band is in the view
    assert.deepEqual(
      Object.keys(expLegend([withNull])).sort(),
      ['flux', 'holding', 'line', 'updating'],
      'legend keys'
    )
    assert.equal(expLegend([withNull]).flux, false, 'no band, no Flux legend entry')
    assert.equal(expLegend([withNull, day('2026-10-21', 2300, 2500)]).flux, true)
    // segments: ONE path per continuous run; null or a missing day splits, never joins across
    const d = (date, ok = true) => day(date, ok ? 2300 : null, ok ? 2500 : null)
    const names = (segments) => segments.map((segment) => segment.map((item) => item.date.slice(8)))
    assert.deepEqual(names(fluxSegments([])), [])
    assert.deepEqual(names(fluxSegments([d('2026-10-20', false), d('2026-10-21', false)])), [])
    assert.deepEqual(
      names(fluxSegments([d('2026-10-20'), d('2026-10-21'), d('2026-10-22')])),
      [['20', '21', '22']],
      'continuous run is one path'
    )
    assert.deepEqual(
      names(fluxSegments([d('2026-10-20'), d('2026-10-21', false), d('2026-10-22')])),
      [['20'], ['22']],
      'a null day splits the band'
    )
    assert.deepEqual(
      names(fluxSegments([d('2026-10-20'), d('2026-10-21'), d('2026-10-24'), d('2026-10-25')])),
      [
        ['20', '21'],
        ['24', '25'],
      ],
      'a gap of missing days splits the band (no false join)'
    )
    assert.deepEqual(
      names(fluxSegments([d('2026-10-20', false), d('2026-10-21'), d('2026-10-22', false)])),
      [['21']],
      'a lone banded day stays a segment'
    )
  }
)
await check(
  'V5c W / M bucket band = the BE policy (Average ± mean half-width of the days WITH a band, floor / ceil); no banded day = no band; low ≤ average ≤ high',
  async () => {
    const exp = await load('../src/features/dashboard/expenditure-series.ts')
    const toExpDay = need(exp, 'toExpDay')
    const averageExpDays = need(exp, 'averageExpDays')
    const mk = (date, kcal, low, high, status = 'Updating') =>
      toExpDay(
        {
          date,
          expenditureKcal: kcal,
          fluxLowKcal: low,
          fluxHighKcal: high,
          status,
          changeKcal: null,
        },
        true
      )
    // Mon 19 … Wed 21: a day without a band (Calibrating) mixed with banded Updating days
    const week = [
      mk('2026-10-19', 2000, null, null, 'Calibrating'),
      mk('2026-10-20', 2400, 2300, 2450),
      mk('2026-10-21', 2420, 2390, 2500),
      mk('2026-10-22', 2440, 2380, 2480),
    ]
    const [bucket] = averageExpDays(week, 'weekly', 'Monday')
    const average = (2000 + 2400 + 2420 + 2440) / 4
    const down = (100 + 30 + 60) / 3
    const up = (50 + 80 + 40) / 3
    assert.equal(bucket.fluxLow, Math.floor(average - down), 'BE floor(avg − mean(kcal − low))')
    assert.equal(bucket.fluxHigh, Math.ceil(average + up), 'BE ceil(avg + mean(high − kcal))')
    assert.ok(bucket.fluxLow <= bucket.kcal && bucket.kcal <= bucket.fluxHigh, 'low ≤ avg ≤ high')
    // no banded day in the bucket = no band (never a fake one)
    const none = averageExpDays(
      [mk('2026-10-19', 2000, null, null), mk('2026-10-20', 2100, null, null)],
      'weekly',
      'Monday'
    )
    assert.deepEqual([none[0].fluxLow, none[0].fluxHigh], [null, null])
    // daily is the BE band untouched; mixed-status buckets still get a band
    assert.equal(averageExpDays(week, 'daily', 'Monday')[1].fluxHigh, 2450)
    const mixed = averageExpDays(
      [mk('2026-10-20', 2400, 2300, 2450), mk('2026-10-21', 2400, 2350, 2500, 'Holding')],
      'weekly',
      'Monday'
    )[0]
    assert.equal(mixed.status, 'Mixed')
    assert.deepEqual([mixed.fluxLow, mixed.fluxHigh], [2325, 2475])
    // month buckets: separate buckets, separate answers
    const months = averageExpDays(
      [mk('2026-09-30', 2400, null, null), mk('2026-10-01', 2400, 2380, 2430)],
      'monthly',
      'Monday'
    )
    assert.deepEqual(
      months.map((m) => [m.fluxLow, m.fluxHigh]),
      [
        [null, null],
        [2380, 2430],
      ]
    )
  }
)
await check(
  'V10 Holding is explained where the user looks: reasons come from the BE codes (never inferred from counts), notice sits above the chart with a 44px action, the Dashboard tile says why in one line',
  async () => {
    const exp = await load('../src/features/dashboard/expenditure-series.ts')
    const holdingNoticeOf = need(exp, 'holdingNoticeOf')
    const base = {
      strategy: 'Holding',
      holdingReasonCodes: [],
      loggedDaysLast7: 6,
      weighInDaysLast7: 0,
      resumeInDays: null,
      resumeConsecutiveDays: null,
    }
    const notice = (patch) => holdingNoticeOf({ ...base, ...patch })
    assert.equal(holdingNoticeOf(null), null, 'no insights')
    assert.equal(notice({ strategy: 'Updating', holdingReasonCodes: ['NoRecentWeighIn'] }), null)
    assert.equal(notice({ strategy: null, holdingReasonCodes: ['MissingLogs'] }), null)
    // BE fills codes for Calibrating too (InitialCalibration); new BE codes 2026-10-26
    const cal = notice({
      strategy: 'Calibrating',
      holdingReasonCodes: ['InitialCalibration'],
      calibratingDaysLeft: 13,
    })
    assert.equal(cal.kind, 'Calibrating')
    assert.equal(cal.summary, 'Calibrating, 13 days left')
    assert.deepEqual(cal.actions, [], 'calibration is waiting, nothing to fix')
    assert.match(cal.reasons[0], /13 days left/)
    const two = notice({ holdingReasonCodes: ['NeedsTwoWeighIns'] })
    assert.equal(two.kind, 'Holding')
    assert.equal(two.summary, 'Needs 2 weigh-ins')
    assert.deepEqual(two.actions, ['weigh-in'])
    assert.match(two.reasons[0], /at least 2 weigh-ins in the last 21 days/)
    const between = notice({ holdingReasonCodes: ['NoLogsBetweenWeighIns'] })
    assert.deepEqual(between.actions, ['food'])
    assert.match(between.reasons[0], /no valid nutrition logs between your first and last weigh-in/)
    assert.deepEqual(
      notice({ holdingReasonCodes: ['NeedsTwoWeighIns', 'NoRecentWeighIn'] }).actions,
      ['weigh-in'],
      'one button per action'
    )
    assert.equal(
      notice({}),
      null,
      'Holding without a code: no guessed reason (counts are not read)'
    )
    assert.equal(notice({ holdingReasonCodes: ['SomethingNew'] }), null, 'unknown code is ignored')
    const weigh = notice({ holdingReasonCodes: ['NoRecentWeighIn'], minWeighInDaysPer7: 2 })
    assert.equal(weigh.summary, 'No weigh-in in 7 days')
    assert.deepEqual(weigh.actions, ['weigh-in'])
    assert.match(weigh.reasons[0], /No weigh-in in the last 7 days\. Updating needs at least 2\./)
    const logs = notice({
      holdingReasonCodes: ['MissingLogs'],
      loggedDaysLast7: 2,
      minLoggedDaysPer7: 5,
    })
    assert.equal(logs.summary, '2 of 7 days logged')
    assert.deepEqual(logs.actions, ['food'])
    assert.match(logs.reasons[0], /Only 2 of the last 7 days .* at least 5\./)
    assert.match(
      notice({ holdingReasonCodes: ['MissingLogs'] }).reasons[0],
      /at least 4\./,
      'older BE without the minimum keeps the documented 4'
    )
    const both = notice({
      holdingReasonCodes: ['NoRecentWeighIn', 'MissingLogs'],
      loggedDaysLast7: 3,
    })
    assert.equal(both.summary, 'No weigh-in in 7 days · 3 of 7 days logged')
    assert.deepEqual(both.actions, ['weigh-in', 'food'])
    const resuming = notice({ holdingReasonCodes: ['RecoveringLogs'] })
    assert.deepEqual(resuming.actions, ['food'])
    assert.deepEqual(resuming.reasons, [], 'no numbers from the BE = no sentence (nothing guessed)')
    assert.ok(resuming.summary.length > 0, 'the tile / notice still say something')
    // the resolver reads the BE codes only, never the counts
    const code = codeOf(source('features/dashboard/expenditure-series.ts'))
    const fn = code.slice(code.indexOf('export function holdingNoticeOf'))
    assert.ok(
      !/weighInDaysLast7\s*(===|==|<|>|!==)|loggedDaysLast7\s*(===|==|<|>|!==)/.test(
        fn.slice(0, 1200)
      )
    )
    // wiring
    const page = source('features/dashboard/pages/ExpenditurePage.tsx')
    assert.ok(
      page.indexOf('<HoldingNotice') > 0 &&
        page.indexOf('<HoldingNotice') < page.indexOf('<ExpandableChart'),
      'the notice is above the chart'
    )
    assert.match(page, /data\.holdingNotice && <HoldingNotice notice=\{data\.holdingNotice\} \/>/)
    const notice_ = source('features/dashboard/components/ExpenditurePage/HoldingNotice.tsx')
    assert.match(notice_, /routePath\.weight/)
    assert.match(notice_, /routePath\.foodLog/)
    assert.match(notice_, /h-11/, 'actions are 44px')
    assert.match(notice_, /role="status"/)
    assert.match(
      source('features/dashboard/hooks/use-expenditure-detail.ts'),
      /holdingNotice: holdingNoticeOf\(info \?\? null\)/
    )
    const tiles = source('features/dashboard/components/DashboardPage/DashboardTiles.tsx')
    assert.match(
      tiles,
      /note=\{\s*exp\.holdingNotice\s*\?/,
      'tile note comes from the BE-code notice'
    )
    assert.match(tiles, /`On hold: \$\{exp\.holdingNotice\.summary\}`/)
    assert.match(
      source('features/dashboard/components/DashboardPage/MetricTile.tsx'),
      /data-tile-note/
    )
  }
)
await check(
  'V6 FE D/W/M buckets are visualization-only: same boundaries as BE in any time zone, missing days are not 0 and not in the denominator',
  async () => {
    const trend = await load('../src/features/dashboard/weight-trend-series.ts')
    const balance = await load('../src/features/dashboard/energy-balance.utils.ts')
    const averageTrendDays = need(trend, 'averageTrendDays')
    const averageScaleDays = need(trend, 'averageScaleDays')
    const averageExpDays = need(expSeries, 'averageExpDays')
    const averageBalancePoints = need(balance, 'averageBalancePoints')
    const zone = process.env.TZ
    try {
      for (const tz of ['America/New_York', 'Asia/Ho_Chi_Minh', 'Pacific/Auckland']) {
        process.env.TZ = tz
        // Mon 2026-10-19 week with Wed 21st missing: mean of the 6 present days
        const dates = [
          '2026-10-19',
          '2026-10-20',
          '2026-10-22',
          '2026-10-23',
          '2026-10-24',
          '2026-10-25',
        ]
        const t = dates.map((date, i) => ({ date, trend: 80 - i }))
        const week = averageTrendDays(t, 'weekly', 'Monday')
        assert.equal(week.length, 1, `${tz}: one Monday week`)
        close(week[0].trend, mean(t.map((d) => d.trend)), `${tz} missing day counted as 0`)
        // partial first / last weeks stay separate buckets on the BE boundaries
        const edge = ['2026-10-17', '2026-10-18', '2026-10-19', '2026-10-25', '2026-10-26'].map(
          (date) => ({ date, trend: 70 })
        )
        assert.deepEqual(
          averageTrendDays(edge, 'weekly', 'Monday').map((d) => d.date),
          ['2026-10-12', '2026-10-19', '2026-10-26'],
          `${tz} Monday weeks start at the BE week start`
        )
        assert.deepEqual(
          averageTrendDays(edge, 'weekly', 'Sunday').map((d) => d.date),
          ['2026-10-11', '2026-10-18', '2026-10-25'],
          `${tz} Sunday weeks`
        )
        // the Scale layer only ever averages REAL weigh-ins
        const scale = averageScaleDays(
          [
            { date: '2026-10-19', value: 80 },
            { date: '2026-10-23', value: 82 },
          ],
          'weekly',
          'Monday'
        )
        close(scale[0].value, 81, `${tz} scale mean`)
        // Expenditure: a month bucket averages kcal of the present days only
        const e = ['2026-10-01', '2026-10-15', '2026-10-31'].map((date, i) => ({
          date,
          kcal: 2000 + i * 100,
          holding: false,
          status: 'Updating',
          change: null,
        }))
        close(averageExpDays(e, 'monthly', 'Monday')[0].kcal, 2100, `${tz} month mean`)
        // Energy Balance: null (not logged) and incomplete days are not in the denominator
        const b = [
          { date: '2026-10-19', consumed: 2000, baseline: 2500, diff: -500 },
          { date: '2026-10-20', consumed: null, baseline: 2500, diff: null },
          { date: '2026-10-21', consumed: 900, baseline: 2500, diff: -1600, incomplete: true },
        ]
        const bucket = averageBalancePoints(b, 'weekly')[0]
        close(bucket.consumed, 2000, `${tz} null / incomplete counted`)
        close(bucket.baseline, 2500, `${tz} baseline`)
      }
    } finally {
      if (zone === undefined) delete process.env.TZ
      else process.env.TZ = zone
    }
  }
)

await check(
  'V7 a W / M bucket shows a marker only when every day WITH DATA agrees; mixed = no marker; missing days are neither status; D = BE status',
  async () => {
    const averageExpDays = need(expSeries, 'averageExpDays')
    const toExpDay = need(expSeries, 'toExpDay')
    const day = (date, status) =>
      toExpDay({
        date,
        expenditureKcal: 2400,
        fluxLowKcal: 0,
        fluxHighKcal: 0,
        status,
        changeKcal: null,
      })
    // D: the BE status straight through
    assert.equal(day('2026-10-20', 'Updating').marker, 'circle')
    assert.equal(day('2026-10-20', 'Holding').marker, 'square')
    assert.equal(
      day('2026-10-20', 'Calibrating').marker,
      'square',
      'Calibrating keeps its own square'
    )
    assert.equal(day('2026-10-20', 'Whatever').marker, null, 'an unknown status draws nothing')
    const week = (statuses, skip = []) =>
      averageExpDays(
        statuses.flatMap((status, i) =>
          skip.includes(i) ? [] : [day(`2026-10-${19 + i}`, status)]
        ),
        'weekly',
        'Monday'
      )[0]
    assert.equal(week(Array(7).fill('Updating')).marker, 'circle')
    assert.equal(week(Array(7).fill('Holding')).marker, 'square')
    assert.equal(
      week(Array(7).fill('Calibrating')).marker,
      'square',
      'all Calibrating = same as today'
    )
    const mixed = week([
      'Updating',
      'Updating',
      'Holding',
      'Updating',
      'Holding',
      'Updating',
      'Updating',
    ])
    assert.equal(mixed.marker, null, 'a mixed bucket must not get a marker')
    assert.equal(mixed.status, 'Mixed')
    assert.deepEqual([mixed.updatingDays, mixed.otherDays, mixed.days], [5, 2, 7])
    assert.equal(
      week(['Updating', 'Holding', 'Calibrating']).marker,
      null,
      'Holding + Calibrating differ'
    )
    // a missing day is neither Updating nor Holding: the remaining days still agree
    const gap = week(Array(7).fill('Updating'), [2, 3])
    assert.equal(gap.marker, 'circle')
    assert.equal(gap.days, 5)
    assert.equal(
      averageExpDays([day('2026-10-19', 'Whatever')], 'weekly', 'Monday')[0].marker,
      null
    )
    // the average never depends on the markers
    assert.equal(mixed.kcal, 2400)
    const exp = await load('../src/features/dashboard/expenditure-series.ts')
    const legend = need(exp, 'expLegend')
    assert.deepEqual([legend([mixed]).holding, legend([mixed]).updating], [false, false])
    const chart = source('features/dashboard/components/ExpenditurePage/ExpenditureChart.tsx')
    assert.ok(/marker === null\) return null/.test(chart) && /Mixed/.test(chart), 'chart / tooltip')
  }
)
await check(
  'V8 W / M points sit at the BE bucket start with the full range and the number of days with data (Weight Trend, Expenditure, Energy Balance)',
  async () => {
    const utils = await load('../src/features/dashboard/expenditure.utils.ts')
    const bucketEnd = need(utils, 'bucketEnd')
    const bucketLabel = need(utils, 'bucketLabel')
    const averageTrendDays = need(trendSeries, 'averageTrendDays')
    const averageExpDays = need(expSeries, 'averageExpDays')
    const averageBalancePoints = need(energyBalance, 'averageBalancePoints')
    const zone = process.env.TZ
    try {
      for (const tz of ['America/New_York', 'Asia/Ho_Chi_Minh', 'Pacific/Auckland']) {
        process.env.TZ = tz
        assert.equal(bucketEnd('2026-10-19', 'weekly'), '2026-10-25', tz)
        assert.equal(bucketEnd('2026-12-28', 'weekly'), '2027-01-03', `${tz} year boundary`)
        assert.equal(bucketEnd('2026-02-01', 'monthly'), '2026-02-28', `${tz} Feb`)
        assert.equal(bucketEnd('2028-02-01', 'monthly'), '2028-02-29', `${tz} leap`)
        assert.equal(bucketEnd('2026-12-01', 'monthly'), '2026-12-31', `${tz} Dec`)
        assert.equal(bucketEnd('2026-10-20', 'daily'), '2026-10-20')
        assert.equal(
          bucketLabel('2026-10-19', '2026-10-25', 6),
          'Oct 19 – 25, 2026 · 6 days with data'
        )
        assert.equal(
          bucketLabel('2026-12-28', '2027-01-03', 1),
          'Dec 28, 2026 – Jan 3, 2027 · 1 day with data'
        )
        assert.equal(bucketLabel('2026-10-20', '2026-10-20', 1), 'Tue, Oct 20')
        // a partial first month: the point sits on the 1st, only real days are averaged
        const t = [
          { date: '2026-10-20', trend: 80 },
          { date: '2026-10-31', trend: 82 },
          { date: '2026-11-02', trend: 90 },
        ]
        const month = averageTrendDays(t, 'monthly', 'Monday')
        assert.deepEqual(
          month.map((d) => [d.date, d.end, d.days]),
          [
            ['2026-10-01', '2026-10-31', 2],
            ['2026-11-01', '2026-11-30', 1],
          ]
        )
        const e = [
          {
            date: '2026-12-30',
            kcal: 2000,
            holding: false,
            status: 'Updating',
            marker: 'circle',
            change: null,
          },
          {
            date: '2027-01-01',
            kcal: 2200,
            holding: false,
            status: 'Updating',
            marker: 'circle',
            change: null,
          },
        ]
        assert.deepEqual(
          averageExpDays(e, 'weekly', 'Monday').map((d) => [d.date, d.end, d.days]),
          [['2026-12-28', '2027-01-03', 2]]
        )
        const b = [
          { date: '2026-10-20', consumed: 2000, baseline: 2500, diff: -500 },
          { date: '2026-10-21', consumed: null, baseline: 2500, diff: null },
        ]
        const bucket = averageBalancePoints(b, 'monthly')[0]
        assert.deepEqual([bucket.date, bucket.end, bucket.days], ['2026-10-01', '2026-10-31', 1])
        // switching D -> W -> M -> D leaves the daily series untouched
        const daily = [...t]
        averageTrendDays(daily, 'weekly', 'Monday')
        averageTrendDays(daily, 'monthly', 'Monday')
        assert.deepEqual(averageTrendDays(daily, 'daily', 'Monday'), t)
      }
    } finally {
      if (zone === undefined) delete process.env.TZ
      else process.env.TZ = zone
    }
  }
)

await check(
  'E1 Dashboard card / tile, Energy Balance detail and Expenditure use the BE numbers on a mixed set (0 kcal, fasting, incomplete, unlogged); FE keeps no rule of its own',
  async () => {
    const balance = await load('../src/features/dashboard/energy-balance.utils.ts')
    const fromSeriesDay = need(balance, 'fromSeriesDay')
    const summarize = need(balance, 'summarizeBalance')
    const averageBalancePoints = need(balance, 'averageBalancePoints')
    // BE series for one week: BE decides which days count (vs* null = not counted)
    const day = (date, calories, vsExp, extra = {}) => ({
      date,
      caloriesKcal: calories,
      expenditureKcal: 2500,
      targetKcal: 2400,
      vsExpenditureKcal: vsExp,
      vsTargetKcal: vsExp === null ? null : vsExp + 100,
      isFasting: false,
      isIncomplete: false,
      ...extra,
    })
    const days = [
      day('2026-10-19', 2000, -500), // normal
      day('2026-10-20', 0, null), // 0 kcal, not fasting: visible, NOT counted (BE)
      day('2026-10-21', 0, -2500, { isFasting: true }), // fasting 0 kcal counts
      day('2026-10-22', 900, -1600, { isIncomplete: true }), // incomplete: never counted
      day('2026-10-23', null, null), // unlogged
      day('2026-10-24', 2300, -200),
    ]
    // the BE summary for the same days (BE rule: mean of the counted days)
    const counted = [-500, -2500, -200]
    const beAvg = Math.round(counted.reduce((a, b) => a + b, 0) / counted.length)
    const points = days.map((d) => fromSeriesDay(d, 'expenditure'))
    const detail = summarize(points, 'expenditure')
    assert.equal(detail.value, beAvg, 'Energy Balance header differs from the BE average')
    assert.equal(detail.label, 'Deficit')
    const targets = summarize(
      days.map((d) => fromSeriesDay(d, 'targets')),
      'targets'
    )
    assert.equal(targets.value, Math.round((-400 - 2400 - 100) / 3), 'targets header')
    const week = averageBalancePoints(points, 'weekly')[0]
    assert.equal(Math.round(week.diff), beAvg, 'a weekly bucket differs from the BE average')
    assert.equal(week.days, 3, 'logged-day count: 0 kcal / incomplete / unlogged are not counted')
    // the weekly BAR average uses the same counted set: the excluded 0 kcal day and the incomplete day do not pull it down
    close(week.consumed, (2000 + 0 + 2300) / 3, 'weekly bar average')
    // no counted day at all -> Waiting, never 0 from a rule of ours
    assert.equal(
      summarize([fromSeriesDay(day('2026-10-20', 0, null), 'expenditure')], 'expenditure').value,
      null
    )
    // the code has no isFasting / zero-kcal rule of its own
    const utils = source('features/dashboard/energy-balance.utils.ts')
    assert.ok(
      !/isFasting|caloriesKcal === 0|consumed === 0|consumed - |\.consumed - /.test(codeOf(utils)),
      'FE rule in energy-balance.utils'
    )
    // Dashboard card + tile read the BE summary / insights, the FE energyBalance() average is gone
    const card = source('features/dashboard/components/DashboardPage/EnergyBalanceCard.tsx')
    assert.ok(
      /summary\?\.avgCaloriesVsTargetKcal/.test(card) &&
        /summary\?\.avgCaloriesVsExpenditureKcal/.test(card) &&
        !/summary\?\.avgCaloriesKcal/.test(card) &&
        /avgVsExpenditureKcal/.test(card),
      'card does not read the BE summary'
    )
    assert.ok(!/isLogged|reduce\(/.test(codeOf(card)), 'the card averages in FE')
    assert.ok(
      !/export function energyBalance\b/.test(source('features/dashboard/dashboard.utils.ts')),
      'old FE average'
    )
    const tiles = source('features/dashboard/components/DashboardPage/DashboardTiles.tsx')
    assert.ok(
      /balance\.changes\.find\(\(item\) => item\.days === INSIGHT_DAYS\)/.test(tiles) &&
        !/summarizeBalance/.test(tiles),
      'tile does not use the BE 7-day row'
    )
    // Expenditure counts come from BE too (insights loggedDaysLast7, series status)
    assert.ok(
      !/isLogged|caloriesConsumed/.test(codeOf(source('features/dashboard/expenditure-series.ts')))
    )
  }
)

await check(
  'V9 Steps, body metrics and Nutrient detail W / M points also sit at the BE bucket start with the range and days with data',
  async () => {
    const averageSteps = need(stepsUtils, 'averageSteps')
    const averageMetric = need(metricUtils, 'averageMetric')
    const averageNutrientDays = need(nutrientUtils, 'averageNutrientDays')
    const steps = averageSteps(
      [
        { date: '2026-10-21', steps: 4000 },
        { date: '2026-10-23', steps: 6000 },
      ],
      'weekly',
      'Monday'
    )
    assert.deepEqual(
      [steps[0].date, steps[0].end, steps[0].days, steps[0].steps],
      ['2026-10-19', '2026-10-25', 2, 5000]
    )
    const metric = averageMetric(
      [
        { date: '2026-10-21', value: 40 },
        { date: '2026-11-02', value: 42 },
      ],
      'monthly',
      'Monday'
    )
    assert.deepEqual(
      metric.map((p) => [p.date, p.end, p.days]),
      [
        ['2026-10-01', '2026-10-31', 1],
        ['2026-11-01', '2026-11-30', 1],
      ]
    )
    const point = (date, amount, extra = {}) => ({
      date,
      amount,
      floor: null,
      target: 80,
      ceiling: null,
      goalKind: 'Target',
      isIncomplete: false,
      ...extra,
    })
    const nutrient = averageNutrientDays(
      [
        point('2026-10-19', 60),
        point('2026-10-20', null),
        point('2026-10-21', 90, { isIncomplete: true }),
        point('2026-10-22', 80),
      ],
      'weekly',
      'Monday'
    )[0]
    assert.deepEqual(
      [nutrient.date, nutrient.end, nutrient.days, nutrient.amount],
      ['2026-10-19', '2026-10-25', 2, 70]
    )
  }
)

await check(
  'O1 the onboarding TDEE explanation follows the BE method (Cunningham + bodyFatPercent, Mifflin-St Jeor), no Katch-McArdle left',
  async () => {
    const chat = await load('../src/features/onboarding/estimate-chat.utils.ts')
    const buildChatNodes = need(chat, 'buildChatNodes')
    const text = (estimate) => JSON.stringify(buildChatNodes(2500, estimate))
    const base = { tdeeKcal: 2500, bmrKcal: 1800, weightKg: 80 }
    const cunningham = text({ ...base, method: 'Cunningham', bodyFatPercent: 18 })
    assert.ok(/Cunningham equation \(BMR ≈ 1800 kcal\)/.test(cunningham), 'Cunningham sentence')
    assert.ok(/about 18% body fat/.test(cunningham), 'the body fat the BE used is not shown')
    assert.ok(
      /the body fat level you chose/.test(
        text({ ...base, method: 'Cunningham', bodyFatPercent: null })
      )
    )
    assert.ok(
      /Mifflin-St Jeor formula/.test(
        text({ ...base, method: 'MifflinStJeor', bodyFatPercent: null })
      )
    )
    assert.ok(!/Katch/i.test(cunningham), 'Katch-McArdle text')
    assert.ok(
      !/KatchMcArdle|Katch-McArdle/.test(
        source('features/onboarding/types/onboarding.types.ts') +
          source('features/onboarding/estimate-chat.utils.ts')
      )
    )
    assert.match(
      source('features/onboarding/types/onboarding.types.ts'),
      /bodyFatPercent: number \| null/
    )
  }
)

// ── Y: số dẫn xuất BE đang dựng lại (GET /derived-data/status) ───────────────────────────────────────────────────────────────────────────

/** Client giả: ghi lại invalidate / setQueryData, giữ dữ liệu theo khoá JSON. */
const fakeClient = (initial) => {
  const data = new Map(initial ? [[JSON.stringify(['derived-data', 'status']), initial]] : [])
  const invalidated = []
  const cancelled = []
  const filters = []
  const refetched = []
  const removed = []
  return {
    invalidated,
    cancelled,
    filters,
    refetched,
    removed,
    data,
    invalidateQueries: (filter, options) => {
      invalidated.push(JSON.stringify(filter.queryKey))
      filters.push({ ...filter, options })
      return Promise.resolve()
    },
    cancelQueries: ({ queryKey }) => {
      cancelled.push(JSON.stringify(queryKey))
      return Promise.resolve()
    },
    refetchQueries: (filter) => {
      refetched.push(filter)
      return Promise.resolve()
    },
    removeQueries: (filter) => removed.push(filter),
    getQueryData: (queryKey) => data.get(JSON.stringify(queryKey)),
    setQueryData: (queryKey, value) =>
      data.set(
        JSON.stringify(queryKey),
        typeof value === 'function' ? value(data.get(JSON.stringify(queryKey))) : value
      ),
  }
}
const status = (state, extra = {}) => ({
  state,
  fromDate: null,
  toDate: null,
  attempt: 0,
  updatedAt: null,
  ...extra,
})

await check(
  'Y1 derived-data status: Ready path, Updating polls then refetches once on Ready, Failed -> retry, network error is not Failed',
  async () => {
    const lib = await load('../src/features/derived-data/derived-data.utils.ts')
    const gateOf = need(lib, 'gateOf')
    const pollInterval = need(lib, 'pollInterval')
    const onStatusChange = need(lib, 'onStatusChange')
    const readDerivedStatus = need(lib, 'readDerivedStatus')
    const retryDerived = need(lib, 'retryDerived')
    const refreshDerivedStatus = need(lib, 'refreshDerivedStatus')
    const KEYS = constant(lib, 'DERIVED_KEYS').map((k) => JSON.stringify(k))
    // gate + polling
    assert.equal(gateOf(status('Ready')), 'ready')
    assert.equal(gateOf(status('Updating')), 'updating')
    assert.equal(gateOf(status('Failed')), 'failed')
    assert.equal(
      gateOf(undefined),
      'ready',
      'no read yet / network error before any read must not hide the numbers'
    )
    assert.equal(pollInterval(status('Updating')), constant(lib, 'POLL_MS'))
    assert.ok(constant(lib, 'POLL_MS') >= 3000 && constant(lib, 'POLL_MS') <= 5000)
    assert.equal(pollInterval(status('Ready')), false)
    assert.equal(pollInterval(status('Failed')), false, 'never polls forever after Failed')
    // Ready path: nothing to refetch
    const ready = fakeClient(status('Ready'))
    onStatusChange(ready, status('Ready'), status('Ready'))
    assert.deepEqual(ready.invalidated, [])
    // Updating -> Ready: every derived key once, raw log / weights untouched
    const done = fakeClient()
    onStatusChange(done, status('Updating'), status('Ready'))
    assert.deepEqual(done.invalidated, KEYS)
    assert.ok(!done.invalidated.includes(JSON.stringify(['food-log'])), 'raw log refetched')
    // staying Updating, or Updating -> Failed: no refetch of stale numbers
    for (const [a, b] of [
      ['Updating', 'Updating'],
      ['Updating', 'Failed'],
      ['Ready', 'Updating'],
    ]) {
      const c = fakeClient()
      onStatusChange(c, status(a), status(b))
      assert.deepEqual(c.invalidated, [], `${a} -> ${b}`)
    }
    // the shared reader compares with the last known status (page refresh / second tab read the same key)
    const polled = fakeClient(status('Updating'))
    await readDerivedStatus(polled, {
      status: async () => status('Ready'),
      retry: async () => null,
    })
    assert.deepEqual(polled.invalidated, KEYS, 'Updating -> Ready through the poller')
    const fresh = fakeClient()
    await readDerivedStatus(fresh, {
      status: async () => status('Updating'),
      retry: async () => null,
    })
    assert.deepEqual(
      fresh.invalidated,
      [],
      'first read mid-update (page refresh) refetches nothing yet'
    )
    // network error on the status call propagates as an error and does not turn into Failed
    await assert.rejects(
      readDerivedStatus(fakeClient(status('Updating')), {
        status: async () => {
          throw new Error('Network Error')
        },
        retry: async () => null,
      }),
      /Network Error/
    )
    // Failed -> retry success: store the BE answer, refetch when it is already Ready
    const failed = fakeClient(status('Failed', { attempt: 3 }))
    const next = await retryDerived(failed, {
      status: async () => null,
      retry: async () => status('Ready'),
    })
    assert.equal(next.state, 'Ready')
    assert.equal(failed.getQueryData(['derived-data', 'status']).state, 'Ready')
    assert.deepEqual(failed.invalidated, KEYS)
    // retry -> Updating: keep polling, no stale refetch
    const again = fakeClient(status('Failed'))
    await retryDerived(again, { status: async () => null, retry: async () => status('Updating') })
    assert.equal(gateOf(again.getQueryData(['derived-data', 'status'])), 'updating')
    assert.deepEqual(again.invalidated, [])
    // retry failure: Failed stays (no infinite loading), the error reaches the caller
    const stuck = fakeClient(status('Failed'))
    await assert.rejects(
      retryDerived(stuck, {
        status: async () => null,
        retry: async () => {
          throw new Error('retry failed')
        },
      }),
      /retry failed/
    )
    assert.equal(gateOf(stuck.getQueryData(['derived-data', 'status'])), 'failed')
    // a write asks for ONE status read
    const write = fakeClient()
    refreshDerivedStatus(write)
    assert.deepEqual(write.invalidated, [JSON.stringify(['derived-data', 'status'])])
  }
)
await check(
  'Y2 [wiring] the shared status query reads on mount / focus, pauses in the background; writes ask for it; derived screens dim (Updating) or show ErrorState (Failed), never present stale numbers as final',
  async () => {
    const hook = source('features/derived-data/hooks/use-derived-data.ts')
    for (const option of [
      /refetchOnMount: 'always'/,
      /refetchOnWindowFocus: true/,
      /refetchIntervalInBackground: false/,
      /staleTime: 0/,
      /refetchInterval:/,
    ])
      assert.match(hook, option)
    assert.match(hook, /derivedStatusKey/, 'one shared key for every component and tab of the page')
    // every derived-affecting write refreshes the status
    const logHooks = source('features/food-log/hooks/use-food-log.ts')
    assert.match(
      bodyOf(logHooks, 'export function invalidateLogData', '\n}'),
      /refreshDerivedStatus\(queryClient\)/
    )
    assert.match(
      source('features/weight/hooks/use-weights.ts'),
      /refreshDerivedStatus\(queryClient\)/
    )
    // derived screens
    const pages = [
      'features/dashboard/pages/ExpenditurePage.tsx',
      'features/dashboard/pages/WeightTrendPage.tsx',
      'features/dashboard/pages/EnergyBalancePage.tsx',
      'features/dashboard/pages/GoalProgressPage.tsx',
      'features/dashboard/pages/DashboardPage.tsx',
      'features/dashboard/components/DashboardPage/DashboardTiles.tsx',
    ]
    for (const file of pages) {
      const text = source(file)
      assert.match(text, /useDerivedGate\(\)/, `${file} ignores the derived-data status`)
      assert.match(text, /derived\.gate === 'failed'/, `${file}: Failed state`)
      assert.match(
        text,
        /derived\.gate === 'updating'|dimWhile\(derived\.gate\)/,
        `${file}: Updating state`
      )
      assert.ok(
        !/derived\.gate === 'updating' \|\|/.test(text),
        `${file}: swaps old data for a skeleton while Updating`
      )
      assert.match(text, /DerivedFailed/, `${file}: ErrorState with Try again`)
    }
    const tiles = source('features/dashboard/components/DashboardPage/DashboardTiles.tsx')
    assert.ok(
      (tiles.match(/useDerivedGate\(\)/g) ?? []).length >= 4,
      'a derived tile ignores the status'
    )
    const failed = source('features/derived-data/components/DerivedFailed.tsx')
    assert.ok(
      /ErrorState/.test(failed) && /variant="inline"/.test(failed),
      'new widget instead of the ErrorState'
    )
  }
)

// ── P: truy vấn chưa về thì thẻ / ô hiện khung xám, KHÔNG hiện "—" / "N/A" / "0/7" (BE lạnh trả mỗi truy vấn sau 1 – 3s) ──────────────────

const ALL_IDLE = {
  macros: false,
  weights: false,
  recentWeights: false,
  daily: false,
  energyBalance: false,
  dayLog: false,
  nutrients: false,
  steps: false,
  periods: false,
  bodyFat: false,
  expenditure: false,
}

await check(
  'P1 a Dashboard tile / card whose source query is pending is a skeleton, never "—", "N/A" or "0/7"',
  async () => {
    const pend = await load('../src/features/dashboard/dashboard-pending.ts')
    const tilePending = need(pend, 'tilePending')
    const focusPending = need(pend, 'focusPending')
    const groups = await load('../src/features/dashboard/nutrient-catalog.ts')
    const keys = constant(groups, 'NUTRIENT_GROUPS').flatMap((group) =>
      group.nutrients.map((nutrient) => nutrient.key)
    )
    for (const key of [
      ...keys,
      'weighIn',
      'scaleWeight',
      'foodLogging',
      'steps',
      'period',
      'bodyFat',
    ])
      assert.equal(tilePending(key, ALL_IDLE), false, `${key} is pending with nothing pending`)
    const only = (source) => ({ ...ALL_IDLE, [source]: true })
    assert.equal(tilePending('weighIn', only('weights')), true)
    assert.equal(tilePending('scaleWeight', only('recentWeights')), true)
    assert.equal(
      tilePending('scaleWeight', only('weights')),
      false,
      'the Scale Weight card reads GET /weights?limit=7, not the 365-day window'
    )
    assert.equal(
      tilePending('foodLogging', only('daily')),
      true,
      'Food Logging shows 0/7 while pending'
    )
    assert.equal(tilePending('steps', only('steps')), true)
    assert.equal(tilePending('period', only('periods')), true)
    assert.equal(tilePending('bodyFat', only('bodyFat')), true)
    for (const key of ['calories', 'protein', 'fat', 'carbs', 'macros'])
      assert.equal(tilePending(key, only('dayLog')), true, `${key} ignores the day log`)
    assert.equal(tilePending('macros', only('macros')), true)
    assert.equal(
      tilePending('calories', only('nutrients')),
      false,
      'calories wait for GET /nutrients'
    )
    for (const key of keys.filter(
      (k) => !['calories', 'protein', 'fat', 'carbs', 'macros', 'fiber'].includes(k)
    ))
      assert.equal(tilePending(key, only('nutrients')), true, `${key} ignores GET /nutrients`)
    assert.equal(focusPending('daily', only('dayLog')), true, 'Daily Nutrition shows a target "—"')
    assert.equal(focusPending('energy', only('energyBalance')), true, 'Energy Balance shows N/A')
    assert.equal(focusPending('energy', only('expenditure')), true)
    assert.equal(focusPending('energy', only('dayLog')), true)
    assert.equal(focusPending('daily', ALL_IDLE) || focusPending('energy', ALL_IDLE), false)
  }
)
await check(
  'P2 [wiring] Dashboard, Nutrition, body-metric tiles, Food Log summary and Nutrient Today read pending, not an empty value',
  () => {
    const layout = source('features/dashboard/components/DashboardPage/LayoutSection.tsx')
    assert.ok(
      (layout.match(/loading=\{tilePending\(key, data\.pending\)\}/g) ?? []).length >= 7,
      'LayoutSection tiles do not all take loading from tilePending'
    )
    const page = source('features/dashboard/pages/DashboardPage.tsx')
    assert.ok(/focusPending\('energy', data\.pending\)/.test(page), 'Energy Balance card')
    assert.ok(/focusPending\('daily', data\.pending\)/.test(page), 'Daily Nutrition card')
    assert.ok(
      /pending=\{data\.pending\}/.test(source('features/dashboard/pages/NutritionDetailPage.tsx'))
    )
    assert.ok(
      /pending\b[\s\S]*tilePending/.test(
        source('features/dashboard/components/DashboardPage/NutrientGroupSection.tsx')
      )
    )
    const body = source('features/dashboard/components/DashboardPage/BodyMetricTiles.tsx')
    assert.ok(
      (body.match(/loading=\{[^}]*isPending/g) ?? []).length >= 4,
      'body-metric tiles do not read isPending'
    )
    assert.ok(
      /if \(pending\) return <Skeleton/.test(
        source('features/food-log/components/FoodLogPage/MacroSummary.tsx')
      ),
      'Food Log summary prints 0/-- while the day is pending'
    )
    assert.ok(
      /summaryPending=\{day\.isPending/.test(source('features/food-log/pages/FoodLogPage.tsx'))
    )
    assert.ok(
      /loading=\{day\.isPending\}/.test(
        source('features/nutrient-detail/pages/NutrientDetailPage.tsx')
      ),
      'Nutrient Today card'
    )
  }
)

// ── M: mọi mutation làm mới đúng dữ liệu BE suy ra từ nó (cache mặc định giữ 5 phút nên mỗi chỗ quên là một màn sai số) ───────────────────────────

/** Chạy `run(client)` với một client chỉ ghi lại các khoá bị invalidate (JSON). */
const invalidated = (run) => {
  const keys = []
  run({
    invalidateQueries: ({ queryKey }) => {
      keys.push(JSON.stringify(queryKey))
      return Promise.resolve()
    },
    cancelQueries: () => Promise.resolve(),
    refetchQueries: () => Promise.resolve(),
    setQueryData: () => undefined,
  })
  return keys
}
const hasKeys = (keys, ...expected) => {
  for (const key of expected)
    assert.ok(
      keys.includes(JSON.stringify(key)),
      `${JSON.stringify(key)} is not invalidated (${keys.join(' ')})`
    )
}

await check(
  'M1 saving / deleting Full Body also refreshes the Body Fat page, every measurement page and their Dashboard tiles',
  () => {
    hasKeys(
      invalidated(need(bodyHooks, 'invalidateFullBodyData')),
      ['body-metrics'],
      ['visual-body-fat'],
      ['measurements']
    )
    const text = source('features/shortcuts/hooks/use-body-metrics.ts')
    for (const hook of ['useSaveFullBody', 'useDeleteFullBody'])
      assert.ok(
        bodyOf(text, `export const ${hook}`, 'export const ').includes('invalidateFullBodyData('),
        `${hook} does not use invalidateFullBodyData`
      )
  }
)
await check(
  'M2 creating / editing / deleting a custom food also refreshes the Library tab and Favorites',
  () => {
    hasKeys(
      invalidated(need(foodHooks, 'invalidateFoodData')),
      ['foods'],
      ['food-log', 'library'],
      ['food-favorites']
    )
    const text = source('features/foods/hooks/use-foods.ts')
    assert.ok(
      bodyOf(text, 'const useFoodMutation', 'export const useCreateFood').includes(
        'invalidateFoodData('
      ),
      'useFoodMutation does not use invalidateFoodData'
    )
  }
)
await check(
  'M3 a profile save that changes what BE calculates from (birth date, gender, height, activity, week start, time zone) refreshes the derived data; units and names do not',
  () => {
    const affects = need(profileHooks, 'profileChangeAffectsData')
    for (const payload of [
      {},
      { firstName: 'An' },
      { unitPreference: 'Imperial' },
      { energyUnit: 'Kj' },
      { weekStartDay: null },
      { timeZone: null },
    ])
      assert.equal(affects(payload), false, JSON.stringify(payload))
    for (const payload of [
      { dateOfBirth: '1990-01-01' },
      { gender: 'Male' },
      { heightCm: 170 },
      { activityLevel: 'Active' },
      { weekStartDay: 'Sunday' },
      { timeZone: 'Asia/Ho_Chi_Minh' },
    ])
      assert.equal(affects(payload), true, JSON.stringify(payload))
    const text = source('features/users/hooks/use-profile.ts')
    const save = bodyOf(text, 'export const useUpdateProfile')
    assert.match(save, /profileChangeAffectsData\(payload\)/)
    assert.match(save, /invalidateTargetData\(queryClient\)/)
  }
)
await check(
  'M4 onboarding refreshes the profile (units), the weigh-ins and every target-derived number, and waits for the state before leaving the wizard',
  () => {
    const keys = []
    const client = {
      invalidateQueries: ({ queryKey }) => {
        keys.push(JSON.stringify(queryKey))
        return Promise.resolve()
      },
      cancelQueries: () => Promise.resolve(),
      refetchQueries: () => Promise.resolve(),
      setQueryData: () => undefined,
    }
    const done = need(onboardingHooks, 'invalidateOnboardingData')(client)
    assert.ok(done && typeof done.then === 'function', 'returns the state refresh promise')
    hasKeys(
      keys,
      ['profile', 'me'],
      ['weights'],
      ['onboarding', 'state'],
      ['program'],
      ['food-log']
    )
    const text = source('features/onboarding/hooks/use-onboarding.ts')
    assert.match(
      bodyOf(text, 'export const useSaveBasics', 'export const useTdeeEstimate'),
      /profileKeys\.me/
    )
    assert.match(
      bodyOf(text, 'export const useCompleteOnboarding'),
      /onSuccess: \(\) => invalidateOnboardingData\(queryClient\)/
    )
  }
)
await check('M5 the query cache is cleared on login and logout (keys carry no user id)', () => {
  const text = source('features/auth/hooks/use-auth.ts')
  assert.match(text, /import \{ queryClient \} from '@\/lib\/query-client'/)
  const login = bodyOf(text, 'const login', 'const logout')
  assert.ok(
    login.indexOf('queryClient.clear()') > 0 &&
      login.indexOf('queryClient.clear()') < login.indexOf('setUser('),
    'login clears the cache before the new user is set'
  )
  assert.ok(bodyOf(text, 'const logout').includes('queryClient.clear()'), 'logout clears the cache')
})
await check(
  'M7 a program / goal / check-in change also refreshes the Food Detail target bars',
  () => {
    hasKeys(invalidated(need(foodLogHooks, 'invalidateTargetData')), ['foods', 'detail'])
    const logOnly = invalidated(need(foodLogHooks, 'invalidateLogData'))
    assert.ok(
      !logOnly.includes(JSON.stringify(['foods', 'detail'])),
      'a food-log change refreshes targets'
    )
  }
)
await check(
  'M0 every mutation hook refreshes or writes the cache, except the three that never write (AI analyze, barcode lookup, program preview)',
  () => {
    const NO_WRITE = new Set(['useAiAnalyze', 'useBarcodeLookup', 'usePreviewProgram'])
    const offenders = []
    for (const [file, text] of allSources().filter(([name]) => /\/hooks\/[^/]+\.ts$/.test(name)))
      for (const match of text.matchAll(/useMutation\(\{/g)) {
        let depth = 0
        let end = match.index + 'useMutation('.length
        for (; end < text.length; end += 1) {
          if (text[end] === '{') depth += 1
          else if (text[end] === '}') {
            depth -= 1
            if (depth === 0) break
          }
        }
        const body = text.slice(match.index, end + 1)
        const hook = [
          ...text.slice(0, match.index).matchAll(/(?:export )?const (use\w+) =/g),
        ].pop()?.[1]
        if (hook && NO_WRITE.has(hook)) continue
        if (!/invalidate\w*\(|invalidateQueries|setQueryData|refetchQueries/.test(body))
          offenders.push(`${file}: ${hook ?? 'useMutation'}`)
      }
    assert.deepEqual(offenders, [], 'a mutation leaves every query cache stale')
  }
)

// ── N: đồng bộ dữ liệu — mỗi mutation làm mới đúng các họ khoá phụ thuộc (xem docs/audits/Mutation_Query_Matrix.md) ──────────────────────────────
const nDerived = await load('../src/features/derived-data/derived-data.utils.ts')
const nWeight = await load('../src/features/weight/hooks/use-weights.ts')
const nProfile = await load('../src/features/users/hooks/use-profile.ts')
const nKeysOf = (run) => {
  const keys = []
  run({
    invalidateQueries: ({ queryKey }) => {
      keys.push(JSON.stringify(queryKey))
      return Promise.resolve()
    },
    cancelQueries: () => Promise.resolve(),
    refetchQueries: () => Promise.resolve(),
    setQueryData: () => undefined,
  })
  return keys
}
const nHas = (keys, ...expected) => {
  for (const key of expected)
    assert.ok(
      keys.includes(JSON.stringify(key)),
      JSON.stringify(key) + ' is not invalidated (' + keys.join(' ') + ')'
    )
}

await check(
  'N1 a food-log write refreshes the log, nutrients (incl. macros series), overview, expenditure, energy balance, weight trend, Nutrition Data and the derived status; goals / check-in only via the derived job',
  () => {
    const keys = nKeysOf(need(foodLogHooks, 'invalidateLogData'))
    nHas(
      keys,
      ['food-log'],
      ['nutrients'],
      ['nutrition-overview'],
      ['expenditure'],
      ['energy-balance'],
      ['weights', 'trend'],
      ['nutrition-data'],
      ['derived-data', 'status']
    )
    // MỘT nguồn: mọi khoá dẫn xuất của job nền cũng được làm mới ngay sau khi ghi, trừ hai họ không đọc lượng ăn (có lý do)
    const INDEPENDENT_OF_INTAKE = new Set([JSON.stringify(['goals']), JSON.stringify(['check-in'])])
    for (const key of nDerived.DERIVED_KEYS.map((k) => JSON.stringify(k)))
      if (!INDEPENDENT_OF_INTAKE.has(key))
        assert.ok(keys.includes(key), key + ' is derived but not refreshed by a log write')
    assert.ok(!keys.includes('[]'), 'never a blanket invalidate')
    assert.equal(
      new Set(keys).size,
      keys.length,
      'no key invalidated twice (no duplicate requests)'
    )
  }
)
await check(
  'N2 a program / goal / check-in / expenditure-settings change refreshes everything a log change does plus the targets',
  () => {
    const log = nKeysOf(need(foodLogHooks, 'invalidateLogData'))
    const target = nKeysOf(need(foodLogHooks, 'invalidateTargetData'))
    for (const key of log) assert.ok(target.includes(key), key + ' missing from the target list')
    nHas(target, ['program'], ['goals'], ['check-in'], ['foods', 'detail'], ['weights', 'trend'])
  }
)
await check(
  'N3 a weight write refreshes the scale list, trend, goals, expenditure, energy balance, check-in, body metrics and the Progress Photos sessions (they carry the weight)',
  () => {
    const list = nWeight.WEIGHT_INVALIDATE.map((key) => JSON.stringify(key))
    nHas(
      list,
      ['weights'],
      ['goals'],
      ['expenditure'],
      ['energy-balance'],
      ['check-in'],
      ['body-metrics'],
      ['progress-photos']
    )
  }
)
await check(
  'N4 editing / deleting a custom food refreshes search, Library, Favorites and the plate / recipe nutrition built from it',
  () => {
    const keys = nKeysOf(need(foodHooks, 'invalidateFoodData'))
    nHas(
      keys,
      ['foods'],
      ['food-log', 'library'],
      ['food-favorites'],
      ['food-log', 'plate-nutrients'],
      ['food-log', 'recipe-nutrients']
    )
  }
)
await check(
  'N5 recipe create refreshes Library + search + Favorites; log settings refresh search + Library; a note only refreshes the log (it changes no number)',
  () => {
    const logText = source('features/food-log/hooks/use-food-log.ts')
    const recipe = bodyOf(logText, 'export const useCreateRecipe = ', '\n}')
    for (const key of ['foodLogKeys.library', "['foods', 'search']", "['food-favorites']"])
      assert.ok(recipe.includes(key), 'useCreateRecipe misses ' + key)
    const settings = source('features/food-log/hooks/use-food-log-settings.ts')
    assert.match(settings, /\[\['foods'\], \['food-log', 'library'\]\]/)
    const notes = bodyOf(logText, 'const useNoteMutation', '\n}')
    assert.ok(
      /foodLogKeys\.all/.test(notes) && !/invalidateLogData/.test(notes),
      'notes must not refresh the derived numbers'
    )
    assert.ok(
      !/useLogMutation\(\(payload: AddNoteRequest\)/.test(logText),
      'notes still use the heavy log mutation'
    )
  }
)
await check(
  'N6 only a week-start / time-zone change refreshes the calendar-keyed lists; name / units / bio do not',
  () => {
    const shifts = need(nProfile, 'profileChangeShiftsCalendar')
    assert.equal(shifts({ weekStartDay: 'Sunday' }), true)
    assert.equal(shifts({ timeZone: 'Asia/Tokyo' }), true)
    assert.equal(shifts({ weekStartDay: null }), false, 'null keeps the value')
    assert.equal(shifts({ firstName: 'A', unitPreference: 'Imperial', bio: 'x' }), false)
    const keys = nProfile.CALENDAR_KEYS.map((k) => JSON.stringify(k))
    nHas(
      keys,
      ['steps'],
      ['periods'],
      ['progress-photos'],
      ['body-metrics'],
      ['visual-body-fat'],
      ['measurements'],
      ['nutrition-data']
    )
  }
)
await check(
  'N7 no blanket invalidate / clear in any hook; only the derived status polls (and only while Updating); nobody waits a fixed time for the BE',
  () => {
    for (const [file, text] of allSources().filter(([name]) => /\/hooks\/[^/]+\.ts$/.test(name))) {
      assert.ok(!/invalidateQueries\(\s*\)/.test(text), file + ' invalidates everything')
      assert.ok(!/queryKey:\s*\[\s*\]/.test(text), file + ' has an empty key')
      assert.ok(!/refetchQueries\(\s*\)/.test(text), file + ' refetches everything')
      // G6: the check-in session may poll only through previewPollInterval (preview blocked AND the live state can't recover it on its own)
      const pollsOk =
        /derived-data/.test(file) ||
        (/use-check-in\.ts$/.test(file) &&
          (text.match(/refetchInterval/g) ?? []).length === 1 &&
          /refetchInterval: pollBlockedPreview\s*\?\s*\(query\) => \{[\s\S]*?return previewPollInterval\([\s\S]*?\}\s*:\s*false/.test(
            text
          ))
      if (!pollsOk) assert.ok(!/refetchInterval/.test(text), file + ' polls')
      assert.ok(
        !(/setTimeout/.test(text) && /invalidateQueries/.test(text)),
        file + ' invalidates on a timer'
      )
    }
    assert.equal(nDerived.pollInterval({ state: 'Ready' }), false)
    assert.ok(nDerived.pollInterval({ state: 'Updating' }) > 0)
  }
)
await check(
  'N8 a refetch after a mutation never swaps data for a skeleton: no component ties a Skeleton / spinner to isFetching of a data query',
  () => {
    for (const [file, text] of allSources().filter(([name]) => /\.tsx$/.test(name)))
      assert.ok(
        !/isFetching[^\n]*Skeleton|Skeleton[^\n]*isFetching/.test(text),
        file + ' shows a skeleton while refetching'
      )
  }
)
await check(
  'N9 Expenditure / Weight Trend / Energy Balance / Goal Progress error screens expose a Retry (refetch) wired to ErrorState',
  () => {
    for (const hook of ['expenditure', 'weight-trend', 'energy-balance', 'goal-progress'])
      assert.match(source(`features/dashboard/hooks/use-${hook}-detail.ts`), /refetch/, hook)
    for (const page of ['Expenditure', 'WeightTrend', 'EnergyBalance', 'GoalProgress'])
      assert.match(
        source(`features/dashboard/pages/${page}Page.tsx`),
        /ErrorState[\s\S]*onRetry=\{data\.refetch\}/,
        page
      )
  }
)
await check(
  'N10 failed deletes tell the user (toast) and End program shows the error inside its dialog',
  () => {
    for (const file of [
      'features/steps/hooks/use-steps.ts',
      'features/foods/hooks/use-foods.ts',
      'features/weight/hooks/use-weights.ts',
      'features/food-log/hooks/use-food-log.ts',
      'features/period/hooks/use-period.ts',
    ])
      assert.match(source(file), /reportMutationError\(/, file)
    assert.match(source('lib/mutation-feedback.ts'), /toast\.error/)
    assert.match(source('components/shared/ConfirmDialog.tsx'), /error\?: string \| null/)
    assert.match(
      source('features/program/components/ProgramPage/ProgramActions.tsx'),
      /error=\{end\.error\}/
    )
  }
)
await check(
  'N11 leaving Edit Goal / the wizard drops the pending goal so New Program never reuses it',
  () => {
    assert.match(source('stores/goal-edit.store.ts'), /reset:[^\n]*pendingGoal: null/)
    const nav = source('features/program/hooks/use-wizard-nav.ts')
    assert.match(nav, /setPendingGoal\(null\)/)
    assert.ok((nav.match(/clearPendingGoal\(\)/g) ?? []).length >= 2, 'back + close both clear it')
  }
)
await check('N12 a Quick Add logging error is visible on every food-log tab', () => {
  const text = source('features/food-log/pages/FoodLogPage.tsx')
  assert.ok(!/tab !== 'quick'[^\n]*quickAdd\.error|quickAdd\.error[^\n]*tab !== 'quick'/.test(text))
  assert.match(text, /quickAdd\.error/)
})
await check(
  'N13 gated queries are only "pending" when enabled, so a user without a program never sees skeletons forever',
  () => {
    const text = source('features/dashboard/hooks/use-dashboard-data.ts')
    for (const key of ['daily', 'energyBalance', 'dayLog', 'nutrients', 'expenditure'])
      assert.match(text, new RegExp(`${key}: enabled && `), key)
  }
)
await check(
  'N14 while the BE recalculates, detail pages dim the content instead of swapping it for a skeleton',
  () => {
    for (const page of ['Expenditure', 'WeightTrend', 'EnergyBalance', 'GoalProgress']) {
      const text = source(`features/dashboard/pages/${page}Page.tsx`)
      assert.match(text, /aria-busy=\{derived\.gate === 'updating'\}/, page)
      assert.ok(!/gate === 'updating'[^\n]*(Skeleton|loading)/.test(text), page + ' skeletons')
    }
  }
)

// ── P: header X-Derived-Data-State của mọi lần ghi (Phase 3) ───────────────────────────────────────────────────────────────────────────────
await check(
  'P1 the write header drives the shared status: Ready / Updating / Failed applied at once, Ready after Updating refetches the derived keys once, a missing header is never assumed Ready',
  async () => {
    const apply = need(nDerived, 'applyDerivedHeader')
    const parse = need(nDerived, 'parseDerivedState')
    const refresh = need(nDerived, 'refreshDerivedStatus')
    const KEYS = constant(nDerived, 'DERIVED_KEYS').map((k) => JSON.stringify(k))
    const STATUS = JSON.stringify(['derived-data', 'status'])
    // the derived refetch is deferred one macrotask (after the write's own onSuccess invalidations)
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
    assert.equal(parse('updating'), 'Updating')
    assert.equal(parse(' Ready '), 'Ready')
    assert.equal(parse(undefined), null)
    assert.equal(parse('weird'), null)
    // Ready while already Ready: status says Ready, nothing extra refetched (the hook's own keys do that)
    const ready = fakeClient(status('Ready'))
    apply(ready, 'Ready')
    assert.equal(ready.getQueryData(['derived-data', 'status']).state, 'Ready')
    assert.deepEqual(ready.invalidated, [])
    // Updating: kept as Updating at once (gate = updating, polling starts), no derived refetch yet
    apply(ready, 'Updating')
    assert.equal(nDerived.gateOf(ready.getQueryData(['derived-data', 'status'])), 'updating')
    assert.deepEqual(ready.invalidated, [])
    // Ready after Updating: status flips at once; in-flight derived GETs (started while the BE was rebuilding) are cancelled at once;
    // every derived key is refreshed exactly once one tick later, reusing fresh in-flight requests and skipping families already newer than the header
    apply(ready, 'Ready')
    assert.equal(ready.getQueryData(['derived-data', 'status']).state, 'Ready')
    assert.deepEqual([...ready.cancelled].sort(), [...KEYS].sort(), 'pre-Ready fetches dropped')
    assert.deepEqual(ready.invalidated, [], 'deferred behind the write hook')
    const before = Date.now()
    await tick()
    assert.deepEqual([...ready.invalidated].sort(), [...KEYS].sort())
    for (const filter of ready.filters) {
      assert.equal(
        filter.options?.cancelRefetch,
        false,
        'reuses the hook request started after the header'
      )
      assert.equal(
        filter.predicate({ state: { dataUpdatedAt: before - 1000 } }),
        true,
        'older data → refresh'
      )
      assert.equal(
        filter.predicate({ state: { dataUpdatedAt: Date.now() + 1000 } }),
        false,
        'already newer → skip'
      )
    }
    // Failed
    apply(ready, 'Failed')
    assert.equal(nDerived.gateOf(ready.getQueryData(['derived-data', 'status'])), 'failed')
    // Missing header: cache untouched (not Ready), status re-read from the endpoint — ONCE (the hook's refresh does not read it again)
    const missing = fakeClient(status('Updating'))
    apply(missing, undefined)
    assert.equal(missing.getQueryData(['derived-data', 'status']).state, 'Updating')
    assert.deepEqual(missing.invalidated, [STATUS])
    refresh(missing)
    assert.deepEqual(missing.invalidated, [STATUS], 'one status read per write')
    // A header already covered the write: the hook's refresh does not ask for status again
    const covered = fakeClient(status('Ready'))
    apply(covered, 'Ready')
    refresh(covered)
    assert.deepEqual(covered.invalidated, [])
    // …but only for that write: a later refresh with no header of its own (e.g. a write that timed out) still reads the status
    const later = fakeClient(status('Ready'))
    apply(later, 'Ready')
    await tick()
    refresh(later)
    assert.deepEqual(later.invalidated, [STATUS], 'covered flag does not outlive its write')
    // the poll / Retry path keeps the default cancelRefetch: an in-flight GET from before the commit is cancelled and read again
    const polled = fakeClient()
    nDerived.onStatusChange(polled, status('Updating'), status('Ready'))
    assert.ok(polled.filters.every((filter) => filter.options === undefined))
  }
)
await check(
  'P2 a status read that started before a newer write header never overwrites it',
  async () => {
    const apply = need(nDerived, 'applyDerivedHeader')
    const read = need(nDerived, 'readDerivedStatus')
    const client = fakeClient(status('Ready'))
    const stale = await read(client, {
      status: async () => {
        apply(client, 'Updating') // a newer write answers while this GET is in flight
        return status('Ready')
      },
      retry: async () => null,
    })
    assert.equal(stale.state, 'Updating')
    assert.equal(client.getQueryData(['derived-data', 'status']).state, 'Updating')
  }
)
await check(
  'P3 the shared HTTP client reads the header on every write and wires it to the QueryClient',
  () => {
    const http = source('lib/axios.ts')
    assert.match(http, /x-derived-data-state/)
    assert.match(http, /\['post', 'put', 'patch', 'delete'\]/)
    assert.match(http, /\/derived-data\//)
    assert.match(
      http,
      /READ_ONLY_POSTS[^\n]*plate[^\n]*nutrients/,
      'preview-style POSTs are not writes'
    )
    assert.match(
      source('lib/query-client.ts'),
      /setDerivedHeaderListener\(\(value\) => applyDerivedHeader\(queryClient, value\)\)/
    )
  }
)
await check(
  'P4 Failed on every derived screen offers Try again that POSTs /derived-data/retry and then follows the status',
  () => {
    for (const page of ['Expenditure', 'WeightTrend', 'EnergyBalance', 'GoalProgress'])
      assert.match(
        source(`features/dashboard/pages/${page}Page.tsx`),
        /DerivedFailed[\s\S]*onRetry=\{derived\.retry\}/,
        page
      )
    assert.match(
      source('features/derived-data/services/derived-data.service.ts'),
      /apiRoutes\.derivedData\.retry/
    )
    // Retry ghi trạng thái BE trả kèm id của lượt làm mới (Failed → Ready mở lượt mới), so với cache đọc SAU khi POST trả về (hành vi: F3, F7)
    const retry = bodyOf(
      source('features/derived-data/derived-data.utils.ts'),
      'export async function retryDerived',
      '\n}\n'
    )
    assert.match(
      retry,
      /client\.setQueryData\(derivedStatusKey, settlingOf\(previous, next, cycle\)\)/
    )
    assert.ok(
      retry.indexOf('await api.retry()') < retry.indexOf('const previous'),
      'previous is read before the POST returns'
    )
  }
)
await check(
  'P5 Edit Goal session: Strategy entry ends it, leaving Edit Goal does not clear a goal being handed to New Program, Back/Close of the wizard do',
  async () => {
    const store = await load('../src/stores/goal-edit.store.ts')
    const s = need(store, 'useGoalEditStore')
    s.getState().setTarget(70)
    s.getState().setPendingGoal({
      goalType: 'WeightLoss',
      weeklyWeightChangeTargetPercent: 0.5,
      targetWeightKg: 70,
    })
    s.getState().reset() // what mounting the Strategy page does
    assert.equal(s.getState().pendingGoal, null)
    assert.equal(s.getState().targetWeightKg, null)
    assert.match(
      source('features/program/pages/ProgramPage.tsx'),
      /useEffect\(\(\) => useGoalEditStore\.getState\(\)\.reset\(\), \[\]\)/
    )
    const edit = source('features/program/pages/GoalEditStepPage.tsx')
    assert.ok(
      !/useEffect/.test(edit),
      'Edit Goal must not reset on unmount: that is the hand-off to New Program'
    )
    // New Program started on its own has no pending goal; one handed over by Edit Goal is only set by Done on a new-program preview
    assert.match(edit, /if \(data\.requiresNewProgram\) \{\s*edit\.setPendingGoal/)
  }
)
await check(
  'P6 finishing / closing the New Program wizard cannot be overridden by its own "first unanswered step" redirect',
  () => {
    const nav = source('features/program/hooks/use-wizard-nav.ts')
    assert.match(nav, /const leaving = useRef\(false\)/)
    assert.match(nav, /if \(unanswered && !leaving\.current\)/)
    assert.ok((nav.match(/leaving\.current = true/g) ?? []).length >= 2, 'back-out + close mark it')
    // Done after POST /programs leaves through the same path (reset() would otherwise send the user back to "style")
    assert.match(source('features/program/pages/NewProgramStepPage.tsx'), /onSuccess: nav\.close/)
  }
)

// ── G: G6 — Accept check-in khoá khi dữ liệu dẫn xuất chưa Ready (BE 409 DERIVED_DATA_UPDATING / DERIVED_DATA_FAILED là nguồn sự thật) ──────────
const gGate = await load('../src/features/program/utils/check-in-gate.ts')
const g409 = (code, key = 'reasonCode') => ({
  response: { status: 409, data: { errors: { [key]: [code] } } },
})
await check(
  'G1 BE reason codes and the 409 body map to the Accept gate; other errors keep normal handling',
  () => {
    const gateOfReason = need(gGate, 'gateOfReason')
    const blockOf = need(gGate, 'acceptBlockOfError')
    assert.equal(gateOfReason(null), 'open')
    assert.equal(gateOfReason(undefined), 'open', 'an older BE without the field = open')
    assert.equal(gateOfReason('DERIVED_DATA_UPDATING'), 'updating')
    assert.equal(gateOfReason('DERIVED_DATA_FAILED'), 'failed')
    assert.equal(
      gateOfReason('SOMETHING_NEW'),
      'updating',
      'unknown code stays closed, like the BE CheckInGate'
    )
    assert.equal(blockOf(g409('DERIVED_DATA_UPDATING')), 'updating')
    assert.equal(blockOf(g409('DERIVED_DATA_FAILED')), 'failed')
    assert.equal(blockOf(g409('DERIVED_DATA_FAILED', 'ReasonCode')), 'failed', 'key casing')
    assert.equal(
      blockOf({ response: { status: 409, data: { errors: null } } }),
      null,
      '409 decision conflict'
    )
    assert.equal(
      blockOf({
        response: { status: 400, data: { errors: { reasonCode: ['DERIVED_DATA_UPDATING'] } } },
      }),
      null
    )
    assert.equal(blockOf(new Error('network')), null)
    assert.equal(blockOf(null), null)
  }
)
await check(
  'G2 the gate combines the preview reason with the live derived state: never open while either is blocked, re-reads the stale source',
  () => {
    const gate = need(gGate, 'checkInAcceptGate')
    const live = (g, at = 200, known = true) => ({ gate: g, known, updatedAt: at })
    const pv = (reason) => ({ acceptBlockedReason: reason })
    // no live read yet → preview decides
    assert.deepEqual(gate(pv('DERIVED_DATA_UPDATING'), 100, live('ready', 0, false)), {
      gate: 'updating',
      sync: 'none',
    })
    assert.deepEqual(gate(pv(null), 100, live('ready', 0, false)), { gate: 'open', sync: 'none' })
    // agree
    assert.deepEqual(gate(pv(null), 100, live('ready')), { gate: 'open', sync: 'none' })
    assert.deepEqual(gate(pv('DERIVED_DATA_FAILED'), 100, live('failed')), {
      gate: 'failed',
      sync: 'none',
    })
    // status just became Ready (newer) but the preview was built while Updating → stay closed and refetch the preview (no auto Accept)
    assert.deepEqual(gate(pv('DERIVED_DATA_UPDATING'), 100, live('ready', 200)), {
      gate: 'updating',
      sync: 'refetch-preview',
    })
    // a newer write is Updating, preview said open → closed; the Ready transition refetches the preview later
    assert.deepEqual(gate(pv(null), 100, live('updating', 200)), { gate: 'updating', sync: 'none' })
    // preview newer than the status → status re-read
    assert.deepEqual(gate(pv('DERIVED_DATA_UPDATING'), 300, live('ready', 200)), {
      gate: 'updating',
      sync: 'read-status',
    })
    assert.deepEqual(gate(pv(null), 300, live('failed', 200)), {
      gate: 'failed',
      sync: 'read-status',
    })
    // both closed → the NEWER source is shown (Accept closed either way)
    assert.equal(gate(pv('DERIVED_DATA_UPDATING'), 100, live('failed', 200)).gate, 'failed')
    // just after "Try again": live Updating is newer than the Failed preview → show Updating (no second Try again), refetch the preview
    assert.deepEqual(gate(pv('DERIVED_DATA_FAILED'), 100, live('updating', 200)), {
      gate: 'updating',
      sync: 'refetch-preview',
    })
    assert.deepEqual(gate(pv('DERIVED_DATA_FAILED'), 300, live('updating', 200)), {
      gate: 'failed',
      sync: 'read-status',
    })
    // never open while either source is closed (every combination)
    for (const p of [null, 'DERIVED_DATA_UPDATING', 'DERIVED_DATA_FAILED'])
      for (const l of ['ready', 'updating', 'failed'])
        for (const [pa, la] of [
          [100, 200],
          [300, 200],
        ]) {
          const r = gate(pv(p), pa, live(l, la))
          assert.equal(r.gate === 'open', p === null && l === 'ready', `${p}/${l}/${pa}>${la}`)
        }
    // no session yet → live state
    assert.deepEqual(gate(undefined, 0, live('updating')), { gate: 'updating', sync: 'none' })
    assert.ok(constant(gGate, 'MAX_GATE_SYNCS') >= 1 && constant(gGate, 'MAX_GATE_SYNCS') <= 3)
  }
)
await check(
  'G3 a 409 gate puts the BE state into the shared status cache; Ready afterwards refetches the check-in preview once',
  async () => {
    const applyState = need(nDerived, 'applyDerivedState')
    const KEYS = constant(nDerived, 'DERIVED_KEYS').map((k) => JSON.stringify(k))
    assert.ok(KEYS.includes(JSON.stringify(['check-in'])), 'the check-in session is a derived key')
    const client = fakeClient(status('Ready'))
    applyState(client, 'Updating')
    assert.equal(nDerived.gateOf(client.getQueryData(['derived-data', 'status'])), 'updating')
    assert.equal(
      nDerived.pollInterval(client.getQueryData(['derived-data', 'status'])) > 0,
      true,
      'polls while Updating'
    )
    assert.deepEqual(client.invalidated, [], 'no refetch while Updating')
    applyState(client, 'Ready')
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.ok(
      client.invalidated.includes(JSON.stringify(['check-in'])),
      'preview refetched on Ready'
    )
    assert.equal(client.invalidated.filter((k) => k === JSON.stringify(['check-in'])).length, 1)
    applyState(client, 'Failed')
    assert.equal(
      nDerived.pollInterval(client.getQueryData(['derived-data', 'status'])),
      false,
      'no polling on Failed'
    )
  }
)
await check(
  'G3b a status read that started before the 409 gate state never overwrites it',
  async () => {
    const applyState = need(nDerived, 'applyDerivedState')
    const client = fakeClient(status('Ready'))
    const read = await nDerived.readDerivedStatus(client, {
      status: async () => {
        applyState(client, 'Updating') // Accept answered 409 DERIVED_DATA_UPDATING while this GET was in flight
        return status('Ready')
      },
      retry: async () => null,
    })
    assert.equal(read.state, 'Updating')
    assert.equal(client.getQueryData(['derived-data', 'status']).state, 'Updating')
  }
)
await check(
  'G4 the Accept mutation treats the BE 409 gate as state, not a generic error toast',
  () => {
    const hooks = source('features/program/hooks/use-check-in.ts')
    const onError = bodyOf(hooks, 'onError: (error) => {\n      // G6', '\n    },')
    assert.match(onError, /acceptBlockOfError\(error\)/)
    assert.match(
      onError,
      /applyDerivedState\(queryClient, blocked === 'failed' \? 'Failed' : 'Updating'\)/
    )
    assert.match(onError, /invalidateQueries\(\{ queryKey: checkInKeys\.session \}\)/)
    assert.match(
      onError,
      /if \(blocked\) \{[\s\S]*?\n\s*return\n\s*\}[\s\S]*toast\.error/,
      'gate errors return before the generic toast'
    )
    const gateHook = bodyOf(hooks, 'export function useCheckInAcceptGate', '\n}\n')
    assert.match(gateHook, /const derived = useDerivedGate\(\)/, 'observes the live state')
    assert.match(
      gateHook,
      /checkInAcceptGate\(\s*session\.data\?\.preview,\s*session\.dataUpdatedAt,\s*derived,[\s\S]*?session\.fetchStatus !== 'idle'\s*\)/
    )
    assert.match(
      gateHook,
      /if \(!active \|\| sync === 'none'\) \{\s*syncs\.current = 0/,
      'budget resets when sources agree (and modules without Accept never sync)'
    )
    assert.match(gateHook, /syncs\.current \+= 1/)
    // the live-state inputs are the client-side cache times, not the BE clock
    const derivedHook = source('features/derived-data/hooks/use-derived-data.ts')
    assert.match(derivedHook, /known: status\.data !== undefined/)
    assert.match(derivedHook, /updatedAt: status\.dataUpdatedAt/)
    assert.match(derivedHook, /isFetching: status\.isFetching/)
    // the Ready transition already refetches the preview (DERIVED_KEYS): the gate waits for it instead of cancelling it with a second request
    assert.match(
      hooks,
      /const target = sync === 'refetch-preview' \? session\.isFetching : derived\.isFetching/
    )
    assert.match(hooks, /if \(target \|\| syncs\.current >= MAX_GATE_SYNCS\) return/)
  }
)
await check(
  'G5 Program Update: Accept and Done disabled unless Ready, Decline stays enabled, content kept but marked not ready, Failed offers Retry',
  () => {
    const mod = source('features/program/components/CheckInPage/ProgramUpdateModule.tsx')
    assert.match(mod, /const notReady = acceptGate !== 'open'/)
    assert.match(
      mod,
      /nextDisabled=\{acceptBlocked \|\| notReady\}/,
      '"Done" (no proposal) is an Accept too'
    )
    const acceptButton = bodyOf(mod, '<Button\n', 'Accept Program Changes\n')
    assert.match(acceptButton, /disabled=\{isDeciding \|\| acceptBlocked \|\| notReady\}/)
    assert.match(acceptButton, /aria-describedby=\{notReadyText \? notReadyId : undefined\}/)
    const decline = bodyOf(mod, 'variant="secondary"', 'Decline and Silence\n')
    assert.match(decline, /disabled=\{isDeciding\}/, 'Decline is never gated')
    assert.ok(!/notReady|acceptGate/.test(decline), 'Decline is never gated')
    assert.match(
      mod,
      /acceptGate === 'failed' && onRetryDerived && \(\s*<DerivedFailed onRetry=\{onRetryDerived\} isRetrying=\{isRetryingDerived\}/,
      'Failed → existing ErrorState with Try again'
    )
    // live region always mounted (empty while open) so a 409 that closes the gate is announced
    assert.match(mod, /<p\s+id=\{notReadyId\}\s+role="status"/)
    assert.match(
      mod,
      /acceptGate === 'updating'\s*\?\s*`[^`]*\$\{decidable \? 'accept' : 'finish'\}/
    )
    assert.match(mod, /aria-busy=\{acceptGate === 'updating'\}/)
    assert.match(mod, /notReady && 'opacity-60'/)
  }
)
await check(
  'G6 the page wires the gate, hides the gate 409 text, and never accepts on its own',
  () => {
    const page = source('features/program/pages/CheckInModulePage.tsx')
    assert.match(page, /const acceptModule = module === 'program-update'/)
    assert.match(page, /useCheckInAcceptGate\(session, acceptModule\)/)
    assert.match(page, /acceptGate=\{acceptGate\.gate\}/)
    assert.match(page, /onRetryDerived=\{acceptGate\.retry\}/)
    assert.match(page, /isRetryingDerived=\{acceptGate\.isRetrying\}/)
    assert.match(page, /const blockedByServer = acceptBlockOfError\(accept\.error\) !== null/)
    assert.match(page, /const acceptError = blockedByServer \? null : accept\.error/)
    // accept only from the user's tap (onAccept), never from an effect — page effects AND the gate hook's effect
    const hooks = source('features/program/hooks/use-check-in.ts')
    const effects = [
      ...page.split('useEffect(').slice(1),
      ...bodyOf(hooks, 'export function useCheckInAcceptGate', '\n}\n')
        .split('useEffect(')
        .slice(1),
    ]
    assert.ok(effects.length >= 3)
    for (const effect of effects)
      assert.ok(
        !/accept\.mutate|\.accept\(|mutate\(/.test(effect.slice(0, effect.indexOf('}, ['))),
        'an effect sends Accept'
      )
    assert.equal((page.match(/accept\.mutate\(/g) ?? []).length, 1)
    assert.match(page, /onAccept=\{\(\) => accept\.mutate\(/)
    // …and the components that receive it only pass it to a tap handler: no effect / timer of the module or the shell calls onAccept / onNext
    const updateModule = source('features/program/components/CheckInPage/ProgramUpdateModule.tsx')
    const shell = source('features/onboarding/components/OnboardingPage/WizardShell.tsx')
    for (const [file, text] of [
      ['ProgramUpdateModule', updateModule],
      ['WizardShell', shell],
    ]) {
      const timed = [...text.split('useEffect(').slice(1), ...text.split('setTimeout(').slice(1)]
      assert.ok(timed.length >= 1, `${file}: nothing scanned`)
      for (const body of timed)
        assert.ok(
          !/onAccept|onNext/.test(body.slice(0, body.search(/\}, \[|\)\n/))),
          `${file}: an effect / timer sends Accept`
        )
    }
    for (const use of updateModule.match(/.*onAccept.*/g) ?? [])
      assert.match(
        use.trim(),
        /^(readonly onAccept: \(\) => void|onAccept,|onNext=\{onAccept\}|onClick=\{onAccept\})$/,
        `ProgramUpdateModule uses onAccept outside a tap handler: ${use.trim()}`
      )
    assert.equal((shell.match(/onNext\(\)/g) ?? []).length, 1)
    assert.match(shell, /onClick=\{\(\) => \{\s*if \(!isPending\) onNext\(\)/)
  }
)

// Fixtures in the shape the final BE contract sends (MOS-BE, G6): `preview` of GET /check-ins/session (and GET /check-ins/preview), and the 409 of
// POST /check-ins/accept as axios rejects it (`response.data` = the BE `ApiResponse`, message in Vietnamese → FE keys on reasonCode only)
const gPreview = (derivedDataState, acceptBlockedReason) => ({
  nextCheckInDate: '2026-10-30',
  isDue: true,
  alreadyCheckedInToday: false,
  proposal: { previousCalories: 2014, newCalories: 1950, delta: -64 },
  changed: true,
  reasonCodes: ['ON_TARGET'],
  ...(derivedDataState === undefined ? {} : { derivedDataState, acceptBlockedReason }),
})
const gAccept409 = (reasonCode) => ({
  isAxiosError: true,
  response: {
    status: 409,
    data: {
      isSuccess: false,
      statusCode: 409,
      message:
        'Expenditure đang được tính lại từ dữ liệu mới nhất, chưa thể chấp nhận check-in. Vui lòng thử lại khi hoàn tất.',
      errors: { reasonCode: [reasonCode] },
      data: null,
    },
  },
})
await check(
  'G7 contract fixtures: Ready / Updating / Failed previews and the 409 of Accept drive the gate; a BE without the fields keeps Accept open',
  async () => {
    const gate = need(gGate, 'checkInAcceptGate')
    const blockOf = need(gGate, 'acceptBlockOfError')
    const retryDerived = need(nDerived, 'retryDerived')
    const unknownLive = { gate: 'ready', known: false, updatedAt: 0 }
    const liveOf = (g) => ({ gate: g, known: true, updatedAt: 100 })
    // three states, preview alone (status not read yet) and with the matching live state
    assert.equal(gate(gPreview('Ready', null), 100, unknownLive).gate, 'open')
    assert.equal(
      gate(gPreview('Updating', 'DERIVED_DATA_UPDATING'), 100, unknownLive).gate,
      'updating'
    )
    assert.equal(gate(gPreview('Failed', 'DERIVED_DATA_FAILED'), 100, unknownLive).gate, 'failed')
    assert.deepEqual(gate(gPreview('Ready', null), 100, liveOf('ready')), {
      gate: 'open',
      sync: 'none',
    })
    assert.deepEqual(gate(gPreview('Updating', 'DERIVED_DATA_UPDATING'), 100, liveOf('updating')), {
      gate: 'updating',
      sync: 'none',
    })
    assert.deepEqual(gate(gPreview('Failed', 'DERIVED_DATA_FAILED'), 100, liveOf('failed')), {
      gate: 'failed',
      sync: 'none',
    })
    // a preview says Ready but the live state is not → still blocked ("Disable Accept when acceptBlockedReason ≠ null OR live state isn't Ready")
    assert.equal(gate(gPreview('Ready', null), 100, liveOf('updating')).gate, 'updating')
    assert.equal(gate(gPreview('Ready', null), 100, liveOf('failed')).gate, 'failed')
    // deployed prod BE without the fields: Accept stays as before (open when the live state is Ready)
    assert.equal(gate(gPreview(undefined), 100, unknownLive).gate, 'open')
    assert.equal(gate(gPreview(undefined), 100, liveOf('ready')).gate, 'open')
    // the 409 path: reasonCode decides, the Vietnamese message is ignored
    assert.equal(blockOf(gAccept409('DERIVED_DATA_UPDATING')), 'updating')
    assert.equal(blockOf(gAccept409('DERIVED_DATA_FAILED')), 'failed')
    // Failed → Retry: BE answers Updating, so Accept stays blocked (and the status keeps polling) until Ready
    const client = fakeClient(status('Failed'))
    const after = await retryDerived(client, {
      status: async () => status('Updating'),
      retry: async () => status('Updating'),
    })
    assert.equal(after.state, 'Updating')
    const liveAfterRetry = {
      gate: nDerived.gateOf(client.getQueryData(['derived-data', 'status'])),
      known: true,
      updatedAt: 200,
    }
    // the older Failed preview no longer shows "Try again" once Retry made the live state Updating; Accept stays blocked and the preview is refetched
    assert.deepEqual(
      gate(gPreview('Failed', 'DERIVED_DATA_FAILED'), 100, liveAfterRetry),
      { gate: 'updating', sync: 'refetch-preview' },
      'blocked, shows Updating after Retry'
    )
    assert.equal(
      gate(gPreview('Updating', 'DERIVED_DATA_UPDATING'), 300, liveAfterRetry).gate,
      'updating'
    )
    assert.ok(
      nDerived.pollInterval(client.getQueryData(['derived-data', 'status'])) > 0,
      'polls after Retry'
    )
    assert.ok(
      !client.invalidated.includes(JSON.stringify(['check-in'])),
      'no preview refetch until Ready'
    )
  }
)
await check(
  'G8 a blocked preview keeps being re-checked when the live state cannot recover it (status unreadable, or Ready with a failed preview refetch)',
  () => {
    const pollOf = need(gGate, 'previewPollInterval')
    const POLL = constant(nDerived, 'POLL_MS')
    const pv = (reason) => ({ acceptBlockedReason: reason })
    // status never loaded (5xx / timeout) and the preview is Updating → poll the preview
    assert.equal(pollOf(pv('DERIVED_DATA_UPDATING'), { gate: 'ready', known: false }), POLL)
    // status Ready but the preview is still blocked (its refetch failed) → poll the preview
    assert.equal(pollOf(pv('DERIVED_DATA_UPDATING'), { gate: 'ready', known: true }), POLL)
    // the status poll handles Updating (Ready refetches the preview)
    assert.equal(pollOf(pv('DERIVED_DATA_UPDATING'), { gate: 'updating', known: true }), false)
    // a stale live Failed (e.g. retried on another device) never changes by itself → keep re-checking the Updating preview
    assert.equal(pollOf(pv('DERIVED_DATA_UPDATING'), { gate: 'failed', known: true }), POLL)
    // Failed does not clear by itself (BE keeps Failed until POST /derived-data/retry): no polling while the live state is unknown / Updating / Failed
    for (const live of [
      { gate: 'ready', known: false },
      { gate: 'updating', known: true },
      { gate: 'failed', known: true },
    ])
      assert.equal(pollOf(pv('DERIVED_DATA_FAILED'), live), false, JSON.stringify(live))
    // …but once the live state IS Ready (Try again worked) a stale Failed preview is re-checked, so a failed preview refetch cannot leave Accept stuck
    assert.equal(pollOf(pv('DERIVED_DATA_FAILED'), { gate: 'ready', known: true }), POLL)
    // never while Accept is open, or before the session exists, or on an older BE without the field
    assert.equal(pollOf(pv(null), { gate: 'ready', known: true }), false)
    assert.equal(pollOf(pv(null), { gate: 'ready', known: false }), false)
    assert.equal(pollOf(undefined, { gate: 'ready', known: false }), false)
    assert.equal(pollOf({}, { gate: 'ready', known: true }), false)
    // wired into the session query, reading the shared status cache
    const hooks = source('features/program/hooks/use-check-in.ts')
    const sessionHook = bodyOf(hooks, 'export const useCheckInSession', '\n}\n')
    assert.match(sessionHook, /queryClient\.getQueryData<DerivedStatus>\(derivedStatusKey\)/)
    assert.match(sessionHook, /previewPollInterval\(query\.state\.data\?\.preview/)
    // the live-state inputs of the poll: the real gate of the cached status, and "known" only once a status was read (an unreadable status is NOT live Ready)
    assert.match(sessionHook, /gate: gateOf\(status\),\s*known: status !== undefined,?\s*\}/)
    // opt-in only: off by default, so the hub (which never reads the live status) never polls
    assert.match(sessionHook, /useCheckInSession = \(\{ pollBlockedPreview = false \} = \{\}\)/)
    assert.match(sessionHook, /refetchInterval: pollBlockedPreview\s*\?/)
    assert.match(sessionHook, /:\s*false,\s*\n\s*\}\)/, 'no interval when not opted in')
    const hub = source('features/program/pages/CheckInHubPage.tsx')
    assert.match(hub, /useCheckInSession\(\)/, 'the hub does not opt in')
    assert.ok(!/pollBlockedPreview/.test(hub), 'the hub does not opt in')
    const modulePage = source('features/program/pages/CheckInModulePage.tsx')
    assert.match(
      modulePage,
      /useCheckInSession\(\{ pollBlockedPreview: acceptModule \}\)/,
      'only the Accept module (Program Update) opts in'
    )
  }
)

// ── D: one request per derived family (no cancelled-then-resent duplicates) — real TanStack QueryClient, counting queryFn calls ─────────────────
const { QueryClient: DQueryClient, QueryObserver: DQueryObserver } =
  await import('@tanstack/react-query')
const dSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const dClient = () =>
  new DQueryClient({ defaultOptions: { queries: { retry: 0, staleTime: 60_000 } } })
const dWatch = async (client, queryKey, queryFn) => {
  let calls = 0
  const observer = new DQueryObserver(client, {
    queryKey,
    queryFn: (context) => {
      calls += 1
      return queryFn(context)
    },
  })
  const stop = observer.subscribe(() => {})
  await dSleep(60)
  return { stop, count: () => calls, reset: () => (calls = 0) }
}
await check(
  "D1 a Ready header after Updating plus the write hook's own invalidation fetch each derived query ONCE",
  async () => {
    const applyState = need(nDerived, 'applyDerivedState')
    const client = dClient()
    client.setQueryData(['derived-data', 'status'], status('Updating'))
    const nutrients = await dWatch(client, ['nutrients', 'day', '2026-10-23'], () =>
      dSleep(40).then(() => ({}))
    )
    const goals = await dWatch(client, ['goals', 'progress'], () => dSleep(40).then(() => ({})))
    nutrients.reset()
    goals.reset()
    // what a write does: the interceptor applies the Ready header, then the hook's onSuccess invalidates its families (default cancelRefetch)
    applyState(client, 'Ready')
    await Promise.resolve()
    void client.invalidateQueries({ queryKey: ['nutrients'] })
    await dSleep(150)
    assert.equal(nutrients.count(), 1, 'overlapping family fetched once')
    assert.equal(goals.count(), 1, 'family only in DERIVED_KEYS fetched once')
    nutrients.stop()
    goals.stop()
  }
)
await check(
  'D2 a write without the header reads the status ONCE, and a superseded status read cannot fire a second derived refetch',
  async () => {
    const applyHeader = need(nDerived, 'applyDerivedHeader')
    const refresh = need(nDerived, 'refreshDerivedStatus')
    const read = need(nDerived, 'readDerivedStatus')
    const client = dClient()
    const status$ = await dWatch(client, ['derived-data', 'status'], () =>
      dSleep(30).then(() => status('Ready'))
    )
    status$.reset()
    applyHeader(client, undefined) // interceptor: header missing → status marked stale
    refresh(client) // the write hook's onSuccess
    await dSleep(120)
    assert.equal(status$.count(), 1, 'one status read per write')
    status$.stop()
    // a status read overtaken by a newer read (or by a deliberate re-read after a write) neither updates nor triggers the Ready refetch
    const fake = fakeClient(status('Updating'))
    let releaseOld
    const old = read(fake, {
      status: () => new Promise((resolve) => (releaseOld = () => resolve(status('Ready')))),
      retry: async () => null,
    })
    await read(fake, { status: async () => status('Updating'), retry: async () => null }) // newer read
    releaseOld()
    await assert.rejects(old, /Superseded/)
    assert.deepEqual(fake.invalidated, [], 'no DERIVED_KEYS refetch from a superseded read')
    const fake2 = fakeClient(status('Updating'))
    let release2
    const old2 = read(fake2, {
      status: () => new Promise((resolve) => (release2 = () => resolve(status('Ready')))),
      retry: async () => null,
    })
    applyHeader(fake2, undefined) // a header-less write: cancel + re-read the status
    release2()
    await assert.rejects(old2, /Superseded/)
    assert.ok(!fake2.invalidated.some((key) => key !== JSON.stringify(['derived-data', 'status'])))
    assert.ok(
      fake2.cancelled.includes(JSON.stringify(['derived-data', 'status'])),
      'in-flight read cancelled'
    )
    // TanStack's `signal` is never touched (its getter flips a query-wide flag that cancels the next read on unmount)
    assert.ok(
      !/signal/.test(
        source('features/derived-data/hooks/use-derived-data.ts').split('queryFn')[1].split('\n')[0]
      )
    )
    assert.ok(
      !/context\??\.signal|signal\.aborted/.test(
        source('features/derived-data/derived-data.utils.ts')
      )
    )
    assert.ok(
      !/signal/.test(source('features/derived-data/services/derived-data.service.ts')),
      'axios never gets the signal'
    )
  }
)
await check(
  'D5 poll / Retry path: a FIRST-LOAD derived GET (no data yet) in flight across the commit is not kept as the final number',
  async () => {
    const read = need(nDerived, 'readDerivedStatus')
    for (const via of ['poll', 'retry']) {
      const client = dClient()
      client.setQueryData(['derived-data', 'status'], status('Updating'))
      let committed = false
      const series = await (async () => {
        let calls = 0
        const observer = new DQueryObserver(client, {
          queryKey: ['expenditure', 'series', via],
          queryFn: () => {
            calls += 1
            const value = committed ? 'NEW' : 'OLD'
            return dSleep(80).then(() => value)
          },
        })
        const stop = observer.subscribe(() => {})
        return { stop, count: () => calls }
      })()
      await dSleep(10) // first load in flight, no data yet
      committed = true
      if (via === 'poll')
        await read(client, { status: async () => status('Ready'), retry: async () => null })
      else
        await nDerived.retryDerived(client, {
          status: async () => null,
          retry: async () => status('Ready'),
        })
      await dSleep(250)
      assert.equal(client.getQueryData(['expenditure', 'series', via]), 'NEW', via)
      series.stop()
    }
  }
)
await check(
  'D6 after Updating → Ready the gate stays "updating" (dimmed) until the derived refetch has landed, then opens',
  async () => {
    const applyState = need(nDerived, 'applyDerivedState')
    const client = dClient()
    client.setQueryData(['derived-data', 'status'], status('Updating'))
    const goals = await dWatch(client, ['goals', 'progress'], () => dSleep(80).then(() => ({})))
    applyState(client, 'Ready')
    const gate = () => nDerived.gateOf(client.getQueryData(['derived-data', 'status']))
    assert.equal(gate(), 'updating', 'reverted / old numbers are not presented as final')
    assert.equal(
      nDerived.pollInterval(client.getQueryData(['derived-data', 'status'])),
      false,
      'settling does not poll'
    )
    await dSleep(40)
    assert.equal(gate(), 'updating', 'still refetching')
    await dSleep(150)
    assert.equal(gate(), 'ready', 'opens once the refetch landed')
    goals.stop()
    // poll path too: the read returns Ready + settling, cleared after the refetch
    const client2 = dClient()
    client2.setQueryData(['derived-data', 'status'], status('Updating'))
    const status$ = new DQueryObserver(client2, {
      queryKey: ['derived-data', 'status'],
      queryFn: () =>
        nDerived.readDerivedStatus(client2, {
          status: async () => status('Ready'),
          retry: async () => null,
        }),
    })
    const stopStatus = status$.subscribe(() => {})
    const nutrients = await dWatch(client2, ['nutrients', 'day'], () => dSleep(80).then(() => ({})))
    void client2.invalidateQueries({ queryKey: ['derived-data', 'status'] })
    await dSleep(30)
    assert.equal(nDerived.gateOf(client2.getQueryData(['derived-data', 'status'])), 'updating')
    await dSleep(250)
    assert.equal(nDerived.gateOf(client2.getQueryData(['derived-data', 'status'])), 'ready')
    stopStatus()
    nutrients.stop()
  }
)
await check(
  'D7 a derived result that landed in the same millisecond as the Ready header is still refreshed',
  async () => {
    const applyState = need(nDerived, 'applyDerivedState')
    const client = fakeClient(status('Updating'))
    const realNow = Date.now
    Date.now = () => 5_000
    try {
      applyState(client, 'Ready')
    } finally {
      Date.now = realNow
    }
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.ok(client.filters.length > 0)
    for (const filter of client.filters)
      assert.equal(filter.predicate({ state: { dataUpdatedAt: 5_000 } }), true)
  }
)
await check(
  'D4 a derived GET that started while the BE was still rebuilding is never accepted as the post-Ready number',
  async () => {
    const applyState = need(nDerived, 'applyDerivedState')
    const client = dClient()
    let committed = false
    const goals = await dWatch(client, ['goals', 'progress'], () => {
      const value = committed ? 'NEW' : 'OLD' // the BE answers from the snapshot as it is when the GET is served
      return dSleep(60).then(() => value)
    })
    client.setQueryData(['derived-data', 'status'], status('Updating'))
    void client.invalidateQueries({ queryKey: ['goals'] }) // a refetch while Updating → will return OLD
    await dSleep(10)
    committed = true // the rebuild job commits while that GET is in flight
    applyState(client, 'Ready') // the next write's header says Ready
    await dSleep(200)
    assert.equal(
      client.getQueryData(['goals', 'progress']),
      'NEW',
      'pre-commit result not kept under the Ready gate'
    )
    goals.stop()
  }
)
await check(
  'D3 aggregate-backed nutrition screens follow the derived gate (dim while Updating, Retry on Failed, observer mounted)',
  () => {
    for (const file of [
      'features/food-log/pages/NutritionOverviewPage.tsx',
      'features/nutrient-detail/pages/NutrientDetailPage.tsx',
      'features/nutrient-detail/pages/NutrientSummaryPage.tsx',
    ]) {
      const text = source(file)
      assert.match(text, /const derived = useDerivedGate\(\)/, file)
      assert.match(text, /aria-busy=\{derived\.gate === 'updating'\}/, file)
      assert.match(
        text,
        /derived\.gate === 'failed' && \(\s*<DerivedFailed onRetry=\{derived\.retry\}/,
        file
      )
    }
    // All three dim only the content block while not Ready (Updating AND Failed: the numbers are not final either way); the header and
    // the "Try again" card sit OUTSIDE it, so on Failed they are never shown at 60% (looking disabled)
    for (const file of [
      'features/food-log/pages/NutritionOverviewPage.tsx',
      'features/nutrient-detail/pages/NutrientDetailPage.tsx',
      'features/nutrient-detail/pages/NutrientSummaryPage.tsx',
    ]) {
      const text = source(file)
      const dim = text.search(/derived\.gate !== 'ready' && 'opacity-60'/)
      assert.ok(dim > 0, `${file}: content not dimmed on Failed`)
      assert.ok(
        text.indexOf('<DerivedFailed') < dim,
        `${file}: the Retry card is inside the dimmed block`
      )
      assert.ok(!/derived\.gate === 'updating' && 'opacity-60'/.test(text), `${file}: root dimmed`)
    }
  }
)
await check(
  'D8 cancelling an in-flight FIRST load on Ready restarts it at once (no idle "empty" state), still one request per family',
  async () => {
    const applyState = need(nDerived, 'applyDerivedState')
    const client = dClient()
    client.setQueryData(['derived-data', 'status'], status('Updating'))
    let calls = 0
    const observer = new DQueryObserver(client, {
      queryKey: ['goals', 'first'],
      queryFn: () => {
        calls += 1
        return dSleep(60).then(() => 'v' + calls)
      },
    })
    const stop = observer.subscribe(() => {})
    await dSleep(10) // first load in flight
    applyState(client, 'Ready')
    const query = client.getQueryCache().find({ queryKey: ['goals', 'first'] })
    assert.equal(
      query.state.fetchStatus,
      'fetching',
      'restarted synchronously — never pending + idle'
    )
    void client.invalidateQueries({ queryKey: ['goals'] }) // the write hook
    await dSleep(200)
    assert.equal(calls, 2, 'the cancelled first load + one fresh request, nothing more')
    assert.equal(client.getQueryData(['goals', 'first']), 'v2')
    stop()
  }
)
// ── E: settling cycles — the gate opens only when THIS transition's refresh has landed ────────────────────────────────────────────────────
const eGate = (client) => nDerived.gateOf(client.getQueryData(['derived-data', 'status']))
await check(
  'E1 a second Ready (status read / header / Retry) during settling keeps the gate "updating" until the refresh lands',
  async () => {
    const applyState = need(nDerived, 'applyDerivedState')
    const client = dClient()
    client.setQueryData(['derived-data', 'status'], status('Updating'))
    const goals = await dWatch(client, ['goals', 'progress'], () => dSleep(120).then(() => ({})))
    applyState(client, 'Ready') // transition: settling cycle starts
    await dSleep(20)
    // a second Ready lands while the refresh is in flight — via a status read (what refetchOnMount / focus / Retry onSettled do)…
    client.setQueryData(
      ['derived-data', 'status'],
      await nDerived.readDerivedStatus(client, {
        status: async () => status('Ready'),
        retry: async () => null,
      })
    )
    assert.equal(eGate(client), 'updating', 'status read kept the pending cycle')
    // …and via another write's Ready header
    applyState(client, 'Ready')
    assert.equal(eGate(client), 'updating', 'header kept the pending cycle')
    await dSleep(250)
    assert.equal(eGate(client), 'ready', 'opens once the refresh landed (never stuck)')
    goals.stop()
  }
)
await check(
  'E2 a refresh left over from an earlier Ready cycle cannot open the gate of a later cycle',
  async () => {
    const applyState = need(nDerived, 'applyDerivedState')
    const client = dClient()
    client.setQueryData(['derived-data', 'status'], status('Updating'))
    let slow = 60
    const goals = await dWatch(client, ['goals', 'progress'], () => dSleep(slow).then(() => ({})))
    applyState(client, 'Ready') // cycle 1 starts its refresh (60 ms)
    await dSleep(10)
    applyState(client, 'Updating') // a new write: rebuilding again
    slow = 200
    applyState(client, 'Ready') // cycle 2: cancels cycle 1's refresh (its settle fires at once) and starts a 200 ms refresh
    await dSleep(60)
    assert.equal(eGate(client), 'updating', "cycle 1's settle did not clear cycle 2")
    await dSleep(300)
    assert.equal(eGate(client), 'ready')
    goals.stop()
  }
)
await check(
  'E3 on Ready, derived caches nobody is watching are dropped, so the next visit loads fresh numbers instead of pre-rebuild ones',
  () => {
    const applyState = need(nDerived, 'applyDerivedState')
    const client = dClient()
    client.setQueryData(['derived-data', 'status'], status('Updating'))
    client.setQueryData(['expenditure', 'series', 'history'], { old: true }) // cached while rebuilding, page since left (inactive)
    client.setQueryData(['food-log', 'day'], { raw: true }) // not derived: untouched
    applyState(client, 'Ready')
    assert.equal(client.getQueryData(['expenditure', 'series', 'history']), undefined)
    assert.deepEqual(client.getQueryData(['food-log', 'day']), { raw: true })
  }
)
await check(
  'E4 a derived tile / page whose series OR insights refetch failed is in error ("---" / ErrorState), never the retained pre-rebuild number',
  async () => {
    const pairStatus = need(dashboardUtils, 'pairStatus')
    const ok = { isPending: false, isError: false, isFetching: false }
    // EITHER query failing / pending / fetching must show: run both argument orders (a pairStatus that only reads one operand must fail)
    for (const [label, pair] of [
      ['series', (x) => pairStatus(x, ok)],
      ['insights', (x) => pairStatus(ok, x)],
    ]) {
      assert.equal(pair({ ...ok, isError: true }).isError, true, `${label} error is invisible`)
      assert.equal(
        pair({ ...ok, isPending: true }).isLoading,
        true,
        `${label} pending flashes "---"`
      )
      assert.equal(
        pair({ ...ok, isFetching: true }).isFetching,
        true,
        `${label} refetch: ErrorState would re-enable "Try again"`
      )
      assert.deepEqual(pair(ok), { isLoading: false, isError: false, isFetching: false }, label)
    }
    // real TanStack: a Ready cycle refetches both; one GET fails and TanStack keeps the old data with status 'error' (the trap)
    for (const failing of ['series', 'insights']) {
      const client = dClient()
      let fail = false
      const observer = (key, value, name) =>
        new DQueryObserver(client, {
          queryKey: key,
          queryFn: async () => {
            if (fail && failing === name) throw new Error('500')
            return value
          },
        })
      const series = observer(['expenditure', 'series', 'history'], { days: [] }, 'series')
      const insights = observer(['expenditure', 'insights'], { currentKcal: 2400 }, 'insights')
      const stops = [series.subscribe(() => {}), insights.subscribe(() => {})]
      await dSleep(30)
      assert.deepEqual(pairStatus(series.getCurrentResult(), insights.getCurrentResult()), {
        isLoading: false,
        isError: false,
        isFetching: false,
      })
      fail = true
      await client.invalidateQueries({ queryKey: ['expenditure'] })
      await dSleep(30)
      const failed = failing === 'series' ? series : insights
      assert.ok(
        failed.getCurrentResult().data !== undefined,
        `${failing}: retained data (the trap)`
      )
      assert.equal(
        pairStatus(series.getCurrentResult(), insights.getCurrentResult()).isError,
        true,
        `${failing} error is invisible`
      )
      stops.forEach((stop) => stop())
    }
    for (const hook of [
      'use-expenditure-detail',
      'use-weight-trend-detail',
      'use-energy-balance-detail',
    ])
      assert.match(
        source(`features/dashboard/hooks/${hook}.ts`),
        /const status = pairStatus\(series, insights\)[\s\S]*isLoading: status\.isLoading,\s*isError: status\.isError,\s*isFetching: status\.isFetching,/,
        hook
      )
    const tiles = source('features/dashboard/components/DashboardPage/DashboardTiles.tsx')
    // each tile's OWN source only (a lazy match must not run on into the next tile's "---")
    for (const [guard, title, name] of [
      ['exp.isError', 'Expenditure', 'ExpenditureTile'],
      ['trend.isError', 'Weight Trend', 'WeightTrendTile'],
      ['balance.isError', 'Energy Balance', 'EnergyBalanceTile'],
      ['goal.isError', 'Goal Progress', 'GoalProgressTile'],
    ])
      assert.match(
        bodyOf(tiles, `export function ${name}()`, '\nexport function'),
        new RegExp(
          `if \\(${guard.replace('.', '\\.')}\\)\\s*return \\(\\s*<MetricTile\\s+title="${title}"[\\s\\S]*?value="---"`
        ),
        title
      )
  }
)

// ── F: round 5 — insights / carousel errors, polling wiring, unconfirmed Ready, Retry snapshot, check-in settling, UI wiring ─────────────
const F_KEY = ['derived-data', 'status']
// A header-less write leaves a confirmation owed (module state, one client per app): a confirming status read pays it, so one check cannot leak into the next
const fConfirm = () =>
  nDerived.readDerivedStatus(fakeClient(), {
    status: async () => status('Ready'),
    retry: async () => null,
  })
await check(
  'F1 [wiring] the real status query options poll only while Updating (or an unconfirmed Ready), never while Ready / settling / Failed',
  async () => {
    const hook = await load('../src/features/derived-data/hooks/use-derived-data.ts')
    const options = need(hook, 'derivedStatusOptions')(dClient())
    const POLL = constant(nDerived, 'POLL_MS')
    const at = (data) => options.refetchInterval({ state: { data } })
    assert.equal(at(status('Updating')), POLL)
    assert.equal(at(status('Ready')), false)
    assert.equal(at(status('Ready', { settling: 3 })), false, 'polls while its own refresh settles')
    assert.equal(at(status('Failed')), false, 'polls forever after Failed')
    assert.equal(at(undefined), false)
    assert.equal(at(status('Ready', { settling: constant(nDerived, 'UNCONFIRMED') })), POLL)
    assert.equal(options.staleTime, 0)
    assert.equal(options.refetchOnMount, 'always')
    assert.equal(options.refetchOnWindowFocus, true)
    assert.equal(options.refetchIntervalInBackground, false)
  }
)
await check(
  'F2 a write without the X-Derived-Data-State header does not leave the cached Ready trusted: dimmed until the re-read answers',
  async () => {
    const apply = need(nDerived, 'applyDerivedHeader')
    const read = (client, state) =>
      nDerived.readDerivedStatus(client, {
        status: async () => status(state),
        retry: async () => null,
      })
    const gate = (client) => nDerived.gateOf(client.getQueryData(F_KEY))
    const client = fakeClient(status('Ready'))
    apply(client, undefined)
    assert.equal(gate(client), 'updating', 'a missing header is treated as Ready')
    assert.equal(nDerived.pollInterval(client.getQueryData(F_KEY)), constant(nDerived, 'POLL_MS'))
    assert.ok(client.invalidated.includes(JSON.stringify(F_KEY)), 'status not re-read')
    // the re-read answers Ready → confirmed: gate opens, polling stops, nothing derived refetched (no transition)
    client.invalidated.length = 0
    client.setQueryData(F_KEY, await read(client, 'Ready'))
    assert.equal(gate(client), 'ready', 'stuck dimmed after the re-read confirmed Ready')
    assert.equal(nDerived.pollInterval(client.getQueryData(F_KEY)), false)
    assert.deepEqual(client.invalidated, [])
    // …or Updating → stays dimmed and polls
    apply(client, '')
    client.setQueryData(F_KEY, await read(client, 'Updating'))
    assert.equal(gate(client), 'updating')
    // a later write's Ready header confirms it too
    const headed = fakeClient(status('Ready'))
    apply(headed, undefined)
    nDerived.applyDerivedState(headed, 'Ready')
    assert.equal(gate(headed), 'ready')
    // the shape every finished cycle leaves behind (`settling: 0`) is a plain Ready too
    const settled = fakeClient(status('Ready', { settling: 0 }))
    apply(settled, undefined)
    assert.equal(settled.getQueryData(F_KEY).settling, constant(nDerived, 'UNCONFIRMED'))
    assert.equal(gate(settled), 'updating')
    // a header-less write while a real Ready cycle settles keeps that cycle's id (its refresh clears it — into UNCONFIRMED, F7)
    const settling = fakeClient(status('Ready', { settling: 7 }))
    apply(settling, undefined)
    assert.equal(settling.getQueryData(F_KEY).settling, 7)
    // Updating / Failed are left as they are
    for (const state of ['Updating', 'Failed']) {
      const other = fakeClient(status(state))
      apply(other, undefined)
      assert.equal(other.getQueryData(F_KEY).state, state)
      assert.ok(!other.getQueryData(F_KEY).settling, state)
    }
    // the hook-side path (no header seen this tick) does the same
    await dSleep(5)
    const write = fakeClient(status('Ready'))
    need(nDerived, 'refreshDerivedStatus')(write)
    assert.equal(gate(write), 'updating')
    await fConfirm()
  }
)
await check(
  'F3 Try again compares with the status cache AFTER the POST returns: a Ready read during the wait is not refreshed a second time',
  async () => {
    const client = fakeClient(status('Failed'))
    let answer
    const posted = nDerived.retryDerived(client, {
      status: async () => null,
      retry: () => new Promise((resolve) => (answer = resolve)),
    })
    // while the POST waits on the user lock, a focus / mount status read sees Ready → one refresh cycle starts
    client.setQueryData(
      F_KEY,
      await nDerived.readDerivedStatus(client, {
        status: async () => status('Ready'),
        retry: async () => null,
      })
    )
    const cycle = client.getQueryData(F_KEY).settling
    assert.ok(cycle > 0)
    const firstRound = client.invalidated.length
    answer(status('Ready'))
    await posted
    assert.equal(
      client.invalidated.length,
      firstRound,
      'the Retry answer refreshed every family again'
    )
    assert.equal(client.getQueryData(F_KEY).settling, cycle, 'the running cycle was replaced')
    // …and an OLDER answer (POST said Updating, a later read already saw Ready) does not regress the cache or orphan that cycle
    const late = fakeClient(status('Failed'))
    let lateAnswer
    const latePost = nDerived.retryDerived(late, {
      status: async () => null,
      retry: () => new Promise((resolve) => (lateAnswer = resolve)),
    })
    late.setQueryData(
      F_KEY,
      await nDerived.readDerivedStatus(late, {
        status: async () => status('Ready'),
        retry: async () => null,
      })
    )
    const kept = late.getQueryData(F_KEY)
    lateAnswer(status('Updating'))
    await latePost
    assert.equal(late.getQueryData(F_KEY), kept, 'an older POST answer overwrote a newer read')
  }
)
await check(
  'F4 check-in gate: a Ready still settling (its own refresh in flight) is not re-read — no extra status GET per Ready cycle',
  () => {
    const acceptGate = need(gGate, 'checkInAcceptGate')
    const open = { acceptBlockedReason: null }
    // the preview refetched by the Ready cycle lands before the cycle clears `settling`
    assert.deepEqual(
      acceptGate(open, 2000, { gate: 'updating', known: true, updatedAt: 1000, settling: true }),
      { gate: 'updating', sync: 'none' }
    )
    // a genuinely older Updating status is still re-read once
    assert.deepEqual(acceptGate(open, 2000, { gate: 'updating', known: true, updatedAt: 1000 }), {
      gate: 'updating',
      sync: 'read-status',
    })
    // a cached preview being revalidated (module reopened after a write elsewhere) is not final: Accept stays closed until it lands
    const ready = { gate: 'ready', known: true, updatedAt: 1000 }
    assert.deepEqual(acceptGate(open, 2000, ready, true), { gate: 'updating', sync: 'none' })
    assert.deepEqual(acceptGate(open, 2000, ready, false), { gate: 'open', sync: 'none' })
    assert.equal(
      acceptGate({ acceptBlockedReason: 'DERIVED_DATA_FAILED' }, 2000, ready, true).gate,
      'failed'
    )
    assert.match(
      source('features/derived-data/hooks/use-derived-data.ts'),
      /settling: Boolean\(status\.data\?\.settling\)/
    )
    assert.match(
      source('features/program/hooks/use-check-in.ts'),
      /checkInAcceptGate\(\s*session\.data\?\.preview,\s*session\.dataUpdatedAt,\s*derived,[\s\S]*?session\.fetchStatus !== 'idle'\s*\)/
    )
  }
)
await check(
  'F5 Try again answered Ready keeps the gate "updating" until the derived refresh lands (also inside a running settling cycle)',
  async () => {
    const ready = { status: async () => null, retry: async () => status('Ready') }
    const client = dClient()
    client.setQueryData(F_KEY, status('Failed'))
    const goals = await dWatch(client, ['goals', 'progress'], () => dSleep(120).then(() => ({})))
    await nDerived.retryDerived(client, ready)
    assert.equal(eGate(client), 'updating', 'opened before the refresh landed')
    await dSleep(250)
    assert.equal(eGate(client), 'ready', 'never stuck')
    client.setQueryData(F_KEY, status('Updating'))
    nDerived.applyDerivedState(client, 'Ready')
    await dSleep(10)
    await nDerived.retryDerived(client, ready)
    assert.equal(eGate(client), 'updating', 'Retry opened a cycle that is still refreshing')
    await dSleep(300)
    assert.equal(eGate(client), 'ready')
    goals.stop()
  }
)
await check(
  'F6 [wiring] carousel Energy Balance card, tiles, Food Logging, Habits, Strategy dial and check-in never show retained / rebuilding numbers as final',
  () => {
    const data = source('features/dashboard/hooks/use-dashboard-data.ts')
    assert.match(data, /energyError: energyBalanceQuery\.error \?\? expenditure\.error \?\? null/)
    assert.match(
      bodyOf(data, 'retryEnergy: () => {', '},'),
      /energyBalanceQuery\.refetch\(\)[\s\S]*expenditure\.refetch\(\)/
    )
    const page = source('features/dashboard/pages/DashboardPage.tsx')
    const pending = page.indexOf("focusPending('energy', data.pending)")
    const failed = page.indexOf('data.energyError ?')
    assert.ok(pending > 0 && failed > pending && failed < page.indexOf('<EnergyBalanceCard'))
    assert.match(page, /onRetry=\{data\.retryEnergy\}/)
    const tile = source('features/dashboard/components/DashboardPage/MetricTile.tsx')
    assert.equal((tile.match(/aria-busy=\{busy \|\| undefined\}/g) ?? []).length, 2)
    const tiles = source('features/dashboard/components/DashboardPage/DashboardTiles.tsx')
    assert.equal((tiles.match(/busy=\{derived\.gate === 'updating'\}/g) ?? []).length, 4)
    // Food Logging (snapshot-backed): Failed card, dim + busy while Updating, "---" (no retained grid) after a failed refetch
    const food = bodyOf(
      source('features/dashboard/components/DashboardPage/LayoutSection.tsx'),
      "case 'foodLogging':",
      'case '
    )
    // the tile KEEPS its title and link on Failed ("---", no grid): the Habits page carries the Failed "Try again", so a bare Failed card here would cut the only in-app way to it
    assert.ok(!/DerivedFailed/.test(food), 'a bare Failed card replaces the tile')
    assert.match(food, /href=\{routePath\.habitsFoodLogging\}/)
    assert.match(food, /value=\{\s*data\.loggingError \|\| derived\.gate === 'failed' \? '---'/)
    assert.match(food, /data\.loggingError \|\| derived\.gate === 'failed' \? undefined/)
    assert.match(food, /className=\{derived\.gate === 'updating' \? 'opacity-60/)
    assert.match(food, /busy=\{derived\.gate === 'updating'\}/)
    assert.match(data, /loggingError: enabled && dailyQuery\.isError/)
    // Habits (food logging only): Failed card OUTSIDE the dimmed block
    const habits = source('features/habits/pages/HabitsPage.tsx')
    assert.match(habits, /const derivedGate = kind === 'food-logging' \? derived\.gate : 'ready'/)
    assert.match(habits, /aria-busy=\{derivedGate === 'updating'\}/)
    const habitDim = habits.search(/derivedGate !== 'ready' && 'opacity-60'/)
    const habitFailed = habits.search(
      /derivedGate === 'failed' && \(\s*<DerivedFailed onRetry=\{derived\.retry\}/
    )
    assert.ok(habitFailed > 0, 'Habits shows no "Try again" on Failed')
    // the page-level ErrorState locks "Try again" while the refetch runs
    assert.match(habits, /isRetrying=\{summary\.isFetching\}/)
    assert.match(source('features/habits/hooks/use-habit-days.ts'), /isFetching: query\.isFetching/)
    assert.ok(habitDim > habitFailed, 'the Retry card sits inside the dimmed block')
    // Strategy: Failed card, dial dims while not Ready, no retained goal % after a failed refetch
    const strategy = source('features/program/pages/ProgramPage.tsx')
    assert.match(
      strategy,
      /derived\.gate === 'failed' && \(\s*<DerivedFailed onRetry=\{derived\.retry\}/
    )
    assert.match(
      strategy,
      /aria-busy=\{derived\.gate === 'updating'\}\s*className=\{`\$\{ENTER\} \$\{derived\.gate !== 'ready' \? 'opacity-60/
    )
    assert.match(strategy, /goalPercent=\{\s*goalProgress\.isError \? null : /)
    // check-in Program Update: a failed session refetch keeps the module mounted, locks Accept and offers Try again in place
    const checkIn = source('features/program/pages/CheckInModulePage.tsx')
    assert.match(checkIn, /if \(!data \|\| notDue\)\n/)
    assert.ok(!/session\.isError\)\)/.test(checkIn), 'the module is unmounted on a refetch error')
    assert.match(
      checkIn,
      /loadError=\{\s*session\.isError\s*\?\s*\{[\s\S]*?onRetry: \(\) => void session\.refetch\(\),\s*isRetrying: session\.isFetching,/
    )
    // (the no-data error shell has no locked state: a refetch there turns the query 'pending', which swaps in the skeleton)
    assert.ok(!/disabled=\{session\.isFetching\}/.test(checkIn), 'dead locked-button code is back')
    const updateModule = source('features/program/components/CheckInPage/ProgramUpdateModule.tsx')
    assert.match(updateModule, /const notReady = acceptGate !== 'open' \|\| loadError !== null/)
    assert.match(updateModule, /disabled=\{loadError\.isRetrying\}/)
    assert.match(updateModule, /onClick=\{loadError\.onRetry\}/)
    // ErrorStates of the derived detail pages and the carousel card lock "Try again" while the refetch runs
    for (const page of ['Expenditure', 'WeightTrend', 'EnergyBalance'])
      assert.match(
        source(`features/dashboard/pages/${page}Page.tsx`),
        /onRetry=\{data\.refetch\}\s*isRetrying=\{data\.isFetching\}/,
        page
      )
    assert.match(
      source('features/dashboard/pages/GoalProgressPage.tsx'),
      /onRetry=\{data\.refetch\}\s*isRetrying=\{data\.isRetrying\}/
    )
    assert.match(
      source('features/dashboard/hooks/use-goal-progress-detail.ts'),
      /isRetrying: goal\.isFetching \|\| weights\.isFetching/
    )
    assert.match(
      data,
      /energyRetrying: energyBalanceQuery\.isFetching \|\| expenditure\.isFetching/
    )
    assert.match(page, /isRetrying=\{data\.energyRetrying\}/)
    // one derived Retry at a time across every "Try again" on the screen
    const gateHook = source('features/derived-data/hooks/use-derived-data.ts')
    assert.match(gateHook, /mutationKey: derivedRetryKey/)
    assert.match(gateHook, /useIsMutating\(\{ mutationKey: derivedRetryKey \}\) > 0/)
    assert.match(
      gateHook,
      /if \(client\.isMutating\(\{ mutationKey: derivedRetryKey \}\) === 0\) retry\.mutate\(\)/
    )
    assert.match(gateHook, /isRetrying: retrying/)
  }
)
await check(
  'F8 a stale in-flight status read cannot pay the confirmation owed by a header-less write (cleared only by a read that started after it)',
  async () => {
    const client = dClient()
    client.setQueryData(F_KEY, status('Updating'))
    const goals = await dWatch(client, ['goals', 'progress'], () => dSleep(80).then(() => ({})))
    nDerived.applyDerivedState(client, 'Ready') // cycle running
    await dSleep(10)
    // a status GET that started BEFORE the write is still in flight…
    let release
    const stale = nDerived.readDerivedStatus(client, {
      status: () => new Promise((resolve) => (release = resolve)),
      retry: async () => null,
    })
    const staleResult = stale.then(
      () => 'applied',
      (error) => error.message
    )
    nDerived.applyDerivedHeader(client, undefined) // …the header-less write lands: its confirmation is owed
    release(status('Ready')) // the old read answers (it predates the write)
    assert.match(await staleResult, /Superseded/)
    await dSleep(250) // the refresh lands, the cycle settles
    assert.equal(eGate(client), 'updating', 'a read that predates the write confirmed it')
    assert.equal(nDerived.pollInterval(client.getQueryData(F_KEY)), constant(nDerived, 'POLL_MS'))
    await fConfirm()
    goals.stop()
  }
)
await check(
  'F9 a Ready header, or a Retry answered Ready, after a header-less write pays the owed confirmation (gate opens when the cycle settles)',
  async () => {
    const settle = async (answer) => {
      const client = dClient()
      client.setQueryData(F_KEY, status('Updating'))
      const goals = await dWatch(client, ['goals', 'progress'], () => dSleep(80).then(() => ({})))
      nDerived.applyDerivedState(client, 'Ready')
      await dSleep(10)
      nDerived.applyDerivedHeader(client, undefined)
      await answer(client)
      await dSleep(250)
      assert.equal(eGate(client), 'ready', 'stuck dimmed: the confirmation was never paid')
      assert.equal(nDerived.pollInterval(client.getQueryData(F_KEY)), false)
      goals.stop()
    }
    await settle(async (client) => nDerived.applyDerivedState(client, 'Ready'))
    await settle(async (client) =>
      nDerived.retryDerived(client, {
        status: async () => null,
        retry: async () => status('Ready'),
      })
    )
    await fConfirm()
  }
)
await check(
  'F10 Try again: a header-less write during the POST (cache object unchanged) skips the apply; an older status read cannot overwrite the Retry answer',
  async () => {
    // (1) Failed cache, POST in flight, header-less write → the re-read counter moved though the cache did not: skip, no refresh cycle
    const client = fakeClient(status('Failed'))
    let answer
    const posted = nDerived.retryDerived(client, {
      status: async () => null,
      retry: () => new Promise((resolve) => (answer = resolve)),
    })
    nDerived.applyDerivedHeader(client, undefined)
    client.invalidated.length = 0
    answer(status('Ready'))
    await posted
    assert.equal(
      client.getQueryData(F_KEY).state,
      'Failed',
      'the Retry reply (maybe older than the write) was applied'
    )
    assert.deepEqual(client.invalidated, [], 'a refresh cycle started on a possibly older reply')
    // (2) a status read started before the Retry answer lands after it → superseded, the Retry state stays
    const held = fakeClient(status('Failed'))
    let release
    const old = nDerived
      .readDerivedStatus(held, {
        status: () => new Promise((resolve) => (release = resolve)),
        retry: async () => null,
      })
      .then(
        () => 'applied',
        (error) => error.message
      )
    await nDerived.retryDerived(held, {
      status: async () => null,
      retry: async () => status('Updating'),
    })
    release(status('Failed'))
    assert.match(await old, /Superseded/)
    assert.equal(held.getQueryData(F_KEY).state, 'Updating')
    // (3) the retry mutation stays pending until the status re-read that decides the result has landed (one Retry at a time, buttons stay locked)
    assert.match(
      source('features/derived-data/hooks/use-derived-data.ts'),
      /onSettled: \(\) => client\.invalidateQueries\(\{ queryKey: derivedStatusKey \}\)/
    )
    await fConfirm()
  }
)
await check(
  'F7 a header-less write during a running Ready refresh keeps the gate dimmed after that refresh until a status read confirms',
  async () => {
    const confirmReady = (client) =>
      nDerived.readDerivedStatus(client, {
        status: async () => status('Ready'),
        retry: async () => null,
      })
    // the re-read never answers (no status observer: like a slow or failed GET)
    const client = dClient()
    client.setQueryData(F_KEY, status('Updating'))
    const goals = await dWatch(client, ['goals', 'progress'], () => dSleep(80).then(() => ({})))
    nDerived.applyDerivedState(client, 'Ready')
    await dSleep(10)
    nDerived.applyDerivedHeader(client, undefined)
    assert.equal(eGate(client), 'updating')
    await dSleep(250)
    assert.equal(eGate(client), 'updating', 'the cycle opened the gate over an unconfirmed write')
    assert.equal(
      nDerived.pollInterval(client.getQueryData(F_KEY)),
      constant(nDerived, 'POLL_MS'),
      'polling must take over'
    )
    client.setQueryData(F_KEY, await confirmReady(client))
    assert.equal(eGate(client), 'ready', 'stuck after the confirming read')
    // the confirming read lands BEFORE the refresh: the cycle then opens the gate as usual
    client.setQueryData(F_KEY, status('Updating'))
    nDerived.applyDerivedState(client, 'Ready')
    await dSleep(10)
    nDerived.applyDerivedHeader(client, undefined)
    client.setQueryData(F_KEY, await confirmReady(client))
    assert.equal(eGate(client), 'updating', 'opened before the refresh landed')
    await dSleep(250)
    assert.equal(eGate(client), 'ready', 'never stuck')
    goals.stop()
  }
)

// ── ND: Nutrition Data Manager on Contract v2 (BE/Docs/Design/Ops/NDM_Contract_V2_Examples.md; rounds 1–3 of the user decisions) ────────────────────
const ndUtils = await load('../src/features/nutrition-data/nutrition-data.utils.ts')
const foodEffective = await load('../src/features/food-log/effective.ts')
const macrosDetail = await load('../src/features/dashboard/macros-detail.ts')
const ndDay = (extra = {}) => ({
  date: '2026-10-20',
  calories: 2200,
  proteinG: null,
  fatG: null,
  carbsG: null,
  source: 'Manual',
  isFasting: false,
  isIncomplete: false,
  entryCount: 0,
  hasOverride: true,
  manualCaloriesKcal: 2200,
  manualProteinG: null,
  manualFatG: null,
  manualCarbsG: null,
  foodLogCalories: 0,
  foodLogProteinG: 0,
  foodLogFatG: 0,
  foodLogCarbsG: 0,
  isValidForAlgorithms: true,
  conflict: null,
  ...extra,
})
/** A Food Log day without an override: effective = the foods. */
const ndFoodDay = (extra = {}) =>
  ndDay({
    calories: 1800,
    proteinG: 30,
    fatG: 15,
    carbsG: 60,
    source: 'FoodLog',
    entryCount: 3,
    hasOverride: false,
    manualCaloriesKcal: null,
    foodLogCalories: 1800,
    foodLogProteinG: 30,
    foodLogFatG: 15,
    foodLogCarbsG: 60,
    ...extra,
  })
const ndFastingDay = (extra = {}) =>
  ndDay({
    calories: 0,
    proteinG: 0,
    fatG: 0,
    carbsG: 0,
    source: 'Fasting',
    isFasting: true,
    hasOverride: false,
    manualCaloriesKcal: null,
    ...extra,
  })
const ndSave = (existing, over = {}) => {
  const { texts, fasting, incomplete, ...rest } = over
  return need(
    ndUtils,
    'buildSavePayload'
  )({
    date: '2026-10-20',
    texts: texts ?? need(ndUtils, 'initialTexts')(existing),
    fasting: fasting ?? existing?.isFasting ?? false,
    incomplete: incomplete ?? existing?.isIncomplete ?? false,
    existing,
    ...rest,
  })
}
const ND_NO_NUMBERS = { calories: null, proteinG: null, fatG: null, carbsG: null }
const ndTexts = (calories = '', protein = '', fat = '', carbs = '') => ({
  calories,
  protein,
  fat,
  carbs,
})
const ndErr = (out) => (out.ok ? null : out.error)

await check(
  'ND1 opening Edit Day and saving without changing a number sends NO numbers (no override is created or rewritten), for every kind of day',
  () => {
    for (const [label, existing] of [
      ['calories-only override', ndDay()],
      ['override with macros', ndDay({ manualProteinG: 140, manualFatG: 60.5, manualCarbsG: 190 })],
      [
        'macro-only override (calories null)',
        ndDay({ calories: null, manualCaloriesKcal: null, manualProteinG: 90, proteinG: 90 }),
      ],
      ['manual zero', ndDay({ calories: 0, manualCaloriesKcal: 0, isValidForAlgorithms: false })],
      ['fasting day', ndFastingDay()],
      ['Food Log day without override', ndFoodDay()],
      ['incomplete override', ndDay({ isIncomplete: true })],
    ]) {
      const out = ndSave(existing)
      assert.ok(out.ok, label)
      assert.deepEqual(
        { ...out.payload, isFasting: undefined, isIncomplete: undefined },
        { date: '2026-10-20', ...ND_NO_NUMBERS, isFasting: undefined, isIncomplete: undefined },
        `${label}: numbers were re-sent`
      )
      assert.equal(out.payload.isFasting, existing.isFasting, label)
      assert.equal(out.payload.isIncomplete, existing.isIncomplete, label)
      assert.equal(
        need(ndUtils, 'isNoChange')(out.payload, existing),
        true,
        `${label}: not "no change"`
      )
    }
    // only the incomplete switch flipped: still no numbers
    assert.deepEqual(ndSave(ndDay(), { incomplete: true }).payload, {
      date: '2026-10-20',
      ...ND_NO_NUMBERS,
      isFasting: false,
      isIncomplete: true,
    })
    // a real edit sends exactly the typed values; an empty field stays null (never 0), an explicit 0 stays 0
    assert.deepEqual(ndSave(ndDay(), { texts: ndTexts('2300', '', '0', '') }).payload, {
      date: '2026-10-20',
      calories: 2300,
      proteinG: null,
      fatG: 0,
      carbsG: null,
      isFasting: false,
      isIncomplete: false,
    })
  }
)
await check(
  'ND2 the sheet starts from what the user ENTERED (manual*), never from the effective / Food Log numbers; a Food Log day can take an override that copies nothing from the foods',
  () => {
    const initial = need(ndUtils, 'initialTexts')
    assert.deepEqual(initial(ndFoodDay()), ndTexts(), 'Food Log numbers leaked into the fields')
    assert.deepEqual(initial(ndFastingDay()), ndTexts())
    assert.deepEqual(initial(undefined), ndTexts())
    assert.deepEqual(
      initial(
        ndDay({ manualCaloriesKcal: 0, manualProteinG: 0, manualFatG: null, manualCarbsG: 12.5 })
      ),
      ndTexts('0', '0', '', '12.5'),
      'null and 0 are different'
    )
    // calories typed over a day with foods: only what was typed is sent (macros are NOT taken from the foods)
    const out = ndSave(ndFoodDay(), { texts: ndTexts('2200') })
    assert.deepEqual(out.payload, {
      date: '2026-10-20',
      calories: 2200,
      proteinG: null,
      fatG: null,
      carbsG: null,
      isFasting: false,
      isIncomplete: false,
    })
  }
)
await check(
  'ND3 validation (v2): macro-only / calories-only / partial are valid, null ≠ 0, limits, fasting conflict, clearing every field never deletes',
  () => {
    // macro-only: calories stay empty (null) — no "enter calories" rule and no kcal computed from macros
    assert.deepEqual(ndSave(undefined, { texts: ndTexts('', '90') }).payload, {
      date: '2026-10-20',
      calories: null,
      proteinG: 90,
      fatG: null,
      carbsG: null,
      isFasting: false,
      isIncomplete: false,
    })
    assert.equal(ndSave(undefined, { texts: ndTexts('', '', '40', '') }).payload.fatG, 40)
    assert.equal(ndSave(undefined, { texts: ndTexts('', '', '', '5.5') }).payload.carbsG, 5.5)
    assert.equal(ndSave(undefined, { texts: ndTexts('2200') }).payload.calories, 2200)
    assert.equal(
      ndSave(undefined, { texts: ndTexts('0') }).payload.calories,
      0,
      'an explicit 0 is a number'
    )
    assert.equal(ndSave(undefined, { texts: ndTexts('.') }).ok, false, '"." is not a number')
    // limits
    assert.equal(ndSave(undefined, { texts: ndTexts('10000') }).ok, true)
    assert.match(ndErr(ndSave(undefined, { texts: ndTexts('10001') })), /at most 10000/)
    assert.equal(ndSave(undefined, { texts: ndTexts('100', '1000') }).ok, true)
    assert.match(ndErr(ndSave(undefined, { texts: ndTexts('100', '1000.5') })), /at most 1000/)
    assert.match(ndErr(ndSave(undefined, { texts: ndTexts('', '', '', '1001') })), /at most 1000/)
    // fasting: blank or zero is fine and sends no numbers; any value above zero is a conflict the user must fix (nothing is dropped silently)
    assert.deepEqual(ndSave(undefined, { texts: ndTexts(''), fasting: true }).payload, {
      date: '2026-10-20',
      ...ND_NO_NUMBERS,
      isFasting: true,
      isIncomplete: false,
    })
    assert.equal(ndSave(undefined, { texts: ndTexts('0', '0'), fasting: true }).ok, true)
    assert.match(
      ndErr(ndSave(undefined, { texts: ndTexts('500'), fasting: true })),
      /fasting day can't also have manual nutrition above zero/
    )
    assert.match(
      ndErr(ndSave(undefined, { texts: ndTexts('', '10'), fasting: true })),
      /Turn fasting off or set the values to zero/
    )
    // round 4 D3, same rule as the BE: calories null + ANY single macro above zero is a conflict; null / explicit 0 everywhere is not
    for (const [name, texts] of [
      ['protein', ndTexts('', '1')],
      ['fat', ndTexts('', '', '1')],
      ['carbs', ndTexts('', '', '', '1')],
      ['decimal protein', ndTexts('', '0.5')],
      ['calories', ndTexts('1')],
    ]) {
      const blocked = ndSave(undefined, { texts, fasting: true })
      assert.equal(blocked.ok, false, `fasting + ${name} > 0 must be blocked`)
      assert.match(ndErr(blocked), /Turn fasting off or set the values to zero/)
    }
    for (const texts of [
      ndTexts(),
      ndTexts('0'),
      ndTexts('', '0', '0', '0'),
      ndTexts('0', '0', '0', '0'),
    ]) {
      const allowed = ndSave(undefined, { texts, fasting: true })
      assert.equal(allowed.ok, true, 'fasting + null / 0 fields is allowed')
      assert.deepEqual(allowed.payload, {
        date: '2026-10-20',
        ...ND_NO_NUMBERS,
        isFasting: true,
        isIncomplete: false,
      })
    }
    // E2E finding: turning fasting on over a day that HAS manual values — the user lowers them to 0 as the error says; the zeros must be SENT (a flags-only request leaves the old
    // manual values in the BE, which rejects it again with the same message = a loop). Without an override nothing is sent but the flags.
    const manualDay = ndDay({
      manualCaloriesKcal: 1800,
      manualProteinG: 100,
      manualFatG: 60,
      manualCarbsG: 180,
    })
    assert.deepEqual(
      ndSave(manualDay, { texts: ndTexts('0', '0', '0', '0'), fasting: true }).payload,
      {
        date: '2026-10-20',
        calories: 0,
        proteinG: 0,
        fatG: 0,
        carbsG: 0,
        isFasting: true,
        isIncomplete: false,
      }
    )
    // blank fields stay unknown (null), typed zeros stay zero
    assert.deepEqual(ndSave(manualDay, { texts: ndTexts('0'), fasting: true }).payload, {
      date: '2026-10-20',
      calories: 0,
      proteinG: null,
      fatG: null,
      carbsG: null,
      isFasting: true,
      isIncomplete: false,
    })
    // still blocked while any value is above zero
    assert.equal(ndSave(manualDay, { texts: ndTexts('1800'), fasting: true }).ok, false)
    // no override on the day: flags only, as before
    assert.deepEqual(
      ndSave(ndDay({ hasOverride: false }), { texts: ndTexts('0', '0'), fasting: true }).payload,
      { date: '2026-10-20', ...ND_NO_NUMBERS, isFasting: true, isIncomplete: false }
    )
    // clearing EVERY field of a day that has an override deletes nothing and says how to remove it
    const cleared = ndSave(ndDay(), { texts: ndTexts() })
    assert.equal(cleared.ok, false)
    assert.match(ndErr(cleared), /Use Remove manual entry/)
    // a new day with nothing typed has nothing to save
    assert.match(
      ndErr(ndSave(undefined, { texts: ndTexts() })),
      /Enter calories or macros, or turn on fasting/
    )
    // decimals: macros take one decimal, calories are whole numbers
    const pattern = constant(ndUtils, 'FIELD_PATTERN')
    assert.ok(pattern.protein.test('12.5') && pattern.fat.test('0.') && pattern.carbs.test('.5'))
    assert.ok(!pattern.protein.test('12.55') && !pattern.calories.test('12.5'))
    assert.equal(need(ndUtils, 'toNumber')('12.5'), 12.5)
    assert.equal(need(ndUtils, 'toNumber')(''), null)
  }
)
await check(
  'ND4 [wiring] the sheet saves through buildSavePayload only (no inline parsing, no lock on Food Log days); list shows the BE source and eligibility; Save / Delete refresh the log, derived numbers and the day list',
  () => {
    const sheet = source('features/nutrition-data/components/NutritionDaySheet.tsx')
    assert.match(sheet, /buildSavePayload\(\{ date, texts, fasting, incomplete, existing \}\)/)
    assert.ok(
      !/toNumber\(|calories: toText/.test(sheet),
      'inline number parsing is back in the sheet'
    )
    assert.ok(
      !/readOnly=\{locked|existing\?\.source === 'App'/.test(sheet),
      'Food Log days are locked again'
    )
    const page = source('features/nutrition-data/pages/NutritionDataPage.tsx')
    assert.match(page, /sourceSrText\(day\)/)
    assert.match(page, /notUsedForExpenditure\(day\)[\s\S]{0,200}Not used for Expenditure/)
    assert.match(page, /<Energy kcal=\{day\.calories\} \/>/, 'effective kcal (null prints "—")')
    const hooks = source('features/nutrition-data/hooks/use-nutrition-data.ts')
    assert.match(hooks, /invalidateLogData\(queryClient\)/)
    assert.match(hooks, /\[KEY, \['weights'\]\]/)
    // …and every Food Log write refreshes the Data Manager list (the other direction of the sync)
    assert.match(
      source('features/food-log/hooks/use-food-log.ts'),
      /LOG_DERIVED_KEYS = \[[\s\S]*?\['nutrition-data'\],\s*\] as const/
    )
  }
)
await check(
  'ND5 no fake success / no FE arithmetic on BE totals: an unchanged save is not sent and not toasted; deleting a food does not edit the day totals; unknown calories stay null ("—")',
  () => {
    const isNoChange = need(ndUtils, 'isNoChange')
    const flags = (isFasting, isIncomplete) => ({
      date: '2026-10-20',
      ...ND_NO_NUMBERS,
      isFasting,
      isIncomplete,
    })
    const day = ndDay({ isIncomplete: true })
    assert.equal(isNoChange(flags(false, true), day), true)
    assert.equal(isNoChange(flags(false, false), day), false, 'a flag change is a real save')
    assert.equal(isNoChange(flags(true, true), day), false)
    assert.equal(
      isNoChange({ ...flags(false, true), calories: 0 }, day),
      false,
      'an explicit 0 is a number'
    )
    assert.equal(
      isNoChange(flags(false, false), undefined),
      false,
      'a new day is never "no change"'
    )
    // an omitted flag (null) keeps the stored one
    assert.equal(
      isNoChange({ ...flags(false, true), isFasting: null, isIncomplete: null }, day),
      true
    )
    const page = source('features/nutrition-data/pages/NutritionDataPage.tsx')
    assert.match(
      page,
      /if \(isNoChange\(payload, existing\)\) \{\s*sheet\.hide\(\)\s*return\s*\}\s*save\.mutate\(/
    )
    // success toasts only inside onSuccess (a failed save / delete shows its error, never "saved")
    const hooks = source('features/nutrition-data/hooks/use-nutrition-data.ts')
    for (const [name, message] of [
      ['useSaveNutritionDay', 'Nutrition saved'],
      ['useDeleteNutritionDay', 'Nutrition deleted'],
    ]) {
      const body = bodyOf(hooks, `export const ${name}`, '\n}\n')
      assert.match(
        body,
        new RegExp(`onSuccess: \\(\\) => \\{\\s*toast\\.success\\('${message}'\\)`)
      )
    }
    // optimistic delete: the entry leaves the list at once, the day totals stay the BE's until the refetch
    const food = source('features/food-log/hooks/use-food-log.ts')
    const optimistic = bodyOf(food, 'export const useDeleteEntry', 'export const useQuickAdd')
    assert.match(optimistic, /entries: day\.entries\.filter\(\(entry\) => entry\.id !== id\)/)
    assert.ok(!/totals|minus\(/.test(optimistic.replace(/\/\/.*$/gm, '')), 'the FE edits BE totals')
    // unknown calories: the type allows null, the sheet starts blank (not "0"), the list prints "—"
    const types = source('features/nutrition-data/types/nutrition-data.types.ts')
    assert.match(interfaceOf(types, 'NutritionDay'), /calories: number \| null/)
    assert.match(interfaceOf(types, 'NutritionDay'), /manualCaloriesKcal: number \| null/)
    assert.equal(need(ndUtils, 'initialTexts')(ndDay({ manualCaloriesKcal: null })).calories, '')
    assert.equal(need(units, 'energyMeasure')('kcal').format(null), '—')
  }
)

// ── Errors and endpoints (P0 contract, still in force under v2) ───────────────────────────────────────────────────────────────────────────────────────
const apiError = (status, errors = null, message = 'BE message') => ({
  response: { status, data: { message, errors } },
})
await check(
  'ND6 error fixtures: keyed on errors.reasonCode (any key case) — 409 CONCURRENT / FASTING_NEEDS_EMPTY_DAY, 400 USE_REMOVE_OVERRIDE / NOTHING_TO_SAVE / FASTING_WITH_MANUAL_NUTRITION — never reads as success',
  () => {
    const reasonOf = need(ndUtils, 'ndmReasonOf')
    const message = need(ndUtils, 'ndmErrorMessage')
    const fallback = () => 'FALLBACK'
    // exact JSON shape of the BE: ApiResponse.Fail(message, status, { reasonCode: [code] })
    const cases = [
      [409, 'CONCURRENT', /^This day was just updated somewhere else, so nothing was changed/],
      [
        409,
        'FASTING_NEEDS_EMPTY_DAY',
        /Remove them \(or the manual entry\) before marking it as a fasting day\. Nothing was changed\.$/,
      ],
      [400, 'USE_REMOVE_OVERRIDE', /Use Remove manual entry to do that\. Nothing was changed\.$/],
      [
        400,
        'NOTHING_TO_SAVE',
        /^There is nothing to save\. To clear manual values use Remove manual entry\.$/,
      ],
      [
        400,
        'FASTING_WITH_MANUAL_NUTRITION',
        /marked as fasting, so it can't also have manual nutrition above zero\. Remove the fasting mark or lower the values\. Nothing was changed\.$/,
      ],
    ]
    for (const [status, code, text] of cases) {
      const error = apiError(status, { reasonCode: [code] }, 'Dữ liệu BE bằng tiếng Việt')
      assert.equal(reasonOf(error), code, code)
      assert.equal(reasonOf(apiError(status, { ReasonCode: [code] })), code, `${code}: key case`)
      assert.match(message(error, fallback), text, code)
      assert.ok(!/Dữ liệu/.test(message(error, fallback)), `${code}: raw BE message leaked`)
    }
    // a code-less 409 is still the concurrent loser; other statuses / unknown 400s are not NDM reasons
    assert.equal(reasonOf(apiError(409)), 'CONCURRENT')
    assert.equal(reasonOf(apiError(409, {})), 'CONCURRENT')
    assert.equal(reasonOf(apiError(409, { reasonCode: ['SOMETHING_NEW'] })), 'CONCURRENT')
    for (const other of [
      apiError(400),
      apiError(400, { reasonCode: ['SOMETHING_NEW'] }),
      apiError(404),
      apiError(500),
      new Error('Network Error'),
      null,
      undefined,
    ]) {
      assert.equal(reasonOf(other), null)
      assert.equal(message(other, fallback), 'FALLBACK')
    }
  }
)
await check(
  'ND7 four intents, four endpoints: numbers → ONE PUT /nutrition-data; flag-only saves → PUT /{date}/fasting and /{date}/incomplete (one flag each, fasting first)',
  () => {
    const plan = need(ndUtils, 'planSave')
    const flags = (isFasting, isIncomplete) => ({
      date: '2026-10-20',
      ...ND_NO_NUMBERS,
      isFasting,
      isIncomplete,
    })
    const withNumbers = { ...flags(false, true), calories: 2200 }
    assert.deepEqual(plan(withNumbers, ndDay()), [{ kind: 'save', payload: withNumbers }])
    const macroOnly = { ...flags(false, false), proteinG: 90 }
    assert.deepEqual(plan(macroOnly, undefined), [{ kind: 'save', payload: macroOnly }])
    // a new day marked fasting
    assert.deepEqual(plan(flags(true, false), undefined), [
      { kind: 'fasting', date: '2026-10-20', isFasting: true },
    ])
    // a new day both fasting and incomplete: fasting first so the day exists for the incomplete flag
    assert.deepEqual(plan(flags(true, true), undefined), [
      { kind: 'fasting', date: '2026-10-20', isFasting: true },
      { kind: 'incomplete', date: '2026-10-20', isIncomplete: true },
    ])
    // only the incomplete switch on an override / Food Log day
    for (const day of [ndDay(), ndFoodDay()])
      assert.deepEqual(plan(flags(false, true), day), [
        { kind: 'incomplete', date: '2026-10-20', isIncomplete: true },
      ])
    // clearing the fasting mark of a fasting day
    assert.deepEqual(plan(flags(false, false), ndFastingDay()), [
      { kind: 'fasting', date: '2026-10-20', isFasting: false },
    ])
    // nothing changed → nothing is sent; an omitted flag (null) is "keep"
    assert.deepEqual(plan(flags(false, false), ndDay()), [])
    assert.deepEqual(
      plan({ ...flags(false, false), isFasting: null, isIncomplete: null }, ndDay()),
      []
    )
    // wiring: routes, service, hooks
    const routes = source('config/api-routes.ts')
    assert.match(routes, /override: \(date: string\) => `\/nutrition-data\/\$\{date\}\/override`/)
    assert.match(routes, /fasting: \(date: string\) => `\/nutrition-data\/\$\{date\}\/fasting`/)
    assert.match(
      routes,
      /incomplete: \(date: string\) => `\/nutrition-data\/\$\{date\}\/incomplete`/
    )
    const service = source('features/nutrition-data/services/nutrition-data.service.ts')
    assert.match(
      service,
      /apiCall\.delete\(apiRoutes\.nutritionData\.root, \{ params: \{ date \} \}\)/
    )
    assert.match(
      service,
      /apiCall\.delete<NutritionDay>\(apiRoutes\.nutritionData\.override\(date\)\)/
    )
    assert.match(
      service,
      /apiCall\.put<NutritionDay>\(apiRoutes\.nutritionData\.fasting\(date\), \{ isFasting \}\)/
    )
    assert.match(
      service,
      /apiCall\.put<NutritionDay>\(apiRoutes\.nutritionData\.incomplete\(date\), \{ isIncomplete \}\)/
    )
    const hooks = source('features/nutrition-data/hooks/use-nutrition-data.ts')
    assert.match(hooks, /for \(const op of planSave\(payload, existing\)\) await runOp\(op\)/)
    // an error never toasts a success: every success toast sits inside onSuccess
    for (const name of [
      'useSaveNutritionDay',
      'useDeleteNutritionDay',
      'useRemoveManualOverride',
    ]) {
      const body = bodyOf(hooks, `export const ${name}`, '\n}\n')
      const onError = body.slice(body.indexOf('onError'))
      assert.ok(!/toast\.success/.test(onError), `${name}: success toast in onError`)
      assert.match(body, /onSuccess: \(\) => \{\s*toast\.success\(/, name)
    }
    // the page sends { payload, existing } and shows the reason-keyed sentence; "Remove manual entry" is a real button
    const page = source('features/nutrition-data/pages/NutritionDataPage.tsx')
    assert.match(page, /save\.mutate\(\{ payload, existing \}/)
    assert.match(page, /ndmErrorMessage\(save\.error, getFormErrorMessage\)/)
    const sheet = source('features/nutrition-data/components/NutritionDaySheet.tsx')
    assert.match(
      sheet,
      /existing\?\.hasOverride && \([\s\S]{0,300}onClick=\{onRemoveOverride\}[\s\S]{0,200}Remove manual entry/
    )
    assert.match(page, /removeOverride\.mutate\(target\.date/)
  }
)
await check(
  'ND8 each destructive intent has its own exact confirmation text (what is deleted AND what is kept)',
  () => {
    const kept = 'Foods logged in the Food Log, water and notes are kept.'
    assert.equal(constant(ndUtils, 'DELETE_NUTRITION_TITLE'), "Delete this day's nutrition data?")
    const del = need(ndUtils, 'deleteNutritionDescription')
    assert.equal(
      del({ isFasting: false, hasOverride: true }, 'Oct 20, 2026'),
      `Deletes the manual calories and macros you entered for Oct 20, 2026. ${kept}`
    )
    assert.equal(
      del({ isFasting: true, hasOverride: false }, 'Oct 20, 2026'),
      `Deletes the fasting mark from Oct 20, 2026. ${kept}`
    )
    assert.equal(
      del({ isFasting: true, hasOverride: true }, 'Oct 20, 2026'),
      `Deletes the manual calories and macros you entered for Oct 20, 2026 and the fasting mark. ${kept}`
    )
    assert.equal(constant(ndUtils, 'REMOVE_OVERRIDE_TITLE'), 'Remove the manual entry?')
    const remove = need(ndUtils, 'removeOverrideDescription')
    assert.equal(
      remove('Oct 20, 2026', true),
      'Removes only the manual calories and macros for Oct 20, 2026. Foods, water, notes and the fasting mark are kept, and the day goes back to the foods logged in the Food Log.'
    )
    assert.equal(
      remove('Oct 20, 2026', false),
      'Removes only the manual calories and macros for Oct 20, 2026. Water, notes and the fasting mark are kept. No foods are logged on this day, so it will have no nutrition data.'
    )
    assert.equal(constant(ndUtils, 'CLEAR_FOOD_LOG_TITLE'), "Delete this day's foods?")
    assert.equal(
      need(ndUtils, 'clearFoodLogDescription')('Oct 20, 2026'),
      'Deletes all foods logged on Oct 20, 2026. Manual calories and macros, water, notes and the fasting mark are kept.'
    )
    // the screens use exactly these (no second, divergent text) and the old claims are gone
    const ndmPage = source('features/nutrition-data/pages/NutritionDataPage.tsx')
    assert.match(ndmPage, /title=\{DELETE_NUTRITION_TITLE\}/)
    assert.match(
      ndmPage,
      /description=\{deleteNutritionDescription\(existing, formatDate\(target\.date\)\)\}/
    )
    assert.match(ndmPage, /title=\{REMOVE_OVERRIDE_TITLE\}/)
    assert.match(
      ndmPage,
      /removeOverrideDescription\(\s*formatDate\(target\.date\),\s*\(existing\?\.entryCount \?\? 0\) > 0\s*\)/
    )
    assert.ok(!/will be deleted\. Foods logged/.test(ndmPage), 'old NDM delete text')
    const foodPage = source('features/food-log/pages/FoodLogPage.tsx')
    assert.match(foodPage, /title=\{CLEAR_FOOD_LOG_TITLE\}/)
    assert.match(foodPage, /clearFoodLogDescription\(formatDate\(date\)\)/)
    assert.ok(!/treat this day as not logged/.test(foodPage), 'old Clear Day claim')
    const foodHooks = source('features/food-log/hooks/use-food-log.ts')
    assert.match(
      bodyOf(foodHooks, 'export const useClearDay', '\n\n'),
      /Day's foods deleted[\s\S]*Couldn't delete the day's foods/
    )
    // Clear Day failures (incl. the concurrent 409) read in English, never as a success
    assert.match(foodHooks, /if \(failureTitle\) return reportLogError\(error, failureTitle\)/)
    assert.match(foodPage, /ndmErrorMessage\(deleteError, getFormErrorMessage\)/)
    // Remove Override refreshes everything that reads effective intake
    assert.match(
      bodyOf(
        source('features/nutrition-data/hooks/use-nutrition-data.ts'),
        'export const useRemoveManualOverride',
        '\n}\n'
      ),
      /onSuccess: \(\) => \{\s*toast\.success\('Manual entry removed'\)\s*void invalidate\(\)/
    )
  }
)
await check(
  'ND9 BE flags drive the notices (never inferred from 0): conflict notice, "manual takes priority", eligibility line, source text; manual 0 + foods is informational and never becomes Fasting',
  () => {
    const conflict = need(ndUtils, 'conflictNotice')
    const override = need(ndUtils, 'overrideNotice')
    const eligibility = need(ndUtils, 'eligibilityNotice')
    const notUsed = need(ndUtils, 'notUsedForExpenditure')
    const zeroWithFoods = ndDay({
      calories: 0,
      manualCaloriesKcal: 0,
      entryCount: 3,
      foodLogCalories: 1800,
      isValidForAlgorithms: false,
      conflict: 'MANUAL_ZERO_WITH_FOOD_LOG',
    })
    assert.equal(
      conflict(zeroWithFoods),
      'Manual data takes priority. Foods logged in the Food Log are kept.'
    )
    assert.equal(override(zeroWithFoods), conflict(zeroWithFoods))
    assert.match(
      conflict(ndDay({ conflict: 'FASTING_WITH_MANUAL_NUTRITION' })),
      /marked as fasting and also has manual values above zero\. Remove the fasting mark or lower the values\./
    )
    // an override over foods without a conflict still says the manual numbers win; no override / no foods → no notice
    assert.equal(
      override(ndDay({ entryCount: 2 })),
      'Manual data takes priority. Foods logged in the Food Log are kept.'
    )
    assert.equal(override(ndDay()), null)
    assert.equal(override(ndFoodDay()), null)
    // eligibility: only the BE flag decides; a 0 kcal day that the BE marks valid (fasting) gets no line
    assert.equal(eligibility(zeroWithFoods), "This day isn't used for Expenditure.")
    assert.equal(eligibility(ndFastingDay({ isValidForAlgorithms: true })), null)
    assert.equal(
      eligibility(ndDay({ calories: 0, manualCaloriesKcal: 0, isValidForAlgorithms: true })),
      null
    )
    assert.equal(
      eligibility(ndDay({ isIncomplete: true, isValidForAlgorithms: false })),
      'This day is marked incomplete, so Expenditure skips it.'
    )
    assert.equal(notUsed(zeroWithFoods), true)
    assert.equal(
      notUsed(ndDay({ isIncomplete: true, isValidForAlgorithms: false })),
      false,
      'incomplete has its own icon'
    )
    assert.equal(
      notUsed(ndDay({ calories: 0, manualCaloriesKcal: 0, isValidForAlgorithms: true })),
      false,
      'a 0 the BE accepts is not flagged'
    )
    const srText = need(ndUtils, 'sourceSrText')
    assert.equal(srText({ source: 'Manual' }), ', entered manually')
    assert.equal(srText({ source: 'FoodLog' }), ', logged in Food Log')
    assert.equal(srText({ source: 'Fasting' }), ', fasting day')
    assert.deepEqual(
      { ...constant(ndUtils, 'SOURCE_LABEL') },
      { Manual: 'Manual', FoodLog: 'Food Log', Fasting: 'Fasting' }
    )
    // the sheet shows Effective / Food Log total / Data source for an override over foods, from the BE fields only, with no auto-fix (the save never flips fasting)
    const sheet = source('features/nutrition-data/components/NutritionDaySheet.tsx')
    assert.match(sheet, /Effective calories[\s\S]*Food Log total[\s\S]*Data source/)
    assert.match(sheet, /existing\.calories === null \? '—' : energy\.text\(existing\.calories\)/)
    assert.match(sheet, /energy\.text\(existing\.foodLogCalories\)/)
    assert.match(sheet, /SOURCE_LABEL\[existing\.source\]/)
    assert.match(sheet, /placeholder="—"/)
    assert.match(sheet, /unknownHint="no macro data"/)
    // the fasting switch is locked while foods are logged (BE would 409) instead of letting the user hit the error
    assert.match(sheet, /const fastingBlocked = hasFoods && !existing\?\.isFasting/)
  }
)
await check(
  'ND10 paging: 90 is a page size, not a history limit — cursor pages, one row per day, newest first, older days stay reachable, an older picked date is looked up on its own',
  () => {
    const merge = need(ndUtils, 'mergePages')
    const d = (date) => ndDay({ date })
    // pages arrive newest first; a refetch can make them overlap or arrive out of order
    const merged = merge([
      [d('2026-10-25'), d('2026-10-24'), d('2026-10-23')],
      [d('2026-10-23'), d('2026-10-22')],
      [d('2026-10-24'), d('2026-10-21')],
    ])
    assert.deepEqual(
      merged.map((day) => day.date),
      ['2026-10-25', '2026-10-24', '2026-10-23', '2026-10-22', '2026-10-21']
    )
    // the earlier page wins for a duplicated day
    assert.equal(
      merge([[d('2026-10-23')], [{ ...d('2026-10-23'), calories: 1 }]])[0].calories,
      2200
    )
    assert.deepEqual(merge([]), [])
    assert.deepEqual(merge([[], []]), [])
    // wiring
    const service = source('features/nutrition-data/services/nutrition-data.service.ts')
    assert.match(service, /export const PAGE_SIZE = 90/)
    assert.match(service, /params: \{ limit: PAGE_SIZE, \.\.\.\(before \? \{ before \} : \{\}\) \}/)
    assert.match(service, /params: \{ from: date, to: date, limit: 1 \}/)
    const hooks = source('features/nutrition-data/hooks/use-nutrition-data.ts')
    assert.match(hooks, /useInfiniteQuery\(\{/)
    assert.match(hooks, /initialPageParam: null as string \| null/)
    assert.match(
      hooks,
      /getNextPageParam: \(last\) => \(last\?\.hasMore \? \(last\.nextBefore \?\? undefined\) : undefined\)/
    )
    assert.match(
      hooks,
      /select: \(data\) => mergePages\(data\.pages\.map\(\(page\) => page\?\.items \?\? \[\]\)\)/
    )
    assert.match(hooks, /queryKey: \[\.\.\.KEY, 'day', date\]/)
    const page = source('features/nutrition-data/pages/NutritionDataPage.tsx')
    assert.match(page, /query\.hasNextPage && \(/)
    assert.match(page, /onClick=\{\(\) => void query\.fetchNextPage\(\)\}/)
    assert.match(page, /'Load earlier'/)
    assert.match(page, /target\.date < oldest/)
    assert.match(page, /useNutritionDayLookup\(target\.date, Boolean\(needsLookup\)\)/)
    assert.match(page, /key=\{`\$\{sheet\.id\}-\$\{target\.date\}-\$\{loadingExisting\}`\}/)
    assert.match(
      source('features/nutrition-data/components/NutritionDaySheet.tsx'),
      /if \(isPending \|\| loadingExisting\) return/
    )
  }
)
await check(
  'ND11 effective totals come from the BE (`effective`), null stays null: shownTotals, weekly sums, bars, progress, macro chart — no fake 0, no Other = total, no macro taken from the foods',
  () => {
    const shown = need(foodEffective, 'shownTotals')
    const raw = { calories: 1800, protein: 30, carbs: 60, fat: 15, fiber: 7 }
    // no `effective` (older BE): the raw totals as before
    assert.deepEqual(shown({ totals: raw }), raw)
    // calories-only override over foods: kcal 2200, macros null (NOT the foods' 30 / 60 / 15), fiber stays the foods'
    const calOnly = {
      calories: 2200,
      proteinG: null,
      carbsG: null,
      fatG: null,
      source: 'Manual',
      hasOverride: true,
      manualCaloriesKcal: 2200,
      manualProteinG: null,
      manualCarbsG: null,
      manualFatG: null,
      foodLogCalories: 1800,
      foodLogProteinG: 30,
      foodLogCarbsG: 60,
      foodLogFatG: 15,
      isValidForAlgorithms: true,
      conflict: null,
    }
    assert.deepEqual(shown({ totals: raw, effective: calOnly }), {
      calories: 2200,
      protein: null,
      carbs: null,
      fat: null,
      fiber: 7,
    })
    // explicit zero stays zero; a macro-only day has null kcal
    assert.equal(
      shown({ totals: raw, effective: { ...calOnly, calories: 0, proteinG: 0 } }).protein,
      0
    )
    assert.equal(
      shown({ totals: raw, effective: { ...calOnly, calories: null, proteinG: 90 } }).calories,
      null
    )
    // caption: only for an override, with the BE raw Food Log total
    const caption = need(foodEffective, 'overrideCaption')
    assert.equal(
      caption(calOnly, 3, (kcal) => `${kcal} kcal`),
      'Manual entry · Food Log 1800 kcal'
    )
    assert.equal(
      caption(calOnly, 0, (kcal) => `${kcal} kcal`),
      'Manual entry'
    )
    assert.equal(
      caption({ ...calOnly, hasOverride: false }, 3, () => 'x'),
      null
    )
    assert.equal(
      caption(undefined, 3, () => 'x'),
      null
    )
    // progress with an unknown eaten value: "—" and an empty bar, never 0
    const progress = need(remaining, 'shownProgressOrUnknown')
    assert.deepEqual(progress(null, 150, Math.round), {
      consumed: null,
      goal: 150,
      remaining: null,
    })
    assert.deepEqual(progress(null, null, Math.round), {
      consumed: null,
      goal: null,
      remaining: null,
    })
    assert.deepEqual(progress(90, 150, Math.round), { consumed: 90, goal: 150, remaining: 60 })
    assert.deepEqual(need(goal, 'weekBarProgress')(null, 150, 'consumed'), {
      progress: 0,
      over: false,
    })
    assert.deepEqual(need(goal, 'weekBarProgress')(null, 150, 'remaining'), {
      progress: 0,
      over: false,
    })
    // weekly sum: unknown days do not count as 0; no known day → null ("—")
    const week = need(dashboardUtils, 'weekSummary')
    const day = (date, protein) => ({
      logDate: date,
      isLogged: true,
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      effective: { ...calOnly, calories: 2200, proteinG: protein },
      target: null,
    })
    const goalOf = () => 150
    const round = (value) => Math.round(value)
    assert.equal(
      week([day('a', 90), day('b', null), day('c', 60)], 'protein', goalOf, 'consumed', round)
        .value,
      150
    )
    assert.equal(
      week([day('a', null), day('b', null)], 'protein', goalOf, 'consumed', round).value,
      null
    )
    assert.equal(week([day('a', null)], 'calories', goalOf, 'consumed', round).value, 2200)
    // macro series: a calories-only day draws NO column and has NO fake Other / macros; it stays in the history with the BE numbers
    const macros = macrosDetail
    const full = {
      date: '2026-10-21',
      isLogged: true,
      isFasting: false,
      isIncomplete: false,
      caloriesKcal: 2000,
      proteinG: 100,
      fatG: 70,
      carbsG: 250,
      proteinKcal: 400,
      fatKcal: 630,
      carbsKcal: 1000,
      otherKcal: -30,
    }
    const calOnlyDay = {
      date: '2026-10-22',
      isLogged: true,
      isFasting: false,
      isIncomplete: false,
      caloriesKcal: 2200,
      proteinG: null,
      fatG: null,
      carbsG: null,
      proteinKcal: null,
      fatKcal: null,
      carbsKcal: null,
      otherKcal: null,
    }
    const macroOnlyDay = {
      ...calOnlyDay,
      date: '2026-10-24',
      caloriesKcal: null,
      proteinG: 90,
      proteinKcal: 360,
    }
    const unlogged = { ...calOnlyDay, date: '2026-10-23', isLogged: false, caloriesKcal: null }
    const series = {
      from: '2026-10-21',
      to: '2026-10-24',
      days: [full, calOnlyDay, unlogged, macroOnlyDay],
      summary: {},
      buckets: [],
    }
    assert.deepEqual(
      macros.macroBarsOf(series, 'daily').map((bar) => bar.date),
      ['2026-10-21']
    )
    assert.equal(macros.macroBarOn(series, '2026-10-22'), null)
    const partial = need(macros, 'partialDaysOf')(series)
    assert.deepEqual(
      partial.map((p) => p.date),
      ['2026-10-22', '2026-10-24']
    )
    assert.equal(partial[0].caloriesKcal, 2200, 'the calories are kept')
    assert.equal(partial[0].proteinG, null)
    assert.equal(partial[1].caloriesKcal, null)
    assert.equal(partial[1].proteinG, 90)
    // wiring: the screens read the shared helper and print "—"
    const dashData = source('features/dashboard/hooks/use-dashboard-data.ts')
    assert.match(dashData, /const totals = dayLog\.data \? shownTotals\(dayLog\.data\) : undefined/)
    assert.match(dashData, /known: value !== null/)
    assert.match(source('features/food-log/pages/FoodLogPage.tsx'), /shownTotals\(day\.data\)/)
    assert.match(
      source('features/food-log/components/FoodLogPage/MacroSummary.tsx'),
      /\$\{value \?\? '—'\}/
    )
    // screen readers get words for the dash (E2E finding: "F —/68" alone says nothing)
    assert.match(
      source('features/food-log/components/FoodLogPage/MacroSummary.tsx'),
      /value === null && <span className="sr-only">, no data<\/span>/
    )
    assert.match(
      source('features/dashboard/components/DashboardPage/WeekMatrix.tsx'),
      /\{value \?\? '—'\}/
    )
    assert.match(source('features/dashboard/pages/MacrosDetailPage.tsx'), /partial=\{partialDays\}/)
    assert.match(
      source('features/dashboard/components/MacrosPage/MacrosBreakdownList.tsx'),
      /Breakdown unavailable/
    )
    assert.match(
      source('features/dashboard/components/DashboardPage/LayoutSection.tsx'),
      /nutrientValue\(data\.nutrientsToday, 'macros'\)\.known === false\s*\? '---'/
    )
  }
)
await check(
  'ND12 round 4 D1: the Add / Edit Food strip shows the BE effective day (override wins, unknown = "—", plate never added), with the Food Log subtotal on its own line',
  () => {
    const strip = source('features/food-log/components/FoodLogPage/AddFoodProgress.tsx')
    // override → main value from the BE effective fields, never the foods; PlateOnly keeps showing the plate
    assert.match(
      strip,
      /const overridden = effective\?\.hasOverride === true && display !== 'PlateOnly'/
    )
    assert.match(strip, /effective\?\.calories/)
    assert.match(strip, /effective\?\.proteinG/)
    assert.match(strip, /effective\?\.fatG/)
    assert.match(strip, /effective\?\.carbsG/)
    // an unknown (null) effective value is "—" with words for screen readers — never 0, never filled from the foods
    assert.match(
      strip,
      /const day = overridden \? effectiveOf\(cell\.key\) : \(totals\?\.\[cell\.key\] \?\? 0\)/
    )
    assert.match(strip, /const value = unknown\s*\? null/)
    assert.match(strip, /unknown && <span className="sr-only">, no data<\/span>/)
    // the plate does not change an override: nothing of it is added to the effective value
    assert.match(strip, /overridden \? 0 : plate\[cell\.key\]/)
    // the Food Log subtotal is the BE raw foodLogCalories (+ the plate preview), on its own line
    assert.match(
      strip,
      /Food Log \$\{energy\.text\(\(effective\?\.foodLogCalories \?\? 0\) \+ plate\.calories\)\}/
    )
    // wiring: both dialogs and the page pass the BE effective day through
    for (const file of [
      'features/food-log/components/FoodLogPage/AddFoodDialog.tsx',
      'features/food-log/components/FoodLogPage/EntryEditDialog.tsx',
    ]) {
      const text = source(file)
      assert.match(text, /readonly effective\?: EffectiveNutrition \| null/)
      assert.match(text, /effective=\{effective\}/)
    }
    const page = source('features/food-log/pages/FoodLogPage.tsx')
    assert.equal((page.match(/effective=\{day\.data\?\.effective\}/g) ?? []).length, 2)
  }
)
await check(
  'ND13 round 4 D1 on the Plate | Day view: macro cards = the BE `effective` of plate/nutrients (override wins, null stays "---", no override = foods + plate from the BE), `day` rows only for micronutrients; plate / entry rows never show the day effective',
  () => {
    const breakdown = need(foodEffective, 'dayBreakdown')
    const effective = {
      calories: 2000,
      proteinG: null,
      carbsG: null,
      fatG: 12,
      source: 'Manual',
      hasOverride: true,
      manualCaloriesKcal: 2000,
      manualProteinG: null,
      manualCarbsG: null,
      manualFatG: 12,
      foodLogCalories: 400,
      foodLogProteinG: 20,
      foodLogCarbsG: 40,
      foodLogFatG: 8,
      isValidForAlgorithms: true,
      conflict: null,
    }
    // override: the BE value as is (NOT foods + plate); the BE Food Log subtotal already includes the plate; the plate stays its own preview number
    assert.deepEqual(breakdown(effective, 'calories', 100), {
      main: 2000,
      foodLog: 400,
      plate: 100,
      overridden: true,
    })
    // unknown macros stay null — never the foods' 20 / 40, never 0
    assert.equal(breakdown(effective, 'protein', 7).main, null)
    assert.equal(breakdown(effective, 'carbs', 0).main, null)
    assert.equal(breakdown(effective, 'fat', 3).main, 12)
    // explicit 0 is a known value
    assert.equal(breakdown({ ...effective, proteinG: 0 }, 'protein', 1).main, 0)
    // no override: the BE effective is foods + plate; no extra "Food Log … incl. Plate" line
    const plain = { ...effective, hasOverride: false, source: 'FoodLog', calories: 400 }
    assert.deepEqual(breakdown(plain, 'calories', 100), {
      main: 400,
      foodLog: 400,
      plate: 100,
      overridden: false,
    })
    // BE without `effective` (older BE) or an empty day + empty plate (null): the raw `day` row is used by the view, never a guess
    assert.equal(breakdown(null, 'calories', 100), null)
    assert.equal(breakdown(undefined, 'calories', 100), null)
    const view = source('features/food-log/components/FoodLogPage/PlatePanel/PlateNutrition.tsx')
    // Day mode, four macros only, from the plate/nutrients answer
    assert.match(
      view,
      /view === 'day' && MACRO_CARDS\.some\(\(card\) => card\.key === key\)\s*\? dayBreakdown\(remote\.data\?\.effectiveDay, key as MacroKey, platePreviewOf\(key as MacroKey\)\)/
    )
    // the plate share of the "incl. Plate" line is the BE plate row (same snapshot rounding as the Food Log subtotal beside it); the local sum only while the BE has not answered
    assert.match(
      view,
      /remote\.data\?\.plate\.find\(\(row\) => row\.key === key\)\?\.amount \?\? plateTotals\[key\]/
    )
    assert.match(view, /const card = dayCard\(key\)\s*if \(card\) return card\.main/)
    assert.match(
      view,
      /Food Log \{format\(day\.foodLog\)\} · incl\. Plate \+\{format\(day\.plate\)\}/
    )
    // no local workaround: nothing of the day log (totals / effective) reaches the Plate | Day view, and an unknown day is "---" — not foods + plate guessed in the browser
    assert.doesNotMatch(view, /dayTotals|dayEffective/)
    assert.match(
      view,
      /view === 'plate' && MACRO_CARDS\.some\(\(card\) => card\.key === key\)\s*\? plateTotals\[key as keyof MacroTotals\]\s*: null/
    )
    for (const file of [
      'features/food-log/components/FoodLogPage/PlatePanel/PlatePanel.tsx',
      'features/food-log/components/FoodLogPage/AiPlateView.tsx',
      'features/food-log/components/FoodLogPage/AiPanel.tsx',
    ])
      assert.doesNotMatch(source(file), /dayTotals|dayEffective/)
    // the Plate view and the selection summary (entry rows) read the plate / selection rows only, never the day's effective
    assert.match(
      view,
      /const rows = view === 'plate' \? remote\.data\?\.plate : remote\.data\?\.day/
    )
    assert.equal((view.match(/remote\.data\?\.effectiveDay/g) ?? []).length, 1)
    assert.doesNotMatch(
      source('features/food-log/components/FoodLogPage/SelectionSummarySheet.tsx'),
      /effective/
    )
    // the response type carries the BE `effective` (additive, absent on an older BE)
    assert.match(
      interfaceOf(source('features/food-log/types/food-log.types.ts'), 'PlateNutrientsResponse'),
      /effectiveDay\?: EffectiveNutrition \| null/
    )
  }
)

const plateStorage = await load('../src/features/food-log/plate-storage.ts')
await check(
  'PL1 P0 "logged 4 foods, gone on return": the plate (foods staged with "+") survives leaving the page / reload, expires after 12 h, and a corrupt store never throws',
  () => {
    const parse = need(plateStorage, 'parseStoredPlate')
    const serialize = need(plateStorage, 'serializePlate')
    const ttl = constant(plateStorage, 'PLATE_TTL_MS')
    const item = (n) => ({
      key: `k${n}`,
      foodItemId: `f${n}`,
      name: `Food ${n}`,
      foodServingId: null,
      servingLabel: '1 piece',
      quantity: 1,
      calories: 100 + n,
      protein: 1,
      carbs: 2,
      fat: 3,
    })
    const four = [1, 2, 3, 4].map(item)
    const now = 1_000_000_000_000
    // round trip: all four come back, in order (nothing dropped, nothing duplicated)
    assert.deepEqual(parse(serialize(four, now), now + 60_000), four)
    // expired (older than the TTL) → empty, so yesterday's foods do not follow the user into today
    assert.deepEqual(parse(serialize(four, now), now + ttl + 1), [])
    assert.equal(parse(serialize(four, now), now + ttl).length, 4)
    // a clock that went backwards (savedAt in the future) is not trusted
    assert.deepEqual(parse(serialize(four, now), now - 1), [])
    // corrupt / foreign values never throw and never produce a half plate
    for (const raw of [
      null,
      '',
      'not json',
      '{}',
      '{"savedAt":1}',
      '{"savedAt":"x","items":[]}',
      '[]',
      'null',
    ])
      assert.deepEqual(parse(raw, now), [])
    // items of the wrong shape are dropped, valid ones kept
    const mixed = JSON.stringify({ savedAt: now, items: [item(1), { key: 5 }, null, 'x', item(2)] })
    assert.deepEqual(parse(mixed, now), [item(1), item(2)])

    // wiring: the plate lives in the store (not in the page state), is written on every change and read back after mount
    const store = source('stores/ui.store.ts')
    assert.match(store, /plate: PlateItem\[\]/)
    assert.match(store, /savePlate\(plate\)/)
    assert.match(
      store,
      /hydratePlate: \(\) => set\(\(state\) => \(state\.plate\.length > 0 \? state : \{ plate: loadPlate\(\) \}\)\)/
    )
    const page = source('features/food-log/pages/FoodLogPage.tsx')
    assert.doesNotMatch(page, /useState<PlateItem\[\]>/)
    assert.match(page, /const plate = useUiStore\(\(state\) => state\.plate\)/)
    assert.match(page, /useEffect\(\(\) => hydratePlate\(\), \[hydratePlate\]\)/)
    // every "+" path goes through addToPlate (toast with Undo), none appends silently
    // (only addToPlate itself and the Food Detail "Log Foods", which logs right away, append directly)
    assert.equal(
      (page.match(/setPlate\(\(current\) => \[\.\.\.current, item\]\)/g) ?? []).length,
      2
    )
    assert.equal((page.match(/addToPlate/g) ?? []).length >= 4, true)
    assert.match(page, /id: 'plate-add'/)
    assert.match(page, /label: 'Undo'/)
    // closed sheet + pending foods → the banner with Discard / Review / Log foods
    assert.match(page, /\{!addOpen && plate\.length > 0 && \(\s*<PendingPlateBar/)
    // Back closing the sheet is the shared Dialog's job (ui/dialog.tsx → use-back-to-close); the page does not add a second hook (it pushed two history entries)
    assert.doesNotMatch(page, /useBackToClose/)
    assert.match(
      source('components/ui/dialog.tsx'),
      /useBackToClose\(open, \(\) => change\(false\)\)/
    )
    // a failed add is a toast on every path (MOS-BE: parallel writes / 409 CONCURRENT used to be invisible: logger.error only)
    const logHooks = source('features/food-log/hooks/use-food-log.ts')
    assert.match(
      logHooks,
      /export const useAddEntry = \(\) =>\s*useLogMutation\(\s*\(payload: AddEntryRequest\) => foodLogService\.addEntry\(payload\),\s*undefined,\s*"Couldn't add food"\s*\)/
    )
    assert.match(
      logHooks,
      /\(payload: QuickAddRequest\) => foodLogService\.quickAdd\(payload\),\s*'Added',\s*"Couldn't add food"/
    )
    // two Log taps never run two write loops at once (a ref, because the state flag updates one render late)
    assert.match(page, /if \(loggingPlate\.current\) return false\s*loggingPlate\.current = true/)
    assert.match(page, /\} finally \{\s*loggingPlate\.current = false/)
    // the logged item leaves the plate only after ITS request succeeded (a failure keeps the rest for a retry)
    const logBody = page.slice(
      page.indexOf('const logPlate = async'),
      page.indexOf('const logFromDetail')
    )
    const removeAt = logBody.indexOf('current.filter((candidate) => candidate.key !== item.key)')
    assert.ok(
      removeAt > logBody.lastIndexOf('await quickAdd.mutateAsync'),
      'removed after the request'
    )
    assert.ok(
      removeAt > logBody.lastIndexOf('await addEntry.mutateAsync'),
      'removed after the request'
    )
  }
)
await check(
  'TC1 "To Custom" opens Create Food prefilled and is not undone: the Add Food sheet is NOT closed before router.push (the Dialog closes with the page; its rAF history.back() raced the push), the store flag is cleared on real leave, a failed source load is visible',
  () => {
    const page = source('features/food-log/pages/FoodLogPage.tsx')
    const body = page.slice(
      page.indexOf('const copyToCustom'),
      page.indexOf('// Rời trang nhật ký')
    )
    assert.match(body, /router\.push\(`\$\{routePath\.foodNew\}\?from=\$\{food\.id\}`\)/)
    assert.doesNotMatch(body, /setAddOpen\(false\)\s*\n\s*router\.push/)
    assert.doesNotMatch(body.replace(/\/\/[^\n]*/g, ''), /setAddOpen/)
    // the Library "create food / recipe" links navigate the same way
    assert.match(page, /onNavigate=\{\(\) => undefined\}/)
    // leaving the page for real turns the store flag off (StrictMode's mount-time cleanup keeps pathname = /food-log, so it does not close a sheet just opened from the Dashboard bar)
    assert.match(
      page,
      /useEffect\(\s*\(\) => \(\) => \{\s*if \(window\.location\.pathname !== routePath\.foodLog\) setAddOpen\(false\)\s*\},\s*\[setAddOpen\]\s*\)/
    )
    // the source food is fetched by id and a failure is shown with Try again (it used to leave a silent blank form)
    const create = source('features/food-log/pages/CreateFoodPage.tsx')
    assert.match(create, /const source = useFoodDetail\(fromFoodId \?\? null\)/)
    assert.match(create, /\{fromFoodId && source\.isError && \(/)
    assert.match(create, /Couldn't load this food/)
    assert.match(create, /onClick=\{\(\) => void source\.refetch\(\)\}/)
    // the route passes `from` to the page
    const route = source('app/(protected)/foods/new/page.tsx')
    assert.match(route, /<CreateFoodPage fromFoodId=\{from\} seed=\{seed\} \/>/)
  }
)

const foodSearch = await load('../src/features/foods/food-search.utils.ts')
await check(
  'FS1 Food Search: type-ahead keeps the previous results (never History into a keyword list), recent searches are bounded and de-duplicated, stale requests are aborted, no-results offers a way forward, paging past the BE top=100 clamp, auto-load at the footer',
  async () => {
    const keeps = need(foodSearch, 'keepsPreviousResults')
    // same keyword (Load more) and keyword → longer keyword keep the old rows; History (empty) <-> keyword does not
    assert.equal(keeps({ search: 'app', top: 25 }, { search: 'app', top: 50 }), true)
    assert.equal(keeps({ search: 'app' }, { search: 'apple' }), true)
    assert.equal(keeps({ search: ' app ' }, { search: 'apple' }), true)
    assert.equal(keeps({ search: undefined }, { search: 'apple' }), false)
    assert.equal(keeps({ search: '' }, { search: 'apple' }), false)
    assert.equal(keeps({ search: 'apple' }, { search: undefined }), false)
    assert.equal(keeps({ search: undefined }, { search: undefined }), true)
    // another scope (Mine / Recipes) never borrows rows
    assert.equal(
      keeps({ search: 'app', scope: 'Mine' }, { search: 'app', scope: undefined }),
      false
    )
    assert.equal(keeps(undefined, { search: 'app' }), false)

    const add = need(foodSearch, 'addRecentSearch')
    const parse = need(foodSearch, 'parseRecentSearches')
    const max = constant(foodSearch, 'RECENT_SEARCH_MAX')
    assert.deepEqual(add([], '  Chicken   breast '), ['Chicken breast'])
    // newest first, case-insensitive de-duplication moves the old entry to the front
    assert.deepEqual(add(['rice', 'Apple'], 'apple'), ['apple', 'rice'])
    // too short is ignored (a half typed word is not a search)
    assert.deepEqual(add(['rice'], 'a'), ['rice'])
    assert.deepEqual(add(['rice'], '   '), ['rice'])
    // bounded
    let list = []
    for (let i = 0; i < max + 4; i += 1) list = add(list, `food ${i}`)
    assert.equal(list.length, max)
    assert.equal(list[0], `food ${max + 3}`)
    // corrupt storage never throws
    for (const raw of [null, '', 'oops', '{}', '"x"', '[1,2]', 'null'])
      assert.deepEqual(parse(raw), [])
    assert.deepEqual(parse('["apple","",5,"rice"]'), ['apple', 'rice'])

    // wiring: the BE call receives the TanStack abort signal, the hook uses the pure rule, the page debounces 250 ms
    assert.match(
      source('features/foods/services/food.service.ts'),
      /search: \(params: FoodSearchParams, signal\?: AbortSignal\) =>\s*apiCall\.get<QueryResult<FoodSummary>>\(apiRoutes\.foods\.root, \{ params, signal \}\)/
    )
    const hook = source('features/foods/hooks/use-foods.ts')
    assert.match(hook, /queryFn: \(\{ signal \}\) => foodService\.searchUpTo\(params, signal\)/)
    // paging: BE clamps top to 100, so more than 100 rows are read as skip / top<=100 pages (the old "Load more" top 125 returned the same 100 rows forever)
    const collect = need(foodSearch, 'collectFoodPages')
    const total = 250
    const make = () => {
      const calls = []
      const fetchPage = async ({ top, skip }) => {
        calls.push({ top, skip })
        const n = Math.max(0, Math.min(top, 100, total - skip))
        return { items: Array.from({ length: n }, (_, i) => skip + i), totalCount: total }
      }
      return { calls, fetchPage }
    }
    let t = make()
    let res = await collect(t.fetchPage, 125)
    assert.deepEqual(t.calls, [
      { top: 100, skip: 0 },
      { top: 25, skip: 100 },
    ])
    assert.equal(res.items.length, 125)
    assert.deepEqual(
      res.items,
      Array.from({ length: 125 }, (_, i) => i)
    ) // in order, no gaps, no duplicates
    assert.equal(res.totalCount, total)
    t = make()
    res = await collect(t.fetchPage, 400) // more than exist: stops at the end instead of looping
    assert.equal(res.items.length, total)
    assert.equal(t.calls.length, 3)
    t = make()
    res = await collect(t.fetchPage, 20)
    assert.deepEqual(t.calls, [{ top: 20, skip: 0 }])
    t = make()
    res = await collect(t.fetchPage, 50, 240) // skip past most of it
    assert.equal(res.items.length, 10)
    res = await collect(async () => null, 30)
    assert.deepEqual(res, { items: [], totalCount: 0 })
    assert.match(
      source('features/foods/services/food.service.ts'),
      /searchUpTo: \(params: FoodSearchParams, signal\?: AbortSignal\) =>\s*collectFoodPages\(/
    )
    // scrolling to the footer loads the next page (the button stays as the keyboard / screen reader path); only while a page is not already loading
    assert.match(
      source('features/foods/components/FoodList.tsx'),
      /useAutoLoadMore\(hasMore && !isFetching && !isLoading, onLoadMore\)/
    )
    assert.match(
      source('features/food-log/components/FoodLogPage/FoodSearchPanel.tsx'),
      /<div ref=\{loadMoreRef\} className="border-t p-2">/
    )
    assert.match(source('hooks/use-auto-load-more.ts'), /new IntersectionObserver\(/)
    assert.match(
      hook,
      /keepsPreviousResults\(previous, params\) \? keepPreviousData\(previousData\) : undefined/
    )
    const page = source('features/food-log/pages/FoodLogPage.tsx')
    assert.match(page, /const SEARCH_DEBOUNCE_MS = 250/)
    assert.match(page, /useDebounce\(search\.trim\(\), SEARCH_DEBOUNCE_MS\)/)
    // skeleton only while there is nothing to keep (History → keyword), typing over keyword results just dims them
    assert.match(
      page,
      /foods\.isLoading \|\| \(search\.trim\(\) !== debouncedSearch && debouncedSearch === ''\)/
    )
    assert.match(page, /isFetching=\{foods\.isFetching \|\| search\.trim\(\) !== debouncedSearch\}/)
    // no results → Quick Add / Create a food / Clear search (44 px buttons), recent searches when nothing is typed
    const panel = source('features/food-log/components/FoodLogPage/FoodSearchPanel.tsx')
    assert.match(panel, /Quick Add calories/)
    assert.match(panel, /Create a food/)
    assert.match(panel, /!isSearching && \(\s*<RecentSearches/)
    // only a keyword that led to a food is remembered (select or "+")
    assert.equal((panel.match(/recent\.remember\(query\)/g) ?? []).length, 2)
    // the add button says how many foods are waiting
    const dialog = source('features/food-log/components/FoodLogPage/AddFoodDialog.tsx')
    assert.match(dialog, /`Log \$\{plate\.length\} \$\{plate\.length === 1 \? 'food' : 'foods'\}`/)
    assert.equal((dialog.match(/isLogging \? 'Logging\.\.\.' : logLabel/g) ?? []).length, 2)
  }
)

await check(
  'WN1 Weekly Nutrition: past days of the week keep their bars and the whole-week total when their old target is unverified (was: only today); tap focuses a day, tapping it again shows the whole week',
  async () => {
    const provenance = await load('../src/features/nutrition/target-provenance.ts')
    const utils = await load('../src/features/dashboard/dashboard.utils.ts')
    const weekSummary = need(utils, 'weekSummary')
    const target = { caloriesTarget: 2000, proteinTarget: 150, fatTarget: 60, carbsTarget: 200 }
    const day = (logDate, calories, provenanceFlag) => ({
      logDate,
      isLogged: true,
      totals: { calories, protein: calories / 10, fat: 0, carbs: 0 },
      effective: null,
      target: { ...target, targetProvenance: provenanceFlag },
    })
    const today = '2026-10-28' // Wednesday
    const week = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29'].map((d, i) =>
      provenance.withoutUnverifiedTarget(
        day(d, [1800, 2100, 500, 0][i], i < 2 ? 'LEGACY_UNVERIFIED' : 'CURRENT_ACTIVE'),
        today
      )
    )
    // the stripped target is kept ONLY as a bar scale
    assert.equal(week[0].target, null)
    assert.equal(week[0].targetUnverified, true)
    assert.equal(week[0].referenceTarget.caloriesTarget, 2000)
    assert.equal(week[2].referenceTarget, undefined, 'today keeps its real target, no reference')
    const total = weekSummary(
      week,
      'calories',
      (t) => t.caloriesTarget,
      'consumed',
      (v) => v
    )
    assert.equal(total.value, 1800 + 2100 + 500, 'whole week = every logged day, not only today')
    assert.equal(
      total.goal,
      null,
      'consumed that includes unverified days has no official goal beside it'
    )
    const left = weekSummary(
      week,
      'calories',
      (t) => t.caloriesTarget,
      'remaining',
      (v) => v
    )
    assert.equal(left.goal, 2 * 2000, 'official goal = days with an official target only')
    assert.equal(left.value, 2 * 2000 - 500, 'Remaining ignores the unverified days')
    const focused = weekSummary(
      [week[0]],
      'calories',
      (t) => t.caloriesTarget,
      'consumed',
      (v) => v
    )
    assert.deepEqual(
      [focused.value, focused.goal],
      [1800, null],
      'a past day shows its own eaten number and no official goal'
    )
    // wiring: bar scale + no "over target" cap on unverified days + the note
    const matrix = codeOf(source('features/dashboard/components/DashboardPage/WeekMatrix.tsx'))
    assert.match(matrix, /day\.target \?\? day\.referenceTarget/)
    assert.match(
      matrix,
      /over && Boolean\(day\.target\)/,
      'no pass / fail cap on an unverified target'
    )
    assert.match(matrix, /{REFERENCE_NOTE}/, 'the provenance note is rendered')
    // MF behaviour (help article 225): today in focus by default, tap another day to focus it, tap the selected day again = whole week
    assert.match(matrix, /onSelect\(active \? null : day\.logDate\)/)
    assert.match(matrix, /weekSummary\(\s*current \? \[current\] : days/)
    const page = codeOf(source('features/dashboard/pages/DashboardPage.tsx'))
    assert.match(page, /weekIncludesToday\s*\?\s*today\s*:\s*null/, 'default focus = today')
    assert.match(page, /onSelect=\{setSelectedDate\}/)
  }
)

await check(
  'TC2 Back from Create Food (opened by To Custom) returns to the SAME Food Detail; Create clears the return; To Custom copies every nutrient the source food has',
  async () => {
    const store = codeOf(source('stores/ui.store.ts'))
    assert.match(store, /detailReturn:\s*null/)
    assert.match(
      store,
      /setDetailReturn:\s*\(foodId\)\s*=>\s*set\(\{\s*detailReturn:\s*\{\s*foodId,\s*at:\s*Date\.now\(\)/
    )
    const log = codeOf(source('features/food-log/pages/FoodLogPage.tsx'))
    assert.ok(
      log.indexOf('setDetailReturn(food.id)') > 0 &&
        log.indexOf('setDetailReturn(food.id)') <
          log.indexOf('router.push(`${routePath.foodNew}?from=${food.id}`)'),
      'the return is remembered before leaving'
    )
    assert.match(
      log,
      /Date\.now\(\) - back\.at <= DETAIL_RETURN_WINDOW_MS/,
      'only a fresh return reopens the detail'
    )
    assert.match(log, /useState<string \| null>\(detailBackId\)/, 'the sheet starts on that food')
    assert.match(log, /if \(detailBackId\) setAddOpen\(true\)/)
    assert.match(
      codeOf(source('features/food-log/pages/CreateFoodPage.tsx')),
      /useEffect\(\(\) => stampDetailReturn, \[stampDetailReturn\]\)/
    )
    assert.match(
      codeOf(source('features/food-log/hooks/use-create-food-form.ts')),
      /await createFood\.mutateAsync\(result\.request\)[\s\S]*clearDetailReturn\(\)/,
      'a created food does not bounce back to the source detail'
    )
    // every nutrient the BE returns for the source food is prefilled (scaled to the serving)
    const utils = await load('../src/features/food-log/create-food.utils.ts')
    const config = await load('../src/features/food-log/create-food.config.ts')
    const per100g = Object.fromEntries(
      Object.keys(config.NUTRIENT_ROWS).map((key, i) => [key, i + 1])
    )
    const state = need(
      utils,
      'initialState'
    )({
      name: 'Source',
      brand: null,
      iconKey: null,
      category: 'Other',
      servings: [{ servingName: '100 g', weightInGrams: 100, isDefault: true }],
      nutrientsPer100g: per100g,
      nutrition: {},
    })
    assert.deepEqual(
      Object.keys(config.NUTRIENT_ROWS).filter((key) => !(key in state.values)),
      [],
      'a nutrient of the source food was not copied'
    )
  }
)

await check(
  'FL1 future food logs (allowed) are not completed days: Weekly Nutrition whole-week and focused-day numbers ignore consumption on days after today (user timezone), the week goal keeps their targets',
  async () => {
    const utils = await load('../src/features/dashboard/dashboard.utils.ts')
    const weekSummary = need(utils, 'weekSummary')
    const target = { caloriesTarget: 2000, proteinTarget: 150, fatTarget: 60, carbsTarget: 200 }
    const day = (logDate, calories) => ({
      logDate,
      isLogged: true,
      totals: { calories, protein: 0, fat: 0, carbs: 0 },
      effective: null,
      target,
    })
    const today = '2026-10-28'
    const week = [day('2026-10-27', 1800), day('2026-10-28', 500), day('2026-10-29', 900)]
    const goal = (t) => t.caloriesTarget
    const sum = (scope, mode = 'consumed') =>
      weekSummary(scope, 'calories', goal, mode, (v) => v, today)
    assert.equal(sum(week).value, 1800 + 500, 'a log planned for tomorrow is not eaten yet')
    assert.equal(sum(week).goal, 3 * 2000, 'the full-week target still counts')
    assert.equal(sum(week, 'remaining').value, 3 * 2000 - (1800 + 500))
    assert.equal(sum([week[2]]).value, null, 'a focused future day has nothing consumed')
    assert.equal(sum([week[2]]).goal, 2000)
    assert.equal(sum([week[1]]).value, 500, 'today counts')
    // without a known today nothing is hidden (before the client mounts)
    assert.equal(weekSummary(week, 'calories', goal, 'consumed', (v) => v).value, 1800 + 500 + 900)
    assert.match(
      codeOf(source('features/dashboard/components/DashboardPage/WeekMatrix.tsx')),
      /\(value\) => shown\(row, value\),\s*today/,
      'WeekMatrix passes today'
    )
  }
)

await check(
  'TZ1 the default eaten-at time, "To Now" and the default meal follow the PROFILE time zone like the day key (not the device clock)',
  async () => {
    const date = await load('../src/lib/date.ts')
    const at = new Date('2026-10-26T20:00:00Z')
    // same instant, three zones: day key and clock always agree
    for (const [zone, day, clock] of [
      ['Asia/Tokyo', '2026-10-27', '05:00:00'],
      ['America/New_York', '2026-10-26', '16:00:00'],
      ['Pacific/Auckland', '2026-10-27', '09:00:00'],
      ['UTC', '2026-10-26', '20:00:00'],
    ]) {
      assert.equal(date.isoInZone(at, zone), day, zone + ' day')
      assert.equal(date.clockInZone(at, zone), clock, zone + ' clock')
    }
    assert.equal(
      date.clockInZone(new Date('2026-10-26T00:05:09Z'), 'UTC'),
      '00:05:09',
      'midnight is 00, never 24'
    )
    // nowClockIso() uses the profile zone once it is known
    const before = Date.now
    try {
      Date.now = () => at.getTime()
      date.setEffectiveTimeZone('Asia/Tokyo')
      const realNow = globalThis.Date
      const Fixed = class extends realNow {
        constructor(...args) {
          super(...(args.length ? args : [at.getTime()]))
        }
      }
      globalThis.Date = Fixed
      try {
        assert.equal(date.nowClockIso(), '05:00:00')
        assert.equal(date.todayIso(), '2026-10-27', 'clock and day key come from the same zone')
        date.setEffectiveTimeZone('America/New_York')
        assert.equal(date.nowClockIso(), '16:00:00')
      } finally {
        globalThis.Date = realNow
      }
    } finally {
      Date.now = before
      date.setEffectiveTimeZone(null)
    }
    // no device-clock reads left outside lib/date.ts
    const { readdirSync, readFileSync, statSync } = await import('node:fs')
    const { join } = await import('node:path')
    const walk = (dir) =>
      readdirSync(dir).flatMap((name) => {
        const full = join(dir, name)
        return statSync(full).isDirectory() ? walk(full) : [full]
      })
    const offenders = walk(
      new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
    )
      .filter(
        (file) => /\.(ts|tsx)$/.test(file) && !file.replaceAll('\\', '/').endsWith('/lib/date.ts')
      )
      .filter((file) => /\.(getHours|getMinutes|getSeconds)\(/.test(readFileSync(file, 'utf8')))
    assert.deepEqual(offenders, [], 'device clock used for time of day: ' + offenders.join(', '))
  }
)

await check(
  'DT1 every hour with entries keeps its hour pill, "+" and hourly totals (a single-entry hour used to lose them, so nothing could be added at 7:00); the bottom search bar is 44 px tall with a 16 px font',
  async () => {
    const timeline = codeOf(source('features/food-log/components/FoodLogPage/DayTimeline.tsx'))
    assert.doesNotMatch(timeline, /showHeader/, 'the per-hour header must not be conditional')
    assert.doesNotMatch(
      timeline,
      /here\.length >= 2/,
      'no "two or more entries" rule for the header'
    )
    // header row (pill + add / paste button + totals) is rendered for each hour, before the entries
    const header = timeline.indexOf('<HourPill')
    const add = timeline.indexOf('Add food at')
    const totals = timeline.indexOf('<HourTotals')
    const entries = timeline.indexOf('hereRows.map(({ item: entry')
    assert.ok(header > 0 && add > header && totals > add && entries > totals, 'header order')
    assert.match(
      timeline,
      /<li key=\{hour\} id=\{`timeline-hour-\$\{hour\}`\}>\s*<div className=\{cn\('flex items-center gap-3 py-2'/,
      'the header row is unconditional inside each hour'
    )
    assert.match(timeline, /here\.length > 0 && showHourlyTotals/, 'totals follow the setting only')
    // search bar: slim but still a 44 px target, 16 px text (no iOS zoom)
    const bar = codeOf(source('features/shortcuts/components/ShortcutToolbarContent.tsx'))
    assert.match(bar, /flex h-11 min-w-0 flex-1 items-center rounded-full/)
    assert.match(
      bar,
      /flex size-11 shrink-0 items-center justify-center rounded-full focus-visible/
    )
    assert.match(bar, /text-base font-normal/)
    assert.doesNotMatch(bar, /\b(h|size)-(12|10|9)\b/, 'toolbar controls must stay 44 px')
    assert.match(
      codeOf(source('features/dashboard/components/DashboardPage/DashboardSearchBar.tsx')),
      /border-t px-4 py-2 transition/
    )
  }
)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
