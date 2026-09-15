const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

let inMemoryCsrfToken: string | null = null;

export const setCsrfToken = (token: string | null) => {
  inMemoryCsrfToken = token;
};

export const getCsrfToken = () => inMemoryCsrfToken;

export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  // Send credentials (HttpOnly cookie) with every request
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers,
  };

  // Attach CSRF token on state-changing requests if present
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(method)) {
    // If not on login/register/forgot/reset and token not yet in memory, fetch it via authenticated session
    const isAuthBypass = endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/register') ||
      endpoint.includes('/auth/forgot-password') ||
      endpoint.includes('/auth/reset-password') ||
      endpoint.includes('/auth/csrf');

    if (!isAuthBypass && !inMemoryCsrfToken) {
      try {
        const csrfRes = await fetch(`${API_BASE_URL}/api/v1/auth/csrf`, {
          credentials: 'include',
        });
        if (csrfRes.ok) {
          const csrfData = await csrfRes.json();
          if (csrfData.csrf_token) {
            inMemoryCsrfToken = csrfData.csrf_token;
          }
        }
      } catch {
        // Fallback: let backend handle missing token
      }
    }

    if (inMemoryCsrfToken) {
      headers.set('X-CSRF-Token', inMemoryCsrfToken);
    }
  }


  // If body is an object and not FormData, serialize to JSON
  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    headers.set('Content-Type', 'application/json');
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred.';
    let errorCode: string | undefined;

    try {
      const errorJson = await response.json();
      if (typeof errorJson.detail === 'string') {
        errorDetail = errorJson.detail;
      } else if (errorJson.detail?.message) {
        errorDetail = errorJson.detail.message;
        errorCode = errorJson.detail.code;
      } else if (errorJson.message) {
        errorDetail = errorJson.message;
      }
    } catch {
      errorDetail = response.statusText || errorDetail;
    }

    throw new ApiError(errorDetail, response.status, errorCode);
  }

  // If 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),

  patch: <T = any>(endpoint: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
