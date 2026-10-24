import type { QueryClient } from '@tanstack/react-query'

/**
 * Trạng thái dựng lại số liệu DẪN XUẤT của BE (expenditure, energy balance, goal progress, tổng hợp dinh dưỡng) sau khi ghi. Ghi xong BE đã dựng đồng bộ
 * cửa sổ gần nhất; chỉ khi quá ngân sách / lỗi / khoá bận thì có job nền (lưu trước khi trả lời ghi). `GET /derived-data/status` cho biết: Ready = số đã mới,
 * Updating = đang dựng (số cũ KHÔNG được hiện như số mới), Failed = BE dựng lỗi thật (khác lỗi mạng khi gọi status).
 */
export type DerivedState = 'Ready' | 'Updating' | 'Failed'

export interface DerivedStatus {
  readonly state: DerivedState
  readonly fromDate: string | null
  readonly toDate: string | null
  readonly attempt: number
  readonly updatedAt: string | null
  /**
   * Chỉ ở FE: id của lượt làm mới số dẫn xuất đang chờ sau Updating / Failed → Ready (0 / không có = không chờ) — màn vẫn mờ (số cũ / vừa huỷ chưa phải số
   * cuối). Là id chứ không phải true/false: chỉ lượt làm mới mang ĐÚNG id này mới được bỏ cờ. `UNCONFIRMED` (-1) = Ready cũ chưa được xác nhận lại sau một
   * lần ghi không có header (đang đọc lại status).
   */
  readonly settling?: number
}

/** Màn hiện gì: ready = số bình thường, updating = khung xám có sẵn, failed = ErrorState trong khối. */
export type DerivedGate = 'ready' | 'updating' | 'failed'

export const derivedStatusKey = ['derived-data', 'status'] as const

/** Hỏi lại trạng thái mỗi chừng này khi đang Updating (3 – 5 s); trang ẩn thì TanStack ngừng, quay lại thì tiếp tục. */
export const POLL_MS = 4000

/**
 * Các truy vấn mang số dẫn xuất: làm mới MỘT lần khi BE xong (Updating / Failed → Ready). Không gồm nhật ký món, cân thô, danh sách (BE ghi đồng bộ,
 * không cần chờ).
 */
export const DERIVED_KEYS = [
  ['expenditure'],
  ['energy-balance'],
  ['goals'],
  ['weights', 'trend'],
  ['nutrients'],
  ['nutrition-overview'],
  ['check-in'],
] as const

/** Ready cũ đang chờ đọc lại sau một lần ghi không có header: màn mờ tới khi status trả lời (thiếu header KHÔNG phải Ready). */
export const UNCONFIRMED = -1

/** Chu kỳ hỏi lại: chỉ khi đang Updating, hoặc Ready cũ chưa xác nhận được (lần đọc lại lỗi) — đọc được thì thôi. */
export const pollInterval = (status: DerivedStatus | undefined): number | false =>
  status?.state === 'Updating' || status?.settling === UNCONFIRMED ? POLL_MS : false

/**
 * Trạng thái màn từ lần đọc status CUỐI THÀNH CÔNG. Lỗi mạng khi gọi status giữ nguyên lần đọc cuối (không phải Failed); chưa đọc được lần nào thì hiện
 * bình thường (lỗi của từng truy vấn tự hiện theo cách thường).
 */
export const gateOf = (status: DerivedStatus | undefined): DerivedGate =>
  status?.state === 'Updating' || (status?.state === 'Ready' && status.settling)
    ? 'updating'
    : status?.state === 'Failed'
      ? 'failed'
      : 'ready'

const readyAgain = (previous: DerivedStatus | undefined, next: DerivedStatus) =>
  next.state === 'Ready' && (previous?.state === 'Updating' || previous?.state === 'Failed')

// Id của lượt làm mới gần nhất (tăng ở mỗi Updating / Failed → Ready)
let settleCycle = 0

/**
 * Trạng thái ghi vào cache: lượt Updating / Failed → Ready mới mang id `cycle` của nó; một Ready tới TRONG lúc đang chờ (đọc status khác, header của lần ghi
 * khác, Retry trả Ready) giữ id đang chờ — lượt làm mới đó sẽ bỏ cờ, không mở cổng sớm khi số mới chưa về.
 */
