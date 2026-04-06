<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, UserFilled } from '@element-plus/icons-vue'
import { adminState, getRememberedAdminLogin, loginAdmin } from '../modules/admin'

const router = useRouter()
const rememberedLogin = getRememberedAdminLogin()

const loginForm = reactive({
  username: rememberedLogin.username,
  password: rememberedLogin.password,
  rememberPassword: rememberedLogin.rememberPassword,
})

async function submitLogin() {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入管理员用户名和密码')
    return
  }

  const success = await loginAdmin(
    {
      username: loginForm.username,
      password: loginForm.password,
    },
    {
      rememberPassword: loginForm.rememberPassword,
    },
  )

  if (success) {
    void router.replace('/dashboard/overview')
  }
}
</script>

<template>
  <div class="admin-login-page">
    <div class="admin-login-card">
      <div class="admin-login-header">
        <p class="admin-login-eyebrow">Prompt Workshop Admin</p>
        <h1 class="admin-login-title">管理后台</h1>
        <p class="admin-login-desc">请使用管理员账号登录</p>
      </div>

      <el-alert
        v-if="adminState.feedbackMessage && adminState.feedbackType === 'error'"
        :title="adminState.feedbackMessage"
        :type="adminState.feedbackType"
        show-icon
        class="admin-login-alert"
        :closable="false"
      />

      <el-form :model="loginForm" @submit.prevent="submitLogin" class="admin-login-form">
        <el-form-item>
          <el-input
            v-model.trim="loginForm.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="UserFilled"
            autocomplete="username"
            @keyup.enter="submitLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            autocomplete="current-password"
            @keyup.enter="submitLogin"
          />
        </el-form-item>

        <div class="admin-login-options">
          <el-checkbox v-model="loginForm.rememberPassword">记住密码</el-checkbox>
          <span class="admin-login-options__hint">会保存在当前浏览器</span>
        </div>

        <el-button
          type="primary"
          size="large"
          class="admin-login-btn"
          :loading="adminState.loading"
          @click="submitLogin"
        >
          登 录
        </el-button>
      </el-form>
    </div>
  </div>
</template>
