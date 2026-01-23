import { processSchedulerService } from '@/utils/request'

export function getProcessSchedulerList(params) {
  return processSchedulerService({
    url: '/api/v1/process_scheduler/jobs',
    method: 'get',
    params
  })
}

export function startProcessScheduler(data) {
  return processSchedulerService({
    url: `/api/v1/process_scheduler/jobs/`,
    method: 'post',
    data
  })
}

export function stopProcessScheduler(jobID) {
  return processSchedulerService({
    url: `/api/v1/process_scheduler/jobs/${jobID}/stop`,
    method: 'post',
  })
}