const settlingOf = (
  previous: DerivedStatus | undefined,
  next: DerivedStatus,
  cycle = 0
): DerivedStatus => {
  if (readyAgain(previous, next)) return { ...next, settling: cycle }
  // Chỉ giữ id của một lượt làm mới thật (> 0); Ready mới đọc được xác nhận luôn Ready `UNCONFIRMED`
  if (next.state === 'Ready' && previous?.state === 'Ready' && (previous.settling ?? 0) > 0)
    return { ...next, settling: previous.settling }
  return next
}

export type RefreshClient = Pick<
  QueryClient,
  'invalidateQueries' | 'cancelQueries' | 'refetchQueries' | 'removeQueries' | 'setQueryData'
>

// Một lần ghi không có header tới khi cache là Ready (kể cả đang trong một lượt làm mới): còn nợ một lần đọc status xác nhận. Chỉ một trạng thái BE trả
// SAU lần ghi đó (lần đọc status mới, header, câu trả lời của Retry) mới trả nợ
let rereadOwed = false

/**
 * Lượt làm mới `cycle` xong (thành công hay lỗi) → bỏ cờ nếu cache vẫn chờ ĐÚNG lượt này (một lượt cũ không mở cổng của lượt mới hơn). Lùi một nhịp: ở
 * đường đọc status, TanStack chỉ ghi kết quả của queryFn (mang `settling`) SAU khi queryFn trả về — bỏ cờ sớm hơn sẽ bị ghi đè. Còn nợ một lần xác nhận (ghi
 * không có header trong lúc làm mới, lần đọc lại chưa về / lỗi) thì về `UNCONFIRMED` (vẫn mờ, hỏi lại) chứ không mở cổng.
 */
const settleWhen = (client: RefreshClient, cycle: number, refreshes: readonly Promise<unknown>[]) =>
  void Promise.allSettled(refreshes).then(() =>
    setTimeout(
      () =>
        client.setQueryData<DerivedStatus>(derivedStatusKey, (current) =>
          current?.settling === cycle
            ? { ...current, settling: rereadOwed ? UNCONFIRMED : 0 }
            : current
        ),
      0
    )
  )

/**
 * Bắt đầu một lượt Updating / Failed → Ready: huỷ ngay các GET dẫn xuất đang bay (bắt đầu khi BE còn dựng lại, có thể mang số cũ). Phải huỷ TƯỜNG MINH:
 * `cancelRefetch` của TanStack chỉ huỷ truy vấn ĐÃ có dữ liệu — lần tải đầu đang bay sẽ bị dùng lại và số cũ thành số cuối. Lần tải đầu thì gửi lại ngay
 * (không nháy trạng thái rỗng; các lượt sau dùng lại request đó). Truy vấn không ai xem (hoặc đang tắt) thì bỏ khỏi cache: lần mở sau tải mới, không hiện
 * số trước-khi-dựng-lại như số cuối dưới cổng Ready. Trả về id của lượt.
 */
const startReadyCycle = (client: RefreshClient) => {
  for (const queryKey of DERIVED_KEYS) {
    void client.cancelQueries({ queryKey })
    client.removeQueries({ queryKey, type: 'inactive' })
    void client.refetchQueries({
      queryKey,
      type: 'active',
      predicate: (query) => query.state.data === undefined,
    })
  }
  return ++settleCycle
}

/**
 * Số dẫn xuất vừa mới xong (Updating / Failed → Ready, đọc từ status / Retry): bỏ các GET đọc trước khi BE xong, làm mới mọi truy vấn dẫn xuất đúng một lần,
 * cổng giữ 'updating' tới khi xong. Trả về id của lượt làm mới (0 = không có chuyển trạng thái).
 */
export function onStatusChange(
  client: RefreshClient,
  previous: DerivedStatus | undefined,
  next: DerivedStatus
): number {
  if (!readyAgain(previous, next)) return 0
  const cycle = startReadyCycle(client)
  settleWhen(
    client,
    cycle,
    DERIVED_KEYS.map((queryKey) => client.invalidateQueries({ queryKey }))
  )
  return cycle
}

const STATES: readonly DerivedState[] = ['Ready', 'Updating', 'Failed']

/** Giá trị header → trạng thái; thiếu hoặc lạ = null (KHÔNG coi là Ready: quay về hỏi `GET /derived-data/status`). */
export const parseDerivedState = (value: unknown): DerivedState | null =>
  STATES.find(
    (state) =>
      state.toLowerCase() ===
      String(value ?? '')
        .trim()
        .toLowerCase()
  ) ?? null

