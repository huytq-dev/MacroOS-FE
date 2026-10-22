// Kiểm tra: BE từ chối kiểu chia kcal (`FeasibilityResponse` do CALORIE_SHIFT_INFEASIBLE: preview 200 hoặc `data` của 400) thì FE phải nêu ngày nào
// hỏng + vì sao và để người dùng BẤM chọn cách sửa; không tự áp, không tự đổi macro. Model Calorie Shift cũ đã bị BE gỡ: không còn được đọc.
//   S1 lỗi API mang `data` của BE (getApiError) và lỗi 4xx không bị tự thử lại (isClientError)
//   S2 đọc `FeasibilityResponse`: ngày vi phạm + mã + calories / carbsG; action hoặc mã lạ bị bỏ, không dựng nút từ dữ liệu không hiểu; dạng cũ = null
//   S3 mô tả từng ngày bằng tiếng Anh, một ngày nhiều mã gộp một dòng, theo thứ tự tuần
//   S4 cách sửa: làm tròn xuống theo bước thanh trượt (≤ % BE đề xuất), chia đều, không bao giờ đụng macro; giảm % cho program = ngày đang lưu
//   S5 nút Next của onboarding bị khoá khi BE từ chối cấu hình (canProceed.shiftBlocked)
//   [wiring] các hàm thuần được NỐI vào onboarding và wizard New Program (không chạy React được ở đây nên đọc mã nguồn)
// Chạy: node --import ./scripts/register-ts.mjs scripts/check-calorie-shift.mjs   (hoặc `pnpm run check:shift`)
//
// Thiết kế để FAIL trên bản cũ đúng lý do: module / hàm / nối dây chưa tồn tại hoặc còn đọc model cũ. Mỗi check chạy độc lập: in lỗi rồi tiếp tục;
// có lỗi thì thoát mã 1.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { AxiosError } from 'axios'

const api = await import('../src/lib/api.ts')
const steps = await import('../src/features/onboarding/onboarding-steps.utils.ts')
const onboarding = await import('../src/features/onboarding/onboarding.utils.ts')
const feasibilityModule = await import('../src/features/program/utils/feasibility.ts').catch(
  (error) => ({ error })
)
// Nơi gọi thật luôn truyền đơn vị năng lượng của user (hàm không có mặc định kcal ngầm): script nói chuyện bằng kcal như người dùng mặc định
const unitsModule = await import('../src/lib/units.ts').catch((error) => ({ error }))
const KCAL = unitsModule.error ? null : unitsModule.energyMeasure('kcal')
const shiftModule = await import('../src/features/program/utils/calorie-shift.ts').catch(
  (error) => ({ error })
)
const shift = shiftModule.error
  ? shiftModule
  : { ...shiftModule, issuesByDay: (problem) => shiftModule.issuesByDay(problem, KCAL) }

const source = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')
const need = (module, name) => {
  assert.ok(!module.error, `module missing: ${String(module.error?.message).split('\n')[0]}`)
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

const httpError = (status, body) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: {},
    data: body,
  })

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const dayRow = (dayOfWeek, calories, carbsG = 200) => ({
  dayOfWeek,
  calories,
  proteinG: 150,
  carbsG,
  fatG: 60,
  isLocked: false,
})
const violation = (day, detail, calories, carbsG, floorKcal = 1000) => ({
  code: detail === 'NEGATIVE_MACRO' ? 'MACRO_BUDGET_EXCEEDED' : 'INVALID_CALORIE_TARGET',
  detail,
  day,
  calories,
  proteinG: 150,
  carbsG,
  fatG: 60,
  macroKcal: 0,
  minFeasibleCalories: null,
  floorKcal,
})

// Ví dụ: 20% thêm vào 5 ngày làm Saturday / Sunday có carbs âm; BE đề xuất tối đa 19.47% hoặc chia đều
const DATA = {
  isFeasible: false,
  reasonCode: 'CALORIE_SHIFT_INFEASIBLE',
  reasonCodes: ['CALORIE_SHIFT_INFEASIBLE', 'MACRO_BUDGET_EXCEEDED'],
  violations: [
    violation('Saturday', 'NEGATIVE_MACRO', 1350, -9.0),
    violation('Sunday', 'NEGATIVE_MACRO', 1350, -9.0),
  ],
  affectedDays: ['Saturday', 'Sunday'],
  currentShiftPercent: 20,
  suggestedShiftPercent: 19.47,
  suggestedAction: 'REDUCE_SHIFT',
  actions: ['REDUCE_SHIFT', 'USE_EVEN_DISTRIBUTION'],
  currentDailyTargets: WEEK.map((name) => dayRow(name, 1350)),
  proposedDailyTargets: WEEK.map((name) => dayRow(name, 1400)),
  message: 'Reduce the shift to 19.47%.',
  warnings: [],
}
const BODY = {
  isSuccess: false,
  statusCode: 400,
  message: 'Reduce the shift to 19.47%.',
  data: DATA,
  errors: { targets: ['Saturday: …', 'Sunday: …'] },
}

