import { ref, watch, computed } from 'vue'
import type { ViewPreferenceMap, ViewPreferenceModule, CategoryViewType, AgeViewType, FestivalViewType } from '@/types'

const STORAGE_KEY = 'liquor-dashboard-view-preference'

const DEFAULT_VIEW: ViewPreferenceMap = {
  category: 'pie-line',
  age: 'bar',
  festival: 'bar'
}

const VIEW_LABELS: Record<ViewPreferenceModule, Record<string, string>> = {
  category: { 'pie-line': '饼图+折线', 'bar-area': '柱状图+面积图' },
  age: { 'bar': '分组柱状图', 'heatmap': '热力图', 'radar': '雷达图' },
  festival: { 'bar': '分组柱状图', 'radar': '雷达图', 'area': '堆叠面积图' }
}

function loadFromStorage(): Partial<ViewPreferenceMap> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (e) {
    console.warn('[view-preference] Failed to load', e)
    return {}
  }
}

function saveToStorage(data: ViewPreferenceMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('[view-preference] Failed to save', e)
  }
}

const stored = loadFromStorage()
const viewPreference = ref<ViewPreferenceMap>({
  category: (stored.category || DEFAULT_VIEW.category) as CategoryViewType,
  age: (stored.age || DEFAULT_VIEW.age) as AgeViewType,
  festival: (stored.festival || DEFAULT_VIEW.festival) as FestivalViewType
})

watch(
  viewPreference,
  val => saveToStorage(val),
  { deep: true, flush: 'sync' }
)

const hookCache = new Map<ViewPreferenceModule, ReturnType<typeof createHook>>()

function createHook<M extends ViewPreferenceModule>(module: M) {
  type VT = ViewPreferenceMap[M]

  const currentView = computed<VT>({
    get: () => viewPreference.value[module],
    set: (val: VT) => {
      viewPreference.value[module] = val
      saveToStorage(viewPreference.value)
    }
  })

  function setView(view: VT) {
    currentView.value = view
  }

  function getViewLabel(view: VT): string {
    return VIEW_LABELS[module][String(view)] || String(view)
  }

  function getViewOptions(): Array<{ value: VT; label: string }> {
    return Object.entries(VIEW_LABELS[module]).map(([value, label]) => ({
      value: value as VT,
      label
    }))
  }

  function reset() {
    currentView.value = DEFAULT_VIEW[module] as VT
  }

  return {
    currentView,
    setView,
    getViewLabel,
    getViewOptions,
    reset
  }
}

export function useViewPreference<M extends ViewPreferenceModule>(module: M) {
  if (!hookCache.has(module)) {
    hookCache.set(module, createHook(module))
  }
  return hookCache.get(module) as ReturnType<typeof createHook<M>>
}

export function getViewLabel(module: ViewPreferenceModule, view: string): string {
  return VIEW_LABELS[module]?.[view] || view
}

export function __testReset() {
  hookCache.clear()
  localStorage.removeItem(STORAGE_KEY)
  viewPreference.value = { ...DEFAULT_VIEW }
}
