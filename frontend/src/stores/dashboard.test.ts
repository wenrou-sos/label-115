import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDashboardStore, DEFAULT_FILTERS } from '@/stores/dashboard'
import type {
  CityData,
  CategoryData,
  PriceRangeData,
  ImportCompareData
} from '@/types'

const ALL_REP_CITIES = ['哈尔滨', '上海', '深圳', '成都', '北京']

function makeCities(): CityData[] {
  return [
    { city: '哈尔滨', region: '东北', baijiu: 78.5, beer: 15.2, craftBeer: 4.2, wine: 3.8, huangjiu: 1.2, whiskey: 2.8, craftIndex: 88.5 },
    { city: '沈阳', region: '东北', baijiu: 75.8, beer: 16.5, craftBeer: 4.8, wine: 4.2, huangjiu: 1.5, whiskey: 3.2, craftIndex: 92.3 },
    { city: '上海', region: '华东沿海', baijiu: 48.2, beer: 18.5, craftBeer: 12.8, wine: 35.6, huangjiu: 2.8, whiskey: 12.5, craftIndex: 118.6 },
    { city: '深圳', region: '华南沿海', baijiu: 45.6, beer: 20.2, craftBeer: 14.5, wine: 38.2, huangjiu: 1.2, whiskey: 15.8, craftIndex: 125.2 },
    { city: '广州', region: '华南沿海', baijiu: 48.8, beer: 22.5, craftBeer: 11.2, wine: 32.5, huangjiu: 1.8, whiskey: 12.2, craftIndex: 112.8 },
    { city: '成都', region: '西南', baijiu: 62.5, beer: 15.8, craftBeer: 18.6, wine: 12.5, huangjiu: 1.5, whiskey: 8.5, craftIndex: 135.8 },
    { city: '重庆', region: '西南', baijiu: 65.2, beer: 18.2, craftBeer: 16.8, wine: 10.8, huangjiu: 1.2, whiskey: 7.2, craftIndex: 128.5 },
    { city: '北京', region: '华北', baijiu: 55.8, beer: 16.5, craftBeer: 10.5, wine: 22.5, huangjiu: 2.2, whiskey: 9.8, craftIndex: 108.5 },
    { city: '杭州', region: '华东沿海', baijiu: 50.2, beer: 17.2, craftBeer: 13.8, wine: 28.5, huangjiu: 3.2, whiskey: 10.5, craftIndex: 118.2 },
    { city: '武汉', region: '华中', baijiu: 58.5, beer: 20.5, craftBeer: 8.2, wine: 15.2, huangjiu: 2.2, whiskey: 6.8, craftIndex: 98.5 },
    { city: '西安', region: '西北', baijiu: 62.8, beer: 18.5, craftBeer: 6.5, wine: 12.2, huangjiu: 1.8, whiskey: 5.2, craftIndex: 92.8 },
    { city: '长沙', region: '华中', baijiu: 60.2, beer: 19.8, craftBeer: 8.8, wine: 13.5, huangjiu: 1.5, whiskey: 6.2, craftIndex: 102.5 }
  ]
}

function makeCategories(): CategoryData[] {
  return [
    { name: '白酒', marketSize: 7800, share: 62.5, growth: [8.2, 7.5, 6.8, 5.5, 4.3], color: '#8B0000' },
    { name: '啤酒', marketSize: 2200, share: 17.6, growth: [3.5, 3.2, 2.8, 2.5, 2.1], color: '#F4A460' },
    { name: '红酒', marketSize: 980, share: 7.8, growth: [2.1, 1.5, 0.8, 1.2, 2.5], color: '#B22222' },
    { name: '果酒清酒', marketSize: 540, share: 4.3, growth: [12.5, 15.2, 18.8, 22.1, 25.6], color: '#FF69B4' },
    { name: '威士忌', marketSize: 650, share: 5.2, growth: [18.5, 20.3, 22.8, 25.4, 28.1], color: '#CD853F' }
  ]
}

function makePriceRanges(): PriceRangeData[] {
  return [
    { range: '百元以下', share: 18.5, trend: [25.2, 23.5, 21.8, 20.2, 18.5] },
    { range: '100-300元', share: 28.2, trend: [26.5, 27.2, 27.8, 28.0, 28.2] },
    { range: '300-800元', share: 25.8, trend: [22.5, 23.8, 24.5, 25.2, 25.8] },
    { range: '800-2000元', share: 18.5, trend: [14.2, 15.5, 16.8, 17.8, 18.5] },
    { range: '2000元以上', share: 9.0, trend: [6.8, 7.5, 8.2, 8.8, 9.0] }
  ]
}

