import { NextResponse } from 'next/server';
import { ApiResponse, ApiPaginationMeta, ApiErrorDetail } from './types';

/**
 * Custom Error class for RESTful API responses
 */
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;
  public errors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    details?: unknown,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.errors = errors;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  static badRequest(message: string = 'Permintaan tidak valid', errors?: Record<string, string[]>, details?: unknown) {
    return new ApiError(message, 400, 'BAD_REQUEST', details, errors);
  }

  static unauthorized(message: string = 'Akses tidak diizinkan. Silakan login terlebih dahulu.') {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Anda tidak memiliki hak akses untuk sumber daya ini.') {
    return new ApiError(message, 403, 'FORBIDDEN');
  }

  static notFound(message: string = 'Sumber daya tidak ditemukan.') {
    return new ApiError(message, 404, 'NOT_FOUND');
  }

  static methodNotAllowed(message: string = 'Metode HTTP tidak diizinkan.') {
    return new ApiError(message, 405, 'METHOD_NOT_ALLOWED');
  }

  static conflict(message: string = 'Terjadi konflik pada data.') {
    return new ApiError(message, 409, 'CONFLICT');
  }

  static unprocessableEntity(message: string = 'Data tidak dapat diproses.', errors?: Record<string, string[]>) {
    return new ApiError(message, 422, 'UNPROCESSABLE_ENTITY', undefined, errors);
  }

  static internal(message: string = 'Terjadi kesalahan internal server.', details?: unknown) {
    return new ApiError(message, 500, 'INTERNAL_SERVER_ERROR', details);
  }
}

/**
 * Standardized RESTful API Response Builder
 */
export const apiResponse = {
  /**
   * Return a successful response (200 OK by default)
   */
  success<T>(
    data: T,
    message?: string,
    statusCode: number = 200,
    meta?: ApiPaginationMeta,
    headers?: Record<string, string>
  ): NextResponse<ApiResponse<T>> {
    const payload: ApiResponse<T> = {
      success: true,
      data,
      ...(message && { message }),
      ...(meta && { meta }),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  },

  /**
   * Return a 201 Created response
   */
  created<T>(data: T, message: string = 'Data berhasil dibuat', meta?: ApiPaginationMeta): NextResponse<ApiResponse<T>> {
    return apiResponse.success(data, message, 201, meta);
  },

  /**
   * Return a 204 No Content response
   */
  noContent(): NextResponse {
    return new NextResponse(null, { status: 204 });
  },

  /**
   * Return a paginated list response
   */
  paginate<T>(
    items: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): NextResponse<ApiResponse<T[]>> {
    const totalPages = Math.ceil(total / (limit || 1)) || 1;
    const meta: ApiPaginationMeta = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      total: Number(total) || 0,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return apiResponse.success(items, message, 200, meta);
  },

  /**
   * Return an error response
   */
  error(
    errorOrMessage: ApiError | Error | string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    details?: unknown,
    errors?: Record<string, string[]>
  ): NextResponse<ApiResponse<never>> {
    let finalStatus = statusCode;
    let errorDetail: ApiErrorDetail = {
      code,
      message: typeof errorOrMessage === 'string' ? errorOrMessage : errorOrMessage.message || 'Terjadi kesalahan',
      details,
      errors,
    };

    if (errorOrMessage instanceof ApiError) {
      finalStatus = errorOrMessage.statusCode;
      errorDetail = {
        code: errorOrMessage.code,
        message: errorOrMessage.message,
        details: errorOrMessage.details,
        errors: errorOrMessage.errors,
      };
    } else if (errorOrMessage instanceof Error) {
      errorDetail.message = errorOrMessage.message;
    }

    const payload: ApiResponse<never> = {
      success: false,
      error: errorDetail,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      status: finalStatus,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Convenience error methods
  badRequest(message: string, errors?: Record<string, string[]>, details?: unknown) {
    return apiResponse.error(ApiError.badRequest(message, errors, details));
  },

  unauthorized(message?: string) {
    return apiResponse.error(ApiError.unauthorized(message));
  },

  forbidden(message?: string) {
    return apiResponse.error(ApiError.forbidden(message));
  },

  notFound(message?: string) {
    return apiResponse.error(ApiError.notFound(message));
  },

  internal(message?: string, details?: unknown) {
    return apiResponse.error(ApiError.internal(message, details));
  },
};
