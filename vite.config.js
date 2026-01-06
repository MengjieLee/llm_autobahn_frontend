// import path from 'path'

import {
  fileURLToPath,
  URL
} from 'node:url'

import {
  defineConfig,
  loadEnv
} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

// ElementPlus components
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// ElementPlus svg icon
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
// SvgSpritemap
import VitePluginSvgSpritemap from '@spiriit/vite-plugin-svg-spritemap'
// markdown
import mdPlugin from 'vite-plugin-markdown'

export default defineConfig(({
  mode
}) => {
  const env = loadEnv(mode, process.cwd())
  
  // 从 CHANGELOG.md 读取版本号（### 更新记录 的第一条记录中的 v{version}）
  let version = '0.0.0'
  try {
    const changelogPath = resolve(process.cwd(), 'CHANGELOG.md')
    const changelogContent = readFileSync(changelogPath, 'utf-8')
    
    // 找到 "### 更新记录" 部分
    const updateRecordIndex = changelogContent.indexOf('### 更新记录')
    if (updateRecordIndex !== -1) {
      // 获取更新记录部分的内容
      const updateRecordSection = changelogContent.substring(updateRecordIndex)
      // 匹配第一条记录（以 * 开头，包含 v{version} 格式）
      const firstRecordMatch = updateRecordSection.match(/^\s*\*\s+v([\d.]+)/m)
      if (firstRecordMatch && firstRecordMatch[1]) {
        version = firstRecordMatch[1] // 提取版本号（去掉 v 前缀）
      }
    }
  } catch (error) {
    console.warn('Failed to read version from CHANGELOG.md:', error)
    // 如果读取失败，fallback 到 package.json
    try {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))
      version = packageJson.version || '0.0.0'
    } catch (e) {
      console.warn('Failed to read version from package.json:', e)
    }
  }

  const config = {
    base: env.VITE_BASE_URL,
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    // 新增/修改：配置 server 端口
    server: {
      port: 8735, // 自定义默认端口为 8735
      strictPort: true, // 可选：端口被占用时直接报错（默认自动换端口）
    },
    css: {
      // Customizing themes with unplugin-vue-components
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/theme/index.scss";`,
        },
      },
    },
    plugins: [
      mdPlugin.plugin({
        mode: [mdPlugin.Mode.VUE]
      }),
      // svg 雪碧图
      VitePluginSvgSpritemap('./src/icons/svg/*.svg', {
        // injectSvgOnDev: true,
      }),
      vue(),
      vueDevTools(),
      AutoImport({
        resolvers: [
          // 自动导入 element plus 相关函数 如ElMessage
          ElementPlusResolver({
            importStyle: "sass", // Custom theme
          }),
          // Auto import icon components
          // 自动导入图标组件
          IconsResolver({
            prefix: 'Icon'
          })
        ],

      }),
      Components({
        resolvers: [
          // 自动导入 element plus 组件
          ElementPlusResolver({
            importStyle: "sass", // Custom theme
          }),
          // 自动注册图标组件@iconify-json/ep
          IconsResolver({
            // prefix: 'i', // 默认：'i' 使用： {prefix}-{collection}-{icon}
            enabledCollections: [
              'ep'
            ],
          }),
        ],
      }),
      Icons({
        autoInstall: true, // 自动安装了 enabledCollections 指定的图标 如@iconify-json/ep
      }),
    ],
    
  }

  return defineConfig(config)
})