<template>
  <div class="dashboard-container">
    <PanelGroup @directToDomain="directToDomain" />
  </div>

</template>

<script setup>
import PanelGroup from '@/views/dashboard/components/PanelGroup.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const directToDomain = (domain) => {
  const routeMap = {
    'dataset': '/datasets',
    'pipeline': '/sqlStudio/sqlExporter',
  };

  const targetPath = routeMap[domain];

  if (targetPath) {
    router.push(targetPath);
  } else {
    console.warn(`未知的 domain: ${domain}`);
  }
}

</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 32px;
  background-color: rgb(240, 242, 245);
  position: relative;
  height: calc(100vh - 120px);
}
</style>
