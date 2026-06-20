import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
import { api } from '@/api'

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

  const filters = ref<DashboardFilters>({
    yearRange: [2021, 2025],
    selectedCategories: [],
    selectedRegion: 'all'
  })

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
    setYearRange
  }
})
