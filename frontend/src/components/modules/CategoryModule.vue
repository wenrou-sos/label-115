<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { baseTooltip, baseLegend, baseGrid, darkAxisStyle } from '@/utils/chartOptions'

use([PieChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const store = useDashboardStore()

const pieOption = computed<EChartsOption>(() => {
  const data = store.categories.map(c => ({
    name: c.name,
    value: c.share
  }))

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 15, 26, 0.95)',
      borderColor: '#D4AF37',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: '{b}: {c}%'
    },
    legend: {
      ...baseLegend,
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemWidth: 12,
      itemHeight: 12
    },
    color: ['#8B0000', '#F4A460', '#B22222', '#DAA520', '#FF69B4', '#CD853F'],
    series: [
      {
        name: '品类占比',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#1A1A2E',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'inside',
          formatter: '{c}%',
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold'
        },
        labelLine: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(212, 175, 55, 0.5)'
          }
        },
        data
      }
    ]
  }
})

const lineOption = computed<EChartsOption>(() => {
  const years = store.years
  const series = store.categories.map(c => ({
    name: c.name,
    type: 'line' as const,
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { width: 2 },
    itemStyle: { color: c.color },
    data: c.growth
  }))

  return {
    tooltip: baseTooltip,
    legend: { ...baseLegend, top: 0 },
    grid: baseGrid,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: years,
      ...darkAxisStyle
    },
    yAxis: {
      type: 'value',
      axisLabel: { ...darkAxisStyle.axisLabel, formatter: '{value}%' },
      axisLine: darkAxisStyle.axisLine,
      splitLine: darkAxisStyle.splitLine
    },
    series
  }
})

const highlightMetrics = computed(() => [
  {
    title: '白酒占比',
    value: '62.5%',
    desc: '超60%主导地位',
    icon: PieChartIcon,
    color: 'wine' as const
  },
  {
    title: '精酿啤酒增速',
    value: '25%+',
    desc: '新锐品类高增长',
    icon: Activity,
    color: 'gold' as const
  },
  {
    title: '威士忌增速',
    value: '28%+',
    desc: '进口烈酒领跑',
    icon: TrendingUp,
    color: 'wine' as const
  }
])
</script>

<template>
  <div class="card-glass rounded-xl p-6 h-full flex flex-col">
    <h2 class="text-xl font-serif-cn font-bold text-gradient-gold mb-5">品类结构分析</h2>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 flex-1 min-h-0">
      <div class="bg-ink-900/40 rounded-lg p-3 min-h-[280px]">
        <VChart class="w-full h-full" :option="pieOption" autoresize />
      </div>
      <div class="bg-ink-900/40 rounded-lg p-3 min-h-[280px]">
        <VChart class="w-full h-full" :option="lineOption" autoresize />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div
        v-for="metric in highlightMetrics"
        :key="metric.title"
        class="card-glass rounded-lg p-4 flex items-center gap-4 hover:-translate-y-0.5 transition-transform duration-300"
      >
        <div
          class="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
          :class="metric.color === 'wine' ? 'bg-gradient-to-br from-wine-800/50 to-wine-950/70 text-wine-400' : 'bg-gradient-to-br from-champagne-700/40 to-champagne-900/60 text-champagne-400'"
        >
          <component :is="metric.icon" class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <div class="text-xs text-ink-300 mb-1">{{ metric.title }}</div>
          <div
            class="text-xl font-bold font-serif-cn"
            :class="metric.color === 'wine' ? 'text-gradient-wine' : 'text-gradient-gold'"
          >
            {{ metric.value }}
          </div>
          <div class="text-xs text-ink-400 mt-0.5 truncate">{{ metric.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
