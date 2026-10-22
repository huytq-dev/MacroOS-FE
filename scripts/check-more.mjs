// Kiểm tra trang More + Expenditure Settings theo ảnh MacroFactor (Docs/MacroFactor_UI/UI/More): thứ tự nhóm/hàng, hàng chưa có BE không bấm được,
// không "Sign out"/"My Foods" thừa, Weight Trend không nối vào biểu đồ, nhãn lựa chọn đúng ảnh, chỉ lưu những gì BE dùng.
// Chạy: node --import ./scripts/register-ts.mjs scripts/check-more.mjs
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import * as more from '../src/features/more/more.config.ts'
import * as units from '../src/lib/units.ts'
import * as settings from '../src/features/more/expenditure-settings.config.ts'

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
const rows = () => [...more.BEFORE_THEME, ...more.AFTER_THEME].flatMap((section) => section.rows)
const row = (key) => rows().find((item) => item.key === key)

check(
  'M1 order: General, Feature Settings, (Theme), Data Management, Community & Support, Other',
  () => {
    assert.deepEqual(
      more.BEFORE_THEME.map((s) => s.title),
      ['General', 'Feature Settings']
    )
    assert.deepEqual(
      more.AFTER_THEME.map((s) => s.title),
      ['Data Management', 'Community & Support', 'Other']
    )
    assert.deepEqual(
      more.GENERAL.rows.map((r) => r.label),
      ['Account', 'Subscription', 'Integrations', 'Units', 'Language']
    )
    assert.deepEqual(
      more.FEATURE_SETTINGS.rows.map((r) => r.label),
      ['Dashboard', 'Food Log', 'Shortcuts', 'Expenditure', 'Weight Trend', 'Strategy']
    )
    assert.deepEqual(
      more.DATA_MANAGEMENT.rows.map((r) => r.label),
      ['Data Export', 'Data Visibility', 'Account & Data Deletion']
    )
    assert.deepEqual(
      more.COMMUNITY_SUPPORT.rows.map((r) => r.label),
      ['Knowledge Base', 'Roadmap', 'Support']
    )
    assert.deepEqual(
      more.OTHER.rows.map((r) => r.label),
      ['Legal', 'Tutorials', 'About']
    )
  }
)

check('M2 unavailable rows have no destination; ready rows always have one', () => {
  for (const item of rows()) {
    if (item.status === 'unavailable') assert.equal(item.href, null, `${item.label} must not link`)
    else assert.ok(item.href, `${item.label} is ready but has no href`)
  }
  assert.equal(more.UNAVAILABLE_TEXT, 'Not available yet')
})

