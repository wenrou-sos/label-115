<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkPointComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-vue-next'
import { NTag } from 'naive-ui'
import { useDashboardStore } from '@/stores/dashboard'
import { useAnnotations } from '@/composables/useAnnotations'
import AnnotationTags from '@/components/layout/AnnotationTags.vue'
import AnnotationDialog from '@/components/layout/AnnotationDialog.vue'
import type { AnnotationPoint } from '@/types'

use([PieChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer, MarkPointComponent])

const store = useDashboardStore()
const annotations = useAnnotations()

const priceColors = ['#3A3A4A', '#8B0000', '#A0522D', '#D4AF37', '#FFD700']

const showDialog = ref(false)
const dialogPayload = ref({
  entityName: '',
  metricName: '',
  timePoint: undefined as string | undefined,
  value: undefined as number | undefined,
  color: '#D4AF37',
  initialContent: ''
})
const existingId = ref<string | null>(null)

function openAnnotation(range: string, metric: string, timePoint?: string, value?: number) {
  const idx = store.priceRanges.findIndex(p => p.range === range)
  const color = priceColors[idx % priceColors.length]
  const existing = annotations.getAnnotation('price', range, metric, timePoint)
  existingId.value = existing?.id || null
  dialogPayload.value = {
    entityName: range,
    metricName: metric,
    timePoint,
    value,
    color,
    initialContent: existing?.content || ''
  }
  showDialog.value = true
}

function onPieClick(params: any) {
  if (params && params.name && typeof params.value === 'number') {
    openAnnotation(params.name, '当前份额', undefined, params.value)
  }
}

function onLineClick(params: any) {
  if (params && params.seriesName && params.name && typeof params.value === 'number') {
    openAnnotation(params.seriesName, '份额趋势', String(params.name), params.value)
  }
}

function handleDialogConfirm(content: string) {
  if (existingId.value) {
    annotations.updateAnnotation(existingId.value, content)
  } else {
    annotations.addAnnotation({
      module: 'price',
      entity: dialogPayload.value.entityName,
      metric: dialogPayload.value.metricName,
      timePoint: dialogPayload.value.timePoint,
      value: dialogPayload.value.value,
      color: dialogPayload.value.color,
      content
    })
  }
  showDialog.value = false
}

function handleTagEdit(item: AnnotationPoint) {
  existingId.value = item.id
  dialogPayload.value = {
    entityName: item.entity,
    metricName: item.metric,
    timePoint: item.timePoint,
    value: item.value,
    color: item.color,
    initialContent: item.content
  }
  showDialog.value = true
}

const pieOption = computed<EChartsOption>(() => {
  const raw = store.priceRanges
  const total = raw.reduce((s, p) => s + p.share, 0) || 1
  const data = raw.map((p, idx) => {
    const ann = annotations.getAnnotation('price', p.range, '当前份额')
    return {
      name: p.range,
      value: Number(((p.share / total) * 100).toFixed(1)),
      itemStyle: {
        color: priceColors[idx % priceColors.length],
        ...(ann ? {
          borderColor: priceColors[idx % priceColors.length],
          borderWidth: 3,
          shadowBlur: 14,
          shadowColor: priceColors[idx % priceColors.length]
        } : {})
      }
    }
  })
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 15, 26, 0.95)',
      borderColor: '#D4AF37',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: (p: any) => {
        const ann = annotations.getAnnotation('price', p.name, '当前份额')
        let html = `<div><b>${p.name}</b>：<span style="color:#D4AF37">${p.value}%</span></div>`
        if (ann) {
          html += `<div style="margin-top:6px;padding:4px 6px;background:${ann.color}22;border-left:2px solid ${ann.color};border-radius:3px;font-size:12px;color:#e5e5ea">
            📝 ${ann.content}
          </div>`
        }
        html += `<div style="margin-top:6px;font-size:11px;color:#888;border-top:1px solid #333;padding-top:4px">💡 点击此扇区可添加标注</div>`
        return html
      }
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#c9c9d3', fontSize: 11 },
      itemWidth: 12,
      itemHeight: 12
    },
    series: [{
      name: '白酒价格带',
      type: 'pie',
      radius: ['40%', '68%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#1A1A2E',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}\n{d}%',
        color: '#fff',
        fontSize: 11,
        lineHeight: 16
      },
      data
    }]
  }
})

