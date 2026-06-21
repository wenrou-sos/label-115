<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import { useDashboardStore } from '@/stores/dashboard'
import { baseTooltip, baseLegend, baseGrid, darkAxisStyle } from '@/utils/chartOptions'
import { Globe, TrendingDown } from 'lucide-vue-next'

const store = useDashboardStore()

const lineColors: Record<string, string> = {
  '进口葡萄酒': '#4A90D9',
  '国产葡萄酒': '#8B0000',
  '进口威士忌': '#5B8DEF',
  '国产威士忌': '#B22222',
  '关税率': '#D4AF37'
}

const seriesToMetricMap: Record<string, string> = {
  '进口葡萄酒': '进口红酒份额',
  '国产葡萄酒': '国产红酒份额',
  '进口威士忌': '进口威士忌份额',
  '国产威士忌': '国产威士忌份额',
  '关税率': '关税率'
}

function buildAnomalyMarkPoints(seriesName: string, years: string[], getY: (year: string) => number | undefined): any | undefined {
  if (!store.anomalySettings.highlightMarks) return undefined
  const metric = seriesToMetricMap[seriesName]
  if (!metric) return undefined
  const anomalies = store.getImportAnomaliesByMetric(metric)
  const result: any[] = []
  anomalies.forEach(a => {
    if (years.indexOf(a.timePoint) >= 0) {
      const yVal = getY(a.timePoint)
      if (yVal === undefined) return
      result.push({
        name: a.message,
        coord: [a.timePoint, yVal],
        value: a.changePct > 0 ? `+${a.changePct.toFixed(0)}%` : `${a.changePct.toFixed(0)}%`,
        symbol: 'circle',
        symbolSize: a.severity === 'critical' ? 22 : 16,
        itemStyle: {
          color: a.severity === 'critical' ? '#ef4444' : '#f59e0b',
          borderColor: '#1A1A2E',
          borderWidth: 2,
          shadowBlur: a.severity === 'critical' ? 14 : 7,
          shadowColor: a.severity === 'critical' ? 'rgba(239,68,68,0.8)' : 'rgba(245,158,11,0.7)'
        },
        label: {
          show: true,
          position: 'top',
          color: a.severity === 'critical' ? '#fca5a5' : '#fcd34d',
          fontSize: 9,
          fontWeight: 700,
          formatter: a.changePct > 0 ? `+${a.changePct.toFixed(0)}%!` : `${a.changePct.toFixed(0)}%!`
        }
      })
    }
  })
  return result.length > 0 ? {
    symbol: 'circle',
    symbolSize: 12,
    label: { show: true, fontSize: 9, fontWeight: 700 },
    data: result
  } : undefined
}