// Mỗi header áp vào cache tăng bộ đếm: một lần đọc status BẮT ĐẦU trước đó là bản cũ hơn header, không được ghi đè lên header mới hơn
let headerSeq = 0
// Lần ghi vừa rồi đã mang header: status không cần hỏi lại thêm một lần (hook ghi gọi `refreshDerivedStatus` ngay sau đó)
let headerCovered = false

/**
 * Áp header của một lần ghi: Ready / Updating / Failed vào cache status dùng chung (màn dẫn xuất đổi ngay, không chờ GET), Ready sau Updating / Failed làm
 * mới số dẫn xuất đúng một lần. Header thiếu / lạ thì KHÔNG giả định Ready: đánh dấu status cũ để đọc lại từ endpoint.
 */
export function applyDerivedHeader(client: StatusClient, value: unknown) {
  const state = parseDerivedState(value)
  // Cả hai nhánh đã lo status của lần ghi này (đặt trạng thái, hoặc đánh dấu cũ để đọc lại): `refreshDerivedStatus` trong onSuccess của CHÍNH lần ghi này
  // (chuỗi microtask ngay sau) không đọc thêm. Hết nhịp này thì bỏ cờ, để một lần làm mới sau (vd. ghi lỗi mạng, không có header) vẫn đọc status
  headerCovered = true
  setTimeout(() => {
    headerCovered = false
  }, 0)
  if (!state) {
    rereadStatus(client)
    return
  }
  applyDerivedState(client, state)
}

type RereadClient = Pick<QueryClient, 'invalidateQueries' | 'cancelQueries' | 'setQueryData'>

/**
 * Đọc lại status SAU lần ghi: huỷ lần đọc đang bay (nó có thể bắt đầu trước khi lần ghi xếp việc dựng lại — `cancelRefetch` của TanStack không huỷ lần đọc
 * đầu chưa có dữ liệu) rồi đọc mới; lần đọc bị huỷ trả về muộn thì bị bỏ (bộ đếm `statusReads`). Ready trong cache là của TRƯỚC lần ghi: đánh dấu chưa xác
 * nhận (`UNCONFIRMED`, màn mờ) tới khi lần đọc mới trả lời — kể cả khi không màn nào đang xem (màn mở sau thấy mờ ngay từ khung đầu).
 */
const rereadStatus = (client: RereadClient) => {
  statusReads += 1
  void client.cancelQueries({ queryKey: derivedStatusKey })
  client.setQueryData<DerivedStatus>(derivedStatusKey, (current) => {
    if (current?.state !== 'Ready') return current
    // Đang trong một lượt làm mới (id > 0): giữ id (lượt đó vẫn cần bỏ cờ), ghi nợ để lượt đó xong thì về UNCONFIRMED thay vì mở cổng
    rereadOwed = true
    return (current.settling ?? 0) > 0 ? current : { ...current, settling: UNCONFIRMED }
  })
  void client.invalidateQueries({ queryKey: derivedStatusKey })
}

/**
 * Trạng thái BE vừa báo (header của một lần ghi, hoặc 409 `DERIVED_DATA_*` của Accept check-in) → cache status dùng chung: màn dẫn xuất đổi ngay, vòng hỏi
 * chạy khi Updating, Ready sau Updating / Failed làm mới số dẫn xuất đúng một lần. Một lần đọc status bắt đầu trước đó không ghi đè lên trạng thái này.
 */
export function applyDerivedState(client: StatusClient, state: DerivedState) {
  headerSeq += 1
  rereadOwed = false
  const previous = client.getQueryData<DerivedStatus>(derivedStatusKey)
  const next: DerivedStatus = {
    state,
    fromDate: previous?.fromDate ?? null,
    toDate: previous?.toDate ?? null,
    attempt: previous?.attempt ?? 0,
    updatedAt: new Date().toISOString(),
  }
  if (!readyAgain(previous, next)) {
    client.setQueryData(derivedStatusKey, settlingOf(previous, next))
    return
  }
  // Ready sau Updating / Failed. Header tới trong interceptor, TRƯỚC onSuccess của hook ghi:
  // 1. huỷ ngay các GET dẫn xuất đang bay (bắt đầu khi BE còn dựng lại, có thể mang số cũ); lần tải đầu thì gửi lại ngay; bỏ cache không ai xem;
  // 2. hook làm mới các họ khoá của nó (request mới, sau header);
  // 3. lùi một nhịp, làm mới phần còn lại: dùng lại request mới đang chạy (`cancelRefetch: false`) và bỏ qua họ khoá đã có số mới hơn header (`<=`: cùng
  //    mili-giây vẫn làm mới) — mỗi họ khoá MỘT request, không request nào đọc trước khi BE xong được nhận làm số cuối; cổng mờ tới khi xong (`settling`)
  const cycle = startReadyCycle(client)
  client.setQueryData(derivedStatusKey, settlingOf(previous, next, cycle))
  const appliedAt = Date.now()
  setTimeout(() => {
    settleWhen(
      client,
      cycle,
      DERIVED_KEYS.map((queryKey) =>
        client.invalidateQueries(
          { queryKey, predicate: (query) => query.state.dataUpdatedAt <= appliedAt },
          { cancelRefetch: false }
        )
      )
    )
  }, 0)
}

