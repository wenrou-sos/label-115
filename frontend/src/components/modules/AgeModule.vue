<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, HeatmapChart, RadarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  VisualMapComponent,
  RadarComponent,
  MarkPointComponent,
  GraphicComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { NButtonGroup, NButton, NTooltip, useMessage } from 'naive-ui'
import { Users, Wine, Beer, GlassWater, Grid3X3, Radar, BarChart2 } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { CHART_COLORS, baseTooltip, baseLegend, baseGrid, darkAxisStyle } from '@/utils/chartOptions'
import { useAnnotations } from '@/composables/useAnnotations'
import { useViewPreference } from '@/composables/useViewPreference'
import AnnotationTags from '@/components/layout/AnnotationTags.vue'
import AnnotationDialog from '@/components/layout/AnnotationDialog.vue'
import type { AnnotationPoint, AgeViewType } from '@/types'

use([BarChart, HeatmapChart, RadarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, VisualMapComponent, RadarComponent, CanvasRenderer, MarkPointComponent, GraphicComponent])

const store = useDashboardStore()
const annotations = useAnnotations()
const { currentView, setView, getViewOptions } = useViewPreference('age')
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

function onHeatmapClick(params: any) {
  if (params && Array.isArray(params.value) && params.value.length === 3) {
    const [ageIdx, catIdx, value] = params.value
    const ageGroup = store.filteredAgeGroups[ageIdx]?.ageGroup
    const cat = categoryList[catIdx]
    if (ageGroup && cat && typeof value === 'number') {
      openAnnotation(cat.name, ageGroup, value, cat.color)
    }
  }
}

