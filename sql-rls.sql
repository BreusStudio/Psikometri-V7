-- SQL Script Lengkap untuk Supabase SQL Editor
-- Jalankan skrip ini di SQL Editor Supabase Anda untuk membuat tabel, menambahkan kolom yang belum ada, dan menonaktifkan RLS.

-- 1. Tabel Registered Classes
CREATE TABLE IF NOT EXISTS registered_classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- 2. Tabel Registered Cohorts
CREATE TABLE IF NOT EXISTS registered_cohorts (
    id TEXT PRIMARY KEY,
    year INTEGER NOT NULL
);

-- 3. Tabel Test Settings
CREATE TABLE IF NOT EXISTS test_settings (
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
    registered_classes JSONB,
    registered_cohorts JSONB,
    quota_added INTEGER DEFAULT 0,
    test_types JSONB,
    -- JSONB columns for fallback & relational sync
    vouchers JSONB,
    purchases JSONB,
    packages JSONB,
    referrals JSONB,
    commissions JSONB
);

-- 3a. Tabel Vouchers (Lisensi & Kredensial Akses)
CREATE TABLE IF NOT EXISTS vouchers (
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
    admin_password TEXT
);

-- 3b. Tabel Purchases (Transaksi Pembelian)
CREATE TABLE IF NOT EXISTS purchases (
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
    generated_voucher TEXT
);

-- 3c. Tabel Packages (Paket Penjualan)
CREATE TABLE IF NOT EXISTS packages (
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
    discount_percentage INTEGER
);

-- 3d. Tabel Referral Codes (Kode Afiliasi)
CREATE TABLE IF NOT EXISTS referral_codes (
    code TEXT PRIMARY KEY,
    owner_name TEXT NOT NULL,
    commission_rate INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    bank_info TEXT
);

-- 3e. Tabel Commissions (Komisi Afiliasi)
CREATE TABLE IF NOT EXISTS commissions (
    id TEXT PRIMARY KEY,
    referral_code TEXT,
    buyer_name TEXT,
    purchase_amount INTEGER DEFAULT 0,
    commission_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    paid_date TEXT,
    transfer_receipt TEXT,
    date TEXT
);

-- 3f. Tabel Registration Requests (Permintaan Registrasi Sekolah)
CREATE TABLE IF NOT EXISTS registration_requests (
    id TEXT PRIMARY KEY,
    school_name TEXT NOT NULL,
    admin_email TEXT,
    admin_phone TEXT,
    address TEXT,
    estimated_students INTEGER DEFAULT 0,
    school_type TEXT,
    status TEXT DEFAULT 'Pending',
    requested_at TEXT,
    admin_password TEXT
);


-- 4. Tabel Teachers (Guru/Admin)
CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    password TEXT NOT NULL,
    managed_class TEXT
);

-- Seed default user jika belum ada
INSERT INTO teachers (id, name, role, password)
VALUES 
    ('admin', 'Administrator', 'Admin', 'admin'),
    ('guru1', 'Guru BK 1', 'BK', '1234')
ON CONFLICT (id) DO NOTHING;

-- 5. Tabel Dimensions
CREATE TABLE IF NOT EXISTS dimensions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    test_type TEXT,
    description TEXT
);

-- 6. Tabel Questions
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    test_type TEXT,
    dimension TEXT,
    category TEXT,
    text TEXT,
    choices JSONB,
    answers JSONB,
    rubric JSONB,
    is_validated BOOLEAN DEFAULT false,
    weight INTEGER DEFAULT 1,
    image_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel School Majors
CREATE TABLE IF NOT EXISTS school_majors (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT,
    riasec_type TEXT,
    description TEXT
);

-- 8. Tabel Students (Siswa)
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    class_group TEXT DEFAULT 'X-1',
    angkatan INTEGER DEFAULT 2026,
    archived BOOLEAN DEFAULT false,
    password TEXT DEFAULT '123456',
    iq_score INTEGER,
    eq_score INTEGER,
    riasec_scores JSONB,
    dimension_scores JSONB,
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
    allow_test_types JSONB,
    school_origin TEXT
);

