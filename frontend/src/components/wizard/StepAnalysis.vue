<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { analyzeApi } from '@/api/analyzeApi.js';
import { useWizardStore } from '@/stores/useWizardStore.js';
import { useNotificationStore } from '@/stores/useNotificationStore.js';
import AppButton from '@/components/common/AppButton.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import SampleDescriptionsPanel from './SampleDescriptionsPanel.vue';

const wizard = useWizardStore();
const notif = useNotificationStore();
const isAnalyzing = ref(false);
const error = ref('');
const showSamples = ref(false);

const searchKeywords = computed(() =>
  [wizard.metadata.itemName, wizard.metadata.model]
    .filter(Boolean).join(' ')
  || wizard.editedTitle
);

onMounted(async () => {
  if (wizard.analysisResult) return; // already analyzed
  isAnalyzing.value = true;
  error.value = '';
  try {
    // Use document photos for AI analysis (cheaper) — fall back to max 3 listing photos
    const analysisFileIds = wizard.documentFileIds.length > 0
      ? wizard.documentFileIds
      : wizard.uploadedFileIds.slice(0, 3);
    const result = await analyzeApi.analyze(analysisFileIds, wizard.metadata);
    wizard.setAnalysisResult(result);
  } catch (e) {
    error.value = (e as Error).message;
    notif.add('Błąd analizy: ' + (e as Error).message, 'error');
  } finally {
    isAnalyzing.value = false;
  }
});

function onNext() {
  if (!wizard.editedTitle || !wizard.editedDescription) {
    notif.add('Uzupełnij tytuł i opis.', 'error');
    return;
  }
  wizard.nextStep();
}
</script>

<template>
  <div class="step">
    <h2>Opis wygenerowany przez AI</h2>

    <LoadingSpinner v-if="isAnalyzing" :label="wizard.documentFileIds.length > 0 ? 'Claude analizuje dokumenty...' : 'Claude analizuje zdjęcia...'" />

    <div v-else-if="error" class="error-box">
      <p>{{ error }}</p>
      <AppButton variant="secondary" @click="wizard.prevStep()">← Wróć</AppButton>
    </div>

    <template v-else-if="wizard.analysisResult">
      <SampleDescriptionsPanel
        v-if="showSamples"
        :keywords="searchKeywords"
        @use="(desc) => { wizard.editedDescription = desc; showSamples = false; }"
        @close="showSamples = false"
      />

      <div class="field">
        <label>Tytuł ogłoszenia (max 70 znaków)</label>
        <input v-model="wizard.editedTitle" maxlength="70" class="input" />
        <span class="char-count">{{ wizard.editedTitle.length }}/70</span>
      </div>

      <div class="field">
        <div class="desc-label-row">
          <label>Opis</label>
          <button class="samples-btn" @click="showSamples = true">
            📋 Przykładowe opisy z OLX
          </button>
        </div>
        <textarea v-model="wizard.editedDescription" rows="6" class="input" />
      </div>

      <div class="meta">
        <div class="meta-item">
          <span class="meta-label">Stan:</span>
          <span>{{ wizard.analysisResult.condition }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Kategoria:</span>
          <span>{{ wizard.analysisResult.suggestedCategory }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Słowa kluczowe:</span>
          <span>{{ wizard.analysisResult.keywords.join(', ') }}</span>
        </div>
        <div v-if="wizard.analysisResult.officialUrl" class="meta-item">
          <span class="meta-label">Oficjalna strona:</span>
          <a :href="wizard.analysisResult.officialUrl" target="_blank" rel="noopener" class="official-link">
            {{ wizard.analysisResult.officialUrl.replace(/^https?:\/\//, '').split('/')[0] }} ↗
          </a>
        </div>
        <div v-if="wizard.analysisResult.estimatedPriceRange" class="meta-item">
          <span class="meta-label">Szacowana cena:</span>
          <span>{{ wizard.analysisResult.estimatedPriceRange.min }} – {{ wizard.analysisResult.estimatedPriceRange.max }} PLN</span>
        </div>
      </div>

      <div class="actions">
        <AppButton variant="ghost" @click="wizard.prevStep()">← Wróć</AppButton>
        <AppButton @click="onNext">Dalej →</AppButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.step { display: flex; flex-direction: column; gap: 18px; }
h2 { font-size: 22px; font-weight: 700; }
.field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 13px; font-weight: 600; color: #374151; }
.input { border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 12px; font-size: 14px; width: 100%; outline: none; resize: vertical; font-family: inherit; }
.input:focus { border-color: #7c3aed; }
.char-count { font-size: 12px; color: #9ca3af; align-self: flex-end; }
.meta { background: #f9fafb; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.meta-item { display: flex; gap: 8px; font-size: 14px; }
.meta-label { font-weight: 600; color: #374151; min-width: 120px; }
.desc-label-row { display: flex; justify-content: space-between; align-items: center; }
.samples-btn {
  background: none; border: 1px solid #c4b5fd; border-radius: 8px;
  padding: 4px 10px; font-size: 12px; color: #7c3aed; cursor: pointer;
  transition: background 0.15s;
}
.samples-btn:hover { background: #f5f3ff; }
.error-box { background: #fef2f2; border-radius: 10px; padding: 16px; color: #dc2626; }
.official-link { color: #2563eb; font-size: 13px; text-decoration: none; }
.official-link:hover { text-decoration: underline; }
.actions { display: flex; justify-content: space-between; }
</style>
