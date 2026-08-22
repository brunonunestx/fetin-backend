import axios from 'axios';
import { normalizeApiError } from '@/lib/api/api-error';
import { environment } from '@/lib/environment';
import { sessionStore } from '@/lib/session-store';

const httpClient = axios.create({
  baseURL: environment.apiUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const accessToken = sessionStore.getAccessToken();

  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = normalizeApiError(error);
    const isLoginAttempt = axios.isAxiosError(error) && error.config?.url === '/auth/login';

    if (apiError.statusCode === 401 && !isLoginAttempt && sessionStore.getAccessToken()) {
      sessionStore.clear('expired');
    }

    return Promise.reject(apiError);
  },
);

export { httpClient };
