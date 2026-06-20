<script setup lang="ts">
import { useDashboardStore } from '@/stores/dashboard'
import { storeToRefs } from 'pinia'
import { NSelect, NSlider, NSpace } from 'naive-ui'
import { Map, Layers } from 'lucide-vue-next'
import { computed } from 'vue'

const store = useDashboardStore()
const { filters, regions, categories } = storeToRefs(store)

const categoryOptions = computed(() =>
  categories.value.map(c => ({ label: c.name, value: c.name }))
)

const regionOptions = computed(() => [
  { label: '全部区域', value: 'all' },
  ...regions.value.map(r => ({ label: r, value: r }))
])

const yearMarks: Record<number, string> = {
  2021: '2021',
  2022: '2022',
  2023: '2023',
  2024: '2024',
  2025: '2025'
}
</script>

<template>
  <div class="card-glass rounded-xl p-5">
    <div class="flex flex-col xl:flex-row xl:items-center gap-6">
      <NSpace vertical size="small" class="flex-1 min-w-0">
        <div class="flex items-center gap-2 text-sm text-champagne-400/90">
          <Map class="w-4 h-4" />
          <span>区域筛选</span>
        </div>
        <NSelect
          :options="regionOptions"
          :value="filters.selectedRegion"
          @update:value="store.setRegion($event as string)"
          placeholder="选择分析区域"
          clearable
          filterable
          class="!w-full"
        />
      </NSpace>

      <NSpace vertical size="small" class="flex-1 min-w-0">
        <div class="flex items-center gap-2 text-sm text-champagne-400/90">
          <Layers class="w-4 h-4" />
          <span>品类筛选</span>
        </div>
        <NSelect
          :options="categoryOptions"
          :value="filters.selectedCategories"
          @update:value="store.setCategories($event as string[])"
          multiple
          placeholder="选择品类（多选）"
          clearable
          filterable
          max-tag-count="responsive"
          class="!w-full"
        />
      </NSpace>

      <NSpace vertical size="small" class="xl:flex-1 min-w-[200px]">
        <div class="flex items-center justify-between">
          <span class="text-sm text-champagne-400/90">时间范围</span>
          <span class="text-xs text-ink-400">
            {{ filters.yearRange[0] }} - {{ filters.yearRange[1] }}
          </span>
        </div>
        <NSlider
          v-model:value="filters.yearRange"
          :min="2021"
          :max="2025"
          :marks="yearMarks"
          range
          @update:value="store.setYearRange"
        />
      </NSpace>
    </div>
  </div>
</template>
