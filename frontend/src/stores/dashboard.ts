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
  AnomalySeverity
} from '@/types'
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

    // 4. 区域消费偏好（截面数据偏离均值检测）
    list.push(
      ...detectCrossSectionalAnomalies(filteredCities.value, threshold)
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
    getRegionAnomaliesByCityAndMetric
  }
})
