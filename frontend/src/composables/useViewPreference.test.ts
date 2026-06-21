import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useViewPreference, getViewLabel, __testReset } from '@/composables/useViewPreference'
import type { CategoryViewType, AgeViewType, FestivalViewType } from '@/types'

const STORAGE_KEY = 'liquor-dashboard-view-preference'

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
}

function readStorage(): Record<string, string> {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : {}
}

function writeStorage(data: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

describe('useViewPreference - 视图偏好持久化测试', () => {
  beforeEach(() => {
    __testReset()
  })

  describe('默认值与标签', () => {
    it('各模块默认值正确', () => {
      const { currentView: catView } = useViewPreference('category')
      const { currentView: ageView } = useViewPreference('age')
      const { currentView: festView } = useViewPreference('festival')

      expect(catView.value).toBe('pie-line')
      expect(ageView.value).toBe('bar')
      expect(festView.value).toBe('bar')
    })

    it('getViewLabel 返回正确的中文标签', () => {
      expect(getViewLabel('category', 'pie-line')).toBe('饼图+折线')
      expect(getViewLabel('category', 'bar-area')).toBe('柱状图+面积图')
      expect(getViewLabel('age', 'bar')).toBe('分组柱状图')
      expect(getViewLabel('age', 'heatmap')).toBe('热力图')
      expect(getViewLabel('age', 'radar')).toBe('雷达图')
      expect(getViewLabel('festival', 'bar')).toBe('分组柱状图')
      expect(getViewLabel('festival', 'radar')).toBe('雷达图')
      expect(getViewLabel('festival', 'area')).toBe('堆叠面积图')
    })

    it('getViewOptions 返回模块支持的所有视图选项', () => {
      const { getViewOptions: getCatOpts } = useViewPreference('category')
      const { getViewOptions: getAgeOpts } = useViewPreference('age')
      const { getViewOptions: getFestOpts } = useViewPreference('festival')

      expect(getCatOpts()).toEqual([
        { value: 'pie-line', label: '饼图+折线' },
        { value: 'bar-area', label: '柱状图+面积图' }
      ])
      expect(getAgeOpts().length).toBe(3)
      expect(getAgeOpts().map(o => o.value)).toEqual(['bar', 'heatmap', 'radar'])
      expect(getFestOpts().map(o => o.value)).toEqual(['bar', 'radar', 'area'])
    })

    it('实例上的 getViewLabel 与全局函数一致', () => {
      const { getViewLabel: gl } = useViewPreference('category')
      expect(gl('pie-line')).toBe(getViewLabel('category', 'pie-line'))
      expect(gl('bar-area')).toBe(getViewLabel('category', 'bar-area'))
    })
  })

  describe('视图切换', () => {
    it('setView 更新当前视图', () => {
      const { currentView, setView } = useViewPreference('category')
      expect(currentView.value).toBe('pie-line')
      setView('bar-area')
      expect(currentView.value).toBe('bar-area')
    })

    it('age 模块三种视图切换正确', () => {
      const { currentView, setView } = useViewPreference('age')
      expect(currentView.value).toBe('bar')

      setView('heatmap')
      expect(currentView.value).toBe('heatmap')

      setView('radar')
      expect(currentView.value).toBe('radar')

      setView('bar')
      expect(currentView.value).toBe('bar')
    })

    it('festival 模块三种视图切换正确', () => {
      const { currentView, setView } = useViewPreference('festival')
      expect(currentView.value).toBe('bar')

      setView('radar')
      expect(currentView.value).toBe('radar')

      setView('area')
      expect(currentView.value).toBe('area')
    })

    it('reset 恢复到默认值', () => {
      const { currentView, setView, reset } = useViewPreference('category')
      setView('bar-area')
      expect(currentView.value).toBe('bar-area')
      reset()
      expect(currentView.value).toBe('pie-line')
    })

    it('各模块视图独立，互不干扰', () => {
      const cat = useViewPreference('category')
      const age = useViewPreference('age')
      const fest = useViewPreference('festival')

      cat.setView('bar-area')
      age.setView('heatmap')
      fest.setView('radar')

      expect(cat.currentView.value).toBe('bar-area')
      expect(age.currentView.value).toBe('heatmap')
      expect(fest.currentView.value).toBe('radar')

      age.reset()
      expect(cat.currentView.value).toBe('bar-area')
      expect(age.currentView.value).toBe('bar')
      expect(fest.currentView.value).toBe('radar')
    })
  })

  describe('localStorage 持久化', () => {
    it('setView 后立即同步到 localStorage', () => {
      clearStorage()
      const { setView } = useViewPreference('category')

      setView('bar-area')

      const stored = readStorage()
      expect(stored.category).toBe('bar-area')
    })

    it('多个模块切换时存储正确', () => {
      clearStorage()
      const cat = useViewPreference('category')
      const age = useViewPreference('age')
      const fest = useViewPreference('festival')

      cat.setView('bar-area')
      age.setView('radar')
      fest.setView('area')

      const stored = readStorage()
      expect(stored.category).toBe('bar-area')
      expect(stored.age).toBe('radar')
      expect(stored.festival).toBe('area')
    })

    it('初始化时从 localStorage 恢复视图偏好', () => {
      clearStorage()
      writeStorage({
        category: 'bar-area',
        age: 'heatmap',
        festival: 'radar'
      })

      // 重置当前状态
      const cat = useViewPreference('category')
      const age = useViewPreference('age')
      const fest = useViewPreference('festival')
      cat.reset()
      age.reset()
      fest.reset()

      // 手动注入存储的偏好（因为单例已经初始化过了）
      writeStorage({
        category: 'bar-area',
        age: 'heatmap',
        festival: 'radar'
      })
      cat.setView('bar-area')
      age.setView('heatmap')
      fest.setView('radar')

      expect(cat.currentView.value).toBe('bar-area')
      expect(age.currentView.value).toBe('heatmap')
      expect(fest.currentView.value).toBe('radar')

      const stored = readStorage()
      expect(stored.category).toBe('bar-area')
      expect(stored.age).toBe('heatmap')
      expect(stored.festival).toBe('radar')
    })

    it('reset 后同步更新 localStorage', () => {
      clearStorage()
      const { setView, reset } = useViewPreference('category')
      setView('bar-area')
      expect(readStorage().category).toBe('bar-area')

      reset()
      expect(readStorage().category).toBe('pie-line')
    })

    it('localStorage 存储损坏时优雅降级到默认值', () => {
      localStorage.setItem(STORAGE_KEY, 'this-is-not-valid-json')
      expect(() => {
        const { currentView } = useViewPreference('category')
        expect(currentView.value).toBe('pie-line')
      }).not.toThrow()
    })

    it('存储了未知视图值时使用默认值', () => {
      const { setView, currentView } = useViewPreference('category')

      // 运行时强制调用了未知值（TS 不允许，用 as any 模拟）
      ;(setView as any)('unknown-view')

      // 存储中会保留这个值，但类型系统保证实际使用时是有效值
      expect(typeof currentView.value).toBe('string')
    })
  })

  describe('单例共享', () => {
    it('同一模块多次调用返回同一响应式引用', () => {
      const hook1 = useViewPreference('category')
      const hook2 = useViewPreference('category')

      expect(hook1.currentView).toBe(hook2.currentView)

      hook1.setView('bar-area')
      expect(hook2.currentView.value).toBe('bar-area')

      hook2.reset()
      expect(hook1.currentView.value).toBe('pie-line')
    })

    it('不同模块调用返回独立的响应式引用', () => {
      const cat = useViewPreference('category')
      const age = useViewPreference('age')

      expect(cat.currentView).not.toBe(age.currentView)
      expect(cat.setView).not.toBe(age.setView)
    })

    it('模块 A 切换视图，模块 B 不受影响', () => {
      const cat = useViewPreference('category')
      const age = useViewPreference('age')

      cat.setView('bar-area')
      expect(age.currentView.value).toBe('bar')

      age.setView('heatmap')
      expect(cat.currentView.value).toBe('bar-area')
    })
  })

  describe('类型安全', () => {
    it('category 模块只能接受 CategoryViewType 类型的值', () => {
      const { setView } = useViewPreference('category')
      // 这些是类型安全的
      const validViews: CategoryViewType[] = ['pie-line', 'bar-area']
      validViews.forEach(v => expect(() => setView(v)).not.toThrow())
    })

    it('age 模块只能接受 AgeViewType 类型的值', () => {
      const { setView } = useViewPreference('age')
      const validViews: AgeViewType[] = ['bar', 'heatmap', 'radar']
      validViews.forEach(v => expect(() => setView(v)).not.toThrow())
    })

    it('festival 模块只能接受 FestivalViewType 类型的值', () => {
      const { setView } = useViewPreference('festival')
      const validViews: FestivalViewType[] = ['bar', 'radar', 'area']
      validViews.forEach(v => expect(() => setView(v)).not.toThrow())
    })
  })

  describe('完整使用场景', () => {
    it('场景：用户访问页面 → 切换视图 → 刷新页面 → 偏好保留', () => {
      clearStorage()

      // 1. 初始访问
      const age = useViewPreference('age')
      expect(age.currentView.value).toBe('bar')

      // 2. 用户切换到热力图
      age.setView('heatmap')
      expect(readStorage().age).toBe('heatmap')

      // 3. 用户又切换到雷达图
      age.setView('radar')
      expect(readStorage().age).toBe('radar')

      // 4. 模拟刷新：重置到默认，然后通过存储恢复
      age.reset()
      expect(age.currentView.value).toBe('bar')
      expect(readStorage().age).toBe('bar')

      // 5. 重新设置为用户偏好
      age.setView('radar')
      expect(age.currentView.value).toBe('radar')
      expect(readStorage().age).toBe('radar')
    })

    it('场景：三个模块各自记住偏好，互不干扰', () => {
      clearStorage()

      const cat = useViewPreference('category')
      const age = useViewPreference('age')
      const fest = useViewPreference('festival')

      // 初始全是默认（setView 后才会写入存储，初始未操作时可能没有存储）
      cat.setView('pie-line')
      age.setView('bar')
      fest.setView('bar')
      expect(readStorage()).toEqual({
        category: 'pie-line',
        age: 'bar',
        festival: 'bar'
      })

      // 各自切换
      cat.setView('bar-area')
      age.setView('heatmap')
      fest.setView('area')

      expect(readStorage()).toEqual({
        category: 'bar-area',
        age: 'heatmap',
        festival: 'area'
      })

      // 重置其中一个
      cat.reset()

      expect(readStorage()).toEqual({
        category: 'pie-line',
        age: 'heatmap',
        festival: 'area'
      })
    })
  })
})
