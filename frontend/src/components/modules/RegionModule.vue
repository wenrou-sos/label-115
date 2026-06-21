<script setup lang="ts">
import { computed, h, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  RadarComponent,
  MarkPointComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { NDataTable, NTag, NTooltip, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { MapPin, Award, Sparkles, AlertTriangle, MessageSquarePlus } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { useAnnotations } from '@/composables/useAnnotations'
import AnnotationTags from '@/components/layout/AnnotationTags.vue'
import AnnotationDialog from '@/components/layout/AnnotationDialog.vue'
import type { CityData, AnomalyPoint, AnnotationPoint } from '@/types'

use([RadarChart, TitleComponent, TooltipComponent, LegendComponent, RadarComponent, MarkPointComponent, CanvasRenderer])

const store = useDashboardStore()
const annotations = useAnnotations()
const message = useMessage()

const radarDimensions = [
  { name: '白酒', max: 100, key: 'baijiu', label: '白酒占比' },
  { name: '啤酒', max: 100, key: 'beer', label: '啤酒占比' },
  { name: '精酿啤酒', max: 100, key: 'craftBeer', label: '精酿啤酒占比' },
  { name: '红酒', max: 100, key: 'wine', label: '红酒占比' },
  { name: '黄酒', max: 100, key: 'huangjiu', label: '黄酒占比' },
  { name: '威士忌', max: 100, key: 'whiskey', label: '威士忌占比' }
]

const radarColors = ['#8B0000', '#D4AF37', '#CD853F', '#FF69B4', '#4A90D9']

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

function openCityAnnotation(cityName: string, metricName: string, value?: number) {
  const idx = store.radarCities.findIndex(c => c.city === cityName)
  const color = radarColors[idx % radarColors.length]
  const existing = annotations.getAnnotation('region', cityName, metricName)
  existingId.value = existing?.id || null
  const city = store.cities.find(c => c.city === cityName)
  dialogPayload.value = {
    entityName: cityName,
    metricName,
    timePoint: city?.region,
    value: value !== undefined ? value : undefined,
    color,
    initialContent: existing?.content || ''
  }
  showDialog.value = true
}

function onRadarClick(params: any) {
  if (params && params.seriesName) {
    openCityAnnotation(params.seriesName, '区域综合偏好')
  }
}

function handleDialogConfirm(content: string) {
  if (existingId.value) {
    annotations.updateAnnotation(existingId.value, content)
    message.success('标注已更新')
  } else {
    annotations.addAnnotation({
      module: 'region',
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

const radarOption = computed<EChartsOption>(() => {
  const cities = store.radarCities
  const highlightMarks = store.anomalySettings.highlightMarks

  const series = cities.map((c, idx) => {
    const cityAnomalies = highlightMarks ? store.getRegionAnomaliesByCity(c.city) : []
    const cityAnnotations = annotations.getAnnotationsByEntity('region', c.city)
    const markPointData: any[] = []

    if (cityAnomalies.length > 0) {
      radarDimensions.forEach((dim, dimIdx) => {
        const anomaly = cityAnomalies.find(a => a.metric === dim.label)
        if (anomaly) {
          const value = (c as any)[dim.key] as number
          markPointData.push({
            name: anomaly.message,
            coord: [dimIdx, value],
            value: anomaly.changePct > 0 ? `+${anomaly.changePct.toFixed(0)}%` : `${anomaly.changePct.toFixed(0)}%`,
            symbol: 'circle',
            symbolSize: anomaly.severity === 'critical' ? 22 : 16,
            itemStyle: {
              color: anomaly.severity === 'critical' ? '#ef4444' : '#f59e0b',
              borderColor: '#1A1A2E',
              borderWidth: 2,
              shadowBlur: anomaly.severity === 'critical' ? 12 : 6,
              shadowColor: anomaly.severity === 'critical' ? 'rgba(239,68,68,0.8)' : 'rgba(245,158,11,0.7)'
            },
            label: {
              show: true,
              position: 'top',
              distance: 4,
              color: anomaly.severity === 'critical' ? '#fca5a5' : '#fcd34d',
              fontSize: 10,
              fontWeight: 700,
              formatter: anomaly.changePct > 0 ? `+${anomaly.changePct.toFixed(0)}%!` : `${anomaly.changePct.toFixed(0)}%!`
            },
            emphasis: {
              itemStyle: {
                shadowBlur: anomaly.severity === 'critical' ? 20 : 12,
                shadowColor: anomaly.severity === 'critical' ? '#ef4444' : '#f59e0b'
              }
            }
          })
        }
      })
    }

    if (cityAnnotations.length > 0) {
      radarDimensions.forEach((dim, dimIdx) => {
        const ann = cityAnnotations.find(a => a.metric === dim.label)
        if (ann) {
          const value = (c as any)[dim.key] as number
          markPointData.push({
            name: ann.content,
            coord: [dimIdx, value],
            value: '📝',
            symbol: 'pin',
            symbolSize: 36,
            itemStyle: {
              color: radarColors[idx % radarColors.length],
              borderColor: '#1A1A2E',
              borderWidth: 2,
              shadowBlur: 8,
              shadowColor: radarColors[idx % radarColors.length]
            },
            label: { show: true, color: '#fff', fontSize: 10, formatter: '📝' },
            emphasis: {
              label: { show: true, formatter: ann.content, fontSize: 12, width: 160, overflow: 'break' }
            }
          })
        }
      })
    }

    const hasAnyAnnotation = cityAnnotations.length > 0
    return {
      type: 'radar' as const,
      name: c.city,
      emphasis: {
        lineStyle: { width: 3 }
      },
      data: [
        {
          name: c.city,
          value: [c.baijiu, c.beer, c.craftBeer, c.wine, c.huangjiu, c.whiskey],
          lineStyle: {
            width: hasAnyAnnotation ? 3 : 2,
            color: radarColors[idx % radarColors.length]
          },
          areaStyle: {
            color: hasAnyAnnotation
              ? `${radarColors[idx % radarColors.length]}44`
              : `${radarColors[idx % radarColors.length]}22`
          },
          itemStyle: { color: radarColors[idx % radarColors.length] }
        }
      ],
      markPoint: markPointData.length > 0 ? {
        symbol: 'circle',
        symbolSize: 14,
        label: { show: true, fontSize: 10, fontWeight: 700 },
        data: markPointData,
        animation: true,
        animationDuration: 500
      } : undefined
    }
  })

  return {
    tooltip: {
      backgroundColor: 'rgba(15, 15, 26, 0.95)',
      borderColor: '#D4AF37',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params]
        let html = ''
        list.forEach((p: any) => {
          const cityName = p.seriesName || p.name
          const cityAnnotations = annotations.getAnnotationsByEntity('region', cityName)
          html += `<div style="font-weight:bold;margin-bottom:6px;color:${p.color}">${cityName}</div>`
          if (p.value && Array.isArray(p.value)) {
            radarDimensions.forEach((dim, i) => {
              const ann = cityAnnotations.find(a => a.metric === dim.label)
              html += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                <span>${dim.name}：<b>${p.value[i]}%</b></span>
                ${ann ? `<span style="font-size:11px;background:${ann.color}22;color:${ann.color};padding:0 4px;border-radius:2px">📝</span>` : ''}
              </div>`
            })
          }
          if (p.marker && p.data && typeof p.data === 'object' && p.data.value) {
            const val = p.data.value
            const isAnom = typeof val === 'string' && val.includes('%')
            if (isAnom) {
              html += `<div style="font-size:11px;color:${String(val).startsWith('+') ? '#fca5a5' : '#fcd34d'};margin-left:14px">
                ⚠ ${p.data.value} 异常偏离
              </div>`
            }
          }
          cityAnnotations.forEach(ann => {
            html += `<div style="margin:4px 0 4px 14px;padding:3px 6px;background:${ann.color}22;border-left:2px solid ${ann.color};border-radius:3px;font-size:11px;color:#e5e5ea">
              📝 [${ann.metric}] ${ann.content}
            </div>`
          })
        })
        html += `<div style="margin-top:6px;font-size:11px;color:#888;border-top:1px solid #333;padding-top:4px">💡 点击雷达图区域或排行行✏️可添加标注</div>`
        return html
      }
    },
    legend: {
      data: cities.map(c => c.city),
      textStyle: { color: '#c9c9d3', fontSize: 12 },
      itemGap: 12,
      bottom: 0
    },
    color: radarColors,
    radar: {
      indicator: radarDimensions,
      center: ['50%', '50%'],
      radius: '65%',
      splitNumber: 4,
      axisName: {
        color: '#c9c9d3',
        fontSize: 12
      },
      splitLine: {
        lineStyle: { color: 'rgba(58, 58, 74, 0.6)' }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(139, 0, 0, 0.03)', 'rgba(212, 175, 55, 0.03)']
        }
      },
      axisLine: {
        lineStyle: { color: 'rgba(58, 58, 74, 0.8)' }
      }
    },
    series
  }
})

const rankingData = computed(() => {
  return [...store.filteredCities]
    .sort((a, b) => b.craftIndex - a.craftIndex)
    .map((city, index) => {
      const cityAnomalies = store.getRegionAnomaliesByCity(city.city)
      const hasCritical = cityAnomalies.some(a => a.severity === 'critical')
      const cityAnnotations = annotations.getAnnotationsByEntity('region', city.city)
      return {
        key: city.city,
        rank: index + 1,
        city: city.city,
        region: city.region,
        craftIndex: city.craftIndex,
        anomalyCount: cityAnomalies.length,
        anomalySeverity: hasCritical ? 'critical' : cityAnomalies.length > 0 ? 'warning' : 'none' as 'critical' | 'warning' | 'none',
        annotationCount: cityAnnotations.length
      }
    })
})

interface RankingRow {
  rank: number
  city: string
  region: string
  craftIndex: number
  anomalyCount: number
  anomalySeverity: 'critical' | 'warning' | 'none'
  annotationCount: number
}

const rankingColumns: DataTableColumns<RankingRow> = [
  {
    title: '排名',
    key: 'rank',
    width: 60,
    render: (row: RankingRow) => {
      const isTop3 = row.rank <= 3
      return h(
        'div',
        {
          class: [
            'w-6',
            'h-6',
            'rounded-full',
            'flex',
            'items-center',
            'justify-center',
            'text-xs',
            'font-bold',
            isTop3
              ? ['bg-gradient-to-br', 'from-champagne-500', 'to-champagne-700', 'text-ink-950']
              : ['bg-ink-700', 'text-ink-300']
          ]
        },
        String(row.rank)
      )
    }
  },
  {
    title: '城市',
    key: 'city',
    ellipsis: { tooltip: true },
    render: (row: RankingRow) => {
      return h(
        'div',
        { class: 'flex items-center gap-2' },
        [
          row.anomalyCount > 0
            ? h(AlertTriangle, {
                class: [
                  'w-3.5 h-3.5 flex-shrink-0',
                  row.anomalySeverity === 'critical' ? 'text-red-400' : 'text-amber-400'
                ]
              })
            : null,
          h('span', { class: 'text-ink-100' }, row.city),
          row.annotationCount > 0
            ? h(NTag, { size: 'tiny', round: true, type: 'success', bordered: false }, {
                default: () => `${row.annotationCount}📝`
              })
            : null
        ]
      )
    }
  },
  { title: '区域', key: 'region', width: 70, ellipsis: { tooltip: true } },
  {
    title: '精酿指数',
    key: 'craftIndex',
    width: 110,
    render: (row: RankingRow) => {
      return h(
        'div',
        { class: 'flex items-center justify-between w-full' },
        [
          h('span', { class: ['font-bold', 'text-champagne-400'] }, row.craftIndex.toFixed(1)),
          h(NTooltip, null, {
            trigger: () => h(
              'button',
              {
                class: 'p-1 rounded hover:bg-ink-700/60 text-ink-400 hover:text-champagne-400 transition-colors',
                onClick: () => openCityAnnotation(row.city, '精酿指数', row.craftIndex)
              },
              [h(MessageSquarePlus, { class: 'w-3.5 h-3.5' })]
            ),
            default: () => '添加标注'
          })
        ]
      )
    }
  }
]

const regionTags = [
  { icon: MapPin, text: '东北白酒高占比', color: 'wine' as const },
  { icon: Sparkles, text: '沿海红酒精酿渗透', color: 'gold' as const },
  { icon: Award, text: '成渝精酿领先', color: 'wine' as const }
]
</script>

<template>
  <div class="card-glass rounded-xl p-6 h-full flex flex-col">
    <div class="flex items-center gap-3 mb-5">
      <h2 class="text-xl font-serif-cn font-bold text-gradient-gold">区域消费偏好分析</h2>
      <NTag
        v-if="store.anomalySettings.enabled && store.regionAnomalies.length > 0"
        size="small"
        type="warning"
        round
      >
        <span class="flex items-center gap-1">
          <AlertTriangle class="w-3 h-3" />
          {{ store.regionAnomalies.length }} 项异常
        </span>
      </NTag>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5 flex-1 min-h-0">
      <div class="lg:col-span-3 bg-ink-900/40 rounded-lg p-3 min-h-[320px]">
        <VChart
          class="w-full h-full"
          :option="radarOption"
          autoresize
          @click="onRadarClick"
        />
      </div>

      <div class="lg:col-span-2 bg-ink-900/40 rounded-lg p-4 min-h-[320px] flex flex-col">
        <div class="flex items-center gap-2 mb-3">
          <Award class="w-4 h-4 text-champagne-400" />
          <span class="text-sm font-semibold text-ink-100">精酿消费指数排行</span>
        </div>
        <div class="flex-1 overflow-auto custom-scrollbar">
          <NDataTable
            :columns="rankingColumns"
            :data="rankingData"
            :bordered="false"
            size="small"
            striped
            :theme-overrides="{
              thColor: 'rgba(26, 26, 46, 0.9)',
              tdColor: 'rgba(26, 26, 46, 0.6)',
              tdColorStriped: 'rgba(26, 26, 46, 0.4)',
              tdColorHover: 'rgba(212, 175, 55, 0.08)',
              borderColor: 'rgba(58, 58, 74, 0.5)',
              thTextColor: '#D4AF37',
              tdTextColor: '#e8e8ec'
            }"
          />
        </div>
      </div>
    </div>

    <div class="mb-4">
      <AnnotationTags module="region" @edit="handleTagEdit" />
    </div>

    <div class="flex flex-wrap gap-3">
      <div
        v-for="tag in regionTags"
        :key="tag.text"
        class="card-glass rounded-lg px-4 py-2.5 flex items-center gap-2 hover:scale-[1.02] transition-transform duration-300"
      >
        <component
          :is="tag.icon"
          class="w-4 h-4 shrink-0"
          :class="tag.color === 'wine' ? 'text-wine-400' : 'text-champagne-400'"
        />
        <span
          class="text-sm font-medium"
          :class="tag.color === 'wine' ? 'text-wine-300' : 'text-champagne-300'"
        >
          {{ tag.text }}
        </span>
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

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(212, 175, 55, 0.3);
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
</style>
