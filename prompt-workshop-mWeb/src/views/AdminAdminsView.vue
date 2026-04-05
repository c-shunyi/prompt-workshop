<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { adminState, createAdminAccount, loadAdminAccounts, loadDashboard, type AdminInfo } from '../modules/admin'

const createDialogVisible = ref(false)

const createAdminForm = reactive({
  username: '',
  password: '',
  nickname: '',
  role: 'admin',
})

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

async function submitCreateAdmin() {
  if (!createAdminForm.username || !createAdminForm.password) {
    ElMessage.warning('请完整填写新管理员账号和密码')
    return
  }

  const success = await createAdminAccount(createAdminForm)

  if (!success) {
    return
  }

  createAdminForm.username = ''
  createAdminForm.password = ''
  createAdminForm.nickname = ''
  createAdminForm.role = 'admin'
  createDialogVisible.value = false
  await loadDashboard({ silent: true })
  await loadAdminAccounts({ page: 1, silent: true })
}

function openCreateDialog() {
  createDialogVisible.value = true
}

function closeCreateDialog() {
  createDialogVisible.value = false
}

function adminStatusType(row: AdminInfo) {
  return row.status === 1 ? 'success' : 'danger'
}

function handlePageChange(page: number) {
  void loadAdminAccounts({ page })
}

function handlePageSizeChange(pageSize: number) {
  void loadAdminAccounts({ page: 1, pageSize })
}

onMounted(() => {
  void loadAdminAccounts({ silent: true })
})
</script>

<template>
  <section class="admin-page">
    <article class="admin-panel admin-panel--table">
      <div class="admin-panel__head">
        <div>
          <p class="admin-panel__eyebrow">管理员列表</p>
          <h3 class="admin-panel__title">已有后台账号</h3>
        </div>

        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          创建管理员
        </el-button>
      </div>

      <el-table
        v-loading="adminState.adminsLoading"
        :data="adminState.adminList"
        stripe
        empty-text="当前账号无权限查看管理员列表"
      >
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column prop="nickname" label="昵称" min-width="140">
          <template #default="{ row }">
            {{ row.nickname || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" min-width="140" />
        <el-table-column prop="status" label="状态" min-width="110">
          <template #default="{ row }">
            <el-tag :type="adminStatusType(row)" round>
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" min-width="180">
          <template #default="{ row }">
            {{ formatDate(row.lastLoginAt) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="admin-table-pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :current-page="adminState.adminPagination.page"
          :page-size="adminState.adminPagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="adminState.adminPagination.total"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </article>

    <el-dialog v-model="createDialogVisible" title="创建管理员" width="560px" @close="closeCreateDialog">
      <el-form :model="createAdminForm" label-position="top" @submit.prevent="submitCreateAdmin">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="用户名">
              <el-input v-model.trim="createAdminForm.username" placeholder="新管理员用户名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称">
              <el-input v-model.trim="createAdminForm.nickname" placeholder="例如 内容运营" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="密码">
              <el-input v-model="createAdminForm.password" type="password" show-password placeholder="设置登录密码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色">
              <el-select v-model="createAdminForm.role" class="admin-panel__full-width">
                <el-option label="普通管理员" value="admin" />
                <el-option label="超级管理员" value="super_admin" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="closeCreateDialog">取消</el-button>
        <el-button type="primary" :loading="adminState.loading" @click="submitCreateAdmin">
          确认创建
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>
