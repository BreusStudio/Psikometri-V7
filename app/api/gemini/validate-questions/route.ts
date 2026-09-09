import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/core/gemini";
import { Type } from "@google/genai";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questions } = body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Daftar soal (questions) tidak ditemukan atau kosong." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isMockKey = !apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "";

    if (isMockKey) {
      // Graceful local fallback for frictionless previewing
      const mockedMappings = generateMockMappings(questions);
      return NextResponse.json({
        success: true,
        isMocked: true,
        mappings: mockedMappings,
        message: "Menggunakan validasi lokal (Kunci API Gemini belum dikonfigurasi di Secrets panel)."
      });
    }

    const ai = getGeminiClient();

    const prompt = `Analisis pernyataan soal psikotes berikut dan tentukan kecocokan konteks instansinya.
Setiap soal bisa digunakan di satu atau LEBIH instansi berikut:
- 'sekolah_sd': Sekolah Dasar (SD)
- 'sekolah_smp': Sekolah Menengah Pertama (SMP)
- 'sekolah_sma': Sekolah Menengah Atas (SMA)
- 'sekolah_smk': Sekolah Menengah Kejuruan (SMK)
- 'personal': B2C / Personal (Mandiri)
- 'instansi_pemerintah': Instansi Pemerintahan / Sektor Publik
- 'perusahaan': Perusahaan (Korporat / HRD)

Aturan Klasifikasi:
1. Soal kognitif dasar, minat sederhana, atau bimbingan dasar cocok untuk anak sekolah (SD, SMP).
2. Soal penjurusan karir vokasional, kejuruan, dan minat teknik sangat cocok untuk 'sekolah_smk'.
3. Soal minat akademik murni, riset ilmiah, dan peminatan sains cocok untuk 'sekolah_sma'.
4. Soal kepemimpinan tingkat lanjut, kompetensi industri spesifik, kesiapan kerja korporat, dan kerja tim di kantor cocok untuk 'perusahaan'.
5. Soal pelayanan publik, birokrasi, atau integritas aparatur cocok untuk 'instansi_pemerintah'.
6. Soal umum/bakat mandiri cocok untuk 'personal'.

Daftar Soal yang perlu dianalisis:
${JSON.stringify(questions.slice(0, 35).map(q => ({ id: q.id, text: q.text, testType: q.testType, dimension: q.dimension })), null, 2)}

Berikan output berformat JSON terstruktur yang berisi pemetaan instansi untuk setiap soal.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Anda adalah pakar psikologi pendidikan dan penyelarasan karir vokasi. Tugas Anda adalah memvalidasi butir soal psikotes dan memetakan butir soal tersebut ke konteks instansi yang paling relevan (satu atau beberapa instansi) secara akurat berdasarkan bahasa, kompleksitas, dan domain dimensi yang dievaluasi.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionId: {
                  type: Type.STRING,
                  description: "ID soal dari data masukan"
                },
                suggestedContexts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING
                  },
                  description: "Array berisi kode konteks instansi yang cocok (pilihan: sekolah_sd, sekolah_smp, sekolah_sma, sekolah_smk, personal, instansi_pemerintah, perusahaan)"
                },
                explanation: {
                  type: Type.STRING,
                  description: "Alasan psikologis mengapa soal tersebut cocok dengan instansi tersebut dalam 1 kalimat ringkas"
                }
              },
              required: ["questionId", "suggestedContexts", "explanation"]
            }
          }
        }
      });

      const textOutput = response.text || "[]";
      const parsedMappings = JSON.parse(textOutput);

      // If input has more than 35 questions, complement the rest with local heuristics
      let finalMappings = parsedMappings;
      if (questions.length > 35) {
        const remainingQuestions = questions.slice(35);
        const complementary = generateMockMappings(remainingQuestions);
        finalMappings = [...parsedMappings, ...complementary];
      }

      return NextResponse.json({
        success: true,
        isMocked: false,
        mappings: finalMappings
      });
    } catch (apiError: any) {
      console.warn("Gemini API call failed or quota exceeded, switching to deterministic heuristic engine:", apiError?.message);
      
      const isQuota = String(apiError?.message || "").toLowerCase().includes("quota") || 
                      String(apiError?.message || "").toLowerCase().includes("resource_exhausted") ||
                      String(apiError?.status || "") === "429";

      const fallbackMappings = generateMockMappings(questions);
      return NextResponse.json({
        success: true,
        isMocked: true,
        fallbackReason: isQuota ? "QUOTA_EXCEEDED" : "API_ERROR",
        mappings: fallbackMappings,
        message: isQuota 
          ? "Kuota token Gemini API saat ini telah mencapai batas harian. Sistem secara otomatis menggunakan Mesin Heuristik Psikometri Lokal berkecepatan tinggi."
          : "Layanan cloud AI sedang mengalami gangguan sementara. Sistem beralih otomatis ke Mesin Heuristik Psikometri Lokal."
      });
    }

  } catch (error: any) {
    console.error("Gagal melakukan validasi soal:", error);
    // Even on severe top-level error, provide safe fallback
    const body = await req.json().catch(() => ({}));
    const qs = body.questions || [];
    return NextResponse.json({
      success: true,
      isMocked: true,
      mappings: generateMockMappings(qs),
      message: "Menggunakan Mesin Heuristik Psikometri Lokal."
    });
  }
}

// Local mock classifier for robust offline execution
function generateMockMappings(questions: any[]) {
  return questions.map(q => {
    const text = (q.text || "").toLowerCase();
    const dim = (q.dimension || "").toLowerCase();
    const suggestedContexts: string[] = [];

    // Smart heuristic matching
    if (text.includes("mesin") || text.includes("rakit") || text.includes("vokasi") || text.includes("bengkel") || text.includes("smk") || dim.startsWith("r")) {
      suggestedContexts.push("sekolah_smk");
    }
    if (text.includes("ilmiah") || text.includes("riset") || text.includes("rumus") || text.includes("kuliah") || text.includes("sains") || dim.startsWith("i")) {
      suggestedContexts.push("sekolah_sma", "personal");
    }
    if (text.includes("pimpin") || text.includes("kerja") || text.includes("kantor") || text.includes("bisnis") || text.includes("korporat") || text.includes("pelanggan") || dim.startsWith("e")) {
      suggestedContexts.push("perusahaan", "sekolah_smk");
    }
    if (text.includes("birokrasi") || text.includes("pemerintah") || text.includes("negara") || text.includes("masyarakat") || text.includes("layanan") || text.includes("integritas")) {
      suggestedContexts.push("instansi_pemerintah", "perusahaan");
    }
    if (text.includes("gambar") || text.includes("seni") || text.includes("warna") || text.includes("kreatif") || dim.startsWith("a")) {
      suggestedContexts.push("sekolah_smk", "sekolah_sma", "personal");
    }
    if (text.includes("teman") || text.includes("bantu") || text.includes("sosial") || text.includes("ajar") || dim.startsWith("s")) {
      suggestedContexts.push("sekolah_smp", "sekolah_sma", "personal");
    }
    if (text.includes("hitung") || text.includes("rapikan") || text.includes("arsip") || text.includes("data") || dim.startsWith("c")) {
      suggestedContexts.push("sekolah_smk", "perusahaan");
    }

    // Default fallbacks if no specific heuristics matched
    if (suggestedContexts.length === 0) {
      suggestedContexts.push("sekolah_smk", "sekolah_sma", "personal");
    }

    return {
      questionId: String(q.id),
      suggestedContexts,
      explanation: `Heuristik lokal: Pernyataan soal berfokus pada kecenderungan perilaku cocok untuk aktivitas ${suggestedContexts.map(c => c.split("_")[1] || c).join(" & ")}.`
    };
  });
}
