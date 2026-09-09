import React from 'react';
import { ColumnMetadata } from '@/components/admin/shared/DataTable';
import { FormFieldMetadata } from '@/components/admin/shared/FormGenerator';
import { FilterMetadata } from '@/components/admin/shared/MetadataCoreEngine';
import { 
  SchoolMajor, 
  Teacher, 
  Student, 
  TestType, 
  Package, 
  Question, 
  Dimension, 
  Voucher 
} from '../types';
import { resolveEffectiveTestType, matchesTestTypeFilter } from '../core/testTypeResolver';

// Import JSON configurations
import majorsJson from './json/majors.json';
import walikelasJson from './json/walikelas.json';
import kakomliJson from './json/kakomli.json';
import usersJson from './json/users.json';
import studentsJson from './json/students.json';
import testTypesJson from './json/testTypes.json';
import packagesJson from './json/packages.json';
import questionsJson from './json/questions.json';
import classesCohortsJson from './json/classesCohorts.json';
import dimensionsJson from './json/dimensions.json';
import licensesJson from './json/licenses.json';
import certificateSettingsJson from './json/certificateSettings.json';
import menuJson from './json/menu.json';

import { interpretColumns, buildColumnRenderer } from './interpreters/tableInterpreter';
import { processFormFields } from './interpreters/formInterpreter';
import { processFilterMetadata } from './interpreters/filterInterpreter';

export { interpretColumns, buildColumnRenderer, processFormFields, processFilterMetadata };

// ----------------------------------------------------
// 1. MAJORS METADATA INTERPRETER
// ----------------------------------------------------
export const getMajorsColumns = (activeContextId?: string): ColumnMetadata<SchoolMajor>[] => {
  const ctx = getContextLabels(activeContextId);
  const baseCols = interpretColumns<SchoolMajor>(majorsJson.columns);
  return baseCols.map(col => {
    if (col.key === 'code') {
      return { ...col, header: `Kode ${ctx.majorShortLabel}` };
    }
    if (col.key === 'name') {
      return { ...col, header: `Nama ${ctx.majorShortLabel}` };
    }
    return col;
  });
};

export const getMajorsFormFields = (activeContextId?: string): FormFieldMetadata[] => {
  const ctx = getContextLabels(activeContextId);
  return majorsJson.fields.map(field => {
    if (field.key === 'code') {
      return {
        ...field,
        label: `Kode ${ctx.majorShortLabel}`,
        placeholder: `Contoh: ${ctx.isSchool ? 'RPL' : 'DEV / MKT'}`
      } as FormFieldMetadata;
    }
    if (field.key === 'name') {
      return {
        ...field,
        label: `Nama ${ctx.majorLabel}`,
        placeholder: `Contoh: ${ctx.isSchool ? 'Rekayasa Perangkat Lunak' : 'Divisi / Posisi Operasional'}`
      } as FormFieldMetadata;
    }
    return field as FormFieldMetadata;
  });
};

export const majorsSearchFn = (m: SchoolMajor, term: string) => {
  const lower = term.toLowerCase();
  return (
    m.code.toLowerCase().includes(lower) ||
    m.name.toLowerCase().includes(lower) ||
    (m.description || '').toLowerCase().includes(lower)
  );
};


// ----------------------------------------------------
// 2. WALIKELAS METADATA INTERPRETER
// ----------------------------------------------------
export const getWaliKelasColumns = (activeContextId?: string): ColumnMetadata<Teacher>[] => {
  const ctx = getContextLabels(activeContextId);
  const baseCols = interpretColumns<Teacher>(walikelasJson.columns);
  return baseCols.map(col => {
    if (col.key === 'managed_class') {
      return { ...col, header: ctx.classShortLabel };
    }
    return col;
  });
};

export const getWaliKelasFormFields = (
  eligibleUsers: Teacher[],
  registeredClasses: string[],
  activeContextId?: string
): FormFieldMetadata[] => {
  const ctx = getContextLabels(activeContextId);
  return walikelasJson.fields.map(field => {
    if (field.key === 'name') {
      return {
        ...field,
        type: eligibleUsers.length > 0 ? 'select' : 'text',
        options: eligibleUsers.map(u => ({ value: u.name, label: u.name }))
      } as FormFieldMetadata;
    }
    if (field.key === 'managed_class') {
      return {
        ...field,
        label: `${ctx.classShortLabel} Kelolaan`,
        options: registeredClasses.map(c => ({ value: c, label: c }))
      } as FormFieldMetadata;
    }
    return field as FormFieldMetadata;
  });
};

export const getWaliKelasFilters = (registeredClasses: string[], activeContextId?: string): FilterMetadata<Teacher>[] => {
  const ctx = getContextLabels(activeContextId);
  return walikelasJson.filters.map(filter => ({
    key: filter.key,
    label: `Filter ${ctx.classShortLabel}`,
    options: registeredClasses.map(c => ({ value: c, label: c })),
    filterFn: (w, val) => w.managed_class === val
  }));
};

export const waliKelasSearchFn = (w: Teacher, term: string) => {
  const lower = term.toLowerCase();
  return (
    w.id.toLowerCase().includes(lower) ||
    w.name.toLowerCase().includes(lower) ||
    (w.managed_class || '').toLowerCase().includes(lower)
  );
};


