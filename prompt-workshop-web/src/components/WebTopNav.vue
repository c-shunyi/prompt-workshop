<script setup lang="ts">
import { useRouter } from 'vue-router'
import { authState, logoutUser, userDisplayName } from '../modules/auth'

const props = withDefaults(
  defineProps<{
    active?: 'home' | 'write' | 'profile'
  }>(),
  {
    active: 'home',
  },
)

const router = useRouter()

function goHome() {
  void router.push('/')
}

function goLogin() {
  void router.push('/login')
}

function goRegister() {
  void router.push('/register')
}

function goProfile() {
  void router.push('/profile')
}

function logout() {
  logoutUser()
  void router.replace('/')
}
</script>

<template>
  <header class="site-nav">
    <button class="site-nav__brand" type="button" @click="goHome">
      <span class="site-nav__brand-mark">PW</span>
      <span class="site-nav__brand-copy">
        <strong>Prompt Workshop</strong>
        <small>文章分享平台</small>
      </span>
    </button>

    <nav class="site-nav__links">
      <button
        class="site-nav__link"
        :class="{ 'site-nav__link--active': props.active === 'home' }"
        type="button"
        @click="goHome"
      >
        首页
      </button>
      <button
        class="site-nav__link"
        :class="{ 'site-nav__link--active': props.active === 'profile' }"
        type="button"
        @click="goProfile"
      >
        我的
      </button>
    </nav>

    <div class="site-nav__center">
      <slot name="center" />
    </div>

    <div class="site-nav__actions">
      <template v-if="authState.currentUser">
        <span class="site-nav__welcome">{{ userDisplayName }}</span>
        <button class="ghost-btn site-nav__action" type="button" @click="goProfile">个人中心</button>
        <button class="ghost-btn site-nav__action" type="button" @click="logout">退出</button>
      </template>
      <template v-else>
        <button class="ghost-btn site-nav__action" type="button" @click="goLogin">登录</button>
        <button class="primary-btn site-nav__action" type="button" @click="goRegister">注册</button>
      </template>
    </div>
  </header>
</template>
