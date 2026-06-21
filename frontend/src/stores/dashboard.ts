import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  OverviewData,
  CategoryData,
  CityData,
  PriceRangeData,
  AgeGroupData,
  FestivalData,
  ImportCompareData,
  DashboardFilters,
  AnomalyPoint,
  AnomalySettings,
  AnomalySeverity,
  MetricMeta,
  CustomMetric,
  CustomMetricsConfig
} from '@/types'
import { METRIC_CATEGORY_LABELS } from '@/types'
type MessageApi = {
  success: (msg: string) => void
  error: (msg: string) => void
  warning: (msg: string) => void
  info: (msg: string) => void
}
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { api } from '@/api'

const STORAGE_KEY = 'liquor-dashboard-filters'
const STORAGE_ANOMALY_KEY = 'liquor-dashboard-anomaly-settings'
const STORAGE_CUSTOM_METRICS_KEY = 'liquor-dashboard-custom-metrics'
export const DEFAULT_FILTERS: DashboardFilters = {
  yearRange: [2021, 2025],
  selectedCategories: [],
  selectedRegion: 'all'
}

export const DEFAULT_ANOMALY_SETTINGS: AnomalySettings = {
  enabled: true,
  thresholdPct: 15,
  highlightMarks: true
}

export const DEFAULT_CUSTOM_METRICS: CustomMetricsConfig = {
  enabled: false,
  metrics: []
}

