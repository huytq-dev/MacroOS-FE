import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type { PhotoAngle, PhotoSessionsResponse } from '../types/progress-photos.types'

export const progressPhotosService = {
  sessions: () => apiCall.get<PhotoSessionsResponse>(apiRoutes.progressPhotos.sessions),
  upload: (payload: { file: Blob; angle: PhotoAngle; date: string; consent: boolean }) => {
    const form = new FormData()
    form.append('file', payload.file, `${payload.angle.toLowerCase()}.jpg`)
    form.append('angle', payload.angle)
    form.append('date', payload.date)
    form.append('consent', String(payload.consent))
    return apiCall.put(apiRoutes.progressPhotos.root, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  /** Bỏ `angle` = xoá cả ngày. */
  remove: (payload: { date: string; angle?: PhotoAngle }) =>
    apiCall.delete(apiRoutes.progressPhotos.root, { params: payload }),
}
