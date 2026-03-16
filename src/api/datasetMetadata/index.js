import { autobahnBackendService } from '@/utils/request'


export function getDatasetMetadataList(data) {
  return autobahnBackendService({
    url: '/api/v1/datasets/list',
    method: 'post',
    data
  })
}

export function getDatasetNameMap(data) {
  return autobahnBackendService({
    url: '/api/v1/datasets/name-map',
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

export function getDatasetPreview(data) {
  return autobahnBackendService({
    url: '/api/v1/datasets/preview',
    method: 'post',
    data
  })
}
