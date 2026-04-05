<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE, authState, authSummary, registerUser } from '../modules/auth'

const router = useRouter()

const form = reactive({
  username: '',
  email: '',
  password: '',
  nickname: '',
})

async function submitRegister() {
  const success = await registerUser(form)

  if (success) {
    void router.replace('/profile')
  }
}

function openLogin() {
  void router.push('/login')
}

function openHome() {
  void router.push('/')
}
</script>

<template>
  <div class="user-shell">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">User Register</p>
        <h1>注册后直接进入个人中心</h1>
        <p class="hero-text">
          当前页面路由是 <code>/register</code>。注册成功后会自动登录，并跳转到 <code>/profile</code>。
        </p>

        <div class="hero-pills">
          <span>API：{{ API_BASE }}</span>
          <span>当前路由：/register</span>
        </div>
      </div>

      <div class="status-panel">
        <p class="status-label">当前提示</p>
        <p class="status-message" :data-type="authState.feedbackType">{{ authState.feedbackMessage }}</p>
        <p class="status-meta">{{ authSummary }}</p>
      </div>
    </section>

    <main class="content-grid">
      <section class="panel auth-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">注册页</p>
            <h2>创建账号</h2>
          </div>

          <button class="ghost-btn" type="button" @click="openHome">返回首页</button>
        </div>

        <form class="form-grid" @submit.prevent="submitRegister">
          <label>
            <span>用户名</span>
            <input v-model.trim="form.username" placeholder="例如 shunyi" required />
          </label>

          <label>
            <span>邮箱</span>
            <input v-model.trim="form.email" type="email" placeholder="name@example.com" required />
          </label>

          <label>
            <span>昵称</span>
            <input v-model.trim="form.nickname" placeholder="展示名称，可选" />
          </label>

          <label>
            <span>密码</span>
            <input v-model="form.password" type="password" placeholder="输入你的密码" required />
          </label>

          <button class="primary-btn" type="submit" :disabled="authState.loading">
            {{ authState.loading ? '注册中...' : '注册并登录' }}
          </button>
        </form>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">已有账号</p>
            <h2>直接去登录</h2>
          </div>

          <button class="ghost-btn" type="button" @click="openLogin">去 /login</button>
        </div>

        <div class="journey-list">
          <article>
            <strong>当前地址</strong>
            <p>用户注册页现在是独立的 <code>/register</code> 路由。</p>
          </article>
          <article>
            <strong>切换登录</strong>
            <p>已有账号时，可以直接跳到 <code>/login</code> 使用已有账号登录。</p>
          </article>
          <article>
            <strong>注册完成</strong>
            <p>注册成功后会自动进入 <code>/profile</code>。</p>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>
