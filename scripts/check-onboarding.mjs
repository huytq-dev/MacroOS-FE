// Kiểm tra wizard onboarding: (F4) cân mục tiêu + tốc độ chỉ là GỢI Ý tới khi người dùng xác nhận, Even có sẵn là chính sách UX; (F6) bản nháp Goal / Program ở sessionStorage
// theo tài khoản (khôi phục, kiểm tra schema, vòng đời). Chạy: node --import ./scripts/register-ts.mjs scripts/check-onboarding.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as utils from '../src/features/onboarding/onboarding.utils.ts'
import * as steps from '../src/features/onboarding/onboarding-steps.utils.ts'
import * as draftLib from '../src/features/onboarding/onboarding-draft.ts'

const source = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')
let checks = 0
let failures = 0
function check(name, fn) {
  try {
    fn()
    checks += 1
    console.log(`ok    ${name}`)
  } catch (error) {
    failures += 1
    console.log(`FAIL  ${name}\n        ${String(error.message).split('\n')[0]}`)
  }
}

// sessionStorage giả (khoá liệt kê được bằng Object.keys như Storage thật)
const makeStore = () => {
  const store = {}
  Object.defineProperties(store, {
    getItem: { value: (key) => (key in store ? store[key] : null) },
    setItem: {
      value: (key, value) => {
        store[key] = String(value)
      },
    },
    removeItem: {
      value: (key) => {
        delete store[key]
      },
    },
  })
  return store
}
let store = makeStore()
globalThis.window = {
  get sessionStorage() {
    return store
  },
}

const state = (overrides = {}) => ({
  state: 'InProgress',
  step: 14,
  isRequired: true,
  hasProgram: false,
  consentAccepted: false,
  gender: 'Male',
  dateOfBirth: '1990-03-04',
  heightCm: 181,
  weightKg: 80,
  unitPreference: 'Metric',
  weighedMoreThanBefore: 'No',
  recentWeightTrend: 'Stable',
  bodyFat: null,
  exerciseSessions: 'FourToSix',
  dailyActivity: 'ModeratelyActive',
  liftingExperience: 'Beginner',
  cardioExperience: 'None',
  ...overrides,
})
const TODAY = '2026-10-21'
const proceed = (stepId, answers, extra = {}) =>
  steps.canProceed({
    stepId,
    answers,
    today: TODAY,
    preview: undefined,
    readyReached: false,
    ...extra,
  })
const base = () => utils.initialAnswers(state())
const loss = () => utils.chooseGoalType(base(), 'WeightLoss')
const confirmBoth = (answers) =>
  utils.applyAnswers(answers, {
    targetWeightKg: answers.targetWeightKg,
    weeklyRatePercent: answers.weeklyRatePercent,
  })
const full = (answers) => ({
  ...confirmBoth(answers),
  dietStyle: 'Balanced',
  calorieFloor: 'Standard',
  trainingType: 'Lifting',
  proteinLevel: 'Moderate',
})
const PREVIEW = { floorStandardKcal: 1500, floorLowKcal: 1200 }

// ── F4 ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

check(
  'O1 suggested target (±10 %) and rate (0.5) are NOT answers: Next stays blocked until both are confirmed',
  () => {
    const a = loss()
    assert.equal(a.targetWeightKg, 72)
    assert.equal(a.weeklyRatePercent, 0.5)
    assert.deepEqual(a.goalConfirmed, { targetWeightKg: false, weeklyRatePercent: false })
    assert.equal(proceed('goalTarget', a), false)
    const onlyTarget = utils.applyAnswers(a, { targetWeightKg: 74 })
    assert.equal(proceed('goalTarget', onlyTarget), false, 'rate still a suggestion')
    const onlyRate = utils.applyAnswers(a, { weeklyRatePercent: 0.4 })
    assert.equal(proceed('goalTarget', onlyRate), false, 'target still a suggestion')
    assert.equal(
      proceed('goalTarget', utils.applyAnswers(onlyTarget, { weeklyRatePercent: 0.4 })),
      true
    )
  }
)

check(
  'O2 "Use these values" confirms exactly the values on screen (same numbers, now confirmed)',
  () => {
    const a = loss()
    const confirmed = confirmBoth(a)
    assert.equal(confirmed.targetWeightKg, 72)
    assert.equal(confirmed.weeklyRatePercent, 0.5)
    assert.deepEqual(confirmed.goalConfirmed, { targetWeightKg: true, weeklyRatePercent: true })
    assert.equal(proceed('goalTarget', confirmed), true)
    // giá trị sai hướng vẫn bị chặn dù đã xác nhận
    assert.equal(
      proceed('goalTarget', utils.applyAnswers(confirmed, { targetWeightKg: 85 })),
      false
    )
  }
)

