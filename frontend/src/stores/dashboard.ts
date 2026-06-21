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
  DashboardFilters
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
export const DEFAULT_FILTERS: DashboardFilters = {
  yearRange: [2021, 2025],
  selectedCategories: [],
  selectedRegion: 'all'
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
  }, { deep: true })

  function setRouter(router: Router, route: RouteLocationNormalizedLoaded) {
    routerRef = router
    routeRef = route
  }

  function initFilters(route: RouteLocationNormalizedLoaded) {
    isSyncing = true
    try {
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
    loadFiltersFromStorage
  }
})
