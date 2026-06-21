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
import { Users, Wine, Beer, GlassWater, MessageSquarePlus } from 'lucide-vue-next'
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

const categoryList = [
  { key: 'baijiu', name: '白酒', color: CHART_COLORS.baijiu },
  { key: 'beer', name: '啤酒', color: CHART_COLORS.beer },
  { key: 'craftBeer', name: '精酿', color: CHART_COLORS.craftBeer },
  { key: 'wine', name: '红酒', color: CHART_COLORS.wine },
  { key: 'sparkling', name: '起泡酒', color: CHART_COLORS.sparkling },
  { key: 'huangjiu', name: '黄酒', color: CHART_COLORS.huangjiu },
  { key: 'whiskey', name: '威士忌', color: CHART_COLORS.whiskey }
]

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

function openAnnotation(entityName: string, ageGroup: string, value: number, color: string) {
  const metric = '年龄段占比'
  const existing = annotations.getAnnotation('age', entityName, metric, ageGroup)
  existingId.value = existing?.id || null
  dialogPayload.value = {
    entityName,
    metricName: metric,
    timePoint: ageGroup,
    value,
    color,
    initialContent: existing?.content || ''
  }
  showDialog.value = true
}

function onBarClick(params: any) {
  if (params && params.seriesName && params.name && typeof params.value === 'number') {
    const cat = categoryList.find(c => c.name === params.seriesName)
    openAnnotation(params.seriesName, String(params.name), params.value, cat?.color || '#D4AF37')
  }
}

function handleDialogConfirm(content: string) {
  if (existingId.value) {
    annotations.updateAnnotation(existingId.value, content)
    message.success('标注已更新')
  } else {
    annotations.addAnnotation({
      module: 'age',
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
    .map(cat => {
      const seriesData = store.filteredAgeGroups.map(g => {
        const value = (g as any)[cat.key] ?? 0
        const ann = annotations.getAnnotation('age', cat.name, '年龄段占比', g.ageGroup)
        return {
          value,
          itemStyle: ann ? {
            borderColor: cat.color,
            borderWidth: 2,
            shadowBlur: 12,
            shadowColor: cat.color
          } : undefined
        }
      })
      const markPointData: any[] = []
      store.filteredAgeGroups.forEach((g, i) => {
        const ann = annotations.getAnnotation('age', cat.name, '年龄段占比', g.ageGroup)
        if (ann) {
          markPointData.push({
            name: ann.content,
            coord: [g.ageGroup, (g as any)[cat.key] ?? 0],
            value: '📝',
            symbol: 'pin',
            symbolSize: 34,
            itemStyle: {
              color: cat.color,
              borderColor: '#1A1A2E',
              borderWidth: 2,
              shadowBlur: 8,
              shadowColor: cat.color
            },
            label: { show: true, color: '#fff', fontSize: 10, formatter: '📝' }
          })
        }
      })
      return {
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
        data: seriesData,
        markPoint: markPointData.length > 0 ? {
          symbol: 'circle',
          symbolSize: 12,
          label: { show: true, fontSize: 10, fontWeight: 700 },
          data: markPointData
        } : undefined
      }
    })
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
          const ann = annotations.getAnnotation('age', p.seriesName, '年龄段占比', params[0].axisValue)
          html += `<span style="display:inline-block;margin-right:5px;border-radius:50%;width:8px;height:8px;background:${p.color}"></span>${p.seriesName}: ${p.value}% (${pct}%)<br/>`
          if (ann) {
            html += `<div style="margin:2px 0 2px 14px;padding:3px 6px;background:${ann.color}22;border-left:2px solid ${ann.color};border-radius:3px;font-size:11px;color:#e5e5ea">
              📝 ${ann.content}
            </div>`
          }
        })
        html += `<div style="margin-top:6px;font-size:11px;color:#888;border-top:1px solid #333;padding-top:4px">💡 点击柱状图可添加标注</div>`
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
      <NTooltip trigger="hover">
        <template #trigger>
          <NButton quaternary size="small" class="!px-2" @click="() => {}">
            <MessageSquarePlus class="w-4 h-4" />
          </NButton>
        </template>
        点击任意柱子可添加标注
      </NTooltip>
    </div>

    <div class="h-80 mb-5">
      <VChart :option="barOption" autoresize @click="onBarClick" />
    </div>

    <AnnotationTags
      v-if="annotations.getAnnotationsByModule('age').length > 0"
      module="age"
      @edit="handleTagEdit"
      @delete="handleTagDelete"
    />

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
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
