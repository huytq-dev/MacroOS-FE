// Kiểm tra Adaptive Goal Scale: `goalScaleMax` / `goalProgress` / `goalPercent` / `primaryGoal` / `targetRatio` / `weekBarProgress`
// (repo chưa có test runner). Chạy: node scripts/check-goal-progress.mjs   (Node ≥ 22.18 chạy thẳng file .ts)
import assert from 'node:assert/strict'
import {
  CEILING_HEADROOM,
  CEILING_REACH,
  LIMIT_HEADROOM,
  MIN_HEADROOM,
  TARGET_HEADROOM,
  goalPercent,
  goalProgress,
  goalRemaining,
  goalScaleMax,
  primaryGoal,
  targetRatio,
  weekBarProgress,
} from '../src/features/nutrition/goal-progress.ts'

const close = (actual, expected, label, tolerance = 0.001) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${label}: ${actual} ≠ ${expected}`)
const goal = (floor, target, ceiling, goalKind) => ({ floor, target, ceiling, goalKind })
let checks = 0
function check(name, fn) {
  fn()
  checks += 1
  console.log(`ok  ${name}`)
}

check(
  'Target (program macros): scale = target × 1.25 → target at 0.80, fill by real amount',
  () => {
    const g = goal(null, 175, null, 'Target')
    close(goalScaleMax(g), 175 * TARGET_HEADROOM, 'scaleMax', 1e-9)
    const p = goalProgress(g, 8.1)
    close(p.targetAt, 0.8, 'protein target at 0.8')
    close(p.fill, 8.1 / (175 * 1.25), 'protein 8.1 g fill')
    close(p.fill, 0.037, 'protein fill ≈ 0.037', 0.001)
    assert.equal(p.ceilingAt, null)
    assert.equal(p.zone, null)
    // MF Dashboard ref: Calories 3258 / 2880 → fill ≈ 0.905 past the tick, 53 / 137 → ≈ 0.31
    const cal = goalProgress(goal(null, 2880, null, 'Target'), 3258)
    close(cal.fill, 0.905, 'calories fill', 0.005)
    assert.ok(cal.fill > cal.targetAt && cal.status === 'met')
    close(goalProgress(goal(null, 137, null, 'Target'), 53).fill, 0.31, 'protein fill 0.31', 0.005)
  }
)

check('the scale never depends on the amount eaten (and is not stretched by it)', () => {
  const g = goal(null, 100, null, 'Target')
  const base = goalProgress(g, 10)
  for (const eaten of [0, 50, 100, 124, 125, 126, 500, 5000]) {
    const p = goalProgress(g, eaten)
    assert.equal(p.scaleMax, base.scaleMax, `scaleMax at ${eaten}`)
    close(p.targetAt, base.targetAt, `target position at ${eaten}`)
  }
  const over = goalProgress(g, 500)
  assert.equal(over.fill, 1)
  assert.equal(over.status, 'over')
  assert.equal(goalProgress(g, 125).fill, 1)
})

check('Minimum (floor and/or target, no ceiling): scale = base × 1.5', () => {
  const g = goal(60, 100, null, 'Minimum')
  const p = goalProgress(g, 50)
  close(goalScaleMax(g), 100 * MIN_HEADROOM, 'scaleMax', 1e-9)
  close(p.targetAt, 1 / 1.5, 'target ≈ 0.667')
  close(p.floorAt, 60 / 150, 'floor 0.4')
  assert.deepEqual(p.zone, [p.floorAt, 1])
  assert.equal(p.status, 'below')
  const floorOnly = goalProgress(goal(40, null, null), 40)
  close(floorOnly.floorAt, 1 / 1.5, 'floor-only anchors on the floor')
  assert.equal(floorOnly.status, 'met')
})

check(
  'Maximum (ceiling only, e.g. saturated fat 22): scale = ceiling × 1.25, over is a full bar',
  () => {
    const g = goal(null, null, 22, 'Maximum')
    close(goalScaleMax(g), 22 * LIMIT_HEADROOM, 'scaleMax', 1e-9)
    const ok = goalProgress(g, 10)
    close(ok.ceilingAt, 0.8, 'ceiling at 0.8')
    assert.equal(ok.targetAt, null)
    assert.equal(ok.status, 'inRange')
    assert.deepEqual(ok.zone, [0, ok.ceilingAt])
    const over = goalProgress(g, 30)
    assert.equal(over.fill, 1)
    assert.equal(over.status, 'over')
    assert.equal(over.scaleMax, ok.scaleMax)
  }
)

check(
  'Range / TargetWithCeiling with a NEAR ceiling (≤ 2 × base): scale = ceiling × 1.15, all marks drawn',
  () => {
    const sodium = goal(null, 1500, 2300, 'TargetWithCeiling')
    const p = goalProgress(sodium, 1000)
    close(goalScaleMax(sodium), 2300 * CEILING_HEADROOM, 'scaleMax', 1e-9)
    close(p.targetAt, 0.567, 'sodium target 0.567')
    close(p.ceilingAt, 0.87, 'sodium ceiling 0.870')
    assert.equal(p.ceilingOffScale, false)
    assert.equal(goalProgress(sodium, 1800).status, 'met')
    assert.equal(goalProgress(sodium, 2400).status, 'over')
    close(
      goalProgress(sodium, 2400).fill,
      2400 / (2300 * CEILING_HEADROOM),
      'over the ceiling, still on the scale'
    )
    close(goalProgress(sodium, 3000).fill, 1, 'past the scale → full bar')
  }
)

check(
  'Range 70/100/120: every mark sits at value / scaleMax (linear, one scale, all visible)',
  () => {
    const p = goalProgress(goal(70, 100, 120, 'Range'), 50)
    const scaleMax = 120 * CEILING_HEADROOM
    close(p.scaleMax, scaleMax, 'scaleMax', 1e-9)
    close(p.floorAt, 70 / scaleMax, 'floorAt')
    close(p.targetAt, 100 / scaleMax, 'targetAt')
    close(p.ceilingAt, 120 / scaleMax, 'ceilingAt')
    assert.ok(p.floorAt < p.targetAt && p.targetAt < p.ceilingAt && p.ceilingAt < 1)
    close(
      (p.targetAt - p.floorAt) / (p.ceilingAt - p.targetAt),
      (100 - 70) / (120 - 100),
      'linear spacing'
    )
    assert.deepEqual(p.zone, [p.floorAt, p.ceilingAt])
    close(p.fill, 50 / scaleMax, 'fill uses the same scale')
  }
)

check(
  'FAR ceiling (vitamin C 90 / 2000): scale = base × 1.5, ceiling NOT drawn but reported',
  () => {
    const g = goal(null, 90, 2000, 'TargetWithCeiling')
    assert.ok(2000 > 90 * CEILING_REACH)
    close(goalScaleMax(g), 90 * MIN_HEADROOM, 'scaleMax', 1e-9)
    const p = goalProgress(g, 60)
    close(p.targetAt, 0.667, 'target 0.667')
    assert.equal(p.ceilingAt, null)
    assert.equal(p.ceilingOffScale, true)
    assert.equal(p.ceilingValue, 2000)
    assert.deepEqual(p.zone, [p.targetAt, 1])
    assert.equal(goalProgress(g, 120).status, 'met')
    // past the scale but under the real ceiling: full bar, NOT over
    const high = goalProgress(g, 500)
    assert.equal(high.fill, 1)
    assert.equal(high.status, 'met')
    assert.equal(goalProgress(g, 2500).status, 'over')
  }
)

check(
  'About-page Anatomy example (60 / 100 / 145 Range): floor 0.36, target 0.60, ceiling 0.87, all in the track',
  () => {
    const p = goalProgress(goal(60, 100, 145, 'Range'), 120)
    close(p.scaleMax, 145 * CEILING_HEADROOM, 'scaleMax 166.75')
    close(p.floorAt, 0.36, 'floor', 0.005)
    close(p.targetAt, 0.6, 'target', 0.005)
    close(p.ceilingAt, 0.87, 'ceiling', 0.005)
    assert.ok(p.fill > p.targetAt && p.fill < p.ceilingAt)
  }
)

check('consumed null / 0 / negative / NaN → empty bar, marks still placed', () => {
  for (const value of [null, 0, -5, Number.NaN]) {
    const p = goalProgress(goal(60, 100, 140, 'Range'), value)
    assert.equal(p.status, 'empty')
    assert.equal(p.fill, 0)
    assert.ok(p.targetAt !== null && p.floorAt !== null)
  }
})

check(
  'missing marks: no goal / None / target 0 → no bar; missing floor or ceiling opens the band',
  () => {
    for (const g of [
      goal(null, null, null),
      goal(null, 0, null),
      goal(5, 10, 20, 'None'),
      null,
      undefined,
    ]) {
      const p = goalProgress(g, 50)
      assert.equal(p.status, 'empty')
      assert.equal(p.scaleMax, 0)
      assert.equal(p.zone, null)
      assert.equal(p.targetAt, null)
    }
    const noFloor = goalProgress(goal(null, 100, 140), 50)
    close(noFloor.zone[0], noFloor.targetAt, 'zone starts at the target when there is no floor')
    close(noFloor.zone[1], noFloor.ceilingAt, 'zone end')
    const noCeiling = goalProgress(goal(60, 100, null), 50)
    assert.equal(noCeiling.zone[1], 1)
    close(noCeiling.zone[0], noCeiling.floorAt, 'zone start')
  }
)

check('goalKind decides which markers count (None / Target / Maximum / Minimum)', () => {
  const marks = { floor: 5, target: 10, ceiling: 20 }
  assert.equal(goalProgress({ ...marks, goalKind: 'None' }, 5).status, 'empty')
  assert.equal(primaryGoal({ ...marks, goalKind: 'None' }), null)
  assert.equal(goalProgress({ ...marks, goalKind: 'Target' }, 5).zone, null)
  assert.equal(goalProgress({ ...marks, goalKind: 'Maximum' }, 5).targetAt, null)
  assert.equal(goalProgress({ ...marks, goalKind: 'Minimum' }, 5).ceilingAt, null)
})

check(
  'history / summary lists share ONE scale = max of the per-row scales (comparable rows)',
  () => {
    const rows = [
      goal(null, 100, null, 'Target'),
      goal(null, 160, null, 'Target'),
      goal(null, 130, null, 'Target'),
    ]
    const shared = Math.max(...rows.map(goalScaleMax))
    close(shared, 160 * TARGET_HEADROOM, 'shared scale', 1e-9)
    const a = goalProgress(rows[0], 100, shared)
    const b = goalProgress(rows[1], 100, shared)
    assert.equal(a.scaleMax, shared)
    assert.equal(a.fill, b.fill) // same amount → same bar length
    close(a.targetAt, 100 / shared, 'target on the shared scale')
    close(b.targetAt, 160 / shared, 'target on the shared scale')
    assert.ok(a.targetAt < b.targetAt)
  }
)

check(
  'percent = consumed / primary goal is SEPARATE from the marker position (user examples)',
  () => {
    assert.ok((100 * 8.1) / 175 > 4.62 && (100 * 8.1) / 175 < 4.64)
    assert.equal(goalPercent(goal(null, 175, null), 8.1), 5) // 4.63 → 5
    assert.ok((100 * 3.4) / 95.4 > 3.55 && (100 * 3.4) / 95.4 < 3.57)
    assert.equal(goalPercent(goal(null, 95.4, null), 3.4), 4) // 3.56 → 4
    assert.equal(goalPercent(goal(null, 2880, null), 3258), 113)
    assert.equal(primaryGoal(goal(60, 100, 140)), 100)
    assert.equal(primaryGoal(goal(60, null, 140)), 60)
    assert.equal(primaryGoal(goal(null, 0, 140)), 140)
    assert.equal(primaryGoal(goal(null, null, null)), null)
    assert.equal(goalPercent(goal(null, null, null), 50), null)
    assert.equal(goalPercent(goal(null, 100, null), null), null)
    assert.equal(goalRemaining(goal(null, 100, null), 130), 0)
    assert.equal(goalRemaining(goal(null, 100, null), null), 100)
    assert.equal(goalRemaining(goal(null, null, null), 5), null)
  }
)

check('targetRatio (dial / week / small macro bars): 100% = target', () => {
  assert.deepEqual(targetRatio(50, 100), { progress: 0.5, over: false })
  assert.deepEqual(targetRatio(150, 100), { progress: 1, over: true })
  assert.deepEqual(targetRatio(0, 0), { progress: 0, over: false })
  assert.deepEqual(targetRatio(10, 0), { progress: 1, over: true })
  assert.deepEqual(targetRatio(10, null), { progress: 1, over: true })
})

check('weekBarProgress: Consumed fills up, Remaining drains, both clamp', () => {
  assert.deepEqual(weekBarProgress(0, 2880, 'consumed'), { progress: 0, over: false })
  assert.deepEqual(weekBarProgress(1440, 2880, 'consumed'), { progress: 0.5, over: false })
  assert.deepEqual(weekBarProgress(3258, 2880, 'consumed'), { progress: 1, over: true })
  assert.deepEqual(weekBarProgress(0, 2880, 'remaining'), { progress: 1, over: false })
  assert.deepEqual(weekBarProgress(720, 2880, 'remaining'), { progress: 0.75, over: false })
  assert.deepEqual(weekBarProgress(2880, 2880, 'remaining'), { progress: 0, over: false })
  assert.deepEqual(weekBarProgress(3258, 2880, 'remaining'), { progress: 0, over: false })
  assert.deepEqual(weekBarProgress(100, 0, 'remaining'), { progress: 0, over: false })
  assert.deepEqual(weekBarProgress(100, null, 'consumed'), { progress: 0, over: false })
})

console.log(`\n${checks} groups passed`)
