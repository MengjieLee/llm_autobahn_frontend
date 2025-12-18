<template>
  <div class="dashboard-container">
    <div class="dashboard-text">name: {{ ctx.userInfo.name }}</div>
    hi there! this is dashboard page
  </div>
</template>

<script setup>
import { ctx } from '@/store'
</script>

<style lang="scss" scoped>
.dashboard {
    &-container {
        margin: 30px;
    }
    &-text {
        font-size: 30px;
        line-height: 46px;
    }
}
</style>
