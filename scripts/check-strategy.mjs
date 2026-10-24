// Kiểm tra Strategy audit (FE đi theo hợp đồng BE sẵn có, không đổi nghiệp vụ):
//   S1  đổi program / goal / check-in → MỌI số theo target được làm mới bằng MỘT hàm (`invalidateTargetData`)
//   S2  thẻ Program chỉ vẽ `days` BE trả, không dựng bảy ngày từ mục tiêu tuần
//   S3  Nutrition Overview không có số dự phòng: lỗi → màn lỗi + Thử lại, `null` giữ là "chưa có dữ liệu"
//   S4  Edit Goal trên Manual: ngân sách null hiện "—" / bị ẩn, không "0 kcal", không nói MacroOS cập nhật kế hoạch hằng tuần
//   S5  Review: chữ riêng cho Coached / Collaborative / Manual từ số thật của preview (weeklyBudgetKcal, macroKcalAverage),
//       Done chỉ mở sau khi cuộn tới cuối
//   S7  tiêu đề route Strategy
//   S8  nhãn / tiêu đề ngắn khớp ảnh MacroFactor (Get_Started/Program 1–8, Goal 1–6); chữ giải thích dài vẫn là của ta
//   S9  điện thoại 320px: thẻ Goal không bị cắt ở mép phải (ba số xuống hàng, hai nhãn tốc độ khác nhau), số trong biểu đồ bảy ngày
//       ("2861", "175 P", "326 C", kJ năm chữ số) nằm gọn MỘT dòng trong ô
// Chạy: node --import ./scripts/register-ts.mjs scripts/check-strategy.mjs   (hoặc `pnpm run check:strategy`)
//
// Thiết kế để FAIL trên bản cũ (HEAD) đúng lý do (hàm mới chưa có, hành vi cũ sai, nhãn cũ). Component .tsx không chạy được trong Node nên
// phần "wiring" đọc mã nguồn để chắc các hàm thuần được NỐI vào màn hình. Mỗi check chạy độc lập: in lỗi rồi tiếp tục; có lỗi thì thoát mã 1.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const load = (specifier) => import(specifier).catch((error) => ({ error }))
const foodLog = await load('../src/features/food-log/hooks/use-food-log.ts')
const overview = await load('../src/features/food-log/nutrition-overview.utils.ts')
const review = await load('../src/features/program/utils/review-copy.ts')
const onboardingTypes = await load('../src/features/onboarding/types/onboarding.types.ts')
const steps = await load('../src/features/onboarding/onboarding-steps.utils.ts')
const dayMacros = await load('../src/features/program/utils/day-macros.ts')
const chartFit = await load('../src/features/program/components/ProgramPage/chart-fit.ts')

const source = (file) => readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
const need = (module, name) => {
  assert.ok(!module.error, `module failed to load: ${String(module.error?.message).split('\n')[0]}`)
  assert.equal(typeof module[name], 'function', `${name} is not exported`)
  return module[name]
}
/** Phần mã của một khai báo `export const NAME ... ]` (mảng) hoặc `... } as const` (đối tượng) trong file. */
const blockOf = (text, name) => {
  const start = text.indexOf(`export const ${name}`)
  assert.ok(start >= 0, `${name} is not declared`)
  const ends = [text.indexOf('\n]\n', start), text.indexOf('\n} as const', start)].filter(
    (index) => index > start
  )
  return text.slice(start, Math.min(...ends))
}
const labelOf = (block, value) =>
  new RegExp(`value:\\s*'${value}',\\s*label:\\s*'([^']+)'`).exec(block)?.[1]

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

// ── S1: một hàm làm mới mọi số theo target ──────────────────────────────────────────────────────────────────────────────────────

