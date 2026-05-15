import axios, { type AxiosInstance } from 'axios';
import { logger } from './logger.js';

export type AuthMode = 'bearer' | 'header' | 'none';

export interface HttpClientOptions {
  baseURL: string;
  timeout: number;
  apiKey?: string;
  authMode?: AuthMode;
  apiKeyHeader?: string;
  providerName: string;
}

export function createHttpClient(options: HttpClientOptions): AxiosInstance {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const authMode = options.authMode ?? (options.apiKeyHeader ? 'header' : 'none');

  if (options.apiKey) {
    if (authMode === 'bearer') {
      headers.Authorization = `Bearer ${options.apiKey}`;
    } else if (authMode === 'header' && options.apiKeyHeader) {
      headers[options.apiKeyHeader] = options.apiKey;
    }
  }

  const client = axios.create({
    baseURL: options.baseURL,
    timeout: options.timeout,
    headers,
  });

  client.interceptors.request.use((config) => {
    const start = Date.now();
    config.metadata = { startTime: start };
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      const start = response.config.metadata?.startTime ?? Date.now();
      const duration = Date.now() - start;
      logger.debug(
        { provider: options.providerName, duration, url: response.config.url },
        'Provider request completed',
      );
      return response;
    },
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        logger.warn(
          {
            provider: options.providerName,
            status,
            url: error.config?.url,
            message: error.message,
          },
          'Provider request failed',
        );
      }
      return Promise.reject(error);
    },
  );

  return client;
}

declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: { startTime: number };
  }
}
