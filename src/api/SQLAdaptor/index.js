import { SQLWrapperService } from '@/utils/request'

export function postSQLQuery(data) {
  return SQLWrapperService({
    url: '/api/v1/sql/sql_query',
    method: 'post',
    data
  })
}
