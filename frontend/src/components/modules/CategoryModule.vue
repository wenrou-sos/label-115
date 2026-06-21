<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart, LineChart, BarChart } from 'echarts/charts'
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
import { NButtonGroup, NButton, NTooltip } from 'naive-ui'
import { TrendingUp, PieChart as PieChartIcon, Activity, BarChart3, LayoutGrid, Layers } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { baseTooltip, baseLegend, baseGrid, darkAxisStyle } from '@/utils/chartOptions'
import { useAnnotations } from '@/composables/useAnnotations'
import { useViewPreference } from '@/composables/useViewPreference'
import AnnotationTags from '@/components/layout/AnnotationTags.vue'
import AnnotationDialog from '@/components/layout/AnnotationDialog.vue'
import type { AnnotationPoint, CategoryViewType } from '@/types'

use([PieChart, LineChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer, MarkPointComponent, GraphicComponent])

const store = useDashboardStore()
const annotations = useAnnotations()
const { currentView, setView, getViewOptions } = useViewPreference('category')

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

function openPieAnnotation(name: string, value: number) {
  const category = store.categories.find(c => c.name === name)
  const color = category?.color || '#D4AF37'
  const metric = '市场份额'
  const existing = annotations.getAnnotation('category', name, metric)
  existingId.value = existing?.id || null
  dialogPayload.value = {
    entityName: name,
    metricName: metric,
    timePoint: undefined,
    value: value,
    color,
    initialContent: existing?.content || ''
  }
  showDialog.value = true
}

function openLineAnnotation(name: string, timePoint: string, value: number) {
  const category = store.categories.find(c => c.name === name)
  const color = category?.color || '#D4AF37'
  const metric = '增速'
  const existing = annotations.getAnnotation('category', name, metric, timePoint)
  existingId.value = existing?.id || null
  dialogPayload.value = {
    entityName: name,
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
    openPieAnnotation(params.name, params.value)
  }
}

function onBarClick(params: any) {
  if (params && params.name && typeof params.value === 'number') {
    openPieAnnotation(params.name, params.value)
  }
}

function onLineClick(params: any) {
  if (params && params.seriesName && params.name && typeof params.value === 'number') {
    openLineAnnotation(params.seriesName, String(params.name), params.value)
  }
}

