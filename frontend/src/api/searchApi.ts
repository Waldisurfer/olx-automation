import { apiClient } from './ApiClient.js';
import type { PriceSuggestion, ListingWithDescription } from '@/types/Types.js';

export const searchApi = {
  async findSimilar(keywords: string, categoryId?: number): Promise<PriceSuggestion> {
    const params: Record<string, string | number> = { keywords };
    if (categoryId) params.categoryId = categoryId;
    const { data } = await apiClient.get<PriceSuggestion>('/search/similar', { params });
    return data;
  },

  async fetchDescriptions(keywords: string): Promise<ListingWithDescription[]> {
    const { data } = await apiClient.get<ListingWithDescription[]>('/search/descriptions', { params: { keywords } });
    return data;
  },
};