check(
  'O3 changing the goal type resets target + rate to unconfirmed suggestions; same goal keeps confirmation',
  () => {
    const confirmed = confirmBoth(loss())
    assert.equal(utils.chooseGoalType(confirmed, 'WeightLoss'), confirmed)
    const gain = utils.chooseGoalType(confirmed, 'WeightGain')
    assert.equal(gain.targetWeightKg, 88)
    assert.equal(gain.weeklyRatePercent, 0.5)
    assert.deepEqual(gain.goalConfirmed, { targetWeightKg: false, weeklyRatePercent: false })
    assert.equal(proceed('goalTarget', gain), false)
    const maintain = utils.chooseGoalType(confirmed, 'Maintenance')
    assert.equal(maintain.targetWeightKg, null)
  }
)

check('O4 changing the current weight after confirming re-checks validity and confirmation', () => {
  const confirmed = confirmBoth(loss()) // 80 kg → target 72
  const heavier = utils.applyAnswers(confirmed, { weightKg: 90 })
  assert.equal(heavier.targetWeightKg, 72, 'still the right direction → value kept')
  assert.deepEqual(heavier.goalConfirmed, { targetWeightKg: false, weeklyRatePercent: false })
  assert.equal(proceed('goalTarget', heavier), false)
  const lighter = utils.applyAnswers(confirmed, { weightKg: 60 })
  assert.equal(lighter.targetWeightKg, 54, '72 kg is no longer below 60 kg → new suggestion')
  assert.deepEqual(lighter.goalConfirmed, { targetWeightKg: false, weeklyRatePercent: false })
  const same = utils.applyAnswers(confirmed, { weightKg: 80 })
  assert.deepEqual(
    same.goalConfirmed,
    { targetWeightKg: true, weeklyRatePercent: true },
    'same weight = no change'
  )
  const noGoalYet = utils.applyAnswers(base(), { weightKg: 90 })
  assert.equal(noGoalYet.goalType, null)
  assert.equal(noGoalYet.targetWeightKg, null)
})

check(
  'O5 distribution: "Distribute Evenly" is preselected and Next accepts it; Shift stores the config exactly',
  () => {
    const a = full(loss())
    assert.equal(a.shiftMode, 'Even')
    assert.equal(proceed('distribution', a), true, 'Next on the preselected Even = accepted')
    const evenRequest = steps.programRequestOf(a, PREVIEW)
    assert.equal(evenRequest.calorieShiftMode, 'Even')
    assert.equal(evenRequest.calorieShiftDays, null)
    assert.equal(evenRequest.calorieShiftPercent, null)
    const shift = { ...a, shiftMode: 'Custom', shiftDays: ['Saturday', 'Sunday'], shiftPercent: 15 }
    assert.equal(proceed('distribution', shift), true)
    const shiftRequest = steps.programRequestOf(shift, PREVIEW)
    assert.equal(shiftRequest.calorieShiftMode, 'Custom')
    assert.deepEqual(shiftRequest.calorieShiftDays, ['Saturday', 'Sunday'])
    assert.equal(shiftRequest.calorieShiftPercent, 15)
    assert.equal(proceed('distribution', { ...shift, shiftDays: [] }), false)
    assert.equal(
      proceed('distribution', {
        ...shift,
        shiftDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      }),
      false
    )
  }
)

check('O6 Create refuses unconfirmed target/rate; Maintenance needs no target', () => {
  assert.throws(
    () =>
      steps.programRequestOf(
        { ...full(loss()), goalConfirmed: { targetWeightKg: true, weeklyRatePercent: false } },
        PREVIEW
      ),
    /not confirmed/
  )
  assert.throws(
    () =>
      steps.programRequestOf(
        { ...full(loss()), goalConfirmed: { targetWeightKg: false, weeklyRatePercent: true } },
        PREVIEW
      ),
    /not confirmed/
  )
  const request = steps.programRequestOf(full(loss()), PREVIEW)
  assert.equal(request.targetWeightKg, 72)
  assert.equal(request.weeklyWeightChangeTargetPercent, 0.5)
  const maintain = {
    ...utils.chooseGoalType(base(), 'Maintenance'),
    dietStyle: 'Balanced',
    calorieFloor: 'Low',
    trainingType: 'None',
    proteinLevel: 'High',
  }
  const maintainRequest = steps.programRequestOf(maintain, PREVIEW)
  assert.equal(maintainRequest.targetWeightKg, null)
  assert.equal(maintainRequest.weeklyWeightChangeTargetPercent, 0)
  assert.equal(maintainRequest.calorieFloorKcal, 1200)
})

