import { datasetMetadataService } from '@/utils/request'

export function getDatasetMetadataList(params) {
  return datasetMetadataService({
    url: '/datasets/list',
    method: 'get',
    params
  })
}