// ----------------------------------------------------
// 3. KAKOMLI METADATA INTERPRETER
// ----------------------------------------------------
export const getKakomliColumns = (activeContextId?: string): ColumnMetadata<Teacher>[] => {
  const ctx = getContextLabels(activeContextId);
  const baseCols = interpretColumns<Teacher>(kakomliJson.columns);
  return baseCols.map(col => {
    if (col.key === 'managed_major') {
      return { ...col, header: ctx.majorShortLabel };
    }
    return col;
  });
};

export const getKakomliFormFields = (
  eligibleUsers: Teacher[],
  majors: SchoolMajor[],
  activeContextId?: string
): FormFieldMetadata[] => {
  const ctx = getContextLabels(activeContextId);
  return kakomliJson.fields.map(field => {
    if (field.key === 'name') {
      return {
        ...field,
        type: eligibleUsers.length > 0 ? 'select' : 'text',
        options: eligibleUsers.map(u => ({ value: u.name, label: u.name }))
      } as FormFieldMetadata;
    }
    if (field.key === 'managed_major') {
      return {
        ...field,
        label: `${ctx.majorShortLabel} Kelolaan`,
        options: majors.map(m => ({ value: m.code, label: `${m.code} - ${m.name}` }))
      } as FormFieldMetadata;
    }
    return field as FormFieldMetadata;
  });
};

export const getKakomliFilters = (majors: SchoolMajor[], activeContextId?: string): FilterMetadata<Teacher>[] => {
  const ctx = getContextLabels(activeContextId);
  return kakomliJson.filters.map(filter => ({
    key: filter.key,
    label: `Filter ${ctx.majorShortLabel}`,
    options: majors.map(m => ({ value: m.code, label: m.code })),
    filterFn: (k, val) => k.managed_major === val
  }));
};

export const kakomliSearchFn = (k: Teacher, term: string) => {
  const lower = term.toLowerCase();
  return (
    k.id.toLowerCase().includes(lower) ||
    k.name.toLowerCase().includes(lower) ||
    (k.managed_major || '').toLowerCase().includes(lower)
  );
};


// ----------------------------------------------------
// 4. USERS METADATA INTERPRETER
// ----------------------------------------------------
export const getUsersColumns = (): ColumnMetadata<Teacher>[] => {
  return interpretColumns<Teacher>(usersJson.columns);
};

export const getUsersFormFields = (): FormFieldMetadata[] => {
  return usersJson.fields as FormFieldMetadata[];
};

export const getUsersFilters = (): FilterMetadata<Teacher>[] => {
  return usersJson.filters.map(filter => ({
    key: filter.key,
    label: filter.label,
    options: filter.options,
    filterFn: (u, val) => (u.role || '').toLowerCase() === val.toLowerCase()
  }));
};

export const usersSearchFn = (u: Teacher, term: string) => {
  const lower = term.toLowerCase();
  return (
    u.id.toLowerCase().includes(lower) ||
    u.name.toLowerCase().includes(lower) ||
    (u.role || '').toLowerCase().includes(lower)
  );
};


// Helper to check if context is school/education
export const isSchoolContext = (contextId?: string): boolean => {
  if (!contextId) return true;
  const c = contextId.toLowerCase();
  return c.startsWith('sekolah_') || c === 'school' || c === 'sekolah';
};

export interface ContextLabels {
  isSchool: boolean;
  entitySingular: string;
  entityPlural: string;
  idLabel: string;
  idPlaceholder: string;
  nameLabel: string;
  namePlaceholder: string;
  classLabel: string;
  classShortLabel: string;
  majorLabel: string;
  majorShortLabel: string;
  cohortLabel: string;
  cohortShortLabel: string;
  addButtonLabel: string;
  searchPlaceholder: string;
  description: string;
  excelFileName: string;
  excelTemplateHeaders: {
    id: string;
    name: string;
    classGroup: string;
    major: string;
    cohort: string;
    gender: string;
    password: string;
  };
}

