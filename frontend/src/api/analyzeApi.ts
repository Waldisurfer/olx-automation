import { apiClient } from './ApiClient.js';
import type { PhotoAnalysisResult, DocumentExtractResult } from '@/types/Types.js';

export interface ItemMetadata {
  itemName?: string;
  model?: string;
  yearOfProduction?: string;
  category?: string;
  additionalInfo?: string;
}

export const analyzeApi = {
  async analyze(fileIds: string[], metadata?: ItemMetadata): Promise<PhotoAnalysisResult> {
    const { data } = await apiClient.post<PhotoAnalysisResult>('/analyze', { fileIds, metadata });
    return data;
  },

  async extractDocuments(fileIds: string[]): Promise<DocumentExtractResult> {
    const { data } = await apiClient.post<DocumentExtractResult>('/analyze/documents', { fileIds });
    return data;
  },
};
