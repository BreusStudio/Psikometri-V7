'use client';

import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { Teacher } from '../../lib/types';
import { PsychometricStore } from '../../lib/mockData';
import MetadataCoreEngine from './shared/MetadataCoreEngine';
import { TeacherRepository } from '../../lib/repositories';
import {
  getUsersColumns,
  getUsersFormFields,
  getUsersFilters,
  usersSearchFn
} from '../../lib/metadata';

interface UsersTabProps {
  store: PsychometricStore;
  teachers: Teacher[];
  onRefresh: () => void;
  session: any;
  refreshTrigger?: number;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
  activeContextId?: string;
}

export default function UsersTab({
  store,
  teachers,
  onRefresh,
  session,
  showNotification,
  activeContextId
}: UsersTabProps) {
  const repository = useMemo(() => new TeacherRepository(store), [store]);
  const roleLower = (session?.role || '').toLowerCase().trim();
  const canEdit = roleLower === 'superadmin' || roleLower === 'admin';

  const filteredTeachers = useMemo(() => {
    if (roleLower === 'superadmin') return teachers;
    
    if (!activeContextId) return teachers;

    return teachers.filter(t => {
      if (t.id === 'super' || t.id === 'admin') return true;
      
      const tContext = (t.school_origin || t.context || '').trim().toLowerCase();
      const tContexts = t.applicableContexts || [];
      
      if (tContexts.length > 0) {
        return tContexts.includes(activeContextId);
      }
      if (tContext) {
        return tContext.includes(activeContextId.toLowerCase());
      }
      return true;
    });
  }, [teachers, activeContextId, roleLower]);

  const columns = useMemo(() => getUsersColumns(), []);
  const fields = useMemo(() => getUsersFormFields(), []);
  const filters = useMemo(() => getUsersFilters(), []);

  const handleAdd = (values: Record<string, any>) => {
    const payload = {
      ...values,
      school_origin: values.school_origin || activeContextId || '',
      context: values.context || activeContextId || '',
      applicableContexts: activeContextId ? [activeContextId] : []
    };
    return repository.add(payload);
  };

  const handleUpdate = (id: string, values: Record<string, any>) => {
    return repository.update(id, values);
  };

  const handleDelete = (id: string) => {
    repository.delete(id);
  };

  return (
    <MetadataCoreEngine<Teacher>
      resourceName="Pengguna & Staff Sekolah"
      resourceIcon={<Users className="w-5 h-5 text-indigo-600" />}
      description="Manajemen akun pengguna sistem (Admin, Guru BK, Wali Kelas, Kakomli, & Guru)."
      data={filteredTeachers}
      columns={columns}
      fields={fields}
      filters={filters}
      idField="id"
      canEdit={canEdit}
      searchPlaceholder="Cari nama, ID, atau peran pengguna..."
      searchFn={usersSearchFn}
      defaultSortField="id"
      defaultSortOrder="asc"
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onRefresh={onRefresh}
      showNotification={showNotification}
      excelTemplateData={[
        { id: 'admin.budi', name: 'Budi Santoso', password: '123', role: 'Admin' }
      ]}
      excelExportFileName="data_pengguna.xlsx"
      excelExportMapper={(u) => ({
        'Username': u.id,
        'Nama Lengkap': u.name,
        'Peran (Role)': u.role,
        'Password': u.password
      })}
      onClearAll={() => store.clearAllTeachers()}
      clearAllConfirmMessage="Apakah Anda yakin ingin mengosongkan data pengguna tambahan? Akun utama sistem (Super Admin & Admin) akan tetap dipertahankan."
    />
  );
}
