<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    minHeight?: number
  }>(),
  {
    modelValue: '',
    placeholder: '请输入正文内容',
    minHeight: 360,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = shallowRef<IDomEditor | null>(null)

const toolbarConfig: Partial<IToolbarConfig> = {
  modalAppendToBody: true,
  toolbarKeys: [
    'headerSelect',
    '|',
    'bold',
    'italic',
    'underline',
    'through',
    {
      key: 'group-more-style',
      title: '更多样式',
      menuKeys: ['color', 'bgColor', 'fontSize', 'fontFamily', 'lineHeight', 'clearStyle'],
    },
    '|',
    'bulletedList',
    'numberedList',
    'blockquote',
    'codeBlock',
    '|',
    'insertLink',
    'insertTable',
    'divider',
    '|',
    'justifyLeft',
    'justifyCenter',
    'justifyRight',
    '|',
    'undo',
    'redo',
  ],
}

const editorConfig = computed<Partial<IEditorConfig>>(() => ({
  placeholder: props.placeholder,
  autoFocus: false,
}))

const editorStyle = computed(() => ({
  '--editor-min-height': `${props.minHeight}px`,
}))

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor
}

function handleModelValueUpdate(value: string) {
  emit('update:modelValue', value)
}

onBeforeUnmount(() => {
  const editor = editorRef.value

  if (editor) {
    editor.destroy()
  }
})
</script>

<template>
  <div class="rich-text-editor" :style="editorStyle">
    <Toolbar
      class="rich-text-editor__toolbar"
      :editor="editorRef"
      :default-config="toolbarConfig"
      mode="default"
    />
    <Editor
      class="rich-text-editor__content"
      :model-value="modelValue"
      :default-config="editorConfig"
      mode="default"
      @onCreated="handleCreated"
      @update:modelValue="handleModelValueUpdate"
    />
  </div>
</template>

<style scoped>
.rich-text-editor {
  border: 1px solid rgba(42, 66, 56, 0.12);
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.88);
}

.rich-text-editor__toolbar {
  border-bottom: 1px solid rgba(42, 66, 56, 0.1);
}

.rich-text-editor__content :deep(.w-e-text-container) {
  min-height: var(--editor-min-height);
}

.rich-text-editor__content :deep(.w-e-scroll) {
  min-height: var(--editor-min-height);
}

.rich-text-editor__content :deep([data-slate-editor]) {
  min-height: calc(var(--editor-min-height) - 2px);
  padding: 14px 16px;
}

.rich-text-editor :deep(.w-e-bar) {
  background: rgba(244, 239, 230, 0.66);
}

.rich-text-editor :deep(.w-e-text-container) {
  background: transparent;
}

:global(.w-e-modal),
:global(.w-e-drop-panel),
:global(.w-e-select-list) {
  z-index: 2600 !important;
}
</style>
