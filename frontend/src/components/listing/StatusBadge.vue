<script setup lang="ts">
import type { ListingStatus } from '@/types/Types.js';
const props = defineProps<{ status: ListingStatus }>();

const map: Record<ListingStatus, { label: string; cls: string }> = {
  draft:   { label: 'Szkic',    cls: 'gray'   },
  active:  { label: 'Aktywne',  cls: 'green'  },
  sold:    { label: 'Sprzedane',cls: 'blue'   },
  expired: { label: 'Wygasłe', cls: 'yellow' },
  paused:  { label: 'Wstrzymane', cls: 'orange' },
};
const info = map[props.status] ?? { label: props.status, cls: 'gray' };
</script>

<template>
  <span :class="['badge', `badge--${info.cls}`]">{{ info.label }}</span>
</template>

<style scoped>
.badge { display: inline-block; padding: 2px 10px; border-radius: 100px; font-size: 12px; font-weight: 600; }
.badge--green  { background: #d1fae5; color: #065f46; }
.badge--gray   { background: #f3f4f6; color: #374151; }
.badge--blue   { background: #dbeafe; color: #1e40af; }
.badge--yellow { background: #fef3c7; color: #92400e; }
.badge--orange { background: #ffedd5; color: #9a3412; }
</style>
