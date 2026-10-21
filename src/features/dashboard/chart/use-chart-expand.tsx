'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { WIDTH } from './geometry'
import { useTween } from './use-tween'
import { CollapseChartIcon, ExpandChartIcon } from '../components/DetailPage'
import { IconButton } from '@/components/shared/IconButton'
import { cn } from '@/lib/utils'

/** Chiều cao biểu đồ thu gọn, tính theo đơn vị viewBox (rộng `WIDTH`): ≈ 286px trên màn 375px. */
export const COLLAPSED_CHART_HEIGHT = 300
/** Phóng to không bao giờ thấp hơn mức này (px): màn quá thấp (ngang điện thoại) vẫn có biểu đồ dùng được, trang cuộn tiếp. */
const MIN_EXPANDED_PX = 220
/** Khoảng hở (px) giữa thanh chọn kỳ và thanh tab dưới khi phóng to. */
const FOOTER_GAP_PX = 8

/** Phần tử cuộn gần nhất của `element` (desktop: `main`); null = cuộn bằng cửa sổ (mobile). */
function scrollerOf(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll') return node
  }
  return null
}

/**
 * Chiều cao (px) để biểu đồ lấp đầy khung nhìn THẬT khi trang cuộn ở đầu: đáy vùng nhìn thấy (thanh tab dưới nếu có, không thì đáy
 * khung cuộn) − vị trí đỉnh biểu đồ − phần dưới biểu đồ phải còn thấy (thanh chọn kỳ + khoảng cách, đo từ phần tử thật). Không dùng
 * hằng số theo thiết bị; vị trí đỉnh tính theo toạ độ trang nên không phụ thuộc đang cuộn tới đâu.
 */
function fitHeightPx(chart: HTMLElement, footer: HTMLElement | null) {
  const scroller = scrollerOf(chart)
  const port = scroller?.getBoundingClientRect()
  const portTop = port?.top ?? 0
  const viewportBottom = port?.bottom ?? window.visualViewport?.height ?? window.innerHeight
  const nav = document.querySelector<HTMLElement>('[data-bottom-nav]')
  const navTop =
    nav && getComputedStyle(nav).display !== 'none' ? nav.getBoundingClientRect().top : Infinity
  const scrollTop = scroller ? scroller.scrollTop : window.scrollY
  const rect = chart.getBoundingClientRect()
  const chartTop = rect.top - portTop + scrollTop
  const belowChart = footer ? footer.getBoundingClientRect().bottom - rect.bottom : 0
  return Math.max(
    MIN_EXPANDED_PX,
    Math.min(viewportBottom, navTop) - portTop - chartTop - belowChart - FOOTER_GAP_PX
  )
}

export interface ChartExpand {
  readonly expanded: boolean
  readonly toggle: () => void
  /** Chiều cao hiện tại theo đơn vị viewBox (số thực, chạy mượt khi đổi chế độ / xoay màn). */
  readonly height: number
  /** Thuộc tính trải vào phần tử bọc biểu đồ / phần dưới (gắn ref đo); dùng qua `ExpandableChart` / `ExpandFooter`. */
  readonly chartBind: { readonly ref: (node: HTMLDivElement | null) => void }
  readonly footerBind: { readonly ref: (node: HTMLDivElement | null) => void }
}

/**
 * Phóng to / thu gọn biểu đồ DÙNG CHUNG cho mọi trang chi tiết: thu gọn = chiều cao cố định; phóng to = biểu đồ cao đúng bằng khung nhìn
 * thật tới ngay trên thanh chọn kỳ (thanh này luôn thấy được phía trên thanh tab), phần nội dung bên dưới VẪN render và trang cuộn như
 * thường. Chỉ đổi chiều cao: dữ liệu, kỳ, D/W/M, vị trí kéo và ngày đang chọn giữ nguyên (không tính lại). Đổi kích thước khung nhìn
 * (xoay, bàn phím, đổi độ rộng cột trang) khi đang phóng to thì đo lại.
 */
export function useChartExpand(collapsedHeight = COLLAPSED_CHART_HEIGHT): ChartExpand {
  const [expanded, setExpanded] = useState(false)
  const [fullHeight, setFullHeight] = useState(collapsedHeight)
  const chart = useRef<HTMLDivElement | null>(null)
  const footer = useRef<HTMLDivElement | null>(null)
  const isExpanded = useRef(false)

  const measure = useCallback(() => {
    const element = chart.current
    if (!element || element.clientWidth === 0) return
    const units = (fitHeightPx(element, footer.current) * WIDTH) / element.clientWidth
    setFullHeight((current) => (Math.abs(current - units) < 0.5 ? current : units))
  }, [])

  const attachChart = useCallback(
    (node: HTMLDivElement | null) => {
      chart.current = node
      if (!node) return
      // Độ rộng biểu đồ đổi (đổi bố cục trang) thì chiều cao theo đơn vị viewBox phải đo lại
      const observer = new ResizeObserver(() => {
        if (isExpanded.current) measure()
      })
      observer.observe(node)
      return () => observer.disconnect()
    },
    [measure]
  )
  const attachFooter = useCallback((node: HTMLDivElement | null) => {
    footer.current = node
  }, [])

  useEffect(() => {
    if (!expanded) return
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [expanded, measure])

  const toggle = () => {
    const next = !expanded
    const element = chart.current
    if (next && element) {
      measure()
      // Đỉnh biểu đồ đang khuất (ngoài màn hình hoặc dưới thanh tiêu đề ghim): cuộn nhẹ về đầu trang để thấy cả biểu đồ lẫn thanh chọn kỳ
      const pinned =
        document.querySelector('[data-page-header]')?.getBoundingClientRect().bottom ?? 0
      if (element.getBoundingClientRect().top < pinned) {
        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth'
        const scroller = scrollerOf(element)
        if (scroller) scroller.scrollTo({ top: 0, behavior })
        else window.scrollTo({ top: 0, behavior })
      }
    }
    isExpanded.current = next
    setExpanded(next)
  }

  const height = useTween(expanded ? fullHeight : collapsedHeight)
  return {
    expanded,
    toggle,
    height,
    chartBind: { ref: attachChart },
    footerBind: { ref: attachFooter },
  }
}

/** Bọc biểu đồ để hook đo vị trí và độ rộng thật của nó. */
export function ExpandableChart({
  expand,
  children,
}: {
  readonly expand: ChartExpand
  readonly children: React.ReactNode
}) {
  return <div {...expand.chartBind}>{children}</div>
}

/** Bọc phần phải luôn thấy khi phóng to (thanh chọn kỳ 1W … All): hook chừa đúng chiều cao + khoảng cách của nó. */
export function ExpandFooter({
  expand,
  children,
}: {
  readonly expand: ChartExpand
  readonly children: React.ReactNode
}) {
  return <div {...expand.footerBind}>{children}</div>
}

/** Nút tròn phóng to / thu gọn: cùng giao diện ở mọi trang (nền trắng khi đang phóng to). */
export function ExpandButton({ expand }: { readonly expand: ChartExpand }) {
  return (
    <IconButton
      icon={expand.expanded ? CollapseChartIcon : ExpandChartIcon}
      label={expand.expanded ? 'Shrink chart' : 'Expand chart'}
      variant="secondary"
      aria-pressed={expand.expanded}
      className={cn(
        'size-14 shrink-0 rounded-full transition-colors duration-200',
        expand.expanded && 'bg-foreground text-background hover:bg-foreground/90'
      )}
      onClick={expand.toggle}
    />
  )
}
