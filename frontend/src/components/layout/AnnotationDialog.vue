<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { NModal, NCard, NForm, NFormItem, NInput, NSpace, NButton, NTag, useMessage } from 'naive-ui'
import { MessageSquarePlus, X, Save } from 'lucide-vue-next'

interface Props {
  show: boolean
  entityName?: string
  metricName?: string
  timePoint?: string
  value?: number
  color?: string
  initialContent?: string
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  entityName: '',
  metricName: '',
  timePoint: undefined,
  value: undefined,
  color: '#D4AF37',
  initialContent: ''
})

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void
  (e: 'confirm', content: string): void
  (e: 'cancel'): void
}>()

const message = useMessage()
const content = ref('')
const showLocal = computed({
  get: () => props.show,
  set: (v: boolean) => emit('update:show', v)
})

watch(() => props.show, v => {
  if (v) {
    content.value = props.initialContent || ''
  }
})

function handleConfirm() {
  const text = content.value.trim()
  if (!text) {
    message.warning('请填写标注内容')
    return
  }
  if (text.length > 200) {
    message.warning('标注内容不能超过 200 字')
    return
  }
  emit('confirm', text)
  message.success(props.initialContent ? '标注已更新' : '标注已添加')
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <NModal
    v-model:show="showLocal"
    preset="card"
    :title="null"
    :mask-closable="false"
    class="annotation-dialog"
    :style="{ width: '460px', maxWidth: '92vw' }"
  >
    <NCard :bordered="false" size="small" class="!p-0 overflow-hidden bg-transparent">
      <div class="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-wine-900/40 to-ink-900 border-b border-champagne-500/10">
        <div class="flex items-center gap-2">
          <MessageSquarePlus class="w-4 h-4 text-champagne-400" />
          <span class="font-serif-cn font-semibold text-ink-100">
            {{ initialContent ? '编辑标注' : '添加标注' }}
          </span>
        </div>
        <button
          @click="showLocal = false"
          class="text-ink-400 hover:text-ink-200 transition-colors p-1 rounded"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="p-5">
        <div class="flex flex-wrap gap-2 mb-4">
          <NTag
            v-if="entityName"
            size="small"
            :bordered="false"
            round
            :style="{ backgroundColor: `${color}22`, color: color }"
          >
            {{ entityName }}
          </NTag>
          <NTag v-if="metricName" size="small" type="info" round :bordered="false">
            {{ metricName }}
          </NTag>
          <NTag v-if="timePoint" size="small" type="success" round :bordered="false">
            {{ timePoint }}
          </NTag>
          <NTag v-if="value !== undefined" size="small" type="warning" round :bordered="false">
            数值：{{ value }}
          </NTag>
        </div>

        <NForm label-placement="top">
          <NFormItem label="标注内容">
            <NInput
              v-model:value="content"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
              placeholder="例如：这里春节效应显著 / 精酿增速首次超过白酒"
              maxlength="200"
              show-count
              clearable
            />
          </NFormItem>
        </NForm>

        <div class="text-xs text-ink-500 mt-1 mb-4">
          提示：标注会保存到本地浏览器，刷新页面不会丢失。
        </div>

        <NSpace justify="end">
          <NButton quaternary size="small" @click="handleCancel">
            取消
          </NButton>
          <NButton
            type="primary"
            size="small"
            @click="handleConfirm"
            class="!bg-champagne-500 !text-ink-950 hover:!bg-champagne-400"
          >
            <template #icon>
              <Save class="w-3.5 h-3.5" />
            </template>
            {{ initialContent ? '保存修改' : '添加标注' }}
          </NButton>
        </NSpace>
      </div>
    </NCard>
  </NModal>
</template>
