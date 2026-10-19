import { apiCall } from '@/lib/api'
import { apiRoutes } from '@/config/api-routes'
import type {
  FullBodyData,
  FullBodyRequest,
  PhotoAngle,
  ProgressPhotosData,
} from '../types/body-metrics.types'

export const bodyMetricsService = {
  getFullBody: (date: string) =>
    apiCall.get<FullBodyData>(apiRoutes.bodyMetrics.fullBody, { params: { date } }),
  saveFullBody: (payload: FullBodyRequest) =>
    apiCall.put<FullBodyData>(apiRoutes.bodyMetrics.fullBody, payload),
  deleteFullBody: (date: string) =>
    apiCall.delete(apiRoutes.bodyMetrics.fullBody, { params: { date } }),

  getPhotos: (date: string) =>
    apiCall.get<ProgressPhotosData>(apiRoutes.progressPhotos.root, { params: { date } }),
  uploadPhoto: (payload: { file: File; angle: PhotoAngle; date: string; consent: boolean }) => {
    const form = new FormData()
    form.append('file', payload.file)
    form.append('angle', payload.angle)
    form.append('date', payload.date)
    form.append('consent', String(payload.consent))
    return apiCall.put(apiRoutes.progressPhotos.root, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deletePhotos: (date: string) =>
    apiCall.delete(apiRoutes.progressPhotos.root, { params: { date } }),
}
