import { autobahnBackendService } from '@/utils/request'

// TODO
export function getDatasetMetadataList(params) {
  return autobahnBackendService({
    url: '/datasets/list',
    method: 'get',
    params
  })
}
