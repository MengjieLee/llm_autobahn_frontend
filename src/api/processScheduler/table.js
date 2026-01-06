import { processSchedulerService } from '@/utils/request'

export function getProcessSchedulerList(params) {
  return processSchedulerService({
    url: '/processSchedulerTable/list',
    method: 'get',
    params
  })
}
