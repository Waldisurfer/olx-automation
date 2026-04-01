<script setup lang="ts">
defineProps<{ label?: string }>();
</script>

<template>
  <div class="loading">
    <div class="ring" />
    <p v-if="label" class="label">{{ label }}</p>
  </div>
</template>

<style scoped>
.loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; }
.ring {
  width: 40px; height: 40px;
  border: 3px solid #e9d5ff;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.label { color: #9ca3af; font-size: 14px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