const chartOption = computed<EChartsOption>(() => {
  const data = store.filteredImportCompare.length > 0 ? store.filteredImportCompare : store.importCompare
  const years = data.map(d => d.year)
  const tariffData = data.map(d => d.tariffRate)
  const tariffMarkPoints = tariffData
    .map((v, i) => ({ v, i }))
    .filter((item, idx, arr) => idx === 0 || item.v !== arr[idx - 1].v)
    .map(item => ({
      name: `关税降至${item.v}%`,
      coord: [item.i, item.v],
      value: `${item.v}%`,
      symbol: 'pin',
      symbolSize: 48,
      label: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 600
      },
      itemStyle: {
        color: lineColors['关税率']
      }
    }))

  const importWineByYear = (y: string) => data.find(d => d.year === y)?.importWineShare
  const domesticWineByYear = (y: string) => data.find(d => d.year === y)?.domesticWineShare
  const importWhiskeyByYear = (y: string) => data.find(d => d.year === y)?.importWhiskeyShare
  const domesticWhiskeyByYear = (y: string) => data.find(d => d.year === y)?.domesticWhiskeyShare
  const tariffByYear = (y: string) => data.find(d => d.year === y)?.tariffRate

  return {
    tooltip: {
      ...baseTooltip,
      axisPointer: {
        type: 'cross',
        crossStyle: { color: '#D4AF37', width: 1 },
        lineStyle: { color: 'rgba(212, 175, 55, 0.4)', type: 'dashed' }
      },
      formatter: (params: any) => {
        const arr = Array.isArray(params) ? params : [params]
        const year = arr[0].axisValue
        let html = `<div style="font-weight:600;margin-bottom:8px;color:#D4AF37">${year}年</div>`
        arr.forEach((p: any) => {
          const unit = p.seriesName === '关税率' ? '%' : '%'
          html += `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color}"></span>
            <span>${p.seriesName}：<strong style="color:#fff">${p.value}${unit}</strong></span>
          </div>`
        })
        return html
      }
    },
    legend: {
      ...baseLegend,
      data: ['进口葡萄酒', '国产葡萄酒', '进口威士忌', '国产威士忌', '关税率']
    },
    grid: baseGrid,
    xAxis: {
      type: 'category',
      data: years,
      boundaryGap: false,
      ...darkAxisStyle,
      axisLabel: {
        ...darkAxisStyle.axisLabel,
        fontWeight: 500,
        formatter: '{value}年'
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '市场份额(%)',
        position: 'left',
        min: 0,
        max: 80,
        nameTextStyle: { color: '#9c9cab', fontSize: 12 },
        ...darkAxisStyle,
        axisLabel: {
          ...darkAxisStyle.axisLabel,
          formatter: '{value}%'
        }
      },
      {
        type: 'value',
        name: '关税率(%)',
        position: 'right',
        min: 0,
        max: 20,
        nameTextStyle: { color: '#D4AF37', fontSize: 12 },
        axisLine: {
          show: true,
          lineStyle: { color: '#D4AF37' }
        },
        axisLabel: {
          color: '#D4AF37',
          fontSize: 12,
          formatter: '{value}%'
        },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '进口葡萄酒',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 2.5, color: lineColors['进口葡萄酒'] },
        itemStyle: { color: lineColors['进口葡萄酒'] },
        data: data.map(d => d.importWineShare),
        markPoint: buildAnomalyMarkPoints('进口葡萄酒', years, importWineByYear)
      },
      {
        name: '国产葡萄酒',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 2.5, color: lineColors['国产葡萄酒'] },
        itemStyle: { color: lineColors['国产葡萄酒'] },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(139, 0, 0, 0.25)' },
              { offset: 1, color: 'rgba(139, 0, 0, 0.02)' }
            ]
          }
        },
        data: data.map(d => d.domesticWineShare),
        markPoint: buildAnomalyMarkPoints('国产葡萄酒', years, domesticWineByYear)
      },
      {
        name: '进口威士忌',
        type: 'line',
        smooth: true,
        symbol: 'diamond',
        symbolSize: 7,
        lineStyle: { width: 2.5, color: lineColors['进口威士忌'], type: 'dashed' },
        itemStyle: { color: lineColors['进口威士忌'] },
        data: data.map(d => d.importWhiskeyShare),
        markPoint: buildAnomalyMarkPoints('进口威士忌', years, importWhiskeyByYear)
      },
      {
        name: '国产威士忌',
        type: 'line',
        smooth: true,
        symbol: 'diamond',
        symbolSize: 7,
        lineStyle: { width: 2.5, color: lineColors['国产威士忌'], type: 'dashed' },
        itemStyle: { color: lineColors['国产威士忌'] },
        data: data.map(d => d.domesticWhiskeyShare),
        markPoint: buildAnomalyMarkPoints('国产威士忌', years, domesticWhiskeyByYear)
      },
      {
        name: '关税率',
        type: 'line',
        yAxisIndex: 1,
        smooth: false,
        symbol: 'roundRect',
        symbolSize: 10,
        lineStyle: { width: 3, color: lineColors['关税率'] },
        itemStyle: { color: lineColors['关税率'], borderWidth: 2, borderColor: '#1A1A2E' },
        markPoint: { data: tariffMarkPoints, ...(buildAnomalyMarkPoints('关税率', years, tariffByYear) || {}) },
        data: tariffData
      }
    ]
  }
})

const insights = computed(() => {
  const src = store.filteredImportCompare.length > 0 ? store.filteredImportCompare : store.importCompare
  const first = src[0]
  const last = src[src.length - 1]
  if (!first || !last) return []
  return [
    { label: '进口葡萄酒份额下降', value: `-${(first.importWineShare - last.importWineShare).toFixed(1)}%` },
    { label: '国产威士忌份额上升', value: `+${(last.domesticWhiskeyShare - first.domesticWhiskeyShare).toFixed(1)}%` },
    { label: '关税下调', value: `${first.tariffRate}%→${last.tariffRate}%` }
  ]
})
</script>

<template>
  <div class="card-glass rounded-xl p-5 flex flex-col h-full">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <Globe class="w-5 h-5 text-champagne-400" />
        <h3 class="text-lg font-semibold font-serif-cn text-white">进口与国产对比分析</h3>
      </div>
      <div class="flex gap-2 flex-wrap">
        <span
          v-for="item in insights"
          :key="item.label"
          class="text-xs px-2.5 py-1 rounded-full font-medium bg-ink-800/60 text-ink-200 border border-ink-600/40 flex items-center gap-1"
        >
          <TrendingDown v-if="item.label.includes('下降')" class="w-3 h-3 text-rose-400" />
          {{ item.label }} <span class="text-champagne-400">{{ item.value }}</span>
        </span>
      </div>
    </div>

    <div class="flex-1 min-h-[320px]">
      <VChart :option="chartOption" autoresize class="w-full h-full" />
    </div>
  </div>
</template>
