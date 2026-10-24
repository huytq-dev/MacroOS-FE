// Kiểm tra mọi đường dẫn nội bộ (routePath, href="/...", router.push/replace, redirect, `${routePath.x}/...`) đều trỏ tới một page.tsx có thật dưới src/app.
// Chạy: node --import ./scripts/register-ts.mjs scripts/check-routes.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { routePath } from '../src/config/route-path.ts'
import { safeRedirect } from '../src/features/auth/auth.utils.ts'
import { goBack, hasInAppBack, parentRoute, trackPath } from '../src/lib/back-target.ts'

const SRC = fileURLToPath(new URL('../src', import.meta.url))
const APP = join(SRC, 'app')

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })

// /(protected)/body-metrics/[metric]/page.tsx → ^/body-metrics/[^/]+$
const routes = walk(APP)
  .filter((file) => /[\\/]page\.tsx$/.test(file))
  .map((file) => {
    const segments = relative(APP, file)
      .split(sep)
      .slice(0, -1)
      .filter((segment) => !/^\(.*\)$/.test(segment))
    const pattern = segments.map((s) => (/^\[.*\]$/.test(s) ? '[^/]+' : s.replace(/[.-]/g, '\\$&')))
    return { path: `/${segments.join('/')}`, regex: new RegExp(`^/${pattern.join('/')}$`) }
  })