// ── S1: api error carries `data`; 4xx is not retried ─────────────────────────────────────────────────────────────────────────

await check('S1 getApiError returns the BE body: status, message and machine-readable data', () => {
  const apiError = need(api, 'getApiError')(httpError(400, BODY))
  assert.equal(apiError.statusCode, 400)
  assert.equal(apiError.message, BODY.message)
  assert.deepEqual(apiError.data, DATA)
  assert.deepEqual(apiError.errors, BODY.errors)
})
await check('S1 getApiError is null without an HTTP response (network error, plain Error)', () => {
  const getApiError = need(api, 'getApiError')
  assert.equal(getApiError(new AxiosError('Network Error')), null)
  assert.equal(getApiError(new Error('x')), null)
  assert.equal(getApiError(undefined), null)
})
await check('S1 an error without data has data undefined (no invented payload)', () => {
  const apiError = need(api, 'getApiError')(httpError(400, { message: 'Bad', data: null }))
  assert.equal(apiError.data, undefined)
})
await check('S1 isClientError: 4xx yes (400, 404), 5xx / network / plain Error no', () => {
  const isClientError = need(api, 'isClientError')
  assert.equal(isClientError(httpError(400, BODY)), true)
  assert.equal(isClientError(httpError(404, {})), true)
  assert.equal(isClientError(httpError(500, {})), false)
  assert.equal(isClientError(new AxiosError('Network Error')), false)
  assert.equal(isClientError(new Error('x')), false)
})

// ── S2: parsing the FeasibilityResponse ──────────────────────────────────────────────────────────────────────────────────────

await check(
  'S2 parses the example (violations with calories / carbsG, options, before / after)',
  () => {
    const problem = need(shift, 'parseCalorieShiftProblem')(DATA)
    assert.equal(problem.floorKcal, 1000)
    assert.equal(problem.percent, 20)
    assert.deepEqual(problem.violations, [
      { day: 'Saturday', code: 'CARBS_BELOW_ZERO', calories: 1350, carbsG: -9 },
      { day: 'Sunday', code: 'CARBS_BELOW_ZERO', calories: 1350, carbsG: -9 },
    ])
    assert.deepEqual(problem.options, [
      { code: 'REDUCE_PERCENT', maxPercent: 19.47 },
      { code: 'USE_EVEN_DISTRIBUTION' },
    ])
    assert.equal(problem.proposal.length, 7)
  }
)
await check(
  'S2 other reasons / garbage / a feasible object are not a Calorie Shift problem',
  () => {
    const parse = need(shift, 'parseCalorieShiftProblem')
    assert.equal(
      parse({
        ...DATA,
        reasonCodes: ['INVALID_CALORIE_TARGET'],
        reasonCode: 'INVALID_CALORIE_TARGET',
      }),
      null
    )
    assert.equal(parse({ ...DATA, isFeasible: true }), null)
    for (const value of [null, undefined, 'x', 42]) assert.equal(parse(value), null)
  }
)
await check(
  'S2 the removed legacy model (reasonCode + options, no isFeasible) is NOT read any more',
  () => {
    const legacy = {
      reasonCode: 'CALORIE_SHIFT_INFEASIBLE',
      floorKcal: 1000,
      percent: 20,
      days: ['Monday'],
      violations: [{ day: 'Saturday', code: 'CARBS_BELOW_ZERO', calories: 1350, carbsG: -9 }],
      options: [{ code: 'REDUCE_PERCENT', maxPercent: 19 }],
    }
    assert.equal(need(shift, 'parseCalorieShiftProblem')(legacy), null)
    assert.equal(
      need(shift, 'calorieShiftProblemOf')(httpError(400, { ...BODY, data: legacy })),
      null
    )
  }
)
await check('S2 unknown action codes / missing numbers / unknown details are dropped', () => {
  const problem = need(
    shift,
    'parseCalorieShiftProblem'
  )({
    ...DATA,
    violations: [
      { ...violation('Monday', 'NEGATIVE_MACRO', 1, 1), day: 'Someday' },
      violation('Monday', 'SOMETHING_NEW', 1, 1),
      violation('Tuesday', 'BELOW_FLOOR', 900, 10),
      { code: 'INVALID_CALORIE_TARGET' },
    ],
    actions: ['TELEPORT', 'REDUCE_SHIFT'],
    suggestedShiftPercent: null,
  })
  assert.deepEqual(problem.violations, [
    { day: 'Tuesday', code: 'BELOW_FLOOR', calories: 900, carbsG: 10 },
  ])
  assert.deepEqual(problem.options, [], 'REDUCE_SHIFT without a suggested % builds no button')
})
await check('S2 calorieShiftProblemOf: only a 400 with a Calorie Shift FeasibilityResponse', () => {
  const problemOf = need(shift, 'calorieShiftProblemOf')
  assert.equal(problemOf(httpError(400, BODY))?.violations.length, 2)
  assert.equal(problemOf(httpError(500, BODY)), null)
  assert.equal(
    problemOf(httpError(400, { ...BODY, data: { ...DATA, reasonCodes: ['OTHER'] } })),
    null
  )
  assert.equal(problemOf(httpError(400, { ...BODY, data: null })), null)
  assert.equal(problemOf(new Error('x')), null)
  assert.equal(problemOf(undefined), null)
})

