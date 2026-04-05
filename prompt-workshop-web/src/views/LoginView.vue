<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE, authState, authSummary, loginUser } from '../modules/auth'

const router = useRouter()

const form = reactive({
  account: '',
  password: '',
})

async function submitLogin() {
  const success = await loginUser(form)

  if (success) {
    void router.replace('/profile')
  }
}

function openRegister() {
  void router.push('/register')
}

function openHome() {
  void router.push('/')
}
</script>

<template>
  <div class="user-shell">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">User Auth</p>
        <h1>登录后开始使用</h1>
        <p class="hero-text">
          当前页面路由是 <code>/login</code>。你可以使用用户名或邮箱登录；如果还没有账号，直接点击下面的去注册按钮即可。
        </p>

        <div class="hero-pills">
          <span>API：{{ API_BASE }}</span>
          <span>当前路由：/login</span>
        </div>
      </div>

      <div class="status-panel">
        <p class="status-label">当前提示</p>
        <p class="status-message" :data-type="authState.feedbackType">{{ authState.feedbackMessage }}</p>
        <p class="status-meta">{{ authSummary }}</p>
      </div>
    </section>

    <main class="content-grid single-column">
      <section class="panel auth-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">登录页</p>
            <h2>账号登录</h2>
          </div>

          <button class="ghost-btn" type="button" @click="openHome">返回首页</button>
        </div>

        <form class="form-grid" @submit.prevent="submitLogin">
          <label>
            <span>用户名或邮箱</span>
            <input v-model.trim="form.account" placeholder="用户名或邮箱均可" required />
          </label>

          <label>
            <span>密码</span>
            <input v-model="form.password" type="password" placeholder="输入你的密码" required />
          </label>

          <button class="primary-btn" type="submit" :disabled="authState.loading">
            {{ authState.loading ? '登录中...' : '登录' }}
          </button>

          <button class="ghost-btn form-secondary-btn" type="button" @click="openRegister">
            去注册
          </button>
        </form>
      </section>
    </main>
  </div>
</template>
