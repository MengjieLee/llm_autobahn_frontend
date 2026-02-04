import { onMounted, onBeforeUnmount, onActivated, onDeactivated } from 'vue'
import { debounce } from '@/utils'

export default function useChartResize(chartInstance) {
  let $_sidebarElm = null

  const $_resizeHandler = debounce(() => {
    if (chartInstance.value) {
      chartInstance.value.resize()
    }
  }, 100)

  const $_initResizeEvent = () => window.addEventListener('resize', $_resizeHandler)
  const $_destroyResizeEvent = () => window.removeEventListener('resize', $_resizeHandler)

  const $_sidebarResizeHandler = (e) => {
    if (e.propertyName === 'width') $_resizeHandler()
  }

  const $_initSidebarResizeEvent = () => {
    $_sidebarElm = document.getElementsByClassName('sidebar-container')[0]
    $_sidebarElm && $_sidebarElm.addEventListener('transitionend', $_sidebarResizeHandler)
  }

  const $_destroySidebarResizeEvent = () => {
    $_sidebarElm && $_sidebarElm.removeEventListener('transitionend', $_sidebarResizeHandler)
  }

  onMounted(() => {
    $_initResizeEvent()
    $_initSidebarResizeEvent()
  })

  onBeforeUnmount(() => {
    $_destroyResizeEvent()
    $_destroySidebarResizeEvent()
  })

  onActivated(() => {
    $_initResizeEvent()
    $_initSidebarResizeEvent()
  })

  onDeactivated(() => {
    $_destroyResizeEvent()
    $_destroySidebarResizeEvent()
  })
}