/** Sau mỗi lần ghi ảnh hưởng số dẫn xuất: đọc status MỘT lần (không có người nghe thì đánh dấu cũ, màn dẫn xuất tới sau sẽ đọc lúc mở). Header đã báo thì bỏ qua. */
export function refreshDerivedStatus(client: RereadClient) {
  if (headerCovered) {
    headerCovered = false
    return
  }
  rereadStatus(client)
}

interface DerivedDataApi {
  readonly status: () => Promise<DerivedStatus | null>
  readonly retry: () => Promise<DerivedStatus | null>
}

export type StatusClient = RefreshClient & Pick<QueryClient, 'getQueryData'>

// Mỗi lần đọc status (và mỗi lần huỷ có chủ đích) tăng bộ đếm: một lần đọc trả về khi đã có lần đọc mới hơn là bản bị thay thế → bỏ, không chạy
// onStatusChange. Không dùng `signal` của TanStack: chạm vào getter đó đặt cờ cho CẢ truy vấn, khiến lần đọc sau bị huỷ khi màn cuối rời đi
let statusReads = 0

/** Đọc status và làm mới số dẫn xuất khi vừa xong; một nơi dùng chung cho mọi màn (cùng khoá nên một vòng hỏi cho cả app / mọi tab của trang). */
export async function readDerivedStatus(client: StatusClient, api: DerivedDataApi) {
  const seq = headerSeq
  const read = ++statusReads
  const next = await api.status()
  if (read !== statusReads) throw new DOMException('Superseded status read', 'AbortError')
  if (!next) throw new Error('Empty derived-data status')
  // Một lần ghi mới hơn báo header trong lúc GET này bay: kết quả GET là bản cũ, giữ cache (đã mang header mới) để không ghi đè lên số mới hơn
  if (seq !== headerSeq) {
    const newer = client.getQueryData<DerivedStatus>(derivedStatusKey)
    if (newer) return newer
  }
  // Lần đọc này bắt đầu SAU mọi lần ghi đã ghi nợ (lần đọc cũ hơn đã bị bỏ ở trên): nó xác nhận
  rereadOwed = false
  const previous = client.getQueryData<DerivedStatus>(derivedStatusKey)
  const cycle = onStatusChange(client, previous, next)
  return settlingOf(previous, next, cycle)
}

/**
 * "Try again": POST retry rồi lấy NGUYÊN trạng thái BE trả (thường Updating → vòng hỏi lại chạy tiếp). Retry lỗi thì ném ra và giữ nguyên Failed (màn không
 * quay mãi, nút vẫn bấm lại được).
 */
export async function retryDerived(client: StatusClient, api: DerivedDataApi) {
  const before = client.getQueryData<DerivedStatus>(derivedStatusKey)
  const next = await api.retry()
  if (!next) throw new Error('Empty derived-data status')
  // Trạng thái của Retry mới hơn mọi lần đọc status đang bay: lần đọc đó trả về muộn thì bị bỏ
  statusReads += 1
  // Trong lúc POST chờ, một lần đọc / header khác đã đổi cache: không biết câu trả lời nào mới hơn → không ghi đè, không mở lượt làm mới thứ hai; lần đọc
  // status sau Retry (onSettled của hook) quyết định
  const previous = client.getQueryData<DerivedStatus>(derivedStatusKey)
  if (previous !== before) return next
  rereadOwed = false
  const cycle = onStatusChange(client, previous, next)
  client.setQueryData(derivedStatusKey, settlingOf(previous, next, cycle))
  return next
}