const recorder = () => {
  const keys = []
  return {
    keys,
    client: {
      invalidateQueries: ({ queryKey }) => {
        keys.push(JSON.stringify(queryKey))
        return Promise.resolve()
      },
      // refreshDerivedStatus huỷ lần đọc status đang bay trước khi đọc lại
      cancelQueries: () => Promise.resolve(),
      // …và đánh dấu Ready cũ là chưa xác nhận
      setQueryData: () => undefined,
    },
  }
}
const LOG_KEYS = ['food-log', 'nutrients', 'nutrition-overview', 'expenditure', 'energy-balance']
const TARGET_KEYS = ['program', 'goals', 'check-in']

await check(
  'S1 invalidateTargetData refreshes program, goals, check-in AND every log-derived number',
  () => {
    const { keys, client } = recorder()
    need(foodLog, 'invalidateTargetData')(client)
    for (const key of [...LOG_KEYS, ...TARGET_KEYS])
      assert.ok(keys.includes(JSON.stringify([key])), `${key} is not invalidated`)
  }
)
await check('S1 a food-log change still leaves program / goals / check-in alone', () => {
  const { keys, client } = recorder()
  need(foodLog, 'invalidateLogData')(client)
  for (const key of LOG_KEYS) assert.ok(keys.includes(JSON.stringify([key])), `${key} missing`)
  for (const key of TARGET_KEYS)
    assert.ok(!keys.includes(JSON.stringify([key])), `${key} invalidated by a log change`)
})

