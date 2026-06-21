<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NDrawer,
  NDrawerContent,
  NEmpty,
  NTag,
  NButton,
  NSpace,
  NPopconfirm,
  NScrollbar,
  NDivider,
  useMessage,
  NTooltip
} from 'naive-ui'
import {
  MessageSquareText,
  Trash2,
  Edit3,
  X,
  TrendingUp,
  Calendar
} from 'lucide-vue-next'
import { useAnnotations } from '@/composables/useAnnotations'
import AnnotationDialog from './AnnotationDialog.vue'
import type { AnnotationPoint } from '@/types'

interface Props {
  show: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: false
})

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void
}>()

const message = useMessage()
const annotations = useAnnotations()
const showLocal = computed({
  get: () => props.show,
  set: (v: boolean) => emit('update:show', v)
})

const editingItem = ref<AnnotationPoint | null>(null)
const showEditDialog = ref(false)

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function handleDelete(item: AnnotationPoint) {
  annotations.deleteAnnotation(item.id)
  message.success('标注已删除')
}

function handleEdit(item: AnnotationPoint) {
  editingItem.value = item
  showEditDialog.value = true
}

function handleEditConfirm(content: string) {
  if (editingItem.value) {
    annotations.updateAnnotation(editingItem.value.id, content)
    message.success('标注已更新')
  }
  showEditDialog.value = false
  editingItem.value = null
}

function handleClearAll() {
  annotations.clearAll()
  message.success('已清空所有标注')
}
</script>

<template>
  <NDrawer v-model:show="showLocal" placement="right" :width="480" :mask-closable="true">
    <NDrawerContent
      title=""
      :native-scrollbar="false"
      class="!bg-ink-900 !border-l !border-champagne-500/20"
    >
      <template #header>
        <div class="flex items-center justify-between px-2">
          <div class="flex items-center gap-2">
            <MessageSquareText class="w-5 h-5 text-champagne-400" />
            <span class="font-serif-cn text-lg font-semibold text-gradient-gold">所有标注</span>
            <NTag v-if="annotations.count.value > 0" size="small" type="warning" round :bordered="false">
              共 {{ annotations.count.value }} 条
            </NTag>
          </div>
          <div class="flex items-center gap-2">
            <NPopconfirm v-if="annotations.count.value > 0">
              <template #trigger>
                <NButton size="tiny" quaternary @click.stop>
                  <template #icon>
                    <Trash2 class="w-3.5 h-3.5 text-rose-400" />
                  </template>
                  <span class="text-rose-300 text-xs">清空全部</span>
                </NButton>
              </template>
              <template #action>
                <NSpace>
                  <NButton size="small" @click="handleClearAll">确认清空</NButton>
                </NSpace>
              </template>
              <div class="text-sm">确定要清空全部 {{ annotations.count.value }} 条标注吗？此操作不可恢复。</div>
            </NPopconfirm>
            <button
              @click="showLocal = false"
              class="text-ink-400 hover:text-ink-200 transition-colors p-1 rounded"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
      </template>

      <div class="px-2 mt-2">
        <NEmpty v-if="annotations.count.value === 0" description="还没有任何标注" class="py-20">
          <template #icon>
            <div class="w-14 h-14 rounded-full bg-ink-800/60 flex items-center justify-center mx-auto">
              <MessageSquareText class="w-7 h-7 text-ink-500" />
            </div>
          </template>
          <template #extra>
            <div class="text-ink-400 text-sm">在图表数据点上点击「添加标注」</div>
            <div class="text-ink-500 text-xs mt-1">支持在任意数据点的气泡中点击 ✏️ 图标即可添加</div>
          </template>
        </NEmpty>

        <NScrollbar v-else style="max-height: calc(100vh - 140px)">
          <div class="pb-4">
            <template v-for="(list, moduleLabel) in annotations.groupedByModule.value" :key="moduleLabel">
              <div class="flex items-center gap-2 mb-3 mt-1">
                <TrendingUp class="w-3.5 h-3.5 text-champagne-500" />
                <span class="text-xs font-semibold text-champagne-400/90 uppercase tracking-wider">{{ moduleLabel }}</span>
                <NTag size="tiny" round :bordered="false" type="info">
                  {{ list.length }}
                </NTag>
                <NDivider class="!flex-1 !my-0 !mx-2" />
              </div>

              <div class="space-y-2">
                <div
                  v-for="item in list"
                  :key="item.id"
                  class="rounded-lg border p-3 transition-all hover:scale-[1.005"
                  :style="{
                    backgroundColor: item.color + '0A',
                    borderColor: item.color + '30'
                  }"
                >
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <div
                        class="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                        :style="{ backgroundColor: item.color }"
                      />
                      <NTag size="tiny" round :bordered="false" :style="{ backgroundColor: `${item.color}22`, color: item.color }">
                        {{ item.entity }}
                      </NTag>
                      <NTag v-if="item.metric" size="tiny" round type="info" :bordered="false">
                        {{ item.metric }}
                      </NTag>
                      <NTag v-if="item.timePoint" size="tiny" round type="success" :bordered="false">
                        {{ item.timePoint }}
                      </NTag>
                    </div>
                    <NSpace size="small">
                      <NTooltip>
                        <template #trigger>
                          <button
                            class="text-ink-400 hover:text-champagne-400 transition-colors"
                            @click="handleEdit(item)"
                          >
                            <Edit3 class="w-3.5 h-3.5" />
                          </button>
                        </template>
                        编辑
                      </NTooltip>
                      <NTooltip>
                        <template #trigger>
                          <button
                            class="text-ink-400 hover:text-rose-400 transition-colors"
                            @click="handleDelete(item)"
                          >
                            <Trash2 class="w-3.5 h-3.5" />
                          </button>
                        </template>
                        删除
                      </NTooltip>
                    </NSpace>
                  </div>
                  <p class="text-sm text-ink-100 leading-relaxed mb-2 pl-4">
                    {{ item.content }}
                  </p>
                  <div class="flex items-center gap-1 text-[11px] text-ink-500 pl-4">
                    <Calendar class="w-3 h-3" />
                    {{ formatTime(item.updatedAt) }}
                  </div>
                </div>
              </div>
              <div class="h-4" />
            </template>
          </div>
        </NScrollbar>
      </div>
    </NDrawerContent>
  </NDrawer>

  <AnnotationDialog
    v-if="editingItem"
    v-model:show="showEditDialog"
    :entity-name="editingItem.entity"
    :metric-name="editingItem.metric"
    :time-point="editingItem.timePoint"
    :value="editingItem.value"
    :color="editingItem.color"
    :initial-content="editingItem.content"
    @confirm="handleEditConfirm"
  />
</template>
