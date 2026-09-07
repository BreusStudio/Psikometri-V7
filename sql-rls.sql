-- ==============================================================================
-- SKRIP SQL MASTER LENGKAP & TERINTEGRASI - SISTEM CBT PSIKOMETRI & AI DIAGNOSTIK
-- ==============================================================================
-- Jalankan seluruh isi skrip ini di SQL Editor Supabase Anda.
-- Skrip ini dirancang idempotensial (aman dijalankan berulang kali):
-- 1. Membuat tabel lengkap jika belum ada (CREATE TABLE IF NOT EXISTS)
-- 2. Melakukan patch kolom secara otomatis jika tabel sudah ada (ALTER TABLE ADD COLUMN)
-- 3. Mengatur RLS / Kebijakan Akses Penuh untuk Anon & Authenticated
-- 4. Menginisialisasi Storage Bucket 'psychometric-assets' untuk aset soal & gambar
-- 5. Memaksa PostgREST me-reload schema cache (NOTIFY pgrst, 'reload schema')
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABEL: registered_classes (Daftar Kelas Terdaftar)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registered_classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. TABEL: registered_cohorts (Daftar Angkatan Terdaftar)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registered_cohorts (
    id TEXT PRIMARY KEY,
    year INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. TABEL: test_settings (Pengaturan Ujian Global & Durasi Sub-Tes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    iq_active BOOLEAN DEFAULT true,
    eq_active BOOLEAN DEFAULT true,
    holland_active BOOLEAN DEFAULT true,
    kepribadian_active BOOLEAN DEFAULT true,
    validitas_active BOOLEAN DEFAULT true,
    auto_ai_analysis BOOLEAN DEFAULT true,
    iq_limit INTEGER DEFAULT 12,
    eq_limit INTEGER DEFAULT 12,
    holland_limit INTEGER DEFAULT 12,
    kepribadian_limit INTEGER DEFAULT 12,
    validitas_limit INTEGER DEFAULT 12,
    randomize_questions BOOLEAN DEFAULT true,
    randomize_choices BOOLEAN DEFAULT true,
    iq_duration INTEGER DEFAULT 15,
    eq_duration INTEGER DEFAULT 15,
    holland_duration INTEGER DEFAULT 15,
    kepribadian_duration INTEGER DEFAULT 15,
    validitas_duration INTEGER DEFAULT 15,
    minat_duration INTEGER DEFAULT 30,
    bakat_duration INTEGER DEFAULT 30,
    registered_classes JSONB DEFAULT '[]'::jsonb,
    registered_cohorts JSONB DEFAULT '[]'::jsonb,
    quota_added INTEGER DEFAULT 0,
    test_types JSONB DEFAULT '[]'::jsonb,
    vouchers JSONB DEFAULT '[]'::jsonb,
    purchases JSONB DEFAULT '[]'::jsonb,
    packages JSONB DEFAULT '[]'::jsonb,
    referrals JSONB DEFAULT '[]'::jsonb,
    commissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. TABEL: vouchers (Lisensi, Kredensial Sekolah & Akun Mandiri)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vouchers (
    code TEXT PRIMARY KEY,
    type TEXT DEFAULT 'fixed',
    value INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    school_name TEXT,
    max_usage INTEGER,
    is_unlimited BOOLEAN DEFAULT false,
    expired_at TEXT,
    test_types JSONB,
    test_count INTEGER,
    generated_accounts JSONB,
    admin_username TEXT,
    admin_password TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. TABEL: purchases (Riwayat Transaksi & Pembelian Paket)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchases (
    id TEXT PRIMARY KEY,
    platform TEXT,
    package_name TEXT,
    buyer_name TEXT,
    buyer_email TEXT,
    amount INTEGER DEFAULT 0,
    voucher_used TEXT,
    referral_used TEXT,
    commission_earned INTEGER DEFAULT 0,
    date TEXT,
    status TEXT DEFAULT 'Pending',
    quota_added INTEGER DEFAULT 0,
    generated_voucher TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. TABEL: packages (Katalog Paket Penjualan & Layanan Sekolah)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER DEFAULT 0,
    test_count INTEGER,
    category TEXT,
    description TEXT,
    test_types JSONB,
    active BOOLEAN DEFAULT true,
    logo_url TEXT,
    header_title TEXT,
    institution_name TEXT,
    institution_sub TEXT,
    signature_name TEXT,
    signature_title TEXT,
    signature_nip TEXT,
    education_levels JSONB,
    popular BOOLEAN DEFAULT false,
    quota INTEGER,
    original_price INTEGER,
    features JSONB,
    badge_text TEXT,
    test_type_id TEXT,
    price_per_account INTEGER,
    discount_percentage INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. TABEL: referral_codes (Program Kemitraan & Afiliasi Konsultan/BK)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referral_codes (
    code TEXT PRIMARY KEY,
    owner_name TEXT NOT NULL,
    commission_rate INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    bank_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. TABEL: commissions (Pencatatan & Pembayaran Komisi Afiliasi)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commissions (
    id TEXT PRIMARY KEY,
    referral_code TEXT,
    buyer_name TEXT,
    purchase_amount INTEGER DEFAULT 0,
    commission_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    paid_date TEXT,
    transfer_receipt TEXT,
    date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. TABEL: registration_requests (Pengajuan Akun & Registrasi Instansi)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registration_requests (
    id TEXT PRIMARY KEY,
    school_name TEXT NOT NULL,
    admin_email TEXT,
    admin_phone TEXT,
    address TEXT,
    estimated_students INTEGER DEFAULT 0,
    school_type TEXT,
    status TEXT DEFAULT 'Pending',
    requested_at TEXT,
    admin_password TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. TABEL: teachers (Pengguna Admin, Superadmin, & Guru BK)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    password TEXT NOT NULL,
    managed_class TEXT,
    school_origin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed akun default awal bila belum ada
INSERT INTO public.teachers (id, name, role, password)
VALUES 
    ('super', 'Super Administrator', 'Superadmin', 'super'),
    ('admin', 'Administrator CBT', 'Admin', 'admin'),
    ('guru1', 'Guru BK 1', 'BK', '1234')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 11. TABEL: dimensions (Kamus Dimensi & Skala Psikometri)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dimensions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    test_type TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. TABEL: questions (Bank Soal CBT, Kunci, Bobot, & Rubrik)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY,
    test_type TEXT NOT NULL,
    dimension TEXT NOT NULL,
    category TEXT,
    text TEXT NOT NULL,
    choices JSONB DEFAULT '[]'::jsonb,
    answers JSONB,
    rubric JSONB,
    is_validated BOOLEAN DEFAULT false,
    weight INTEGER DEFAULT 1,
    image_url TEXT,
    package_id TEXT,
    applicable_contexts JSONB,
    difficulty_level TEXT,
    difficulty_index NUMERIC,
    discrimination_index NUMERIC,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 13. TABEL: school_majors (Katalog Jurusan & Pemetaan RIASEC)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_majors (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    riasec_type TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 14. TABEL: students (Data Peserta CBT, Skor, Validitas, Audit & Analisis AI)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    class_group TEXT DEFAULT 'X-1',
    angkatan INTEGER DEFAULT 2026,
    education_level TEXT,
    archived BOOLEAN DEFAULT false,
    password TEXT DEFAULT '123456',
    iq_score INTEGER,
    eq_score INTEGER,
    riasec_scores JSONB,
    dimension_scores JSONB,
    evaluated_dimensions JSONB,
    locked_out BOOLEAN DEFAULT false,
    lock_reason TEXT,
    test_started BOOLEAN DEFAULT false,
    test_completed BOOLEAN DEFAULT false,
    test_started_at TEXT,
    test_completed_at TEXT,
    current_question_index INTEGER DEFAULT 0,
    answers JSONB DEFAULT '{}'::jsonb,
    cheat_warnings INTEGER DEFAULT 0,
    ai_analysis TEXT,
    completed_tests JSONB DEFAULT '[]'::jsonb,
    allow_test_types JSONB DEFAULT '["IQ","EQ","Holland","Kepribadian","Validitas"]'::jsonb,
    school_origin TEXT,
    
    -- Kolom Validitas, Audit Waktu & Integritas Psikometri
    validity_status TEXT DEFAULT 'VALID',
    validation_status TEXT DEFAULT 'VALID',
    validity_score INTEGER DEFAULT 95,
    validity_flags JSONB DEFAULT '[]'::jsonb,
    validity_reasoning TEXT,
    validation_recommendation TEXT,
    time_spent_seconds INTEGER DEFAULT 0,
    exam_duration_seconds INTEGER DEFAULT 0,
    exam_started_at TEXT,
    cheating_logs JSONB DEFAULT '[]'::jsonb,
    
    -- Kolom Pembayaran / Status Mandiri (B2C)
    payment_status TEXT DEFAULT 'PAID',
    invoice_number TEXT,
    amount INTEGER DEFAULT 0,
    payment_verified_at TEXT,
    payment_verified_by TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 15. TABEL: student_answers (Log Riwayat Jawaban Butir Soal Detail)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_answers (
    student_id TEXT,
    question_id TEXT,
    choice_id INTEGER,
    updated_at TEXT,
    PRIMARY KEY (student_id, question_id)
);

-- ==============================================================================
-- 16. AUTO-PATCH KOLOM (Bila Tabel Telah Ada Sebelumnya)
-- ==============================================================================
-- Patch Tabel students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS class_group TEXT DEFAULT 'X-1';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS angkatan INTEGER DEFAULT 2026;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS education_level TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '123456';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS iq_score INTEGER;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS eq_score INTEGER;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS riasec_scores JSONB;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS dimension_scores JSONB;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS evaluated_dimensions JSONB;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS locked_out BOOLEAN DEFAULT false;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS lock_reason TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS test_started BOOLEAN DEFAULT false;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS test_completed BOOLEAN DEFAULT false;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS test_started_at TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS test_completed_at TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS cheat_warnings INTEGER DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS ai_analysis TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS completed_tests JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS allow_test_types JSONB DEFAULT '["IQ","EQ","Holland","Kepribadian","Validitas"]'::jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_origin TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS validity_status TEXT DEFAULT 'VALID';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'VALID';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS validity_score INTEGER DEFAULT 95;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS validity_flags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS validity_reasoning TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS validation_recommendation TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS exam_duration_seconds INTEGER DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS exam_started_at TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS cheating_logs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PAID';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS payment_verified_at TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS payment_verified_by TEXT;

-- Patch Tabel teachers
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS managed_class TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS school_origin TEXT;

-- Patch Tabel test_settings
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS iq_active BOOLEAN DEFAULT true;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS eq_active BOOLEAN DEFAULT true;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS holland_active BOOLEAN DEFAULT true;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS kepribadian_active BOOLEAN DEFAULT true;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS validitas_active BOOLEAN DEFAULT true;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS auto_ai_analysis BOOLEAN DEFAULT true;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS iq_limit INTEGER DEFAULT 12;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS eq_limit INTEGER DEFAULT 12;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS holland_limit INTEGER DEFAULT 12;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS kepribadian_limit INTEGER DEFAULT 12;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS validitas_limit INTEGER DEFAULT 12;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS randomize_questions BOOLEAN DEFAULT true;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS randomize_choices BOOLEAN DEFAULT true;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS iq_duration INTEGER DEFAULT 15;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS eq_duration INTEGER DEFAULT 15;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS holland_duration INTEGER DEFAULT 15;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS kepribadian_duration INTEGER DEFAULT 15;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS validitas_duration INTEGER DEFAULT 15;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS minat_duration INTEGER DEFAULT 30;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS bakat_duration INTEGER DEFAULT 30;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS referrals JSONB;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS commissions JSONB;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS quota_added INTEGER DEFAULT 0;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS test_types JSONB;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS registered_classes JSONB;
ALTER TABLE public.test_settings ADD COLUMN IF NOT EXISTS registered_cohorts JSONB;

-- Patch Tabel packages
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS header_title TEXT;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS institution_name TEXT;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS institution_sub TEXT;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS signature_name TEXT;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS signature_title TEXT;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS signature_nip TEXT;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS education_levels JSONB;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS quota INTEGER;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS original_price INTEGER;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS features JSONB;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS badge_text TEXT;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS test_type_id TEXT;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS price_per_account INTEGER;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS discount_percentage INTEGER;

-- Patch Tabel vouchers
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS max_usage INTEGER;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT false;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS expired_at TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS test_types JSONB;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS test_count INTEGER;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS generated_accounts JSONB;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS admin_username TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS admin_password TEXT;

-- Patch Tabel referral_codes & referrals
ALTER TABLE public.referral_codes ADD COLUMN IF NOT EXISTS id TEXT;
CREATE TABLE IF NOT EXISTS public.referrals (
    code TEXT PRIMARY KEY,
    id TEXT,
    owner_name TEXT,
    owner_role TEXT DEFAULT 'guru',
    phone TEXT,
    email TEXT,
    school_origin TEXT,
    discount_percent INTEGER DEFAULT 10,
    commission_percent INTEGER DEFAULT 10,
    usage_count INTEGER DEFAULT 0,
    total_commission INTEGER DEFAULT 0,
    withdrawn_commission INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.referrals ADD COLUMN IF NOT EXISTS id TEXT;

-- Patch Tabel questions
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT false;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS answers JSONB;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS rubric JSONB;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 1;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS package_id TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS applicable_contexts JSONB;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS difficulty_level TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS difficulty_index NUMERIC;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS discrimination_index NUMERIC;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Patch Tabel student_answers
ALTER TABLE public.student_answers ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE public.student_answers ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.student_answers ADD COLUMN IF NOT EXISTS question_id TEXT;
ALTER TABLE public.student_answers ADD COLUMN IF NOT EXISTS choice_id INTEGER;
ALTER TABLE public.student_answers ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ==============================================================================
-- 17. KEBIJAKAN AKSES (RLS & PERMISSION UNTUK CLIENT & BACKEND)
-- ==============================================================================
-- Menonaktifkan pembatasan RLS agar aplikasi CBT dan endpoint API dapat melakukan sinkronisasi tanpa halangan
ALTER TABLE IF EXISTS public.registered_classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.registered_cohorts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.test_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referral_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.registration_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dimensions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.school_majors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_answers DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 18. STORAGE BUCKET UNTUK ASSET GAMBAR SOAL ('psychometric-assets')
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('psychometric-assets', 'psychometric-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'psychometric-assets');

DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'psychometric-assets');

DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'psychometric-assets') WITH CHECK (bucket_id = 'psychometric-assets');

DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'psychometric-assets');

DROP POLICY IF EXISTS "Public Storage All Access" ON storage.objects;
CREATE POLICY "Public Storage All Access" ON storage.objects FOR ALL TO public USING (bucket_id = 'psychometric-assets') WITH CHECK (bucket_id = 'psychometric-assets');

DROP POLICY IF EXISTS "Public Bucket Access" ON storage.buckets;
CREATE POLICY "Public Bucket Access" ON storage.buckets FOR SELECT TO public USING (public = true);

-- ==============================================================================
-- 19. RELOAD POSTGREST SCHEMA CACHE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
