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

  const filteredCategories = computed(() => {
    if (filters.value.selectedCategories.length === 0) return categories.value
    return categories.value.filter(c =>
      filters.value.selectedCategories.includes(c.name)
    )
  })

  const filteredCities = computed(() => {
    if (filters.value.selectedRegion === 'all') return cities.value
    return cities.value.filter(c => c.region === filters.value.selectedRegion)
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

  function setRegion(region: string) {
    filters.value.selectedRegion = region
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
    filteredCategories,
    filteredCities,
    fetchAll,
    setRegion,
    setCategories,
    setYearRange
  }
})
