import request from '@/utils/request'

export function getProcessSchedulerList(params) {
  return request({
    url: '/processSchedulerTable/list',
    method: 'get',
    params
  })
}
