<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  adminState,
  createTagItem,
  deleteTagItem,
  loadDashboard,
  updateTagItem,
  type TagItem,
} from '../modules/admin'

const createTagForm = reactive({
  name: '',
})
const createDialogVisible = ref(false)

const editDialogVisible = ref(false)
const editingTagId = ref<number | null>(null)
const editingTagForm = reactive({
  name: '',
})

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

async function submitCreateTag() {
  if (!createTagForm.name) {
    ElMessage.warning('请输入标签名称')
    return
  }

  const success = await createTagItem({
    name: createTagForm.name.trim(),
  })

  if (!success) {
    return
  }

  createTagForm.name = ''
  createDialogVisible.value = false
  await loadDashboard({ silent: true })
}

function openCreateDialog() {
  createTagForm.name = ''
  createDialogVisible.value = true
}

function closeCreateDialog() {
  createDialogVisible.value = false
}

function startEditTag(tag: TagItem) {
  editingTagId.value = tag.id
  editingTagForm.name = tag.name
  editDialogVisible.value = true
}

function cancelEditTag() {
  editDialogVisible.value = false
  editingTagId.value = null
  editingTagForm.name = ''
}

async function saveTag(tagId: number) {
  if (!editingTagForm.name) {
    ElMessage.warning('标签名称不能为空')
    return
  }

  const success = await updateTagItem(tagId, {
    name: editingTagForm.name.trim(),
  })

  if (!success) {
    return
  }

  cancelEditTag()
  await loadDashboard({ silent: true })
}

async function removeTag(tagId: number) {
  const success = await deleteTagItem(tagId)

  if (!success) {
    return
  }

  if (editingTagId.value === tagId) {
    cancelEditTag()
  }

  await loadDashboard({ silent: true })
}
</script>

<template>
  <section class="admin-page">
    <article class="admin-panel admin-panel--table">
      <div class="admin-panel__head">
        <div>
          <p class="admin-panel__eyebrow">标签管理</p>
          <h3 class="admin-panel__title">文章标签列表</h3>
        </div>

        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          创建标签
        </el-button>
      </div>

      <el-table :data="adminState.tags" stripe empty-text="当前还没有标签">
        <el-table-column prop="name" label="标签名称" min-width="220" />
        <el-table-column prop="updatedAt" label="更新时间" min-width="180">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="220" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button size="small" plain @click="startEditTag(row)">编辑</el-button>
              <el-popconfirm
                title="删除标签后，不会删除文章，只会移除文章上的该标签，确认继续吗？"
                confirm-button-text="确认删除"
                cancel-button-text="取消"
                @confirm="removeTag(row.id)"
              >
                <template #reference>
                  <el-button size="small" type="danger" plain :loading="adminState.loading">删除</el-button>
                </template>
              </el-popconfirm>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </article>

    <el-dialog v-model="createDialogVisible" title="创建标签" width="520px" @close="closeCreateDialog">
      <el-form :model="createTagForm" label-position="top" @submit.prevent="submitCreateTag">
        <el-form-item label="标签名称">
          <el-input v-model.trim="createTagForm.name" placeholder="例如 Vue、Node.js、产品设计" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeCreateDialog">取消</el-button>
        <el-button type="primary" :loading="adminState.loading" @click="submitCreateTag">
          确认创建
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑标签" width="520px" @close="cancelEditTag">
      <el-form :model="editingTagForm" label-position="top">
        <el-form-item label="标签名称">
          <el-input v-model.trim="editingTagForm.name" placeholder="输入新的标签名称" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cancelEditTag">取消</el-button>
        <el-button
          type="primary"
          :loading="adminState.loading"
          :disabled="editingTagId === null"
          @click="editingTagId !== null && saveTag(editingTagId)"
        >
          保存修改
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>
