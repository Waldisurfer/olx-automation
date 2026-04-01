<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import StatusBadge from './StatusBadge.vue';
import type { Listing } from '@/types/Types.js';
import { uploadUrl } from '@/utils/urls.js';

const props = defineProps<{ listing: Listing }>();
const router = useRouter();

const thumbUrl = computed(() =>
  props.listing.photos[0] ? uploadUrl(props.listing.photos[0]) : null
);

const nextReduction = computed(() => {
  if (!props.listing.nextReductionAt) return null;
  const d = new Date(props.listing.nextReductionAt);
  return d.toLocaleDateString('pl-PL');
});
</script>

<template>
  <div class="card" @click="router.push(`/listings/${listing.id}`)">
    <div class="thumb">
      <img v-if="thumbUrl" :src="thumbUrl" :alt="listing.title" />
      <div v-else class="no-thumb">📦</div>
    </div>
    <div class="body">
      <div class="top">
        <StatusBadge :status="listing.status" />
      </div>
      <h3 class="title">{{ listing.title }}</h3>
      <div class="price">{{ listing.price.toLocaleString('pl-PL') }} PLN</div>
      <div v-if="nextReduction && listing.status === 'active'" class="next-reduction">
        Obniżka: {{ nextReduction }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;
}
.card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }
.thumb { height: 160px; background: #f9fafb; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.no-thumb { font-size: 48px; }
.body { padding: 14px; }
.top { margin-bottom: 8px; }
.title { font-size: 14px; font-weight: 600; color: #111827; margin: 0 0 6px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.price { font-size: 18px; font-weight: 700; color: #7c3aed; }
.next-reduction { font-size: 12px; color: #9ca3af; margin-top: 4px; }
</style>
