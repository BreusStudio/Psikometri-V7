import { ApiResponse, RequestOptions } from './types';

export class ApiClientError extends Error {
  public status: number;
  public code: string;
  public details?: unknown;
  public errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number = 500,
    code: string = 'CLIENT_ERROR',
    details?: unknown,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.errors = errors;
  }
}

/**
 * Universal Reusable RESTful API Client for Client & Server
 */
export class RestClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private tokenGetter?: () => string | null | undefined;

  constructor(
    baseUrl: string = '',
    defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  ) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = defaultHeaders;
  }

  /**
   * Set authentication token callback
   */
  public setTokenGetter(getter: () => string | null | undefined) {
    this.tokenGetter = getter;
  }

  /**
   * Build query parameters string
   */
  private buildQueryString(params?: Record<string, string | number | boolean | undefined | null>): string {
    if (!params) return '';
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const stringified = query.toString();
    return stringified ? `?${stringified}` : '';
  }

  /**
   * Universal fetch runner with timeout, error handling, and response unwrapping
   */
  public async request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const {
      params,
      body,
      timeout = 15000,
      retries = 0,
      headers: customHeaders,
      token,
      ...fetchOptions
    } = options;

    const queryString = this.buildQueryString(params);
    const fullUrl = `${this.baseUrl}${endpoint}${queryString}`;

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(customHeaders as Record<string, string>),
    };

    // Attach Bearer token if provided or configured via tokenGetter
    const authToken = token || (this.tokenGetter ? this.tokenGetter() : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= retries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(fullUrl, {
          ...fetchOptions,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle empty responses (like 204 No Content)
        if (response.status === 204) {
          return {
            success: true,
            timestamp: new Date().toISOString(),
          };
        }

        let jsonResponse: ApiResponse<T>;
        try {
          jsonResponse = await response.json();
        } catch (err) {
          throw new ApiClientError(
            `Gagal memproses respons dari server (${response.status} ${response.statusText})`,
            response.status,
            'INVALID_RESPONSE'
          );
        }

        if (!response.ok || jsonResponse.success === false) {
          const errDetail = jsonResponse.error;
          throw new ApiClientError(
            errDetail?.message || `Permintaan gagal dengan status ${response.status}`,
            response.status,
            errDetail?.code || 'HTTP_ERROR',
            errDetail?.details,
            errDetail?.errors
          );
        }

        return jsonResponse;
      } catch (err: unknown) {
        clearTimeout(timeoutId);

        if (err instanceof ApiClientError) {
          throw err;
        }

        const isAbort = err instanceof Error && err.name === 'AbortError';
        const errorMessage = isAbort
          ? `Koneksi timeout setelah ${timeout / 1000} detik`
          : (err instanceof Error ? err.message : 'Terjadi kesalahan jaringan');

        lastError = new ApiClientError(errorMessage, 0, isAbort ? 'TIMEOUT' : 'NETWORK_ERROR');

        attempt++;
        if (attempt <= retries) {
          // Exponential backoff delay
          await new Promise((res) => setTimeout(res, 500 * Math.pow(2, attempt - 1)));
        }
      }
    }

    throw lastError || new ApiClientError('Permintaan gagal secara tidak terduga', 500, 'UNEXPECTED');
  }

  // REST Method Helpers

  public async get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  public async put<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  public async patch<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  public async delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Default Singleton Instance for application-wide REST client
 */
export const restClient = new RestClient();
