<script setup lang="ts">
import { adminState, loadDashboard, updateUserAccountStatus } from '../modules/admin'

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

async function updateUserStatus(userId: number, status: 0 | 1) {
  const success = await updateUserAccountStatus(userId, status)

  if (success) {
    await loadDashboard({ silent: true })
  }
}
</script>

<template>
  <section class="admin-page">
    <article class="admin-panel admin-panel--table">
      <div class="admin-panel__head">
        <div>
          <p class="admin-panel__eyebrow">用户管理</p>
          <h3 class="admin-panel__title">前台用户列表</h3>
        </div>
      </div>

      <el-table :data="adminState.userList" stripe empty-text="暂无前台用户">
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column prop="email" label="邮箱" min-width="220" />
        <el-table-column prop="nickname" label="昵称" min-width="140">
          <template #default="{ row }">
            {{ row.nickname || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" round>
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="180" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button
                size="small"
                type="success"
                plain
                :disabled="adminState.loading || row.status === 1"
                @click="updateUserStatus(row.id, 1)"
              >
                启用
              </el-button>
              <el-button
                size="small"
                type="danger"
                plain
                :disabled="adminState.loading || row.status === 0"
                @click="updateUserStatus(row.id, 0)"
              >
                禁用
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </article>
  </section>
</template>
