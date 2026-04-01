<script setup lang="ts">
import { ref } from 'vue';
import AppButton from '@/components/common/AppButton.vue';

const props = defineProps<{ listingId: number }>();
const emit = defineEmits<{ regenerated: [result: { title: string; description: string; suggestedCategory: string; keywords: string[]; officialUrl?: string }] }>();

import { listingsApi } from '@/api/listingsApi.js';
import { useNotificationStore } from '@/stores/useNotificationStore.js';

const notif = useNotificationStore();
const changeRequest = ref('');
const isRegenerating = ref(false);
const isOpen = ref(true);

async function regenerate() {
  if (!changeRequest.value.trim()) {
    notif.add('Opisz co chcesz zmienić.', 'error');
    return;
  }
  isRegenerating.value = true;
  try {
    const result = await listingsApi.regenerate(props.listingId, changeRequest.value);
    emit('regenerated', result);
    notif.add('Opis wygenerowany ponownie!', 'success');
    changeRequest.value = '';
    isOpen.value = false;
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    isRegenerating.value = false;
  }
}
</script>

<template>
  <div class="panel">
    <button class="toggle" @click="isOpen = !isOpen">
      🔄 Regeneruj opis
      <span class="arrow">{{ isOpen ? '▲' : '▼' }}</span>
    </button>

    <div v-if="isOpen" class="body">
      <label>Co chcesz zmienić?</label>
      <textarea
        v-model="changeRequest"
        rows="3"
        placeholder="np. Napisz bardziej technicznie. Dodaj że sprzedaję bo kupuję nowszy model. Skróć opis o połowę. Dodaj że w cenie jest ładowarka."
        class="input"
      />
      <AppButton :loading="isRegenerating" @click="regenerate">
        🤖 Generuj nowy opis
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
.panel { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
.toggle {
  width: 100%; padding: 12px 16px; background: #f9fafb;
  border: none; cursor: pointer; font-size: 14px; font-weight: 600;
  color: #374151; display: flex; justify-content: space-between;
  align-items: center; transition: background 0.15s;
}
.toggle:hover { background: #f3f4f6; }
.arrow { color: #9ca3af; font-size: 11px; }
.body { padding: 16px; display: flex; flex-direction: column; gap: 10px; border-top: 1px solid #e5e7eb; }
label { font-size: 13px; font-weight: 600; color: #374151; }
.input {
  border: 1px solid #d1d5db; border-radius: 8px;
  padding: 10px 12px; font-size: 14px; font-family: inherit;
  outline: none; resize: vertical; width: 100%;
}
.input:focus { border-color: #7c3aed; }
</style>