check('O7 Preview and Create carry exactly the same confirmed values', () => {
  const a = {
    ...full(loss()),
    manualTdeeKcal: 2600,
    shiftMode: 'Custom',
    shiftDays: ['Friday'],
    shiftPercent: 12,
  }
  const preview = utils.previewRequestOf(a)
  const create = steps.programRequestOf(a, PREVIEW)
  assert.equal(preview.goalType, create.goalType)
  assert.equal(preview.targetWeightKg, create.targetWeightKg)
  assert.equal(preview.weeklyRatePercent, create.weeklyWeightChangeTargetPercent)
  assert.equal(preview.dietStyle, create.dietStyle)
  assert.equal(preview.proteinLevel, create.proteinLevel)
  assert.equal(preview.trainingType, create.trainingType)
  assert.equal(preview.shiftMode, create.calorieShiftMode)
  assert.deepEqual(preview.shiftDays, create.calorieShiftDays)
  assert.equal(preview.shiftPercent, create.calorieShiftPercent)
  assert.equal(preview.manualTdeeKcal, create.manualInitialTdeeKcal)
  assert.equal(preview.calorieFloor, 'Standard')
  assert.equal(create.calorieFloorKcal, PREVIEW.floorStandardKcal)
})

check(
  'O8 back navigation: going back and changing answers re-blocks the steps that depend on them',
  () => {
    let a = full(loss())
    assert.equal(proceed('goalTarget', a), true)
    a = utils.applyAnswers(a, { weightKg: 95 }) // back to the weight step, new weight
    assert.equal(proceed('goalTarget', a), false)
    a = confirmBoth(a)
    assert.equal(proceed('goalTarget', a), true)
    a = utils.chooseGoalType(a, 'WeightGain') // back to goal type, other direction
    assert.equal(proceed('goalTarget', a), false)
  }
)

// ── F6 ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

const USER = 'user-a'
const stored = (answers, stepId, userId = USER) =>
  JSON.stringify(draftLib.draftOf(answers, stepId, userId))

check(
  'O9 draft holds only Goal/Program preferences: no Basics values, no email/token/password',
  () => {
    const draft = draftLib.draftOf({ ...full(loss()), manualTdeeKcal: 2500 }, 'diet', USER)
    const json = JSON.stringify(draft)
    for (const forbidden of [
      'dateOfBirth',
      'heightCm',
      'gender',
      'email',
      'token',
      'password',
      'unit',
    ])
      assert.ok(!json.includes(forbidden), `draft must not contain ${forbidden}`)
    assert.deepEqual(Object.keys(draft).sort(), ['goal', 'stepId', 'userId', 'version', 'weightKg'])
    assert.equal(draft.goal.manualTdeeKcal, 2500)
    assert.match(draftLib.draftKey(USER), /^macroos\.onboarding-draft\.v1\.user-a$/)
  }
)

check(
  'O10 refresh mid-onboarding restores the goal/program choices at the right step; Basics stay from BE',
  () => {
    store = makeStore()
    const a = {
      ...full(loss()),
      manualTdeeKcal: 2500,
      shiftMode: 'Custom',
      shiftDays: ['Saturday'],
      shiftPercent: 18,
    }
    draftLib.writeDraft(draftLib.draftOf(a, 'protein', USER))
    const boot = draftLib.bootOf(state({ weightKg: 80, heightCm: 181 }), USER)
    assert.equal(boot.restored, true)
    assert.equal(boot.stepId, 'protein')
    assert.equal(boot.answers.goalType, 'WeightLoss')
    assert.equal(boot.answers.targetWeightKg, 72)
    assert.equal(boot.answers.manualTdeeKcal, 2500, 'manual TDEE restored')
    assert.equal(boot.answers.shiftMode, 'Custom')
    assert.deepEqual(boot.answers.shiftDays, ['Saturday'])
    assert.equal(boot.answers.shiftPercent, 18)
    assert.equal(boot.answers.dietStyle, 'Balanced')
    // Basics luôn của BE (không có trong bản nháp)
    assert.equal(boot.answers.weightKg, 80)
    assert.equal(boot.answers.heightCm, 181)
    assert.equal(boot.answers.dateOfBirth, '1990-03-04')
  }
)

check(
  'O11 confirmed vs suggested: restored flags are exactly as stored (suggestions stay unconfirmed)',
  () => {
    store = makeStore()
    draftLib.writeDraft(draftLib.draftOf(loss(), 'goalTarget', USER))
    let boot = draftLib.bootOf(state(), USER)
    assert.deepEqual(boot.answers.goalConfirmed, {
      targetWeightKg: false,
      weeklyRatePercent: false,
    })
    assert.equal(boot.stepId, 'goalTarget')
    assert.equal(proceed('goalTarget', boot.answers), false)
    const half = utils.applyAnswers(loss(), { targetWeightKg: 74 })
    draftLib.writeDraft(draftLib.draftOf(half, 'goalTarget', USER))
    boot = draftLib.bootOf(state(), USER)
    assert.deepEqual(boot.answers.goalConfirmed, { targetWeightKg: true, weeklyRatePercent: false })
    draftLib.writeDraft(draftLib.draftOf(confirmBoth(loss()), 'goalSummary', USER))
    boot = draftLib.bootOf(state(), USER)
    assert.deepEqual(boot.answers.goalConfirmed, { targetWeightKg: true, weeklyRatePercent: true })
    assert.equal(boot.stepId, 'goalSummary')
  }
)

