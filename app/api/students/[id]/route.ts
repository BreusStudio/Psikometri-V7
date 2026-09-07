import { NextRequest } from 'next/server';
import { withApiHandler, apiResponse, ApiError, parseRequestBody } from '@/lib/api';
import { INITIAL_STUDENTS } from '@/lib/presetQuestions';
import { Student } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/students/[id] - Find Student by ID
 */
export const GET = withApiHandler(async (_req: NextRequest, context?: RouteContext) => {
  const params = context?.params ? await context.params : { id: '' };
  const studentId = params.id;

  const student = INITIAL_STUDENTS.find((s) => s.id === studentId);
  if (!student) {
    throw ApiError.notFound(`Siswa dengan NIS/NIM "${studentId}" tidak ditemukan.`);
  }

  return apiResponse.success(student);
});

/**
 * PUT /api/students/[id] - Update Student Details or Answers
 */
export const PUT = withApiHandler(async (req: NextRequest, context?: RouteContext) => {
  const params = context?.params ? await context.params : { id: '' };
  const studentId = params.id;
  const body = await parseRequestBody<Partial<Student>>(req);

  const student = INITIAL_STUDENTS.find((s) => s.id === studentId);
  if (!student) {
    throw ApiError.notFound(`Siswa dengan NIS/NIM "${studentId}" tidak ditemukan.`);
  }

  const updatedStudent: Student = {
    ...student,
    ...body,
    id: studentId, // preserve ID
  };

  return apiResponse.success(updatedStudent, 'Data siswa berhasil diperbarui.');
});

/**
 * DELETE /api/students/[id] - Delete Student Record
 */
export const DELETE = withApiHandler(async (_req: NextRequest, context?: RouteContext) => {
  const params = context?.params ? await context.params : { id: '' };
  const studentId = params.id;

  return apiResponse.success({ id: studentId, deleted: true }, `Siswa dengan NIS/NIM "${studentId}" berhasil dihapus.`);
});
