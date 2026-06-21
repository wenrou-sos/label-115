import axios from 'axios'
import type {
  ApiResponse,
  OverviewData,
  CategoryResponse,
  RegionResponse,
  PriceRangeResponse,
  AgeGroupResponse,
  FestivalResponse,
  ImportCompareResponse,
  ForecastResponse
} from '@/types'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const api = {
  getOverview(): Promise<ApiResponse<OverviewData>> {
    return request.get('/overview')
  },

  getCategory(): Promise<ApiResponse<CategoryResponse>> {
    return request.get('/category')
  },

  getRegion(region = 'all'): Promise<ApiResponse<RegionResponse>> {
    return request.get('/region', { params: { region } })
  },

  getPriceRange(): Promise<ApiResponse<PriceRangeResponse>> {
    return request.get('/price-range')
  },

  getAgeGroup(): Promise<ApiResponse<AgeGroupResponse>> {
    return request.get('/age-group')
  },

  getFestival(): Promise<ApiResponse<FestivalResponse>> {
    return request.get('/festival')
  },

  getImportCompare(): Promise<ApiResponse<ImportCompareResponse>> {
    return request.get('/import-compare')
  },

  getForecast(params: {
    module: 'category' | 'festival' | string
    entity?: string
    metric?: string
    steps?: number
  }): Promise<ApiResponse<ForecastResponse>> {
    return request.get('/forecast', { params })
  }
}
