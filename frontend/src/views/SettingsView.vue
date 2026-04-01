<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiClient } from '@/api/ApiClient.js';
import { useNotificationStore } from '@/stores/useNotificationStore.js';
import AppButton from '@/components/common/AppButton.vue';

const notif = useNotificationStore();
const olxConnected = ref(false);
const olxExpiresAt = ref('');
const isChecking = ref(true);
const isConnecting = ref(false);

async function checkStatus() {
  isChecking.value = true;
  try {
    const { data } = await apiClient.get<{ connected: boolean; expiresAt?: string }>('/auth/olx/status');
    olxConnected.value = data.connected;
    olxExpiresAt.value = data.expiresAt ? new Date(data.expiresAt).toLocaleString('pl-PL') : '';
  } finally {
    isChecking.value = false;
  }
}

async function connect() {
  isConnecting.value = true;
  try {
    const { data } = await apiClient.get<{ url: string }>('/auth/olx/url');
    const win = window.open(data.url, '_blank', 'width=700,height=600');
    // Poll for token
    const timer = setInterval(async () => {
      const { data: s } = await apiClient.get<{ connected: boolean }>('/auth/olx/status');
      if (s.connected) {
        clearInterval(timer);
        win?.close();
        await checkStatus();
        notif.add('Połączono z OLX!', 'success');
        isConnecting.value = false;
      }
    }, 2000);
    setTimeout(() => { clearInterval(timer); isConnecting.value = false; }, 120000);
  } catch (e) {
    notif.add((e as Error).message, 'error');
    isConnecting.value = false;
  }
}

async function disconnect() {
  await apiClient.delete('/auth/olx/disconnect');
  olxConnected.value = false;
  notif.add('Rozłączono z OLX.', 'info');
}

onMounted(checkStatus);
</script>

<template>
  <div class="container">
    <h1>Ustawienia</h1>

    <section class="card">
      <h2>Konto OLX</h2>

      <div v-if="isChecking" class="checking">Sprawdzanie...</div>
      <template v-else>
        <div class="status" :class="olxConnected ? 'status--ok' : 'status--err'">
          {{ olxConnected ? '✓ Połączono z OLX' : '✗ Nie połączono' }}
          <span v-if="olxExpiresAt" class="expires">Token ważny do: {{ olxExpiresAt }}</span>
        </div>

        <div class="btn-row">
          <AppButton v-if="!olxConnected" :loading="isConnecting" @click="connect">
            Połącz z OLX
          </AppButton>
          <AppButton v-else variant="danger" @click="disconnect">Rozłącz</AppButton>
        </div>
      </template>
    </section>

    <section class="card">
      <h2>Ważne informacje</h2>
      <div class="info-list">
        <div class="info-item">
          <strong>Zdjęcia i OLX API</strong>
          <p>OLX wymaga publicznie dostępnych URL zdjęć. Gdy publikujesz lokalnie (<code>localhost</code>), OLX nie będzie mógł pobrać zdjęć. Uruchom tunel:</p>
          <code class="code-block">npx localtunnel --port 3001</code>
          <p>Następnie ustaw <code>PUBLIC_BASE_URL</code> w pliku <code>.env</code> na adres z tunelu i zrestartuj backend.</p>
        </div>
        <div class="info-item">
          <strong>Rejestracja aplikacji OLX</strong>
          <p>Aby uzyskać <code>OLX_CLIENT_ID</code> i <code>OLX_CLIENT_SECRET</code>, zarejestruj aplikację na <a href="https://developer.olx.pl" target="_blank">developer.olx.pl</a>.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.container { max-width: 600px; margin: 0 auto; padding: 32px 20px; }
h1 { font-size: 28px; font-weight: 700; margin-bottom: 24px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
h2 { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
.checking { color: #9ca3af; }
.status { font-size: 15px; font-weight: 600; margin-bottom: 14px; display: flex; flex-direction: column; gap: 4px; }
.status--ok { color: #065f46; }
.status--err { color: #dc2626; }
.expires { font-size: 12px; font-weight: 400; color: #6b7280; }
.btn-row { display: flex; gap: 10px; }
.info-list { display: flex; flex-direction: column; gap: 16px; }
.info-item { font-size: 14px; }
.info-item p { color: #6b7280; margin: 6px 0; line-height: 1.6; }
.info-item a { color: #2563eb; }
.code-block { display: block; background: #1e1e2e; color: #a6e3a1; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin: 8px 0; }
code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
</style>