check(
  'O12 stale draft never overrides BE: new weight → re-confirm, wrong-direction target → new suggestion',
  () => {
    store = makeStore()
    draftLib.writeDraft(draftLib.draftOf(full(loss()), 'ready', USER)) // saved at 80 kg
    let boot = draftLib.bootOf(state({ weightKg: 90 }), USER)
    assert.equal(boot.answers.weightKg, 90)
    assert.equal(boot.answers.targetWeightKg, 72, 'still below 90')
    assert.deepEqual(boot.answers.goalConfirmed, {
      targetWeightKg: false,
      weeklyRatePercent: false,
    })
    assert.equal(boot.stepId, 'goalTarget', 'cannot resume past an unconfirmed goal')
    boot = draftLib.bootOf(state({ weightKg: 60 }), USER)
    assert.equal(boot.answers.targetWeightKg, 54)
    assert.equal(boot.stepId, 'goalTarget')
  }
)

check('O13 resume never goes past the first missing answer', () => {
  store = makeStore()
  const a = {
    ...confirmBoth(loss()),
    dietStyle: null,
    calorieFloor: null,
    trainingType: null,
    proteinLevel: 'High',
  }
  draftLib.writeDraft(draftLib.draftOf(a, 'protein', USER))
  assert.equal(draftLib.bootOf(state(), USER).stepId, 'diet')
  assert.equal(
    draftLib.resumeStepOf(full(loss()), 'goalType'),
    'goalType',
    'never moves forward either'
  )
})

check('O14 invalid / old / foreign drafts are ignored (never restored, never crash)', () => {
  const good = JSON.parse(stored(full(loss()), 'diet'))
  const variants = [
    'not json',
    '"string"',
    'null',
    JSON.stringify({ ...good, version: 0 }),
    JSON.stringify({ ...good, version: 2 }),
    JSON.stringify({ ...good, userId: 'someone-else' }),
    JSON.stringify({ ...good, stepId: 'sex' }),
    JSON.stringify({ ...good, stepId: 'carousel' }),
    JSON.stringify({ ...good, stepId: 'nope' }),
    JSON.stringify({ ...good, goal: null }),
    JSON.stringify({ ...good, weightKg: 'heavy' }),
  ]
  for (const raw of variants) assert.equal(draftLib.parseDraft(raw, USER), null, raw.slice(0, 40))
  assert.equal(draftLib.parseDraft(null, USER), null)
  store = makeStore()
  store[draftLib.draftKey(USER)] = 'not json'
  const boot = draftLib.bootOf(state(), USER)
  assert.equal(boot.restored, false)
  assert.equal(boot.answers.goalType, null)
})

check(
  'O15 bad individual values fall back to safe defaults and are NOT treated as confirmed',
  () => {
    const good = JSON.parse(stored(full(confirmBoth(loss())), 'diet'))
    const bad = {
      ...good,
      goal: {
        ...good.goal,
        weeklyRatePercent: 9,
        targetWeightKg: 5,
        manualTdeeKcal: 99999,
        shiftPercent: 3,
        shiftDays: ['Funday'],
        dietStyle: 'Carnivore',
        goalConfirmed: { targetWeightKg: true, weeklyRatePercent: true },
      },
    }
    const parsed = draftLib.parseDraft(JSON.stringify(bad), USER)
    assert.equal(parsed.goal.weeklyRatePercent, 0.5)
    assert.equal(parsed.goal.targetWeightKg, null)
    assert.deepEqual(parsed.goal.goalConfirmed, { targetWeightKg: false, weeklyRatePercent: false })
    assert.equal(parsed.goal.manualTdeeKcal, null)
    assert.equal(parsed.goal.shiftPercent, 10)
    assert.deepEqual(parsed.goal.shiftDays, [])
    assert.equal(parsed.goal.dietStyle, null)
  }
)

check(
  'O16 only an in-progress onboarding restores; a finished / program-created one clears the draft',
  () => {
    store = makeStore()
    draftLib.writeDraft(draftLib.draftOf(full(loss()), 'diet', USER))
    assert.equal(draftLib.bootOf(state({ state: 'NotStarted' }), USER).restored, false)
    assert.equal(draftLib.bootOf(state({ hasProgram: true }), USER).restored, false)
    assert.equal(draftLib.bootOf(state(), null).restored, false, 'no user id → no restore')
    draftLib.pruneDrafts(USER, false)
    assert.equal(store[draftLib.draftKey(USER)], undefined)
  }
)

