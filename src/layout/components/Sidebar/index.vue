<template>
  <div class="sidebar-wrapper">
    <logo class="logo-container" :collapse="isCollapse" theme="light" v-if="showLogo" />
    <menu-list :height="showLogo ? 'calc(100% - 50px - 40px)' : 'calc(100% - 40px)'" :isCollapse="isCollapse" />
    <div class="version-footer" :class="{ 'is-collapse': isCollapse }">
      <span v-if="!isCollapse" class="version-label">当前版本:</span>
      <span class="version-value">v{{ version }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'

import { sctx } from '@/store'
import Logo from '../common/Logo.vue'
import MenuList from '../common/Menu/index.vue'

const ctx = inject('context')

const showLogo = sctx.sidebarLogo

const isCollapse = computed(() => {
    return !ctx.sidebar.opened
})

// 获取版本号（从 vite define 注入）
const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

</script>
<style lang="scss" scoped>
.sidebar-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}


.version-footer {
  padding: 12px 20px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  background-color: var(--el-fill-color-extra-light); // 使用 Element Plus 主题变量，自动跟随主题变化
  border-top: 1px solid var(--el-border-color-lighter); // 使用主题边框颜色
  flex-shrink: 0;
  transition: background-color 0.3s, border-color 0.3s; // 添加过渡效果，使主题切换更平滑
  
  .version-label {
    margin-right: 6px;
  }
  
  .version-value {
    font-weight: 500;
  }
  
  &.is-collapse {
    padding: 12px 8px;
    
    .version-label {
      display: none;
    }
  }
}
</style>