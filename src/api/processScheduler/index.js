import { processSchedulerService } from '@/utils/request'

export function getProcessSchedulerList(params) {
  return processSchedulerService({
    url: '/api/v1/jobs',
    method: 'get',
    params
  })
}

export function stopProcessScheduler(jobID) {
  return processSchedulerService({
    url: `/api/v1/jobs/${jobID}/stop`,
    method: 'post',
  })
}