const MUTATION_HOOKS = [
  'features/program/hooks/use-program.ts',
  'features/program/hooks/use-goal-edit.ts',
  'features/program/hooks/use-check-in.ts',
  'features/onboarding/hooks/use-onboarding.ts',
]
await check(
  'S1 program / goal / check-in / onboarding-create mutations all use invalidateTargetData',
  () => {
    for (const file of MUTATION_HOOKS)
      assert.ok(/invalidateTargetData\(/.test(source(file)), `${file} does not call it`)
  }
)
await check('S1 no mutation keeps its own hand-written list of target query keys', () => {
  for (const file of MUTATION_HOOKS)
    assert.ok(
      !/invalidateQueries\(\{\s*queryKey:\s*(programKeys\.current|\['(goals|check-in|program)'\])/.test(
        source(file)
      ),
      `${file} invalidates target keys by hand`
    )
})
await check(
  'S1 saving "incomplete days" refreshes every log-derived number (day logs, nutrients, overview, expenditure, energy balance)',
  () => {
    const text = source('features/program/hooks/use-check-in.ts')
    const hook = text.slice(
      text.indexOf('export const useSetIncompleteDays'),
      text.indexOf('export const useSetCheckInModules')
    )
    assert.ok(hook.includes('export const useSetIncompleteDays'), 'useSetIncompleteDays not found')
    assert.match(hook, /invalidateLogData\(queryClient\)/)
  }
)

// ── S2: thẻ Program không bịa bảy ngày ──────────────────────────────────────────────────────────────────────────────────────

const programCard = source('features/program/components/ProgramPage/ProgramCard.tsx')
await check(
  'S2 ProgramCard draws only the days BE returns (never 7 copies of the week target)',
  () => {
    assert.ok(!/currentWeek/.test(programCard), 'ProgramCard still reads currentWeek')
    assert.ok(!/Array\.from\(\{\s*length:\s*7/.test(programCard), 'ProgramCard still builds 7 days')
    assert.ok(/days\?\.length === 7/.test(programCard), 'ProgramCard does not require the BE days')
  }
)
await check('S2 the empty state is generic, not a Manual-only claim', () => {
  assert.ok(programCard.includes('There are no daily targets to show for this week yet.'))
  assert.ok(!/Manual program: you set your own targets/.test(programCard))
})
await check('S2 Program.days is typed nullable (BE: null when there is no current week)', () => {
  assert.ok(/days\?: DayTarget\[\] \| null/.test(source('features/program/types/program.types.ts')))
})

// ── S3: Nutrition Overview không có số dự phòng ────────────────────────────────────────────────────────────────────────────

await check('S3 the overview fallback (targets guessed from the program) is gone', () => {
  const utils = source('features/food-log/nutrition-overview.utils.ts')
  assert.ok(!/overviewFallback|topContributors/.test(utils), 'helpers still in utils')
  const hook = source('features/food-log/hooks/use-nutrition-overview.ts')
  assert.ok(!/overviewFallback|topContributors|programGoals|useCurrentProgram/.test(hook))
})
await check('S3 an item with no data keeps value null and its goal exactly as BE sent it', () => {
  const rows = need(
    overview,
    'overviewFromItems'
  )([
    { key: 'zinc', value: null, target: 11, floor: 8, ceiling: 40, goalKind: 'Range', unit: 'mg' },
    {
      key: 'protein',
      value: 0,
      target: 150,
      floor: null,
      ceiling: null,
      goalKind: 'Target',
      unit: 'g',
    },
  ])
  assert.equal(rows.zinc.value, null)
  assert.deepEqual(rows.zinc.goal, { floor: 8, target: 11, ceiling: 40, goalKind: 'Range' })
  assert.equal(rows.protein.value, 0)
})
await check(
  'S3 a failed overview shows the error state with Try again (no silent substitute)',
  () => {
    const page = source('features/food-log/pages/NutritionOverviewPage.tsx')
    assert.ok(/data\.isError/.test(page) && /ErrorState/.test(page) && /refetch\(\)/.test(page))
  }
)
await check('S3 NutritionOverviewItem has no optional fields: BE always sends all of them', () => {
  const block = /interface NutritionOverviewItem \{([\s\S]*?)\n\}/.exec(
    source('features/food-log/types/food-log.types.ts')
  )?.[1]
  assert.ok(block, 'interface not found')
  assert.ok(!/\?:/.test(block), 'a field is still optional')
  assert.ok(/value: number \| null/.test(block), 'value must be number | null')
})

// ── S4: Edit Goal trên program Manual ───────────────────────────────────────────────────────────────────────────────────────

const goalEdit = source('features/program/pages/GoalEditStepPage.tsx')
const goalTarget = source('features/onboarding/components/OnboardingPage/GoalTargetStep.tsx')
const goalSummary = source('features/onboarding/components/OnboardingPage/GoalSummaryStep.tsx')
await check('S4 a null starting budget is never turned into 0 kcal', () => {
  assert.ok(!/initialDailyBudgetKcal\s*\?\?\s*0/.test(goalEdit), 'still `?? 0`')
  assert.ok(/budgetKcal:\s*preview\.initialDailyBudgetKcal/.test(goalEdit))
  assert.ok(/budgetKcal === null\s*\?\s*'—'/.test(goalTarget), 'GoalTargetStep has no "—"')
  assert.ok(/budgetKcal === null\s*\?\s*'—'/.test(goalSummary), 'GoalSummaryStep has no "—"')
})
await check(
  'S4 both Edit Goal steps receive BE isManualProgram and hide the budget on Manual',
  () => {
    assert.equal(goalEdit.match(/manual=\{data\.isManualProgram\}/g)?.length, 2)
    assert.ok(/\{!manual && \(/.test(goalTarget), 'GoalTargetStep still shows the budget tile')
    assert.ok(/\{!manual && \(/.test(goalSummary), 'GoalSummaryStep still shows the budget card')
  }
)
await check('S4 the weekly-check-in budget claim is not shown for Manual', () => {
  const claim = goalSummary.indexOf('at each weekly check-in, MacroOS updates your plan')
  assert.ok(claim > 0, 'claim text moved')
  const guard = goalSummary.lastIndexOf('{!manual && (', claim)
  assert.ok(
    guard > 0 && !goalSummary.slice(guard, claim).includes('</SummaryCard>'),
    'the claim is not inside the !manual card'
  )
  assert.ok(/won&apos;t\s+adjust\s+them/.test(goalSummary), 'no Manual wording for the goal rate')
})

// ── S5: Review theo kiểu program ────────────────────────────────────────────────────────────────────────────────────────────

const PREVIEW = {
  days: [],
  averageCalories: 2257,
  weeklyBudgetKcal: 15801,
  averageProteinG: 143,
  averageCarbsG: 238.4,
  averageFatG: 82.7,
  macroKcalAverage: 2301,
  estimatedTdeeKcal: 2430,
  weeklyChangeKg: -0.4,
  weeklyChangePercent: -0.5,
  projectedEndDate: null,
  warnings: [],
}
const INPUT = {
  preview: PREVIEW,
  weightKg: 79.44,
  goalType: 'WeightLoss',
  ratePercent: 0.5,
  proteinLabel: 'Moderate',
  dietLabel: 'Low-fat',
  hasLockedDays: false,
}
// `energy` (đơn vị của user) là bắt buộc, không có mặc định kcal ngầm: các check này nói chuyện bằng kcal
const unitsModule = await load('../src/lib/units.ts')
const KCAL = unitsModule.error ? null : unitsModule.energyMeasure('kcal')
const copyOf = (programType, extra = {}) =>
  need(review, 'reviewCopyOf')(
    need(review, 'reviewFactsOf')({ ...INPUT, programType, ...extra }),
    KCAL
  )
const allText = (copy) =>
  `${copy.details.map((detail) => `${detail.title} ${detail.value} ${detail.text}`).join(' ')} ${copy.next}`

await check("S5 Coached: goal rate, protein and diet sentences use the user's own choices", () => {
  const copy = copyOf('Coached')
  assert.deepEqual(
    copy.details.map((detail) => detail.title),
    ['Estimated Expenditure', 'Average Target', 'Target Protein', 'Diet Type']
  )
  assert.ok(copy.details[0].value === '2430 kcal' && copy.details[1].value === '2257 kcal')
  assert.ok(copy.details[1].text.includes('lose 0.50% of your body weight per week'))
  assert.equal(copy.details[2].value, '1.80 g/kg')
  assert.ok(copy.details[2].text.includes('moderate') && copy.details[3].value === 'Low-fat')
})
await check('S5 Coached maintenance says maintain, not a rate', () => {
  const copy = copyOf('Coached', { goalType: 'Maintenance', ratePercent: 0 })
  assert.ok(copy.details[1].text.includes('maintain your weight'))
  assert.ok(!/per week/.test(copy.details[1].text))
})
await check(
  'S5 Collaborative: no invented goal rate / protein level / diet; shows the weekly budget',
  () => {
    const copy = copyOf('Collaborative')
    assert.deepEqual(
      copy.details.map((detail) => detail.title),
      ['Estimated Expenditure', 'Average Target', 'Calorie Budget', 'Average Macros']
    )
    assert.ok(
      !/You want to|g\/kg|moderate|Low-fat|diet style/i.test(allText(copy)),
      'invents a Coached fact'
    )
    assert.equal(copy.details[2].value, '15801 kcal / week')
    assert.equal(copy.details[3].value, '143 P · 83 F · 238 C')
    assert.ok(/deficit of about 0\.50%/.test(copy.details[1].text), copy.details[1].text)
  }
)
await check('S5 Collaborative mentions locked days only when some day is locked', () => {
  assert.ok(!/locked/.test(allText(copyOf('Collaborative'))))
  assert.ok(/locked/.test(allText(copyOf('Collaborative', { hasLockedDays: true }))))
})
await check(
  'S5 Manual: Set Calorie Budget, Average Macro Calorie Content and no automatic weekly update',
  () => {
    const copy = copyOf('Manual')
    assert.deepEqual(
      copy.details.map((detail) => detail.title),
      [
        'Estimated Expenditure',
        'Average Target',
        'Set Calorie Budget',
        'Average Macro Calorie Content',
      ]
    )
    assert.equal(copy.details[2].value, '15801 kcal / week')
    assert.equal(copy.details[3].value, '2301 kcal')
    assert.ok(/won't update automatically/.test(copy.next) && /edit your program/.test(copy.next))
    assert.ok(!/You want to|g\/kg|diet style/i.test(allText(copy)))
  }
)
await check('S5 the implied weekly change is worded by its sign and ~0 reads as stable', () => {
  const collab = (weeklyChangePercent) =>
    allText(copyOf('Collaborative', { preview: { ...PREVIEW, weeklyChangePercent } }))
  assert.ok(/surplus of about 0\.30%/.test(collab(0.3)))
  assert.ok(/deficit of about 0\.30%/.test(collab(-0.3)))
  assert.ok(/roughly stable/.test(collab(0.01)))
})
await check(
  'S5 reviewFactsOf takes weeklyBudgetKcal / macroKcalAverage from the preview and guards weight 0',
  () => {
    const facts = need(review, 'reviewFactsOf')
    assert.equal(facts({ ...INPUT, programType: 'Manual' }).macroKcalAverage, 2301)
    assert.equal(facts({ ...INPUT, programType: 'Collaborative' }).weeklyBudgetKcal, 15801)
    assert.equal(facts({ ...INPUT, programType: 'Coached', weightKg: 0 }).proteinGPerKg, 0)
    assert.ok(
      Math.abs(facts({ ...INPUT, programType: 'Coached' }).proteinGPerKg - 143 / 79.44) < 1e-9
    )
  }
)
await check(
  'S5 onboarding Done stays locked until the end was reached AND a preview exists',
  () => {
    const canProceed = need(steps, 'canProceed')
    const base = { stepId: 'ready', answers: {}, today: '2026-10-21' }
    assert.equal(canProceed({ ...base, preview: {}, readyReached: false }), false)
    assert.equal(canProceed({ ...base, preview: undefined, readyReached: true }), false)
    assert.equal(canProceed({ ...base, preview: {}, readyReached: true }), true)
  }
)

const readyStep = source('features/onboarding/components/OnboardingPage/ProgramReadyStep.tsx')
const newProgram = source('features/program/pages/NewProgramStepPage.tsx')
const programSteps = source('features/onboarding/components/OnboardingPage/ProgramSteps.tsx')
const wizardHook = source('features/onboarding/hooks/use-onboarding-wizard.ts')
await check(
  'S5 [wiring] New Program Done opens only after scrolling to the end of THIS preview',
  () => {
    assert.ok(
      !/onReachedEnd=\{\(\) => undefined\}/.test(newProgram),
      'onReachedEnd is still a no-op'
    )
    assert.ok(/onReachedEnd=\{markReviewed\}/.test(newProgram))
    assert.ok(/reviewed === preview\.data/.test(newProgram), 'canNext ignores the scroll state')
  }
)
await check(
  'S5 [wiring] both wizards build the Review text with reviewCopyOf (no style-agnostic copy)',
  () => {
    assert.ok(/reviewCopyOf\(/.test(newProgram) && /reviewFactsOf\(/.test(newProgram))
    assert.ok(/reviewCopyOf\(/.test(programSteps) && /programType: 'Coached'/.test(programSteps))
    assert.ok(
      !/proteinLabel|dietLabel|goalType=/.test(readyStep),
      'ProgramReadyStep keeps Coached-only props'
    )
    assert.ok(
      /IntersectionObserver/.test(readyStep) && /How was your program designed\?/.test(readyStep)
    )
    assert.ok(
      !/What&apos;s next\?/.test(newProgram),
      'the separate Manual "What\'s next?" block is back'
    )
  }
)
await check(
  'S5 [wiring] onboarding must scroll to the end again each time the Review is entered',
  () => {
    assert.ok(
      /onReadyReached = useCallback\(/.test(wizardHook),
      'unstable callback re-subscribes the observer'
    )
    assert.ok(/setReadyReached\(false\)/.test(wizardHook), 'readyReached is never reset')
  }
)

// ── S7 / S8: tiêu đề và nhãn ngắn khớp ảnh MacroFactor ──────────────────────────────────────────────────────────────────────

await check('S7 the Strategy route and its sidebar entry are called Strategy', () => {
  assert.ok(/title: 'Strategy'/.test(source('app/(protected)/program/page.tsx')))
  assert.ok(
    /label: 'Strategy', href: routePath\.program/.test(source('components/shared/AppSidebar.tsx'))
  )
  assert.ok(/title: 'Set New Program'/.test(source('app/(protected)/program/new/[step]/page.tsx')))
})

const options = source('features/onboarding/types/onboarding-options.types.ts')
await check('S8 goal / diet / training / distribution / protein labels match MacroFactor', () => {
  const expectations = {
    GOAL_OPTIONS: {
      WeightLoss: 'Lose Weight',
      Maintenance: 'Maintain Weight',
      WeightGain: 'Gain Weight',
    },
    DIET_OPTIONS: { Balanced: 'Balanced', LowFat: 'Low-fat', LowCarb: 'Low-carb', Keto: 'Keto' },
    TRAINING_OPTIONS: {
      None: 'None or Relaxed Activity',
      Lifting: 'Lifting',
      Cardio: 'Cardio',
      Both: 'Cardio & Lifting',
    },
    DISTRIBUTION_OPTIONS: { Even: 'Distribute Evenly', Custom: 'Shift Calorie Targets' },
    PROTEIN_OPTIONS: { Low: 'Low', Moderate: 'Moderate', High: 'High', ExtraHigh: 'Extra High' },
  }
  for (const [name, labels] of Object.entries(expectations)) {
    const block = blockOf(options, name)
    for (const [value, label] of Object.entries(labels))
      assert.equal(labelOf(block, value), label, `${name}.${value}`)
  }
})
await check('S8 the Program question titles and the two floor cards match MacroFactor', () => {
  const block = blockOf(options, 'PROGRAM_STEP_TITLE')
  const titles = {
    diet: 'What is your preferred diet?',
    floor: 'What Calorie floor do you prefer?',
    training: 'What training will you do during this program?',
    distribution: 'How would you like to distribute Calorie targets throughout the week?',
    protein: 'What is your preferred protein intake?',
  }
  for (const [key, title] of Object.entries(titles))
    assert.ok(block.includes(`${key}: '${title}'`), `${key} title`)
  assert.ok(options.includes("label: 'Standard Floor'") && options.includes("label: 'Low Floor'"))
})
await check(
  'S8 both wizards use the shared titles and floor cards (no second copy of the wording)',
  () => {
    for (const file of [newProgram, programSteps]) {
      assert.ok(
        /PROGRAM_STEP_TITLE\.diet/.test(file) && /PROGRAM_STEP_TITLE\.floor/.test(file),
        'titles'
      )
      assert.ok(
        /PROGRAM_STEP_TITLE\.training/.test(file) && /PROGRAM_STEP_TITLE\.protein/.test(file)
      )
      assert.ok(/floorOptionsOf\(/.test(file), 'floor cards')
    }
    const distribution = source(
      'features/onboarding/components/OnboardingPage/DistributionStep.tsx'
    )
    assert.ok(/PROGRAM_STEP_TITLE\.distribution/.test(distribution))
  }
)
await check('S8 section headers are "Set New Goal" / "Set New Program"', () => {
  assert.ok(!onboardingTypes.error, 'onboarding.types failed to load')
  assert.equal(onboardingTypes.SECTION_TITLE.goal, 'Set New Goal')
  assert.equal(onboardingTypes.SECTION_TITLE.program, 'Set New Program')
  assert.ok(/sectionTitle="Set New Program"/.test(newProgram))
})
await check(
  'S8 Goal screens: titles, live tiles, zone label and summary cards match MacroFactor',
  () => {
    for (const text of [
      'What is your target weight?',
      'What is your target goal rate?',
      'initial daily budget',
      'projected end date',
      'Standard (Recommended)',
    ])
      assert.ok(goalTarget.includes(text), `GoalTargetStep: ${text}`)
    for (const text of [
      'Goal Rate',
      'Initial Daily Budget',
      'Estimated End Date',
      'BW per week',
      'Weight Loss',
      'Weight Gain',
    ])
      assert.ok(goalSummary.includes(text), `GoalSummaryStep: ${text}`)
  }
)

// ── S9: điện thoại 320px ────────────────────────────────────────────────────────────────────────────────────────────────────────

await check(
  'S9 chart cell font shrinks with the column: "2861", "175 P", "326 C" and 5-digit kJ fit one line at 320px (a fixed 14px does not)',
  () => {
    const cellFontSize = need(chartFit, 'cellFontSize')
    assert.equal(
      dayMacros.cellFontSize,
      undefined,
      'the chart font maths belongs next to WeekMacroChart'
    )
    const MACRO = chartFit.MACRO_EXTRA_EM
    const KCAL = chartFit.KCAL_EXTRA_EM
    assert.ok(typeof MACRO === 'number' && typeof KCAL === 'number', 'extra widths are exported')
    // Cỡ chữ thật tại bề rộng cột `width` (px): min(14px, cqw × width)
    const px = (css, width) => {
      const [, cap, cqw] = /^min\(([\d.]+)rem, ([\d.]+)cqw\)$/.exec(css) ?? []
      assert.ok(cap, `unexpected css ${css}`)
      return Math.min(Number(cap) * 16, (Number(cqw) / 100) * width)
    }
    const COLUMN_320 = 31.4 // thẻ Program ở 320px: (256 − 6 × 6) / 7
    const DIGIT = 0.6
    const cells = [
      ['kcal 2861', 4, KCAL, 4 * DIGIT],
      ['kJ 11970', 5, KCAL, 5 * DIGIT],
      ['175 P', 3, MACRO, 3 * DIGIT + 0.95],
      ['326 C', 3, MACRO, 3 * DIGIT + 0.95],
      ['95 F', 2, MACRO, 2 * DIGIT + 0.95],
    ]
    for (const [name, digits, extra, textEm] of cells) {
      const font = px(cellFontSize(digits, extra), COLUMN_320)
      assert.ok(
        font * textEm <= COLUMN_320,
        `${name}: ${font.toFixed(1)}px × ${textEm}em > ${COLUMN_320}px`
      )
      assert.ok(font >= 8.5, `${name}: font ${font.toFixed(1)}px is unreadably small`)
    }
    assert.ok(
      14 * (3 * DIGIT + 0.95) > COLUMN_320,
      'sanity: a fixed 14px "326 C" really overflows a 320px column'
    )
    // Cột rộng (375px, máy tính) vẫn tối đa 14px
    assert.equal(px(cellFontSize(3, MACRO), 86), 14)
  }
)
await check(
  'S9 [wiring] WeekMacroChart: each column is a container, cells use cellFontSize on one line',
  () => {
    const chart = source('features/program/components/ProgramPage/WeekMacroChart.tsx')
    assert.match(chart, /className="@container /, 'column container')
    assert.equal((chart.match(/cellFontSize\(/g) ?? []).length, 2, 'kcal pill + macro block')
    assert.ok(!/text-sm/.test(chart), 'no fixed 14px text in the cells')
    assert.ok((chart.match(/whitespace-nowrap/g) ?? []).length >= 2, 'cells never wrap')
    assert.equal(
      (chart.match(/flex gap-1\.5/g) ?? []).length,
      2,
      'columns and day letters share the gap'
    )
  }
)
await check(
  'S9 [wiring] GoalCard: the three stats wrap instead of clipping, and the two rates have different labels',
  () => {
    const card = source('features/program/components/ProgramPage/GoalCard.tsx')
    assert.match(card, /className="@container mt-5"/)
    assert.match(card, /flex flex-wrap/)
    assert.match(card, /@max-\[19rem\]:basis-full/, 'Goal Weight gets its own row on narrow phones')
    const labels = [...card.matchAll(/label="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((label) => !/^(New|Edit) Goal$/.test(label))
    assert.deepEqual(labels, ['Goal Weight', 'Per Week', 'Goal Rate'])
  }
)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
