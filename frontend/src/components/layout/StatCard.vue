<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  value: string | number
  unit?: string
  trend?: number
  trendLabel?: string
  icon?: any
  color?: 'wine' | 'gold' | 'blue' | 'green'
}>()

const colorClasses = computed(() => {
  const map: Record<string, string> = {
    wine: 'from-wine-800/30 to-wine-950/50 text-wine-400 border-wine-700/30',
    gold: 'from-champagne-700/20 to-champagne-900/40 text-champagne-400 border-champagne-600/30',
    blue: 'from-blue-800/30 to-blue-950/50 text-blue-400 border-blue-700/30',
    green: 'from-emerald-800/30 to-emerald-950/50 text-emerald-400 border-emerald-700/30'
  }
  return map[props.color || 'wine']
})

const trendIcon = computed(() => {
  if (!props.trend) return Minus
  return props.trend > 0 ? TrendingUp : TrendingDown
})

const trendColor = computed(() => {
  if (!props.trend) return 'text-ink-400'
  return props.trend > 0 ? 'text-emerald-400' : 'text-rose-400'
})
</script>

<template>
  <div class="card-glass rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
    <div class="absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-80 transition-opacity" :class="colorClasses"></div>
    <div class="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-10" :class="color?.includes('gold') ? 'bg-champagne-500' : 'bg-wine-500'"></div>

    <div class="relative">
      <div class="flex items-start justify-between mb-3">
        <span class="text-sm text-ink-300 font-medium">{{ title }}</span>
        <div v-if="icon" class="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br" :class="colorClasses">
          <component :is="icon" class="w-4.5 h-4.5" />
        </div>
      </div>

      <div class="flex items-baseline gap-1 mb-2">
        <span class="text-3xl font-bold font-serif-cn text-white">{{ value }}</span>
        <span v-if="unit" class="text-sm text-ink-400">{{ unit }}</span>
      </div>

      <div v-if="trend !== undefined" class="flex items-center gap-1.5 text-xs">
        <component :is="trendIcon" class="w-3.5 h-3.5" :class="trendColor" />
        <span :class="trendColor" class="font-medium">
          {{ trend > 0 ? '+' : '' }}{{ trend }}%
        </span>
        <span v-if="trendLabel" class="text-ink-400">{{ trendLabel }}</span>
      </div>
    </div>
  </div>
</template>
