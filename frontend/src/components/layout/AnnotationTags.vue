<script setup lang="ts">
import { computed } from 'vue'
import { NTooltip, NPopconfirm, useMessage } from 'naive-ui'
import { Edit3, Trash2, MessageSquare } from 'lucide-vue-next'
import { useAnnotations } from '@/composables/useAnnotations'
import type { AnnotationModule, AnnotationPoint } from '@/types'

interface Props {
  module: AnnotationModule
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'edit', item: AnnotationPoint): void
}>()
const message = useMessage()
const annotations = useAnnotations()

const moduleAnnotations = computed(() => annotations.getAnnotationsByModule(props.module))

function handleEdit(item: AnnotationPoint) {
  emit('edit', item)
}

function handleDelete(item: AnnotationPoint) {
  annotations.deleteAnnotation(item.id)
  message.success('标注已删除')
}
</script>

<template>
  <div v-if="moduleAnnotations.length > 0" class="w-full">
    <div class="flex items-center gap-2 mb-2">
      <MessageSquare class="w-3.5 h-3.5 text-champagne-400" />
      <span class="text-xs font-semibold text-champagne-400/80">本模块标注</span>
      <div class="flex-1 h-px bg-champagne-500/10" />
    </div>
    <div class="flex flex-wrap gap-2">
      <div
        v-for="item in moduleAnnotations"
        :key="item.id"
        class="group flex items-center gap-2 rounded-lg px-3 py-2 border transition-all hover:scale-[1.01] max-w-full"
        :style="{
          backgroundColor: `${item.color}10`,
          borderColor: `${item.color}30`
        }"
      >
        <div
          class="w-2 h-2 rounded-full flex-shrink-0"
          :style="{ backgroundColor: item.color }"
        />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1 mb-0.5 flex-wrap">
            <span class="text-[11px] font-semibold truncate" :style="{ color: item.color }">
              {{ item.entity }}
            </span>
            <span v-if="item.timePoint" class="text-[11px] text-ink-400">
              · {{ item.timePoint }}
            </span>
          </div>
          <p class="text-xs text-ink-200 truncate">{{ item.content }}</p>
        </div>
        <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <NTooltip>
            <template #trigger>
              <button
                class="p-1 rounded hover:bg-ink-800/60 text-ink-400 hover:text-champagne-400 transition-colors"
                @click.stop="handleEdit(item)"
              >
                <Edit3 class="w-3 h-3" />
              </button>
            </template>
            编辑
          </NTooltip>
          <NPopconfirm>
            <template #trigger>
              <button
                class="p-1 rounded hover:bg-ink-800/60 text-ink-400 hover:text-rose-400 transition-colors"
                @click.stop
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </template>
            <template #action>
              <button
                class="px-2 py-1 rounded bg-rose-500 text-white text-xs"
                @click="handleDelete(item)"
              >
                确认删除
              </button>
            </template>
            <div class="text-sm">删除这条标注？</div>
          </NPopconfirm>
        </div>
      </div>
    </div>
  </div>
</template>
