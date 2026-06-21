export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface OverviewData {
  totalMarket: number
  totalGrowth: number
  categoryCount: number
  highlightCategories: string[]
  craftBeerIndex: number
}

export interface CategoryData {
  name: string
  marketSize: number
  share: number
  growth: number[]
  color: string
}

export interface CategoryResponse {
  categories: CategoryData[]
  years: string[]
}

export interface CityData {
  city: string
  region: string
  baijiu: number
  beer: number
  craftBeer: number
  wine: number
  huangjiu: number
  whiskey: number
  craftIndex: number
}

export interface RegionResponse {
  cities: CityData[]
  regions: string[]
}

export interface PriceRangeData {
  range: string
  share: number
  trend: number[]
}

export interface PriceRangeResponse {
  priceRanges: PriceRangeData[]
  years: string[]
}

export interface AgeGroupData {
  ageGroup: string
  baijiu: number
  beer: number
  craftBeer: number
  wine: number
  sparkling: number
  huangjiu: number
  whiskey: number
}

export interface AgeGroupResponse {
  ageGroups: AgeGroupData[]
}

export interface FestivalItem {
  category: string
  salesMultiple: number
  highEndRatio: number
}

export interface FestivalData {
  festival: string
  data: FestivalItem[]
}

export interface FestivalResponse {
  festivals: FestivalData[]
}

export interface ImportCompareData {
  year: string
  importWineShare: number
  domesticWineShare: number
  importWhiskeyShare: number
  domesticWhiskeyShare: number
  tariffRate: number
}

export interface ImportCompareResponse {
  importCompare: ImportCompareData[]
}

export interface DashboardFilters {
  yearRange: [number, number]
  selectedCategories: string[]
  selectedRegion: string
}

export type AnomalySeverity = 'warning' | 'critical'

export interface AnomalyPoint {
  id: string
  module: string
  moduleLabel: string
  metric: string
  entity: string
  index: number
  timePoint: string
  previous: number
  current: number
  changePct: number
  threshold: number
  severity: AnomalySeverity
  message: string
}

export interface AnomalySettings {
  enabled: boolean
  thresholdPct: number
  highlightMarks: boolean
}

export type AnnotationModule = 'category' | 'region' | 'price' | 'import' | 'age' | 'festival'

export interface AnnotationPoint {
  id: string
  module: AnnotationModule
  moduleLabel: string
  entity: string
  metric: string
  timePoint?: string
  value?: number
  color: string
  content: string
  createdAt: number
  updatedAt: number
}

export type AnnotationCharts = Record<string, AnnotationPoint[]>

