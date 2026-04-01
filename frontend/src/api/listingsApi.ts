import { apiClient } from './ApiClient.js';
import type { Listing, VerificationResult } from '@/types/Types.js';

export const listingsApi = {
  async getAll(status?: string): Promise<Listing[]> {
    const { data } = await apiClient.get<Listing[]>('/listings', { params: status ? { status } : {} });
    return data;
  },

  async getById(id: number): Promise<Listing> {
    const { data } = await apiClient.get<Listing>(`/listings/${id}`);
    return data;
  },

  async create(dto: {
    title: string; description: string; categoryId: number; categoryName: string;
    price: number; photos: string[];
    condition?: string; city?: string; negotiable?: boolean; shipping?: boolean;
    aiGeneratedDescription?: string;
    reductionPercent?: number; reductionIntervalDays?: number;
  }): Promise<Listing> {
    const { data } = await apiClient.post<Listing>('/listings', dto);
    return data;
  },

  async update(id: number, dto: Partial<{ title: string; description: string; categoryId: number; categoryName: string; price: number; condition: string; city: string; negotiable: boolean; shipping: boolean; reductionPercent: number; reductionIntervalDays: number }>): Promise<Listing> {
    const { data } = await apiClient.put<Listing>(`/listings/${id}`, dto);
    return data;
  },

  async publish(id: number): Promise<Listing> {
    const { data } = await apiClient.post<Listing>(`/listings/${id}/publish`);
    return data;
  },

  async setPrice(id: number, price: number): Promise<Listing> {
    const { data } = await apiClient.post<Listing>(`/listings/${id}/price`, { price });
    return data;
  },

  async deactivate(id: number): Promise<Listing> {
    const { data } = await apiClient.post<Listing>(`/listings/${id}/deactivate`);
    return data;
  },

  async markSold(id: number): Promise<Listing> {
    const { data } = await apiClient.post<Listing>(`/listings/${id}/mark-sold`);
    return data;
  },

  async regenerate(id: number, changeRequest: string): Promise<{ title: string; description: string; suggestedCategory: string; keywords: string[]; officialUrl?: string }> {
    const { data } = await apiClient.post(`/listings/${id}/regenerate`, { changeRequest });
    return data;
  },

  async verify(id: number): Promise<VerificationResult> {
    const { data } = await apiClient.post<VerificationResult>(`/listings/${id}/verify`);
    return data;
  },

  async setPublished(id: number, publishedAt: string): Promise<Listing> {
    const { data } = await apiClient.post<Listing>(`/listings/${id}/set-published`, { publishedAt });
    return data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/listings/${id}`);
  },
};
