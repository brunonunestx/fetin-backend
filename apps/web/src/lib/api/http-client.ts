import axios from 'axios';
import { environment } from '@/lib/environment';

export const httpClient = axios.create({
  baseURL: environment.apiUrl,
  headers: {
    Accept: 'application/json',
  },
});
