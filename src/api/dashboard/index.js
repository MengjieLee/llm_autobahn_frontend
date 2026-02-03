import { autobahnBackendService } from '@/utils/request'

export function getDatasetsMetrics(params) {
  return autobahnBackendService({
    url: '/api/v1/dashboard/datasets/metrics',
    method: 'get',
    params
  })
}

export function getUserMetrics(params) {
  return autobahnBackendService({
    url: '/api/v1/dashboard/users/metrics',
    method: 'get',
    params
  })
}
