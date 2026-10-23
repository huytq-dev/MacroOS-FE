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
      /lastDays\(today, DAYS_PER_WEEK\) : \[\]\)\.map\(\s*\(date\): MacroStackDay \| null/
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
    // Chưa có target ngày nào: Remaining vẫn hiện số đã ăn, không có mục tiêu
    assert.deepEqual(
      weekSummary(
        [{ ...day, target: null }],
        'calories',
        (t) => t.caloriesTarget,
        'remaining',
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
      ['features/dashboard/components/DashboardPage/DailyNutritionCard.tsx', /shownProgress\(/],
      ['features/dashboard/components/DashboardPage/NutrientTile.tsx', /shownProgress\(/],
      ['features/food-log/components/FoodLogPage/MacroSummary.tsx', /shownProgress\(/],
      ['features/food-log/food-log-settings.ts', /shownProgress\(/],
    ])
      assert.match(source(file), pattern, file)
    const daily = source('features/dashboard/components/DashboardPage/DailyNutritionCard.tsx')
    assert.ok((daily.match(/shownProgress\(/g) ?? []).length >= 2, 'calories and the three macros')
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
    assert.deepEqual(expLegend([]), { line: false, holding: false, updating: false })
    assert.deepEqual(expLegend([day('Updating')]), {
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
  "V5 the Expenditure Flux band is not drawn anywhere (BE formula is not MacroFactor's); the axis fits the line only",
  async () => {
    for (const file of [
      'features/dashboard/components/ExpenditurePage/ExpenditureChart.tsx',
      'features/dashboard/components/DashboardPage/InsightCharts.tsx',
      'features/dashboard/pages/ExpenditurePage.tsx',
      'features/dashboard/expenditure-series.ts',
    ])
      assert.ok(
        !/flux-band|Flux Range|FluxMini|fluxLow|\.low\b|\.high\b/.test(codeOf(source(file))),
        `${file} still draws or reads the Flux band`
      )
    assert.ok(!/flux-band/.test(source('app/theme.css') + source('app/index.css')), 'dead token')
    const exp = await load('../src/features/dashboard/expenditure-series.ts')
    const expAxis = need(exp, 'expAxis')
    const at = (...kcal) =>
      kcal.map((value, i) => ({ date: `2026-10-${10 + i}`, kcal: value, holding: false }))
    const wide = expAxis(at(2300, 2500))
    assert.ok(wide.min <= 2300 && wide.max >= 2500 && wide.min > 1500, 'axis does not fit the line')
    const flat = expAxis(at(2429, 2429, 2429))
    assert.ok(flat.max - flat.min >= 2429 * 0.04 - 1, 'a flat line is squashed to a hair')
    assert.ok(flat.max - flat.min < 2429 * 0.5, 'a flat line gets a huge axis')
    assert.ok(expAxis(at(2429)).ticks.length >= 3, 'a single point has no axis')
    assert.ok(
      /fluxLowKcal: number/.test(source('features/dashboard/types/expenditure-series.types.ts')),
      'the BE type was changed (it must keep the fields)'
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
  return {
    invalidated,
    data,
    invalidateQueries: ({ queryKey }) => {
      invalidated.push(JSON.stringify(queryKey))
      return Promise.resolve()
    },
    getQueryData: (queryKey) => data.get(JSON.stringify(queryKey)),
    setQueryData: (queryKey, value) => data.set(JSON.stringify(queryKey), value),
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
  'Y2 [wiring] the shared status query reads on mount / focus, pauses in the background; writes ask for it; derived screens show skeleton or ErrorState, never stale numbers',
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
      assert.match(text, /derived\.gate === 'updating'/, `${file}: Updating state`)
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
    for (const key of [...keys, 'weighIn', 'scaleWeight', 'foodLogging', 'steps', 'period', 'bodyFat'])
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
    assert.equal(tilePending('macros', only('daily')), true)
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

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
