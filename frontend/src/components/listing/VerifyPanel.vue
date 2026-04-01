<script setup lang="ts">
import { ref } from 'vue';
import { listingsApi } from '@/api/listingsApi.js';
import { useNotificationStore } from '@/stores/useNotificationStore.js';
import AppButton from '@/components/common/AppButton.vue';
import type { VerificationResult, VerificationSuggestion } from '@/types/Types.js';

const props = defineProps<{ listingId: number }>();
const emit = defineEmits<{ updated: []; close: [] }>();

const notif = useNotificationStore();
const result = ref<VerificationResult | null>(null);
const isVerifying = ref(false);
const dismissed = ref<Set<string>>(new Set());
const applying = ref<string | null>(null);
const regenerating = ref<string | null>(null);

const ELEMENT_LABELS: Record<string, string> = {
  title: 'Tytuł', description: 'Opis', price: 'Cena',
  photos: 'Zdjęcia', shipping: 'Wysyłka', city: 'Miasto', condition: 'Stan',
};
const SEVERITY_CONFIG = {
  error:   { label: 'Błąd',      cls: 'sev-error' },
  warning: { label: 'Ostrzeżenie', cls: 'sev-warning' },
  tip:     { label: 'Wskazówka',  cls: 'sev-tip' },
};

async function runVerification() {
  isVerifying.value = true;
  dismissed.value = new Set();
  result.value = null;
  try {
    result.value = await listingsApi.verify(props.listingId);
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    isVerifying.value = false;
  }
}

function dismiss(id: string) {
  dismissed.value = new Set([...dismissed.value, id]);
}

async function apply(s: VerificationSuggestion) {
  if (!s.newValue) return;
  applying.value = s.id;
  try {
    if (s.element === 'title') {
      await listingsApi.update(props.listingId, { title: s.newValue });
    } else if (s.element === 'description') {
      await listingsApi.update(props.listingId, { description: s.newValue });
    } else if (s.element === 'price') {
      const price = parseFloat(s.newValue);
      if (!isNaN(price)) await listingsApi.setPrice(props.listingId, price);
    } else if (s.element === 'shipping') {
      await listingsApi.update(props.listingId, { shipping: true });
    } else if (s.element === 'city') {
      await listingsApi.update(props.listingId, { city: s.newValue });
    } else if (s.element === 'condition') {
      await listingsApi.update(props.listingId, { condition: s.newValue as never });
    }
    dismiss(s.id);
    notif.add('Zmiana zastosowana!', 'success');
    emit('updated');
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    applying.value = null;
  }
}

async function regenerate(s: VerificationSuggestion) {
  regenerating.value = s.id;
  const requestMap: Record<string, string> = {
    title: `Popraw tytuł ogłoszenia: ${s.message}`,
    description: `Popraw opis ogłoszenia: ${s.message}`,
  };
  const changeRequest = requestMap[s.element] ?? s.message;
  try {
    const regen = await listingsApi.regenerate(props.listingId, changeRequest);
    notif.add('Wygenerowano nową wersję! Kliknij "Weryfikuj ponownie".', 'success');
    // Refresh verification after short delay
    emit('updated');
    await runVerification();
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    regenerating.value = null;
  }
}

const scoreColor = (score: number) =>
  score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';

const visibleSuggestions = () =>
  (result.value?.suggestions ?? []).filter((s) => !dismissed.value.has(s.id));