-- 8b. Tabel Student Answers (Jawaban Detail Siswa)
CREATE TABLE IF NOT EXISTS student_answers (
    student_id TEXT,
    question_id TEXT,
    choice_id INTEGER,
    updated_at TEXT,
    PRIMARY KEY (student_id, question_id)
);

-- 9. Pastikan Kolom-Kolom Terbuat Jika Tabel Sudah Ada Sebelumnya (Schema Auto-Patch)
ALTER TABLE students ADD COLUMN IF NOT EXISTS class_group TEXT DEFAULT 'X-1';
ALTER TABLE students ADD COLUMN IF NOT EXISTS angkatan INTEGER DEFAULT 2026;
ALTER TABLE students ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '123456';
ALTER TABLE students ADD COLUMN IF NOT EXISTS iq_score INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS eq_score INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS riasec_scores JSONB;
ALTER TABLE students ADD COLUMN IF NOT EXISTS dimension_scores JSONB;
ALTER TABLE students ADD COLUMN IF NOT EXISTS locked_out BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS lock_reason TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS test_started BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS test_completed BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS test_started_at TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS test_completed_at TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb;
ALTER TABLE students ADD COLUMN IF NOT EXISTS cheat_warnings INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS ai_analysis TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS completed_tests JSONB DEFAULT '[]'::jsonb;
ALTER TABLE students ADD COLUMN IF NOT EXISTS allow_test_types JSONB;
ALTER TABLE students ADD COLUMN IF NOT EXISTS school_origin TEXT;

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS managed_class TEXT;

-- Patch Kolom test_settings
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS iq_active BOOLEAN DEFAULT true;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS eq_active BOOLEAN DEFAULT true;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS holland_active BOOLEAN DEFAULT true;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS kepribadian_active BOOLEAN DEFAULT true;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS validitas_active BOOLEAN DEFAULT true;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS auto_ai_analysis BOOLEAN DEFAULT true;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS iq_limit INTEGER DEFAULT 12;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS eq_limit INTEGER DEFAULT 12;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS holland_limit INTEGER DEFAULT 12;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS kepribadian_limit INTEGER DEFAULT 12;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS validitas_limit INTEGER DEFAULT 12;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS randomize_questions BOOLEAN DEFAULT true;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS randomize_choices BOOLEAN DEFAULT true;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS iq_duration INTEGER DEFAULT 15;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS eq_duration INTEGER DEFAULT 15;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS holland_duration INTEGER DEFAULT 15;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS kepribadian_duration INTEGER DEFAULT 15;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS validitas_duration INTEGER DEFAULT 15;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS referrals JSONB;
ALTER TABLE test_settings ADD COLUMN IF NOT EXISTS commissions JSONB;

-- Patch Kolom packages
ALTER TABLE packages ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS header_title TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS institution_name TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS institution_sub TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS signature_name TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS signature_title TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS signature_nip TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS education_levels JSONB;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS quota INTEGER;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS original_price INTEGER;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS features JSONB;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS badge_text TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS test_type_id TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_per_account INTEGER;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS discount_percentage INTEGER;

-- Patch Kolom vouchers
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS max_usage INTEGER;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT false;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS expired_at TEXT;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS test_types JSONB;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS test_count INTEGER;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS generated_accounts JSONB;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS admin_username TEXT;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS admin_password TEXT;

-- Patch Kolom questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS answers JSONB;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS rubric JSONB;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 1;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 10. Nonaktifkan Row Level Security (RLS) atau Izinkan Anon Akses pada Seluruh Tabel
ALTER TABLE IF EXISTS students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dimensions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS school_majors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS test_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS registered_classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS registered_cohorts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_answers DISABLE ROW LEVEL SECURITY;

-- Reload Cache PostgREST
NOTIFY pgrst, 'reload schema';

-- 11. Inisialisasi Storage Bucket untuk Gambar Soal (psychometric-assets)
INSERT INTO storage.buckets (id, name, public)
VALUES ('psychometric-assets', 'psychometric-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'psychometric-assets');

DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'psychometric-assets');

DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'psychometric-assets');

DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'psychometric-assets');