check(
  'O17 switching accounts: another user never sees this draft and it is pruned; logout clears everything',
  () => {
    store = makeStore()
    draftLib.writeDraft(draftLib.draftOf(full(loss()), 'diet', 'user-a'))
    assert.equal(draftLib.readDraft('user-b'), null)
    assert.equal(draftLib.bootOf(state(), 'user-b').restored, false)
    draftLib.pruneDrafts('user-b', true)
    assert.equal(
      Object.keys(store).length,
      0,
      "user-a's draft is removed when user-b opens the wizard"
    )
    draftLib.writeDraft(draftLib.draftOf(full(loss()), 'diet', 'user-a'))
    draftLib.writeDraft(draftLib.draftOf(full(loss()), 'diet', 'user-b'))
    store['macroos.onboarding-draft.v0.old'] = 'x'
    store.unrelated = 'keep'
    draftLib.clearAllDrafts()
    assert.deepEqual(Object.keys(store), ['unrelated'])
  }
)

check('O18 storage unavailable (private mode / throws): wizard still works, nothing throws', () => {
  const saved = Object.getOwnPropertyDescriptor(globalThis.window, 'sessionStorage')
  Object.defineProperty(globalThis.window, 'sessionStorage', {
    configurable: true,
    get() {
      throw new Error('SecurityError')
    },
  })
  try {
    assert.equal(draftLib.readDraft(USER), null)
    assert.doesNotThrow(() => draftLib.writeDraft(draftLib.draftOf(base(), 'estimate', USER)))
    assert.doesNotThrow(() => draftLib.clearDraft(USER))
    assert.doesNotThrow(() => draftLib.clearAllDrafts())
    assert.doesNotThrow(() => draftLib.pruneDrafts(USER, true))
    assert.equal(draftLib.bootOf(state(), USER).restored, false)
  } finally {
    Object.defineProperty(globalThis.window, 'sessionStorage', saved)
  }
})

check(
  'O19 lifecycle wiring: clear on create success / complete / logout; keep on create failure; restore never calls the API',
  () => {
    const hook = source('features/onboarding/hooks/use-onboarding-wizard.ts')
    assert.match(
      hook,
      /await createProgram\.mutateAsync\(programRequestOf\(answers, preview\)\)\s+[^\n]*\n\s+if \(userId !== null\) clearDraft\(userId\)/
    )
    assert.match(
      hook,
      /await complete\.mutateAsync\([^)]*\)\s+if \(userId !== null\) clearDraft\(userId\)/
    )
    const catchBlock = hook.slice(
      hook.indexOf('} catch (failure) {'),
      hook.indexOf('const back = () =>')
    )
    assert.ok(!/clearDraft/.test(catchBlock), 'a failed create must keep the draft for the retry')
    assert.match(hook, /const \[boot\] = useState\(\(\) => bootOf\(initial, userId\)\)/)
    assert.match(source('features/auth/hooks/use-auth.ts'), /clearAllDrafts\(\)/)
    const draftSource = source('features/onboarding/onboarding-draft.ts')
    assert.ok(
      !/mutate|apiCall|fetch\(|axios/.test(draftSource),
      'restoring must never call the API'
    )
    assert.ok(!/useEffect|useState/.test(draftSource), 'pure helpers only')
  }
)

check(
  'O20 UX wiring: suggestion note on the goal step, shared component, Even policy documented',
  () => {
    const program = source('features/onboarding/components/OnboardingPage/ProgramSteps.tsx')
    assert.match(
      program,
      /goalConfirmed\.targetWeightKg && answers\.goalConfirmed\.weeklyRatePercent/
    )
    assert.match(program, /action="Use these values"/)
    assert.match(
      source('features/onboarding/components/OnboardingPage/BasicsSteps.tsx'),
      /from '\.\/SuggestionNote'/
    )
    const hook = source('features/onboarding/hooks/use-onboarding-wizard.ts')
    assert.match(hook, /setAnswers\(\(current\) => chooseGoalType\(current, goal\)\)/)
    assert.match(source('features/onboarding/onboarding-steps.utils.ts'), /Chính sách UX MacroOS/)
  }
)

// ── Insights vòng 6: Calibrating / RecoveringLogs, lỗi 400 thiếu câu trả lời ─────────────────────────────────────────────────

const series = await import('../src/features/dashboard/expenditure-series.ts')

