<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { pinyin } from 'pinyin-pro'
import {
  adminState,
  createCategory,
  deleteCategoryItem,
  loadCategories,
  loadDashboard,
  updateCategoryItem,
  type CategoryItem,
} from '../modules/admin'

const createCategoryForm = reactive({
  name: '',
  slug: '',
  sort: 0,
  status: 1,
})
const createDialogVisible = ref(false)
const createSlugManuallyEdited = ref(false)

const editDialogVisible = ref(false)
const editingCategoryId = ref<number | null>(null)
const editingCategoryForm = reactive({
  name: '',
  slug: '',
  sort: 0,
  status: 1,
})
const editSlugManuallyEdited = ref(false)

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

function generateSlug(value: string) {
  const normalized = pinyin(value.trim(), {
    toneType: 'none',
    type: 'array',
    nonZh: 'consecutive',
    v: false,
  })

  return normalized
    .map((item) =>
      String(item)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    )
    .filter(Boolean)
    .join('-')
    .replace(/-+/g, '-')
}

watch(
  () => createCategoryForm.name,
  (value) => {
    if (createSlugManuallyEdited.value) {
      return
    }

    createCategoryForm.slug = generateSlug(value)
  },
)

watch(
  () => editingCategoryForm.name,
  (value) => {
    if (editSlugManuallyEdited.value) {
      return
    }

    editingCategoryForm.slug = generateSlug(value)
  },
)

async function submitCreateCategory() {
  if (!createCategoryForm.name || !createCategoryForm.slug) {
    ElMessage.warning('请完整填写分类名称和 slug')
    return
  }

  const success = await createCategory({
    name: createCategoryForm.name.trim(),
    slug: createCategoryForm.slug.trim(),
    sort: Number(createCategoryForm.sort) || 0,
    status: createCategoryForm.status,
  })

  if (!success) {
    return
  }

  createCategoryForm.name = ''
  createCategoryForm.slug = ''
  createCategoryForm.sort = 0
  createCategoryForm.status = 1
  createSlugManuallyEdited.value = false
  createDialogVisible.value = false
  await loadDashboard({ silent: true })
  await loadCategories({ page: 1, silent: true })
}

function openCreateDialog() {
  createCategoryForm.name = ''
  createCategoryForm.slug = ''
  createCategoryForm.sort = 0
  createCategoryForm.status = 1
  createSlugManuallyEdited.value = false
  createDialogVisible.value = true
}

function closeCreateDialog() {
  createDialogVisible.value = false
}

function handleCreateSlugInput() {
  createSlugManuallyEdited.value = true
}

function startEditCategory(category: CategoryItem) {
  editingCategoryId.value = category.id
  editingCategoryForm.name = category.name
  editingCategoryForm.slug = category.slug
  editingCategoryForm.sort = category.sort
  editingCategoryForm.status = category.status
  editSlugManuallyEdited.value = false
  editDialogVisible.value = true
}

function cancelEditCategory() {
  editDialogVisible.value = false
  editingCategoryId.value = null
  editingCategoryForm.name = ''
  editingCategoryForm.slug = ''
  editingCategoryForm.sort = 0
  editingCategoryForm.status = 1
  editSlugManuallyEdited.value = false
}

function handleEditSlugInput() {
  editSlugManuallyEdited.value = true
}

async function saveCategory(categoryId: number) {
  if (!editingCategoryForm.name || !editingCategoryForm.slug) {
    ElMessage.warning('分类名称和 slug 不能为空')
    return
  }

  const success = await updateCategoryItem(categoryId, {
    name: editingCategoryForm.name.trim(),
    slug: editingCategoryForm.slug.trim(),
    sort: Number(editingCategoryForm.sort) || 0,
    status: editingCategoryForm.status,
  })

  if (!success) {
    return
  }

  cancelEditCategory()
  await loadDashboard({ silent: true })
  await loadCategories({ silent: true })
}

async function removeCategory(categoryId: number) {
  const success = await deleteCategoryItem(categoryId)

  if (!success) {
    return
  }

  if (editingCategoryId.value === categoryId) {
    cancelEditCategory()
  }

  await loadDashboard({ silent: true })
  const targetPage =
    adminState.categories.length === 1 && adminState.categoryPagination.page > 1
      ? adminState.categoryPagination.page - 1
      : adminState.categoryPagination.page
  await loadCategories({ page: targetPage, silent: true })
}

function handlePageChange(page: number) {
  void loadCategories({ page })
}

function handlePageSizeChange(pageSize: number) {
  void loadCategories({ page: 1, pageSize })
}

onMounted(() => {
  void loadCategories({ silent: true })
})
</script>

<template>
  <section class="admin-page">
    <article class="admin-panel admin-panel--table">
      <div class="admin-panel__head">
        <div>
          <p class="admin-panel__eyebrow">分类管理</p>
          <h3 class="admin-panel__title">文章分类列表</h3>
        </div>

        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          创建分类
        </el-button>
      </div>

      <el-table
        v-loading="adminState.categoriesLoading"
        :data="adminState.categories"
        stripe
        empty-text="当前还没有分类"
      >
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="slug" label="Slug" min-width="180" />
        <el-table-column prop="sort" label="排序" min-width="120" />
        <el-table-column prop="status" label="状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" round>
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="180">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="220" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button size="small" plain @click="startEditCategory(row)">编辑</el-button>
              <el-popconfirm
                title="删除后该分类下文章会变成未分类，确认继续吗？"
                confirm-button-text="确认删除"
                cancel-button-text="取消"
                @confirm="removeCategory(row.id)"
              >
                <template #reference>
                  <el-button size="small" type="danger" plain :loading="adminState.loading">删除</el-button>
                </template>
              </el-popconfirm>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div class="admin-table-pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :current-page="adminState.categoryPagination.page"
          :page-size="adminState.categoryPagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="adminState.categoryPagination.total"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </article>

    <el-dialog v-model="createDialogVisible" title="创建分类" width="620px" @close="closeCreateDialog">
      <el-form :model="createCategoryForm" label-position="top" @submit.prevent="submitCreateCategory">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="分类名称">
              <el-input v-model.trim="createCategoryForm.name" placeholder="例如 前端开发" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Slug">
              <el-input
                v-model.trim="createCategoryForm.slug"
                placeholder="会根据中文名称自动生成"
                @input="handleCreateSlugInput"
              />
              <div class="admin-form-hint">根据中文名称自动转拼音生成，可手动修改。</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="排序值">
              <el-input-number v-model="createCategoryForm.sort" class="admin-panel__full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="createCategoryForm.status" class="admin-panel__full-width">
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="closeCreateDialog">取消</el-button>
        <el-button type="primary" :loading="adminState.loading" @click="submitCreateCategory">
          确认创建
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑分类" width="620px" @close="cancelEditCategory">
      <el-form :model="editingCategoryForm" label-position="top">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="分类名称">
              <el-input v-model.trim="editingCategoryForm.name" placeholder="例如 前端开发" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Slug">
              <el-input
                v-model.trim="editingCategoryForm.slug"
                placeholder="根据中文名称自动生成"
                @input="handleEditSlugInput"
              />
              <div class="admin-form-hint">默认随中文名称自动更新，也可以手动修改。</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="排序值">
              <el-input-number v-model="editingCategoryForm.sort" class="admin-panel__full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="editingCategoryForm.status" class="admin-panel__full-width">
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="cancelEditCategory">取消</el-button>
        <el-button
          type="primary"
          :loading="adminState.loading"
          :disabled="editingCategoryId === null"
          @click="editingCategoryId !== null && saveCategory(editingCategoryId)"
        >
          保存修改
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>