function handleDialogConfirm(content: string) {
  if (existingId.value) {
    annotations.updateAnnotation(existingId.value, content)
  } else {
    annotations.addAnnotation({
      module: 'category',
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

const shareData = computed(() => {
  const raw = store.filteredCategories
  const total = raw.reduce((s, c) => s + c.share, 0) || 1
  return raw.map(c => ({
    name: c.name,
    value: Number(((c.share / total) * 100).toFixed(1)),
    color: c.color
  }))
})

const pieOption = computed<EChartsOption>(() => {
  const data = shareData.value.map(s => {
    const ann = annotations.getAnnotation('category', s.name, '市场份额')
    return {
      name: s.name,
      value: s.value,
      itemStyle: ann ? {
        borderColor: s.color,
        borderWidth: 3,
        shadowBlur: 14,
        shadowColor: s.color
      } : undefined
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
        const ann = annotations.getAnnotation('category', p.name, '市场份额')
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
      ...baseLegend,
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemWidth: 12,
      itemHeight: 12
    },
    color: shareData.value.map(s => s.color),
    animationDuration: 800,
    animationEasing: 'cubicOut' as const,
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

const barOption = computed<EChartsOption>(() => {
  const data = shareData.value.map(s => {
    const ann = annotations.getAnnotation('category', s.name, '市场份额')
    return {
      value: s.value,
      itemStyle: ann ? {
        borderColor: s.color,
        borderWidth: 2,
        shadowBlur: 14,
        shadowColor: s.color
      } : undefined
    }
  })

  const markPointData: any[] = []
  shareData.value.forEach((s, i) => {
    const ann = annotations.getAnnotation('category', s.name, '市场份额')
    if (ann) {
      markPointData.push({
        name: ann.content,
        coord: [s.name, s.value],
        value: '📝',
        symbol: 'pin',
        symbolSize: 34,
        itemStyle: {
          color: s.color,
          borderColor: '#1A1A2E',
          borderWidth: 2,
          shadowBlur: 8,
          shadowColor: s.color
        },
        label: { show: true, color: '#fff', fontSize: 10, formatter: '📝' }
      })
    }
  })

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 15, 26, 0.95)',
      borderColor: '#D4AF37',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        const ann = annotations.getAnnotation('category', p.name, '市场份额')
        let html = `<div><b>${p.name}</b>：<span style="color:#D4AF37">${p.value}%</span></div>`
        if (ann) {
          html += `<div style="margin-top:6px;padding:4px 6px;background:${ann.color}22;border-left:2px solid ${ann.color};border-radius:3px;font-size:12px;color:#e5e5ea">
            📝 ${ann.content}
          </div>`
        }
        html += `<div style="margin-top:6px;font-size:11px;color:#888;border-top:1px solid #333;padding-top:4px">💡 点击柱子可添加标注</div>`
        return html
      }
    },
    legend: { ...baseLegend, show: false },
    grid: baseGrid,
    xAxis: {
      type: 'category',
      data: shareData.value.map(s => s.name),
      ...darkAxisStyle,
      axisLabel: { ...darkAxisStyle.axisLabel, fontWeight: 500, fontSize: 11, rotate: 0 }
    },
    yAxis: {
      type: 'value',
      ...darkAxisStyle,
      axisLabel: { ...darkAxisStyle.axisLabel, formatter: '{value}%' }
    },
    color: shareData.value.map(s => s.color),
    animationDuration: 800,
    animationEasing: 'elasticOut' as const,
    animationDelay: (idx: number) => idx * 60,
    series: [
      {
        type: 'bar' as const,
        barMaxWidth: 40,
        itemStyle: {
          borderRadius: [4, 4, 0, 0] as [number, number, number, number]
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 12,
            shadowOffsetY: -4,
            shadowColor: 'rgba(212, 175, 55, 0.4)'
          }
        },
        data,
        markPoint: markPointData.length > 0 ? {
          symbol: 'circle',
          symbolSize: 12,
          label: { show: true, fontSize: 10, fontWeight: 700 },
          data: markPointData,
          animation: true,
          animationDuration: 500
        } : undefined
      }
    ]
  }
})

const lineOption = computed<EChartsOption>(() => {
  const forecast = store.categoryForecast
  const historicalYears = store.filteredYears.length > 0 ? store.filteredYears : store.years
  const forecastYears = forecast?.forecastYears || []
  const allYears = [...historicalYears, ...forecastYears]
  const highlightMarks = store.anomalySettings.highlightMarks

  const actualSeries: any[] = []
  const forecastSeries: any[] = []
  const markLines: any[] = []

  if (forecast && forecastYears.length > 0) {
    markLines.push({
      xAxis: historicalYears[historicalYears.length - 1],
      lineStyle: {
        color: '#E6C35C',
        type: 'dashed',
        width: 1,
        opacity: 0.6
      },
      label: {
        formatter: '预测',
        position: 'start',
        color: '#E6C35C',
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: 'rgba(230, 195, 92, 0.08)',
        padding: [2, 6],
        borderRadius: 4
      }
    })
  }

  store.filteredCategories.forEach(c => {
    const catForecast = forecast?.series?.find(s => s.name === c.name)
    const historical = c.growth
    const paddedActual = [...historical, ...Array(forecastYears.length).fill(null)]
    const padding = Array(historical.length - 1).fill(null)
    const bridge = historical.length > 0 ? [historical[historical.length - 1]] : []
    const fc = catForecast?.forecast || []
    const paddedForecast = [...padding, ...bridge, ...fc]

    const catAnomalies = highlightMarks ? store.getCategoryAnomaliesByName(c.name) : []
    const markPointData: any[] = []
    catAnomalies.forEach(a => {
      const idx = allYears.indexOf(a.timePoint)
      if (idx >= 0) {
        markPointData.push({
          name: `${a.message}`,
          coord: [a.timePoint, a.current],
          value: a.changePct > 0 ? `+${a.changePct.toFixed(0)}%` : `${a.changePct.toFixed(0)}%`,
          symbol: 'circle',
          symbolSize: a.severity === 'critical' ? 22 : 16,
          itemStyle: {
            color: a.severity === 'critical' ? '#ef4444' : '#f59e0b',
            borderColor: '#1A1A2E',
            borderWidth: 2,
            shadowBlur: a.severity === 'critical' ? 12 : 6,
            shadowColor: a.severity === 'critical' ? 'rgba(239,68,68,0.8)' : 'rgba(245,158,11,0.7)'
          },
          label: {
            show: true,
            position: 'top',
            distance: 4,
            color: a.severity === 'critical' ? '#fca5a5' : '#fcd34d',
            fontSize: 10,
            fontWeight: 700,
            formatter: a.changePct > 0 ? `+${a.changePct.toFixed(0)}%!` : `${a.changePct.toFixed(0)}%!`
          }
        })
      }
    })

    historicalYears.forEach((y, yi) => {
      const ann = annotations.getAnnotation('category', c.name, '增速', y)
      if (ann) {
        const value = c.growth[yi]
        if (value !== undefined) {
          markPointData.push({
            name: ann.content,
            coord: [y, value],
            value: '📝',
            symbol: 'pin',
            symbolSize: 38,
            itemStyle: {
              color: c.color,
              borderColor: '#1A1A2E',
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: c.color
            },
            label: {
              show: true,
              color: '#fff',
              fontSize: 10,
              formatter: '📝'
            }
          })
        }
      }
    })

    actualSeries.push({
      name: c.name,
      type: 'line' as const,
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { width: 2 },
      itemStyle: { color: c.color },
      data: paddedActual,
      animationDuration: 800,
      animationEasing: 'cubicOut' as const,
      animationDelay: (idx: number) => idx * 40,
      markPoint: markPointData.length > 0 ? {
        symbol: 'circle',
        symbolSize: 14,
        label: { show: true, fontSize: 10, fontWeight: 700 },
        data: markPointData,
        animation: true,
        animationDuration: 500
      } : undefined,
      markLine: markLines.length > 0 ? {
        silent: true,
        symbol: 'none',
        lineStyle: { width: 0 },
        data: markLines
      } : undefined
    })

    if (catForecast && fc.length > 0) {
      forecastSeries.push({
        name: `${c.name}(预测)`,
        type: 'line' as const,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        showSymbol: false,
        lineStyle: {
          type: 'dashed' as const,
          width: 2,
          color: '#E6C35C',
          opacity: 0.85
        },
        itemStyle: { color: '#E6C35C' },
        data: paddedForecast,
        animationDuration: 800,
        tooltip: {
          valueFormatter: (v: any) => v != null ? `${v}% (预测)` : ''
        },
        legendHoverLink: false,
        z: 1
      })
    }
  })

  return {
    tooltip: {
      ...baseTooltip,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        let html = `<div style="font-weight:bold;margin-bottom:6px;color:#D4AF37">${list[0]?.axisValue || ''}</div>`
        list.forEach((p: any) => {
          if (p.value == null) return
          const isForecast = String(p.seriesName).includes('预测')
          const seriesKey = String(p.seriesName).replace('(预测)', '')
          const ann = annotations.getAnnotation('category', seriesKey, '增速', list[0]?.axisValue)
          html += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
            <span>${p.seriesName}：<b>${p.value}%</b>${isForecast ? ' <span style="color:#E6C35C;font-size:11px">预测</span>' : ''}</span>
          </div>`
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
    legend: { ...baseLegend, top: 0 },
    grid: baseGrid,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: allYears,
      ...darkAxisStyle,
      axisLabel: {
        ...darkAxisStyle.axisLabel,
        formatter: (v: string) => forecastYears.includes(v) ? `${v}\n预测` : v
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: { ...darkAxisStyle.axisLabel, formatter: '{value}%' },
      axisLine: darkAxisStyle.axisLine,
      splitLine: darkAxisStyle.splitLine
    },
    animationDuration: 800,
    series: [...actualSeries, ...forecastSeries]
  }
})

const areaOption = computed<EChartsOption>(() => {
  const forecast = store.categoryForecast
  const historicalYears = store.filteredYears.length > 0 ? store.filteredYears : store.years
  const forecastYears = forecast?.forecastYears || []
  const allYears = [...historicalYears, ...forecastYears]
  const highlightMarks = store.anomalySettings.highlightMarks

  const actualSeries: any[] = []
  const forecastSeries: any[] = []
  const markLines: any[] = []

  if (forecast && forecastYears.length > 0) {
    markLines.push({
      xAxis: historicalYears[historicalYears.length - 1],
      lineStyle: {
        color: '#E6C35C',
        type: 'dashed',
        width: 1,
        opacity: 0.6
      },
      label: {
        formatter: '预测',
        position: 'start',
        color: '#E6C35C',
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: 'rgba(230, 195, 92, 0.08)',
        padding: [2, 6],
        borderRadius: 4
      }
    })
  }

  store.filteredCategories.forEach(c => {
    const catForecast = forecast?.series?.find(s => s.name === c.name)
    const historical = c.growth
    const paddedActual = [...historical, ...Array(forecastYears.length).fill(null)]
    const padding = Array(historical.length - 1).fill(null)
    const bridge = historical.length > 0 ? [historical[historical.length - 1]] : []
    const fc = catForecast?.forecast || []
    const paddedForecast = [...padding, ...bridge, ...fc]

    const catAnomalies = highlightMarks ? store.getCategoryAnomaliesByName(c.name) : []
    const markPointData: any[] = []
    catAnomalies.forEach(a => {
      const idx = allYears.indexOf(a.timePoint)
      if (idx >= 0) {
        markPointData.push({
          name: `${a.message}`,
          coord: [a.timePoint, a.current],
          value: a.changePct > 0 ? `+${a.changePct.toFixed(0)}%` : `${a.changePct.toFixed(0)}%`,
          symbol: 'circle',
          symbolSize: a.severity === 'critical' ? 22 : 16,
          itemStyle: {
            color: a.severity === 'critical' ? '#ef4444' : '#f59e0b',
            borderColor: '#1A1A2E',
            borderWidth: 2,
            shadowBlur: a.severity === 'critical' ? 12 : 6,
            shadowColor: a.severity === 'critical' ? 'rgba(239,68,68,0.8)' : 'rgba(245,158,11,0.7)'
          },
          label: {
            show: true,
            position: 'top',
            distance: 4,
            color: a.severity === 'critical' ? '#fca5a5' : '#fcd34d',
            fontSize: 10,
            fontWeight: 700,
            formatter: a.changePct > 0 ? `+${a.changePct.toFixed(0)}%!` : `${a.changePct.toFixed(0)}%!`
          }
        })
      }
    })

    historicalYears.forEach((y, yi) => {
      const ann = annotations.getAnnotation('category', c.name, '增速', y)
      if (ann) {
        const value = c.growth[yi]
        if (value !== undefined) {
          markPointData.push({
            name: ann.content,
            coord: [y, value],
            value: '📝',
            symbol: 'pin',
            symbolSize: 38,
            itemStyle: {
              color: c.color,
              borderColor: '#1A1A2E',
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: c.color
            },
            label: {
              show: true,
              color: '#fff',
              fontSize: 10,
              formatter: '📝'
            }
          })
        }
      }
    })

    actualSeries.push({
      name: c.name,
      type: 'line' as const,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2, color: c.color },
      itemStyle: { color: c.color },
      areaStyle: {
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: `${c.color}88` },
            { offset: 1, color: `${c.color}10` }
          ]
        }
      },
      data: paddedActual,
      animationDuration: 800,
      animationEasing: 'cubicOut' as const,
      animationDelay: (idx: number) => idx * 40,
      markPoint: markPointData.length > 0 ? {
        symbol: 'circle',
        symbolSize: 14,
        label: { show: true, fontSize: 10, fontWeight: 700 },
        data: markPointData,
        animation: true,
        animationDuration: 500
      } : undefined,
      markLine: markLines.length > 0 ? {
        silent: true,
        symbol: 'none',
        lineStyle: { width: 0 },
        data: markLines
      } : undefined
    })

    if (catForecast && fc.length > 0) {
      forecastSeries.push({
        name: `${c.name}(预测)`,
        type: 'line' as const,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        showSymbol: false,
        lineStyle: {
          type: 'dashed' as const,
          width: 2,
          color: '#E6C35C',
          opacity: 0.85
        },
        itemStyle: { color: '#E6C35C' },
        data: paddedForecast,
        animationDuration: 800,
        tooltip: {
          valueFormatter: (v: any) => v != null ? `${v}% (预测)` : ''
        },
        legendHoverLink: false,
        z: 1
      })
    }
  })

  return {
    tooltip: {
      ...baseTooltip,
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        let html = `<div style="font-weight:bold;margin-bottom:6px;color:#D4AF37">${list[0]?.axisValue || ''}</div>`
        list.forEach((p: any) => {
          if (p.value == null) return
          const isForecast = String(p.seriesName).includes('预测')
          const seriesKey = String(p.seriesName).replace('(预测)', '')
          const ann = annotations.getAnnotation('category', seriesKey, '增速', list[0]?.axisValue)
          html += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
            <span>${p.seriesName}：<b>${p.value}%</b>${isForecast ? ' <span style="color:#E6C35C;font-size:11px">预测</span>' : ''}</span>
          </div>`
          if (ann) {
            html += `<div style="margin:4px 0 4px 14px;padding:3px 6px;background:${ann.color}22;border-left:2px solid ${ann.color};border-radius:3px;font-size:11px;color:#e5e5ea">
              📝 ${ann.content}
            </div>`
          }
        })
        html += `<div style="margin-top:6px;font-size:11px;color:#888;border-top:1px solid #333;padding-top:4px">💡 点击数据点可添加标注</div>`
        return html
      }
    },
    legend: { ...baseLegend, top: 0 },
    grid: baseGrid,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: allYears,
      ...darkAxisStyle,
      axisLabel: {
        ...darkAxisStyle.axisLabel,
        formatter: (v: string) => forecastYears.includes(v) ? `${v}\n预测` : v
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: { ...darkAxisStyle.axisLabel, formatter: '{value}%' },
      axisLine: darkAxisStyle.axisLine,
      splitLine: darkAxisStyle.splitLine
    },
    animationDuration: 800,
    series: [...actualSeries, ...forecastSeries]
  }
})

const viewOptions = computed(() => getViewOptions())

function isView(v: string): v is CategoryViewType {
  return v === 'pie-line' || v === 'bar-area'
}

const leftOption = computed(() => (isView(currentView.value) && currentView.value === 'pie-line' ? pieOption : barOption).value)
const rightOption = computed(() => (isView(currentView.value) && currentView.value === 'pie-line' ? lineOption : areaOption).value)
const leftClick = computed(() => isView(currentView.value) && currentView.value === 'pie-line' ? onPieClick : onBarClick)
const rightClick = computed(() => onLineClick)

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
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-xl font-serif-cn font-bold text-gradient-gold">品类结构分析</h2>

      <NTooltip trigger="hover">
        <template #trigger>
          <NButtonGroup size="small" class="!rounded-lg overflow-hidden">
            <NButton
              v-for="opt in viewOptions"
              :key="opt.value"
              :quaternary="currentView !== opt.value"
              :type="currentView === opt.value ? 'primary' : 'default'"
              class="!px-3"
              @click="setView(opt.value as CategoryViewType)"
            >
              <component
                :is="opt.value === 'pie-line' ? Layers : LayoutGrid"
                class="w-3.5 h-3.5 mr-1.5"
              />
              {{ opt.label }}
            </NButton>
          </NButtonGroup>
        </template>
        切换图表类型，数据不变
      </NTooltip>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 flex-1 min-h-0">
      <div class="bg-ink-900/40 rounded-lg p-3 min-h-[280px]">
        <VChart
          class="w-full h-full"
          :option="leftOption"
          autoresize
          @click="leftClick"
        />
      </div>
      <div class="bg-ink-900/40 rounded-lg p-3 min-h-[280px]">
        <VChart
          class="w-full h-full"
          :option="rightOption"
          autoresize
          @click="rightClick"
        />
      </div>
    </div>

    <div class="mb-4">
      <AnnotationTags module="category" @edit="handleTagEdit" />
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