export const AVAILABLE_METRICS: MetricMeta[] = [
  { id: 'overview_totalMarket', name: '总市场规模', category: 'overview', categoryLabel: METRIC_CATEGORY_LABELS.overview, unit: '万亿元', color: 'wine', description: '全品类年度市场总规模' },
  { id: 'overview_totalGrowth', name: '整体增速', category: 'overview', categoryLabel: METRIC_CATEGORY_LABELS.overview, unit: '%', color: 'green', description: '市场整体同比增长率' },
  { id: 'overview_categoryCount', name: '品类覆盖数', category: 'overview', categoryLabel: METRIC_CATEGORY_LABELS.overview, unit: '大品类', color: 'gold', description: '统计涵盖的酒品类数量' },
  { id: 'overview_craftBeerIndex', name: '精酿消费指数', category: 'overview', categoryLabel: METRIC_CATEGORY_LABELS.overview, color: 'green', description: '精酿啤酒综合消费热度指数' },

  { id: 'category_baijiu_share', name: '白酒份额', category: 'category', categoryLabel: METRIC_CATEGORY_LABELS.category, unit: '%', color: 'wine', description: '白酒市场份额占比' },
  { id: 'category_beer_share', name: '啤酒份额', category: 'category', categoryLabel: METRIC_CATEGORY_LABELS.category, unit: '%', color: 'gold', description: '啤酒市场份额占比' },
  { id: 'category_wine_share', name: '红酒份额', category: 'category', categoryLabel: METRIC_CATEGORY_LABELS.category, unit: '%', color: 'wine', description: '红酒市场份额占比' },
  { id: 'category_huangjiu_share', name: '黄酒份额', category: 'category', categoryLabel: METRIC_CATEGORY_LABELS.category, unit: '%', color: 'gold', description: '黄酒市场份额占比' },
  { id: 'category_craftBeer_share', name: '精酿啤酒份额', category: 'category', categoryLabel: METRIC_CATEGORY_LABELS.category, unit: '%', color: 'green', description: '精酿啤酒市场份额占比' },
  { id: 'category_whiskey_share', name: '威士忌份额', category: 'category', categoryLabel: METRIC_CATEGORY_LABELS.category, unit: '%', color: 'gold', description: '威士忌市场份额占比' },

  { id: 'category_baijiu_growth', name: '白酒增速', category: 'category', categoryLabel: METRIC_CATEGORY_LABELS.category, unit: '%', color: 'green', description: '白酒最近一年增速' },
  { id: 'category_beer_growth', name: '啤酒增速', category: 'category', categoryLabel: METRIC_CATEGORY_LABELS.category, unit: '%', color: 'green', description: '啤酒最近一年增速' },
  { id: 'category_wine_growth', name: '红酒增速', category: 'category', categoryLabel: METRIC_CATEGORY_LABELS.category, unit: '%', color: 'green', description: '红酒最近一年增速' },
  { id: 'category_craftBeer_growth', name: '精酿啤酒增速', category: 'category', categoryLabel: METRIC_CATEGORY_LABELS.category, unit: '%', color: 'green', description: '精酿啤酒最近一年增速' },
  { id: 'category_whiskey_growth', name: '威士忌增速', category: 'category', categoryLabel: METRIC_CATEGORY_LABELS.category, unit: '%', color: 'green', description: '威士忌最近一年增速' },

  { id: 'region_avgCraftIndex', name: '区域平均精酿指数', category: 'region', categoryLabel: METRIC_CATEGORY_LABELS.region, color: 'gold', description: '所选区域城市的精酿指数平均值' },
  { id: 'region_topCraftCity', name: '精酿指数最高城市', category: 'region', categoryLabel: METRIC_CATEGORY_LABELS.region, color: 'green', description: '精酿消费指数最高的城市' },
  { id: 'region_cityCount', name: '覆盖城市数', category: 'region', categoryLabel: METRIC_CATEGORY_LABELS.region, unit: '个', color: 'blue', description: '当前筛选条件下的城市数量' },

  { id: 'age_18-25_baijiu', name: '18-25岁白酒占比', category: 'age', categoryLabel: METRIC_CATEGORY_LABELS.age, unit: '%', color: 'wine', description: '18-25岁人群白酒消费占比' },
  { id: 'age_26-30_baijiu', name: '26-30岁白酒占比', category: 'age', categoryLabel: METRIC_CATEGORY_LABELS.age, unit: '%', color: 'wine', description: '26-30岁人群白酒消费占比' },
  { id: 'age_31-40_baijiu', name: '31-40岁白酒占比', category: 'age', categoryLabel: METRIC_CATEGORY_LABELS.age, unit: '%', color: 'wine', description: '31-40岁人群白酒消费占比' },
  { id: 'age_41-50_baijiu', name: '41-50岁白酒占比', category: 'age', categoryLabel: METRIC_CATEGORY_LABELS.age, unit: '%', color: 'wine', description: '41-50岁人群白酒消费占比' },
  { id: 'age_51+_baijiu', name: '51岁以上白酒占比', category: 'age', categoryLabel: METRIC_CATEGORY_LABELS.age, unit: '%', color: 'wine', description: '51岁以上人群白酒消费占比' },

  { id: 'age_18-25_craftBeer', name: '18-25岁精酿占比', category: 'age', categoryLabel: METRIC_CATEGORY_LABELS.age, unit: '%', color: 'green', description: '18-25岁人群精酿啤酒消费占比' },
  { id: 'age_26-30_craftBeer', name: '26-30岁精酿占比', category: 'age', categoryLabel: METRIC_CATEGORY_LABELS.age, unit: '%', color: 'green', description: '26-30岁人群精酿啤酒消费占比' },
  { id: 'age_31-40_craftBeer', name: '31-40岁精酿占比', category: 'age', categoryLabel: METRIC_CATEGORY_LABELS.age, unit: '%', color: 'green', description: '31-40岁人群精酿啤酒消费占比' },

  { id: 'age_18-25_wine', name: '18-25岁红酒占比', category: 'age', categoryLabel: METRIC_CATEGORY_LABELS.age, unit: '%', color: 'wine', description: '18-25岁人群红酒消费占比' },
  { id: 'age_26-30_wine', name: '26-30岁红酒占比', category: 'age', categoryLabel: METRIC_CATEGORY_LABELS.age, unit: '%', color: 'wine', description: '26-30岁人群红酒消费占比' },

  { id: 'price_low_share', name: '百元以下酒份额', category: 'price', categoryLabel: METRIC_CATEGORY_LABELS.price, unit: '%', color: 'gold', description: '100元以下价格带份额' },
  { id: 'price_mid_share', name: '100-300元酒份额', category: 'price', categoryLabel: METRIC_CATEGORY_LABELS.price, unit: '%', color: 'blue', description: '100-300元价格带份额' },
  { id: 'price_high_share', name: '300-800元酒份额', category: 'price', categoryLabel: METRIC_CATEGORY_LABELS.price, unit: '%', color: 'wine', description: '300-800元价格带份额' },
  { id: 'price_premium_share', name: '800-2000元酒份额', category: 'price', categoryLabel: METRIC_CATEGORY_LABELS.price, unit: '%', color: 'gold', description: '800-2000元次高端价格带份额' },
  { id: 'price_luxury_share', name: '2000元以上酒份额', category: 'price', categoryLabel: METRIC_CATEGORY_LABELS.price, unit: '%', color: 'wine', description: '2000元以上高端价格带份额' },

  { id: 'price_low_trend', name: '大众酒趋势', category: 'price', categoryLabel: METRIC_CATEGORY_LABELS.price, unit: '%', color: 'green', description: '百元以下价格带最近一年趋势变化' },
  { id: 'price_premium_trend', name: '次高端酒趋势', category: 'price', categoryLabel: METRIC_CATEGORY_LABELS.price, unit: '%', color: 'green', description: '800-2000元价格带最近一年趋势变化' },
  { id: 'price_luxury_trend', name: '高端酒趋势', category: 'price', categoryLabel: METRIC_CATEGORY_LABELS.price, unit: '%', color: 'green', description: '2000元以上价格带最近一年趋势变化' },

  { id: 'festival_springFestival_baijiu', name: '春节白酒销售倍数', category: 'festival', categoryLabel: METRIC_CATEGORY_LABELS.festival, unit: 'x', color: 'wine', description: '春节期间白酒相对平日销售倍数' },
  { id: 'festival_valentines_wine', name: '情人节红酒销售倍数', category: 'festival', categoryLabel: METRIC_CATEGORY_LABELS.festival, unit: 'x', color: 'wine', description: '情人节期间红酒相对平日销售倍数' },
  { id: 'festival_midAutumn_highEnd', name: '中秋高端酒占比', category: 'festival', categoryLabel: METRIC_CATEGORY_LABELS.festival, unit: '%', color: 'gold', description: '中秋期间高端酒平均占比' },
  { id: 'festival_christmas_sparkling', name: '圣诞香槟/起泡酒倍数', category: 'festival', categoryLabel: METRIC_CATEGORY_LABELS.festival, unit: 'x', color: 'gold', description: '圣诞节香槟/起泡酒相对平日销售倍数' },
  { id: 'festival_newYear_beer', name: '元旦啤酒销售倍数', category: 'festival', categoryLabel: METRIC_CATEGORY_LABELS.festival, unit: 'x', color: 'gold', description: '元旦期间啤酒相对平日销售倍数' },
  { id: 'festival_qingming_huangjiu', name: '清明黄酒销售倍数', category: 'festival', categoryLabel: METRIC_CATEGORY_LABELS.festival, unit: 'x', color: 'gold', description: '清明节期间黄酒相对平日销售倍数' }
]

