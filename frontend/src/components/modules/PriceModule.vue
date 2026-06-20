<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { CHART_COLORS, baseTooltip, baseLegend, baseGrid, darkAxisStyle } from '@/utils/chartOptions'
import { TrendingUp, Gem, Sparkles } from 'lucide-vue-next'
import type { EChartsOption } from 'echarts'

const store = useDashboardStore()

const priceColors = ['#8B0000', '#A52A2A', '#CD5C5C', '#D4AF37', '#FFD700']

const pieOption = computed<EChartsOption>(() => {
  const data = store.priceRanges.map((item, idx) => ({
    name: item.range,
    value: item.share,
    itemStyle: { color: priceColors[idx % priceColors.length] }
  }))
  return {
    tooltip: {
      ...baseTooltip,
      trigger: 'item',
      formatter: '{b}: {c}% ({d}%)'
    },
    legend: {
      ...baseLegend,
      orient: 'vertical',
      right: '5%',
      top: 'center'
    },
    series: [{
      name: '价格带份额',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: 'rgba(15, 15, 26, 0.8)',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'outside',
        color: '#c9c9d3',
        fontSize: 11,
        formatter: '{b}\n{c}%'
      },
      labelLine: { lineStyle: { color: '#3a3a4a' } },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#D4AF37' },
        itemStyle: { shadowBlur: 20, shadowColor: 'rgba(212, 175, 55, 0.5)' }
      },
      data
    }]
  }
})

const areaOption = computed<EChartsOption>(() => {
  const years = store.years.length > 0 ? store.years : ['2021', '2022', '2023', '2024', '2025']
  const series = store.priceRanges.map((item, idx) => ({
    name: item.range,
    type: 'line' as const,
    stack: 'total',
    smooth: true,
    areaStyle: {
      color: {
        type: 'linear' as const,
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: priceColors[idx % priceColors.length] + 'CC' },
          { offset: 1, color: priceColors[idx % priceColors.length] + '33' }
        ]
      }
    },
    lineStyle: { color: priceColors[idx % priceColors.length], width: 2 },
    itemStyle: { color: priceColors[idx % priceColors.length] },
    data: item.trend.length > 0 ? item.trend : []
  }))
  return {
    tooltip: {
      ...baseTooltip,
      formatter: (params: any) => {
        let html = `${params[0].axisValue}<br/>`
        params.forEach((p: any) => {
          html += `<span style="display:inline-block;margin-right:5px;border-radius:50%;width:8px;height:8px;background:${p.color}"></span>${p.seriesName}: ${p.value}%<br/>`
        })
        return html
      }
    },
    legend: { ...baseLegend },
    grid: { ...baseGrid },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: years,
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
          <Gem class="w-5 h-5 text-champagne-400" />
        </div>
        <h3 class="text-xl font-bold font-serif-cn text-gradient-gold">白酒价格带分析</h3>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="h-72">
        <VChart :option="pieOption" autoresize />
      </div>
      <div class="h-72">
        <VChart :option="areaOption" autoresize />
      </div>
    </div>

    <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div class="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-wine-900/40 to-wine-950/60 border border-wine-700/30">
        <TrendingUp class="w-5 h-5 text-champagne-400 flex-shrink-0" />
        <span class="text-sm text-ink-200">300-800元大众高端价格带持续扩容</span>
      </div>
      <div class="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-champagne-900/30 to-champagne-950/50 border border-champagne-600/30">
        <Sparkles class="w-5 h-5 text-champagne-400 flex-shrink-0" />
        <span class="text-sm text-ink-200">800元以上高端白酒增速最快</span>
      </div>
    </div>
  </div>
</template>
