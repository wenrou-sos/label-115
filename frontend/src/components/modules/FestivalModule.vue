<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import { useDashboardStore } from '@/stores/dashboard'
import { CHART_COLORS, baseTooltip, baseLegend, baseGrid, darkAxisStyle } from '@/utils/chartOptions'
import { Sparkles } from 'lucide-vue-next'

const store = useDashboardStore()

const categoryColors: Record<string, string> = {
  '白酒': CHART_COLORS.baijiu,
  '红酒': CHART_COLORS.wine,
  '啤酒': CHART_COLORS.beer,
  '威士忌': CHART_COLORS.whiskey,
  '香槟/起泡酒': CHART_COLORS.sparkling
}

const allCategories = computed(() => {
  const cats = new Set<string>()
  store.filteredFestivals.forEach(f => f.data.forEach(d => cats.add(d.category)))
  return Array.from(cats)
})

const chartOption = computed<EChartsOption>(() => {
  const festivals = store.filteredFestivals.map(f => f.festival)
  const series = allCategories.value.map(category => ({
    name: category,
    type: 'bar' as const,
    barMaxWidth: 28,
    itemStyle: {
      color: categoryColors[category] || CHART_COLORS.wine,
      borderRadius: [4, 4, 0, 0]
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 12,
        shadowColor: categoryColors[category] || CHART_COLORS.wine
      }
    },
    data: store.filteredFestivals.map(f => {
      const item = f.data.find(d => d.category === category)
      return item ? item.salesMultiple : null
    })
  }))

  return {
    tooltip: {
      ...baseTooltip,
      formatter: (params: any) => {
        const arr = Array.isArray(params) ? params : [params]
        const festival = arr[0].axisValue
        const festivalData = store.filteredFestivals.find(f => f.festival === festival)
        let html = `<div style="font-weight:600;margin-bottom:8px;color:#D4AF37">${festival}</div>`
        arr.forEach((p: any) => {
          if (p.value != null) {
            html += `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
              <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${p.color}"></span>
              <span>${p.seriesName}：<strong style="color:#fff">${p.value}倍</strong></span>
            </div>`
          }
        })
        if (festivalData) {
          const avgHighEnd = (festivalData.data.reduce((s, d) => s + d.highEndRatio, 0) / festivalData.data.length).toFixed(1)
          html += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(212,175,55,0.2)">
            <span style="color:#9c9cab">平均高端酒占比：</span>
            <strong style="color:#D4AF37">${avgHighEnd}%</strong>
          </div>`
        }
        return html
      }
    },
    legend: {
      ...baseLegend,
      data: allCategories.value
    },
    grid: baseGrid,
    xAxis: {
      type: 'category',
      data: festivals,
      ...darkAxisStyle,
      axisLabel: {
        ...darkAxisStyle.axisLabel,
        fontWeight: 500
      }
    },
    yAxis: {
      type: 'value',
      name: '销售倍数',
      nameTextStyle: { color: '#9c9cab', fontSize: 12 },
      ...darkAxisStyle,
      axisLabel: {
        ...darkAxisStyle.axisLabel,
        formatter: '{value}x'
      }
    },
    series
  }
})

const highlightTags = computed(() => [
  { label: '春节白酒', value: '3-5倍', color: 'wine' },
  { label: '情人节红酒香槟', value: '5-8倍', color: 'gold' },
  { label: '中秋高端酒', value: '45%+', color: 'wine' }
])
</script>

<template>
  <div class="card-glass rounded-xl p-5 flex flex-col h-full">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <Sparkles class="w-5 h-5 text-champagne-400" />
        <h3 class="text-lg font-semibold font-serif-cn text-white">节日消费效应分析</h3>
      </div>
      <div class="flex gap-2 flex-wrap">
        <span
          v-for="tag in highlightTags"
          :key="tag.label"
          class="text-xs px-2.5 py-1 rounded-full font-medium"
          :class="tag.color === 'wine'
            ? 'bg-wine-900/40 text-wine-300 border border-wine-700/40'
            : 'bg-champagne-900/30 text-champagne-300 border border-champagne-600/30'"
        >
          {{ tag.label }} {{ tag.value }}
        </span>
      </div>
    </div>

    <div class="flex-1 min-h-[320px]">
      <VChart :option="chartOption" autoresize class="w-full h-full" />
    </div>
  </div>
</template>