check(
  'O21 RecoveringLogs sentence is built ONLY from BE numbers (resumeConsecutiveDays, resumeInDays); nothing hardcoded',
  () => {
    const base = { holdingReasonCodes: ['RecoveringLogs'], loggedDaysLast7: 2, weighInDaysLast7: 1 }
    assert.deepEqual(
      series.holdingReasonsOf({ ...base, resumeConsecutiveDays: 3, resumeInDays: 2 }),
      [
        'Updating resumes after 3 consecutive days of valid logs.',
        'If you keep logging, about 2 more days to go.',
      ]
    )
    assert.deepEqual(
      series.holdingReasonsOf({ ...base, resumeConsecutiveDays: 5, resumeInDays: 1 }),
      [
        'Updating resumes after 5 consecutive days of valid logs.',
        'If you keep logging, about 1 more day to go.',
      ]
    )
    assert.deepEqual(
      series.holdingReasonsOf({ ...base, resumeConsecutiveDays: 3, resumeInDays: null }),
      ['Updating resumes after 3 consecutive days of valid logs.']
    )
    assert.deepEqual(
      series.holdingReasonsOf({ ...base }),
      [],
      'no BE numbers → no sentence, nothing guessed'
    )
    assert.deepEqual(
      series.holdingReasonsOf({ ...base, resumeConsecutiveDays: 3, resumeInDays: 0 }).length,
      1
    )
    const block = source('features/dashboard/expenditure-series.ts').match(
      /if \(code === 'RecoveringLogs'\) \{[\s\S]*?return lines\n\s+\}/
    )[0]
    assert.ok(
      !/\d/.test(block.replace(/`[^`]*`/g, '').replace(/> 0|=== 1/g, '')),
      'no numeric literal besides the > 0 guards'
    )
  }
)

check('O22 other holding reasons keep working; unknown codes are ignored', () => {
  const info = {
    loggedDaysLast7: 2,
    weighInDaysLast7: 0,
    resumeInDays: null,
    resumeConsecutiveDays: null,
  }
  assert.equal(series.holdingReasonsOf({ ...info, holdingReasonCodes: ['MissingLogs'] }).length, 1)
  assert.equal(
    series.holdingReasonsOf({ ...info, holdingReasonCodes: ['NoRecentWeighIn'] }).length,
    1
  )
  assert.deepEqual(series.holdingReasonsOf({ ...info, holdingReasonCodes: ['FutureCode'] }), [])
  assert.deepEqual(series.holdingReasonsOf(null), [])
})

check(
  'O23 Calibrating: neutral sentence, no countdown, square marker; Updating circle; Holding square',
  () => {
    assert.equal(series.markerOf('Calibrating'), 'square')
    assert.equal(series.markerOf('Holding'), 'square')
    assert.equal(series.markerOf('Updating'), 'circle')
    const insights = source('features/dashboard/components/ExpenditurePage/ExpenditureInsights.tsx')
    assert.ok(!/calibratingDaysLeft/.test(insights), 'no countdown for Calibrating')
    assert.ok(!/days? left/.test(insights))
    assert.match(insights, /Calibrating:\s*'MacroOS is calibrating your expenditure/)
    assert.ok(
      !/calibratingDaysLeft/.test(source('features/dashboard/hooks/use-expenditure-detail.ts'))
    )
    const types = source('features/dashboard/types/expenditure-series.types.ts')
    assert.match(types, /'RecoveringLogs'/)
    assert.match(types, /resumeInDays\?: number \| null/)
    assert.match(types, /resumeConsecutiveDays\?: number \| null/)
  }
)

check(
  'O24 a 400 from the estimate / preview shows the existing error state with Try again (no endless spinner, no invented numbers)',
  () => {
    const chat = source('features/onboarding/components/OnboardingPage/EstimateChatStep.tsx')
    const errorBranch = chat.indexOf('if (error && !estimate)')
    const spinnerBranch = chat.indexOf('if (isLoading || !estimate')
    assert.ok(
      errorBranch > 0 && errorBranch < spinnerBranch,
      'error branch comes before the spinner'
    )
    assert.match(chat, /<ErrorState[\s\S]*onRetry=\{onRetry\}/)
    const hook = source('features/onboarding/hooks/use-onboarding-wizard.ts')
    assert.match(hook, /estimateError: estimateQuery\.isError \? estimateQuery\.error : null/)
    assert.match(
      hook,
      /previewError:\s*previewSettled\s*&&\s*previewQuery\.isError\s*&&\s*!shiftProblem/
    )
    const program = source('features/onboarding/components/OnboardingPage/ProgramSteps.tsx')
    assert.match(program, /wizard\.previewError !== null && !wizard\.preview/)
    assert.match(program, /\['goalSummary', 'floor', 'ready'\]\.includes\(wizard\.stepId\)/)
    assert.match(source('features/more/pages/BmrEquationPage.tsx'), /estimate\.isError \? \(/)
    for (const file of [chat, hook, program])
      assert.ok(!/\?\? 2\d{3}\b|tdeeKcal: \d{4}/.test(file), 'no fallback TDEE')
  }
)

// ── Prior Weight v2 (BE là nguồn duy nhất của ngưỡng) ─────────────────────────────────────────────────────────────────────────

check(
  'O25 Prior Weight payload carries EXACTLY the shown number + unit next to the answer (new branch); old branch unchanged',
  () => {
    const answered = utils.applyAnswers(base(), {
      weighedMoreThanBefore: 'No',
      priorWeightThresholdShown: 93,
      priorWeightThresholdUnit: 'kg',
    })
    const payload = utils.basicsPayload('weightHistory', answered)
    assert.deepEqual(payload, {
      step: utils.basicsPayload('weightHistory', answered).step,
      weighedMoreThanBefore: 'No',
      priorWeightThresholdShown: 93,
      priorWeightThresholdUnit: 'kg',
    })
    const lb = utils.applyAnswers(base(), {
      weighedMoreThanBefore: 'Yes',
      priorWeightThresholdShown: 205,
      priorWeightThresholdUnit: 'lb',
    })
    assert.equal(utils.basicsPayload('weightHistory', lb).priorWeightThresholdShown, 205)
    assert.equal(utils.basicsPayload('weightHistory', lb).priorWeightThresholdUnit, 'lb')
    const legacy = utils.applyAnswers(base(), { weighedMoreThanBefore: 'Yes' })
    const legacyPayload = utils.basicsPayload('weightHistory', legacy)
    assert.ok(!('priorWeightThresholdShown' in legacyPayload), 'flag-off payload has no new fields')
    assert.equal(
      utils.basicsPayload(
        'weightHistory',
        utils.initialAnswers(state({ weighedMoreThanBefore: null }))
      ),
      null
    )
  }
)

check(
  'O26 a shown threshold is only valid for the weight + unit it was shown for: changing either asks again',
  () => {
    const answered = utils.applyAnswers(base(), {
      weighedMoreThanBefore: 'No',
      priorWeightThresholdShown: 93,
      priorWeightThresholdUnit: 'kg',
    })
    for (const partial of [{ weightKg: 85 }, { unit: 'Imperial' }]) {
      const next = utils.applyAnswers(answered, partial)
      assert.equal(next.weighedMoreThanBefore, null, JSON.stringify(partial))
      assert.equal(next.priorWeightThresholdShown, null)
      assert.equal(next.priorWeightThresholdUnit, null)
    }
    const same = utils.applyAnswers(answered, { weightKg: answered.weightKg, unit: answered.unit })
    assert.equal(same.weighedMoreThanBefore, 'No', 'no change → keep the answer')
    const legacy = utils.applyAnswers(
      utils.applyAnswers(base(), { weighedMoreThanBefore: 'Yes' }),
      { weightKg: 85 }
    )
    assert.equal(legacy.weighedMoreThanBefore, 'Yes', 'old branch keeps its behaviour')
  }
)

check(
  "O27 flag OFF keeps today's screen; flag ON branch has NO FE threshold math and re-asks BE when the unit changes",
  () => {
    const config = source('features/onboarding/prior-weight.config.ts')
    assert.match(config, /PRIOR_WEIGHT_API = process\.env\.NEXT_PUBLIC_PRIOR_WEIGHT_API === 'true'/)
    const basics = source('features/onboarding/components/OnboardingPage/BasicsSteps.tsx')
    assert.match(basics, /if \(PRIOR_WEIGHT_API\)\s+return \(\s+<WeightHistoryStep/)
    assert.equal(
      (basics.match(/\* 1\.06/g) ?? []).length,
      1,
      'legacy ×1.06 only in the flag-off branch'
    )
    assert.match(
      basics,
      /const legacyPriorWeightLabel = [\s\S]*?\* 1\.06/,
      'the ×1.06 lives only in the legacy helper'
    )
    assert.equal(
      (basics.match(/legacyPriorWeightLabel\(/g) ?? []).length,
      1,
      'called exactly once (the legacy branch)'
    )
    assert.ok(
      basics.indexOf('<WeightHistoryStep') < basics.indexOf('legacyPriorWeightLabel(answers'),
      'the helper is only reached after the flag-on return'
    )
    const step = source('features/onboarding/components/OnboardingPage/WeightHistoryStep.tsx')
    assert.ok(!/1\.06|0\.9|LB_PER_KG|Math\./.test(step), 'no threshold math in the new step')
    assert.match(step, /unit === 'Imperial' \? 'lb' : 'kg'/)
    assert.match(
      step,
      /onAnswer\(answer, \{ value: data\.displayValue, unit: data\.displayUnit \}\)/
    )
    assert.match(
      step,
      /Have you ever weighed more than \$\{data\.displayValue\} \$\{data\.displayUnit\}\?/
    )
    const hook = source('features/onboarding/hooks/use-onboarding.ts')
    assert.match(
      hook,
      /\['onboarding', 'prior-weight-question', params\.weightKg \?\? null, params\.unit\]/
    )
    assert.match(basics, /priorWeightThresholdShown: shown\.value/)
    assert.match(basics, /priorWeightThresholdUnit: shown\.unit/)
  }
)

check('O28 prior-weight-question endpoint wiring', () => {
  assert.match(
    source('config/api-routes.ts'),
    /priorWeightQuestion: '\/onboarding\/prior-weight-question'/
  )
  assert.match(
    source('features/onboarding/services/onboarding.service.ts'),
    /apiCall\.get<PriorWeightQuestion>\(apiRoutes\.onboarding\.priorWeightQuestion, \{ params \}\)/
  )
  const types = source('features/onboarding/types/onboarding.types.ts')
  assert.match(types, /priorWeightThresholdShown\?: number/)
  assert.match(types, /priorWeightThresholdUnit\?: 'kg' \| 'lb'/)
  assert.match(
    types,
    /interface PriorWeightQuestion \{[\s\S]*displayValue: number[\s\S]*displayUnit: 'kg' \| 'lb'/
  )
})

// ── BE giữ cân nặng đã lưu của hôm nay (PUT /onboarding/basics: weightKept) ──
check('weight kept: weightKept true → one short message with the stored number and unit', () => {
  assert.equal(
    utils.weightKeptMessage({
      weightKept: true,
      storedWeightKg: 82.4,
      storedWeightDisplay: 82.4,
      displayUnit: 'kg',
    }),
    'Your saved weight for today (82.4 kg) was kept.'
  )
  assert.equal(
    utils.weightKeptMessage({
      weightKept: true,
      storedWeightKg: 82.4,
      storedWeightDisplay: 181.7,
      displayUnit: 'lb',
    }),
    'Your saved weight for today (181.7 lb) was kept.',
    'shows the number in the user display unit'
  )
  assert.equal(
    utils.weightKeptMessage({ weightKept: true, storedWeightDisplay: 80, displayUnit: 'kg' }),
    'Your saved weight for today (80.0 kg) was kept.'
  )
})
check(
  'weight kept: weightKept false (same number, no stored weight, no weight sent) → no message',
  () => {
    assert.equal(
      utils.weightKeptMessage({
        weightKept: false,
        storedWeightKg: 82.4,
        storedWeightDisplay: 82.4,
        displayUnit: 'kg',
      }),
      null
    )
    assert.equal(
      utils.weightKeptMessage({
        weightKept: false,
        storedWeightKg: null,
        storedWeightDisplay: null,
        displayUnit: 'kg',
      }),
      null
    )
  }
)
check(
  'weight kept: old BE ({} / null / missing fields) or bad numbers → no message, no crash',
  () => {
    assert.equal(utils.weightKeptMessage({}), null)
    assert.equal(utils.weightKeptMessage(null), null)
    assert.equal(utils.weightKeptMessage(undefined), null)
    assert.equal(utils.weightKeptMessage({ weightKept: true }), null)
    assert.equal(
      utils.weightKeptMessage({ weightKept: true, storedWeightDisplay: null, displayUnit: 'kg' }),
      null
    )
    assert.equal(utils.weightKeptMessage({ weightKept: true, storedWeightDisplay: 82.4 }), null)
    assert.equal(
      utils.weightKeptMessage({
        weightKept: true,
        storedWeightDisplay: Number.NaN,
        displayUnit: 'kg',
      }),
      null
    )
  }
)
check(
  'weight kept: FE never compares weights — the wizard toasts only what weightKeptMessage returns, with the existing toast',
  () => {
    const hook = source('features/onboarding/hooks/use-onboarding-wizard.ts')
    assert.match(hook, /const saved = await saveBasics\.mutateAsync\(payload\)/)
    assert.match(hook, /const kept = weightKeptMessage\(saved\)\s*\n\s*if \(kept\) toast\(kept\)/)
    assert.match(hook, /import \{ toast \} from 'sonner'/)
    const types = source('features/onboarding/types/onboarding.types.ts')
    const block = types.slice(
      types.indexOf('export interface SaveBasicsResponse'),
      types.indexOf('export interface SaveBasicsRequest')
    )
    for (const field of [
      'weightKept?:',
      'storedWeightKg?:',
      'storedWeightDisplay?:',
      'displayUnit?:',
    ])
      assert.ok(block.includes(field), `${field} optional`)
    assert.match(
      source('features/onboarding/services/onboarding.service.ts'),
      /apiCall\.put<SaveBasicsResponse \| null>/
    )
  }
)

console.log(`\n${checks} groups passed${failures ? `, ${failures} FAILED` : ''}`)
process.exit(failures === 0 ? 0 : 1)
