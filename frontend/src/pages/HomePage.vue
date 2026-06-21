<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useLoadingBar, NSpin } from 'naive-ui'
import {
  TrendingUp,
  Layers,
  MapPin,
  Users,
  PartyPopper,
  Globe2,
  Wallet,
  Info,
  Sparkles,
  BarChart3,
  Gauge
} from 'lucide-vue-next'
import { useDashboardStore, AVAILABLE_METRICS } from '@/stores/dashboard'
import DashboardHeader from '@/components/layout/DashboardHeader.vue'
import FilterBar from '@/components/layout/FilterBar.vue'
import StatCard from '@/components/layout/StatCard.vue'
import CustomMetricsPanel from '@/components/layout/CustomMetricsPanel.vue'
import CategoryModule from '@/components/modules/CategoryModule.vue'
import RegionModule from '@/components/modules/RegionModule.vue'
import PriceModule from '@/components/modules/PriceModule.vue'
import AgeModule from '@/components/modules/AgeModule.vue'
import FestivalModule from '@/components/modules/FestivalModule.vue'
import ImportModule from '@/components/modules/ImportModule.vue'
import type { MetricMeta } from '@/types'

const store = useDashboardStore()
const { loading, overview, error, showPriceModule, customMetrics, filters } = storeToRefs(store)
const loadingBar = useLoadingBar()
const route = useRoute()
const router = useRouter()

const showCustomMetricsPanel = ref(false)

const metricIconMap: Record<string, any> = {
  'overview_totalMarket': Wallet,
  'overview_totalGrowth': TrendingUp,
  'overview_categoryCount': Layers,
  'overview_craftBeerIndex': Gauge,
  'category_baijiu_share': BarChart3,
  'category_beer_share': BarChart3,
  'category_wine_share': BarChart3,
  'category_huangjiu_share': BarChart3,
  'category_craftBeer_share': Sparkles,
  'category_whiskey_share': BarChart3,
  'category_baijiu_growth': TrendingUp,
  'category_beer_growth': TrendingUp,
  'category_wine_growth': TrendingUp,
  'category_craftBeer_growth': TrendingUp,
  'category_whiskey_growth': TrendingUp,
  'region_avgCraftIndex': Gauge,
  'region_topCraftCity': MapPin,
  'region_cityCount': Users
}

function getMetricIcon(id: string): any {
  return metricIconMap[id] || Sparkles
}

function getMetricMeta(id: string): MetricMeta | undefined {
  return AVAILABLE_METRICS.find(m => m.id === id)
}

onMounted(async () => {
  loadingBar.start()
  store.setRouter(router, route)
  store.initFilters(route)
  await store.fetchAll()
  if (error.value) {
    loadingBar.error()
  } else {
    loadingBar.finish()
  }
})

const defaultStatCards = computed(() => [
  {
    title: '总市场规模',
    value: overview.value ? (overview.value.totalMarket / 10000).toFixed(2) : '0.00',
    unit: '万亿元',
    trend: overview.value?.totalGrowth,
    trendLabel: '同比增长',
    icon: Wallet,
    color: 'wine' as const
  },
  {
    title: '品类覆盖数',
    value: overview.value?.categoryCount || 0,
    unit: '大品类',
    icon: Layers,
    color: 'gold' as const
  },
  {
    title: '精酿消费指数',
    value: overview.value?.craftBeerIndex.toFixed(1) || '0',
    trend: 28.1,
    trendLabel: '威士忌品类增速',
    icon: TrendingUp,
    color: 'green' as const
  },
  {
    title: '高增长品类',
    value: overview.value?.highlightCategories.join(' · ') || '-',
    icon: PartyPopper,
    color: 'blue' as const
  }
])

const customStatCards = computed(() => {
  const sorted = [...customMetrics.value.metrics]
    .sort((a, b) => a.order - b.order)
    .filter(m => store.isMetricAvailable(m.id))
  return sorted.map(m => {
    const meta = getMetricMeta(m.id)
    const value = store.getMetricValue(m.id)
    const trend = store.getMetricTrend(m.id)
    return {
      title: meta?.name || m.id,
      value,
      unit: meta?.unit,
      trend,
      trendLabel: trend !== undefined ? '相关趋势' : undefined,
      icon: getMetricIcon(m.id),
      color: meta?.color || 'wine' as const
    }
  })
})