// Auto-run on mount
runVerification();
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="panel">
      <div class="panel-header">
        <h2>🔍 Weryfikacja ogłoszenia</h2>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <!-- Loading -->
      <div v-if="isVerifying" class="loading">
        <div class="spinner" />
        <span>Claude analizuje ogłoszenie...</span>
      </div>

      <!-- Result -->
      <template v-else-if="result">
        <!-- Score -->
        <div class="score-section">
          <div class="score-circle" :style="{ borderColor: scoreColor(result.score) }">
            <span class="score-num" :style="{ color: scoreColor(result.score) }">{{ result.score }}</span>
            <span class="score-label">/ 100</span>
          </div>
          <div class="score-info">
            <div class="score-text" :style="{ color: scoreColor(result.score) }">
              {{ result.score >= 75 ? 'Dobre ogłoszenie' : result.score >= 50 ? 'Wymaga poprawy' : 'Słabe ogłoszenie' }}
            </div>
            <div class="score-hint">
              {{ visibleSuggestions().length === 0 ? 'Brak aktywnych sugestii' : `${visibleSuggestions().length} sugestii do rozpatrzenia` }}
            </div>
          </div>
        </div>

        <!-- Suggestions -->
        <div class="suggestions" v-if="visibleSuggestions().length > 0">
          <div
            v-for="s in visibleSuggestions()"
            :key="s.id"
            class="suggestion-card"
            :class="s.severity"
          >
            <div class="s-header">
              <span class="s-sev" :class="SEVERITY_CONFIG[s.severity].cls">
                {{ SEVERITY_CONFIG[s.severity].label }}
              </span>
              <span class="s-element">{{ ELEMENT_LABELS[s.element] }}</span>
              <button class="s-dismiss" @click="dismiss(s.id)" title="Odrzuć">✕</button>
            </div>
            <div class="s-title">{{ s.title }}</div>
            <div class="s-message">{{ s.message }}</div>

            <!-- New value preview -->
            <div v-if="s.newValue" class="s-value-box">
              <div class="s-value-label">Proponowana zmiana:</div>
              <div class="s-value-text">{{ s.element === 'price' ? `${s.newValue} PLN` : s.newValue }}</div>
            </div>

            <!-- Actions -->
            <div class="s-actions">
              <AppButton
                v-if="s.newValue"
                variant="secondary"
                :loading="applying === s.id"
                @click="apply(s)"
              >
                ✓ Zastosuj
              </AppButton>
              <AppButton
                v-if="s.element === 'title' || s.element === 'description'"
                variant="ghost"
                :loading="regenerating === s.id"
                @click="regenerate(s)"
              >
                🤖 Regeneruj
              </AppButton>
              <AppButton variant="ghost" @click="dismiss(s.id)">
                Odrzuć
              </AppButton>
            </div>
          </div>
        </div>

        <div v-else class="all-good">
          ✅ Wszystkie sugestie rozpatrzone!
        </div>

        <div class="panel-footer">
          <AppButton variant="ghost" @click="emit('close')">Zamknij</AppButton>
          <AppButton :loading="isVerifying" @click="runVerification">
            🔄 Weryfikuj ponownie
          </AppButton>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  z-index: 1000; display: flex; justify-content: flex-end;
}
.panel {
  width: 100%; max-width: 520px; background: #fff;
  height: 100%; overflow-y: auto;
  display: flex; flex-direction: column; gap: 0;
  box-shadow: -4px 0 24px rgba(0,0,0,0.15);
}
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; background: #fff; z-index: 1;
}
h2 { font-size: 18px; font-weight: 700; margin: 0; }
.close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #9ca3af; padding: 4px; }
.close-btn:hover { color: #111827; }

.loading { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 24px; color: #6b7280; }
.spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.score-section {
  display: flex; align-items: center; gap: 20px;
  padding: 24px; border-bottom: 1px solid #e5e7eb;
}
.score-circle {
  width: 80px; height: 80px; border-radius: 50%; border: 4px solid;
  display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0;
}
.score-num { font-size: 28px; font-weight: 800; line-height: 1; }
.score-label { font-size: 11px; color: #9ca3af; }
.score-text { font-size: 16px; font-weight: 700; }
.score-hint { font-size: 13px; color: #6b7280; margin-top: 4px; }

.suggestions { display: flex; flex-direction: column; gap: 12px; padding: 16px 24px; flex: 1; }
.suggestion-card {
  border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px;
  display: flex; flex-direction: column; gap: 8px;
}
.suggestion-card.error { border-color: #fca5a5; background: #fff5f5; }
.suggestion-card.warning { border-color: #fcd34d; background: #fffbeb; }
.suggestion-card.tip { border-color: #a7f3d0; background: #f0fdf4; }

.s-header { display: flex; align-items: center; gap: 8px; }
.s-sev { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
.sev-error { background: #fee2e2; color: #dc2626; }
.sev-warning { background: #fef3c7; color: #d97706; }
.sev-tip { background: #d1fae5; color: #059669; }
.s-element { font-size: 12px; color: #6b7280; background: #f3f4f6; padding: 2px 8px; border-radius: 20px; }
.s-dismiss { margin-left: auto; background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 14px; padding: 2px 4px; }
.s-dismiss:hover { color: #374151; }
.s-title { font-size: 14px; font-weight: 700; color: #111827; }
.s-message { font-size: 13px; color: #4b5563; line-height: 1.5; }

.s-value-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
.s-value-label { font-size: 11px; font-weight: 600; color: #9ca3af; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.s-value-text { font-size: 13px; color: #111827; white-space: pre-wrap; line-height: 1.5; max-height: 120px; overflow-y: auto; }

.s-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.all-good { text-align: center; padding: 40px 24px; font-size: 16px; color: #059669; font-weight: 600; }

.panel-footer {
  display: flex; justify-content: space-between; gap: 10px;
  padding: 16px 24px; border-top: 1px solid #e5e7eb;
  position: sticky; bottom: 0; background: #fff;
}
</style>
