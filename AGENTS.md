# AGENTS.md - Project Execution Guidelines & Protocols

## Role & Core Architectural Principles
- **Senior Software Architect & Developer**: Maintain high-quality, scalable, clean, and maintainable code.
- **Metadata-Driven & Modular Architecture**: Separate UI structures, form definitions, and routing configurations into metadata files (`/lib/metadata/*.ts`). Keep business logic, UI, and data access decoupled.
- **SOLID, OOP, KISS, DRY, YAGNI**: Adhere to strict separation of concerns. Do not introduce unrequested features or unnecessary complexities.

## Operational & Execution Rules

### 1. Workspace Root & Absolute Paths
- The project root is `/` (containing `package.json`, `app`, `lib`, `components`).
- Always use relative workspace paths or root-relative imports (e.g., `@/lib/...` or `@/components/...`).
- Never perform file operations on missing root paths or unverified directories.

### 2. Development Mode & Build Protocol
- In development mode, Next.js handles live code reloads automatically in the preview iframe.
- **Do NOT** execute unnecessary or repetitive `compile_applet`, `restart_dev_server`, or build cycles during simple iterative edits unless explicitly requested by the user or verifying final completed work.
- When compilation or build verification is required, run `compile_applet` ONCE cleanly after completing the edit scope.

### 3. File Verification Before Edits
- Always inspect existing file structures using `view_file` before making modifications.
- Ensure target lines match exact strings to prevent edit failures.

### 4. Data Safety & Value Rendering
- Always sanitize data attributes against `undefined` strings (e.g. `d.code !== 'undefined'`).
- Ensure fallback values exist for optional metadata fields in dropdown options and table columns.

### 5. Efisiensi & Workflow (Hasil Introspeksi)
- **Linting vs Building**: Gunakan `lint_applet` untuk validasi iteratif saat mengedit fitur. Hindari penggunaan `compile_applet` yang berulang di tengah proses karena tidak efisien. `compile_applet` hanya dieksekusi sekali di akhir pekerjaan/scope.
- **Pembersihan File Sampah**: Jaga workspace tetap bersih dari file tidak terpakai, duplikat, atau file lock yang konflik (misal: menghapus `bun.lock` jika menggunakan npm).
- **Pendekatan Holistik**: Analisis dampak perubahan kode secara menyeluruh sebelum melakukan eksekusi (terutama terkait integrasi UI dan metadata), memastikan pemisahan layer sesuai arsitektur Metadata-Driven.
- **Strict YAGNI & KISS**: Tulis kode seefisien mungkin sesuai permintaan eksplisit, tanpa over-engineering.

### 6. Standar Resolusi Masalah (Anti-Looping)
- **Analisis Root Cause Terlebih Dahulu**: Jika terjadi error (terutama saat build atau kompilasi), JANGAN pernah mengulang perintah yang sama secara membabi buta. Berhenti, baca output error dengan saksama, dan pahami akar masalah sebelum mencoba solusi.
- **Eksperimen Terukur & Rasional**: Hindari "trial and error" tanpa dasar, seperti downgrade/upgrade package secara acak. Setiap perintah shell atau modifikasi harus memiliki landasan teknis yang jelas.
- **Kesadaran Diri (Proactive Context)**: Jadikan `AGENTS.md` sebagai kompas utama. Jika ada kesalahan atau pelajaran baru dari diskusi, secara proaktif dokumentasikan di sini sebagai memori jangka panjang agar tidak mengulangi kesalahan yang sama.

## 1-4 RESOLVED SOLUTIONS (DISKUSI SELESAI)

Untuk memastikan proses perbaikan berjalan cepat, aman, dan tanpa error berulang di masa mendatang, 4 solusi holistik berikut telah sepenuhnya diimplementasikan dan harus dipatuhi:

### 1. Pembersihan & Standarisasi File Sistem (Workspace Sanitation)
- **Status**: **TERIMPLEMENTASI** (File `bun.lock` telah dihapus secara permanen).
- **Prosedur**: Hanya gunakan `package-lock.json` untuk manajemen paket NPM. Jangan biarkan file lock sekunder (seperti `bun.lock` atau `yarn.lock`) berada di workspace karena dapat memicu inkonsistensi dependensi saat build. Selalu jalankan `npm run clean` untuk menghapus `.next` cache jika terjadi error aneh pada prainstal/prerender.

### 2. Efisiensi Alur Kerja Iteratif (Fast Iterative Dev)
- **Status**: **TERIMPLEMENTASI** (Prinsip dev cepat & aman).
- **Prosedur**: Gunakan `lint_applet` sebagai pintu gerbang validasi sintaks dan type-check tercepat selama tahap editing fitur. **DILARANG** melakukan `compile_applet` atau `npm run build` yang memakan waktu lama secara berulang-ulang di tengah proses pengeditan kecil. Jalankan build penuh hanya sekali setelah seluruh cakupan perubahan selesai untuk verifikasi akhir.

