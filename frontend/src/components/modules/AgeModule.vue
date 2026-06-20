<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { CHART_COLORS, baseTooltip, baseLegend, baseGrid, darkAxisStyle } from '@/utils/chartOptions'
import { Users, Wine, Beer, GlassWater } from 'lucide-vue-next'
import type { EChartsOption } from 'echarts'

const store = useDashboardStore()

const categoryList = [
  { key: 'baijiu', name: '白酒', color: CHART_COLORS.baijiu },
  { key: 'beer', name: '啤酒', color: CHART_COLORS.beer },
  { key: 'craftBeer', name: '精酿', color: CHART_COLORS.craftBeer },
  { key: 'wine', name: '红酒', color: CHART_COLORS.wine },
  { key: 'sparkling', name: '起泡酒', color: CHART_COLORS.sparkling },
  { key: 'huangjiu', name: '黄酒', color: CHART_COLORS.huangjiu },
  { key: 'whiskey', name: '威士忌', color: CHART_COLORS.whiskey }
]

const barOption = computed<EChartsOption>(() => {
  const xAxisData = store.filteredAgeGroups.map(g => g.ageGroup)
  const activeKeys = new Set<string>()
  if (store.filters.selectedCategories.length > 0) {
    const mapCategory: Record<string, string> = {
      '白酒': 'baijiu', '啤酒': 'beer', '精酿啤酒': 'craftBeer',
      '红酒': 'wine', '果酒清酒': 'sparkling', '黄酒': 'huangjiu', '威士忌': 'whiskey'
    }
    store.filters.selectedCategories.forEach(c => {
      const k = mapCategory[c]
      if (k) activeKeys.add(k)
    })
  }
  const series = categoryList
    .filter(cat => activeKeys.size === 0 || activeKeys.has(cat.key))
    .map(cat => ({
      name: cat.name,
      type: 'bar' as const,
      stack: 'total',
      barMaxWidth: 48,
      itemStyle: {
        color: cat.color,
        borderRadius: [0, 0, 0, 0] as [number, number, number, number]
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: cat.color + '80'
        }
      },
      data: store.filteredAgeGroups.map(g => (g as any)[cat.key] ?? 0)
    }))
  if (series.length > 0) {
    series[series.length - 1].itemStyle.borderRadius = [4, 4, 0, 0]
  }
  return {
    tooltip: {
      ...baseTooltip,
      formatter: (params: any) => {
        let html = `${params[0].axisValue}<br/>`
        let total = 0
        params.forEach((p: any) => { total += p.value })
        params.forEach((p: any) => {
          const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0.0'
          html += `<span style="display:inline-block;margin-right:5px;border-radius:50%;width:8px;height:8px;background:${p.color}"></span>${p.seriesName}: ${p.value}% (${pct}%)<br/>`
        })
        return html
      }
    },
    legend: { ...baseLegend },
    grid: { ...baseGrid },
    xAxis: {
      type: 'category',
      data: xAxisData,
      ...darkAxisStyle
    },
    yAxis: {
      type: 'value',
      max: 100,
      ...darkAxisStyle,
      axisLabel: { ...darkAxisStyle.axisLabel, formatter: '{value}%' }
    },
    series
  }
})
</script>

<template>
  <div class="card-glass rounded-2xl p-6 w-full">
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-wine-800/50 to-wine-950/70 flex items-center justify-center border border-wine-700/30">
          <Users class="w-5 h-5 text-champagne-400" />
        </div>
        <h3 class="text-xl font-bold font-serif-cn text-gradient-gold">年龄代际消费差异分析</h3>
      </div>
    </div>

    <div class="h-80 mb-5">
      <VChart :option="barOption" autoresize />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="px-4 py-3 rounded-xl bg-gradient-to-br from-wine-900/40 to-wine-950/60 border border-wine-700/30">
        <div class="flex items-center gap-2 mb-1.5">
          <Beer class="w-4 h-4 text-champagne-400" />
          <span class="text-xs text-champagne-300 font-medium">30岁以下</span>
        </div>
        <p class="text-sm text-ink-200">白酒占比不足30%，偏好低度多元化酒饮</p>
      </div>
      <div class="px-4 py-3 rounded-xl bg-gradient-to-br from-wine-800/50 to-wine-950/70 border border-wine-700/30">
        <div class="flex items-center gap-2 mb-1.5">
          <Wine class="w-4 h-4 text-champagne-400" />
          <span class="text-xs text-champagne-300 font-medium">30-50岁</span>
        </div>
        <p class="text-sm text-ink-200">白酒消费主力人群，商务社交驱动</p>
      </div>
      <div class="px-4 py-3 rounded-xl bg-gradient-to-br from-champagne-900/30 to-champagne-950/50 border border-champagne-600/30">
        <div class="flex items-center gap-2 mb-1.5">
          <GlassWater class="w-4 h-4 text-champagne-400" />
          <span class="text-xs text-champagne-300 font-medium">Z世代</span>
        </div>
        <p class="text-sm text-ink-200">精酿/红酒/起泡酒增长迅猛</p>
      </div>
    </div>
  </div>
</template>