const DEFAULT_VALID_REGIONS = ['华东', '华南', '华北', '华中', '西南', '西北', '东北', '成渝', '沿海']
const DEFAULT_VALID_CATEGORIES = ['白酒', '红酒', '啤酒', '黄酒', '果酒清酒', '精酿啤酒']
const VALID_YEAR_MIN = 2000
const VALID_YEAR_MAX = 2100

function sanitizeFilters(input: DashboardFilters, validRegions?: string[], validCategories?: string[]): DashboardFilters {
  const result: DashboardFilters = {
    yearRange: [...DEFAULT_FILTERS.yearRange] as [number, number],
    selectedCategories: [],
    selectedRegion: DEFAULT_FILTERS.selectedRegion
  }

  const allowedRegions = new Set(['all', ...(validRegions ?? DEFAULT_VALID_REGIONS)])
  const allowedCategories = new Set(validCategories ?? DEFAULT_VALID_CATEGORIES)

  if (typeof input.selectedRegion === 'string' && allowedRegions.has(input.selectedRegion)) {
    result.selectedRegion = input.selectedRegion
  }

  if (Array.isArray(input.selectedCategories)) {
    result.selectedCategories = input.selectedCategories.filter(
      c => typeof c === 'string' && c.length > 0 && allowedCategories.has(c)
    )
  }

  if (Array.isArray(input.yearRange) && input.yearRange.length === 2) {
    let [start, end] = input.yearRange
    start = typeof start === 'number' && isFinite(start) ? Math.round(start) : NaN
    end = typeof end === 'number' && isFinite(end) ? Math.round(end) : NaN
    if (!isNaN(start) && !isNaN(end)
        && start >= VALID_YEAR_MIN && start <= VALID_YEAR_MAX
        && end >= VALID_YEAR_MIN && end <= VALID_YEAR_MAX
        && start <= end) {
      result.yearRange = [start, end]
    }
  }

  return result
}

export function buildFilterQuery(filters: DashboardFilters): Record<string, string> {
  const params: Record<string, string> = {}
  const { yearRange, selectedCategories, selectedRegion } = filters

  if (selectedRegion && selectedRegion !== 'all') {
    params.region = selectedRegion
  }
  if (selectedCategories.length > 0) {
    params.categories = selectedCategories.join(',')
  }
  if (yearRange[0] !== DEFAULT_FILTERS.yearRange[0] || yearRange[1] !== DEFAULT_FILTERS.yearRange[1]) {
    params.year = `${yearRange[0]}-${yearRange[1]}`
  }

  return params
}

export function parseFilterQuery(query: Record<string, any>, filters: DashboardFilters, validRegions?: string[], validCategories?: string[]): boolean {
  const raw: DashboardFilters = {
    yearRange: [...DEFAULT_FILTERS.yearRange] as [number, number],
    selectedCategories: [],
    selectedRegion: DEFAULT_FILTERS.selectedRegion
  }

  if (query.region && typeof query.region === 'string') {
    raw.selectedRegion = query.region
  }
  if (query.categories && typeof query.categories === 'string') {
    raw.selectedCategories = query.categories.split(',').filter(Boolean)
  }
  if (query.year && typeof query.year === 'string') {
    const match = query.year.match(/(\d{4})-(\d{4})/)
    if (match) {
      raw.yearRange = [parseInt(match[1]), parseInt(match[2])]
    }
  }

  const clean = sanitizeFilters(raw, validRegions, validCategories)
  const original = JSON.stringify(filters)
  filters.yearRange = clean.yearRange
  filters.selectedCategories = clean.selectedCategories
  filters.selectedRegion = clean.selectedRegion

  return JSON.stringify(filters) !== original
}

export function buildShareUrl(filters: DashboardFilters, path: string): string {
  const params = new URLSearchParams()
  const query = buildFilterQuery(filters)
  Object.keys(query).forEach(k => params.set(k, query[k]))
  const baseUrl = `${window.location.origin}${path}`
  const queryStr = params.toString()
  return queryStr ? `${baseUrl}?${queryStr}` : baseUrl
}

export async function copyShareUrl(url: string, message: MessageApi) {
  try {
    await navigator.clipboard.writeText(url)
    message.success('分享链接已复制到剪贴板')
  } catch (e) {
    try {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      message.success('分享链接已复制到剪贴板')
    } catch (e2) {
      message.error('复制失败，请手动复制：' + url)
    }
  }
}

