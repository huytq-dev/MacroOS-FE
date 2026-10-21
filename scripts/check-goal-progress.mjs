// Kiểm tra `goalProgress` / `goalPercent` / `primaryGoal` / `targetRatio` (repo chưa có test runner).
// Chạy: node scripts/check-goal-progress.mjs   (Node ≥ 22.18 chạy thẳng file .ts)
import assert from 'node:assert/strict'
import {
  TARGET_AT,
  goalPercent,
  goalProgress,
  goalRemaining,
  primaryGoal,
  targetRatio,
  weekBarProgress,
} from '../src/features/nutrition/goal-progress.ts'

const close = (actual, expected, label, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${label}: ${actual} ≠ ${expected}`)
const goal = (floor, target, ceiling) => ({ floor, target, ceiling })
const row = (g, consumed) => goalProgress(g, consumed, 'row')
let checks = 0
const check = (name, fn) => {
  fn()
  checks += 1
  console.log(`ok  ${name}`)
}

check('consumed null or 0 → empty bar, markers still placed', () => {
  for (const value of [null, 0, -5, Number.NaN]) {
    const p = row(goal(null, 100, null), value)
    assert.equal(p.status, 'empty')
    assert.equal(p.fill, 0)
    close(p.targetAt, TARGET_AT.row, 'targetAt')
  }
})

check('target only: below, = target, beyond target (no ceiling → met, never over)', () => {
  assert.equal(row(goal(null, 100, null), 50).status, 'below')
  const at = row(goal(null, 100, null), 100)
  assert.equal(at.status, 'met')
  close(at.fill, TARGET_AT.row, 'fill at target')
  assert.equal(row(goal(null, 100, null), 113).status, 'met')
  assert.equal(row(goal(null, 100, null), 113).zone, null)
})

check('tile layout puts the target at 0.8', () => {
  close(goalProgress(goal(null, 100, null), 40, 'tile').targetAt, 0.8, 'tile targetAt')
})

check(
  'tile fill matches the MF Dashboard ref (Calories 3258/2880 ≈ 0.905, Protein 53/137 ≈ 0.31, 0 = empty)',
  () => {
    const cal = goalProgress(goal(null, 2880, null), 3258, 'tile')
    close(cal.fill, 0.905, 'calories fill', 0.005)
    assert.ok(cal.fill > cal.targetAt && cal.fill <= 1)
    close(goalProgress(goal(null, 137, null), 53, 'tile').fill, 0.31, 'protein fill', 0.005)
    assert.equal(goalProgress(goal(null, 137, null), 0, 'tile').fill, 0)
  }
)

check(
  'floor + target + ceiling: below floor / = floor / between / = target / = ceiling / above',
  () => {
    const g = goal(60, 100, 140)
    assert.equal(row(g, 30).status, 'below')
    assert.equal(row(g, 60).status, 'inRange')
    assert.equal(row(g, 80).status, 'inRange')
    assert.equal(row(g, 100).status, 'met')
    assert.equal(row(g, 140).status, 'met')
    assert.equal(row(g, 141).status, 'over')
    const p = row(g, 100)
    close(p.floorAt / p.targetAt, 0.6, 'floor/target ratio is the real ratio')
    close(p.ceilingAt / p.targetAt, 1.4, 'ceiling/target ratio is the real ratio')
    assert.deepEqual(p.zone, [p.floorAt, p.ceilingAt])
  }
)

check(
  'ceiling beyond the track is off-scale: band stays open to the end, scale does NOT stretch',
  () => {
    const p = row(goal(null, 100, 400), 10)
    close(p.scaleMax, 100 / TARGET_AT.row, 'scaleMax')
    assert.equal(p.ceilingAt, null)
    close(p.targetAt, TARGET_AT.row, 'targetAt')
    assert.deepEqual(p.zone, [p.targetAt, 1])
  }
)

check('vitamin C 90 / 2000 (TargetWithCeiling): 60 / 120 / 2500', () => {
  const g = { floor: null, target: 90, ceiling: 2000, goalKind: 'TargetWithCeiling' }
  const low = row(g, 60)
  assert.equal(low.status, 'below')
  assert.equal(low.ceilingAt, null)
  close(low.targetAt, TARGET_AT.row, 'target stays at the layout position')
  assert.equal(row(g, 120).status, 'met')
  const over = row(g, 2500)
  assert.equal(over.status, 'over')
  assert.equal(over.scaleMax, 2500)
  close(over.ceilingAt, 0.8, 'ceiling now on the visible scale')
  assert.equal(over.fill, 1)
})

check(
  'sodium 1500 / 2300 (TargetWithCeiling): tick at target, ceiling visible on row, off-scale on tile',
  () => {
    const g = { floor: null, target: 1500, ceiling: 2300, goalKind: 'TargetWithCeiling' }
    const r = row(g, 1000)
    close(r.targetAt, TARGET_AT.row, 'row target')
    assert.ok(r.ceilingAt !== null && r.ceilingAt > r.targetAt && r.ceilingAt < 1)
    assert.equal(goalProgress(g, 1000, 'tile').ceilingAt, null)
    assert.equal(row(g, 2400).status, 'over')
    assert.equal(row(g, 1800).status, 'met')
  }
)

check('sugars added (Maximum, ceiling only): ceiling sits at the layout position, no tick', () => {
  const g = { floor: null, target: null, ceiling: 71.5, goalKind: 'Maximum' }
  const p = row(g, 30)
  close(p.ceilingAt, TARGET_AT.row, 'ceilingAt')
  assert.equal(p.targetAt, null)
  assert.deepEqual(p.zone, [0, p.ceilingAt])
  assert.equal(p.status, 'inRange')
  assert.equal(row(g, 80).status, 'over')
})

check('goalKind decides which markers count (None / Target / Maximum / Minimum)', () => {
  assert.equal(row({ floor: 5, target: 10, ceiling: 20, goalKind: 'None' }, 5).status, 'empty')
  assert.equal(primaryGoal({ floor: 5, target: 10, ceiling: 20, goalKind: 'None' }), null)
  assert.equal(row({ floor: 5, target: 10, ceiling: 20, goalKind: 'Target' }, 5).zone, null)
  assert.equal(row({ floor: 5, target: 10, ceiling: 20, goalKind: 'Maximum' }, 5).targetAt, null)
  assert.equal(row({ floor: 5, target: 10, ceiling: 20, goalKind: 'Minimum' }, 5).ceilingAt, null)
})

check('missing floor → band opens to the left; missing ceiling → band opens to the right', () => {
  const noFloor = row(goal(null, 100, 140), 50)
  close(noFloor.zone[0], noFloor.targetAt, 'zone starts at the target when there is no floor')
  close(noFloor.zone[1], noFloor.ceilingAt, 'zone end')
  const noCeiling = row(goal(60, 100, null), 50)
  assert.equal(noCeiling.zone[1], 1)
  close(noCeiling.zone[0], noCeiling.floorAt, 'zone start')
})

check('target 0 / null is unset; ceiling-only and floor-only anchor on the largest marker', () => {
  for (const target of [0, null]) {
    const p = row(goal(null, target, 71.5), 20)
    assert.equal(p.targetAt, null)
    close(p.ceilingAt, TARGET_AT.row, 'ceiling anchored')
    assert.equal(p.status, 'inRange')
  }
  const floorOnly = row(goal(40, null, null), 20)
  assert.equal(floorOnly.targetAt, null)
  assert.equal(floorOnly.status, 'below')
  assert.equal(row(goal(40, null, null), 40).status, 'met')
  assert.equal(row(goal(null, null, 71.5), 80).status, 'over')
  const none = row(goal(null, 0, null), 50)
  assert.equal(none.status, 'empty')
  assert.equal(none.zone, null)
  assert.equal(none.scaleMax, 0)
})

check('consumed far beyond the scale: bar full, markers shift left, nothing overflows', () => {
  const p = row(goal(60, 100, 140), 1000)
  assert.equal(p.scaleMax, 1000)
  assert.equal(p.fill, 1)
  assert.ok(p.targetAt < TARGET_AT.row && p.ceilingAt <= 1 && p.floorAt >= 0)
  assert.equal(p.status, 'over')
  const noCeiling = row(goal(null, 100, null), 500)
  assert.equal(noCeiling.fill, 1)
  assert.equal(noCeiling.status, 'met')
})

check('percent / remaining follow ONE reference: target, else floor, else ceiling', () => {
  assert.equal(primaryGoal(goal(60, 100, 140)), 100)
  assert.equal(primaryGoal(goal(60, null, 140)), 60)
  assert.equal(primaryGoal(goal(null, 0, 140)), 140)
  assert.equal(primaryGoal(goal(null, null, null)), null)
  assert.equal(goalPercent(goal(null, 2880, null), 3258), 113)
  assert.equal(goalPercent(goal(null, null, null), 50), null)
  assert.equal(goalPercent(goal(null, 100, null), null), null)
  assert.equal(goalRemaining(goal(null, 100, null), 130), 0)
  assert.equal(goalRemaining(goal(null, 100, null), null), 100)
  assert.equal(goalRemaining(goal(null, null, null), 5), null)
})

check('targetRatio (dial / week / small macro bars): 100% = target', () => {
  assert.deepEqual(targetRatio(50, 100), { progress: 0.5, over: false })
  assert.deepEqual(targetRatio(150, 100), { progress: 1, over: true })
  assert.deepEqual(targetRatio(0, 0), { progress: 0, over: false })
  assert.deepEqual(targetRatio(10, 0), { progress: 1, over: true })
  assert.deepEqual(targetRatio(10, null), { progress: 1, over: true })
})

check('percent = consumed / target is SEPARATE from the marker position (user examples)', () => {
  assert.equal((100 * 8.1) / 175 > 4.62 && (100 * 8.1) / 175 < 4.64, true)
  assert.equal(goalPercent(goal(null, 175, null), 8.1), 5) // 4.63 → 5
  assert.equal((100 * 3.4) / 95.4 > 3.55 && (100 * 3.4) / 95.4 < 3.57, true)
  assert.equal(goalPercent(goal(null, 95.4, null), 3.4), 4) // 3.56 → 4
  // the tick does not move with the amount eaten (only the fill does)
  for (const layout of ['tile', 'row']) {
    const a = goalProgress(goal(null, 175, null), 8.1, layout)
    const b = goalProgress(goal(null, 175, null), 100, layout)
    close(a.targetAt, TARGET_AT[layout], 'tick fixed by layout')
    close(b.targetAt, TARGET_AT[layout], 'tick fixed by layout')
    close(a.fill, 8.1 / a.scaleMax, 'fill = consumed / scaleMax')
  }
  // beyond the scale: scaleMax follows the eaten amount, the tick moves left on the SAME scale
  const over = goalProgress(goal(null, 100, null), 300, 'row')
  close(over.scaleMax, 300, 'scaleMax = consumed')
  close(over.targetAt, 100 / 300, 'target on the stretched scale')
  close(over.fill, 1, 'fill capped at the track')
})

check('Range 70/100/120: every mark sits at value / scaleMax (linear, one scale)', () => {
  const p = goalProgress(goal(70, 100, 120), 50, 'row')
  const scaleMax = 100 / TARGET_AT.row
  close(p.scaleMax, scaleMax, 'scaleMax anchored on target')
  close(p.floorAt, 70 / scaleMax, 'floorAt')
  close(p.targetAt, 100 / scaleMax, 'targetAt')
  close(p.ceilingAt, 120 / scaleMax, 'ceilingAt')
  assert.ok(p.floorAt < p.targetAt && p.targetAt < p.ceilingAt && p.ceilingAt < 1)
  // distances between marks are proportional to the value differences
  close(
    (p.targetAt - p.floorAt) / (p.ceilingAt - p.targetAt),
    (100 - 70) / (120 - 100),
    'linear spacing'
  )
  assert.deepEqual(p.zone, [p.floorAt, p.ceilingAt])
})

check(
  'About-page Anatomy example: floor / target / ceiling all inside the track, eaten past the target',
  () => {
    const p = goalProgress(goal(60, 100, 145), 120, 'tile', 0.58)
    close(p.targetAt, 0.58, 'target anchor')
    close(p.floorAt, 0.348, 'floor ≈ 0.35', 0.005)
    close(p.ceilingAt, 0.841, 'ceiling ≈ 0.84', 0.005)
    close(p.fill, 0.696, 'fill ≈ 0.70', 0.005)
    assert.ok(p.ceilingAt !== null && p.ceilingAt < 1)
    // the OLD sample (80/120/160 on the tile layout, anchor 0.8) hid the ceiling — keep the regression visible
    assert.equal(goalProgress(goal(80, 120, 160), 105, 'tile').ceilingAt, null)
  }
)

console.log(`\n${checks} groups passed`)