const displayStatCards = computed(() => {
  if (customMetrics.value.enabled && customMetrics.value.metrics.length > 0) {
    return customStatCards.value
  }
  return defaultStatCards.value
})

const gridColsClass = computed(() => {
  const count = displayStatCards.value.length
  if (count <= 2) return 'lg:grid-cols-2'
  if (count === 3) return 'lg:grid-cols-3'
  if (count === 4) return 'lg:grid-cols-4'
  return 'lg:grid-cols-4'
})

function handleOpenCustomMetrics() {
  showCustomMetricsPanel.value = true
}
</script>

<template>
  <div class="min-h-screen">
    <DashboardHeader @openCustomMetrics="handleOpenCustomMetrics" />

    <main class="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
      <div v-if="loading && !overview" class="flex items-center justify-center py-32">
        <NSpin size="large" :stroke-width="4" show>
          <div class="w-40 h-40 rounded-2xl bg-ink-800/30"></div>
        </NSpin>
      </div>

      <template v-else>
        <section class="mb-6 md:mb-8">
          <FilterBar />
        </section>

        <section v-if="displayStatCards.length > 0" class="mb-6 md:mb-8">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div v-if="customMetrics.enabled && customMetrics.metrics.length > 0">
                <span class="text-xs px-2 py-0.5 rounded-full bg-champagne-500/10 text-champagne-400 border border-champagne-500/30">
                  自定义指标
                </span>
              </div>
              <h2 v-else class="text-sm text-ink-400 font-medium">核心指标</h2>
            </div>
            <button
              v-if="customMetrics.enabled && customMetrics.metrics.length > 0"
              @click="showCustomMetricsPanel = true"
              class="text-xs text-ink-400 hover:text-champagne-400 px-2 py-1 rounded hover:bg-ink-800/60 transition-colors flex items-center gap-1"
            >
              <Sparkles class="w-3.5 h-3.5" />
              编辑指标
            </button>
          </div>
          <div :class="['grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5', gridColsClass]">
            <StatCard v-for="(card, idx) in displayStatCards" :key="card.title + idx" v-bind="card" />
          </div>
        </section>

        <section class="space-y-5 md:space-y-6">
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6">
            <CategoryModule />
            <RegionModule />
          </div>

          <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6">
            <PriceModule v-if="showPriceModule" />
            <div v-else class="card-glass rounded-2xl p-6 flex flex-col items-center justify-center min-h-[420px] text-center">
              <div class="w-16 h-16 rounded-full bg-ink-800/60 flex items-center justify-center mb-4">
                <Info class="w-8 h-8 text-champagne-500" />
              </div>
              <h3 class="text-lg font-semibold text-ink-200 mb-2 font-serif-cn">白酒价格带分析</h3>
              <p class="text-sm text-ink-400 max-w-xs">
                请在<span class="text-champagne-400 font-medium">品类筛选</span>中选择「白酒」以查看价格带分布数据
              </p>
            </div>
            <AgeModule />
          </div>

          <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6">
            <FestivalModule />
            <ImportModule />
          </div>
        </section>

        <footer class="mt-10 md:mt-14 pt-6 border-t border-ink-700/50">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-ink-400">
            <div class="flex items-center gap-2">
              <Globe2 class="w-3.5 h-3.5 text-champagne-500/70" />
              <span>中国酒类市场消费数据分析平台 · 数据仅供研究参考</span>
            </div>
            <div class="flex items-center gap-2">
              <MapPin class="w-3.5 h-3.5 text-champagne-500/70" />
              <Users class="w-3.5 h-3.5 text-champagne-500/70" />
              <span>© 2025 Liquor Market Analytics</span>
            </div>
          </div>
        </footer>
      </template>
    </main>

    <CustomMetricsPanel v-model:show="showCustomMetricsPanel" />
  </div>
</template>
