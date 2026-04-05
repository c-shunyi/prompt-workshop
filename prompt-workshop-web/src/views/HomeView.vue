<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE, authState } from '../modules/auth'

const router = useRouter()
const HOME_REDIRECT_DELAY = 1800

let redirectTimer: ReturnType<typeof window.setTimeout> | null = null

function openLogin() {
  void router.push('/login')
}

function openRegister() {
  void router.push('/register')
}

onMounted(() => {
  redirectTimer = window.setTimeout(() => {
    void router.replace(authState.currentUser ? '/profile' : '/login')
  }, HOME_REDIRECT_DELAY)
})

onBeforeUnmount(() => {
  if (redirectTimer) {
    window.clearTimeout(redirectTimer)
    redirectTimer = null
  }
})
</script>

<template>
  <div class="user-shell">
    <section class="landing-card">
      <div class="landing-copy">
        <p class="eyebrow">Prompt Workshop Web</p>
        <h1>先进入首页，再跳转到 /login</h1>
        <p class="landing-text">
          这是用户端首页。页面默认先展示欢迎内容，随后自动跳转到 <code>/login</code>；如果用户已经登录，就会进入
          <code>/profile</code>。
        </p>

        <div class="landing-actions">
          <button class="primary-btn" type="button" @click="openLogin">立即登录</button>
          <button class="ghost-btn" type="button" @click="openRegister">去注册</button>
        </div>

        <div class="hero-pills">
          <span>自动跳转 /login</span>
          <span>支持 /register</span>
          <span>登录后进入 /profile</span>
        </div>
      </div>

      <div class="landing-panel">
        <p class="status-label">当前提示</p>
        <p class="status-message" :data-type="authState.feedbackType">{{ authState.feedbackMessage }}</p>
        <p class="status-meta">接口地址：{{ API_BASE }}/users</p>
      </div>
    </section>
  </div>
</template>
