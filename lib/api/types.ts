/**
 * Standard RESTful API Core Type Definitions
 */

export interface ApiPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: ApiPaginationMeta;
  error?: ApiErrorDetail;
  timestamp: string;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  timeout?: number; // in milliseconds
  retries?: number;
  token?: string;
}

export interface ApiRouteOptions<T = unknown> {
  requireAuth?: boolean;
  allowedRoles?: string[];
  validateBody?: (body: unknown) => { valid: boolean; error?: string; errors?: Record<string, string[]> };
  cors?: boolean;
}

export type ApiRouteHandler = (
  req: import('next/server').NextRequest,
  context?: any
) => Promise<import('next/server').NextResponse>;
