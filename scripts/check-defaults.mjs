// Kiểm tra: FE không gửi giá trị mặc định chưa xác nhận và không tự bịa số.
//   C8  onboarding Basics (dateOfBirth / heightCm / weightKg) + Profile: chỉ gửi trường người dùng đã đặt / sửa
//   H14 ô Set TDEE: mở ở TDEE hiện tại (hoặc để trống), giới hạn 1000–6000, không ghi đè số cũ
//   H15 Manual program: không dựng macro từ số bịa (TDEE 2000, 75 kg, 1.8 g/kg, 25% fat)
// Chạy: node --import ./scripts/register-ts.mjs scripts/check-defaults.mjs   (hoặc `pnpm run check:defaults`)
//
// Thiết kế để các check FAIL trên bản cũ (HEAD) ĐÚNG LÝ DO: ưu tiên gọi các hàm đã có từ trước (`initialAnswers`, `basicsPayload`,
// `canProceed`, `defaultManualDay`, `dayTargetsOf`, schema hồ sơ) rồi khẳng định hành vi mới; các hàm mới (`applyAnswers`, ...) chỉ dùng
// qua một lối thay thế tương đương hành vi cũ khi chưa có (vd. `patch` cũ chỉ gộp đối tượng). Nhóm [wiring] đọc mã nguồn để chắc rằng
// các hàm thuần được NỐI vào màn hình (hook, ProfilePage, ProgramActions...) — không thể chạy React ở đây.
// Mỗi check chạy độc lập: lỗi được in ra rồi tiếp tục; có lỗi thì thoát mã 1.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { zodResolver } from '@hookform/resolvers/zod'

const onboarding = await import('../src/features/onboarding/onboarding.utils.ts')
const steps = await import('../src/features/onboarding/onboarding-steps.utils.ts')
const programRequest = await import('../src/features/program/utils/program-request.ts')
const profileSchema = await import('../src/features/users/schemas/update-profile.schema.ts')
const profile = await import('../src/features/users/profile.utils.ts').catch((error) => ({ error }))
const tdee = await import('../src/features/program/utils/tdee.utils.ts').catch((error) => ({
  error,
}))