check('M3 real features are ready; no-backend features are disabled', () => {
  for (const key of [
    'account',
    'units',
    'dashboard',
    'food-log',
    'shortcuts',
    'expenditure',
    'strategy',
    'tutorials',
  ])
    assert.equal(row(key)?.status, 'ready', key)
  for (const key of [
    'subscription',
    'integrations',
    'language',
    'weight-trend',
    'data-export',
    'data-visibility',
    'account-deletion',
    'knowledge-base',
    'roadmap',
    'support',
    'legal',
    'about',
  ])
    assert.equal(row(key)?.status, 'unavailable', key)
  assert.match(row('units').href, /\/profile#units$/)
  assert.match(row('food-log').href, /food-log\/settings$/)
})

check(
  'M4 Weight Trend is not linked to the chart; no Sign out / My Foods / Siri / App Icon rows',
  () => {
    assert.equal(row('weight-trend').href, null)
    const labels = rows().map((r) => r.label)
    for (const gone of ['Sign out', 'My Foods', 'Siri', 'App Icon'])
      assert.ok(!labels.includes(gone), gone)
  }
)

check(
  'M5 MorePage: disabled rows are not links, version is real, Theme sits between the groups',
  () => {
    const page = source('features/more/pages/MorePage.tsx')
    assert.match(page, /status === 'ready' && row\.href/)
    assert.match(page, /aria-disabled="true"/)
    assert.match(page, /pkg\.version/)
    assert.ok(!/Sign out|logout/i.test(page), 'sign out lives in Account')
    const before = page.indexOf('BEFORE_THEME.map')
    const theme = page.indexOf('aria-label="Theme"')
    const after = page.indexOf('AFTER_THEME.map')
    assert.ok(before < theme && theme < after, 'Theme between Feature Settings and Data Management')
  }
)

check('M6 Units anchor exists on the profile Display section', () => {
  assert.match(
    source('features/users/components/ProfilePage/ProfileForm.tsx'),
    /id="units" label="Display"/
  )
  assert.match(source('components/shared/ListGroup.tsx'), /<section id=\{id\}/)
})

check('M7 choice labels match the MacroFactor refs', () => {
  assert.deepEqual(
    settings.ACTIVITY_CHOICES.map((c) => `${c.label} — ${c.description}`),
    [
      'Mostly Sedentary — Commonly under 5,000 steps a day',
      'Moderately Active — Commonly 5,000 - 15,000 steps a day',
      'Very Active — Commonly more than 15,000 steps a day',
    ]
  )
  assert.deepEqual(
    settings.EXERCISE_CHOICES.map((c) => c.label),
    ['0 sessions / week', '1-3 sessions / week', '4-6 sessions / week', '7+ sessions / week']
  )
})

check(
  'M8 BMR page never calls Mifflin "MacroFactor Equation"; equation choice is read-only',
  () => {
    const mifflin = settings.BMR_EQUATIONS.find((e) => e.value === 'MifflinStJeor')
    assert.equal(mifflin.label, 'Mifflin-St Jeor Equation')
    assert.ok(!settings.BMR_EQUATIONS.some((e) => /MacroFactor/.test(e.label)))
    const page = source('features/more/pages/BmrEquationPage.tsx')
    assert.match(page, /role="radiogroup"[\s\S]*aria-disabled="true"/)
  }
)

check(
  'M9 only BE-backed settings can save: Activity/Exercise/Prior Progress via onboarding basics, Manual via program',
  () => {
    const bmr = source('features/more/pages/BmrEquationPage.tsx')
    assert.match(bmr, /useSaveBasics/)
    assert.match(bmr, /save\.mutateAsync\(\{ step: 0, \[variable\.field\]: value \}/)
    assert.match(bmr, /title="Athletic Pursuits"[\s\S]{0,120}disabled/)
    assert.match(bmr, /title="Prior Weight"[^>]*disabled/)
    const exp = source('features/more/pages/ExpenditureSettingsPage.tsx')
    assert.match(exp, /setManual\.mutateAsync\(kcal\)/)
    for (const title of ['Calculation Start Date', 'Calculation Mode'])
      assert.match(exp, new RegExp(`title="${title}"[\\s\\S]{0,260}disabled`), title)
    assert.match(exp, /SettingSwitchRow[\s\S]*?disabled\s*\/>/)
  }
)

check(
  'M10 save sheets: failed save keeps the sheet open, Save locked unless valid + changed + program exists',
  () => {
    const sheet = source('features/more/components/ManualTdeeSheet.tsx')
    assert.match(sheet, /canSave = hasProgram && !invalid && !unchanged && !pending/)
    assert.match(sheet, /catch \(caught\)[\s\S]*setError\(/)
    assert.ok(
      !/catch[\s\S]{0,80}onOpenChange\(false\)/.test(sheet),
      'error path must not close the sheet'
    )
    const choice = source('features/more/components/SettingChoiceSheet.tsx')
    assert.match(choice, /catch/)
  }
)

check('M11 routes exist for Expenditure and BMR', () => {
  assert.match(source('config/route-path.ts'), /moreExpenditure: '\/more\/expenditure'/)
  assert.match(source('config/route-path.ts'), /moreBmr: '\/more\/expenditure\/bmr'/)
  assert.match(source('app/(protected)/more/expenditure/page.tsx'), /ExpenditureSettingsPage/)
  assert.match(source('app/(protected)/more/expenditure/bmr/page.tsx'), /BmrEquationPage/)
})

check(
  'M12 Tutorials page lists EVERY tutorial flag in src and resets it to show (FE only, no BE)',
  () => {
    const tutorials = readFileSync(
      new URL('../src/features/more/tutorials.config.ts', import.meta.url),
      'utf8'
    )
    const listed = [...tutorials.matchAll(/key: '([a-z-]+\.tutorial)'/g)].map((m) => m[1]).sort()
    const used = new Set()
    const walk = (dir) => {
      for (const entry of readdirSync(new URL(dir, import.meta.url), { withFileTypes: true })) {
        const rel = `${dir}${entry.name}`
        if (entry.isDirectory()) walk(`${rel}/`)
        else if (/\.tsx?$/.test(entry.name))
          for (const m of readFileSync(new URL(rel, import.meta.url), 'utf8').matchAll(
            /usePersistedChoice\(\s*'([a-z-]+\.tutorial)'/g
          ))
            used.add(m[1])
      }
    }
    walk('../src/features/')
    assert.deepEqual(listed, [...used].sort())
    const page = source('features/more/pages/TutorialsPage.tsx')
    assert.match(page, /persistChoice\(entry\.key, 'show'\)/)
    assert.match(page, /TUTORIALS\.forEach/)
    assert.ok(!/apiCall|apiRoutes|fetch\(/.test(page), 'no BE call')
    assert.match(source('config/route-path.ts'), /moreTutorials: '\/more\/tutorials'/)
    assert.match(more.OTHER.rows.find((r) => r.key === 'tutorials').href, /\/more\/tutorials$/)
  }
)

check('M13 /profile#units scrolls into view once the profile form has mounted', () => {
  const form = source('features/users/components/ProfilePage/ProfileForm.tsx')
  assert.match(form, /location\.hash === '#units'/)
  assert.match(form, /getElementById\('units'\)\?\.scrollIntoView/)
})

check('M14 new BE contract wired to the exact routes/verbs (GET+PUT settings, POST mode)', () => {
  const routes = source('config/api-routes.ts')
  assert.match(routes, /settings: '\/expenditure\/settings'/)
  assert.match(routes, /mode: '\/expenditure\/mode'/)
  const service = source('features/more/services/expenditure-settings.service.ts')
  assert.match(service, /apiCall\.get<ExpenditureSettings>\(apiRoutes\.expenditure\.settings\)/)
  assert.match(
    service,
    /apiCall\.put<ExpenditureSettings>\(apiRoutes\.expenditure\.settings, payload\)/
  )
  assert.match(
    service,
    /apiCall\.post<ExpenditureSettings>\(apiRoutes\.expenditure\.mode, payload\)/
  )
  const types = source('features/more/types/expenditure-settings.types.ts')
  for (const word of [
    'Formula',
    'Manual',
    'MacroFactor',
    'Cunningham',
    'ExerciseRegularly',
    'NoneOfTheAbove',
    'Dynamic',
    'Static',
    'NotSure',
  ])
    assert.match(types, new RegExp(`'${word}'`), word)
  assert.ok(!/bmrSex\??: .*'Other'/.test(types), 'BMR sex is Male | Female only')
})

check(
  'M15 feature gate: both flags default OFF; with them off nothing calls the new routes and the old save path stays',
  () => {
    assert.equal(settings.EXPENDITURE_SETTINGS_API, false)
    assert.equal(settings.EXPENDITURE_MODE_API, false)
    const hook = source('features/more/hooks/use-expenditure-settings.ts')
    assert.match(hook, /enabled,/)
    const page = source('features/more/pages/ExpenditureSettingsPage.tsx')
    assert.match(page, /useExpenditureSettings\(EXPENDITURE_SETTINGS_API\)/)
    assert.match(page, /: setManual\.mutateAsync\(kcal\)/)
    assert.match(page, /const modeEditable = EXPENDITURE_MODE_API && data !== undefined/)
    assert.match(
      page,
      /title="Algorithm"\s+subtitle=\{data\?\.algorithmName \?\? ALGORITHM_NAME\}\s+action="edit"\s+readOnly/
    )
    const bmr = source('features/more/pages/BmrEquationPage.tsx')
    assert.match(bmr, /useExpenditureSettings\(EXPENDITURE_SETTINGS_API\)/)
    assert.match(bmr, /useTdeeEstimate\(!EXPENDITURE_SETTINGS_API\)/)
  }
)

check(
  "M16 Athletic Pursuits = exactly MF's 4 options; BMR sex has no default and only shows for MacroFactor + Gender Other",
  () => {
    assert.deepEqual(
      settings.ATHLETIC_PURSUITS_CHOICES.map((c) => `${c.value}|${c.label}`),
      [
        'ExerciseRegularly|I exercise regularly',
        'Athlete|I am an athlete',
        'ProfessionalAthlete|I am a professional athlete',
        'NoneOfTheAbove|None of the above',
      ]
    )
    assert.deepEqual(
      settings.BMR_SEX_CHOICES.map((c) => c.value),
      ['Male', 'Female']
    )
    const bmr = source('features/more/pages/BmrEquationPage.tsx')
    assert.match(
      bmr,
      /data\?\.bmrEquation === 'MacroFactor' && profile\.data\?\.gender === 'Other'/
    )
    assert.match(bmr, /\{needsSex && \(/)
    assert.match(bmr, /choiceLabel\(BMR_SEX_CHOICES, data\?\.bmrSex\) \?\? 'Not set'/)
    assert.match(bmr, /value=\{data\?\.bmrSex \?\? null\}/)
  }
)

check(
  'M17 Prior Weight: threshold only from BE (no 88), sheet only when a threshold exists, saves weighedMoreThanBefore',
  () => {
    for (const file of [
      'features/more/pages/BmrEquationPage.tsx',
      'features/more/expenditure-settings.config.ts',
      'features/more/types/expenditure-settings.types.ts',
    ]) {
      const text = source(file)
      assert.ok(!/\b88\b/.test(text), `${file} must not hardcode a weight threshold`)
      assert.ok(!/weighed more than \d/i.test(text), `${file} threshold must come from BE`)
    }
    const bmr = source('features/more/pages/BmrEquationPage.tsx')
    assert.match(bmr, /title="Prior Weight"[\s\S]*?disabled=\{!priorQuestion\.data\}/)
    assert.match(bmr, /PRIOR_WEIGHT_API && data !== undefined/)
    assert.match(bmr, /editing === 'priorWeight' && data && priorQuestion\.data/)
    assert.match(bmr, /priorWeightThresholdShown: priorQuestion\.data\.displayValue/)
    assert.match(bmr, /priorWeightThresholdUnit: priorQuestion\.data\.displayUnit/)
    assert.match(bmr, /weighedMoreThanBefore: value as WeighedMoreThanBefore/)
    assert.match(
      bmr,
      /priorWeightSummary\(\s*priorAnswer,\s*data\.weighedMoreThanBeforeThresholdShown,\s*data\.weighedMoreThanBeforeThresholdUnit\s*\)/,
      'subtitle comes from the STORED shown number/unit'
    )
    const types = source('features/more/types/expenditure-settings.types.ts')
    const save = types.match(/interface SaveExpenditureSettingsRequest \{[\s\S]*?\}/)[0]
    assert.match(save, /weighedMoreThanBefore\?: WeighedMoreThanBefore/)
    assert.match(save, /priorWeightThresholdShown\?: number/)
    assert.match(save, /priorWeightThresholdUnit\?: 'kg' \| 'lb'/)
    assert.ok(!/priorWeightThresholdKg/.test(types), 'old field was removed by the BE')
    for (const field of ['Kg', 'Shown', 'Unit'])
      assert.match(types, new RegExp(`weighedMoreThanBeforeThreshold${field}:`))
  }
)

check(
  'M20 Prior Weight question text: BE kg threshold shown in the user unit, lb rounded UP; neutral message without a number when no threshold',
  () => {
    // BE là nguồn duy nhất: FE không còn phép tính ngưỡng nào (không ceilWeight, không ×1.06, không ÷0.9)
    assert.equal(units.ceilWeight, undefined, 'FE threshold math was removed')
    assert.equal(settings.priorWeightQuestion(80, 'kg'), 'Have you ever weighed more than 80 kg?')
    assert.equal(settings.priorWeightQuestion(177, 'lb'), 'Have you ever weighed more than 177 lb?')
    assert.equal(
      settings.priorWeightQuestion(176.4, 'lb'),
      'Have you ever weighed more than 176.4 lb?',
      'the number is shown exactly as BE sent it (no rounding)'
    )
    assert.equal(settings.priorWeightSummary('No', 93, 'kg'), 'I have never weighed over 93 kg')
    assert.equal(settings.priorWeightSummary('Yes', 205, 'lb'), 'I have weighed over 205 lb')
    assert.equal(
      settings.priorWeightSummary('NotSure', 93, 'kg'),
      'Not sure if I have weighed over 93 kg'
    )
    assert.equal(
      settings.priorWeightSummary('No', null, null),
      'No',
      'old answer without a stored number'
    )
    for (const file of [
      'features/more/pages/BmrEquationPage.tsx',
      'features/more/expenditure-settings.config.ts',
    ])
      assert.ok(
        !/1\.06|\/ 0\.9|\* 0\.9|LB_PER_KG|ceilWeight/.test(source(file)),
        `${file} has no threshold math`
      )
    // metabolicAdaptationEligibility chỉ là kiểu dữ liệu, KHÔNG được vẽ ra giao diện
    for (const file of [
      'features/more/pages/BmrEquationPage.tsx',
      'features/more/pages/ExpenditureSettingsPage.tsx',
      'features/more/components/SettingRows.tsx',
    ])
      assert.ok(!/metabolicAdaptation/.test(source(file)), `${file} must not render it`)
    assert.deepEqual(
      settings.PRIOR_WEIGHT_CHOICES.map((c) => `${c.value}|${c.label}`),
      ['Yes|Yes', 'No|No', 'NotSure|Not sure']
    )
    assert.ok(!/\d/.test(settings.PRIOR_WEIGHT_NEEDS_WEIGHT), 'neutral message carries no number')
    const page = source('features/more/pages/ExpenditureSettingsPage.tsx')
    assert.match(page, /data\?\.algorithmName \?\? ALGORITHM_NAME/)
  }
)

check(
  'M18 saves send the exact payloads and trust only the BE response (no optimistic update)',
  () => {
    const page = source('features/more/pages/ExpenditureSettingsPage.tsx')
    assert.match(page, /initialEstimateMode: 'Manual',\s+manualInitialTdeeKcal: kcal/)
    assert.match(page, /saveSettings\.mutateAsync\(\{ initialEstimateMode: 'Formula' \}\)/)
    assert.match(page, /setMode\.mutateAsync\(\{ mode: 'Static', staticTdeeKcal: kcal \}\)/)
    assert.match(page, /setMode\.mutateAsync\(\{ mode: 'Dynamic' \}\)/)
    const hook = source('features/more/hooks/use-expenditure-settings.ts')
    assert.match(
      hook,
      /onSuccess: \(settings\) =>[\s\S]*setQueryData\(expenditureSettingsKeys\.all, settings\)/
    )
    assert.ok(!/onMutate/.test(hook), 'no optimistic update')
    const sheet = source('features/more/components/ManualTdeeSheet.tsx')
    assert.match(sheet, /canSave = hasProgram && !invalid && !unchanged && !pending/)
    const bmr = source('features/more/pages/BmrEquationPage.tsx')
    assert.match(bmr, /saveSettings\.mutateAsync\(\{ bmrEquation \}\)/)
    assert.match(bmr, /saveSettings\.mutateAsync\(\{ bmrSex: value as BmrSex \}\)/)
    assert.match(bmr, /athleticPursuits: value as AthleticPursuits/)
  }
)

check(
  'M19 Algorithm row = the ONE real algorithm, read-only; no V1/V2/V3 sheet; modifier toggles stay disabled',
  () => {
    assert.equal(settings.ALGORITHM_NAME, 'MacroOS Adaptive Expenditure')
    const page = source('features/more/pages/ExpenditureSettingsPage.tsx')
    const rows = source('features/more/components/SettingRows.tsx')
    assert.match(rows, /if \(readOnly\) return <div className=\{ROW\}>\{text\}<\/div>/)
    assert.ok(!/onEdit=\{[^}]*algorithm/i.test(page), 'Algorithm has no editor')
    for (const file of [
      'features/more/pages/ExpenditureSettingsPage.tsx',
      'features/more/expenditure-settings.config.ts',
      'features/more/components/SettingRows.tsx',
    ])
      assert.ok(!/\bV[123]\b/.test(source(file)), `${file} must never show an algorithm version`)
    for (const title of ['Step-Informed Updates', 'Predictive Goal Adjustment'])
      assert.match(
        page,
        new RegExp(`title="${title}"\\s+description=\\{UNAVAILABLE_TEXT\\}\\s+disabled`),
        title
      )
  }
)

console.log(`\n${checks} groups passed${failures ? `, ${failures} FAILED` : ''}`)
process.exit(failures === 0 ? 0 : 1)
