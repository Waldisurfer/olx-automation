<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { listingsApi } from '@/api/listingsApi.js';
import { useNotificationStore } from '@/stores/useNotificationStore.js';
import { useListingsStore } from '@/stores/useListingsStore.js';
import StatusBadge from '@/components/listing/StatusBadge.vue';
import PriceHistoryChart from '@/components/listing/PriceHistoryChart.vue';
import AppButton from '@/components/common/AppButton.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import RegeneratePanel from '@/components/listing/RegeneratePanel.vue';
import { uploadUrl } from '@/utils/urls.js';
import VerifyPanel from '@/components/listing/VerifyPanel.vue';
import type { Listing } from '@/types/Types.js';

const route = useRoute();
const router = useRouter();
const notif = useNotificationStore();
const store = useListingsStore();

const listing = ref<Listing | null>(null);
const isLoading = ref(true);
const newPrice = ref(0);
const isReducing = ref(false);
const isMarkingSold = ref(false);
const isDeactivating = ref(false);
const isPublishing = ref(false);
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);
const showVerify = ref(false);
const manualPublishDate = ref('');
const isSavingDate = ref(false);

onMounted(async () => {
  try {
    listing.value = await listingsApi.getById(Number(route.params.id));
    newPrice.value = listing.value.price;
  } catch {
    notif.add('Nie znaleziono ogłoszenia.', 'error');
    router.push('/dashboard');
  } finally {
    isLoading.value = false;
  }
});

async function reducePrice() {
  if (!listing.value || newPrice.value <= 0) return;
  isReducing.value = true;
  try {
    listing.value = await listingsApi.setPrice(listing.value.id, newPrice.value);
    notif.add('Cena zaktualizowana!', 'success');
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    isReducing.value = false;
  }
}

async function markSold() {
  if (!listing.value) return;
  isMarkingSold.value = true;
  try {
    listing.value = await store.markSold(listing.value.id);
    notif.add('Oznaczono jako sprzedane!', 'success');
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    isMarkingSold.value = false;
  }
}

async function deactivate() {
  if (!listing.value) return;
  isDeactivating.value = true;
  try {
    listing.value = await listingsApi.deactivate(listing.value.id);
    notif.add('Ogłoszenie wstrzymane.', 'info');
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    isDeactivating.value = false;
  }
}

async function publish() {
  if (!listing.value) return;
  isPublishing.value = true;
  try {
    listing.value = await listingsApi.publish(listing.value.id);
    notif.add('Opublikowano!', 'success');
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    isPublishing.value = false;
  }
}

async function deleteListing() {
  if (!listing.value) return;
  isDeleting.value = true;
  try {
    await listingsApi.delete(listing.value.id);
    notif.add('Ogłoszenie usunięte.', 'success');
    router.push('/dashboard');
  } catch (e) {
    notif.add((e as Error).message, 'error');
    isDeleting.value = false;
    showDeleteConfirm.value = false;
  }
}

function copyText(text: string, label: string) {
  navigator.clipboard.writeText(text)
    .then(() => notif.add(`Skopiowano ${label}!`, 'success'))
    .catch(() => notif.add('Nie udało się skopiować.', 'error'));
}

async function downloadPhoto(fileId: string, index: number) {
  try {
    const res = await fetch(uploadUrl(fileId));
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `zdjecie-${index + 1}.jpg`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    notif.add('Nie udało się pobrać zdjęcia.', 'error');
  }
}

async function downloadAllPhotos() {
  if (!listing.value) return;
  for (let i = 0; i < listing.value.photos.length; i++) {
    await downloadPhoto(listing.value.photos[i], i);
    if (i < listing.value.photos.length - 1) await new Promise(r => setTimeout(r, 300));
  }
  notif.add(`Pobieranie ${listing.value.photos.length} zdjęć...`, 'info');
}

async function savePublishDate() {
  if (!listing.value || !manualPublishDate.value) return;
  isSavingDate.value = true;
  try {
    listing.value = await listingsApi.setPublished(listing.value.id, manualPublishDate.value);
    notif.add('Data publikacji zapisana! Ogłoszenie aktywne.', 'success');
  } catch (e) {
    notif.add((e as Error).message, 'error');
  } finally {
    isSavingDate.value = false;
  }
}

function onRegenerated(result: { title: string; description: string; suggestedCategory: string; keywords: string[] }) {
  if (!listing.value) return;
  listing.value = { ...listing.value, title: result.title, description: result.description, categoryName: result.suggestedCategory };
}
</script>

