<template>
  <el-row :gutter="40" class="panel-group">
    <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
      <div v-loading="loading" class="card-panel" @click="directToDomain('dataset')">
        <div class="card-panel-icon-wrapper icon-datasets">
          <svg-icon icon="datasets" class-name="card-panel-icon" />
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">
            数据集 <el-icon><Promotion /></el-icon>
          </div>
          <CountTo :start-val="0" :end-val="domainMatrix.datasetsAmount" :duration="2600" class="card-panel-num" />
        </div>
      </div>
    </el-col>
    <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
      <div v-loading="loading" class="card-panel" @click="directToDomain('pipeline')">
        <div class="card-panel-icon-wrapper icon-pipelines">
          <svg-icon icon="pipeline" class-name="card-panel-icon" />
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">
            数据 Pipeline <el-icon><Promotion /></el-icon>
          </div>
          <CountTo :start-val="0" :end-val="domainMatrix.pipelineAmount" :duration="3200" class="card-panel-num" />
        </div>
      </div>
    </el-col>
    <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
      <!-- <div class="card-panel" @click="directToDomain('user')"> -->
      <div v-loading="loading" class="card-panel">
        <div class="card-panel-icon-wrapper icon-people">
          <svg-icon icon="people" class-name="card-panel-icon" />
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">
            注册用户
          </div>
          <CountTo :start-val="0" :end-val="domainMatrix.usersAmount" :duration="3000" class="card-panel-num" />
        </div>
      </div>
    </el-col>
    <!-- <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
      <div class="card-panel" @click="directToDomain('model')">
        <div class="card-panel-icon-wrapper icon-model">
          <svg-icon icon="model" class-name="card-panel-icon" />
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">
            模型
          </div>
          <CountTo :start-val="0" :end-val="13600" :duration="3600" class="card-panel-num" />
        </div>
      </div>
    </el-col> -->
  </el-row>
</template>

<script>
import { CountTo } from 'vue3-count-to'

export default {
  components: {
    CountTo
  },
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    domainMatrix: {
      datasetsAmount: {
        type: Number,
        default: 0
      },
      pipelineAmount: {
        type: Number,
        default: 0
      },
      usersAmount: {
        type: Number,
        default: 0
      }
    }
  },
  data() {
    return {}
  },
  methods: {
    directToDomain(domain) {
      this.$emit('directToDomain', domain)
    }
  }
}
</script>

<style lang="scss" scoped>
.panel-group {
  margin-top: 18px;

  .card-panel-col {
    margin-bottom: 32px;
  }

  .card-panel {
    height: 108px;
    cursor: pointer;
    font-size: 12px;
    position: relative;
    overflow: hidden;
    color: #666;
    background: #fff;
    box-shadow: 4px 4px 40px rgba(0, 0, 0, .15);
    border-color: rgba(0, 0, 0, .05);

    &:hover {

      .card-panel-icon-wrapper {
        color: #fff;
      }

      .icon-datasets {
        background: #40c9c6;
      }

      .icon-people {
        background: #36a3f7;
      }

      .icon-pipelines {
        background: #f4516c;
      }

      .icon-model {
        background: #34bfa3
      }
      box-shadow: 8px 8px 20px var(--el-text-color-secondary);
      border: 2px solid #44ba8299;
    }

    .icon-datasets {
      color: #40c9c6;
    }

    .icon-people {
      color: #36a3f7;
    }

    .icon-pipelines {
      color: #f4516c;
    }

    .icon-model {
      color: #34bfa3
    }

    .card-panel-icon-wrapper {
      float: left;
      margin: 14px 0 0 14px;
      padding: 16px;
      transition: all 0.38s ease-out;
      border-radius: 6px;
    }

    .card-panel-icon {
      float: left;
      font-size: 48px;
    }

    .card-panel-description {
      float: right;
      font-weight: bold;
      margin: 26px;
      margin-left: 0px;

      .card-panel-text {
        line-height: 18px;
        color: rgba(0, 0, 0, 0.45);
        font-size: 16px;
        margin-bottom: 12px;
      }

      .card-panel-num {
        font-size: 20px;
      }
    }
  }
}

@media (max-width:550px) {
  .card-panel-description {
    display: none;
  }

  .card-panel-icon-wrapper {
    float: none !important;
    width: 100%;
    height: 100%;
    margin: 0 !important;

    .svg-icon {
      display: block;
      margin: 14px auto !important;
      float: none !important;
    }
  }
}
</style>
