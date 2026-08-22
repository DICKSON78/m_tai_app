import Constants from 'expo-constants';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken, clearAuth } from '../utils/storage';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://mtai-app-903291264005.africa-south1.run.app';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await clearAuth();
    }
    return Promise.reject(error);
  }
);

export default api;
