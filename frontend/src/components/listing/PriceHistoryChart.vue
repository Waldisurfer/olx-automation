<script setup lang="ts">
import { computed } from 'vue';
import type { PriceHistoryEntry } from '@/types/Types.js';

const props = defineProps<{ history: PriceHistoryEntry[] }>();

const W = 500, H = 120, PAD = 20;

const points = computed(() => {
  if (props.history.length < 2) return null;
  const prices = props.history.map((h) => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const n = props.history.length;

  return props.history.map((h, i) => ({
    x: PAD + (i / (n - 1)) * (W - PAD * 2),
    y: PAD + (1 - (h.price - min) / range) * (H - PAD * 2),
    price: h.price,
    label: new Date(h.recordedAt).toLocaleDateString('pl-PL'),
  }));
});

const polyline = computed(() =>
  points.value ? points.value.map((p) => `${p.x},${p.y}`).join(' ') : ''
);
</script>

<template>
  <div v-if="history.length >= 2" class="chart">
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" class="svg">
      <polyline
        :points="polyline"
        fill="none"
        stroke="#7c3aed"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle
        v-for="p in points"
        :key="p.x"
        :cx="p.x"
        :cy="p.y"
        r="4"
        fill="#7c3aed"
      >
        <title>{{ p.price.toLocaleString('pl-PL') }} PLN – {{ p.label }}</title>
      </circle>
    </svg>
    <div class="labels">
      <span>{{ history[0].price.toLocaleString('pl-PL') }} PLN</span>
      <span>{{ history[history.length - 1].price.toLocaleString('pl-PL') }} PLN</span>
    </div>
  </div>
  <p v-else class="empty">Historia cen pojawi się po pierwszej obniżce.</p>
</template>

<style scoped>
.chart { background: #f9fafb; border-radius: 10px; padding: 12px; }
.svg { width: 100%; height: 120px; display: block; }
.labels { display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; margin-top: 4px; }
.empty { color: #9ca3af; font-size: 14px; }
</style>
