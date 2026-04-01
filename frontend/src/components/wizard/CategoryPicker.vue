<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { apiClient } from '@/api/ApiClient.js';

interface Category { id: number; name: string; parentId: number | null }

const props = defineProps<{
  modelValue: { id: number; name: string };
  itemName?: string;
  model?: string;
  description?: string;
  keywords?: string[];
  suggestedCategory?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: { id: number; name: string }];
}>();

const categories = ref<Category[]>([]);
const search = ref('');
const isOpen = ref(false);
const isSuggesting = ref(false);
const suggestionMsg = ref('');

onMounted(async () => {
  const { data } = await apiClient.get<Category[]>('/categories');
  categories.value = data;
});

// Build tree display: "Elektronika > Telefony i Akcesoria"
const withBreadcrumb = computed(() => {
  const map = new Map(categories.value.map((c) => [c.id, c]));
  return categories.value.map((c) => {
    const parent = c.parentId != null ? map.get(c.parentId) : null;
    return {
      ...c,
      label: parent ? `${parent.name} › ${c.name}` : c.name,
    };
  });
});

const filtered = computed(() => {
  if (!search.value) return withBreadcrumb.value.filter((c) => c.parentId !== null).slice(0, 60);
  const q = search.value.toLowerCase();
  return withBreadcrumb.value.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 40);
});

function select(cat: { id: number; name: string; label: string }) {
  emit('update:modelValue', { id: cat.id, name: cat.name });
  search.value = '';
  isOpen.value = false;
  suggestionMsg.value = '';
}

function clear() {
  emit('update:modelValue', { id: 0, name: '' });
  search.value = '';
}

async function suggestCategory() {
  isSuggesting.value = true;
  suggestionMsg.value = '';
  try {
    const { data } = await apiClient.post<{ id: number; name: string }>('/categories/suggest', {
      itemName: props.itemName,
      model: props.model,
      description: props.description,
      keywords: props.keywords,
      suggestedCategory: props.suggestedCategory,
    });
    emit('update:modelValue', { id: data.id, name: data.name });
    suggestionMsg.value = `✓ AI sugeruje: ${data.name}`;
    isOpen.value = false;
  } catch {
    suggestionMsg.value = '✗ Nie udało się pobrać sugestii';
  } finally {
    isSuggesting.value = false;
  }
}

// Close dropdown on outside click
function onBlur(e: FocusEvent) {
  if (!(e.relatedTarget as HTMLElement)?.closest?.('.picker')) {
    isOpen.value = false;
  }
}
</script>

<template>
  <div class="picker" @focusout="onBlur">
    <!-- Selected value display -->
    <div class="selected-row">
      <div
        class="selected-box"
        tabindex="0"
        @click="isOpen = !isOpen"
        @keydown.enter="isOpen = !isOpen"
        @keydown.space.prevent="isOpen = !isOpen"
      >
        <span v-if="modelValue.name" class="selected-name">{{ modelValue.name }}</span>
        <span v-else class="placeholder">Wybierz kategorię...</span>
        <span class="arrow">{{ isOpen ? '▲' : '▼' }}</span>
      </div>

      <button
        class="suggest-btn"
        :class="{ loading: isSuggesting }"
        :disabled="isSuggesting"
        @click="suggestCategory"
        title="Zasugeruj kategorię na podstawie danych przedmiotu"
      >
        <span v-if="isSuggesting">⏳</span>
        <span v-else>🤖 Zasugeruj</span>
      </button>

      <button v-if="modelValue.name" class="clear-btn" @click="clear" title="Wyczyść">✕</button>
    </div>

    <!-- Suggestion feedback -->
    <div v-if="suggestionMsg" class="suggestion-msg" :class="{ ok: suggestionMsg.startsWith('✓') }">
      {{ suggestionMsg }}
    </div>

    <!-- Dropdown -->
    <div v-if="isOpen" class="dropdown">
      <input
        v-model="search"
        placeholder="Szukaj kategorii..."
        class="search-input"
        autofocus
        @keydown.escape="isOpen = false"
      />
      <div class="list">
        <button
          v-for="cat in filtered"
          :key="cat.id"
          class="cat-item"
          :class="{ active: cat.id === modelValue.id }"
          @click="select(cat)"
        >
          <span class="cat-name">{{ cat.label }}</span>
          <span v-if="cat.id === modelValue.id" class="check">✓</span>
        </button>
        <div v-if="filtered.length === 0" class="empty">Brak wyników dla "{{ search }}"</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker { position: relative; }

.selected-row { display: flex; gap: 8px; align-items: center; }
.selected-box {
  flex: 1;
  border: 1px solid #d1d5db; border-radius: 8px;
  padding: 10px 12px; font-size: 14px;
  display: flex; justify-content: space-between; align-items: center;
  cursor: pointer; background: #fff; outline: none;
  transition: border-color 0.15s;
}
.selected-box:focus, .selected-box:hover { border-color: #7c3aed; }
.selected-name { color: #111827; font-weight: 500; }
.placeholder { color: #9ca3af; }
.arrow { color: #9ca3af; font-size: 11px; }

.suggest-btn {
  white-space: nowrap;
  background: #f5f3ff; color: #7c3aed;
  border: 1px solid #ddd6fe; border-radius: 8px;
  padding: 8px 12px; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
  display: flex; align-items: center; gap: 4px;
}
.suggest-btn:hover:not(:disabled) { background: #ede9fe; }
.suggest-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.clear-btn {
  background: none; border: 1px solid #e5e7eb; border-radius: 6px;
  color: #9ca3af; cursor: pointer; padding: 6px 10px; font-size: 13px;
}
.clear-btn:hover { color: #dc2626; border-color: #fca5a5; }

.suggestion-msg {
  font-size: 12px; color: #dc2626; margin-top: 4px; padding-left: 2px;
}
.suggestion-msg.ok { color: #059669; }

.dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: #fff; border: 1px solid #d1d5db; border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 100; overflow: hidden;
}
.search-input {
  width: 100%; padding: 10px 14px; border: none; border-bottom: 1px solid #f3f4f6;
  font-size: 14px; outline: none;
}
.list { max-height: 260px; overflow-y: auto; }
.cat-item {
  width: 100%; padding: 9px 14px; text-align: left;
  background: none; border: none; cursor: pointer; font-size: 13px;
  display: flex; justify-content: space-between; align-items: center;
  transition: background 0.1s;
}
.cat-item:hover { background: #f5f3ff; }
.cat-item.active { background: #f5f3ff; }
.cat-name { color: #374151; }
.check { color: #7c3aed; font-weight: 700; }
.empty { padding: 16px; text-align: center; color: #9ca3af; font-size: 13px; }
</style>
