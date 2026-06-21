<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { AlertTriangle, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { NPopover, NTag, NSpace, NScrollbar, NEmpty } from 'naive-ui'
import { useDashboardStore } from '@/stores/dashboard'
import type { AnomalyPoint } from '@/types'

const store = useDashboardStore()
const { anomalies, anomalyCount, criticalAnomalyCount, anomalySettings } = storeToRefs(store)
const expanded = ref(false)

const groupedAnomalies = computed(() => {
  const groups: Record<string, AnomalyPoint[]> = {}
  anomalies.value.forEach(a => {
    if (!groups[a.moduleLabel]) groups[a.moduleLabel] = []
    groups[a.moduleLabel].push(a)
  })
  return groups
})

const badgeClass = computed(() => {
  if (!anomalySettings.value.enabled || anomalyCount.value === 0) return ''
  if (criticalAnomalyCount.value > 0) return 'animate-pulse-ring'
  return 'animate-pulse-soft'
})

function severityTagType(s: string) {
  return s === 'critical' ? 'error' : 'warning'
}

function severityIconClass(s: string) {
  return s === 'critical' ? 'text-red-500' : 'text-amber-400'
}
</script>

<template>
  <div class="relative">
    <NPopover
      trigger="click"
      placement="bottom-end"
      :show-arrow="false"
      trigger-class-name="!p-0"
      class="!p-0 anomaly-popover"
    >
      <template #trigger>
        <button
          class="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200"
          :class="[
            anomalySettings.enabled && anomalyCount > 0
              ? 'bg-red-900/30 border border-red-500/40 hover:bg-red-900/50 hover:border-red-500/60'
              : 'bg-ink-800/50 border border-ink-700/60 hover:bg-ink-800/80 hover:border-ink-600/80'
          ]"
          :disabled="!anomalySettings.enabled"
        >
          <AlertTriangle
            v-if="anomalySettings.enabled && criticalAnomalyCount > 0"
            class="w-5 h-5 text-red-400"
            :class="badgeClass"
          />
          <AlertCircle
            v-else-if="anomalySettings.enabled && anomalyCount > 0"
            class="w-5 h-5 text-amber-400"
            :class="badgeClass"
          />
          <AlertCircle v-else class="w-5 h-5 text-ink-400" />
          <span
            v-if="anomalySettings.enabled && anomalyCount > 0"
            class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            :class="criticalAnomalyCount > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-ink-900'"
          >
            {{ anomalyCount }}
          </span>
        </button>
      </template>

      <div class="w-[420px] max-w-[90vw] bg-ink-900 border border-champagne-500/20 rounded-xl overflow-hidden shadow-2xl">
        <div class="flex items-center justify-between px-4 py-3 border-b border-champagne-500/10 bg-gradient-to-r from-wine-900/40 to-ink-900">
          <div class="flex items-center gap-2">
            <AlertTriangle v-if="criticalAnomalyCount > 0" class="w-5 h-5 text-red-400" />
            <AlertCircle v-else class="w-5 h-5 text-amber-400" />
            <span class="font-serif-cn text-base font-semibold text-ink-100">数据异常预警</span>
            <NTag v-if="anomalyCount > 0" size="small" :type="criticalAnomalyCount > 0 ? 'error' : 'warning'">
              共 {{ anomalyCount }} 条
            </NTag>
            <NTag v-else size="small" type="success">暂无异常</NTag>
          </div>
          <button
            @click.stop="expanded = !expanded"
            class="text-ink-400 hover:text-champagne-400 transition-colors p-1 rounded"
          >
            <ChevronUp v-if="expanded" class="w-4 h-4" />
            <ChevronDown v-else class="w-4 h-4" />
          </button>
        </div>

        <NEmpty v-if="anomalyCount === 0" class="py-10" description="当前数据在阈值范围内波动正常">
          <template #icon>
            <div class="w-14 h-14 rounded-full bg-green-900/30 flex items-center justify-center mx-auto">
              <svg class="w-7 h-7 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </template>
        </NEmpty>

        <NScrollbar v-else style="max-height: 60vh">
          <div class="py-2">
            <template v-for="(list, moduleLabel) in groupedAnomalies" :key="moduleLabel">
              <div class="px-4 py-2 text-xs font-semibold text-champagne-400/80 uppercase tracking-wider">
                {{ moduleLabel }}（{{ list.length }}）
              </div>
              <div v-if="expanded" class="space-y-1">
                <div
                  v-for="item in list"
                  :key="item.id"
                  class="mx-3 mb-2 rounded-lg p-3 border transition-all"
                  :class="item.severity === 'critical' ? 'bg-red-950/30 border-red-500/30 hover:bg-red-950/50' : 'bg-amber-950/20 border-amber-500/25 hover:bg-amber-950/40'"
                >
                  <div class="flex items-start gap-2">
                    <AlertCircle :class="['w-4 h-4 mt-0.5 flex-shrink-0', severityIconClass(item.severity)]" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <span class="font-medium text-ink-100 text-sm">{{ item.entity }}</span>
                        <NTag size="tiny" :type="severityTagType(item.severity)" round>
                          {{ item.changePct > 0 ? '+' : '' }}{{ item.changePct.toFixed(1) }}%
                        </NTag>
                        <NTag size="tiny" type="info" round>
                          {{ item.timePoint }}
                        </NTag>
                      </div>
                      <p class="text-xs text-ink-300 leading-relaxed">
                        {{ item.message }}
                      </p>
                      <p class="text-[11px] text-ink-500 mt-1">
                        {{ item.metric }}：{{ item.previous.toFixed(2) }} → {{ item.current.toFixed(2) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="space-y-1">
                <div
                  v-for="item in list.slice(0, 2)"
                  :key="item.id"
                  class="mx-3 mb-1.5 rounded-md px-3 py-2 border flex items-center gap-2"
                  :class="item.severity === 'critical' ? 'bg-red-950/20 border-red-500/20' : 'bg-amber-950/15 border-amber-500/20'"
                >
                  <AlertCircle :class="['w-3.5 h-3.5 flex-shrink-0', severityIconClass(item.severity)]" />
                  <span class="text-xs text-ink-200 truncate flex-1">{{ item.entity }}·{{ item.timePoint }}</span>
                  <NTag size="tiny" :type="severityTagType(item.severity)" round>
                    {{ item.changePct > 0 ? '+' : '' }}{{ item.changePct.toFixed(1) }}%
                  </NTag>
                </div>
                <div
                  v-if="list.length > 2"
                  class="mx-3 text-xs text-ink-500 px-2 py-1"
                >
                  还有 {{ list.length - 2 }} 条，点击展开查看全部
                </div>
              </div>
            </template>
          </div>
        </NScrollbar>

        <div class="px-4 py-2.5 border-t border-champagne-500/10 bg-ink-800/30 flex items-center justify-between text-[11px] text-ink-400">
          <span>阈值：{{ anomalySettings.thresholdPct }}%</span>
          <NSpace size="small">
            <span v-if="criticalAnomalyCount > 0" class="text-red-400">● 严重 {{ criticalAnomalyCount }}</span>
            <span v-if="anomalyCount - criticalAnomalyCount > 0" class="text-amber-400">● 警告 {{ anomalyCount - criticalAnomalyCount }}</span>
          </NSpace>
        </div>
      </div>
    </NPopover>
  </div>
</template>

<style scoped>
@keyframes pulse-ring {
  0%, 100% { filter: drop-shadow(0 0 0 rgba(239, 68, 68, 0.6)); transform: scale(1); }
  50% { filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8)); transform: scale(1.08); }
}
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.animate-pulse-ring {
  animation: pulse-ring 1.5s ease-in-out infinite;
}
.animate-pulse-soft {
  animation: pulse-soft 2s ease-in-out infinite;
}
:deep(.anomaly-popover .n-popover-content) {
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
:deep(.anomaly-popover .n-popover-arrow) {
  display: none !important;
}
</style>