export const useDashboardStore = defineStore('dashboard', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const overview = ref<OverviewData | null>(null)
  const categories = ref<CategoryData[]>([])
  const years = ref<string[]>([])
  const cities = ref<CityData[]>([])
  const regions = ref<string[]>([])
  const priceRanges = ref<PriceRangeData[]>([])
  const ageGroups = ref<AgeGroupData[]>([])
  const festivals = ref<FestivalData[]>([])
  const importCompare = ref<ImportCompareData[]>([])

  const filters = ref<DashboardFilters>({ ...DEFAULT_FILTERS })
  const anomalySettings = ref<AnomalySettings>({ ...DEFAULT_ANOMALY_SETTINGS })
  const anomalies = ref<AnomalyPoint[]>([])
  const customMetrics = ref<CustomMetricsConfig>({ ...DEFAULT_CUSTOM_METRICS })

  function loadCustomMetrics() {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_METRICS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        customMetrics.value = { ...DEFAULT_CUSTOM_METRICS, ...parsed }
        return true
      }
    } catch (e) {
      console.warn('Failed to load custom metrics', e)
    }
    return false
  }

  function saveCustomMetrics() {
    try {
      localStorage.setItem(STORAGE_CUSTOM_METRICS_KEY, JSON.stringify(customMetrics.value))
    } catch (e) {
      console.warn('Failed to save custom metrics', e)
    }
  }

  function setCustomMetrics(metrics: CustomMetric[]) {
    customMetrics.value.metrics = [...metrics].sort((a, b) => a.order - b.order)
    customMetrics.value.enabled = metrics.length > 0
    saveCustomMetrics()
  }

  function setCustomMetricsEnabled(enabled: boolean) {
    customMetrics.value.enabled = enabled
    saveCustomMetrics()
  }

  function resetCustomMetrics() {
    customMetrics.value = { ...DEFAULT_CUSTOM_METRICS }
    saveCustomMetrics()
  }

  function getMetricValue(metricId: string): string | number {
    const parts = metricId.split('_')
    const category = parts[0]

    try {
      if (category === 'overview' && overview.value) {
        const field = parts.slice(1).join('_') as keyof OverviewData
        const val = overview.value[field]
        if (typeof val === 'number') {
          if (metricId === 'overview_totalMarket') return (val / 10000).toFixed(2)
          if (metricId === 'overview_totalGrowth') return Number(val.toFixed(1))
          if (metricId === 'overview_craftBeerIndex') return Number(val.toFixed(1))
          if (metricId === 'overview_categoryCount') return val
        }
        if (Array.isArray(val)) {
          return (val as string[]).join(' · ')
        }
        return val ?? '-'
      }

      if (category === 'category') {
        const catNameMap: Record<string, string> = {
          baijiu: '白酒',
          beer: '啤酒',
          wine: '红酒',
          huangjiu: '黄酒',
          craftBeer: '精酿啤酒',
          whiskey: '威士忌'
        }
        const catKey = parts[1]
        const field = parts[2]
        const catName = catNameMap[catKey]
        const cat = filteredCategories.value.find(c => c.name === catName)
        if (cat) {
          if (field === 'share') return Number(cat.share.toFixed(1))
          if (field === 'growth' && cat.growth.length > 0) {
            return Number(cat.growth[cat.growth.length - 1].toFixed(1))
          }
        }
        return '-'
      }

      if (category === 'region') {
        const cities = filteredCities.value
        if (parts[1] === 'avgCraftIndex' && cities.length > 0) {
          const avg = cities.reduce((s, c) => s + c.craftIndex, 0) / cities.length
          return Number(avg.toFixed(1))
        }
        if (parts[1] === 'topCraftCity' && cities.length > 0) {
          const sorted = [...cities].sort((a, b) => b.craftIndex - a.craftIndex)
          return sorted[0].city
        }
        if (parts[1] === 'cityCount') return cities.length
        return '-'
      }

      if (category === 'age') {
        const ageGroup = parts[1]
        const catKey = parts[2]
        const ageMap: Record<string, string> = {
          '18-25': '18-25岁',
          '26-30': '26-30岁',
          '31-40': '31-40岁',
          '41-50': '41-50岁',
          '51+': '51岁以上'
        }
        const group = filteredAgeGroups.value.find(g => g.ageGroup === ageMap[ageGroup])
        if (group) {
          const val = (group as any)[catKey]
          return typeof val === 'number' ? Number(val.toFixed(1)) : '-'
        }
        return '-'
      }

      if (category === 'price') {
        const rangeMap: Record<string, string> = {
          low: '百元以下',
          mid: '100-300元',
          high: '300-800元',
          premium: '800-2000元',
          luxury: '2000元以上'
        }
        const priceKey = parts[1]
        const field = parts[2]
        const range = filteredPriceRanges.value.find(p => p.range.includes(rangeMap[priceKey]))
        if (range) {
          if (field === 'share') return Number(range.share.toFixed(1))
          if (field === 'trend' && range.trend.length > 0) {
            const last = range.trend[range.trend.length - 1]
            const prev = range.trend[range.trend.length - 2]
            if (prev !== undefined) return Number((last - prev).toFixed(1))
            return Number(last.toFixed(1))
          }
        }
        return '-'
      }

      if (category === 'festival') {
        const festivalMap: Record<string, string> = {
          springFestival: '春节',
          valentines: '情人节',
          midAutumn: '中秋',
          christmas: '圣诞节',
          newYear: '元旦',
          qingming: '清明'
        }
        const catMap: Record<string, string> = {
          baijiu: '白酒',
          wine: '红酒',
          highEnd: '高端酒',
          sparkling: '香槟/起泡酒',
          beer: '啤酒',
          huangjiu: '黄酒'
        }
        const festKey = parts[1]
        const catKey = parts[2]
        const fest = filteredFestivals.value.find(f => f.festival === festivalMap[festKey])
        if (fest) {
          if (catKey === 'highEnd') {
            const avg = fest.data.reduce((s, d) => s + d.highEndRatio, 0) / fest.data.length
            return Number(avg.toFixed(1))
          }
          const item = fest.data.find(d => d.category === catMap[catKey])
          if (item) return Number(item.salesMultiple.toFixed(1))
        }
        return '-'
      }
    } catch (e) {
      console.warn('Error getting metric value:', metricId, e)
    }
    return '-'
  }

  function getMetricTrend(metricId: string): number | undefined {
    const parts = metricId.split('_')
    const category = parts[0]

    try {
      if (category === 'overview' && overview.value) {
        if (metricId === 'overview_totalGrowth') return overview.value.totalGrowth
        if (metricId === 'overview_craftBeerIndex') {
          const whiskeyCat = categories.value.find(c => c.name === '威士忌')
          if (whiskeyCat && whiskeyCat.growth.length > 0) {
            return Number(whiskeyCat.growth[whiskeyCat.growth.length - 1].toFixed(1))
          }
        }
      }
      if (category === 'category') {
        const field = parts[2]
        if (field === 'growth') return undefined
        const catNameMap: Record<string, string> = {
          baijiu: '白酒', beer: '啤酒', wine: '红酒',
          huangjiu: '黄酒', craftBeer: '精酿啤酒', whiskey: '威士忌'
        }
        const catKey = parts[1]
        const catName = catNameMap[catKey]
        const cat = categories.value.find(c => c.name === catName)
        if (cat && cat.growth.length > 0) {
          return Number(cat.growth[cat.growth.length - 1].toFixed(1))
        }
      }
      if (category === 'price' && parts[2] === 'trend') {
        const rangeMap: Record<string, string> = {
          low: '百元以下', mid: '100-300元', high: '300-800元',
          premium: '800-2000元', luxury: '2000元以上'
        }
        const priceKey = parts[1]
        const range = priceRanges.value.find(p => p.range.includes(rangeMap[priceKey]))
        if (range && range.trend.length >= 2) {
          const last = range.trend[range.trend.length - 1]
          const prev = range.trend[range.trend.length - 2]
          return Number(((last - prev) / prev * 100).toFixed(1))
        }
      }
    } catch (e) {
      console.warn('Error getting metric trend:', metricId, e)
    }
    return undefined
  }

  function loadAnomalySettings() {
    try {
      const saved = localStorage.getItem(STORAGE_ANOMALY_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        anomalySettings.value = { ...DEFAULT_ANOMALY_SETTINGS, ...parsed }
        return true
      }
    } catch (e) {
      console.warn('Failed to load anomaly settings', e)
    }
    return false
  }

  function saveAnomalySettings() {
    try {
      localStorage.setItem(STORAGE_ANOMALY_KEY, JSON.stringify(anomalySettings.value))
    } catch (e) {
      console.warn('Failed to save anomaly settings', e)
    }
  }

  watch(anomalySettings, () => {
    saveAnomalySettings()
    if (anomalySettings.value.enabled) {
      runAnomalyDetection()
    } else {
      anomalies.value = []
    }
  }, { deep: true })

  function setAnomalyThreshold(pct: number) {
    anomalySettings.value.thresholdPct = Math.max(1, Math.min(100, pct))
  }

  function setAnomalyEnabled(enabled: boolean) {
    anomalySettings.value.enabled = enabled
  }

  function setHighlightMarks(highlight: boolean) {
    anomalySettings.value.highlightMarks = highlight
  }

  function makeAnomaly(
    id: string,
    module: string,
    moduleLabel: string,
    metric: string,
    entity: string,
    index: number,
    timePoint: string,
    previous: number,
    current: number,
    threshold: number
  ): AnomalyPoint | null {
    const denom = Math.abs(previous) < 1e-9 ? 1e-9 : Math.abs(previous)
    const changePct = ((current - previous) / denom) * 100
    if (Math.abs(changePct) < threshold) return null
    const direction = changePct > 0 ? '上升' : '下降'
    const severity: AnomalySeverity = Math.abs(changePct) >= threshold * 2 ? 'critical' : 'warning'
    const message = `${entity}·${metric} 在 ${timePoint} 较上一期${direction} ${changePct.toFixed(1)}%，超过阈值 ${threshold}%`
    return {
      id,
      module,
      moduleLabel,
      metric,
      entity,
      index,
      timePoint,
      previous,
      current,
      changePct,
      threshold,
      severity,
      message
    }
  }

  function detectTimeSeriesAnomalies(
    series: number[],
    years: string[],
    module: string,
    moduleLabel: string,
    metric: string,
    entity: string,
    threshold: number,
    idPrefix: string
  ): AnomalyPoint[] {
    const result: AnomalyPoint[] = []
    if (!series || series.length < 2) return result
    for (let i = 1; i < series.length; i++) {
      const a = makeAnomaly(
        `${idPrefix}-${i}`,
        module,
        moduleLabel,
        metric,
        entity,
        i,
        years[i] || `${i}`,
        series[i - 1],
        series[i],
        threshold
      )
      if (a) result.push(a)
    }
    return result
  }

  function makeCrossSectionalAnomaly(
    id: string,
    module: string,
    moduleLabel: string,
    metric: string,
    entity: string,
    index: number,
    groupLabel: string,
    baseline: number,
    current: number,
    threshold: number
  ): AnomalyPoint | null {
    const denom = Math.abs(baseline) < 1e-9 ? 1e-9 : Math.abs(baseline)
    const deviationPct = ((current - baseline) / denom) * 100
    if (Math.abs(deviationPct) < threshold) return null
    const direction = deviationPct > 0 ? '偏高' : '偏低'
    const severity: AnomalySeverity = Math.abs(deviationPct) >= threshold * 2 ? 'critical' : 'warning'
    const message = `${entity}·${metric} 较区域均值${direction} ${deviationPct.toFixed(1)}%，超过阈值 ${threshold}%`
    return {
      id,
      module,
      moduleLabel,
      metric,
      entity,
      index,
      timePoint: groupLabel,
      previous: baseline,
      current,
      changePct: deviationPct,
      threshold,
      severity,
      message
    }
  }

  function detectCrossSectionalAnomalies(
    cities: CityData[],
    threshold: number
  ): AnomalyPoint[] {
    const result: AnomalyPoint[] = []
    if (!cities || cities.length < 2) return result

    const metrics = [
      { key: 'baijiu', label: '白酒占比' },
      { key: 'beer', label: '啤酒占比' },
      { key: 'craftBeer', label: '精酿啤酒占比' },
      { key: 'wine', label: '红酒占比' },
      { key: 'huangjiu', label: '黄酒占比' },
      { key: 'whiskey', label: '威士忌占比' },
      { key: 'craftIndex', label: '精酿指数' }
    ] as const

    metrics.forEach(metric => {
      const values = cities.map(c => (c as any)[metric.key] as number)
      const mean = values.reduce((a, b) => a + b, 0) / values.length

      cities.forEach((city, ci) => {
        const value = (city as any)[metric.key] as number
        const anomaly = makeCrossSectionalAnomaly(
          `region-${metric.key}-${ci}`,
          'region',
          '区域消费偏好',
          metric.label,
          city.city,
          ci,
          city.region,
          mean,
          value,
          threshold
        )
        if (anomaly) result.push(anomaly)
      })
    })

    return result
  }

  function runAnomalyDetection() {
    anomalies.value = []
    if (!anomalySettings.value.enabled) return
    const threshold = anomalySettings.value.thresholdPct
    const list: AnomalyPoint[] = []
    const yearList = filteredYears.value.length > 0 ? filteredYears.value : years.value

    // 1. 品类增速（使用筛选后数据）
    filteredCategories.value.forEach((c, ci) => {
      list.push(
        ...detectTimeSeriesAnomalies(
          c.growth,
          yearList,
          'category',
          '品类结构',
          '增速',
          c.name,
          threshold,
          `cat-growth-${ci}`
        )
      )
    })

    // 2. 价格带份额趋势（使用筛选后数据）
    if (showPriceModule.value) {
      filteredPriceRanges.value.forEach((p, pi) => {
        list.push(
          ...detectTimeSeriesAnomalies(
            p.trend,
            yearList,
            'price',
            '白酒价格带',
            '份额',
            p.range,
            threshold,
            `price-trend-${pi}`
          )
        )
      })
    }

    // 3. 进口/国产对比（使用筛选后数据）
    const importMetrics = [
      { key: 'importWineShare', label: '进口红酒份额' },
      { key: 'domesticWineShare', label: '国产红酒份额' },
      { key: 'importWhiskeyShare', label: '进口威士忌份额' },
      { key: 'domesticWhiskeyShare', label: '国产威士忌份额' },
      { key: 'tariffRate', label: '关税率' }
    ] as const
    importMetrics.forEach(metric => {
      const series = filteredImportCompare.value.map(row => (row as any)[metric.key] as number)
      const timePoints = filteredImportCompare.value.map(row => row.year)
      list.push(
        ...detectTimeSeriesAnomalies(
          series,
          timePoints,
          'import',
          '进口与国产对比',
          metric.label,
          metric.label,
          threshold,
          `import-${metric.key}`
        )
      )
    })

    // 4. 区域消费偏好（截面数据偏离均值检测，使用雷达图实际展示的城市）
    list.push(
      ...detectCrossSectionalAnomalies(radarCities.value, threshold)
    )

    anomalies.value = list
  }

  function saveFiltersToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters.value))
    } catch (e) {
      console.warn('Failed to save filters to localStorage', e)
    }
  }

  function loadFiltersFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        const clean = sanitizeFilters({ ...DEFAULT_FILTERS, ...parsed }, regions.value.length > 0 ? regions.value : undefined, categories.value.length > 0 ? categories.value.map(c => c.name) : undefined)
        filters.value = clean
        return true
      }
    } catch (e) {
      console.warn('Failed to load filters from localStorage', e)
    }
    return false
  }

  let isSyncing = false
  let routerRef: Router | null = null
  let routeRef: RouteLocationNormalizedLoaded | null = null

  watch(filters, () => {
    if (isSyncing) return
    saveFiltersToStorage()
    if (routerRef && routeRef) {
      const query = buildFilterQuery(filters.value)
      routerRef.replace({ path: routeRef.path, query }).catch(() => {})
    }
    runAnomalyDetection()
  }, { deep: true })

  function setRouter(router: Router, route: RouteLocationNormalizedLoaded) {
    routerRef = router
    routeRef = route
  }

  function initFilters(route: RouteLocationNormalizedLoaded) {
    isSyncing = true
    try {
      loadAnomalySettings()
      const fromUrl = parseFilterQuery(
        route.query as Record<string, any>,
        filters.value,
        undefined,
        undefined
      )
      if (!fromUrl) {
        loadFiltersFromStorage()
      }
    } finally {
      setTimeout(() => {
        isSyncing = false
        if (routerRef && routeRef) {
          const query = buildFilterQuery(filters.value)
          routerRef.replace({ path: routeRef.path, query }).catch(() => {})
        }
      }, 100)
    }
  }

  function getShareUrl(path: string): string {
    return buildShareUrl(filters.value, path)
  }

  const anomalyCount = computed(() => anomalies.value.length)
  const criticalAnomalyCount = computed(() => anomalies.value.filter(a => a.severity === 'critical').length)

  const categoryGrowthAnomalies = computed(() => anomalies.value.filter(a => a.module === 'category'))
  const priceTrendAnomalies = computed(() => anomalies.value.filter(a => a.module === 'price'))
  const importCompareAnomalies = computed(() => anomalies.value.filter(a => a.module === 'import'))
  const regionAnomalies = computed(() => anomalies.value.filter(a => a.module === 'region'))

  function getCategoryAnomaliesByName(name: string): AnomalyPoint[] {
    return anomalies.value.filter(a => a.module === 'category' && a.entity === name)
  }

  function getPriceAnomaliesByRange(range: string): AnomalyPoint[] {
    return anomalies.value.filter(a => a.module === 'price' && a.entity === range)
  }

  function getImportAnomaliesByMetric(metric: string): AnomalyPoint[] {
    return anomalies.value.filter(a => a.module === 'import' && a.metric === metric)
  }

  function getRegionAnomaliesByCity(city: string): AnomalyPoint[] {
    return anomalies.value.filter(a => a.module === 'region' && a.entity === city)
  }

  function getRegionAnomaliesByCityAndMetric(city: string, metricKey: string): AnomalyPoint | undefined {
    return anomalies.value.find(a => a.module === 'region' && a.entity === city && a.metric === metricKey)
  }

  const filteredYears = computed(() => {
    const [start, end] = filters.value.yearRange
    return years.value.filter(y => {
      const year = parseInt(y)
      return year >= start && year <= end
    })
  })

  const filteredYearIndices = computed(() => {
    if (years.value.length === 0 || filteredYears.value.length === 0) return []
    return filteredYears.value.map(y => years.value.indexOf(y)).filter(i => i >= 0)
  })

  const filteredCategories = computed(() => {
    if (filters.value.selectedCategories.length === 0) {
      const indices = filteredYearIndices.value
      if (indices.length === 0) return categories.value
      return categories.value.map(c => {
        const filteredGrowth = indices.map(i => c.growth[i]).filter(v => v !== undefined)
        return { ...c, growth: filteredGrowth }
      })
    }
    const indices = filteredYearIndices.value
    return categories.value
      .filter(c => filters.value.selectedCategories.includes(c.name))
      .map(c => {
        const filteredGrowth = indices.length > 0
          ? indices.map(i => c.growth[i]).filter(v => v !== undefined)
          : c.growth
        return { ...c, growth: filteredGrowth }
      })
  })

  const filteredCities = computed(() => {
    if (!filters.value.selectedRegion || filters.value.selectedRegion === 'all') return cities.value
    return cities.value.filter(c => c.region === filters.value.selectedRegion)
  })

  const radarCities = computed(() => {
    if (!filters.value.selectedRegion || filters.value.selectedRegion === 'all') {
      const REP = ['哈尔滨', '上海', '深圳', '成都', '北京']
      return cities.value.filter(c => REP.includes(c.city))
    }
    return filteredCities.value
  })

  const showPriceModule = computed(() => {
    if (filters.value.selectedCategories.length === 0) return true
    return filters.value.selectedCategories.includes('白酒')
  })

  const filteredPriceRanges = computed(() => {
    const indices = filteredYearIndices.value
    if (indices.length === 0) return priceRanges.value
    return priceRanges.value.map(p => ({
      ...p,
      trend: indices.map(i => p.trend[i]).filter(v => v !== undefined)
    }))
  })

  const filteredImportCompare = computed(() => {
    const [start, end] = filters.value.yearRange
    return importCompare.value.filter(d => {
      const y = parseInt(d.year)
      return y >= start && y <= end
    })
  })

  const filteredFestivals = computed(() => {
    if (filters.value.selectedCategories.length === 0) return festivals.value
    const selected = filters.value.selectedCategories
    const mapCategory: Record<string, string> = {
      '白酒': '白酒',
      '红酒': '红酒',
      '啤酒': '啤酒',
      '威士忌': '威士忌',
      '果酒清酒': '香槟/起泡酒',
      '黄酒': '白酒',
      '精酿啤酒': '啤酒'
    }
    const allowedCategories = new Set<string>()
    selected.forEach(s => {
      const mapped = mapCategory[s]
      if (mapped) allowedCategories.add(mapped)
      allowedCategories.add(s)
    })
    return festivals.value.map(f => ({
      ...f,
      data: f.data.filter(d => allowedCategories.has(d.category))
    })).filter(f => f.data.length > 0)
  })

  const filteredAgeGroups = computed(() => {
    if (filters.value.selectedCategories.length === 0) return ageGroups.value
    const selected = filters.value.selectedCategories
    const mapCategory: Record<string, string> = {
      '白酒': 'baijiu',
      '啤酒': 'beer',
      '精酿啤酒': 'craftBeer',
      '红酒': 'wine',
      '果酒清酒': 'sparkling',
      '黄酒': 'huangjiu',
      '威士忌': 'whiskey'
    }
    const keepKeys = new Set(selected.map(s => mapCategory[s]).filter(Boolean))
    return ageGroups.value.map(g => {
      const result: any = { ageGroup: g.ageGroup }
      let total = 0
      keepKeys.forEach(k => {
        const v = (g as any)[k]
        if (v !== undefined) {
          result[k] = v
          total += v
        }
      })
      result.__total = total
      return result
    })
  })

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      loadCustomMetrics()
      loadAnomalySettings()
      await Promise.all([
        fetchOverview(),
        fetchCategory(),
        fetchRegion(),
        fetchPriceRange(),
        fetchAgeGroup(),
        fetchFestival(),
        fetchImportCompare()
      ])
      runAnomalyDetection()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载数据失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchOverview() {
    const res = await api.getOverview()
    overview.value = res.data
  }

  async function fetchCategory() {
    const res = await api.getCategory()
    categories.value = res.data.categories
    years.value = res.data.years
  }

  async function fetchRegion() {
    const res = await api.getRegion(filters.value.selectedRegion)
    cities.value = res.data.cities
    regions.value = res.data.regions
    runAnomalyDetection()
  }

  async function fetchPriceRange() {
    const res = await api.getPriceRange()
    priceRanges.value = res.data.priceRanges
  }

  async function fetchAgeGroup() {
    const res = await api.getAgeGroup()
    ageGroups.value = res.data.ageGroups
  }

  async function fetchFestival() {
    const res = await api.getFestival()
    festivals.value = res.data.festivals
  }

  async function fetchImportCompare() {
    const res = await api.getImportCompare()
    importCompare.value = res.data.importCompare
  }

  function setRegion(region: string | null) {
    filters.value.selectedRegion = region || 'all'
    fetchRegion()
  }

  function setCategories(cats: string[]) {
    filters.value.selectedCategories = cats
  }

  function setYearRange(range: [number, number]) {
    filters.value.yearRange = range
  }

  return {
    loading,
    error,
    overview,
    categories,
    years,
    cities,
    regions,
    priceRanges,
    ageGroups,
    festivals,
    importCompare,
    filters,
    anomalySettings,
    anomalies,
    customMetrics,
    anomalyCount,
    criticalAnomalyCount,
    categoryGrowthAnomalies,
    priceTrendAnomalies,
    importCompareAnomalies,
    regionAnomalies,
    filteredYears,
    filteredCategories,
    filteredCities,
    radarCities,
    filteredPriceRanges,
    filteredImportCompare,
    filteredFestivals,
    filteredAgeGroups,
    showPriceModule,
    fetchAll,
    setRegion,
    setCategories,
    setYearRange,
    initFilters,
    setRouter,
    getShareUrl,
    saveFiltersToStorage,
    loadFiltersFromStorage,
    runAnomalyDetection,
    setAnomalyThreshold,
    setAnomalyEnabled,
    setHighlightMarks,
    getCategoryAnomaliesByName,
    getPriceAnomaliesByRange,
    getImportAnomaliesByMetric,
    getRegionAnomaliesByCity,
    getRegionAnomaliesByCityAndMetric,
    setCustomMetrics,
    setCustomMetricsEnabled,
    resetCustomMetrics,
    getMetricValue,
    getMetricTrend,
    loadCustomMetrics,
    saveCustomMetrics
  }
})
