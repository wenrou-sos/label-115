<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import {
  X,
  Check,
  GripVertical,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Info,
  Sparkles,
  Layers,
  MapPin,
  Users,
  Wallet,
  PartyPopper
} from 'lucide-vue-next'
import { NButton, NCheckbox, NCheckboxGroup, NScrollbar, NEmpty, useMessage, NTabs, NTabPane } from 'naive-ui'
import { useDashboardStore, AVAILABLE_METRICS, DEFAULT_CUSTOM_METRICS } from '@/stores/dashboard'
import type { CustomMetric, MetricMeta, MetricCategory } from '@/types'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const store = useDashboardStore()
const { customMetrics, filteredCategories, filteredCities, filteredAgeGroups, filteredPriceRanges, filteredFestivals } = storeToRefs(store)
const message = useMessage()

const selectedIds = ref<string[]>([])
const orderedMetrics = ref<CustomMetric[]>([])
const expandedCategories = ref<Set<MetricCategory>>(new Set(['overview', 'category']))
const activeTab = ref<'browse' | 'selected'>('browse')
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const categoryIcons: Record<MetricCategory, any> = {
  overview: Sparkles,
  category: Layers,
  region: MapPin,
  age: Users,
  price: Wallet,
  festival: PartyPopper
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      selectedIds.value = customMetrics.value.metrics.map(m => m.id)
      orderedMetrics.value = [...customMetrics.value.metrics].sort((a, b) => a.order - b.order)
      activeTab.value = orderedMetrics.value.length > 0 ? 'selected' : 'browse'
    }
  }
)

const groupedMetrics = computed(() => {
  const groups: Record<MetricCategory, MetricMeta[]> = {
    overview: [],
    category: [],
    region: [],
    age: [],
    price: [],
    festival: []
  }
  AVAILABLE_METRICS.forEach(m => {
    if (isMetricAvailable(m.id)) {
      groups[m.category].push(m)
    }
  })
  return groups
})

function isMetricAvailable(metricId: string): boolean {
  const parts = metricId.split('_')
  const category = parts[0]

  if (category === 'category') {
    const catNameMap: Record<string, string> = {
      baijiu: '白酒',
      beer: '啤酒',
      wine: '红酒',
      huangjiu: '黄酒',
      craftBeer: '精酿啤酒',
      whiskey: '威士忌'
    }
    const catKey = parts[1]
    const catName = catNameMap[catKey]
    return filteredCategories.value.some(c => c.name === catName)
  }

  if (category === 'region') {
    return filteredCities.value.length > 0
  }

  if (category === 'age') {
    const ageMap: Record<string, string> = {
      '18-25': '18-25岁',
      '26-30': '26-30岁',
      '31-40': '31-40岁',
      '41-50': '41-50岁',
      '51+': '51岁以上'
    }
    const ageKey = parts[1]
    const ageName = ageMap[ageKey]
    return filteredAgeGroups.value.some(g => g.ageGroup === ageName)
  }

  if (category === 'price') {
    const rangeMap: Record<string, string> = {
      low: '百元以下',
      mid: '100-300元',
      high: '300-800元',
      premium: '800-2000元',
      luxury: '2000元以上'
    }
    const priceKey = parts[1]
    const rangeName = rangeMap[priceKey]
    return filteredPriceRanges.value.some(p => p.range.includes(rangeName))
  }

  if (category === 'festival') {
    const festivalMap: Record<string, string> = {
      springFestival: '春节',
      valentines: '情人节',
      midAutumn: '中秋',
      christmas: '圣诞节',
      newYear: '元旦',
      qingming: '清明'
    }
    const festKey = parts[1]
    const festName = festivalMap[festKey]
    return filteredFestivals.value.some(f => f.festival === festName)
  }

  return true
}

function getMetaById(id: string): MetricMeta | undefined {
  return AVAILABLE_METRICS.find(m => m.id === id)
}

function toggleCategory(cat: MetricCategory) {
  if (expandedCategories.value.has(cat)) {
    expandedCategories.value.delete(cat)
  } else {
    expandedCategories.value.add(cat)
  }
}

function handleCheck(ids: string[]) {
  const added = ids.filter(id => !selectedIds.value.includes(id))
  const removed = selectedIds.value.filter(id => !ids.includes(id))

  added.forEach(id => {
    if (orderedMetrics.value.every(m => m.id !== id)) {
      orderedMetrics.value.push({
        id,
        order: orderedMetrics.value.length
      })
    }
  })

  removed.forEach(id => {
    const idx = orderedMetrics.value.findIndex(m => m.id === id)
    if (idx >= 0) {
      orderedMetrics.value.splice(idx, 1)
      orderedMetrics.value.forEach((m, i) => { m.order = i })
    }
  })

  selectedIds.value = ids
}