export const getContextLabels = (contextId?: string): ContextLabels => {
  const c = (contextId || 'sekolah_smk').toLowerCase();
  const isSchool = c.startsWith('sekolah_') || c === 'school' || c === 'sekolah';
  const isCorporate = c === 'perusahaan' || c === 'corporate' || c === 'swasta';
  const isGov = c === 'instansi_pemerintah' || c === 'government' || c === 'pemerintah';
  const isPersonal = c === 'personal' || c === 'b2c';

  if (isPersonal) {
    return {
      isSchool: false,
      entitySingular: 'User / Klien',
      entityPlural: 'Daftar User / Klien Mandiri',
      idLabel: 'ID / Username',
      idPlaceholder: 'Contoh: USR-001 / username',
      nameLabel: 'Nama Lengkap User / Klien',
      namePlaceholder: 'Contoh: Budi Pratama',
      classLabel: 'Kategori / Kelompok',
      classShortLabel: 'Kelompok',
      majorLabel: 'Peminatan / Paket',
      majorShortLabel: 'Peminatan',
      cohortLabel: 'Tahun Registrasi',
      cohortShortLabel: 'Tahun',
      addButtonLabel: 'Tambah User / Klien',
      searchPlaceholder: 'Cari ID, nama user/klien, peminatan...',
      description: 'Database master pengguna mandiri (B2C), status akses, dan laporan hasil tes.',
      excelFileName: 'data_user_klien.xlsx',
      excelTemplateHeaders: {
        id: 'ID / Username',
        name: 'Nama Lengkap',
        classGroup: 'Kelompok',
        major: 'Peminatan',
        cohort: 'Tahun Registrasi',
        gender: 'L/P',
        password: 'Password'
      }
    };
  }

  if (isCorporate) {
    return {
      isSchool: false,
      entitySingular: 'Karyawan / Peserta',
      entityPlural: 'Data Karyawan / Peserta',
      idLabel: 'NIK / ID Karyawan',
      idPlaceholder: 'Contoh: NIK-2026-089',
      nameLabel: 'Nama Lengkap Karyawan',
      namePlaceholder: 'Contoh: Irfan Wijaya',
      classLabel: 'Divisi / Departemen',
      classShortLabel: 'Divisi',
      majorLabel: 'Jabatan / Posisi',
      majorShortLabel: 'Jabatan',
      cohortLabel: 'Tahun Masuk / Batch',
      cohortShortLabel: 'Batch / Tahun',
      addButtonLabel: 'Tambah Karyawan',
      searchPlaceholder: 'Cari NIK, nama karyawan, divisi, jabatan...',
      description: 'Database master karyawan/peserta rekrutmen perusahaan, divisi, jabatan, dan hasil evaluasi.',
      excelFileName: 'data_karyawan_perusahaan.xlsx',
      excelTemplateHeaders: {
        id: 'NIK / ID Karyawan',
        name: 'Nama Karyawan',
        classGroup: 'Divisi',
        major: 'Jabatan',
        cohort: 'Tahun Masuk',
        gender: 'L/P',
        password: 'Password'
      }
    };
  }

  if (isGov) {
    return {
      isSchool: false,
      entitySingular: 'Pegawai / Peserta',
      entityPlural: 'Data Pegawai / Peserta ASN',
      idLabel: 'NIP / ID Pegawai',
      idPlaceholder: 'Contoh: 198501012010011001',
      nameLabel: 'Nama Lengkap Pegawai',
      namePlaceholder: 'Contoh: Dr. Hendra Sujatno',
      classLabel: 'Unit Kerja / Subag',
      classShortLabel: 'Unit Kerja',
      majorLabel: 'Spesialisasi / Jabatan',
      majorShortLabel: 'Spesialisasi',
      cohortLabel: 'Tahun Pengangkatan',
      cohortShortLabel: 'Tahun',
      addButtonLabel: 'Tambah Pegawai',
      searchPlaceholder: 'Cari NIP, nama pegawai, unit kerja, spesialisasi...',
      description: 'Database master pegawai instansi pemerintah, unit kerja, jabatan, dan hasil assessment.',
      excelFileName: 'data_pegawai_instansi.xlsx',
      excelTemplateHeaders: {
        id: 'NIP / ID Pegawai',
        name: 'Nama Pegawai',
        classGroup: 'Unit Kerja',
        major: 'Spesialisasi',
        cohort: 'Tahun Pengangkatan',
        gender: 'L/P',
        password: 'Password'
      }
    };
  }

  // Default: School Context
  return {
    isSchool: true,
    entitySingular: 'Siswa',
    entityPlural: 'Data Siswa (DNT)',
    idLabel: 'ID User / NIS',
    idPlaceholder: 'Contoh: 2024001',
    nameLabel: 'Nama Lengkap Siswa',
    namePlaceholder: 'Contoh: Ahmad Subagja',
    classLabel: 'Kelas / Rombel',
    classShortLabel: 'Kelas',
    majorLabel: 'Jurusan / Konsentrasi',
    majorShortLabel: 'Jurusan',
    cohortLabel: 'Angkatan (Tahun)',
    cohortShortLabel: 'Angkatan',
    addButtonLabel: 'Tambah Siswa',
    searchPlaceholder: 'Cari NIS, nama siswa, kelas, jurusan...',
    description: 'Database master siswa peserta psikotes, kelas, angkatan, dan status pengerjaan.',
    excelFileName: 'data_siswa_sekolah.xlsx',
    excelTemplateHeaders: {
      id: 'NIS / ID',
      name: 'Nama Siswa',
      classGroup: 'Kelas',
      major: 'Jurusan',
      cohort: 'Angkatan',
      gender: 'L/P',
      password: 'Password'
    }
  };
};

// ----------------------------------------------------
// 5. STUDENTS METADATA INTERPRETER
// ----------------------------------------------------
export const getStudentsColumns = (activeContextId?: string): ColumnMetadata<Student>[] => {
  const ctx = getContextLabels(activeContextId);
  const baseCols = interpretColumns<Student>(studentsJson.columns);
  return baseCols.map(col => {
    if (col.key === 'id') {
      return { ...col, header: ctx.idLabel };
    }
    if (col.key === 'name') {
      return { ...col, header: ctx.nameLabel };
    }
    if (col.key === 'class_name') {
      return { ...col, header: ctx.classShortLabel };
    }
    if (col.key === 'major') {
      return { ...col, header: ctx.majorShortLabel };
    }
    if (col.key === 'cohort') {
      return { ...col, header: ctx.cohortShortLabel };
    }
    return col;
  });
};

