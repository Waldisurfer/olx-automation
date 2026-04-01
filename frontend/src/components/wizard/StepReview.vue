<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { listingsApi } from '@/api/listingsApi.js';
import { useWizardStore } from '@/stores/useWizardStore.js';
import { useListingsStore } from '@/stores/useListingsStore.js';
import { useNotificationStore } from '@/stores/useNotificationStore.js';
import AppButton from '@/components/common/AppButton.vue';
import { CONDITION_LABELS } from '@/types/Types.js';
import VerifyPanel from '@/components/listing/VerifyPanel.vue';

const wizard = useWizardStore();
const listingsStore = useListingsStore();
const notif = useNotificationStore();
const router = useRouter();
const isPublishing = ref(false);
const isSavingDraft = ref(false);
const isVerifying = ref(false);
const draftId = ref<number | null>(null);
const showVerify = ref(false);

function buildCreateDto() {
  return {
    title: wizard.editedTitle,
    description: wizard.editedDescription,
    categoryId: wizard.editedCategory.id,
    categoryName: wizard.editedCategory.name,
    price: wizard.finalPrice,
    photos: wizard.uploadedFileIds,
    condition: wizard.condition,
    city: wizard.city,
    negotiable: wizard.negotiable,
    shipping: wizard.shipping,
    aiGeneratedDescription: wizard.analysisResult?.description ?? '',
    reductionPercent: wizard.reductionPercent,
    reductionIntervalDays: wizard.reductionIntervalDays,
  };
}

async function ensureDraft(): Promise<number> {
  if (draftId.value) return draftId.value;
  const listing = await listingsApi.create(buildCreateDto());
  draftId.value = listing.id;
  return listing.id;
}

async function saveDraft() {
  isSavingDraft.value = true;
  try {
    const id = await ensureDraft();
    notif.add('Szkic zapisany! Możesz go znaleźć w dashboardzie.', 'success');
    wizard.reset();
    await listingsStore.fetchAll();
    router.push(`/listings/${id}`);
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    isSavingDraft.value = false;
  }
}

async function verifyBeforePublish() {
  isVerifying.value = true;
  try {
    await ensureDraft();
    showVerify.value = true;
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    isVerifying.value = false;
  }
}

async function publish() {
  isPublishing.value = true;
  try {
    const id = await ensureDraft();
    await listingsApi.publish(id);
    notif.add('Ogłoszenie opublikowane na OLX!', 'success');
    wizard.reset();
    await listingsStore.fetchAll();
    router.push('/dashboard');
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    isPublishing.value = false;
  }
}
</script>

<template>
  <div class="step">
    <h2>Podgląd ogłoszenia</h2>

    <div class="preview-box">
      <div v-if="wizard.previewUrls.length" class="photos">
        <img v-for="url in wizard.previewUrls" :key="url" :src="url" class="photo" />
      </div>
      <h3>{{ wizard.editedTitle }}</h3>
      <p class="description">{{ wizard.editedDescription }}</p>
      <div class="price-row">
        <span class="price">{{ wizard.finalPrice?.toLocaleString('pl-PL') }} PLN</span>
        <span class="reduction-info">
          Obniżka {{ wizard.reductionPercent }}% co {{ wizard.reductionIntervalDays }} dni
        </span>
      </div>
    </div>

    <!-- Listing details -->
    <div class="details-box">
      <h3>Szczegóły ogłoszenia</h3>
      <div class="details-grid">
        <div class="detail-field">
          <label>Stan przedmiotu</label>
          <select v-model="wizard.condition" class="detail-input">
            <option v-for="(label, val) in CONDITION_LABELS" :key="val" :value="val">{{ label }}</option>
          </select>
        </div>
        <div class="detail-field">
          <label>Miasto</label>
          <input v-model="wizard.city" placeholder="np. Warszawa, Kraków, Poznań..." class="detail-input" />
        </div>
        <div class="detail-field checkbox-field">
          <label>
            <input type="checkbox" v-model="wizard.negotiable" />
            Cena do negocjacji
          </label>
        </div>
        <div class="detail-field checkbox-field">
          <label>
            <input type="checkbox" v-model="wizard.shipping" />
            Wysyłka możliwa
          </label>
        </div>
      </div>
    </div>

    <div class="warn" v-if="wizard.uploadedFileIds.length < 3">
      ⚠️ Masz tylko {{ wizard.uploadedFileIds.length }} {{ wizard.uploadedFileIds.length === 1 ? 'zdjęcie' : 'zdjęcia' }} — OLX zaleca minimum 3. Wróć i dodaj więcej dla lepszej widoczności.
    </div>

    <div class="warn" v-if="!wizard.editedCategory.id">
      ⚠️ Kategoria nie wybrana — ogłoszenie zostanie opublikowane bez kategorii.
      OLX może je odrzucić. Możesz ją uzupełnić w panelu OLX po publikacji.
    </div>

    <VerifyPanel
      v-if="showVerify && draftId"
      :listing-id="draftId"
      @close="showVerify = false"
      @updated="() => {}"
    />

    <div class="actions">
      <AppButton variant="ghost" @click="wizard.prevStep()">← Wróć</AppButton>
      <div class="right-actions">
        <AppButton variant="ghost" :loading="isSavingDraft" @click="saveDraft">
          💾 Zapisz szkic
        </AppButton>
        <AppButton variant="secondary" :loading="isVerifying" @click="verifyBeforePublish">
          🔍 Zweryfikuj
        </AppButton>
        <AppButton :loading="isPublishing" @click="publish">
          Opublikuj na OLX
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step { display: flex; flex-direction: column; gap: 20px; }
h2 { font-size: 22px; font-weight: 700; }
.preview-box { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.photos { display: flex; gap: 8px; overflow-x: auto; }
.photo { height: 100px; width: auto; border-radius: 8px; object-fit: cover; }
h3 { font-size: 18px; font-weight: 700; }
.description { font-size: 14px; color: #374151; white-space: pre-wrap; line-height: 1.6; }
.price-row { display: flex; align-items: center; gap: 16px; }
.price { font-size: 24px; font-weight: 700; color: #7c3aed; }
.reduction-info { font-size: 13px; color: #9ca3af; }
.details-box { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.details-box h3 { font-size: 15px; font-weight: 600; margin: 0; }
.details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-field { display: flex; flex-direction: column; gap: 4px; }
.detail-field label { font-size: 12px; font-weight: 600; color: #6b7280; }
.detail-input { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 10px; font-size: 14px; font-family: inherit; outline: none; width: 100%; }
.detail-input:focus { border-color: #7c3aed; }
.checkbox-field { flex-direction: row; align-items: center; gap: 8px; padding-top: 16px; }
.checkbox-field label { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: #374151; cursor: pointer; }
.warn { background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 12px 16px; font-size: 14px; color: #854d0e; }
.actions { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.right-actions { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
