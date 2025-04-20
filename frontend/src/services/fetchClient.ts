// === fetchClient.ts ===

// Add proper type declarations for browser APIs
declare const localStorage: Storage;
declare const document: Document;
declare const fetch: typeof window.fetch;
declare const console: Console;

// Import the StreamingResponse type
import { StreamingResponse } from './chatApi';

// Define RequestOptions type to replace 'any'
interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Define a type for JSON data
type JsonData = Record<string, unknown>;

// Define response type with data
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
  json: () => Promise<T>;
  text: () => Promise<string>;
}

const getAuthToken = () => localStorage.getItem('authToken');
const getCsrfToken = () =>
  document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];

// Function to fetch CSRF token from server
const fetchCsrfToken = async () => {
  await fetch('http://localhost:8000/api/v1/core/csrf-token/', {
    method: 'GET',
    credentials: 'include',
  });
  return getCsrfToken();
};

const isLoginRoute = (url: string) => url.includes('/auth/login');

// Define the return type of prepareRequest
type PrepareRequestResult = [string, RequestInit];

const prepareRequest = (
  url: string,
  method: string,
  body: FormData | JsonData | null = null,
  options: RequestOptions = {}
): PrepareRequestResult => {
  url = 'http://localhost:8000/api/v1' + url;
  const isLogin = isLoginRoute(url);
  const authToken = getAuthToken();
  const csrfToken = getCsrfToken();

  // Debug headers being sent for non-GET requests
  if (import.meta.env.DEV && method !== 'GET') {
    console.log(`🔄 ${method} request to ${url}`);
    console.log('Auth token present:', !!authToken);
    console.log('CSRF token present:', !!csrfToken);
    console.log('Is login route:', isLogin);
  }

  // All non-GET requests need CSRF token regardless of login state
  const needsCsrf = method !== 'GET';

  const headers = {
    ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    // Use 'Token' prefix instead of 'Bearer' for Django REST Framework's TokenAuthentication
    ...(authToken ? { Authorization: `Token ${authToken}` } : {}),
    // Include CSRF token for all non-GET requests
    ...(csrfToken && needsCsrf ? { 'X-CSRFToken': csrfToken } : {}),
    ...(options.headers || {}),
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: 'include', // Always include credentials
    ...options,
  };

  if (body) {
    fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  if (import.meta.env.DEV && method !== 'GET') {
    console.log('Request headers:', headers);
  }

  return [url, fetchOptions];
};

const fetchClient = async <T = unknown>(
  url: string,
  method: string = 'GET',
  body: FormData | JsonData | null = null,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> => {
  if (method !== 'GET' && !getCsrfToken()) {
    await fetchCsrfToken();
  }
  const [finalUrl, fetchOptions] = prepareRequest(url, method, body, options);
  try {
    const response = await fetch(finalUrl, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `HTTP ${response.status}: ${errorData.detail || errorData.message || response.statusText}`
      );
    }

    // Parse JSON data if possible
    let data: T;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as unknown as T;
    }

    return {
      data,
      status: response.status,
      headers: response.headers,
      json: () => response.json(),
      text: () => response.text(),
    };
  } catch (error) {
    console.error(`Request to ${finalUrl} failed:`, error);
    throw error;
  }
};

// === Streaming Support ===

const stream = async (
  url: string,
  options: RequestOptions = {},
  onChunk: (chunk: StreamingResponse | string) => void
) => {
  const [finalUrl, fetchOptions] = prepareRequest(url, 'GET', null, options);

  const response = await fetch(finalUrl, fetchOptions);

  if (!response.ok) {
    throw new Error(`Streaming error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = (await reader?.read()) || { done: true, value: null };
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          // Try to parse the chunk as JSON
          const jsonData = JSON.parse(line);
          onChunk(jsonData);
        } catch (error) {
          // If parsing fails, pass the raw string
          console.warn('Failed to parse streaming chunk as JSON:', error);
          onChunk(line);
        }
      }
    }
  }
};

// Add initializeApi function to be called at app startup
const initializeApi = async () => {
  return await fetchCsrfToken();
};

const api = {
  get: <T = unknown>(url: string, options: RequestOptions = {}) =>
    fetchClient<T>(url, 'GET', null, options),
  post: <T = unknown>(url: string, body: JsonData, options: RequestOptions = {}) =>
    fetchClient<T>(url, 'POST', body, options),
  patch: <T = unknown>(url: string, body: JsonData, options: RequestOptions = {}) =>
    fetchClient<T>(url, 'PATCH', body, options),
  put: <T = unknown>(url: string, body: JsonData, options: RequestOptions = {}) =>
    fetchClient<T>(url, 'PUT', body, options),
  delete: <T = unknown>(url: string, options: RequestOptions = {}) =>
    fetchClient<T>(url, 'DELETE', null, options),
  stream,
  initialize: initializeApi,
};

// Auto-initialize the API when this module is imported
// This will fetch the CSRF token as soon as possible
// Only do this in browser environments (not during SSR)
if (typeof window !== 'undefined') {
  // Initialize in the background - don't block module loading
  initializeApi().catch(err => {
    console.error('Failed to auto-initialize API:', err);
  });
}

export default api;
