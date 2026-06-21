<script setup lang="ts">
import { Wine, RefreshCw, TrendingUp, Calendar, Share2 } from 'lucide-vue-next'
import { NButton, NSpace, useLoadingBar, useMessage } from 'naive-ui'
import { useRoute } from 'vue-router'
import { useDashboardStore, copyShareUrl } from '@/stores/dashboard'
import { storeToRefs } from 'pinia'
import AnomalyBadge from './AnomalyBadge.vue'
import SettingsPanel from './SettingsPanel.vue'

const store = useDashboardStore()
const { loading, overview } = storeToRefs(store)
const loadingBar = useLoadingBar()
const message = useMessage()
const route = useRoute()

async function handleRefresh() {
  loadingBar.start()
  await store.fetchAll()
  loadingBar.finish()
}

function handleShare() {
  const url = store.getShareUrl(route.path)
  copyShareUrl(url, message)
}
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-champagne-500/20 backdrop-blur-xl bg-ink-900/80">
    <div class="container mx-auto px-4 md:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
        <div class="flex items-center gap-3">
          <div class="relative">
            <div class="absolute inset-0 bg-wine-800 blur-xl opacity-40 rounded-full animate-pulse-slow"></div>
            <div class="relative w-12 h-12 rounded-xl bg-gradient-to-br from-wine-800 to-wine-950 border border-champagne-500/30 flex items-center justify-center shadow-glow-wine">
              <Wine class="w-6 h-6 text-champagne-400" />
            </div>
          </div>
          <div>
            <h1 class="font-serif-cn text-xl md:text-2xl font-bold text-gradient-gold tracking-wide">
              中国酒类市场数据分析看板
            </h1>
            <div class="flex items-center gap-2 mt-0.5 text-xs text-ink-300">
              <TrendingUp class="w-3.5 h-3.5 text-champagne-500" />
              <span>2021-2025 全品类行业洞察</span>
              <span v-if="overview" class="text-champagne-500/80">
                | 总市场规模 ¥{{ (overview.totalMarket / 10000).toFixed(2) }} 万亿
              </span>
            </div>
          </div>
        </div>

        <NSpace align="center">
          <div class="hidden sm:flex items-center gap-2 text-sm text-ink-400 bg-ink-800/50 px-3 py-1.5 rounded-lg border border-ink-700/50">
            <Calendar class="w-4 h-4 text-champagne-500/70" />
            <span>数据更新: 2025年Q4</span>
          </div>
          <AnomalyBadge />
          <SettingsPanel />
          <NButton
            size="medium"
            quaternary
            @click="handleShare"
            class="!border !border-ink-600/60 hover:!border-champagne-500/60"
          >
            <template #icon>
              <Share2 class="w-4 h-4 text-champagne-400" />
            </template>
            <span class="text-champagne-300">复制分享链接</span>
          </NButton>
          <NButton
            type="primary"
            size="medium"
            quaternary
            :loading="loading"
            @click="handleRefresh"
            class="!border !border-champagne-500/40 hover:!border-champagne-500/70"
          >
            <template #icon>
              <RefreshCw class="w-4 h-4" />
            </template>
            刷新数据
          </NButton>
        </NSpace>
      </div>
    </div>
  </header>
</template>
