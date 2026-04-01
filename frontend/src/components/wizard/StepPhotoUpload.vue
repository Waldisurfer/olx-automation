<script setup lang="ts">
import { ref } from 'vue';
import { uploadApi } from '@/api/uploadApi.js';
import { useWizardStore } from '@/stores/useWizardStore.js';
import { useNotificationStore } from '@/stores/useNotificationStore.js';
import AppButton from '@/components/common/AppButton.vue';

const wizard = useWizardStore();
const notif = useNotificationStore();

const isDragging = ref(false);
const isUploading = ref(false);
const previews = ref<string[]>([...wizard.previewUrls]);
const fileIds = ref<string[]>([...wizard.uploadedFileIds]);

async function handleFiles(files: FileList | File[]) {
  const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
  if (!arr.length) return;
  if (fileIds.value.length + arr.length > 8) {
    notif.add('Maksymalnie 8 zdjęć.', 'error');
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
}

function onNext() {
  if (fileIds.value.length === 0) { notif.add('Dodaj co najmniej 1 zdjęcie.', 'error'); return; }
  wizard.setUploadResult(fileIds.value, previews.value);
  wizard.nextStep();
}
</script>

<template>
  <div class="step">
    <h2>Dodaj zdjęcia przedmiotu</h2>
    <p class="hint">Dodaj do 8 zdjęć. Lepsza jakość = lepszy opis i cena.</p>

    <div class="tips">
      <div class="tip">📐 Jednolite tło (ściana, podłoga)</div>
      <div class="tip">🔄 Pokaż przedmiot z każdej strony</div>
      <div class="tip">🔍 Sfotografuj ewentualne wady</div>
      <div class="tip">🚫 Nie używaj zdjęć z internetu</div>
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
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        class="hidden"
        @change="(e) => handleFiles((e.target as HTMLInputElement).files!)"
      />
      <div v-if="isUploading" class="drop-label">Przesyłanie...</div>
      <div v-else class="drop-label">
        <span style="font-size:36px">📷</span>
        <span>Przeciągnij zdjęcia tutaj lub kliknij, aby wybrać</span>
      </div>
    </div>

    <div v-if="previews.length" class="grid">
      <div v-for="(url, i) in previews" :key="url" class="thumb-wrap">
        <img :src="url" class="thumb" />
        <button class="remove" @click.stop="removePhoto(i)">✕</button>
      </div>
    </div>

    <div class="photo-warn" v-if="fileIds.length > 0 && fileIds.length < 3">
      ⚠️ OLX zaleca minimum 3 zdjęcia — im więcej, tym szybciej kupisz. Masz {{ fileIds.length }}/8.
    </div>

    <div class="actions">
      <AppButton :disabled="fileIds.length === 0" :loading="isUploading" @click="onNext">
        Dalej →
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
.step { display: flex; flex-direction: column; gap: 20px; }
h2 { font-size: 22px; font-weight: 700; }
.hint { color: #6b7280; font-size: 14px; }
.drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.drop-zone--active { border-color: #7c3aed; background: #f5f3ff; }
.drop-label { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #9ca3af; }
.hidden { display: none; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; }
.thumb-wrap { position: relative; }
.thumb { width: 100%; height: 100px; object-fit: cover; border-radius: 8px; display: block; }
.remove {
  position: absolute; top: 4px; right: 4px;
  background: rgba(0,0,0,0.55); color: #fff;
  border: none; border-radius: 50%; width: 22px; height: 22px;
  font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.tips { display: flex; flex-wrap: wrap; gap: 8px; }
.tip { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 6px 12px; font-size: 13px; color: #166534; }
.photo-warn { background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #854d0e; }
.actions { display: flex; justify-content: flex-end; }
</style>
