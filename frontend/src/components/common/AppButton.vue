<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
}>();
</script>

<template>
  <button
    :class="['btn', `btn--${variant ?? 'primary'}`, `btn--${size ?? 'md'}`, { 'btn--loading': loading }]"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="spinner" />
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn:not(:disabled):hover { opacity: 0.88; }
.btn:not(:disabled):active { transform: scale(0.97); }
.btn--md { padding: 10px 20px; font-size: 14px; }
.btn--sm { padding: 6px 14px; font-size: 13px; }
.btn--primary { background: #7c3aed; color: #fff; }
.btn--secondary { background: #f3f0ff; color: #7c3aed; }
.btn--danger { background: #fee2e2; color: #dc2626; }
.btn--ghost { background: transparent; color: #6b7280; border: 1px solid #e5e7eb; }
.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
