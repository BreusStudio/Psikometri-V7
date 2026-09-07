import { NextRequest } from "next/server";
import { getServerConfig, saveServerConfig } from "@/lib/serverConfig";
import { initSupabaseClient } from "@/lib/supabase";
import { INITIAL_TEACHERS } from "@/lib/presetQuestions";
import { withApiHandler, apiResponse, ApiError, parseRequestBody } from "@/lib/api";

export const GET = withApiHandler(async () => {
  const config = getServerConfig();
  return {
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
    isGeminiConfigured: !!config.geminiApiKey
  };
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await parseRequestBody<Record<string, any>>(req);
  const { supabaseUrl, supabaseAnonKey, geminiApiKey, teacherId, password } = body;

  if (teacherId && password) {
    const teacher = INITIAL_TEACHERS.find((t: any) => t.id === teacherId && t.password === password);
    if (!teacher || !['Superadmin', 'Admin'].includes(teacher.role)) {
      throw ApiError.forbidden("Kredensial salah atau Anda tidak memiliki akses Superadmin/Admin.");
    }
  } else {
    throw ApiError.unauthorized("Kredensial Superadmin / Admin diperlukan untuk menyimpan konfigurasi.");
  }

  const success = saveServerConfig({
    supabaseUrl,
    supabaseAnonKey,
    geminiApiKey
  });

  if (success) {
    initSupabaseClient(supabaseUrl, supabaseAnonKey);
    return apiResponse.success(
      { supabaseUrl, supabaseAnonKey, isGeminiConfigured: !!geminiApiKey },
      "Konfigurasi berhasil disimpan dan diterapkan!"
    );
  } else {
    throw ApiError.internal("Gagal menyimpan konfigurasi ke server.");
  }
});