const source = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')
const need = (module, name) => {
  assert.ok(!module.error, `module missing: ${module.error?.message}`)
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

const TODAY = '2026-10-21'
const blankState = {
  state: 'InProgress',
  step: 2,
  isRequired: true,
  hasProgram: false,
  consentAccepted: false,
  gender: 'Male',
  dateOfBirth: null,
  heightCm: null,
  weightKg: null,
  unitPreference: 'Metric',
  weighedMoreThanBefore: null,
  recentWeightTrend: null,
  bodyFat: null,
  exerciseSessions: null,
  dailyActivity: null,
  liftingExperience: null,
  cardioExperience: null,
}
const savedState = { ...blankState, dateOfBirth: '1990-03-04', heightCm: 181, weightKg: 82.5 }
const proceedOf = (stepId, answers) =>
  steps.canProceed({ stepId, answers, today: TODAY, preview: undefined, readyReached: false })
// Người dùng chạm bánh xe: bản mới dùng `applyAnswers`; bản cũ chỉ gộp đối tượng (đúng như `patch` cũ của hook)
const interact = (answers, partial) =>
  typeof onboarding.applyAnswers === 'function'
    ? onboarding.applyAnswers(answers, partial)
    : { ...answers, ...partial }

// ── C8: onboarding Basics (hàm cũ: initialAnswers / basicsPayload / canProceed) ─────────────────────────────────────────────────

await check(
  'C8 untouched birth step sends NOTHING (the suggested 1995-06-15 is never sent)',
  () => {
    const answers = onboarding.initialAnswers(blankState)
    assert.equal(onboarding.basicsPayload('birth', answers), null)
  }
)
await check('C8 untouched height step sends NOTHING (the suggested 170 cm is never sent)', () => {
  const answers = onboarding.initialAnswers(blankState)
  assert.equal(onboarding.basicsPayload('height', answers), null)
})
await check('C8 untouched weight step sends NOTHING (the suggested 70 kg is never sent)', () => {
  const answers = onboarding.initialAnswers(blankState)
  assert.equal(onboarding.basicsPayload('weight', answers), null)
})

await check('C8 Next stays disabled until the user answers birth / height / weight', () => {
  const answers = onboarding.initialAnswers(blankState)
  assert.equal(proceedOf('birth', answers), false, 'birth')
  assert.equal(proceedOf('height', answers), false, 'height')
  assert.equal(proceedOf('weight', answers), false, 'weight')
})

await check(
  'C8 touching only the height wheel sends only the height and leaves weight / birth unanswered',
  () => {
    const base = onboarding.initialAnswers(blankState)
    const height = interact(base, { heightCm: 180 })
    const payload = onboarding.basicsPayload('height', height)
    assert.equal(payload?.heightCm, 180)
    assert.equal(payload?.unitPreference, 'Metric')
    assert.equal(
      onboarding.basicsPayload('weight', height),
      null,
      'weight must still be unanswered'
    )
    assert.equal(onboarding.basicsPayload('birth', height), null, 'birth must still be unanswered')
    assert.equal(proceedOf('height', height), true)
  }
)

await check(
  'C8 touching the birth wheel answers it (adult) and an under-18 date is still rejected',
  () => {
    const base = onboarding.initialAnswers(blankState)
    const born = interact(base, { dateOfBirth: '1999-01-02' })
    assert.equal(onboarding.basicsPayload('birth', born)?.dateOfBirth, '1999-01-02')
    assert.equal(proceedOf('birth', born), true)
    assert.equal(proceedOf('birth', interact(base, { dateOfBirth: '2015-01-01' })), false)
  }
)

await check(
  'C8 explicit confirm of the suggested number: unanswered before, answered after (same number)',
  () => {
    const base = onboarding.initialAnswers(blankState)
    assert.equal(onboarding.basicsPayload('weight', base), null, 'before confirming')
    assert.equal(proceedOf('weight', base), false, 'Next disabled before confirming')
    const confirmed = interact(base, { weightKg: base.weightKg })
    assert.equal(onboarding.basicsPayload('weight', confirmed)?.weightKg, base.weightKg)
    assert.equal(proceedOf('weight', confirmed), true)
  }
)

await check('C8 changing only the unit does NOT answer height / weight', () => {
  const imperial = interact(onboarding.initialAnswers(blankState), { unit: 'Imperial' })
  assert.equal(onboarding.basicsPayload('height', imperial), null)
  assert.equal(onboarding.basicsPayload('weight', imperial), null)
  assert.equal(proceedOf('height', imperial), false)
})

await check(
  'C8 values already saved on the server stay answered and are resent unchanged (returning users)',
  () => {
    const answers = onboarding.initialAnswers(savedState)
    assert.equal(onboarding.basicsPayload('height', answers)?.heightCm, 181)
    assert.equal(onboarding.basicsPayload('weight', answers)?.weightKg, 82.5)
    assert.equal(onboarding.basicsPayload('birth', answers)?.dateOfBirth, '1990-03-04')
    assert.equal(proceedOf('height', answers), true)
    assert.equal(proceedOf('weight', answers), true)
    assert.equal(proceedOf('birth', answers), true)
  }
)

// ── C8: Profile (đường THẬT: zodResolver + schema, như react-hook-form gọi) ──────────────────────────────────────────────────

const schemaFor = profileSchema.profileSchemaFor ?? (() => profileSchema.updateProfileSchema)
const resolveProfile = (known, values) =>
  zodResolver(schemaFor(known))(values, undefined, {
    fields: {},
    shouldUseNativeValidation: false,
    criteriaMode: 'firstError',
  })
const formValues = {
  firstName: 'An',
  lastName: 'Nguyen',
  dateOfBirth: '',
  gender: 'Male',
  heightCm: undefined,
  activityLevel: 'LightlyActive',
  unitPreference: 'Metric',
  energyUnit: 'Kcal',
  weekStartDay: 'Monday',
  timeZone: '',
}
const none = { dateOfBirth: false, heightCm: false }
const has = { dateOfBirth: true, heightCm: true }

await check(
  'C8 profile (resolver): a user who never had height / DOB can save any other field',
  async () => {
    const { errors } = await resolveProfile(none, formValues)
    assert.deepEqual(Object.keys(errors), [], `unexpected errors: ${Object.keys(errors)}`)
  }
)
await check(
  'C8 profile (resolver): clearing an EXISTING date of birth is an error, not a silent no-op',
  async () => {
    const { errors } = await resolveProfile(has, { ...formValues, heightCm: 176, dateOfBirth: '' })
    assert.ok(errors.dateOfBirth, 'dateOfBirth error expected')
  }
)
await check('C8 profile (resolver): clearing an EXISTING height is an error', async () => {
  const { errors } = await resolveProfile(has, {
    ...formValues,
    dateOfBirth: '1990-01-01',
    heightCm: undefined,
  })
  assert.ok(errors.heightCm, 'heightCm error expected')
})
await check(
  'C8 profile (resolver): given values keep their range checks and valid data passes',
  async () => {
    const low = await resolveProfile(none, { ...formValues, heightCm: 49 })
    const high = await resolveProfile(none, { ...formValues, heightCm: 301 })
    assert.ok(low.errors.heightCm && high.errors.heightCm, 'range errors expected')
    const ok = await resolveProfile(has, {
      ...formValues,
      heightCm: 176,
      dateOfBirth: '1990-01-01',
    })
    assert.deepEqual(Object.keys(ok.errors), [])
  }
)
await check(
  'C8 profile: an empty height input yields undefined, never NaN (what RHF writes on mount)',
  async () => {
    const parse = need(profile, 'optionalNumberValue')
    assert.equal(parse(''), undefined)
    assert.equal(parse(null), undefined)
    assert.equal(parse('abc'), undefined)
    assert.equal(parse('176'), 176)
    assert.equal(parse(176.5), 176.5)
    const { errors } = await resolveProfile(none, { ...formValues, heightCm: parse('') })
    assert.deepEqual(Object.keys(errors), [])
  }
)
await check(
  'C8 profile: only dirty fields are sent; unknown height / DOB / gender / activity are never invented',
  () => {
    const build = need(profile, 'profileUpdatePayload')
    assert.deepEqual(build(formValues, {}), {})
    assert.deepEqual(build(formValues, { firstName: true }), { firstName: 'An' })
    const payload = build(formValues, { firstName: true, lastName: true })
    for (const key of ['heightCm', 'dateOfBirth', 'gender', 'activityLevel'])
      assert.ok(!(key in payload), `${key} must not be sent`)
  }
)
await check('C8 profile: a dirty but empty / NaN value is omitted, a real one is sent', () => {
  const build = need(profile, 'profileUpdatePayload')
  assert.deepEqual(build({ ...formValues, heightCm: Number.NaN }, { heightCm: true }), {})
  assert.deepEqual(build({ ...formValues, dateOfBirth: '' }, { dateOfBirth: true }), {})
  assert.deepEqual(build({ ...formValues, heightCm: 176 }, { heightCm: true }), { heightCm: 176 })
  assert.deepEqual(build({ ...formValues, gender: 'Female' }, { gender: true }), {
    gender: 'Female',
  })
})
await check(
  'C8 profile: an empty time zone is sent as null (BE keeps the old zone today — it does NOT clear it)',
  () => {
    const build = need(profile, 'profileUpdatePayload')
    assert.deepEqual(build({ ...formValues, timeZone: '' }, { timeZone: true }), { timeZone: null })
    assert.deepEqual(build({ ...formValues, timeZone: 'Asia/Ho_Chi_Minh' }, { timeZone: true }), {
      timeZone: 'Asia/Ho_Chi_Minh',
    })
  }
)

// ── H14: Set TDEE sheet ────────────────────────────────────────────────────────────────────────────────────────────────────────

await check(
  'H14 the sheet opens at the current BE estimate (rounded) or EMPTY — never a default like 2000',
  () => {
    const initial = need(tdee, 'tdeeInitialValue')
    assert.equal(initial(2431.6), '2432')
    assert.equal(initial(null), '')
    assert.equal(initial(undefined), '')
    assert.equal(initial(0), '')
    assert.equal(initial(Number.NaN), '')
  }
)
await check(
  'H14 the field shows what the user typed (even cleared), else the estimate — so a late estimate never wipes typing',
  () => {
    const value = need(tdee, 'tdeeSheetValue')
    assert.equal(value(null, 2431), '2431', 'untouched → estimate')
    assert.equal(value(null, null), '', 'untouched, no estimate → empty')
    assert.equal(value('2500', 2431), '2500', 'typed number is kept when the estimate arrives')
    assert.equal(value('', 2431), '', 'a cleared field stays cleared')
  }
)
await check(
  'H14 no stale number: the estimate is trusted only after the query finished without error',
  () => {
    const estimateOf = need(tdee, 'tdeeEstimateOf')
    const data = { currentKcal: 2431 }
    assert.deepEqual(estimateOf({ data, isError: false, isFetching: false }), {
      status: 'ready',
      kcal: 2431,
    })
    assert.deepEqual(estimateOf({ data, isError: false, isFetching: true }), {
      status: 'loading',
      kcal: null,
    })
    assert.deepEqual(estimateOf({ data: undefined, isError: false, isFetching: true }), {
      status: 'loading',
      kcal: null,
    })
    assert.deepEqual(estimateOf({ data, isError: true, isFetching: false }), {
      status: 'error',
      kcal: null,
    })
    assert.deepEqual(
      estimateOf({ data: { currentKcal: null }, isError: false, isFetching: false }),
      {
        status: 'ready',
        kcal: null,
      }
    )
  }
)
await check('H14 loading / error / no-estimate / ready read differently to the user', () => {
  const hint = need(tdee, 'tdeeEstimateHint')
  const texts = [
    hint({ status: 'loading', kcal: null }),
    hint({ status: 'error', kcal: null }),
    hint({ status: 'ready', kcal: null }),
    hint({ status: 'ready', kcal: 2431 }),
  ]
  assert.equal(new Set(texts).size, 4, texts.join(' | '))
  assert.match(texts[1], /could not read/i)
  assert.match(texts[2], /no estimate/i)
  assert.match(texts[3], /2431/)
})
await check(
  'H14 Save needs a WHOLE number in the BE bounds 1000–6000; empty shows the bounds as the reason',
  () => {
    const error = need(tdee, 'tdeeError')
    assert.equal(tdee.TDEE_MIN_KCAL, 1000)
    assert.equal(tdee.TDEE_MAX_KCAL, 6000)
    for (const bad of ['', '   ', '999', '6001', 'abc', '2431.5', '1e3x'])
      assert.ok(error(bad), `"${bad}" must be invalid`)
    for (const good of ['1000', '6000', '2431'])
      assert.equal(error(good), undefined, `"${good}" must be valid`)
    assert.equal(error(''), tdee.TDEE_BOUNDS_HINT)
  }
)

// ── H15: Manual starting numbers (hàm cũ: defaultManualDay / dayTargetsOf) ────────────────────────────────────────────────────

const setup = {
  weightKg: 80,
  estimatedTdeeKcal: 2431,
  floors: { standardKcal: 1500, lowKcal: 1200 },
  kcalMax: 5000,
  proteinPerKgMax: 4,
  defaults: [
    { dayOfWeek: 'Monday', calories: 2431, proteinG: 150, carbsG: 255, fatG: 75 },
    { dayOfWeek: 'Tuesday', calories: 2431, proteinG: 150, carbsG: 255, fatG: 75 },
  ],
  goal: null,
  checkInWeekday: 'Monday',
}
const manualChoices = (manualDays) => ({
  programType: 'Manual',
  dietStyle: null,
  floor: null,
  trainingType: null,
  distribution: null,
  shiftDays: [],
  shiftPercent: 10,
  proteinLevel: null,
  days: null,
  manualDays,
})
// Đúng như bước "same-different" của wizard: lấy số khởi điểm rồi đặt cho cả tuần
const startManual = (setupData) => {
  const base = programRequest.defaultManualDay(setupData)
  return base ? [base] : null
}

await check('H15 Manual starting day comes ONLY from the BE setup defaults', () => {
  assert.deepEqual(programRequest.defaultManualDay(setup), {
    kcal: 2431,
    proteinG: 150,
    carbsG: 255,
    fatG: 75,
  })
})
await check(
  'H15 without BE defaults nothing is fabricated (no 2000 kcal / 75 kg × 1.8 g / 25% fat)',
  () => {
    for (const missing of [
      undefined,
      null,
      { ...setup, defaults: [] },
      { ...setup, defaults: undefined },
    ]) {
      const day = programRequest.defaultManualDay(missing)
      assert.equal(day, null, JSON.stringify(day))
    }
  }
)
await check(
  'H15 a Manual program started without BE defaults produces NO day targets (nothing invented reaches the request)',
  () => {
    const choices = manualChoices(startManual({ ...setup, defaults: [] }))
    assert.equal(choices.manualDays, null, 'wizard must not get starting days')
    assert.equal(programRequest.dayTargetsOf(choices, { ...setup, defaults: [] }), null)
    const withBe = manualChoices(startManual(setup))
    const targets = programRequest.dayTargetsOf(withBe, setup)
    assert.equal(targets?.length, 7)
    assert.ok(
      targets.every((day) => day.calories === 2431 && day.proteinG === 150 && day.fatG === 75)
    )
  }
)

// ── [wiring] các hàm thuần phải được NỐI vào màn hình (không chạy React được ở đây nên đọc mã nguồn) ──────────────────────────

await check(
  '[wiring] onboarding hook routes every answer through applyAnswers and saves via basicsPayload',
  () => {
    const hook = source('features/onboarding/hooks/use-onboarding-wizard.ts')
    assert.match(hook, /setAnswers\(\(current\) => applyAnswers\(current, partial\)\)/)
    assert.match(hook, /basicsPayload\(stepId, answers\)/)
  }
)
await check(
  '[wiring] each Basics wheel has the "Use this value" confirm and moves focus to Next',
  () => {
    const basics = source('features/onboarding/components/OnboardingPage/BasicsSteps.tsx')
    assert.equal((basics.match(/<SuggestionNote/g) ?? []).length, 3, 'birth + height + weight')
    const note = source('features/onboarding/components/OnboardingPage/SuggestionNote.tsx')
    assert.match(note, /Use this value/)
    assert.match(note, /focusWizardNext\(\)/)
    assert.match(
      source('features/onboarding/components/OnboardingPage/WizardShell.tsx'),
      /data-wizard-next/
    )
  }
)
await check(
  '[wiring] ProfilePage submits only dirty fields, never seeds 170 and uses the data-aware resolver',
  () => {
    const page = source('features/users/pages/ProfilePage.tsx')
    assert.match(page, /profileUpdatePayload\(values, form\.formState\.dirtyFields\)/)
    assert.match(page, /profileSchemaFor\(/)
    assert.ok(!/\b170\b/.test(page), 'the 170 placeholder must be gone')
    const form = source('features/users/components/ProfilePage/ProfileForm.tsx')
    assert.match(form, /setValueAs: optionalNumberValue/)
    assert.ok(!/valueAsNumber/.test(form), 'valueAsNumber writes NaN for an empty input')
  }
)
await check(
  '[wiring] Set TDEE sheet: no 2000 fallback, value from tdeeSheetValue, estimate fetched only while the sheet is open',
  () => {
    const actions = source('features/program/components/ProgramPage/ProgramActions.tsx')
    assert.ok(!/\?\?\s*2000/.test(actions), 'the 2000 fallback must be gone')
    assert.match(actions, /tdeeSheetValue\(typed, estimate\.kcal\)/)
    assert.match(actions, /key=\{session\}/, 'the form must not remount when the estimate arrives')
    const page = source('features/program/pages/ProgramPage.tsx')
    assert.match(page, /useExpenditureInsights\(open === 'tdee'\)/)
    assert.match(page, /tdeeEstimateOf\(expenditure\)/)
  }
)
await check(
  '[wiring] setting a manual TDEE invalidates the expenditure queries so reopening shows the new estimate',
  () => {
    const hooks = source('features/program/hooks/use-program.ts')
    // Hoặc hook tự liệt kê key, hoặc đi qua `invalidateTargetData` (danh sách dùng chung, đã gồm ['expenditure'])
    const direct = /setManualExpenditure\(tdeeKcal\)[\s\S]{0,200}\['expenditure'\]/.test(hooks)
    const shared =
      /setManualExpenditure\(tdeeKcal\)/.test(hooks) &&
      /const useProgramMutation[\s\S]{0,500}invalidateTargetData\(queryClient\)/.test(hooks) &&
      /LOG_DERIVED_KEYS = \[[\s\S]*?\['expenditure'\]/.test(
        source('features/food-log/hooks/use-food-log.ts')
      )
    assert.ok(direct || shared, 'manual TDEE does not refresh the expenditure queries')
  }
)
await check(
  '[wiring] Manual same-different step needs the BE setup, retries on failure and never continues without defaults',
  () => {
    const page = source('features/program/pages/NewProgramStepPage.tsx')
    assert.match(page, /step === 'same-different'/)
    assert.match(page, /manualBase === null/)
    assert.match(page, /setup\.refetch\(\)/)
    assert.ok(!/\?\?\s*2000/.test(source('features/program/utils/program-request.ts')))
  }
)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
