'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PLOT_FRACTION } from './geometry'

interface ChartPanOptions {
  /** Số ngày tối đa kéo lùi về quá khứ (0 = không kéo được). */
  readonly maxPos: number
  /** Số ô ngày đang trải trên vùng vẽ (kỳ đang chọn; 7 = 1W). */
  readonly slots: number
}

const DRAG_START_PX = 6
const SAMPLE_MS = 100
/** Ngưỡng tốc độ (ngày / ms) dưới đó quán tính dừng và biểu đồ bám về ngày gần nhất. */
const STOP_SPEED = 0.0015
const SNAP_MS = 180

/**
 * Kéo ngang biểu đồ theo thời gian (ngón tay hoặc chuột): `pos` là số ngày đã lùi về quá khứ (0 = kết thúc hôm nay), thả tay thì có
 * quán tính rồi bám về ngày gần nhất. Cuộn dọc trang vẫn dùng được (phần tử cần `touch-pan-y`); chạm không kéo thì không đổi gì để
 * biểu đồ còn xử lý như một lần bấm (`wasDragged()` báo vừa kéo xong nên bỏ qua click).
 */
export function useChartPan({ maxPos, slots }: ChartPanOptions) {
  const node = useRef<HTMLDivElement | null>(null)
  // Ref dạng callback: đối tượng trả về không chứa ref nên dùng được trong lúc render (React Compiler)
  const container = useCallback((element: HTMLDivElement | null) => {
    node.current = element
  }, [])
  /** Số pixel màn hình của MỘT ngày: độ rộng thực của biểu đồ × phần vùng vẽ ÷ số ô. */
  const getSlotPx = () => ((node.current?.clientWidth ?? 0) * PLOT_FRACTION) / slots
  const [raw, setRaw] = useState(0)
  const [dragging, setDragging] = useState(false)
  const pos = Math.min(raw, Math.max(0, maxPos))
  const posRef = useRef(0)
  const frame = useRef(0)
  const gesture = useRef({
    down: false,
    panning: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    samples: [] as { t: number; x: number }[],
  })
  const dragged = useRef(false)
  const bounds = useRef(Math.max(0, maxPos))

  useEffect(() => {
    bounds.current = Math.max(0, maxPos)
  }, [maxPos])
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const apply = (value: number) => {
    posRef.current = Math.min(bounds.current, Math.max(0, value))
    setRaw(posRef.current)
  }

  const snap = () => {
    const from = posRef.current
    const to = Math.round(from)
    if (from === to) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / SNAP_MS)
      apply(from + (to - from) * (1 - (1 - t) ** 3))
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }

  const coast = (velocity: number) => {
    let speed = velocity
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      speed *= Math.pow(0.95, dt / 16)
      const next = posRef.current + speed * dt
      if (next <= 0 || next >= bounds.current) {
        // Chạm đầu / cuối dữ liệu: dừng ngay tại mép
        apply(next)
        return
      }
      apply(next)
      if (Math.abs(speed) < STOP_SPEED) {
        snap()
        return
      }
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }

  const onPointerDown = (event: React.PointerEvent) => {
    cancelAnimationFrame(frame.current)
    dragged.current = false
    gesture.current = {
      down: true,
      panning: false,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      samples: [{ t: event.timeStamp, x: event.clientX }],
    }
  }
  const onPointerMove = (event: React.PointerEvent) => {
    const g = gesture.current
    if (!g.down) return
    if (!g.panning) {
      const dx = Math.abs(event.clientX - g.startX)
      const dy = Math.abs(event.clientY - g.startY)
      if (dx < DRAG_START_PX || dx < dy) return
      g.panning = true
      dragged.current = true
      setDragging(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    const slotPx = getSlotPx()
    if (slotPx > 0) apply(posRef.current + (event.clientX - g.lastX) / slotPx)
    g.lastX = event.clientX
    g.samples = [
      ...g.samples.filter((sample) => event.timeStamp - sample.t <= SAMPLE_MS),
      { t: event.timeStamp, x: event.clientX },
    ]
  }
  const onPointerUp = (event: React.PointerEvent) => {
    const g = gesture.current
    if (!g.down) return
    g.down = false
    if (!g.panning) return
    setDragging(false)
    const first = g.samples[0]
    const slotPx = getSlotPx()
    const elapsed = first ? event.timeStamp - first.t : 0
    const velocity =
      elapsed > 0 && slotPx > 0
        ? (event.clientX - (first?.x ?? event.clientX)) / slotPx / elapsed
        : 0
    if (Math.abs(velocity) > STOP_SPEED) coast(velocity)
    else snap()
  }

  return {
    /** Trạng thái để render: số ngày đã lùi về quá khứ (số thực khi đang kéo), số ngày nguyên gần nhất, đang kéo hay không. */
    view: { pos, snapped: Math.round(pos), dragging },
    /** Gắn vào phần tử bọc biểu đồ: ref đo độ rộng (đổi pixel kéo thành số ngày) + các sự kiện con trỏ. */
    bind: {
      ref: container,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    /** Vừa kéo xong: bỏ qua sự kiện click ngay sau đó. */
    wasDragged: () => dragged.current,
  }
}