export const getStudentsFormFields = (
  registeredClasses: string[],
  majors: SchoolMajor[],
  registeredCohorts: number[],
  testTypes: string[],
  activeContextId?: string
): FormFieldMetadata[] => {
  const ctx = getContextLabels(activeContextId);
  return studentsJson.fields.map(field => {
    if (field.key === 'id') {
      return {
        ...field,
        label: ctx.idLabel,
        placeholder: ctx.idPlaceholder
      } as FormFieldMetadata;
    }
    if (field.key === 'name') {
      return {
        ...field,
        label: ctx.nameLabel,
        placeholder: ctx.namePlaceholder
      } as FormFieldMetadata;
    }
    if (field.key === 'password') {
      return {
        ...field,
        label: `Password Login ${ctx.entitySingular}`
      } as FormFieldMetadata;
    }
    if (field.key === 'class_name') {
      const isPersonal = activeContextId === 'personal' || activeContextId === 'b2c';
      const fallbackOptions = isPersonal 
        ? ['Umum', 'Siswa', 'Mahasiswa', 'Karyawan', 'Lainnya'].map(c => ({ value: c, label: c }))
        : [];
      return {
        ...field,
        label: ctx.classLabel,
        type: 'datalist-text',
        options: registeredClasses.length > 0 ? registeredClasses.map(c => ({ value: c, label: c })) : fallbackOptions
      } as FormFieldMetadata;
    }
    if (field.key === 'major') {
      const isPersonal = activeContextId === 'personal' || activeContextId === 'b2c';
      const fallbackOptions = isPersonal 
        ? ['Reguler', 'Premium', 'VIP', 'Lainnya'].map(c => ({ value: c, label: c }))
        : [];
      
      const normCtx = (activeContextId || 'sekolah_smk').toLowerCase();
      const contextualMajors = majors.filter(m => {
        if (!m.applicableContexts || m.applicableContexts.length === 0) return true;
        return m.applicableContexts.includes(normCtx) || m.applicableContexts.includes('all');
      });
      const finalMajors = contextualMajors.length > 0 ? contextualMajors : majors;

      return {
        ...field,
        label: ctx.majorLabel,
        type: 'datalist-text',
        options: finalMajors.length > 0 ? finalMajors.map(m => ({ value: m.code, label: `${m.code} - ${m.name}` })) : fallbackOptions
      } as FormFieldMetadata;
    }
    if (field.key === 'cohort') {
      return {
        ...field,
        label: ctx.cohortLabel,
        type: 'datalist-text',
        options: registeredCohorts.map(c => ({ value: String(c), label: `${ctx.cohortShortLabel} ${c}` }))
      } as FormFieldMetadata;
    }
    if (field.key === 'testType') {
      return {
        ...field,
        type: 'multi-checkbox',
        options: testTypes.map(t => ({ value: t, label: t }))
      } as FormFieldMetadata;
    }
    return field as FormFieldMetadata;
  });
};

export const getStudentsFilters = (
  registeredClasses: string[],
  majors: SchoolMajor[],
  registeredCohorts: number[],
  studentsList: Student[],
  activeContextId?: string
): FilterMetadata<Student>[] => {
  const ctx = getContextLabels(activeContextId);
  return studentsJson.filters.map(filter => {
    if (filter.key === 'cohortFilter') {
      return {
        key: filter.key,
        label: `Filter ${ctx.cohortShortLabel}`,
        options: registeredCohorts.map(c => ({ value: String(c), label: `${ctx.cohortShortLabel} ${c}` })),
        filterFn: (s, val) => String(s.cohort) === val
      } as FilterMetadata<Student>;
    }

    if (filter.key === 'majorFilter') {
      const normCtx = (activeContextId || 'sekolah_smk').toLowerCase();
      const contextualMajors = majors.filter(m => {
        if (!m.applicableContexts || m.applicableContexts.length === 0) return true;
        return m.applicableContexts.includes(normCtx) || m.applicableContexts.includes('all');
      });
      const finalMajors = contextualMajors.length > 0 ? contextualMajors : majors;

      return {
        key: filter.key,
        label: `Filter ${ctx.majorShortLabel}`,
        options: finalMajors.map(m => ({ value: m.code, label: m.code })),
        filterFn: (s, val) => s.major === val,
        dependsOn: 'cohortFilter',
        getOptions: (cohortVal) => {
          if (cohortVal === 'All') {
            return finalMajors.map(m => ({ value: m.code, label: m.code }));
          }
          const relevantMajors = new Set(
            studentsList
              .filter(s => String(s.cohort) === cohortVal)
              .map(s => s.major)
          );
          return finalMajors
            .filter(m => relevantMajors.has(m.code))
            .map(m => ({ value: m.code, label: m.code }));
        }
      } as FilterMetadata<Student>;
    }

    if (filter.key === 'classFilter') {
      return {
        key: filter.key,
        label: `Filter ${ctx.classShortLabel}`,
        options: registeredClasses.map(c => ({ value: c, label: c })),
        filterFn: (s, val) => s.class_name === val,
        dependsOn: 'majorFilter',
        getOptions: (majorVal, allValues) => {
          const cohortVal = allValues['cohortFilter'];
          let matching = studentsList;
          if (cohortVal && cohortVal !== 'All') {
            matching = matching.filter(s => String(s.cohort) === cohortVal);
          }
          if (majorVal && majorVal !== 'All') {
            matching = matching.filter(s => s.major === majorVal);
          }
          const relevantClasses = new Set(matching.map(s => s.class_name));
          return registeredClasses
            .filter(c => relevantClasses.has(c))
            .map(c => ({ value: c, label: c }));
        }
      } as FilterMetadata<Student>;
    }

    // Status filter
    return {
      key: filter.key,
      label: filter.label,
      options: filter.options,
      filterFn: (s, val) => {
        if (val === 'SELESAI') return s.status === 'SELESAI' || !!s.completedAt;
        return s.status !== 'SELESAI' && !s.completedAt;
      }
    } as FilterMetadata<Student>;
  });
};