### 3. Pembersihan Cache & Eliminasi Gagal Pre-rendering
- **Status**: **TERIMPLEMENTASI** (Cache bersih, validasi layout & error page aman).
- **Prosedur**: Masalah prerendering `/500` atau `<Html>` disebabkan oleh file cache usang `.next` dari prainstalasi router sebelumnya. Dengan menjalankan `npm run clean` untuk menghapus direktori `.next`, kita memastikan build berjalan dari keadaan bersih (*fresh state*). Semua komponen halaman (seperti `app/error.tsx` dan `app/page.tsx`) harus menggunakan tag HTML huruf kecil (`<html>` dan `<body>`) sesuai dengan standar Next.js 15 App Router.

### 4. Kepatuhan Absolut Terhadap Dokumen AGENTS.md
- **Status**: **TERIMPLEMENTASI** (Integrasi aturan ke memori jangka panjang).
- **Prosedur**: Setiap agen yang melanjutkan sesi **WAJIB** membaca dokumen `AGENTS.md` ini terlebih dahulu pada giliran pertama sebelum melakukan modifikasi apa pun. Seluruh modifikasi kode harus mengikuti arsitektur *Metadata-Driven* dan *Separation of Concerns* (SoC) tanpa menambahkan kode mock-up ataupun fitur tidak perlu (*strict YAGNI*).

### 5. Standarisasi Lapisan Arsitektur (Core, Logic, & UI)
- **Status**: **TERIMPLEMENTASI** (Segregasi tuntas & kompatibilitas penuh dijamin).
- **Struktur Folder Terstandardisasi**:
  - **`@/lib/core/` (Core Layer)**: Tempat untuk utilitas infrastruktur dasar dan definisi tipe (misal: `@/lib/core/types.ts`, `@/lib/core/utils.ts`, `@/lib/core/supabase.ts`, `@/lib/core/indexedDB.ts`, `@/lib/core/gemini.ts`). Semua file core lawas di `@/lib/` telah dimigrasi ke `@/lib/core/` dan dikonfigurasi menggunakan transparent re-exports untuk mencegah breaking changes pada ribuan referensi import di UI.
  - **`@/lib/store/` & `@/lib/repositories/` (Logic & State Layer)**: Berisi logika bisnis utama, state management (`PsychometricStore`), data repositories (seperti `MajorRepository`), score calculators, excel mappers, dan synchronizers. Logika bisnis murni dipisahkan dari layer presentasi UI.
  - **`@/components/` & `@/app/` (UI & Presentation Layer)**: Berisi reusable layout, sub-layout per role (admin, student, dll), serta shared-components yang sangat DRY (seperti `MetadataCoreEngine`, `DataTable`, `FormGenerator`). Komponen UI murni merender state dan mendelegasikan semua operasi tulis/baca ke state store atau repository.
- **Prinsip Pengembangan**: Selalu tempatkan fungsi dasar, API wrapper, dan helper primitif di Core Layer; posisikan state mutator dan interaksi Supabase/IndexedDB di State/Logic Layer; dan pastikan UI Layer tetap bersih dari logic-bloat dengan memanfaatkan generic engines (`MetadataCoreEngine`) untuk mencegah duplikasi kode (DRY).

### 6. Standar Eksekusi Langsung (Direct In-Place Editing)
- **Status**: **TERIMPLEMENTASI** (Eliminasi skrip patch sementara).
- **Prosedur**: Dilarang membuat file skrip pembantu sementara (seperti `patch.js`, `patch.cjs`, `fix_sync.js`, dll) di root workspace. Seluruh perubahan kode WAJIB dilakukan secara bedah langsung pada file target menggunakan tool `edit_file` atau `multi_edit_file`. Hal ini mencegah overhead disk I/O, menjaga kebersihan workspace, dan mencegah restart dev server yang tidak perlu.

### 7. Single Final Verification Protocol
- **Status**: **TERIMPLEMENTASI** (Optimalisasi siklus verifikasi).
- **Prosedur**: Gunakan `lint_applet` untuk verifikasi cepat (1–2 detik) saat memodifikasi file. Hanya jalankan `compile_applet` tepat 1 kali di akhir tugas untuk verifikasi final kualitas produksi.