// ── S3: which days fail and why ──────────────────────────────────────────────────────────────────────────────────────────────

await check('S3 one row per failing day, in week order, with kcal and an English reason', () => {
  const parse = need(shift, 'parseCalorieShiftProblem')
  const issues = need(
    shift,
    'issuesByDay'
  )(parse({ ...DATA, violations: [...DATA.violations].reverse() }))
  assert.deepEqual(
    issues.map((issue) => issue.day),
    ['Saturday', 'Sunday']
  )
  assert.equal(issues[0].calories, '1,350 kcal')
  assert.deepEqual(issues[0].reasons, ["Carbs would be −9 g, and they can't go below 0."])
})
await check(
  'S3 a day with several codes is ONE row with every reason; floor and zero-kcal wording',
  () => {
    const parse = need(shift, 'parseCalorieShiftProblem')
    const issues = need(
      shift,
      'issuesByDay'
    )(
      parse({
        ...DATA,
        violations: [
          violation('Sunday', 'NON_POSITIVE_CALORIES', 0, -40.3, 1500),
          violation('Sunday', 'BELOW_FLOOR', 0, -40.3, 1500),
          violation('Sunday', 'NEGATIVE_MACRO', 0, -40.3, 1500),
        ],
      })
    )
    assert.equal(issues.length, 1)
    assert.equal(issues[0].calories, '0 kcal')
    assert.deepEqual(issues[0].reasons, [
      'A day needs more than 0 kcal.',
      'Below your 1,500 kcal calorie floor.',
      "Carbs would be −40.3 g, and they can't go below 0.",
    ])
  }
)
await check(
  'S3 numbers: rounded symmetrically (−61.15 → −61.2), real minus sign, negative kcal grouped',
  () => {
    const parse = need(shift, 'parseCalorieShiftProblem')
    const issues = need(
      shift,
      'issuesByDay'
    )(
      parse({
        ...DATA,
        violations: [
          violation('Saturday', 'NEGATIVE_MACRO', 971, -61.15),
          violation('Sunday', 'NON_POSITIVE_CALORIES', -1554, -692.4),
        ],
      })
    )
    assert.equal(issues[0].reasons[0], "Carbs would be −61.2 g, and they can't go below 0.")
    assert.equal(issues[1].calories, '−1,554 kcal')
  }
)

// ── S4: fixes the user can tap ───────────────────────────────────────────────────────────────────────────────────────────────

