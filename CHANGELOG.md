---
title: 变更记录
---


### 施工计划
* ✅ SQL Studio | 👷🏻‍♂️ 李梦杰
* ✅ Huggingface Dataviewer 组件 | 👷🏻‍♂️ 李梦杰
* 🚧 数据集纳管治理 | 👷🏻‍♂️ 李梦杰
* 数据 pipeline | TBD

### 更新记录
* v0.2.5 | feat(olap): 支持分钟级命中趋势 | 2026-04-03 | 李梦杰
* v0.2.4 | feat(olap): 优化任务列表布局 | 2026-04-03 | 李梦杰
* v0.2.3 | feat(olap): 优化分布式计算的性能 | 2026-04-01 | 李梦杰
* v0.1.11 | fix(olap): 优化 tokenize 模型过滤分桶在 bad case 的决策判断 | 2026-03-31 | 李梦杰
* v0.1.10 | feat(olap): 支持二进制模式读写及缓存拷贝提升序列化速度 | 2026-03-30 | 李梦杰
* v0.1.9 | feat(olap): 支持动态配置olap并发并修复S进程内存未释放 | 2026-03-28 | 李梦杰
* v0.1.8 | feat(olap): 优化 kv 模拟命中的序列化轨迹 | 2026-03-28 | 李梦杰
* v0.1.7 | feat(olap): 支持流式处理文件 IO 以避免 OOM | 2026-03-27 | 李梦杰
* v0.1.6 | feat(es): 支持并行 es 拉取和优化序列化钩子 | 2026-03-26 | 李梦杰
* v0.1.5 | fix(olap): 优化 olap 任务数据繁杂的视图 | 2026-03-26 | 李梦杰
* v0.1.3 | fix(olap): 优化 olap 请求 ACL 和布局 | 2026-03-25 | 李梦杰
* v0.1.2 | feat(olap): 新增 OLAP 页面 | 2026-03-24 | 李梦杰
* v0.1.1 | feat(permission): 支持页面+API 的 RBAC粒度控制 | 2026-03-23 | 李梦杰
* v0.1.0 | feat(auth): 支持前后端分离架构下零信任网关逻辑 | 2026-03-22 | 李梦杰
* v0.0.32 | feat(auth): 支持前后端跨域域名验证 | 2026-03-18 | 李梦杰
* v0.0.31 | fix(config): 更新脱敏规则的文件 | 2026-03-18 | 李梦杰
* v0.0.30 | feat(dashboardUsage): 支持使用频度的日期组件选择 | 2026-03-18 | 李梦杰
* v0.0.29 | fix(dashboard): 修复热门操作排序标签显示 | 2026-03-18 | 李梦杰
* v0.0.28 | feat(dashboard): 支持平台使用维度的展示 | 2026-03-17 | 李梦杰
* v0.0.27 | feat(SQL): 支持数据集名的可视化和SQL分析的交互 | 2026-03-16 | 李梦杰
* v0.0.26 | feat(datasetAnalysis): 新增数据集跳转 SQL 分析 | 2026-03-16 | 李梦杰
* v0.0.25 | fix(preview): 预览签名逻辑 | 2026-03-05 | 李梦杰
* v0.0.24 | fix(datasetsDetail): 修复单个索引文件的预览 | 2026-02-27 | 李梦杰
* v0.0.23 | feat(DatasetDetail): 可视化适配单独查阅批量的 Preview 文件 | 2026-02-09 | 李梦杰
* v0.0.22 | feat(Dataset): 新增数据集可视化组件并做适配 | 2026-02-09 | 李梦杰
* v0.0.21 | feat(DatasetDetail): 新增数据可视化页 | 2026-02-06 | 李梦杰
* v0.0.20 | feat(DatasetViwer): 封装 DatasetViwer 组件并适配到存量业务页面 | 2026-02-06 | 李梦杰
* v0.0.19 | feat(datasets): 数据集目录页新增分页并优化渲染效率 | 2026-02-05 | 李梦杰
* v0.0.18 | feat(datasets): 数据集目录页新增查看存储 | 2026-02-05 | 李梦杰
* v0.0.17 | feat(首页): 新增首页指标图表点击的跳转事件 | 2026-02-04 | 李梦杰
* v0.0.16 | feat(datasets): 新增数据集目录页 | 2026-02-04 | 李梦杰
* v0.0.15 | feat(首页): 添加 panelGroup 布局 | 2026-02-02 | 李梦杰
* v0.0.14 | feat(layout): 丰富页面布局 | 2026-02-02 | 李梦杰
* v0.0.13 | feat(layout): 移除冗余框架组件并精简 SQL detail content 样式 | 2026-01-26 | 李梦杰
* v0.0.12 | feat(sqlStudio): 完善sqlStudio动态字段展示 | 2026-01-23 | 李梦杰
* v0.0.11 | feat(sqlViewer): 切换正式后端服务联调并完善表格冷启动配置 | 2026-01-22 | 李梦杰
* v0.0.10 | fix(sqlViewer): 更新 SQL Viewer 排版 | 2026-01-14 | 李梦杰
* v0.0.9 | feat(SQLViewer): 基于 mock 数据实现 SQLViewer Layout | 2026-01-13 | 李梦杰
* v0.0.8 | feat(SQL): 实现 SQL 导出页 | 2026-01-07 | 李梦杰
* v0.0.7 | fix(auth): 兼容 http/https/localhost 不同环境下的 token 校验 | 2026-01-06 | 李梦杰
* v0.0.6 | feat(version): 新增 version 控制 | 2026-01-06 | 李梦杰
* v0.0.5 | feat(auth): 就绪 uuap 验证框架 | 2026-01-06 | 李梦杰
* v0.0.4 | feat(SQL): 新增 SQL Studio 导出页布局 | 2025-12-25 | 李梦杰
* v0.0.3 | feat(auth): add name in UserCenter | 2025-12-24 | 李梦杰
* v0.0.2 | fix(manifest): test repo user | 2025-12-24 | 李梦杰
* v0.0.1 | feat(manifest)setup default port for dev | 2025-12-18 | 李梦杰
