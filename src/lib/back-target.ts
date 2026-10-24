import { routePath } from '@/config/route-path'

// Mọi trang có thật trong routePath: chuỗi tĩnh, và trang động (`dashboardNutrient(key)`…) thành regex một đoạn bất kỳ
const STATIC = new Set<string>(Object.values(routePath).filter((v) => typeof v === 'string'))
const DYNAMIC = Object.values(routePath)
  .filter((v): v is (key: string) => string => typeof v === 'function')
  .map(
    (fn) =>
      new RegExp(
        `^${fn('\u0000')
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace('\u0000', '[^/]+')}$`
      )
  )

const exists = (path: string) => STATIC.has(path) || DYNAMIC.some((regex) => regex.test(path))

/** Trang cha gần nhất CÓ THẬT của một đường dẫn (bỏ dần từng đoạn cuối); không còn đoạn nào thì Dashboard. */
export const parentRoute = (pathname: string): string => {
  let path = pathname.split(/[?#]/)[0].replace(/\/$/, '')
  while (path.lastIndexOf('/') > 0) {
    path = path.slice(0, path.lastIndexOf('/'))
    if (exists(path)) return path
  }
  return routePath.dashboard
}

// Các trang ĐÃ ĐI TRONG APP ở tab này (bộ nhớ: tải lại / mở link thẳng là bắt đầu lại). `history.length` không dùng được: nó đếm cả trang ngoài
// app và các trang "phía trước" sau khi lùi. Đổi trang về đúng trang liền trước = lùi (bỏ trang cuối), còn lại = đi tới.
// ponytail: đoán theo đường dẫn, đi tới đúng trang vừa rời bị hiểu là lùi; muốn chính xác thì dùng Navigation API khi mọi trình duyệt có.
const visited: string[] = []

/** Gọi mỗi khi đường dẫn đổi (layout của vùng đã đăng nhập). */
export const trackPath = (pathname: string) => {
  if (visited.at(-1) === pathname) return
  if (visited.at(-2) === pathname) visited.pop()
  else visited.push(pathname)
}

/** Có trang trước TRONG APP để `router.back()` (không thì lùi sẽ ra khỏi app hoặc không làm gì). */
export const hasInAppBack = () => visited.length > 1

/**
 * Nút Back: có trang trước trong app thì lùi lịch sử; mở thẳng bằng link / tab mới thì THAY trang này bằng trang cha có thật (replace, không
 * push: trang cha không "lùi" ngược vào trang con), và bỏ trang này khỏi danh sách để Back ở trang cha cũng đi lên tiếp.
 */
export const goBack = (
  router: { back: () => void; replace: (href: string) => void },
  pathname: string
) => {
  if (hasInAppBack()) {
    router.back()
    return
  }
  visited.pop()
  router.replace(parentRoute(pathname))
}