await check('S4 example: lower the % (rounded DOWN to the slider step) or split evenly', () => {
  const parse = need(shift, 'parseCalorieShiftProblem')
  const fixes = need(shift, 'shiftFixesOf')(parse(DATA))
  assert.deepEqual(
    fixes.map((fix) => [fix.code, fix.label, fix.detail, fix.change]),
    [
      ['REDUCE_PERCENT', 'Add 19% instead of 20%', null, { shiftPercent: 19 }],
      [
        'USE_EVEN_DISTRIBUTION',
        'Use an even split across the week',
        'Every day gets the same calories',
        { shiftMode: 'Even' },
      ],
    ]
  )
})
await check(
  'S4 every fix only touches % or the split mode — never a macro, never several things',
  () => {
    const fixes = need(shift, 'shiftFixesOf')(need(shift, 'parseCalorieShiftProblem')(DATA))
    for (const fix of fixes) {
      const keys = Object.keys(fix.change)
      assert.equal(keys.length, 1, `${fix.code} changes exactly one thing`)
      assert.ok(['shiftPercent', 'shiftMode'].includes(keys[0]), keys[0])
      assert.ok(fix.result.length > 0 && fix.result.length <= 60, 'short confirmation text')
    }
  }
)
await check('S4 never offers a value the slider cannot take or that is not an improvement', () => {
  const parse = need(shift, 'parseCalorieShiftProblem')
  const fixesOf = need(shift, 'shiftFixesOf')
  const of = (suggestedShiftPercent) =>
    fixesOf(parse({ ...DATA, suggestedShiftPercent, actions: ['REDUCE_SHIFT'] }))
  assert.equal(of(4.99).length, 0, 'below the slider min')
  assert.equal(of(20).length, 0, 'not lower than 20')
  assert.equal(of(5)[0].change.shiftPercent, 5)
  assert.equal(of(null).length, 0)
})
await check('S4 slider constants are shared (5–30 step 1) so a fix is always selectable', () => {
  assert.ok(!shift.error, 'module missing')
  assert.deepEqual({ ...shift.SHIFT_PERCENT }, { min: 5, max: 30, step: 1 })
})
await check(
  'S4 Edit Program: reduce = Custom + the days STORED on the program + the BE percent',
  () => {
    const stored = {
      calorieShiftMode: 'Custom',
      calorieShiftDays: ['Monday', 'Friday'],
      calorieShiftPercent: 20,
    }
    const feasibility = need(feasibilityModule, 'parseFeasibility')(DATA)
    const reduce = need(shift, 'reduceShiftRequestOf')
    assert.deepEqual(reduce(stored, feasibility), {
      calorieShiftMode: 'Custom',
      calorieShiftDays: ['Monday', 'Friday'],
      calorieShiftPercent: 19.47,
    })
    assert.equal(
      reduce({ calorieShiftMode: 'Custom', calorieShiftPercent: 20 }, feasibility),
      null,
      'old BE: no days, never guessed'
    )
  }
)

// ── S5: Next stays locked while BE rejects the configuration ─────────────────────────────────────────────────────────────────

const customAnswers = {
  ...onboarding.initialAnswers({
    state: 'InProgress',
    step: 2,
    isRequired: true,
    hasProgram: false,
    consentAccepted: false,
    gender: 'Male',
    dateOfBirth: '1990-03-04',
    heightCm: 181,
    weightKg: 82.5,
    unitPreference: 'Metric',
    weighedMoreThanBefore: null,
    recentWeightTrend: null,
    bodyFat: null,
    exerciseSessions: null,
    dailyActivity: null,
    liftingExperience: null,
    cardioExperience: null,
  }),
  goalType: 'WeightLoss',
  targetWeightKg: 75,
  dietStyle: 'Balanced',
  calorieFloor: 'Standard',
  trainingType: 'Lifting',
  proteinLevel: 'Moderate',
  shiftMode: 'Custom',
  shiftDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  shiftPercent: 20,
}
const proceed = (stepId, extra = {}) =>
  steps.canProceed({
    stepId,
    answers: customAnswers,
    today: '2026-10-21',
    preview: undefined,
    readyReached: false,
    ...extra,
  })

await check(
  'S5 distribution / diet / training / protein cannot continue while BE rejects the shift',
  () => {
    for (const stepId of ['distribution', 'diet', 'training', 'protein']) {
      assert.equal(proceed(stepId), true, `${stepId} is fine without a problem`)
      assert.equal(proceed(stepId, { shiftBlocked: true }), false, `${stepId} must be blocked`)
    }
  }
)
await check('S5 blocking only affects the preview steps (Basics steps still continue)', () => {
  assert.equal(proceed('sex', { shiftBlocked: true }), true)
  assert.equal(proceed('goalType', { shiftBlocked: true }), true)
})

// ── [wiring] ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────