function onRadarClick(params: any) {
  if (params && params.seriesName && params.name) {
    const ageGroup = params.seriesName
    const cat = categoryList.find(c => c.name === params.name)
    const g = store.filteredAgeGroups.find(g => g.ageGroup === ageGroup)
    const value = g && cat ? (g as any)[cat.key] : undefined
    if (g && cat && typeof value === 'number') {
      openAnnotation(cat.name, ageGroup, value, cat.color)
    }
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

const filteredCategories = computed(() => {
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
  return categoryList.filter(cat => activeKeys.size === 0 || activeKeys.has(cat.key))
})

const barOption = computed<EChartsOption>(() => {
  const xAxisData = store.filteredAgeGroups.map(g => g.ageGroup)
  const series = filteredCategories.value.map(cat => {
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
      barGap: '10%',
      barCategoryGap: '30%',
      barMaxWidth: 36,
      itemStyle: {
        color: cat.color,
        borderRadius: [4, 4, 0, 0] as [number, number, number, number]
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: cat.color + '80'
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
        let html = `<div style="font-weight:600;margin-bottom:6px;color:#D4AF37">${arr[0]?.axisValue || ''}</div>`
        arr.forEach((p: any) => {
          if (p.value != null) {
            const ann = annotations.getAnnotation('age', p.seriesName, '年龄段占比', arr[0]?.axisValue)
            html += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
              <span>${p.seriesName}：<b>${p.value}%</b></span>
            </div>`
            if (ann) {
              html += `<div style="margin:2px 0 2px 14px;padding:3px 6px;background:${ann.color}22;border-left:2px solid ${ann.color};border-radius:3px;font-size:11px;color:#e5e5ea">
                📝 ${ann.content}
              </div>`
            }
          }
        })
        html += `<div style="margin-top:6px;font-size:11px;color:#888;border-top:1px solid #333;padding-top:4px">💡 点击柱子可添加标注</div>`
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
      ...darkAxisStyle,
      axisLabel: { ...darkAxisStyle.axisLabel, formatter: '{value}%' }
    },
    animationDuration: 700,
    series
  }
})

const heatmapOption = computed<EChartsOption>(() => {
  const xAxisData = store.filteredAgeGroups.map(g => g.ageGroup)
  const yAxisData = filteredCategories.value.map(c => c.name)
  const data: Array<[number, number, number, Record<string, any>]> = []
  store.filteredAgeGroups.forEach((g, xi) => {
    filteredCategories.value.forEach((cat, yi) => {
      const value = (g as any)[cat.key] ?? 0
      const ann = annotations.getAnnotation('age', cat.name, '年龄段占比', g.ageGroup)
      data.push([xi, yi, value, {
        annotation: ann,
        color: cat.color
      }])
    })
  })
  return {
    tooltip: {
      ...baseTooltip,
      formatter: (params: any) => {
        if (!params || !Array.isArray(params.value) || params.value.length < 3) return ''
        const [xi, yi, value] = params.value
        const cat = filteredCategories.value[yi]
        const ageGroup = xAxisData[xi]
        const ann = annotations.getAnnotation('age', cat?.name, '年龄段占比', ageGroup)
        let html = `<div style="font-weight:bold;color:#D4AF37;margin-bottom:4px">${ageGroup} · ${cat?.name}</div>`
        html += `<div><b>${value}%</b> 占比</div>`
        if (ann) {
          html += `<div style="margin-top:6px;padding:3px 6px;background:${ann.color}22;border-left:2px solid ${ann.color};border-radius:3px;font-size:11px;color:#e5e5ea">
            📝 ${ann.content}
          </div>`
        }
        html += `<div style="margin-top:6px;font-size:11px;color:#888;border-top:1px solid #333;padding-top:4px">💡 点击单元格可添加标注</div>`
        return html
      }
    },
    grid: {
      left: '10%',
      right: '12%',
      top: '8%',
      bottom: '12%'
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      ...darkAxisStyle,
      splitArea: { show: true, areaStyle: { color: ['rgba(26,26,46,0.4)', 'rgba(26,26,46,0.2)'] } }
    },
    yAxis: {
      type: 'category',
      data: yAxisData,
      ...darkAxisStyle,
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: 50,
      calculable: true,
      orient: 'vertical',
      right: '2%',
      top: 'center',
      textStyle: { color: '#9c9cab', fontSize: 11 },
      formatter: '{value}%',
      inRange: {
        color: ['#1A1A2E', '#8B0000', '#CD853F', '#D4AF37', '#FFD700']
      }
    },
    animationDuration: 800,
    animationEasing: 'cubicOut' as const,
    series: [{
      name: '年龄段占比',
      type: 'heatmap' as const,
      data: data.map(d => ({
        value: [d[0], d[1], d[2]],
        itemStyle: d[3].annotation ? {
          borderColor: d[3].color,
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: d[3].color
        } : undefined,
        emphasis: {
          itemStyle: {
            borderColor: '#D4AF37',
            borderWidth: 2,
            shadowBlur: 15,
            shadowColor: '#D4AF37'
          }
        },
        label: {
          show: true,
          color: '#e5e5ea',
          fontSize: 11,
          fontWeight: 500,
          formatter: (p: any) => `${p.value[2]}%${d[3].annotation ? ' 📝' : ''}`
        }
      }))
    }]
  }
})

const radarOption = computed<EChartsOption>(() => {
  const indicator = filteredCategories.value.map(c => ({
    name: c.name,
    max: 50
  }))
  const series = store.filteredAgeGroups.map((g, gi) => {
    const radarData = filteredCategories.value.map(c => ({
      name: c.name,
      value: (g as any)[c.key] ?? 0,
      itemStyle: annotations.getAnnotation('age', c.name, '年龄段占比', g.ageGroup) ? {
        borderColor: c.color,
        borderWidth: 2,
        shadowBlur: 12,
        shadowColor: c.color
      } : undefined
    }))
    const color = ['#8B0000', '#D4AF37', '#4A90D9', '#FF69B4', '#20B2AA'][gi % 5]
    const annCount = filteredCategories.value.filter(c => annotations.getAnnotation('age', c.name, '年龄段占比', g.ageGroup)).length
    return {
      name: g.ageGroup,
      type: 'radar' as const,
      data: [{
        value: radarData.map(r => r.value),
        name: g.ageGroup
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
      label: {
        show: false
      },
      animationDuration: 700,
      animationEasing: 'elasticOut' as const,
    }
  })
  return {
    tooltip: {
      ...baseTooltip,
      formatter: (params: any) => {
        let html = `<div style="font-weight:bold;color:#D4AF37;margin-bottom:4px">${params.name}</div>`
        filteredCategories.value.forEach((cat, i) => {
          const val = params.value?.[i]
          const ann = annotations.getAnnotation('age', cat.name, '年龄段占比', params.name)
          html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${cat.color}"></span>
            <span>${cat.name}：${val}%</span>
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
      data: store.filteredAgeGroups.map(g => g.ageGroup)
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

const viewOptions = computed(() => getViewOptions())
const viewIcon = (v: AgeViewType) => v === 'bar' ? BarChart2 : v === 'heatmap' ? Grid3X3 : Radar

const currentOption = computed(() => {
  switch (currentView.value) {
    case 'heatmap': return heatmapOption.value
    case 'radar': return radarOption.value
    default: return barOption.value
  }
})
const currentClick = computed(() => {
  switch (currentView.value) {
    case 'heatmap': return onHeatmapClick
    case 'radar': return onRadarClick
    default: return onBarClick
  }
})

const highlightMetrics = [
  {
    title: '30岁以下',
    desc: '白酒占比不足30%，偏好低度多元化酒饮',
    icon: Beer,
    color: 'wine' as const
  },
  {
    title: '30-50岁',
    desc: '白酒消费主力人群，商务社交驱动',
    icon: Wine,
    color: 'wine' as const
  },
  {
    title: 'Z世代',
    desc: '精酿/红酒/起泡酒增长迅猛',
    icon: GlassWater,
    color: 'gold' as const
  }
]
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
          <NButtonGroup size="small" class="!rounded-lg overflow-hidden">
            <NButton
              v-for="opt in viewOptions"
              :key="opt.value"
              :quaternary="currentView !== opt.value"
              :type="currentView === opt.value ? 'primary' : 'default'"
              class="!px-3"
              @click="setView(opt.value as AgeViewType)"
            >
              <component
                :is="viewIcon(opt.value as AgeViewType)"
                class="w-3.5 h-3.5 mr-1.5"
              />
              {{ opt.label }}
            </NButton>
          </NButtonGroup>
        </template>
        切换图表类型，数据不变
      </NTooltip>
    </div>

    <div class="h-80 mb-5">
      <VChart
        :option="currentOption"
        autoresize
        @click="currentClick"
      />
    </div>

    <AnnotationTags
      v-if="annotations.getAnnotationsByModule('age').length > 0"
      module="age"
      @edit="handleTagEdit"
      @delete="handleTagDelete"
    />

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
      <div
        v-for="metric in highlightMetrics"
        :key="metric.title"
        class="px-4 py-3 rounded-xl border"
        :class="metric.color === 'wine'
          ? 'bg-gradient-to-br from-wine-900/40 to-wine-950/60 border-wine-700/30'
          : 'bg-gradient-to-br from-champagne-900/30 to-champagne-950/50 border-champagne-600/30'"
      >
        <div class="flex items-center gap-2 mb-1.5">
          <component :is="metric.icon" class="w-4 h-4 text-champagne-400" />
          <span class="text-xs text-champagne-300 font-medium">{{ metric.title }}</span>
        </div>
        <p class="text-sm text-ink-200">{{ metric.desc }}</p>
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
