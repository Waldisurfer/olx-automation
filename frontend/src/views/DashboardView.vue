<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useListingsStore } from '@/stores/useListingsStore.js';
import ListingCard from '@/components/listing/ListingCard.vue';
import AppButton from '@/components/common/AppButton.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const store = useListingsStore();
const router = useRouter();

onMounted(() => store.fetchAll());

const active = computed(() => store.listings.filter((l) => l.status === 'active'));
const drafts = computed(() => store.listings.filter((l) => l.status === 'draft'));
const sold = computed(() => store.listings.filter((l) => l.status === 'sold'));
const totalValue = computed(() => active.value.reduce((s, l) => s + l.price, 0));
</script>

<template>
  <div class="dashboard">
    <div class="header">
      <div>
        <h1>Moje ogłoszenia</h1>
        <p class="sub" v-if="active.length">{{ active.length }} aktywnych · {{ totalValue.toLocaleString('pl-PL') }} PLN łączna wartość</p>
      </div>
      <AppButton @click="router.push('/listings/new')">+ Nowe ogłoszenie</AppButton>
    </div>

    <!-- Price reduction alerts -->
    <div v-if="store.reductionsDue.length" class="reduction-alerts">
      <div class="reduction-title">🔔 Czas obniżyć cenę!</div>
      <div v-for="l in store.reductionsDue" :key="l.id" class="reduction-item" @click="router.push(`/listings/${l.id}`)">
        <span class="reduction-name">{{ l.title }}</span>
        <span class="reduction-meta">
          Termin minął {{ new Date(l.nextReductionAt!).toLocaleDateString('pl-PL') }} · obniż o {{ l.reductionPercent }}%
          ({{ Math.round(l.price * (1 - l.reductionPercent / 100)).toLocaleString('pl-PL') }} PLN)
        </span>
      </div>
    </div>

    <LoadingSpinner v-if="store.isLoading" label="Ładowanie..." />

    <template v-else-if="store.listings.length">
      <section v-if="active.length">
        <h2 class="section-title">Aktywne</h2>
        <div class="grid">
          <ListingCard v-for="l in active" :key="l.id" :listing="l" />
        </div>
      </section>

      <section v-if="drafts.length">
        <h2 class="section-title">Szkice</h2>
        <div class="grid">
          <ListingCard v-for="l in drafts" :key="l.id" :listing="l" />
        </div>
      </section>

      <section v-if="sold.length">
        <h2 class="section-title">Sprzedane</h2>
        <div class="grid">
          <ListingCard v-for="l in sold" :key="l.id" :listing="l" />
        </div>
      </section>
    </template>

    <div v-else class="empty">
      <p>Brak ogłoszeń. Zacznij od dodania pierwszego przedmiotu.</p>
      <AppButton @click="router.push('/listings/new')">+ Dodaj ogłoszenie</AppButton>
    </div>
  </div>
</template>

<style scoped>
.dashboard { max-width: 1000px; margin: 0 auto; padding: 32px 20px; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
h1 { font-size: 28px; font-weight: 700; }
.sub { color: #6b7280; font-size: 14px; margin-top: 4px; }
.section-title { font-size: 16px; font-weight: 600; color: #374151; margin: 24px 0 12px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.reduction-alerts { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px; }
.reduction-title { font-weight: 700; font-size: 15px; color: #c2410c; }
.reduction-item { background: #fff; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px 14px; cursor: pointer; display: flex; flex-direction: column; gap: 2px; transition: background 0.15s; }
.reduction-item:hover { background: #fef3c7; }
.reduction-name { font-size: 14px; font-weight: 600; color: #1f2937; }
.reduction-meta { font-size: 12px; color: #92400e; }
.empty { text-align: center; padding: 60px 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; color: #9ca3af; }
</style>
