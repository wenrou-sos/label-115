<script setup lang="ts">
import { darkTheme, dateZhCN, zhCN, NConfigProvider, NMessageProvider, type GlobalThemeOverrides } from 'naive-ui'
import { computed } from 'vue'

const themeOverrides = computed<GlobalThemeOverrides>(() => ({
  common: {
    primaryColor: '#8B0000',
    primaryColorHover: '#ab1a1a',
    primaryColorPressed: '#740a0a',
    primaryColorSuppl: '#D4AF37',
    infoColor: '#D4AF37',
    infoColorHover: '#e0ad3e',
    borderRadius: '8px',
    fontFamily: '"Noto Sans SC", system-ui, sans-serif'
  },
  Card: {
    color: 'rgba(26, 26, 46, 0.85)',
    colorModal: 'rgba(26, 26, 46, 0.95)',
    colorTarget: 'rgba(26, 26, 46, 0.9)',
    borderColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: '12px',
    titleFontSize: '16px',
    titleTextColor: '#D4AF37'
  },
  Button: {
    colorPrimary: '#8B0000',
    colorHoverPrimary: '#ab1a1a',
    colorPressedPrimary: '#740a0a',
    colorFocusPrimary: '#8B0000',
    borderPrimary: '1px solid #D4AF37'
  },

  Input: {
    color: 'rgba(20, 20, 35, 0.95)',
    colorFocus: 'rgba(20, 20, 35, 1)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderHover: '1px solid rgba(212, 175, 55, 0.6)',
    boxShadowFocus: '0 0 0 2px rgba(212, 175, 55, 0.2)'
  },
  Slider: {
    fillColor: '#8B0000',
    thumbColor: '#D4AF37'
  },
  DataTable: {
    tdColor: 'rgba(20, 20, 35, 0.6)',
    thColor: 'rgba(26, 26, 46, 0.9)',
    thTextColor: '#D4AF37',
    borderColor: 'rgba(212, 175, 55, 0.1)'
  }
}))
</script>

<template>
  <NConfigProvider
    :theme="darkTheme"
    :theme-overrides="themeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <NLoadingBarProvider>
      <NMessageProvider>
        <router-view />
      </NMessageProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
