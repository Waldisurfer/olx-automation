import axios from 'axios';

export const uploadApi = {
  async uploadPhotos(files: File[]): Promise<{ fileIds: string[]; previewUrls: string[] }> {
    const form = new FormData();
    files.forEach((f) => form.append('photos', f));
    const { data } = await axios.post('/api/upload/photos', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deletePhoto(fileId: string): Promise<void> {
    await axios.delete(`/api/upload/photos/${fileId}`);
  },
};
