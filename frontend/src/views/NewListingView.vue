<script setup lang="ts">
import { computed } from 'vue';
import { useWizardStore } from '@/stores/useWizardStore.js';
import StepDocumentUpload from '@/components/wizard/StepDocumentUpload.vue';
import StepPhotoUpload from '@/components/wizard/StepPhotoUpload.vue';
import StepMetadata    from '@/components/wizard/StepMetadata.vue';
import StepAnalysis    from '@/components/wizard/StepAnalysis.vue';
import StepPricing     from '@/components/wizard/StepPricing.vue';
import StepReview      from '@/components/wizard/StepReview.vue';

const wizard = useWizardStore();

const steps = [
  { key: 'document', label: 'Dokument', icon: '📄' },
  { key: 'upload',   label: 'Zdjęcia',  icon: '📷' },
  { key: 'metadata', label: 'Dane',     icon: '📝' },
  { key: 'analysis', label: 'AI Opis',  icon: '🤖' },
  { key: 'pricing',  label: 'Cena',     icon: '💰' },
  { key: 'review',   label: 'Publikacja', icon: '🚀' },
];

const currentIndex = computed(() =>
  steps.findIndex((s) => s.key === wizard.currentStep)
);
</script>

<template>
  <div class="container">
    <div class="stepper">
      <template v-for="(s, i) in steps" :key="s.key">
        <div
          class="step-item"
          :class="{
            'step-item--done':   i < currentIndex,
            'step-item--active': i === currentIndex,
          }"
        >
          <div class="dot">
            <span v-if="i < currentIndex">✓</span>
            <span v-else>{{ s.icon }}</span>
          </div>
          <span class="dot-label">{{ s.label }}</span>
        </div>
        <div v-if="i < steps.length - 1" class="connector" :class="{ 'connector--done': i < currentIndex }" />
      </template>
    </div>

    <div class="card">
      <StepDocumentUpload v-if="wizard.currentStep === 'document'" />
      <StepPhotoUpload v-else-if="wizard.currentStep === 'upload'" />
      <StepMetadata    v-else-if="wizard.currentStep === 'metadata'" />
      <StepAnalysis    v-else-if="wizard.currentStep === 'analysis'" />
      <StepPricing     v-else-if="wizard.currentStep === 'pricing'" />
      <StepReview      v-else-if="wizard.currentStep === 'review'" />
    </div>
  </div>
</template>

<style scoped>
.container { max-width: 720px; margin: 0 auto; padding: 32px 20px; }

.stepper {
  display: flex; align-items: center;
  margin-bottom: 28px;
}
.step-item {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  flex-shrink: 0;
}
.connector {
  flex: 1; height: 2px; background: #e5e7eb; margin: 0 4px; margin-bottom: 22px;
  transition: background 0.3s;
}
.connector--done { background: #7c3aed; }

.dot {
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700; z-index: 1;
  background: #e5e7eb; color: #9ca3af;
  border: 2px solid transparent;
  transition: all 0.25s;
}
.step-item--active .dot {
  background: #7c3aed; color: #fff;
  border-color: #a78bfa;
  box-shadow: 0 0 0 4px rgba(124,58,237,0.15);
}
.step-item--done .dot { background: #7c3aed; color: #fff; font-size: 14px; }

.dot-label { font-size: 11px; color: #9ca3af; white-space: nowrap; }
.step-item--active .dot-label { color: #7c3aed; font-weight: 600; }
.step-item--done .dot-label { color: #6d28d9; }

.card {
  background: #fff; border: 1px solid #e5e7eb;
  border-radius: 16px; padding: 28px;
}
</style>
