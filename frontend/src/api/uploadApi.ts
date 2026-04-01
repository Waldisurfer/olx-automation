import { apiClient } from './ApiClient.js';

export const uploadApi = {
  async uploadPhotos(files: File[]): Promise<{ fileIds: string[]; previewUrls: string[] }> {
    const form = new FormData();
    files.forEach((f) => form.append('photos', f));
    const { data } = await apiClient.post('/upload/photos', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deletePhoto(fileId: string): Promise<void> {
    await apiClient.delete(`/upload/photos/${fileId}`);
  },
};
