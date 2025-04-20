export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
}

export interface RequestConfig {
  url: string;
  method: HttpMethod;
  data?: unknown;
  options?: RequestOptions | undefined;
}

export interface FetchResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestConfig;
}

export interface RequestInterceptor {
  onFulfilled: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onRejected?: ((error: unknown) => unknown) | undefined;
}

export interface ResponseInterceptor {
  onFulfilled: <T>(response: FetchResponse<T>) => FetchResponse<T> | Promise<FetchResponse<T>>;
  onRejected?: ((error: unknown) => unknown) | undefined;
}

export interface SSEMessage {
  type: 'start' | 'token' | 'chunk' | 'content_complete' | 'done' | 'error';
  content?: string;
  message_id?: string;
  [key: string]: unknown;
}

export type APIHandler = (url: string, params?: unknown) => Promise<unknown>;