function makeImportCompare(): ImportCompareData[] {
  return [
    { year: '2021', importWineShare: 38.5, domesticWineShare: 61.5, importWhiskeyShare: 72.5, domesticWhiskeyShare: 27.5, tariffRate: 14.0 },
    { year: '2022', importWineShare: 35.2, domesticWineShare: 64.8, importWhiskeyShare: 70.2, domesticWhiskeyShare: 29.8, tariffRate: 14.0 },
    { year: '2023', importWineShare: 32.8, domesticWineShare: 67.2, importWhiskeyShare: 67.8, domesticWhiskeyShare: 32.2, tariffRate: 12.0 },
    { year: '2024', importWineShare: 30.5, domesticWineShare: 69.5, importWhiskeyShare: 65.2, domesticWhiskeyShare: 34.8, tariffRate: 10.0 },
    { year: '2025', importWineShare: 28.2, domesticWineShare: 71.8, importWhiskeyShare: 62.5, domesticWhiskeyShare: 37.5, tariffRate: 8.0 }
  ]
}

function setupStore() {
  setActivePinia(createPinia())
  const store = useDashboardStore()
  store.years = ['2021', '2022', '2023', '2024', '2025']
  store.cities = makeCities()
  store.regions = ['东北', '华东沿海', '华南沿海', '西南', '华北', '华中', '西北']
  store.categories = makeCategories()
  store.priceRanges = makePriceRanges()
  store.importCompare = makeImportCompare()
  store.anomalySettings = { enabled: true, thresholdPct: 15, highlightMarks: true }
  store.filters = { ...DEFAULT_FILTERS }
  return store
}

