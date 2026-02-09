import { autobahnBackendService } from '@/utils/request'


export function getDatasetMetadataList(data) {
  return autobahnBackendService({
    url: '/api/v1/datasets/list',
    method: 'post',
    data
  })
}

export function getDatasetDetail(params) {
  return autobahnBackendService({
    url: '/api/v1/datasets/detail',
    method: 'get',
    params
  })
}
