<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, UserFilled } from '@element-plus/icons-vue'
import { API_BASE, adminState, loginAdmin } from '../modules/admin'

const router = useRouter()

const loginForm = reactive({
  username: '',
  password: '',
})

async function submitLogin() {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入管理员用户名和密码')
    return
  }

  const success = await loginAdmin(loginForm)

  if (success) {
    void router.replace('/dashboard')
  }
}
</script>

<template>
  <div class="admin-shell admin-auth-shell">
    <section class="hero-card">
      <div class="hero-copy">
        <el-space direction="vertical" :size="14" fill>
          <el-tag effect="dark" round type="success" class="hero-tag">Prompt Workshop Admin</el-tag>
          <h1>后台登录页</h1>
          <p class="hero-text">
            管理台现在有独立的 <code>/login</code> 路由。未登录访问后台时，会自动跳转到这里。
          </p>
          <el-space wrap>
            <el-tag round>{{ API_BASE }}/admin</el-tag>
            <el-tag round type="info">当前路由：/login</el-tag>
          </el-space>
        </el-space>
      </div>

      <el-card shadow="never" class="hero-side">
        <template #header>
          <div class="panel-title">登录提示</div>
        </template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="访问规则">
            未登录自动跳转
          </el-descriptions-item>
          <el-descriptions-item label="登录成功">
            进入 /dashboard
          </el-descriptions-item>
          <el-descriptions-item label="初始化命令">
            <code>pnpm admin:init</code>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </section>

    <el-alert
      :title="adminState.feedbackMessage"
      :type="adminState.feedbackType"
      show-icon
      class="status-alert"
      :closable="false"
    />

    <el-row :gutter="18" class="dashboard-grid">
      <el-col :xs="24" :lg="12">
        <el-card class="panel-card" shadow="hover">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-kicker">管理员入口</div>
                <div class="panel-title">登录管理台</div>
              </div>
            </div>
          </template>

          <el-form :model="loginForm" label-position="top" @submit.prevent="submitLogin">
            <el-form-item label="管理员用户名">
              <el-input
                v-model.trim="loginForm.username"
                placeholder="默认可用 admin"
                :prefix-icon="UserFilled"
              />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="loginForm.password"
                type="password"
                show-password
                placeholder="默认可用 123456"
                :prefix-icon="Lock"
              />
            </el-form-item>
            <el-button type="primary" class="submit-btn" :loading="adminState.loading" @click="submitLogin">
              登录管理台
            </el-button>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card class="panel-card" shadow="hover">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-kicker">说明</div>
                <div class="panel-title">后台访问流程</div>
              </div>
            </div>
          </template>

          <el-timeline>
            <el-timeline-item timestamp="1" placement="top">
              打开管理台时，根路径会先尝试进入 <code>/dashboard</code>。
            </el-timeline-item>
            <el-timeline-item timestamp="2" placement="top">
              如果当前没有有效登录态，路由守卫会自动重定向到 <code>/login</code>。
            </el-timeline-item>
            <el-timeline-item timestamp="3" placement="top">
              登录成功后，页面会跳转到 <code>/dashboard</code>。
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
