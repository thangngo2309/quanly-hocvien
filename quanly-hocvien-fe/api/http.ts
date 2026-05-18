import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

http.interceptors.response.use(
  response => response,
  error => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Có lỗi xảy ra khi gọi API';

    if (Array.isArray(message)) {
      return Promise.reject(new Error(message.join(', ')));
    }

    return Promise.reject(new Error(message));
  },
);