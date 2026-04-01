<script setup lang="ts">
import { ref } from 'vue';
import { searchApi } from '@/api/searchApi.js';
import { useNotificationStore } from '@/stores/useNotificationStore.js';
import AppButton from '@/components/common/AppButton.vue';
import type { ListingWithDescription } from '@/types/Types.js';

const props = defineProps<{ keywords: string }>();
const emit = defineEmits<{ use: [description: string]; close: [] }>();

const notif = useNotificationStore();
const listings = ref<ListingWithDescription[]>([]);
const isLoading = ref(false);
const expanded = ref<Set<string>>(new Set());
const fetched = ref(false);

async function fetch() {
  if (!props.keywords.trim()) {
    notif.add('Brak słów kluczowych do wyszukania.', 'error');
    return;
  }
  isLoading.value = true;
  try {
    listings.value = await searchApi.fetchDescriptions(props.keywords);
    fetched.value = true;
    if (listings.value.length === 0) {
      notif.add('Nie znaleziono opisów dla podanych słów kluczowych.', 'info');
    }
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    isLoading.value = false;
  }
}

function toggleExpand(id: string) {
  const next = new Set(expanded.value);
  next.has(id) ? next.delete(id) : next.add(id);
  expanded.value = next;
}

function useDescription(desc: string) {
  emit('use', desc);
  notif.add('Opis wstawiony do edytora.', 'success');
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="panel">
      <div class="panel-header">
        <div>
          <h2>📋 Przykładowe opisy z OLX</h2>
          <p class="subhead">Szukam: <strong>{{ keywords }}</strong></p>
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="panel-body">
        <!-- Initial fetch -->
        <div v-if="!fetched" class="empty-state">
          <p>Pobierz opisy podobnych ogłoszeń z OLX aby zainspirować się do napisania własnego.</p>
          <AppButton :loading="isLoading" @click="fetch">
            🔍 Pobierz opisy z OLX
          </AppButton>
        </div>

        <!-- Loading -->
        <div v-else-if="isLoading" class="loading">
          <div class="spinner" />
          <span>Pobieram opisy ogłoszeń...</span>
        </div>

        <!-- Results -->
        <template v-else-if="listings.length > 0">
          <div v-for="l in listings" :key="l.olxId" class="listing-card">
            <div class="listing-header">
              <div class="listing-meta">
                <a :href="l.url" target="_blank" rel="noopener" class="listing-title">
                  {{ l.title }} ↗
                </a>
                <span class="listing-price">{{ l.price.toLocaleString('pl-PL') }} PLN</span>
                <span class="listing-city">{{ l.locationCity }}</span>
              </div>
              <button class="expand-btn" @click="toggleExpand(l.olxId)">
                {{ expanded.has(l.olxId) ? '▲ Zwiń' : '▼ Rozwiń' }}
              </button>
            </div>

            <div class="listing-desc" :class="{ 'listing-desc--expanded': expanded.has(l.olxId) }">
              {{ l.description || 'Brak opisu' }}
            </div>

            <div class="listing-actions">
              <AppButton variant="secondary" @click="useDescription(l.description)">
                Użyj tego opisu
              </AppButton>
            </div>
          </div>

          <div class="refetch">
            <AppButton variant="ghost" :loading="isLoading" @click="fetch">
              🔄 Odśwież
            </AppButton>
          </div>
        </template>

        <!-- No results -->
        <div v-else class="empty-state">
          <p>Nie znaleziono ogłoszeń z opisami dla: <strong>{{ keywords }}</strong></p>
          <AppButton variant="ghost" :loading="isLoading" @click="fetch">
            🔄 Spróbuj ponownie
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  z-index: 1000; display: flex; justify-content: flex-end;
}
.panel {
  width: 100%; max-width: 540px; background: #fff;
  height: 100%; display: flex; flex-direction: column;
  box-shadow: -4px 0 24px rgba(0,0,0,0.15);
}
.panel-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 20px 24px; border-bottom: 1px solid #e5e7eb;
  position: sticky; top: 0; background: #fff; z-index: 1;
}
h2 { font-size: 18px; font-weight: 700; margin: 0 0 2px; }
.subhead { font-size: 13px; color: #6b7280; margin: 0; }
.close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #9ca3af; padding: 4px; }
.close-btn:hover { color: #111827; }

.panel-body { flex: 1; overflow-y: auto; padding: 16px 24px; display: flex; flex-direction: column; gap: 14px; }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 40px 0; text-align: center; color: #6b7280; font-size: 14px; }
.loading { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 0; color: #6b7280; }
.spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.listing-card {
  border: 1px solid #e5e7eb; border-radius: 12px;
  padding: 14px; display: flex; flex-direction: column; gap: 10px;
}
.listing-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.listing-meta { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.listing-title {
  font-size: 14px; font-weight: 600; color: #2563eb;
  text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.listing-title:hover { text-decoration: underline; }
.listing-price { font-size: 15px; font-weight: 700; color: #7c3aed; }
.listing-city { font-size: 12px; color: #9ca3af; }
.expand-btn {
  background: none; border: 1px solid #e5e7eb; border-radius: 6px;
  padding: 4px 10px; font-size: 12px; color: #6b7280; cursor: pointer; white-space: nowrap; flex-shrink: 0;
}
.expand-btn:hover { background: #f9fafb; }

.listing-desc {
  font-size: 13px; color: #374151; line-height: 1.6; white-space: pre-wrap;
  max-height: 80px; overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
}
.listing-desc--expanded {
  max-height: none;
  -webkit-mask-image: none;
  mask-image: none;
}

.listing-actions { display: flex; gap: 8px; }
.refetch { display: flex; justify-content: center; padding-top: 8px; }
</style>
