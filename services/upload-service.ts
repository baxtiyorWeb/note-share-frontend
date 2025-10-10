import api from '@/config/api';
export const UploadService = {
  async uploadAvatar(formData: FormData) {
    try {
      const response = await api.post('/profile/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to upload avatar');
    }
  },

  async uploadCoverImage(formData: FormData) {
    try {
      const response = await api.post('/profile/upload-cover-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to upload cover image');
    }
  },
};