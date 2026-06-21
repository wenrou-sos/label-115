<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Settings, X, AlertTriangle, Highlighter, Activity } from 'lucide-vue-next'
import { NPopover, NSwitch, NSlider, NNumberAnimation, NTag } from 'naive-ui'
import { useDashboardStore, DEFAULT_ANOMALY_SETTINGS } from '@/stores/dashboard'

const store = useDashboardStore()
const { anomalySettings, anomalyCount } = storeToRefs(store)

const thresholdMarks: Record<number, string> = {
  1: '1%',
  5: '5%',
  10: '10%',
  15: '15%',
  20: '20%',
  30: '30%',
  50: '50%'
}

function resetToDefault() {
  store.setAnomalyEnabled(DEFAULT_ANOMALY_SETTINGS.enabled)
  store.setAnomalyThreshold(DEFAULT_ANOMALY_SETTINGS.thresholdPct)
  store.setHighlightMarks(DEFAULT_ANOMALY_SETTINGS.highlightMarks)
}
</script>

<template>
  <div class="relative">
    <NPopover
      trigger="click"
      placement="bottom-end"
      :show-arrow="false"
      trigger-class-name="!p-0"
      class="!p-0 settings-popover"
    >
      <template #trigger>
        <button
          class="flex items-center justify-center w-10 h-10 rounded-xl bg-ink-800/50 border border-ink-700/60 hover:bg-ink-800/80 hover:border-ink-600/80 transition-all duration-200"
        >
          <Settings class="w-5 h-5 text-ink-300" />
        </button>
      </template>

      <div class="w-[380px] max-w-[90vw] bg-ink-900 border border-champagne-500/20 rounded-xl overflow-hidden shadow-2xl">
        <div class="flex items-center justify-between px-4 py-3 border-b border-champagne-500/10 bg-gradient-to-r from-wine-900/30 to-ink-900">
          <div class="flex items-center gap-2">
            <Settings class="w-5 h-5 text-champagne-400" />
            <span class="font-serif-cn text-base font-semibold text-ink-100">检测设置</span>
          </div>
        </div>

        <div class="p-4 space-y-5">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <Activity class="w-4 h-4 text-champagne-400" />
                <span class="font-medium text-ink-100 text-sm">启用异常检测</span>
              </div>
              <p class="text-xs text-ink-400 leading-relaxed">
                自动检测数据环比异常波动，超出阈值时在图表和通知栏中标记
              </p>
            </div>
            <NSwitch
              :value="anomalySettings.enabled"
              @update:value="store.setAnomalyEnabled($event)"
              size="small"
            />
          </div>

          <div class="space-y-3" :class="{ 'opacity-40 pointer-events-none': !anomalySettings.enabled }">
            <div>
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <AlertTriangle class="w-4 h-4 text-amber-400" />
                  <span class="font-medium text-ink-100 text-sm">异常阈值</span>
                </div>
                <NTag round size="small" type="warning">
                  <NNumberAnimation :from="0" :to="anomalySettings.thresholdPct" :precision="0" />
                  %
                </NTag>
              </div>
              <NSlider
                :value="anomalySettings.thresholdPct"
                @update:value="store.setAnomalyThreshold($event as number)"
                :min="1"
                :max="50"
                :marks="thresholdMarks"
                :step="1"
                class="!py-1"
              />
              <p class="text-[11px] text-ink-500 mt-1.5 leading-relaxed">
                环比变化幅度超过该百分比时标记为异常；超过阈值 2 倍视为严重异常
              </p>
            </div>

            <div class="flex items-start justify-between gap-3 pt-3 border-t border-ink-700/50">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <Highlighter class="w-4 h-4 text-red-400" />
                  <span class="font-medium text-ink-100 text-sm">图表高亮标记</span>
                </div>
                <p class="text-xs text-ink-400 leading-relaxed">
                  在折线图、柱状图等图表上用醒目的红点标记异常数据点
                </p>
              </div>
              <NSwitch
                :value="anomalySettings.highlightMarks"
                @update:value="store.setHighlightMarks($event)"
                size="small"
              />
            </div>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-ink-700/50">
            <div class="text-[11px] text-ink-500">
              <span v-if="anomalySettings.enabled">当前检测到 <span class="text-amber-400 font-medium">{{ anomalyCount }}</span> 条异常</span>
              <span v-else>异常检测已关闭</span>
            </div>
            <button
              @click="resetToDefault"
              class="text-xs text-champagne-400/80 hover:text-champagne-400 px-2 py-1 rounded hover:bg-champagne-500/10 transition-colors"
            >
              恢复默认
            </button>
          </div>
        </div>
      </div>
    </NPopover>
  </div>
</template>

<style scoped>
:deep(.settings-popover .n-popover-content) {
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
:deep(.settings-popover .n-popover-arrow) {
  display: none !important;
}
</style>
