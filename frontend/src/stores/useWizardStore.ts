import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { WizardStep, PhotoAnalysisResult, PriceSuggestion, ItemMetadata } from '@/types/Types.js';

export const useWizardStore = defineStore('wizard', () => {
  const currentStep = ref<WizardStep>('document');
  // Document photos (receipt/invoice/nameplate) — used by AI for info extraction
  const documentFileIds = ref<string[]>([]);
  const documentPreviewUrls = ref<string[]>([]);
  // Listing photos — shown in OLX listing, NOT analyzed by AI
  const uploadedFileIds = ref<string[]>([]);
  const previewUrls = ref<string[]>([]);

  const metadata = ref<ItemMetadata>({
    itemName: '',
    model: '',
    yearOfProduction: '',
    category: '',
    additionalInfo: '',
  });

  const analysisResult = ref<PhotoAnalysisResult | null>(null);
  const editedTitle = ref('');
  const editedDescription = ref('');
  const editedCategory = ref({ id: 0, name: '' });
  const priceSuggestion = ref<PriceSuggestion | null>(null);
  const finalPrice = ref<number>(0);
  const reductionPercent = ref(10);
  const reductionIntervalDays = ref(14);
  const condition = ref<import('@/types/Types.js').Condition>('używany_dobry');
  const city = ref('');
  const negotiable = ref(true);
  const shipping = ref(false);

  function setDocumentResult(fileIds: string[], urls: string[]) {
    documentFileIds.value = fileIds;
    documentPreviewUrls.value = urls;
  }

  function setUploadResult(fileIds: string[], urls: string[]) {
    uploadedFileIds.value = fileIds;
    previewUrls.value = urls;
  }

  function setAnalysisResult(result: PhotoAnalysisResult) {
    analysisResult.value = result;
    editedTitle.value = result.title;
    let desc = result.description;
    if (result.officialUrl && !desc.includes(result.officialUrl)) {
      desc += `\n\nWięcej info: ${result.officialUrl}`;
    }
    editedDescription.value = desc;
    if (result.suggestedCategory && !editedCategory.value.name) {
      editedCategory.value = { id: 0, name: result.suggestedCategory };
    }
    if (result.condition) {
      condition.value = result.condition as import('@/types/Types.js').Condition;
    }
  }

  function setPriceSuggestion(s: PriceSuggestion) {
    priceSuggestion.value = s;
    finalPrice.value = s.suggestedPrice;
  }

  const STEPS: WizardStep[] = ['document', 'upload', 'metadata', 'analysis', 'pricing', 'review'];

  function nextStep() {
    const idx = STEPS.indexOf(currentStep.value);
    if (idx < STEPS.length - 1) currentStep.value = STEPS[idx + 1];
  }

  function prevStep() {
    const idx = STEPS.indexOf(currentStep.value);
    if (idx > 0) currentStep.value = STEPS[idx - 1];
  }

  function reset() {
    currentStep.value = 'document';
    documentFileIds.value = [];
    documentPreviewUrls.value = [];
    uploadedFileIds.value = [];
    previewUrls.value = [];
    metadata.value = { itemName: '', model: '', yearOfProduction: '', category: '', additionalInfo: '' };
    analysisResult.value = null;
    editedTitle.value = '';
    editedDescription.value = '';
    editedCategory.value = { id: 0, name: '' };
    priceSuggestion.value = null;
    finalPrice.value = 0;
    reductionPercent.value = 10;
    reductionIntervalDays.value = 14;
    condition.value = 'używany_dobry';
    city.value = '';
    negotiable.value = true;
    shipping.value = false;
  }

  return {
    currentStep, documentFileIds, documentPreviewUrls, uploadedFileIds, previewUrls, metadata,
    analysisResult, editedTitle, editedDescription, editedCategory,
    priceSuggestion, finalPrice, reductionPercent, reductionIntervalDays,
    condition, city, negotiable, shipping,
    setDocumentResult, setUploadResult, setAnalysisResult, setPriceSuggestion,
    nextStep, prevStep, reset,
  };
});