export const studentsSearchFn = (s: Student, term: string) => {
  const lower = term.toLowerCase();
  return (
    s.id.toLowerCase().includes(lower) ||
    s.name.toLowerCase().includes(lower) ||
    (s.class_name || '').toLowerCase().includes(lower) ||
    (s.major || '').toLowerCase().includes(lower) ||
    String(s.cohort || '').includes(lower)
  );
};


// ----------------------------------------------------
// 6. TESTTYPES METADATA INTERPRETER
// ----------------------------------------------------
export const getTestTypesColumns = (): ColumnMetadata<TestType>[] => {
  return interpretColumns<TestType>(testTypesJson.columns);
};

export const getTestTypesFormFields = (): FormFieldMetadata[] => {
  return testTypesJson.fields as FormFieldMetadata[];
};

export const testTypesSearchFn = (t: TestType, term: string) => {
  const lower = term.toLowerCase();
  return (
    t.name.toLowerCase().includes(lower) ||
    (t.description || '').toLowerCase().includes(lower)
  );
};


// ----------------------------------------------------
// 7. PACKAGES METADATA INTERPRETER
// ----------------------------------------------------
export const getPackagesColumns = (): ColumnMetadata<Package>[] => {
  return interpretColumns<Package>(packagesJson.columns);
};

export const getPackagesFormFields = (
  testTypeOptions: { value: string; label: string }[]
): FormFieldMetadata[] => {
  return packagesJson.fields.map(field => {
    if (field.key === 'testTypeId' || field.key === 'testTypeIds') {
      return {
        ...field,
        type: 'multi-checkbox',
        colSpan: 'full',
        options: [{ value: 'all', label: 'Semua Jenis Tes (Akses Penuh)' }, ...testTypeOptions]
      } as FormFieldMetadata;
    }
    return field as FormFieldMetadata;
  });
};

export const packagesSearchFn = (p: Package, term: string) => {
  const lower = term.toLowerCase();
  return (
    p.name.toLowerCase().includes(lower) ||
    String(p.price).includes(lower)
  );
};


