import React from 'react';
import { BookOpen, Info, Shield, Users, Briefcase } from 'lucide-react';

export default function PanduanRoleTab() {
  const guides = [
    {
      role: 'Superadmin',
      icon: <Shield className="w-5 h-5 text-indigo-500" />,
      description: 'Superadmin memiliki akses penuh terhadap seluruh konfigurasi sistem, termasuk sinkronisasi database, pengaturan batas soal ujian, pengelolaan institusi klien, dan manajemen lisensi. Superadmin juga bertanggung jawab mengatur variabel environment aplikasi.',
      tasks: [
        'Konfigurasi Pengaturan Ujian (Settings CBT, Jumlah Soal, Prompt AI).',
        'Database Sync (Push/Pull data dari Supabase/IndexedDB).',
        'Manajemen Paket Langganan dan Kredensial API.',
      ]
    },
    {
      role: 'Admin Institusi',
      icon: <Briefcase className="w-5 h-5 text-emerald-500" />,
      description: 'Admin institusi (sekolah/lembaga) berhak mengelola data siswa, kelas, guru, dan rombel secara terpusat. Admin juga dapat melihat laporan keseluruhan sekolah.',
      tasks: [
        'Import Excel data Siswa, Guru, dan Kelas.',
        'Mereset perangkat login atau password peserta ujian.',
        'Memantau rekapitulasi ujian siswa.'
      ]
    },
    {
      role: 'Guru BK',
      icon: <Users className="w-5 h-5 text-blue-500" />,
      description: 'Guru BK (Bimbingan Konseling) menggunakan sistem untuk memantau hasil analisis tes psikometri (IQ, EQ, Peminatan Holland, Kepribadian).',
      tasks: [
        'Membuka dan membaca laporan AI terkait saran karir/penjurusan.',
        'Memantau dashboard rekap jurusan dan kelas.',
        'Memberikan intervensi berdasarkan hasil analisis.'
      ]
    },
    {
      role: 'Proktor Ujian',
      icon: <Info className="w-5 h-5 text-amber-500" />,
      description: 'Proktor bertugas memantau kelancaran ujian pada saat pelaksanaan (CBT) dan memastikan keamanan ujian.',
      tasks: [
        'Mengawasi status ujian siswa secara real-time di layar CBT Proctor.',
        'Membuka blokir ujian (unblock) jika siswa terkunci (terdeteksi pindah tab/kecurangan).',
        'Memastikan token ujian aktif dan tersinkron.'
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          Panduan Role Pengguna
        </h2>
        <p className="text-xs text-slate-500">
          Setiap peran (role) dalam sistem ini memiliki cakupan fitur dan wewenang yang berbeda. Berikut ini adalah panduan umum wewenang dan tugas operasional setiap role:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guides.map((guide, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                {guide.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-800">{guide.role}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {guide.description}
            </p>
            <div className="mt-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tugas Utama:</h4>
              <ul className="space-y-1.5">
                {guide.tasks.map((task, tIdx) => (
                  <li key={tIdx} className="text-xs text-slate-700 flex items-start gap-2 font-medium">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
