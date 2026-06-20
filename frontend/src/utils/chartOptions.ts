import type { EChartsOption } from 'echarts'

export const CHART_COLORS = {
  baijiu: '#8B0000',
  beer: '#F4A460',
  craftBeer: '#FFD700',
  wine: '#B22222',
  sparkling: '#FF69B4',
  huangjiu: '#DAA520',
  whiskey: '#CD853F',
  fruitWine: '#FF69B4',
  import: '#4A90D9',
  domestic: '#8B0000',
  tariff: '#D4AF37'
}

export const baseTooltip: EChartsOption['tooltip'] = {
  trigger: 'axis',
  backgroundColor: 'rgba(15, 15, 26, 0.95)',
  borderColor: '#D4AF37',
  borderWidth: 1,
  textStyle: {
    color: '#fff',
    fontSize: 13
  },
  axisPointer: {
    type: 'shadow',
    shadowStyle: {
      color: 'rgba(212, 175, 55, 0.08)'
    }
  }
}

export const baseLegend: EChartsOption['legend'] = {
  textStyle: {
    color: '#c9c9d3',
    fontSize: 12
  },
  itemGap: 16,
  top: 0
}

export const baseGrid: EChartsOption['grid'] = {
  left: '3%',
  right: '4%',
  bottom: '3%',
  top: '15%',
  containLabel: true
}

export const baseTextStyle = {
  color: '#c9c9d3'
}

export const darkAxisStyle = {
  axisLine: {
    lineStyle: { color: '#3a3a4a' }
  },
  axisLabel: {
    color: '#9c9cab',
    fontSize: 12
  },
  splitLine: {
    lineStyle: { color: 'rgba(58, 58, 74, 0.5)', type: 'dashed' as const }
  }
}
