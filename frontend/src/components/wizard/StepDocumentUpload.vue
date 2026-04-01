<script setup lang="ts">
import { ref } from 'vue';
import { uploadApi } from '@/api/uploadApi.js';
import { analyzeApi } from '@/api/analyzeApi.js';
import { useWizardStore } from '@/stores/useWizardStore.js';
import { useNotificationStore } from '@/stores/useNotificationStore.js';
import AppButton from '@/components/common/AppButton.vue';

const wizard = useWizardStore();
const notif = useNotificationStore();

const isDragging = ref(false);
const isUploading = ref(false);
const isExtracting = ref(false);
const previews = ref<string[]>([...wizard.documentPreviewUrls]);
const fileIds = ref<string[]>([...wizard.documentFileIds]);
const extractResult = ref<Record<string, string | number | undefined> | null>(null);

async function handleFiles(files: FileList | File[]) {
  const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
  if (!arr.length) return;
  if (fileIds.value.length + arr.length > 3) {
    notif.add('Maksymalnie 3 zdjęcia dokumentów.', 'error');
    return;
  }
  isUploading.value = true;
  try {
    const res = await uploadApi.uploadPhotos(arr);
    fileIds.value.push(...res.fileIds);
    previews.value.push(...res.previewUrls);
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    isUploading.value = false;
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false;
  if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
}

function removePhoto(i: number) {
  uploadApi.deletePhoto(fileIds.value[i]).catch(() => {});
  fileIds.value.splice(i, 1);
  previews.value.splice(i, 1);
  extractResult.value = null;
}

async function extractAndNext() {
  if (fileIds.value.length === 0) {
    // Skip step — no documents
    wizard.nextStep();
    return;
  }

  isExtracting.value = true;
  try {
    const result = await analyzeApi.extractDocuments(fileIds.value);
    extractResult.value = result as Record<string, string | number | undefined>;

    // Pre-fill metadata
    const meta = wizard.metadata;
    if (result.itemName && !meta.itemName) meta.itemName = result.brand ? `${result.brand} ${result.itemName}` : result.itemName;
    if (result.model && !meta.model) meta.model = result.model;
    if (result.yearOfProduction && !meta.yearOfProduction) meta.yearOfProduction = result.yearOfProduction;

    // Build additionalInfo from extracted specs
    const extras: string[] = [];
    if (result.serialNumber) extras.push(`S/N: ${result.serialNumber}`);
    if (result.specs) extras.push(result.specs);
    if (result.purchaseDate) extras.push(`Data zakupu: ${result.purchaseDate}`);
    if (result.purchasePrice) extras.push(`Cena zakupu: ${result.purchasePrice} PLN`);
    if (extras.length && !meta.additionalInfo) meta.additionalInfo = extras.join('. ');

    wizard.setDocumentResult(fileIds.value, previews.value);
    notif.add('Dane odczytane! Sprawdź i uzupełnij w następnym kroku.', 'success');
    wizard.nextStep();
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    isExtracting.value = false;
  }
}

function skip() {
  wizard.setDocumentResult([], []);
  wizard.nextStep();
}

const FIELD_LABELS: Record<string, string> = {
  itemName: 'Nazwa', brand: 'Marka', model: 'Model',
  yearOfProduction: 'Rok', serialNumber: 'S/N',
  specs: 'Specyfikacje', purchasePrice: 'Cena zakupu', purchaseDate: 'Data zakupu',
};
</script>

<template>
  <div class="step">
    <div class="header">
      <h2>📄 Dokument / tabliczka znamionowa</h2>
      <p class="hint">
        Dodaj zdjęcie paragonu, faktury, tabliczki znamionowej lub opakowania.
        Claude odczyta markę, model, rok produkcji i specyfikacje — bez analizowania wszystkich zdjęć produktu.
      </p>
      <div class="badge">💡 Ogranicza koszty AI — analizujemy 1–3 zdjęcia zamiast 8</div>
    </div>

    <div
      class="drop-zone"
      :class="{ 'drop-zone--active': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
      @click="($refs.fileInput as HTMLInputElement).click()"
    >
      <input
        ref="fileInput" type="file" multiple accept="image/*" class="hidden"
        @change="(e) => handleFiles((e.target as HTMLInputElement).files!)"
      />
      <div v-if="isUploading" class="drop-label">Przesyłanie...</div>
      <div v-else class="drop-label">
        <span style="font-size:36px">🧾</span>
        <span>Przeciągnij lub kliknij — paragon, faktura, tabliczka (max 3)</span>
      </div>
    </div>

    <div v-if="previews.length" class="grid">
      <div v-for="(url, i) in previews" :key="url" class="thumb-wrap">
        <img :src="url" class="thumb" />
        <button class="remove" @click.stop="removePhoto(i)">✕</button>
      </div>
    </div>

    <!-- Example types -->
    <div class="examples">
      <div class="example">🧾 Paragon / faktura</div>
      <div class="example">🏷️ Tabliczka znamionowa</div>
      <div class="example">📦 Etykieta z opakowaniem</div>
      <div class="example">📋 Karta gwarancyjna</div>
    </div>

    <div class="actions">
      <AppButton variant="ghost" @click="skip">Pomiń →</AppButton>
      <AppButton
        :loading="isExtracting"
        :disabled="isUploading"
        @click="extractAndNext"
      >
        {{ fileIds.length > 0 ? '🤖 Odczytaj i dalej →' : 'Dalej →' }}
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
.step { display: flex; flex-direction: column; gap: 18px; }
.header { display: flex; flex-direction: column; gap: 6px; }
h2 { font-size: 22px; font-weight: 700; margin: 0; }
.hint { color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0; }
.badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: #f0fdf4; border: 1px solid #bbf7d0;
  border-radius: 8px; padding: 6px 12px; font-size: 13px; color: #15803d;
  align-self: flex-start;
}
.drop-zone {
  border: 2px dashed #d1d5db; border-radius: 12px; padding: 36px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: border-color 0.2s, background 0.2s;
}
.drop-zone--active { border-color: #7c3aed; background: #f5f3ff; }
.drop-label { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #9ca3af; text-align: center; }
.hidden { display: none; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.thumb-wrap { position: relative; }
.thumb { width: 100%; height: 110px; object-fit: cover; border-radius: 8px; display: block; }
.remove {
  position: absolute; top: 4px; right: 4px;
  background: rgba(0,0,0,0.55); color: #fff;
  border: none; border-radius: 50%; width: 22px; height: 22px;
  font-size: 11px; cursor: pointer;
}
.examples { display: flex; flex-wrap: wrap; gap: 8px; }
.example {
  background: #f9fafb; border: 1px solid #e5e7eb;
  border-radius: 8px; padding: 6px 12px; font-size: 13px; color: #6b7280;
}
.actions { display: flex; justify-content: space-between; }
</style>
