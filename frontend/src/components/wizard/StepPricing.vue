<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { searchApi } from '@/api/searchApi.js';
import { useWizardStore } from '@/stores/useWizardStore.js';
import { useNotificationStore } from '@/stores/useNotificationStore.js';
import AppButton from '@/components/common/AppButton.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const wizard = useWizardStore();
const notif = useNotificationStore();
const isSearching = ref(false);

onMounted(async () => {
  if (wizard.priceSuggestion) return;
  const keywords = wizard.analysisResult?.keywords.join(' ') ?? wizard.editedTitle;
  if (!keywords) return;
  isSearching.value = true;
  try {
    const s = await searchApi.findSimilar(keywords);
    wizard.setPriceSuggestion(s);
  } catch (e) {
    notif.add('Nie udało się pobrać podobnych ofert.', 'info');
  } finally {
    isSearching.value = false;
  }
});

function onNext() {
  if (!wizard.finalPrice || wizard.finalPrice <= 0) {
    notif.add('Podaj cenę większą niż 0.', 'error');
    return;
  }
  wizard.nextStep();
}
</script>

<template>
  <div class="step">
    <h2>Ustal cenę</h2>

    <LoadingSpinner v-if="isSearching" label="Szukam podobnych ofert na OLX..." />

    <template v-else>
      <div v-if="wizard.priceSuggestion && wizard.priceSuggestion.sampleSize > 0" class="stats">
        <div class="stat-card">
          <div class="stat-value">{{ wizard.priceSuggestion.averagePrice }} PLN</div>
          <div class="stat-label">Średnia</div>
        </div>
        <div class="stat-card stat-card--highlight">
          <div class="stat-value">{{ wizard.priceSuggestion.suggestedPrice }} PLN</div>
          <div class="stat-label">Sugerowana (+5%)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ wizard.priceSuggestion.minPrice }} – {{ wizard.priceSuggestion.maxPrice }} PLN</div>
          <div class="stat-label">Zakres rynkowy ({{ wizard.priceSuggestion.sampleSize }} ofert)</div>
        </div>
      </div>
      <p v-else class="no-data">Nie znaleziono podobnych ofert. Wpisz cenę ręcznie.</p>

      <div class="field">
        <label>Twoja cena (PLN)</label>
        <input v-model.number="wizard.finalPrice" type="number" min="1" step="10" class="input price-input" />
      </div>

      <div class="reduction-config">
        <h4>Automatyczna obniżka ceny</h4>
        <div class="row">
          <div class="field">
            <label>Obniżka co (dni)</label>
            <input v-model.number="wizard.reductionIntervalDays" type="number" min="1" max="90" class="input" />
          </div>
          <div class="field">
            <label>O ile procent (%)</label>
            <input v-model.number="wizard.reductionPercent" type="number" min="1" max="50" class="input" />
          </div>
        </div>
      </div>

      <div v-if="wizard.priceSuggestion?.similarListings?.length" class="similar">
        <h4>Podobne oferty ({{ wizard.priceSuggestion.sampleSize }})</h4>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Tytuł</th><th>Cena</th><th>Miasto</th></tr></thead>
            <tbody>
              <tr v-for="item in wizard.priceSuggestion.similarListings.slice(0, 10)" :key="item.olxId">
                <td><a :href="item.url" target="_blank" rel="noopener">{{ item.title }}</a></td>
                <td class="price-col">{{ item.price.toLocaleString('pl-PL') }} PLN</td>
                <td>{{ item.locationCity ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
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
.step { display: flex; flex-direction: column; gap: 20px; }
h2 { font-size: 22px; font-weight: 700; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.stat-card { background: #f9fafb; border-radius: 10px; padding: 14px; text-align: center; }
.stat-card--highlight { background: #f5f3ff; border: 1px solid #ddd6fe; }
.stat-value { font-size: 18px; font-weight: 700; color: #7c3aed; }
.stat-label { font-size: 12px; color: #9ca3af; margin-top: 2px; }
.no-data { color: #9ca3af; font-size: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 13px; font-weight: 600; color: #374151; }
.input { border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 12px; font-size: 14px; outline: none; }
.input:focus { border-color: #7c3aed; }
.price-input { font-size: 24px; font-weight: 700; }
.reduction-config { background: #f9fafb; border-radius: 10px; padding: 16px; }
.reduction-config h4 { font-size: 14px; font-weight: 600; margin-bottom: 10px; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.similar h4 { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { text-align: left; padding: 8px; background: #f3f4f6; font-weight: 600; color: #374151; }
td { padding: 8px; border-bottom: 1px solid #f3f4f6; }
.price-col { font-weight: 600; color: #7c3aed; white-space: nowrap; }
a { color: #2563eb; text-decoration: none; }
a:hover { text-decoration: underline; }
.actions { display: flex; justify-content: space-between; }
</style>
