import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAnnotations } from '@/composables/useAnnotations'
import type { AnnotationModule, AnnotationPoint } from '@/types'

const STORAGE_KEY = 'liquor-dashboard-annotations'

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
}

function readStorage(): AnnotationPoint[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}

function writeStorage(data: AnnotationPoint[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

describe('useAnnotations - 标注功能完整链路测试', () => {
  beforeEach(() => {
    clearStorage()
  })

  describe('基础 CRUD 功能', () => {
    it('初始状态下 annotations 为空数组，count 为 0', () => {
      const { annotations, count } = useAnnotations()
      expect(Array.isArray(annotations.value)).toBe(true)
      expect(annotations.value.length).toBe(0)
      expect(count.value).toBe(0)
    })

    it('addAnnotation: 添加标注后能正确存储到内存', () => {
      const { annotations, addAnnotation, count } = useAnnotations()

      const record = addAnnotation({
        module: 'category',
        entity: '白酒',
        metric: '市场份额',
        color: '#8B0000',
        content: '春节效应显著，销量拉升明显'
      })

      expect(record.id).toBeDefined()
      expect(record.module).toBe('category')
      expect(record.moduleLabel).toBe('品类结构')
      expect(record.entity).toBe('白酒')
      expect(record.metric).toBe('市场份额')
      expect(record.content).toBe('春节效应显著，销量拉升明显')
      expect(record.color).toBe('#8B0000')
      expect(typeof record.createdAt).toBe('number')
      expect(record.updatedAt).toBe(record.createdAt)
      expect(annotations.value.length).toBe(1)
      expect(count.value).toBe(1)
    })

    it('addAnnotation: 自动生成 moduleLabel 映射正确', () => {
      const { addAnnotation } = useAnnotations()
      const expected: Record<AnnotationModule, string> = {
        category: '品类结构',
        region: '区域消费偏好',
        price: '白酒价格带',
        import: '进口与国产对比',
        age: '年龄段偏好',
        festival: '节日消费'
      }

      Object.entries(expected).forEach(([mod, label]) => {
        const r = addAnnotation({
          module: mod as AnnotationModule,
          entity: 'test',
          metric: 'test',
          color: '#fff',
          content: 'test'
        })
        expect(r.moduleLabel).toBe(label)
      })
    })

    it('updateAnnotation: 更新已存在标注的内容', () => {
      const { addAnnotation, updateAnnotation, annotations } = useAnnotations()

      const record = addAnnotation({
        module: 'region',
        entity: '成都',
        metric: '精酿啤酒占比',
        color: '#CD853F',
        content: '初步观察'
      })
      const oldUpdated = record.updatedAt

      vi.useFakeTimers().setSystemTime(oldUpdated + 1000)

      const ok = updateAnnotation(record.id, '成渝经济带表现亮眼，精酿渗透率最高')
      expect(ok).toBe(true)

      const found = annotations.value.find(a => a.id === record.id)
      expect(found?.content).toBe('成渝经济带表现亮眼，精酿渗透率最高')
      expect(found?.updatedAt).toBeGreaterThan(oldUpdated)

      vi.useRealTimers()
    })

    it('updateAnnotation: 更新不存在的 id 返回 false', () => {
      const { updateAnnotation } = useAnnotations()
      expect(updateAnnotation('non-existent-id', '内容')).toBe(false)
    })

    it('deleteAnnotation: 删除已存在标注', () => {
      const { addAnnotation, deleteAnnotation, count } = useAnnotations()
      const r = addAnnotation({
        module: 'price',
        entity: '2000元以上',
        metric: '份额趋势',
        color: '#D4AF37',
        content: '高端化趋势'
      })
      expect(count.value).toBe(1)
      expect(deleteAnnotation(r.id)).toBe(true)
      expect(count.value).toBe(0)
    })

    it('deleteAnnotation: 删除不存在的 id 返回 false', () => {
      const { deleteAnnotation } = useAnnotations()
      expect(deleteAnnotation('no-such-id')).toBe(false)
    })

    it('clearAll: 清空所有标注', () => {
      const { addAnnotation, clearAll, count, annotations } = useAnnotations()
      addAnnotation({ module: 'category', entity: 'A', metric: 'm', color: '#f00', content: 'c1' })
      addAnnotation({ module: 'region', entity: 'B', metric: 'm', color: '#0f0', content: 'c2' })
      addAnnotation({ module: 'import', entity: 'C', metric: 'm', color: '#00f', content: 'c3' })
      expect(count.value).toBe(3)

      clearAll()
      expect(annotations.value.length).toBe(0)
      expect(count.value).toBe(0)
    })

    it('clearByModule: 只清空指定模块标注', () => {
      const { addAnnotation, clearByModule, count, getAnnotationsByModule } = useAnnotations()
      addAnnotation({ module: 'category', entity: 'A', metric: 'm', color: '#f00', content: 'c1' })
      addAnnotation({ module: 'category', entity: 'B', metric: 'm', color: '#f00', content: 'c2' })
      addAnnotation({ module: 'region', entity: 'C', metric: 'm', color: '#0f0', content: 'c3' })

      clearByModule('category')
      expect(count.value).toBe(1)
      expect(getAnnotationsByModule('category').length).toBe(0)
      expect(getAnnotationsByModule('region').length).toBe(1)
    })
  })

  describe('查询与分组功能', () => {
    beforeEach(() => {
      const { addAnnotation } = useAnnotations()
      addAnnotation({
        module: 'category', entity: '白酒', metric: '市场份额',
        timePoint: undefined, value: 62.5,
        color: '#8B0000', content: '白酒基本盘稳固'
      })
      addAnnotation({
        module: 'category', entity: '精酿啤酒', metric: '增速',
        timePoint: '2025', value: 25.6,
        color: '#FF69B4', content: '精酿增速首次超过白酒'
      })
      addAnnotation({
        module: 'category', entity: '白酒', metric: '增速',
        timePoint: '2024', value: 5.5,
        color: '#8B0000', content: '白酒增速放缓'
      })
      addAnnotation({
        module: 'region', entity: '成都', metric: '精酿指数',
        timePoint: '西南', value: 135.8,
        color: '#CD853F', content: '成渝精酿渗透率第一'
      })
      addAnnotation({
        module: 'import', entity: '国产威士忌', metric: '国产威士忌份额',
        timePoint: '2025', value: 37.5,
        color: '#B22222', content: '国产威士忌份额快速提升'
      })
    })

    it('getAnnotationsByModule: 按模块查询', () => {
      const { getAnnotationsByModule } = useAnnotations()
      expect(getAnnotationsByModule('category').length).toBe(3)
      expect(getAnnotationsByModule('region').length).toBe(1)
      expect(getAnnotationsByModule('price').length).toBe(0)
    })

    it('getAnnotationsByEntity: 按实体查询', () => {
      const { getAnnotationsByEntity } = useAnnotations()
      expect(getAnnotationsByEntity('category', '白酒').length).toBe(2)
      expect(getAnnotationsByEntity('category', '精酿啤酒').length).toBe(1)
      expect(getAnnotationsByEntity('region', '成都').length).toBe(1)
      expect(getAnnotationsByEntity('category', '不存在').length).toBe(0)
    })

    it('getAnnotation: 按 (module, entity, metric, timePoint) 精确查找', () => {
      const { getAnnotation } = useAnnotations()

      const catShare = getAnnotation('category', '白酒', '市场份额')
      expect(catShare).toBeDefined()
      expect(catShare?.content).toBe('白酒基本盘稳固')
      expect(catShare?.timePoint).toBeUndefined()

      const craft2025 = getAnnotation('category', '精酿啤酒', '增速', '2025')
      expect(craft2025).toBeDefined()
      expect(craft2025?.value).toBe(25.6)

      const baijiu2023 = getAnnotation('category', '白酒', '增速', '2023')
      expect(baijiu2023).toBeUndefined()
    })

    it('groupedByModule: 按 moduleLabel 分组', () => {
      const { groupedByModule } = useAnnotations()
      const keys = Object.keys(groupedByModule.value)
      expect(keys).toContain('品类结构')
      expect(keys).toContain('区域消费偏好')
      expect(keys).toContain('进口与国产对比')
      expect(groupedByModule.value['品类结构'].length).toBe(3)
      expect(groupedByModule.value['区域消费偏好'].length).toBe(1)
    })
  })

  describe('localStorage 持久化', () => {
    it('添加标注后自动同步到 localStorage', () => {
      clearStorage()
      const { addAnnotation } = useAnnotations()

      addAnnotation({
        module: 'category', entity: '测试品类', metric: '测试指标',
        color: '#abcdef', content: '持久化测试内容'
      })

      const stored = readStorage()
      expect(stored.length).toBe(1)
      expect(stored[0].entity).toBe('测试品类')
      expect(stored[0].content).toBe('持久化测试内容')
      expect(stored[0].color).toBe('#abcdef')
    })

    it('初始化时从 localStorage 加载已存标注', () => {
      const seed: AnnotationPoint[] = [
        {
          id: 'preseed-1',
          module: 'category',
          moduleLabel: '品类结构',
          entity: '白酒',
          metric: '市场份额',
          color: '#8B0000',
          content: '从存储恢复的标注',
          createdAt: Date.now() - 10000,
          updatedAt: Date.now() - 10000
        },
        {
          id: 'preseed-2',
          module: 'region',
          moduleLabel: '区域消费偏好',
          entity: '上海',
          metric: '红酒占比',
          timePoint: '华东沿海',
          color: '#4A90D9',
          content: '沿海红酒渗透高',
          createdAt: Date.now() - 5000,
          updatedAt: Date.now() - 5000
        }
      ]
      writeStorage(seed)

      const { annotations, count } = useAnnotations()
      expect(count.value).toBe(2)
      expect(annotations.value[0].id).toBe('preseed-1')
      expect(annotations.value[1].content).toBe('沿海红酒渗透高')
    })

    it('删除标注后同步到 localStorage', () => {
      clearStorage()
      const { addAnnotation, deleteAnnotation } = useAnnotations()
      const r1 = addAnnotation({ module: 'category', entity: 'A', metric: 'm', color: '#f00', content: '保留' })
      const r2 = addAnnotation({ module: 'category', entity: 'B', metric: 'm', color: '#0f0', content: '删除' })

      expect(readStorage().length).toBe(2)
      deleteAnnotation(r2.id)
      const remaining = readStorage()
      expect(remaining.length).toBe(1)
      expect(remaining[0].id).toBe(r1.id)
    })

    it('更新标注后同步到 localStorage', () => {
      clearStorage()
      const { addAnnotation, updateAnnotation } = useAnnotations()
      const r = addAnnotation({ module: 'price', entity: 'X', metric: 'y', color: '#f00', content: '原始内容' })

      updateAnnotation(r.id, '更新后的内容')
      const stored = readStorage()
      expect(stored[0].content).toBe('更新后的内容')
      expect(stored[0].updatedAt).toBeGreaterThan(stored[0].createdAt)
    })

    it('localStorage 存储损坏时优雅降级，不抛出异常', () => {
      localStorage.setItem(STORAGE_KEY, 'this-is-not-valid-json-{')
      expect(() => {
        const { annotations, count } = useAnnotations()
        expect(annotations.value.length).toBe(0)
        expect(count.value).toBe(0)
      }).not.toThrow()
    })

    it('localStorage 存储的数据是数组但元素格式错误时，过滤掉非法元素', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([
        { id: 'valid', module: 'category', moduleLabel: '品类结构', entity: '白酒', metric: '份额', color: '#f00', content: 'ok', createdAt: 1, updatedAt: 1 },
        { foo: 'bar' },
        null,
        { id: 'missing-content', module: 'category' }
      ]))
      const { annotations } = useAnnotations()
      expect(annotations.value.length).toBe(1)
      expect(annotations.value[0].id).toBe('valid')
    })
  })

  describe('业务场景：完整链路模拟', () => {
    it('场景一：品类模块 - 饼图扇区标注 + 折线拐点标注', () => {
      clearStorage()
      const { addAnnotation, getAnnotation, getAnnotationsByEntity } = useAnnotations()

      // 1. 点击饼图扇区（白酒）添加份额标注
      const pieAnn = addAnnotation({
        module: 'category', entity: '白酒', metric: '市场份额',
        color: '#8B0000', value: 62.5,
        content: '白酒主导地位，超60%市场份额'
      })
      expect(pieAnn.timePoint).toBeUndefined()

      // 2. 点击折线拐点（精酿啤酒 2025年）添加增速标注
      const lineAnn = addAnnotation({
        module: 'category', entity: '精酿啤酒', metric: '增速',
        timePoint: '2025', color: '#FF69B4', value: 25.6,
        content: '精酿啤酒增速首次超过白酒，新锐品类崛起'
      })

      // 3. 精确查询校验
      expect(getAnnotation('category', '白酒', '市场份额')?.id).toBe(pieAnn.id)
      expect(getAnnotation('category', '精酿啤酒', '增速', '2025')?.id).toBe(lineAnn.id)
      expect(getAnnotation('category', '精酿啤酒', '增速', '2024')).toBeUndefined()

      // 4. 白酒实体有 1 条标注，精酿啤酒实体有 1 条
      expect(getAnnotationsByEntity('category', '白酒').length).toBe(1)
      expect(getAnnotationsByEntity('category', '精酿啤酒').length).toBe(1)
    })

    it('场景二：同一 (实体, 指标, 时间点) 再次添加时触发"编辑"模式（更新原标注）', () => {
      const { addAnnotation, updateAnnotation, getAnnotation } = useAnnotations()

      // 首次添加
      const first = addAnnotation({
        module: 'import', entity: '进口葡萄酒', metric: '进口红酒份额',
        timePoint: '2023', color: '#4A90D9', value: 32.8,
        content: '初步观察进口持续下滑'
      })

      // 用户再次点击同一数据点，发现已存在，改为更新
      const existing = getAnnotation('import', '进口葡萄酒', '进口红酒份额', '2023')
      expect(existing?.id).toBe(first.id)

      const ok = updateAnnotation(first.id, '下调关税叠加国产替代，进口份额加速萎缩')
      expect(ok).toBe(true)

      const after = getAnnotation('import', '进口葡萄酒', '进口红酒份额', '2023')
      expect(after?.content).toContain('加速萎缩')
      expect(after?.updatedAt).toBeGreaterThan(first.createdAt)
    })

    it('场景三：四个模块的标注数量统计与分组浏览', () => {
      clearStorage()
      const { addAnnotation, groupedByModule, count } = useAnnotations()

      const data: Array<{
        module: AnnotationModule; entity: string; metric: string;
        color: string; content: string; timePoint?: string
      }> = [
          { module: 'category', entity: '白酒', metric: '市场份额', color: '#8B0000', content: 'CAT-1' },
          { module: 'category', entity: '精酿啤酒', metric: '增速', color: '#FF69B4', content: 'CAT-2', timePoint: '2025' },
          { module: 'region', entity: '成都', metric: '精酿啤酒占比', color: '#CD853F', content: 'REG-1' },
          { module: 'region', entity: '上海', metric: '红酒占比', color: '#4A90D9', content: 'REG-2' },
          { module: 'price', entity: '2000元以上', metric: '当前份额', color: '#D4AF37', content: 'PRC-1' },
          { module: 'price', entity: '百元以下', metric: '份额趋势', color: '#3A3A4A', content: 'PRC-2', timePoint: '2025' },
          { module: 'import', entity: '国产威士忌', metric: '国产威士忌份额', color: '#B22222', content: 'IMP-1', timePoint: '2025' }
        ]

      data.forEach(d => addAnnotation({ ...d }))

      expect(count.value).toBe(7)
      expect(groupedByModule.value['品类结构'].length).toBe(2)
      expect(groupedByModule.value['区域消费偏好'].length).toBe(2)
      expect(groupedByModule.value['白酒价格带'].length).toBe(2)
      expect(groupedByModule.value['进口与国产对比'].length).toBe(1)

      // 各模块内容正确
      expect(groupedByModule.value['品类结构'].map(a => a.content).sort()).toEqual(['CAT-1', 'CAT-2'])
      expect(groupedByModule.value['白酒价格带'].map(a => a.content).sort()).toEqual(['PRC-1', 'PRC-2'])
    })

    it('场景四：标注内容包含首尾空格会被自动 trim', () => {
      const { addAnnotation, updateAnnotation, annotations } = useAnnotations()

      const r = addAnnotation({
        module: 'category', entity: 'X', metric: 'Y', color: '#fff',
        content: '   前面有空格和后面有空格   '
      })
      expect(r.content).toBe('前面有空格和后面有空格')

      updateAnnotation(r.id, '   更新后的内容也需要 trim   ')
      expect(annotations.value[0].content).toBe('更新后的内容也需要 trim')
    })
  })

  describe('边界条件', () => {
    it('value 和 timePoint 可以为 undefined', () => {
      const { addAnnotation, annotations } = useAnnotations()
      const r = addAnnotation({
        module: 'region', entity: '北京', metric: '区域综合偏好',
        color: '#ff0', content: '没有具体时间点的截面标注'
      })
      expect(r.value).toBeUndefined()
      expect(r.timePoint).toBeUndefined()
      expect(annotations.value[0].timePoint).toBeUndefined()
    })

    it('timePoint 能正确区分不同时间的相同指标标注', () => {
      const { addAnnotation, getAnnotation, getAnnotationsByEntity } = useAnnotations()

      addAnnotation({ module: 'price', entity: '次高端', metric: '份额趋势', timePoint: '2023', color: '#f00', content: '2023备注' })
      addAnnotation({ module: 'price', entity: '次高端', metric: '份额趋势', timePoint: '2024', color: '#f00', content: '2024备注' })
      addAnnotation({ module: 'price', entity: '次高端', metric: '份额趋势', timePoint: '2025', color: '#f00', content: '2025备注' })

      expect(getAnnotationsByEntity('price', '次高端').length).toBe(3)
      expect(getAnnotation('price', '次高端', '份额趋势', '2024')?.content).toBe('2024备注')
    })

    it('颜色字段原样保留（用于标签与品类对应）', () => {
      const { addAnnotation, annotations } = useAnnotations()
      const colors = ['#8B0000', '#D4AF37', '#4A90D9', 'rgba(139,0,0,0.5)']
      colors.forEach(c => addAnnotation({ module: 'category', entity: c, metric: 'm', color: c, content: 't' }))

      annotations.value.forEach((a, i) => {
        expect(a.color).toBe(colors[i])
      })
    })
  })
})