function removeMetric(id: string) {
  const idx = orderedMetrics.value.findIndex(m => m.id === id)
  if (idx >= 0) {
    orderedMetrics.value.splice(idx, 1)
    orderedMetrics.value.forEach((m, i) => { m.order = i })
    selectedIds.value = selectedIds.value.filter(sid => sid !== id)
  }
}

function handleDragStart(index: number) {
  dragIndex.value = index
}

function handleDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  if (dragIndex.value !== null && dragIndex.value !== index) {
    dragOverIndex.value = index
  }
}

function handleDragLeave() {
  dragOverIndex.value = null
}

function handleDrop(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) {
    dragIndex.value = null
    dragOverIndex.value = null
    return
  }

  const items = [...orderedMetrics.value]
  const [removed] = items.splice(dragIndex.value, 1)
  items.splice(index, 0, removed)
  items.forEach((m, i) => { m.order = i })
  orderedMetrics.value = items

  dragIndex.value = null
  dragOverIndex.value = null
}

function handleDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}

function moveUp(index: number) {
  if (index <= 0) return
  const items = [...orderedMetrics.value]
  ;[items[index - 1], items[index]] = [items[index], items[index - 1]]
  items.forEach((m, i) => { m.order = i })
  orderedMetrics.value = items
}

function moveDown(index: number) {
  if (index >= orderedMetrics.value.length - 1) return
  const items = [...orderedMetrics.value]
  ;[items[index + 1], items[index]] = [items[index], items[index + 1]]
  items.forEach((m, i) => { m.order = i })
  orderedMetrics.value = items
}

function handleSave() {
  if (orderedMetrics.value.length === 0) {
    store.resetCustomMetrics()
    message.success('已清除所有自定义指标')
  } else {
    store.setCustomMetrics(orderedMetrics.value)
    message.success(`已保存 ${orderedMetrics.value.length} 个自定义指标`)
  }
  emit('update:show', false)
}

function handleReset() {
  selectedIds.value = []
  orderedMetrics.value = []
  store.resetCustomMetrics()
  message.success('已恢复默认设置')
}

function handleClose() {
  emit('update:show', false)
}

const selectedMetaList = computed(() => {
  return orderedMetrics.value
    .map(m => ({ ...m, meta: getMetaById(m.id) }))
    .filter(m => m.meta)
})

const flatMetricIds = computed(() => {
  return Object.values(groupedMetrics.value).flat().map(m => m.id)
})

function selectAllInCategory(cat: MetricCategory) {
  const catMetrics = groupedMetrics.value[cat].filter(m => isMetricAvailable(m.id))
  const idsToAdd = catMetrics.map(m => m.id).filter(id => !selectedIds.value.includes(id))

  idsToAdd.forEach(id => {
    if (orderedMetrics.value.every(m => m.id !== id)) {
      orderedMetrics.value.push({
        id,
        order: orderedMetrics.value.length
      })
    }
  })

  selectedIds.value = [...new Set([...selectedIds.value, ...idsToAdd])]
}

