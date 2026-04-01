import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { listingsApi } from '@/api/listingsApi.js';
import type { Listing } from '@/types/Types.js';

export const useListingsStore = defineStore('listings', () => {
  const listings = ref<Listing[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const reductionsDue = computed(() => {
    const now = new Date();
    return listings.value.filter(
      (l) => l.status === 'active' && l.nextReductionAt && new Date(l.nextReductionAt) <= now
    );
  });

  async function fetchAll() {
    isLoading.value = true;
    error.value = null;
    try {
      listings.value = await listingsApi.getAll();
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteListing(id: number) {
    await listingsApi.delete(id);
    listings.value = listings.value.filter((l) => l.id !== id);
  }

  async function markSold(id: number) {
    const updated = await listingsApi.markSold(id);
    const idx = listings.value.findIndex((l) => l.id === id);
    if (idx !== -1) listings.value[idx] = updated;
    return updated;
  }

  return { listings, isLoading, error, reductionsDue, fetchAll, deleteListing, markSold };
});
