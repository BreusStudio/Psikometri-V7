import { NextRequest, NextResponse } from 'next/server';
import { apiResponse, ApiError } from './response';
import { ApiRouteOptions } from './types';

/**
 * Helper to safely extract JSON body from NextRequest
 */
export async function parseRequestBody<T = Record<string, unknown>>(req: NextRequest): Promise<T> {
  try {
    const text = await req.text();
    if (!text || text.trim() === '') {
      return {} as T;
    }
    return JSON.parse(text) as T;
  } catch (err) {
    throw ApiError.badRequest('Format JSON pada request body tidak valid.');
  }
}

/**
 * Helper to extract pagination parameters from NextRequest query string
 */
export function parsePaginationParams(req: NextRequest, defaultLimit: number = 10) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || String(defaultLimit), 10)));
  const search = searchParams.get('q') || searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || searchParams.get('sort') || '';
  const order = (searchParams.get('order') || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

  return { page, limit, search, sortBy, order, searchParams };
}

/**
 * Higher-Order Function to wrap Next.js App Router API route handlers with unified error handling,
 * validation, and standardized REST response format.
 */
export function withApiHandler<T = unknown>(
  handler: (req: NextRequest, context?: any) => Promise<unknown>,
  options: ApiRouteOptions<T> = {}
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Handle CORS preflight
      if (req.method === 'OPTIONS' && options.cors) {
        return new NextResponse(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          },
        });
      }

      // Optional request body validation for state-changing methods
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && options.validateBody) {
        const body = await parseRequestBody(req.clone() as NextRequest);
        const validation = options.validateBody(body);
        if (!validation.valid) {
          throw ApiError.badRequest(
            validation.error || 'Validasi data gagal',
            validation.errors
          );
        }
      }

      // Execute main business logic handler
      const result = await handler(req, context);

      // If handler returned a NextResponse directly, return it
      if (result instanceof NextResponse) {
        if (options.cors) {
          result.headers.set('Access-Control-Allow-Origin', '*');
        }
        return result;
      }

      // Automatically wrap returned JS objects into standard REST response format
      return apiResponse.success(result) as NextResponse;
    } catch (error: unknown) {
      console.error(`[API ERROR] [${req.method}] ${req.nextUrl?.pathname || req.url}:`, error);

      if (error instanceof ApiError) {
        return apiResponse.error(error);
      }

      if (error instanceof Error) {
        return apiResponse.error(
          ApiError.internal(error.message || 'Terjadi kesalahan tidak terduga pada server.')
        );
      }

      return apiResponse.error(ApiError.internal('Terjadi kesalahan yang tidak diketahui.'));
    }
  };
}
