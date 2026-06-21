<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkPointComponent,
  GraphicComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { NButton, NTooltip, useMessage } from 'naive-ui'
import { Sparkles, MessageSquarePlus } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { CHART_COLORS, baseTooltip, baseLegend, baseGrid, darkAxisStyle } from '@/utils/chartOptions'
import { useAnnotations } from '@/composables/useAnnotations'
import AnnotationTags from '@/components/layout/AnnotationTags.vue'
import AnnotationDialog from '@/components/layout/AnnotationDialog.vue'
import type { AnnotationPoint } from '@/types'

use([BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer, MarkPointComponent, GraphicComponent])

const store = useDashboardStore()
const annotations = useAnnotations()
const message = useMessage()

const categoryColors: Record<string, string> = {
  '白酒': CHART_COLORS.baijiu,
  '红酒': CHART_COLORS.wine,
  '啤酒': CHART_COLORS.beer,
  '威士忌': CHART_COLORS.whiskey,
  '香槟/起泡酒': CHART_COLORS.sparkling
}

function getCategoryColor(category: string): string {
  return categoryColors[category] || CHART_COLORS.wine
}

const allCategories = computed(() => {
  const cats = new Set<string>()
  store.filteredFestivals.forEach(f => f.data.forEach(d => cats.add(d.category)))
  return Array.from(cats)
})

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

function openAnnotation(category: string, festival: string, value: number) {
  const metric = '节日销售倍数'
  const existing = annotations.getAnnotation('festival', category, metric, festival)
  existingId.value = existing?.id || null
  dialogPayload.value = {
    entityName: category,
    metricName: metric,
    timePoint: festival,
    value,
    color: getCategoryColor(category),
    initialContent: existing?.content || ''
  }
  showDialog.value = true
}

function onBarClick(params: any) {
  if (params && params.seriesName && params.name && typeof params.value === 'number' && params.value != null) {
    openAnnotation(params.seriesName, String(params.name), params.value)
  }
}

function handleDialogConfirm(content: string) {
  if (existingId.value) {
    annotations.updateAnnotation(existingId.value, content)
    message.success('标注已更新')
  } else {
    annotations.addAnnotation({
      module: 'festival',
      entity: dialogPayload.value.entityName,
      metric: dialogPayload.value.metricName,
      timePoint: dialogPayload.value.timePoint,
      value: dialogPayload.value.value,
      color: dialogPayload.value.color,
      content
    })
    message.success('标注已添加')
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

function handleTagDelete(id: string) {
  annotations.deleteAnnotation(id)
  message.success('标注已删除')
}

const chartOption = computed<EChartsOption>(() => {
  const festivals = store.filteredFestivals.map(f => f.festival)
  const series = allCategories.value.map(category => {
    const color = getCategoryColor(category)
    const seriesData = store.filteredFestivals.map(f => {
      const item = f.data.find(d => d.category === category)
      const value = item ? item.salesMultiple : null
      const ann = item ? annotations.getAnnotation('festival', category, '节日销售倍数', f.festival) : undefined
      return {
        value,
        itemStyle: ann ? {
          borderColor: color,
          borderWidth: 2,
          shadowBlur: 14,
          shadowColor: color
        } : undefined
      }
    })
    const markPointData: any[] = []
    store.filteredFestivals.forEach(f => {
      const item = f.data.find(d => d.category === category)
      const ann = item ? annotations.getAnnotation('festival', category, '节日销售倍数', f.festival) : undefined
      if (ann && item) {
        markPointData.push({
          name: ann.content,
          coord: [f.festival, item.salesMultiple],
          value: '📝',
          symbol: 'pin',
          symbolSize: 36,
          itemStyle: {
            color,
            borderColor: '#1A1A2E',
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: color
          },
          label: { show: true, color: '#fff', fontSize: 10, formatter: '📝' }
        })
      }
    })
    return {
      name: category,
      type: 'bar' as const,
      barMaxWidth: 28,
      itemStyle: {
        color,
        borderRadius: [4, 4, 0, 0] as [number, number, number, number]
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 12,
          shadowColor: color
        }
      },
      data: seriesData,
      markPoint: markPointData.length > 0 ? {
        symbol: 'circle',
        symbolSize: 12,
        label: { show: true, fontSize: 10, fontWeight: 700 },
        data: markPointData
      } : undefined
    }
  })

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
            const ann = annotations.getAnnotation('festival', p.seriesName, '节日销售倍数', festival)
            html += `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
              <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${p.color}"></span>
              <span>${p.seriesName}：<strong style="color:#fff">${p.value}倍</strong></span>
            </div>`
            if (ann) {
              html += `<div style="margin:2px 0 2px 14px;padding:3px 6px;background:${ann.color}22;border-left:2px solid ${ann.color};border-radius:3px;font-size:11px;color:#e5e5ea">
                📝 ${ann.content}
              </div>`
            }
          }
        })
        if (festivalData) {
          const avgHighEnd = (festivalData.data.reduce((s, d) => s + d.highEndRatio, 0) / festivalData.data.length).toFixed(1)
          html += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(212,175,55,0.2)">
            <span style="color:#9c9cab">平均高端酒占比：</span>
            <strong style="color:#D4AF37">${avgHighEnd}%</strong>
          </div>`
        }
        html += `<div style="margin-top:6px;font-size:11px;color:#888;border-top:1px solid #333;padding-top:4px">💡 点击柱子可添加标注</div>`
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
      <div class="flex items-center gap-2">
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton quaternary size="small" class="!px-2">
              <MessageSquarePlus class="w-4 h-4" />
            </NButton>
          </template>
          点击任意柱子可添加标注
        </NTooltip>
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
    </div>

    <div class="flex-1 min-h-[320px]">
      <VChart :option="chartOption" autoresize class="w-full h-full" @click="onBarClick" />
    </div>

    <AnnotationTags
      v-if="annotations.getAnnotationsByModule('festival').length > 0"
      module="festival"
      @edit="handleTagEdit"
      @delete="handleTagDelete"
      class="mt-4"
    />

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
  </div>
</template>