function clearCategory(cat: MetricCategory) {
  const catMetrics = groupedMetrics.value[cat]
  const idsToRemove = catMetrics.map(m => m.id)

  idsToRemove.forEach(id => {
    const idx = orderedMetrics.value.findIndex(m => m.id === id)
    if (idx >= 0) {
      orderedMetrics.value.splice(idx, 1)
    }
  })
  orderedMetrics.value.forEach((m, i) => { m.order = i })
  selectedIds.value = selectedIds.value.filter(id => !idsToRemove.includes(id))
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[100] flex justify-end"
      >
        <div class="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" @click="handleClose"></div>

        <Transition name="slide-right">
          <div
            v-if="show"
            class="relative w-full max-w-md h-full bg-ink-900 border-l border-champagne-500/20 shadow-2xl flex flex-col"
          >
            <div class="flex items-center justify-between px-5 py-4 border-b border-champagne-500/10 bg-gradient-to-r from-wine-900/30 to-ink-900">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-champagne-700/40 to-champagne-900/60 flex items-center justify-center">
                  <Sparkles class="w-4.5 h-4.5 text-champagne-400" />
                </div>
                <div>
                  <h3 class="font-serif-cn text-lg font-semibold text-ink-100">自定义指标</h3>
                  <p class="text-xs text-ink-400 mt-0.5">勾选并排序，生成专属看板</p>
                </div>
              </div>
              <button
                @click="handleClose"
                class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-ink-800/60 transition-colors text-ink-400 hover:text-ink-200"
              >
                <X class="w-4.5 h-4.5" />
              </button>
            </div>

            <div class="px-5 py-3 border-b border-ink-800/60">
              <NTabs v-model:value="activeTab" size="medium" type="line" animated>
                <NTabPane name="browse">
                  <template #tab>
                    <span class="text-sm">浏览字段 ({{ flatMetricIds.length }})</span>
                  </template>
                </NTabPane>
                <NTabPane name="selected">
                  <template #tab>
                    <span class="text-sm">已选 ({{ orderedMetrics.length }})</span>
                  </template>
                </NTabPane>
              </NTabs>
            </div>

            <div class="flex-1 min-h-0 overflow-hidden">
              <div v-show="activeTab === 'browse'" class="h-full flex flex-col">
                <div class="px-5 py-2 flex items-center justify-between bg-ink-800/30 border-b border-ink-700/40">
                  <div class="flex items-center gap-2 text-xs text-ink-400">
                    <Info class="w-3.5 h-3.5" />
                    <span>勾选要展示的指标，切换到「已选排序」调整顺序</span>
                  </div>
                </div>

                <NScrollbar class="flex-1">
                  <NCheckboxGroup :value="selectedIds" @update:value="handleCheck">
                    <div class="p-4 space-y-3">
                      <div
                        v-for="(metrics, cat) in groupedMetrics"
                        :key="cat"
                        v-show="metrics.length > 0"
                        class="rounded-xl border border-ink-700/50 overflow-hidden bg-ink-800/20"
                      >
                        <div
                          class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-ink-800/40 transition-colors"
                          @click="toggleCategory(cat as MetricCategory)"
                        >
                          <div class="flex items-center gap-3">
                            <component
                              :is="categoryIcons[cat as MetricCategory]"
                              class="w-4 h-4 text-champagne-400"
                            />
                            <span class="text-sm font-medium text-ink-200">
                              {{ AVAILABLE_METRICS.find(m => m.category === cat)?.categoryLabel }}
                            </span>
                            <span class="text-xs text-ink-500">({{ metrics.length }})</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <button
                              @click.stop="selectAllInCategory(cat as MetricCategory)"
                              class="text-xs text-champagne-400/80 hover:text-champagne-400 px-2 py-0.5 rounded hover:bg-champagne-500/10 transition-colors"
                            >
                              全选
                            </button>
                            <button
                              @click.stop="clearCategory(cat as MetricCategory)"
                              class="text-xs text-ink-500 hover:text-ink-300 px-2 py-0.5 rounded hover:bg-ink-700/40 transition-colors"
                            >
                              清空
                            </button>
                            <component
                              :is="expandedCategories.has(cat as MetricCategory) ? ChevronDown : ChevronRight"
                              class="w-4 h-4 text-ink-500"
                            />
                          </div>
                        </div>

                        <Transition name="expand">
                          <div
                            v-show="expandedCategories.has(cat as MetricCategory)"
                            class="border-t border-ink-700/40 px-4 py-3 space-y-2"
                          >
                            <div
                              v-for="metric in metrics"
                              :key="metric.id"
                              class="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-ink-700/30 transition-colors group"
                            >
                              <NCheckbox
                                :value="metric.id"
                                class="mt-0.5"
                              />
                              <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2">
                                  <span class="text-sm text-ink-100 font-medium">{{ metric.name }}</span>
                                  <span v-if="metric.unit" class="text-xs text-ink-500">({{ metric.unit }})</span>
                                </div>
                                <p v-if="metric.description" class="text-xs text-ink-500 mt-0.5 leading-relaxed">
                                  {{ metric.description }}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Transition>
                      </div>
                    </div>
                  </NCheckboxGroup>
                </NScrollbar>
              </div>

              <div v-show="activeTab === 'selected'" class="h-full flex flex-col">
                <div class="px-5 py-2 flex items-center justify-between bg-ink-800/30 border-b border-ink-700/40">
                  <div class="flex items-center gap-2 text-xs text-ink-400">
                    <GripVertical class="w-3.5 h-3.5" />
                    <span>拖拽调整顺序，点击×移除</span>
                  </div>
                  <button
                    v-if="orderedMetrics.length > 0"
                    @click="() => { selectedIds = []; orderedMetrics = [] }"
                    class="text-xs text-rose-400/80 hover:text-rose-400 px-2 py-0.5 rounded hover:bg-rose-500/10 transition-colors"
                  >
                    清空全部
                  </button>
                </div>

                <NScrollbar class="flex-1">
                  <div v-if="orderedMetrics.length === 0" class="h-full flex items-center justify-center py-16">
                    <NEmpty description="还没有选择任何指标">
                      <template #icon>
                        <Layers class="w-10 h-10 text-ink-600" />
                      </template>
                      <NButton
                        size="small"
                        type="primary"
                        quaternary
                        @click="activeTab = 'browse'"
                        class="mt-3"
                      >
                        去选择指标
                      </NButton>
                    </NEmpty>
                  </div>

                  <div v-else class="p-4 space-y-2">
                    <div
                      v-for="(item, index) in selectedMetaList"
                      :key="item.id"
                      draggable="true"
                      @dragstart="handleDragStart(index)"
                      @dragover="handleDragOver($event, index)"
                      @dragleave="handleDragLeave"
                      @drop="handleDrop(index)"
                      @dragend="handleDragEnd"
                      :class="[
                        'group flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-200 cursor-move',
                        dragOverIndex === index
                          ? 'border-champagne-500/60 bg-champagne-500/10 scale-[1.02]'
                          : 'border-ink-700/50 bg-ink-800/30 hover:bg-ink-800/60 hover:border-ink-600/60',
                        dragIndex === index ? 'opacity-50' : ''
                      ]"
                    >
                      <GripVertical class="w-4 h-4 text-ink-600 group-hover:text-ink-400 transition-colors" />

                      <div class="w-7 h-7 rounded-lg bg-gradient-to-br"
                        :class="{
                          'from-wine-800/30 to-wine-950/50 text-wine-400': item.meta?.color === 'wine',
                          'from-champagne-700/30 to-champagne-900/50 text-champagne-400': item.meta?.color === 'gold',
                          'from-blue-800/30 to-blue-950/50 text-blue-400': item.meta?.color === 'blue',
                          'from-emerald-800/30 to-emerald-950/50 text-emerald-400': item.meta?.color === 'green'
                        }"
                      ></div>

                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="text-sm text-ink-200 font-medium">{{ item.meta?.name }}</span>
                          <span v-if="item.meta?.unit" class="text-xs text-ink-500">({{ item.meta.unit }})</span>
                        </div>
                        <p class="text-xs text-ink-500 mt-0.5 truncate">
                          {{ item.meta?.description }}
                        </p>
                      </div>

                      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          @click.stop="moveUp(index)"
                          :disabled="index === 0"
                          class="w-7 h-7 rounded flex items-center justify-center hover:bg-ink-700/60 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight class="w-4 h-4 text-ink-400 -rotate-90" />
                        </button>
                        <button
                          @click.stop="moveDown(index)"
                          :disabled="index === orderedMetrics.length - 1"
                          class="w-7 h-7 rounded flex items-center justify-center hover:bg-ink-700/60 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight class="w-4 h-4 text-ink-400 rotate-90" />
                        </button>
                        <button
                          @click.stop="removeMetric(item.id)"
                          class="w-7 h-7 rounded flex items-center justify-center hover:bg-rose-500/20 text-ink-400 hover:text-rose-400 transition-colors"
                        >
                          <X class="w-4 h-4" />
                        </button>
                      </div>

                      <div class="text-xs text-ink-600 font-mono w-5 text-center">
                        {{ index + 1 }}
                      </div>
                    </div>
                  </div>
                </NScrollbar>
              </div>
            </div>

            <div class="px-5 py-4 border-t border-ink-700/60 bg-ink-900/80 flex items-center justify-between">
              <button
                @click="handleReset"
                class="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-200 px-3 py-2 rounded-lg hover:bg-ink-800/60 transition-colors"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                恢复默认
              </button>

              <div class="flex items-center gap-2">
                <NButton
                  size="medium"
                  quaternary
                  @click="handleClose"
                  class="!border !border-ink-600/60"
                >
                  取消
                </NButton>
                <NButton
                  size="medium"
                  type="primary"
                  @click="handleSave"
                  :disabled="orderedMetrics.length > 0 && orderedMetrics.length > 8"
                >
                  <template #icon>
                    <Check class="w-4 h-4" />
                  </template>
                  {{ orderedMetrics.length > 8 ? `最多选 8 个` : '保存' }}
                </NButton>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 1000px;
}
</style>
