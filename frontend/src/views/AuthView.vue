<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/useAuthStore.js';
import { useNotificationStore } from '@/stores/useNotificationStore.js';

const router = useRouter();
const auth = useAuthStore();
const notif = useNotificationStore();

const mode = ref<'choose' | 'login' | 'register'>('choose');
const email = ref('');
const password = ref('');
const loading = ref(false);

function continueAsGuest() {
  auth.initGuest();
  router.push('/dashboard');
}

async function submit() {
  loading.value = true;
  try {
    if (mode.value === 'login') {
      await auth.login(email.value, password.value);
    } else {
      await auth.register(email.value, password.value);
    }
    router.push('/dashboard');
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="card">
      <div class="logo">🏷️</div>
      <h1>OLX Automation</h1>
      <p class="subtitle">Automatyzuj sprzedaż na OLX z pomocą AI</p>

      <template v-if="mode === 'choose'">
        <div class="options">
          <button class="btn btn--primary" @click="continueAsGuest">
            🚀 Wypróbuj bez logowania
          </button>
          <p class="or">lub</p>
          <button class="btn btn--outline" @click="mode = 'login'">
            Zaloguj się
          </button>
          <button class="btn btn--ghost" @click="mode = 'register'">
            Utwórz konto
          </button>
        </div>
        <p class="guest-note">
          Bez logowania Twoje ogłoszenia są widoczne tylko na tym urządzeniu i w tej przeglądarce.
        </p>
      </template>

      <template v-else>
        <h2>{{ mode === 'login' ? 'Zaloguj się' : 'Utwórz konto' }}</h2>
        <form @submit.prevent="submit" class="form">
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            required
            autocomplete="email"
          />
          <input
            v-model="password"
            type="password"
            placeholder="Hasło (min. 6 znaków)"
            required
            autocomplete="current-password"
            minlength="6"
          />
          <button class="btn btn--primary" type="submit" :disabled="loading">
            {{ loading ? 'Ładowanie...' : (mode === 'login' ? 'Zaloguj się' : 'Utwórz konto') }}
          </button>
        </form>
        <button class="btn btn--ghost" @click="mode = 'choose'">← Wróć</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  padding: 24px;
}
.card {
  background: #fff;
  border-radius: 20px;
  padding: 48px 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 40px rgba(124,58,237,0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}
.logo { font-size: 48px; }
h1 { font-size: 24px; font-weight: 800; color: #7c3aed; margin: 0; }
h2 { font-size: 18px; font-weight: 700; margin: 0; }
.subtitle { color: #6b7280; font-size: 14px; margin: 0; }
.options { display: flex; flex-direction: column; gap: 10px; width: 100%; }
.or { color: #9ca3af; font-size: 13px; margin: 4px 0; }
.guest-note { font-size: 12px; color: #9ca3af; line-height: 1.5; margin: 0; }
.form { display: flex; flex-direction: column; gap: 10px; width: 100%; }
input {
  padding: 11px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}
input:focus { border-color: #7c3aed; }
.btn {
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  width: 100%;
}
.btn--primary { background: #7c3aed; color: #fff; }
.btn--primary:hover:not(:disabled) { background: #6d28d9; }
.btn--primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn--outline { background: #fff; color: #7c3aed; border: 1.5px solid #7c3aed; }
.btn--outline:hover { background: #f5f3ff; }
.btn--ghost { background: none; color: #6b7280; font-weight: 400; }
.btn--ghost:hover { color: #374151; }
</style>
