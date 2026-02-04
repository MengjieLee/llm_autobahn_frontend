import { autobahnBackendService } from '@/utils/request'


export function getDatasetMetadataList(data) {
  return autobahnBackendService({
    url: '/api/v1/datasets/list',
    method: 'post',
    data
  })
}
