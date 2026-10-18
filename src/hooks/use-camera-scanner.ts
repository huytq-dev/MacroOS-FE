'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'idle' | 'starting' | 'ready' | 'denied' | 'unsupported'

const DETECT_INTERVAL_MS = 400
/** Sau khi đọc được một mã, bỏ qua mã đó trong khoảng này để không tra lặp. */
const REPEAT_BLOCK_MS = 4000
const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']

interface BarcodeDetectorLike {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>
}
type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike

/**
 * Bật camera sau để quét. `active` = đang cần camera (tab Scan mở): bật khi true, tắt hẳn luồng khi false hoặc rời trang.
 * Có `onCode` và `detect` thì dùng `BarcodeDetector` của trình duyệt (Chrome/Android) đọc mã vạch EAN/UPC 8–14 chữ số; trình
 * duyệt không hỗ trợ (iOS Safari…) thì `detectorSupported` = false và người dùng nhập tay. Camera cần HTTPS (hoặc localhost).
 */
export function useCameraScanner({
  active,
  detect,
  onCode,
}: {
  readonly active: boolean
  readonly detect: boolean
  readonly onCode: (code: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const lastRef = useRef<{ code: string; at: number } | null>(null)
  const onCodeRef = useRef(onCode)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchOn, setTorchOn] = useState(false)

  useEffect(() => {
    onCodeRef.current = onCode
  }, [onCode])

  useEffect(() => {
    if (!active) return
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported')
      return
    }
    let cancelled = false
    setStatus('starting')
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          void video.play().catch(() => undefined)
        }
        const capabilities = stream.getVideoTracks()[0]?.getCapabilities?.() as
          { torch?: boolean } | undefined
        setTorchSupported(Boolean(capabilities?.torch))
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('denied')
      })
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setTorchOn(false)
      setStatus('idle')
    }
  }, [active])

  const Detector = (
    typeof window === 'undefined'
      ? undefined
      : (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
  ) as BarcodeDetectorCtor | undefined
  const detectorSupported = Boolean(Detector)

  useEffect(() => {
    if (!active || !detect || status !== 'ready' || !Detector) return
    const detector = new Detector({ formats: BARCODE_FORMATS })
    const timer = setInterval(() => {
      const video = videoRef.current
      if (!video || video.readyState < 2) return
      detector
        .detect(video)
        .then((codes) => {
          const code = codes.map((item) => item.rawValue).find((value) => /^\d{8,14}$/.test(value))
          if (!code) return
          const last = lastRef.current
          if (last && last.code === code && Date.now() - last.at < REPEAT_BLOCK_MS) return
          lastRef.current = { code, at: Date.now() }
          onCodeRef.current(code)
        })
        .catch(() => undefined)
    }, DETECT_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [active, detect, status, Detector])

  const toggleTorch = useCallback(() => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const next = !torchOn
    track
      .applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] })
      .then(() => setTorchOn(next))
      .catch(() => undefined)
  }, [torchOn])

  return { videoRef, status, torchSupported, torchOn, toggleTorch, detectorSupported }
}