describe('异常检测链路测试', () => {
  beforeEach(() => {
    // 重置 localStorage mock
  })

  describe('区域异常检测：全区域视图 vs 雷达图对齐', () => {
    it('全区域视图下，区域异常只包含雷达图展示的 5 个代表城市', () => {
      const store = setupStore()
      store.filters.selectedRegion = 'all'
      store.runAnomalyDetection()

      const regionAnomalies = store.anomalies.filter(a => a.module === 'region')
      const anomalyCities = [...new Set(regionAnomalies.map(a => a.entity))]

      // 所有异常城市必须是雷达图的代表城市
      anomalyCities.forEach(city => {
        expect(ALL_REP_CITIES).toContain(city)
      })

      // 不应该出现沈阳、广州、重庆、杭州、武汉、西安、长沙这些雷达图外城市
      const nonRepCities = ['沈阳', '广州', '重庆', '杭州', '武汉', '西安', '长沙']
      nonRepCities.forEach(city => {
        expect(anomalyCities).not.toContain(city)
      })
    })

    it('特定区域筛选（如东北）下，区域异常包含该区域全部雷达城市', () => {
      const store = setupStore()
      store.filters.selectedRegion = '东北'
      store.runAnomalyDetection()

      const regionAnomalies = store.anomalies.filter(a => a.module === 'region')
      const anomalyCities = [...new Set(regionAnomalies.map(a => a.entity))]
      const regionCities = store.filteredCities.map(c => c.city)

      // 所有异常城市必须属于东北区域
      anomalyCities.forEach(city => {
        expect(regionCities).toContain(city)
      })
    })

    it('区域异常中的 timePoint 字段记录城市所属区域', () => {
      const store = setupStore()
      store.filters.selectedRegion = 'all'
      store.runAnomalyDetection()

      const regionAnomalies = store.anomalies.filter(a => a.module === 'region')
      regionAnomalies.forEach(a => {
        // timePoint 应该是区域名称
        expect(typeof a.timePoint).toBe('string')
        expect(a.timePoint.length).toBeGreaterThan(0)
      })
    })
  })

  describe('区域截面异常检测算法', () => {
    it('偏离均值未超过阈值的城市指标不产生异常', () => {
      const store = setupStore()
      // 使用非常高的阈值，确保不产生异常
      store.anomalySettings.thresholdPct = 200
      store.filters.selectedRegion = 'all'
      store.runAnomalyDetection()

      const regionAnomalies = store.anomalies.filter(a => a.module === 'region')
      expect(regionAnomalies.length).toBe(0)
    })

    it('偏离均值超过阈值的指标产生异常', () => {
      const store = setupStore()
      // 使用极低阈值，确保大量异常
      store.anomalySettings.thresholdPct = 1
      store.filters.selectedRegion = 'all'
      store.runAnomalyDetection()

      const regionAnomalies = store.anomalies.filter(a => a.module === 'region')
      expect(regionAnomalies.length).toBeGreaterThan(0)

      // 验证每个异常的偏离百分比 >= 阈值
      regionAnomalies.forEach(a => {
        expect(Math.abs(a.changePct)).toBeGreaterThanOrEqual(1)
        // previous 存储的是均值
        expect(a.previous).toBeGreaterThan(0)
        expect(a.current).toBeGreaterThanOrEqual(0)
      })
    })

    it('偏离超过 2 倍阈值标记为 critical 严重级别', () => {
      const store = setupStore()
      store.anomalySettings.thresholdPct = 5
      store.filters.selectedRegion = 'all'
      store.runAnomalyDetection()

      const criticalAnomalies = store.anomalies.filter(
        a => a.module === 'region' && a.severity === 'critical'
      )
      criticalAnomalies.forEach(a => {
        expect(Math.abs(a.changePct)).toBeGreaterThanOrEqual(10) // 2 * threshold
      })

      const warningAnomalies = store.anomalies.filter(
        a => a.module === 'region' && a.severity === 'warning'
      )
      warningAnomalies.forEach(a => {
        expect(Math.abs(a.changePct)).toBeGreaterThanOrEqual(5)
        expect(Math.abs(a.changePct)).toBeLessThan(10)
      })
    })
  })

  describe('时序异常检测与筛选视图对齐', () => {
    it('年份范围筛选后，品类异常只出现在筛选年份内', () => {
      const store = setupStore()
      // 仅筛选 2023-2025 年
      store.filters.yearRange = [2023, 2025]
      store.anomalySettings.thresholdPct = 1
      store.runAnomalyDetection()

      const categoryAnomalies = store.anomalies.filter(a => a.module === 'category')
      const validYears = ['2023', '2024', '2025']
      categoryAnomalies.forEach(a => {
        expect(validYears).toContain(a.timePoint)
      })
    })

    it('品类筛选后，异常只出现在选中品类中', () => {
      const store = setupStore()
      store.filters.selectedCategories = ['白酒', '啤酒']
      store.anomalySettings.thresholdPct = 1
      store.runAnomalyDetection()

      const categoryAnomalies = store.anomalies.filter(a => a.module === 'category')
      const validCategories = ['白酒', '啤酒']
      categoryAnomalies.forEach(a => {
        expect(validCategories).toContain(a.entity)
      })

      // 红酒、果酒清酒、威士忌不应该出现
      const excludedCategories = ['红酒', '果酒清酒', '威士忌']
      const anomalyEntities = [...new Set(categoryAnomalies.map(a => a.entity))]
      excludedCategories.forEach(cat => {
        expect(anomalyEntities).not.toContain(cat)
      })
    })

    it('年份筛选后，进口对比异常只出现在筛选年份内', () => {
      const store = setupStore()
      store.filters.yearRange = [2024, 2025]
      store.anomalySettings.thresholdPct = 1
      store.runAnomalyDetection()

      const importAnomalies = store.anomalies.filter(a => a.module === 'import')
      const validYears = ['2024', '2025']
      importAnomalies.forEach(a => {
        expect(validYears).toContain(a.timePoint)
      })
    })
  })

  describe('异常检测开关与总计数', () => {
    it('异常检测关闭时 anomalies 为空数组', () => {
      const store = setupStore()
      store.anomalySettings.enabled = false
      store.anomalySettings.thresholdPct = 1
      store.runAnomalyDetection()

      expect(store.anomalies.length).toBe(0)
      expect(store.anomalyCount).toBe(0)
      expect(store.criticalAnomalyCount).toBe(0)
    })

    it('critical 异常计数与 anomalyCount 匹配', () => {
      const store = setupStore()
      store.anomalySettings.thresholdPct = 5
      store.runAnomalyDetection()

      const criticalCount = store.anomalies.filter(a => a.severity === 'critical').length
      expect(store.criticalAnomalyCount).toBe(criticalCount)
      expect(store.anomalyCount).toBe(store.anomalies.length)
    })
  })

  describe('筛选变化联动异常检测', () => {
    it('切换区域筛选后，区域异常城市集合发生变化', () => {
      const store = setupStore()
      store.anomalySettings.thresholdPct = 1

      // 全区域视图
      store.filters.selectedRegion = 'all'
      store.runAnomalyDetection()
      const allViewCities = new Set(
        store.anomalies.filter(a => a.module === 'region').map(a => a.entity)
      )

      // 切换到东北区域
      store.filters.selectedRegion = '东北'
      store.runAnomalyDetection()
      const neCities = new Set(
        store.anomalies.filter(a => a.module === 'region').map(a => a.entity)
      )

      // 切换到西南区域
      store.filters.selectedRegion = '西南'
      store.runAnomalyDetection()
      const swCities = new Set(
        store.anomalies.filter(a => a.module === 'region').map(a => a.entity)
      )

      // 东北区域视图中不应该出现上海、深圳等非东北城市
      ;['上海', '深圳', '成都', '北京'].forEach(city => {
        expect(neCities.has(city)).toBe(false)
      })

      // 西南区域视图中只可能出现成都、重庆
      const validSW = ['成都', '重庆']
      swCities.forEach(city => {
        expect(validSW).toContain(city)
      })

      // 全区域、东北、西南的异常城市集合应该不相同
      expect(allViewCities).not.toEqual(neCities)
      expect(neCities).not.toEqual(swCities)
    })

    it('年份筛选从全量缩小到两年，异常数量相应减少', () => {
      const store = setupStore()
      store.anomalySettings.thresholdPct = 1

      // 全量年份
      store.filters.yearRange = [2021, 2025]
      store.runAnomalyDetection()
      const totalFull = store.anomalies.length
      const categoryFull = store.anomalies.filter(a => a.module === 'category').length

      // 缩小到 2024-2025
      store.filters.yearRange = [2024, 2025]
      store.runAnomalyDetection()
      const totalNarrow = store.anomalies.length
      const categoryNarrow = store.anomalies.filter(a => a.module === 'category').length

      // 时序异常（品类+价格带+进口）在缩小年份范围后应该减少或相等
      expect(categoryNarrow).toBeLessThanOrEqual(categoryFull)
      expect(totalNarrow).toBeLessThanOrEqual(totalFull)
    })
  })

  describe('区域异常 getter 函数', () => {
    it('getRegionAnomaliesByCity 返回该城市所有区域异常', () => {
      const store = setupStore()
      store.anomalySettings.thresholdPct = 1
      store.runAnomalyDetection()

      // 以哈尔滨为例
      const anomalies = store.getRegionAnomaliesByCity('哈尔滨')
      if (anomalies.length > 0) {
        anomalies.forEach(a => {
          expect(a.entity).toBe('哈尔滨')
          expect(a.module).toBe('region')
        })
      }

      // 不存在的城市返回空数组
      expect(store.getRegionAnomaliesByCity('不存在的城市').length).toBe(0)
    })

    it('regionAnomalies 计算属性仅返回 module === region 的异常', () => {
      const store = setupStore()
      store.anomalySettings.thresholdPct = 1
      store.runAnomalyDetection()

      store.regionAnomalies.forEach(a => {
        expect(a.module).toBe('region')
      })

      expect(store.regionAnomalies.length).toBe(
        store.anomalies.filter(a => a.module === 'region').length
      )
    })
  })

  describe('模块完整链路：区域筛选 -> 数据 -> 异常一致性', () => {
    it('全链路：全区域视图下，异常通知的城市集合与雷达图展示城市完全对齐', () => {
      const store = setupStore()
      store.anomalySettings.thresholdPct = 1
      store.filters.selectedRegion = 'all'
      store.runAnomalyDetection()

      const radarCitySet = new Set(store.radarCities.map(c => c.city))
      const regionAnomalyCitySet = new Set(
        store.anomalies.filter(a => a.module === 'region').map(a => a.entity)
      )

      // 验证：所有出现异常的城市都必须在雷达图展示集合内
      regionAnomalyCitySet.forEach(city => {
        expect(radarCitySet.has(city)).toBe(true)
      })

      // 验证：雷达图外的城市绝对不在异常列表内
      const outsideRadarCities = store.cities
        .map(c => c.city)
        .filter(c => !radarCitySet.has(c))

      outsideRadarCities.forEach(city => {
        expect(regionAnomalyCitySet.has(city)).toBe(false)
      })
    })
  })
})
