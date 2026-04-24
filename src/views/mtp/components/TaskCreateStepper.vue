<template>
  <el-dialog
    v-model="visible"
    title="新建评测任务"
    width="70%"
    style="min-width: 900px"
    :close-on-click-modal="false"
    destroy-on-close
    @closed="resetAll"
  >
    <!-- 步骤指示器 -->
    <el-steps :active="step" finish-status="success" simple style="margin-bottom: 24px">
      <el-step title="连接器" />
      <el-step title="服务配置" />
      <el-step title="基准测试" />
      <el-step title="确认发起" />
    </el-steps>

    <!-- Step 1: 连接器 -->
    <div v-show="step === 0">
      <!-- 已有连接器 -->
      <div class="section-title">
        <span class="required-star">*</span> 已有连接器
        <el-tag v-if="connectors.length" size="small" round type="info" class="count-badge">{{ connectors.length }}</el-tag>
      </div>
      <div class="card-select-grid">
        <div
          v-for="c in connectors"
          :key="c.id"
          class="select-card"
          :class="{ active: form.connector_id === c.id }"
          @click="selectConnector(c)"
        >
          <div class="select-card-name">{{ c.name }}</div>
          <div class="select-card-desc">{{ c.kind }}</div>
        </div>
        <div v-if="!connectors.length && !loadingConnectors" class="select-card empty">暂无连接器</div>
      </div>

      <!-- 官方预设模板 -->
      <div class="preset-panel">
        <div class="section-title preset-title">👑 官方预设模板</div>
        <div class="card-select-grid">
          <div
            v-for="p in connectorPresets"
            :key="p.id"
            class="select-card preset"
            @click="showPresetForm(p)"
          >
            <span class="preset-badge">👑</span>
            <div class="select-card-name">+ {{ p.name }}</div>
            <div class="select-card-desc">{{ p.connector?.kind || p.kind }}</div>
          </div>
        </div>
      </div>

      <!-- 预设创建表单 -->
      <el-dialog
        v-model="presetDialogVisible"
        title="从预设创建连接器"
        width="500px"
        append-to-body
      >
        <el-form :model="presetForm" label-width="100px">
          <el-form-item label="名称" required>
            <el-input v-model="presetForm.name" />
          </el-form-item>
          <el-form-item label="类型" required>
            <el-input v-model="presetForm.kind" disabled />
          </el-form-item>
          <el-form-item label="Repo Root" required>
            <el-input v-model="presetForm.repo_root" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="Work Root" required>
            <el-input v-model="presetForm.work_root" type="textarea" :rows="2" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="presetDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="creatingConnector" @click="doCreateConnector">创建</el-button>
        </template>
      </el-dialog>
    </div>

    <!-- Step 2: 服务配置 -->
    <div v-show="step === 1">
      <div class="section-title">
        <span class="required-star">*</span> Load Service Config
      </div>
      <div class="svc-select-row">
        <el-select
          v-model="selectedProfileId"
          placeholder="选择已有的 Service Config"
          clearable
          filterable
          style="flex: 1"
          @change="onProfileSelect"
        >
          <el-option
            v-for="p in serviceProfiles"
            :key="p.id || p.name"
            :label="p.name"
            :value="p.id || p.name"
          />
        </el-select>
        <el-button @click="openCreateProfile" title="新建 Service Config">➕</el-button>
      </div>

      <!-- JSON Editor -->
      <div class="svc-editor-wrap">
        <div class="svc-editor-toolbar">
          <span class="editor-label">service config</span>
          <span v-if="serviceConfigError" class="editor-error">{{ serviceConfigError }}</span>
          <el-button link size="small" @click="formatServiceConfig">格式化</el-button>
        </div>
        <textarea
          v-model="serviceConfigText"
          class="svc-code-editor"
          spellcheck="false"
          rows="18"
          placeholder='选择 Service Config 后在此编辑，或直接输入 JSON'
          @input="validateServiceConfig"
        />
      </div>

      <!-- 创建 Service Config 对话框 -->
      <el-dialog
        v-model="profileCreateVisible"
        title="新建 Service Config"
        width="700px"
        append-to-body
        :close-on-click-modal="false"
      >
        <el-form label-width="100px">
          <el-form-item label="名称" required>
            <el-input v-model="profileCreateForm.name" placeholder="输入模板名称" />
          </el-form-item>
          <el-form-item label="基础模板" required>
            <el-select
              v-model="profileCreateForm.presetId"
              placeholder="从 Service Preset 选择起点"
              filterable
              style="width: 100%"
              @change="onPresetBaseChange"
            >
              <el-option
                v-for="p in servicePresets"
                :key="p.id"
                :label="p.name"
                :value="p.id"
              >
                <span>{{ p.name }}</span>
                <span style="color: #909399; font-size: 12px; margin-left: 8px">{{ p.description }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="配置内容" required>
            <textarea
              v-model="profileCreateForm.configText"
              class="svc-code-editor in-dialog"
              spellcheck="false"
              rows="16"
              placeholder="选择基础模板后可在此自定义编辑"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="profileCreateVisible = false">取消</el-button>
          <el-button type="primary" :loading="creatingProfile" @click="doCreateProfile">保存</el-button>
        </template>
      </el-dialog>
    </div>

    <!-- Step 3: 基准测试 -->
    <div v-show="step === 2">
      <el-form label-width="100px">
        <el-form-item label="快速选择">
          <el-select
            v-model="selectedTaskPreset"
            placeholder="从任务预设加载"
            clearable
            filterable
            style="width: 300px"
            @change="applyTaskPreset"
          >
            <el-option
              v-for="p in taskPresets"
              :key="p.name"
              :label="p.name"
              :value="p.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="基准测试" required>
          <el-transfer
            :key="transferKey"
            v-model="selectedBenches"
            :data="benchTransferData"
            :titles="['可选基准', '已选基准']"
            :right-default-checked="selectedBenches"
            :filter-method="benchFilterMethod"
            filterable
            filter-placeholder="搜索基准测试"
            class="bench-transfer"
          />
        </el-form-item>
      </el-form>
    </div>

    <!-- Step 4: 确认 -->
    <div v-show="step === 3">
      <el-form label-width="100px">
        <el-form-item label="任务名称">
          <el-input v-model="form.name" placeholder="可选，留空自动生成" />
        </el-form-item>
      </el-form>

      <el-descriptions :column="1" border size="small" class="confirm-summary">
        <el-descriptions-item label="连接器">{{ selectedConnectorName }}</el-descriptions-item>
        <el-descriptions-item label="执行模式">
          <el-tag :type="isMaterializeMode ? 'warning' : 'primary'" size="small">
            {{ isMaterializeMode ? '物化脚本' : '自动执行' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Service Config">{{ selectedProfileName }}</el-descriptions-item>
        <el-descriptions-item label="基准测试">
          {{ selectedBenches.join(', ') || '—' }} ({{ selectedBenches.length }}项)
        </el-descriptions-item>
      </el-descriptions>
      <div class="confirm-config-preview">
        <div class="svc-editor-toolbar">
          <span class="editor-label">service config 预览</span>
        </div>
        <pre class="svc-config-preview">{{ confirmServiceText }}</pre>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <el-button v-if="step > 0" @click="step--">上一步</el-button>
      <el-button v-if="step < 3" type="primary" :disabled="!canNext" @click="step++">下一步</el-button>
      <el-button v-if="step === 3" @click="doPreview" :loading="previewing">预览脚本</el-button>
      <el-button
        v-if="step === 3"
        type="primary"
        :loading="submitting"
        @click="doSubmit"
      >
        {{ isMaterializeMode ? '生成脚本' : '发起评测' }}
      </el-button>
    </template>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" title="部署脚本预览" width="700px" append-to-body>
      <pre class="script-preview">{{ previewContent }}</pre>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  mtpListConnectors, mtpListConnectorPresets, mtpCreateConnector,
  mtpListServiceProfiles, mtpCreateServiceProfile, mtpListServicePresets,
  mtpListBenches, mtpListTaskPresets,
  mtpPreviewService, mtpLaunchTask,
} from '@/api/mtpEval/index'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  preloadTask: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'created'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const step = ref(0)
const form = reactive({
  name: '',
  connector_id: '',
})
const selectedBenches = ref([])

// --- 服务配置 (JSON Editor) ---
const selectedProfileId = ref('')
const serviceConfigText = ref('{}')
const serviceConfigError = ref('')

// --- 连接器 ---
const connectors = ref([])
const connectorPresets = ref([])
const loadingConnectors = ref(false)
const selectedConnectorObj = ref(null)

const selectConnector = (c) => {
  form.connector_id = c.id
  selectedConnectorObj.value = c
}

const selectedConnectorName = computed(() => selectedConnectorObj.value?.name || '—')
const isMaterializeMode = computed(() => {
  const cfg = selectedConnectorObj.value?.config || {}
  return cfg.execution_mode === 'materialize_only'
})

// --- 预设创建 ---
const presetDialogVisible = ref(false)
const creatingConnector = ref(false)
const presetForm = reactive({ name: '', kind: '', repo_root: '', work_root: '', config: {} })

const showPresetForm = (preset) => {
  const c = preset.connector || {}
  Object.assign(presetForm, {
    name: preset.name || c.name || '',
    kind: c.kind || preset.kind || '',
    repo_root: c.repo_root || preset.repo_root || '',
    work_root: c.work_root || preset.work_root || '',
    config: { ...(c.config || preset.config || {}) },
  })
  presetDialogVisible.value = true
}

const doCreateConnector = async () => {
  creatingConnector.value = true
  try {
    const res = await mtpCreateConnector({
      name: presetForm.name,
      kind: presetForm.kind,
      repo_root: presetForm.repo_root,
      work_root: presetForm.work_root,
      config: presetForm.config,
    })
    ElMessage.success('连接器创建成功')
    presetDialogVisible.value = false
    await loadConnectors()
    // 自动选中新创建的
    const created = res.data
    if (created?.id) selectConnector(created)
  } catch (e) {
    ElMessage.error('创建失败: ' + (e.message || e))
  } finally {
    creatingConnector.value = false
  }
}

// --- 服务模板/预设 ---
const serviceProfiles = ref([])
const servicePresets = ref([])

const parsedServiceConfig = computed(() => {
  try {
    const obj = JSON.parse(serviceConfigText.value)
    return typeof obj === 'object' && obj !== null ? obj : null
  } catch {
    return null
  }
})

const selectedProfileName = computed(() => {
  if (!selectedProfileId.value) return '(手动编辑)'
  const p = serviceProfiles.value.find(i => (i.id || i.name) === selectedProfileId.value)
  return p?.name || selectedProfileId.value
})

const confirmServiceText = computed(() => {
  try {
    return JSON.stringify(JSON.parse(serviceConfigText.value), null, 2)
  } catch {
    return serviceConfigText.value
  }
})

const onProfileSelect = (id) => {
  if (!id) {
    serviceConfigText.value = '{}'
    serviceConfigError.value = ''
    return
  }
  const p = serviceProfiles.value.find(i => (i.id || i.name) === id)
  if (p?.service) {
    serviceConfigText.value = JSON.stringify(p.service, null, 2)
    serviceConfigError.value = ''
    ElMessage.success(`已加载「${p.name}」配置`)
  }
}

const validateServiceConfig = () => {
  try {
    JSON.parse(serviceConfigText.value)
    serviceConfigError.value = ''
  } catch (e) {
    serviceConfigError.value = e.message
  }
}

const formatServiceConfig = () => {
  try {
    const obj = JSON.parse(serviceConfigText.value)
    serviceConfigText.value = JSON.stringify(obj, null, 2)
    serviceConfigError.value = ''
  } catch (e) {
    serviceConfigError.value = '格式化失败: ' + e.message
  }
}

// --- 创建 Service Config ---
const profileCreateVisible = ref(false)
const creatingProfile = ref(false)
const profileCreateForm = reactive({ name: '', presetId: '', configText: '{}' })

const openCreateProfile = () => {
  profileCreateForm.name = ''
  profileCreateForm.presetId = ''
  profileCreateForm.configText = '{}'
  profileCreateVisible.value = true
}

const onPresetBaseChange = (presetId) => {
  const preset = servicePresets.value.find(p => p.id === presetId)
  if (preset?.service) {
    profileCreateForm.configText = JSON.stringify(preset.service, null, 2)
  }
}

const doCreateProfile = async () => {
  if (!profileCreateForm.name.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  let svcObj
  try {
    svcObj = JSON.parse(profileCreateForm.configText)
  } catch {
    ElMessage.error('配置内容不是合法 JSON')
    return
  }
  creatingProfile.value = true
  try {
    const res = await mtpCreateServiceProfile({
      name: profileCreateForm.name.trim(),
      service: svcObj,
    })
    ElMessage.success('Service Config 创建成功')
    profileCreateVisible.value = false
    await loadServiceData()
    // 自动选中新创建的
    const created = res.data
    if (created?.id || created?.name) {
      selectedProfileId.value = created.id || created.name
      onProfileSelect(selectedProfileId.value)
    }
  } catch (e) {
    ElMessage.error('创建失败: ' + (e.message || e))
  } finally {
    creatingProfile.value = false
  }
}

// --- 基准 ---
const benches = ref([])
const taskPresets = ref([])
const selectedTaskPreset = ref('')
const transferKey = ref(0)

const benchTransferData = computed(() =>
  benches.value.map(b => ({
    key: b.id,
    label: b.title || b.id,
    description: b.description || '',
  }))
)

const benchFilterMethod = (query, item) => {
  const q = query.toLowerCase()
  return item.label.toLowerCase().includes(q) || item.key.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
}

const applyTaskPreset = (presetName) => {
  const preset = taskPresets.value.find(p => p.name === presetName)
  if (preset?.tasks) {
    selectedBenches.value = preset.tasks.map(t => t.bench || t.bench_id || t.id).filter(Boolean)
    // 强制重建 transfer 使 right-default-checked 生效
    transferKey.value++
  }
}

// --- 模型显示名 ---
const modelDisplayName = computed(() => {
  const cfg = parsedServiceConfig.value
  if (!cfg) return '—'
  const p = cfg.model_path || cfg.command_file || ''
  return p.split('/').pop() || '—'
})

// --- 步骤校验 ---
const canNext = computed(() => {
  if (step.value === 0) return !!form.connector_id
  if (step.value === 1) {
    const cfg = parsedServiceConfig.value
    return cfg !== null && Object.keys(cfg).length > 0
  }
  if (step.value === 2) return selectedBenches.value.length > 0
  return true
})

// --- 预览 ---
const previewing = ref(false)
const previewVisible = ref(false)
const previewContent = ref('')

const doPreview = async () => {
  previewing.value = true
  try {
    const res = await mtpPreviewService({
      connector_id: form.connector_id,
      service: parsedServiceConfig.value || {},
    })
    previewContent.value = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2)
    previewVisible.value = true
  } catch (e) {
    ElMessage.error('预览失败: ' + (e.message || e))
  } finally {
    previewing.value = false
  }
}

// --- 提交 ---
const submitting = ref(false)

const doSubmit = async () => {
  submitting.value = true
  try {
    const payload = {
      name: form.name || undefined,
      connector_id: form.connector_id,
      service: parsedServiceConfig.value || {},
      service_profile_id: selectedProfileId.value || undefined,
      tasks: selectedBenches.value.map(id => ({ bench: id })),
    }
    await mtpLaunchTask(payload)
    ElMessage.success(isMaterializeMode.value ? '脚本生成任务已提交' : '评测任务已提交')
    visible.value = false
    emit('created')
  } catch (e) {
    ElMessage.error('提交失败: ' + (e.message || e))
  } finally {
    submitting.value = false
  }
}

// --- 数据加载 ---
const loadConnectors = async () => {
  loadingConnectors.value = true
  try {
    const [cRes, pRes] = await Promise.all([mtpListConnectors(), mtpListConnectorPresets()])
    connectors.value = cRes.data || []
    connectorPresets.value = pRes.data || []
  } catch { /* ignore */ } finally {
    loadingConnectors.value = false
  }
}

const loadServiceData = async () => {
  try {
    const [pRes, sRes] = await Promise.all([mtpListServiceProfiles(), mtpListServicePresets()])
    serviceProfiles.value = pRes.data || []
    servicePresets.value = sRes.data || []
  } catch { /* ignore */ }
}

const loadBenchData = async () => {
  try {
    const [bRes, tRes] = await Promise.all([mtpListBenches(), mtpListTaskPresets()])
    benches.value = bRes.data || []
    taskPresets.value = tRes.data || []
  } catch { /* ignore */ }
}

// 打开时加载数据 + 预填配置
watch(visible, (v) => {
  if (v) {
    loadConnectors().then(() => {
      applyPreloadTask()
    })
    loadServiceData()
    loadBenchData()
  }
})

const applyPreloadTask = () => {
  const t = props.preloadTask
  if (!t) return
  // 匹配连接器
  if (t.connector_id) {
    const c = connectors.value.find(c => c.id === t.connector_id)
    if (c) selectConnector(c)
  }
  // 填充服务配置
  const svc = t.service || {}
  if (Object.keys(svc).length) {
    serviceConfigText.value = JSON.stringify(svc, null, 2)
    serviceConfigError.value = ''
  }
  // 匹配 service profile
  if (t.service_profile_id) {
    selectedProfileId.value = t.service_profile_id
  }
  // 预填基准测试（launch-config 返回 tasks: [{bench: "xxx"}, ...]）
  if (Array.isArray(t.tasks) && t.tasks.length) {
    selectedBenches.value = t.tasks.map(r => r.bench || r.bench_id || r.id).filter(Boolean)
    transferKey.value++
  }
  // 预填任务名称
  if (t.name) {
    form.name = t.name
  }
  // 跳到第二步让用户检查配置
  step.value = 1
  ElMessage.success('已加载任务配置，请检查并调整')
}

const resetAll = () => {
  step.value = 0
  form.name = ''
  form.connector_id = ''
  selectedProfileId.value = ''
  serviceConfigText.value = '{}'
  serviceConfigError.value = ''
  selectedBenches.value = []
  selectedTaskPreset.value = ''
  selectedConnectorObj.value = null
}
</script>

<style scoped>
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.required-star {
  color: #f56c6c;
}
.count-badge {
  margin-left: 2px;
}

/* 预设面板 */
.preset-panel {
  margin-top: 16px;
  background: linear-gradient(135deg, #f0f7ff 0%, #f5f0ff 100%);
  border: 1px dashed #c6d9f1;
  border-radius: 8px;
  padding: 14px;
}
.preset-title {
  color: #7c5c20;
  font-size: 14px;
}

.card-select-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}

/* 已有连接器卡片 */
.select-card {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  background: #fff;
}
.select-card:hover { border-color: #409eff; background: #ecf5ff; }
.select-card.active { border-color: #409eff; background: #ecf5ff; box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.25); }
.select-card.empty { border-style: dashed; color: #c0c4cc; cursor: default; text-align: center; }

/* 预设卡片 */
.select-card.preset {
  border: 1px dashed #c6d9f1;
  border-left: 3px solid #e6a23c;
  background: #fff;
}
.select-card.preset:hover {
  border-color: #e6a23c;
  background: #fdf6ec;
}
.preset-badge {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 12px;
  line-height: 1;
}

.select-card-name { font-size: 13px; font-weight: 600; color: #303133; }
.select-card-desc { font-size: 11px; color: #909399; margin-top: 4px; }

.bench-transfer {
  width: 100%;
}
.bench-transfer :deep(.el-transfer-panel) {
  width: 260px;
}

.confirm-summary { margin-top: 16px; }

/* Service Config 编辑器 */
.svc-select-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.svc-editor-wrap {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
}

.svc-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.editor-label {
  font-size: 12px;
  color: #909399;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  flex: 1;
}

.editor-error {
  font-size: 11px;
  color: #f56c6c;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.svc-code-editor {
  width: 100%;
  min-height: 280px;
  padding: 12px 16px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d4d4d4;
  background: #1e1e1e;
  border: none;
  outline: none;
  resize: vertical;
  tab-size: 2;
  box-sizing: border-box;
}

.svc-code-editor::placeholder {
  color: #555;
}

.svc-code-editor.in-dialog {
  min-height: 240px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.confirm-config-preview {
  margin-top: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
}

.svc-config-preview {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px 16px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.script-preview {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 6px;
  font-size: 12px;
  max-height: 400px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
