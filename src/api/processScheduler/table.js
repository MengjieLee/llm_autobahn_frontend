import { processSchedulerService } from '@/utils/request'

export function getProcessSchedulerList(params) {
  return processSchedulerService({
    url: '/api/v1/jobs',
    method: 'get',
    params
  })
}
