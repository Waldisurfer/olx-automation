<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { useNotificationStore } from '@/stores/useNotificationStore.js';
import { useAuthStore } from '@/stores/useAuthStore.js';

const router = useRouter();
const route = useRoute();
const notif = useNotificationStore();
const auth = useAuthStore();

function logout() {
  auth.logout();
  router.push('/auth');
}
</script>

<template>
  <div class="app">
    <nav v-if="route.path !== '/auth'" class="nav">
      <span class="brand" @click="router.push('/dashboard')">OLX Automation</span>
      <div class="links">
        <button @click="router.push('/dashboard')">Dashboard</button>
        <button @click="router.push('/listings/new')">+ Nowe</button>
        <button @click="router.push('/settings')">Ustawienia</button>
        <span class="user-info" v-if="auth.isLoggedIn">{{ auth.user?.email }}</span>
        <span class="user-info guest" v-else-if="auth.isGuest">Gość</span>
        <button class="logout" @click="logout">Wyloguj</button>
      </div>
    </nav>

    <main class="main">
      <RouterView />
    </main>

    <!-- Toast notifications -->
    <div class="toasts">
      <div
        v-for="n in notif.notifications"
        :key="n.id"
        :class="['toast', `toast--${n.type}`]"
        @click="notif.remove(n.id)"
      >
        {{ n.message }}
      </div>
    </div>
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; color: #111827; }
</style>

<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; }
.nav {
  background: #fff; border-bottom: 1px solid #e5e7eb;
  padding: 0 24px; height: 56px;
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; z-index: 50;
}
.brand { font-weight: 700; font-size: 16px; cursor: pointer; color: #7c3aed; }
.links { display: flex; gap: 4px; }
.links button {
  background: none; border: none; cursor: pointer;
  padding: 6px 14px; border-radius: 8px;
  font-size: 14px; color: #374151;
  transition: background 0.15s;
}
.links button:hover { background: #f3f4f6; }
.user-info { font-size: 13px; color: #6b7280; padding: 0 8px; }
.user-info.guest { color: #9ca3af; font-style: italic; }
.logout { color: #dc2626 !important; }
.main { flex: 1; }
.toasts { position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; z-index: 200; }
.toast {
  padding: 12px 20px; border-radius: 10px;
  font-size: 14px; font-weight: 500;
  cursor: pointer; max-width: 340px;
  animation: slideIn 0.25s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}
.toast--success { background: #d1fae5; color: #065f46; }
.toast--error   { background: #fee2e2; color: #dc2626; }
.toast--info    { background: #dbeafe; color: #1e40af; }
@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
