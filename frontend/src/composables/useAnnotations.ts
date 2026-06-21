import { ref, computed, watch } from 'vue'
import type { AnnotationPoint, AnnotationModule } from '@/types'

const STORAGE_KEY = 'liquor-dashboard-annotations'

const MODULE_LABEL_MAP: Record<AnnotationModule, string> = {
  category: '品类结构',
  region: '区域消费偏好',
  price: '白酒价格带',
  import: '进口与国产对比',
  age: '年龄段偏好',
  festival: '节日消费'
}

function loadFromStorage(): AnnotationPoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter(item => item && typeof item.id === 'string' && typeof item.content === 'string')
    }
    return []
  } catch (e) {
    console.warn('[annotations] Failed to load from localStorage', e)
    return []
  }
}

function saveToStorage(list: AnnotationPoint[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.warn('[annotations] Failed to save to localStorage', e)
  }
}

function genId(): string {
  return `ann-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function useAnnotations() {
  const annotations = ref<AnnotationPoint[]>(loadFromStorage())

  watch(
    annotations,
    val => {
      saveToStorage(val)
    },
    { deep: true, flush: 'sync' }
  )

  const count = computed(() => annotations.value.length)

  const groupedByModule = computed(() => {
    const groups: Record<string, AnnotationPoint[]> = {}
    annotations.value.forEach(a => {
      if (!groups[a.moduleLabel]) groups[a.moduleLabel] = []
      groups[a.moduleLabel].push(a)
    })
    return groups
  })

  function getAnnotation(
    module: AnnotationModule,
    entity: string,
    metric: string,
    timePoint?: string
  ): AnnotationPoint | undefined {
    return annotations.value.find(a =>
      a.module === module
      && a.entity === entity
      && a.metric === metric
      && (timePoint === undefined || a.timePoint === timePoint)
    )
  }

  function getAnnotationsByModule(module: AnnotationModule): AnnotationPoint[] {
    return annotations.value.filter(a => a.module === module)
  }

  function getAnnotationsByEntity(module: AnnotationModule, entity: string): AnnotationPoint[] {
    return annotations.value.filter(a => a.module === module && a.entity === entity)
  }

  function addAnnotation(params: {
    module: AnnotationModule
    entity: string
    metric: string
    timePoint?: string
    value?: number
    color: string
    content: string
  }): AnnotationPoint {
    const moduleLabel = MODULE_LABEL_MAP[params.module] || String(params.module)
    const now = Date.now()
    const record: AnnotationPoint = {
      id: genId(),
      module: params.module,
      moduleLabel,
      entity: params.entity,
      metric: params.metric,
      timePoint: params.timePoint,
      value: params.value,
      color: params.color,
      content: params.content.trim(),
      createdAt: now,
      updatedAt: now
    }
    annotations.value.push(record)
    return record
  }

  function updateAnnotation(id: string, content: string): boolean {
    const item = annotations.value.find(a => a.id === id)
    if (!item) return false
    item.content = content.trim()
    item.updatedAt = Date.now()
    return true
  }

  function deleteAnnotation(id: string): boolean {
    const idx = annotations.value.findIndex(a => a.id === id)
    if (idx < 0) return false
    annotations.value.splice(idx, 1)
    return true
  }

  function clearAll() {
    annotations.value = []
  }

  function clearByModule(module: AnnotationModule) {
    annotations.value = annotations.value.filter(a => a.module !== module)
  }

  return {
    annotations,
    count,
    groupedByModule,
    getAnnotation,
    getAnnotationsByModule,
    getAnnotationsByEntity,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearAll,
    clearByModule
  }
}