const lineOption = computed<EChartsOption>(() => {
  const years = store.filteredYears.length > 0 ? store.filteredYears : store.years
  const highlightMarks = store.anomalySettings.highlightMarks

  const series = store.priceRanges.map((p, idx) => {
    const prAnomalies = highlightMarks ? store.getPriceAnomaliesByRange(p.range) : []
    const markPointData: any[] = []

    prAnomalies.forEach(a => {
      const yIdx = years.indexOf(a.timePoint)
      if (yIdx >= 0) {
        markPointData.push({
          name: a.message,
          coord: [a.timePoint, a.current],
          value: a.changePct > 0 ? `+${a.changePct.toFixed(0)}%` : `${a.changePct.toFixed(0)}%`,
          symbol: 'circle',
          symbolSize: a.severity === 'critical' ? 22 : 16,
          itemStyle: {
            color: a.severity === 'critical' ? '#ef4444' : '#f59e0b',
            borderColor: '#1A1A2E',
            borderWidth: 2
          },
          label: {
            show: true, position: 'top',
            color: a.severity === 'critical' ? '#fca5a5' : '#fcd34d',
            fontSize: 10, fontWeight: 700,
            formatter: a.changePct > 0 ? `+${a.changePct.toFixed(0)}%!` : `${a.changePct.toFixed(0)}%!`
          }
        })
      }
    })

    years.forEach((y, yi) => {
      const ann = annotations.getAnnotation('price', p.range, '份额趋势', y)
      if (ann) {
        const value = p.trend[yi]
        if (value !== undefined) {
          markPointData.push({
            name: ann.content,
            coord: [y, value],
            value: '📝',
            symbol: 'pin',
            symbolSize: 36,
            itemStyle: {
              color: priceColors[idx % priceColors.length],
              borderColor: '#1A1A2E',
              borderWidth: 2,
              shadowBlur: 8,
              shadowColor: priceColors[idx % priceColors.length]
            },
            label: { show: true, color: '#fff', fontSize: 10, formatter: '📝' }
          })
        }
      }
    })

    return {
      name: p.range,
      type: 'line' as const,
      smooth: true,
      stack: 'price',
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2, color: priceColors[idx % priceColors.length] },
      itemStyle: { color: priceColors[idx % priceColors.length] },
      areaStyle: {
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: `${priceColors[idx % priceColors.length]}66` },
            { offset: 1, color: `${priceColors[idx % priceColors.length]}08` }
          ]
        }
      },
      data: p.trend,
      markPoint: markPointData.length > 0 ? {
        symbol: 'circle',
        symbolSize: 14,
        label: { show: true, fontSize: 10, fontWeight: 700 },
        data: markPointData
      } : undefined
    }
  })

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 15, 26, 0.95)',
      borderColor: '#D4AF37',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 13 },
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        let html = `<div style="font-weight:bold;margin-bottom:6px;color:#D4AF37">${list[0]?.axisValue || ''}</div>`
        list.forEach((p: any) => {
          const ann = annotations.getAnnotation('price', p.seriesName, '份额趋势', list[0]?.axisValue)
          html += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
            <span>${p.seriesName}：<b>${p.value}%</b></span>
          </div>`
          if (p.marker && p.data && typeof p.data === 'object' && p.data.value && String(p.data.value).includes('%')) {
            html += `<div style="font-size:11px;color:${String(p.data.value).startsWith('+') ? '#fca5a5' : '#fcd34d'};margin-left:14px">
              ⚠ ${p.data.value} 异常
            </div>`
          }
          if (ann) {
            html += `<div style="margin:4px 0 4px 14px;padding:3px 6px;background:${ann.color}22;border-left:2px solid ${ann.color};border-radius:3px;font-size:11px;color:#e5e5ea">
              📝 ${ann.content}
            </div>`
          }
        })
        html += `<div style="margin-top:6px;font-size:11px;color:#888;border-top:1px solid #333;padding-top:4px">💡 点击折线拐点可添加标注</div>`
        return html
      }
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#c9c9d3', fontSize: 11 },
      itemWidth: 12,
      itemHeight: 12
    },
    grid: { left: 40, right: 20, top: 20, bottom: 50 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: years,
      axisLabel: { color: '#9c9cab', fontSize: 11 },
      axisLine: { lineStyle: { color: '#3A3A4A' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#9c9cab', fontSize: 11, formatter: '{value}%' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(58, 58, 74, 0.6)' } }
    },
    series
  }
})

const insights = computed(() => {
  const ranges = store.priceRanges
  return [
    {
      title: '大众酒份额',
      value: `${ranges.find(r => r.range.includes('百元'))?.share ?? 0}%`,
      desc: '仍占主导地位',
      icon: DollarSign,
      trend: 'down' as const
    },
    {
      title: '高端酒增速',
      value: `${ranges.find(r => r.range.includes('2000'))?.trend.slice(-1)[0] ?? 0}%`,
      desc: '连续提升明显',
      icon: TrendingUp,
      trend: 'up' as const
    },
    {
      title: '次高端扩容',
      value: `${ranges.find(r => r.range.includes('800'))?.share ?? 0}%`,
      desc: '结构升级红利',
      icon: AlertTriangle,
      trend: 'up' as const
    }
  ]
})
</script>

<template>
  <div class="card-glass rounded-xl p-5 flex flex-col h-full" v-if="store.showPriceModule">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <DollarSign class="w-5 h-5 text-champagne-400" />
        <h3 class="text-lg font-semibold font-serif-cn text-white">白酒价格带分析</h3>
      </div>
      <div class="flex gap-2 flex-wrap">
        <span
          v-for="item in insights"
          :key="item.title"
          class="text-xs px-2.5 py-1 rounded-full font-medium bg-ink-800/60 text-ink-200 border border-ink-600/40 flex items-center gap-1"
        >
          <component :is="item.icon" class="w-3 h-3" :class="item.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'" />
          {{ item.title }} <span class="text-champagne-400">{{ item.value }}</span>
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
      <div class="bg-ink-900/40 rounded-lg p-3 min-h-[260px]">
        <VChart :option="pieOption" autoresize class="w-full h-full" @click="onPieClick" />
      </div>
      <div class="bg-ink-900/40 rounded-lg p-3 min-h-[260px]">
        <VChart :option="lineOption" autoresize class="w-full h-full" @click="onLineClick" />
      </div>
    </div>

    <div class="mt-4">
      <AnnotationTags module="price" @edit="handleTagEdit" />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
      <div
        v-for="item in insights"
        :key="item.title"
        class="card-glass rounded-lg p-3 flex items-center gap-3"
      >
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          :class="item.trend === 'up'
            ? 'bg-gradient-to-br from-emerald-800/40 to-emerald-900/60 text-emerald-400'
            : 'bg-gradient-to-br from-rose-800/40 to-rose-900/60 text-rose-400'"
        >
          <component :is="item.icon" class="w-4 h-4" />
        </div>
        <div class="min-w-0">
          <div class="text-[11px] text-ink-300">{{ item.title }}</div>
          <div class="text-lg font-bold text-gradient-gold">{{ item.value }}</div>
          <div class="text-[11px] text-ink-400 truncate">{{ item.desc }}</div>
        </div>
      </div>
    </div>
  </div>

  <AnnotationDialog
    v-model:show="showDialog"
    :entity-name="dialogPayload.entityName"
    :metric-name="dialogPayload.metricName"
    :time-point="dialogPayload.timePoint"
    :value="dialogPayload.value"
    :color="dialogPayload.color"
    :initial-content="dialogPayload.initialContent"
    @confirm="handleDialogConfirm"
  />
</template>
