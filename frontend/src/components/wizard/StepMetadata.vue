<script setup lang="ts">
import { computed } from 'vue';
import { useWizardStore } from '@/stores/useWizardStore.js';
import AppButton from '@/components/common/AppButton.vue';
import CategoryPicker from './CategoryPicker.vue';

const wizard = useWizardStore();

const textFields = [
  { key: 'itemName' as const,         label: 'Nazwa przedmiotu',  placeholder: 'np. Rower górski, iPhone, Aparat Sony...', icon: '📦' },
  { key: 'model' as const,            label: 'Model / wersja',    placeholder: 'np. Trek Marlin 7, iPhone 13 Pro, A6000...', icon: '🔖' },
  { key: 'yearOfProduction' as const, label: 'Rok produkcji',     placeholder: 'np. 2021',                                  icon: '📅' },
];

const searchQuery = computed(() =>
  [wizard.metadata.itemName, wizard.metadata.model, wizard.metadata.yearOfProduction]
    .filter(Boolean).join(' ')
);

// Bind category picker to editedCategory (used when publishing)
const pickerValue = computed({
  get: () => wizard.editedCategory,
  set: (v) => { wizard.editedCategory = v; wizard.metadata.category = v.name; },
});
</script>

<template>
  <div class="step">
    <div class="header">
      <h2>Dane produktu <span class="optional">(opcjonalne)</span></h2>
      <p class="hint">
        Im więcej podasz, tym lepszy opis AI wygeneruje.
        Claude wyszuka zalety produktu w internecie i doda link do oficjalnej strony.
      </p>
    </div>

    <div class="fields">
      <div v-for="f in textFields" :key="f.key" class="field">
        <label>
          <span class="icon">{{ f.icon }}</span>
          {{ f.label }}
        </label>
        <input
          v-model="wizard.metadata[f.key]"
          :placeholder="f.placeholder"
          class="input"
        />
      </div>

      <!-- Category picker — full width -->
      <div class="field field--full">
        <label>
          <span class="icon">🗂️</span>
          Kategoria OLX
          <span class="hint-inline">— kliknij "Zasugeruj" po uzupełnieniu nazwy/modelu</span>
        </label>
        <CategoryPicker
          v-model="pickerValue"
          :item-name="wizard.metadata.itemName"
          :model="wizard.metadata.model"
          :suggested-category="wizard.metadata.category"
        />
      </div>

      <!-- Additional info — full width -->
      <div class="field field--full">
        <label>
          <span class="icon">💬</span>
          Dodatkowe informacje
        </label>
        <textarea
          v-model="wizard.metadata.additionalInfo"
          placeholder="np. Sprzedaję bo kupuję nowy model. Używane 2 lata, bez zarysowań, bateria trzyma cały dzień. Dołączam oryginalne opakowanie."
          rows="3"
          class="input"
        />
      </div>
    </div>

    <!-- Search query preview -->
    <div class="preview" v-if="searchQuery">
      <span class="preview-label">🔍 Zapytanie do wyszukiwarki:</span>
      <span class="preview-query">{{ searchQuery }}</span>
    </div>

    <div class="actions">
      <AppButton variant="ghost" @click="wizard.prevStep()">← Wróć</AppButton>
      <div class="right-actions">
        <AppButton variant="secondary" @click="wizard.nextStep()">Pomiń →</AppButton>
        <AppButton @click="wizard.nextStep()">Dalej →</AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step { display: flex; flex-direction: column; gap: 22px; }
.header { display: flex; flex-direction: column; gap: 6px; }
h2 { font-size: 22px; font-weight: 700; margin: 0; }
.optional { font-size: 14px; font-weight: 400; color: #9ca3af; }
.hint { color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0; }
.hint-inline { font-size: 12px; font-weight: 400; color: #9ca3af; }

.fields { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field--full { grid-column: 1 / -1; }

label {
  font-size: 13px; font-weight: 600; color: #374151;
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.icon { font-size: 15px; }
.input {
  border: 1px solid #d1d5db; border-radius: 8px;
  padding: 10px 12px; font-size: 14px; font-family: inherit;
  outline: none; resize: vertical; width: 100%;
  transition: border-color 0.15s;
}
.input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }

.preview {
  background: #f5f3ff; border: 1px solid #ddd6fe;
  border-radius: 8px; padding: 10px 14px;
  display: flex; align-items: center; gap: 10px; font-size: 13px; flex-wrap: wrap;
}
.preview-label { color: #7c3aed; font-weight: 600; white-space: nowrap; }
.preview-query { color: #4b5563; }

.actions { display: flex; justify-content: space-between; align-items: center; }
.right-actions { display: flex; gap: 8px; }
</style>
