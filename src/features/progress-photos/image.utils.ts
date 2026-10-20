/** Tải ảnh từ URL (blob cục bộ hoặc URL có chữ ký cùng gốc); lỗi giải mã (vd. HEIC) thì reject. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not read this photo'))
    image.src = src
  })
}

export const OUTPUT_SIZE = 1080

export interface CropState {
  /** Số lần xoay 90° theo chiều kim đồng hồ (0–3). */
  readonly turns: number
  /** Phóng thêm so với mức vừa khít khung (≥ 1). */
  readonly zoom: number
  /** Dịch ảnh so với tâm khung (px màn hình). */
  readonly panX: number
  readonly panY: number
}

export const MAX_ZOOM = 5

/** Kích thước ảnh sau khi xoay `turns` lần 90°. */
export const rotatedSize = (image: { width: number; height: number }, turns: number) =>
  turns % 2 === 0
    ? { width: image.width, height: image.height }
    : { width: image.height, height: image.width }

/** Số px màn hình cho một px nguồn khi ảnh vừa phủ kín khung vuông `frame` px. */
export const coverScale = (
  image: { width: number; height: number },
  turns: number,
  frame: number
) => {
  const size = rotatedSize(image, turns)
  return frame / Math.min(size.width, size.height)
}

/** Giữ ảnh luôn phủ kín khung: pan không vượt quá phần ảnh thừa ra ngoài khung. */
export function clampPan(
  image: { width: number; height: number },
  state: Pick<CropState, 'turns' | 'zoom'>,
  frame: number,
  pan: { x: number; y: number }
) {
  const size = rotatedSize(image, state.turns)
  const scale = coverScale(image, state.turns, frame) * state.zoom
  const maxX = Math.max(0, (size.width * scale - frame) / 2)
  const maxY = Math.max(0, (size.height * scale - frame) / 2)
  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y)),
  }
}

/** Cắt vuông theo khung đang hiển thị → JPEG 1080×1080 (chất lượng 0.85). */
export async function renderCrop(
  image: HTMLImageElement,
  state: CropState,
  frame: number
): Promise<Blob> {
  const size = rotatedSize(image, state.turns)
  // Bước 1: xoay ảnh nguồn vào canvas trung gian
  const rotated = document.createElement('canvas')
  rotated.width = size.width
  rotated.height = size.height
  const rctx = rotated.getContext('2d')
  if (!rctx) throw new Error('Canvas is not available')
  rctx.translate(size.width / 2, size.height / 2)
  rctx.rotate((state.turns * Math.PI) / 2)
  rctx.drawImage(image, -image.width / 2, -image.height / 2)
  // Bước 2: lấy ô vuông đang nằm trong khung
  const scale = coverScale(image, state.turns, frame) * state.zoom
  const half = frame / scale / 2
  const cx = size.width / 2 - state.panX / scale
  const cy = size.height / 2 - state.panY / scale
  const out = document.createElement('canvas')
  out.width = OUTPUT_SIZE
  out.height = OUTPUT_SIZE
  const octx = out.getContext('2d')
  if (!octx) throw new Error('Canvas is not available')
  octx.fillStyle = '#000'
  octx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
  octx.drawImage(rotated, cx - half, cy - half, half * 2, half * 2, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
  return new Promise((resolve, reject) =>
    out.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not crop this photo'))),
      'image/jpeg',
      0.85
    )
  )
}

/** Màu trung bình (rgb) của ảnh, lấy mẫu trên canvas 24×24; dùng tô nền màn xem. Lỗi (ảnh khác gốc) thì trả null. */
export function dominantColor(image: HTMLImageElement): [number, number, number] | null {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 24
    canvas.height = 24
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(image, 0, 0, 24, 24)
    const { data } = ctx.getImageData(0, 0, 24, 24)
    let r = 0
    let g = 0
    let b = 0
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
    }
    const count = data.length / 4
    return [Math.round(r / count), Math.round(g / count), Math.round(b / count)]
  } catch {
    return null
  }
}
