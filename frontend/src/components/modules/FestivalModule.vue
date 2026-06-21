<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart, RadarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent,
  MarkPointComponent,
  GraphicComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { NButtonGroup, NButton, NTooltip, useMessage } from 'naive-ui'
import { Sparkles, BarChart2, Radar, Layers } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { CHART_COLORS, baseTooltip, baseLegend, baseGrid, darkAxisStyle } from '@/utils/chartOptions'
import { useAnnotations } from '@/composables/useAnnotations'
import { useViewPreference } from '@/composables/useViewPreference'
import AnnotationTags from '@/components/layout/AnnotationTags.vue'
import AnnotationDialog from '@/components/layout/AnnotationDialog.vue'
import type { AnnotationPoint, FestivalViewType } from '@/types'

use([BarChart, LineChart, RadarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, RadarComponent, CanvasRenderer, MarkPointComponent, GraphicComponent])

const store = useDashboardStore()
const annotations = useAnnotations()
const { currentView, setView, getViewOptions } = useViewPreference('festival')
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

function onAreaClick(params: any) {
  if (params && params.seriesName && params.name && typeof params.value === 'number' && params.value != null) {
    openAnnotation(params.seriesName, String(params.name), params.value)
  }
}

function onRadarClick(params: any) {
  if (params && params.seriesName && params.name) {
    const festival = params.seriesName
    const category = params.name
    const f = store.filteredFestivals.find(f => f.festival === festival)
    const item = f?.data.find(d => d.category === category)
    if (f && item && typeof item.salesMultiple === 'number') {
      openAnnotation(category, festival, item.salesMultiple)
    }
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

const barOption = computed<EChartsOption>(() => {
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
      animationDuration: 700,
      animationEasing: 'cubicOut' as const,
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
    animationDuration: 700,
    series
  }
})

const radarOption = computed<EChartsOption>(() => {
  const indicator = allCategories.value.map(c => ({
    name: c,
    max: 10
  }))
  const festivalColors = ['#8B0000', '#D4AF37', '#FF69B4', '#4A90D9', '#B22222', '#CD853F']
  const series = store.filteredFestivals.map((f, fi) => {
    const radarData = allCategories.value.map(c => {
      const item = f.data.find(d => d.category === c)
      return {
        name: c,
        value: item?.salesMultiple ?? 0,
        itemStyle: annotations.getAnnotation('festival', c, '节日销售倍数', f.festival) ? {
          borderColor: getCategoryColor(c),
          borderWidth: 2,
          shadowBlur: 12,
          shadowColor: getCategoryColor(c)
        } : undefined
      }
    })
    const color = festivalColors[fi % festivalColors.length]
    const annCount = allCategories.value.filter(c => annotations.getAnnotation('festival', c, '节日销售倍数', f.festival)).length
    return {
      name: f.festival,
      type: 'radar' as const,
      data: [{
        value: radarData.map(r => r.value),
        name: f.festival
      }],
      symbol: 'circle',
      symbolSize: annCount > 0 ? 9 : 6,
      lineStyle: {
        width: annCount > 0 ? 3 : 2,
        color
      },
      itemStyle: { color },
      areaStyle: {
        color: `${color}${annCount > 0 ? '44' : '22'}`
      },
      animationDuration: 700,
      animationEasing: 'elasticOut' as const,
    }
  })
  return {
    tooltip: {
      ...baseTooltip,
      formatter: (params: any) => {
        let html = `<div style="font-weight:600;margin-bottom:6px;color:#D4AF37">${params.name}</div>`
        allCategories.value.forEach((c, i) => {
          const val = params.value?.[i]
          const ann = annotations.getAnnotation('festival', c, '节日销售倍数', params.name)
          html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${getCategoryColor(c)}"></span>
            <span>${c}：${val}x</span>
          </div>`
          if (ann) {
            html += `<div style="margin:2px 0 2px 14px;padding:3px 6px;background:${ann.color}22;border-left:2px solid ${ann.color};border-radius:3px;font-size:11px;color:#e5e5ea">
              📝 ${ann.content}
            </div>`
          }
        })
        html += `<div style="margin-top:6px;font-size:11px;color:#888;border-top:1px solid #333;padding-top:4px">💡 点击雷达点可添加标注</div>`
        return html
      }
    },
    legend: {
      ...baseLegend,
      data: store.filteredFestivals.map(f => f.festival)
    },
    radar: {
      indicator,
      center: ['50%', '55%'],
      radius: '65%',
      splitNumber: 4,
      axisName: {
        color: '#e5e5ea',
        fontSize: 11
      },
      splitLine: {
        lineStyle: { color: 'rgba(212, 175, 55, 0.2)' }
      },
      splitArea: {
        show: true,
        areaStyle: { color: ['rgba(26,26,46,0.6)', 'rgba(26,26,46,0.3)'] }
      },
      axisLine: {
        lineStyle: { color: 'rgba(212, 175, 55, 0.3)' }
      }
    },
    animationDuration: 800,
    series
  }
})

const areaOption = computed<EChartsOption>(() => {
  const festivals = store.filteredFestivals.map(f => f.festival)
  const series = allCategories.value.map(category => {
    const color = getCategoryColor(category)
    const seriesData = store.filteredFestivals.map(f => {
      const item = f.data.find(d => d.category === category)
      return item ? item.salesMultiple : null
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
      type: 'line' as const,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2,
        color
      },
      itemStyle: { color },
      areaStyle: {
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: `${color}88` },
            { offset: 1, color: `${color}10` }
          ]
        }
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 12,
          shadowColor: color
        }
      },
      data: seriesData,
      animationDuration: 800,
      animationEasing: 'cubicOut' as const,
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
        let html = `<div style="font-weight:600;margin-bottom:6px;color:#D4AF37">${festival}</div>`
        arr.forEach((p: any) => {
          if (p.value != null) {
            const ann = annotations.getAnnotation('festival', p.seriesName, '节日销售倍数', festival)
            html += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
              <span>${p.seriesName}：<b>${p.value}x</b></span>
            </div>`
            if (ann) {
              html += `<div style="margin:4px 0 4px 14px;padding:3px 6px;background:${ann.color}22;border-left:2px solid ${ann.color};border-radius:3px;font-size:11px;color:#e5e5ea">
                📝 ${ann.content}
              </div>`
            }
          }
        })
        html += `<div style="margin-top:6px;font-size:11px;color:#888;border-top:1px solid #333;padding-top:4px">💡 点击数据点可添加标注</div>`
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
      boundaryGap: false,
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
    animationDuration: 800,
    series
  }
})

const viewOptions = computed(() => getViewOptions())
const viewIcon = (v: FestivalViewType) => v === 'bar' ? BarChart2 : v === 'radar' ? Radar : Layers

const currentOption = computed(() => {
  switch (currentView.value) {
    case 'radar': return radarOption.value
    case 'area': return areaOption.value
    default: return barOption.value
  }
})
const currentClick = computed(() => {
  switch (currentView.value) {
    case 'radar': return onRadarClick
    case 'area': return onAreaClick
    default: return onBarClick
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
            <NButtonGroup size="small" class="!rounded-lg overflow-hidden">
              <NButton
                v-for="opt in viewOptions"
                :key="opt.value"
                :quaternary="currentView !== opt.value"
                :type="currentView === opt.value ? 'primary' : 'default'"
                class="!px-3"
                @click="setView(opt.value as FestivalViewType)"
              >
                <component
                  :is="viewIcon(opt.value as FestivalViewType)"
                  class="w-3.5 h-3.5 mr-1.5"
                />
                {{ opt.label }}
              </NButton>
            </NButtonGroup>
          </template>
          切换图表类型，数据不变
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
      <VChart
        :option="currentOption"
        autoresize
        class="w-full h-full"
        @click="currentClick"
      />
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
