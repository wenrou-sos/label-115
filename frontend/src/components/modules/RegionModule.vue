<script setup lang="ts">
import { computed, h } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  RadarComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { MapPin, Award, Sparkles } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import type { CityData } from '@/types'

use([RadarChart, TitleComponent, TooltipComponent, LegendComponent, RadarComponent, CanvasRenderer])

const store = useDashboardStore()

const radarDimensions = [
  { name: '白酒', max: 100 },
  { name: '啤酒', max: 100 },
  { name: '精酿啤酒', max: 100 },
  { name: '红酒', max: 100 },
  { name: '黄酒', max: 100 },
  { name: '威士忌', max: 100 }
]

const radarColors = ['#8B0000', '#D4AF37', '#CD853F', '#FF69B4', '#4A90D9']

const radarOption = computed<EChartsOption>(() => {
  const cities = store.radarCities

  return {
    tooltip: {
      backgroundColor: 'rgba(15, 15, 26, 0.95)',
      borderColor: '#D4AF37',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 13 }
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
    series: [
      {
        type: 'radar',
        emphasis: {
          lineStyle: { width: 3 }
        },
        data: cities.map((c, idx) => ({
          name: c.city,
          value: [c.baijiu, c.beer, c.craftBeer, c.wine, c.huangjiu, c.whiskey],
          lineStyle: { width: 2, color: radarColors[idx] },
          areaStyle: { color: `${radarColors[idx]}22` },
          itemStyle: { color: radarColors[idx] }
        }))
      }
    ]
  }
})

const rankingData = computed(() => {
  return [...store.filteredCities]
    .sort((a, b) => b.craftIndex - a.craftIndex)
    .map((city, index) => ({
      key: city.city,
      rank: index + 1,
      city: city.city,
      region: city.region,
      craftIndex: city.craftIndex
    }))
})

interface RankingRow { rank: number; city: string; region: string; craftIndex: number }

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
  { title: '城市', key: 'city', ellipsis: { tooltip: true } },
  { title: '区域', key: 'region', width: 70, ellipsis: { tooltip: true } },
  {
    title: '精酿指数',
    key: 'craftIndex',
    width: 90,
    render: (row: RankingRow) => {
      return h(
        'span',
        { class: ['font-bold', 'text-champagne-400'] },
        row.craftIndex.toFixed(1)
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
    <h2 class="text-xl font-serif-cn font-bold text-gradient-gold mb-5">区域消费偏好分析</h2>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5 flex-1 min-h-0">
      <div class="lg:col-span-3 bg-ink-900/40 rounded-lg p-3 min-h-[320px]">
        <VChart class="w-full h-full" :option="radarOption" autoresize />
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
