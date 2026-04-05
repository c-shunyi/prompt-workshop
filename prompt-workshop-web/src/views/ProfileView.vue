<script setup lang="ts">
import { useRouter } from 'vue-router'
import { authState, loadProfile, logoutUser, userDisplayName } from '../modules/auth'

const router = useRouter()

function openHome() {
  void router.push('/')
}

function logout() {
  logoutUser()
  void router.replace('/login')
}
</script>

<template>
  <div class="user-shell">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">User Center</p>
        <h1>{{ userDisplayName }}，欢迎回来</h1>
        <p class="hero-text">
          当前页面路由是 <code>/profile</code>。这里已经是用户登录后的个人中心入口。
        </p>

        <div class="hero-pills">
          <span>当前路由：/profile</span>
          <span>状态：{{ authState.currentUser ? '已登录' : '未登录' }}</span>
        </div>
      </div>

      <div class="status-panel">
        <p class="status-label">当前提示</p>
        <p class="status-message" :data-type="authState.feedbackType">{{ authState.feedbackMessage }}</p>
        <p class="status-meta">登录成功后会自动进入这个页面。</p>
      </div>
    </section>

    <main class="content-grid single-column">
      <section class="panel profile-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">个人中心</p>
            <h2>当前用户资料</h2>
          </div>

          <div class="actions">
            <button class="ghost-btn" type="button" @click="openHome">返回首页</button>
            <button
              class="ghost-btn"
              type="button"
              :disabled="authState.profileLoading || !authState.token"
              @click="loadProfile()"
            >
              {{ authState.profileLoading ? '刷新中...' : '刷新资料' }}
            </button>
            <button class="ghost-btn danger" type="button" :disabled="!authState.token" @click="logout">
              退出登录
            </button>
          </div>
        </div>

        <div v-if="authState.currentUser" class="profile-card">
          <div class="profile-avatar">
            {{ userDisplayName.slice(0, 1).toUpperCase() }}
          </div>

          <div class="profile-info">
            <h3>{{ userDisplayName }}</h3>
            <p>@{{ authState.currentUser.username }}</p>
            <p>{{ authState.currentUser.email }}</p>
            <p>{{ authState.currentUser.bio || '还没有填写个人简介。' }}</p>
          </div>

          <dl class="profile-stats">
            <div>
              <dt>用户 ID</dt>
              <dd>{{ authState.currentUser.id }}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>{{ authState.currentUser.status === 1 ? '正常' : '禁用' }}</dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd>
                {{ authState.currentUser.createdAt ? new Date(authState.currentUser.createdAt).toLocaleString() : '-' }}
              </dd>
            </div>
          </dl>
        </div>

        <div v-else class="empty-state">
          <p>当前没有可展示的用户资料。</p>
          <p>请重新登录，或者返回首页重新进入。</p>
        </div>
      </section>
    </main>
  </div>
</template>