<template>
  <div class="container">
    <button class="back" @click="router.push('/dashboard')">← Powrót</button>

    <LoadingSpinner v-if="isLoading" />

    <template v-else-if="listing">
      <div class="header">
        <div>
          <StatusBadge :status="listing.status" />
          <h1>{{ listing.title }}</h1>
        </div>
        <div class="header-actions">
          <a v-if="listing.olxAdvertUrl" :href="listing.olxAdvertUrl" target="_blank" rel="noopener" class="olx-link">
            Otwórz na OLX ↗
          </a>
          <button class="btn-clipboard" @click="copyText(listing.title, 'tytuł')" title="Kopiuj tytuł">
            📋 Kopiuj tytuł
          </button>
          <button class="btn-verify" @click="showVerify = true" title="Zweryfikuj ogłoszenie">
            🔍 Zweryfikuj
          </button>
          <button class="btn-delete" @click="showDeleteConfirm = true" title="Usuń ogłoszenie">
            🗑️ Usuń
          </button>
        </div>
      </div>

      <!-- Verify panel -->
      <VerifyPanel
        v-if="showVerify && listing"
        :listing-id="listing.id"
        @close="showVerify = false"
        @updated="listing = null; isLoading = true; listingsApi.getById(Number(route.params.id)).then(l => { listing = l; isLoading = false; })"
      />

      <!-- Delete confirmation -->
      <div v-if="showDeleteConfirm" class="confirm-box">
        <p>Na pewno chcesz usunąć to ogłoszenie? Tej operacji nie można cofnąć.</p>
        <div class="confirm-actions">
          <AppButton variant="ghost" @click="showDeleteConfirm = false">Anuluj</AppButton>
          <AppButton variant="danger" :loading="isDeleting" @click="deleteListing">Usuń</AppButton>
        </div>
      </div>

      <!-- Photos -->
      <div v-if="listing.photos.length" class="photos-section">
        <div class="photos-header">
          <span class="photos-count">{{ listing.photos.length }} zdjęć</span>
          <button class="btn-clipboard" @click="downloadAllPhotos" title="Pobierz wszystkie zdjęcia">
            ⬇️ Pobierz wszystkie
          </button>
        </div>
        <div class="photos">
          <div v-for="(p, i) in listing.photos" :key="p" class="photo-wrap">
            <img :src="uploadUrl(p)" class="photo" />
            <button class="photo-dl" @click="downloadPhoto(p, i)" title="Pobierz zdjęcie">⬇️</button>
          </div>
        </div>
      </div>

      <!-- Info -->
      <div class="info-grid">
        <div class="info-card">
          <div class="info-label">Aktualna cena</div>
          <div class="info-value price">{{ listing.price.toLocaleString('pl-PL') }} PLN {{ listing.negotiable ? '(negocjacja)' : '' }}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Stan</div>
          <div class="info-value">{{ { nowy: 'Nowy', używany_dobry: 'Używany — dobry', używany_dostateczny: 'Używany — dostateczny', używany_zły: 'Używany — zły' }[listing.condition] ?? listing.condition }}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Miasto</div>
          <div class="info-value">{{ listing.city || '—' }}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Wysyłka</div>
          <div class="info-value">{{ listing.shipping ? 'Tak' : 'Nie' }}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Następna obniżka</div>
          <div class="info-value">
            {{ listing.nextReductionAt ? new Date(listing.nextReductionAt).toLocaleDateString('pl-PL') : '—' }}
          </div>
        </div>
        <div class="info-card">
          <div class="info-label">Obniżka co</div>
          <div class="info-value">{{ listing.reductionIntervalDays }} dni o {{ listing.reductionPercent }}%</div>
        </div>
        <div class="info-card">
          <div class="info-label">Opublikowano</div>
          <div class="info-value">{{ listing.publishedAt ? new Date(listing.publishedAt).toLocaleDateString('pl-PL') : '—' }}</div>
        </div>
      </div>

      <!-- Description -->
      <div class="section">
        <div class="section-header">
          <h3>Opis</h3>
          <button class="btn-clipboard" @click="copyText(listing.description, 'opis')" title="Kopiuj opis">
            📋 Kopiuj opis
          </button>
        </div>
        <p class="description">{{ listing.description }}</p>
      </div>

      <!-- Regenerate -->
      <div class="section">
        <RegeneratePanel :listing-id="listing.id" @regenerated="onRegenerated" />
      </div>

      <!-- Price history chart -->
      <div class="section" v-if="listing.priceHistory">
        <h3>Historia cen</h3>
        <PriceHistoryChart :history="listing.priceHistory" />
      </div>

      <!-- Actions -->
      <div v-if="listing.status === 'active'" class="actions-box">
        <h3>Akcje</h3>
        <div class="price-row">
          <input v-model.number="newPrice" type="number" min="1" step="10" class="price-input" />
          <AppButton :loading="isReducing" variant="secondary" @click="reducePrice">
            Ustaw cenę
          </AppButton>
        </div>
        <div class="danger-actions">
          <AppButton variant="ghost" :loading="isDeactivating" @click="deactivate">Wstrzymaj</AppButton>
          <AppButton variant="danger" :loading="isMarkingSold" @click="markSold">Oznacz jako sprzedane</AppButton>
        </div>
      </div>

      <!-- Tips checklist -->
      <div class="tips-box">
        <div class="tips-title">✅ Checklista sprzedawcy OLX</div>
        <div class="tips-grid">
          <div class="tip-item">💰 Cena dopasowana do rynku — sprawdź podobne ogłoszenia</div>
          <div class="tip-item">📝 Opis czytelny — akapity i wypunktowanie</div>
          <div class="tip-item">📸 Min. 3–8 zdjęć ze wszystkich stron, jednolite tło</div>
          <div class="tip-item">🔍 Pokaż wady na zdjęciach — budujesz zaufanie</div>
          <div class="tip-item">⚡ Odpowiadaj na wiadomości w ciągu godziny</div>
        </div>
      </div>

      <!-- Publish draft -->
      <div v-if="listing.status === 'draft'" class="actions-box">
        <h3>Publikacja</h3>
        <AppButton :loading="isPublishing" @click="publish">
          Opublikuj przez API OLX
        </AppButton>

        <div class="divider">lub — jeśli opublikowałeś ręcznie na OLX</div>

        <div class="manual-publish">
          <label>Data ręcznej publikacji</label>
          <div class="date-row">
            <input type="date" v-model="manualPublishDate" class="date-input"
              :max="new Date().toISOString().slice(0,10)" />
            <AppButton :loading="isSavingDate" variant="secondary"
              :disabled="!manualPublishDate" @click="savePublishDate">
              Zapisz datę
            </AppButton>
          </div>
          <p class="date-hint" v-if="manualPublishDate && listing">
            Następna obniżka: {{ (() => { const d = new Date(manualPublishDate); d.setDate(d.getDate() + listing.reductionIntervalDays); return d.toLocaleDateString('pl-PL'); })() }}
            (za {{ listing.reductionIntervalDays }} dni)
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.container { max-width: 800px; margin: 0 auto; padding: 24px 20px; }
.back { background: none; border: none; color: #6b7280; cursor: pointer; font-size: 14px; margin-bottom: 16px; padding: 0; }
.back:hover { color: #111827; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 12px; }
h1 { font-size: 24px; font-weight: 700; margin-top: 6px; }
.header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.olx-link { color: #2563eb; font-size: 14px; text-decoration: none; white-space: nowrap; }
.btn-clipboard, .btn-delete {
  border: 1px solid #d1d5db; border-radius: 8px;
  padding: 6px 12px; font-size: 13px; cursor: pointer;
  background: #fff; transition: background 0.15s;
}
.btn-clipboard:hover { background: #f3f4f6; }
.btn-verify { border-color: #c4b5fd; color: #7c3aed; }
.btn-verify:hover { background: #f5f3ff; }
.btn-delete { border-color: #fca5a5; color: #dc2626; }
.btn-delete:hover { background: #fef2f2; }

.confirm-box {
  background: #fff7ed; border: 1px solid #fed7aa;
  border-radius: 10px; padding: 16px; margin-bottom: 16px;
}
.confirm-box p { margin: 0 0 12px; font-size: 14px; color: #92400e; }
.confirm-actions { display: flex; gap: 8px; }

.photos-section { margin-bottom: 20px; }
.photos-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.photos-count { font-size: 13px; color: #9ca3af; }
.photos { display: flex; gap: 10px; overflow-x: auto; }
.photo-wrap { position: relative; flex-shrink: 0; }
.photo { height: 160px; width: auto; border-radius: 10px; object-fit: cover; display: block; }
.photo-dl {
  position: absolute; bottom: 6px; right: 6px;
  background: rgba(0,0,0,0.55); color: #fff; border: none;
  border-radius: 6px; padding: 3px 7px; font-size: 13px; cursor: pointer;
  opacity: 0; transition: opacity 0.15s;
}
.photo-wrap:hover .photo-dl { opacity: 1; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.section-header h3 { margin-bottom: 0; }
.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
@media (min-width: 600px) { .info-grid { grid-template-columns: repeat(3, 1fr); } }
.info-card { background: #f9fafb; border-radius: 10px; padding: 14px; }
.info-label { font-size: 12px; color: #9ca3af; margin-bottom: 4px; }
.info-value { font-size: 16px; font-weight: 600; }
.info-value.price { color: #7c3aed; font-size: 22px; }
.section { margin-bottom: 20px; }
h3 { font-size: 16px; font-weight: 600; margin-bottom: 10px; }
.description { font-size: 14px; color: #374151; white-space: pre-wrap; line-height: 1.7; }
.actions-box { background: #f9fafb; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.price-row { display: flex; gap: 10px; align-items: center; }
.price-input { border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 12px; font-size: 18px; font-weight: 700; width: 160px; outline: none; }
.price-input:focus { border-color: #7c3aed; }
.danger-actions { display: flex; gap: 10px; }
.tips-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
.tips-title { font-weight: 700; font-size: 14px; color: #166534; margin-bottom: 10px; }
.tips-grid { display: flex; flex-direction: column; gap: 6px; }
.tip-item { font-size: 13px; color: #15803d; }
.divider { text-align: center; font-size: 13px; color: #9ca3af; padding: 4px 0; }
.manual-publish { display: flex; flex-direction: column; gap: 8px; }
.manual-publish label { font-size: 13px; font-weight: 600; color: #374151; }
.date-row { display: flex; gap: 10px; align-items: center; }
.date-input { border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 12px; font-size: 14px; outline: none; }
.date-input:focus { border-color: #7c3aed; }
.date-hint { font-size: 12px; color: #6b7280; margin: 0; }
</style>
