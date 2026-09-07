import { NextRequest } from 'next/server';
import { apiResponse, ApiError } from './response';
import { parsePaginationParams, parseRequestBody } from './handler';

export interface CrudAdapter<T, ID = string> {
  findAll?: (params: { page: number; limit: number; search?: string; sortBy?: string; order?: 'asc' | 'desc' }) => Promise<{ items: T[]; total: number }>;
  findById?: (id: ID) => Promise<T | null>;
  create?: (data: Partial<T>) => Promise<T>;
  update?: (id: ID, data: Partial<T>) => Promise<T | null>;
  delete?: (id: ID) => Promise<boolean>;
}

/**
 * Reusable CRUD Resource Route Generator
 */
export function createResourceHandler<T, ID extends string = string>(adapter: CrudAdapter<T, ID>) {
  return {
    /**
     * GET Collection (List with search & pagination)
     */
    async handleList(req: NextRequest) {
      if (!adapter.findAll) {
        throw ApiError.methodNotAllowed('Aksi list tidak didukung untuk sumber daya ini.');
      }
      const { page, limit, search, sortBy, order } = parsePaginationParams(req);
      const sortOrder: 'asc' | 'desc' = order === 'desc' ? 'desc' : 'asc';
      const result = await adapter.findAll({ page, limit, search, sortBy, order: sortOrder });
      return apiResponse.paginate(result.items, page, limit, result.total);
    },

    /**
     * POST Create Item
     */
    async handleCreate(req: NextRequest) {
      if (!adapter.create) {
        throw ApiError.methodNotAllowed('Aksi pembuatan tidak didukung untuk sumber daya ini.');
      }
      const body = await parseRequestBody<Partial<T>>(req);
      const createdItem = await adapter.create(body);
      return apiResponse.created(createdItem);
    },

    /**
     * GET Single Item by ID
     */
    async handleGetById(id: ID) {
      if (!adapter.findById) {
        throw ApiError.methodNotAllowed('Aksi pencarian per ID tidak didukung.');
      }
      const item = await adapter.findById(id);
      if (!item) {
        throw ApiError.notFound(`Data dengan ID "${id}" tidak ditemukan.`);
      }
      return apiResponse.success(item);
    },

    /**
     * PUT/PATCH Update Item by ID
     */
    async handleUpdate(id: ID, req: NextRequest) {
      if (!adapter.update) {
        throw ApiError.methodNotAllowed('Aksi pembaruan tidak didukung.');
      }
      const body = await parseRequestBody<Partial<T>>(req);
      const updatedItem = await adapter.update(id, body);
      if (!updatedItem) {
        throw ApiError.notFound(`Data dengan ID "${id}" tidak ditemukan untuk diperbarui.`);
      }
      return apiResponse.success(updatedItem, 'Data berhasil diperbarui');
    },

    /**
     * DELETE Item by ID
     */
    async handleDelete(id: ID) {
      if (!adapter.delete) {
        throw ApiError.methodNotAllowed('Aksi penghapusan tidak didukung.');
      }
      const success = await adapter.delete(id);
      if (!success) {
        throw ApiError.notFound(`Data dengan ID "${id}" tidak ditemukan untuk dihapus.`);
      }
      return apiResponse.success({ id, deleted: true }, 'Data berhasil dihapus');
    },
  };
}