// ----------------------------------------------------
// 8. QUESTIONS METADATA INTERPRETER
// ----------------------------------------------------
export const getQuestionsColumns = (): ColumnMetadata<Question>[] => {
  const baseColumns = interpretColumns<Question>(questionsJson.columns);
  return [
    ...baseColumns,
    {
      key: 'scoringType',
      header: 'Skema & Penilai Butir',
      sortable: true,
      render: (q: Question) => {
        const type = q.scoringType || (q.testType === 'IQ' ? 'binary' : 'weighted');
        let typeBadge = 'bg-blue-50 text-blue-700 border-blue-200';
        let typeLabel = 'Bobot Skala';
        if (type === 'binary') {
          typeBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          typeLabel = 'Kunci Benar';
        } else if (type === 'likert') {
          typeBadge = 'bg-indigo-50 text-indigo-700 border-indigo-200';
          typeLabel = 'Skala Likert (1-5)';
        }

        const isRev = Boolean(q.isUnfavorable);

        return React.createElement(
          'div',
          { className: 'flex flex-col gap-1 items-start' },
          React.createElement(
            'span',
            { className: `inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border uppercase tracking-wider ${typeBadge}` },
            typeLabel
          ),
          isRev && React.createElement(
            'span',
            { className: 'inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200' },
            '⇄ Unfavorable (Reverse)'
          )
        );
      }
    },
    {
      key: 'educationLevel',
      header: 'Target Jenjang & Sektor',
      sortable: true,
      render: (q: Question) => {
        const rawContexts = (q.applicableContexts || []).map(c => String(c).toLowerCase());
        const level = (q.educationLevel || q.aiClassification?.suggestedLevel || 'SMA').toUpperCase();
        const pkg = (q.packageId || '').toUpperCase();

        const badges: { key: string; label: string; bg: string }[] = [];
        const added = new Set<string>();

        const addBadge = (key: string, label: string, bg: string) => {
          if (!added.has(key)) {
            added.add(key);
            badges.push({ key, label, bg });
          }
        };

        if (level === 'SD' || rawContexts.includes('sekolah_sd')) {
          addBadge('SD', 'SD / MI', 'bg-rose-50 text-rose-700 border-rose-200');
        }
        if (level === 'SMP' || rawContexts.includes('sekolah_smp')) {
          addBadge('SMP', 'SMP / MTs', 'bg-sky-50 text-sky-700 border-sky-200');
        }
        if (level === 'SMA' || rawContexts.includes('sekolah_sma')) {
          addBadge('SMA', 'SMA / MA', 'bg-indigo-50 text-indigo-700 border-indigo-200');
        }
        if (level === 'SMK' || rawContexts.includes('sekolah_smk') || pkg.includes('VOKASI')) {
          addBadge('SMK', 'SMK / Vokasi', 'bg-emerald-50 text-emerald-700 border-emerald-200');
        }
        if (level === 'PERGURUAN_TINGGI' || level === 'KAMPUS' || rawContexts.includes('perguruan_tinggi') || rawContexts.includes('kampus')) {
          addBadge('PT', 'Perguruan Tinggi', 'bg-purple-50 text-purple-700 border-purple-200');
        }
        if (level === 'PROFESIONAL' || level === 'KORPORAT' || rawContexts.includes('perusahaan')) {
          addBadge('KORPORAT', 'Korporat / B2B', 'bg-amber-50 text-amber-800 border-amber-200');
        }
        if (level === 'ALL' || level === 'GLOBAL' || rawContexts.includes('global') || rawContexts.includes('all')) {
          addBadge('GLOBAL', 'Global / Semua', 'bg-slate-100 text-slate-700 border-slate-200');
        }

        if (badges.length === 0) {
          addBadge('SMA', 'SMA / MA', 'bg-indigo-50 text-indigo-700 border-indigo-200');
        }

        return React.createElement(
          'div',
          { className: 'flex flex-wrap gap-1 items-center max-w-[220px]' },
          badges.map(b => React.createElement(
            'span',
            {
              key: b.key,
              className: `inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${b.bg}`
            },
            b.label
          ))
        );
      }
    },
    {
      key: 'difficultyLevel',
      header: 'Tingkat Kesulitan & Status',
      sortable: true,
      render: (q: Question) => {
        const diff = q.difficultyLevel || q.aiClassification?.suggestedDifficulty || 'sedang';
        const pVal = q.difficultyIndex || (diff === 'sangat_mudah' ? 0.85 : diff === 'mudah' ? 0.70 : diff === 'sedang' ? 0.50 : diff === 'sulit' ? 0.32 : 0.15);
        const reviewStatus = q.aiClassification?.reviewStatus || 'AUTO';

        let badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
        let diffLabel = 'Sedang';
        if (diff === 'sangat_mudah') { badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200'; diffLabel = 'Sangat Mudah'; }
        else if (diff === 'mudah') { badgeStyle = 'bg-teal-50 text-teal-700 border-teal-200'; diffLabel = 'Mudah'; }
        else if (diff === 'sedang') { badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200'; diffLabel = 'Sedang'; }
        else if (diff === 'sulit') { badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200'; diffLabel = 'Sulit'; }
        else if (diff === 'sangat_sulit') { badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200'; diffLabel = 'Sangat Sulit'; }

        let statusStyle = 'bg-slate-100 text-slate-600 border-slate-200';
        let statusText = 'AUTO AI';
        if (reviewStatus === 'VERIFIED') { statusStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300'; statusText = 'VERIFIED'; }
        else if (reviewStatus === 'OVERRIDDEN') { statusStyle = 'bg-purple-100 text-purple-800 border-purple-300'; statusText = 'MANUAL'; }

        return React.createElement(
          'div',
          { className: 'flex flex-col gap-1 items-start' },
          React.createElement(
            'span',
            { className: `inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeStyle}` },
            `${diffLabel} (p: ${pVal.toFixed(2)})`
          ),
          React.createElement(
            'span',
            { className: `inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase border ${statusStyle}` },
            statusText
          )
        );
      }
    },
    {
      key: 'verificationStatus',
      header: 'Validasi Ahli (BK/Psikolog)',
      sortable: true,
      render: (q: Question) => {
        const isVerified = q.verificationStatus === 'VERIFIED';
        return React.createElement(
          'div',
          { className: 'flex flex-col gap-1 items-start' },
          React.createElement(
            'span',
            {
              className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider ${
                isVerified
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`
            },
            isVerified ? '✓ TERVERIFIKASI' : '⏳ BELUM DIVERIFIKASI'
          ),
          q.verifiedBy && React.createElement(
            'span',
            { className: 'text-[9px] font-medium text-slate-500 truncate max-w-[140px]' },
            `Oleh: ${q.verifiedBy}`
          )
        );
      }
    },
    {
      key: 'licenseCode',
      header: 'Lisensi Khusus',
      sortable: true,
      render: (q: Question) => {
        const val = q.licenseCode && q.licenseCode !== 'undefined' ? q.licenseCode : '';
        const isGlobal = !val || val.toLowerCase() === 'global';
        return React.createElement(
          'span',
          {
            className: `inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
              isGlobal
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-purple-50 text-purple-700 border-purple-100'
            }`
          },
          isGlobal ? 'Global (Semua)' : val
        );
      }
    }
  ];
};

export const getQuestionsFormFields = (
  dimensions: Dimension[],
  testTypes: string[],
  vouchers: Voucher[] = []
): FormFieldMetadata[] => {
  return questionsJson.fields.map(field => {
    if (field.key === 'dimension') {
      return {
        ...field,
        type: dimensions.length > 0 ? 'select' : 'text',
        options: (() => {
          const seen = new Set<string>();
          const opts: { value: string; label: string }[] = [];
          dimensions.forEach(d => {
            const codeValid = Boolean(d.code && d.code !== 'undefined' && d.code.trim() !== '');
            const nameValid = d.name && d.name !== 'undefined' ? d.name : '';
            const val = nameValid || (codeValid && d.code ? d.code : d.id);
            const lbl = codeValid ? `${d.code} - ${nameValid || d.id}` : (nameValid || d.id);
            if (val && !seen.has(val)) {
              seen.add(val);
              opts.push({ value: val, label: lbl });
            }
          });
          return opts;
        })()
      } as FormFieldMetadata;
    }
    if (field.key === 'testType') {
      return {
        ...field,
        type: testTypes.length > 0 ? 'select' : 'text',
        options: testTypes.map(t => ({ value: t, label: t }))
      } as FormFieldMetadata;
    }
    return field as FormFieldMetadata;
  });
};

export const getQuestionsFilters = (
  dimensions: Dimension[],
  testTypes: string[],
  vouchers: Voucher[] = []
): FilterMetadata<Question>[] => {
  const baseFilters = questionsJson.filters.map(filter => {
    if (filter.key === 'dimensionFilter') {
      return {
        key: filter.key,
        label: filter.label,
        options: (() => {
          const seen = new Set<string>();
          const opts: { value: string; label: string }[] = [];
          dimensions.forEach(d => {
            const codeValid = Boolean(d.code && d.code !== 'undefined' && d.code.trim() !== '');
            const nameValid = d.name && d.name !== 'undefined' ? d.name : '';
            const val = nameValid || (codeValid && d.code ? d.code : d.id);
            const lbl = codeValid ? `${d.code} - ${nameValid || d.id}` : (nameValid || d.id);
            if (val && !seen.has(val)) {
              seen.add(val);
              opts.push({ value: val, label: lbl });
            }
          });
          return opts;
        })(),
        filterFn: (q, val) => {
          if (!val || val === 'All' || val === 'Semua') return true;
          const target = val.trim().toLowerCase();
          const qDim = (q.dimension || '').trim().toLowerCase();
          if (!qDim) return false;
          // Match by direct name, code, or substring
          if (qDim === target || qDim.includes(target) || target.includes(qDim)) return true;
          // Cross-reference with dimension master definitions
          const matchedDimension = dimensions.find(d => {
            const dName = (d.name || '').trim().toLowerCase();
            const dCode = (d.code || '').trim().toLowerCase();
            const dId = (d.id || '').trim().toLowerCase();
            return (dName && dName === target) || (dCode && dCode === target) || (dId && dId === target);
          });
          if (matchedDimension) {
            const dName = (matchedDimension.name || '').trim().toLowerCase();
            const dCode = (matchedDimension.code || '').trim().toLowerCase();
            const dId = (matchedDimension.id || '').trim().toLowerCase();
            return qDim === dName || qDim === dCode || qDim === dId || (dName && qDim.includes(dName));
          }
          return false;
        },
        dependsOn: 'testTypeFilter',
        getOptions: (testTypeVal) => {
          if (!testTypeVal || testTypeVal === 'All') {
            return dimensions.map(d => {
              const codeValid = Boolean(d.code && d.code !== 'undefined' && d.code.trim() !== '');
              const nameValid = d.name && d.name !== 'undefined' ? d.name : '';
              const val = nameValid || (codeValid && d.code ? d.code : d.id);
              const lbl = codeValid ? `${d.code} - ${nameValid || d.id}` : (nameValid || d.id);
              return { value: val, label: lbl };
            });
          }
          const filteredDims = dimensions.filter(d => {
            const effType = resolveEffectiveTestType({ testType: d.testType }, dimensions);
            return effType.toUpperCase() === testTypeVal.toUpperCase() || (d.testType || '').toUpperCase() === testTypeVal.toUpperCase();
          });
          return filteredDims.map(d => {
            const codeValid = Boolean(d.code && d.code !== 'undefined' && d.code.trim() !== '');
            const nameValid = d.name && d.name !== 'undefined' ? d.name : '';
            const val = nameValid || (codeValid && d.code ? d.code : d.id);
            const lbl = codeValid ? `${d.code} - ${nameValid || d.id}` : (nameValid || d.id);
            return { value: val, label: lbl };
          });
        }
      } as FilterMetadata<Question>;
    }
    return {
      key: filter.key,
      label: filter.label,
      options: testTypes.map(t => ({ value: t, label: t })),
      filterFn: (q, val) => matchesTestTypeFilter(q, val, dimensions)
    } as FilterMetadata<Question>;
  });

  const voucherOptions = vouchers.map(v => ({
    value: v.code,
    label: v.code
  }));

  return [
    ...baseFilters,
    {
      key: 'licenseFilter',
      label: 'Filter Lisensi',
      options: [
        { value: 'global', label: 'Global (Tanpa Lisensi)' },
        ...voucherOptions
      ],
      filterFn: (q, val) => {
        if (val === 'global') {
          return !q.licenseCode || q.licenseCode.toLowerCase() === 'global' || q.licenseCode === 'undefined';
        }
        return q.licenseCode?.toUpperCase() === val.toUpperCase();
      }
    } as FilterMetadata<Question>,
    {
      key: 'verificationFilter',
      label: 'Status Validasi Ahli',
      options: [
        { value: 'VERIFIED', label: '✓ Terverifikasi Ahli / Psikolog' },
        { value: 'DRAFT', label: '⏳ Draft / Belum Diverifikasi' }
      ],
      filterFn: (q, val) => {
        if (val === 'VERIFIED') return q.verificationStatus === 'VERIFIED';
        if (val === 'DRAFT') return q.verificationStatus !== 'VERIFIED';
        return true;
      }
    } as FilterMetadata<Question>
  ];
};

export const questionsSearchFn = (q: Question, term: string) => {
  const lower = term.toLowerCase().trim();
  if (!lower) return true;
  const effectiveType = resolveEffectiveTestType(q).toLowerCase();
  return (
    (q.id || '').toLowerCase().includes(lower) ||
    (q.text || '').toLowerCase().includes(lower) ||
    (q.dimension || '').toLowerCase().includes(lower) ||
    (q.testType || '').toLowerCase().includes(lower) ||
    effectiveType.includes(lower) ||
    (q.choices || []).some(c => (c.text || '').toLowerCase().includes(lower))
  );
};


// ----------------------------------------------------
// 9. CLASSES AND COHORTS METADATA INTERPRETER
// ----------------------------------------------------
export interface RegisteredClassItem {
  id: string;
  name: string;
}

export interface RegisteredCohortItem {
  id: string;
  year: number;
}

export const getClassColumns = (activeContextId?: string): ColumnMetadata<RegisteredClassItem>[] => {
  const ctx = getContextLabels(activeContextId);
  const baseCols = interpretColumns<RegisteredClassItem>(classesCohortsJson.classColumns);
  return baseCols.map(col => {
    if (col.key === 'name') {
      return { ...col, header: ctx.classLabel };
    }
    return col;
  });
};

export const getClassFormFields = (activeContextId?: string): FormFieldMetadata[] => {
  const ctx = getContextLabels(activeContextId);
  return classesCohortsJson.classFields.map(field => {
    if (field.key === 'name') {
      return {
        ...field,
        label: `Nama ${ctx.classLabel}`,
        placeholder: `Contoh: ${ctx.isSchool ? 'X-RPL-1' : 'Divisi Operasional A'}`
      } as FormFieldMetadata;
    }
    return field as FormFieldMetadata;
  });
};

export const classSearchFn = (c: RegisteredClassItem, term: string) => {
  return c.name.toLowerCase().includes(term.toLowerCase());
};

export const getCohortColumns = (activeContextId?: string): ColumnMetadata<RegisteredCohortItem>[] => {
  const ctx = getContextLabels(activeContextId);
  const baseCols = interpretColumns<RegisteredCohortItem>(classesCohortsJson.cohortColumns);
  return baseCols.map(col => {
    if (col.key === 'year') {
      return { ...col, header: ctx.cohortLabel };
    }
    return col;
  });
};

export const getCohortFormFields = (activeContextId?: string): FormFieldMetadata[] => {
  const ctx = getContextLabels(activeContextId);
  return classesCohortsJson.cohortFields.map(field => {
    if (field.key === 'year') {
      return {
        ...field,
        label: ctx.cohortLabel,
        placeholder: `Contoh: ${new Date().getFullYear()}`
      } as FormFieldMetadata;
    }
    return field as FormFieldMetadata;
  });
};

export const cohortSearchFn = (c: RegisteredCohortItem, term: string) => {
  return String(c.year).includes(term.toLowerCase());
};


// ----------------------------------------------------
// 10. DIMENSIONS METADATA INTERPRETER
// ----------------------------------------------------
export const getDimensionsColumns = (): ColumnMetadata<Dimension>[] => {
  const baseColumns = interpretColumns<Dimension>(dimensionsJson.columns);
  return [
    ...baseColumns,
    {
      key: 'scoringMethod',
      header: 'Metode Penilai & Norma',
      sortable: true,
      render: (d: Dimension) => {
        const method = d.scoringMethod || 'percentage';
        let methodLabel = 'Persentase (0-100%)';
        let badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        if (method === 'sum_raw') {
          methodLabel = 'Skor Mentah (Raw)';
          badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
        } else if (method === 'sten') {
          methodLabel = 'Standard Ten (Sten 1-10)';
          badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
        } else if (method === 'mean') {
          methodLabel = 'Rata-rata Butir';
          badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }

        const rangeCount = (d.normRanges || []).length || 3;

        return React.createElement(
          'div',
          { className: 'flex flex-col gap-1 items-start' },
          React.createElement(
            'span',
            { className: `inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border ${badgeStyle}` },
            methodLabel
          ),
          React.createElement(
            'span',
            { className: 'inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200' },
            `${rangeCount} Tingkat Norma Kategori`
          )
        );
      }
    }
  ];
};

export const getDimensionsFormFields = (): FormFieldMetadata[] => {
  return dimensionsJson.fields as FormFieldMetadata[];
};

export const dimensionsSearchFn = (d: Dimension, term: string) => {
  const lower = term.toLowerCase();
  return (
    (d.code || d.id || '').toLowerCase().includes(lower) ||
    d.name.toLowerCase().includes(lower) ||
    (d.description || '').toLowerCase().includes(lower)
  );
};


// ----------------------------------------------------
// 11. LICENSES METADATA INTERPRETER
// ----------------------------------------------------
export const getLicensesColumns = (): ColumnMetadata<Voucher>[] => {
  return interpretColumns<Voucher>(licensesJson.columns);
};

export const getLicensesFormFields = (): FormFieldMetadata[] => {
  return licensesJson.fields as FormFieldMetadata[];
};

export const licensesSearchFn = (v: Voucher, term: string) => {
  const lower = term.toLowerCase();
  return (
    v.code.toLowerCase().includes(lower) ||
    (v.schoolName || '').toLowerCase().includes(lower)
  );
};


// ----------------------------------------------------
// 12. CERTIFICATESETTINGS METADATA INTERPRETER
// ----------------------------------------------------
export const getCertificateSettingsFormFields = (): FormFieldMetadata[] => {
  return certificateSettingsJson.fields as FormFieldMetadata[];
};


// ----------------------------------------------------
// 13. MENU METADATA INTERPRETER
// ----------------------------------------------------
export type TenantContextType = 
  | 'superadmin'
  | 'personal'
  | 'sekolah_sd'
  | 'sekolah_smp'
  | 'sekolah_sma'
  | 'sekolah_smk'
  | 'instansi_pemerintah'
  | 'perusahaan';

export interface MenuItemDef {
  id: string;
  label: string;
  icon: string;
  roles?: string[]; 
}

export interface MenuGroupDef {
  id: string;
  label: string;
  items: MenuItemDef[];
}

export interface ContextMenuDef {
  id: TenantContextType;
  label: string;
  description: string;
  groups: MenuGroupDef[];
}

export const MenuContexts: Record<TenantContextType, ContextMenuDef> = menuJson as Record<TenantContextType, ContextMenuDef>;