### 8. Larangan Mutlak Penggunaan Bun, Bunx, & NPX (Pure NPM Protocol)
- **Status**: **TERIMPLEMENTASI** (Penetapan standar paket manajer tunggal).
- **Prosedur**: 
  - **Dilarang Keras** menjalankan perintah `bun`, `bunx`, `npx`, atau `yarn`.
  - Seluruh dependensi, instalasi paket, dan eksekusi skrip internal **WAJIB murni menggunakan NPM** (`npm run ...`, `npm install`, atau tool resmi AI Studio seperti `install_applet_dependencies`).
  - Tidak diperbolehkan memicu instalasi *ephemeral runner* di luar ekosistem resmi `package-lock.json`.

### 9. Integritas Lingkungan Dev Server & Binary Management
- **Status**: **TERIMPLEMENTASI** (Penetapan stabilitas dev server & Next.js runtime).
- **Prosedur**:
  - **Workspace Path**: Lingkungan aplikasi berada di `/app/applet`. Seluruh file konfigurasi (`package.json`, `tsconfig.json`, `next.config.ts`) dan direktori dependensi (`node_modules`) harus terjaga keutuhannya di `/app/applet`.
  - **Integritas Binaries (`node_modules/.bin`)**: Jika terjadi error `sh: 1: next: not found` saat `npm run dev` atau restart dev server, akar masalahnya adalah hilangnya direktori link `node_modules/.bin`. Pemulihan WAJIB dilakukan via `npm install --prefer-offline` dengan NPM murni. Dilarang menghapus `node_modules` atau `package.json`.
  - **Penanganan Dev Server Hang / Defunct**: Jika dev server terhenti, periksa apakah terdapat proses latar belakang yang menggantung (seperti installer pihak ketiga), hentikan proses yang macet, pastikan binary Next.js siap (`./node_modules/.bin/next`), lalu gunakan tool resmi `restart_dev_server`.
  - **Verifikasi Liveness Port 3000**: Dev server dinyatakan sehat setelah menghasilkan respons HTTP 200 via `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/`.

### 10. Protokol Anti-Freeze, Fast-Refresh, & Integritas File System (Dev-Speed Protocol)
- **Status**: **TERIMPLEMENTASI & MENGIKAT SELURUH MODEL AI**
- **Prosedur**:
  - **Kepatuhan Node.js Fast-Refresh**: Next.js development server telah aktif di port 3000 dan secara bawaan mengompilasi ulang halaman secara instan saat file disimpan. Agen DILARANG memanggil `compile_applet` secara otomatis setelah mengedit kode. Iframe preview akan otomatis me-reload halaman.
  - **Larangan Otomasi `compile_applet`**: `compile_applet` memicu `npm run build` yang memakan waktu 1–2 menit, menguras CPU, serta memicu konflik `.next` cache dengan dev server. Tool ini hanya boleh dipanggil jika ada instruksi tertulis langsung dari pengguna (misal: "lakukan production compile" atau "build applet").
  - **Larangan Task Shell Background Menggantung**: Agen DILARANG mengeksekusi shell command pemantauan di latar belakang (seperti `ps aux`, `curl`, atau `sleep`) yang dapat menahan I/O file system dan memicu error `Timeout waiting for applet file system condition`.
  - **Integritas `package.json`**: Dilarang memodifikasi file `package.json` saat menangani tugas perbaikan logika atau UI biasa. Penambahan dependensi hanya diizinkan bila diminta oleh pengguna.
  - **Direktori Kerja Relatif**: Semua operasi file dan shell command wajib mengacu pada working directory proyek lokal (`.`), bukan direktori root OS container Linux (`/`).

### 11. Protokol Anti-Halusinasi Eksekusi (Proof-of-Edit & Ground Truth Mandate)
- **Status**: **TERIMPLEMENTASI & MENGIKAT SELURUH MODEL AI**
- **Prosedur**:
  - **Larangan Klaim Tanpa Bukti Nyata**: Agen DILARANG KERAS menyatakan "sudah memperbaiki" atau "sudah mengedit" jika tidak ada respons sukses fisik dari tool `edit_file` atau `create_file` (ditandai dengan blok diff perubahan file yang berhasil di log).
  - **Penanganan Gagal Edit (Zero Silent Failure)**: Jika tool `edit_file` menghasilkan error `Target content not found`, agen DILARANG menutup respon atau mengabaikannya. Agen WAJIB segera memanggil `view_file` pada target baris aktual, menyamakan string secara presisi (termasuk whitespace), dan mengulangi pemanggilan edit sampai modifikasi fisik benar-benar tertulis di disk.
  - **Mandat Read-Before-Write**: Sebelum melakukan perubahan kode, agen WAJIB memeriksa baris target via `view_file` pada giliran yang sama.
  - **Verifikasi Path Nyata**: Pastikan file yang diedit adalah file aktif yang memang diimpor oleh aplikasi, bukan file bayangan (*dead code*) usang yang sudah tidak dipakai.