const resolves = (target) => {
  const path = target.split(/[?#]/)[0].replace(/\/$/, '') || '/'
  return routes.some((route) => route.regex.test(path))
}

const targets = []
const add = (where, raw) => targets.push({ where, raw })

for (const [key, value] of Object.entries(routePath)) {
  add(`routePath.${key}`, typeof value === 'function' ? value('x') : value)
}

const routeValue = (name) => {
  const value = routePath[name]
  if (value === undefined) return null
  return typeof value === 'function' ? value('x') : value
}

const PATTERNS = [
  // href="/x" | href={'/x'} | href: '/x'
  /href\s*[=:]\s*\{?\s*["'](\/[^"']*)["']/g,
  // router.push('/x') | router.replace("/x") | redirect('/x')
  /(?:router\.(?:push|replace)|redirect)\(\s*["'](\/[^"']*)["']/g,
  // `${routePath.x}/...` anywhere (router.push, href, Link)
  /`(\$\{routePath\.(\w+)(?:\([^)]*\))?\}[^`]*)`/g,
]

for (const file of walk(SRC).filter((f) => /\.(tsx?|mjs)$/.test(f))) {
  const text = readFileSync(file, 'utf8')
  const rel = relative(join(SRC, '..'), file).split(sep).join('/')
  for (const regex of PATTERNS) {
    for (const match of text.matchAll(regex)) {
      const line = text.slice(0, match.index).split('\n').length
      if (match[2]) {
        const base = routeValue(match[2])
        if (base === null) {
          add(`${rel}:${line}`, `<unknown routePath.${match[2]}>`)
          continue
        }
        // Bỏ ${routePath.x} đầu, thay các ${...} còn lại bằng một đoạn bất kỳ.
        const rest = match[1].replace(/^\$\{[^}]*\}/, '').replace(/\$\{[^}]*\}/g, 'x')
        add(`${rel}:${line}`, `${base}${rest}`)
      } else {
        add(`${rel}:${line}`, match[1])
      }
    }
  }
}

// ?redirect= sau đăng nhập chỉ nhận đường dẫn nội bộ
const redirectCases = [
  ['/more', '/more'],
  ['/dashboard/nutrition/protein?x=1', '/dashboard/nutrition/protein?x=1'],
  [null, '/dashboard'],
  ['//evil.example', '/dashboard'],
  ['/\\evil.example', '/dashboard'],
  ['https://evil.example', '/dashboard'],
  ['javascript:alert(1)', '/dashboard'],
  // Trình duyệt bỏ tab / CR / LF và đổi "\" → "/": các chuỗi này thành "//evil.com" nếu chỉ xét tiền tố
  ['/\t/evil.com', '/dashboard'],
  ['/\n/evil.com', '/dashboard'],
  ['/\r/evil.com', '/dashboard'],
  ['/\\evil.com', '/dashboard'],
  ['//evil.com', '/dashboard'],
  ['%2F%2Fevil.com', '/dashboard'],
  ['/%2F%2Fevil.com', '/%2F%2Fevil.com'], // vẫn cùng origin: chỉ là một đường dẫn lạ trong app
  ['/dashboard?x=1#a', '/dashboard?x=1#a'],
]
for (const [input, expected] of redirectCases) {
  const actual = safeRedirect(input, routePath.dashboard, 'http://localhost:3000')
  if (actual !== expected) {
    console.error(`✗ safeRedirect(${input}) → ${actual}, expected ${expected}`)
    process.exitCode = 1
  }
}

// Back khi mở thẳng (không có lịch sử): trang cha gần nhất có thật, không bao giờ là route không tồn tại
const parentCases = [
  ['/dashboard/weight-trend', '/dashboard'],
  ['/dashboard/nutrition/protein/summary', '/dashboard/nutrition/protein'],
  ['/dashboard/nutrition/protein', '/dashboard/nutrition'],
  ['/more/expenditure/bmr', '/more/expenditure'],
  ['/food-log/settings/logger-tiles', '/food-log/settings'],
  ['/progress-photos/gallery?date=2026-10-01', '/progress-photos'],
  ['/body-metrics/neck', '/dashboard'],
  ['/habits/weigh-in', '/dashboard'],
  ['/shortcuts', '/dashboard'],
]
for (const [input, expected] of parentCases) {
  const actual = parentRoute(input)
  if (actual !== expected || !resolves(actual)) {
    console.error(`✗ parentRoute(${input}) → ${actual}, expected ${expected}`)
    process.exitCode = 1
  }
}

// Nút Back trên lịch sử trình duyệt giả: mở link thẳng → Back đi lên trang cha bằng replace (không bao giờ ra khỏi app / lùi vào trang con);
// đi trong app → Back = router.back()
{
  const browser = { entries: ['https://elsewhere.example/'], index: 0, backs: 0 }
  const current = () => browser.entries[browser.index]
  const settle = () => current().startsWith('/') && trackPath(current().split('?')[0])
  const router = {
    back: () => {
      browser.index -= 1
      browser.backs += 1
      settle()
    },
    replace: (href) => {
      browser.entries[browser.index] = href
      settle()
    },
    push: (href) => {
      browser.entries.splice(browser.index + 1)
      browser.entries.push(href)
      browser.index += 1
      settle()
    },
  }
  const expectStep = (label, path, backs) => {
    if (current() !== path || browser.backs !== backs) {
      console.error(`✗ goBack ${label}: at ${current()} (backs=${browser.backs}), expected ${path} (backs=${backs})`)
      process.exitCode = 1
    }
  }
  // Mở thẳng trang sâu (tab mới từ link ngoài app)
  router.push('/dashboard/nutrition/protein/summary')
  goBack(router, current())
  expectStep('deep link → Back', '/dashboard/nutrition/protein', 0)
  goBack(router, current())
  expectStep('parent → Back', '/dashboard/nutrition', 0)
  goBack(router, current())
  expectStep('grandparent → Back', '/dashboard', 0)
  if (browser.entries.length !== 2) {
    console.error(`✗ goBack deep link: history grew to ${browser.entries.length} entries (replace expected)`)
    process.exitCode = 1
  }
  // Đi trong app rồi Back: lùi lịch sử thật
  router.push('/dashboard/weight-trend')
  goBack(router, current())
  expectStep('in-app child → Back', '/dashboard', 1)
  router.push('/dashboard/expenditure')
  goBack(router, current())
  expectStep('second in-app child → Back', '/dashboard', 2)
  if (hasInAppBack()) {
    console.error('✗ goBack: /dashboard reached by Back still claims an in-app previous page')
    process.exitCode = 1
  }
}

const broken = targets.filter((t) => !resolves(t.raw))
for (const t of broken) console.error(`✗ ${t.where} → ${t.raw}`)
console.log(`${routes.length} page routes, ${targets.length} internal targets, ${broken.length} unresolved`)
if (broken.length) process.exit(1)