await check(
  '[wiring] lib/api exposes getApiError / isClientError and ApiError carries data',
  () => {
    assert.match(source('lib/api.ts'), /export const getApiError/)
    assert.match(source('lib/api.ts'), /export const isClientError/)
    assert.match(source('types/api.ts'), /interface ApiError[\s\S]*?data\?: unknown/)
  }
)
await check(
  '[wiring] onboarding preview does not retry a 400 and the wizard blocks Next on a shift problem',
  () => {
    assert.match(
      source('features/onboarding/hooks/use-onboarding.ts'),
      /retry: \(failureCount, error\) => !isClientError\(error\)/
    )
    const wizard = source('features/onboarding/hooks/use-onboarding-wizard.ts')
    assert.match(wizard, /calorieShiftProblemOf\(previewQuery\.error\)/)
    assert.match(wizard, /shiftBlocked: shiftProblem !== null/)
    assert.match(wizard, /readonly applyShiftFix: \(fix: ShiftFix\) => void/)
  }
)
await check(
  '[wiring] creating the onboarding program shows the shift problem instead of the generic message',
  () => {
    const wizard = source('features/onboarding/hooks/use-onboarding-wizard.ts')
    assert.match(wizard, /calorieShiftProblemOf\(failure\)/)
    assert.match(wizard, /setCreateProblem\(problem\)/)
  }
)
await check('[wiring] onboarding applies a fix only to the percent / split answers, on tap', () => {
  const wizard = source('features/onboarding/hooks/use-onboarding-wizard.ts')
  assert.match(wizard, /const applyShiftFix = \(fix: ShiftFix\)/)
  assert.doesNotMatch(wizard, /calorieFloor: floor|shiftDays/)
  // Có useEffect (dọn / lưu bản nháp onboarding) nhưng không effect nào được áp một fix hay đổi đáp án
  const effects = wizard.match(/useEffect\(\(\) => \{[\s\S]*?\}, \[[^\]]*\]\)/g) ?? []
  for (const effect of effects)
    assert.ok(
      !/applyShiftFix|patch\(|setAnswers/.test(effect),
      'nothing may apply a fix from an effect'
    )
  const alert = source('features/onboarding/components/OnboardingPage/CalorieShiftAlert.tsx')
  assert.match(alert, /onClick=\{\(\) => \{\s*onApply\(fix\)/)
  assert.equal((alert.match(/onApply\(/g) ?? []).length, 1, 'onApply only from the button')
})
await check(
  '[wiring] ProgramSteps renders the alert under the step (and instead of a stuck skeleton)',
  () => {
    const programSteps = source('features/onboarding/components/OnboardingPage/ProgramSteps.tsx')
    assert.match(programSteps, /<CalorieShiftAlert/)
    assert.match(programSteps, /onApply=\{wizard\.applyShiftFix\}/)
    assert.match(programSteps, /stepId === 'goalSummary' \|\| wizard\.stepId === 'ready'/)
  }
)
await check('[wiring] DistributionStep slider uses the shared SHIFT_PERCENT', () => {
  const step = source('features/onboarding/components/OnboardingPage/DistributionStep.tsx')
  assert.match(step, /min=\{SHIFT_PERCENT\.min\}/)
  assert.ok(!/min=\{5\}/.test(step))
})
await check(
  '[wiring] New Program: editor and review show the problem, create does too, fixes set prefs then rerun preview',
  () => {
    const page = source('features/program/pages/NewProgramStepPage.tsx')
    assert.match(page, /calorieShiftProblemOf\(preview\.error\)/)
    assert.match(page, /calorieShiftProblemOf\(createProgram\.error\)/)
    assert.match(page, /wizard\.setPref\('shiftPercent', shiftPercent\)/)
    assert.match(page, /wizard\.setPref\('distribution', shiftMode\)/)
    // `shiftDays` / `floor` không còn là cách sửa của BE (DistributionStep vẫn tự đặt ngày bằng `days`)
    assert.doesNotMatch(page, /setPref\('floor', floor\)|setPref\('shiftDays', shiftDays\)/)
    assert.match(page, /preview\.reset\(\)\s*createProgram\.reset\(\)/)
    // Review: Done mở khi có preview (và, từ Strategy audit, sau khi đã cuộn tới cuối bản preview đó) và BE không từ chối lúc tạo
    assert.match(
      page,
      /canNext:\s*(Boolean\(preview\.data\)|preview\.data !== undefined\s*&&\s*reviewed === preview\.data)\s*&&\s*!createShift/
    )
    // Preview 200 không khả thi (BE `feasibility`) khoá Done; shift hay không đều đọc từ `preview.data?.feasibility`
    assert.match(page, /&&\s*!createShift\s*&&\s*previewInfeasible === null/)
    assert.match(page, /calorieShiftProblemOfFeasibility\(preview\.data\?\.feasibility\)/)
    assert.match(page, /createProgram\.error && !createShift/)
    assert.match(page, /case 'editor':\s*return \{\s*content: previewShift/)
  }
)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
