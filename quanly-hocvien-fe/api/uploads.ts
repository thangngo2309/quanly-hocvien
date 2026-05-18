import { http } from './http';

export type UploadAvatarResponse = {
  filename: string;
  url: string;
  full_url: string;
};

export const uploadsApi = {
  async uploadStudentAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await http.post<UploadAvatarResponse>(
      '/students/upload-avatar',
      formData,
    );

    return res.data;
  },
};