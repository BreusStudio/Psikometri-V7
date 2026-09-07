'use client';

import React, { useState, useMemo } from 'react';
import { User, GraduationCap, School, Calendar, Users, ArrowRight, CheckCircle2, MapPin, Briefcase } from 'lucide-react';
import { Student } from '@/lib/types';
import { PsychometricStore } from '@/lib/store/PsychometricStore';
import { resolveClientContext, isSchoolContext } from '@/lib/core/contextResolver';

interface ExamProfileCompletionScreenProps {
  student: Student;
  store: PsychometricStore;
  onProfileComplete: (updatedStudent: Student) => void;
  onLogout: () => void;
}

export default function ExamProfileCompletionScreen({
  student,
  store,
  onProfileComplete,
  onLogout
}: ExamProfileCompletionScreenProps) {
  const ctx = useMemo(() => resolveClientContext(student), [student]);
  const isSchool = isSchoolContext(ctx.contextType);
  const isPersonal = ctx.contextType === 'personal';
  const isCorporate = ctx.contextType === 'corporate';

  const [name, setName] = useState(student.name || '');
  const [classGroup, setClassGroup] = useState(student.classGroup || student.class_name || '');
  const [major, setMajor] = useState(student.major || '');
  const [angkatan, setAngkatan] = useState<number>(student.angkatan || student.cohort || new Date().getFullYear());
  const [gender, setGender] = useState<'L' | 'P' | ''>(student.gender || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch options from Data Master with defensive fallbacks for school contexts
  const classOptions = useMemo(() => {
    if (!isSchool) return [];
    try {
      if (typeof store.getRegisteredClasses === 'function') {
        return store.getRegisteredClasses();
      }
      if (typeof store.getClasses === 'function') {
        return store.getClasses().map(c => (typeof c === 'string' ? c : c.name));
      }
    } catch {
      // fallback
    }
    return [];
  }, [store, isSchool]);

  const majorOptions = useMemo(() => {
    if (!isSchool) return [];
    try {
      if (typeof store.getSchoolMajors === 'function') {
        return store.getSchoolMajors().map(m => (typeof m === 'string' ? m : m.name));
      }
      if (typeof store.getMajors === 'function') {
        return store.getMajors().map(m => (typeof m === 'string' ? m : m.name));
      }
    } catch {
      // fallback
    }
    return [];
  }, [store, isSchool]);

  const currentYear = new Date().getFullYear();
  const angkatanOptions = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4, currentYear - 5];

  const educationOptions = [
    'SMP / Sederajat',
    'SMA / MA',
    'SMK / MAK',
    'Diploma (D3 / D4)',
    'Sarjana (S1)',
    'Pascasarjana (S2 / S3)',
    'Umum / Profesional'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage(`Harap isi Nama Lengkap ${ctx.entityName.toLowerCase()}.`);
      return;
    }

    if (!classGroup || !major || !angkatan || !gender) {
      setErrorMessage('Harap lengkapi semua data biodata sebelum melanjutkan ke ujian.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure allowedTests is properly initialized and not locked out
      let activeAllowed = student.allowedTests;
      if (!Array.isArray(activeAllowed) || activeAllowed.length === 0) {
        activeAllowed = ['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas'];
      }

      const updatedStudent: Student = {
        ...student,
        name: name.trim(),
        classGroup,
        class_name: classGroup,
        major,
        angkatan: Number(angkatan),
        cohort: Number(angkatan),
        gender: gender as 'L' | 'P',
        allowedTests: activeAllowed,
        testStarted: true
      };

      store.saveStudent(updatedStudent);
      onProfileComplete(updatedStudent);
    } catch (err) {
      console.error('Failed to update student profile:', err);
      setErrorMessage('Gagal menyimpan profil. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Lengkapi Profil {ctx.entityName}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Selamat datang, <span className="font-semibold text-indigo-600 dark:text-indigo-400">{student.name}</span>. Silakan periksa nama dan lengkapi informasi berikut sebelum mengakses {ctx.examTitle}.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-800 py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/80 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3 text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900/60">
                {errorMessage}
              </div>
            )}

            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-500" /> Nama Lengkap {ctx.entityName} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Masukkan nama lengkap resmi..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                required
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Nama ini akan dicantumkan pada sertifikat dan berkas laporan resmi.
              </p>
            </div>

            {/* Group Field (Kelas untuk Sekolah / Pendidikan Terakhir untuk Personal / Divisi untuk Corporate) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                {isSchool ? <School className="w-4 h-4 text-indigo-500" /> : isPersonal ? <GraduationCap className="w-4 h-4 text-indigo-500" /> : <Briefcase className="w-4 h-4 text-indigo-500" />}
                {ctx.groupLabel} <span className="text-rose-500">*</span>
              </label>
              
              {isSchool ? (
                classOptions.length > 0 ? (
                  <select
                    value={classGroup}
                    onChange={(e) => setClassGroup(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    required
                  >
                    <option value="">-- Pilih {ctx.groupLabel} --</option>
                    {classOptions.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Contoh: XII RPL 1 / X-A"
                    value={classGroup}
                    onChange={(e) => setClassGroup(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    required
                  />
                )
              ) : isPersonal ? (
                <select
                  value={classGroup}
                  onChange={(e) => setClassGroup(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  required
                >
                  <option value="">-- Pilih Pendidikan Terakhir --</option>
                  {educationOptions.map((edu) => (
                    <option key={edu} value={edu}>{edu}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Contoh: Divisi IT / Operasional"
                  value={classGroup}
                  onChange={(e) => setClassGroup(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  required
                />
              )}
            </div>

            {/* Sub-Group Field (Jurusan untuk Sekolah / Kota Domisili untuk Personal / Posisi untuk Corporate) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                {isSchool ? <GraduationCap className="w-4 h-4 text-indigo-500" /> : isPersonal ? <MapPin className="w-4 h-4 text-indigo-500" /> : <Briefcase className="w-4 h-4 text-indigo-500" />}
                {ctx.subGroupLabel} <span className="text-rose-500">*</span>
              </label>

              {isSchool ? (
                majorOptions.length > 0 ? (
                  <select
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    required
                  >
                    <option value="">-- Pilih {ctx.subGroupLabel} --</option>
                    {majorOptions.map((mjr) => (
                      <option key={mjr} value={mjr}>{mjr}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Contoh: Rekayasa Perangkat Lunak / MIPA"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    required
                  />
                )
              ) : isPersonal ? (
                <input
                  type="text"
                  placeholder="Contoh: Jakarta Selatan / Surabaya"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  required
                />
              ) : (
                <input
                  type="text"
                  placeholder="Contoh: Staff IT / Management Trainee"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  required
                />
              )}
            </div>

            {/* Angkatan / Tahun */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" /> {isSchool ? 'Angkatan (Tahun)' : isPersonal ? 'Tahun Pendaftaran / Angkatan' : 'Periode Rekrutmen (Tahun)'} <span className="text-rose-500">*</span>
              </label>
              <select
                value={angkatan}
                onChange={(e) => setAngkatan(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                required
              >
                {angkatanOptions.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" /> Jenis Kelamin <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('L')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    gender === 'L'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {gender === 'L' && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  Laki-Laki
                </button>
                <button
                  type="button"
                  onClick={() => setGender('P')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    gender === 'P'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {gender === 'P' && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  Perempuan
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 font-semibold shadow-lg shadow-indigo-500/25 transition-all text-sm disabled:opacity-50"
              >
                <span>Simpan Profil &amp; Mulai Ujian</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 dark:border-slate-700/60 pt-4">
            <button
              onClick={onLogout}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors"
            >
              Bukan akun Anda? Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
