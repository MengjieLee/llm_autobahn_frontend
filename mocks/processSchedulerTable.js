import {
    response
  } from './response.js'
  // import { faker } from "@faker-js/faker/locale/zh_CN";
  import {
    faker
  } from "@faker-js/faker";
  
  import {
    users
  } from './config.js'
  import {
    formatDate
  } from '@/utils'
  
  function createRandomUser() {
    return {
      id: faker.string.uuid(),
      author: faker.internet.username(), // before version 9.1.0, use userName()
  
      title: faker.word.words({
        // count: {
        //   min: 5,
        //   max: 10
        // }
      }),
      status: faker.helpers.arrayElement(['published', 'draft', 'deleted']),
      display_time: formatDate('yyyy-MM-dd hh:mm:ss', faker.date.anytime({
        refDate: '2020-01-01T00:00:00.000Z'
      })), // '2020-12-13T22:45:10.252Z'
      pageviews: faker.number.int({
        max: 5000
      }),
  
      avatar: faker.image.avatar(),
      // registeredAt: faker.date.past(),
    };
  }
  
  const list = faker.helpers.multiple(createRandomUser, {
    count: 30,
  });
  
  export default [{
    path: '/processSchedulerTable/list',
    type: 'get',
    handler: async ({
      request
    }) => {
      const token = request.headers.get('token')
      const info = users[token]
  
      // mock error
      if (!info) {
        return response({
          status: -1,
        })
      }
  
      return response({
        body: {
          "err_code": 0,
          "err_msg": "操作成功",
          "data": [
              {
                  "id": "693fe3ad76b19c527a8ea52a",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where rand() < 0.00000063;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhonghanjun_20251215183834",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "SUCCESSED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693fe3ad76b19c527a8ea52a",
                  "created_at": "2025-12-15T18:32:13.022000",
                  "started_at": "2025-12-15T18:32:21.736000",
                  "finished_at": "2025-12-15T18:43:14.339000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-2b841fdf20ef4dc8931f1c84bd3aa9b5/jobs/"
              },
              {
                  "id": "693fb47876b19c527a8ea529",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where  lightning_quality_level = '中' limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhonghanjun_20251215151709",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "SUCCESSED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693fb47876b19c527a8ea529",
                  "created_at": "2025-12-15T15:10:48.081000",
                  "started_at": "2025-12-15T15:11:01.277000",
                  "finished_at": "2025-12-15T15:18:35.812000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-9071ad168d12479a807df0228480c077/jobs/"
              },
              {
                  "id": "693faf9e9555d06047e59309",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select unique_id, text from qianfan_bos_catalog.all_data.pretrain_common_deduped limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhengliwei_20251215145627",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhengliwei",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "SUCCESSED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693faf9e9555d06047e59309",
                  "created_at": "2025-12-15T14:50:06.783000",
                  "started_at": "2025-12-15T14:57:35.545000",
                  "finished_at": "2025-12-15T14:57:38.702000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-c75ece68326245c89c01739f84259ba9/jobs/"
              },
              {
                  "id": "693fab169555d06047e59308",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where lightning_quality_level = '高' limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhengliwei_20251215143707",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhengliwei",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "SUCCESSED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693fab169555d06047e59308",
                  "created_at": "2025-12-15T14:30:46.468000",
                  "started_at": "2025-12-15T14:38:31.036000",
                  "finished_at": "2025-12-15T14:38:34.196000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-b127427a6e334c89bb16cfafc5b7cbc2/jobs/"
              },
              {
                  "id": "693fa6e99555d06047e59307",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where  lightning_quality_level = '高' limit 100;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhonghanjun_20251215141918",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "SUCCESSED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693fa6e99555d06047e59307",
                  "created_at": "2025-12-15T14:12:57.649000",
                  "started_at": "2025-12-15T14:21:35.959000",
                  "finished_at": "2025-12-15T14:21:39.115000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-29eef11fa8794144a9bedde8702be3e3/jobs/"
              },
              {
                  "id": "693f9f8ba8674310b1a6a549",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where  lightning_quality_level = '高' limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhonghanjun_20251215134751",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "SUCCESSED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693f9f8ba8674310b1a6a549",
                  "created_at": "2025-12-15T13:41:31.320000",
                  "started_at": "2025-12-15T13:49:36.954000",
                  "finished_at": "2025-12-15T13:49:40.106000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-6f755339212f48c0985e361878670e50/jobs/"
              },
              {
                  "id": "693f9ec7714fdd3852d27d78",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where  lightning_quality_level = '高' limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhonghanjun_20251215134436",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "FAILED",
                  "cluster_job_id": null,
                  "created_at": "2025-12-15T13:38:15.501000",
                  "started_at": "2025-12-15T13:38:17.944000",
                  "finished_at": "2025-12-15T13:38:18.119000",
                  "message": null,
                  "dashboard": null
              },
              {
                  "id": "693f9e75e91ff4a2cf84b3a0",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where  lightning_quality_level = '高' limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhonghanjun_20251215134314",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "FAILED",
                  "cluster_job_id": null,
                  "created_at": "2025-12-15T13:36:53.955000",
                  "started_at": "2025-12-15T13:36:54.426000",
                  "finished_at": "2025-12-15T13:36:54.600000",
                  "message": null,
                  "dashboard": null
              },
              {
                  "id": "693f9e6445b3cad1f9474a5e",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where  lightning_quality_level = '高' limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhonghanjun_20251215134257",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "STOPPED",
                  "cluster_job_id": null,
                  "created_at": "2025-12-15T13:36:36.490000",
                  "started_at": "2025-12-15T13:36:36.678000",
                  "finished_at": "2025-12-15T17:49:48.937000",
                  "message": null,
                  "dashboard": null
              },
              {
                  "id": "693f9db51cc0f51be7e46fb2",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where  lightning_quality_level = '高' limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhonghanjun_20251215134001",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "FAILED",
                  "cluster_job_id": null,
                  "created_at": "2025-12-15T13:33:41.130000",
                  "started_at": "2025-12-15T13:33:42.150000",
                  "finished_at": "2025-12-15T13:33:42.323000",
                  "message": null,
                  "dashboard": null
              },
              {
                  "id": "693f9d63c606dd7ff1deedba",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where  lightning_quality_level = '高' limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhonghanjun_20251215133839",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "FAILED",
                  "cluster_job_id": null,
                  "created_at": "2025-12-15T13:32:19.109000",
                  "started_at": "2025-12-15T13:32:21.218000",
                  "finished_at": "2025-12-15T13:32:21.395000",
                  "message": null,
                  "dashboard": null
              },
              {
                  "id": "693f9c29aac897750221212d",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where  lightning_quality_level = '高' limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhonghanjun_20251215133326",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "FAILED",
                  "cluster_job_id": null,
                  "created_at": "2025-12-15T13:27:05.882000",
                  "started_at": "2025-12-15T13:27:07.212000",
                  "finished_at": "2025-12-15T13:27:07.387000",
                  "message": null,
                  "dashboard": null
              },
              {
                  "id": "693f98247b0bdf27bc73cdcf",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "elect * from qianfan_bos_catalog.all_data.pretrain_common_deduped where  lightning_quality_level = '高' limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhonghanjun_20251215131617",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "FAILED",
                  "cluster_job_id": null,
                  "created_at": "2025-12-15T13:09:56.666000",
                  "started_at": "2025-12-15T13:09:57.004000",
                  "finished_at": "2025-12-15T13:09:57.031000",
                  "message": null,
                  "dashboard": null
              },
              {
                  "id": "693f928b7b0bdf27bc73cdce",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where  lightning_quality_level = '高' limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhengliwei_20251215125223",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhengliwei",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "FAILED",
                  "cluster_job_id": null,
                  "created_at": "2025-12-15T12:46:03.352000",
                  "started_at": "2025-12-15T12:46:03.914000",
                  "finished_at": "2025-12-15T12:46:03.941000",
                  "message": null,
                  "dashboard": null
              },
              {
                  "id": "693f91067b0bdf27bc73cdcd",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhengliwei_20251215124555",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhengliwei",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "SUCCESSED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693f91067b0bdf27bc73cdcd",
                  "created_at": "2025-12-15T12:39:34.781000",
                  "started_at": "2025-12-15T12:46:50.776000",
                  "finished_at": "2025-12-15T12:46:53.933000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-3df6357e0e6d4af0857c060aacca5603/jobs/"
              },
              {
                  "id": "693f90f07b0bdf27bc73cdcc",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where lightning_quality_level = '高' limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhengliwei_20251215124532",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhengliwei",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "FAILED",
                  "cluster_job_id": null,
                  "created_at": "2025-12-15T12:39:12.430000",
                  "started_at": "2025-12-15T12:39:12.852000",
                  "finished_at": "2025-12-15T12:39:12.878000",
                  "message": null,
                  "dashboard": null
              },
              {
                  "id": "693f908e7b0bdf27bc73cdcb",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where lightning_quality_level = '高' limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhengliwei_20251215124355",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhengliwei",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "FAILED",
                  "cluster_job_id": null,
                  "created_at": "2025-12-15T12:37:34.990000",
                  "started_at": "2025-12-15T12:37:35.554000",
                  "finished_at": "2025-12-15T12:37:35.581000",
                  "message": null,
                  "dashboard": null
              },
              {
                  "id": "693f8a717b0bdf27bc73cdca",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhengliwei_20251215121750",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhengliwei",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "SUCCESSED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693f8a717b0bdf27bc73cdca",
                  "created_at": "2025-12-15T12:11:29.980000",
                  "started_at": "2025-12-15T12:25:29.357000",
                  "finished_at": "2025-12-15T12:25:32.506000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-35a4d5d11fa84ff080dfdbb0218c940d/jobs/"
              },
              {
                  "id": "693f89687b0bdf27bc73cdc9",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where rand() < 0.00000063;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhonghanjun_20251215121324",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "SUCCESSED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693f89687b0bdf27bc73cdc9",
                  "created_at": "2025-12-15T12:07:04.596000",
                  "started_at": "2025-12-15T12:19:51.639000",
                  "finished_at": "2025-12-15T12:19:54.789000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-ba99e726f0e0469d9ddf8ab024591945/jobs/"
              },
              {
                  "id": "693f88387b0bdf27bc73cdc8",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.infovqa_v0 where rand() < 0.00000063;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhonghanjun_20251215120821",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "FAILED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693f88387b0bdf27bc73cdc8",
                  "created_at": "2025-12-15T12:02:00.940000",
                  "started_at": "2025-12-15T12:02:36.730000",
                  "finished_at": "2025-12-15T12:02:43.046000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-fde08add2e224f7489b148c819169bb4/jobs/"
              },
              {
                  "id": "693f84eb24e4349302b019d5",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where language = \"zh\" limit 1000;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhonghanjun_20251215115415",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "SUCCESSED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693f84eb24e4349302b019d5",
                  "created_at": "2025-12-15T11:47:55.099000",
                  "started_at": "2025-12-15T11:51:02.142000",
                  "finished_at": "2025-12-15T11:56:49.166000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-3dc1841fa95a4c20986b97d1b07bab65/jobs/"
              },
              {
                  "id": "693f845f24e4349302b019d4",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped where language = 'zh' limit 1000;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/zhonghanjun_20251215115155",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "FAILED",
                  "cluster_job_id": null,
                  "created_at": "2025-12-15T11:45:35.548000",
                  "started_at": "2025-12-15T11:45:35.980000",
                  "finished_at": "2025-12-15T11:45:36.006000",
                  "message": null,
                  "dashboard": null
              },
              {
                  "id": "693bf0da24e4349302b019d3",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.infovqa_v0 limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/limengjie_20251212183922",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "limengjie",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "FAILED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693bf0da24e4349302b019d3",
                  "created_at": "2025-12-12T18:39:22.713000",
                  "started_at": "2025-12-12T18:39:51.891000",
                  "finished_at": "2025-12-12T18:39:55.045000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-c4b0b19aeee34600befda441dc4b5b7b/jobs/"
              },
              {
                  "id": "693beefd24e4349302b019d2",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.infovqa_v0 limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/limengjie_20251212183125",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "limengjie",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "FAILED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693beefd24e4349302b019d2",
                  "created_at": "2025-12-12T18:31:25.551000",
                  "started_at": "2025-12-12T18:31:54.766000",
                  "finished_at": "2025-12-12T18:31:57.926000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-a58e3993f4b3473a952d10fe6bff347f/jobs/"
              },
              {
                  "id": "693be49024e4349302b019d1",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.infovqa_v0 limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/limengjie_20251212175304",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "limengjie",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "FAILED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693be49024e4349302b019d1",
                  "created_at": "2025-12-12T17:46:56.876000",
                  "started_at": "2025-12-12T17:47:26.126000",
                  "finished_at": "2025-12-12T17:47:29.283000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-05e44896693f4d4aaee78fc6aef2c9ad/jobs/"
              },
              {
                  "id": "693bdc8f24e4349302b019d0",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/limengjie_20251212171854",
                      "exec_num": "80"
                  },
                  "queue": "kubespark",
                  "user": "limengjie",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "SUCCESSED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693bdc8f24e4349302b019d0",
                  "created_at": "2025-12-12T17:12:47.747000",
                  "started_at": "2025-12-12T17:20:38.308000",
                  "finished_at": "2025-12-12T17:20:41.459000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-1dd736dd8bc44786923bea84dafd5ead/jobs/"
              },
              {
                  "id": "693bc43524e4349302b019cf",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/limengjie_20251212152853",
                      "exec_num": 80
                  },
                  "queue": "kubespark",
                  "user": "limengjie",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "SUCCESSED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693bc43524e4349302b019cf",
                  "created_at": "2025-12-12T15:28:53.221000",
                  "started_at": "2025-12-12T15:38:19.690000",
                  "finished_at": "2025-12-12T15:38:22.852000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-17c2a738f3eb4fc28a13c8c7ff43aae1/jobs/"
              },
              {
                  "id": "693b8d6124e4349302b019ce",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/limengjie_20251212113457",
                      "exec_num": 80
                  },
                  "queue": "kubespark",
                  "user": "limengjie",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "STOPPED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693b8d6124e4349302b019ce",
                  "created_at": "2025-12-12T11:34:57.810000",
                  "started_at": "2025-12-12T11:36:46.980000",
                  "finished_at": "2025-12-12T11:36:49.273000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-c3e1bd0345f74b79aa738e128654395a/jobs/"
              },
              {
                  "id": "693b8b0c24e4349302b019cd",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "-- 选中的表中为 fsc147_v0\nselect * from qianfan_bos_catalog.all_data.fsc147_v0 limit 10;\n",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/limengjie_20251212112500",
                      "exec_num": 80
                  },
                  "queue": "kubespark",
                  "user": "limengjie",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "FAILED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693b8b0c24e4349302b019cd",
                  "created_at": "2025-12-12T11:25:00.529000",
                  "started_at": "2025-12-12T11:25:49.881000",
                  "finished_at": "2025-12-12T11:25:56.199000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-bbf3e9dbd5934974a04b30d5c0137051/jobs/"
              },
              {
                  "id": "693aac1724e4349302b019cc",
                  "name": "spark-export-iceberg-1211-hj-4",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.infovqa_v1 limit 100;",
                      "output": "bos://llm-data-process/zhonghanjun/tmp/1210bbb/test_dedup_100_2.parquet",
                      "exec_num": 100
                  },
                  "queue": "kubespark",
                  "user": "limengjie",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "SUCCESSED",
                  "cluster_job_id": "sp-spark-export-iceberg-1211-hj-4-693aac1724e4349302b019cc",
                  "created_at": "2025-12-11T19:33:43.323000",
                  "started_at": "2025-12-11T19:34:33.291000",
                  "finished_at": "2025-12-11T19:34:36.445000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-9c0d37f7d4254895b137d1350784f76d/jobs/"
              },
              {
                  "id": "693aa85e5201ae5c82d3eaba",
                  "name": "spark-export-iceberg-1211-hj-3",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.infovqa_v0 limit 100;",
                      "output": "bos://llm-data-process/zhonghanjun/tmp/1210bbb/test_dedup_100_2.parquet",
                      "exec_num": 100
                  },
                  "queue": "kubespark",
                  "user": "limengjie",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "UNKNOWN",
                  "cluster_job_id": "sp-spark-export-iceberg-1211-hj-3-693aa85e5201ae5c82d3eaba",
                  "created_at": "2025-12-11T19:17:50.759000",
                  "started_at": "2025-12-11T19:18:25.021000",
                  "finished_at": null,
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-da65596018ad4169a1633b977a312fc7/jobs/"
              },
              {
                  "id": "693aa7bf5201ae5c82d3eab9",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.infovqa_v0 limit 20;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/limengjie_20251211191511",
                      "exec_num": 80
                  },
                  "queue": "kubespark",
                  "user": "limengjie",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "RUNNING",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693aa7bf5201ae5c82d3eab9",
                  "created_at": "2025-12-11T19:15:11.995000",
                  "started_at": "2025-12-11T19:15:42.754000",
                  "finished_at": null,
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-ac1a2936ec154b9491df94ec47a1aadc/jobs/"
              },
              {
                  "id": "693aa7555201ae5c82d3eab8",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.infovqa_v0 limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/limengjie_20251211191325",
                      "exec_num": 80
                  },
                  "queue": "kubespark",
                  "user": "limengjie",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "UNKNOWN",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693aa7555201ae5c82d3eab8",
                  "created_at": "2025-12-11T19:13:25.532000",
                  "started_at": "2025-12-11T19:14:01.160000",
                  "finished_at": null,
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-21bef9d944c74d4c8fc63bc0b5de0b78/jobs/"
              },
              {
                  "id": "693aa4e05201ae5c82d3eab7",
                  "name": "spark-export-iceberg-1211-hj-2",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped limit 100;",
                      "output": "bos://llm-data-process/zhonghanjun/tmp/1210bbb/test_dedup_100_1.parquet",
                      "exec_num": 100
                  },
                  "queue": "kubespark",
                  "user": "limengjie",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "SUCCESSED",
                  "cluster_job_id": "sp-spark-export-iceberg-1211-hj-2-693aa4e05201ae5c82d3eab7",
                  "created_at": "2025-12-11T19:02:56.420000",
                  "started_at": "2025-12-11T19:11:55.999000",
                  "finished_at": "2025-12-11T19:11:59.152000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-97be83e7263e411cbaba6f284ca8d77a/jobs/"
              },
              {
                  "id": "693a9ca35201ae5c82d3eab6",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.infovqa_v0 limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/limengjie_20251211182747",
                      "exec_num": 80
                  },
                  "queue": "kubespark",
                  "user": "limengjie",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "STOPPED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693a9ca35201ae5c82d3eab6",
                  "created_at": "2025-12-11T18:27:47.704000",
                  "started_at": "2025-12-11T18:28:18.646000",
                  "finished_at": "2025-12-11T19:57:16.840000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-4cef28fd1d264531bf23f5cc6f6c14ba/jobs/"
              },
              {
                  "id": "693a9afa5201ae5c82d3eab5",
                  "name": "spark-export-iceberg-5",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.infovqa_v0 limit 10;",
                      "output": "bos://llm-data-process/workspace/mnt/cfs_bj_mt/share/sql_export/limengjie_20251211182042",
                      "exec_num": 158
                  },
                  "queue": "kubespark",
                  "user": "limengjie",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "STOPPED",
                  "cluster_job_id": "sp-spark-export-iceberg-5-693a9afa5201ae5c82d3eab5",
                  "created_at": "2025-12-11T18:20:42.393000",
                  "started_at": "2025-12-11T18:21:28.424000",
                  "finished_at": "2025-12-11T19:14:48.257000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-fc6f9c7a67104194b596bb2b5896ff09/jobs/"
              },
              {
                  "id": "6939613f0b7a1a22ee11eff8",
                  "name": "spark-export-iceberg-1210-1",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped limit 100;",
                      "output": "bos://llm-data-process/zhonghanjun/tmp/1210bbb/test_dedup_100_1.parquet",
                      "exec_num": 3
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "STOPPED",
                  "cluster_job_id": "sp-spark-export-iceberg-1210-1-6939613f0b7a1a22ee11eff8",
                  "created_at": "2025-12-10T20:02:07.368000",
                  "started_at": "2025-12-10T20:13:27.218000",
                  "finished_at": "2025-12-10T20:13:29.305000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-6cb7a932916d4f3db02ad426fe96b3ab/jobs/"
              },
              {
                  "id": "693961160b7a1a22ee11eff7",
                  "name": "spark-export-iceberg-1210-1",
                  "pipeline_id": "693928853e44d2c75bccb450",
                  "parameters": {
                      "name": "danielexport",
                      "sql": "select * from qianfan_bos_catalog.all_data.pretrain_common_deduped limit 100;",
                      "output": "bos://llm-data-process/zhonghanjun/tmp/1210bbb/test_dedup_100_1.parquet",
                      "exec_num": 3
                  },
                  "queue": "kubespark",
                  "user": "zhonghanjun",
                  "groups": [
                      "official",
                      "group_a"
                  ],
                  "status": "STOPPED",
                  "cluster_job_id": "sp-spark-export-iceberg-1210-1-693961160b7a1a22ee11eff7",
                  "created_at": "2025-12-10T20:01:26.318000",
                  "started_at": "2025-12-10T20:13:39.215000",
                  "finished_at": "2025-12-10T20:13:39.420000",
                  "message": null,
                  "dashboard": "http://10.178.224.5:8081/history/spark-0d03acb6ec6e4e43ba0d5143e0d9b1f6/jobs/"
              }
          ]
      }
      })
    }
  }, ]
  