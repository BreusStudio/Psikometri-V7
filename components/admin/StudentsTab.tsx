'use client';

import React, { useMemo, useCallback } from 'react';
import { Users, Eye } from 'lucide-react';
import { Student } from '../../lib/types';
import { PsychometricStore } from '../../lib/mockData';
import MetadataCoreEngine from './shared/MetadataCoreEngine';
import DummyDataControlBar from './shared/DummyDataControlBar';
import { StudentRepository } from '../../lib/repositories';
import {
  getStudentsColumns,
  getStudentsFormFields,
  getStudentsFilters,
  studentsSearchFn,
  isSchoolContext,
  getContextLabels
} from '../../lib/metadata';

interface StudentsTabProps {
  store: PsychometricStore;
  students: Student[];
  studentPage?: number;
  setStudentPage?: React.Dispatch<React.SetStateAction<number>>;
  studentsPerPage?: number;
  setSelectedStudent?: (s: Student | null) => void;
  setActiveTab?: (tab: any) => void;
  onRefresh: () => void;
  session: any;
  refreshTrigger?: number;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
  activeContextId?: string;
}

export default function StudentsTab({
  store,
  students,
  setSelectedStudent,
  setActiveTab,
  onRefresh,
  session,
  refreshTrigger,
  showNotification,
  activeContextId
}: StudentsTabProps) {
  const repository = useMemo(() => new StudentRepository(store), [store]);
  const isSchool = isSchoolContext(activeContextId);
  const canEdit = Boolean(
    session?.role === 'Superadmin' ||
    session?.role === 'Admin' ||
    session?.role === 'admin' ||
    session?.role === 'superadmin' ||
    session?.role === 'Guru BK' ||
    session?.role === 'bk'
  );

  const canManageTechnical = canEdit || Boolean(
    session?.role === 'Proktor' || 
    session?.role === 'proktor'
  );

  const registeredClasses = useMemo(() => {
    return [...store.getRegisteredClasses()];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, refreshTrigger]);

  const registeredCohorts = useMemo(() => {
    return [...store.getRegisteredCohorts()];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, refreshTrigger]);

  const majors = useMemo(() => {
    return store.getMajors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, refreshTrigger]);

  const testTypes = useMemo(() => {
    return store.getTestTypes().map(t => t.name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, refreshTrigger]);

  const baseColumns = useMemo(() => getStudentsColumns(activeContextId), [activeContextId]);
  
  // Custom column to add "Lihat Laporan" action
  const columns = useMemo(() => {
    const cols = [...baseColumns];
    
    // Insert "Anti-Cheat" before the last columns
    cols.splice(cols.length - 1, 0, {
      key: 'cheatStatus',
      header: 'Anti-Cheat',
      render: (s: Student) => {
        if (s.lockedOut) {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-700">
                Terkunci (3+ Pelanggaran)
              </span>
              {s.lockReason && (
                <span className="text-[9px] text-slate-500 max-w-[120px] truncate" title={s.lockReason}>
                  {s.lockReason}
                </span>
              )}
            </div>
          );
        }
        if (s.cheatWarnings > 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700 animate-pulse">
              {s.cheatWarnings} Peringatan
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-50 border border-slate-200 text-slate-500">
            Aman
          </span>
        );
      }
    });

    if (setSelectedStudent && setActiveTab) {
      cols.push({
        key: 'viewReport',
        header: 'Aksi / Laporan',
        render: (s: Student) => (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                setSelectedStudent(s);
                setActiveTab('reports');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-3 h-3" />
              Laporan
            </button>
            {s.lockedOut && canManageTechnical && (
              <button
                onClick={() => {
                  const confirmed = window.confirm(`Buka kunci ujian untuk siswa ${s.name}?`);
                  if (confirmed) {
                    store.unlockStudent(s.id);
                    onRefresh();
                    if (showNotification) {
                      showNotification(`Berhasil membuka kunci ujian untuk ${s.name}.`, 'success');
                    }
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer whitespace-nowrap animate-bounce"
              >
                Buka Kunci
              </button>
            )}
            {s.cheatWarnings > 0 && !s.lockedOut && canManageTechnical && (
              <button
                onClick={() => {
                  const confirmed = window.confirm(`Reset peringatan anti-curang untuk siswa ${s.name}?`);
                  if (confirmed) {
                    const student = store.getStudents().find(x => x.id === s.id);
                    if (student) {
                      student.cheatWarnings = 0;
                      store.saveStudent(student);
                      onRefresh();
                      if (showNotification) {
                        showNotification(`Berhasil mereset peringatan kecurangan untuk ${s.name}.`, 'success');
                      }
                    }
                  }
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer whitespace-nowrap"
              >
                Reset Warning
              </button>
            )}
          </div>
        )
      });
    }
    return cols;
  }, [baseColumns, setSelectedStudent, setActiveTab, canManageTechnical, store, onRefresh, showNotification]);

  const ctx = useMemo(() => getContextLabels(activeContextId), [activeContextId]);

  const fields = useMemo(
    () => getStudentsFormFields(registeredClasses, majors, registeredCohorts, testTypes, activeContextId),
    [registeredClasses, majors, registeredCohorts, testTypes, activeContextId]
  );

  const filters = useMemo(
    () => getStudentsFilters(registeredClasses, majors, registeredCohorts, students, activeContextId),
    [registeredClasses, majors, registeredCohorts, students, activeContextId]
  );

  const filteredStudents = useMemo(() => {
    let list = students;
    const roleLower = (session?.role || '').toLowerCase().trim();

    // Scoping for Wali Kelas
    if ((roleLower === 'wali kelas' || roleLower === 'wali-kelas') && session?.managed_class) {
      const mc = session.managed_class.trim().toLowerCase();
      list = list.filter(st => (st.classGroup || st.class_name || '').trim().toLowerCase() === mc);
    } 
    // Scoping for Kakomli / Kaprog
    else if ((roleLower === 'kakomli' || roleLower === 'kaprog') && session?.managed_class) {
      const mj = session.managed_class.trim().toLowerCase();
      list = list.filter(st => 
        (st.major || '').trim().toLowerCase().includes(mj) || 
        (st.classGroup || '').trim().toLowerCase().includes(mj)
      );
    }

    // Scoping by activeContextId / school origin if specified
    if (activeContextId) {
      list = list.filter(st => {
        const origin = (st.school_origin || st.schoolOrigin || '').trim().toLowerCase();
        if (!origin) return true;
        return origin.includes(activeContextId.toLowerCase());
      });
    }

    return list;
  }, [students, session, activeContextId]);

  const mapStudentInitialValues = useCallback((s: Student) => {
    let selectedTestTypes: string[] = [];
    if (Array.isArray(s.allowedTests) && s.allowedTests.length > 0) {
      selectedTestTypes = s.allowedTests;
    } else if (typeof s.testType === 'string' && s.testType.trim() !== '') {
      selectedTestTypes = s.testType.split(',').map((t: string) => t.trim());
    } else {
      selectedTestTypes = ['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas'];
    }

    // Map any test IDs (e.g., 'IQ') to their full names so they match the checkboxes in the UI
    const allTypes = store.getTestTypes();
    const mappedToNames = selectedTestTypes.map(val => {
      const found = allTypes.find(t => t.id === val || t.name === val);
      return found ? found.name : val;
    });

    return {
      ...s,
      testType: mappedToNames
    };
  }, [store]);

  const handleAdd = (values: Record<string, any>) => {
    const payload = {
      ...values,
      school_origin: values.school_origin || activeContextId || '',
      schoolOrigin: values.schoolOrigin || activeContextId || ''
    };
    return repository.add(payload);
  };

  const handleUpdate = (id: string, values: Record<string, any>) => {
    return repository.update(id, values);
  };

  const handleDelete = (id: string) => {
    repository.delete(id);
  };

  const handleImportExcel = (rows: any[]) => {
    const mapped = rows.map(r => ({
      id: String(
        r[ctx.excelTemplateHeaders.id] ||
        r['NIS'] || r['NIS / ID'] || r['id'] || r['ID / Username'] || r['NIP'] || r['NIK'] || ''
      ).trim(),
      name: String(
        r[ctx.excelTemplateHeaders.name] ||
        r['Nama'] || r['Nama Siswa'] || r['Nama User'] || r['Nama Karyawan'] || r['Nama Pegawai'] || r['name'] || ''
      ).trim(),
      class_name: String(
        r[ctx.excelTemplateHeaders.classGroup] ||
        r['Kelas'] || r['Divisi'] || r['Unit Kerja'] || r['Kelompok'] || r['class_name'] || 'Umum'
      ).trim(),
      major: String(
        r[ctx.excelTemplateHeaders.major] ||
        r['Jurusan'] || r['Jabatan'] || r['Spesialisasi'] || r['Peminatan'] || r['major'] || 'Umum'
      ).trim(),
      cohort: Number(
        r[ctx.excelTemplateHeaders.cohort] ||
        r['Angkatan'] || r['Tahun'] || r['Tahun Masuk'] || r['cohort'] || new Date().getFullYear()
      ),
      gender: (r[ctx.excelTemplateHeaders.gender] || r['L/P'] || r['gender'] || 'L').toString().toUpperCase().startsWith('P') ? 'P' : 'L',
      password: String(r[ctx.excelTemplateHeaders.password] || r['Password'] || r['password'] || '123456').trim(),
      school_origin: activeContextId || ''
    }));

    return repository.importStudents(mapped);
  };

  return (
    <MetadataCoreEngine<Student>
      resourceName={ctx.entitySingular}
      resourceIcon={<Users className="w-5 h-5 text-indigo-600" />}
      description={ctx.description}
      data={filteredStudents}
      columns={columns}
      fields={fields}
      filters={filters}
      idField="id"
      canEdit={canEdit}
      searchPlaceholder={ctx.searchPlaceholder}
      searchFn={studentsSearchFn}
      defaultSortField="id"
      defaultSortOrder="asc"
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onRefresh={onRefresh}
      showNotification={showNotification}
      mapInitialValues={mapStudentInitialValues}
      excelTemplateData={[
        {
          [ctx.excelTemplateHeaders.id]: '2025001',
          [ctx.excelTemplateHeaders.name]: 'Ahmad Subagja',
          [ctx.excelTemplateHeaders.classGroup]: ctx.isSchool ? 'X-RPL-1' : 'Divisi Utama',
          [ctx.excelTemplateHeaders.major]: ctx.isSchool ? 'RPL' : 'Staf Operasional',
          [ctx.excelTemplateHeaders.cohort]: 2025,
          [ctx.excelTemplateHeaders.gender]: 'L',
          [ctx.excelTemplateHeaders.password]: '123456'
        }
      ]}
      excelExportFileName={ctx.excelFileName}
      excelExportMapper={(s) => ({
        [ctx.excelTemplateHeaders.id]: s.id,
        [ctx.excelTemplateHeaders.name]: s.name,
        [ctx.excelTemplateHeaders.classGroup]: s.class_name,
        [ctx.excelTemplateHeaders.major]: s.major,
        [ctx.excelTemplateHeaders.cohort]: s.cohort,
        [ctx.excelTemplateHeaders.gender]: s.gender,
        'Status': s.status,
        'Password': s.password
      })}
      onImportExcel={handleImportExcel}
      onClearAll={() => store.clearAllStudents()}
      topContent={
        <DummyDataControlBar
          store={store}
          onRefresh={onRefresh}
          showNotification={showNotification}
        />
      }
    />
  );
}
